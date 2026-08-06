package cms

import (
	"strings"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"

	"yakinlulus.id/backend/internal/middleware"
	"yakinlulus.id/backend/internal/shared"
)

type Handler struct {
	svc  *Service
	auth string
}

func NewHandler(svc *Service, jwtSecret string) *Handler { return &Handler{svc: svc, auth: jwtSecret} }

func (h *Handler) RegisterRoutes(router fiber.Router) {
	write := middleware.RequireRole("SUPER_ADMIN", "STAFF", "GURU")

	// Pages
	pages := router.Group("/cms/pages")
	pages.Get("/", h.ListPages)
	pages.Post("/", middleware.RequireAuth(h.auth), write, h.CreatePage)
	pages.Get("/slug/:slug", h.GetPageBySlug)
	pages.Get("/:id", h.GetPage)
	pages.Put("/:id", middleware.RequireAuth(h.auth), write, h.UpdatePage)
	pages.Delete("/:id", middleware.RequireAuth(h.auth), write, h.DeletePage)
	pages.Post("/:id/publish", middleware.RequireAuth(h.auth), write, h.PublishPage)
	pages.Post("/:id/approve", middleware.RequireAuth(h.auth), write, h.ApprovePage)
	pages.Post("/:id/review", middleware.RequireAuth(h.auth), write, h.ReviewPage)
	pages.Post("/:id/version", middleware.RequireAuth(h.auth), write, h.CreatePageVersion)
	pages.Get("/:id/versions", h.ListPageVersions)
	pages.Put("/:id/seo", middleware.RequireAuth(h.auth), write, h.UpdatePageSEO)

	// Posts
	posts := router.Group("/cms/posts")
	posts.Get("/", h.ListPosts)
	posts.Post("/", middleware.RequireAuth(h.auth), write, h.CreatePost)
	posts.Get("/slug/:slug", h.GetPostBySlug)
	posts.Get("/:id", h.GetPost)
	posts.Put("/:id", middleware.RequireAuth(h.auth), write, h.UpdatePost)
	posts.Delete("/:id", middleware.RequireAuth(h.auth), write, h.DeletePost)
	posts.Post("/:id/publish", middleware.RequireAuth(h.auth), write, h.PublishPost)

	// Categories
	cats := router.Group("/cms/categories")
	cats.Get("/", h.ListCategories)
	cats.Post("/", middleware.RequireAuth(h.auth), write, h.CreateCategory)
	cats.Put("/:id", middleware.RequireAuth(h.auth), write, h.UpdateCategory)
	cats.Delete("/:id", middleware.RequireAuth(h.auth), write, h.DeleteCategory)

	// Tags
	tags := router.Group("/cms/tags")
	tags.Get("/", h.ListTags)
	tags.Post("/", middleware.RequireAuth(h.auth), write, h.CreateTag)
	tags.Put("/:id", middleware.RequireAuth(h.auth), write, h.UpdateTag)
	tags.Delete("/:id", middleware.RequireAuth(h.auth), write, h.DeleteTag)

	// Settings
	settings := router.Group("/cms/settings")
	settings.Get("/", h.ListSettings)
	settings.Get("/:key", h.GetSetting)
	settings.Put("/:key", middleware.RequireAuth(h.auth), write, h.UpdateSetting)

	// FAQs
	faqs := router.Group("/cms/faqs")
	faqs.Get("/", h.ListFAQs)
	faqs.Post("/", middleware.RequireAuth(h.auth), write, h.CreateFAQ)
	faqs.Put("/:id", middleware.RequireAuth(h.auth), write, h.UpdateFAQ)
	faqs.Delete("/:id", middleware.RequireAuth(h.auth), write, h.DeleteFAQ)

	// Banners
	banners := router.Group("/cms/banners")
	banners.Get("/", h.ListBanners)
	banners.Post("/", middleware.RequireAuth(h.auth), write, h.CreateBanner)
	banners.Put("/:id", middleware.RequireAuth(h.auth), write, h.UpdateBanner)
	banners.Delete("/:id", middleware.RequireAuth(h.auth), write, h.DeleteBanner)

	// News
	news := router.Group("/cms/news")
	news.Get("/", h.ListNews)
	news.Post("/", middleware.RequireAuth(h.auth), write, h.CreateNews)
	news.Put("/:id", middleware.RequireAuth(h.auth), write, h.UpdateNews)
	news.Delete("/:id", middleware.RequireAuth(h.auth), write, h.DeleteNews)
	news.Post("/:id/publish", middleware.RequireAuth(h.auth), write, h.PublishNews)
}

func userID(c *fiber.Ctx) uuid.UUID {
	if id, ok := middleware.UserIDFromCtx(c); ok {
		return id
	}
	return uuid.Nil
}

func parseParamID(c *fiber.Ctx) (uuid.UUID, error) {
	return uuid.Parse(c.Params("id"))
}

// ---- Page handlers

func (h *Handler) ListPages(c *fiber.Ctx) error {
	page, limit := shared.ParsePagination(c)
	pages, total, err := h.svc.ListPages(c.Context(), page, limit)
	if err != nil {
		return c.Status(500).JSON(shared.Error(shared.ErrInternal, "Failed to list pages"))
	}
	if pages == nil {
		pages = []Page{}
	}
	return c.JSON(shared.SuccessWithMeta(pages, shared.BuildMeta(page, limit, total)))
}

func (h *Handler) GetPage(c *fiber.Ctx) error {
	id, err := parseParamID(c)
	if err != nil {
		return c.Status(400).JSON(shared.Error(shared.ErrValidation, "Invalid page ID"))
	}
	p, err := h.svc.GetPageByID(c.Context(), id)
	if err != nil {
		if errNoRows(err) {
			return c.Status(404).JSON(shared.Error(shared.ErrNotFound, "Page not found"))
		}
		return c.Status(500).JSON(shared.Error(shared.ErrInternal, "Failed to get page"))
	}
	return c.JSON(shared.Success(p))
}

func (h *Handler) GetPageBySlug(c *fiber.Ctx) error {
	p, err := h.svc.GetPageBySlug(c.Context(), c.Params("slug"))
	if err != nil {
		if errNoRows(err) {
			return c.Status(404).JSON(shared.Error(shared.ErrNotFound, "Page not found"))
		}
		return c.Status(500).JSON(shared.Error(shared.ErrInternal, "Failed to get page"))
	}
	return c.JSON(shared.Success(p))
}

func (h *Handler) CreatePage(c *fiber.Ctx) error {
	var req SavePageRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(shared.Error(shared.ErrValidation, "Invalid request body"))
	}
	if err := validateSlugTitle(req.Slug, req.Title); err != nil {
		return c.Status(400).JSON(shared.Error(shared.ErrValidation, err.Error()))
	}
	p, err := h.svc.CreatePage(c.Context(), req, userID(c))
	if err != nil {
		return handleCreateErr(c, err, "page")
	}
	return c.Status(201).JSON(shared.Success(p))
}

func (h *Handler) UpdatePage(c *fiber.Ctx) error {
	id, err := parseParamID(c)
	if err != nil {
		return c.Status(400).JSON(shared.Error(shared.ErrValidation, "Invalid page ID"))
	}
	var req SavePageRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(shared.Error(shared.ErrValidation, "Invalid request body"))
	}
	if err := validateSlugTitle(req.Slug, req.Title); err != nil {
		return c.Status(400).JSON(shared.Error(shared.ErrValidation, err.Error()))
	}
	p, err := h.svc.UpdatePage(c.Context(), id, req, userID(c))
	if err != nil {
		if isUniqueViolation(err) {
			return c.Status(409).JSON(shared.Error(shared.ErrConflict, "slug already exists"))
		}
		if errNoRows(err) {
			return c.Status(404).JSON(shared.Error(shared.ErrNotFound, "Page not found"))
		}
		return c.Status(500).JSON(shared.Error(shared.ErrInternal, "Failed to update page"))
	}
	return c.JSON(shared.Success(p))
}

func (h *Handler) DeletePage(c *fiber.Ctx) error {
	id, err := parseParamID(c)
	if err != nil {
		return c.Status(400).JSON(shared.Error(shared.ErrValidation, "Invalid page ID"))
	}
	if err := h.svc.DeletePage(c.Context(), id); err != nil {
		if errNoRows(err) {
			return c.Status(404).JSON(shared.Error(shared.ErrNotFound, "Page not found"))
		}
		return c.Status(500).JSON(shared.Error(shared.ErrInternal, "Failed to delete page"))
	}
	return c.JSON(shared.Success(map[string]string{"status": "deleted"}))
}

func (h *Handler) PublishPage(c *fiber.Ctx) error {
	id, err := parseParamID(c)
	if err != nil {
		return c.Status(400).JSON(shared.Error(shared.ErrValidation, "Invalid page ID"))
	}
	if err := h.svc.PublishPage(c.Context(), id, userID(c)); err != nil {
		if errNoRows(err) {
			return c.Status(404).JSON(shared.Error(shared.ErrNotFound, "Page not found"))
		}
		return c.Status(500).JSON(shared.Error(shared.ErrInternal, "Failed to publish page"))
	}
	return c.JSON(shared.Success(map[string]string{"status": "published"}))
}

func (h *Handler) ApprovePage(c *fiber.Ctx) error {
	return h.setPageStatus(c, "APPROVED")
}

func (h *Handler) ReviewPage(c *fiber.Ctx) error {
	return h.setPageStatus(c, "REVIEW")
}

func (h *Handler) setPageStatus(c *fiber.Ctx, status string) error {
	id, err := parseParamID(c)
	if err != nil {
		return c.Status(400).JSON(shared.Error(shared.ErrValidation, "Invalid page ID"))
	}
	if err := h.svc.SetPageStatus(c.Context(), id, userID(c), status); err != nil {
		if errNoRows(err) {
			return c.Status(404).JSON(shared.Error(shared.ErrNotFound, "Page not found"))
		}
		return c.Status(500).JSON(shared.Error(shared.ErrInternal, "Failed to update page status"))
	}
	return c.JSON(shared.Success(map[string]string{"status": status}))
}

func (h *Handler) CreatePageVersion(c *fiber.Ctx) error {
	id, err := parseParamID(c)
	if err != nil {
		return c.Status(400).JSON(shared.Error(shared.ErrValidation, "Invalid page ID"))
	}
	var req struct {
		Title   *string `json:"title,omitempty"`
		Content *string `json:"content,omitempty"`
	}
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(shared.Error(shared.ErrValidation, "Invalid request body"))
	}
	uid := uuid.Nil
	if v, ok := middleware.UserIDFromCtx(c); ok {
		uid = v
	}
	version, err := h.svc.CreatePageVersion(c.Context(), id, &uid, req.Title, req.Content)
	if err != nil {
		return c.Status(500).JSON(shared.Error(shared.ErrInternal, "Failed to create version"))
	}
	return c.Status(201).JSON(shared.Success(map[string]int{"version": version}))
}

func (h *Handler) ListPageVersions(c *fiber.Ctx) error {
	id, err := parseParamID(c)
	if err != nil {
		return c.Status(400).JSON(shared.Error(shared.ErrValidation, "Invalid page ID"))
	}
	vers, err := h.svc.ListPageVersions(c.Context(), id)
	if err != nil {
		return c.Status(500).JSON(shared.Error(shared.ErrInternal, "Failed to list versions"))
	}
	if vers == nil {
		vers = []PageVersion{}
	}
	return c.JSON(shared.Success(vers))
}

func (h *Handler) UpdatePageSEO(c *fiber.Ctx) error {
	id, err := parseParamID(c)
	if err != nil {
		return c.Status(400).JSON(shared.Error(shared.ErrValidation, "Invalid page ID"))
	}
	var req SaveSEORequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(shared.Error(shared.ErrValidation, "Invalid request body"))
	}
	seo, err := h.svc.UpsertPageSEO(c.Context(), id, req)
	if err != nil {
		return c.Status(500).JSON(shared.Error(shared.ErrInternal, "Failed to update SEO"))
	}
	return c.JSON(shared.Success(seo))
}

// ---- Post handlers

func (h *Handler) ListPosts(c *fiber.Ctx) error {
	page, limit := shared.ParsePagination(c)
	posts, total, err := h.svc.ListPosts(c.Context(), page, limit)
	if err != nil {
		return c.Status(500).JSON(shared.Error(shared.ErrInternal, "Failed to list posts"))
	}
	if posts == nil {
		posts = []Post{}
	}
	return c.JSON(shared.SuccessWithMeta(posts, shared.BuildMeta(page, limit, total)))
}

func (h *Handler) GetPostBySlug(c *fiber.Ctx) error {
	p, err := h.svc.GetPostBySlug(c.Context(), c.Params("slug"))
	if err != nil {
		if errNoRows(err) {
			return c.Status(404).JSON(shared.Error(shared.ErrNotFound, "Post not found"))
		}
		return c.Status(500).JSON(shared.Error(shared.ErrInternal, "Failed to get post"))
	}
	return c.JSON(shared.Success(p))
}

func (h *Handler) GetPost(c *fiber.Ctx) error {
	id, err := parseParamID(c)
	if err != nil {
		return c.Status(400).JSON(shared.Error(shared.ErrValidation, "Invalid post ID"))
	}
	p, err := h.svc.GetPostByID(c.Context(), id)
	if err != nil {
		if errNoRows(err) {
			return c.Status(404).JSON(shared.Error(shared.ErrNotFound, "Post not found"))
		}
		return c.Status(500).JSON(shared.Error(shared.ErrInternal, "Failed to get post"))
	}
	return c.JSON(shared.Success(p))
}

func (h *Handler) CreatePost(c *fiber.Ctx) error {
	var req SavePostRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(shared.Error(shared.ErrValidation, "Invalid request body"))
	}
	if err := validateSlugTitle(req.Slug, req.Title); err != nil {
		return c.Status(400).JSON(shared.Error(shared.ErrValidation, err.Error()))
	}
	p, err := h.svc.CreatePost(c.Context(), req, userID(c))
	if err != nil {
		return handleCreateErr(c, err, "post")
	}
	return c.Status(201).JSON(shared.Success(p))
}

func (h *Handler) UpdatePost(c *fiber.Ctx) error {
	id, err := parseParamID(c)
	if err != nil {
		return c.Status(400).JSON(shared.Error(shared.ErrValidation, "Invalid post ID"))
	}
	var req SavePostRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(shared.Error(shared.ErrValidation, "Invalid request body"))
	}
	if err := validateSlugTitle(req.Slug, req.Title); err != nil {
		return c.Status(400).JSON(shared.Error(shared.ErrValidation, err.Error()))
	}
	p, err := h.svc.UpdatePost(c.Context(), id, req, userID(c))
	if err != nil {
		if isUniqueViolation(err) {
			return c.Status(409).JSON(shared.Error(shared.ErrConflict, "slug already exists"))
		}
		if errNoRows(err) {
			return c.Status(404).JSON(shared.Error(shared.ErrNotFound, "Post not found"))
		}
		return c.Status(500).JSON(shared.Error(shared.ErrInternal, "Failed to update post"))
	}
	return c.JSON(shared.Success(p))
}

func (h *Handler) DeletePost(c *fiber.Ctx) error {
	id, err := parseParamID(c)
	if err != nil {
		return c.Status(400).JSON(shared.Error(shared.ErrValidation, "Invalid post ID"))
	}
	if err := h.svc.DeletePost(c.Context(), id); err != nil {
		if errNoRows(err) {
			return c.Status(404).JSON(shared.Error(shared.ErrNotFound, "Post not found"))
		}
		return c.Status(500).JSON(shared.Error(shared.ErrInternal, "Failed to delete post"))
	}
	return c.JSON(shared.Success(map[string]string{"status": "deleted"}))
}

func (h *Handler) PublishPost(c *fiber.Ctx) error {
	id, err := parseParamID(c)
	if err != nil {
		return c.Status(400).JSON(shared.Error(shared.ErrValidation, "Invalid post ID"))
	}
	if err := h.svc.PublishPost(c.Context(), id, userID(c)); err != nil {
		if errNoRows(err) {
			return c.Status(404).JSON(shared.Error(shared.ErrNotFound, "Post not found"))
		}
		return c.Status(500).JSON(shared.Error(shared.ErrInternal, "Failed to publish post"))
	}
	return c.JSON(shared.Success(map[string]string{"status": "published"}))
}

// ---- Category handlers

func (h *Handler) ListCategories(c *fiber.Ctx) error {
	cats, err := h.svc.ListCategories(c.Context())
	if err != nil {
		return c.Status(500).JSON(shared.Error(shared.ErrInternal, "Failed to list categories"))
	}
	if cats == nil {
		cats = []Category{}
	}
	return c.JSON(shared.Success(cats))
}

func (h *Handler) CreateCategory(c *fiber.Ctx) error {
	var req SaveCategoryRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(shared.Error(shared.ErrValidation, "Invalid request body"))
	}
	if err := validateSlugTitle(req.Slug, req.Name); err != nil {
		return c.Status(400).JSON(shared.Error(shared.ErrValidation, err.Error()))
	}
	cat, err := h.svc.CreateCategory(c.Context(), req)
	if err != nil {
		if isUniqueViolation(err) {
			return c.Status(409).JSON(shared.Error(shared.ErrConflict, "slug already exists"))
		}
		return c.Status(500).JSON(shared.Error(shared.ErrInternal, "Failed to create category"))
	}
	return c.Status(201).JSON(shared.Success(cat))
}

func (h *Handler) UpdateCategory(c *fiber.Ctx) error {
	id, err := parseParamID(c)
	if err != nil {
		return c.Status(400).JSON(shared.Error(shared.ErrValidation, "Invalid category ID"))
	}
	var req SaveCategoryRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(shared.Error(shared.ErrValidation, "Invalid request body"))
	}
	cat, err := h.svc.UpdateCategory(c.Context(), id, req)
	if err != nil {
		if isUniqueViolation(err) {
			return c.Status(409).JSON(shared.Error(shared.ErrConflict, "slug already exists"))
		}
		if errNoRows(err) {
			return c.Status(404).JSON(shared.Error(shared.ErrNotFound, "Category not found"))
		}
		return c.Status(500).JSON(shared.Error(shared.ErrInternal, "Failed to update category"))
	}
	return c.JSON(shared.Success(cat))
}

func (h *Handler) DeleteCategory(c *fiber.Ctx) error {
	id, err := parseParamID(c)
	if err != nil {
		return c.Status(400).JSON(shared.Error(shared.ErrValidation, "Invalid category ID"))
	}
	if err := h.svc.DeleteCategory(c.Context(), id); err != nil {
		if errNoRows(err) {
			return c.Status(404).JSON(shared.Error(shared.ErrNotFound, "Category not found"))
		}
		return c.Status(500).JSON(shared.Error(shared.ErrInternal, "Failed to delete category"))
	}
	return c.JSON(shared.Success(map[string]string{"status": "deleted"}))
}

// ---- Tag handlers

func (h *Handler) ListTags(c *fiber.Ctx) error {
	tags, err := h.svc.ListTags(c.Context())
	if err != nil {
		return c.Status(500).JSON(shared.Error(shared.ErrInternal, "Failed to list tags"))
	}
	if tags == nil {
		tags = []Tag{}
	}
	return c.JSON(shared.Success(tags))
}

func (h *Handler) CreateTag(c *fiber.Ctx) error {
	var req SaveTagRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(shared.Error(shared.ErrValidation, "Invalid request body"))
	}
	if strings.TrimSpace(req.Name) == "" || strings.TrimSpace(req.Slug) == "" {
		return c.Status(400).JSON(shared.Error(shared.ErrValidation, "name and slug required"))
	}
	tag, err := h.svc.CreateTag(c.Context(), req)
	if err != nil {
		if isUniqueViolation(err) {
			return c.Status(409).JSON(shared.Error(shared.ErrConflict, "slug already exists"))
		}
		return c.Status(500).JSON(shared.Error(shared.ErrInternal, "Failed to create tag"))
	}
	return c.Status(201).JSON(shared.Success(tag))
}

func (h *Handler) UpdateTag(c *fiber.Ctx) error {
	id, err := parseParamID(c)
	if err != nil {
		return c.Status(400).JSON(shared.Error(shared.ErrValidation, "Invalid tag ID"))
	}
	var req SaveTagRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(shared.Error(shared.ErrValidation, "Invalid request body"))
	}
	tag, err := h.svc.UpdateTag(c.Context(), id, req)
	if err != nil {
		if isUniqueViolation(err) {
			return c.Status(409).JSON(shared.Error(shared.ErrConflict, "slug already exists"))
		}
		if errNoRows(err) {
			return c.Status(404).JSON(shared.Error(shared.ErrNotFound, "Tag not found"))
		}
		return c.Status(500).JSON(shared.Error(shared.ErrInternal, "Failed to update tag"))
	}
	return c.JSON(shared.Success(tag))
}

func (h *Handler) DeleteTag(c *fiber.Ctx) error {
	id, err := parseParamID(c)
	if err != nil {
		return c.Status(400).JSON(shared.Error(shared.ErrValidation, "Invalid tag ID"))
	}
	if err := h.svc.DeleteTag(c.Context(), id); err != nil {
		if errNoRows(err) {
			return c.Status(404).JSON(shared.Error(shared.ErrNotFound, "Tag not found"))
		}
		return c.Status(500).JSON(shared.Error(shared.ErrInternal, "Failed to delete tag"))
	}
	return c.JSON(shared.Success(map[string]string{"status": "deleted"}))
}

// ---- Setting handlers

func (h *Handler) ListSettings(c *fiber.Ctx) error {
	settings, err := h.svc.ListSettings(c.Context())
	if err != nil {
		return c.Status(500).JSON(shared.Error(shared.ErrInternal, "Failed to list settings"))
	}
	if settings == nil {
		settings = []Setting{}
	}
	return c.JSON(shared.Success(settings))
}

func (h *Handler) GetSetting(c *fiber.Ctx) error {
	s, err := h.svc.GetSetting(c.Context(), c.Params("key"))
	if err != nil {
		if errNoRows(err) {
			return c.Status(404).JSON(shared.Error(shared.ErrNotFound, "Setting not found"))
		}
		return c.Status(500).JSON(shared.Error(shared.ErrInternal, "Failed to get setting"))
	}
	return c.JSON(shared.Success(s))
}

func (h *Handler) UpdateSetting(c *fiber.Ctx) error {
	var req SaveSettingRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(shared.Error(shared.ErrValidation, "Invalid request body"))
	}
	s, err := h.svc.UpdateSetting(c.Context(), c.Params("key"), req)
	if err != nil {
		return c.Status(500).JSON(shared.Error(shared.ErrInternal, "Failed to update setting"))
	}
	return c.JSON(shared.Success(s))
}

// ---- FAQ handlers

func (h *Handler) ListFAQs(c *fiber.Ctx) error {
	faqs, err := h.svc.ListFAQs(c.Context(), c.Query("active") != "false")
	if err != nil {
		return c.Status(500).JSON(shared.Error(shared.ErrInternal, "Failed to list faqs"))
	}
	if faqs == nil {
		faqs = []FAQ{}
	}
	return c.JSON(shared.Success(faqs))
}

func (h *Handler) CreateFAQ(c *fiber.Ctx) error {
	var req SaveFAQRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(shared.Error(shared.ErrValidation, "Invalid request body"))
	}
	if strings.TrimSpace(req.Question) == "" {
		return c.Status(400).JSON(shared.Error(shared.ErrValidation, "question required"))
	}
	faq, err := h.svc.CreateFAQ(c.Context(), req)
	if err != nil {
		return c.Status(500).JSON(shared.Error(shared.ErrInternal, "Failed to create faq"))
	}
	return c.Status(201).JSON(shared.Success(faq))
}

func (h *Handler) UpdateFAQ(c *fiber.Ctx) error {
	id, err := parseParamID(c)
	if err != nil {
		return c.Status(400).JSON(shared.Error(shared.ErrValidation, "Invalid faq ID"))
	}
	var req SaveFAQRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(shared.Error(shared.ErrValidation, "Invalid request body"))
	}
	faq, err := h.svc.UpdateFAQ(c.Context(), id, req)
	if err != nil {
		if errNoRows(err) {
			return c.Status(404).JSON(shared.Error(shared.ErrNotFound, "FAQ not found"))
		}
		return c.Status(500).JSON(shared.Error(shared.ErrInternal, "Failed to update faq"))
	}
	return c.JSON(shared.Success(faq))
}

func (h *Handler) DeleteFAQ(c *fiber.Ctx) error {
	id, err := parseParamID(c)
	if err != nil {
		return c.Status(400).JSON(shared.Error(shared.ErrValidation, "Invalid faq ID"))
	}
	if err := h.svc.DeleteFAQ(c.Context(), id); err != nil {
		if errNoRows(err) {
			return c.Status(404).JSON(shared.Error(shared.ErrNotFound, "FAQ not found"))
		}
		return c.Status(500).JSON(shared.Error(shared.ErrInternal, "Failed to delete faq"))
	}
	return c.JSON(shared.Success(map[string]string{"status": "deleted"}))
}

// ---- Banner handlers

func (h *Handler) ListBanners(c *fiber.Ctx) error {
	banners, err := h.svc.ListBanners(c.Context(), c.Query("status") == "")
	if err != nil {
		return c.Status(500).JSON(shared.Error(shared.ErrInternal, "Failed to list banners"))
	}
	if banners == nil {
		banners = []Banner{}
	}
	return c.JSON(shared.Success(banners))
}

func (h *Handler) CreateBanner(c *fiber.Ctx) error {
	var req SaveBannerRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(shared.Error(shared.ErrValidation, "Invalid request body"))
	}
	if strings.TrimSpace(req.Title) == "" {
		return c.Status(400).JSON(shared.Error(shared.ErrValidation, "title required"))
	}
	ban, err := h.svc.CreateBanner(c.Context(), req)
	if err != nil {
		return c.Status(500).JSON(shared.Error(shared.ErrInternal, "Failed to create banner"))
	}
	return c.Status(201).JSON(shared.Success(ban))
}

func (h *Handler) UpdateBanner(c *fiber.Ctx) error {
	id, err := parseParamID(c)
	if err != nil {
		return c.Status(400).JSON(shared.Error(shared.ErrValidation, "Invalid banner ID"))
	}
	var req SaveBannerRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(shared.Error(shared.ErrValidation, "Invalid request body"))
	}
	ban, err := h.svc.UpdateBanner(c.Context(), id, req)
	if err != nil {
		if errNoRows(err) {
			return c.Status(404).JSON(shared.Error(shared.ErrNotFound, "Banner not found"))
		}
		return c.Status(500).JSON(shared.Error(shared.ErrInternal, "Failed to update banner"))
	}
	return c.JSON(shared.Success(ban))
}

func (h *Handler) DeleteBanner(c *fiber.Ctx) error {
	id, err := parseParamID(c)
	if err != nil {
		return c.Status(400).JSON(shared.Error(shared.ErrValidation, "Invalid banner ID"))
	}
	if err := h.svc.DeleteBanner(c.Context(), id); err != nil {
		if errNoRows(err) {
			return c.Status(404).JSON(shared.Error(shared.ErrNotFound, "Banner not found"))
		}
		return c.Status(500).JSON(shared.Error(shared.ErrInternal, "Failed to delete banner"))
	}
	return c.JSON(shared.Success(map[string]string{"status": "deleted"}))
}

// ---- News handlers

func (h *Handler) ListNews(c *fiber.Ctx) error {
	news, err := h.svc.ListNews(c.Context(), c.Query("all") != "true")
	if err != nil {
		return c.Status(500).JSON(shared.Error(shared.ErrInternal, "Failed to list news"))
	}
	if news == nil {
		news = []News{}
	}
	return c.JSON(shared.Success(news))
}

func (h *Handler) CreateNews(c *fiber.Ctx) error {
	var req SaveNewsRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(shared.Error(shared.ErrValidation, "Invalid request body"))
	}
	if err := validateSlugTitle(req.Slug, req.Title); err != nil {
		return c.Status(400).JSON(shared.Error(shared.ErrValidation, err.Error()))
	}
	n, err := h.svc.CreateNews(c.Context(), req)
	if err != nil {
		if isUniqueViolation(err) {
			return c.Status(409).JSON(shared.Error(shared.ErrConflict, "slug already exists"))
		}
		return c.Status(500).JSON(shared.Error(shared.ErrInternal, "Failed to create news"))
	}
	return c.Status(201).JSON(shared.Success(n))
}

func (h *Handler) UpdateNews(c *fiber.Ctx) error {
	id, err := parseParamID(c)
	if err != nil {
		return c.Status(400).JSON(shared.Error(shared.ErrValidation, "Invalid news ID"))
	}
	var req SaveNewsRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(shared.Error(shared.ErrValidation, "Invalid request body"))
	}
	if err := validateSlugTitle(req.Slug, req.Title); err != nil {
		return c.Status(400).JSON(shared.Error(shared.ErrValidation, err.Error()))
	}
	n, err := h.svc.UpdateNewsList(c.Context(), id, req)
	if err != nil {
		if isUniqueViolation(err) {
			return c.Status(409).JSON(shared.Error(shared.ErrConflict, "slug already exists"))
		}
		if errNoRows(err) {
			return c.Status(404).JSON(shared.Error(shared.ErrNotFound, "News not found"))
		}
		return c.Status(500).JSON(shared.Error(shared.ErrInternal, "Failed to update news"))
	}
	return c.JSON(shared.Success(n))
}

func (h *Handler) DeleteNews(c *fiber.Ctx) error {
	id, err := parseParamID(c)
	if err != nil {
		return c.Status(400).JSON(shared.Error(shared.ErrValidation, "Invalid news ID"))
	}
	if err := h.svc.DeleteNews(c.Context(), id); err != nil {
		if errNoRows(err) {
			return c.Status(404).JSON(shared.Error(shared.ErrNotFound, "News not found"))
		}
		return c.Status(500).JSON(shared.Error(shared.ErrInternal, "Failed to delete news"))
	}
	return c.JSON(shared.Success(map[string]string{"status": "deleted"}))
}

func (h *Handler) PublishNews(c *fiber.Ctx) error {
	id, err := parseParamID(c)
	if err != nil {
		return c.Status(400).JSON(shared.Error(shared.ErrValidation, "Invalid news ID"))
	}
	if err := h.svc.PublishNews(c.Context(), id); err != nil {
		if errNoRows(err) {
			return c.Status(404).JSON(shared.Error(shared.ErrNotFound, "News not found"))
		}
		return c.Status(500).JSON(shared.Error(shared.ErrInternal, "Failed to publish news"))
	}
	return c.JSON(shared.Success(map[string]string{"status": "published"}))
}

// ---- helpers

func handleCreateErr(c *fiber.Ctx, err error, resource string) error {
	if isUniqueViolation(err) {
		return c.Status(409).JSON(shared.Error(shared.ErrConflict, "slug already exists"))
	}
	return c.Status(500).JSON(shared.Error(shared.ErrInternal, "Failed to create "+resource))
}

func validateSlugTitle(slug, title string) error {
	if strings.TrimSpace(slug) == "" {
		return fiber.NewError(fiber.StatusBadRequest, "slug required")
	}
	if strings.TrimSpace(title) == "" {
		return fiber.NewError(fiber.StatusBadRequest, "title required")
	}
	return nil
}