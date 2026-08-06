package profile

import (
	"context"
	"os"
	"sync"
	"testing"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
)

const profileTestUserPrefix = "ylb4t4"

var (
	poolOnce   sync.Once
	poolSingle *pgxpool.Pool
	poolErr    error
)

func testPool(t *testing.T) *pgxpool.Pool {
	t.Helper()
	url := os.Getenv("DB_URL")
	if url == "" {
		t.Skip("DB_URL not set; skipping profile repository integration test")
	}
	poolOnce.Do(func() {
		cfg, err := pgxpool.ParseConfig(url)
		if err != nil {
			poolErr = err
			return
		}
		cfg.MaxConns = 4
		poolSingle, poolErr = pgxpool.NewWithConfig(context.Background(), cfg)
	})
	if poolErr != nil {
		t.Fatalf("connect: %v", poolErr)
	}
	return poolSingle
}

func seedProfileUser(t *testing.T, p *pgxpool.Pool, ctx context.Context) uuid.UUID {
	t.Helper()
	u := uuid.New()
	username := profileTestUserPrefix + "_" + u.String()[:8]
	if _, err := p.Exec(ctx, `
		INSERT INTO identity.user (id, username, email, password_hash, status, email_verified, phone_verified, created_at, updated_at)
		VALUES ($1, $2, $3, 'x', 'ACTIVE', false, false, NOW(), NOW())`,
		u, username, "p4_"+u.String()[:8]+"@example.com"); err != nil {
		t.Fatalf("seed user: %v", err)
	}
	t.Cleanup(func() { _, _ = p.Exec(ctx, `DELETE FROM identity.user WHERE id = $1`, u) })
	return u
}

// seedProfileExam creates exam -> participant -> attempt -> grading_result for the user.
func seedProfileExam(t *testing.T, p *pgxpool.Pool, ctx context.Context, studentID uuid.UUID, score float64) (examID uuid.UUID) {
	t.Helper()
	examID = uuid.New()
	if _, err := p.Exec(ctx, `
		INSERT INTO cbt.exam (id, exam_code, title, exam_type, created_at, updated_at)
		VALUES ($1, $2, 'Tryout T4', 'TRYOUT', NOW(), NOW())`,
		examID, "exam4_"+examID.String()[:8]); err != nil {
		t.Fatalf("seed exam: %v", err)
	}
	t.Cleanup(func() { _, _ = p.Exec(ctx, `DELETE FROM cbt.exam WHERE id = $1`, examID) })

	pid := uuid.New()
	if _, err := p.Exec(ctx, `
		INSERT INTO cbt.exam_participant (id, exam_id, student_id, status, created_at)
		VALUES ($1, $2, $3, 'FINISHED', NOW())`,
		pid, examID, studentID); err != nil {
		t.Fatalf("seed participant: %v", err)
	}
	t.Cleanup(func() { _, _ = p.Exec(ctx, `DELETE FROM cbt.exam_participant WHERE id = $1`, pid) })

	aid := uuid.New()
	if _, err := p.Exec(ctx, `
		INSERT INTO cbt.exam_attempt (id, participant_id, attempt_no, status, created_at, updated_at)
		VALUES ($1, $2, 1, 'SUBMITTED', NOW(), NOW())`,
		aid, pid); err != nil {
		t.Fatalf("seed attempt: %v", err)
	}
	t.Cleanup(func() { _, _ = p.Exec(ctx, `DELETE FROM cbt.exam_attempt WHERE id = $1`, aid) })

	if _, err := p.Exec(ctx, `
		INSERT INTO cbt.grading_result (attempt_id, score, correct, wrong, blank, passed)
		VALUES ($1, $2, 1, 0, 0, true)`, aid, score); err != nil {
		t.Fatalf("seed grading_result: %v", err)
	}
	return examID
}

func TestProfileRepository(t *testing.T) {
	p := testPool(t)
	r := NewRepository(p)
	ctx := context.Background()

	uid := seedProfileUser(t, p, ctx)

	t.Run("ListTargets empty then Upsert", func(t *testing.T) {
		got, err := r.ListTargets(ctx, uid)
		if err != nil {
			t.Fatalf("ListTargets empty: %v", err)
		}
		if len(got) != 0 {
			t.Fatalf("expected 0 targets, got %d", len(got))
		}
		inputs := []TargetInput{
			{Choice: 1, SchoolName: "SMAN 1 Jakarta", Major: strPtr("IPA"), PassingScoreIRT: intPtr(580)},
			{Choice: 2, SchoolName: "SMAN 3 Jakarta", Major: strPtr("IPS"), PassingScoreIRT: intPtr(560)},
		}
		if _, err := r.UpsertTargets(ctx, uid, inputs); err != nil {
			t.Fatalf("UpsertTargets: %v", err)
		}
		got, err = r.ListTargets(ctx, uid)
		if err != nil {
			t.Fatalf("ListTargets: %v", err)
		}
		if len(got) != 2 {
			t.Fatalf("expected 2 targets, got %d", len(got))
		}
		if got[0].Choice != 1 || got[0].SchoolName != "SMAN 1 Jakarta" {
			t.Errorf("choice1 mismatch: %+v", got[0])
		}
		if got[0].PassingScoreIRT == nil || *got[0].PassingScoreIRT != 580 {
			t.Errorf("passing_score_irt mismatch: %+v", got[0].PassingScoreIRT)
		}
	})

	t.Run("GetUserLevelCode from enrollment", func(t *testing.T) {
		var eduID, gradeID uuid.UUID
		_ = p.QueryRow(ctx, `SELECT id FROM academic.education_level WHERE code='SMP' LIMIT 1`).Scan(&eduID)
		if eduID == uuid.Nil {
			eduID = uuid.New()
			if _, err := p.Exec(ctx, `INSERT INTO academic.education_level (id, code, name) VALUES ($1,'SMP','SMP')`, eduID); err != nil {
				t.Fatalf("seed edu level: %v", err)
			}
			t.Cleanup(func() { _, _ = p.Exec(ctx, `DELETE FROM academic.education_level WHERE id = $1`, eduID) })
		}
		gradeID = uuid.New()
		if _, err := p.Exec(ctx, `INSERT INTO academic.grade (id, education_level_id, code, name) VALUES ($1,$2,$3,'Kelas 9')`,
			gradeID, eduID, "g9_"+gradeID.String()[:6]); err != nil {
			t.Fatalf("seed grade: %v", err)
		}
		t.Cleanup(func() { _, _ = p.Exec(ctx, `DELETE FROM academic.grade WHERE id = $1`, gradeID) })

		enID := uuid.New()
		if _, err := p.Exec(ctx, `
			INSERT INTO academic.student_enrollment (id, student_id, grade_id, status, created_at, updated_at)
			VALUES ($1, $2, $3, 'ACTIVE', NOW(), NOW())`, enID, uid, gradeID); err != nil {
			t.Fatalf("seed enrollment: %v", err)
		}
		t.Cleanup(func() { _, _ = p.Exec(ctx, `DELETE FROM academic.student_enrollment WHERE id = $1`, enID) })

		code, err := r.GetUserLevelCode(ctx, uid)
		if err != nil {
			t.Fatalf("GetUserLevelCode: %v", err)
		}
		if code != "SMP" {
			t.Errorf("level code = %q, want SMP", code)
		}
	})

	t.Run("BestCertificatePct and ListCertificates", func(t *testing.T) {
		seedProfileExam(t, p, ctx, uid, 87.5)

		pct, has, err := r.BestCertificatePct(ctx, uid)
		if err != nil {
			t.Fatalf("BestCertificatePct: %v", err)
		}
		if !has || pct != 87.5 {
			t.Errorf("BestCertificatePct = %v (has=%v), want 87.5", pct, has)
		}

		certs, err := r.ListCertificates(ctx, uid)
		if err != nil {
			t.Fatalf("ListCertificates: %v", err)
		}
		if len(certs) != 1 {
			t.Fatalf("expected 1 cert, got %d", len(certs))
		}
		c := certs[0]
		if c.Title != "Tryout T4" || c.Pct != 87.5 || c.Rank != 1 || c.Total != 1 {
			t.Errorf("cert mismatch: %+v", c)
		}
	})
}

func strPtr(s string) *string { return &s }
func intPtr(i int) *int       { return &i }

// TestProfileZeroResidue asserts no seeded-prefix users survive.
func TestProfileZeroResidue(t *testing.T) {
	p := testPool(t)
	ctx := context.Background()
	var n int
	if err := p.QueryRow(ctx,
		`SELECT COUNT(*) FROM identity.user WHERE username LIKE $1`, profileTestUserPrefix+"_%").Scan(&n); err != nil {
		t.Fatalf("residue scan: %v", err)
	}
	if n != 0 {
		t.Errorf("zero-residue violated: %d seeded users remain", n)
	}
}
