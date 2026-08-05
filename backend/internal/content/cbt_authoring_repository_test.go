package content

import (
	"context"
	"testing"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
)

// seedSubject inserts a reusable academic.subject row and cleans it up. The
// empty academic catalog shortcut used by materials does not apply here: the
// subject blueprint path stores subject-specific exam_question_pool rows that
// FK to academic.subject.
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

// seedQuestion inserts a minimal question.question row (enough to satisfy the
// cbt.exam_package_question.question_id FK). Optional subject link exercises
// the LATERAL subject join used by GetExamQuestions.
func seedQuestion(t *testing.T, p *pgxpool.Pool, ctx context.Context, owner, subjectID uuid.UUID) uuid.UUID {
	t.Helper()
	q := uuid.New()
	if _, err := p.Exec(ctx, `
		INSERT INTO question.question (id, question_code, question_type, status_id, owner_id, created_by)
		VALUES ($1, $2, 'SINGLE_CHOICE', NULL, $3, $3)`, q, "q_probe_"+q.String()[:8], owner); err != nil {
		t.Fatalf("seed question: %v", err)
	}
	if subjectID != uuid.Nil {
		if _, err := p.Exec(ctx, `INSERT INTO question.question_subject (question_id, subject_id) VALUES ($1, $2)`, q, subjectID); err != nil {
			t.Fatalf("seed question_subject: %v", err)
		}
	}
	t.Cleanup(func() {
		_, _ = p.Exec(ctx, `DELETE FROM question.question WHERE id = $1`, q)
	})
	return q
}

func TestCBTExamAuthoringLifecycle(t *testing.T) {
	p := testPool(t)
	r := NewRepository(p)
	ctx := context.Background()

	var examID uuid.UUID
	var owner, student uuid.UUID
	var subjectID, q1, q2 uuid.UUID

	// Registered FIRST -> runs LAST (cleanup is LIFO), after the user/
	// question/subject/exam cleanups, so the residue assertion sees a fully
	// cleaned DB.
	t.Cleanup(func() { assertCBTResidueZero(t, p, examID, owner, student, q1, q2, subjectID) })

	owner = seedUser(t, p, ctx, "exam_owner")
	student = seedUser(t, p, ctx, "exam_student")
	subjectID = seedSubject(t, p, ctx)
	q1 = seedQuestion(t, p, ctx, owner, subjectID)
	q2 = seedQuestion(t, p, ctx, owner, uuid.Nil)

	base := &Content{
		ContentType: ContentTypeExam,
		GradeID:     uuid.Nil,
		SubjectID:   subjectID,
		Title:       "Latihan UTBK Campuran",
		Body:        "Sebuah simulasi ujian untuk mengukur kemampuan.",
		Status:      StatusDraft,
		CreatedBy:   owner,
	}
	if err := r.CreateContent(ctx, base); err != nil {
		t.Fatalf("CreateContent(EXAM): %v", err)
	}
	examID = base.ID
	if examID == uuid.Nil {
		t.Fatal("CreateContent did not set Content.ID")
	}

	exam := &Exam{
		ContentID:       examID,
		Description:     base.Body,
		DurationMinutes: 120,
		PassingScore:    60,
		ShuffleQuestions: true,
		ShuffleOptions:  true,
		NegativeMarking: 0.5,
		Blueprint:       map[string]interface{}{"legacy": true},
	}
	if err := r.CreateExam(ctx, exam); err != nil {
		t.Fatalf("CreateExam: %v", err)
	}

	t.Cleanup(func() {
		// Registered last -> runs FIRST: hard-delete the exam probe
		// (DeleteContent soft-deletes, only setting deleted_at); cascade clears
		// metadata/randomization/package/pool/participants/junctions/schedule.
		_, _ = p.Exec(ctx, `DELETE FROM cbt.exam WHERE id = $1`, examID)
	})

	// Master row + seeded status + metadata row.
	var mCount int
	if err := p.QueryRow(ctx, `SELECT count(*) FROM cbt.exam WHERE id = $1`, examID).Scan(&mCount); err != nil {
		t.Fatalf("count exam: %v", err)
	}
	if mCount != 1 {
		t.Errorf("cbt.exam rows = %d, want 1", mCount)
	}
	var mdCount int
	if err := p.QueryRow(ctx, `SELECT count(*) FROM cbt.exam_metadata WHERE exam_id = $1`, examID).Scan(&mdCount); err != nil {
		t.Fatalf("count metadata: %v", err)
	}
	if mdCount != 1 {
		t.Errorf("exam_metadata rows = %d, want 1", mdCount)
	}
	var statusSeeded bool
	if err := p.QueryRow(ctx, `SELECT EXISTS (SELECT 1 FROM cbt.exam_status WHERE code = 'DRAFT')`).Scan(&statusSeeded); err != nil {
		t.Fatalf("status seed check: %v", err)
	}
	if !statusSeeded {
		t.Error("DRAFT exam_status not seeded")
	}
	// Subject junction linked (subject exists in academic.subject).
	var jCount int
	if err := p.QueryRow(ctx, `SELECT count(*) FROM cbt.exam_subject WHERE exam_id = $1`, examID).Scan(&jCount); err != nil {
		t.Fatalf("count exam_subject: %v", err)
	}
	if jCount != 1 {
		t.Errorf("exam_subject rows = %d, want 1", jCount)
	}

	// GetExam round-trip.
	got, err := r.GetExam(ctx, examID)
	if err != nil {
		t.Fatalf("GetExam: %v", err)
	}
	if got.Content.Title != base.Title {
		t.Errorf("Title = %q, want %q", got.Content.Title, base.Title)
	}
	if got.Content.Body != base.Body {
		t.Errorf("Body = %q, want %q", got.Content.Body, base.Body)
	}
	if got.Content.Status != StatusDraft {
		t.Errorf("Status = %q, want DRAFT", got.Content.Status)
	}
	if got.Exam.DurationMinutes != 120 {
		t.Errorf("DurationMinutes = %d, want 120", got.Exam.DurationMinutes)
	}
	if got.Exam.PassingScore != 60 {
		t.Errorf("PassingScore = %v, want 60", got.Exam.PassingScore)
	}
	if got.Exam.ShuffleQuestions != true {
		t.Errorf("ShuffleQuestions = %v, want true", got.Exam.ShuffleQuestions)
	}

	// ListExams finds it.
	items, total, err := r.ListExams(ctx, ExamFilter{ContentFilter: ContentFilter{Search: "UTBK", Limit: 20, Offset: 0}})
	if err != nil {
		t.Fatalf("ListExams: %v", err)
	}
	if total < 1 {
		t.Errorf("ListExams total = %d, want >= 1", total)
	}
	found := false
	for _, it := range items {
		if it.Content.ID == examID {
			found = true
			break
		}
	}
	if !found {
		t.Error("ListExams did not return the created exam")
	}

	// AddExamQuestion x2 (points -> score), Get, Reorder.
	eq1 := &ExamQuestion{ExamContentID: examID, QuestionContentID: q1, Points: 10}
	eq2 := &ExamQuestion{ExamContentID: examID, QuestionContentID: q2, Points: 20}
	if err := r.AddExamQuestion(ctx, eq1); err != nil {
		t.Fatalf("AddExamQuestion #1: %v", err)
	}
	if err := r.AddExamQuestion(ctx, eq2); err != nil {
		t.Fatalf("AddExamQuestion #2: %v", err)
	}
	qs, err := r.GetExamQuestions(ctx, examID)
	if err != nil {
		t.Fatalf("GetExamQuestions: %v", err)
	}
	if len(qs) != 2 {
		t.Fatalf("GetExamQuestions len = %d, want 2", len(qs))
	}
	foundQ1, foundQ2 := false, false
	for _, q := range qs {
		if q.QuestionContentID == q1 && q.Points == 10 {
			foundQ1 = true
		}
		if q.QuestionContentID == q2 && q.Points == 20 {
			foundQ2 = true
		}
	}
	if !foundQ1 || !foundQ2 {
		t.Errorf("exam questions not found with correct points (q1=%v q2=%v)", foundQ1, foundQ2)
	}

	// Reorder reverses the order.
	if err := r.ReorderExamQuestions(ctx, examID, []uuid.UUID{q2, q1}); err != nil {
		t.Fatalf("ReorderExamQuestions: %v", err)
	}
	reordered, err := r.GetExamQuestions(ctx, examID)
	if err != nil {
		t.Fatalf("GetExamQuestions (reordered): %v", err)
	}
	if len(reordered) != 2 {
		t.Fatalf("reordered len = %d, want 2", len(reordered))
	}
	if reordered[0].QuestionContentID != q2 {
		t.Errorf("reordered[0] = %v, want q2", reordered[0].QuestionContentID)
	}

	// GetExam reflects the added questions (LATERAL subject join propagates q1's subject).
	full, err := r.GetExam(ctx, examID)
	if err != nil {
		t.Fatalf("GetExam (questions): %v", err)
	}
	if len(full.Questions) != 2 {
		t.Errorf("GetExam questions len = %d, want 2", len(full.Questions))
	}
	for _, q := range full.Questions {
		if q.QuestionContentID == q1 && (q.SubjectID == nil || *q.SubjectID != subjectID) {
			t.Errorf("exam question subject not propagated for q1: %v", q.SubjectID)
		}
	}

	// Exam-level blueprint via exam_question_pool.
	if err := r.CreateExamBlueprint(ctx, &ExamBlueprint{ExamContentID: examID, EasyCount: 5, MediumCount: 3, HardCount: 2}); err != nil {
		t.Fatalf("CreateExamBlueprint: %v", err)
	}
	bp, err := r.GetExamBlueprint(ctx, examID)
	if err != nil {
		t.Fatalf("GetExamBlueprint: %v", err)
	}
	if bp.EasyCount != 5 || bp.MediumCount != 3 || bp.HardCount != 2 || bp.TotalQuestions != 10 {
		t.Errorf("blueprint = %+v, want easy=5 medium=3 hard=2 total=10", bp)
	}

	// Subject blueprint (subject-scoped pool rows).
	if err := r.CreateExamSubjectBlueprint(ctx, &ExamSubjectBlueprint{ExamContentID: examID, SubjectID: subjectID, EasyCount: 2, MediumCount: 1}); err != nil {
		t.Fatalf("CreateExamSubjectBlueprint: %v", err)
	}
	sbs, err := r.GetExamSubjectBlueprints(ctx, examID)
	if err != nil {
		t.Fatalf("GetExamSubjectBlueprints: %v", err)
	}
	if len(sbs) != 1 {
		t.Fatalf("subject blueprints len = %d, want 1", len(sbs))
	}
	if sbs[0].SubjectID != subjectID || sbs[0].EasyCount != 2 || sbs[0].MediumCount != 1 || sbs[0].TotalQuestions != 3 {
		t.Errorf("subject blueprint = %+v, want subject easy=2 medium=1 total=3", sbs[0])
	}

	// Participants.
	ep := &ExamParticipant{ExamContentID: examID, UserID: student}
	if err := r.AddExamParticipant(ctx, ep); err != nil {
		t.Fatalf("AddExamParticipant: %v", err)
	}
	if ep.ID == uuid.Nil {
		t.Error("AddExamParticipant did not set ID")
	}
	parts, err := r.GetExamParticipants(ctx, examID)
	if err != nil {
		t.Fatalf("GetExamParticipants: %v", err)
	}
	if len(parts) != 1 || parts[0].UserID != student {
		t.Errorf("participants = %+v, want [student]", parts)
	}

	// UpdateExam (service path: UpdateContent master + UpdateExam metadata).
	newTitle := "Latihan UTBK Final"
	if err := r.UpdateContent(ctx, examID, UpdateContentReq{Title: &newTitle}); err != nil {
		t.Fatalf("UpdateContent(exam title): %v", err)
	}
	if err := r.UpdateExam(ctx, examID, &Exam{ContentID: examID, DurationMinutes: 90, PassingScore: 50}); err != nil {
		t.Fatalf("UpdateExam: %v", err)
	}
	upd, err := r.GetExam(ctx, examID)
	if err != nil {
		t.Fatalf("GetExam (after update): %v", err)
	}
	if upd.Content.Title != newTitle {
		t.Errorf("Title after update = %q, want %q", upd.Content.Title, newTitle)
	}
	if upd.Exam.DurationMinutes != 90 {
		t.Errorf("DurationMinutes after update = %d, want 90", upd.Exam.DurationMinutes)
	}
	if upd.Exam.PassingScore != 50 {
		t.Errorf("PassingScore after update = %v, want 50", upd.Exam.PassingScore)
	}

	// DeleteExam via the service path (DeleteContent) soft-deletes + filters.
	if err := r.DeleteContent(ctx, examID); err != nil {
		t.Fatalf("DeleteContent(exam): %v", err)
	}
	if _, err := r.GetExam(ctx, examID); err == nil {
		t.Error("GetExam after delete should error (deleted_at filtered)")
	}
	var deletedAt *interface{}
	_ = p.QueryRow(ctx, `SELECT deleted_at FROM cbt.exam WHERE id = $1`, examID).Scan(&deletedAt)
	if deletedAt == nil {
		t.Error("deleted_at not set on exam soft delete")
	}
	listAfter, _, err := r.ListExams(ctx, ExamFilter{ContentFilter: ContentFilter{Limit: 20, Offset: 0}})
	if err != nil {
		t.Fatalf("ListExams (after delete): %v", err)
	}
	for _, it := range listAfter {
		if it.Content.ID == examID {
			t.Error("deleted exam still listed")
		}
	}
}

// assertCBTResidueZero asserts all probe rows are fully removed after cleanup.
func assertCBTResidueZero(t *testing.T, p *pgxpool.Pool, examID, owner, student, q1, q2, subject uuid.UUID) {
	t.Helper()
	ctx := context.Background()
	checks := map[string]string{
		"exam":               "SELECT count(*) FROM cbt.exam WHERE id = $1",
		"exam_metadata":      "SELECT count(*) FROM cbt.exam_metadata WHERE exam_id = $1",
		"exam_package":       "SELECT count(*) FROM cbt.exam_package WHERE exam_id = $1",
		"exam_question_pool": "SELECT count(*) FROM cbt.exam_question_pool WHERE exam_id = $1",
		"exam_participant":   "SELECT count(*) FROM cbt.exam_participant WHERE exam_id = $1",
		"exam_subject":       "SELECT count(*) FROM cbt.exam_subject WHERE exam_id = $1",
		"identity.user_owner":   "SELECT count(*) FROM identity.user WHERE id = $1",
		"identity.user_student": "SELECT count(*) FROM identity.user WHERE id = $1",
		"question.question":   "SELECT count(*) FROM question.question WHERE id IN ($1, $2)",
		"academic.subject":    "SELECT count(*) FROM academic.subject WHERE id = $1",
	}
	for name, q := range checks {
		var n int
		var err error
		switch name {
		case "identity.user_owner":
			err = p.QueryRow(ctx, q, owner).Scan(&n)
		case "identity.user_student":
			err = p.QueryRow(ctx, q, student).Scan(&n)
		case "question.question":
			err = p.QueryRow(ctx, q, q1, q2).Scan(&n)
		case "academic.subject":
			err = p.QueryRow(ctx, q, subject).Scan(&n)
		default:
			err = p.QueryRow(ctx, q, examID).Scan(&n)
		}
		if err == nil && n != 0 {
			t.Errorf("residue: %s has %d rows, want 0", name, n)
		}
	}
}