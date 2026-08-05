package media

import (
	"context"
	"os"
	"testing"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
)

// newTestRepo connects to the live DB via DB_URL and skips the test when
// the env var is absent (e.g. CI or offline).
func testPool(t *testing.T) *pgxpool.Pool {
	t.Helper()
	url := os.Getenv("DB_URL")
	if url == "" {
		t.Skip("DB_URL not set; skipping media repository integration test")
	}
	p, err := pgxpool.New(context.Background(), url)
	if err != nil {
		t.Fatalf("connect: %v", err)
	}
	t.Cleanup(p.Close)
	return p
}

func TestMediaRepositoryLifecycle(t *testing.T) {
	p := testPool(t)
	r := NewRepository(p)
	ctx := context.Background()

	// Seed a real identity.user so the asset_uploaded_by FK resolves.
	owner := uuid.New()
	if _, err := p.Exec(ctx, `
		INSERT INTO identity.user (id, username, password_hash, status, email_verified, phone_verified, created_at, updated_at)
		VALUES ($1, $2, 'x', 'ACTIVE', false, false, NOW(), NOW())
		ON CONFLICT (id) DO NOTHING`, owner, "media_probe_"+owner.String()[:8]); err != nil {
		t.Fatalf("seed user: %v", err)
	}

	entityType := "PROBE"
	entityID := uuid.New()
	originalName := "probe_test.txt"
	storagePath := "uploads/" + originalName
	publicURL := "https://example.com/bucket/uploads/" + originalName

	m := &Media{
		FileName:     originalName,
		OriginalName: originalName,
		MimeType:     "text/plain",
		FileSize:     12,
		StoragePath:  storagePath,
		URL:          publicURL,
		UploadedBy:   &owner,
		EntityType:   &entityType,
		EntityID:     &entityID,
		Bucket:       "media",
	}

	if err := r.Create(ctx, m); err != nil {
		t.Fatalf("Create: %v", err)
	}

	var storageID *uuid.UUID
	if err := p.QueryRow(ctx, `SELECT storage_id FROM media.asset WHERE id = $1`, m.ID).Scan(&storageID); err != nil {
		t.Fatalf("read storage_id: %v", err)
	}

	t.Cleanup(func() {
		_, _ = p.Exec(ctx, `DELETE FROM media.asset_reference WHERE asset_id = $1`, m.ID)
		if storageID != nil {
			_, _ = p.Exec(ctx, `DELETE FROM media.asset_storage WHERE id = $1`, *storageID)
		}
		_, _ = p.Exec(ctx, `DELETE FROM media.asset WHERE id = $1`, m.ID)
		_, _ = p.Exec(ctx, `DELETE FROM identity.user WHERE id = $1`, owner)
	})

	got, err := r.FindByID(ctx, m.ID)
	if err != nil {
		t.Fatalf("FindByID: %v", err)
	}
	if got.OriginalName != originalName {
		t.Errorf("OriginalName = %q, want %q", got.OriginalName, originalName)
	}
	if got.URL != publicURL {
		t.Errorf("URL = %q, want %q", got.URL, publicURL)
	}
	if got.StoragePath != storagePath {
		t.Errorf("StoragePath = %q, want %q", got.StoragePath, storagePath)
	}
	if got.EntityID == nil || *got.EntityID != entityID {
		t.Errorf("EntityID = %v, want %v", got.EntityID, entityID)
	}
	if got.EntityType == nil || *got.EntityType != entityType {
		t.Errorf("EntityType = %v, want %v", got.EntityType, entityType)
	}

	items, total, err := r.ListByEntity(ctx, entityType, entityID, 10, 0)
	if err != nil {
		t.Fatalf("ListByEntity: %v", err)
	}
	if total < 1 || len(items) == 0 {
		t.Errorf("ListByEntity: total=%d len=%d, want >=1", total, len(items))
	}

	all, allTotal, err := r.ListAll(ctx, 50, 0, "")
	if err != nil {
		t.Fatalf("ListAll: %v", err)
	}
	if allTotal < 1 || len(all) == 0 {
		t.Errorf("ListAll: total=%d len=%d, want >=1", allTotal, len(all))
	}

	// GURU (non-admin) ownership delete: another user cannot delete it.
	other := uuid.New()
	ok, err := r.Delete(ctx, m.ID, other, false)
	if err != nil {
		t.Fatalf("Delete (other user): %v", err)
	}
	if ok {
		t.Error("Delete by non-owner succeeded, want no rows affected")
	}
	if _, err := r.FindByID(ctx, m.ID); err != nil {
		t.Fatalf("asset should still exist after non-owner delete, got err: %v", err)
	}

	// Owner (non-admin) delete succeeds.
	ok, err = r.Delete(ctx, m.ID, owner, false)
	if err != nil {
		t.Fatalf("Delete (owner): %v", err)
	}
	if !ok {
		t.Error("Delete by owner affected 0 rows, want 1")
	}
	if _, err := r.FindByID(ctx, m.ID); err == nil {
		t.Error("FindByID after owner delete should return error (deleted_at filtered)")
	}
}

func TestMediaServiceDeleteStorageLess(t *testing.T) {
	p := testPool(t)
	r := NewRepository(p)
	svc := NewService(r, nil)
	ctx := context.Background()

	owner := uuid.New()
	if _, err := p.Exec(ctx, `
		INSERT INTO identity.user (id, username, password_hash, status, email_verified, phone_verified, created_at, updated_at)
		VALUES ($1, $2, 'x', 'ACTIVE', false, false, NOW(), NOW())
		ON CONFLICT (id) DO NOTHING`, owner, "media_probe_"+owner.String()[:8]); err != nil {
		t.Fatalf("seed user: %v", err)
	}

	// Storage-less asset: StoragePath and URL empty.
	m := &Media{
		FileName:     "probe_storageless.txt",
		OriginalName: "probe_storageless.txt",
		MimeType:     "text/plain",
		FileSize:     1,
		UploadedBy:   &owner,
	}
	if err := r.Create(ctx, m); err != nil {
		t.Fatalf("Create (storage-less): %v", err)
	}

	// Owner delete must succeed even though there is no storage path.
	if err := svc.Delete(ctx, m.ID, owner, false); err != nil {
		t.Fatalf("Service.Delete (storage-less owner): %v", err)
	}
	if _, err := r.FindByID(ctx, m.ID); err == nil {
		t.Error("FindByID after delete should return error (deleted_at filtered)")
	}

	p.Exec(ctx, `DELETE FROM media.asset WHERE id = $1`, m.ID)
	p.Exec(ctx, `DELETE FROM identity.user WHERE id = $1`, owner)
}
