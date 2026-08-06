package cms

import (
	"context"

	"github.com/google/uuid"
)

type Service struct {
	repo *Repository
}

func NewService(repo *Repository) *Service { return &Service{repo: repo} }

// Pages
func (s *Service) CreatePage(ctx context.Context, req SavePageRequest, userID uuid.UUID) (*Page, error) {
	p := &Page{
		Slug:       req.Slug,
		Title:      req.Title,
		Subtitle:   req.Subtitle,
		Description: req.Description,
		PageType:   defaultString(req.PageType, "CUSTOM"),
		Template:   req.Template,
		Status:     "DRAFT",
		Visibility: defaultString(req.Visibility, "PUBLIC"),
		CoverImage: req.CoverImage,
		Thumbnail:  req.Thumbnail,
		AuthorID:   &userID,
	}
	return s.repo.CreatePage(ctx, p, req.Blocks)
}

func (s *Service) GetPageByID(ctx context.Context, id uuid.UUID) (*Page, error) {
	return s.repo.GetPageByID(ctx, id, false)
}

func (s *Service) GetPageBySlug(ctx context.Context, slug string) (*Page, error) {
	return s.repo.GetPageBySlug(ctx, slug)
}

func (s *Service) ListPages(ctx context.Context, page, limit int) ([]Page, int, error) {
	return s.repo.ListPages(ctx, limit, (page-1)*limit)
}

func (s *Service) UpdatePage(ctx context.Context, id uuid.UUID, req SavePageRequest, userID uuid.UUID) (*Page, error) {
	p := &Page{
		ID:         id,
		Slug:       req.Slug,
		Title:      req.Title,
		Subtitle:   req.Subtitle,
		Description: req.Description,
		PageType:   defaultString(req.PageType, "CUSTOM"),
		Template:   req.Template,
		Visibility: defaultString(req.Visibility, "PUBLIC"),
		CoverImage: req.CoverImage,
		Thumbnail:  req.Thumbnail,
	}
	return s.repo.UpdatePage(ctx, p, &userID, req.Blocks, req.Content)
}

func (s *Service) DeletePage(ctx context.Context, id uuid.UUID) error {
	return s.repo.SoftDeletePage(ctx, id)
}

func (s *Service) PublishPage(ctx context.Context, id, userID uuid.UUID) error {
	return s.repo.PublishPage(ctx, id, userID)
}

func (s *Service) SetPageStatus(ctx context.Context, id, userID uuid.UUID, status string) error {
	return s.repo.SetPageReview(ctx, id, userID, status)
}

func (s *Service) CreatePageVersion(ctx context.Context, id uuid.UUID, editorID *uuid.UUID, title, content *string) (int, error) {
	return s.repo.CreatePageVersion(ctx, id, editorID, title, content)
}

func (s *Service) ListPageVersions(ctx context.Context, id uuid.UUID) ([]PageVersion, error) {
	return s.repo.ListPageVersions(ctx, id)
}

func (s *Service) UpsertPageSEO(ctx context.Context, id uuid.UUID, req SaveSEORequest) (*PageSEO, error) {
	return s.repo.UpsertPageSEO(ctx, id, req)
}

// Posts
func (s *Service) CreatePost(ctx context.Context, req SavePostRequest, userID uuid.UUID) (*Post, error) {
	p := &Post{
		Slug:        req.Slug,
		Title:       req.Title,
		Excerpt:     req.Excerpt,
		Content:     req.Content,
		CoverImage:  req.CoverImage,
		CategoryID:  req.CategoryID,
		AuthorID:    &userID,
		Status:      defaultString(req.Status, "DRAFT"),
		ReadingTime: req.ReadingTime,
	}
	return s.repo.CreatePost(ctx, p, req.TagIDs)
}

func (s *Service) GetPostByID(ctx context.Context, id uuid.UUID) (*Post, error) {
	return s.repo.GetPostByID(ctx, id)
}

func (s *Service) GetPostBySlug(ctx context.Context, slug string) (*Post, error) {
	return s.repo.GetPostBySlug(ctx, slug)
}

func (s *Service) ListPosts(ctx context.Context, page, limit int) ([]Post, int, error) {
	return s.repo.ListPosts(ctx, limit, (page-1)*limit)
}

func (s *Service) UpdatePost(ctx context.Context, id uuid.UUID, req SavePostRequest, userID uuid.UUID) (*Post, error) {
	p := &Post{
		ID:          id,
		Slug:        req.Slug,
		Title:       req.Title,
		Excerpt:     req.Excerpt,
		Content:     req.Content,
		CoverImage:  req.CoverImage,
		CategoryID:  req.CategoryID,
		Status:      defaultString(req.Status, "DRAFT"),
		ReadingTime: req.ReadingTime,
	}
	return s.repo.UpdatePost(ctx, p, &userID, req.TagIDs)
}

func (s *Service) DeletePost(ctx context.Context, id uuid.UUID) error {
	return s.repo.SoftDeletePost(ctx, id)
}

func (s *Service) PublishPost(ctx context.Context, id, userID uuid.UUID) error {
	return s.repo.PublishPost(ctx, id, userID)
}

// Categories
func (s *Service) CreateCategory(ctx context.Context, req SaveCategoryRequest) (*Category, error) {
	c := &Category{
		ParentID:    req.ParentID,
		Name:      req.Name,
		Slug:      req.Slug,
		Description: req.Description,
		Icon:      req.Icon,
		SortOrder: req.SortOrder,
		Active:     coalesceBool(req.Active, true),
	}
	return s.repo.CreateCategory(ctx, c)
}

func (s *Service) GetCategory(ctx context.Context, id uuid.UUID) (*Category, error) {
	return s.repo.GetCategoryByID(ctx, id)
}

func (s *Service) ListCategories(ctx context.Context) ([]Category, error) {
	return s.repo.ListCategories(ctx)
}

func (s *Service) UpdateCategory(ctx context.Context, id uuid.UUID, req SaveCategoryRequest) (*Category, error) {
	c := &Category{
		ID:          id,
		ParentID:    req.ParentID,
		Name:        req.Name,
		Slug:        req.Slug,
		Description: req.Description,
		Icon:        req.Icon,
		SortOrder:   req.SortOrder,
		Active:      coalesceBool(req.Active, true),
	}
	return s.repo.UpdateCategory(ctx, c)
}

func (s *Service) DeleteCategory(ctx context.Context, id uuid.UUID) error {
	return s.repo.DeleteCategory(ctx, id)
}

// Tags
func (s *Service) CreateTag(ctx context.Context, req SaveTagRequest) (*Tag, error) {
	return s.repo.CreateTag(ctx, &Tag{Name: req.Name, Slug: req.Slug, Color: req.Color})
}

func (s *Service) GetTag(ctx context.Context, id uuid.UUID) (*Tag, error) {
	return s.repo.GetTagByID(ctx, id)
}

func (s *Service) ListTags(ctx context.Context) ([]Tag, error) {
	return s.repo.ListTags(ctx)
}

func (s *Service) UpdateTag(ctx context.Context, id uuid.UUID, req SaveTagRequest) (*Tag, error) {
	return s.repo.UpdateTag(ctx, &Tag{ID: id, Name: req.Name, Slug: req.Slug, Color: req.Color})
}

func (s *Service) DeleteTag(ctx context.Context, id uuid.UUID) error {
	return s.repo.DeleteTag(ctx, id)
}

// Settings
func (s *Service) GetSetting(ctx context.Context, key string) (*Setting, error) {
	return s.repo.GetSetting(ctx, key)
}

func (s *Service) ListSettings(ctx context.Context) ([]Setting, error) {
	return s.repo.ListSettings(ctx)
}

func (s *Service) UpdateSetting(ctx context.Context, key string, req SaveSettingRequest) (*Setting, error) {
	return s.repo.UpsertSetting(ctx, key, req)
}

// FAQs
func (s *Service) CreateFAQ(ctx context.Context, req SaveFAQRequest) (*FAQ, error) {
	return s.repo.CreateFAQ(ctx, &FAQ{
		Category:  req.Category,
		Question:  req.Question,
		Answer:    req.Answer,
		SortOrder: req.SortOrder,
		Active:    coalesceBool(req.Active, true),
	})
}

func (s *Service) GetFAQ(ctx context.Context, id uuid.UUID) (*FAQ, error) {
	return s.repo.GetFAQ(ctx, id)
}

func (s *Service) ListFAQs(ctx context.Context, activeOnly bool) ([]FAQ, error) {
	return s.repo.ListFAQs(ctx, activeOnly)
}

func (s *Service) UpdateFAQ(ctx context.Context, id uuid.UUID, req SaveFAQRequest) (*FAQ, error) {
	return s.repo.UpdateFAQ(ctx, &FAQ{
		ID:        id,
		Category:  req.Category,
		Question:  req.Question,
		Answer:    req.Answer,
		SortOrder: req.SortOrder,
		Active:    coalesceBool(req.Active, true),
	})
}

func (s *Service) DeleteFAQ(ctx context.Context, id uuid.UUID) error {
	return s.repo.DeleteFAQ(ctx, id)
}

// Banners
func (s *Service) CreateBanner(ctx context.Context, req SaveBannerRequest) (*Banner, error) {
	return s.repo.CreateBanner(ctx, &Banner{
		Title:       req.Title,
		Subtitle:    req.Subtitle,
		Image:       req.Image,
		MobileImage: req.MobileImage,
		ButtonText:  req.ButtonText,
		ButtonLink:  req.ButtonLink,
		Position:    req.Position,
		Priority:    req.Priority,
		StartDate:   req.StartDate,
		EndDate:     req.EndDate,
		Status:      defaultString(req.Status, "ACTIVE"),
	})
}

func (s *Service) GetBanner(ctx context.Context, id uuid.UUID) (*Banner, error) {
	return s.repo.GetBannerByID(ctx, id)
}

func (s *Service) ListBanners(ctx context.Context, activeOnly bool) ([]Banner, error) {
	return s.repo.ListBanners(ctx, activeOnly)
}

func (s *Service) UpdateBanner(ctx context.Context, id uuid.UUID, req SaveBannerRequest) (*Banner, error) {
	return s.repo.UpdateBanner(ctx, &Banner{
		ID:          id,
		Title:       req.Title,
		Subtitle:    req.Subtitle,
		Image:       req.Image,
		MobileImage: req.MobileImage,
		ButtonText:  req.ButtonText,
		ButtonLink:  req.ButtonLink,
		Position:    req.Position,
		Priority:    req.Priority,
		StartDate:   req.StartDate,
		EndDate:     req.EndDate,
		Status:      defaultString(req.Status, "ACTIVE"),
	})
}

func (s *Service) DeleteBanner(ctx context.Context, id uuid.UUID) error {
	return s.repo.DeleteBanner(ctx, id)
}

// News
func (s *Service) CreateNews(ctx context.Context, req SaveNewsRequest) (*News, error) {
	return s.repo.CreateNews(ctx, &News{
		Title:    req.Title,
		Slug:     req.Slug,
		Content:  req.Content,
		Cover:    req.Cover,
		Category: req.Category,
		Status:    defaultString(req.Status, "DRAFT"),
	})
}

func (s *Service) GetNews(ctx context.Context, id uuid.UUID) (*News, error) {
	return s.repo.GetNewsByID(ctx, id)
}

func (s *Service) ListNews(ctx context.Context, publishedOnly bool) ([]News, error) {
	return s.repo.ListNews(ctx, publishedOnly)
}

func (s *Service) UpdateNewsList(ctx context.Context, id uuid.UUID, req SaveNewsRequest) (*News, error) {
	return s.repo.UpdateNews(ctx, &News{
		ID:        id,
		Title:     req.Title,
		Slug:      req.Slug,
		Content:   req.Content,
		Cover:     req.Cover,
		Category:  req.Category,
		Status:    defaultString(req.Status, "DRAFT"),
	})
}

func (s *Service) PublishNews(ctx context.Context, id uuid.UUID) error {
	return s.repo.PublishNews(ctx, id)
}

func (s *Service) DeleteNews(ctx context.Context, id uuid.UUID) error {
	return s.repo.DeleteNews(ctx, id)
}

func defaultString(v, def string) string {
	if v == "" {
		return def
	}
	return v
}