package school

import (
	"context"
	"fmt"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"

	"yakinlulus.id/backend/internal/shared"
)

type BulkResult struct {
	Processed int      `json:"processed"`
	Deleted   int      `json:"deleted"`
	Failed    int      `json:"failed"`
	Errors    []string `json:"errors,omitempty"`
}

func (s *Service) BulkDelete(ctx context.Context, ids []uuid.UUID) (*BulkResult, error) {
	result := &BulkResult{Processed: len(ids)}
	for _, id := range ids {
		if err := s.SoftDelete(ctx, id); err != nil {
			result.Failed++
			result.Errors = append(result.Errors, fmt.Sprintf("%s: %v", id, err))
			continue
		}
		result.Deleted++
	}
	return result, nil
}

func (s *Service) BulkStatus(ctx context.Context, ids []uuid.UUID, active bool) (*BulkResult, error) {
	result := &BulkResult{Processed: len(ids)}
	status := "INACTIVE"
	if active {
		status = "ACTIVE"
	}
	for _, id := range ids {
		if err := s.UpdateStatus(ctx, id, status); err != nil {
			result.Failed++
			result.Errors = append(result.Errors, fmt.Sprintf("%s: %v", id, err))
			continue
		}
		result.Deleted++
	}
	return result, nil
}

func (h *Handler) BulkDelete(c *fiber.Ctx) error {
	var req struct {
		IDs []uuid.UUID `json:"ids"`
	}
	if err := c.BodyParser(&req); err != nil || len(req.IDs) == 0 {
		return c.Status(400).JSON(shared.Error(shared.ErrValidation, "ids required"))
	}
	result, err := h.svc.BulkDelete(c.Context(), req.IDs)
	if err != nil {
		return c.Status(500).JSON(shared.Error(shared.ErrInternal, "Failed to bulk delete schools"))
	}
	return c.JSON(shared.Success(result))
}

func (h *Handler) BulkStatus(c *fiber.Ctx) error {
	var req struct {
		IDs      []uuid.UUID `json:"ids"`
		IsActive bool        `json:"is_active"`
	}
	if err := c.BodyParser(&req); err != nil || len(req.IDs) == 0 {
		return c.Status(400).JSON(shared.Error(shared.ErrValidation, "ids required"))
	}
	result, err := h.svc.BulkStatus(c.Context(), req.IDs, req.IsActive)
	if err != nil {
		return c.Status(500).JSON(shared.Error(shared.ErrInternal, "Failed to bulk update school status"))
	}
	return c.JSON(shared.Success(result))
}