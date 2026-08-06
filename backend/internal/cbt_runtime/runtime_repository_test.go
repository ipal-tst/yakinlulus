package cbt_runtime

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
		t.Skip("DB_URL not set; skipping cbt_runtime repository integration test")
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

// seedPublishedQuestion inserts a PUBLISHED question.question (current version
// + options A..D with A correct, EASY difficulty, subject link).
func seedPublishedQuestion(t *testing.T, p *pgxpool.Pool, ctx context.Context, subjectID uuid.UUID, qcode string) uuid.UUID {
	t.Helper()
	q := uuid.New()
	var pubID uuid.UUID
	if err := p.QueryRow(ctx, `
		INSERT INTO question.question_status (code, name) VALUES ('PUBLISHED', 'Published')
		ON CONFLICT (code) DO NOTHING RETURNING id`).Scan(&pubID); err != nil {
		p.QueryRow(ctx, `SELECT id FROM question.question_status WHERE code = 'PUBLISHED'`).Scan(&pubID)
	}
	if _, err := p.Exec(ctx, `
		INSERT INTO question.question (id, question_code, question_type, status_id, owner_id, created_by)
		VALUES ($1, $2, 'SINGLE_CHOICE', $3, NULL, NULL)`, q, qcode+"_"+q.String()[:8], pubID); err != nil {
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
	if _, err := p.Exec(ctx, `INSERT INTO question.question_metadata (question_id, difficulty_level) VALUES ($1, 'EASY')`, q); err != nil {
		t.Fatalf("seed question metadata: %v", err)
	}
	if subjectID != uuid.Nil {
		if _, err := p.Exec(ctx, `INSERT INTO question.question_subject (question_id, subject_id) VALUES ($1, $2)`, q, subjectID); err != nil {
			t.Fatalf("seed question_subject: %v", err)
		}
	}
	for i, l := range []string{"A", "B", "C", "D"} {
		score := 0.0
		if l == "A" {
			score = 1.0
		}
		if _, err := p.Exec(ctx, `
			INSERT INTO question.question_option (id, question_version_id, label, score, is_correct, display_order)
			VALUES (gen_random_uuid(), $1, $2, $3, $4, $5)`, vID, l, score, l == "A", i); err != nil {
			t.Fatalf("seed question option: %v", err)
		}
	}
	t.Cleanup(func() {
		_, _ = p.Exec(ctx, `DELETE FROM question.question WHERE id = $1`, q)
	})
	return q
}

// seedExam creates a PUBLISHED cbt.exam (+ metadata, randomization, pool row)
// via the content package, reusing its CreateContent(EXAM)+CreateExam path.
func seedExam(t *testing.T, p *pgxpool.Pool, ctx context.Context, owner, subjectID uuid.UUID) uuid.UUID {
	t.Helper()
	repo := content.NewRepository(p)
	base := &content.Content{
		ContentType: content.ContentTypeExam,
		SubjectID:   subjectID,
		Title:       "Runtime CBT",
		Body:        "desc",
		Status:      content.StatusPublished,
		CreatedBy:   owner,
	}
	if err := repo.CreateContent(ctx, base); err != nil {
		t.Fatalf("CreateContent(EXAM): %v", err)
	}
	if err := repo.CreateExam(ctx, &content.Exam{
		ContentID:        base.ID,
		DurationMinutes:  60,
		PassingScore:     50,
		ShuffleQuestions: true,
		ShuffleOptions:   true,
	}); err != nil {
		t.Fatalf("CreateExam: %v", err)
	}
	if _, err := p.Exec(ctx, `
		INSERT INTO cbt.exam_question_pool (exam_id, subject_id, difficulty, total_question)
		VALUES ($1, $2, 'EASY', 1)`, base.ID, subjectID); err != nil {
		t.Fatalf("seed exam_question_pool: %v", err)
	}
	t.Cleanup(func() {
		_, _ = p.Exec(ctx, `DELETE FROM cbt.exam WHERE id = $1`, base.ID)
	})
	return base.ID
}

func ptr[T any](v T) *T { return &v }

func TestCBTRuntimeMigrationLifecycle(t *testing.T) {
	p := testPool(t)
	repo := NewRepository(p)
	svc := NewService(repo)
	ctx := context.Background()

	var examID, owner, student, subjectID uuid.UUID

	t.Cleanup(func() { assertRuntimeResidueZero(t, p, examID, owner, student, subjectID) })

	owner = seedUser(t, p, ctx, "rt_owner")
	student = seedUser(t, p, ctx, "rt_student")
	subjectID = seedSubject(t, p, ctx)
	examID = seedExam(t, p, ctx, owner, subjectID)
	seedPublishedQuestion(t, p, ctx, subjectID, "q_rt")

	// --- Start -> participant + attempt + attempt_question(s) + attempt_option(s) + timer ---
	sess, err := svc.Start(ctx, examID, student)
	if err != nil {
		t.Fatalf("Start: %v", err)
	}
	if sess.ID == uuid.Nil {
		t.Fatal("Start did not set session ID")
	}
	sessionID := sess.ID
	if sess.ExamID != examID || sess.UserID != student || sess.Status != "ACTIVE" {
		t.Errorf("session mapping = exam=%v user=%v status=%v, want %v/%v/ACTIVE", sess.ExamID, sess.UserID, sess.Status, examID, student)
	}

	var pCount int
	if err := p.QueryRow(ctx, `SELECT count(*) FROM cbt.exam_participant WHERE exam_id = $1 AND student_id = $2`, examID, student).Scan(&pCount); err != nil {
		t.Fatalf("count participant: %v", err)
	}
	if pCount != 1 {
		t.Errorf("cbt.exam_participant rows = %d, want 1", pCount)
	}
	var aStatus string
	if err := p.QueryRow(ctx, `SELECT status FROM cbt.exam_attempt WHERE id = $1`, sessionID).Scan(&aStatus); err != nil {
		t.Fatalf("read attempt status: %v", err)
	}
	if aStatus != "STARTED" {
		t.Errorf("exam_attempt.status = %q, want STARTED", aStatus)
	}
	var aqCount, optCount, timerCount int
	if err := p.QueryRow(ctx, `SELECT count(*) FROM cbt.attempt_question WHERE attempt_id = $1`, sessionID).Scan(&aqCount); err != nil {
		t.Fatalf("count attempt_question: %v", err)
	}
	if aqCount < 1 {
		t.Errorf("cbt.attempt_question rows = %d, want >= 1", aqCount)
	}
	if err := p.QueryRow(ctx, `SELECT count(*) FROM cbt.attempt_option WHERE attempt_question_id IN (SELECT id FROM cbt.attempt_question WHERE attempt_id = $1)`, sessionID).Scan(&optCount); err != nil {
		t.Fatalf("count attempt_option: %v", err)
	}
	if optCount < 1 {
		t.Errorf("cbt.attempt_option rows = %d, want >= 1", optCount)
	}
	if err := p.QueryRow(ctx, `SELECT count(*) FROM cbt.exam_timer WHERE attempt_id = $1`, sessionID).Scan(&timerCount); err != nil {
		t.Fatalf("count exam_timer: %v", err)
	}
	if timerCount != 1 {
		t.Errorf("cbt.exam_timer rows = %d, want 1", timerCount)
	}

	// --- FindSession round-trip ---
	got, err := repo.FindSession(ctx, sessionID)
	if err != nil {
		t.Fatalf("FindSession: %v", err)
	}
	if got.ID != sessionID || got.ExamID != examID || got.UserID != student {
		t.Errorf("FindSession mapping = %+v, want id=%v exam=%v user=%v", got, sessionID, examID, student)
	}
	if got.Status != "ACTIVE" {
		t.Errorf("FindSession status = %q, want ACTIVE", got.Status)
	}

	// --- answer sync -> student_answer ---
	sq, err := svc.GetSessionQuestions(ctx, sessionID, student)
	if err != nil {
		t.Fatalf("GetSessionQuestions: %v", err)
	}
	if len(sq) != 1 {
		t.Fatalf("session questions = %d, want 1", len(sq))
	}
	aqID := sq[0].ExamQuestionID
	var correctOpt uuid.UUID
	for _, o := range sq[0].Options {
		if o.Label == "A" {
			correctOpt = o.ID
		}
	}
	if correctOpt == uuid.Nil {
		t.Fatal("session question options missing label A")
	}

	if err := svc.SyncAnswers(ctx, sessionID, student, []SyncAnswerReq{
		{ExamQuestionID: aqID.String(), SelectedOptionID: ptr(correctOpt.String())},
	}); err != nil {
		t.Fatalf("SyncAnswers: %v", err)
	}
	var saCount int
	if err := p.QueryRow(ctx, `SELECT count(*) FROM cbt.student_answer WHERE attempt_question_id = $1`, aqID).Scan(&saCount); err != nil {
		t.Fatalf("count student_answer: %v", err)
	}
	if saCount != 1 {
		t.Errorf("cbt.student_answer rows = %d, want 1", saCount)
	}

	// --- Finish -> grading_result + grading_detail ---
	result, err := svc.Finish(ctx, sessionID, student)
	if err != nil {
		t.Fatalf("Finish: %v", err)
	}
	if result.CorrectCount != 1 || result.WrongCount != 0 {
		t.Errorf("Finish counts = %d correct/%d wrong, want 1/0", result.CorrectCount, result.WrongCount)
	}
	if result.TotalQuestions != 1 {
		t.Errorf("Finish total = %d, want 1", result.TotalQuestions)
	}
	if !result.IsPassed {
		t.Errorf("Finish is_passed = false, want true (score 100 >= passing 50)")
	}
	var gScore float64
	var gCorrect int
	var gPassed bool
	if err := p.QueryRow(ctx, `SELECT score, correct, passed FROM cbt.grading_result WHERE attempt_id = $1`, sessionID).Scan(&gScore, &gCorrect, &gPassed); err != nil {
		t.Fatalf("read grading_result: %v", err)
	}
	if gScore != 100 || gCorrect != 1 || !gPassed {
		t.Errorf("grading_result = score %.1f correct %d passed %v, want 100/1/true", gScore, gCorrect, gPassed)
	}
	var gdCount int
	if err := p.QueryRow(ctx, `SELECT count(*) FROM cbt.grading_detail WHERE attempt_question_id = $1`, aqID).Scan(&gdCount); err != nil {
		t.Fatalf("count grading_detail: %v", err)
	}
	if gdCount != 1 {
		t.Errorf("cbt.grading_detail rows = %d, want 1", gdCount)
	}

	// --- GetReview builds from question.question ---
	review, err := svc.GetSessionReview(ctx, sessionID, student)
	if err != nil {
		t.Fatalf("GetSessionReview: %v", err)
	}
	if review.ExamID != examID || review.UserID != student {
		t.Errorf("review mapping exam=%v user=%v, want %v/%v", review.ExamID, review.UserID, examID, student)
	}
	if len(review.Questions) != 1 {
		t.Fatalf("review questions = %d, want 1", len(review.Questions))
	}
	if review.Questions[0].QuestionType != "SINGLE_CHOICE" {
		t.Errorf("review question type = %q, want SINGLE_CHOICE", review.Questions[0].QuestionType)
	}

	// --- SaveViolation -> cheating_log ---
	if _, err := svc.ReportViolation(ctx, sessionID, student, "TAB_SWITCH", "switched tab"); err != nil {
		t.Fatalf("ReportViolation: %v", err)
	}
	var clCount int
	if err := p.QueryRow(ctx, `SELECT count(*) FROM cbt.cheating_log WHERE attempt_id = $1`, sessionID).Scan(&clCount); err != nil {
		t.Fatalf("count cheating_log: %v", err)
	}
	if clCount != 1 {
		t.Errorf("cbt.cheating_log rows = %d, want 1", clCount)
	}

	// --- Pause / Resume on a fresh active attempt ---
	sess2 := &ExamSession{ExamID: examID, UserID: student}
	if err := repo.CreateSession(ctx, sess2, 60); err != nil {
		t.Fatalf("CreateSession (2nd): %v", err)
	}
	secondID := sess2.ID
	if err := svc.Pause(ctx, secondID, student, 42); err != nil {
		t.Fatalf("Pause: %v", err)
	}
	var paused string
	if err := p.QueryRow(ctx, `SELECT status FROM cbt.exam_attempt WHERE id = $1`, secondID).Scan(&paused); err != nil {
		t.Fatalf("read paused status: %v", err)
	}
	if paused != "PAUSED" {
		t.Errorf("attempt status after Pause = %q, want PAUSED", paused)
	}
	var rem int
	if err := p.QueryRow(ctx, `SELECT remaining_second FROM cbt.exam_timer WHERE attempt_id = $1`, secondID).Scan(&rem); err != nil {
		t.Fatalf("read timer: %v", err)
	}
	if rem != 42 {
		t.Errorf("exam_timer.remaining_second = %d, want 42", rem)
	}
	if err := svc.Resume(ctx, secondID, student); err != nil {
		t.Fatalf("Resume: %v", err)
	}
	var resumed string
	if err := p.QueryRow(ctx, `SELECT status FROM cbt.exam_attempt WHERE id = $1`, secondID).Scan(&resumed); err != nil {
		t.Fatalf("read resumed status: %v", err)
	}
	if resumed != "STARTED" {
		t.Errorf("attempt status after Resume = %q, want STARTED", resumed)
	}

	// --- ListUserSessions ---
	sessions, err := svc.ListUserSessions(ctx, student)
	if err != nil {
		t.Fatalf("ListUserSessions: %v", err)
	}
	if len(sessions) < 2 {
		t.Errorf("ListUserSessions = %d, want >= 2", len(sessions))
	}

	// --- FindExpiredActiveSessions ---
	// Backdate the second attempt's started_at so it counts as expired
	// (started_at + 60min duration < NOW()).
	if _, err := p.Exec(ctx, `
		UPDATE cbt.exam_attempt a SET started_at = NOW() - interval '2 hours'
		FROM cbt.exam_participant pa
		WHERE a.id = $1 AND pa.id = a.participant_id`, secondID); err != nil {
		t.Fatalf("backdate attempt: %v", err)
	}
	expired, err := repo.FindExpiredActiveSessions(ctx)
	if err != nil {
		t.Fatalf("FindExpiredActiveSessions: %v", err)
	}
	found := false
	for _, e := range expired {
		if e.ID == secondID {
			found = true
		}
	}
	if !found {
		t.Error("FindExpiredActiveSessions did not return the expired STARTED attempt")
	}

	// --- zero residue: delete the second attempt (participant cascade keeps
	// participant rows) then rely on t.Cleanup for exam/users/questions. ---
	_, _ = p.Exec(ctx, `DELETE FROM cbt.exam_attempt WHERE id = $1`, secondID)
}

func assertRuntimeResidueZero(t *testing.T, p *pgxpool.Pool, examID, owner, student, subjectID uuid.UUID) {
	t.Helper()
	ctx := context.Background()
	checks := map[string]string{
		"cbt.exam_participant":   `SELECT count(*) FROM cbt.exam_participant WHERE exam_id = $1`,
		"cbt.exam_attempt":       `SELECT count(*) FROM cbt.exam_attempt WHERE participant_id IN (SELECT id FROM cbt.exam_participant WHERE exam_id = $1)`,
		"cbt.attempt_question":   `SELECT count(*) FROM cbt.attempt_question WHERE attempt_id IN (SELECT a.id FROM cbt.exam_attempt a JOIN cbt.exam_participant p ON p.id = a.participant_id WHERE p.exam_id = $1)`,
		"cbt.attempt_option":     `SELECT count(*) FROM cbt.attempt_option WHERE attempt_question_id IN (SELECT aq.id FROM cbt.attempt_question aq JOIN cbt.exam_attempt a ON a.id = aq.attempt_id JOIN cbt.exam_participant p ON p.id = a.participant_id WHERE p.exam_id = $1)`,
		"cbt.student_answer":     `SELECT count(*) FROM cbt.student_answer WHERE attempt_question_id IN (SELECT aq.id FROM cbt.attempt_question aq JOIN cbt.exam_attempt a ON a.id = aq.attempt_id JOIN cbt.exam_participant p ON p.id = a.participant_id WHERE p.exam_id = $1)`,
		"cbt.grading_result":     `SELECT count(*) FROM cbt.grading_result WHERE attempt_id IN (SELECT a.id FROM cbt.exam_attempt a JOIN cbt.exam_participant p ON p.id = a.participant_id WHERE p.exam_id = $1)`,
		"cbt.grading_detail":     `SELECT count(*) FROM cbt.grading_detail WHERE attempt_question_id IN (SELECT aq.id FROM cbt.attempt_question aq JOIN cbt.exam_attempt a ON a.id = aq.attempt_id JOIN cbt.exam_participant p ON p.id = a.participant_id WHERE p.exam_id = $1)`,
		"cbt.exam_timer":         `SELECT count(*) FROM cbt.exam_timer WHERE attempt_id IN (SELECT a.id FROM cbt.exam_attempt a JOIN cbt.exam_participant p ON p.id = a.participant_id WHERE p.exam_id = $1)`,
		"cbt.cheating_log":       `SELECT count(*) FROM cbt.cheating_log WHERE attempt_id IN (SELECT a.id FROM cbt.exam_attempt a JOIN cbt.exam_participant p ON p.id = a.participant_id WHERE p.exam_id = $1)`,
		"cbt.bookmark_question":  `SELECT count(*) FROM cbt.bookmark_question WHERE attempt_question_id IN (SELECT aq.id FROM cbt.attempt_question aq JOIN cbt.exam_attempt a ON a.id = aq.attempt_id JOIN cbt.exam_participant p ON p.id = a.participant_id WHERE p.exam_id = $1)`,
		"cbt.exam_question_pool": `SELECT count(*) FROM cbt.exam_question_pool WHERE exam_id = $1`,
		"cbt.exam":               `SELECT count(*) FROM cbt.exam WHERE id = $1`,
		"question.question":      `SELECT count(*) FROM question.question WHERE question_code LIKE 'q_rt_%'`,
		"identity.user":          `SELECT count(*) FROM identity.user WHERE id IN ($1, $2)`,
		"academic.subject":       `SELECT count(*) FROM academic.subject WHERE id = $3`,
	}
	for name, q := range checks {
		var n int
		var err error
		switch name {
		case "identity.user":
			err = p.QueryRow(ctx, q, owner, student).Scan(&n)
		case "academic.subject":
			err = p.QueryRow(ctx, q, uuid.Nil, uuid.Nil, subjectID).Scan(&n)
		default:
			err = p.QueryRow(ctx, q, examID).Scan(&n)
		}
		if err == nil && n != 0 {
			t.Errorf("residue: %s has %d rows, want 0", name, n)
		}
	}
}
