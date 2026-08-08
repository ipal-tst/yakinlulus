package media

import (
	"context"
	"fmt"
	"io"
	"log/slog"
	"net/http"
	"os"
	"path"
	"strings"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
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

	Bucket string `json:"-"`
}

type Repository struct {
	pool *pgxpool.Pool
}

func NewRepository(pool *pgxpool.Pool) *Repository {
	return &Repository{pool: pool}
}

const mediaColumns = `
	a.id, COALESCE(a.display_name, a.original_name), COALESCE(a.original_name, a.asset_code),
	a.mime_type, a.size,
	COALESCE(st.storage_path, ''), COALESCE(NULLIF(st.public_url, ''), NULLIF(st.cdn_url, '')),
	a.uploaded_by, a.created_at, ref.module, ref.entity_id`

func scanMedia(row pgx.Row) (*Media, error) {
	m := &Media{}
	var entityType *string
	var entityID *uuid.UUID
	if err := row.Scan(&m.ID, &m.FileName, &m.OriginalName, &m.MimeType, &m.FileSize,
		&m.StoragePath, &m.URL, &m.UploadedBy, &m.CreatedAt, &entityType, &entityID); err != nil {
		return nil, err
	}
	m.EntityType = entityType
	m.EntityID = entityID
	return m, nil
}

func (r *Repository) Create(ctx context.Context, m *Media) error {
	m.ID = uuid.New()
	m.CreatedAt = time.Now()
	assetCode := "asset_" + strings.ReplaceAll(uuid.NewString(), "-", "")[:12]

	tx, err := r.pool.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)

	storageID, err := r.ensureStorage(ctx, tx, m)
	if err != nil {
		return err
	}

	_, err = tx.Exec(ctx, `
		INSERT INTO media.asset (id, asset_code, original_name, display_name, mime_type, extension, size, storage_id, visibility, status, uploaded_by, created_at, updated_at)
		VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'PRIVATE','ACTIVE',$9,$10,$11)`,
		m.ID, assetCode, m.OriginalName, m.FileName, m.MimeType,
		extensionOf(m.OriginalName), m.FileSize, storageID, m.UploadedBy, m.CreatedAt, time.Now())
	if err != nil {
		return err
	}

	if (m.EntityType != nil && *m.EntityType != "") && (m.EntityID != nil && *m.EntityID != uuid.Nil) {
		if _, err := tx.Exec(ctx, `
			INSERT INTO media.asset_reference (asset_id, module, entity, entity_id)
			VALUES ($1,$2,$2,$3)`, m.ID, *m.EntityType, *m.EntityID); err != nil {
			return err
		}
	}

	return tx.Commit(ctx)
}

func (r *Repository) FindByID(ctx context.Context, id uuid.UUID) (*Media, error) {
	return scanMedia(r.pool.QueryRow(ctx, `
		SELECT `+mediaColumns+`
		FROM media.asset a
		LEFT JOIN media.asset_storage st ON st.id = a.storage_id
		LEFT JOIN media.asset_reference ref ON ref.asset_id = a.id
		WHERE a.id = $1 AND a.deleted_at IS NULL`, id))
}

func (r *Repository) ListByEntity(ctx context.Context, entityType string, entityID uuid.UUID, limit, offset int) ([]Media, int, error) {
	var total int
	if err := r.pool.QueryRow(ctx, `
		SELECT COUNT(*) FROM media.asset_reference ref
		JOIN media.asset a ON a.id = ref.asset_id AND a.deleted_at IS NULL
		WHERE ref.module = $1 AND ref.entity_id = $2`, entityType, entityID).Scan(&total); err != nil {
		return nil, 0, err
	}

	rows, err := r.pool.Query(ctx, `
		SELECT `+mediaColumns+`
		FROM media.asset_reference ref
		JOIN media.asset a ON a.id = ref.asset_id AND a.deleted_at IS NULL
		LEFT JOIN media.asset_storage st ON st.id = a.storage_id
		WHERE ref.module = $1 AND ref.entity_id = $2
		ORDER BY a.created_at DESC LIMIT $3 OFFSET $4`, entityType, entityID, limit, offset)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	var media []Media
	for rows.Next() {
		m, err := scanMedia(rows)
		if err != nil {
			return nil, 0, err
		}
		media = append(media, *m)
	}
	return media, total, nil
}

func (r *Repository) ListAll(ctx context.Context, limit, offset int, mimeFilter string) ([]Media, int, error) {
	where := " WHERE a.deleted_at IS NULL"
	args := []interface{}{}
	argN := 1
	if mimeFilter != "" {
		where += fmt.Sprintf(" AND a.mime_type ILIKE $%d", argN)
		args = append(args, "%"+mimeFilter+"%")
		argN++
	}

	var total int
	if err := r.pool.QueryRow(ctx, `
		SELECT COUNT(DISTINCT a.id) FROM media.asset a
		LEFT JOIN media.asset_reference ref ON ref.asset_id = a.id`+where, args...).Scan(&total); err != nil {
		return nil, 0, err
	}

	rows, err := r.pool.Query(ctx, `
		SELECT `+mediaColumns+`
		FROM media.asset a
		LEFT JOIN media.asset_storage st ON st.id = a.storage_id
		LEFT JOIN LATERAL (
			SELECT module, entity_id FROM media.asset_reference
			WHERE asset_id = a.id
			ORDER BY created_at LIMIT 1
		) ref ON true
		`+where+` ORDER BY a.created_at DESC LIMIT $`+fmt.Sprint(argN)+` OFFSET $`+fmt.Sprint(argN+1),
		append(args, limit, offset)...)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	var media []Media
	for rows.Next() {
		m, err := scanMedia(rows)
		if err != nil {
			return nil, 0, err
		}
		media = append(media, *m)
	}
	return media, total, nil
}

func (r *Repository) Delete(ctx context.Context, id uuid.UUID, userID uuid.UUID, isAdmin bool) (bool, error) {
	var tag pgconn.CommandTag
	var err error
	if isAdmin {
		tag, err = r.pool.Exec(ctx, `
			UPDATE media.asset SET status = 'DELETED', deleted_at = NOW(), updated_at = NOW()
			WHERE id = $1 AND deleted_at IS NULL`, id)
	} else {
		tag, err = r.pool.Exec(ctx, `
			UPDATE media.asset SET status = 'DELETED', deleted_at = NOW(), updated_at = NOW()
			WHERE id = $1 AND deleted_at IS NULL AND uploaded_by = $2`, id, userID)
	}
	if err != nil {
		return false, err
	}
	return tag.RowsAffected() > 0, nil
}

func (r *Repository) GetStoragePath(ctx context.Context, id uuid.UUID) (*string, error) {
	var p string
	if err := r.pool.QueryRow(ctx, `
		SELECT COALESCE(st.storage_path, '')
		FROM media.asset a
		LEFT JOIN media.asset_storage st ON st.id = a.storage_id
		WHERE a.id = $1 AND a.deleted_at IS NULL`, id).Scan(&p); err != nil {
		return nil, err
	}
	if p == "" {
		return nil, pgx.ErrNoRows
	}
	return &p, nil
}

// ensureStorage lazily creates the default storage_provider and one
// asset_storage row holding this upload's storage_path/public_url.
func (r *Repository) ensureStorage(ctx context.Context, tx pgx.Tx, m *Media) (*uuid.UUID, error) {
	if m.StoragePath == "" {
		return nil, nil
	}
	var providerID uuid.UUID
	err := tx.QueryRow(ctx, `SELECT id FROM media.storage_provider WHERE code = 'SUPABASE'`).Scan(&providerID)
	if err == pgx.ErrNoRows {
		if err := tx.QueryRow(ctx, `
			INSERT INTO media.storage_provider (code, name, endpoint)
			VALUES ('SUPABASE', 'Supabase Storage', NULL) RETURNING id`).Scan(&providerID); err != nil {
			return nil, err
		}
	} else if err != nil {
		return nil, err
	}

	var storageID uuid.UUID
	if err := tx.QueryRow(ctx, `
		INSERT INTO media.asset_storage (provider_id, bucket, storage_path, public_url, status, created_at, updated_at)
		VALUES ($1, $2, $3, $4, 'ACTIVE', NOW(), NOW())
		RETURNING id`, providerID, m.Bucket, m.StoragePath, m.URL).Scan(&storageID); err != nil {
		return nil, err
	}
	return &storageID, nil
}

func extensionOf(name string) string {
	ext := strings.ToLower(path.Ext(name))
	return strings.TrimPrefix(ext, ".")
}

type Service struct {
	repo *Repository
	st   *storage.Client
}

func NewService(repo *Repository, st *storage.Client) *Service {
	return &Service{repo: repo, st: st}
}

func (s *Service) Create(ctx context.Context, m *Media) error {
	if m.Bucket == "" && s.st != nil {
		m.Bucket = s.st.GetBucket()
	}
	if m.Bucket == "" {
		m.Bucket = "uploads"
	}
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

func (s *Service) Delete(ctx context.Context, id uuid.UUID, userID uuid.UUID, isAdmin bool) error {
	var path *string
	p, err := s.repo.GetStoragePath(ctx, id)
	if err == pgx.ErrNoRows {
		// No storage path is fine (e.g. storage-less asset); the soft-delete
		// below still reports whether the asset row existed.
		path = nil
	} else if err != nil {
		return err
	} else {
		path = p
	}
	ok, err := s.repo.Delete(ctx, id, userID, isAdmin)
	if err != nil {
		return err
	}
	if !ok {
		return pgx.ErrNoRows
	}
	if s.st != nil && path != nil {
		_ = s.st.Delete(ctx, *path) // best-effort
	}
	return nil
}

func (s *Service) UploadFile(ctx context.Context, fileName string, reader io.Reader, size int64, contentType string) (string, string, error) {
	objectName := fmt.Sprintf("uploads/%s_%s", uuid.New().String(), fileName)
	if s.st != nil {
		url, err := s.st.Upload(ctx, objectName, reader, size, contentType)
		if err == nil {
			return objectName, url, nil
		}
		slog.Warn("Storage client upload failed, falling back to local disk storage", "error", err)
	}

	// Fallback to local disk storage in ./uploads/
	if err := os.MkdirAll("./uploads", 0755); err != nil {
		return "", "", fmt.Errorf("failed to create local uploads folder: %w", err)
	}
	filePath := path.Join("./uploads", path.Base(objectName))
	out, err := os.Create(filePath)
	if err != nil {
		return "", "", fmt.Errorf("failed to create local file: %w", err)
	}
	defer out.Close()

	if _, err := io.Copy(out, reader); err != nil {
		return "", "", fmt.Errorf("failed to write local file: %w", err)
	}

	publicURL := fmt.Sprintf("/uploads/%s", path.Base(objectName))
	return objectName, publicURL, nil
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
		slog.Error("Failed to upload file to storage", "error", err, "filename", file.Filename)
		return c.Status(500).JSON(shared.Error(shared.ErrInternal, "Failed to upload file to storage: "+err.Error()))
	}

	var uploadedBy *uuid.UUID
	if uid, ok := middleware.UserIDFromCtx(c); ok {
		uploadedBy = &uid
	}

	m := &Media{
		FileName:     file.Filename,
		OriginalName: file.Filename,
		MimeType:     file.Header.Get("Content-Type"),
		FileSize:     file.Size,
		StoragePath:  objectName,
		URL:          url,
		UploadedBy:   uploadedBy,
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
		slog.Error("Failed to save media metadata to database", "error", err, "filename", file.Filename)
		return c.Status(500).JSON(shared.Error(shared.ErrInternal, fmt.Sprintf("Failed to save media metadata: %v", err)))
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

	userIDStr, _ := c.Locals("user_id").(string)
	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		return c.Status(401).JSON(shared.Error(shared.ErrUnauthorized, "Not authenticated"))
	}
	role, _ := c.Locals("role").(string)
	isAdmin := middleware.HasAnyRole(role, "SUPER_ADMIN", "STAFF")

	if err := h.svc.Delete(c.Context(), id, userID, isAdmin); err != nil {
		if err == pgx.ErrNoRows {
			return c.Status(404).JSON(shared.Error(shared.ErrNotFound, "Media not found or not owned by you"))
		}
		return c.Status(500).JSON(shared.Error(shared.ErrInternal, "Failed to delete media"))
	}

	return c.SendStatus(http.StatusNoContent)
}

func uuidPtr(u uuid.UUID) *uuid.UUID {
	return &u
}
