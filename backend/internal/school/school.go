package school

import (
	"context"
	"errors"
	"fmt"
	"net/http"
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
	ID              uuid.UUID `json:"id"`
	SchoolName      string    `json:"school_name"`
	SchoolCode      string    `json:"school_code"`
	NPSN            *string   `json:"npsn,omitempty"`
	InstitutionType string    `json:"institution_type"`
	EducationLevel  string    `json:"education_level"`
	SchoolStatus    string    `json:"school_status"`
	YayasanName     *string   `json:"yayasan_name,omitempty"`
	Province        *string   `json:"province,omitempty"`
	City            *string   `json:"city,omitempty"`
	District        *string   `json:"district,omitempty"`
	Village         *string   `json:"village,omitempty"`
	Address         *string   `json:"address,omitempty"`
	PostalCode      *string   `json:"postal_code,omitempty"`
	Phone           *string   `json:"phone,omitempty"`
	Email           *string   `json:"email,omitempty"`
	Website         *string   `json:"website,omitempty"`
	CurriculumCode  *string   `json:"curriculum_code,omitempty"`
	PrincipalName   *string   `json:"principal_name,omitempty"`
	Accreditation   *string   `json:"accreditation,omitempty"`
	Status          string    `json:"status"`
	IsActive        bool      `json:"is_active"`
	CreatedAt       time.Time `json:"created_at"`
	UpdatedAt       time.Time `json:"updated_at"`
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

const schoolSelectCols = `s.id, s.name AS school_name,
	COALESCE(s.npsn,'') AS school_code, s.npsn,
	COALESCE(s.institution_type,'SEKOLAH') AS institution_type,
	COALESCE(s.education_level,'') AS education_level,
	COALESCE(s.school_status,'NEGERI') AS school_status,
	s.yayasan_name, s.province, s.city AS city, s.district, s.village,
	s.address, s.postal_code, s.phone, s.email, s.website, s.curriculum_code,
	NULL::text AS principal_name, NULL::text AS accreditation,
	s.is_active, CASE WHEN s.is_active THEN 'ACTIVE' ELSE 'INACTIVE' END AS status,
	s.created_at, s.updated_at`

func scanSchool(s pgx.Row) (*School, error) {
	sc := &School{}
	err := s.Scan(&sc.ID, &sc.SchoolName, &sc.SchoolCode, &sc.NPSN, &sc.InstitutionType,
		&sc.EducationLevel, &sc.SchoolStatus, &sc.YayasanName, &sc.Province, &sc.City,
		&sc.District, &sc.Village, &sc.Address, &sc.PostalCode, &sc.Phone, &sc.Email,
		&sc.Website, &sc.CurriculumCode, &sc.PrincipalName, &sc.Accreditation,
		&sc.IsActive, &sc.Status, &sc.CreatedAt, &sc.UpdatedAt)
	return sc, err
}

func scanSchoolRows(rows pgx.Rows) ([]School, error) {
	var schools []School
	for rows.Next() {
		var sc School
		err := rows.Scan(&sc.ID, &sc.SchoolName, &sc.SchoolCode, &sc.NPSN, &sc.InstitutionType,
			&sc.EducationLevel, &sc.SchoolStatus, &sc.YayasanName, &sc.Province, &sc.City,
			&sc.District, &sc.Village, &sc.Address, &sc.PostalCode, &sc.Phone, &sc.Email,
			&sc.Website, &sc.CurriculumCode, &sc.PrincipalName, &sc.Accreditation,
			&sc.IsActive, &sc.Status, &sc.CreatedAt, &sc.UpdatedAt)
		if err != nil {
			return nil, err
		}
		schools = append(schools, sc)
	}
	return schools, nil
}

func (r *Repository) Create(ctx context.Context, sc *School) error {
	err := r.pool.QueryRow(ctx,
		`INSERT INTO academic.school (npsn, name, education_level, institution_type, school_status, yayasan_name,
		 province, city, district, village, address, postal_code, phone, email, website, curriculum_code, is_active)
		 VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,true)
		 ON CONFLICT (npsn) WHERE npsn IS NOT NULL AND deleted_at IS NULL DO NOTHING
		 RETURNING id, created_at, updated_at`,
		sc.NPSN, sc.SchoolName, sc.EducationLevel, sc.InstitutionType, sc.SchoolStatus, sc.YayasanName,
		sc.Province, sc.City, sc.District, sc.Village,
		sc.Address, sc.PostalCode, sc.Phone, sc.Email, sc.Website, sc.CurriculumCode,
	).Scan(&sc.ID, &sc.CreatedAt, &sc.UpdatedAt)
	return err
}

func (r *Repository) FindByID(ctx context.Context, id uuid.UUID) (*School, error) {
	return scanSchool(r.pool.QueryRow(ctx,
		`SELECT `+schoolSelectCols+`
		 FROM academic.school s WHERE s.id = $1 AND s.deleted_at IS NULL`, id))
}

type ListFilter struct {
	Page, Limit int
	Search, Type, Level, Province string
}

func (r *Repository) List(ctx context.Context, f ListFilter) ([]School, int, error) {
	where := "WHERE s.deleted_at IS NULL"
	args := []interface{}{}
	n := 1
	if f.Search != "" {
		where += fmt.Sprintf(" AND (s.name ILIKE $%d OR COALESCE(s.npsn,'') ILIKE $%d)", n, n)
		args = append(args, "%"+f.Search+"%")
		n++
	}
	if f.Type != "" {
		where += fmt.Sprintf(" AND s.institution_type = $%d", n)
		args = append(args, f.Type)
		n++
	}
	if f.Level != "" {
		where += fmt.Sprintf(" AND s.education_level = $%d", n)
		args = append(args, f.Level)
		n++
	}
	if f.Province != "" {
		where += fmt.Sprintf(" AND COALESCE(s.province,'') ILIKE $%d", n)
		args = append(args, "%"+f.Province+"%")
		n++
	}

	var total int
	if err := r.pool.QueryRow(ctx, "SELECT COUNT(*) FROM academic.school s "+where, args...).Scan(&total); err != nil {
		return nil, 0, err
	}
	query := `SELECT ` + schoolSelectCols + ` FROM academic.school s ` + where +
		fmt.Sprintf(" ORDER BY s.name LIMIT $%d OFFSET $%d", n, n+1)
	args = append(args, f.Limit, (f.Page-1)*f.Limit)

	rows, err := r.pool.Query(ctx, query, args...)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()
	schools, err := scanSchoolRows(rows)
	return schools, total, err
}

// ListByIDs mengambil sekolah berdasarkan kumpulan id (soft-delete diabaikan).
func (r *Repository) ListByIDs(ctx context.Context, ids []uuid.UUID) ([]School, error) {
	if len(ids) == 0 {
		return nil, nil
	}
	query := `SELECT ` + schoolSelectCols + ` FROM academic.school s WHERE s.deleted_at IS NULL AND s.id = ANY($1) ORDER BY s.name`
	rows, err := r.pool.Query(ctx, query, ids)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	return scanSchoolRows(rows)
}

func (r *Repository) Update(ctx context.Context, sc *School) error {
	_, err := r.pool.Exec(ctx,
		`UPDATE academic.school SET npsn=$1, name=$2, education_level=$3, institution_type=$4, school_status=$5,
		 yayasan_name=$6, province=$7, city=$8, district=$9, village=$10, address=$11, postal_code=$12,
		 phone=$13, email=$14, website=$15, curriculum_code=$16, is_active=$17, updated_at=NOW()
		 WHERE id=$18 AND deleted_at IS NULL`,
		sc.NPSN, sc.SchoolName, sc.EducationLevel, sc.InstitutionType, sc.SchoolStatus, sc.YayasanName,
		sc.Province, sc.City, sc.District, sc.Village,
		sc.Address, sc.PostalCode, sc.Phone, sc.Email, sc.Website, sc.CurriculumCode,
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
	tx, err := r.pool.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)

	// Hapus payung target_school + scores (score cascade via FK ON DELETE CASCADE).
	if _, err := tx.Exec(ctx, `DELETE FROM academic.target_school WHERE school_id = $1`, id); err != nil {
		return err
	}
	// Hapus turunan tanpa kolom deleted_at (FK ON DELETE CASCADE dari school,
	// tapi sekolah di-soft-delete sehingga tidak terpicu otomatis).
	if _, err := tx.Exec(ctx, `DELETE FROM academic.student_enrollment WHERE school_id = $1`, id); err != nil {
		return err
	}
	if _, err := tx.Exec(ctx, `DELETE FROM academic.school_class WHERE school_id = $1`, id); err != nil {
		return err
	}
	if _, err := tx.Exec(ctx, `DELETE FROM academic.teacher_subject WHERE school_id = $1`, id); err != nil {
		return err
	}
	if _, err := tx.Exec(ctx, `DELETE FROM academic.school_demographic WHERE school_id = $1`, id); err != nil {
		return err
	}
	// Soft-delete sekolah (row tetap utk recoverability + kompatibilitas unique index).
	if _, err := tx.Exec(ctx, `UPDATE academic.school SET deleted_at=NOW(), updated_at=NOW() WHERE id=$1 AND deleted_at IS NULL`, id); err != nil {
		return err
	}
	return tx.Commit(ctx)
}

// CountTargetScores menghitung nilai penerimaan yang masih melekat pada sekolah
// (via payung target_school) — dipakai untuk memblokir soft-delete sekolah.
func (r *Repository) CountTargetScores(ctx context.Context, id uuid.UUID) (int, error) {
	var n int
	err := r.pool.QueryRow(ctx,
		`SELECT COUNT(*)
		 FROM academic.target_school_score tss
		 JOIN academic.target_school ts ON ts.id = tss.target_school_id
		 WHERE ts.school_id = $1 AND ts.deleted_at IS NULL`, id).Scan(&n)
	return n, err
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
	if err := validateCreateReq(req); err != nil {
		return nil, err
	}
	normalizeCreateReq(&req)
	sc := &School{
		SchoolName:      req.SchoolName,
		NPSN:            req.NPSN,
		InstitutionType: req.InstitutionType,
		EducationLevel:  derefStr(req.EducationLevel),
		SchoolStatus:    req.SchoolStatus,
		YayasanName:     req.YayasanName,
		Address:         req.Address,
		Province:        req.Province,
		City:            req.City,
		District:        req.District,
		Village:         req.Village,
		PostalCode:      req.PostalCode,
		Phone:           req.Phone,
		Email:           req.Email,
		Website:         req.Website,
		CurriculumCode:  req.CurriculumCode,
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

func (s *Service) List(ctx context.Context, f ListFilter) ([]School, int, error) {
	return s.repo.List(ctx, f)
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
	if err := validateUpdateReq(req); err != nil {
		return nil, err
	}
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
	if req.InstitutionType != nil {
		sc.InstitutionType = *req.InstitutionType
	}
	if req.EducationLevel != nil {
		sc.EducationLevel = *req.EducationLevel
	}
	if req.SchoolStatus != nil {
		sc.SchoolStatus = *req.SchoolStatus
	}
	if req.YayasanName != nil {
		sc.YayasanName = req.YayasanName
	}
	if req.Address != nil {
		sc.Address = req.Address
	}
	if req.Province != nil {
		sc.Province = req.Province
	}
	if req.City != nil {
		sc.City = req.City
	}
	if req.District != nil {
		sc.District = req.District
	}
	if req.Village != nil {
		sc.Village = req.Village
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
	if req.CurriculumCode != nil {
		sc.CurriculumCode = req.CurriculumCode
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
		scoreCount, err := s.repo.CountTargetScores(ctx, id)
		if err != nil {
			return err
		}
		if scoreCount > 0 {
			return fiber.NewError(409, "Cannot deactivate school with target school scores")
		}
	}
	return s.repo.UpdateStatus(ctx, id, status)
}

func (s *Service) SoftDelete(ctx context.Context, id uuid.UUID) error {
	return s.repo.SoftDelete(ctx, id)
}

func derefStr(p *string) string {
	if p == nil {
		return ""
	}
	return *p
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
	SchoolName      string  `json:"school_name"`
	NPSN            *string `json:"npsn,omitempty"`
	InstitutionType string  `json:"institution_type"`
	EducationLevel  *string `json:"education_level,omitempty"`
	SchoolStatus    string  `json:"school_status"`
	YayasanName     *string `json:"yayasan_name,omitempty"`
	Province        *string `json:"province,omitempty"`
	City            *string `json:"city,omitempty"`
	District        *string `json:"district,omitempty"`
	Village         *string `json:"village,omitempty"`
	Address         *string `json:"address,omitempty"`
	PostalCode      *string `json:"postal_code,omitempty"`
	Phone           *string `json:"phone,omitempty"`
	Email           *string `json:"email,omitempty"`
	Website         *string `json:"website,omitempty"`
	CurriculumCode  *string `json:"curriculum_code,omitempty"`
}

type UpdateSchoolReq struct {
	SchoolName      *string `json:"school_name,omitempty"`
	NPSN            *string `json:"npsn,omitempty"`
	InstitutionType *string `json:"institution_type,omitempty"`
	EducationLevel  *string `json:"education_level,omitempty"`
	SchoolStatus    *string `json:"school_status,omitempty"`
	YayasanName     *string `json:"yayasan_name,omitempty"`
	Province        *string `json:"province,omitempty"`
	City            *string `json:"city,omitempty"`
	District        *string `json:"district,omitempty"`
	Village         *string `json:"village,omitempty"`
	Address         *string `json:"address,omitempty"`
	PostalCode      *string `json:"postal_code,omitempty"`
	Phone           *string `json:"phone,omitempty"`
	Email           *string `json:"email,omitempty"`
	Website         *string `json:"website,omitempty"`
	CurriculumCode  *string `json:"curriculum_code,omitempty"`
}

var validInstitutionTypes = map[string]bool{"SEKOLAH": true, "PT": true}
var validSchoolStatuses = map[string]bool{"NEGERI": true, "SWASTA": true}
var validSchoolLevels = map[string]bool{"SD": true, "SMP": true, "SMA": true, "SMK": true, "UNIVERSITY": true}

func is8DigitNPSN(s string) bool {
	if len(s) != 8 {
		return false
	}
	for _, c := range s {
		if c < '0' || c > '9' {
			return false
		}
	}
	return true
}

func normalizeCreateReq(req *CreateSchoolReq) {
	if req.InstitutionType == "" {
		req.InstitutionType = "SEKOLAH"
	}
	if req.SchoolStatus == "" {
		req.SchoolStatus = "NEGERI"
	}
	if req.InstitutionType == "PT" {
		lvl := "UNIVERSITY"
		req.EducationLevel = &lvl
	} else if req.SchoolStatus == "NEGERI" {
		req.YayasanName = nil
	}
}

func validateCreateReq(req CreateSchoolReq) error {
	normalizeCreateReq(&req)
	if req.SchoolName == "" {
		return fiber.NewError(400, "school_name required")
	}
	if !validInstitutionTypes[req.InstitutionType] {
		return fiber.NewError(400, "institution_type must be SEKOLAH or PT")
	}
	if !validSchoolStatuses[req.SchoolStatus] {
		return fiber.NewError(400, "school_status must be NEGERI or SWASTA")
	}
	if req.NPSN != nil && *req.NPSN != "" && !is8DigitNPSN(*req.NPSN) {
		return fiber.NewError(400, "npsn must be 8 digits")
	}
	if req.InstitutionType == "SEKOLAH" {
		if req.EducationLevel == nil || *req.EducationLevel == "" {
			return fiber.NewError(400, "education_level required for SEKOLAH")
		}
		if !validSchoolLevels[*req.EducationLevel] {
			return fiber.NewError(400, "invalid education_level")
		}
	}
	if req.SchoolStatus == "SWASTA" {
		if req.YayasanName == nil || *req.YayasanName == "" {
			return fiber.NewError(400, "yayasan_name required when SWASTA")
		}
	}
	return nil
}

func validateUpdateReq(req UpdateSchoolReq) error {
	if req.InstitutionType != nil && !validInstitutionTypes[*req.InstitutionType] {
		return fiber.NewError(400, "institution_type must be SEKOLAH or PT")
	}
	if req.SchoolStatus != nil && !validSchoolStatuses[*req.SchoolStatus] {
		return fiber.NewError(400, "school_status must be NEGERI or SWASTA")
	}
	if req.NPSN != nil && *req.NPSN != "" && !is8DigitNPSN(*req.NPSN) {
		return fiber.NewError(400, "npsn must be 8 digits")
	}
	if req.InstitutionType != nil && *req.InstitutionType == "SEKOLAH" &&
		req.EducationLevel != nil && *req.EducationLevel != "" && !validSchoolLevels[*req.EducationLevel] {
		return fiber.NewError(400, "invalid education_level")
	}
	if req.SchoolStatus != nil && *req.SchoolStatus == "SWASTA" &&
		(req.YayasanName == nil || *req.YayasanName == "") {
		return fiber.NewError(400, "yayasan_name required when SWASTA")
	}
	return nil
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
	r.Post("/import/xlsx", admin, h.ImportSchoolsXlsx)
	r.Get("/import/template", h.ImportSchoolsTemplate)
	r.Post("/export/xlsx", admin, h.ExportSchoolsXlsx)
	r.Post("/bulk-delete", admin, h.BulkDelete)
	r.Post("/bulk-status", admin, h.BulkStatus)

	d := router.Group("/school-demographics", admin)
	d.Get("/", h.ListDemographics)
	d.Get("/:id", h.GetDemographic)
	d.Post("/", h.CreateDemographic)
	d.Put("/:id", h.UpdateDemographic)
	d.Delete("/:id", h.DeleteDemographic)
}

func (h *Handler) Create(c *fiber.Ctx) error {
	var req CreateSchoolReq
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(shared.Error(shared.ErrValidation, "Invalid request body"))
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
	f := ListFilter{
		Page:     page,
		Limit:    limit,
		Search:   c.Query("q", c.Query("search", "")),
		Type:     c.Query("type", ""),
		Level:    c.Query("level", ""),
		Province: c.Query("province", ""),
	}
	schools, total, err := h.svc.List(c.Context(), f)
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

func (h *Handler) ImportSchoolsXlsx(c *fiber.Ctx) error {
	fileHeader, err := c.FormFile("file")
	if err != nil {
		return c.Status(400).JSON(shared.Error(shared.ErrValidation, "file required"))
	}

	file, err := fileHeader.Open()
	if err != nil {
		return c.Status(500).JSON(shared.Error(shared.ErrInternal, "Failed to open file"))
	}
	defer file.Close()

	result, err := h.svc.ImportSchools(c.Context(), file, fileHeader.Filename)
	if err != nil {
		return c.Status(500).JSON(shared.Error(shared.ErrInternal, "Failed to import schools"))
	}
	return c.JSON(shared.Success(result))
}

func (h *Handler) ImportSchoolsTemplate(c *fiber.Ctx) error {
	c.Set("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
	c.Set("Content-Disposition", `attachment; filename="template-schools.xlsx"`)
	b, err := h.svc.SchoolImportTemplate(c.Context())
	if err != nil {
		return c.Status(500).JSON(shared.Error(shared.ErrInternal, "Failed to generate template"))
	}
	return c.Send(b)
}
