package material

import (
	"context"
	"net/http"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"

	"yakinlulus.id/backend/internal/content"
	"yakinlulus.id/backend/internal/middleware"
	"yakinlulus.id/backend/internal/shared"
)

type Material struct {
	ContentID         uuid.UUID              `json:"content_id"`
	ContentFormat     content.MaterialFormat `json:"content_format"`
	EstimatedDuration *int                   `json:"estimated_duration,omitempty"`
	ReadCount         int                    `json:"read_count"`
	IsPreview         bool                   `json:"is_preview"`
	Prerequisites     []uuid.UUID            `json:"prerequisites,omitempty"`
}

type LearningProgress struct {
	ID         uuid.UUID `json:"id"`
	UserID     uuid.UUID `json:"user_id"`
	MaterialID uuid.UUID `json:"material_id"`
	Progress   float64   `json:"progress"`
	Completed  bool      `json:"completed"`
	CreatedAt  time.Time `json:"created_at"`
	UpdatedAt  time.Time `json:"updated_at"`
}

type MaterialFull struct {
	content.Content
	Material
}

type Service struct {
	content content.Repository
}

func NewService(contentRepo content.Repository) *Service {
	return &Service{content: contentRepo}
}

func (s *Service) ContentRepo() content.Repository {
	return s.content
}

func (s *Service) Create(ctx context.Context, m *content.Material, base *content.Content) error {
	base.ContentType = content.ContentTypeMaterial
	if base.Status == "" {
		base.Status = content.StatusDraft
	}
	if base.Metadata == nil {
		base.Metadata = map[string]interface{}{}
	}
	base.Metadata["content_format"] = m.ContentFormat
	base.Metadata["estimated_duration"] = m.EstimatedDuration
	base.Metadata["read_count"] = m.ReadCount
	base.Metadata["is_preview"] = m.IsPreview
	base.Metadata["prerequisites"] = m.Prerequisites

	if err := s.content.CreateContent(ctx, base); err != nil {
		return err
	}

	m.ContentID = base.ID
	return s.content.CreateMaterial(ctx, m)
}

func (s *Service) FindByID(ctx context.Context, id uuid.UUID) (*content.MaterialFull, error) {
	return s.content.GetMaterial(ctx, id)
}

func (s *Service) Update(ctx context.Context, m *content.MaterialFull) error {
	contentID := m.Content.ID
	if contentID == uuid.Nil {
		contentID = m.ContentID
	}
	m.ContentID = contentID
	base := content.UpdateContentReq{
		Title:     &m.Title,
		Body:      &m.Body,
		SubjectID: &m.Content.SubjectID,
		ChapterID: m.Content.ChapterID,
		TopicID:   m.Content.TopicID,
		LOID:      m.Content.LOID,
		Status:    (*content.ContentStatus)(&m.Status),
	}
	if err := s.content.UpdateContent(ctx, contentID, base); err != nil {
		return err
	}
	return s.content.UpdateMaterial(ctx, contentID, &m.Material)
}

func (s *Service) Delete(ctx context.Context, id uuid.UUID) error {
	return s.content.DeleteContent(ctx, id)
}

func (s *Service) Publish(ctx context.Context, id uuid.UUID, publish bool) error {
	if publish {
		now := time.Now()
		return s.content.UpdateContent(ctx, id, content.UpdateContentReq{
			Status:      ptr(content.StatusPublished),
			PublishedAt: &now,
		})
	}
	return s.content.UpdateContent(ctx, id, content.UpdateContentReq{
		Status:      ptr(content.StatusDraft),
		PublishedAt: nil,
	})
}

func (s *Service) Archive(ctx context.Context, id uuid.UUID) error {
	return s.content.UpdateContent(ctx, id, content.UpdateContentReq{
		Status: ptr(content.StatusArchived),
	})
}

func (s *Service) List(ctx context.Context, subjectID, gradeID *uuid.UUID, page, limit int) ([]content.MaterialFull, int, error) {
	filter := content.MaterialFilter{
		ContentFilter: content.ContentFilter{
			SubjectID: subjectID,
			GradeID:   gradeID,
			Limit:     limit,
			Offset:    (page - 1) * limit,
		},
	}
	return s.content.ListMaterials(ctx, filter)
}

func (s *Service) IncrementReadCount(ctx context.Context, id uuid.UUID) error {
	return s.content.IncrementReadCount(ctx, id)
}

func (s *Service) UpsertProgress(ctx context.Context, lp *content.LearningProgress) error {
	if lp.Progress >= 100 {
		lp.Completed = true
	}
	return s.content.UpsertProgress(ctx, lp)
}

func (s *Service) GetProgress(ctx context.Context, userID, materialID uuid.UUID) (*content.LearningProgress, error) {
	return s.content.GetProgress(ctx, userID, materialID)
}

func (s *Service) ListProgressByUser(ctx context.Context, userID uuid.UUID, page, limit int) ([]content.LearningProgress, int, error) {
	return s.content.ListProgressByUser(ctx, userID, limit, (page-1)*limit)
}

type Handler struct {
	svc  *Service
	auth string
}

func NewHandler(svc *Service, jwtSecret string) *Handler {
	return &Handler{svc: svc, auth: jwtSecret}
}

func (h *Handler) RegisterRoutes(router fiber.Router) {
	auth := middleware.RequireAuth(h.auth)
	write := middleware.RequireRole("SUPER_ADMIN", "STAFF", "GURU")
	read := middleware.RequireRole("SUPER_ADMIN", "STAFF", "GURU", "SISWA")

	r := router.Group("/materials", auth)
	r.Get("/progress", read, h.ListProgress)
	r.Get("/", read, h.List)
	r.Post("/", write, h.Create)
	r.Get("/:id", read, h.GetByID)
	r.Put("/:id", write, h.Update)
	r.Delete("/:id", write, h.Delete)
	r.Patch("/:id/publish", write, h.Publish)
	r.Patch("/:id/archive", write, h.Archive)

	r.Post("/:id/progress", read, h.UpsertProgress)
	r.Get("/:id/progress", read, h.GetProgress)
}

func (h *Handler) Create(c *fiber.Ctx) error {
	var req struct {
		SubjectID         string `json:"subject_id"`
		ChapterID         string `json:"chapter_id,omitempty"`
		Title             string `json:"title"`
		Content           string `json:"content,omitempty"`
		ContentFormat     string `json:"content_format"`
		EstimatedDuration int    `json:"estimated_duration,omitempty"`
	}
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(shared.Error(shared.ErrValidation, "Invalid request"))
	}

	var subjectID uuid.UUID
	if req.SubjectID != "" {
		if sID, err := uuid.Parse(req.SubjectID); err == nil {
			subjectID = sID
		}
	}

	var chapterID *uuid.UUID
	if req.ChapterID != "" {
		if cid, err := uuid.Parse(req.ChapterID); err == nil && cid != uuid.Nil {
			chapterID = &cid
		}
	}

	userID := uuid.MustParse(c.Locals("user_id").(string))
	m := &content.Material{
		ContentFormat:     content.MaterialFormat(req.ContentFormat),
		EstimatedDuration: intPtr(req.EstimatedDuration),
	}

	base := &content.Content{
		SubjectID: subjectID,
		ChapterID: chapterID,
		Title:     req.Title,
		Body:      req.Content,
		CreatedBy: userID,
		Status:    content.StatusPublished,
	}

	if err := h.svc.Create(c.Context(), m, base); err != nil {
		return c.Status(500).JSON(shared.Error(shared.ErrInternal, "Failed to create material: "+err.Error()))
	}

	full, _ := h.svc.FindByID(c.Context(), m.ContentID)
	return c.Status(201).JSON(shared.Success(full))
}

func (h *Handler) GetByID(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(400).JSON(shared.Error(shared.ErrValidation, "Invalid material ID"))
	}

	m, err := h.svc.FindByID(c.Context(), id)
	if err != nil {
		if err == pgx.ErrNoRows {
			return c.Status(404).JSON(shared.Error(shared.ErrNotFound, "Material not found"))
		}
		return c.Status(500).JSON(shared.Error(shared.ErrInternal, "Failed to get material"))
	}

	// Bump read count async
	go h.svc.IncrementReadCount(context.Background(), id)

	return c.JSON(shared.Success(m))
}

func (h *Handler) Update(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(400).JSON(shared.Error(shared.ErrValidation, "Invalid material ID"))
	}

	var req struct {
		SubjectID         string `json:"subject_id"`
		ChapterID         string `json:"chapter_id,omitempty"`
		Title             string `json:"title"`
		Content           string `json:"content,omitempty"`
		ContentFormat     string `json:"content_format"`
		Status            string `json:"status,omitempty"`
		EstimatedDuration int    `json:"estimated_duration,omitempty"`
	}
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(shared.Error(shared.ErrValidation, "Invalid request"))
	}

	existing, err := h.svc.FindByID(c.Context(), id)
	if err != nil {
		if err == pgx.ErrNoRows {
			return c.Status(404).JSON(shared.Error(shared.ErrNotFound, "Material not found"))
		}
		return c.Status(500).JSON(shared.Error(shared.ErrInternal, "Failed to get material"))
	}

	subjectID, _ := uuid.Parse(req.SubjectID)
	var chapterID *uuid.UUID
	if req.ChapterID != "" {
		cid, _ := uuid.Parse(req.ChapterID)
		chapterID = &cid
	}

	existing.Content.SubjectID = subjectID
	existing.Content.ChapterID = chapterID
	existing.Content.Title = req.Title
	existing.Content.Body = req.Content
	existing.Material.ContentFormat = content.MaterialFormat(req.ContentFormat)
	if req.Status != "" {
		existing.Content.Status = content.ContentStatus(req.Status)
	}
	existing.Material.EstimatedDuration = intPtr(req.EstimatedDuration)

	if err := h.svc.Update(c.Context(), existing); err != nil {
		return c.Status(500).JSON(shared.Error(shared.ErrInternal, "Failed to update material"))
	}

	updated, _ := h.svc.FindByID(c.Context(), id)
	return c.JSON(shared.Success(updated))
}

func (h *Handler) Delete(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(400).JSON(shared.Error(shared.ErrValidation, "Invalid material ID"))
	}

	// GURU may only delete content they own; SUPER_ADMIN/STAFF delete any.
	userID, ok := middleware.UserIDFromCtx(c)
	if !ok {
		return c.Status(401).JSON(shared.Error(shared.ErrUnauthorized, "Not authenticated"))
	}
	role, _ := c.Locals("role").(string)
	if !middleware.HasAnyRole(role, "SUPER_ADMIN", "STAFF") {
		m, err := h.svc.FindByID(c.Context(), id)
		if err == pgx.ErrNoRows {
			return c.Status(404).JSON(shared.Error(shared.ErrNotFound, "Material not found"))
		}
		if err != nil {
			return c.Status(500).JSON(shared.Error(shared.ErrInternal, "Failed to get material"))
		}
		if m == nil || !canDelete(role, userID, m.Content.CreatedBy) {
			return c.Status(403).JSON(shared.Error(shared.ErrForbidden, "You may only delete your own material"))
		}
	}

	if err := h.svc.Delete(c.Context(), id); err != nil {
		if err == pgx.ErrNoRows {
			return c.Status(404).JSON(shared.Error(shared.ErrNotFound, "Material not found"))
		}
		return c.Status(500).JSON(shared.Error(shared.ErrInternal, "Failed to delete material"))
	}

	return c.SendStatus(http.StatusNoContent)
}

func (h *Handler) Publish(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(400).JSON(shared.Error(shared.ErrValidation, "Invalid material ID"))
	}

	var req struct {
		Publish bool `json:"publish"`
	}
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(shared.Error(shared.ErrValidation, "Invalid request"))
	}

	if err := h.svc.Publish(c.Context(), id, req.Publish); err != nil {
		return c.Status(500).JSON(shared.Error(shared.ErrInternal, "Failed to publish material"))
	}

	m, _ := h.svc.FindByID(c.Context(), id)
	return c.JSON(shared.Success(m))
}

func (h *Handler) Archive(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(400).JSON(shared.Error(shared.ErrValidation, "Invalid material ID"))
	}

	if err := h.svc.Archive(c.Context(), id); err != nil {
		return c.Status(500).JSON(shared.Error(shared.ErrInternal, "Failed to archive material"))
	}

	m, _ := h.svc.FindByID(c.Context(), id)
	return c.JSON(shared.Success(m))
}

func (h *Handler) List(c *fiber.Ctx) error {
	page, limit := shared.ParsePagination(c)
	var subjectID *uuid.UUID
	if s := c.Query("subject_id"); s != "" {
		id, _ := uuid.Parse(s)
		subjectID = &id
	}

	var gradeID *uuid.UUID
	if g := c.Query("grade_id"); g != "" {
		id, _ := uuid.Parse(g)
		gradeID = &id
	}
	// Auto-restrict to student's grade
	if gradeID == nil && c.Locals("role") == "STUDENT" {
		if uid, err := uuid.Parse(c.Locals("user_id").(string)); err == nil {
			if gid, err := h.svc.ContentRepo().GetUserGradeID(c.Context(), uid); err == nil && gid != nil {
				gradeID = gid
			}
		}
	}

	materials, total, err := h.svc.List(c.Context(), subjectID, gradeID, page, limit)
	if err != nil {
		return c.Status(500).JSON(shared.Error(shared.ErrInternal, "Failed to list materials"))
	}

	return c.JSON(shared.SuccessWithMeta(materials, shared.BuildMeta(page, limit, total)))
}

func (h *Handler) UpsertProgress(c *fiber.Ctx) error {
	materialID, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(400).JSON(shared.Error(shared.ErrValidation, "Invalid material ID"))
	}

	userID := uuid.MustParse(c.Locals("user_id").(string))

	var req struct {
		Progress float64 `json:"progress"`
	}
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(shared.Error(shared.ErrValidation, "Invalid request"))
	}

	lp := &content.LearningProgress{
		UserID:     userID,
		MaterialID: materialID,
		Progress:   req.Progress,
	}

	if err := h.svc.UpsertProgress(c.Context(), lp); err != nil {
		return c.Status(500).JSON(shared.Error(shared.ErrInternal, "Failed to save progress"))
	}

	return c.JSON(shared.Success(lp))
}

func (h *Handler) GetProgress(c *fiber.Ctx) error {
	materialID, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(400).JSON(shared.Error(shared.ErrValidation, "Invalid material ID"))
	}

	userID := uuid.MustParse(c.Locals("user_id").(string))

	lp, err := h.svc.GetProgress(c.Context(), userID, materialID)
	if err != nil {
		if err == pgx.ErrNoRows {
			return c.JSON(shared.Success(&LearningProgress{UserID: userID, MaterialID: materialID, Progress: 0, Completed: false}))
		}
		return c.Status(500).JSON(shared.Error(shared.ErrInternal, "Failed to get progress"))
	}

	return c.JSON(shared.Success(lp))
}

func (h *Handler) ListProgress(c *fiber.Ctx) error {
	userID := uuid.MustParse(c.Locals("user_id").(string))
	page, limit := shared.ParsePagination(c)

	list, total, err := h.svc.ListProgressByUser(c.Context(), userID, page, limit)
	if err != nil {
		return c.Status(500).JSON(shared.Error(shared.ErrInternal, "Failed to list progress"))
	}

	return c.JSON(shared.SuccessWithMeta(list, shared.BuildMeta(page, limit, total)))
}

func ptr[T any](v T) *T {
	return &v
}

// canDelete reports whether the caller (role+id) may delete content owned by
// `owner`. SUPER_ADMIN/STAFF bypass; GURU must be the owner.
func canDelete(role string, caller, owner uuid.UUID) bool {
	if middleware.HasAnyRole(role, "SUPER_ADMIN", "STAFF") {
		return true
	}
	return caller == owner
}

func intPtr(v int) *int {
	if v == 0 {
		return nil
	}
	return &v
}
