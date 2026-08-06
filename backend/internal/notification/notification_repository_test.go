package notification

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
		t.Skip("DB_URL not set; skipping notification repository integration test")
	}
	p, err := pgxpool.New(context.Background(), url)
	if err != nil {
		t.Fatalf("connect: %v", err)
	}
	t.Cleanup(p.Close)
	return p
}

func seedNotificationUser(t *testing.T, p *pgxpool.Pool, ctx context.Context) uuid.UUID {
	t.Helper()
	u := uuid.New()
	if _, err := p.Exec(ctx, `
		INSERT INTO identity.user (id, username, email, password_hash, status, email_verified, phone_verified, created_at, updated_at)
		VALUES ($1, $2, $3, 'x', 'ACTIVE', false, false, NOW(), NOW())`,
		u, "ylb4t7_"+u.String()[:8], "notif7_"+u.String()[:8]+"@example.com"); err != nil {
		t.Fatalf("seed user: %v", err)
	}
	t.Cleanup(func() { _, _ = p.Exec(ctx, `DELETE FROM identity.user WHERE id = $1`, u) })
	return u
}

func TestNotificationRepository(t *testing.T) {
	p := testPool(t)
	repo := NewRepository(p)
	ctx := context.Background()
	uid := seedNotificationUser(t, p, ctx)

	t.Run("CreateAndRoundTrip", func(t *testing.T) {
		n := &Notification{
			UserID:  uid,
			Title:   "Selamat datang",
			Body:    "Pendaftaran berhasil",
			Channel: "IN_APP",
			Status:  "PENDING",
		}
		if err := repo.Create(ctx, n); err != nil {
			t.Fatalf("Create: %v", err)
		}
		t.Cleanup(func() { _, _ = p.Exec(ctx, `DELETE FROM notification.user_notification WHERE id = $1`, n.ID) })

		got, err := repo.FindByID(ctx, n.ID)
		if err != nil {
			t.Fatalf("FindByID: %v", err)
		}
		if got == nil || got.Title != "Selamat datang" || got.Channel != "IN_APP" || got.UserID != uid {
			t.Errorf("roundtrip mismatch: %+v", got)
		}

		list, total, err := repo.FindByUser(ctx, uid, 10, 0)
		if err != nil {
			t.Fatalf("FindByUser: %v", err)
		}
		if total < 1 || len(list) < 1 {
			t.Errorf("list total=%d len=%d", total, len(list))
		}

		count, err := repo.GetUnreadCount(ctx, uid)
		if err != nil {
			t.Fatalf("GetUnreadCount: %v", err)
		}
		if count < 1 {
			t.Errorf("unread count = %d, want >= 1", count)
		}
	})

	t.Run("MarkReadAndArchive", func(t *testing.T) {
		n := &Notification{
			UserID:        uid,
			Title:         "Hasil Tryout",
			Body:          "Nilai kamu sudah keluar",
			Channel:       "PUSH",
			Status:        "SENT",
			ReferenceType: strptr("exam_attempt"),
		}
		ref := uuid.New()
		n.ReferenceID = &ref
		if err := repo.Create(ctx, n); err != nil {
			t.Fatalf("Create: %v", err)
		}
		t.Cleanup(func() { _, _ = p.Exec(ctx, `DELETE FROM notification.user_notification WHERE id = $1`, n.ID) })

		if err := repo.MarkRead(ctx, n.ID, uid); err != nil {
			t.Fatalf("MarkRead: %v", err)
		}
		got, _ := repo.FindByID(ctx, n.ID)
		if got == nil || got.ReadAt == nil {
			t.Fatalf("MarkRead did not set read_at: %+v", got)
		}

		if err := repo.MarkAllRead(ctx, uid); err != nil {
			t.Fatalf("MarkAllRead: %v", err)
		}
		count, _ := repo.GetUnreadCount(ctx, uid)
		if count != 0 {
			t.Errorf("unread after MarkAllRead = %d, want 0", count)
		}

		if err := repo.Archive(ctx, n.ID, uid); err != nil {
			t.Fatalf("Archive: %v", err)
		}
		list, _, _ := repo.FindByUser(ctx, uid, 10, 0)
		for _, x := range list {
			if x.ID == n.ID {
				t.Errorf("archived notification still in list")
			}
		}

		if err := repo.Delete(ctx, n.ID, uid); err != nil {
			t.Fatalf("Delete: %v", err)
		}
		gone, _ := repo.FindByID(ctx, n.ID)
		if gone != nil {
			t.Errorf("notification should be deleted")
		}
	})

	t.Run("Broadcast", func(t *testing.T) {
		if err := repo.Broadcast(ctx, []uuid.UUID{uid}, "Broadcast", "Pengumuman", "IN_APP"); err != nil {
			t.Fatalf("Broadcast: %v", err)
		}
		t.Cleanup(func() {
			_, _ = p.Exec(ctx, `DELETE FROM notification.user_notification WHERE user_id = $1 AND title = 'Broadcast'`, uid)
		})
		_, total, err := repo.FindByUser(ctx, uid, 10, 0)
		if err != nil {
			t.Fatalf("FindByUser: %v", err)
		}
		if total < 1 {
			t.Errorf("broadcast total = %d, want >= 1", total)
		}
	})

	t.Run("Preferences", func(t *testing.T) {
		prefs, err := repo.GetPreferences(ctx, uid)
		if err != nil {
			t.Fatalf("GetPreferences: %v", err)
		}
		if len(prefs) == 0 {
			t.Logf("no preference row yet; expected before upsert")
		}
		if err := repo.UpsertPreference(ctx, &NotificationPreference{UserID: uid, Channel: "EMAIL", Enabled: false}); err != nil {
			t.Fatalf("UpsertPreference EMAIL: %v", err)
		}
		prefs, _ = repo.GetPreferences(ctx, uid)
		found := false
		for _, pr := range prefs {
			if pr.Channel == "EMAIL" {
				found = true
				if pr.Enabled {
					t.Errorf("EMAIL should be disabled after upsert")
				}
			}
		}
		if !found {
			t.Errorf("EMAIL preference missing")
		}
		t.Cleanup(func() {
			_, _ = p.Exec(ctx, `DELETE FROM notification.notification_preferences WHERE user_id = $1`, uid)
		})
	})

	t.Run("Templates", func(t *testing.T) {
		tmpl := &NotificationTemplate{
			Code:    "welcome_email_" + uuid.New().String()[:8],
			Name:    "Welcome",
			Subject: strptr("Selamat datang di YakinLulus"),
			Body:    "Halo, terima kasih telah mendaftar!",
			Channel: "EMAIL",
		}
		if err := repo.CreateTemplate(ctx, tmpl); err != nil {
			t.Fatalf("CreateTemplate: %v", err)
		}
		t.Cleanup(func() { _, _ = p.Exec(ctx, `DELETE FROM notification.notification_template WHERE id = $1`, tmpl.ID) })

		got, err := repo.GetTemplate(ctx, tmpl.Code)
		if err != nil {
			t.Fatalf("GetTemplate: %v", err)
		}
		if got == nil || got.Subject == nil || *got.Subject != *tmpl.Subject || got.Name != "Welcome" {
			t.Errorf("template roundtrip mismatch: %+v", got)
		}

		tmpl.Name = "Welcome Updated"
		if err := repo.UpdateTemplate(ctx, tmpl); err != nil {
			t.Fatalf("UpdateTemplate: %v", err)
		}
		got, _ = repo.GetTemplate(ctx, tmpl.Code)
		if got == nil || got.Name != "Welcome Updated" {
			t.Errorf("updated template mismatch: %+v", got)
		}

		list, err := repo.ListTemplates(ctx)
		if err != nil {
			t.Fatalf("ListTemplates: %v", err)
		}
		if len(list) < 1 {
			t.Errorf("ListTemplates empty")
		}
	})
}

func strptr(s string) *string { return &s }
