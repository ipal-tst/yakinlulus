package admin

import (
	"context"

	"github.com/gofiber/fiber/v2"

	"yakinlulus.id/backend/internal/middleware"
	"yakinlulus.id/backend/internal/shared"
)

type Service struct {
	repo *Repository
}

func NewService(repo *Repository) *Service {
	return &Service{repo: repo}
}

func (s *Service) GetHealth(ctx context.Context) (*HealthResponse, error) {
	return s.repo.GetHealth(ctx)
}

func (s *Service) GetLogs(ctx context.Context, limit int) ([]LogEntry, error) {
	return s.repo.GetLogs(ctx, limit)
}

type Handler struct {
	svc  *Service
	auth string
}

func NewHandler(svc *Service, jwtSecret string) *Handler {
	return &Handler{svc: svc, auth: jwtSecret}
}

func (h *Handler) RegisterRoutes(router fiber.Router) {
	authM := middleware.RequireAuth(h.auth)
	admin := middleware.RequireRole("ADMIN")

	r := router.Group("/admin", authM, admin)
	r.Get("/health", h.GetHealth)
	r.Get("/logs", h.GetLogs)
}

func (h *Handler) GetHealth(c *fiber.Ctx) error {
	health, err := h.svc.GetHealth(c.Context())
	if err != nil {
		return c.Status(500).JSON(shared.Error(shared.ErrInternal, "Failed to get health status"))
	}
	return c.JSON(shared.Success(health))
}

func (h *Handler) GetLogs(c *fiber.Ctx) error {
	limit := c.QueryInt("limit", 50)
	if limit < 1 || limit > 200 {
		limit = 50
	}

	logs, err := h.svc.GetLogs(c.Context(), limit)
	if err != nil {
		return c.Status(500).JSON(shared.Error(shared.ErrInternal, "Failed to get logs"))
	}

	if logs == nil {
		logs = []LogEntry{}
	}

	return c.JSON(shared.Success(fiber.Map{"logs": logs}))
}