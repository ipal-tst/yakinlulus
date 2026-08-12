package academic

import (
	"context"
	"testing"

	"github.com/google/uuid"
)

func TestBulkDeleteUnknownKind(t *testing.T) {
	svc := &Service{repo: &Repository{}}
	_, err := svc.BulkDelete(context.Background(), BulkRequest{
		Kind: "unknown",
		IDs:  []uuid.UUID{uuid.New()},
	})
	if err == nil {
		t.Fatal("expected error for unknown kind")
	}
}

func TestBulkStatusLevelNotSupported(t *testing.T) {
	svc := &Service{repo: &Repository{}}
	active := true
	_, err := svc.BulkStatus(context.Background(), BulkRequest{
		Kind:     "level",
		IDs:      []uuid.UUID{uuid.New()},
		IsActive: &active,
	})
	if err == nil {
		t.Fatal("expected error for level status update")
	}
}

func TestBulkStatusGradeNotSupported(t *testing.T) {
	svc := &Service{repo: &Repository{}}
	active := true
	_, err := svc.BulkStatus(context.Background(), BulkRequest{
		Kind:     "grade",
		IDs:      []uuid.UUID{uuid.New()},
		IsActive: &active,
	})
	if err == nil {
		t.Fatal("expected error for grade status update")
	}
}

func TestBulkDeleteEmptyIDs(t *testing.T) {
	svc := &Service{repo: &Repository{}}
	_, err := svc.BulkDelete(context.Background(), BulkRequest{
		Kind: "subject",
	})
	if err == nil {
		t.Fatal("expected error for empty IDs")
	}
}

func TestBulkStatusEmptyIDs(t *testing.T) {
	svc := &Service{repo: &Repository{}}
	active := true
	_, err := svc.BulkStatus(context.Background(), BulkRequest{
		Kind:     "subject",
		IsActive: &active,
	})
	if err == nil {
		t.Fatal("expected error for empty IDs")
	}
}

func TestBulkStatusMissingIsActive(t *testing.T) {
	svc := &Service{repo: &Repository{}}
	_, err := svc.BulkStatus(context.Background(), BulkRequest{
		Kind: "subject",
	})
	if err == nil {
		t.Fatal("expected error for missing is_active")
	}
}
