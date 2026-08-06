package auth

import (
	"context"
	"os"
	"testing"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
)

const authTestUserPrefix = "ylb4t3"

func testPool(t *testing.T) *pgxpool.Pool {
	t.Helper()
	url := os.Getenv("DB_URL")
	if url == "" {
		t.Skip("DB_URL not set; skipping auth repository integration test")
	}
	p, err := pgxpool.New(context.Background(), url)
	if err != nil {
		t.Fatalf("connect: %v", err)
	}
	t.Cleanup(p.Close)
	return p
}

// seedAuthUser inserts a user + profile + primary SISWA role.
func seedAuthUser(t *testing.T, p *pgxpool.Pool, ctx context.Context) uuid.UUID {
	t.Helper()
	u := uuid.New()
	username := authTestUserPrefix + "_" + u.String()[:8]
	email := "t3_" + u.String()[:8] + "@example.com"

	if _, err := p.Exec(ctx, `
		INSERT INTO identity.user (id, username, email, password_hash, status, email_verified, phone_verified, created_at, updated_at)
		VALUES ($1, $2, $3, 'x', 'ACTIVE', false, false, NOW(), NOW())`,
		u, username, email); err != nil {
		t.Fatalf("seed user: %v", err)
	}
	if _, err := p.Exec(ctx, `
		INSERT INTO identity.user_profile (user_id, full_name) VALUES ($1, $2)`,
		u, "Seeded Siswa"); err != nil {
		t.Fatalf("seed profile: %v", err)
	}
	if _, err := p.Exec(ctx, `
		INSERT INTO identity.user_role (user_id, role_id, is_primary)
		SELECT $1, id, true FROM identity.role WHERE code = 'SISWA'`, u); err != nil {
		t.Fatalf("seed role: %v", err)
	}

	t.Cleanup(func() {
		_, _ = p.Exec(ctx, `DELETE FROM identity.user WHERE id = $1`, u)
		var n int
		if err := p.QueryRow(ctx,
			`SELECT COUNT(*) FROM identity.user WHERE username LIKE $1`, authTestUserPrefix+"_%").Scan(&n); err != nil {
			t.Fatalf("residue scan: %v", err)
		}
		if n != 0 {
			t.Fatalf("zero-residue violated: %d seeded users remain (prefix %q)", n, authTestUserPrefix)
		}
	})
	return u
}

func TestAuthAdminCRUD(t *testing.T) {
	p := testPool(t)
	r := NewRepository(p)
	ctx := context.Background()

	uid := seedAuthUser(t, p, ctx)
	updatedEmail := "updated_" + uid.String()[:8] + "@example.com"

	t.Run("FindAll", func(t *testing.T) {
		users, total, err := r.FindAll(ctx, 1, 20)
		if err != nil {
			t.Fatalf("FindAll: %v", err)
		}
		if total < 1 {
			t.Fatalf("FindAll total = %d, want >= 1", total)
		}
		if len(users) == 0 {
			t.Fatal("FindAll returned 0 users")
		}
		found := false
		for _, u := range users {
			if u.ID == uid {
				found = true
				if u.Role != "SISWA" {
					t.Errorf("seeded user Role = %q, want SISWA", u.Role)
				}
			}
		}
		if !found {
			t.Errorf("FindAll missing seeded user %v (%d rows)", uid, len(users))
		}
	})

	t.Run("SetActive", func(t *testing.T) {
		if err := r.SetActive(ctx, uid, false); err != nil {
			t.Fatalf("SetActive: %v", err)
		}
		var status string
		if err := p.QueryRow(ctx, `SELECT status FROM identity.user WHERE id = $1`, uid).Scan(&status); err != nil {
			t.Fatalf("read status: %v", err)
		}
		if status != "INACTIVE" {
			t.Errorf("status = %q, want INACTIVE", status)
		}
	})

	t.Run("UpdateUser", func(t *testing.T) {
		u := &User{ID: uid, Email: updatedEmail, FullName: "Nama Baru", Role: "SISWA", IsActive: true}
		if err := r.UpdateUser(ctx, u); err != nil {
			t.Fatalf("UpdateUser: %v", err)
		}
		var gotEmail string
		if err := p.QueryRow(ctx, `SELECT email FROM identity.user WHERE id = $1`, uid).Scan(&gotEmail); err != nil {
			t.Fatalf("read email: %v", err)
		}
		if gotEmail != updatedEmail {
			t.Errorf("email = %q, want %q", gotEmail, updatedEmail)
		}
		var fullName string
		if err := p.QueryRow(ctx, `SELECT full_name FROM identity.user_profile WHERE user_id = $1`, uid).Scan(&fullName); err != nil {
			t.Fatalf("read full_name: %v", err)
		}
		if fullName != "Nama Baru" {
			t.Errorf("full_name = %q, want Nama Baru", fullName)
		}
	})

	t.Run("Search", func(t *testing.T) {
		frag := "updated_" + uid.String()[:8]
		users, total, err := r.Search(ctx, frag, 1, 20)
		if err != nil {
			t.Fatalf("Search: %v", err)
		}
		if total < 1 {
			t.Fatalf("Search total = %d, want >= 1 for fragment %q", total, frag)
		}
		found := false
		for _, u := range users {
			if u.ID == uid {
				found = true
			}
		}
		if !found {
			t.Errorf("Search missing seeded user for fragment %q (%d rows)", frag, len(users))
		}
	})

	t.Run("SoftDelete", func(t *testing.T) {
		if err := r.SoftDelete(ctx, uid); err != nil {
			t.Fatalf("SoftDelete: %v", err)
		}
		var n int
		if err := p.QueryRow(ctx, `SELECT COUNT(*) FROM identity.user WHERE id = $1`, uid).Scan(&n); err != nil {
			t.Fatalf("count user: %v", err)
		}
		if n != 0 {
			t.Errorf("user still present after SoftDelete (n=%d)", n)
		}
		if err := p.QueryRow(ctx, `SELECT COUNT(*) FROM identity.user_profile WHERE user_id = $1`, uid).Scan(&n); err != nil {
			t.Fatalf("count profile: %v", err)
		}
		if n != 0 {
			t.Errorf("profile still present after SoftDelete (n=%d)", n)
		}
	})
}
