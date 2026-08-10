package finance

import (
	"context"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"

	"yakinlulus.id/backend/internal/middleware"
	"yakinlulus.id/backend/internal/shared"
)

// --- Models ---

type Payout struct {
	ID          uuid.UUID  `json:"id"`
	UserID      uuid.UUID  `json:"user_id"`
	Amount      float64    `json:"amount"`
	Status      string     `json:"status"`
	UserName    string     `json:"user_name"`
	BankAccount string     `json:"bank_account"`
	PaidAt      *time.Time `json:"paid_at,omitempty"`
	CreatedAt   time.Time  `json:"created_at"`
}

type Transaction struct {
	ID            uuid.UUID `json:"id"`
	UserEmail     string    `json:"user_email"`
	UserName      string    `json:"user_name"`
	PackageName   string    `json:"package_name"`
	Amount        float64   `json:"amount"`
	Status        string    `json:"status"`
	StartedAt     time.Time `json:"started_at"`
	CreatedAt     time.Time `json:"created_at"`
}

// --- Repository ---

type Repository struct {
	pool *pgxpool.Pool
}

func NewRepository(pool *pgxpool.Pool) *Repository {
	return &Repository{pool: pool}
}

func (r *Repository) ListPayouts(ctx context.Context, status string) ([]Payout, error) {
	query := `
		SELECT c.id, c.user_id, c.amount, c.status,
		       COALESCE(p.full_name, '') AS user_name,
		       COALESCE(p.phone, '') AS bank_account,
		       c.paid_at, c.created_at
		FROM finance.commission c
		LEFT JOIN identity.user_profile p ON p.user_id = c.user_id
	`
	args := []interface{}{}
	if status != "" {
		query += ` WHERE c.status = $1`
		args = append(args, status)
	}
	query += ` ORDER BY c.created_at DESC`

	rows, err := r.pool.Query(ctx, query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var payouts []Payout
	for rows.Next() {
		var p Payout
		var paidAt *time.Time
		if err := rows.Scan(&p.ID, &p.UserID, &p.Amount, &p.Status, &p.UserName, &p.BankAccount, &paidAt, &p.CreatedAt); err != nil {
			return nil, err
		}
		p.PaidAt = paidAt
		payouts = append(payouts, p)
	}
	return payouts, rows.Err()
}

func (r *Repository) ApprovePayout(ctx context.Context, id uuid.UUID) error {
	_, err := r.pool.Exec(ctx, `
		UPDATE finance.commission
		SET status = 'PAID', paid_at = NOW(), updated_at = NOW()
		WHERE id = $1 AND status = 'PENDING'
	`, id)
	return err
}

func (r *Repository) ListTransactions(ctx context.Context, limit, offset int) ([]Transaction, int, error) {
	var total int
	err := r.pool.QueryRow(ctx, `SELECT COUNT(*) FROM finance.subscription`).Scan(&total)
	if err != nil {
		return nil, 0, err
	}

	rows, err := r.pool.Query(ctx, `
		SELECT s.id, u.email AS user_email, COALESCE(p.full_name, '') AS user_name,
		       mp.name AS package_name, mp.price AS amount, s.status, s.started_at, s.created_at
		FROM finance.subscription s
		JOIN identity.user u ON u.id = s.user_id
		LEFT JOIN identity.user_profile p ON p.user_id = s.user_id
		LEFT JOIN finance.membership_package mp ON mp.id = s.membership_package_id
		ORDER BY s.created_at DESC
		LIMIT $1 OFFSET $2
	`, limit, offset)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	var transactions []Transaction
	for rows.Next() {
		var t Transaction
		if err := rows.Scan(&t.ID, &t.UserEmail, &t.UserName, &t.PackageName, &t.Amount, &t.Status, &t.StartedAt, &t.CreatedAt); err != nil {
			return nil, 0, err
		}
		transactions = append(transactions, t)
	}
	return transactions, total, rows.Err()
}

// --- Service ---

type Service struct {
	repo *Repository
}

func NewService(repo *Repository) *Service {
	return &Service{repo: repo}
}

func (s *Service) ListPayouts(ctx context.Context, status string) ([]Payout, error) {
	return s.repo.ListPayouts(ctx, status)
}

func (s *Service) ApprovePayout(ctx context.Context, id uuid.UUID) error {
	return s.repo.ApprovePayout(ctx, id)
}

func (s *Service) ListTransactions(ctx context.Context, page, limit int) ([]Transaction, int, error) {
	return s.repo.ListTransactions(ctx, limit, (page-1)*limit)
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
	admin := middleware.RequireRole("SUPER_ADMIN", "STAFF", "FINANCE")

	r := router.Group("/finance", authM)
	r.Get("/payouts", admin, h.ListPayouts)
	r.Post("/payouts/:id/approve", admin, h.ApprovePayout)
	r.Get("/transactions", admin, h.ListTransactions)
}

func (h *Handler) ListPayouts(c *fiber.Ctx) error {
	status := c.Query("status")
	payouts, err := h.svc.ListPayouts(c.Context(), status)
	if err != nil {
		return c.Status(500).JSON(shared.Error(shared.ErrInternal, "Failed to list payouts"))
	}
	if payouts == nil {
		payouts = []Payout{}
	}
	return c.JSON(shared.Success(payouts))
}

func (h *Handler) ApprovePayout(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(400).JSON(shared.Error(shared.ErrValidation, "Invalid payout ID"))
	}
	if err := h.svc.ApprovePayout(c.Context(), id); err != nil {
		return c.Status(500).JSON(shared.Error(shared.ErrInternal, "Failed to approve payout"))
	}
	return c.JSON(shared.Success(map[string]string{"status": "approved"}))
}

func (h *Handler) ListTransactions(c *fiber.Ctx) error {
	page, limit := shared.ParsePagination(c)
	transactions, total, err := h.svc.ListTransactions(c.Context(), page, limit)
	if err != nil {
		return c.Status(500).JSON(shared.Error(shared.ErrInternal, "Failed to list transactions"))
	}
	if transactions == nil {
		transactions = []Transaction{}
	}
	return c.JSON(shared.Success(map[string]interface{}{
		"items": transactions,
		"total": total,
		"page":  page,
		"limit": limit,
	}))
}