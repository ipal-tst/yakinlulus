package target_schools

import (
	"context"
	"errors"
	"fmt"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"

	"yakinlulus.id/backend/internal/shared"
)

// --- Models ---

type TargetSchoolScore struct {
	ID             uuid.UUID  `json:"id"`
	TargetSchoolID uuid.UUID  `json:"target_school_id"`
	AcademicYear   string     `json:"academic_year"`
	MinScore       *int       `json:"min_score,omitempty"`
	MaxScore       *int       `json:"max_score,omitempty"`
	MaxTotalScore  int        `json:"max_total_score"`
	CreatedBy      *uuid.UUID `json:"created_by,omitempty"`
	CreatedAt      time.Time  `json:"created_at"`
	UpdatedAt      time.Time  `json:"updated_at"`
}

type TrendPoint struct {
	AcademicYear string `json:"academic_year"`
	MinScore     *int   `json:"min_score,omitempty"`
	MaxScore     *int   `json:"max_score,omitempty"`
	DeltaMin     *int   `json:"delta_min,omitempty"`
	DeltaMax     *int   `json:"delta_max,omitempty"`
}

// --- DTOs ---

type SaveScoreRequest struct {
	TargetSchoolID uuid.UUID `json:"target_school_id"`
	AcademicYear   string    `json:"academic_year"`
	MinScore       *int      `json:"min_score,omitempty"`
	MaxScore       *int      `json:"max_score,omitempty"`
	MaxTotalScore  *int      `json:"max_total_score,omitempty"`
}

func validateScoreReq(req SaveScoreRequest) error {
	if req.TargetSchoolID == uuid.Nil {
		return fiber.NewError(fiber.StatusBadRequest, "target_school_id required")
	}
	if req.AcademicYear == "" {
		return fiber.NewError(fiber.StatusBadRequest, "academic_year required")
	}
	if req.MinScore != nil && *req.MinScore < 0 {
		return fiber.NewError(fiber.StatusBadRequest, "min_score cannot be negative")
	}
	if req.MaxScore != nil && *req.MaxScore < 0 {
		return fiber.NewError(fiber.StatusBadRequest, "max_score cannot be negative")
	}
	if req.MinScore != nil && req.MaxScore != nil && *req.MaxScore < *req.MinScore {
		return fiber.NewError(fiber.StatusBadRequest, "max_score cannot be less than min_score")
	}
	if req.MaxTotalScore != nil && *req.MaxTotalScore < 0 {
		return fiber.NewError(fiber.StatusBadRequest, "max_total_score cannot be negative")
	}
	total := 0
	if req.MaxTotalScore != nil {
		total = *req.MaxTotalScore
	}
	if total > 0 && req.MaxScore != nil && *req.MaxScore > total {
		return fiber.NewError(fiber.StatusBadRequest, "max_score cannot exceed max_total_score")
	}
	return nil
}

func defaultMaxTotalForLevel(level string) int {
	switch level {
	case "UNIVERSITY":
		return 700
	default:
		return 400
	}
}

// --- Repository ---

const scoreCols = `id, target_school_id, academic_year, min_score, max_score, max_total_score, created_by, created_at, updated_at`

func scanScoreRow(row pgx.Row) (*TargetSchoolScore, error) {
	s := &TargetSchoolScore{}
	var min, max *int
	var createdBy *uuid.UUID
	err := row.Scan(&s.ID, &s.TargetSchoolID, &s.AcademicYear, &min, &max, &s.MaxTotalScore,
		&createdBy, &s.CreatedAt, &s.UpdatedAt)
	if err != nil {
		return nil, err
	}
	s.MinScore, s.MaxScore = min, max
	s.CreatedBy = createdBy
	return s, nil
}

func (r *Repository) ListScores(ctx context.Context, targetSchoolID uuid.UUID, year string) ([]TargetSchoolScore, error) {
	where := "1=1"
	args := []interface{}{}
	n := 1
	if targetSchoolID != uuid.Nil {
		where += fmt.Sprintf(" AND target_school_id = $%d", n)
		args = append(args, targetSchoolID)
		n++
	}
	if year != "" {
		where += fmt.Sprintf(" AND academic_year = $%d", n)
		args = append(args, year)
	}
	rows, err := r.pool.Query(ctx, "SELECT "+scoreCols+" FROM academic.target_school_score WHERE "+where+" ORDER BY academic_year DESC", args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var out []TargetSchoolScore
	for rows.Next() {
		s, err := scanScoreRow(rows)
		if err != nil {
			return nil, err
		}
		out = append(out, *s)
	}
	return out, rows.Err()
}

func (r *Repository) GetScore(ctx context.Context, id uuid.UUID) (*TargetSchoolScore, error) {
	return scanScoreRow(r.pool.QueryRow(ctx, "SELECT "+scoreCols+" FROM academic.target_school_score WHERE id = $1", id))
}

// UpsertScore menyimpan nilai utk satu (payung, tahun); on conflict update.
func (r *Repository) UpsertScore(ctx context.Context, s *TargetSchoolScore) (*TargetSchoolScore, error) {
	err := r.pool.QueryRow(ctx,
		`INSERT INTO academic.target_school_score (target_school_id, academic_year, min_score, max_score, max_total_score, created_by)
		 VALUES ($1,$2,$3,$4,$5,$6)
		 ON CONFLICT (target_school_id, academic_year) DO UPDATE SET
		 min_score=EXCLUDED.min_score, max_score=EXCLUDED.max_score,
		 max_total_score=EXCLUDED.max_total_score, updated_at=NOW()
		 RETURNING id, created_at, updated_at`,
		s.TargetSchoolID, s.AcademicYear, s.MinScore, s.MaxScore, s.MaxTotalScore, s.CreatedBy,
	).Scan(&s.ID, &s.CreatedAt, &s.UpdatedAt)
	return s, err
}

func (r *Repository) UpdateScore(ctx context.Context, s *TargetSchoolScore) (*TargetSchoolScore, error) {
	err := r.pool.QueryRow(ctx,
		`UPDATE academic.target_school_score SET min_score=$2, max_score=$3, max_total_score=$4, updated_at=NOW()
		 WHERE id=$1 RETURNING created_at, updated_at`,
		s.ID, s.MinScore, s.MaxScore, s.MaxTotalScore,
	).Scan(&s.CreatedAt, &s.UpdatedAt)
	return s, err
}

func (r *Repository) DeleteScore(ctx context.Context, id uuid.UUID) error {
	_, err := r.pool.Exec(ctx, `DELETE FROM academic.target_school_score WHERE id=$1`, id)
	return err
}

// SyncPayungLatest menyinkronkan kolom inline payung dari nilai tahun terbaru
// agar modul siswa (profile.ResolveStudentScore) tetap akurat.
func (r *Repository) SyncPayungLatest(ctx context.Context, targetSchoolID uuid.UUID) error {
	_, err := r.pool.Exec(ctx,
		`UPDATE academic.target_school ts
		 SET min_score = latest.min_score, max_score = latest.max_score,
		     max_total_score = latest.max_total_score, academic_year = latest.academic_year,
		     updated_at = NOW()
		 FROM (
		   SELECT min_score, max_score, max_total_score, academic_year
		   FROM academic.target_school_score
		   WHERE target_school_id = $1
		   ORDER BY academic_year DESC LIMIT 1
		 ) latest
		 WHERE ts.id = $1 AND ts.deleted_at IS NULL`, targetSchoolID)
	if err != nil {
		return err
	}
	// tanpa baris score tersisa, kosongkan skor payung
	var remaining int
	if err := r.pool.QueryRow(ctx,
		`SELECT COUNT(*) FROM academic.target_school_score WHERE target_school_id=$1`, targetSchoolID).Scan(&remaining); err != nil {
		return err
	}
	if remaining == 0 {
		_, err = r.pool.Exec(ctx,
			`UPDATE academic.target_school SET min_score=NULL, max_score=NULL, max_total_score=0, academic_year=NULL, updated_at=NOW()
			 WHERE id=$1`, targetSchoolID)
	}
	return err
}

func (r *Repository) Trend(ctx context.Context, targetSchoolID uuid.UUID) ([]TrendPoint, error) {
	rows, err := r.pool.Query(ctx,
		`SELECT academic_year, min_score, max_score
		 FROM academic.target_school_score
		 WHERE target_school_id = $1
		 ORDER BY academic_year ASC`, targetSchoolID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var out []TrendPoint
	for rows.Next() {
		var p TrendPoint
		var min, max *int
		if err := rows.Scan(&p.AcademicYear, &min, &max); err != nil {
			return nil, err
		}
		p.MinScore, p.MaxScore = min, max
		out = append(out, p)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	for i := 1; i < len(out); i++ {
		if out[i].MinScore != nil && out[i-1].MinScore != nil {
			delta := *out[i].MinScore - *out[i-1].MinScore
			out[i].DeltaMin = &delta
		}
		if out[i].MaxScore != nil && out[i-1].MaxScore != nil {
			delta := *out[i].MaxScore - *out[i-1].MaxScore
			out[i].DeltaMax = &delta
		}
	}
	return out, nil
}

// --- Service ---

func (s *Service) ListScores(ctx context.Context, targetSchoolID uuid.UUID, year string) ([]TargetSchoolScore, error) {
	return s.repo.ListScores(ctx, targetSchoolID, year)
}

func (s *Service) GetScore(ctx context.Context, id uuid.UUID) (*TargetSchoolScore, error) {
	sc, err := s.repo.GetScore(ctx, id)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, fiber.NewError(404, "Score not found")
		}
		return nil, err
	}
	return sc, nil
}

func (s *Service) UpsertScore(ctx context.Context, req SaveScoreRequest, userID uuid.UUID) (*TargetSchoolScore, error) {
	if err := validateScoreReq(req); err != nil {
		return nil, err
	}
	sc := &TargetSchoolScore{
		TargetSchoolID: req.TargetSchoolID,
		AcademicYear:   req.AcademicYear,
		MinScore:       req.MinScore,
		MaxScore:       req.MaxScore,
		CreatedBy:      &userID,
	}
	if req.MaxTotalScore != nil {
		sc.MaxTotalScore = *req.MaxTotalScore
	} else {
		sc.MaxTotalScore = defaultMaxTotalForLevel(defaultScoreLevel(ctx, s.repo, req.TargetSchoolID))
	}
	sc, err := s.repo.UpsertScore(ctx, sc)
	if err != nil {
		return nil, err
	}
	if err := s.repo.SyncPayungLatest(ctx, req.TargetSchoolID); err != nil {
		return nil, err
	}
	return sc, nil
}

func defaultScoreLevel(ctx context.Context, r *Repository, id uuid.UUID) string {
	var level string
	_ = r.pool.QueryRow(ctx,
		`SELECT COALESCE(ts.level,'') FROM academic.target_school ts WHERE ts.id=$1 AND ts.deleted_at IS NULL`, id).Scan(&level)
	return level
}

func (s *Service) UpdateScore(ctx context.Context, id uuid.UUID, req SaveScoreRequest, userID uuid.UUID) (*TargetSchoolScore, error) {
	if err := validateScoreReq(req); err != nil {
		return nil, err
	}
	sc, err := s.repo.GetScore(ctx, id)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, fiber.NewError(404, "Score not found")
		}
		return nil, err
	}
	sc.MinScore = req.MinScore
	sc.MaxScore = req.MaxScore
	if req.MaxTotalScore != nil {
		sc.MaxTotalScore = *req.MaxTotalScore
	}
	sc, err = s.repo.UpdateScore(ctx, sc)
	if err != nil {
		return nil, err
	}
	if err := s.repo.SyncPayungLatest(ctx, sc.TargetSchoolID); err != nil {
		return nil, err
	}
	return sc, nil
}

func (s *Service) DeleteScore(ctx context.Context, id uuid.UUID) error {
	sc, err := s.repo.GetScore(ctx, id)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return fiber.NewError(404, "Score not found")
		}
		return err
	}
	if err := s.repo.DeleteScore(ctx, id); err != nil {
		return err
	}
	return s.repo.SyncPayungLatest(ctx, sc.TargetSchoolID)
}

func (s *Service) Trend(ctx context.Context, targetSchoolID uuid.UUID) ([]TrendPoint, error) {
	return s.repo.Trend(ctx, targetSchoolID)
}

// --- Handler ---

func (h *Handler) ListScores(c *fiber.Ctx) error {
	tsID, _ := uuid.Parse(c.Query("target_school_id", ""))
	year := c.Query("academic_year", "")
	items, err := h.svc.ListScores(c.Context(), tsID, year)
	if err != nil {
		return c.Status(500).JSON(shared.Error(shared.ErrInternal, "Failed to list scores"))
	}
	if items == nil {
		items = []TargetSchoolScore{}
	}
	return c.JSON(shared.Success(items))
}

func (h *Handler) GetScore(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(400).JSON(shared.Error(shared.ErrValidation, "Invalid score ID"))
	}
	sc, err := h.svc.GetScore(c.Context(), id)
	if err != nil {
		if fe, ok := err.(*fiber.Error); ok {
			return c.Status(fe.Code).JSON(shared.Error(shared.ErrorCode(fe.Message), fe.Message))
		}
		return c.Status(500).JSON(shared.Error(shared.ErrInternal, "Failed to get score"))
	}
	return c.JSON(shared.Success(sc))
}

func (h *Handler) CreateScore(c *fiber.Ctx) error {
	var req SaveScoreRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(shared.Error(shared.ErrValidation, "Invalid request body"))
	}
	userID, _ := uuid.Parse(c.Locals("user_id").(string))
	sc, err := h.svc.UpsertScore(c.Context(), req, userID)
	if err != nil {
		if fe, ok := err.(*fiber.Error); ok {
			return c.Status(fe.Code).JSON(shared.Error(shared.ErrorCode(fe.Message), fe.Message))
		}
		return c.Status(500).JSON(shared.Error(shared.ErrInternal, "Failed to save score"))
	}
	return c.Status(201).JSON(shared.Success(sc))
}

func (h *Handler) UpdateScore(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(400).JSON(shared.Error(shared.ErrValidation, "Invalid score ID"))
	}
	var req SaveScoreRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(shared.Error(shared.ErrValidation, "Invalid request body"))
	}
	userID, _ := uuid.Parse(c.Locals("user_id").(string))
	sc, err := h.svc.UpdateScore(c.Context(), id, req, userID)
	if err != nil {
		if fe, ok := err.(*fiber.Error); ok {
			return c.Status(fe.Code).JSON(shared.Error(shared.ErrorCode(fe.Message), fe.Message))
		}
		return c.Status(500).JSON(shared.Error(shared.ErrInternal, "Failed to update score"))
	}
	return c.JSON(shared.Success(sc))
}

func (h *Handler) DeleteScore(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(400).JSON(shared.Error(shared.ErrValidation, "Invalid score ID"))
	}
	if err := h.svc.DeleteScore(c.Context(), id); err != nil {
		if fe, ok := err.(*fiber.Error); ok {
			return c.Status(fe.Code).JSON(shared.Error(shared.ErrorCode(fe.Message), fe.Message))
		}
		return c.Status(500).JSON(shared.Error(shared.ErrInternal, "Failed to delete score"))
	}
	return c.SendStatus(204)
}

func (h *Handler) ScoreTrend(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(400).JSON(shared.Error(shared.ErrValidation, "Invalid school ID"))
	}
	items, err := h.svc.Trend(c.Context(), id)
	if err != nil {
		return c.Status(500).JSON(shared.Error(shared.ErrInternal, "Failed to compute trend"))
	}
	if items == nil {
		items = []TrendPoint{}
	}
	return c.JSON(shared.Success(fiber.Map{"items": items}))
}