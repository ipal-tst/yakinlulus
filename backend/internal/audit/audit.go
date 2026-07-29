package audit

import (
	"context"
	"fmt"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"

	"yakinlulus.id/backend/internal/middleware"
	"yakinlulus.id/backend/internal/shared"
)

// --- DTOs ---

type AuditLogItem struct {
	ID          uuid.UUID `json:"id"`
	EventType   string    `json:"event_type"`
	ActorEmail  string    `json:"actor_email"`
	ActorRole   string    `json:"actor_role"`
	Action      string    `json:"action"`
	Description string    `json:"description"`
	EntityType  string    `json:"entity_type"`
	EntityID    string    `json:"entity_id"`
	IPAddress   string    `json:"ip_address"`
	Severity    string    `json:"severity"`
	CreatedAt   time.Time `json:"created_at"`
}

type AuditStats struct {
	TotalLogs     int `json:"total_logs"`
	CriticalCount int `json:"critical_count"`
	WarningCount  int `json:"warning_count"`
	InfoCount     int `json:"info_count"`
	TodayCount    int `json:"today_count"`
	LoginAttempts int `json:"login_attempts"`
}

type LogCreateReq struct {
	EventType   string `json:"event_type"`
	ActorID     string `json:"actor_id,omitempty"`
	ActorEmail  string `json:"actor_email,omitempty"`
	ActorRole   string `json:"actor_role,omitempty"`
	EntityType  string `json:"entity_type,omitempty"`
	EntityID    string `json:"entity_id,omitempty"`
	Action      string `json:"action"`
	Description string `json:"description,omitempty"`
	IPAddress   string `json:"ip_address,omitempty"`
	Severity    string `json:"severity,omitempty"`
}

// --- Repository ---

type Repository struct {
	pool *pgxpool.Pool
}

func NewRepository(pool *pgxpool.Pool) *Repository {
	return &Repository{pool: pool}
}

func (r *Repository) listLogs(ctx context.Context, limit, offset int, severity, eventType string) ([]AuditLogItem, int, error) {
	where := ""
	args := []interface{}{limit, offset}
	argIdx := 3

	if severity != "" {
		where += " AND severity = $" + itoa(argIdx)
		args = append(args, severity)
		argIdx++
	}
	if eventType != "" {
		where += " AND event_type = $" + itoa(argIdx)
		args = append(args, eventType)
		argIdx++
	}

	countQuery := "SELECT COUNT(*) FROM audit_logs WHERE 1=1" + where
	var total int
	err := r.pool.QueryRow(ctx, countQuery, args[2:]...).Scan(&total)
	if err != nil {
		return nil, 0, err
	}

	query := "SELECT id, event_type, actor_email, actor_role, action, description, entity_type, entity_id, ip_address, severity, created_at FROM audit_logs WHERE 1=1" + where + " ORDER BY created_at DESC LIMIT $1 OFFSET $2"
	rows, err := r.pool.Query(ctx, query, args...)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	var items []AuditLogItem
	for rows.Next() {
		var item AuditLogItem
		if err := rows.Scan(&item.ID, &item.EventType, &item.ActorEmail, &item.ActorRole, &item.Action, &item.Description, &item.EntityType, &item.EntityID, &item.IPAddress, &item.Severity, &item.CreatedAt); err != nil {
			continue
		}
		items = append(items, item)
	}
	return items, total, nil
}

func (r *Repository) getStats(ctx context.Context) (*AuditStats, error) {
	stats := &AuditStats{}
	r.pool.QueryRow(ctx, `SELECT COUNT(*) FROM audit_logs`).Scan(&stats.TotalLogs)
	r.pool.QueryRow(ctx, `SELECT COUNT(*) FROM audit_logs WHERE severity='CRITICAL'`).Scan(&stats.CriticalCount)
	r.pool.QueryRow(ctx, `SELECT COUNT(*) FROM audit_logs WHERE severity='WARNING'`).Scan(&stats.WarningCount)
	r.pool.QueryRow(ctx, `SELECT COUNT(*) FROM audit_logs WHERE severity='INFO'`).Scan(&stats.InfoCount)
	r.pool.QueryRow(ctx, `SELECT COUNT(*) FROM audit_logs WHERE created_at >= CURRENT_DATE`).Scan(&stats.TodayCount)
	r.pool.QueryRow(ctx, `SELECT COUNT(*) FROM audit_logs WHERE event_type IN ('USER_LOGIN', 'LOGIN_FAILED', 'LOGIN_SUCCESS') AND created_at >= CURRENT_DATE - INTERVAL '1 day'`).Scan(&stats.LoginAttempts)
	return stats, nil
}

func (r *Repository) createLog(ctx context.Context, req LogCreateReq) error {
	severity := req.Severity
	if severity == "" {
		severity = "INFO"
	}
	var actorID *uuid.UUID
	if req.ActorID != "" {
		id, err := uuid.Parse(req.ActorID)
		if err == nil {
			actorID = &id
		}
	}
	_, err := r.pool.Exec(ctx,
		`INSERT INTO audit_logs (event_type, actor_id, actor_email, actor_role, entity_type, entity_id, action, description, ip_address, severity)
		 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
		req.EventType, actorID, req.ActorEmail, req.ActorRole, req.EntityType, req.EntityID, req.Action, req.Description, req.IPAddress, severity)
	return err
}

func itoa(i int) string {
	return fmt.Sprintf("%d", i)
}

// --- Service ---

type Service struct {
	repo *Repository
}

func NewService(repo *Repository) *Service {
	return &Service{repo: repo}
}

func (s *Service) ListLogs(ctx context.Context, limit, offset int, severity, eventType string) ([]AuditLogItem, int, error) {
	return s.repo.listLogs(ctx, limit, offset, severity, eventType)
}

func (s *Service) GetStats(ctx context.Context) (*AuditStats, error) {
	return s.repo.getStats(ctx)
}

func (s *Service) CreateLog(ctx context.Context, req LogCreateReq) error {
	return s.repo.createLog(ctx, req)
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

	r := router.Group("/audit-logs", authM)
	r.Get("/stats", admin, h.GetStats)
	r.Get("", admin, h.ListLogs)
	r.Post("", admin, h.CreateLog)
}

func (h *Handler) GetStats(c *fiber.Ctx) error {
	stats, err := h.svc.GetStats(c.Context())
	if err != nil {
		return c.Status(500).JSON(shared.Error(shared.ErrInternal, "Failed to get audit stats"))
	}
	return c.JSON(shared.Success(stats))
}

func (h *Handler) ListLogs(c *fiber.Ctx) error {
	page := c.QueryInt("page", 1)
	limit := c.QueryInt("limit", 20)
	severity := c.Query("severity")
	eventType := c.Query("event_type")

	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 100 {
		limit = 20
	}

	offset := (page - 1) * limit
	items, total, err := h.svc.ListLogs(c.Context(), limit, offset, severity, eventType)
	if err != nil {
		return c.Status(500).JSON(shared.Error(shared.ErrInternal, "Failed to list audit logs"))
	}
	if items == nil {
		items = []AuditLogItem{}
	}

	return c.JSON(shared.Success(fiber.Map{
		"logs": items,
		"meta": shared.BuildMeta(page, limit, total),
	}))
}

func (h *Handler) CreateLog(c *fiber.Ctx) error {
	var req LogCreateReq
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(shared.Error(shared.ErrValidation, "Invalid request body"))
	}
	if req.EventType == "" || req.Action == "" {
		return c.Status(400).JSON(shared.Error(shared.ErrValidation, "event_type and action are required"))
	}
	if req.IPAddress == "" {
		req.IPAddress = c.IP()
	}

	if err := h.svc.CreateLog(c.Context(), req); err != nil {
		return c.Status(500).JSON(shared.Error(shared.ErrInternal, "Failed to create audit log"))
	}
	return c.JSON(shared.Success(fiber.Map{"created": true}))
}
