package question_bank

import (
	"context"
	"os"
	"testing"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

// testPool connects to the live DB via DB_URL and skips the test when the
// env var is absent (e.g. CI or offline).
func testPool(t *testing.T) *pgxpool.Pool {
	t.Helper()
	url := os.Getenv("DB_URL")
	if url == "" {
		t.Skip("DB_URL not set; skipping question_bank repository integration test")
	}
	p, err := pgxpool.New(context.Background(), url)
	if err != nil {
		t.Fatalf("connect: %v", err)
	}
	t.Cleanup(p.Close)
	return p
}

func TestQuestionBankRepositoryLifecycle(t *testing.T) {
	p := testPool(t)
	r := NewRepository(p)
	ctx := context.Background()

	// Seed a real identity.user so question.owner_id/created_by FKs resolve.
	owner := uuid.New()
	if _, err := p.Exec(ctx, `
		INSERT INTO identity.user (id, username, password_hash, status, email_verified, phone_verified, created_at, updated_at)
		VALUES ($1, $2, 'x', 'ACTIVE', false, false, NOW(), NOW())
		ON CONFLICT (id) DO NOTHING`, owner, "qb_probe_"+owner.String()[:8]); err != nil {
		t.Fatalf("seed user: %v", err)
	}

	q := &Question{
		SubjectID:    uuid.Nil, // academic catalog is empty; junction must be skipped
		Content:      "Berapa hasil 1 + 1?",
		Difficulty:   "MEDIUM",
		QuestionType: QuestionTypeSingleChoice,
		Language:     "id",
		Score:        2.0,
		Explanation:  "1 + 1 = 2",
		CreatedBy:    owner,
		Status:       "",
	}
	opts := []QuestionOption{
		{Label: "A", Content: "1", IsCorrect: false},
		{Label: "B", Content: "2", IsCorrect: true},
	}

	if err := r.Create(ctx, q, opts); err != nil {
		t.Fatalf("Create: %v", err)
	}

	var questionID = q.ID
	var versionID uuid.UUID
	var jobID uuid.UUID
	t.Cleanup(func() {
		// Residue-free: history first (question_id becomes NULL on cascade),
		// then question (cascades version/blocks/options/metadata/junctions).
		_, _ = p.Exec(ctx, `DELETE FROM question.question_history WHERE question_id = $1`, questionID)
		_, _ = p.Exec(ctx, `DELETE FROM question.question WHERE id = $1`, questionID)
		if jobID != uuid.Nil {
			_, _ = p.Exec(ctx, `DELETE FROM question.question_import_row WHERE job_id = $1`, jobID)
			_, _ = p.Exec(ctx, `DELETE FROM question.question_import_job WHERE id = $1`, jobID)
		}
		_, _ = p.Exec(ctx, `DELETE FROM identity.user WHERE id = $1`, owner)
	})

	if q.Status != "DRAFT" {
		t.Errorf("Create: status = %q, want DRAFT (default)", q.Status)
	}
	if err := p.QueryRow(ctx, `SELECT current_version_id FROM question.question WHERE id = $1`, q.ID).Scan(&versionID); err != nil {
		t.Fatalf("read current_version_id: %v", err)
	}
	if versionID == uuid.Nil {
		t.Error("current_version_id not set after Create")
	}

	// FindByID round-trip
	got, err := r.FindByID(ctx, q.ID)
	if err != nil {
		t.Fatalf("FindByID: %v", err)
	}
	if got.Content != q.Content {
		t.Errorf("Content = %q, want %q", got.Content, q.Content)
	}
	if got.Difficulty != "MEDIUM" {
		t.Errorf("Difficulty = %q, want MEDIUM", got.Difficulty)
	}
	if got.Status != "DRAFT" {
		t.Errorf("Status = %q, want DRAFT", got.Status)
	}
	if got.Explanation != q.Explanation {
		t.Errorf("Explanation = %q, want %q", got.Explanation, q.Explanation)
	}
	if got.Score != 2.0 {
		t.Errorf("Score = %v, want 2.0", got.Score)
	}
	if len(got.Options) != 2 {
		t.Fatalf("options len = %d, want 2", len(got.Options))
	}
	if got.Options[0].Label != "A" || got.Options[0].Content != "1" || got.Options[0].IsCorrect {
		t.Errorf("option[0] = %+v, want label A content '1' not correct", got.Options[0])
	}
	if !got.Options[1].IsCorrect {
		t.Errorf("option[1] should be correct")
	}
	if got.Options[1].DisplayOrder != 1 {
		t.Errorf("option[1] display_order = %d, want 1", got.Options[1].DisplayOrder)
	}

	// List
	items, total, err := r.List(ctx, nil, nil, "", "DRAFT", "", 10, 0)
	if err != nil {
		t.Fatalf("List: %v", err)
	}
	if total < 1 {
		t.Errorf("List total = %d, want >= 1", total)
	}
	found := false
	for _, it := range items {
		if it.ID == q.ID {
			found = true
			break
		}
	}
	if !found {
		t.Error("List: created question not found")
	}

	// Replace options
	newOpts := []QuestionOption{{Label: "C", Content: "Benar", IsCorrect: true}}
	if err := r.ReplaceOptions(ctx, q.ID, newOpts); err != nil {
		t.Fatalf("ReplaceOptions: %v", err)
	}
	opts2, err := r.GetOptions(ctx, q.ID)
	if err != nil {
		t.Fatalf("GetOptions: %v", err)
	}
	if len(opts2) != 1 || opts2[0].Label != "C" || !opts2[0].IsCorrect {
		t.Errorf("after ReplaceOptions got %+v, want single correct option C", opts2)
	}

	// Non-owner (GURU) delete must be a no-op.
	other := uuid.New()
	if err := r.Delete(ctx, q.ID, other, false); err != pgx.ErrNoRows {
		t.Fatalf("Delete by non-owner err = %v, want pgx.ErrNoRows", err)
	}
	if _, err := r.FindByID(ctx, q.ID); err != nil {
		t.Fatalf("question should still exist after non-owner delete, got: %v", err)
	}

	// Owner delete soft-deletes and filters it out.
	if err := r.Delete(ctx, q.ID, owner, false); err != nil {
		t.Fatalf("Delete by owner: %v", err)
	}
	if _, err := r.FindByID(ctx, q.ID); err == nil {
		t.Error("FindByID after owner delete should return error (deleted_at filtered)")
	}

	// Import job/row probes
	jobID, err = r.CreateImportJob(ctx, "probe.json", 1, owner)
	if err != nil {
		t.Fatalf("CreateImportJob: %v", err)
	}
	if err := r.CreateImportRowLog(ctx, jobID, 1, []byte(`{}`), "IMPORTED", "", &q.ID); err != nil {
		t.Fatalf("CreateImportRowLog: %v", err)
	}
	if err := r.UpdateImportJob(ctx, jobID, 1, 0, "COMPLETED", ""); err != nil {
		t.Fatalf("UpdateImportJob: %v", err)
	}
	var jobStatus string
	if err := p.QueryRow(ctx, `SELECT status FROM question.question_import_job WHERE id = $1`, jobID).Scan(&jobStatus); err != nil {
		t.Fatalf("read job status: %v", err)
	}
	if jobStatus != "SUCCESS" {
		t.Errorf("job status = %q, want SUCCESS (COMPLETED mapped)", jobStatus)
	}
}
