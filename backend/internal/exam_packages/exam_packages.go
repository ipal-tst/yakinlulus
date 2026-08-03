package exam_packages

import (
	"context"
	"errors"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"yakinlulus.id/backend/internal/middleware"
	"yakinlulus.id/backend/internal/shared"
)

// ---- Models ----

type ExamPackage struct {
	ID             uuid.UUID  `json:"id"`
	Code           string     `json:"code"`
	Name           string     `json:"name"`
	EducationLevel string     `json:"education_level"`
	GradeID        *uuid.UUID `json:"grade_id,omitempty"`
	IsActive       bool       `json:"is_active"`
	CreatedAt      time.Time  `json:"created_at"`
	UpdatedAt      time.Time  `json:"updated_at"`
}

type PackageExam struct {
	ExamContentID uuid.UUID `json:"exam_content_id"`
	SubjectID     uuid.UUID `json:"subject_id"`
	SubjectName   string    `json:"subject_name"`
	DisplayOrder  int       `json:"display_order"`
}

type SavePackageRequest struct {
	Code           string `json:"code"`
	Name           string `json:"name"`
	EducationLevel string `json:"education_level"`
	GradeID        *string `json:"grade_id,omitempty"`
	IsActive       *bool   `json:"is_active,omitempty"`
}

type LinkExamRequest struct {
	ExamContentID string `json:"exam_content_id"`
	SubjectID     string `json:"subject_id"`
	DisplayOrder  int    `json:"display_order"`
}

func validateSaveRequest(req SavePackageRequest) error {
	if req.Code == "" {
		return fiber.NewError(fiber.StatusBadRequest, "code required")
	}
	if req.Name == "" {
		return fiber.NewError(fiber.StatusBadRequest, "name required")
	}
	switch req.EducationLevel {
	case "SD", "SMP", "SMA", "UNIVERSITY":
	default:
		return fiber.NewError(fiber.StatusBadRequest, "education_level must be SD/SMP/SMA/UNIVERSITY")
	}
	if req.GradeID != nil && *req.GradeID != "" {
		if _, err := uuid.Parse(*req.GradeID); err != nil {
			return fiber.NewError(fiber.StatusBadRequest, "invalid grade_id")
		}
	}
	return nil
}

func validateLinkRequest(req LinkExamRequest) error {
	if _, err := uuid.Parse(req.ExamContentID); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "invalid exam_content_id")
	}
	if _, err := uuid.Parse(req.SubjectID); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "invalid subject_id")
	}
	return nil
}

// ---- Repository ----

type Repository struct {
	pool *pgxpool.Pool
}

func NewRepository(pool *pgxpool.Pool) *Repository {
	return &Repository{pool: pool}
}

const pkgCols = `id, code, name, education_level, grade_id, is_active, created_at, updated_at`

func scanPackage(row pgx.Row) (*ExamPackage, error) {
	var p ExamPackage
	var gradeID *uuid.UUID
	err := row.Scan(&p.ID, &p.Code, &p.Name, &p.EducationLevel, &gradeID, &p.IsActive, &p.CreatedAt, &p.UpdatedAt)
	if err != nil {
		return nil, err
	}
	p.GradeID = gradeID
	return &p, nil
}

func (r *Repository) List(ctx context.Context, level string) ([]ExamPackage, error) {
	query := `SELECT ` + pkgCols + ` FROM exam_packages`
	args := []interface{}{}
	if level != "" {
		query += ` WHERE education_level = $1`
		args = append(args, level)
	}
	query += ` ORDER BY name`
	rows, err := r.pool.Query(ctx, query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var out []ExamPackage
	for rows.Next() {
		p, err := scanPackage(rows)
		if err != nil {
			return nil, err
		}
		out = append(out, *p)
	}
	return out, rows.Err()
}

func (r *Repository) GetByID(ctx context.Context, id uuid.UUID) (*ExamPackage, error) {
	return scanPackage(r.pool.QueryRow(ctx, `SELECT `+pkgCols+` FROM exam_packages WHERE id = $1`, id))
}

func (r *Repository) Create(ctx context.Context, req SavePackageRequest) (*ExamPackage, error) {
	active := true
	if req.IsActive != nil {
		active = *req.IsActive
	}
	var gradeID *uuid.UUID
	if req.GradeID != nil && *req.GradeID != "" {
		if id, err := uuid.Parse(*req.GradeID); err == nil {
			gradeID = &id
		}
	}
	var id uuid.UUID
	err := r.pool.QueryRow(ctx,
		`INSERT INTO exam_packages (code, name, education_level, grade_id, is_active)
		 VALUES ($1,$2,$3,$4,$5) RETURNING id`,
		req.Code, req.Name, req.EducationLevel, gradeID, active).Scan(&id)
	if err != nil {
		return nil, err
	}
	return r.GetByID(ctx, id)
}

func (r *Repository) Update(ctx context.Context, id uuid.UUID, req SavePackageRequest) (*ExamPackage, error) {
	var gradeID *uuid.UUID
	if req.GradeID != nil && *req.GradeID != "" {
		if gid, err := uuid.Parse(*req.GradeID); err == nil {
			gradeID = &gid
		}
	}
	tag, err := r.pool.Exec(ctx,
		`UPDATE exam_packages SET code=$2, name=$3, education_level=$4, grade_id=$5,
		   is_active=COALESCE($6, is_active), updated_at=NOW() WHERE id=$1`,
		id, req.Code, req.Name, req.EducationLevel, gradeID, req.IsActive)
	if err != nil {
		return nil, err
	}
	if tag.RowsAffected() == 0 {
		return nil, pgx.ErrNoRows
	}
	return r.GetByID(ctx, id)
}

func (r *Repository) Delete(ctx context.Context, id uuid.UUID) error {
	tag, err := r.pool.Exec(ctx, `DELETE FROM exam_packages WHERE id = $1`, id)
	if err != nil {
		return err
	}
	if tag.RowsAffected() == 0 {
		return pgx.ErrNoRows
	}
	return nil
}

func (r *Repository) ListExams(ctx context.Context, packageID uuid.UUID) ([]PackageExam, error) {
	rows, err := r.pool.Query(ctx,
		`SELECT epe.exam_content_id, epe.subject_id, COALESCE(s.name, ''), epe.display_order
		 FROM exam_package_exams epe
		 LEFT JOIN subjects s ON s.id = epe.subject_id
		 WHERE epe.package_id = $1
		 ORDER BY epe.display_order`, packageID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var out []PackageExam
	for rows.Next() {
		var pe PackageExam
		if err := rows.Scan(&pe.ExamContentID, &pe.SubjectID, &pe.SubjectName, &pe.DisplayOrder); err != nil {
			return nil, err
		}
		out = append(out, pe)
	}
	return out, rows.Err()
}

func (r *Repository) LinkExam(ctx context.Context, packageID uuid.UUID, req LinkExamRequest) error {
	examID, _ := uuid.Parse(req.ExamContentID)
	subjectID, _ := uuid.Parse(req.SubjectID)
	_, err := r.pool.Exec(ctx,
		`INSERT INTO exam_package_exams (package_id, exam_content_id, subject_id, display_order)
		 VALUES ($1,$2,$3,$4)
		 ON CONFLICT (package_id, exam_content_id) DO UPDATE SET subject_id = EXCLUDED.subject_id, display_order = EXCLUDED.display_order`,
		packageID, examID, subjectID, req.DisplayOrder)
	return err
}

func (r *Repository) UnlinkExam(ctx context.Context, packageID, examContentID uuid.UUID) error {
	_, err := r.pool.Exec(ctx,
		`DELETE FROM exam_package_exams WHERE package_id = $1 AND exam_content_id = $2`,
		packageID, examContentID)
	return err
}

// ---- Service ----

type Service struct {
	repo *Repository
}

func NewService(repo *Repository) *Service {
	return &Service{repo: repo}
}

func (s *Service) List(ctx context.Context, level string) ([]ExamPackage, error) {
	return s.repo.List(ctx, level)
}
func (s *Service) Get(ctx context.Context, id uuid.UUID) (*ExamPackage, error) {
	return s.repo.GetByID(ctx, id)
}
func (s *Service) Create(ctx context.Context, req SavePackageRequest) (*ExamPackage, error) {
	if err := validateSaveRequest(req); err != nil {
		return nil, err
	}
	return s.repo.Create(ctx, req)
}
func (s *Service) Update(ctx context.Context, id uuid.UUID, req SavePackageRequest) (*ExamPackage, error) {
	if err := validateSaveRequest(req); err != nil {
		return nil, err
	}
	return s.repo.Update(ctx, id, req)
}
func (s *Service) Delete(ctx context.Context, id uuid.UUID) error {
	return s.repo.Delete(ctx, id)
}
func (s *Service) ListExams(ctx context.Context, packageID uuid.UUID) ([]PackageExam, error) {
	return s.repo.ListExams(ctx, packageID)
}
func (s *Service) LinkExam(ctx context.Context, packageID uuid.UUID, req LinkExamRequest) error {
	if err := validateLinkRequest(req); err != nil {
		return err
	}
	return s.repo.LinkExam(ctx, packageID, req)
}
func (s *Service) UnlinkExam(ctx context.Context, packageID, examContentID uuid.UUID) error {
	return s.repo.UnlinkExam(ctx, packageID, examContentID)
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
	authM := middleware.RequireAuth(h.auth)
	write := middleware.RequireRole("ADMIN", "TEACHER")

	r := router.Group("/exam-packages", authM)
	r.Get("/", h.List)
	r.Post("/", write, h.Create)
	r.Put("/:id", write, h.Update)
	r.Delete("/:id", write, h.Delete)
	r.Get("/:id/exams", h.ListExams)
	r.Post("/:id/exams", write, h.LinkExam)
	r.Delete("/:id/exams/:examContentId", write, h.UnlinkExam)
}

func (h *Handler) parseID(c *fiber.Ctx) (uuid.UUID, error) {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return uuid.Nil, fiber.NewError(fiber.StatusBadRequest, "Invalid package ID")
	}
	return id, nil
}

func (h *Handler) List(c *fiber.Ctx) error {
	items, err := h.svc.List(c.Context(), c.Query("education_level"))
	if err != nil {
		return c.Status(500).JSON(shared.Error(shared.ErrInternal, "Failed to list exam packages"))
	}
	if items == nil {
		items = []ExamPackage{}
	}
	return c.JSON(shared.Success(items))
}

func (h *Handler) Create(c *fiber.Ctx) error {
	var req SavePackageRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(shared.Error(shared.ErrValidation, "Invalid request body"))
	}
	p, err := h.svc.Create(c.Context(), req)
	if err != nil {
		if e, ok := err.(*fiber.Error); ok {
			return c.Status(e.Code).JSON(shared.Error(shared.ErrorCode(e.Message), e.Message))
		}
		return c.Status(500).JSON(shared.Error(shared.ErrInternal, "Failed to create exam package"))
	}
	return c.Status(201).JSON(shared.Success(p))
}

func (h *Handler) Update(c *fiber.Ctx) error {
	id, err := h.parseID(c)
	if err != nil {
		return c.Status(400).JSON(shared.Error(shared.ErrValidation, err.Error()))
	}
	var req SavePackageRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(shared.Error(shared.ErrValidation, "Invalid request body"))
	}
	p, err := h.svc.Update(c.Context(), id, req)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return c.Status(404).JSON(shared.Error(shared.ErrNotFound, "Exam package not found"))
		}
		if e, ok := err.(*fiber.Error); ok {
			return c.Status(e.Code).JSON(shared.Error(shared.ErrorCode(e.Message), e.Message))
		}
		return c.Status(500).JSON(shared.Error(shared.ErrInternal, "Failed to update exam package"))
	}
	return c.JSON(shared.Success(p))
}

func (h *Handler) Delete(c *fiber.Ctx) error {
	id, err := h.parseID(c)
	if err != nil {
		return c.Status(400).JSON(shared.Error(shared.ErrValidation, err.Error()))
	}
	if err := h.svc.Delete(c.Context(), id); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return c.Status(404).JSON(shared.Error(shared.ErrNotFound, "Exam package not found"))
		}
		return c.Status(500).JSON(shared.Error(shared.ErrInternal, "Failed to delete exam package"))
	}
	return c.JSON(shared.Success(map[string]string{"status": "deleted"}))
}

func (h *Handler) ListExams(c *fiber.Ctx) error {
	id, err := h.parseID(c)
	if err != nil {
		return c.Status(400).JSON(shared.Error(shared.ErrValidation, err.Error()))
	}
	items, err := h.svc.ListExams(c.Context(), id)
	if err != nil {
		return c.Status(500).JSON(shared.Error(shared.ErrInternal, "Failed to list package exams"))
	}
	if items == nil {
		items = []PackageExam{}
	}
	return c.JSON(shared.Success(items))
}

func (h *Handler) LinkExam(c *fiber.Ctx) error {
	id, err := h.parseID(c)
	if err != nil {
		return c.Status(400).JSON(shared.Error(shared.ErrValidation, err.Error()))
	}
	var req LinkExamRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(shared.Error(shared.ErrValidation, "Invalid request body"))
	}
	if err := h.svc.LinkExam(c.Context(), id, req); err != nil {
		if e, ok := err.(*fiber.Error); ok {
			return c.Status(e.Code).JSON(shared.Error(shared.ErrorCode(e.Message), e.Message))
		}
		return c.Status(500).JSON(shared.Error(shared.ErrInternal, "Failed to link exam"))
	}
	exams, err := h.svc.ListExams(c.Context(), id)
	if err != nil {
		exams = []PackageExam{}
	}
	return c.JSON(shared.Success(exams))
}

func (h *Handler) UnlinkExam(c *fiber.Ctx) error {
	id, err := h.parseID(c)
	if err != nil {
		return c.Status(400).JSON(shared.Error(shared.ErrValidation, err.Error()))
	}
	examID, err := uuid.Parse(c.Params("examContentId"))
	if err != nil {
		return c.Status(400).JSON(shared.Error(shared.ErrValidation, "Invalid exam content ID"))
	}
	if err := h.svc.UnlinkExam(c.Context(), id, examID); err != nil {
		return c.Status(500).JSON(shared.Error(shared.ErrInternal, "Failed to unlink exam"))
	}
	return c.JSON(shared.Success(map[string]string{"status": "unlinked"}))
}
