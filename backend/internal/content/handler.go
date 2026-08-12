package content

import (
	"errors"
	"net/http"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"

	"yakinlulus.id/backend/internal/middleware"
	"yakinlulus.id/backend/internal/shared"
)

type Handler struct {
	repo Repository
	role string
}

func NewHandler(repo Repository, jwtSecret string) *Handler {
	return &Handler{repo: repo, role: jwtSecret}
}

func (h *Handler) ListContent(c *fiber.Ctx) error {
	page, limit := shared.ParsePagination(c)
	filter := ContentFilter{
		Search: c.Query("search"),
		Limit:  limit,
		Offset: (page - 1) * limit,
	}

	if t := c.Query("type"); t != "" {
		ct := ContentType(t)
		filter.ContentType = &ct
	}
	if g := c.Query("grade_id"); g != "" {
		if id, err := uuid.Parse(g); err == nil {
			filter.GradeID = &id
		}
	}
	// Auto-restrict to student's grade if no explicit grade_id
	if filter.GradeID == nil && c.Locals("role") == "SISWA" {
		if uid, err := uuid.Parse(c.Locals("user_id").(string)); err == nil {
			if gid, err := h.repo.GetUserGradeID(c.Context(), uid); err == nil && gid != nil {
				filter.GradeID = gid
			}
		}
	}
	if s := c.Query("subject_id"); s != "" {
		if id, err := uuid.Parse(s); err == nil {
			filter.SubjectID = &id
		}
	}
	if st := c.Query("status"); st != "" {
		cs := ContentStatus(st)
		filter.Status = &cs
	}

	contents, total, err := h.repo.ListContent(c.Context(), filter)
	if err != nil {
		return c.Status(500).JSON(shared.Error(shared.ErrInternal, "Failed to list contents"))
	}
	return c.JSON(shared.SuccessWithMeta(contents, shared.BuildMeta(page, limit, total)))
}

func (h *Handler) GetContent(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(400).JSON(shared.Error(shared.ErrValidation, "Invalid content ID"))
	}

	role, _ := c.Locals("role").(string)
	if role == "SISWA" || role == "SUPER_SISWA" {
		userIDStr, _ := c.Locals("user_id").(string)
		userID, err := uuid.Parse(userIDStr)
		if err != nil {
			return c.Status(http.StatusUnauthorized).JSON(shared.Error(shared.ErrUnauthorized, "Unauthorized"))
		}
		accessible, err := h.repo.IsContentAccessible(c.Context(), id, userID)
		if err != nil {
			return c.Status(500).JSON(shared.Error(shared.ErrInternal, "Failed to check access"))
		}
		if !accessible {
			return c.Status(http.StatusForbidden).JSON(shared.Error(shared.ErrForbidden, "Content not accessible for your grade"))
		}
	}

	content, err := h.repo.GetContent(c.Context(), id)
	if err != nil {
		return c.Status(404).JSON(shared.Error(shared.ErrNotFound, "Content not found"))
	}
	return c.JSON(shared.Success(content))
}

func (h *Handler) GetContentSubtype(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(400).JSON(shared.Error(shared.ErrValidation, "Invalid content ID"))
	}

	baseContent, err := h.repo.GetContent(c.Context(), id)
	if err != nil {
		return c.Status(404).JSON(shared.Error(shared.ErrNotFound, "Content not found"))
	}

	switch baseContent.ContentType {
	case ContentTypeQuestion:
		q, err := h.repo.GetQuestion(c.Context(), id)
		if err != nil {
			return c.Status(404).JSON(shared.Error(shared.ErrNotFound, "Question subtype details not found"))
		}
		return c.JSON(shared.Success(q))
	case ContentTypeMaterial:
		m, err := h.repo.GetMaterial(c.Context(), id)
		if err != nil {
			return c.Status(404).JSON(shared.Error(shared.ErrNotFound, "Material subtype details not found"))
		}
		return c.JSON(shared.Success(m))
	case ContentTypeExam:
		e, err := h.repo.GetExam(c.Context(), id)
		if err != nil {
			return c.Status(404).JSON(shared.Error(shared.ErrNotFound, "Exam subtype details not found"))
		}
		return c.JSON(shared.Success(e))
	default:
		return c.JSON(shared.Success(baseContent))
	}
}

func (h *Handler) CreateContent(c *fiber.Ctx) error {
	var req Content
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(shared.Error(shared.ErrValidation, "Invalid request body"))
	}

	userIDStr := c.Locals("user_id")
	if userIDStr != nil {
		if uid, err := uuid.Parse(userIDStr.(string)); err == nil {
			req.CreatedBy = uid
		}
	}

	if err := h.repo.CreateContent(c.Context(), &req); err != nil {
		return c.Status(500).JSON(shared.Error(shared.ErrInternal, "Failed to create content"))
	}
	return c.Status(211).JSON(shared.Success(req))
}

func (h *Handler) UpdateContent(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(400).JSON(shared.Error(shared.ErrValidation, "Invalid content ID"))
	}

	var req UpdateContentReq
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(shared.Error(shared.ErrValidation, "Invalid request body"))
	}

	if err := h.repo.UpdateContent(c.Context(), id, req); err != nil {
		return c.Status(500).JSON(shared.Error(shared.ErrInternal, "Failed to update content"))
	}
	return c.JSON(shared.Success(nil))
}

func (h *Handler) DeleteContent(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(400).JSON(shared.Error(shared.ErrValidation, "Invalid content ID"))
	}

	if err := h.repo.DeleteContent(c.Context(), id); err != nil {
		if errors.Is(err, ErrOnlyDraftCanBeDeleted) {
			return c.Status(400).JSON(shared.Error(shared.ErrValidation, err.Error()))
		}
		return c.Status(500).JSON(shared.Error(shared.ErrInternal, "Failed to delete content"))
	}
	return c.JSON(shared.Success(nil))
}

func (h *Handler) RegisterRoutes(router fiber.Router) {
	auth := middleware.RequireAuth(h.role)
	// The generic /contents write routes are a legacy catch-all with no
	// per-row ownership gate. GURU authoring is covered by the dedicated
	// modules (question_bank, material, cbt_engine, cms) which enforce
	// ownership; granting GURU here would let them delete/update any
	// material/exam via /contents/:id, bypassing those gates.
	staffOnly := middleware.RequireRole("SUPER_ADMIN", "STAFF")

	contents := router.Group("/contents", auth)
	contents.Get("/", h.ListContent)
	contents.Get("/:id", h.GetContent)
	contents.Get("/:id/subtype", h.GetContentSubtype)

	contents.Post("/", staffOnly, h.CreateContent)
	contents.Put("/:id", staffOnly, h.UpdateContent)
	contents.Delete("/:id", staffOnly, h.DeleteContent)
}
