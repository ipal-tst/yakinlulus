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

func seedSchool(t *testing.T, p *pgxpool.Pool, id uuid.UUID, name, lvl, province, city string) {
	t.Helper()
	ctx := context.Background()
	if _, err := p.Exec(ctx, `
		INSERT INTO academic.school (id, name, education_level, province, city, is_active)
		VALUES ($1,$2,$3,$4,$5,true)`, id, name, lvl, province, city); err != nil {
		t.Fatalf("seed school: %v", err)
	}
	t.Cleanup(func() { _, _ = p.Exec(ctx, `DELETE FROM academic.school WHERE id = $1`, id) })
}

func strPtr(s string) *string { return &s }
func intPtr(i int) *int       { return &i }
func boolPtr(b bool) *bool    { return &b }

func TestRepositoryCreateResolvesName(t *testing.T) {
	p := testPool(t)
	r := NewRepository(p)
	ctx := context.Background()
	schoolID := uuid.New()
	seedSchool(t, p, schoolID, "SMA Negeri 1 Jakarta", "SMA", "DKI Jakarta", "Jakarta Selatan")

	s, err := r.Create(ctx, SaveSchoolRequest{SchoolID: schoolID, Level: "SMA", MaxTotalScore: 400})
	if err != nil {
		t.Fatalf("Create: %v", err)
	}
	t.Cleanup(func() { _, _ = p.Exec(ctx, `DELETE FROM academic.target_school WHERE id = $1`, s.ID) })
	if s.Name != "SMA Negeri 1 Jakarta" {
		t.Fatalf("name not resolved: %q", s.Name)
	}
	if s.Province != "DKI Jakarta" {
		t.Fatalf("province not resolved: %q", s.Province)
	}
	if s.EducationLevel != "SMA" {
		t.Fatalf("education_level not resolved: %q", s.EducationLevel)
	}
	if s.SchoolID == nil || *s.SchoolID != schoolID {
		t.Fatalf("school_id not resolved: %v", s.SchoolID)
	}
}

func TestRepositoryCreateLevelMismatch(t *testing.T) {
	p := testPool(t)
	r := NewRepository(p)
	ctx := context.Background()
	schoolID := uuid.New()
	seedSchool(t, p, schoolID, "SMA Negeri 8 Jakarta", "SMA", "DKI Jakarta", "Jakarta Selatan")
	if _, err := r.Create(ctx, SaveSchoolRequest{SchoolID: schoolID, Level: "SMP", MaxTotalScore: 400}); err == nil {
		t.Fatal("expected level mismatch error")
	}
}

func TestRepositoryCreateResolveLevelWhenEmpty(t *testing.T) {
	p := testPool(t)
	r := NewRepository(p)
	ctx := context.Background()
	schoolID := uuid.New()
	seedSchool(t, p, schoolID, "SMA Negeri 3 Jakarta", "SMA", "DKI Jakarta", "Jakarta Selatan")

	s, err := r.Create(ctx, SaveSchoolRequest{SchoolID: schoolID, MaxTotalScore: 400})
	if err != nil {
		t.Fatalf("Create: %v", err)
	}
	t.Cleanup(func() { _, _ = p.Exec(ctx, `DELETE FROM academic.target_school WHERE id = $1`, s.ID) })
	if s.Level != "SMA" {
		t.Fatalf("level not resolved from school: %q", s.Level)
	}
}

func TestRepositoryCreateSchoolNotFound(t *testing.T) {
	p := testPool(t)
	r := NewRepository(p)
	ctx := context.Background()
	if _, err := r.Create(ctx, SaveSchoolRequest{SchoolID: uuid.New(), Level: "SMA", MaxTotalScore: 400}); err == nil {
		t.Fatal("expected school not found error")
	}
}

func TestRepositoryListFilters(t *testing.T) {
	p := testPool(t)
	r := NewRepository(p)
	ctx := context.Background()

	schoolID := uuid.New()
	seedSchool(t, p, schoolID, "SMA Negeri 1 Jakarta", "SMA", "DKI Jakarta", "Jakarta Selatan")
	s, err := r.Create(ctx, SaveSchoolRequest{SchoolID: schoolID, Level: "SMA", MaxTotalScore: 400})
	if err != nil {
		t.Fatalf("Create: %v", err)
	}
	t.Cleanup(func() { _, _ = p.Exec(ctx, `DELETE FROM academic.target_school WHERE id = $1`, s.ID) })

	find := func(list []TargetSchool, id uuid.UUID) bool {
		for _, x := range list {
			if x.ID == id {
				return true
			}
		}
		return false
	}

	if list, err := r.List(ctx, "SMA", "", "", false); err != nil {
		t.Fatalf("List level: %v", err)
	} else if !find(list, s.ID) {
		t.Fatal("List level=SMA missing created target")
	}

	if list, err := r.List(ctx, "", "DKI", "", false); err != nil {
		t.Fatalf("List province: %v", err)
	} else if !find(list, s.ID) {
		t.Fatal("List province=DKI missing created target")
	}

	if list, err := r.List(ctx, "", "Jawa Timur", "", false); err != nil {
		t.Fatalf("List province mismatch: %v", err)
	} else if find(list, s.ID) {
		t.Fatal("List province=Jawa Timur should not match DKI Jakarta school")
	}

	if list, err := r.List(ctx, "", "", "SMA Negeri 1", false); err != nil {
		t.Fatalf("List q: %v", err)
	} else if !find(list, s.ID) {
		t.Fatal("List q missing created target")
	}

	if list, err := r.List(ctx, "", "", "", true); err != nil {
		t.Fatalf("List include_inactive: %v", err)
	} else if !find(list, s.ID) {
		t.Fatal("List include_inactive missing created target")
	}
}

func TestRepositoryRoundTrip(t *testing.T) {
	p := testPool(t)
	repo := NewRepository(p)
	ctx := context.Background()

	schoolID := uuid.New()
	seedSchool(t, p, schoolID, "SMAN 2 Bandung", "SMA", "Jawa Barat", "Kota Bandung")
	req := SaveSchoolRequest{
		SchoolID:      schoolID,
		Level:         "SMA",
		MinScore:      intPtr(460),
		MaxScore:      intPtr(540),
		MaxTotalScore: 620,
		Subjects:      []string{"Matematika", "B. Indonesia"},
		AcademicYear:  strPtr("2026"),
		IsActive:      boolPtr(true),
	}
	created, err := repo.Create(ctx, req)
	if err != nil {
		t.Fatalf("Create: %v", err)
	}
	createdID := created.ID
	t.Cleanup(func() { _, _ = p.Exec(ctx, `DELETE FROM academic.target_school WHERE id = $1`, createdID) })

	t.Run("CreateAndGet", func(t *testing.T) {
		if created.Name != "SMAN 2 Bandung" || created.Level != "SMA" || created.MaxTotalScore != 620 {
			t.Fatalf("created mismatch: %+v", created)
		}
		if len(created.Subjects) != 2 {
			t.Fatalf("subjects = %v", created.Subjects)
		}
		got, err := repo.GetByID(ctx, created.ID)
		if err != nil {
			t.Fatalf("GetByID: %v", err)
		}
		if got.Name != "SMAN 2 Bandung" || got.Province != "Jawa Barat" {
			t.Fatalf("GetByID join mismatch: %+v", got)
		}
	})

	t.Run("ListByLevel", func(t *testing.T) {
		list, err := repo.List(ctx, "SMA", "", "", false)
		if err != nil {
			t.Fatalf("List: %v", err)
		}
		found := false
		for _, s := range list {
			if s.ID == created.ID {
				found = true
			}
		}
		if !found {
			t.Fatalf("List(SMA) missing created school")
		}
	})

	t.Run("Update", func(t *testing.T) {
		maxScore := 700
		upd, err := repo.Update(ctx, created.ID, SaveSchoolRequest{
			SchoolID:      schoolID,
			Level:         "SMA",
			MaxTotalScore: 700,
			MaxScore:      &maxScore,
			AcademicYear:  strPtr("2026"),
		})
		if err != nil {
			t.Fatalf("Update: %v", err)
		}
		if upd.MaxTotalScore != 700 || upd.Name != "SMAN 2 Bandung" {
			t.Fatalf("updated mismatch: %+v", upd)
		}
		// level mismatch harus ditolak juga saat update
		if _, err := repo.Update(ctx, created.ID, SaveSchoolRequest{
			SchoolID: schoolID, Level: "UNIVERSITY", MaxTotalScore: 700,
		}); err == nil {
			t.Fatal("expected level mismatch on update")
		}
	})

	t.Run("Delete", func(t *testing.T) {
		if err := repo.Delete(ctx, created.ID); err != nil {
			t.Fatalf("Delete: %v", err)
		}
		if _, err := repo.GetByID(ctx, created.ID); err == nil {
			t.Fatalf("GetByID after Delete should not return a row (deleted_at filter)")
		}
	})
}