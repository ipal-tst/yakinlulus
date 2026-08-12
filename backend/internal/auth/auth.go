package auth

import (
	"context"
	"crypto/hmac"
	"crypto/sha256"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"log/slog"
	"slices"
	"strconv"
	"strings"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"golang.org/x/crypto/bcrypt"

	"yakinlulus.id/backend/internal/middleware"
	"yakinlulus.id/backend/internal/shared"
)

type User struct {
	ID             uuid.UUID  `json:"id"`
	Username       string     `json:"username"`
	Email          string     `json:"email"`
	PasswordHash   string     `json:"-"`
	FullName       string     `json:"full_name"`
	Role           string     `json:"role"`
	Status         string     `json:"status"`
	IsActive       bool       `json:"is_active"`
	GradeID        *uuid.UUID `json:"grade_id,omitempty"`
	SchoolID       *uuid.UUID `json:"school_id,omitempty"`
	SchoolName     *string    `json:"school_name,omitempty"`
	AcademicYearID *uuid.UUID `json:"academic_year_id,omitempty"`
	AvatarURL      *string    `json:"avatar_url,omitempty"`
	Gender         *string    `json:"gender,omitempty"`
	Phone          *string    `json:"phone,omitempty"`
	Major          *string    `json:"major,omitempty"`
	CreatedAt      time.Time  `json:"created_at"`
	UpdatedAt      time.Time  `json:"updated_at"`
}

type RegisterRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
	FullName string `json:"full_name"`
	Role     string `json:"role"`
}

type LoginRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

type UpdateProfileRequest struct {
	FullName   *string `json:"full_name,omitempty"`
	AvatarURL  *string `json:"avatar_url,omitempty"`
	SchoolName *string `json:"school_name,omitempty"`
	Gender     *string `json:"gender,omitempty"`
	Phone      *string `json:"phone,omitempty"`
	Major      *string `json:"major,omitempty"`
	GradeID    *string `json:"grade_id,omitempty"`
}

type ChangePasswordRequest struct {
	CurrentPassword string `json:"current_password"`
	NewPassword     string `json:"new_password"`
}

type AuthResponse struct {
	User  User   `json:"user"`
	Token string `json:"token"`
}

type Repository struct {
	pool *pgxpool.Pool
}

func NewRepository(pool *pgxpool.Pool) *Repository {
	return &Repository{pool: pool}
}

const userSelect = `
	SELECT u.id, u.email, u.password_hash, u.username, u.status,
	       COALESCE(p.full_name, ''), COALESCE(r.code, ''), (u.status = 'ACTIVE'),
	       u.avatar, p.gender, u.phone,
	       se.grade_id, se.school_id, se.academic_year_id, s.name, NULL::text AS major,
	       u.created_at, u.updated_at
	FROM identity.user u
	LEFT JOIN identity.user_profile p ON p.user_id = u.id
	LEFT JOIN LATERAL (
		SELECT r.code FROM identity.user_role ur
		JOIN identity.role r ON r.id = ur.role_id
		WHERE ur.user_id = u.id ORDER BY ur.is_primary DESC, r.priority ASC LIMIT 1
	) r ON true
	LEFT JOIN LATERAL (
		SELECT se.grade_id, se.school_id, se.academic_year_id
		FROM academic.student_enrollment se
		WHERE se.student_id = u.id
		ORDER BY se.updated_at DESC LIMIT 1
	) se ON true
	LEFT JOIN academic.school s ON s.id = se.school_id
`

func (r *Repository) scanUser(row pgx.Row) (*User, error) {
	u := &User{}
	err := row.Scan(&u.ID, &u.Email, &u.PasswordHash, &u.Username, &u.Status,
		&u.FullName, &u.Role, &u.IsActive, &u.AvatarURL, &u.Gender, &u.Phone,
		&u.GradeID, &u.SchoolID, &u.AcademicYearID, &u.SchoolName, &u.Major,
		&u.CreatedAt, &u.UpdatedAt)
	if err == pgx.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	return u, nil
}

func (r *Repository) FindByEmail(ctx context.Context, email string) (*User, error) {
	return r.scanUser(r.pool.QueryRow(ctx, userSelect+" WHERE u.email = $1 AND u.deleted_at IS NULL", email))
}

func (r *Repository) FindByID(ctx context.Context, id uuid.UUID) (*User, error) {
	return r.scanUser(r.pool.QueryRow(ctx, userSelect+" WHERE u.id = $1 AND u.deleted_at IS NULL", id))
}

type AcademicUpsert struct {
	SchoolID *uuid.UUID
	GradeID  *uuid.UUID
	MajorID  *uuid.UUID
}

func (r *Repository) resolveActiveAcademicYear(ctx context.Context) *uuid.UUID {
	var id uuid.UUID
	err := r.pool.QueryRow(ctx, `SELECT id FROM academic.academic_year WHERE is_active = true ORDER BY created_at DESC LIMIT 1`).Scan(&id)
	if err != nil {
		return nil
	}
	return &id
}

func (r *Repository) upsertEnrollment(ctx context.Context, tx pgx.Tx, userID uuid.UUID, academic *AcademicUpsert) error {
	if academic == nil || (academic.SchoolID == nil && academic.GradeID == nil && academic.MajorID == nil) {
		return nil
	}
	yearID := r.resolveActiveAcademicYear(ctx)
	if yearID == nil {
		return nil
	}
	_, err := tx.Exec(ctx, `
		INSERT INTO academic.student_enrollment (student_id, school_id, grade_id, major_id, academic_year_id, status)
		VALUES ($1, $2, $3, $4, $5, 'ACTIVE')
		ON CONFLICT (student_id, academic_year_id)
		DO UPDATE SET school_id = EXCLUDED.school_id, grade_id = EXCLUDED.grade_id,
		              major_id = EXCLUDED.major_id, updated_at = NOW()`,
		userID, academic.SchoolID, academic.GradeID, academic.MajorID, yearID)
	return err
}

func (r *Repository) Create(ctx context.Context, u *User, roleCode string, academic *AcademicUpsert) error {
	u.ID = uuid.New()
	u.Username = strings.ToLower(strings.Split(u.Email, "@")[0])
	username := u.Username
	var count int
	if err := r.pool.QueryRow(ctx, `SELECT COUNT(*) FROM identity.user WHERE username = $1`, username).Scan(&count); err == nil && count > 0 {
		username = fmt.Sprintf("%s_%s", u.Username, u.ID.String()[:8])
	}
	tx, err := r.pool.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)

	status := u.Status
	if status == "" {
		status = "ACTIVE"
	}
	_, err = tx.Exec(ctx, `
		INSERT INTO identity.user (id, username, email, phone, password_hash, status)
		VALUES ($1, $2, $3, $4, $5, $6)`,
		u.ID, username, u.Email, nilString(u.Phone), u.PasswordHash, status)
	if err != nil {
		return err
	}
	profileQ := `INSERT INTO identity.user_profile (user_id, full_name) VALUES ($1, $2)`
	profileArgs := []interface{}{u.ID, u.FullName}
	if u.Gender != nil {
		profileQ = `INSERT INTO identity.user_profile (user_id, full_name, gender) VALUES ($1, $2, $3)`
		profileArgs = append(profileArgs, nilString(u.Gender))
	}
	if _, err := tx.Exec(ctx, profileQ, profileArgs...); err != nil {
		return err
	}
	_, err = tx.Exec(ctx, `
		INSERT INTO identity.user_role (user_id, role_id, is_primary)
		SELECT $1, id, true FROM identity.role WHERE code = $2`,
		u.ID, roleCode)
	if err != nil {
		return err
	}
	if err := r.upsertEnrollment(ctx, tx, u.ID, academic); err != nil {
		return err
	}
	return tx.Commit(ctx)
}

func (r *Repository) UpdateProfile(ctx context.Context, id uuid.UUID, req UpdateProfileRequest) error {
	if req.FullName != nil || req.Gender != nil {
		q := "UPDATE identity.user_profile SET updated_at = NOW()"
		args := []interface{}{}
		n := 1
		if req.FullName != nil {
			q += fmt.Sprintf(", full_name = $%d", n)
			args = append(args, *req.FullName)
			n++
		}
		if req.Gender != nil {
			q += fmt.Sprintf(", gender = $%d", n)
			args = append(args, nilString(req.Gender))
			n++
		}
		q += fmt.Sprintf(" WHERE user_id = $%d", n)
		args = append(args, id)
		if _, err := r.pool.Exec(ctx, q, args...); err != nil {
			return err
		}
	}
	if req.Phone != nil || req.AvatarURL != nil {
		q := "UPDATE identity.user SET updated_at = NOW()"
		args := []interface{}{}
		n := 1
		if req.Phone != nil {
			q += fmt.Sprintf(", phone = $%d", n)
			args = append(args, nilString(req.Phone))
			n++
		}
		if req.AvatarURL != nil {
			q += fmt.Sprintf(", avatar = $%d", n)
			args = append(args, nilString(req.AvatarURL))
			n++
		}
		q += fmt.Sprintf(" WHERE id = $%d", n)
		args = append(args, id)
		if _, err := r.pool.Exec(ctx, q, args...); err != nil {
			return err
		}
	}
	// school_name, major, grade_id: resolusi via relasi Task 5; untuk sekarang no-op.
	return nil
}

func nilString(p *string) interface{} {
	if p == nil || *p == "" {
		return nil
	}
	return *p
}

func (r *Repository) GradeExists(ctx context.Context, gradeID uuid.UUID) (bool, error) {
	var ok bool
	err := r.pool.QueryRow(ctx, `SELECT EXISTS(SELECT 1 FROM academic.grade WHERE id = $1)`, gradeID).Scan(&ok)
	return ok, err
}

func (r *Repository) CreatePasswordReset(ctx context.Context, userID uuid.UUID, token, expiresAt string) error {
	_, err := r.pool.Exec(ctx,
		`INSERT INTO identity.password_reset (user_id, token, expired_at) VALUES ($1, $2, $3::timestamptz)`,
		userID, token, expiresAt)
	return err
}

func (r *Repository) FindPasswordReset(ctx context.Context, token string) (uuid.UUID, error) {
	var userID uuid.UUID
	err := r.pool.QueryRow(ctx,
		`SELECT user_id FROM identity.password_reset
		 WHERE token = $1 AND used_at IS NULL AND expired_at > NOW()
		 ORDER BY created_at DESC LIMIT 1`, token,
	).Scan(&userID)
	if err != nil {
		if err == pgx.ErrNoRows {
			return uuid.Nil, nil
		}
		return uuid.Nil, err
	}
	return userID, nil
}

func (r *Repository) MarkPasswordResetUsed(ctx context.Context, token string) error {
	_, err := r.pool.Exec(ctx, `
		UPDATE identity.password_reset SET used_at = NOW() WHERE token = $1`, token)
	return err
}

func (r *Repository) UpdatePassword(ctx context.Context, userID uuid.UUID, hash string) error {
	_, err := r.pool.Exec(ctx, `
		UPDATE identity.user SET password_hash = $1, updated_at = NOW() WHERE id = $2`, hash, userID)
	return err
}

func (r *Repository) FindSessionByRefreshToken(ctx context.Context, refreshToken string) (*Session, error) {
	s := &Session{}
	err := r.pool.QueryRow(ctx, `
		SELECT id, user_id, refresh_token, false AS is_revoked, expired_at
		FROM identity.login_session
		WHERE refresh_token = $1 AND logout_at IS NULL AND expired_at > NOW()`, refreshToken,
	).Scan(&s.ID, &s.UserID, &s.RefreshToken, &s.IsRevoked, &s.ExpiresAt)
	if err == pgx.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	return s, nil
}

func (r *Repository) CreateSession(ctx context.Context, userID uuid.UUID, accessToken, refreshToken string, expiresAt time.Time) error {
	_, err := r.pool.Exec(ctx, `
		INSERT INTO identity.login_session (user_id, access_token, refresh_token, expired_at)
		VALUES ($1, $2, $3, $4)`, userID, accessToken, refreshToken, expiresAt)
	return err
}

func (r *Repository) RevokeSession(ctx context.Context, refreshToken string) error {
	_, err := r.pool.Exec(ctx, `
		UPDATE identity.login_session SET logout_at = NOW() WHERE refresh_token = $1`, refreshToken)
	return err
}

type UserListFilter struct {
	Page           int
	Limit          int
	Q              string
	Role           string
	Status         string
	EducationLevel string
}

func itoa(n int) string { return strconv.Itoa(n) }

func buildUserWhere(f UserListFilter) (string, []interface{}) {
	conds := []string{"u.deleted_at IS NULL"}
	args := []interface{}{}
	n := 1
	if f.Q != "" {
		conds = append(conds, "(u.email ILIKE $"+itoa(n)+" OR p.full_name ILIKE $"+itoa(n)+" OR u.username ILIKE $"+itoa(n)+")")
		args = append(args, "%"+f.Q+"%")
		n++
	}
	if f.Role != "" {
		conds = append(conds, "r.code = $"+itoa(n))
		args = append(args, f.Role)
		n++
	}
	if f.Status != "" {
		conds = append(conds, "u.status = $"+itoa(n))
		args = append(args, f.Status)
		n++
	}
	if f.EducationLevel != "" {
		conds = append(conds, "el.code = $"+itoa(n))
		args = append(args, f.EducationLevel)
		n++
	}
	return " WHERE " + strings.Join(conds, " AND "), args
}

func (r *Repository) FindAll(ctx context.Context, f UserListFilter) ([]User, int, error) {
	where, args := buildUserWhere(f)
	argsWithP := append(args, f.Limit, (f.Page-1)*f.Limit)
	whereP := where + fmt.Sprintf(" ORDER BY u.created_at DESC LIMIT $%d OFFSET $%d", len(args)+1, len(args)+2)

	var total int
	if err := r.pool.QueryRow(ctx, `SELECT COUNT(*) FROM identity.user u
		LEFT JOIN identity.user_profile p ON p.user_id = u.id
		LEFT JOIN LATERAL (SELECT r.code FROM identity.user_role ur JOIN identity.role r ON r.id = ur.role_id WHERE ur.user_id = u.id ORDER BY ur.is_primary DESC, r.priority ASC LIMIT 1) r ON true
		LEFT JOIN LATERAL (SELECT se.grade_id, se.school_id FROM academic.student_enrollment se WHERE se.student_id = u.id ORDER BY se.updated_at DESC LIMIT 1) se ON true
		LEFT JOIN academic.grade g ON g.id = se.grade_id
		LEFT JOIN academic.education_level el ON el.id = g.education_level_id`+where, args...).Scan(&total); err != nil {
		return nil, 0, err
	}

	listQuery := userSelect + `LEFT JOIN academic.grade g ON g.id = se.grade_id
	LEFT JOIN academic.education_level el ON el.id = g.education_level_id`
	rows, err := r.pool.Query(ctx, listQuery+whereP, argsWithP...)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	var users []User
	for rows.Next() {
		u, err := r.scanUser(rows)
		if err != nil {
			return nil, 0, err
		}
		users = append(users, *u)
	}
	return users, total, nil
}

func (r *Repository) Search(ctx context.Context, q string, f UserListFilter) ([]User, int, error) {
	f.Q = q
	return r.FindAll(ctx, f)
}

func (r *Repository) SetActive(ctx context.Context, userID uuid.UUID, active bool) error {
	_, err := r.pool.Exec(ctx,
		`UPDATE identity.user SET status = CASE WHEN $2 THEN 'ACTIVE' ELSE 'INACTIVE' END, updated_at = NOW() WHERE id = $1`,
		userID, active)
	return err
}

func (r *Repository) UpdateUser(ctx context.Context, u *User, academic *AcademicUpsert) error {
	tx, err := r.pool.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)

	if _, err := tx.Exec(ctx, `
		UPDATE identity.user SET email = $1, phone = COALESCE($3, phone), updated_at = NOW() WHERE id = $2`,
		u.Email, u.ID, nilString(u.Phone)); err != nil {
		return err
	}

	profileQ := `INSERT INTO identity.user_profile (user_id, full_name) VALUES ($1, $2)
		ON CONFLICT (user_id) DO UPDATE SET full_name = EXCLUDED.full_name, updated_at = NOW()`
	profileArgs := []interface{}{u.ID, u.FullName}
	if u.Gender != nil {
		profileQ = `INSERT INTO identity.user_profile (user_id, full_name, gender) VALUES ($1, $2, $3)
			ON CONFLICT (user_id) DO UPDATE SET full_name = EXCLUDED.full_name, gender = EXCLUDED.gender, updated_at = NOW()`
		profileArgs = append(profileArgs, nilString(u.Gender))
	}
	if _, err := tx.Exec(ctx, profileQ, profileArgs...); err != nil {
		return err
	}

	if u.Status != "" {
		if _, err := tx.Exec(ctx, `UPDATE identity.user SET status = $1, updated_at = NOW() WHERE id = $2`, u.Status, u.ID); err != nil {
			return err
		}
	}

	if u.Role != "" {
		if _, err := tx.Exec(ctx, `DELETE FROM identity.user_role WHERE user_id = $1`, u.ID); err != nil {
			return err
		}
		if _, err := tx.Exec(ctx, `
			INSERT INTO identity.user_role (user_id, role_id, is_primary)
			SELECT $1, id, true FROM identity.role WHERE code = $2`, u.ID, u.Role); err != nil {
			return err
		}
	}

	if err := r.upsertEnrollment(ctx, tx, u.ID, academic); err != nil {
		return err
	}
	return tx.Commit(ctx)
}

func (r *Repository) SoftDelete(ctx context.Context, id uuid.UUID) error {
	var active bool
	err := r.pool.QueryRow(ctx, `
		SELECT EXISTS(SELECT 1 FROM academic.student_enrollment
		              WHERE student_id = $1 AND status = 'ACTIVE')`, id).Scan(&active)
	if err != nil {
		return err
	}
	if active {
		return fiber.NewError(fiber.StatusConflict, "User has active student enrollment")
	}
	_, err = r.pool.Exec(ctx, `
		UPDATE identity.user SET deleted_at = NOW(), status = 'INACTIVE' WHERE id = $1 AND deleted_at IS NULL`, id)
	return err
}

type Session struct {
	ID           uuid.UUID
	UserID       uuid.UUID
	RefreshToken string
	IsRevoked    bool
	ExpiresAt    time.Time
}

// --- Service ---
type Service struct {
	repo      *Repository
	jwtSecret string
}

func NewService(repo *Repository, jwtSecret string) *Service {
	return &Service{repo: repo, jwtSecret: jwtSecret}
}

func (s *Service) Register(ctx context.Context, req RegisterRequest) (*AuthResponse, error) {
	req.Email = strings.TrimSpace(strings.ToLower(req.Email))
	if req.Email == "" || req.Password == "" || req.FullName == "" || req.Role == "" {
		return nil, fiber.NewError(fiber.StatusBadRequest, "All fields are required")
	}
	if !strings.Contains(req.Email, "@") {
		return nil, fiber.NewError(fiber.StatusBadRequest, "Invalid email")
	}
	if len(req.Password) < 10 {
		return nil, fiber.NewError(fiber.StatusBadRequest, "Password min 10 characters")
	}
	hasUpper, hasLower, hasDigit, hasSpecial := false, false, false, false
	for _, c := range req.Password {
		switch {
		case c >= 'A' && c <= 'Z':
			hasUpper = true
		case c >= 'a' && c <= 'z':
			hasLower = true
		case c >= '0' && c <= '9':
			hasDigit = true
		case c > 32 && c < 127:
			hasSpecial = true
		}
	}
	if !hasUpper || !hasLower || !hasDigit || !hasSpecial {
		return nil, fiber.NewError(fiber.StatusBadRequest, "Password must contain uppercase, lowercase, digit, and special character")
	}
	if err := validatePublicRegisterRole(req.Role); err != nil {
		return nil, err
	}
	existing, _ := s.repo.FindByEmail(ctx, req.Email)
	if existing != nil {
		return nil, fiber.NewError(fiber.StatusConflict, "Email already registered")
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		return nil, fiber.NewError(fiber.StatusInternalServerError, "Failed to hash password")
	}

	user := &User{
		Email:        req.Email,
		PasswordHash: string(hash),
		FullName:     req.FullName,
		Role:         middleware.RoleSiswa,
	}

	if err := s.repo.Create(ctx, user, middleware.RoleSiswa, nil); err != nil {
		slog.Error("register Create failed", "email", req.Email, "error", err)
		return nil, fiber.NewError(fiber.StatusInternalServerError, "Failed to create user")
	}

	token, err := generateToken(user.ID.String(), user.Role, s.jwtSecret)
	if err != nil {
		return nil, fiber.NewError(fiber.StatusInternalServerError, "Failed to generate token")
	}

	return &AuthResponse{User: *user, Token: token}, nil
}

func (s *Service) Login(ctx context.Context, req LoginRequest) (*AuthResponse, error) {
	req.Email = strings.TrimSpace(strings.ToLower(req.Email))
	if req.Email == "" || req.Password == "" {
		return nil, fiber.NewError(fiber.StatusBadRequest, "Email and password required")
	}

	user, err := s.repo.FindByEmail(ctx, req.Email)
	if err != nil {
		slog.Error("login FindByEmail failed", "email", req.Email, "error", err)
		return nil, fiber.NewError(fiber.StatusInternalServerError, "Database error")
	}
	if user == nil {
		return nil, fiber.NewError(fiber.StatusUnauthorized, "Invalid email or password")
	}
	if !user.IsActive {
		return nil, fiber.NewError(fiber.StatusForbidden, "Account is inactive")
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(req.Password)); err != nil {
		return nil, fiber.NewError(fiber.StatusUnauthorized, "Invalid email or password")
	}

	token, err := generateToken(user.ID.String(), user.Role, s.jwtSecret)
	if err != nil {
		return nil, fiber.NewError(fiber.StatusInternalServerError, "Failed to generate token")
	}

	return &AuthResponse{User: *user, Token: token}, nil
}

func (s *Service) GetMe(ctx context.Context, userID uuid.UUID) (*User, error) {
	user, err := s.repo.FindByID(ctx, userID)
	if err != nil {
		return nil, err
	}
	if user == nil {
		return nil, fiber.NewError(fiber.StatusNotFound, "User not found")
	}
	return user, nil
}

func (s *Service) UpdateProfile(ctx context.Context, userID uuid.UUID, role string, req UpdateProfileRequest) (*User, error) {
	req = restrictGradeSchoolForRole(req, role)
	if err := validateProfileRequest(req); err != nil {
		return nil, err
	}
	if req.GradeID != nil && *req.GradeID != "" {
		gid, _ := uuid.Parse(*req.GradeID)
		exists, err := s.repo.GradeExists(ctx, gid)
		if err != nil {
			return nil, fiber.NewError(fiber.StatusInternalServerError, "Failed to validate grade")
		}
		if !exists {
			return nil, fiber.NewError(fiber.StatusBadRequest, "grade not found")
		}
	}
	if err := s.repo.UpdateProfile(ctx, userID, req); err != nil {
		return nil, fiber.NewError(fiber.StatusInternalServerError, "Failed to update profile")
	}
	return s.repo.FindByID(ctx, userID)
}

func (s *Service) ChangePassword(ctx context.Context, userID uuid.UUID, req ChangePasswordRequest) error {
	if req.CurrentPassword == "" || req.NewPassword == "" {
		return fiber.NewError(fiber.StatusBadRequest, "Current and new password required")
	}
	if err := validatePassword(req.NewPassword); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, err.Error())
	}

	user, err := s.repo.FindByID(ctx, userID)
	if err != nil {
		return fiber.NewError(fiber.StatusInternalServerError, "Database error")
	}
	if user == nil {
		return fiber.NewError(fiber.StatusNotFound, "User not found")
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(req.CurrentPassword)); err != nil {
		return fiber.NewError(fiber.StatusUnauthorized, "Current password is incorrect")
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(req.NewPassword), bcrypt.DefaultCost)
	if err != nil {
		return fiber.NewError(fiber.StatusInternalServerError, "Failed to hash password")
	}
	if err := s.repo.UpdatePassword(ctx, userID, string(hash)); err != nil {
		return fiber.NewError(fiber.StatusInternalServerError, "Failed to update password")
	}
	return nil
}

type Handler struct {
	svc *Service
	jwt string
}

func NewHandler(svc *Service, jwtSecret string) *Handler {
	return &Handler{svc: svc, jwt: jwtSecret}
}

func (h *Handler) RegisterRoutes(router fiber.Router) {
	r := router.Group("/auth")
	r.Post("/register", h.Register)
	r.Post("/login", h.Login)
	r.Post("/forgot-password", h.ForgotPassword)
	r.Post("/reset-password", h.ResetPassword)

	// Protected routes
	authed := r.Group("", middleware.RequireAuth(h.jwt))
	authed.Get("/me", h.GetMe)
	authed.Put("/profile", h.UpdateProfile)
	authed.Post("/change-password", h.ChangePassword)
	authed.Post("/logout", h.Logout)
	authed.Post("/refresh", h.Refresh)

	// Admin routes
	admin := r.Group("", middleware.RequireAuth(h.jwt), middleware.RequireRole("SUPER_ADMIN", "STAFF"))
	admin.Get("/users", h.ListUsers)
	admin.Get("/users/search", h.SearchUsers)
	admin.Get("/users/import/template", h.UsersImportTemplate)
	admin.Post("/users/import/xlsx", h.ImportUsersXlsx)
	admin.Post("/users/export/xlsx", h.ExportUsersXlsx)
	admin.Post("/users/bulk-delete", h.BulkDeleteUsers)
	admin.Post("/users/bulk-status", h.BulkStatusUsers)
	admin.Get("/users/:id", h.AdminGetUser)
	admin.Post("/users", h.AdminCreateUser)
	admin.Put("/users/:id", h.AdminUpdateUser)
	admin.Patch("/users/:id/activate", h.ActivateUser)
	admin.Delete("/users/:id", h.AdminDeleteUser)
	admin.Get("/roles", h.ListRoles)
	admin.Get("/roles/:id/permissions", h.GetRolePermissions)
	admin.Put("/roles/:id/permissions", h.UpdateRolePermissions)

	saOnly := r.Group("", middleware.RequireAuth(h.jwt), middleware.RequireRole("SUPER_ADMIN"))
	saOnly.Post("/roles", h.CreateRole)
	saOnly.Put("/roles/:id", h.UpdateRole)
	saOnly.Delete("/roles/:id", h.DeleteRole)
}

func (h *Handler) Register(c *fiber.Ctx) error {
	var req RegisterRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(shared.Error(shared.ErrValidation, "Invalid request body"))
	}
	resp, err := h.svc.Register(c.Context(), req)
	if err != nil {
		if e, ok := err.(*fiber.Error); ok {
			return c.Status(e.Code).JSON(shared.Error(shared.ErrorCode(e.Message), e.Message))
		}
		return c.Status(500).JSON(shared.Error(shared.ErrInternal, "Internal error"))
	}
	return c.Status(201).JSON(shared.Success(resp))
}

func (h *Handler) Login(c *fiber.Ctx) error {
	var req LoginRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(shared.Error(shared.ErrValidation, "Invalid request body"))
	}
	resp, err := h.svc.Login(c.Context(), req)
	if err != nil {
		if e, ok := err.(*fiber.Error); ok {
			return c.Status(e.Code).JSON(shared.Error(shared.ErrorCode(e.Message), e.Message))
		}
		return c.Status(500).JSON(shared.Error(shared.ErrInternal, "Internal error"))
	}
	c.Cookie(&fiber.Cookie{
		Name:     "token",
		Value:    resp.Token,
		HTTPOnly: true,
		Secure:   false,
		SameSite: "Lax",
		Path:     "/",
	})
	c.Cookie(&fiber.Cookie{
		Name:     "yakinlulus-role",
		Value:    resp.User.Role,
		HTTPOnly: false,
		Secure:   false,
		SameSite: "Lax",
		Path:     "/",
	})
	c.Cookie(&fiber.Cookie{
		Name:     "yakinlulus-token",
		Value:    resp.Token,
		HTTPOnly: false,
		Secure:   false,
		SameSite: "Lax",
		Path:     "/",
	})
	return c.JSON(shared.Success(resp))
}

func (h *Handler) Logout(c *fiber.Ctx) error {
	c.Cookie(&fiber.Cookie{
		Name:     "token",
		Value:    "",
		HTTPOnly: true,
		Secure:   false,
		SameSite: "Lax",
		Path:     "/",
		MaxAge:   -1,
	})
	c.Cookie(&fiber.Cookie{
		Name:     "yakinlulus-role",
		Value:    "",
		HTTPOnly: false,
		Secure:   false,
		SameSite: "Lax",
		Path:     "/",
		MaxAge:   -1,
	})
	c.Cookie(&fiber.Cookie{
		Name:     "yakinlulus-token",
		Value:    "",
		HTTPOnly: false,
		Secure:   false,
		SameSite: "Lax",
		Path:     "/",
		MaxAge:   -1,
	})
	return c.JSON(shared.Success(fiber.Map{"message": "Logged out"}))
}

func (h *Handler) GetMe(c *fiber.Ctx) error {
	userIDStr := c.Locals("user_id")
	if userIDStr == nil {
		return c.Status(401).JSON(shared.Error(shared.ErrUnauthorized, "Not authenticated"))
	}
	userID, err := uuid.Parse(userIDStr.(string))
	if err != nil {
		return c.Status(400).JSON(shared.Error(shared.ErrValidation, "Invalid user ID"))
	}
	user, err := h.svc.GetMe(c.Context(), userID)
	if err != nil {
		if e, ok := err.(*fiber.Error); ok {
			return c.Status(e.Code).JSON(shared.Error(shared.ErrorCode(e.Message), e.Message))
		}
		return c.Status(500).JSON(shared.Error(shared.ErrInternal, "Internal error"))
	}
	return c.JSON(shared.Success(user))
}

func (h *Handler) UpdateProfile(c *fiber.Ctx) error {
	userIDStr := c.Locals("user_id")
	if userIDStr == nil {
		return c.Status(401).JSON(shared.Error(shared.ErrUnauthorized, "Not authenticated"))
	}
	userID, err := uuid.Parse(userIDStr.(string))
	if err != nil {
		return c.Status(400).JSON(shared.Error(shared.ErrValidation, "Invalid user ID"))
	}
	role, _ := c.Locals("role").(string)
	var req UpdateProfileRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(shared.Error(shared.ErrValidation, "Invalid request body"))
	}
	user, err := h.svc.UpdateProfile(c.Context(), userID, role, req)
	if err != nil {
		if e, ok := err.(*fiber.Error); ok {
			return c.Status(e.Code).JSON(shared.Error(shared.ErrorCode(e.Message), e.Message))
		}
		return c.Status(500).JSON(shared.Error(shared.ErrInternal, "Internal error"))
	}
	return c.JSON(shared.Success(user))
}

func (h *Handler) ChangePassword(c *fiber.Ctx) error {
	userIDStr := c.Locals("user_id")
	if userIDStr == nil {
		return c.Status(401).JSON(shared.Error(shared.ErrUnauthorized, "Not authenticated"))
	}
	userID, err := uuid.Parse(userIDStr.(string))
	if err != nil {
		return c.Status(400).JSON(shared.Error(shared.ErrValidation, "Invalid user ID"))
	}
	var req ChangePasswordRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(shared.Error(shared.ErrValidation, "Invalid request body"))
	}
	if err := h.svc.ChangePassword(c.Context(), userID, req); err != nil {
		if e, ok := err.(*fiber.Error); ok {
			return c.Status(e.Code).JSON(shared.Error(shared.ErrorCode(e.Message), e.Message))
		}
		return c.Status(500).JSON(shared.Error(shared.ErrInternal, "Internal error"))
	}
	return c.JSON(shared.Success(fiber.Map{"message": "Password changed successfully"}))
}

func (h *Handler) ForgotPassword(c *fiber.Ctx) error {
	var req struct {
		Email string `json:"email"`
	}
	if err := c.BodyParser(&req); err != nil || req.Email == "" {
		return c.Status(400).JSON(shared.Error(shared.ErrValidation, "Email is required"))
	}
	_ = h.svc.ForgotPassword(c.Context(), req.Email)
	// Always return success to prevent email enumeration
	return c.JSON(shared.Success(fiber.Map{"message": "If email exists, reset link sent"}))
}

func (h *Handler) ResetPassword(c *fiber.Ctx) error {
	var req struct {
		Token    string `json:"token"`
		Password string `json:"password"`
	}
	if err := c.BodyParser(&req); err != nil || req.Token == "" || req.Password == "" {
		return c.Status(400).JSON(shared.Error(shared.ErrValidation, "Token and password required"))
	}
	if err := validatePassword(req.Password); err != nil {
		return c.Status(400).JSON(shared.Error(shared.ErrValidation, err.Error()))
	}
	err := h.svc.ResetPassword(c.Context(), req.Token, req.Password)
	if err != nil {
		if e, ok := err.(*fiber.Error); ok {
			return c.Status(e.Code).JSON(shared.Error(shared.ErrorCode(e.Message), e.Message))
		}
		return c.Status(500).JSON(shared.Error(shared.ErrInternal, "Internal error"))
	}
	return c.JSON(shared.Success(fiber.Map{"message": "Password reset successful"}))
}

func (h *Handler) ListUsers(c *fiber.Ctx) error {
	page, limit := shared.ParsePagination(c)
	users, total, err := h.svc.repo.FindAll(c.Context(), UserListFilter{Page: page, Limit: limit})
	if err != nil {
		return c.Status(500).JSON(shared.Error(shared.ErrInternal, "Failed to list users"))
	}
	return c.JSON(shared.SuccessWithMeta(users, shared.BuildMeta(page, limit, total)))
}

func (h *Handler) SearchUsers(c *fiber.Ctx) error {
	q := c.Query("q")
	if q == "" {
		return h.ListUsers(c)
	}
	page, limit := shared.ParsePagination(c)
	users, total, err := h.svc.repo.Search(c.Context(), q, UserListFilter{Page: page, Limit: limit})
	if err != nil {
		return c.Status(500).JSON(shared.Error(shared.ErrInternal, "Failed to search users"))
	}
	return c.JSON(shared.SuccessWithMeta(users, shared.BuildMeta(page, limit, total)))
}

func (h *Handler) ActivateUser(c *fiber.Ctx) error {
	userID, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(400).JSON(shared.Error(shared.ErrValidation, "Invalid user ID"))
	}
	var req struct {
		Active bool `json:"active"`
	}
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(shared.Error(shared.ErrValidation, "Invalid request body"))
	}
	if err := h.svc.repo.SetActive(c.Context(), userID, req.Active); err != nil {
		return c.Status(500).JSON(shared.Error(shared.ErrInternal, "Failed to update user status"))
	}
	return c.JSON(shared.Success(fiber.Map{"message": "User status updated"}))
}

func (h *Handler) Refresh(c *fiber.Ctx) error {
	var req struct {
		RefreshToken string `json:"refresh_token"`
	}
	if err := c.BodyParser(&req); err != nil || req.RefreshToken == "" {
		return c.Status(400).JSON(shared.Error(shared.ErrValidation, "refresh_token required"))
	}
	resp, err := h.svc.Refresh(c.Context(), c.Locals("user_id").(string), req.RefreshToken)
	if err != nil {
		if e, ok := err.(*fiber.Error); ok {
			return c.Status(e.Code).JSON(shared.Error(shared.ErrorCode(e.Message), e.Message))
		}
		return c.Status(500).JSON(shared.Error(shared.ErrInternal, "Internal error"))
	}
	return c.JSON(shared.Success(resp))
}

func (s *Service) ForgotPassword(ctx context.Context, email string) error {
	user, _ := s.repo.FindByEmail(ctx, email)
	if user == nil {
		return nil // prevent enumeration
	}
	token, _ := generateToken(user.ID.String(), "reset", s.jwtSecret)
	expiresAt := time.Now().Add(15 * time.Minute)
	return s.repo.CreatePasswordReset(ctx, user.ID, token, expiresAt.Format(time.RFC3339))
}

func (s *Service) ResetPassword(ctx context.Context, token, password string) error {
	if err := validatePassword(password); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, err.Error())
	}
	userID, err := s.repo.FindPasswordReset(ctx, token)
	if err != nil {
		return fiber.NewError(fiber.StatusInternalServerError, "Database error")
	}
	if userID == uuid.Nil {
		return fiber.NewError(fiber.StatusBadRequest, "Invalid or expired token")
	}
	hash, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return fiber.NewError(fiber.StatusInternalServerError, "Failed to hash password")
	}
	if err := s.repo.UpdatePassword(ctx, userID, string(hash)); err != nil {
		return fiber.NewError(fiber.StatusInternalServerError, "Failed to update password")
	}
	return s.repo.MarkPasswordResetUsed(ctx, token)
}

func (s *Service) Refresh(ctx context.Context, userIDStr, refreshToken string) (*AuthResponse, error) {
	session, err := s.repo.FindSessionByRefreshToken(ctx, refreshToken)
	if err != nil {
		return nil, fiber.NewError(fiber.StatusInternalServerError, "Database error")
	}
	if session == nil {
		return nil, fiber.NewError(fiber.StatusUnauthorized, "Invalid or expired refresh token")
	}

	user, err := s.repo.FindByID(ctx, session.UserID)
	if err != nil || user == nil {
		return nil, fiber.NewError(fiber.StatusUnauthorized, "User not found")
	}
	if !user.IsActive {
		return nil, fiber.NewError(fiber.StatusForbidden, "Account is inactive")
	}

	// Revoke old, issue new
	_ = s.repo.RevokeSession(ctx, refreshToken)
	newToken, _ := generateToken(user.ID.String(), user.Role, s.jwtSecret)
	newRefresh := uuid.New().String()
	_ = s.repo.CreateSession(ctx, user.ID, newToken, newRefresh, time.Now().Add(30*24*time.Hour))

	return &AuthResponse{User: *user, Token: newToken}, nil
}

func validatePassword(password string) error {
	if len(password) < 10 {
		return fmt.Errorf("Password min 10 characters")
	}
	hasUpper, hasLower, hasDigit, hasSpecial := false, false, false, false
	for _, c := range password {
		switch {
		case c >= 'A' && c <= 'Z':
			hasUpper = true
		case c >= 'a' && c <= 'z':
			hasLower = true
		case c >= '0' && c <= '9':
			hasDigit = true
		case c > 32 && c < 127:
			hasSpecial = true
		}
	}
	if !hasUpper || !hasLower || !hasDigit || !hasSpecial {
		return fmt.Errorf("Password must contain uppercase, lowercase, digit, and special character")
	}
	return nil
}

func validatePublicRegisterRole(role string) error {
	if role == middleware.RoleSiswa {
		return nil
	}
	return fiber.NewError(fiber.StatusBadRequest, "Public registration only allows role SISWA")
}

func restrictGradeSchoolForRole(req UpdateProfileRequest, role string) UpdateProfileRequest {
	switch role {
	case middleware.RoleSuperAdmin, middleware.RoleStaff, middleware.RoleGuru:
		return req
	default:
		req.GradeID = nil
		req.SchoolName = nil
		return req
	}
}

func validateProfileRequest(req UpdateProfileRequest) error {
	if req.Gender != nil && *req.Gender != "" && *req.Gender != "L" && *req.Gender != "P" {
		return fiber.NewError(fiber.StatusBadRequest, "gender must be L or P")
	}
	if req.Major != nil && *req.Major != "" && !slices.Contains([]string{"IPA", "IPS", "BAHASA", "OLAHRAGA"}, *req.Major) {
		return fiber.NewError(fiber.StatusBadRequest, "major must be IPA, IPS, BAHASA, or OLAHRAGA")
	}
	if req.Phone != nil && len(*req.Phone) > 20 {
		return fiber.NewError(fiber.StatusBadRequest, "phone must not exceed 20 characters")
	}
	if req.GradeID != nil && *req.GradeID != "" {
		if _, err := uuid.Parse(*req.GradeID); err != nil {
			return fiber.NewError(fiber.StatusBadRequest, "grade_id must be a valid UUID")
		}
	}
	return nil
}

// --- JWT ---

type jwtHeader struct {
	Alg string `json:"alg"`
	Typ string `json:"typ"`
}

type jwtPayload struct {
	Sub  string `json:"sub"`
	Role string `json:"role"`
	Iat  int64  `json:"iat"`
	Exp  int64  `json:"exp"`
}

func generateToken(userID, role, secret string) (string, error) {
	header := jwtHeader{Alg: "HS256", Typ: "JWT"}
	payload := jwtPayload{
		Sub:  userID,
		Role: role,
		Iat:  time.Now().Unix(),
		Exp:  time.Now().Add(24 * time.Hour).Unix(),
	}

	headerB, _ := json.Marshal(header)
	payloadB, _ := json.Marshal(payload)

	headerEnc := base64.RawURLEncoding.EncodeToString(headerB)
	payloadEnc := base64.RawURLEncoding.EncodeToString(payloadB)

	sigInput := headerEnc + "." + payloadEnc
	mac := hmac.New(sha256.New, []byte(secret))
	mac.Write([]byte(sigInput))
	sig := base64.RawURLEncoding.EncodeToString(mac.Sum(nil))

	return sigInput + "." + sig, nil
}
