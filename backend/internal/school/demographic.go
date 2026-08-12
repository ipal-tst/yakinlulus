package school

import (
	"context"
	"encoding/json"
	"errors"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"

	"yakinlulus.id/backend/internal/shared"
)

// --- Models ---

type SchoolDemographic struct {
	ID             uuid.UUID      `json:"id"`
	SchoolID       uuid.UUID      `json:"school_id"`
	AcademicYear   string         `json:"academic_year"`
	TotalStudents  int            `json:"total_students"`
	TotalRombel    int            `json:"total_rombel"`
	GradeBreakdown map[string]int `json:"grade_breakdown"`
	CreatedAt      time.Time      `json:"created_at"`
	UpdatedAt      time.Time      `json:"updated_at"`
}

// --- DTOs ---

type DemographicReq struct {
	SchoolID       uuid.UUID      `json:"school_id"`
	AcademicYear   string         `json:"academic_year"`
	TotalStudents  *int           `json:"total_students,omitempty"`
	TotalRombel    *int           `json:"total_rombel,omitempty"`
	GradeBreakdown map[string]int `json:"grade_breakdown,omitempty"`
}

// --- Repository ---

func scanDemographicRow(row pgx.Row) (*SchoolDemographic, error) {
	d := &SchoolDemographic{}
	var gb []byte
	if err := row.Scan(&d.ID, &d.SchoolID, &d.AcademicYear, &d.TotalStudents, &d.TotalRombel,
		&gb, &d.CreatedAt, &d.UpdatedAt); err != nil {
		return nil, err
	}
	d.GradeBreakdown = map[string]int{}
	if len(gb) > 0 {
		if err := json.Unmarshal(gb, &d.GradeBreakdown); err != nil {
			return nil, err
		}
	}
	return d, nil
}

func (r *Repository) ListDemographics(ctx context.Context, schoolID uuid.UUID, year string) ([]SchoolDemographic, error) {
	var where string
	var args []interface{}
	if schoolID != uuid.Nil {
		where += " WHERE school_id = $1"
		args = append(args, schoolID)
		if year != "" {
			where += " AND academic_year = $2"
			args = append(args, year)
		}
	} else if year != "" {
		where += " WHERE academic_year = $1"
		args = append(args, year)
	}
	rows, err := r.pool.Query(ctx, "SELECT id, school_id, academic_year, total_students, total_rombel, grade_breakdown, created_at, updated_at FROM academic.school_demographic"+where+" ORDER BY academic_year DESC", args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var out []SchoolDemographic
	for rows.Next() {
		d, err := scanDemographicRow(rows)
		if err != nil {
			return nil, err
		}
		out = append(out, *d)
	}
	return out, rows.Err()
}

func (r *Repository) GetDemographic(ctx context.Context, id uuid.UUID) (*SchoolDemographic, error) {
	return scanDemographicRow(r.pool.QueryRow(ctx,
		`SELECT id, school_id, academic_year, total_students, total_rombel, grade_breakdown, created_at, updated_at
		 FROM academic.school_demographic WHERE id = $1`, id))
}

func (r *Repository) UpsertDemographic(ctx context.Context, d *SchoolDemographic) (*SchoolDemographic, error) {
	gb, _ := json.Marshal(d.GradeBreakdown)
	if gb == nil {
		gb = []byte("{}")
	}
	err := r.pool.QueryRow(ctx,
		`INSERT INTO academic.school_demographic (school_id, academic_year, total_students, total_rombel, grade_breakdown)
		 VALUES ($1,$2,$3,$4,$5)
		 ON CONFLICT (school_id, academic_year) DO UPDATE SET
		 total_students=EXCLUDED.total_students, total_rombel=EXCLUDED.total_rombel,
		 grade_breakdown=EXCLUDED.grade_breakdown, updated_at=NOW()
		 RETURNING id, created_at, updated_at`,
		d.SchoolID, d.AcademicYear, d.TotalStudents, d.TotalRombel, gb,
	).Scan(&d.ID, &d.CreatedAt, &d.UpdatedAt)
	return d, err
}

func (r *Repository) UpdateDemographic(ctx context.Context, d *SchoolDemographic) (*SchoolDemographic, error) {
	gb, _ := json.Marshal(d.GradeBreakdown)
	if gb == nil {
		gb = []byte("{}")
	}
	err := r.pool.QueryRow(ctx,
		`UPDATE academic.school_demographic SET total_students=$1, total_rombel=$2, grade_breakdown=$3, updated_at=NOW()
		 WHERE id=$4 RETURNING id, created_at, updated_at`,
		d.TotalStudents, d.TotalRombel, gb, d.ID,
	).Scan(&d.ID, &d.CreatedAt, &d.UpdatedAt)
	return d, err
}

func (r *Repository) DeleteDemographic(ctx context.Context, id uuid.UUID) error {
	_, err := r.pool.Exec(ctx, `DELETE FROM academic.school_demographic WHERE id=$1`, id)
	return err
}

// --- Service ---

func (s *Service) ListDemographics(ctx context.Context, schoolID uuid.UUID, year string) ([]SchoolDemographic, error) {
	return s.repo.ListDemographics(ctx, schoolID, year)
}

func (s *Service) GetDemographic(ctx context.Context, id uuid.UUID) (*SchoolDemographic, error) {
	d, err := s.repo.GetDemographic(ctx, id)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, fiber.NewError(404, "Demographic not found")
		}
		return nil, err
	}
	return d, nil
}

func (s *Service) UpsertDemographic(ctx context.Context, req DemographicReq) (*SchoolDemographic, error) {
	if req.SchoolID == uuid.Nil {
		return nil, fiber.NewError(400, "school_id required")
	}
	if req.AcademicYear == "" {
		return nil, fiber.NewError(400, "academic_year required")
	}
	if (req.TotalStudents != nil && *req.TotalStudents < 0) || (req.TotalRombel != nil && *req.TotalRombel < 0) {
		return nil, fiber.NewError(400, "total_students and total_rombel cannot be negative")
	}
	d := &SchoolDemographic{
		SchoolID:       req.SchoolID,
		AcademicYear:   req.AcademicYear,
		GradeBreakdown: req.GradeBreakdown,
	}
	if req.TotalStudents != nil {
		d.TotalStudents = *req.TotalStudents
	}
	if req.TotalRombel != nil {
		d.TotalRombel = *req.TotalRombel
	}
	return s.repo.UpsertDemographic(ctx, d)
}

func (s *Service) UpdateDemographic(ctx context.Context, id uuid.UUID, req DemographicReq) (*SchoolDemographic, error) {
	d, err := s.repo.GetDemographic(ctx, id)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, fiber.NewError(404, "Demographic not found")
		}
		return nil, err
	}
	if req.TotalStudents != nil {
		if *req.TotalStudents < 0 {
			return nil, fiber.NewError(400, "total_students cannot be negative")
		}
		d.TotalStudents = *req.TotalStudents
	}
	if req.TotalRombel != nil {
		if *req.TotalRombel < 0 {
			return nil, fiber.NewError(400, "total_rombel cannot be negative")
		}
		d.TotalRombel = *req.TotalRombel
	}
	if req.GradeBreakdown != nil {
		d.GradeBreakdown = req.GradeBreakdown
	}
	return s.repo.UpdateDemographic(ctx, d)
}

func (s *Service) DeleteDemographic(ctx context.Context, id uuid.UUID) error {
	return s.repo.DeleteDemographic(ctx, id)
}

// --- Handler ---

func (h *Handler) ListDemographics(c *fiber.Ctx) error {
	schoolID, _ := uuid.Parse(c.Query("school_id", ""))
	year := c.Query("academic_year", "")
	items, err := h.svc.ListDemographics(c.Context(), schoolID, year)
	if err != nil {
		return c.Status(500).JSON(shared.Error(shared.ErrInternal, "Failed to list demographics"))
	}
	return c.JSON(shared.Success(items))
}

func (h *Handler) GetDemographic(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(400).JSON(shared.Error(shared.ErrValidation, "Invalid demographic ID"))
	}
	d, err := h.svc.GetDemographic(c.Context(), id)
	if err != nil {
		if fe, ok := err.(*fiber.Error); ok {
			return c.Status(fe.Code).JSON(shared.Error(shared.ErrorCode(fe.Message), fe.Message))
		}
		return c.Status(500).JSON(shared.Error(shared.ErrInternal, "Failed to get demographic"))
	}
	return c.JSON(shared.Success(d))
}

func (h *Handler) CreateDemographic(c *fiber.Ctx) error {
	var req DemographicReq
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(shared.Error(shared.ErrValidation, "Invalid request body"))
	}
	d, err := h.svc.UpsertDemographic(c.Context(), req)
	if err != nil {
		if fe, ok := err.(*fiber.Error); ok {
			return c.Status(fe.Code).JSON(shared.Error(shared.ErrorCode(fe.Message), fe.Message))
		}
		return c.Status(500).JSON(shared.Error(shared.ErrInternal, "Failed to save demographic"))
	}
	return c.Status(201).JSON(shared.Success(d))
}

func (h *Handler) UpdateDemographic(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(400).JSON(shared.Error(shared.ErrValidation, "Invalid demographic ID"))
	}
	var req DemographicReq
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(shared.Error(shared.ErrValidation, "Invalid request body"))
	}
	d, err := h.svc.UpdateDemographic(c.Context(), id, req)
	if err != nil {
		if fe, ok := err.(*fiber.Error); ok {
			return c.Status(fe.Code).JSON(shared.Error(shared.ErrorCode(fe.Message), fe.Message))
		}
		return c.Status(500).JSON(shared.Error(shared.ErrInternal, "Failed to update demographic"))
	}
	return c.JSON(shared.Success(d))
}

func (h *Handler) DeleteDemographic(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(400).JSON(shared.Error(shared.ErrValidation, "Invalid demographic ID"))
	}
	if err := h.svc.DeleteDemographic(c.Context(), id); err != nil {
		return c.Status(500).JSON(shared.Error(shared.ErrInternal, "Failed to delete demographic"))
	}
	return c.SendStatus(204)
}