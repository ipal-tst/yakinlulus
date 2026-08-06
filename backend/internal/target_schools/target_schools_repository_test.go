package target_schools

import (
	"context"
	"os"
	"testing"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
)

func testPool(t *testing.T) *pgxpool.Pool {
	t.Helper()
	url := os.Getenv("DB_URL")
	if url == "" {
		t.Skip("DB_URL not set; skipping target_schools repository integration test")
	}
	p, err := pgxpool.New(context.Background(), url)
	if err != nil {
		t.Fatalf("connect: %v", err)
	}
	t.Cleanup(p.Close)
	return p
}

func TestTargetSchoolRepository(t *testing.T) {
	p := testPool(t)
	repo := NewRepository(p)
	ctx := context.Background()

	namePrefix := "ylb4t5_" + uuid.New().String()[:6]
	createdID := uuid.Nil
	t.Cleanup(func() {
		if createdID != uuid.Nil {
			_, _ = p.Exec(ctx, `DELETE FROM academic.target_school WHERE id = $1`, createdID)
		}
	})

	req := SaveSchoolRequest{
		Name:          namePrefix + " SMAN 2",
		Level:         "SMA",
		MinScore:      intPtr(460),
		MaxScore:      intPtr(540),
		MaxTotalScore: 620,
		Subjects:      []string{"Matematika", "B. Indonesia"},
		AcademicYear:  strPtr("2026"),
		IsActive:      boolPtr(true),
	}

	t.Run("CreateAndGet", func(t *testing.T) {
		s, err := repo.Create(ctx, req)
		if err != nil {
			t.Fatalf("Create: %v", err)
		}
		createdID = s.ID
		if s.Name != req.Name || s.Level != "SMA" || s.MaxTotalScore != 620 {
			t.Errorf("created mismatch: %+v", s)
		}
		if len(s.Subjects) != 2 {
			t.Errorf("subjects = %v", s.Subjects)
		}
		got, err := repo.GetByID(ctx, s.ID)
		if err != nil {
			t.Fatalf("GetByID: %v", err)
		}
		if got.Name != req.Name {
			t.Errorf("GetByID name = %q", got.Name)
		}
	})

	t.Run("ListByLevel", func(t *testing.T) {
		list, err := repo.List(ctx, "SMA")
		if err != nil {
			t.Fatalf("List: %v", err)
		}
		found := false
		for _, s := range list {
			if s.Name == req.Name && s.Level == "SMA" {
				found = true
			}
		}
		if !found {
			t.Errorf("List(SMA) missing created school")
		}
	})

	t.Run("Update", func(t *testing.T) {
		upd := req
		upd.MaxTotalScore = 700
		s, err := repo.Update(ctx, createdID, upd)
		if err != nil {
			t.Fatalf("Update: %v", err)
		}
		if s.MaxTotalScore != 700 {
			t.Errorf("updated max_total_score = %d, want 700", s.MaxTotalScore)
		}
	})

	t.Run("Delete", func(t *testing.T) {
		if err := repo.Delete(ctx, createdID); err != nil {
			t.Fatalf("Delete: %v", err)
		}
		if _, err := repo.GetByID(ctx, createdID); err == nil {
			t.Errorf("GetByID after Delete should not return a row (deleted_at filter)")
		}
	})
}

func strPtr(s string) *string { return &s }
func intPtr(i int) *int       { return &i }
func boolPtr(b bool) *bool    { return &b }
