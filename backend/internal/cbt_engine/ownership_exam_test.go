package cbt_engine

import (
	"context"
	"os"
	"testing"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"

	"yakinlulus.id/backend/internal/content"
)

// TestExamDeleteOwnership is DB-backed; skips when DB_URL is unset.
func TestExamDeleteOwnership(t *testing.T) {
	url := os.Getenv("DB_URL")
	if url == "" {
		t.Skip("DB_URL not set; skipping exam ownership delete test")
	}
	pool, err := pgxpool.New(context.Background(), url)
	if err != nil {
		t.Fatalf("connect: %v", err)
	}
	defer pool.Close()

	repo := content.NewRepository(pool)
	ctx := context.Background()

	ownerA, ownerB := uuid.New(), uuid.New()
	for _, u := range []uuid.UUID{ownerA, ownerB} {
		if _, err := pool.Exec(ctx, `
			INSERT INTO identity.user (id, username, password_hash, status, email_verified, phone_verified, created_at, updated_at)
			VALUES ($1,$2,'x','ACTIVE',false,false,NOW(),NOW())
			ON CONFLICT (id) DO NOTHING`, u, "own_exm_"+u.String()[:8]); err != nil {
			t.Fatalf("seed owner: %v", err)
		}
	}
	defer func() {
		for _, u := range []uuid.UUID{ownerA, ownerB} {
			_, _ = pool.Exec(ctx, `DELETE FROM identity.user WHERE id=$1`, u)
		}
	}()

	base := &content.Content{
		ContentType: content.ContentTypeExam,
		SubjectID:   uuid.New(),
		Title:       "exam-ownership-" + ownerA.String(),
		Body:        "desc",
		CreatedBy:   ownerA,
		Status:      content.StatusPublished,
	}
	if err := repo.CreateContent(ctx, base); err != nil {
		t.Fatalf("create exam: %v", err)
	}
	id := base.ID
	defer repo.DeleteContent(ctx, id) // zero residue

	exam, err := repo.GetExam(ctx, id)
	if err != nil {
		t.Fatalf("get exam: %v", err)
	}
	owner := exam.Content.CreatedBy

	// Decision matrix (same rule the DeleteExam handler gate uses).
	if canMutateExam("GURU", ownerB, owner) {
		t.Fatal("GURU B must NOT delete A's exam")
	}
	if !canMutateExam("GURU", ownerA, owner) {
		t.Fatal("GURU A must delete own exam")
	}
	if !canMutateExam("SUPER_ADMIN", ownerB, owner) {
		t.Fatal("SUPER_ADMIN must delete any exam")
	}
}