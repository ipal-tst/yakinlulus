package ranking

import (
	"context"
	"fmt"
	"sort"
	"strings"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"

	"yakinlulus.id/backend/internal/middleware"
	"yakinlulus.id/backend/internal/shared"
)

// ---- Models ----

type RankingRow struct {
	Rank          int                `json:"rank"`
	UserID        uuid.UUID          `json:"user_id"`
	FullName      string             `json:"full_name"`
	SchoolName    string             `json:"school_name"`
	SubjectScores map[string]float64 `json:"subject_scores"`
	Total         float64            `json:"total"`
	Average       float64            `json:"average"`
}

type rawScore struct {
	UserID     uuid.UUID
	FullName   string
	SchoolName string
	SubjectID  string
	Best       float64
}

// parseMonth parses "YYYY-MM" into the first instant of that month (UTC).
func parseMonth(s string) (time.Time, error) {
	parts := strings.Split(strings.TrimSpace(s), "-")
	if len(parts) != 2 {
		return time.Time{}, fmt.Errorf("invalid month format")
	}
	var year, month int
	if _, err := fmt.Sscanf(parts[0], "%d", &year); err != nil {
		return time.Time{}, fmt.Errorf("invalid year")
	}
	if _, err := fmt.Sscanf(parts[1], "%d", &month); err != nil {
		return time.Time{}, fmt.Errorf("invalid month")
	}
	if year < 2000 || year > 2100 || month < 1 || month > 12 {
		return time.Time{}, fmt.Errorf("month out of range")
	}
	return time.Date(year, time.Month(month), 1, 0, 0, 0, 0, time.UTC), nil
}

// buildRanking aggregates best score per subject per user, then sorts and ranks.
func buildRanking(raw []rawScore, subjectCount int) []RankingRow {
	type acc struct {
		scores map[string]float64
		row    RankingRow
	}
	byUser := map[uuid.UUID]*acc{}
	for _, r := range raw {
		a, ok := byUser[r.UserID]
		if !ok {
			a = &acc{scores: map[string]float64{}}
			a.row = RankingRow{UserID: r.UserID, FullName: r.FullName, SchoolName: r.SchoolName, SubjectScores: map[string]float64{}}
			byUser[r.UserID] = a
		}
		if r.Best > a.scores[r.SubjectID] {
			a.scores[r.SubjectID] = r.Best
			a.row.SubjectScores[r.SubjectID] = r.Best
		}
	}

	rows := make([]RankingRow, 0, len(byUser))
	for _, a := range byUser {
		total := 0.0
		for _, v := range a.row.SubjectScores {
			total += v
		}
		a.row.Total = total
		if subjectCount > 0 {
			a.row.Average = round1(total / float64(subjectCount))
		}
		rows = append(rows, a.row)
	}

	sort.SliceStable(rows, func(i, j int) bool {
		if rows[i].Total != rows[j].Total {
			return rows[i].Total > rows[j].Total
		}
		if rows[i].Average != rows[j].Average {
			return rows[i].Average > rows[j].Average
		}
		return strings.ToLower(rows[i].FullName) < strings.ToLower(rows[j].FullName)
	})

	for i := range rows {
		rows[i].Rank = i + 1
	}
	return rows
}

func round1(v float64) float64 {
	return float64(int(v*10+0.5)) / 10
}

// ---- Repository ----

type Repository struct {
	pool *pgxpool.Pool
}

func NewRepository(pool *pgxpool.Pool) *Repository {
	return &Repository{pool: pool}
}

func (r *Repository) CountPackageSubjects(ctx context.Context, packageID uuid.UUID) (int, error) {
	var n int
	err := r.pool.QueryRow(ctx,
		`SELECT COUNT(DISTINCT qs.subject_id)
		 FROM cbt.exam_package ep
		 JOIN cbt.exam_package_question epq ON epq.package_id = ep.id
		 JOIN question.question_subject qs ON qs.question_id = epq.question_id
		 WHERE ep.id = $1`, packageID).Scan(&n)
	return n, err
}

func (r *Repository) FetchRawScores(ctx context.Context, packageID uuid.UUID, from, to time.Time) ([]rawScore, error) {
	rows, err := r.pool.Query(ctx,
		`SELECT p.student_id,
		        COALESCE(up.full_name, l.username),
		        COALESCE(sc.name, ''),
		        qs.subject_id::text,
		        gr.score::float8
		 FROM cbt.exam_package ep
		 JOIN cbt.exam_package_question epq ON epq.package_id = ep.id
		 JOIN question.question_subject qs ON qs.question_id = epq.question_id
		 JOIN cbt.exam_participant p ON p.exam_id = ep.exam_id
		 JOIN cbt.exam_attempt a ON a.participant_id = p.id
		 JOIN cbt.grading_result gr ON gr.attempt_id = a.id
		 JOIN identity.user l ON l.id = p.student_id
		 LEFT JOIN identity.user_profile up ON up.user_id = l.id
		 LEFT JOIN academic.student_enrollment se ON se.student_id = l.id AND se.status = 'ACTIVE'
		 LEFT JOIN academic.school sc ON sc.id = se.school_id
		 WHERE ep.id = $1
		   AND a.status IN ('SUBMITTED', 'GRADING', 'COMPLETED')
		   AND a.finished_at >= $2 AND a.finished_at < $3`,
		packageID, from, to)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var out []rawScore
	for rows.Next() {
		var rs rawScore
		var best float64
		if err := rows.Scan(&rs.UserID, &rs.FullName, &rs.SchoolName, &rs.SubjectID, &best); err != nil {
			return nil, err
		}
		rs.Best = best
		out = append(out, rs)
	}
	return out, rows.Err()
}

// ---- Service ----

type Service struct {
	repo *Repository
}

func NewService(repo *Repository) *Service {
	return &Service{repo: repo}
}

func (s *Service) GetLeaderboard(ctx context.Context, packageID uuid.UUID, month time.Time, limit int) ([]RankingRow, error) {
	subjectCount, err := s.repo.CountPackageSubjects(ctx, packageID)
	if err != nil {
		return nil, err
	}
	if subjectCount == 0 {
		return []RankingRow{}, nil
	}
	from := month
	to := month.AddDate(0, 1, 0)
	raw, err := s.repo.FetchRawScores(ctx, packageID, from, to)
	if err != nil {
		return nil, err
	}
	rows := buildRanking(raw, subjectCount)
	if len(rows) > limit {
		rows = rows[:limit]
	}
	return rows, nil
}

// ---- Handler ----

type Handler struct {
	svc  *Service
	auth string
}

func NewHandler(svc *Service, secret string) *Handler {
	return &Handler{svc: svc, auth: secret}
}

func (h *Handler) RegisterRoutes(router fiber.Router) {
	router.Get("/leaderboard", middleware.RequireAuth(h.auth), h.Get)
}

// resolveMonth returns the month-start boundary for a query. Empty query
// defaults to the current month (UTC). Otherwise "YYYY-MM" is parsed.
func resolveMonth(q string, now time.Time) (time.Time, error) {
	if q == "" {
		return time.Date(now.Year(), now.Month(), 1, 0, 0, 0, 0, time.UTC), nil
	}
	return parseMonth(q)
}

func (h *Handler) Get(c *fiber.Ctx) error {
	packageID, err := uuid.Parse(c.Query("package_id"))
	if err != nil {
		return c.Status(400).JSON(shared.Error(shared.ErrValidation, "package_id is required and must be a valid UUID"))
	}

	month, perr := resolveMonth(c.Query("month"), time.Now().UTC())
	if perr != nil {
		return c.Status(400).JSON(shared.Error(shared.ErrValidation, "month must be YYYY-MM"))
	}

	limit := c.QueryInt("limit", 50)
	if limit < 1 || limit > 100 {
		limit = 50
	}

	rows, err := h.svc.GetLeaderboard(c.Context(), packageID, month, limit)
	if err != nil {
		return c.Status(500).JSON(shared.Error(shared.ErrInternal, "Failed to load leaderboard"))
	}
	if rows == nil {
		rows = []RankingRow{}
	}
	return c.JSON(shared.Success(rows))
}
