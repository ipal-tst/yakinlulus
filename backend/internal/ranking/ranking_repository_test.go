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

// assertQuestionNoLeak registers a t.Cleanup that must run LAST (registered
// first, so LIFO executes it after every deleting cleanup) and fails the test if
// any seeded question.question row survives — the residue route that cascades
// from the subject/exam deletes do not cover. `questions` is captured by
// reference so it is fully populated by the time the probe runs.
func assertQuestionNoLeak(t *testing.T, p *pgxpool.Pool, ctx context.Context, questions *[]uuid.UUID) {
	t.Helper()
	t.Cleanup(func() {
		for _, q := range *questions {
			var n int
			if err := p.QueryRow(ctx, `SELECT count(*) FROM question.question WHERE id = $1`, q).Scan(&n); err != nil {
				t.Errorf("leak probe question %v: %v", q, err)
				continue
			}
			if n != 0 {
				t.Errorf("zero-residue violated: question.question row %v leaked (%d rows)", q, n)
			}
		}
	})
}

// seedRankingPackage creates a subject per entry, one question per subject, plus
// an exam + package linking those questions. Returns the package id, backing
// exam id, and the seeded question ids (parallel to subjects).
func seedRankingPackage(t *testing.T, p *pgxpool.Pool, ctx context.Context, subjects []uuid.UUID) (pkg, exam uuid.UUID, questions []uuid.UUID) {
	t.Helper()
	assertQuestionNoLeak(t, p, ctx, &questions)
	exam = uuid.New()
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

	for i, subj := range subjects {
		s := subj
		if _, err := p.Exec(ctx, `INSERT INTO academic.subject (id, code, name) VALUES ($1,$2,$3)`,
			s, "subj_"+s.String()[:8], "Matematika"); err != nil {
			t.Fatalf("seed subject: %v", err)
		}
		t.Cleanup(func() { _, _ = p.Exec(ctx, `DELETE FROM academic.subject WHERE id = $1`, s) })

		q := uuid.New()
		questions = append(questions, q)
		if _, err := p.Exec(ctx, `
			INSERT INTO question.question (id, question_code, question_type) VALUES ($1,$2,'SINGLE_CHOICE')`,
			q, "rk_q_"+q.String()[:8]); err != nil {
			t.Fatalf("seed question: %v", err)
		}
		t.Cleanup(func() { _, _ = p.Exec(ctx, `DELETE FROM question.question WHERE id = $1`, q) })
		if _, err := p.Exec(ctx, `INSERT INTO question.question_subject (question_id, subject_id) VALUES ($1,$2)`, q, s); err != nil {
			t.Fatalf("seed question_subject: %v", err)
		}
		if _, err := p.Exec(ctx, `
			INSERT INTO cbt.exam_package_question (package_id, question_id, question_order, score)
			VALUES ($1,$2,$3,100)`, pkg, q, i); err != nil {
			t.Fatalf("seed exam_package_question: %v", err)
		}
	}
	return pkg, exam, questions
}

// seedRankingAttempt registers a participant, a completed attempt and a
// grading_result whose score is the sum of the per-question grading_detail
// scores, exercising the proportional per-subject attribution path. scores must
// align with questions. Residue is handled by the exam cascade delete; the
// attempt_question + grading_detail rows cascade from the attempt.
func seedRankingAttempt(t *testing.T, p *pgxpool.Pool, ctx context.Context, exam, userID uuid.UUID, now time.Time, questions []uuid.UUID, scores []float64) {
	t.Helper()
	pid := uuid.New()
	if _, err := p.Exec(ctx, `
		INSERT INTO cbt.exam_participant (id, exam_id, student_id, status) VALUES ($1,$2,$3,'REGISTER')`,
		pid, exam, userID); err != nil {
		t.Fatalf("seed participant: %v", err)
	}
	aid := uuid.New()
	if _, err := p.Exec(ctx, `
		INSERT INTO cbt.exam_attempt (id, participant_id, status, finished_at, created_at, updated_at)
		VALUES ($1,$2,'COMPLETED',$3,NOW(),NOW())`, aid, pid, now); err != nil {
		t.Fatalf("seed attempt: %v", err)
	}
	total := 0.0
	for i, q := range questions {
		if i >= len(scores) {
			break
		}
		total += scores[i]
		aq := uuid.New()
		if _, err := p.Exec(ctx, `
			INSERT INTO cbt.attempt_question (id, attempt_id, question_id, display_order) VALUES ($1,$2,$3,$4)`,
			aq, aid, q, i); err != nil {
			t.Fatalf("seed attempt_question: %v", err)
		}
		if _, err := p.Exec(ctx, `
			INSERT INTO cbt.grading_detail (attempt_question_id, question_id, score, is_blank)
			VALUES ($1,$2,$3,false)`, aq, q, scores[i]); err != nil {
			t.Fatalf("seed grading_detail: %v", err)
		}
	}
	if _, err := p.Exec(ctx, `INSERT INTO cbt.grading_result (attempt_id, score) VALUES ($1,$2)`, aid, total); err != nil {
		t.Fatalf("seed grading_result: %v", err)
	}
}

func TestRankingGetLeaderboard(t *testing.T) {
	p := rankingTestPool(t)
	repo := NewRepository(p)
	svc := NewService(repo)
	ctx := context.Background()

	now := time.Now().UTC()
	month := time.Date(now.Year(), now.Month(), 1, 0, 0, 0, 0, time.UTC)

	u1 := rankingUser(t, p, ctx, "rk_alpha")
	u2 := rankingUser(t, p, ctx, "rk_beta")
	subj1 := uuid.New()
	pkg, exam, qs := seedRankingPackage(t, p, ctx, []uuid.UUID{subj1})

	seedRankingAttempt(t, p, ctx, exam, u1, now, qs, []float64{95})
	seedRankingAttempt(t, p, ctx, exam, u2, now, qs, []float64{70})

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
	assertFloat(t, rows[0].SubjectScores[subj1.String()], 95, "leader subject score")
	if t.Failed() {
		t.Logf("leaderboard: %+v", rows)
	}
}

// TestRankingMultiSubjectPackage exercises the regression from the review: a
// package whose exam spans multiple subjects must NOT sum the same whole-attempt
// score once per subject. The single attempt's 0-100 total is attributed
// proportionally (100/50+50 => 50 per subject) and Total stays exactly 100.
func TestRankingMultiSubjectPackage(t *testing.T) {
	p := rankingTestPool(t)
	repo := NewRepository(p)
	svc := NewService(repo)
	ctx := context.Background()

	now := time.Now().UTC()
	month := time.Date(now.Year(), now.Month(), 1, 0, 0, 0, 0, time.UTC)

	u := rankingUser(t, p, ctx, "rk_multi")
	subj1 := uuid.New()
	subj2 := uuid.New()
	pkg, exam, qs := seedRankingPackage(t, p, ctx, []uuid.UUID{subj1, subj2})

	seedRankingAttempt(t, p, ctx, exam, u, now, qs, []float64{50, 50})

	cnt, err := repo.CountPackageSubjects(ctx, pkg)
	if err != nil {
		t.Fatalf("CountPackageSubjects: %v", err)
	}
	if cnt != 2 {
		t.Fatalf("CountPackageSubjects = %d, want 2", cnt)
	}

	rows, err := svc.GetLeaderboard(ctx, pkg, month, 10)
	if err != nil {
		t.Fatalf("GetLeaderboard: %v", err)
	}
	if len(rows) != 1 {
		t.Fatalf("leaderboard rows = %d, want 1", len(rows))
	}
	row := rows[0]
	// The critical assertion: the whole-attempt score must be counted once, not
	// multiplied by the number of subjects.
	if row.Total != 100 {
		t.Errorf("Total = %v, want 100 (single whole-attempt score, not duplicated per subject)", row.Total)
	}
	if len(row.SubjectScores) != 2 {
		t.Errorf("SubjectScores count = %d, want 2", len(row.SubjectScores))
	}
	assertFloat(t, row.SubjectScores[subj1.String()], 50, "subject[0]")
	assertFloat(t, row.SubjectScores[subj2.String()], 50, "subject[1]")
	if row.Average != 50 {
		t.Errorf("Average = %v, want 50", row.Average)
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

func assertFloat(t *testing.T, got, want float64, label string) {
	t.Helper()
	if want != 0 && !eqEpsilon(got, want) {
		t.Errorf("%s = %v, want %v", label, got, want)
	}
}

func eqEpsilon(a, b float64) bool {
	d := a - b
	if d < 0 {
		d = -d
	}
	return d < 1e-6
}