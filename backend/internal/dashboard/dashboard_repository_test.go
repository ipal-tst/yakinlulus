package dashboard

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
		t.Skip("DB_URL not set; skipping dashboard integration test")
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
		VALUES ($1, $2, 'x', 'ACTIVE', false, false, NOW(), NOW())`, u, prefix+"_"+u.String()[:8]); err != nil {
		t.Fatalf("seed user: %v", err)
	}
	t.Cleanup(func() { _, _ = p.Exec(ctx, `DELETE FROM identity.user WHERE id = $1`, u) })
	return u
}

func seedSubject(t *testing.T, p *pgxpool.Pool, ctx context.Context) uuid.UUID {
	t.Helper()
	s := uuid.New()
	if _, err := p.Exec(ctx, `INSERT INTO academic.subject (id, code, name) VALUES ($1, $2, $3)`, s, "dash_subj_"+s.String()[:8], "Matematika"); err != nil {
		t.Fatalf("seed subject: %v", err)
	}
	t.Cleanup(func() { _, _ = p.Exec(ctx, `DELETE FROM academic.subject WHERE id = $1`, s) })
	return s
}

// seedQuestion inserts a question.question row under a PUBLISHED status for the
// owner and cleans it up.
func seedQuestion(t *testing.T, p *pgxpool.Pool, ctx context.Context, owner uuid.UUID) uuid.UUID {
	t.Helper()
	qid := uuid.New()
	var pubID uuid.UUID
	if err := p.QueryRow(ctx, `INSERT INTO question.question_status (code, name) VALUES ('PUBLISHED','Published') ON CONFLICT (code) DO NOTHING RETURNING id`).Scan(&pubID); err != nil {
		_ = p.QueryRow(ctx, `SELECT id FROM question.question_status WHERE code='PUBLISHED'`).Scan(&pubID)
	}
	if _, err := p.Exec(ctx, `
		INSERT INTO question.question (id, question_code, question_type, status_id, owner_id, created_by)
		VALUES ($1, $2, 'SINGLE_CHOICE', $3, $4, $4)`, qid, "q_d_"+qid.String()[:8], pubID, owner); err != nil {
		t.Fatalf("seed question: %v", err)
	}
	t.Cleanup(func() { _, _ = p.Exec(ctx, `DELETE FROM question.question WHERE id = $1`, qid) })
	return qid
}

// TestDashboardRepositoryMigration seeds a student, one owner-created material
// (in progress) + one completed material in the same subject, a PUBLISHED exam
// with participant/attempt/grading, and an owned question; then verifies the
// migrated dashboard queries observe the new-schema rows. Zero residue.
func TestDashboardRepositoryMigration(t *testing.T) {
	p := testPool(t)
	ctx := context.Background()
	r := NewRepository(p)
	cr := contentpkg.NewRepository(p)

	owner := seedUser(t, p, ctx, "dash_owner")
	student := seedUser(t, p, ctx, "dash_student")
	subject := seedSubject(t, p, ctx)
	t.Cleanup(func() { assertDashboardResidueZero(t, p, student, owner, subject) })

	// --- Two materials in the same subject ---
	mIDs := make([]uuid.UUID, 0, 2)
	for i, title := range []string{"Materi In Progress", "Materi Selesai"} {
		mb := &contentpkg.Content{
			ContentType: contentpkg.ContentTypeMaterial,
			GradeID:     uuid.Nil,
			SubjectID:   subject,
			Title:       title,
			Body:        "body",
			Status:      contentpkg.StatusPublished,
			CreatedBy:   owner,
		}
		if err := cr.CreateContent(ctx, mb); err != nil {
			t.Fatalf("CreateContent(MATERIAL %d): %v", i, err)
		}
		if err := cr.CreateMaterial(ctx, &contentpkg.Material{ContentID: mb.ID}); err != nil {
			t.Fatalf("CreateMaterial(%d): %v", i, err)
		}
		mIDs = append(mIDs, mb.ID)
		t.Cleanup(func() { _, _ = p.Exec(ctx, `DELETE FROM content.material WHERE id = $1`, mb.ID) })
	}

	// Student progress: in-progress on mIDs[0] (40%), completed today on mIDs[1].
	lp := []struct {
		mat     uuid.UUID
		percent float64
		day     bool
	}{
		{mIDs[0], 40, false},
		{mIDs[1], 100, true},
	}
	for _, row := range lp {
		completed := row.percent >= 100
		created := time.Now()
		if row.day {
			created = time.Now()
		}
		if _, err := p.Exec(ctx, `
			INSERT INTO content.learning_progress (student_id, material_id, progress_percent, completed, created_at, updated_at)
			VALUES ($1, $2, $3, $4, $5, $5)`,
			student, row.mat, row.percent, completed, created); err != nil {
			t.Fatalf("seed learning_progress: %v", err)
		}
	}

	// --- Published exam + participant + attempt + grading_result ---
	eb := &contentpkg.Content{
		ContentType: contentpkg.ContentTypeExam,
		GradeID:     uuid.Nil,
		SubjectID:   subject,
		Title:       "Ujian Dashboard",
		Body:        "desc",
		Status:      contentpkg.StatusPublished,
		CreatedBy:   owner,
	}
	if err := cr.CreateContent(ctx, eb); err != nil {
		t.Fatalf("CreateContent(EXAM): %v", err)
	}
	if err := cr.CreateExam(ctx, &contentpkg.Exam{ContentID: eb.ID, DurationMinutes: 60, PassingScore: 50}); err != nil {
		t.Fatalf("CreateExam: %v", err)
	}
	examID := eb.ID
	t.Cleanup(func() { _, _ = p.Exec(ctx, `DELETE FROM cbt.exam WHERE id = $1`, examID) })

	var pid, attemptID uuid.UUID
	if err := p.QueryRow(ctx, `
		INSERT INTO cbt.exam_participant (exam_id, student_id, status)
		VALUES ($1, $2, 'STARTED') RETURNING id`, examID, student).Scan(&pid); err != nil {
		t.Fatalf("seed participant: %v", err)
	}
	if err := p.QueryRow(ctx, `
		INSERT INTO cbt.exam_attempt (id, participant_id, attempt_no, started_at, finished_at, status)
		VALUES ($1, $2, 1, NOW(), NOW(), 'COMPLETED') RETURNING id`, uuid.New(), pid).Scan(&attemptID); err != nil {
		t.Fatalf("seed attempt: %v", err)
	}
	if _, err := p.Exec(ctx, `
		INSERT INTO cbt.grading_result (attempt_id, score, correct, wrong, blank, passed)
		VALUES ($1, 90, 9, 1, 0, true)`, attemptID); err != nil {
		t.Fatalf("seed grading_result: %v", err)
	}
	_ = seedQuestion(t, p, ctx, owner)
	_ = seedQuestion(t, p, ctx, owner)

	// --- GetContinueLearning: returns the in-progress (40%) material ---
	cl := r.GetContinueLearning(ctx, student, nil)
	if cl == nil {
		t.Fatal("GetContinueLearning returned nil, want the in-progress material")
	}
	if cl.MaterialID != mIDs[0] {
		t.Errorf("GetContinueLearning material = %s, want %s", cl.MaterialID, mIDs[0])
	}
	if cl.SubjectName != "Matematika" {
		t.Errorf("GetContinueLearning subject = %q, want Matematika", cl.SubjectName)
	}

	// --- GetTodayGoal ---
	tg := r.GetTodayGoal(ctx, student, nil)
	if tg.CompletedMaterials != 1 {
		t.Errorf("GetTodayGoal completed_materials = %d, want 1", tg.CompletedMaterials)
	}
	if tg.AnsweredQuestions != 1 {
		t.Errorf("GetTodayGoal answered_questions = %d, want 1", tg.AnsweredQuestions)
	}

	// --- GetLearningProgress ---
	lpList := r.GetLearningProgress(ctx, student, nil)
	if len(lpList) != 1 {
		t.Fatalf("GetLearningProgress len = %d, want 1", len(lpList))
	}
	sp := lpList[0]
	if sp.TotalMaterials != 2 || sp.CompletedMaterials != 1 {
		t.Errorf("GetLearningProgress subject total=%d completed=%d, want 2/1", sp.TotalMaterials, sp.CompletedMaterials)
	}

	// --- GetExamStats ---
	es := r.GetExamStats(ctx, student)
	if es.TotalCompleted != 1 {
		t.Errorf("GetExamStats total_completed = %d, want 1", es.TotalCompleted)
	}
	if es.AverageScore != 90 || es.HighestScore != 90 {
		t.Errorf("GetExamStats avg=%.2f high=%.2f, want 90/90", es.AverageScore, es.HighestScore)
	}

	// --- GetQuestionBankStat (owner) ---
	qs := r.GetQuestionBankStat(ctx, owner)
	if qs.Total != 2 {
		t.Errorf("GetQuestionBankStat total = %d, want 2", qs.Total)
	}
	if qs.Published != 2 {
		t.Errorf("GetQuestionBankStat published = %d, want 2", qs.Published)
	}
	if qs.Draft != 0 {
		t.Errorf("GetQuestionBankStat draft = %d, want 0", qs.Draft)
	}
}

func assertDashboardResidueZero(t *testing.T, p *pgxpool.Pool, student, owner, subject uuid.UUID) {
	t.Helper()
	ctx := context.Background()
	checks := []struct {
		name string
		q    string
		args []interface{}
	}{
		{"content.material", `SELECT count(*) FROM content.material WHERE owner_id = $1`, []interface{}{owner}},
		{"content.learning_progress", `SELECT count(*) FROM content.learning_progress WHERE student_id = $1`, []interface{}{student}},
		{"cbt.exam", `SELECT count(*) FROM cbt.exam WHERE created_by = $1`, []interface{}{owner}},
		{"cbt.exam_participant", `SELECT count(*) FROM cbt.exam_participant WHERE student_id = $1`, []interface{}{student}},
		{"cbt.exam_attempt", `SELECT count(*) FROM cbt.exam_attempt a JOIN cbt.exam_participant p ON p.id = a.participant_id WHERE p.student_id = $1`, []interface{}{student}},
		{"cbt.grading_result", `SELECT count(*) FROM cbt.grading_result g JOIN cbt.exam_attempt a ON a.id = g.attempt_id JOIN cbt.exam_participant p ON p.id = a.participant_id WHERE p.student_id = $1`, []interface{}{student}},
		{"question.question", `SELECT count(*) FROM question.question WHERE owner_id = $1`, []interface{}{owner}},
	}
	for _, c := range checks {
		var n int
		if err := p.QueryRow(ctx, c.q, c.args...).Scan(&n); err == nil && n != 0 {
			t.Errorf("residue: %s has %d rows, want 0", c.name, n)
		}
	}
}

// TestDashboardKPI verifies KPI teacher/student counts use the v2 role codes
// (GURU/SISWA) — the legacy TEACHER/STUDENT codes would always return 0.
func TestDashboardKPI(t *testing.T) {
	p := testPool(t)
	r := NewRepository(p)
	ctx := context.Background()

	seedRole := func(code, name string) uuid.UUID {
		id := uuid.New()
		var rid uuid.UUID
		if err := p.QueryRow(ctx, `
			INSERT INTO identity.role (id, code, name, is_system)
			VALUES ($1, $2, $3, false)
			ON CONFLICT (code) DO NOTHING RETURNING id`, id, code, name).Scan(&rid); err != nil {
			p.QueryRow(ctx, `SELECT id FROM identity.role WHERE code=$1`, code).Scan(&rid)
		}
		t.Cleanup(func() { _, _ = p.Exec(ctx, `DELETE FROM identity.role WHERE id=$1 AND is_system=false`, rid) })
		return rid
	}

	guru := seedUser(t, p, ctx, "kpi_guru")
	siswa := seedUser(t, p, ctx, "kpi_siswa")
	guruRole := seedRole("GURU", "Guru")
	siswaRole := seedRole("SISWA", "Siswa")

	if _, err := p.Exec(ctx, `INSERT INTO identity.user_role (user_id, role_id) VALUES ($1,$2)`, guru, guruRole); err != nil {
		t.Fatalf("link guru: %v", err)
	}
	if _, err := p.Exec(ctx, `INSERT INTO identity.user_role (user_id, role_id) VALUES ($1,$2)`, siswa, siswaRole); err != nil {
		t.Fatalf("link siswa: %v", err)
	}
	t.Cleanup(func() { _, _ = p.Exec(ctx, `DELETE FROM identity.user_role WHERE user_id IN ($1,$2)`, guru, siswa) })

	kpi := r.GetKPI(ctx)
	if kpi.TotalTeachers < 1 {
		t.Errorf("KPI TotalTeachers = %d, want >=1 (GURU role)", kpi.TotalTeachers)
	}
	if kpi.TotalStudents < 1 {
		t.Errorf("KPI TotalStudents = %d, want >=1 (SISWA role)", kpi.TotalStudents)
	}
}