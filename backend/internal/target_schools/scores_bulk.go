package target_schools

import (
	"context"
	"fmt"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"

	"yakinlulus.id/backend/internal/shared"
)

type ScoreBulkResult struct {
	Processed int      `json:"processed"`
	Deleted   int      `json:"deleted"`
	Failed    int      `json:"failed"`
	Errors    []string `json:"errors,omitempty"`
}

func (s *Service) BulkDeleteScores(ctx context.Context, ids []uuid.UUID) (*ScoreBulkResult, error) {
	result := &ScoreBulkResult{Processed: len(ids)}
	for _, id := range ids {
		if err := s.DeleteScore(ctx, id); err != nil {
			result.Failed++
			result.Errors = append(result.Errors, fmt.Sprintf("%s: %v", id, err))
			continue
		}
		result.Deleted++
	}
	return result, nil
}

func (h *Handler) BulkDeleteScores(c *fiber.Ctx) error {
	var req struct {
		IDs []uuid.UUID `json:"ids"`
	}
	if err := c.BodyParser(&req); err != nil || len(req.IDs) == 0 {
		return c.Status(400).JSON(shared.Error(shared.ErrValidation, "ids required"))
	}
	result, err := h.svc.BulkDeleteScores(c.Context(), req.IDs)
	if err != nil {
		return c.Status(500).JSON(shared.Error(shared.ErrInternal, "Failed to bulk delete scores"))
	}
	return c.JSON(shared.Success(result))
}