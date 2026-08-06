package ranking

import (
	"context"
	"os"
	"testing"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
)

func rankingTestPool(t *testing.T) *pgxpool.Pool {
	t.Helper()
	url := os.Getenv("DB_URL")
	if url == "" {
		t.Skip("DB_URL not set; skipping ranking repository integration test")
	}
	p, err := pgxpool.New(context.Background(), url)
	if err != nil {
		t.Fatalf("connect: %v", err)
	}
	t.Cleanup(p.Close)
	return p
}

func rankingUser(t *testing.T, p *pgxpool.Pool, ctx context.Context, prefix string) uuid.UUID {
	t.Helper()
	u := uuid.New()
	if _, err := p.Exec(ctx, `
		INSERT INTO identity.user (id, username, password_hash, status, email_verified, phone_verified, created_at, updated_at)
		VALUES ($1, $2, 'x', 'ACTIVE', false, false, NOW(), NOW())
		ON CONFLICT (id) DO NOTHING`, u, prefix+"_"+u.String()[:8]); err != nil {
		t.Fatalf("seed user: %v", err)
	}
	t.Cleanup(func() { _, _ = p.Exec(ctx, `DELETE FROM identity.user WHERE id = $1`, u) })
	return u
}

// seedRankingRows seeds a package with one question (linked to a subject) and
// one graded, completed attempt per given (user, score) pair, all within `now`.
// Cleanup is zero-residue via the exam/subject/user parent FKs (cascade).
func seedRankingRows(t *testing.T, p *pgxpool.Pool, ctx context.Context, now time.Time, pairs map[uuid.UUID]float64) (pkg uuid.UUID) {
	t.Helper()
	subj := uuid.New()
	if _, err := p.Exec(ctx, `INSERT INTO academic.subject (id, code, name) VALUES ($1,$2,$3)`,
		subj, "subj_"+subj.String()[:8], "Matematika"); err != nil {
		t.Fatalf("seed subject: %v", err)
	}
	t.Cleanup(func() { _, _ = p.Exec(ctx, `DELETE FROM academic.subject WHERE id = $1`, subj) })

	q := uuid.New()
	if _, err := p.Exec(ctx, `
		INSERT INTO question.question (id, question_code, question_type) VALUES ($1,$2,'SINGLE_CHOICE')`,
		q, "q_"+q.String()[:8]); err != nil {
		t.Fatalf("seed question: %v", err)
	}
	if _, err := p.Exec(ctx, `INSERT INTO question.question_subject (question_id, subject_id) VALUES ($1,$2)`, q, subj); err != nil {
		t.Fatalf("seed question_subject: %v", err)
	}

	exam := uuid.New()
	if _, err := p.Exec(ctx, `
		INSERT INTO cbt.exam (id, exam_code, title, exam_type) VALUES ($1,$2,$3,'TRYOUT')`,
		exam, "exm_"+exam.String()[:8], "Tryout UKA"); err != nil {
		t.Fatalf("seed exam: %v", err)
	}
	t.Cleanup(func() { _, _ = p.Exec(ctx, `DELETE FROM cbt.exam WHERE id = $1`, exam) })

	pkg = uuid.New()
	if _, err := p.Exec(ctx, `
		INSERT INTO cbt.exam_package (id, exam_id, name) VALUES ($1,$2,$3)`,
		pkg, exam, "Paket UKA"); err != nil {
		t.Fatalf("seed exam_package: %v", err)
	}
	t.Cleanup(func() { _, _ = p.Exec(ctx, `DELETE FROM cbt.exam_package WHERE id = $1`, pkg) })

	if _, err := p.Exec(ctx, `
		INSERT INTO cbt.exam_package_question (package_id, question_id, question_order, score)
		VALUES ($1,$2,0,100)`, pkg, q); err != nil {
		t.Fatalf("seed exam_package_question: %v", err)
	}

	for u, score := range pairs {
		pid := uuid.New()
		if _, err := p.Exec(ctx, `
			INSERT INTO cbt.exam_participant (id, exam_id, student_id, status) VALUES ($1,$2,$3,'REGISTER')`,
			pid, exam, u); err != nil {
			t.Fatalf("seed participant: %v", err)
		}
		aid := uuid.New()
		if _, err := p.Exec(ctx, `
			INSERT INTO cbt.exam_attempt (id, participant_id, status, finished_at, created_at, updated_at)
			VALUES ($1,$2,'COMPLETED',$3,NOW(),NOW())`, aid, pid, now); err != nil {
			t.Fatalf("seed attempt: %v", err)
		}
		if _, err := p.Exec(ctx, `INSERT INTO cbt.grading_result (attempt_id, score) VALUES ($1,$2)`, aid, score); err != nil {
			t.Fatalf("seed grading_result: %v", err)
		}
	}
	return pkg
}

func TestRankingGetLeaderboard(t *testing.T) {
	p := rankingTestPool(t)
	repo := NewRepository(p)
	svc := NewService(repo)
	ctx := context.Background()

	u1 := rankingUser(t, p, ctx, "rk_alpha")
	u2 := rankingUser(t, p, ctx, "rk_beta")

	now := time.Now().UTC()
	month := time.Date(now.Year(), now.Month(), 1, 0, 0, 0, 0, time.UTC)
	pkg := seedRankingRows(t, p, ctx, now, map[uuid.UUID]float64{u1: 95, u2: 70})

	rows, err := svc.GetLeaderboard(ctx, pkg, month, 10)
	if err != nil {
		t.Fatalf("GetLeaderboard: %v", err)
	}
	if len(rows) != 2 {
		t.Fatalf("leaderboard rows = %d, want 2", len(rows))
	}
	if rows[0].UserID != u1 {
		t.Errorf("rows[0].UserID = %v, want leader %v (%+v)", rows[0].UserID, u1, rows)
	}
	if rows[1].UserID != u2 {
		t.Errorf("rows[1].UserID = %v, want %v", rows[1].UserID, u2)
	}
	if rows[0].Rank != 1 || rows[1].Rank != 2 {
		t.Errorf("ranks = %d,%d want 1,2", rows[0].Rank, rows[1].Rank)
	}
	if rows[0].Total != 95 || rows[1].Total != 70 {
		t.Errorf("totals = %v,%v want 95,70", rows[0].Total, rows[1].Total)
	}
	if len(rows[0].SubjectScores) != 1 {
		t.Errorf("leader subject count = %d, want 1", len(rows[0].SubjectScores))
	}
	if t.Failed() {
		t.Logf("leaderboard: %+v", rows)
	}
}

func TestRankingEmptyPackage(t *testing.T) {
	p := rankingTestPool(t)
	repo := NewRepository(p)
	svc := NewService(repo)
	ctx := context.Background()

	// A package with no questions/subjects must yield an empty leaderboard.
	exam := uuid.New()
	if _, err := p.Exec(ctx, `
		INSERT INTO cbt.exam (id, exam_code, title, exam_type) VALUES ($1,$2,$3,'TRYOUT')`,
		exam, "exam_e_"+exam.String()[:8], "Empty"); err != nil {
		t.Fatalf("seed exam: %v", err)
	}
	t.Cleanup(func() { _, _ = p.Exec(ctx, `DELETE FROM cbt.exam WHERE id = $1`, exam) })
	pkg := uuid.New()
	if _, err := p.Exec(ctx, `INSERT INTO cbt.exam_package (id, exam_id, name) VALUES ($1,$2,$3)`,
		pkg, exam, "Empty Pkg"); err != nil {
		t.Fatalf("seed package: %v", err)
	}
	t.Cleanup(func() { _, _ = p.Exec(ctx, `DELETE FROM cbt.exam_package WHERE id = $1`, pkg) })

	now := time.Now().UTC()
	month := time.Date(now.Year(), now.Month(), 1, 0, 0, 0, 0, time.UTC)
	rows, err := svc.GetLeaderboard(ctx, pkg, month, 10)
	if err != nil {
		t.Fatalf("GetLeaderboard (empty): %v", err)
	}
	if len(rows) != 0 {
		t.Errorf("empty package rows = %d, want 0", len(rows))
	}
}