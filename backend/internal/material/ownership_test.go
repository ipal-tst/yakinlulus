package material

import (
	"context"
	"os"
	"testing"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"yakinlulus.id/backend/internal/content"
)

// TestServiceDeleteOwnership is DB-backed; skips when DB_URL is unset so
// offline/CI `go test ./...` stays green.
func TestServiceDeleteOwnership(t *testing.T) {
	url := os.Getenv("DB_URL")
	if url == "" {
		t.Skip("DB_URL not set; skipping material ownership delete test")
	}
	pool, err := pgxpool.New(context.Background(), url)
	if err != nil {
		t.Fatalf("connect: %v", err)
	}
	defer pool.Close()

	svc := NewService(content.NewRepository(pool))
	ctx := context.Background()

	ownerA, ownerB := uuid.New(), uuid.New()
	for _, u := range []uuid.UUID{ownerA, ownerB} {
		if _, err := pool.Exec(ctx, `
			INSERT INTO identity.user (id, username, password_hash, status, email_verified, phone_verified, created_at, updated_at)
			VALUES ($1,$2,'x','ACTIVE',false,false,NOW(),NOW())
			ON CONFLICT (id) DO NOTHING`, u, "own_mat_"+u.String()[:8]); err != nil {
			t.Fatalf("seed owner: %v", err)
		}
	}
	defer func() {
		for _, u := range []uuid.UUID{ownerA, ownerB} {
			_, _ = pool.Exec(ctx, `DELETE FROM identity.user WHERE id=$1`, u)
		}
	}()

	base := &content.Content{
		ContentType: content.ContentTypeMaterial,
		SubjectID:   uuid.New(),
		Title:       "ownership-test-" + ownerA.String(),
		Body:        "ownership",
		CreatedBy:   ownerA,
		Status:      content.StatusPublished,
	}
	m := &content.Material{ContentID: base.ID, ContentFormat: content.MaterialFormatText}
	if err := svc.Create(ctx, m, base); err != nil {
		t.Fatalf("create: %v", err)
	}
	id := base.ID
	defer svc.content.DeleteContent(ctx, id) // zero residue

	mt, err := svc.FindByID(ctx, id)
	if err != nil {
		t.Fatalf("get: %v", err)
	}
	owner := mt.Content.CreatedBy

	// Decision matrix (same rule the handler Delete gate uses).
	if canDelete("GURU", ownerB, owner) {
		t.Fatal("GURU B must NOT delete A's material")
	}
	if !canDelete("GURU", ownerA, owner) {
		t.Fatal("GURU A must delete own material")
	}
	if !canDelete("SUPER_ADMIN", ownerB, owner) {
		t.Fatal("SUPER_ADMIN must delete any material")
	}

	// Owner A deletes it themselves -> soft-delete succeeds (then ErrNoRows on re-read).
	if err := svc.Delete(ctx, id); err != nil {
		t.Fatalf("delete own: %v", err)
	}
	if _, err := svc.FindByID(ctx, id); err != pgx.ErrNoRows {
		t.Fatalf("expected ErrNoRows after delete, got %v", err)
	}
}