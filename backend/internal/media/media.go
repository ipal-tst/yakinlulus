package media

import (
	"context"
	"fmt"
	"io"
	"net/http"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"yakinlulus.id/backend/internal/middleware"
	"yakinlulus.id/backend/internal/shared"
	"yakinlulus.id/backend/pkg/storage"
)

type Media struct {
	ID           uuid.UUID  `json:"id"`
	FileName     string     `json:"file_name"`
	OriginalName string     `json:"original_name"`
	MimeType     string     `json:"mime_type"`
	FileSize     int64      `json:"file_size"`
	StoragePath  string     `json:"storage_path"`
	URL          string     `json:"url"`
	UploadedBy   *uuid.UUID `json:"uploaded_by,omitempty"`
	EntityType   *string    `json:"entity_type,omitempty"`
	EntityID     *uuid.UUID `json:"entity_id,omitempty"`
	CreatedAt    time.Time  `json:"created_at"`
}

type Repository struct {
	pool *pgxpool.Pool
}

func NewRepository(pool *pgxpool.Pool) *Repository {
	return &Repository{pool: pool}
}

func (r *Repository) Create(ctx context.Context, m *Media) error {
	m.ID = uuid.New()
	_, err := r.pool.Exec(ctx,
		`INSERT INTO media (id, file_name, original_name, mime_type, file_size, storage_path, url, uploaded_by, entity_type, entity_id)
		 VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
		m.ID, m.FileName, m.OriginalName, m.MimeType, m.FileSize, m.StoragePath, m.URL, m.UploadedBy, m.EntityType, m.EntityID)
	return err
}

func (r *Repository) FindByID(ctx context.Context, id uuid.UUID) (*Media, error) {
	m := &Media{}
	err := r.pool.QueryRow(ctx,
		`SELECT id, file_name, original_name, mime_type, file_size, storage_path, url, uploaded_by, entity_type, entity_id, created_at
		 FROM media WHERE id = $1`, id,
	).Scan(&m.ID, &m.FileName, &m.OriginalName, &m.MimeType, &m.FileSize, &m.StoragePath, &m.URL, &m.UploadedBy, &m.EntityType, &m.EntityID, &m.CreatedAt)
	if err != nil {
		return nil, err
	}
	return m, nil
}

func (r *Repository) ListByEntity(ctx context.Context, entityType string, entityID uuid.UUID, limit, offset int) ([]Media, int, error) {
	var total int
	err := r.pool.QueryRow(ctx,
		`SELECT COUNT(*) FROM media WHERE entity_type = $1 AND entity_id = $2`, entityType, entityID).Scan(&total)
	if err != nil {
		return nil, 0, err
	}

	rows, err := r.pool.Query(ctx,
		`SELECT id, file_name, original_name, mime_type, file_size, storage_path, url, uploaded_by, entity_type, entity_id, created_at
		 FROM media WHERE entity_type = $1 AND entity_id = $2
		 ORDER BY created_at DESC LIMIT $3 OFFSET $4`, entityType, entityID, limit, offset)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	var media []Media
	for rows.Next() {
		var m Media
		if err := rows.Scan(&m.ID, &m.FileName, &m.OriginalName, &m.MimeType, &m.FileSize, &m.StoragePath, &m.URL, &m.UploadedBy, &m.EntityType, &m.EntityID, &m.CreatedAt); err != nil {
			return nil, 0, err
		}
		media = append(media, m)
	}
	return media, total, nil
}

func (r *Repository) ListAll(ctx context.Context, limit, offset int, mimeFilter string) ([]Media, int, error) {
	where := "WHERE 1=1"
	args := []interface{}{}
	argN := 1
	if mimeFilter != "" {
		where += fmt.Sprintf(" AND mime_type ILIKE $%d", argN)
		args = append(args, "%"+mimeFilter+"%")
		argN++
	}

	var total int
	r.pool.QueryRow(ctx, "SELECT COUNT(*) FROM media "+where, args...).Scan(&total)

	rows, err := r.pool.Query(ctx, `
		SELECT id, file_name, original_name, mime_type, file_size, storage_path, url, uploaded_by, entity_type, entity_id, created_at
		FROM media `+where+` ORDER BY created_at DESC LIMIT $`+fmt.Sprint(argN)+` OFFSET $`+fmt.Sprint(argN+1), append(args, limit, offset)...)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	var media []Media
	for rows.Next() {
		var m Media
		if err := rows.Scan(&m.ID, &m.FileName, &m.OriginalName, &m.MimeType, &m.FileSize, &m.StoragePath, &m.URL, &m.UploadedBy, &m.EntityType, &m.EntityID, &m.CreatedAt); err != nil {
			return nil, 0, err
		}
		media = append(media, m)
	}
	return media, total, nil
}

func (r *Repository) Delete(ctx context.Context, id uuid.UUID) error {
	_, err := r.pool.Exec(ctx, `DELETE FROM media WHERE id = $1`, id)
	return err
}

func (r *Repository) GetStoragePath(ctx context.Context, id uuid.UUID) (*string, error) {
	var path string
	err := r.pool.QueryRow(ctx, `SELECT storage_path FROM media WHERE id = $1`, id).Scan(&path)
	if err != nil {
		return nil, err
	}
	return &path, nil
}

type Service struct {
	repo *Repository
	st   *storage.Client
}

func NewService(repo *Repository, st *storage.Client) *Service {
	return &Service{repo: repo, st: st}
}

func (s *Service) Create(ctx context.Context, m *Media) error {
	return s.repo.Create(ctx, m)
}

func (s *Service) FindByID(ctx context.Context, id uuid.UUID) (*Media, error) {
	return s.repo.FindByID(ctx, id)
}

func (s *Service) ListByEntity(ctx context.Context, entityType string, entityID uuid.UUID, page, limit int) ([]Media, int, error) {
	return s.repo.ListByEntity(ctx, entityType, entityID, limit, (page-1)*limit)
}

func (s *Service) ListAll(ctx context.Context, page, limit int, mimeFilter string) ([]Media, int, error) {
	return s.repo.ListAll(ctx, limit, (page-1)*limit, mimeFilter)
}

func (s *Service) Delete(ctx context.Context, id uuid.UUID) error {
	path, err := s.repo.GetStoragePath(ctx, id)
	if err != nil {
		return err
	}
	if s.st != nil && path != nil {
		_ = s.st.Delete(ctx, *path) // best-effort
	}
	return s.repo.Delete(ctx, id)
}

func (s *Service) UploadFile(ctx context.Context, fileName string, reader io.Reader, size int64, contentType string) (string, string, error) {
	objectName := fmt.Sprintf("uploads/%s_%s", uuid.New().String(), fileName)
	url, err := s.st.Upload(ctx, objectName, reader, size, contentType)
	if err != nil {
		return "", "", err
	}
	return objectName, url, nil
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
	write := middleware.RequireRole("ADMIN", "STAFF", "TEACHER")

	r := router.Group("/media", auth)
	r.Get("/", write, h.ListAll)
	r.Post("/upload", write, h.Upload)
	r.Get("/entity/:type/:id", h.ListByEntity)
	r.Get("/:id", h.GetByID)
	r.Delete("/:id", write, h.Delete)
}

func (h *Handler) ListAll(c *fiber.Ctx) error {
	page, limit := shared.ParsePagination(c)
	mimeFilter := c.Query("mime", "")
	media, total, err := h.svc.ListAll(c.Context(), page, limit, mimeFilter)
	if err != nil {
		return c.Status(500).JSON(shared.Error(shared.ErrInternal, "Failed to list media"))
	}
	return c.JSON(shared.SuccessWithMeta(media, shared.BuildMeta(page, limit, total)))
}

func (h *Handler) Upload(c *fiber.Ctx) error {
	file, err := c.FormFile("file")
	if err != nil {
		return c.Status(400).JSON(shared.Error(shared.ErrValidation, "File is required"))
	}

	entityType := c.FormValue("entity_type")
	entityIDStr := c.FormValue("entity_id")

	f, err := file.Open()
	if err != nil {
		return c.Status(500).JSON(shared.Error(shared.ErrInternal, "Failed to open file"))
	}
	defer f.Close()

	objectName, url, err := h.svc.UploadFile(c.Context(), file.Filename, f, file.Size, file.Header.Get("Content-Type"))
	if err != nil {
		return c.Status(500).JSON(shared.Error(shared.ErrInternal, "Failed to upload file to storage"))
	}

	m := &Media{
		FileName:     file.Filename,
		OriginalName: file.Filename,
		MimeType:     file.Header.Get("Content-Type"),
		FileSize:     file.Size,
		StoragePath:  objectName,
		URL:          url,
		UploadedBy:   uuidPtr(uuid.MustParse(c.Locals("user_id").(string))),
	}

	if entityType != "" {
		m.EntityType = &entityType
	}
	if entityIDStr != "" {
		eid, err := uuid.Parse(entityIDStr)
		if err == nil {
			m.EntityID = &eid
		}
	}

	if err := h.svc.Create(c.Context(), m); err != nil {
		return c.Status(500).JSON(shared.Error(shared.ErrInternal, "Failed to save media metadata"))
	}

	return c.Status(201).JSON(shared.Success(m))
}

func (h *Handler) GetByID(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(400).JSON(shared.Error(shared.ErrValidation, "Invalid media ID"))
	}

	m, err := h.svc.FindByID(c.Context(), id)
	if err != nil {
		if err == pgx.ErrNoRows {
			return c.Status(404).JSON(shared.Error(shared.ErrNotFound, "Media not found"))
		}
		return c.Status(500).JSON(shared.Error(shared.ErrInternal, "Failed to get media"))
	}

	return c.JSON(shared.Success(m))
}

func (h *Handler) ListByEntity(c *fiber.Ctx) error {
	entityType := c.Params("type")
	entityID, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(400).JSON(shared.Error(shared.ErrValidation, "Invalid entity ID"))
	}

	page, limit := shared.ParsePagination(c)
	media, total, err := h.svc.ListByEntity(c.Context(), entityType, entityID, page, limit)
	if err != nil {
		return c.Status(500).JSON(shared.Error(shared.ErrInternal, "Failed to list media"))
	}

	return c.JSON(shared.SuccessWithMeta(media, shared.BuildMeta(page, limit, total)))
}

func (h *Handler) Delete(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(400).JSON(shared.Error(shared.ErrValidation, "Invalid media ID"))
	}

	if err := h.svc.Delete(c.Context(), id); err != nil {
		return c.Status(500).JSON(shared.Error(shared.ErrInternal, "Failed to delete media"))
	}

	return c.SendStatus(http.StatusNoContent)
}

func uuidPtr(u uuid.UUID) *uuid.UUID {
	return &u
}
