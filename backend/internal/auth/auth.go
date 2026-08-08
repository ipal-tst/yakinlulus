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
	ID           uuid.UUID  `json:"id"`
	Email        string     `json:"email"`
	PasswordHash string     `json:"-"`
	FullName     string     `json:"full_name"`
	Role         string     `json:"role"`
	GradeID      *uuid.UUID `json:"grade_id,omitempty"`
	IsActive     bool       `json:"is_active"`
	AvatarURL    *string    `json:"avatar_url,omitempty"`
	SchoolName   *string    `json:"school_name,omitempty"`
	Gender       *string    `json:"gender,omitempty"`
	Phone        *string    `json:"phone,omitempty"`
	Major        *string    `json:"major,omitempty"`
	CreatedAt    time.Time  `json:"created_at"`
	UpdatedAt    time.Time  `json:"updated_at"`
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
	SELECT u.id, u.email, u.password_hash,
	       COALESCE(p.full_name, ''), COALESCE(r.code, ''), (u.status = 'ACTIVE'), u.avatar,
	       NULL::uuid AS grade_id, NULL::text AS school_name,
	       p.gender, u.phone, NULL::text AS major,
	       u.created_at, u.updated_at
	FROM identity.user u
	LEFT JOIN identity.user_profile p ON p.user_id = u.id
	LEFT JOIN LATERAL (
		SELECT r.code FROM identity.user_role ur
		JOIN identity.role r ON r.id = ur.role_id
		WHERE ur.user_id = u.id ORDER BY ur.is_primary DESC, r.priority ASC LIMIT 1
	) r ON true
`

func (r *Repository) FindByEmail(ctx context.Context, email string) (*User, error) {
	u := &User{}
	err := r.pool.QueryRow(ctx, userSelect+" WHERE u.email = $1 AND u.deleted_at IS NULL", email).
		Scan(&u.ID, &u.Email, &u.PasswordHash, &u.FullName, &u.Role, &u.IsActive, &u.AvatarURL,
			&u.GradeID, &u.SchoolName, &u.Gender, &u.Phone, &u.Major, &u.CreatedAt, &u.UpdatedAt)
	if err == pgx.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	return u, nil
}

func (r *Repository) FindByID(ctx context.Context, id uuid.UUID) (*User, error) {
	u := &User{}
	err := r.pool.QueryRow(ctx, userSelect+" WHERE u.id = $1 AND u.deleted_at IS NULL", id).
		Scan(&u.ID, &u.Email, &u.PasswordHash, &u.FullName, &u.Role, &u.IsActive, &u.AvatarURL,
			&u.GradeID, &u.SchoolName, &u.Gender, &u.Phone, &u.Major, &u.CreatedAt, &u.UpdatedAt)
	if err == pgx.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	return u, nil
}

func (r *Repository) Create(ctx context.Context, u *User) error {
	u.ID = uuid.New()
	baseUsername := strings.ToLower(strings.Split(u.Email, "@")[0])
	username := baseUsername
	var count int
	if err := r.pool.QueryRow(ctx, `SELECT COUNT(*) FROM identity.user WHERE username = $1`, username).Scan(&count); err == nil && count > 0 {
		username = fmt.Sprintf("%s_%s", baseUsername, u.ID.String()[:8])
	}
	tx, err := r.pool.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)

	_, err = tx.Exec(ctx, `
		INSERT INTO identity.user (id, username, email, password_hash, status)
		VALUES ($1, $2, $3, $4, 'ACTIVE')`,
		u.ID, username, u.Email, u.PasswordHash)
	if err != nil {
		return err
	}
	_, err = tx.Exec(ctx, `
		INSERT INTO identity.user_profile (user_id, full_name) VALUES ($1, $2)`,
		u.ID, u.FullName)
	if err != nil {
		return err
	}
	// Attach SISWA role.
	_, err = tx.Exec(ctx, `
		INSERT INTO identity.user_role (user_id, role_id, is_primary)
		SELECT $1, id, true FROM identity.role WHERE code = $2`,
		u.ID, middleware.RoleSiswa)
	if err != nil {
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

func (r *Repository) FindAll(ctx context.Context, page, limit int) ([]User, int, error) {
	var total int
	err := r.pool.QueryRow(ctx, `SELECT COUNT(*) FROM identity.user u WHERE u.deleted_at IS NULL`).Scan(&total)
	if err != nil {
		return nil, 0, err
	}

	offset := (page - 1) * limit
	rows, err := r.pool.Query(ctx,
		userSelect+` WHERE u.deleted_at IS NULL ORDER BY u.created_at DESC LIMIT $1 OFFSET $2`, limit, offset)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	var users []User
	for rows.Next() {
		var u User
		if err := rows.Scan(&u.ID, &u.Email, &u.PasswordHash, &u.FullName, &u.Role,
			&u.IsActive, &u.AvatarURL, &u.GradeID, &u.SchoolName, &u.Gender, &u.Phone, &u.Major, &u.CreatedAt, &u.UpdatedAt); err != nil {
			return nil, 0, err
		}
		users = append(users, u)
	}
	return users, total, nil
}

func (r *Repository) SetActive(ctx context.Context, userID uuid.UUID, active bool) error {
	_, err := r.pool.Exec(ctx,
		`UPDATE identity.user SET status = CASE WHEN $2 THEN 'ACTIVE' ELSE 'INACTIVE' END, updated_at = NOW() WHERE id = $1`,
		userID, active)
	return err
}

// buildUpdateUserQuery returns the identity.user statement used by UpdateUser.
func buildUpdateUserQuery() string {
	return "UPDATE identity.user SET email = $1, updated_at = NOW() WHERE id = $2"
}

func (r *Repository) UpdateUser(ctx context.Context, u *User) error {
	tx, err := r.pool.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)

	if _, err := tx.Exec(ctx, buildUpdateUserQuery(), u.Email, u.ID); err != nil {
		return err
	}

	profileQ := `INSERT INTO identity.user_profile (user_id, full_name) VALUES ($1, $2) ON CONFLICT (user_id) DO UPDATE SET full_name = EXCLUDED.full_name, updated_at = NOW()`
	profileArgs := []interface{}{u.ID, u.FullName}
	if u.Gender != nil {
		profileQ = `INSERT INTO identity.user_profile (user_id, full_name, gender) VALUES ($1, $2, $3) ON CONFLICT (user_id) DO UPDATE SET full_name = EXCLUDED.full_name, gender = EXCLUDED.gender, updated_at = NOW()`
		profileArgs = append(profileArgs, nilString(u.Gender))
	}
	if _, err := tx.Exec(ctx, profileQ, profileArgs...); err != nil {
		return err
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

	return tx.Commit(ctx)
}

func (r *Repository) SoftDelete(ctx context.Context, id uuid.UUID) error {
	tx, err := r.pool.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)

	if _, err := tx.Exec(ctx, `DELETE FROM identity.login_session WHERE user_id = $1`, id); err != nil {
		return err
	}
	if _, err := tx.Exec(ctx, `DELETE FROM identity.password_reset WHERE user_id = $1`, id); err != nil {
		return err
	}
	if _, err := tx.Exec(ctx, `DELETE FROM identity.user WHERE id = $1`, id); err != nil {
		return err
	}
	return tx.Commit(ctx)
}

func (r *Repository) Search(ctx context.Context, q string, page, limit int) ([]User, int, error) {
	var total int
	pattern := "%" + q + "%"
	err := r.pool.QueryRow(ctx,
		`SELECT COUNT(*) FROM identity.user u
		 LEFT JOIN identity.user_profile p ON p.user_id = u.id
		 WHERE u.deleted_at IS NULL AND (u.email ILIKE $1 OR p.full_name ILIKE $1)`, pattern,
	).Scan(&total)
	if err != nil {
		return nil, 0, err
	}

	offset := (page - 1) * limit
	rows, err := r.pool.Query(ctx,
		userSelect+` WHERE u.deleted_at IS NULL AND (u.email ILIKE $1 OR p.full_name ILIKE $1)
		 ORDER BY u.created_at DESC LIMIT $2 OFFSET $3`, pattern, limit, offset)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	var users []User
	for rows.Next() {
		var u User
		if err := rows.Scan(&u.ID, &u.Email, &u.PasswordHash, &u.FullName, &u.Role,
			&u.IsActive, &u.AvatarURL, &u.GradeID, &u.SchoolName, &u.Gender, &u.Phone, &u.Major, &u.CreatedAt, &u.UpdatedAt); err != nil {
			return nil, 0, err
		}
		users = append(users, u)
	}
	return users, total, nil
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

	if err := s.repo.Create(ctx, user); err != nil {
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
	admin.Get("/users/:id", h.AdminGetUser)
	admin.Post("/users", h.AdminCreateUser)
	admin.Put("/users/:id", h.AdminUpdateUser)
	admin.Delete("/users/:id", h.AdminDeleteUser)
	admin.Patch("/users/:id/activate", h.ActivateUser)
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
	users, total, err := h.svc.repo.FindAll(c.Context(), page, limit)
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
	users, total, err := h.svc.repo.Search(c.Context(), q, page, limit)
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

// --- Admin User CRUD ---

type AdminCreateUserReq struct {
	Email    string `json:"email"`
	Password string `json:"password"`
	FullName string `json:"full_name"`
	Role     string `json:"role"`
}

type AdminUpdateUserReq struct {
	Email      *string    `json:"email,omitempty"`
	FullName   *string    `json:"full_name,omitempty"`
	Role       *string    `json:"role,omitempty"`
	IsActive   *bool      `json:"is_active,omitempty"`
	GradeID    *uuid.UUID `json:"grade_id,omitempty"`
	SchoolName *string    `json:"school_name,omitempty"`
}

func (h *Handler) AdminGetUser(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(400).JSON(shared.Error(shared.ErrValidation, "Invalid user ID"))
	}
	user, err := h.svc.repo.FindByID(c.Context(), id)
	if err != nil {
		return c.Status(500).JSON(shared.Error(shared.ErrInternal, "Failed to get user"))
	}
	if user == nil {
		return c.Status(404).JSON(shared.Error(shared.ErrNotFound, "User not found"))
	}
	return c.JSON(shared.Success(user))
}

func (h *Handler) AdminCreateUser(c *fiber.Ctx) error {
	var req AdminCreateUserReq
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(shared.Error(shared.ErrValidation, "Invalid request body"))
	}
	if req.Email == "" || req.Password == "" || req.FullName == "" || req.Role == "" {
		return c.Status(400).JSON(shared.Error(shared.ErrValidation, "email, password, full_name, role required"))
	}
	if err := validatePassword(req.Password); err != nil {
		return c.Status(400).JSON(shared.Error(shared.ErrValidation, err.Error()))
	}
	hash, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		return c.Status(500).JSON(shared.Error(shared.ErrInternal, "Failed to hash password"))
	}
	user := &User{
		Email:        req.Email,
		PasswordHash: string(hash),
		FullName:     req.FullName,
		Role:         req.Role,
		IsActive:     true,
	}
	if err := h.svc.repo.Create(c.Context(), user); err != nil {
		return c.Status(500).JSON(shared.Error(shared.ErrInternal, "Failed to create user"))
	}
	return c.Status(201).JSON(shared.Success(user))
}

func (h *Handler) AdminUpdateUser(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(400).JSON(shared.Error(shared.ErrValidation, "Invalid user ID"))
	}
	user, err := h.svc.repo.FindByID(c.Context(), id)
	if err != nil {
		return c.Status(500).JSON(shared.Error(shared.ErrInternal, "Failed to get user"))
	}
	if user == nil {
		return c.Status(404).JSON(shared.Error(shared.ErrNotFound, "User not found"))
	}
	var req AdminUpdateUserReq
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(shared.Error(shared.ErrValidation, "Invalid request body"))
	}
	if req.Email != nil {
		user.Email = *req.Email
	}
	if req.FullName != nil {
		user.FullName = *req.FullName
	}
	if req.Role != nil {
		user.Role = *req.Role
	}
	if req.IsActive != nil {
		user.IsActive = *req.IsActive
	}
	if req.GradeID != nil {
		user.GradeID = req.GradeID
	}
	if req.SchoolName != nil {
		user.SchoolName = req.SchoolName
	}
	if err := h.svc.repo.UpdateUser(c.Context(), user); err != nil {
		return c.Status(500).JSON(shared.Error(shared.ErrInternal, "Failed to update user"))
	}
	return c.JSON(shared.Success(user))
}

func (h *Handler) AdminDeleteUser(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(400).JSON(shared.Error(shared.ErrValidation, "Invalid user ID"))
	}
	if err := h.svc.repo.SoftDelete(c.Context(), id); err != nil {
		fmt.Printf("[AdminDeleteUser ERROR] id=%s err=%v\n", id, err)
		return c.Status(500).JSON(shared.Error(shared.ErrInternal, err.Error()))
	}
	return c.JSON(shared.Success(fiber.Map{"message": "User deleted"}))
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
