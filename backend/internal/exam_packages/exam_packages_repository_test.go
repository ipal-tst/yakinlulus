package exam_packages

import (
	"context"
	"errors"
	"os"
	"testing"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

func testPool(t *testing.T) *pgxpool.Pool {
	t.Helper()
	url := os.Getenv("DB_URL")
	if url == "" {
		t.Skip("DB_URL not set; skipping exam_packages repository integration test")
	}
	p, err := pgxpool.New(context.Background(), url)
	if err != nil {
		t.Fatalf("connect: %v", err)
	}
	t.Cleanup(p.Close)
	return p
}

func epUser(t *testing.T, p *pgxpool.Pool, ctx context.Context, prefix string) uuid.UUID {
	t.Helper()
	u := uuid.New()
	if _, err := p.Exec(ctx, `
		INSERT INTO identity.user (id, username, password_hash, status, email_verified, phone_verified, created_at, updated_at)
		VALUES ($1, $2, 'x', 'ACTIVE', false, false, NOW(), NOW())
		ON CONFLICT (id) DO NOTHING`, u, prefix+"_"+u.String()[:8]); err != nil {
		t.Fatalf("seed user: %v", err)
	}
	t.Cleanup(func() { _, _ = p.Exec(ctx, `DELETE FROM identity.user WHERE id = $1`, u) })
	return u
}

// epSeedAcademic creates an education_level ('SMP') + grade + subject, all tied
// to the given grade-context so the cms.exam_packages view can resolve
// education_level and grade_id from the package's exam.
func epSeedAcademic(t *testing.T, p *pgxpool.Pool, ctx context.Context) (gradeID, eduID, subjID uuid.UUID) {
	t.Helper()
	// Reuse an existing 'SMP' education_level when present (unique code).
	_, _ = p.Exec(ctx, `INSERT INTO academic.education_level (code, name) SELECT 'SMP','SMP' WHERE NOT EXISTS (SELECT 1 FROM academic.education_level WHERE code='SMP')`)
	if err := p.QueryRow(ctx, `SELECT id FROM academic.education_level WHERE code = 'SMP' LIMIT 1`).Scan(&eduID); err != nil {
		t.Fatalf("lookup education_level SMP: %v", err)
	}

	gradeID = uuid.New()
	if _, err := p.Exec(ctx, `INSERT INTO academic.grade (id, education_level_id, code, name) VALUES ($1,$2,$3,'Kelas 7')`, gradeID, eduID, "g7_"+gradeID.String()[:6]); err != nil {
		t.Fatalf("seed grade: %v", err)
	}
	t.Cleanup(func() { _, _ = p.Exec(ctx, `DELETE FROM academic.grade WHERE id = $1`, gradeID) })

	subjID = uuid.New()
	if _, err := p.Exec(ctx, `INSERT INTO academic.subject (id, code, name) VALUES ($1,$2,$3)`,
		subjID, "subj_"+subjID.String()[:8], "Matematika"); err != nil {
		t.Fatalf("seed subject: %v", err)
	}
	t.Cleanup(func() { _, _ = p.Exec(ctx, `DELETE FROM academic.subject WHERE id = $1`, subjID) })
	return gradeID, eduID, subjID
}

func epSeedExam(t *testing.T, p *pgxpool.Pool, ctx context.Context) uuid.UUID {
	t.Helper()
	e := uuid.New()
	if _, err := p.Exec(ctx, `
		INSERT INTO cbt.exam (id, exam_code, title, exam_type) VALUES ($1,$2,$3,'TRYOUT')`,
		e, "exm_link_"+e.String()[:8], "Tryout TKA"); err != nil {
		t.Fatalf("seed exam: %v", err)
	}
	t.Cleanup(func() { _, _ = p.Exec(ctx, `DELETE FROM cbt.exam WHERE id = $1`, e) })
	return e
}

func boolPtr(b bool) *bool {
	return &b
}

func TestExamPackagesRepositoryLifecycle(t *testing.T) {
	p := testPool(t)
	r := NewRepository(p)
	ctx := context.Background()

	gradeID, _, subjID := epSeedAcademic(t, p, ctx)
	gradeStr := gradeID.String()
	examForLink := epSeedExam(t, p, ctx)

	created, err := r.Create(ctx, SavePackageRequest{
		Code:           "TKA-SMP-" + uuid.New().String()[:8],
		Name:           "Tryout SMP Bhs",
		EducationLevel: "SMP",
		GradeID:        &gradeStr,
		IsActive:       boolPtr(true),
	})
	if err != nil {
		t.Fatalf("Create: %v", err)
	}
	if created.ID == uuid.Nil {
		t.Fatal("Create returned nil ID")
	}

	// Capture the backing cbt.exam created by Create for residue cleanup.
	var backingExam uuid.UUID
	if err := p.QueryRow(ctx, `SELECT exam_id FROM cbt.exam_package WHERE id = $1`, created.ID).Scan(&backingExam); err != nil {
		t.Fatalf("lookup backing exam: %v", err)
	}
	t.Cleanup(func() { _, _ = p.Exec(ctx, `DELETE FROM cbt.exam WHERE id = $1`, backingExam) })

	// education_level resolved from the linked grade.
	if created.EducationLevel != "SMP" {
		t.Errorf("created.EducationLevel = %q, want SMP", created.EducationLevel)
	}
	if created.GradeID == nil || *created.GradeID != gradeID {
		t.Errorf("created.GradeID = %v, want %v", created.GradeID, gradeID)
	}

	got, err := r.GetByID(ctx, created.ID)
	if err != nil {
		t.Fatalf("GetByID: %v", err)
	}
	if got.ID != created.ID || got.Name != created.Name {
		t.Errorf("GetByID mismatch: %+v vs %+v", got, created)
	}

	// List should include the package (level filter 'SMP').
	listed, err := r.List(ctx, "SMP")
	if err != nil {
		t.Fatalf("List: %v", err)
	}
	found := false
	for _, it := range listed {
		if it.ID == created.ID {
			found = true
			break
		}
	}
	if !found {
		t.Errorf("List('SMP') missing created package (%d rows)", len(listed))
	}

	// Update changes name; is_active flips.
	upd, err := r.Update(ctx, created.ID, SavePackageRequest{
		Code:           created.Code,
		Name:           "Tryout SMP Renamed",
		EducationLevel: "SMP",
		GradeID:        &gradeStr,
		IsActive:       boolPtr(false),
	})
	if err != nil {
		t.Fatalf("Update: %v", err)
	}
	if upd.Name != "Tryout SMP Renamed" {
		t.Errorf("Update name = %q, want renamed", upd.Name)
	}
	if upd.IsActive {
		t.Errorf("Update IsActive still true, want false")
	}

	// IsExamContent: the seeded exam is a real exam; a random id is not.
	if ok, err := r.IsExamContent(ctx, examForLink); err != nil || !ok {
		t.Errorf("IsExamContent(seeded) = %v,%v want true", ok, err)
	}
	if ok, _ := r.IsExamContent(ctx, uuid.New()); ok {
		t.Errorf("IsExamContent(random) = true, want false")
	}

	// Link exam + subject, then list.
	if err := r.LinkExam(ctx, created.ID, LinkExamRequest{
		ExamContentID: examForLink.String(),
		SubjectID:     subjID.String(),
		DisplayOrder:  1,
	}); err != nil {
		t.Fatalf("LinkExam: %v", err)
	}
	exams, err := r.ListExams(ctx, created.ID)
	if err != nil {
		t.Fatalf("ListExams: %v", err)
	}
	if len(exams) == 0 {
		t.Fatal("ListExams empty after LinkExam")
	}
	if exams[0].ExamContentID != examForLink {
		t.Errorf("ListExams[0].ExamContentID = %v, want %v", exams[0].ExamContentID, examForLink)
	}
	if exams[0].SubjectID != subjID {
		t.Errorf("ListExams[0].SubjectID = %v, want %v", exams[0].SubjectID, subjID)
	}

	// UnlinkExam removes subjects, so the exam no longer lists with a subject.
	if err := r.UnlinkExam(ctx, created.ID, examForLink); err != nil {
		t.Fatalf("UnlinkExam: %v", err)
	}
	after, err := r.ListExams(ctx, created.ID)
	if err != nil {
		t.Fatalf("ListExams (after unlink): %v", err)
	}
	if len(after) == 0 {
		t.Fatal("ListExams empty after UnlinkExam")
	}
	if after[0].SubjectID != uuid.Nil {
		t.Errorf("ListExams after unlink SubjectID = %v, want nil", after[0].SubjectID)
	}

	// Delete removes the package; GetByID then errors.
	if err := r.Delete(ctx, created.ID); err != nil {
		t.Fatalf("Delete: %v", err)
	}
	if _, err := r.GetByID(ctx, created.ID); !errors.Is(err, pgx.ErrNoRows) {
		t.Errorf("GetByID after Delete = %v, want pgx.ErrNoRows", err)
	}
}

func TestExamPackagesDeleteMissing(t *testing.T) {
	p := testPool(t)
	r := NewRepository(p)
	ctx := context.Background()

	if err := r.Delete(ctx, uuid.New()); !errors.Is(err, pgx.ErrNoRows) {
		t.Errorf("Delete(missing) = %v, want pgx.ErrNoRows", err)
	}
}