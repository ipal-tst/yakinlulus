package scoring

import (
	"context"
	"os"
	"testing"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"

	"yakinlulus.id/backend/internal/content"
)

func testPool(t *testing.T) *pgxpool.Pool {
	t.Helper()
	url := os.Getenv("DB_URL")
	if url == "" {
		t.Skip("DB_URL not set; skipping scoring integration test")
	}
	p, err := pgxpool.New(context.Background(), url)
	if err != nil {
		t.Fatalf("connect: %v", err)
	}
	t.Cleanup(p.Close)
	return p
}

func seedUserS(t *testing.T, p *pgxpool.Pool, ctx context.Context, prefix string) uuid.UUID {
	t.Helper()
	u := uuid.New()
	if _, err := p.Exec(ctx, `
		INSERT INTO identity.user (id, username, password_hash, status, email_verified, phone_verified, created_at, updated_at)
		VALUES ($1,$2,'x','ACTIVE',false,false,NOW(),NOW())
		ON CONFLICT (id) DO NOTHING`, u, prefix+"_"+u.String()[:8]); err != nil {
		t.Fatalf("seed user: %v", err)
	}
	t.Cleanup(func() { _, _ = p.Exec(ctx, `DELETE FROM identity.user WHERE id = $1`, u) })
	return u
}

func seedSubjectS(t *testing.T, p *pgxpool.Pool, ctx context.Context, code string) uuid.UUID {
	t.Helper()
	id := uuid.New()
	if _, err := p.Exec(ctx, `
		INSERT INTO academic.subject (id, code, name, created_at, updated_at)
		VALUES ($1, $2, $2, NOW(), NOW())
		ON CONFLICT (code) DO NOTHING`, id, code); err != nil {
		t.Fatalf("seed subject: %v", err)
	}
	t.Cleanup(func() { _, _ = p.Exec(ctx, `DELETE FROM academic.subject WHERE id = $1`, id) })
	return id
}

// seedQuestion creates a question.question with a PUBLISHED status, a current
// version, and links it to the subject via question.question_subject.
func seedQuestionS(t *testing.T, p *pgxpool.Pool, ctx context.Context, subjectID uuid.UUID) uuid.UUID {
	t.Helper()
	q := uuid.New()
	var pubID uuid.UUID
	if err := p.QueryRow(ctx, `
		INSERT INTO question.question_status (code, name) VALUES ('PUBLISHED','Published')
		ON CONFLICT (code) DO NOTHING RETURNING id`).Scan(&pubID); err != nil {
		p.QueryRow(ctx, `SELECT id FROM question.question_status WHERE code='PUBLISHED'`).Scan(&pubID)
	}
	if _, err := p.Exec(ctx, `
		INSERT INTO question.question (id, question_code, question_type, status_id)
		VALUES ($1,$2,'SINGLE_CHOICE',$3)`, q, "q_sc_"+q.String()[:8], pubID); err != nil {
		t.Fatalf("seed question: %v", err)
	}
	var vid uuid.UUID
	if err := p.QueryRow(ctx, `
		INSERT INTO question.question_version (question_id, version_no, is_current)
		VALUES ($1,1,true) RETURNING id`, q).Scan(&vid); err != nil {
		t.Fatalf("seed question version: %v", err)
	}
	if _, err := p.Exec(ctx, `UPDATE question.question SET current_version_id=$1 WHERE id=$2`, vid, q); err != nil {
		t.Fatalf("set current version: %v", err)
	}
	if _, err := p.Exec(ctx, `INSERT INTO question.question_subject (question_id, subject_id) VALUES ($1,$2)`, q, subjectID); err != nil {
		t.Fatalf("seed question_subject: %v", err)
	}
	t.Cleanup(func() {
		_, _ = p.Exec(ctx, `DELETE FROM question.question WHERE id = $1`, q)
	})
	return q
}

func TestScoringRepositoryLifecycle(t *testing.T) {
	p := testPool(t)
	r := NewRepository(p)
	ctx := context.Background()

	student := seedUserS(t, p, ctx, "sc_student")
	subject := seedSubjectS(t, p, ctx, "SC-PROBE")
	q1 := seedQuestionS(t, p, ctx, subject)
	q2 := seedQuestionS(t, p, ctx, subject)
	q3 := seedQuestionS(t, p, ctx, subject)
	_ = q3

	// Seed an exam + participant + attempt + grading_result via the content repo.
	contentRepo := content.NewRepository(p)
	base := &content.Content{
		ContentType: content.ContentTypeExam,
		GradeID:     uuid.Nil,
		SubjectID:   uuid.Nil,
		Title:       "scoring-probe-exam",
		Body:        "desc",
		Status:      content.StatusPublished,
		CreatedBy:   student,
		Metadata:    map[string]interface{}{},
	}
	if err := contentRepo.CreateContent(ctx, base); err != nil {
		t.Fatalf("CreateContent(exam): %v", err)
	}
	examID := base.ID
	t.Cleanup(func() {
		_, _ = p.Exec(ctx, `DELETE FROM cbt.exam WHERE id = $1`, examID)
	})
	if err := contentRepo.CreateExam(ctx, &content.Exam{ContentID: examID, DurationMinutes: 60, PassingScore: 60}); err != nil {
		t.Fatalf("CreateExam: %v", err)
	}

	// Participant + attempt.
	var pid uuid.UUID
	if err := p.QueryRow(ctx, `
		INSERT INTO cbt.exam_participant (exam_id, student_id, status)
		VALUES ($1,$2,'STARTED') RETURNING id`, examID, student).Scan(&pid); err != nil {
		t.Fatalf("participant: %v", err)
	}
	t.Cleanup(func() { _, _ = p.Exec(ctx, `DELETE FROM cbt.exam_participant WHERE id = $1`, pid) })

	var attemptID uuid.UUID
	if err := p.QueryRow(ctx, `
		INSERT INTO cbt.exam_attempt (id, participant_id, attempt_no, status, started_at)
		VALUES (gen_random_uuid(), $1, 1, 'COMPLETED', NOW() - interval '10 minutes') RETURNING id`, pid).Scan(&attemptID); err != nil {
		t.Fatalf("attempt: %v", err)
	}
	t.Cleanup(func() { _, _ = p.Exec(ctx, `DELETE FROM cbt.exam_attempt WHERE id = $1`, attemptID) })

	// Three attempt_questions (correct, wrong, blank) + grading_result.
	var aq1, aq2, aq3 uuid.UUID
	for i, qid := range []uuid.UUID{q1, q2, q3} {
		var aq uuid.UUID
		if err := p.QueryRow(ctx, `
			INSERT INTO cbt.attempt_question (id, attempt_id, question_id, display_order, snapshot_version)
			VALUES (gen_random_uuid(), $1, $2, $3, 1) RETURNING id`, attemptID, qid, i).Scan(&aq); err != nil {
			t.Fatalf("attempt_question: %v", err)
		}
		switch i {
		case 0:
			aq1 = aq
		case 1:
			aq2 = aq
		case 2:
			aq3 = aq
		}
		t.Cleanup(func() { _, _ = p.Exec(ctx, `DELETE FROM cbt.attempt_question WHERE id = $1`, aq) })
	}

	// 1 correct, 1 wrong, 1 blank grading_detail.
	gd := []struct {
		aq    uuid.UUID
		qid   uuid.UUID
		ok    bool
		blank bool
		score float64
	}{{aq1, q1, true, false, 1.0}, {aq2, q2, false, false, 0}, {aq3, q3, false, true, 0}}
	for _, d := range gd {
		if _, err := p.Exec(ctx, `
			INSERT INTO cbt.grading_detail (id, attempt_question_id, question_id, status_correct, score, is_blank)
			VALUES (gen_random_uuid(), $1, $2, $3, $4, $5)`, d.aq, d.qid, d.ok, d.score, d.blank); err != nil {
			t.Fatalf("grading_detail: %v", err)
		}
	}
	if _, err := p.Exec(ctx, `
		INSERT INTO cbt.grading_result (attempt_id, score, correct, wrong, blank, passed)
		VALUES ($1, 70, 1, 1, 1, true)`, attemptID); err != nil {
		t.Fatalf("grading_result: %v", err)
	}

	// GetResult
	res, err := r.GetResult(ctx, attemptID)
	if err != nil {
		t.Fatalf("GetResult: %v", err)
	}
	if res.SessionID != attemptID || res.ExamID != examID || res.UserID != student {
		t.Errorf("identity fields = session=%v exam=%v user=%v", res.SessionID, res.ExamID, res.UserID)
	}
	if res.TotalQuestions != 3 || res.AnsweredCount != 2 || res.CorrectCount != 1 || res.WrongCount != 1 || res.UnansweredCount != 1 {
		t.Errorf("counts = total=%d ans=%d corr=%d wrong=%d unans=%d, want 3/2/1/1/1", res.TotalQuestions, res.AnsweredCount, res.CorrectCount, res.WrongCount, res.UnansweredCount)
	}
	if res.Score != 70 || res.PassingGrade != 60 || !res.IsPassed {
		t.Errorf("score/passing/ispassed = %v/%v/%v", res.Score, res.PassingGrade, res.IsPassed)
	}
	if len(res.SubjectBreakdown) != 1 || res.SubjectBreakdown[0].CorrectCount != 1 {
		t.Errorf("subject breakdown = %+v, want 1 subject with correct=1", res.SubjectBreakdown)
	}

	// ListByUser
	results, total, err := r.ListByUser(ctx, student, 20, 0)
	if err != nil {
		t.Fatalf("ListByUser: %v", err)
	}
	if total != 1 || len(results) != 1 || results[0].ID != attemptID {
		t.Errorf("ListByUser total=%d len=%d, want 1/1 for attempt %v", total, len(results), attemptID)
	}
}