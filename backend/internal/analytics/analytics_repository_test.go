package analytics

import (
	"context"
	"os"
	"testing"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"

	contentpkg "yakinlulus.id/backend/internal/content"
)

// testPool returns a DB pool or skips the test when DB_URL is unset.
func testPool(t *testing.T) *pgxpool.Pool {
	t.Helper()
	url := os.Getenv("DB_URL")
	if url == "" {
		t.Skip("DB_URL not set; skipping analytics integration test")
	}
	p, err := pgxpool.New(context.Background(), url)
	if err != nil {
		t.Fatalf("connect: %v", err)
	}
	t.Cleanup(p.Close)
	return p
}

// seedUser inserts an ACTIVE identity.user probe row and cleans it up.
func seedUser(t *testing.T, p *pgxpool.Pool, ctx context.Context, prefix string) uuid.UUID {
	t.Helper()
	u := uuid.New()
	if _, err := p.Exec(ctx, `
		INSERT INTO identity.user (id, username, password_hash, status, email_verified, phone_verified, created_at, updated_at)
		VALUES ($1, $2, 'x', 'ACTIVE', false, false, NOW(), NOW())`, u, prefix+"_"+u.String()[:8]); err != nil {
		t.Fatalf("seed user: %v", err)
	}
	t.Cleanup(func() { _, _ = p.Exec(ctx, `DELETE FROM identity.user WHERE id = $1`, u) })
	return u
}

// seedSubject inserts a reusable academic.subject row and cleans it up.
func seedSubject(t *testing.T, p *pgxpool.Pool, ctx context.Context) uuid.UUID {
	t.Helper()
	s := uuid.New()
	if _, err := p.Exec(ctx, `INSERT INTO academic.subject (id, code, name) VALUES ($1, $2, $3)`, s, "subj_"+s.String()[:8], "Matematika"); err != nil {
		t.Fatalf("seed subject: %v", err)
	}
	t.Cleanup(func() { _, _ = p.Exec(ctx, `DELETE FROM academic.subject WHERE id = $1`, s) })
	return s
}

// seedQuestion inserts a question.question row with a current version, EASY
// metadata, four options (A..D, "A" correct) and an optional subject link.
func seedQuestion(t *testing.T, p *pgxpool.Pool, ctx context.Context, subjectID uuid.UUID) uuid.UUID {
	t.Helper()
	qid := uuid.New()

	var pubID uuid.UUID
	if err := p.QueryRow(ctx, `INSERT INTO question.question_status (code, name) VALUES ('PUBLISHED','Published') ON CONFLICT (code) DO NOTHING RETURNING id`).Scan(&pubID); err != nil {
		_ = p.QueryRow(ctx, `SELECT id FROM question.question_status WHERE code='PUBLISHED'`).Scan(&pubID)
	}
	if _, err := p.Exec(ctx, `
		INSERT INTO question.question (id, question_code, question_type, status_id, owner_id, created_by)
		VALUES ($1, $2, 'SINGLE_CHOICE', $3, NULL, NULL)`, qid, "q_an_"+qid.String()[:8], pubID); err != nil {
		t.Fatalf("seed question: %v", err)
	}
	var versionID uuid.UUID
	if err := p.QueryRow(ctx, `
		INSERT INTO question.question_version (question_id, version_no, change_summary, created_by, is_current)
		VALUES ($1, 1, 'probe', NULL, true) RETURNING id`, qid).Scan(&versionID); err != nil {
		t.Fatalf("seed question version: %v", err)
	}
	if _, err := p.Exec(ctx, `UPDATE question.question SET current_version_id=$1 WHERE id=$2`, versionID, qid); err != nil {
		t.Fatalf("set current version: %v", err)
	}
	if _, err := p.Exec(ctx, `INSERT INTO question.question_metadata (question_id, difficulty_level) VALUES ($1,'EASY')`, qid); err != nil {
		t.Fatalf("seed question metadata: %v", err)
	}
	if subjectID != uuid.Nil {
		if _, err := p.Exec(ctx, `INSERT INTO question.question_subject (question_id, subject_id) VALUES ($1,$2)`, qid, subjectID); err != nil {
			t.Fatalf("seed question_subject: %v", err)
		}
	}
	for i, l := range []string{"A", "B", "C", "D"} {
		correct := l == "A"
		score := 0.0
		if correct {
			score = 1.0
		}
		if _, err := p.Exec(ctx, `
			INSERT INTO question.question_option (id, question_version_id, label, score, is_correct, display_order)
			VALUES ($1, $2, $3, $4, $5, $6)`, uuid.New(), versionID, l, score, correct, i); err != nil {
			t.Fatalf("seed question option: %v", err)
		}
	}

	t.Cleanup(func() { _, _ = p.Exec(ctx, `DELETE FROM question.question WHERE id = $1`, qid) })
	return qid
}

// TestAnalyticsRepositoryMigration seeds one exam/participant/attempt with
// grading for a correct, wrong and blank question, then asserts the migrated
// aggregate queries observe the raw cbt.* rows. Fully read-only: no residue.
func TestAnalyticsRepositoryMigration(t *testing.T) {
	p := testPool(t)
	ctx := context.Background()
	r := NewRepository(p)
	cr := contentpkg.NewRepository(p)

	var examID, student, subject, q1, q2, q3, attemptID uuid.UUID
	t.Cleanup(func() { assertAnalyticsResidueZero(t, p, examID, student, subject, q1, q2, q3) })

	owner := seedUser(t, p, ctx, "an_owner")
	student = seedUser(t, p, ctx, "an_student")
	subject = seedSubject(t, p, ctx)
	q1 = seedQuestion(t, p, ctx, subject)
	q2 = seedQuestion(t, p, ctx, subject)
	q3 = seedQuestion(t, p, ctx, subject)

	// Seed the exam master + metadata via the content layer (per brief).
	base := &contentpkg.Content{
		ContentType: contentpkg.ContentTypeExam,
		GradeID:     uuid.Nil,
		SubjectID:   subject,
		Title:       "Analytics Exam",
		Body:        "desc",
		Status:      contentpkg.StatusDraft,
		CreatedBy:   owner,
	}
	if err := cr.CreateContent(ctx, base); err != nil {
		t.Fatalf("CreateContent(EXAM): %v", err)
	}
	if err := cr.CreateExam(ctx, &contentpkg.Exam{ContentID: base.ID, DurationMinutes: 60, PassingScore: 50}); err != nil {
		t.Fatalf("CreateExam: %v", err)
	}
	examID = base.ID
	t.Cleanup(func() { _, _ = p.Exec(ctx, `DELETE FROM cbt.exam WHERE id = $1`, examID) })

	// Participant + attempt (COMPLETED, with duration).
	var pid uuid.UUID
	if err := p.QueryRow(ctx, `
		INSERT INTO cbt.exam_participant (exam_id, student_id, status)
		VALUES ($1, $2, 'STARTED') RETURNING id`, examID, student).Scan(&pid); err != nil {
		t.Fatalf("seed participant: %v", err)
	}
	started := time.Now().Add(-30 * time.Minute)
	finished := time.Now()
	if err := p.QueryRow(ctx, `
		INSERT INTO cbt.exam_attempt (id, participant_id, attempt_no, started_at, finished_at, status)
		VALUES ($1, $2, 1, $3, $4, 'COMPLETED') RETURNING id`, uuid.New(), pid, started, finished).Scan(&attemptID); err != nil {
		t.Fatalf("seed attempt: %v", err)
	}

	// attempt_question rows + student_answer for q1.
	aqIDs := map[uuid.UUID]uuid.UUID{}
	for i, q := range []uuid.UUID{q1, q2, q3} {
		aq := uuid.New()
		if _, err := p.Exec(ctx, `
			INSERT INTO cbt.attempt_question (id, attempt_id, question_id, display_order)
			VALUES ($1, $2, $3, $4)`, aq, attemptID, q, i); err != nil {
			t.Fatalf("seed attempt_question: %v", err)
		}
		aqIDs[q] = aq
	}
	if _, err := p.Exec(ctx, `INSERT INTO cbt.student_answer (attempt_question_id, selected_option) VALUES ($1, 'A')`, aqIDs[q1]); err != nil {
		t.Fatalf("seed student_answer: %v", err)
	}

	// grading_result (0 passed: score 33.33 < passing 50).
	if _, err := p.Exec(ctx, `
		INSERT INTO cbt.grading_result (attempt_id, score, correct, wrong, blank, passed)
		VALUES ($1, 33.33, 1, 1, 1, false)`, attemptID); err != nil {
		t.Fatalf("seed grading_result: %v", err)
	}
	// grading_detail: q1 correct, q2 wrong (not blank), q3 blank.
	det := []struct {
		q                      uuid.UUID
		correct, blank         bool
	}{{q1, true, false}, {q2, false, false}, {q3, false, true}}
	for _, d := range det {
		score := 0.0
		if d.correct {
			score = 1.0
		}
		if _, err := p.Exec(ctx, `
			INSERT INTO cbt.grading_detail (attempt_question_id, question_id, status_correct, score, is_blank)
			VALUES ($1, $2, $3, $4, $5)`, aqIDs[d.q], d.q, d.correct, score, d.blank); err != nil {
			t.Fatalf("seed grading_detail: %v", err)
		}
	}

	// One exam_package_question (used_in_exams count = 1) for q1.
	var pkgID uuid.UUID
	if err := p.QueryRow(ctx, `
		INSERT INTO cbt.exam_package (exam_id, name) VALUES ($1, 'default') RETURNING id`, examID).Scan(&pkgID); err != nil {
		t.Fatalf("seed exam_package: %v", err)
	}
	t.Cleanup(func() { _, _ = p.Exec(ctx, `DELETE FROM cbt.exam_package_question WHERE package_id=$1`, pkgID) })
	t.Cleanup(func() { _, _ = p.Exec(ctx, `DELETE FROM cbt.exam_package WHERE id = $1`, pkgID) })
	if _, err := p.Exec(ctx, `
		INSERT INTO cbt.exam_package_question (package_id, question_id, question_order, score)
		VALUES ($1, $2, 0, 1)`, pkgID, q1); err != nil {
		t.Fatalf("seed exam_package_question: %v", err)
	}

	// --- GetExamAnalytics ---
	ea, err := r.GetExamAnalytics(ctx, examID)
	if err != nil {
		t.Fatalf("GetExamAnalytics: %v", err)
	}
	if ea.TotalParticipants != 1 || ea.TotalStarted != 1 || ea.TotalFinished != 1 {
		t.Errorf("exam analytics counts = participants=%d started=%d finished=%d, want 1/1/1", ea.TotalParticipants, ea.TotalStarted, ea.TotalFinished)
	}
	if ea.HighestScore != 33.33 || ea.LowestScore != 33.33 {
		t.Errorf("exam scores = high %.2f low %.2f, want 33.33/33.33", ea.HighestScore, ea.LowestScore)
	}
	if ea.PassRate != 0 {
		t.Errorf("exam pass_rate = %.1f, want 0 (passed=false for 33.33 < passing 50)", ea.PassRate)
	}
	if len(ea.QuestionBreakdown) != 3 {
		t.Errorf("question_breakdown len = %d, want 3", len(ea.QuestionBreakdown))
	}

	// --- GetStudentAnalytics ---
	sa, err := r.GetStudentAnalytics(ctx, student)
	if err != nil {
		t.Fatalf("GetStudentAnalytics: %v", err)
	}
	if sa.TotalExamsTaken != 1 || sa.TotalPassed != 0 || sa.TotalFailed != 1 {
		t.Errorf("student totals = taken=%d passed=%d failed=%d, want 1/0/1", sa.TotalExamsTaken, sa.TotalPassed, sa.TotalFailed)
	}
	if sa.TotalQuestions != 3 || sa.TotalCorrect != 1 || sa.TotalWrong != 1 || sa.TotalUnanswered != 1 {
		t.Errorf("student answer counts = q=%d c=%d w=%d u=%d, want 3/1/1/1", sa.TotalQuestions, sa.TotalCorrect, sa.TotalWrong, sa.TotalUnanswered)
	}
	if len(sa.Subjects) != 1 || len(sa.RecentResults) != 1 {
		t.Errorf("student subjects=%d recent=%d, want 1/1", len(sa.Subjects), len(sa.RecentResults))
	}

	// --- GetQuestionAnalytics (correct q1) ---
	qa, err := r.GetQuestionAnalytics(ctx, q1)
	if err != nil {
		t.Fatalf("GetQuestionAnalytics: %v", err)
	}
	if qa.TotalAttempts != 1 || qa.CorrectCount != 1 || qa.WrongCount != 0 {
		t.Errorf("q1 analytics = attempts=%d correct=%d wrong=%d, want 1/1/0", qa.TotalAttempts, qa.CorrectCount, qa.WrongCount)
	}
	if qa.Accuracy != 100 {
		t.Errorf("q1 accuracy = %.1f, want 100", qa.Accuracy)
	}
	if qa.UsedInExamsCount != 1 {
		t.Errorf("q1 used_in_exams = %d, want 1", qa.UsedInExamsCount)
	}
	if len(qa.OptionBreakdown) != 4 {
		t.Errorf("q1 option_breakdown len = %d, want 4", len(qa.OptionBreakdown))
	}
	pickedA := false
	for _, ob := range qa.OptionBreakdown {
		if ob.OptionText == "A" && ob.TimesPicked == 1 {
			pickedA = true
		}
	}
	if !pickedA {
		t.Errorf("q1 option A not observed with times_picked=1, got %+v", qa.OptionBreakdown)
	}

	// --- GetQuestionAnalytics (blank q3) ---
	qa3, err := r.GetQuestionAnalytics(ctx, q3)
	if err != nil {
		t.Fatalf("GetQuestionAnalytics(q3): %v", err)
	}
	if qa3.CorrectCount != 0 || qa3.WrongCount != 1 {
		t.Errorf("q3 analytics = %+v, want correct=0 wrong=1", qa3)
	}
}

// TestAnalyticsAdminOverviewAndDifficulty covers the two Critical fixes: the
// admin overview must treat grading_result.score on the 0-100 scale (pass via
// g.passed; brackets on 0-100), and GetExamDifficulty must not merge NULL
// metadata into MEDIUM.
func TestAnalyticsAdminOverviewAndDifficulty(t *testing.T) {
	p := testPool(t)
	r := NewRepository(p)
	ctx := context.Background()

	var examID, student uuid.UUID
	t.Cleanup(func() { assertAnalyticsResidueZero(t, p, examID, student, uuid.Nil, uuid.Nil, uuid.Nil, uuid.Nil) })

	student = seedUser(t, p, ctx, "ov_student")
	cr := contentpkg.NewRepository(p)
	base := &contentpkg.Content{
		ContentType: contentpkg.ContentTypeExam,
		GradeID:     uuid.Nil,
		SubjectID:   uuid.Nil,
		Title:       "Overview Exam",
		Body:        "desc",
		Status:      contentpkg.StatusDraft,
		CreatedBy:   student,
	}
	if err := cr.CreateContent(ctx, base); err != nil {
		t.Fatalf("CreateContent(EXAM): %v", err)
	}
	if err := cr.CreateExam(ctx, &contentpkg.Exam{ContentID: base.ID, DurationMinutes: 60, PassingScore: 50}); err != nil {
		t.Fatalf("CreateExam: %v", err)
	}
	examID = base.ID
	t.Cleanup(func() { _, _ = p.Exec(ctx, `DELETE FROM cbt.exam WHERE id = $1`, examID) })

	var pid uuid.UUID
	if err := p.QueryRow(ctx, `INSERT INTO cbt.exam_participant (exam_id, student_id, status) VALUES ($1,$2,'STARTED') RETURNING id`, examID, student).Scan(&pid); err != nil {
		t.Fatalf("participant: %v", err)
	}
	var attemptID uuid.UUID
	if err := p.QueryRow(ctx, `INSERT INTO cbt.exam_attempt (id, participant_id, attempt_no, started_at, finished_at, status) VALUES (gen_random_uuid(), $1, 1, NOW()-interval '10 min', NOW(), 'COMPLETED') RETURNING id`, pid).Scan(&attemptID); err != nil {
		t.Fatalf("attempt: %v", err)
	}
	// score 90 (> 85 bracket) and passed=true.
	if _, err := p.Exec(ctx, `INSERT INTO cbt.grading_result (attempt_id, score, correct, wrong, blank, passed) VALUES ($1, 90, 5, 0, 0, true)`, attemptID); err != nil {
		t.Fatalf("grading_result: %v", err)
	}

	ov, err := r.GetAdminOverviewAnalytics(ctx)
	if err != nil {
		t.Fatalf("GetAdminOverviewAnalytics: %v", err)
	}
	if ov.PassRate != 100 {
		t.Errorf("overview PassRate = %v, want 100 (single passed attempt)", ov.PassRate)
	}
	if ov.AverageScore != 90 {
		t.Errorf("overview AverageScore = %v, want 90", ov.AverageScore)
	}
	if ov.ScoreDistribution.Bracket700Plus != 1 {
		t.Errorf("overview bracket700+ = %d, want 1 (score 90 on 0-100 scale)", ov.ScoreDistribution.Bracket700Plus)
	}
	if ov.TotalExams < 1 {
		t.Errorf("overview TotalExams = %d, want >=1", ov.TotalExams)
	}

	// Difficulty: one question keeps EASY metadata (set by seedQuestion),
	// one question has its metadata deleted (NULL → must group as MEDIUM via
	// COALESCE, not its own bucket).
	qE := seedQuestion(t, p, ctx, uuid.Nil)
	qN := seedQuestion(t, p, ctx, uuid.Nil)
	t.Cleanup(func() { _, _ = p.Exec(ctx, `DELETE FROM question.question_metadata WHERE question_id=$1`, qN) })
	if _, err := p.Exec(ctx, `DELETE FROM question.question_metadata WHERE question_id=$1`, qN); err != nil {
		t.Fatalf("delete null-metadata question: %v", err)
	}
	var pkgID uuid.UUID
	if err := p.QueryRow(ctx, `INSERT INTO cbt.exam_package (exam_id, name) VALUES ($1,'default') RETURNING id`, examID).Scan(&pkgID); err != nil {
		t.Fatalf("package: %v", err)
	}
	t.Cleanup(func() { _, _ = p.Exec(ctx, `DELETE FROM cbt.exam_package WHERE id=$1`, pkgID) })
	for _, q := range []uuid.UUID{qE, qN} {
		if _, err := p.Exec(ctx, `INSERT INTO cbt.exam_package_question (package_id, question_id, question_order, score) VALUES ($1,$2,0,1)`, pkgID, q); err != nil {
			t.Fatalf("package_question: %v", err)
		}
	}
	diff, err := r.GetExamDifficulty(ctx, examID)
	if err != nil {
		t.Fatalf("GetExamDifficulty: %v", err)
	}
	if diff.Easy.Count != 1 {
		t.Errorf("difficulty easy count = %d, want 1", diff.Easy.Count)
	}
	if diff.Medium.Count != 1 {
		t.Errorf("difficulty medium count = %d, want 1 (NULL metadata grouped via COALESCE)", diff.Medium.Count)
	}
	if diff.Hard.Count != 0 {
		t.Errorf("difficulty hard count = %d, want 0", diff.Hard.Count)
	}
}

// assertAnalyticsResidueZero asserts every cbt/question/academic/identity probe
// row created by this test is gone.
func assertAnalyticsResidueZero(t *testing.T, p *pgxpool.Pool, examID, student, subject, q1, q2, q3 uuid.UUID) {
	t.Helper()
	ctx := context.Background()
	attemptIDs := `(SELECT id FROM cbt.exam_attempt WHERE participant_id IN (SELECT id FROM cbt.exam_participant WHERE exam_id = $1))`
	aqIDs := `(SELECT id FROM cbt.attempt_question WHERE attempt_id IN ` + attemptIDs + `)`
	checks := []struct {
		name string
		q    string
		args []interface{}
	}{
		{"cbt.exam_participant", `SELECT count(*) FROM cbt.exam_participant WHERE exam_id = $1`, []interface{}{examID}},
		{"cbt.exam_attempt", `SELECT count(*) FROM cbt.exam_attempt WHERE id IN ` + attemptIDs, []interface{}{examID}},
		{"cbt.attempt_question", `SELECT count(*) FROM cbt.attempt_question WHERE attempt_id IN ` + attemptIDs, []interface{}{examID}},
		{"cbt.student_answer", `SELECT count(*) FROM cbt.student_answer WHERE attempt_question_id IN ` + aqIDs, []interface{}{examID}},
		{"cbt.grading_result", `SELECT count(*) FROM cbt.grading_result WHERE attempt_id IN ` + attemptIDs, []interface{}{examID}},
		{"cbt.grading_detail", `SELECT count(*) FROM cbt.grading_detail WHERE attempt_question_id IN ` + aqIDs, []interface{}{examID}},
		{"cbt.exam", `SELECT count(*) FROM cbt.exam WHERE id = $1`, []interface{}{examID}},
		{"identity.user", `SELECT count(*) FROM identity.user WHERE id = $1`, []interface{}{student}},
		{"academic.subject", `SELECT count(*) FROM academic.subject WHERE id = $1`, []interface{}{subject}},
		{"question.question", `SELECT count(*) FROM question.question WHERE id IN ($1, $2, $3)`, []interface{}{q1, q2, q3}},
		{"question.question_package_q", `SELECT count(*) FROM cbt.exam_package_question WHERE question_id IN ($1, $2, $3)`, []interface{}{q1, q2, q3}},
	}
	for _, c := range checks {
		var n int
		if err := p.QueryRow(ctx, c.q, c.args...).Scan(&n); err == nil && n != 0 {
			t.Errorf("residue: %s has %d rows, want 0", c.name, n)
		}
	}
}