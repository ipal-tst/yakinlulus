package subscription

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
		t.Skip("DB_URL not set; skipping subscription repository integration test")
	}
	p, err := pgxpool.New(context.Background(), url)
	if err != nil {
		t.Fatalf("connect: %v", err)
	}
	t.Cleanup(p.Close)
	return p
}

func seedSubscriptionUser(t *testing.T, p *pgxpool.Pool, ctx context.Context) uuid.UUID {
	t.Helper()
	u := uuid.New()
	if _, err := p.Exec(ctx, `
		INSERT INTO identity.user (id, username, email, password_hash, status, email_verified, phone_verified, created_at, updated_at)
		VALUES ($1, $2, $3, 'x', 'ACTIVE', false, false, NOW(), NOW())`,
		u, "ylb4t6_"+u.String()[:8], "sub6_"+u.String()[:8]+"@example.com"); err != nil {
		t.Fatalf("seed user: %v", err)
	}
	if _, err := p.Exec(ctx, `INSERT INTO identity.user_profile (user_id, full_name) VALUES ($1, 'Nama User')`, u); err != nil {
		t.Fatalf("seed profile: %v", err)
	}
	t.Cleanup(func() { _, _ = p.Exec(ctx, `DELETE FROM identity.user WHERE id = $1`, u) })
	return u
}

func TestSubscriptionRepository(t *testing.T) {
	p := testPool(t)
	repo := NewRepository(p)
	ctx := context.Background()

	suffix := uuid.New().String()[:8]
	plan := &Plan{
		Name:         "Paket Gold",
		Slug:         "gold_" + suffix,
		Description:  nil,
		Price:        99000,
		DurationDays: 30,
		Features:     []interface{}{"Unlimited CBT", "Analytics"},
		IsActive:     true,
	}
	if err := repo.CreatePlan(ctx, plan); err != nil {
		t.Fatalf("CreatePlan: %v", err)
	}
	t.Cleanup(func() { _, _ = p.Exec(ctx, `DELETE FROM finance.membership_package WHERE id = $1`, plan.ID) })

	t.Run("CreatePlanAndRoundTrip", func(t *testing.T) {
		got, err := repo.FindPlanByID(ctx, plan.ID)
		if err != nil {
			t.Fatalf("FindPlanByID: %v", err)
		}
		if got.Name != "Paket Gold" || got.Price != 99000 || got.DurationDays != 30 {
			t.Errorf("plan mismatch: %+v", got)
		}
		if len(got.Features) != 2 || got.Features[0] != "Unlimited CBT" || got.Features[1] != "Analytics" {
			t.Errorf("features mismatch: %v", got.Features)
		}

		list, err := repo.ListPlans(ctx)
		if err != nil {
			t.Fatalf("ListPlans: %v", err)
		}
		found := false
		for _, x := range list {
			if x.ID == plan.ID {
				found = true
				if x.Features == nil || len(x.Features) != 2 {
					t.Errorf("list features nil/wrong: %v", x.Features)
				}
			}
		}
		if !found {
			t.Errorf("ListPlans missing created plan")
		}
	})

	t.Run("UpdatePlan", func(t *testing.T) {
		plan.Price = 120000
		plan.Features = []interface{}{"Only Analytics"}
		if err := repo.UpdatePlan(ctx, plan); err != nil {
			t.Fatalf("UpdatePlan: %v", err)
		}
		got, _ := repo.FindPlanByID(ctx, plan.ID)
		if got.Price != 120000 || len(got.Features) != 1 || got.Features[0] != "Only Analytics" {
			t.Errorf("updated plan mismatch: %+v features=%v", got, got.Features)
		}
	})

	t.Run("ListSubscriptionsAndStats", func(t *testing.T) {
		uid := seedSubscriptionUser(t, p, ctx)
		membershipID := uuid.New()
		if _, err := p.Exec(ctx, `
			INSERT INTO finance.user_membership (id, user_id, membership_package_id, status, active_from, created_at, updated_at)
			VALUES ($1, $2, $3, 'ACTIVE', NOW(), NOW(), NOW())`,
			membershipID, uid, plan.ID); err != nil {
			t.Fatalf("seed membership: %v", err)
		}
		t.Cleanup(func() { _, _ = p.Exec(ctx, `DELETE FROM finance.user_membership WHERE id = $1`, membershipID) })

		subs, total, err := repo.ListSubscriptions(ctx, 10, 0)
		if err != nil {
			t.Fatalf("ListSubscriptions: %v", err)
		}
		if total < 1 {
			t.Errorf("total subs = %d, want >= 1", total)
		}
		found := false
		for _, s := range subs {
			if s.ID == membershipID {
				found = true
				if s.PlanName != "Paket Gold" || s.UserFullname != "Nama User" {
					t.Errorf("sub join mismatch: %+v", s)
				}
			}
		}
		if !found {
			t.Errorf("ListSubscriptions missing seeded membership")
		}

		mrr, active, count, err := repo.GetStats(ctx)
		if err != nil {
			t.Fatalf("GetStats: %v", err)
		}
		if active < 1 || mrr < 99000 || count < 1 {
			t.Errorf("stats = mrr=%d active=%d total=%d", mrr, active, count)
		}
	})

	t.Run("DeletePlan", func(t *testing.T) {
		if err := repo.DeletePlan(ctx, plan.ID); err != nil {
			t.Fatalf("DeletePlan: %v", err)
		}
		if _, err := repo.FindPlanByID(ctx, plan.ID); err == nil {
			t.Errorf("FindPlanByID after Delete should error (soft-delete filter)")
		}
	})
}
