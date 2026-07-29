package subscription

import (
	"context"
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
	ID           uuid.UUID              `json:"id"`
	Name         string                 `json:"name"`
	Slug         string                 `json:"slug"`
	Description  *string                `json:"description,omitempty"`
	Price        int64                  `json:"price"`
	DurationDays int                    `json:"duration_days"`
	Features     []interface{}          `json:"features,omitempty"`
	IsActive     bool                   `json:"is_active"`
	CreatedAt    time.Time              `json:"created_at"`
	UpdatedAt    time.Time              `json:"updated_at"`
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

func (r *Repository) CreatePlan(ctx context.Context, p *Plan) error {
	p.ID = uuid.New()
	p.Features = ensureJSONArray(p.Features)
	_, err := r.pool.Exec(ctx, `
		INSERT INTO subscription_plans (id, name, slug, description, price, duration_days, features, is_active)
		VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
	`, p.ID, p.Name, p.Slug, p.Description, p.Price, p.DurationDays, p.Features, p.IsActive)
	return err
}

func (r *Repository) ListPlans(ctx context.Context) ([]Plan, error) {
	rows, err := r.pool.Query(ctx, `
		SELECT id, name, slug, description, price, duration_days, features, is_active, created_at, updated_at
		FROM subscription_plans ORDER BY price ASC
	`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var plans []Plan
	for rows.Next() {
		var p Plan
		if err := rows.Scan(&p.ID, &p.Name, &p.Slug, &p.Description, &p.Price, &p.DurationDays, &p.Features, &p.IsActive, &p.CreatedAt, &p.UpdatedAt); err != nil {
			return nil, err
		}
		plans = append(plans, p)
	}
	return plans, nil
}

func (r *Repository) FindPlanByID(ctx context.Context, id uuid.UUID) (*Plan, error) {
	p := &Plan{}
	err := r.pool.QueryRow(ctx, `
		SELECT id, name, slug, description, price, duration_days, features, is_active, created_at, updated_at
		FROM subscription_plans WHERE id = $1
	`, id).Scan(&p.ID, &p.Name, &p.Slug, &p.Description, &p.Price, &p.DurationDays, &p.Features, &p.IsActive, &p.CreatedAt, &p.UpdatedAt)
	if err != nil {
		return nil, err
	}
	return p, nil
}

func (r *Repository) UpdatePlan(ctx context.Context, p *Plan) error {
	p.Features = ensureJSONArray(p.Features)
	_, err := r.pool.Exec(ctx, `
		UPDATE subscription_plans SET name=$1, slug=$2, description=$3, price=$4, duration_days=$5, features=$6, is_active=$7, updated_at=NOW()
		WHERE id=$8
	`, p.Name, p.Slug, p.Description, p.Price, p.DurationDays, p.Features, p.IsActive, p.ID)
	return err
}

func (r *Repository) DeletePlan(ctx context.Context, id uuid.UUID) error {
	_, err := r.pool.Exec(ctx, `DELETE FROM subscription_plans WHERE id=$1`, id)
	return err
}

func (r *Repository) ListSubscriptions(ctx context.Context, limit, offset int) ([]UserSubscription, int, error) {
	var total int
	r.pool.QueryRow(ctx, `SELECT COUNT(*) FROM user_subscriptions`).Scan(&total)

	rows, err := r.pool.Query(ctx, `
		SELECT s.id, s.user_id, s.plan_id, s.status, s.started_at, s.expires_at,
		       s.payment_method, s.payment_proof, s.notes, s.created_at, s.updated_at,
		       COALESCE(p.name, '') AS plan_name, COALESCE(u.email, '') AS user_email,
		       COALESCE(u.full_name, '') AS user_fullname
		FROM user_subscriptions s
		LEFT JOIN subscription_plans p ON s.plan_id = p.id
		LEFT JOIN users u ON s.user_id = u.id
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
	r.pool.QueryRow(ctx, `SELECT COALESCE(SUM(p.price), 0) FROM user_subscriptions s JOIN subscription_plans p ON s.plan_id = p.id WHERE s.status = 'ACTIVE'`).Scan(&mrr)
	var active int
	r.pool.QueryRow(ctx, `SELECT COUNT(*) FROM user_subscriptions WHERE status = 'ACTIVE'`).Scan(&active)
	var total int
	r.pool.QueryRow(ctx, `SELECT COUNT(*) FROM subscription_plans`).Scan(&total)
	return mrr, active, total, nil
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
	Name         *string       `json:"name,omitempty"`
	Slug         *string       `json:"slug,omitempty"`
	Description  *string       `json:"description,omitempty"`
	Price        *int64        `json:"price,omitempty"`
	DurationDays *int          `json:"duration_days,omitempty"`
	Features     *[]interface{} `json:"features,omitempty"`
	IsActive     *bool         `json:"is_active,omitempty"`
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
	admin := middleware.RequireRole("ADMIN", "STAFF")

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
