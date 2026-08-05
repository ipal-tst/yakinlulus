package content

import (
	"context"
	"testing"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
)

// seedPublishedQuestion inserts a PUBLISHED question.question row (current
// version, options with a single correct label, EASY difficulty metadata and
// an optional subject link) sufficient for the attempt/answer/grading flow.
func seedPublishedQuestion(t *testing.T, p *pgxpool.Pool, ctx context.Context, subjectID uuid.UUID, correctLabel string) (qid, correctID, wrongID uuid.UUID) {
	t.Helper()
	qid = uuid.New()

	var pubID uuid.UUID
	err := p.QueryRow(ctx, `
		INSERT INTO question.question_status (code, name) VALUES ('PUBLISHED', 'Published')
		ON CONFLICT (code) DO NOTHING RETURNING id`).Scan(&pubID)
	if err != nil {
		p.QueryRow(ctx, `SELECT id FROM question.question_status WHERE code = 'PUBLISHED'`).Scan(&pubID)
	}

	if _, err := p.Exec(ctx, `
		INSERT INTO question.question (id, question_code, question_type, status_id, owner_id, created_by)
		VALUES ($1, $2, 'SINGLE_CHOICE', $3, NULL, NULL)`, qid, "q_rt_"+qid.String()[:8], pubID); err != nil {
		t.Fatalf("seed published question: %v", err)
	}
	var versionID uuid.UUID
	if err := p.QueryRow(ctx, `
		INSERT INTO question.question_version (question_id, version_no, change_summary, created_by, is_current)
		VALUES ($1, 1, 'probe', NULL, true) RETURNING id`, qid).Scan(&versionID); err != nil {
		t.Fatalf("seed question version: %v", err)
	}
	if _, err := p.Exec(ctx, `UPDATE question.question SET current_version_id = $1 WHERE id = $2`, versionID, qid); err != nil {
		t.Fatalf("set current version: %v", err)
	}
	if _, err := p.Exec(ctx, `INSERT INTO question.question_metadata (question_id, difficulty_level) VALUES ($1, 'EASY')`, qid); err != nil {
		t.Fatalf("seed question metadata: %v", err)
	}
	if subjectID != uuid.Nil {
		if _, err := p.Exec(ctx, `INSERT INTO question.question_subject (question_id, subject_id) VALUES ($1, $2)`, qid, subjectID); err != nil {
			t.Fatalf("seed question_subject: %v", err)
		}
	}

	labels := []string{"A", "B", "C", "D"}
	optionIDs := map[string]uuid.UUID{}
	for i, l := range labels {
		oid := uuid.New()
		score := 0.0
		if l == correctLabel {
			score = 1.0
		}
		if _, err := p.Exec(ctx, `
			INSERT INTO question.question_option (id, question_version_id, label, score, is_correct, display_order)
			VALUES ($1, $2, $3, $4, $5, $6)`, oid, versionID, l, score, l == correctLabel, i); err != nil {
			t.Fatalf("seed question option: %v", err)
		}
		optionIDs[l] = oid
	}
	correctID = optionIDs[correctLabel]
	for l, oid := range optionIDs {
		if l != correctLabel {
			wrongID = oid
			break
		}
	}

	t.Cleanup(func() {
		_, _ = p.Exec(ctx, `DELETE FROM question.question WHERE id = $1`, qid)
	})
	return qid, correctID, wrongID
}

func seedExamForRuntime(t *testing.T, p *pgxpool.Pool, ctx context.Context, r Repository, owner, subject uuid.UUID) uuid.UUID {
	t.Helper()
	base := &Content{
		ContentType: ContentTypeExam,
		GradeID:     uuid.Nil,
		SubjectID:   subject,
		Title:       "Runtime Exam",
		Body:        "desc",
		Status:      StatusDraft,
		CreatedBy:   owner,
	}
	if err := r.CreateContent(ctx, base); err != nil {
		t.Fatalf("CreateContent(EXAM): %v", err)
	}
	if err := r.CreateExam(ctx, &Exam{ContentID: base.ID, DurationMinutes: 60, PassingScore: 50}); err != nil {
		t.Fatalf("CreateExam: %v", err)
	}
	t.Cleanup(func() {
		_, _ = p.Exec(ctx, `DELETE FROM cbt.exam WHERE id = $1`, base.ID)
	})
	return base.ID
}

func TestCBTRuntimeRepositoryLifecycle(t *testing.T) {
	p := testPool(t)
	r := NewRepository(p)
	ctx := context.Background()

	var owner, student, subject, q1, q2, attemptID, examID uuid.UUID

	// Registered FIRST -> runs LAST (LIFO), after every per-row cleanup, so the
	// residue assertion sees a fully cleaned DB.
	t.Cleanup(func() { assertRuntimeResidueZero(t, p, examID, owner, student, subject) })

	owner = seedUser(t, p, ctx, "runtime_owner")
	student = seedUser(t, p, ctx, "runtime_student")
	subject = seedSubject(t, p, ctx)
	q1, q1Correct, q1Wrong := seedPublishedQuestion(t, p, ctx, subject, "A")
	q2, q2Correct, _ := seedPublishedQuestion(t, p, ctx, subject, "B")
	_ = q1Wrong

	examID = seedExamForRuntime(t, p, ctx, r, owner, subject)

	// --- CreateExamAttempt -> cbt.exam_participant + cbt.exam_attempt ---
	now := time.Now()
	attempt := &ExamAttempt{
		ExamContentID: examID,
		UserID:        student,
		AttemptNumber: 1,
		Status:        AttemptInProgress,
		StartedAt:     now,
	}
	if err := r.CreateExamAttempt(ctx, attempt); err != nil {
		t.Fatalf("CreateExamAttempt: %v", err)
	}
	attemptID = attempt.ID
	if attemptID == uuid.Nil {
		t.Fatal("CreateExamAttempt did not set ID")
	}

	var partCount, attCount int
	if err := p.QueryRow(ctx, `SELECT count(*) FROM cbt.exam_participant WHERE exam_id = $1 AND student_id = $2`, examID, student).Scan(&partCount); err != nil {
		t.Fatalf("count participant: %v", err)
	}
	if partCount != 1 {
		t.Errorf("cbt.exam_participant rows = %d, want 1", partCount)
	}
	if err := p.QueryRow(ctx, `SELECT count(*) FROM cbt.exam_attempt WHERE id = $1`, attemptID).Scan(&attCount); err != nil {
		t.Fatalf("count attempt: %v", err)
	}
	if attCount != 1 {
		t.Errorf("cbt.exam_attempt rows = %d, want 1", attCount)
	}

	// GetExamAttempt round-trip.
	got, err := r.GetExamAttempt(ctx, attemptID)
	if err != nil {
		t.Fatalf("GetExamAttempt: %v", err)
	}
	if got.ExamContentID != examID || got.UserID != student {
		t.Errorf("attempt mapping = exam=%v user=%v, want exam=%v user=%v", got.ExamContentID, got.UserID, examID, student)
	}
	if got.AttemptNumber != 1 {
		t.Errorf("AttemptNumber = %d, want 1", got.AttemptNumber)
	}
	if got.Status != AttemptInProgress {
		t.Errorf("Status = %q, want %q", got.Status, AttemptInProgress)
	}

	// BatchCreateExamAnswers -> attempt_question + student_answer.
	answers := []ExamAnswer{
		{AttemptID: attemptID, QuestionContentID: q1, SelectedOptions: []uuid.UUID{q1Correct}},
		{AttemptID: attemptID, QuestionContentID: q2, SelectedOptions: []uuid.UUID{q2Correct}},
	}
	if err := r.BatchCreateExamAnswers(ctx, answers); err != nil {
		t.Fatalf("BatchCreateExamAnswers: %v", err)
	}
	var aqCount, saCount int
	if err := p.QueryRow(ctx, `SELECT count(*) FROM cbt.attempt_question WHERE attempt_id = $1`, attemptID).Scan(&aqCount); err != nil {
		t.Fatalf("count attempt_question: %v", err)
	}
	if aqCount != 2 {
		t.Errorf("cbt.attempt_question rows = %d, want 2", aqCount)
	}
	if err := p.QueryRow(ctx, `SELECT count(*) FROM cbt.student_answer WHERE attempt_question_id IN (SELECT id FROM cbt.attempt_question WHERE attempt_id = $1)`, attemptID).Scan(&saCount); err != nil {
		t.Fatalf("count student_answer: %v", err)
	}
	if saCount != 2 {
		t.Errorf("cbt.student_answer rows = %d, want 2", saCount)
	}

	// GetExamAnswers round-trips stored option labels back to option ids.
	ans, err := r.GetExamAnswers(ctx, attemptID)
	if err != nil {
		t.Fatalf("GetExamAnswers: %v", err)
	}
	if len(ans) != 2 {
		t.Fatalf("GetExamAnswers len = %d, want 2", len(ans))
	}
	foundQ1 := false
	for _, a := range ans {
		if a.QuestionContentID == q1 && len(a.SelectedOptions) == 1 && a.SelectedOptions[0] == q1Correct {
			foundQ1 = true
		}
	}
	if !foundQ1 {
		t.Errorf("GetExamAnswers did not round-trip q1's selected option, got %+v", ans)
	}

	// UpdateExamAnswer changes q1's selection to the wrong option.
	for _, a := range ans {
		if a.QuestionContentID == q1 {
			a.SelectedOptions = []uuid.UUID{q1Wrong}
			if err := r.UpdateExamAnswer(ctx, &a); err != nil {
				t.Fatalf("UpdateExamAnswer: %v", err)
			}
		}
	}

	// UpdateExamAttempt SUBMITTED transition.
	submittedAt := time.Now()
	spent := 60
	submitted := &ExamAttempt{
		ID:              attemptID,
		Status:          AttemptSubmitted,
		SubmittedAt:     &submittedAt,
		TimeSpentSeconds: &spent,
	}
	if err := r.UpdateExamAttempt(ctx, submitted); err != nil {
		t.Fatalf("UpdateExamAttempt (submitted): %v", err)
	}
	var subStatus string
	if err := p.QueryRow(ctx, `SELECT status FROM cbt.exam_attempt WHERE id = $1`, attemptID).Scan(&subStatus); err != nil {
		t.Fatalf("read attempt status: %v", err)
	}
	if subStatus != "SUBMITTED" {
		t.Errorf("exam_attempt.status = %q, want SUBMITTED", subStatus)
	}
	var finishedAt *time.Time
	if err := p.QueryRow(ctx, `SELECT finished_at FROM cbt.exam_attempt WHERE id = $1`, attemptID).Scan(&finishedAt); err != nil {
		t.Fatalf("read finished_at: %v", err)
	}
	if finishedAt == nil {
		t.Error("finished_at not set on submitted attempt")
	}

	// UpdateExamAttempt GRADED -> grading_result (q1 now wrong, q2 correct).
	total := 50.0
	graded := &ExamAttempt{ID: attemptID, Status: AttemptGraded, TotalScore: &total}
	if err := r.UpdateExamAttempt(ctx, graded); err != nil {
		t.Fatalf("UpdateExamAttempt (graded): %v", err)
	}
	var gradStatus string
	if err := p.QueryRow(ctx, `SELECT status FROM cbt.exam_attempt WHERE id = $1`, attemptID).Scan(&gradStatus); err != nil {
		t.Fatalf("read graded status: %v", err)
	}
	if gradStatus != "COMPLETED" {
		t.Errorf("exam_attempt.status = %q, want COMPLETED", gradStatus)
	}
	var gScore float64
	var gCorrect, gWrong int
	if err := p.QueryRow(ctx, `SELECT score, correct, wrong FROM cbt.grading_result WHERE attempt_id = $1`, attemptID).Scan(&gScore, &gCorrect, &gWrong); err != nil {
		t.Fatalf("read grading_result: %v", err)
	}
	if gScore != total {
		t.Errorf("grading_result.score = %v, want %v", gScore, total)
	}
	if gCorrect != 1 || gWrong != 1 {
		t.Errorf("grading_result correct/wrong = %d/%d, want 1/1 (q1 wrong after UpdateExamAnswer)", gCorrect, gWrong)
	}

	// GetExamAttempt after grading reflects GRADED + score.
	gradedBack, err := r.GetExamAttempt(ctx, attemptID)
	if err != nil {
		t.Fatalf("GetExamAttempt (graded): %v", err)
	}
	if gradedBack.Status != AttemptGraded {
		t.Errorf("mapped status = %q, want GRADED", gradedBack.Status)
	}
	if gradedBack.TotalScore == nil || *gradedBack.TotalScore != total {
		t.Errorf("TotalScore = %v, want %v", gradedBack.TotalScore, total)
	}
	if gradedBack.GradedAt == nil {
		t.Error("GradedAt not mapped from grading_result")
	}

	// GetUserExamAttempts returns the attempt (map via participant).
	attempts, err := r.GetUserExamAttempts(ctx, examID, student)
	if err != nil {
		t.Fatalf("GetUserExamAttempts: %v", err)
	}
	if len(attempts) != 1 || attempts[0].ID != attemptID {
		t.Errorf("GetUserExamAttempts = %+v, want [attempt %v]", attempts, attemptID)
	}

	// GetExamAnalytics after grading.
	ana, err := r.GetExamAnalytics(ctx, examID)
	if err != nil {
		t.Fatalf("GetExamAnalytics: %v", err)
	}
	if ana.TotalParticipants != 1 || ana.TotalStarted != 1 || ana.TotalFinished != 1 {
		t.Errorf("analytics = %+v, want participants=1 started=1 finished=1", ana)
	}
	if ana.AverageScore != total || ana.HighestScore != total || ana.LowestScore != total {
		t.Errorf("analytics scores = %+v, want avg/high/low = %v", ana, total)
	}

	// GetQuestionsForPool returns published questions for the pool subject.
	pool := &QuestionPool{
		SubjectID:       subject,
		TotalPoolSize:   10,
		EasyPct:         100,
		MediumPct:       0,
		HardPct:         0,
		ShuffleQuestions: false,
	}
	ids, err := r.GetQuestionsForPool(ctx, pool)
	if err != nil {
		t.Fatalf("GetQuestionsForPool: %v", err)
	}
	if len(ids) < 1 {
		t.Error("GetQuestionsForPool returned no published questions for subject")
	}

	// Practice set lifecycle -> content.practice_set.
	ps := &PracticeSet{
		ContentID:         uuid.New(),
		PracticeContentID: uuid.New(),
		QuestionsCount:    5,
		TimeLimitSeconds:  600,
	}
	if err := r.CreatePracticeSet(ctx, ps); err != nil {
		t.Fatalf("CreatePracticeSet: %v", err)
	}
	t.Cleanup(func() { _, _ = p.Exec(ctx, `DELETE FROM content.practice_set WHERE id = $1`, ps.ID) })
	gotPS, err := r.GetPracticeSet(ctx, ps.ContentID)
	if err != nil {
		t.Fatalf("GetPracticeSet: %v", err)
	}
	if gotPS.PracticeContentID != ps.PracticeContentID || gotPS.QuestionsCount != 5 || gotPS.TimeLimitSeconds != 600 {
		t.Errorf("GetPracticeSet = %+v, want practice=%v questions=5 limit=600", gotPS, ps.PracticeContentID)
	}
	byPractice, err := r.GetPracticeSetByPracticeContent(ctx, ps.PracticeContentID)
	if err != nil {
		t.Fatalf("GetPracticeSetByPracticeContent: %v", err)
	}
	if byPractice.ContentID != ps.ContentID {
		t.Errorf("GetPracticeSetByPracticeContent = %+v, want content=%v", byPractice, ps.ContentID)
	}
	if err := r.DeletePracticeSet(ctx, ps.ContentID); err != nil {
		t.Fatalf("DeletePracticeSet: %v", err)
	}
	if _, err := r.GetPracticeSet(ctx, ps.ContentID); err == nil {
		t.Error("GetPracticeSet after delete should error")
	}
}

// assertRuntimeResidueZero asserts every cbt/content/identity probe row is
// removed after cleanup.
func assertRuntimeResidueZero(t *testing.T, p *pgxpool.Pool, examID, owner, student, subject uuid.UUID) {
	t.Helper()
	ctx := context.Background()
	attemptIDs := `(SELECT id FROM cbt.exam_attempt WHERE participant_id IN (SELECT id FROM cbt.exam_participant WHERE exam_id = $1))`
	checks := map[string]string{
		"cbt.exam_participant": `SELECT count(*) FROM cbt.exam_participant WHERE exam_id = $1`,
		"cbt.exam_attempt":     `SELECT count(*) FROM cbt.exam_attempt WHERE id IN ` + attemptIDs,
		"cbt.attempt_question": `SELECT count(*) FROM cbt.attempt_question WHERE attempt_id IN ` + attemptIDs,
		"cbt.student_answer":   `SELECT count(*) FROM cbt.student_answer WHERE attempt_question_id IN (SELECT id FROM cbt.attempt_question WHERE attempt_id IN ` + attemptIDs + `)`,
		"cbt.grading_result":   `SELECT count(*) FROM cbt.grading_result WHERE attempt_id IN ` + attemptIDs,
		"cbt.exam":             `SELECT count(*) FROM cbt.exam WHERE id = $1`,
		"question.question":    `SELECT count(*) FROM question.question WHERE owner_id IS NULL AND question_code LIKE 'q_rt_%'`,
		"content.practice_set": `SELECT count(*) FROM content.practice_set WHERE practice_set_code LIKE 'ps_%'`,
		"identity.user":        `SELECT count(*) FROM identity.user WHERE id IN ($1, $2)`,
		"academic.subject":     `SELECT count(*) FROM academic.subject WHERE id = $1`,
	}
	for name, q := range checks {
		var n int
		var err error
		switch name {
		case "cbt.exam_participant", "cbt.exam_attempt", "cbt.attempt_question", "cbt.student_answer", "cbt.grading_result", "cbt.exam":
			err = p.QueryRow(ctx, q, examID).Scan(&n)
		case "question.question", "content.practice_set":
			err = p.QueryRow(ctx, q).Scan(&n)
		case "identity.user":
			err = p.QueryRow(ctx, q, owner, student).Scan(&n)
		case "academic.subject":
			err = p.QueryRow(ctx, q, subject).Scan(&n)
		}
		if err == nil && n != 0 {
			t.Errorf("residue: %s has %d rows, want 0", name, n)
		}
	}
}
