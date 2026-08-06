package cms

import (
	"context"
	"encoding/json"
	"errors"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/jackc/pgx/v5/pgxpool"
)

type Repository struct {
	pool *pgxpool.Pool
}

func NewRepository(pool *pgxpool.Pool) *Repository { return &Repository{pool: pool} }

// isUniqueViolation reports whether err is a postgres UNIQUE constraint
// violation (SQLSTATE 23505), used to map slug/key conflicts to HTTP 409.
func isUniqueViolation(err error) bool {
	var pgErr *pgconn.PgError
	if errors.As(err, &pgErr) {
		return pgErr.Code == "23505"
	}
	return false
}

func errNoRows(err error) bool { return errors.Is(err, pgx.ErrNoRows) }

func coalesceBool(p *bool, def bool) bool {
	if p == nil {
		return def
	}
	return *p
}

// --- Pages ---

const pageCols = `id, slug, title, subtitle, description, page_type, template, status,
	visibility, cover_image, thumbnail, author_id, editor_id, published_at, created_at, updated_at`

func scanPage(row pgx.Row) (*Page, error) {
	var p Page
	err := row.Scan(&p.ID, &p.Slug, &p.Title, &p.Subtitle, &p.Description, &p.PageType,
		&p.Template, &p.Status, &p.Visibility, &p.CoverImage, &p.Thumbnail,
		&p.AuthorID, &p.EditorID, &p.PublishedAt, &p.CreatedAt, &p.UpdatedAt)
	if err != nil {
		return nil, err
	}
	return &p, nil
}

func (r *Repository) loadPageExtras(ctx context.Context, p *Page) error {
	blocks, err := r.loadPageBlocks(ctx, p.ID)
	if err != nil {
		return err
	}
	p.Blocks = blocks
	seo, err := r.loadPageSEO(ctx, p.ID)
	if err != nil && !errNoRows(err) {
		return err
	}
	if seo != nil && !errNoRows(err) {
		p.SEO = seo
	}
	return nil
}

func (r *Repository) loadPageBlocks(ctx context.Context, id uuid.UUID) ([]PageBlock, error) {
	rows, err := r.pool.Query(ctx, `SELECT id, page_id, component_type, component_name, sort_order, config, active, created_at, updated_at
		FROM cms.cms_page_block WHERE page_id=$1 ORDER BY sort_order`, id)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var out []PageBlock
	for rows.Next() {
		var b PageBlock
		if err := rows.Scan(&b.ID, &b.PageID, &b.ComponentType, &b.ComponentName, &b.SortOrder,
			&b.Config, &b.Active, &b.CreatedAt, &b.UpdatedAt); err != nil {
			return nil, err
		}
		out = append(out, b)
	}
	return out, rows.Err()
}

func (r *Repository) loadPageSEO(ctx context.Context, id uuid.UUID) (*PageSEO, error) {
	var s PageSEO
	err := r.pool.QueryRow(ctx, `SELECT id, page_id, meta_title, meta_description, meta_keyword,
		canonical_url, robots, og_title, og_description, og_image, schema_json, created_at, updated_at
		FROM cms.cms_page_seo WHERE page_id=$1`, id).
		Scan(&s.ID, &s.PageID, &s.MetaTitle, &s.MetaDescription, &s.MetaKeyword, &s.CanonicalURL,
			&s.Robots, &s.OgTitle, &s.OgDescription, &s.OgImage, &s.SchemaJSON, &s.CreatedAt, &s.UpdatedAt)
	if err != nil {
		return nil, err
	}
	return &s, nil
}

func (r *Repository) CreatePage(ctx context.Context, p *Page, blocks []SaveBlockReq) (*Page, error) {
	if p.Status == "" {
		p.Status = "DRAFT"
	}
	if p.Visibility == "" {
		p.Visibility = "PUBLIC"
	}
	if p.PageType == "" {
		p.PageType = "CUSTOM"
	}
	tx, err := r.pool.Begin(ctx)
	if err != nil {
		return nil, err
	}
	defer tx.Rollback(ctx)

	err = tx.QueryRow(ctx, `INSERT INTO cms.cms_page
		(slug, title, subtitle, description, page_type, template, status, visibility,
		 cover_image, thumbnail, author_id)
		VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
		RETURNING id, published_at, created_at, updated_at`,
		p.Slug, p.Title, p.Subtitle, p.Description, p.PageType, p.Template, p.Status,
		p.Visibility, p.CoverImage, p.Thumbnail, p.AuthorID,
	).Scan(&p.ID, &p.PublishedAt, &p.CreatedAt, &p.UpdatedAt)
	if err != nil {
		return nil, err
	}

	if len(blocks) > 0 {
		for _, b := range blocks {
			if _, err := tx.Exec(ctx, `INSERT INTO cms.cms_page_block
				(page_id, component_type, component_name, sort_order, config, active)
				VALUES ($1,$2,$3,$4,$5,$6)`,
				p.ID, b.ComponentType, b.ComponentName, b.SortOrder, b.Config, coalesceBool(b.Active, true)); err != nil {
				return nil, err
			}
		}
	}

	if err := tx.Commit(ctx); err != nil {
		return nil, err
	}
	return r.GetPageByID(ctx, p.ID, false)
}

func (r *Repository) GetPageByID(ctx context.Context, id uuid.UUID, _ bool) (*Page, error) {
	p, err := scanPage(r.pool.QueryRow(ctx,
		`SELECT `+pageCols+` FROM cms.cms_page WHERE id = $1 AND deleted_at IS NULL`, id))
	if err != nil {
		return nil, err
	}
	if err := r.loadPageExtras(ctx, p); err != nil {
		return nil, err
	}
	return p, nil
}

func (r *Repository) GetPageBySlug(ctx context.Context, slug string) (*Page, error) {
	p, err := scanPage(r.pool.QueryRow(ctx,
		`SELECT `+pageCols+` FROM cms.cms_page
		 WHERE slug=$1 AND deleted_at IS NULL AND status='PUBLISHED' AND visibility='PUBLIC'`, slug))
	if err != nil {
		return nil, err
	}
	if err := r.loadPageExtras(ctx, p); err != nil {
		return nil, err
	}
	return p, nil
}

func (r *Repository) ListPages(ctx context.Context, limit, offset int) ([]Page, int, error) {
	var total int
	if err := r.pool.QueryRow(ctx, `SELECT COUNT(*) FROM cms.cms_page WHERE deleted_at IS NULL`).Scan(&total); err != nil {
		return nil, 0, err
	}
	rows, err := r.pool.Query(ctx, `SELECT `+pageCols+` FROM cms.cms_page
		WHERE deleted_at IS NULL ORDER BY created_at DESC LIMIT $1 OFFSET $2`, limit, offset)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()
	var out []Page
	for rows.Next() {
		p, err := scanPage(rows)
		if err != nil {
			return nil, 0, err
		}
		out = append(out, *p)
	}
	return out, total, rows.Err()
}

// UpdatePage updates page metadata and blocks, and bumps the version history.
func (r *Repository) UpdatePage(ctx context.Context, p *Page, userID *uuid.UUID, blocks []SaveBlockReq, content *string) (*Page, error) {
	tx, err := r.pool.Begin(ctx)
	if err != nil {
		return nil, err
	}
	defer tx.Rollback(ctx)

	var nextVersion int
	if err := tx.QueryRow(ctx, `SELECT COALESCE(MAX(version),0)+1 FROM cms.cms_page_version WHERE page_id=$1`, p.ID).Scan(&nextVersion); err != nil {
		return nil, err
	}

	tag, err := tx.Exec(ctx, `UPDATE cms.cms_page SET
		slug=$1, title=$2, subtitle=$3, description=$4, page_type=$5, template=$6,
		visibility=$7, cover_image=$8, thumbnail=$9, editor_id=$10, updated_at=NOW()
		WHERE id=$11 AND deleted_at IS NULL`,
		p.Slug, p.Title, p.Subtitle, p.Description, p.PageType, p.Template,
		p.Visibility, p.CoverImage, p.Thumbnail, userID, p.ID)
	if err != nil {
		return nil, err
	}
	if tag.RowsAffected() == 0 {
		return nil, pgx.ErrNoRows
	}

	if _, err := tx.Exec(ctx, `INSERT INTO cms.cms_page_version
		(page_id, version, title, content, editor_id, published)
		VALUES ($1,$2,$3,$4,$5,false)`,
		p.ID, nextVersion, strPtr(p.Title), content, userID); err != nil {
		return nil, err
	}

	// replace blocks
	if _, err := tx.Exec(ctx, `DELETE FROM cms.cms_page_block WHERE page_id=$1`, p.ID); err != nil {
		return nil, err
	}
	for _, b := range blocks {
		if _, err := tx.Exec(ctx, `INSERT INTO cms.cms_page_block
			(page_id, component_type, component_name, sort_order, config, active)
			VALUES ($1,$2,$3,$4,$5,$6)`,
			p.ID, b.ComponentType, b.ComponentName, b.SortOrder, b.Config, coalesceBool(b.Active, true)); err != nil {
			return nil, err
		}
	}

	if err := tx.Commit(ctx); err != nil {
		return nil, err
	}
	return r.GetPageByID(ctx, p.ID, false)
}

func (r *Repository) CreatePageVersion(ctx context.Context, pageID uuid.UUID, editorID *uuid.UUID, title, content *string) (int, error) {
	var version int
	err := r.pool.QueryRow(ctx,
		`INSERT INTO cms.cms_page_version (page_id, version, title, content, editor_id, published)
		 SELECT $1, COALESCE(MAX(version),0)+1, $2, $3, $4, false FROM cms.cms_page_version WHERE page_id=$1
		 RETURNING version`,
		pageID, title, content, editorID).Scan(&version)
	return version, err
}

func (r *Repository) ListPageVersions(ctx context.Context, pageID uuid.UUID) ([]PageVersion, error) {
	rows, err := r.pool.Query(ctx, `SELECT id, page_id, version, title, content, editor_id, published, created_at
		FROM cms.cms_page_version WHERE page_id=$1 ORDER BY version DESC`, pageID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var out []PageVersion
	for rows.Next() {
		var v PageVersion
		if err := rows.Scan(&v.ID, &v.PageID, &v.Version, &v.Title, &v.Content, &v.EditorID, &v.Published, &v.CreatedAt); err != nil {
			return nil, err
		}
		out = append(out, v)
	}
	return out, rows.Err()
}

func (r *Repository) PublishPage(ctx context.Context, pageID uuid.UUID, userID uuid.UUID) error {
	tx, err := r.pool.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)

	if _, err := tx.Exec(ctx, `UPDATE cms.cms_page
		SET status='PUBLISHED', published_at=NOW(), editor_id=$2, updated_at=NOW()
		WHERE id=$1 AND deleted_at IS NULL`, pageID, userID); err != nil {
		return err
	}

	tag, err := tx.Exec(ctx, `UPDATE cms.cms_page_publish
		SET status='PUBLISHED', approved_by=$2, approved_at=NOW(), published_at=NOW(), updated_at=NOW()
		WHERE page_id=$1`, pageID, userID)
	if err != nil {
		return err
	}
	if tag.RowsAffected() == 0 {
		if _, err := tx.Exec(ctx, `INSERT INTO cms.cms_page_publish
			(page_id, status, approved_by, approved_at, published_at)
			VALUES ($1,'PUBLISHED',$2,NOW(),NOW())`, pageID, userID); err != nil {
			return err
		}
	}
	return tx.Commit(ctx)
}

func (r *Repository) SetPageReview(ctx context.Context, pageID uuid.UUID, userID uuid.UUID, status string) error {
	_, err := r.pool.Exec(ctx, `UPDATE cms.cms_page SET status=$2, editor_id=$3, updated_at=NOW()
		WHERE id=$1 AND deleted_at IS NULL`, pageID, status, userID)
	return err
}

func (r *Repository) SoftDeletePage(ctx context.Context, id uuid.UUID) error {
	tag, err := r.pool.Exec(ctx, `UPDATE cms.cms_page SET deleted_at=NOW(), updated_at=NOW() WHERE id=$1 AND deleted_at IS NULL`, id)
	if err != nil {
		return err
	}
	if tag.RowsAffected() == 0 {
		return pgx.ErrNoRows
	}
	return nil
}

func (r *Repository) UpsertPageSEO(ctx context.Context, pageID uuid.UUID, req SaveSEORequest) (*PageSEO, error) {
	var s PageSEO
	err := r.pool.QueryRow(ctx, `INSERT INTO cms.cms_page_seo
		(page_id, meta_title, meta_description, meta_keyword, canonical_url, robots, og_title, og_description, og_image, schema_json)
		VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
		ON CONFLICT (page_id) DO UPDATE SET
			meta_title=$2, meta_description=$3, meta_keyword=$4, canonical_url=$5, robots=$6,
			og_title=$7, og_description=$8, og_image=$9, schema_json=$10, updated_at=NOW()
		RETURNING id, page_id, meta_title, meta_description, meta_keyword, canonical_url, robots,
			og_title, og_description, og_image, schema_json, created_at, updated_at`,
		pageID, req.MetaTitle, req.MetaDescription, req.MetaKeyword, req.CanonicalURL, req.Robots,
		req.OgTitle, req.OgDescription, req.OgImage, normalizeJSON(req.SchemaJSON),
	).Scan(&s.ID, &s.PageID, &s.MetaTitle, &s.MetaDescription, &s.MetaKeyword, &s.CanonicalURL,
		&s.Robots, &s.OgTitle, &s.OgDescription, &s.OgImage, &s.SchemaJSON, &s.CreatedAt, &s.UpdatedAt)
	if err != nil {
		return nil, err
	}
	return &s, nil
}

func normalizeJSON(raw json.RawMessage) json.RawMessage {
	if len(raw) == 0 {
		return nil
	}
	return raw
}

func userOrNil(uid string) *uuid.UUID {
	if uid == "" {
		return nil
	}
	id, err := uuid.Parse(uid)
	if err != nil {
		return nil
	}
	return &id
}

func strPtr(s string) *string {
	if s == "" {
		return nil
	}
	return &s
}

// --- Posts ---

const postCols = `id, slug, title, excerpt, content, cover_image, category_id, author_id,
	status, published_at, reading_time, view_count, like_count, share_count, created_at, updated_at`

func scanPost(row pgx.Row) (*Post, error) {
	var p Post
	err := row.Scan(&p.ID, &p.Slug, &p.Title, &p.Excerpt, &p.Content, &p.CoverImage,
		&p.CategoryID, &p.AuthorID, &p.Status, &p.PublishedAt, &p.ReadingTime,
		&p.ViewCount, &p.LikeCount, &p.ShareCount, &p.CreatedAt, &p.UpdatedAt)
	if err != nil {
		return nil, err
	}
	return &p, nil
}

func (r *Repository) CreatePost(ctx context.Context, p *Post, tagIDs []uuid.UUID) (*Post, error) {
	tx, err := r.pool.Begin(ctx)
	if err != nil {
		return nil, err
	}
	defer tx.Rollback(ctx)

	err = tx.QueryRow(ctx, `INSERT INTO cms.cms_post
		(slug, title, excerpt, content, cover_image, category_id, author_id, status, published_at, reading_time)
		VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
		RETURNING id, view_count, like_count, share_count, created_at, updated_at`,
		p.Slug, p.Title, p.Excerpt, p.Content, p.CoverImage, p.CategoryID, p.AuthorID,
		p.Status, p.PublishedAt, p.ReadingTime,
	).Scan(&p.ID, &p.ViewCount, &p.LikeCount, &p.ShareCount, &p.CreatedAt, &p.UpdatedAt)
	if err != nil {
		return nil, err
	}

	if err := r.replacePostTags(ctx, tx, p.ID, tagIDs); err != nil {
		return nil, err
	}

	if err := tx.Commit(ctx); err != nil {
		return nil, err
	}
	return r.GetPostByID(ctx, p.ID)
}

func (r *Repository) GetPostByID(ctx context.Context, id uuid.UUID) (*Post, error) {
	p, err := scanPost(r.pool.QueryRow(ctx,
		`SELECT `+postCols+` FROM cms.cms_post WHERE id = $1 AND deleted_at IS NULL`, id))
	if err != nil {
		return nil, err
	}
	if err := r.loadPostExtras(ctx, p); err != nil {
		return nil, err
	}
	return p, nil
}

func (r *Repository) GetPostBySlug(ctx context.Context, slug string) (*Post, error) {
	p, err := scanPost(r.pool.QueryRow(ctx,
		`SELECT `+postCols+` FROM cms.cms_post WHERE slug=$1 AND deleted_at IS NULL AND status='PUBLISHED'`, slug))
	if err != nil {
		return nil, err
	}
	if err := r.loadPostExtras(ctx, p); err != nil {
		return nil, err
	}
	return p, nil
}

func (r *Repository) ListPosts(ctx context.Context, limit, offset int) ([]Post, int, error) {
	var total int
	if err := r.pool.QueryRow(ctx, `SELECT COUNT(*) FROM cms.cms_post WHERE deleted_at IS NULL`).Scan(&total); err != nil {
		return nil, 0, err
	}
	rows, err := r.pool.Query(ctx, `SELECT `+postCols+` FROM cms.cms_post
		WHERE deleted_at IS NULL ORDER BY created_at DESC LIMIT $1 OFFSET $2`, limit, offset)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()
	var out []Post
	for rows.Next() {
		p, err := scanPost(rows)
		if err != nil {
			return nil, 0, err
		}
		out = append(out, *p)
	}
	return out, total, rows.Err()
}

func (r *Repository) UpdatePost(ctx context.Context, p *Post, userID *uuid.UUID, tagIDs []uuid.UUID) (*Post, error) {
	tx, err := r.pool.Begin(ctx)
	if err != nil {
		return nil, err
	}
	defer tx.Rollback(ctx)

	var nextVersion int
	if err := tx.QueryRow(ctx, `SELECT COALESCE(MAX(version),0)+1 FROM cms.cms_post_version WHERE post_id=$1`, p.ID).Scan(&nextVersion); err != nil {
		return nil, err
	}

	tag, err := tx.Exec(ctx, `UPDATE cms.cms_post SET
		slug=$1, title=$2, excerpt=$3, content=$4, cover_image=$5, category_id=$6,
		status=$7, reading_time=$8, updated_at=NOW()
		WHERE id=$9 AND deleted_at IS NULL`,
		p.Slug, p.Title, p.Excerpt, p.Content, p.CoverImage, p.CategoryID, p.Status, p.ReadingTime, p.ID)
	if err != nil {
		return nil, err
	}
	if tag.RowsAffected() == 0 {
		return nil, pgx.ErrNoRows
	}

	if _, err := tx.Exec(ctx, `INSERT INTO cms.cms_post_version (post_id, version, content, editor_id)
		VALUES ($1,$2,$3,$4)`, p.ID, nextVersion, p.Content, userID); err != nil {
		return nil, err
	}

	if err := r.replacePostTags(ctx, tx, p.ID, tagIDs); err != nil {
		return nil, err
	}

	if err := tx.Commit(ctx); err != nil {
		return nil, err
	}
	return r.GetPostByID(ctx, p.ID)
}

func (r *Repository) replacePostTags(ctx context.Context, tx pgx.Tx, postID uuid.UUID, tagIDs []uuid.UUID) error {
	if _, err := tx.Exec(ctx, `DELETE FROM cms.cms_post_tag WHERE post_id=$1`, postID); err != nil {
		return err
	}
	for _, tid := range tagIDs {
		if _, err := tx.Exec(ctx, `INSERT INTO cms.cms_post_tag (post_id, tag_id) VALUES ($1,$2)`, postID, tid); err != nil {
			return err
		}
	}
	return nil
}

func (r *Repository) PublishPost(ctx context.Context, id uuid.UUID, userID uuid.UUID) error {
	tag, err := r.pool.Exec(ctx, `UPDATE cms.cms_post
		SET status='PUBLISHED', published_at=NOW(), updated_at=NOW()
		WHERE id=$1 AND deleted_at IS NULL`, id)
	if err != nil {
		return err
	}
	if tag.RowsAffected() == 0 {
		return pgx.ErrNoRows
	}
	return nil
}

func (r *Repository) SoftDeletePost(ctx context.Context, id uuid.UUID) error {
	tag, err := r.pool.Exec(ctx, `UPDATE cms.cms_post SET deleted_at=NOW(), updated_at=NOW() WHERE id=$1 AND deleted_at IS NULL`, id)
	if err != nil {
		return err
	}
	if tag.RowsAffected() == 0 {
		return pgx.ErrNoRows
	}
	return nil
}

func (r *Repository) loadPostExtras(ctx context.Context, p *Post) error {
	if p.CategoryID != nil {
		cat, err := r.GetCategoryByID(ctx, *p.CategoryID)
		if err == nil {
			p.Category = cat
		}
	}
	tags, err := r.loadPostTags(ctx, p.ID)
	if err != nil {
		return err
	}
	p.Tags = tags
	return nil
}

func (r *Repository) loadPostTags(ctx context.Context, postID uuid.UUID) ([]Tag, error) {
	rows, err := r.pool.Query(ctx, `SELECT t.id, t.name, t.slug, t.color, t.created_at
		FROM cms.cms_tag t JOIN cms.cms_post_tag pt ON pt.tag_id=t.id WHERE pt.post_id=$1 ORDER BY t.name`, postID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var out []Tag
	for rows.Next() {
		var t Tag
		if err := rows.Scan(&t.ID, &t.Name, &t.Slug, &t.Color, &t.CreatedAt); err != nil {
			return nil, err
		}
		out = append(out, t)
	}
	return out, rows.Err()
}

// --- Categories ---

const categoryCols = `id, parent_id, name, slug, description, icon, sort_order, active, created_at, updated_at`

func scanCategory(row pgx.Row) (*Category, error) {
	var c Category
	err := row.Scan(&c.ID, &c.ParentID, &c.Name, &c.Slug, &c.Description, &c.Icon,
		&c.SortOrder, &c.Active, &c.CreatedAt, &c.UpdatedAt)
	if err != nil {
		return nil, err
	}
	return &c, nil
}

func (r *Repository) CreateCategory(ctx context.Context, c *Category) (*Category, error) {
	err := r.pool.QueryRow(ctx, `INSERT INTO cms.cms_category
		(parent_id, name, slug, description, icon, sort_order, active)
		VALUES ($1,$2,$3,$4,$5,$6,$7)
		RETURNING id, created_at, updated_at`,
		c.ParentID, c.Name, c.Slug, c.Description, c.Icon, c.SortOrder, c.Active,
	).Scan(&c.ID, &c.CreatedAt, &c.UpdatedAt)
	if err != nil {
		return nil, err
	}
	return r.GetCategoryByID(ctx, c.ID)
}

func (r *Repository) GetCategoryByID(ctx context.Context, id uuid.UUID) (*Category, error) {
	return scanCategory(r.pool.QueryRow(ctx, `SELECT `+categoryCols+` FROM cms.cms_category WHERE id=$1`, id))
}

func (r *Repository) ListCategories(ctx context.Context) ([]Category, error) {
	rows, err := r.pool.Query(ctx, `SELECT `+categoryCols+` FROM cms.cms_category ORDER BY sort_order, name`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var out []Category
	for rows.Next() {
		c, err := scanCategory(rows)
		if err != nil {
			return nil, err
		}
		out = append(out, *c)
	}
	return out, rows.Err()
}

func (r *Repository) UpdateCategory(ctx context.Context, c *Category) (*Category, error) {
	tag, err := r.pool.Exec(ctx, `UPDATE cms.cms_category SET
		parent_id=$1, name=$2, slug=$3, description=$4, icon=$5, sort_order=$6, active=$7, updated_at=NOW()
		WHERE id=$8`,
		c.ParentID, c.Name, c.Slug, c.Description, c.Icon, c.SortOrder, c.Active, c.ID)
	if err != nil {
		return nil, err
	}
	if tag.RowsAffected() == 0 {
		return nil, pgx.ErrNoRows
	}
	return r.GetCategoryByID(ctx, c.ID)
}

func (r *Repository) DeleteCategory(ctx context.Context, id uuid.UUID) error {
	tag, err := r.pool.Exec(ctx, `DELETE FROM cms.cms_category WHERE id=$1`, id)
	if err != nil {
		return err
	}
	if tag.RowsAffected() == 0 {
		return pgx.ErrNoRows
	}
	return nil
}

// --- Tags ---

const tagCols = `id, name, slug, color, created_at`

func scanTag(row pgx.Row) (*Tag, error) {
	var t Tag
	err := row.Scan(&t.ID, &t.Name, &t.Slug, &t.Color, &t.CreatedAt)
	if err != nil {
		return nil, err
	}
	return &t, nil
}

func (r *Repository) CreateTag(ctx context.Context, t *Tag) (*Tag, error) {
	err := r.pool.QueryRow(ctx, `INSERT INTO cms.cms_tag (name, slug, color)
		VALUES ($1,$2,$3) RETURNING id, created_at`, t.Name, t.Slug, t.Color).Scan(&t.ID, &t.CreatedAt)
	if err != nil {
		return nil, err
	}
	return r.GetTagByID(ctx, t.ID)
}

func (r *Repository) GetTagByID(ctx context.Context, id uuid.UUID) (*Tag, error) {
	return scanTag(r.pool.QueryRow(ctx, `SELECT `+tagCols+` FROM cms.cms_tag WHERE id=$1`, id))
}

func (r *Repository) ListTags(ctx context.Context) ([]Tag, error) {
	rows, err := r.pool.Query(ctx, `SELECT `+tagCols+` FROM cms.cms_tag ORDER BY name`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var out []Tag
	for rows.Next() {
		t, err := scanTag(rows)
		if err != nil {
			return nil, err
		}
		out = append(out, *t)
	}
	return out, rows.Err()
}

func (r *Repository) UpdateTag(ctx context.Context, t *Tag) (*Tag, error) {
	tag, err := r.pool.Exec(ctx, `UPDATE cms.cms_tag SET name=$1, slug=$2, color=$3 WHERE id=$4`,
		t.Name, t.Slug, t.Color, t.ID)
	if err != nil {
		return nil, err
	}
	if tag.RowsAffected() == 0 {
		return nil, pgx.ErrNoRows
	}
	return r.GetTagByID(ctx, t.ID)
}

func (r *Repository) DeleteTag(ctx context.Context, id uuid.UUID) error {
	tag, err := r.pool.Exec(ctx, `DELETE FROM cms.cms_tag WHERE id=$1`, id)
	if err != nil {
		return err
	}
	if tag.RowsAffected() == 0 {
		return pgx.ErrNoRows
	}
	return nil
}

// --- Settings ---

const settingCols = `id, setting_key, setting_value, description, created_at, updated_at`

func scanSetting(row pgx.Row) (*Setting, error) {
	var s Setting
	err := row.Scan(&s.ID, &s.Key, &s.Value, &s.Description, &s.CreatedAt, &s.UpdatedAt)
	if err != nil {
		return nil, err
	}
	return &s, nil
}

func (r *Repository) GetSetting(ctx context.Context, key string) (*Setting, error) {
	return scanSetting(r.pool.QueryRow(ctx, `SELECT `+settingCols+` FROM cms.cms_setting WHERE setting_key=$1`, key))
}

func (r *Repository) ListSettings(ctx context.Context) ([]Setting, error) {
	rows, err := r.pool.Query(ctx, `SELECT `+settingCols+` FROM cms.cms_setting ORDER BY setting_key`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var out []Setting
	for rows.Next() {
		s, err := scanSetting(rows)
		if err != nil {
			return nil, err
		}
		out = append(out, *s)
	}
	return out, rows.Err()
}

func (r *Repository) UpsertSetting(ctx context.Context, key string, req SaveSettingRequest) (*Setting, error) {
	var s Setting
	err := r.pool.QueryRow(ctx, `INSERT INTO cms.cms_setting (setting_key, setting_value, description)
		VALUES ($1,$2,$3)
		ON CONFLICT (setting_key) DO UPDATE SET setting_value=$2, description=$3, updated_at=NOW()
		RETURNING id, setting_key, setting_value, description, created_at, updated_at`,
		key, req.Value, req.Description,
	).Scan(&s.ID, &s.Key, &s.Value, &s.Description, &s.CreatedAt, &s.UpdatedAt)
	if err != nil {
		return nil, err
	}
	return &s, nil
}

// --- FAQs ---

const faqCols = `id, category, question, answer, sort_order, active, created_at, updated_at`

func scanFAQ(row pgx.Row) (*FAQ, error) {
	var f FAQ
	err := row.Scan(&f.ID, &f.Category, &f.Question, &f.Answer, &f.SortOrder, &f.Active, &f.CreatedAt, &f.UpdatedAt)
	if err != nil {
		return nil, err
	}
	return &f, nil
}

func (r *Repository) CreateFAQ(ctx context.Context, f *FAQ) (*FAQ, error) {
	err := r.pool.QueryRow(ctx, `INSERT INTO cms.cms_faq (category, question, answer, sort_order, active)
		VALUES ($1,$2,$3,$4,$5) RETURNING id, created_at, updated_at`,
		f.Category, f.Question, f.Answer, f.SortOrder, f.Active,
	).Scan(&f.ID, &f.CreatedAt, &f.UpdatedAt)
	if err != nil {
		return nil, err
	}
	return f, nil
}

func (r *Repository) GetFAQ(ctx context.Context, id uuid.UUID) (*FAQ, error) {
	return scanFAQ(r.pool.QueryRow(ctx, `SELECT `+faqCols+` FROM cms.cms_faq WHERE id=$1`, id))
}

func (r *Repository) ListFAQs(ctx context.Context, activeOnly bool) ([]FAQ, error) {
	q := `SELECT ` + faqCols + ` FROM cms.cms_faq`
	if activeOnly {
		q += ` WHERE active = true`
	}
	q += ` ORDER BY sort_order, question`
	rows, err := r.pool.Query(ctx, q)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var out []FAQ
	for rows.Next() {
		f, err := scanFAQ(rows)
		if err != nil {
			return nil, err
		}
		out = append(out, *f)
	}
	return out, rows.Err()
}

func (r *Repository) UpdateFAQ(ctx context.Context, f *FAQ) (*FAQ, error) {
	tag, err := r.pool.Exec(ctx, `UPDATE cms.cms_faq SET category=$1, question=$2, answer=$3, sort_order=$4, active=$5, updated_at=NOW() WHERE id=$6`,
		f.Category, f.Question, f.Answer, f.SortOrder, f.Active, f.ID)
	if err != nil {
		return nil, err
	}
	if tag.RowsAffected() == 0 {
		return nil, pgx.ErrNoRows
	}
	return f, nil
}

func (r *Repository) DeleteFAQ(ctx context.Context, id uuid.UUID) error {
	tag, err := r.pool.Exec(ctx, `DELETE FROM cms.cms_faq WHERE id=$1`, id)
	if err != nil {
		return err
	}
	if tag.RowsAffected() == 0 {
		return pgx.ErrNoRows
	}
	return nil
}

// --- Banners ---

const bannerCols = `id, title, subtitle, image, mobile_image, button_text, button_link, position, priority, start_date, end_date, status, created_at, updated_at`

func scanBanner(row pgx.Row) (*Banner, error) {
	var b Banner
	err := row.Scan(&b.ID, &b.Title, &b.Subtitle, &b.Image, &b.MobileImage, &b.ButtonText,
		&b.ButtonLink, &b.Position, &b.Priority, &b.StartDate, &b.EndDate, &b.Status, &b.CreatedAt, &b.UpdatedAt)
	if err != nil {
		return nil, err
	}
	return &b, nil
}

func (r *Repository) CreateBanner(ctx context.Context, b *Banner) (*Banner, error) {
	err := r.pool.QueryRow(ctx, `INSERT INTO cms.cms_banner
		(title, subtitle, image, mobile_image, button_text, button_link, position, priority, start_date, end_date, status)
		VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
		RETURNING id, created_at, updated_at`,
		b.Title, b.Subtitle, b.Image, b.MobileImage, b.ButtonText, b.ButtonLink,
		b.Position, b.Priority, b.StartDate, b.EndDate, b.Status,
	).Scan(&b.ID, &b.CreatedAt, &b.UpdatedAt)
	if err != nil {
		return nil, err
	}
	return r.GetBannerByID(ctx, b.ID)
}

func (r *Repository) GetBannerByID(ctx context.Context, id uuid.UUID) (*Banner, error) {
	return scanBanner(r.pool.QueryRow(ctx, `SELECT `+bannerCols+` FROM cms.cms_banner WHERE id=$1`, id))
}

func (r *Repository) ListBanners(ctx context.Context, activeOnly bool) ([]Banner, error) {
	q := `SELECT ` + bannerCols + ` FROM cms.cms_banner`
	if activeOnly {
		q += ` WHERE status='ACTIVE'`
	}
	q += ` ORDER BY priority, position`
	rows, err := r.pool.Query(ctx, q)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var out []Banner
	for rows.Next() {
		b, err := scanBanner(rows)
		if err != nil {
			return nil, err
		}
		out = append(out, *b)
	}
	return out, rows.Err()
}

func (r *Repository) UpdateBanner(ctx context.Context, b *Banner) (*Banner, error) {
	tag, err := r.pool.Exec(ctx, `UPDATE cms.cms_banner SET
		title=$1, subtitle=$2, image=$3, mobile_image=$4, button_text=$5, button_link=$6,
		position=$7, priority=$8, start_date=$9, end_date=$10, status=$11, updated_at=NOW() WHERE id=$12`,
		b.Title, b.Subtitle, b.Image, b.MobileImage, b.ButtonText, b.ButtonLink,
		b.Position, b.Priority, b.StartDate, b.EndDate, b.Status, b.ID)
	if err != nil {
		return nil, err
	}
	if tag.RowsAffected() == 0 {
		return nil, pgx.ErrNoRows
	}
	return r.GetBannerByID(ctx, b.ID)
}

func (r *Repository) DeleteBanner(ctx context.Context, id uuid.UUID) error {
	tag, err := r.pool.Exec(ctx, `DELETE FROM cms.cms_banner WHERE id=$1`, id)
	if err != nil {
		return err
	}
	if tag.RowsAffected() == 0 {
		return pgx.ErrNoRows
	}
	return nil
}

// --- News ---

const newsCols = `id, title, slug, content, cover, category, status, published_at, created_at, updated_at`

func scanNews(row pgx.Row) (*News, error) {
	var n News
	err := row.Scan(&n.ID, &n.Title, &n.Slug, &n.Content, &n.Cover, &n.Category, &n.Status,
		&n.PublishedAt, &n.CreatedAt, &n.UpdatedAt)
	if err != nil {
		return nil, err
	}
	return &n, nil
}

func (r *Repository) CreateNews(ctx context.Context, n *News) (*News, error) {
	err := r.pool.QueryRow(ctx, `INSERT INTO cms.cms_news (title, slug, content, cover, category, status, published_at)
		VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id, created_at, updated_at`,
		n.Title, n.Slug, n.Content, n.Cover, n.Category, n.Status, n.PublishedAt,
	).Scan(&n.ID, &n.CreatedAt, &n.UpdatedAt)
	if err != nil {
		return nil, err
	}
	return r.GetNewsByID(ctx, n.ID)
}

func (r *Repository) GetNewsByID(ctx context.Context, id uuid.UUID) (*News, error) {
	return scanNews(r.pool.QueryRow(ctx, `SELECT `+newsCols+` FROM cms.cms_news WHERE id=$1`, id))
}

func (r *Repository) ListNews(ctx context.Context, publishedOnly bool) ([]News, error) {
	q := `SELECT ` + newsCols + ` FROM cms.cms_news`
	if publishedOnly {
		q += ` WHERE status='PUBLISHED'`
	}
	q += ` ORDER BY published_at DESC`
	rows, err := r.pool.Query(ctx, q)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var out []News
	for rows.Next() {
		n, err := scanNews(rows)
		if err != nil {
			return nil, err
		}
		out = append(out, *n)
	}
	return out, rows.Err()
}

func (r *Repository) UpdateNews(ctx context.Context, n *News) (*News, error) {
	tag, err := r.pool.Exec(ctx, `UPDATE cms.cms_news SET title=$1, slug=$2, content=$3, cover=$4, category=$5, status=$6, published_at=$7
		WHERE id=$8`, n.Title, n.Slug, n.Content, n.Cover, n.Category, n.Status, n.PublishedAt, n.ID)
	if err != nil {
		return nil, err
	}
	if tag.RowsAffected() == 0 {
		return nil, pgx.ErrNoRows
	}
	return r.GetNewsByID(ctx, n.ID)
}

func (r *Repository) PublishNews(ctx context.Context, id uuid.UUID) error {
	tag, err := r.pool.Exec(ctx, `UPDATE cms.cms_news SET status='PUBLISHED', published_at=NOW(), updated_at=NOW() WHERE id=$1`, id)
	if err != nil {
		return err
	}
	if tag.RowsAffected() == 0 {
		return pgx.ErrNoRows
	}
	return nil
}

func (r *Repository) DeleteNews(ctx context.Context, id uuid.UUID) error {
	tag, err := r.pool.Exec(ctx, `DELETE FROM cms.cms_news WHERE id=$1`, id)
	if err != nil {
		return err
	}
	if tag.RowsAffected() == 0 {
		return pgx.ErrNoRows
	}
	return nil
}