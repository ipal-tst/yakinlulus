package practice

import (
	"context"
	"os"
	"testing"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
)

func testPool(t *testing.T) *pgxpool.Pool {
	t.Helper()
	url := os.Getenv("DB_URL")
	if url == "" {
		t.Skip("DB_URL not set; skipping practice repository integration test")
	}
	p, err := pgxpool.New(context.Background(), url)
	if err != nil {
		t.Fatalf("connect: %v", err)
	}
	t.Cleanup(p.Close)
	return p
}

func seedUser(t *testing.T, p *pgxpool.Pool, ctx context.Context, prefix string) uuid.UUID {
	t.Helper()
	u := uuid.New()
	if _, err := p.Exec(ctx, `
		INSERT INTO identity.user (id, username, password_hash, status, email_verified, phone_verified, created_at, updated_at)
		VALUES ($1, $2, 'x', 'ACTIVE', false, false, NOW(), NOW())
		ON CONFLICT (id) DO NOTHING`, u, prefix+"_"+u.String()[:8]); err != nil {
		t.Fatalf("seed user: %v", err)
	}
	t.Cleanup(func() {
		_, _ = p.Exec(ctx, `DELETE FROM identity.user WHERE id = $1`, u)
	})
	return u
}

func seedSubject(t *testing.T, p *pgxpool.Pool, ctx context.Context) uuid.UUID {
	t.Helper()
	s := uuid.New()
	if _, err := p.Exec(ctx, `INSERT INTO academic.subject (id, code, name) VALUES ($1, $2, $3)`, s, "subj_"+s.String()[:8], "Matematika"); err != nil {
		t.Fatalf("seed subject: %v", err)
	}
	t.Cleanup(func() {
		_, _ = p.Exec(ctx, `DELETE FROM academic.subject WHERE id = $1`, s)
	})
	return s
}

// seedPublishedQuestion inserts a PUBLISHED question.question (current version),
// PARAGRAPH content block, and options A..D with A correct, linked to subject.
// Returns the question id.
func seedPublishedQuestion(t *testing.T, p *pgxpool.Pool, ctx context.Context, subjectID uuid.UUID) uuid.UUID {
	t.Helper()
	q := uuid.New()
	var pubID uuid.UUID
	if err := p.QueryRow(ctx, `
		INSERT INTO question.question_status (code, name) VALUES ('PUBLISHED', 'Published')
		ON CONFLICT (code) DO NOTHING RETURNING id`).Scan(&pubID); err != nil {
		p.QueryRow(ctx, `SELECT id FROM question.question_status WHERE code = 'PUBLISHED'`).Scan(&pubID)
	}
	if _, err := p.Exec(ctx, `
		INSERT INTO question.question (id, question_code, question_type, status_id)
		VALUES ($1, $2, 'SINGLE_CHOICE', $3)`, q, "q_pr_"+q.String()[:8], pubID); err != nil {
		t.Fatalf("seed question: %v", err)
	}
	var vID uuid.UUID
	if err := p.QueryRow(ctx, `
		INSERT INTO question.question_version (question_id, version_no, is_current)
		VALUES ($1, 1, true) RETURNING id`, q).Scan(&vID); err != nil {
		t.Fatalf("seed question version: %v", err)
	}
	if _, err := p.Exec(ctx, `UPDATE question.question SET current_version_id = $1 WHERE id = $2`, vID, q); err != nil {
		t.Fatalf("set current version: %v", err)
	}
	if _, err := p.Exec(ctx, `
		INSERT INTO question.question_block (question_version_id, block_order, block_type, content)
		VALUES ($1, 0, 'PARAGRAPH', $2)`, vID, "Pertanyaan latihan"); err != nil {
		t.Fatalf("seed question block: %v", err)
	}
	if _, err := p.Exec(ctx, `INSERT INTO question.question_subject (question_id, subject_id) VALUES ($1, $2)`, q, subjectID); err != nil {
		t.Fatalf("seed question_subject: %v", err)
	}
	for i, l := range []string{"A", "B", "C", "D"} {
		score := 0.0
		if l == "A" {
			score = 1.0
		}
		optID := uuid.New()
		if _, err := p.Exec(ctx, `
			INSERT INTO question.question_option (id, question_version_id, label, score, is_correct, display_order)
			VALUES ($1, $2, $3, $4, $5, $6)`, optID, vID, l, score, l == "A", i); err != nil {
			t.Fatalf("seed option: %v", err)
		}
		if _, err := p.Exec(ctx, `
			INSERT INTO question.option_block (option_id, block_order, block_type, content)
			VALUES ($1, 0, 'PARAGRAPH', $2)`, optID, "Opsi "+l); err != nil {
			t.Fatalf("seed option block: %v", err)
		}
	}
	t.Cleanup(func() {
		_, _ = p.Exec(ctx, `DELETE FROM question.question WHERE id = $1`, q)
	})
	return q
}

func TestPracticeSessionLifecycle(t *testing.T) {
	p := testPool(t)
	repo := NewRepository(p)
	svc := NewService(repo, nil)
	ctx := context.Background()

	var student, other, subjectID uuid.UUID
	t.Cleanup(func() { assertPracticeResidueZero(t, p, student, other, subjectID) })

	student = seedUser(t, p, ctx, "pr_student")
	other = seedUser(t, p, ctx, "pr_other")
	subjectID = seedSubject(t, p, ctx)
	seedPublishedQuestion(t, p, ctx, subjectID)

	// --- StartSession -> content.practice_session row ---
	resp, err := svc.StartSession(ctx, student, &subjectID, nil, 1)
	if err != nil {
		t.Fatalf("StartSession: %v", err)
	}
	if resp.SessionID == uuid.Nil {
		t.Fatal("StartSession returned nil session id")
	}
	if len(resp.Questions) != 1 {
		t.Fatalf("questions = %d, want 1", len(resp.Questions))
	}
	q := resp.Questions[0]
	if q.Content == "" {
		t.Error("question content empty")
	}
	if len(q.Options) != 4 {
		t.Errorf("options = %d, want 4", len(q.Options))
	}
	var correctOpt uuid.UUID
	for _, o := range q.Options {
		if o.Key == "A" {
			correctOpt = o.ID
		}
	}
	if correctOpt == uuid.Nil {
		t.Fatal("correct option (label A) not found")
	}
	sessionID := resp.SessionID

	var rowStatus string
	var rowMax, rowScore float64
	var rowAnswered, rowCorrect, rowAns int
	if err := p.QueryRow(ctx, `
		SELECT status, max_score, total_score, answered_count, correct_count
		FROM content.practice_session WHERE id = $1`, sessionID).Scan(
		&rowStatus, &rowMax, &rowScore, &rowAnswered, &rowCorrect); err != nil {
		t.Fatalf("read practice_session: %v", err)
	}
	if rowStatus != "IN_PROGRESS" || rowMax != 1 || rowScore != 0 || rowAnswered != 0 || rowCorrect != 0 {
		t.Errorf("initial session = status %q max %.0f score %.0f ans %d corr %d, want IN_PROGRESS/1/0/0/0", rowStatus, rowMax, rowScore, rowAnswered, rowCorrect)
	}

	// --- Answer correct -> counters bump ---
	ar, err := svc.AnswerQuestion(ctx, sessionID, student, q.QuestionID, correctOpt)
	if err != nil {
		t.Fatalf("AnswerQuestion correct: %v", err)
	}
	if !ar.IsCorrect || ar.CorrectOptionID != correctOpt.String() {
		t.Errorf("correct answer = is_correct=%v correct_id=%q, want true/%q", ar.IsCorrect, ar.CorrectOptionID, correctOpt.String())
	}
	if err := p.QueryRow(ctx, `
		SELECT total_score, answered_count, correct_count FROM content.practice_session WHERE id = $1`, sessionID).Scan(
		&rowScore, &rowAns, &rowCorrect); err != nil {
		t.Fatalf("read counters: %v", err)
	}
	if rowScore != 1 || rowAns != 1 || rowCorrect != 1 {
		t.Errorf("after correct = score %.1f ans %d corr %d, want 1/1/1", rowScore, rowAns, rowCorrect)
	}

	// --- Answer wrong -> correct_count unchanged, answered bump ---
	var wrongOpt uuid.UUID
	for _, o := range q.Options {
		if o.Key == "B" {
			wrongOpt = o.ID
		}
	}
	if _, err := svc.AnswerQuestion(ctx, sessionID, student, q.QuestionID, wrongOpt); err != nil {
		t.Fatalf("AnswerQuestion wrong: %v", err)
	}
	if err := p.QueryRow(ctx, `
		SELECT total_score, answered_count, correct_count FROM content.practice_session WHERE id = $1`, sessionID).Scan(&rowScore, &rowAns, &rowCorrect); err != nil {
		t.Fatalf("read counters2: %v", err)
	}
	if rowScore != 1 || rowAns != 2 || rowCorrect != 1 {
		t.Errorf("after wrong = score %.1f/%d heart %d, want 1/2/1", rowScore, rowAns, rowCorrect)
	}

	// --- getSession round-trip ---
	sd, err := svc.GetSession(ctx, sessionID, student)
	if err != nil {
		t.Fatalf("GetSession: %v", err)
	}
	if sd.ID != sessionID || sd.Status != "IN_PROGRESS" || sd.TotalQuestions != 1 ||
		sd.AnsweredCount != 2 || sd.CorrectCount != 1 {
		t.Errorf("GetSession = %+v, want id=%v status=IN_PROGRESS total=1 ans=2 corr=1", sd, sessionID)
	}

	// --- Ownership deny: other user cannot answer or view ---
	if _, err := svc.AnswerQuestion(ctx, sessionID, other, q.QuestionID, correctOpt); err == nil {
		t.Error("AnswerQuestion by other user succeeded, want forbidden")
	}
	if _, err := svc.GetSession(ctx, sessionID, other); err == nil {
		t.Error("GetSession by other user succeeded, want forbidden")
	}

	// --- listSessions ---
	items, total, err := repo.listSessions(ctx, student, 10, 0)
	if err != nil {
		t.Fatalf("listSessions: %v", err)
	}
	if total != 1 || len(items) != 1 {
		t.Errorf("listSessions total=%d items=%d, want 1/1", total, len(items))
	}
	if items[0].AnsweredCount != 2 || items[0].CorrectCount != 1 {
		t.Errorf("listSessions counters = ans %d corr %d, want 2/1", items[0].AnsweredCount, items[0].CorrectCount)
	}

	// --- getStats (sessions GRADED/SUBMITTED only) ---
	if _, err := p.Exec(ctx, `UPDATE content.practice_session SET status = 'GRADED' WHERE id = $1`, sessionID); err != nil {
		t.Fatalf("mark GRADED: %v", err)
	}
	stats, err := repo.getStats(ctx, student)
	if err != nil {
		t.Fatalf("getStats: %v", err)
	}
	if stats.TotalSessions != 1 || stats.TotalQuestions != 1 || stats.TotalCorrect != 1 {
		t.Errorf("stats = sessions=%d q=%d corr=%d, want 1/1/1", stats.TotalSessions, stats.TotalQuestions, stats.TotalCorrect)
	}

	// --- getStats excludes IN_PROGRESS for others ---
	if _, err := p.Exec(ctx, `INSERT INTO content.practice_session (student_id, status) VALUES ($1, 'IN_PROGRESS')`, student); err != nil {
		t.Fatalf("insert in-progress: %v", err)
	}
	stats2, err := svc.GetStats(ctx, student)
	if err != nil {
		t.Fatalf("GetStats2: %v", err)
	}
	if stats2.TotalSessions != 1 {
		t.Errorf("stats2 sessions = %d, want 1 (IN_PROGRESS excluded)", stats2.TotalSessions)
	}
}

func assertPracticeResidueZero(t *testing.T, p *pgxpool.Pool, student, other, subjectID uuid.UUID) {
	t.Helper()
	ctx := context.Background()
	checks := map[string]string{
		"question.question":       `SELECT count(*) FROM question.question WHERE question_code LIKE 'q_pr_%'`,
		"content.practice_session": `SELECT count(*) FROM content.practice_session WHERE student_id = ANY($1::uuid[])`,
		"identity.user":            `SELECT count(*) FROM identity.user WHERE id = ANY($1::uuid[])`,
		"academic.subject":         `SELECT count(*) FROM academic.subject WHERE id = $2`,
	}
	for name, q := range checks {
		var n int
		var err error
		if name == "academic.subject" {
			err = p.QueryRow(ctx, q, uuid.Nil, subjectID).Scan(&n)
		} else {
			err = p.QueryRow(ctx, q, []uuid.UUID{student, other}).Scan(&n)
		}
		if err == nil && n != 0 {
			t.Errorf("residue: %s has %d rows, want 0", name, n)
		}
	}
}