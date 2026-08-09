package target_schools

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"yakinlulus.id/backend/internal/middleware"
	"yakinlulus.id/backend/internal/shared"
)

type TargetSchool struct {
	ID             uuid.UUID  `json:"id"`
	SchoolID       *uuid.UUID `json:"school_id,omitempty"`
	Name           string     `json:"name"`
	Level          string     `json:"level"`
	MinScore       *int       `json:"min_score,omitempty"`
	MaxScore       *int       `json:"max_score,omitempty"`
	MaxTotalScore  int        `json:"max_total_score"`
	Subjects       []string   `json:"subjects"`
	AcademicYear   *string    `json:"academic_year,omitempty"`
	IsActive       bool       `json:"is_active"`
	Province       string     `json:"province,omitempty"`
	City           string     `json:"city,omitempty"`
	District       string     `json:"district,omitempty"`
	EducationLevel string     `json:"education_level,omitempty"`
	CreatedAt      time.Time  `json:"created_at"`
	UpdatedAt      time.Time  `json:"updated_at"`
}

type SaveSchoolRequest struct {
	SchoolID      uuid.UUID `json:"school_id"`
	Name          string    `json:"name"`
	Level         string    `json:"level"`
	MinScore      *int      `json:"min_score,omitempty"`
	MaxScore      *int      `json:"max_score,omitempty"`
	MaxTotalScore int       `json:"max_total_score"`
	Subjects      []string  `json:"subjects"`
	AcademicYear  *string   `json:"academic_year,omitempty"`
	IsActive      *bool     `json:"is_active,omitempty"`
}

func validateSaveRequest(req SaveSchoolRequest) error {
	if req.SchoolID == uuid.Nil {
		return fiber.NewError(fiber.StatusBadRequest, "school_id required")
	}
	if req.Level != "" {
		switch req.Level {
		case "SMP", "SMA", "UNIVERSITY":
		default:
			return fiber.NewError(fiber.StatusBadRequest, "level must be SMP/SMA/UNIVERSITY")
		}
	}
	if req.MaxTotalScore < 0 {
		return fiber.NewError(fiber.StatusBadRequest, "max_total_score cannot be negative")
	}
	return nil
}

// --- Repository ---

type Repository struct{ pool *pgxpool.Pool }

func NewRepository(pool *pgxpool.Pool) *Repository { return &Repository{pool: pool} }

const schoolTable = "academic.target_school"

// joinedCols: LEFT JOIN katalog school. school_id nullable -> pointer saat scan.
const joinedCols = `ts.id, COALESCE(ts.name, s.name) AS name, ts.level, ts.min_score, ts.max_score,
	ts.max_total_score, ts.subjects, ts.academic_year, ts.is_active, ts.created_at, ts.updated_at,
	ts.school_id, COALESCE(s.province,'') AS province, COALESCE(s.city,'') AS city,
	COALESCE(s.district,'') AS district, COALESCE(s.education_level,'') AS education_level`

const joinedFrom = ` FROM academic.target_school ts
	LEFT JOIN academic.school s ON s.id = ts.school_id AND s.deleted_at IS NULL`

func scanSchool(row pgx.Row) (*TargetSchool, error) {
	var s TargetSchool
	var subjects []byte
	var min, max *int
	var year *string
	err := row.Scan(&s.ID, &s.Name, &s.Level, &min, &max, &s.MaxTotalScore, &subjects, &year, &s.IsActive, &s.CreatedAt, &s.UpdatedAt,
		&s.SchoolID, &s.Province, &s.City, &s.District, &s.EducationLevel)
	if err != nil {
		return nil, err
	}
	s.MinScore, s.MaxScore = min, max
	s.AcademicYear = year
	s.Subjects = []string{}
	if len(subjects) > 0 {
		if err := json.Unmarshal(subjects, &s.Subjects); err != nil {
			s.Subjects = []string{}
		}
	}
	return &s, nil
}

func (r *Repository) List(ctx context.Context, level, province, q string) ([]TargetSchool, error) {
	where := "ts.is_active = true AND ts.deleted_at IS NULL"
	args := []interface{}{}
	n := 1
	if level != "" {
		where += fmt.Sprintf(" AND ts.level = $%d", n)
		args = append(args, level)
		n++
	}
	if province != "" {
		where += fmt.Sprintf(" AND COALESCE(s.province,'') ILIKE $%d", n)
		args = append(args, "%"+province+"%")
		n++
	}
	if q != "" {
		where += fmt.Sprintf(" AND (COALESCE(ts.name, s.name) ILIKE $%d OR COALESCE(s.name,'') ILIKE $%d)", n, n)
		args = append(args, "%"+q+"%")
		n++
	}
	query := `SELECT ` + joinedCols + joinedFrom + ` WHERE ` + where + ` ORDER BY name`
	rows, err := r.pool.Query(ctx, query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var out []TargetSchool
	for rows.Next() {
		s, err := scanSchool(rows)
		if err != nil {
			return nil, err
		}
		out = append(out, *s)
	}
	return out, rows.Err()
}

func (r *Repository) GetByID(ctx context.Context, id uuid.UUID) (*TargetSchool, error) {
	return scanSchool(r.pool.QueryRow(ctx, `SELECT `+joinedCols+joinedFrom+` WHERE ts.id = $1 AND ts.deleted_at IS NULL`, id))
}

// resolveSchool mengambil nama + level + wilayah dari katalog.
func (r *Repository) resolveSchool(ctx context.Context, schoolID uuid.UUID) (name string, level string, province, city, district string, err error) {
	err = r.pool.QueryRow(ctx, `
		SELECT COALESCE(name,''), COALESCE(education_level,''),
		       COALESCE(province,''), COALESCE(city,''), COALESCE(district,'')
		FROM academic.school
		WHERE id = $1 AND deleted_at IS NULL AND is_active = true`, schoolID).
		Scan(&name, &level, &province, &city, &district)
	return
}

func (r *Repository) Create(ctx context.Context, req SaveSchoolRequest) (*TargetSchool, error) {
	if err := validateSaveRequest(req); err != nil {
		return nil, err
	}
	name, lvl, _, _, _, err := r.resolveSchool(ctx, req.SchoolID)
	if err != nil {
		return nil, fiber.NewError(fiber.StatusBadRequest, "school not found or inactive")
	}
	if req.Level != "" && req.Level != lvl {
		return nil, fiber.NewError(fiber.StatusBadRequest, "level mismatch: target level must match school level")
	}
	req.Name = name // nama selalu dari katalog, jangan percaya input bebas
	active := true
	if req.IsActive != nil {
		active = *req.IsActive
	}
	subjects, _ := json.Marshal(req.Subjects)
	if subjects == nil {
		subjects = []byte("[]")
	}
	var id uuid.UUID
	err = r.pool.QueryRow(ctx,
		`INSERT INTO `+schoolTable+` (school_id, name, level, min_score, max_score, max_total_score, subjects, academic_year, is_active)
		 VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING id`,
		req.SchoolID, req.Name, lvl, req.MinScore, req.MaxScore, req.MaxTotalScore, subjects, req.AcademicYear, active,
	).Scan(&id)
	if err != nil {
		return nil, err
	}
	return r.GetByID(ctx, id)
}

func (r *Repository) Update(ctx context.Context, id uuid.UUID, req SaveSchoolRequest) (*TargetSchool, error) {
	if err := validateSaveRequest(req); err != nil {
		return nil, err
	}
	name, lvl, _, _, _, err := r.resolveSchool(ctx, req.SchoolID)
	if err != nil {
		return nil, fiber.NewError(fiber.StatusBadRequest, "school not found or inactive")
	}
	if req.Level != "" && req.Level != lvl {
		return nil, fiber.NewError(fiber.StatusBadRequest, "level mismatch: target level must match school level")
	}
	req.Name = name
	subjects, _ := json.Marshal(req.Subjects)
	if subjects == nil {
		subjects = []byte("[]")
	}
	_, err = r.pool.Exec(ctx,
		`UPDATE `+schoolTable+` SET name=$2, level=$3, min_score=$4, max_score=$5,
		   max_total_score=$6, subjects=$7, academic_year=$8,
		   is_active=COALESCE($9, is_active), updated_at=NOW()
		 WHERE id=$1`,
		id, req.Name, lvl, req.MinScore, req.MaxScore, req.MaxTotalScore, subjects, req.AcademicYear, req.IsActive)
	if err != nil {
		return nil, err
	}
	return r.GetByID(ctx, id)
}

func (r *Repository) Delete(ctx context.Context, id uuid.UUID) error {
	_, err := r.pool.Exec(ctx, `DELETE FROM `+schoolTable+` WHERE id = $1`, id)
	return err
}

// --- Service ---

type Service struct{ repo *Repository }

func NewService(repo *Repository) *Service { return &Service{repo: repo} }

func (s *Service) ListSchools(ctx context.Context, level, province, q string) ([]TargetSchool, error) {
	return s.repo.List(ctx, level, province, q)
}
func (s *Service) GetSchool(ctx context.Context, id uuid.UUID) (*TargetSchool, error) {
	return s.repo.GetByID(ctx, id)
}
func (s *Service) CreateSchool(ctx context.Context, req SaveSchoolRequest) (*TargetSchool, error) {
	if err := validateSaveRequest(req); err != nil {
		return nil, err
	}
	return s.repo.Create(ctx, req)
}
func (s *Service) UpdateSchool(ctx context.Context, id uuid.UUID, req SaveSchoolRequest) (*TargetSchool, error) {
	if err := validateSaveRequest(req); err != nil {
		return nil, err
	}
	return s.repo.Update(ctx, id, req)
}
func (s *Service) DeleteSchool(ctx context.Context, id uuid.UUID) error {
	return s.repo.Delete(ctx, id)
}

// --- Handler ---

type Handler struct {
	svc  *Service
	auth string
}

func NewHandler(svc *Service, jwtSecret string) *Handler { return &Handler{svc: svc, auth: jwtSecret} }

func (h *Handler) RegisterRoutes(router fiber.Router) {
	authM := middleware.RequireAuth(h.auth)
	write := middleware.RequireRole("SUPER_ADMIN", "STAFF")

	r := router.Group("/target-schools", authM)
	r.Get("/", h.List)
	r.Get("/:id", write, h.Get)
	r.Post("/", write, h.Create)
	r.Put("/:id", write, h.Update)
	r.Delete("/:id", write, h.Delete)
}

func (h *Handler) List(c *fiber.Ctx) error {
	schools, err := h.svc.ListSchools(c.Context(), c.Query("level"), c.Query("province"), c.Query("q"))
	if err != nil {
		return c.Status(500).JSON(shared.Error(shared.ErrInternal, "Failed to list target schools"))
	}
	if schools == nil {
		schools = []TargetSchool{}
	}
	return c.JSON(shared.Success(schools))
}

func (h *Handler) Get(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(400).JSON(shared.Error(shared.ErrValidation, "Invalid school ID"))
	}
	s, err := h.svc.GetSchool(c.Context(), id)
	if err != nil {
		if err == pgx.ErrNoRows {
			return c.Status(404).JSON(shared.Error(shared.ErrNotFound, "School not found"))
		}
		return c.Status(500).JSON(shared.Error(shared.ErrInternal, "Failed to get school"))
	}
	return c.JSON(shared.Success(s))
}

func (h *Handler) Create(c *fiber.Ctx) error {
	var req SaveSchoolRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(shared.Error(shared.ErrValidation, "Invalid request body"))
	}
	s, err := h.svc.CreateSchool(c.Context(), req)
	if err != nil {
		if e, ok := err.(*fiber.Error); ok {
			return c.Status(e.Code).JSON(shared.Error(shared.ErrorCode(e.Message), e.Message))
		}
		return c.Status(500).JSON(shared.Error(shared.ErrInternal, "Failed to create school"))
	}
	return c.Status(201).JSON(shared.Success(s))
}

func (h *Handler) Update(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(400).JSON(shared.Error(shared.ErrValidation, "Invalid school ID"))
	}
	var req SaveSchoolRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(shared.Error(shared.ErrValidation, "Invalid request body"))
	}
	s, err := h.svc.UpdateSchool(c.Context(), id, req)
	if err != nil {
		if e, ok := err.(*fiber.Error); ok {
			return c.Status(e.Code).JSON(shared.Error(shared.ErrorCode(e.Message), e.Message))
		}
		return c.Status(500).JSON(shared.Error(shared.ErrInternal, "Failed to update school"))
	}
	return c.JSON(shared.Success(s))
}

func (h *Handler) Delete(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(400).JSON(shared.Error(shared.ErrValidation, "Invalid school ID"))
	}
	if err := h.svc.DeleteSchool(c.Context(), id); err != nil {
		return c.Status(500).JSON(shared.Error(shared.ErrInternal, "Failed to delete school"))
	}
	return c.JSON(shared.Success(map[string]string{"status": "deleted"}))
}