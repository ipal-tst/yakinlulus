package school

import (
	"context"
	"errors"
	"net/http"
	"strconv"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/jackc/pgx/v5/pgxpool"

	"yakinlulus.id/backend/internal/middleware"
	"yakinlulus.id/backend/internal/shared"
)

// --- Models ---

type School struct {
	ID              uuid.UUID  `json:"id"`
	SchoolName      string     `json:"school_name"`
	SchoolCode      string     `json:"school_code"`
	NPSN            *string    `json:"npsn,omitempty"`
	EducationLevel  string     `json:"education_level"`
	Address         *string    `json:"address,omitempty"`
	Province        *string    `json:"province,omitempty"`
	Regency         *string    `json:"regency,omitempty"`
	District        *string    `json:"district,omitempty"`
	PostalCode      *string    `json:"postal_code,omitempty"`
	Phone           *string    `json:"phone,omitempty"`
	Email           *string    `json:"email,omitempty"`
	Website         *string    `json:"website,omitempty"`
	PrincipalName   *string    `json:"principal_name,omitempty"`
	Accreditation   *string    `json:"accreditation,omitempty"`
	Status          string     `json:"status"`
	CreatedAt       time.Time  `json:"created_at"`
	UpdatedAt       time.Time  `json:"updated_at"`
}

type SchoolSetting struct {
	ID                     uuid.UUID `json:"id"`
	SchoolID               uuid.UUID `json:"school_id"`
	Timezone               string    `json:"timezone"`
	Language               string    `json:"language"`
	AcademicYear           *string   `json:"academic_year,omitempty"`
	Semester               int       `json:"semester"`
	CBTConfig              []byte    `json:"cbt_config"`
	NotificationPreference []byte    `json:"notification_preference"`
	AIFeatureEnabled       bool      `json:"ai_feature_enabled"`
	CreatedAt              time.Time `json:"created_at"`
	UpdatedAt              time.Time `json:"updated_at"`
}

type SchoolBranding struct {
	ID             uuid.UUID `json:"id"`
	SchoolID       uuid.UUID `json:"school_id"`
	LogoURL        *string   `json:"logo_url,omitempty"`
	IconURL        *string   `json:"icon_url,omitempty"`
	PrimaryColor   *string   `json:"primary_color,omitempty"`
	SecondaryColor *string   `json:"secondary_color,omitempty"`
	Theme          *string   `json:"theme,omitempty"`
	BannerURL      *string   `json:"banner_url,omitempty"`
	CreatedAt      time.Time `json:"created_at"`
	UpdatedAt      time.Time `json:"updated_at"`
}

// --- Repository ---

type Repository struct {
	pool *pgxpool.Pool
}

func NewRepository(pool *pgxpool.Pool) *Repository {
	return &Repository{pool: pool}
}

func scanSchool(s pgx.Row) (*School, error) {
	sc := &School{}
	err := s.Scan(&sc.ID, &sc.SchoolName, &sc.SchoolCode, &sc.NPSN, &sc.EducationLevel,
		&sc.Address, &sc.Province, &sc.Regency, &sc.District, &sc.PostalCode,
		&sc.Phone, &sc.Email, &sc.Website, &sc.PrincipalName, &sc.Accreditation,
		&sc.Status, &sc.CreatedAt, &sc.UpdatedAt)
	return sc, err
}

func scanSchoolRows(rows pgx.Rows) ([]School, error) {
	var schools []School
	for rows.Next() {
		var sc School
		err := rows.Scan(&sc.ID, &sc.SchoolName, &sc.SchoolCode, &sc.NPSN, &sc.EducationLevel,
			&sc.Address, &sc.Province, &sc.Regency, &sc.District, &sc.PostalCode,
			&sc.Phone, &sc.Email, &sc.Website, &sc.PrincipalName, &sc.Accreditation,
			&sc.Status, &sc.CreatedAt, &sc.UpdatedAt)
		if err != nil {
			return nil, err
		}
		schools = append(schools, sc)
	}
	return schools, nil
}

func (r *Repository) Create(ctx context.Context, sc *School) error {
	err := r.pool.QueryRow(ctx,
		`INSERT INTO academic.school (npsn, name, education_level, province, city, district, address, phone, email, website, is_active)
		 VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,true)
		 ON CONFLICT (npsn) WHERE npsn IS NOT NULL AND deleted_at IS NULL DO NOTHING
		 RETURNING id, created_at, updated_at`,
		sc.NPSN, sc.SchoolName, sc.EducationLevel, sc.Province, sc.Regency, sc.District,
		sc.Address, sc.Phone, sc.Email, sc.Website,
	).Scan(&sc.ID, &sc.CreatedAt, &sc.UpdatedAt)
	return err
}

func (r *Repository) FindByID(ctx context.Context, id uuid.UUID) (*School, error) {
	return scanSchool(r.pool.QueryRow(ctx,
		`SELECT s.id, s.name AS school_name,
		        COALESCE(s.npsn, '') AS school_code, s.npsn,
		        COALESCE(s.education_level, '') AS education_level, s.address, s.province, s.city AS regency, s.district,
		        NULL::text AS postal_code, s.phone, s.email, s.website,
		        NULL::text AS principal_name, NULL::text AS accreditation,
		        CASE WHEN s.is_active THEN 'ACTIVE' ELSE 'INACTIVE' END AS status,
		        s.created_at, s.updated_at
		 FROM academic.school s WHERE s.id = $1 AND s.deleted_at IS NULL`, id))
}

func (r *Repository) List(ctx context.Context, limit, offset int, search string) ([]School, int, error) {
	where := "WHERE s.deleted_at IS NULL"
	args := []interface{}{}
	argN := 1
	if search != "" {
		where += " AND (s.name ILIKE $" + strconv.Itoa(argN) + " OR s.npsn ILIKE $" + strconv.Itoa(argN) + ")"
		args = append(args, "%"+search+"%")
		argN++
	}

	var total int
	q := "SELECT COUNT(*) FROM academic.school s " + where
	r.pool.QueryRow(ctx, q, args...).Scan(&total)

	query := `SELECT s.id, s.name AS school_name,
	        COALESCE(s.npsn, '') AS school_code, s.npsn,
	        COALESCE(s.education_level, '') AS education_level, s.address, s.province, s.city AS regency, s.district,
	        NULL::text AS postal_code, s.phone, s.email, s.website,
	        NULL::text AS principal_name, NULL::text AS accreditation,
	        CASE WHEN s.is_active THEN 'ACTIVE' ELSE 'INACTIVE' END AS status,
	        s.created_at, s.updated_at
	 FROM academic.school s ` + where +
		` ORDER BY s.created_at DESC LIMIT $` + strconv.Itoa(argN) + ` OFFSET $` + strconv.Itoa(argN+1)
	args = append(args, limit, offset)

	rows, err := r.pool.Query(ctx, query, args...)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()
	schools, err := scanSchoolRows(rows)
	return schools, total, err
}

func (r *Repository) Update(ctx context.Context, sc *School) error {
	_, err := r.pool.Exec(ctx,
		`UPDATE academic.school SET npsn=$1, name=$2, education_level=$3, province=$4, city=$5, district=$6,
		 address=$7, phone=$8, email=$9, website=$10, is_active=$11, updated_at=NOW()
		 WHERE id=$12 AND deleted_at IS NULL`,
		sc.NPSN, sc.SchoolName, sc.EducationLevel, sc.Province, sc.Regency, sc.District,
		sc.Address, sc.Phone, sc.Email, sc.Website,
		sc.Status == "ACTIVE", sc.ID)
	return err
}

func (r *Repository) UpdateStatus(ctx context.Context, id uuid.UUID, status string) error {
	_, err := r.pool.Exec(ctx,
		`UPDATE academic.school SET is_active=$1, updated_at=NOW() WHERE id=$2 AND deleted_at IS NULL`,
		status == "ACTIVE", id)
	return err
}

func (r *Repository) SoftDelete(ctx context.Context, id uuid.UUID) error {
	_, err := r.pool.Exec(ctx,
		`UPDATE academic.school SET deleted_at=NOW(), updated_at=NOW() WHERE id=$1 AND deleted_at IS NULL`, id)
	return err
}

func (r *Repository) GetSettings(ctx context.Context, schoolID uuid.UUID) (*SchoolSetting, error) {
	// TODO(batch4): legacy `school_settings` table — no academic equivalent yet.
	ss := &SchoolSetting{}
	err := r.pool.QueryRow(ctx,
		`SELECT id, school_id, timezone, language, academic_year, semester, cbt_config,
		 notification_preference, ai_feature_enabled, created_at, updated_at
		 FROM school_settings WHERE school_id=$1`, schoolID,
	).Scan(&ss.ID, &ss.SchoolID, &ss.Timezone, &ss.Language, &ss.AcademicYear, &ss.Semester,
		&ss.CBTConfig, &ss.NotificationPreference, &ss.AIFeatureEnabled, &ss.CreatedAt, &ss.UpdatedAt)
	return ss, err
}

func (r *Repository) UpsertSettings(ctx context.Context, ss *SchoolSetting) error {
	// TODO(batch4): legacy `school_settings` table — no academic equivalent yet.
	_, err := r.pool.Exec(ctx,
		`INSERT INTO school_settings (school_id, timezone, language, academic_year, semester, cbt_config,
		 notification_preference, ai_feature_enabled)
		 VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
		 ON CONFLICT (school_id) DO UPDATE SET
		 timezone=EXCLUDED.timezone, language=EXCLUDED.language, academic_year=EXCLUDED.academic_year,
		 semester=EXCLUDED.semester, cbt_config=EXCLUDED.cbt_config,
		 notification_preference=EXCLUDED.notification_preference,
		 ai_feature_enabled=EXCLUDED.ai_feature_enabled, updated_at=NOW()`,
		ss.SchoolID, ss.Timezone, ss.Language, ss.AcademicYear, ss.Semester,
		ss.CBTConfig, ss.NotificationPreference, ss.AIFeatureEnabled)
	return err
}

func (r *Repository) CountMembers(ctx context.Context, schoolID uuid.UUID) (int, error) {
	var n int
	err := r.pool.QueryRow(ctx,
		`SELECT COUNT(*) FROM academic.student_enrollment WHERE school_id=$1 AND status='ACTIVE'`, schoolID).Scan(&n)
	return n, err
}

func (r *Repository) UpsertBranding(ctx context.Context, b *SchoolBranding) error {
	// TODO(batch4): legacy `school_brandings` table — no academic equivalent yet.
	_, err := r.pool.Exec(ctx,
		`INSERT INTO school_brandings (school_id, logo_url, icon_url, primary_color, secondary_color, theme, banner_url)
		 VALUES ($1,$2,$3,$4,$5,$6,$7)
		 ON CONFLICT (school_id) DO UPDATE SET
		 logo_url=EXCLUDED.logo_url, icon_url=EXCLUDED.icon_url,
		 primary_color=EXCLUDED.primary_color, secondary_color=EXCLUDED.secondary_color,
		 theme=EXCLUDED.theme, banner_url=EXCLUDED.banner_url, updated_at=NOW()`,
		b.SchoolID, b.LogoURL, b.IconURL, b.PrimaryColor, b.SecondaryColor, b.Theme, b.BannerURL)
	return err
}

func (r *Repository) GetBranding(ctx context.Context, schoolID uuid.UUID) (*SchoolBranding, error) {
	// TODO(batch4): legacy `school_brandings` table — no academic equivalent yet.
	b := &SchoolBranding{}
	err := r.pool.QueryRow(ctx,
		`SELECT id, school_id, logo_url, icon_url, primary_color, secondary_color, theme, banner_url, created_at, updated_at
		 FROM school_brandings WHERE school_id=$1`, schoolID,
	).Scan(&b.ID, &b.SchoolID, &b.LogoURL, &b.IconURL, &b.PrimaryColor, &b.SecondaryColor, &b.Theme, &b.BannerURL, &b.CreatedAt, &b.UpdatedAt)
	return b, err
}

// --- Service ---

type Service struct {
	repo *Repository
}

func NewService(repo *Repository) *Service {
	return &Service{repo: repo}
}

func (s *Service) Create(ctx context.Context, req CreateSchoolReq) (*School, error) {
	sc := &School{
		SchoolName:     req.SchoolName,
		NPSN:           req.NPSN,
		EducationLevel: req.EducationLevel,
		Address:        req.Address,
		Province:       req.Province,
		Regency:        req.Regency,
		District:       req.District,
		PostalCode:     req.PostalCode,
		Phone:          req.Phone,
		Email:          req.Email,
		Website:        req.Website,
		PrincipalName:  req.PrincipalName,
		Accreditation:  req.Accreditation,
	}
	if err := s.repo.Create(ctx, sc); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, fiber.NewError(409, "NPSN already exists")
		}
		return nil, err
	}
	_ = s.repo.UpsertSettings(ctx, &SchoolSetting{
		SchoolID: sc.ID,
		Timezone: "Asia/Jakarta",
		Language: "id",
	})
	return sc, nil
}

func (s *Service) List(ctx context.Context, page, limit int, search string) ([]School, int, error) {
	return s.repo.List(ctx, limit, (page-1)*limit, search)
}

func (s *Service) FindByID(ctx context.Context, id uuid.UUID) (*School, error) {
	sc, err := s.repo.FindByID(ctx, id)
	if err != nil {
		if err == pgx.ErrNoRows {
			return nil, fiber.NewError(404, "School not found")
		}
		return nil, err
	}
	return sc, nil
}

func (s *Service) Update(ctx context.Context, id uuid.UUID, req UpdateSchoolReq) (*School, error) {
	sc, err := s.repo.FindByID(ctx, id)
	if err != nil {
		return nil, err
	}
	if req.SchoolName != nil {
		sc.SchoolName = *req.SchoolName
	}
	if req.NPSN != nil {
		sc.NPSN = req.NPSN
	}
	if req.EducationLevel != nil {
		sc.EducationLevel = *req.EducationLevel
	}
	if req.Address != nil {
		sc.Address = req.Address
	}
	if req.Province != nil {
		sc.Province = req.Province
	}
	if req.Regency != nil {
		sc.Regency = req.Regency
	}
	if req.District != nil {
		sc.District = req.District
	}
	if req.PostalCode != nil {
		sc.PostalCode = req.PostalCode
	}
	if req.Phone != nil {
		sc.Phone = req.Phone
	}
	if req.Email != nil {
		sc.Email = req.Email
	}
	if req.Website != nil {
		sc.Website = req.Website
	}
	if req.PrincipalName != nil {
		sc.PrincipalName = req.PrincipalName
	}
	if req.Accreditation != nil {
		sc.Accreditation = req.Accreditation
	}
	if err := s.repo.Update(ctx, sc); err != nil {
		var pgErr *pgconn.PgError
		if errors.As(err, &pgErr) && pgErr.Code == "23505" {
			return nil, fiber.NewError(409, "NPSN already exists")
		}
		return nil, err
	}
	return sc, nil
}

func (s *Service) UpdateStatus(ctx context.Context, id uuid.UUID, status string) error {
	switch status {
	case "ACTIVE", "INACTIVE":
	default:
		return fiber.NewError(400, "Invalid status: must be ACTIVE or INACTIVE")
	}
	if status == "INACTIVE" {
		n, _ := s.repo.CountMembers(ctx, id)
		if n > 0 {
			return fiber.NewError(409, "Cannot deactivate school with active members")
		}
	}
	return s.repo.UpdateStatus(ctx, id, status)
}

func (s *Service) SoftDelete(ctx context.Context, id uuid.UUID) error {
	n, err := s.repo.CountMembers(ctx, id)
	if err == nil && n > 0 {
		return fiber.NewError(409, "Cannot delete school with active members")
	}
	return s.repo.SoftDelete(ctx, id)
}

func (s *Service) GetSettings(ctx context.Context, schoolID uuid.UUID) (*SchoolSetting, error) {
	ss, err := s.repo.GetSettings(ctx, schoolID)
	if err != nil {
		if err == pgx.ErrNoRows {
			return nil, fiber.NewError(404, "Settings not found")
		}
		return nil, err
	}
	return ss, nil
}

func (s *Service) UpdateSettings(ctx context.Context, schoolID uuid.UUID, req UpdateSettingReq) (*SchoolSetting, error) {
	ss := &SchoolSetting{
		SchoolID: schoolID,
		Timezone: "Asia/Jakarta",
		Language: "id",
		Semester: 1,
	}
	if req.Timezone != nil {
		ss.Timezone = *req.Timezone
	}
	if req.Language != nil {
		ss.Language = *req.Language
	}
	if req.AcademicYear != nil {
		ss.AcademicYear = req.AcademicYear
	}
	if req.Semester != nil {
		ss.Semester = *req.Semester
	}
	if err := s.repo.UpsertSettings(ctx, ss); err != nil {
		return nil, err
	}
	return s.repo.GetSettings(ctx, schoolID)
}

func (s *Service) UpsertBranding(ctx context.Context, schoolID uuid.UUID, req BrandingReq) (*SchoolBranding, error) {
	if err := s.repo.UpsertBranding(ctx, &SchoolBranding{
		SchoolID:       schoolID,
		LogoURL:        req.LogoURL,
		IconURL:        req.IconURL,
		PrimaryColor:   req.PrimaryColor,
		SecondaryColor: req.SecondaryColor,
		Theme:          req.Theme,
		BannerURL:      req.BannerURL,
	}); err != nil {
		return nil, err
	}
	return s.repo.GetBranding(ctx, schoolID)
}

func (s *Service) GetBranding(ctx context.Context, schoolID uuid.UUID) (*SchoolBranding, error) {
	b, err := s.repo.GetBranding(ctx, schoolID)
	if err != nil {
		if err == pgx.ErrNoRows {
			return nil, fiber.NewError(404, "Branding not found")
		}
		return nil, err
	}
	return b, nil
}

func (s *Service) GetBrandingByID(ctx context.Context, id uuid.UUID) (*SchoolBranding, error) {
	b, err := s.repo.GetBranding(ctx, id)
	if err != nil {
		if err == pgx.ErrNoRows {
			return nil, fiber.NewError(404, "Branding not found")
		}
		return nil, err
	}
	return b, nil
}

// --- DTOs ---

type CreateSchoolReq struct {
	SchoolName     string  `json:"school_name"`
	NPSN           *string `json:"npsn,omitempty"`
	EducationLevel string  `json:"education_level"`
	Address        *string `json:"address,omitempty"`
	Province       *string `json:"province,omitempty"`
	Regency        *string `json:"regency,omitempty"`
	District       *string `json:"district,omitempty"`
	PostalCode     *string `json:"postal_code,omitempty"`
	Phone          *string `json:"phone,omitempty"`
	Email          *string `json:"email,omitempty"`
	Website        *string `json:"website,omitempty"`
	PrincipalName  *string `json:"principal_name,omitempty"`
	Accreditation  *string `json:"accreditation,omitempty"`
}

type UpdateSchoolReq struct {
	SchoolName     *string `json:"school_name,omitempty"`
	NPSN           *string `json:"npsn,omitempty"`
	EducationLevel *string `json:"education_level,omitempty"`
	Address        *string `json:"address,omitempty"`
	Province       *string `json:"province,omitempty"`
	Regency        *string `json:"regency,omitempty"`
	District       *string `json:"district,omitempty"`
	PostalCode     *string `json:"postal_code,omitempty"`
	Phone          *string `json:"phone,omitempty"`
	Email          *string `json:"email,omitempty"`
	Website        *string `json:"website,omitempty"`
	PrincipalName  *string `json:"principal_name,omitempty"`
	Accreditation  *string `json:"accreditation,omitempty"`
}

type UpdateSettingReq struct {
	Timezone     *string `json:"timezone,omitempty"`
	Language     *string `json:"language,omitempty"`
	AcademicYear *string `json:"academic_year,omitempty"`
	Semester     *int    `json:"semester,omitempty"`
}

type StatusUpdateReq struct {
	Status string `json:"status"`
}

type BrandingReq struct {
	LogoURL        *string `json:"logo_url,omitempty"`
	IconURL        *string `json:"icon_url,omitempty"`
	PrimaryColor   *string `json:"primary_color,omitempty"`
	SecondaryColor *string `json:"secondary_color,omitempty"`
	Theme          *string `json:"theme,omitempty"`
	BannerURL      *string `json:"banner_url,omitempty"`
}

// --- Handler ---

type Handler struct {
	svc  *Service
	auth string
}

func NewHandler(svc *Service, jwtSecret string) *Handler {
	return &Handler{svc: svc, auth: jwtSecret}
}

func (h *Handler) RegisterRoutes(router fiber.Router) {
	authM := middleware.RequireAuth(h.auth)
	admin := middleware.RequireRole("SUPER_ADMIN", "STAFF")

	r := router.Group("/schools", authM)
	r.Get("/", admin, h.List)
	r.Post("/", admin, h.Create)
	r.Get("/:id", h.FindByID)
	r.Put("/:id", admin, h.Update)
	r.Patch("/:id/status", admin, h.UpdateStatus)
	r.Delete("/:id", admin, h.Delete)
	r.Get("/:id/settings", h.GetSettings)
	r.Put("/:id/settings", admin, h.UpdateSettings)
	r.Get("/:id/branding", h.GetBranding)
	r.Put("/:id/branding", admin, h.UpsertBranding)
}

func (h *Handler) Create(c *fiber.Ctx) error {
	var req CreateSchoolReq
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(shared.Error(shared.ErrValidation, "Invalid request body"))
	}
	if req.SchoolName == "" || req.EducationLevel == "" {
		return c.Status(400).JSON(shared.Error(shared.ErrValidation, "school_name, education_level required"))
	}
	sc, err := h.svc.Create(c.Context(), req)
	if err != nil {
		if fe, ok := err.(*fiber.Error); ok {
			return c.Status(fe.Code).JSON(shared.Error(shared.ErrorCode(fe.Message), fe.Message))
		}
		return c.Status(500).JSON(shared.Error(shared.ErrInternal, "Failed to create school"))
	}
	return c.Status(201).JSON(shared.Success(sc))
}

func (h *Handler) List(c *fiber.Ctx) error {
	page, limit := shared.ParsePagination(c)
	search := c.Query("search", "")
	schools, total, err := h.svc.List(c.Context(), page, limit, search)
	if err != nil {
		return c.Status(500).JSON(shared.Error(shared.ErrInternal, "Failed to list schools"))
	}
	return c.JSON(shared.SuccessWithMeta(schools, shared.BuildMeta(page, limit, total)))
}

func (h *Handler) FindByID(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(400).JSON(shared.Error(shared.ErrValidation, "Invalid school ID"))
	}
	sc, err := h.svc.FindByID(c.Context(), id)
	if err != nil {
		if fe, ok := err.(*fiber.Error); ok {
			return c.Status(fe.Code).JSON(shared.Error(shared.ErrorCode(fe.Message), fe.Message))
		}
		return c.Status(500).JSON(shared.Error(shared.ErrInternal, "Failed to get school"))
	}
	return c.JSON(shared.Success(sc))
}

func (h *Handler) Update(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(400).JSON(shared.Error(shared.ErrValidation, "Invalid school ID"))
	}
	var req UpdateSchoolReq
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(shared.Error(shared.ErrValidation, "Invalid request body"))
	}
	sc, err := h.svc.Update(c.Context(), id, req)
	if err != nil {
		if fe, ok := err.(*fiber.Error); ok {
			return c.Status(fe.Code).JSON(shared.Error(shared.ErrorCode(fe.Message), fe.Message))
		}
		return c.Status(500).JSON(shared.Error(shared.ErrInternal, "Failed to update school"))
	}
	return c.JSON(shared.Success(sc))
}

func (h *Handler) UpdateStatus(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(400).JSON(shared.Error(shared.ErrValidation, "Invalid school ID"))
	}
	var req StatusUpdateReq
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(shared.Error(shared.ErrValidation, "Invalid request body"))
	}
	if req.Status == "" {
		return c.Status(400).JSON(shared.Error(shared.ErrValidation, "status required"))
	}
	if err := h.svc.UpdateStatus(c.Context(), id, req.Status); err != nil {
		if fe, ok := err.(*fiber.Error); ok {
			return c.Status(fe.Code).JSON(shared.Error(shared.ErrorCode(fe.Message), fe.Message))
		}
		return c.Status(500).JSON(shared.Error(shared.ErrInternal, "Failed to update school status"))
	}
	return c.JSON(shared.Success(fiber.Map{"status": req.Status}))
}

func (h *Handler) Delete(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(400).JSON(shared.Error(shared.ErrValidation, "Invalid school ID"))
	}
	if err := h.svc.SoftDelete(c.Context(), id); err != nil {
		if fe, ok := err.(*fiber.Error); ok {
			return c.Status(fe.Code).JSON(shared.Error(shared.ErrorCode(fe.Message), fe.Message))
		}
		return c.Status(500).JSON(shared.Error(shared.ErrInternal, "Failed to delete school"))
	}
	return c.SendStatus(http.StatusNoContent)
}

func (h *Handler) GetSettings(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(400).JSON(shared.Error(shared.ErrValidation, "Invalid school ID"))
	}
	ss, err := h.svc.GetSettings(c.Context(), id)
	if err != nil {
		if fe, ok := err.(*fiber.Error); ok {
			return c.Status(fe.Code).JSON(shared.Error(shared.ErrorCode(fe.Message), fe.Message))
		}
		return c.Status(500).JSON(shared.Error(shared.ErrInternal, "Failed to get settings"))
	}
	return c.JSON(shared.Success(ss))
}

func (h *Handler) UpdateSettings(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(400).JSON(shared.Error(shared.ErrValidation, "Invalid school ID"))
	}
	var req UpdateSettingReq
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(shared.Error(shared.ErrValidation, "Invalid request body"))
	}
	ss, err := h.svc.UpdateSettings(c.Context(), id, req)
	if err != nil {
		return c.Status(500).JSON(shared.Error(shared.ErrInternal, "Failed to update settings"))
	}
	return c.JSON(shared.Success(ss))
}

func (h *Handler) UpsertBranding(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(400).JSON(shared.Error(shared.ErrValidation, "Invalid school ID"))
	}
	var req BrandingReq
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(shared.Error(shared.ErrValidation, "Invalid request body"))
	}
	b, err := h.svc.UpsertBranding(c.Context(), id, req)
	if err != nil {
		return c.Status(500).JSON(shared.Error(shared.ErrInternal, "Failed to upsert branding"))
	}
	return c.JSON(shared.Success(b))
}

func (h *Handler) GetBranding(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(400).JSON(shared.Error(shared.ErrValidation, "Invalid school ID"))
	}
	b, err := h.svc.GetBranding(c.Context(), id)
	if err != nil {
		if fe, ok := err.(*fiber.Error); ok {
			return c.Status(fe.Code).JSON(shared.Error(shared.ErrorCode(fe.Message), fe.Message))
		}
		return c.Status(500).JSON(shared.Error(shared.ErrInternal, "Failed to get branding"))
	}
	return c.JSON(shared.Success(b))
}
