package subscription

import (
	"context"
	"fmt"
	"net/http"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"yakinlulus.id/backend/internal/middleware"
	"yakinlulus.id/backend/internal/shared"
)

// --- Models ---

type Plan struct {
	ID           uuid.UUID     `json:"id"`
	Name         string        `json:"name"`
	Slug         string        `json:"slug"`
	Description  *string       `json:"description,omitempty"`
	Price        int64         `json:"price"`
	DurationDays int           `json:"duration_days"`
	Features     []interface{} `json:"features,omitempty"`
	IsActive     bool          `json:"is_active"`
	CreatedAt    time.Time     `json:"created_at"`
	UpdatedAt    time.Time     `json:"updated_at"`
}

type UserSubscription struct {
	ID            uuid.UUID  `json:"id"`
	UserID        uuid.UUID  `json:"user_id"`
	PlanID        uuid.UUID  `json:"plan_id"`
	Status        string     `json:"status"`
	StartedAt     time.Time  `json:"started_at"`
	ExpiresAt     *time.Time `json:"expires_at,omitempty"`
	PaymentMethod *string    `json:"payment_method,omitempty"`
	PaymentProof  *string    `json:"payment_proof,omitempty"`
	Notes         *string    `json:"notes,omitempty"`
	CreatedAt     time.Time  `json:"created_at"`
	UpdatedAt     time.Time  `json:"updated_at"`
	// Joined fields
	PlanName     string `json:"plan_name,omitempty"`
	UserEmail    string `json:"user_email,omitempty"`
	UserFullname string `json:"user_fullname,omitempty"`
}

// --- Repository ---

type Repository struct {
	pool *pgxpool.Pool
}

func NewRepository(pool *pgxpool.Pool) *Repository {
	return &Repository{pool: pool}
}

const planTable = "finance.membership_package"

const planSelect = `
	SELECT p.id, p.name, p.slug, NULL::text AS description,
	       ROUND(p.price)::bigint AS price,
	       COALESCE(p.duration_day, 0) AS duration_days,
	       COALESCE((SELECT ARRAY_AGG(f.feature_name ORDER BY f.feature_code)
	                  FROM finance.package_feature f WHERE f.membership_package_id = p.id), ARRAY[]::text[]) AS features,
	       p.is_active, p.created_at, p.updated_at
	FROM finance.membership_package p`

func featureStrings(in []interface{}) []string {
	if len(in) == 0 {
		return []string{}
	}
	out := make([]string, 0, len(in))
	for _, v := range in {
		switch t := v.(type) {
		case string:
			out = append(out, t)
		default:
			out = append(out, fmt.Sprint(t))
		}
	}
	return out
}

func (r *Repository) CreatePlan(ctx context.Context, p *Plan) error {
	p.ID = uuid.New()
	p.Features = ensureJSONArray(p.Features)
	code := p.Slug
	if code == "" {
		code = generateSlug(p.Name)
	}
	tx, err := r.pool.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)

	if _, err := tx.Exec(ctx, `
		INSERT INTO `+planTable+` (id, code, name, slug, package_type, price, duration_day, is_active)
		VALUES ($1, $2, $3, $4, 'monthly', $5, $6, $7)`,
		p.ID, code, p.Name, p.Slug, p.Price, p.DurationDays, p.IsActive); err != nil {
		return err
	}
	if len(p.Features) > 0 {
		if _, err := tx.Exec(ctx, `
			INSERT INTO finance.package_feature (membership_package_id, feature_code, feature_name)
			SELECT $1, 'F'||ord::text, feat
			FROM unnest($2::text[]) WITH ORDINALITY AS t(feat, ord)`, p.ID, featureStrings(p.Features)); err != nil {
			return err
		}
	}
	return tx.Commit(ctx)
}

func (r *Repository) ListPlans(ctx context.Context) ([]Plan, error) {
	rows, err := r.pool.Query(ctx, planSelect+` WHERE p.deleted_at IS NULL ORDER BY p.price ASC`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var plans []Plan
	for rows.Next() {
		var p Plan
		var feats []string
		if err := rows.Scan(&p.ID, &p.Name, &p.Slug, &p.Description, &p.Price, &p.DurationDays, &feats, &p.IsActive, &p.CreatedAt, &p.UpdatedAt); err != nil {
			return nil, err
		}
		p.Features = ifaceSlice(feats)
		plans = append(plans, p)
	}
	return plans, nil
}

func (r *Repository) FindPlanByID(ctx context.Context, id uuid.UUID) (*Plan, error) {
	p := &Plan{}
	var feats []string
	err := r.pool.QueryRow(ctx, planSelect+` WHERE p.id = $1 AND p.deleted_at IS NULL`, id).
		Scan(&p.ID, &p.Name, &p.Slug, &p.Description, &p.Price, &p.DurationDays, &feats, &p.IsActive, &p.CreatedAt, &p.UpdatedAt)
	if err != nil {
		return nil, err
	}
	p.Features = ifaceSlice(feats)
	return p, nil
}

func (r *Repository) UpdatePlan(ctx context.Context, p *Plan) error {
	p.Features = ensureJSONArray(p.Features)
	tx, err := r.pool.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)

	if _, err := tx.Exec(ctx, `
		UPDATE `+planTable+` SET name=$1, slug=$2, price=$3, duration_day=$4, is_active=$5, updated_at=NOW()
		WHERE id=$6`,
		p.Name, p.Slug, p.Price, p.DurationDays, p.IsActive, p.ID); err != nil {
		return err
	}
	if _, err := tx.Exec(ctx, `DELETE FROM finance.package_feature WHERE membership_package_id = $1`, p.ID); err != nil {
		return err
	}
	if len(p.Features) > 0 {
		if _, err := tx.Exec(ctx, `
			INSERT INTO finance.package_feature (membership_package_id, feature_code, feature_name)
			SELECT $1, 'F'||ord::text, feat
			FROM unnest($2::text[]) WITH ORDINALITY AS t(feat, ord)`, p.ID, featureStrings(p.Features)); err != nil {
			return err
		}
	}
	return tx.Commit(ctx)
}

func (r *Repository) DeletePlan(ctx context.Context, id uuid.UUID) error {
	_, err := r.pool.Exec(ctx, `UPDATE `+planTable+` SET deleted_at = NOW() WHERE id=$1`, id)
	return err
}

func (r *Repository) ListSubscriptions(ctx context.Context, limit, offset int) ([]UserSubscription, int, error) {
	var total int
	r.pool.QueryRow(ctx, `SELECT COUNT(*) FROM finance.user_membership`).Scan(&total)

	rows, err := r.pool.Query(ctx, `
		SELECT s.id, s.user_id, s.membership_package_id, s.status, COALESCE(s.active_from, s.created_at),
		       s.expired_at,
		       NULL::text AS payment_method, NULL::text AS payment_proof, NULL::text AS notes,
		       s.created_at, s.updated_at,
		       COALESCE(p.name, '') AS plan_name, COALESCE(u.email, '') AS user_email,
		       COALESCE(up.full_name, '') AS user_fullname
		FROM finance.user_membership s
		LEFT JOIN finance.membership_package p ON p.id = s.membership_package_id
		LEFT JOIN identity.user u ON u.id = s.user_id
		LEFT JOIN identity.user_profile up ON up.user_id = s.user_id
		ORDER BY s.created_at DESC LIMIT $1 OFFSET $2
	`, limit, offset)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	var subs []UserSubscription
	for rows.Next() {
		var s UserSubscription
		if err := rows.Scan(&s.ID, &s.UserID, &s.PlanID, &s.Status, &s.StartedAt, &s.ExpiresAt,
			&s.PaymentMethod, &s.PaymentProof, &s.Notes, &s.CreatedAt, &s.UpdatedAt,
			&s.PlanName, &s.UserEmail, &s.UserFullname); err != nil {
			return nil, 0, err
		}
		subs = append(subs, s)
	}
	return subs, total, nil
}

func (r *Repository) GetStats(ctx context.Context) (int64, int, int, error) {
	var mrr int64
	r.pool.QueryRow(ctx, `SELECT COALESCE(ROUND(SUM(p.price))::bigint, 0) FROM finance.user_membership s JOIN finance.membership_package p ON p.id = s.membership_package_id WHERE s.status = 'ACTIVE'`).Scan(&mrr)
	var active int
	r.pool.QueryRow(ctx, `SELECT COUNT(*) FROM finance.user_membership WHERE status = 'ACTIVE'`).Scan(&active)
	var total int
	r.pool.QueryRow(ctx, `SELECT COUNT(*) FROM finance.membership_package WHERE deleted_at IS NULL`).Scan(&total)
	return mrr, active, total, nil
}

func ifaceSlice(in []string) []interface{} {
	out := make([]interface{}, len(in))
	for i, v := range in {
		out[i] = v
	}
	return out
}

func ensureJSONArray(v []interface{}) []interface{} {
	if v == nil {
		return []interface{}{}
	}
	return v
}

// --- Service ---

type Service struct {
	repo *Repository
}

func NewService(repo *Repository) *Service {
	return &Service{repo: repo}
}

func (s *Service) CreatePlan(ctx context.Context, req CreatePlanReq) (*Plan, error) {
	slug := req.Slug
	if slug == "" {
		slug = generateSlug(req.Name)
	}
	p := &Plan{
		Name:         req.Name,
		Slug:         slug,
		Description:  req.Description,
		Price:        req.Price,
		DurationDays: req.DurationDays,
		Features:     req.Features,
		IsActive:     true,
	}
	if err := s.repo.CreatePlan(ctx, p); err != nil {
		return nil, err
	}
	return p, nil
}

func (s *Service) ListPlans(ctx context.Context) ([]Plan, error) {
	return s.repo.ListPlans(ctx)
}

func (s *Service) UpdatePlan(ctx context.Context, id uuid.UUID, req UpdatePlanReq) (*Plan, error) {
	p, err := s.repo.FindPlanByID(ctx, id)
	if err != nil {
		if err == pgx.ErrNoRows {
			return nil, fiber.NewError(404, "Plan not found")
		}
		return nil, err
	}
	if req.Name != nil {
		p.Name = *req.Name
	}
	if req.Slug != nil {
		p.Slug = *req.Slug
	}
	if req.Description != nil {
		p.Description = req.Description
	}
	if req.Price != nil {
		p.Price = *req.Price
	}
	if req.DurationDays != nil {
		p.DurationDays = *req.DurationDays
	}
	if req.Features != nil {
		p.Features = *req.Features
	}
	if req.IsActive != nil {
		p.IsActive = *req.IsActive
	}
	if err := s.repo.UpdatePlan(ctx, p); err != nil {
		return nil, err
	}
	return p, nil
}

func (s *Service) DeletePlan(ctx context.Context, id uuid.UUID) error {
	return s.repo.DeletePlan(ctx, id)
}

func (s *Service) ListSubscriptions(ctx context.Context, page, limit int) ([]UserSubscription, int, error) {
	return s.repo.ListSubscriptions(ctx, limit, (page-1)*limit)
}

func (s *Service) GetStats(ctx context.Context) (*StatsResponse, error) {
	mrr, active, totalPlans, err := s.repo.GetStats(ctx)
	if err != nil {
		return nil, err
	}
	return &StatsResponse{
		MRR:        mrr,
		ActiveSubs: active,
		TotalPlans: totalPlans,
	}, nil
}

func generateSlug(name string) string {
	// Simple slug generation
	slug := ""
	for _, c := range name {
		if c >= 'a' && c <= 'z' || c >= '0' && c <= '9' {
			slug += string(c)
		} else if c >= 'A' && c <= 'Z' {
			slug += string(c - 'A' + 'a')
		} else if c == ' ' || c == '-' {
			slug += "-"
		}
	}
	return slug
}

// --- DTOs ---

type CreatePlanReq struct {
	Name         string        `json:"name"`
	Slug         string        `json:"slug,omitempty"`
	Description  *string       `json:"description,omitempty"`
	Price        int64         `json:"price"`
	DurationDays int           `json:"duration_days"`
	Features     []interface{} `json:"features,omitempty"`
}

type UpdatePlanReq struct {
	Name         *string        `json:"name,omitempty"`
	Slug         *string        `json:"slug,omitempty"`
	Description  *string        `json:"description,omitempty"`
	Price        *int64         `json:"price,omitempty"`
	DurationDays *int           `json:"duration_days,omitempty"`
	Features     *[]interface{} `json:"features,omitempty"`
	IsActive     *bool          `json:"is_active,omitempty"`
}

type StatsResponse struct {
	MRR        int64 `json:"mrr"`
	ActiveSubs int   `json:"active_subs"`
	TotalPlans int   `json:"total_plans"`
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
	admin := middleware.RequireRole("SUPER_ADMIN", "STAFF", "FINANCE", "INVESTOR")

	r := router.Group("/subscriptions", authM)
	r.Get("/stats", admin, h.GetStats)
	r.Get("/plans", admin, h.ListPlans)
	r.Post("/plans", admin, h.CreatePlan)
	r.Get("/plans/:id", admin, h.FindPlanByID)
	r.Put("/plans/:id", admin, h.UpdatePlan)
	r.Delete("/plans/:id", admin, h.DeletePlan)
	r.Get("/users", admin, h.ListSubscriptions)
}

func (h *Handler) GetStats(c *fiber.Ctx) error {
	stats, err := h.svc.GetStats(c.Context())
	if err != nil {
		return c.Status(500).JSON(shared.Error(shared.ErrInternal, "Failed to get stats"))
	}
	return c.JSON(shared.Success(stats))
}

func (h *Handler) CreatePlan(c *fiber.Ctx) error {
	var req CreatePlanReq
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(shared.Error(shared.ErrValidation, "Invalid request body"))
	}
	if req.Name == "" {
		return c.Status(400).JSON(shared.Error(shared.ErrValidation, "name required"))
	}
	p, err := h.svc.CreatePlan(c.Context(), req)
	if err != nil {
		return c.Status(500).JSON(shared.Error(shared.ErrInternal, "Failed to create plan"))
	}
	return c.Status(201).JSON(shared.Success(p))
}

func (h *Handler) ListPlans(c *fiber.Ctx) error {
	plans, err := h.svc.ListPlans(c.Context())
	if err != nil {
		return c.Status(500).JSON(shared.Error(shared.ErrInternal, "Failed to list plans"))
	}
	return c.JSON(shared.Success(plans))
}

func (h *Handler) FindPlanByID(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(400).JSON(shared.Error(shared.ErrValidation, "Invalid plan ID"))
	}
	p, err := h.svc.repo.FindPlanByID(c.Context(), id)
	if err != nil {
		if err == pgx.ErrNoRows {
			return c.Status(404).JSON(shared.Error(shared.ErrNotFound, "Plan not found"))
		}
		return c.Status(500).JSON(shared.Error(shared.ErrInternal, "Failed to get plan"))
	}
	return c.JSON(shared.Success(p))
}

func (h *Handler) UpdatePlan(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(400).JSON(shared.Error(shared.ErrValidation, "Invalid plan ID"))
	}
	var req UpdatePlanReq
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(shared.Error(shared.ErrValidation, "Invalid request body"))
	}
	p, err := h.svc.UpdatePlan(c.Context(), id, req)
	if err != nil {
		if fe, ok := err.(*fiber.Error); ok {
			return c.Status(fe.Code).JSON(shared.Error(shared.ErrorCode(fe.Message), fe.Message))
		}
		return c.Status(500).JSON(shared.Error(shared.ErrInternal, "Failed to update plan"))
	}
	return c.JSON(shared.Success(p))
}

func (h *Handler) DeletePlan(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(400).JSON(shared.Error(shared.ErrValidation, "Invalid plan ID"))
	}
	if err := h.svc.DeletePlan(c.Context(), id); err != nil {
		return c.Status(500).JSON(shared.Error(shared.ErrInternal, "Failed to delete plan"))
	}
	return c.SendStatus(http.StatusNoContent)
}

func (h *Handler) ListSubscriptions(c *fiber.Ctx) error {
	page, limit := shared.ParsePagination(c)
	subs, total, err := h.svc.ListSubscriptions(c.Context(), page, limit)
	if err != nil {
		return c.Status(500).JSON(shared.Error(shared.ErrInternal, "Failed to list subscriptions"))
	}
	return c.JSON(shared.SuccessWithMeta(subs, shared.BuildMeta(page, limit, total)))
}
