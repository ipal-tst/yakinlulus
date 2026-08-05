package content

import (
	"context"
	"encoding/json"
	"fmt"
	"regexp"
	"strconv"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/jackc/pgx/v5/pgxpool"
)

type repository struct {
	pool *pgxpool.Pool
}

func NewRepository(pool *pgxpool.Pool) Repository {
	return &repository{pool: pool}
}

// ========== BASE CONTENT ==========

func (r *repository) CreateContent(ctx context.Context, c *Content) error {
	if c.ID == uuid.Nil {
		c.ID = uuid.New()
	}
	c.CreatedAt = time.Now()
	c.UpdatedAt = time.Now()
	if c.Status == "" {
		c.Status = StatusDraft
	}
	if c.Metadata == nil {
		c.Metadata = map[string]interface{}{}
	}

	// MATERIAL masters live in content.material (new schema). Everything else
	// (question/exam) stays on the legacy `contents` insert until subphase 2.4.
	if c.ContentType == ContentTypeMaterial {
		return r.createMaterialContent(ctx, c)
	}

	if c.SubjectID == uuid.Nil {
		_ = r.pool.QueryRow(ctx, "SELECT id FROM subjects LIMIT 1").Scan(&c.SubjectID)
	}

	if c.GradeID == uuid.Nil {
		var gID *uuid.UUID
		_ = r.pool.QueryRow(ctx, "SELECT grade_id FROM subjects WHERE id = $1 AND grade_id IS NOT NULL", c.SubjectID).Scan(&gID)
		if gID != nil && *gID != uuid.Nil {
			c.GradeID = *gID
		} else {
			_ = r.pool.QueryRow(ctx, "SELECT id FROM grades ORDER BY created_at ASC LIMIT 1").Scan(&c.GradeID)
		}
	}

	_, err := r.pool.Exec(ctx, `
		INSERT INTO contents (id, content_type, grade_id, subject_id, chapter_id, topic_id, lo_id, title, body, status, created_by, metadata, created_at, updated_at)
		VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
	`, c.ID, c.ContentType, c.GradeID, c.SubjectID, c.ChapterID, c.TopicID, c.LOID, c.Title, c.Body, c.Status, c.CreatedBy, c.Metadata, c.CreatedAt, c.UpdatedAt)
	return err
}

// ========== MATERIAL SCHEMA HELPERS (content.material) ==========

const materialStatusCodes = `('DRAFT','Draft'),('REVIEW','In Review'),('APPROVED','Approved'),('PUBLISHED','Published'),('ARCHIVED','Archived')`

func (r *repository) ensureMaterialStatuses(ctx context.Context, tx pgx.Tx) (map[string]uuid.UUID, error) {
	statuses := map[string]uuid.UUID{}
	if _, err := tx.Exec(ctx, `
		INSERT INTO content.material_status (code, name) VALUES `+materialStatusCodes+`
		ON CONFLICT (code) DO NOTHING`); err != nil {
		return nil, err
	}
	rws, err := tx.Query(ctx, `SELECT code, id FROM content.material_status WHERE code = ANY($1)`,
		[]string{"DRAFT", "REVIEW", "APPROVED", "PUBLISHED", "ARCHIVED"})
	if err != nil {
		return nil, err
	}
	defer rws.Close()
	for rws.Next() {
		var code string
		var id uuid.UUID
		if err := rws.Scan(&code, &id); err != nil {
			return nil, err
		}
		statuses[code] = id
	}
	return statuses, rws.Err()
}

func (r *repository) ensureMaterialTypes(ctx context.Context, tx pgx.Tx) (map[string]uuid.UUID, error) {
	rows := []string{"TEXT", "RICH_TEXT", "MARKDOWN", "VIDEO", "PDF", "AUDIO", "INTERACTIVE"}
	for _, c := range rows {
		if _, err := tx.Exec(ctx, `
			INSERT INTO content.material_type (code, name) VALUES ($1, $2)
			ON CONFLICT (code) DO NOTHING`, c, c); err != nil {
			return nil, err
		}
	}
	types := map[string]uuid.UUID{}
	rws, err := tx.Query(ctx, `SELECT code, id FROM content.material_type WHERE code = ANY($1)`, rows)
	if err != nil {
		return nil, err
	}
	defer rws.Close()
	for rws.Next() {
		var code string
		var id uuid.UUID
		if err := rws.Scan(&code, &id); err != nil {
			return nil, err
		}
		types[code] = id
	}
	return types, rws.Err()
}

// linkMaterialJunction inserts an N:M row only when the referenced academic
// row exists, so an empty academic catalog degrades gracefully.
func (r *repository) linkMaterialJunction(ctx context.Context, tx pgx.Tx, junction, refTable, refCol string, materialID, refID uuid.UUID) error {
	if refID == uuid.Nil {
		return nil
	}
	var exists bool
	if err := tx.QueryRow(ctx, `SELECT EXISTS (SELECT 1 FROM `+refTable+` WHERE id = $1)`, refID).Scan(&exists); err != nil {
		return err
	}
	if !exists {
		return nil
	}
	_, err := tx.Exec(ctx, `INSERT INTO content.`+junction+` (material_id, `+refCol+`) VALUES ($1, $2)`, materialID, refID)
	return err
}

func (r *repository) insertMaterialJunctions(ctx context.Context, tx pgx.Tx, materialID uuid.UUID, c *Content) error {
	link := func(junction, refTable, refCol string, refID uuid.UUID) error {
		return r.linkMaterialJunction(ctx, tx, junction, refTable, refCol, materialID, refID)
	}
	if err := link("material_subject", "academic.subject", "subject_id", c.SubjectID); err != nil {
		return err
	}
	if err := link("material_grade", "academic.grade", "grade_id", c.GradeID); err != nil {
		return err
	}
	if c.ChapterID != nil {
		if err := link("material_chapter", "academic.chapter", "chapter_id", *c.ChapterID); err != nil {
			return err
		}
	}
	if c.TopicID != nil {
		if err := link("material_topic", "academic.topic", "topic_id", *c.TopicID); err != nil {
			return err
		}
	}
	return nil
}

func (r *repository) clearMaterialJunctions(ctx context.Context, tx pgx.Tx, materialID uuid.UUID) error {
	for _, t := range []string{"material_subject", "material_grade", "material_chapter", "material_topic"} {
		if _, err := tx.Exec(ctx, `DELETE FROM content.`+t+` WHERE material_id = $1`, materialID); err != nil {
			return err
		}
	}
	return nil
}

func materialSlug(title string) string {
	s := strings.ToLower(strings.TrimSpace(title))
	if s == "" {
		return "material"
	}
	re := regexp.MustCompile(`[^a-z0-9]+`)
	s = re.ReplaceAllString(s, "-")
	s = strings.Trim(s, "-")
	if s == "" {
		return "material"
	}
	return s
}

// createMaterialContent creates the content.material master plus its first
// version, body block and academic junctions in one transaction. The version
// + block + metadata/statistics split is: master+version+block+junctions here,
// metadata+statistics+history in CreateMaterial.
func (r *repository) createMaterialContent(ctx context.Context, c *Content) error {
	tx, err := r.pool.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)

	statuses, err := r.ensureMaterialStatuses(ctx, tx)
	if err != nil {
		return err
	}
	types, err := r.ensureMaterialTypes(ctx, tx)
	if err != nil {
		return err
	}

	code := "mat_" + strings.ReplaceAll(uuid.NewString(), "-", "")[:12]
	slug := materialSlug(c.Title)
	if slug == "material" || slug == "" {
		slug = "material"
	}
	slug = slug + "-" + strings.ReplaceAll(uuid.NewString(), "-", "")[:8]

	var typeID *uuid.UUID
	if f, ok := c.Metadata["content_format"].(string); ok {
		if t, ok := types[f]; ok {
			typeID = &t
		}
	}
	statusID := statuses[string(c.Status)]
	if statusID == uuid.Nil {
		statusID = statuses[string(StatusDraft)]
	}

	var publishedAt *time.Time
	if c.Status == StatusPublished {
		now := time.Now()
		publishedAt = &now
		c.PublishedAt = publishedAt
	}

	_, err = tx.Exec(ctx, `
		INSERT INTO content.material (id, material_code, title, slug, summary, material_type_id, status_id, owner_id, created_by, updated_by, published_at, created_at, updated_at)
		VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)`,
		c.ID, code, c.Title, slug, c.Body, typeID, statusID, c.CreatedBy, c.CreatedBy, c.CreatedBy, publishedAt, c.CreatedAt, c.UpdatedAt)
	if err != nil {
		return err
	}

	var versionID uuid.UUID
	if err := tx.QueryRow(ctx, `
		INSERT INTO content.material_version (material_id, version_no, change_summary, created_by, is_current)
		VALUES ($1, 1, 'Initial version', $2, true) RETURNING id`, c.ID, c.CreatedBy).Scan(&versionID); err != nil {
		return err
	}
	if _, err := tx.Exec(ctx, `
		INSERT INTO content.material_block (material_version_id, block_order, block_type, content)
		VALUES ($1, 0, 'PARAGRAPH', $2)`, versionID, c.Body); err != nil {
		return err
	}
	if _, err := tx.Exec(ctx, `UPDATE content.material SET current_version_id = $1 WHERE id = $2`, versionID, c.ID); err != nil {
		return err
	}

	if err := r.insertMaterialJunctions(ctx, tx, c.ID, c); err != nil {
		return err
	}
	return tx.Commit(ctx)
}

// updateMaterialContent updates master-level fields and junctions for a
// content.material row. The version bump lives in UpdateMaterial.
func (r *repository) updateMaterialContent(ctx context.Context, id uuid.UUID, req UpdateContentReq) error {
	tx, err := r.pool.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)

	statuses, err := r.ensureMaterialStatuses(ctx, tx)
	if err != nil {
		return err
	}

	var statusID *uuid.UUID
	if req.Status != nil {
		sid := statuses[string(*req.Status)]
		if sid != uuid.Nil {
			statusID = &sid
		}
	}

	var publishedAt any
	if req.Status != nil && *req.Status == StatusPublished {
		if req.PublishedAt != nil {
			publishedAt = req.PublishedAt
		} else {
			now := time.Now()
			publishedAt = &now
		}
	}

	if _, err := tx.Exec(ctx, `
		UPDATE content.material SET
			title = COALESCE($2, title),
			summary = COALESCE($3, summary),
			status_id = COALESCE($4, status_id),
			published_at = $5,
			updated_at = NOW()
		WHERE id = $1`, id, req.Title, req.Body, statusID, publishedAt); err != nil {
		return err
	}

	if req.SubjectID != nil || req.ChapterID != nil || req.TopicID != nil {
		if err := r.clearMaterialJunctions(ctx, tx, id); err != nil {
			return err
		}
		if err := r.insertMaterialJunctions(ctx, tx, id, &Content{
			SubjectID: ptrUUIDOrNil(req.SubjectID),
			GradeID:   uuid.Nil,
			ChapterID: req.ChapterID,
			TopicID:   req.TopicID,
		}); err != nil {
			return err
		}
	}
	return tx.Commit(ctx)
}

func ptrUUIDOrNil(u *uuid.UUID) uuid.UUID {
	if u == nil {
		return uuid.Nil
	}
	return *u
}

func (r *repository) GetContent(ctx context.Context, id uuid.UUID) (*Content, error) {
	c := &Content{}
	err := r.pool.QueryRow(ctx, `
		SELECT id, content_type, grade_id, subject_id, chapter_id, topic_id, lo_id, title, body, status, created_by, metadata, published_at, created_at, updated_at
		FROM contents WHERE id = $1
	`, id).Scan(&c.ID, &c.ContentType, &c.GradeID, &c.SubjectID, &c.ChapterID, &c.TopicID, &c.LOID, &c.Title, &c.Body, &c.Status, &c.CreatedBy, &c.Metadata, &c.PublishedAt, &c.CreatedAt, &c.UpdatedAt)
	if err != nil {
		return nil, err
	}
	return c, nil
}

func (r *repository) UpdateContent(ctx context.Context, id uuid.UUID, req UpdateContentReq) error {
	sets := []string{}
	args := []interface{}{}
	argN := 1

	if req.Title != nil {
		sets = append(sets, fmt.Sprintf("title = $%d", argN))
		args = append(args, *req.Title)
		argN++
	}
	if req.Body != nil {
		sets = append(sets, fmt.Sprintf("body = $%d", argN))
		args = append(args, *req.Body)
		argN++
	}
	if req.Status != nil {
		sets = append(sets, fmt.Sprintf("status = $%d", argN))
		args = append(args, *req.Status)
		argN++
		if *req.Status == StatusPublished && req.PublishedAt == nil {
			now := time.Now()
			req.PublishedAt = &now
		}
	}
	if req.SubjectID != nil {
		sets = append(sets, fmt.Sprintf("subject_id = $%d", argN))
		args = append(args, *req.SubjectID)
		argN++
	}
	if req.ChapterID != nil {
		sets = append(sets, fmt.Sprintf("chapter_id = $%d", argN))
		args = append(args, *req.ChapterID)
		argN++
	}
	if req.TopicID != nil {
		sets = append(sets, fmt.Sprintf("topic_id = $%d", argN))
		args = append(args, *req.TopicID)
		argN++
	}
	if req.LOID != nil {
		sets = append(sets, fmt.Sprintf("lo_id = $%d", argN))
		args = append(args, *req.LOID)
		argN++
	}
	if req.Metadata != nil {
		sets = append(sets, fmt.Sprintf("metadata = $%d", argN))
		args = append(args, req.Metadata)
		argN++
	}
	if req.PublishedAt != nil {
		sets = append(sets, fmt.Sprintf("published_at = $%d", argN))
		args = append(args, *req.PublishedAt)
		argN++
	}

	if len(sets) == 0 {
		return nil
	}

	// Route updates for content.material masters to the new-schema path; the
	// legacy `contents` UPDATE below keeps serving question/exam rows.
	var isMaterial bool
	if err := r.pool.QueryRow(ctx, `SELECT EXISTS (SELECT 1 FROM content.material WHERE id = $1 AND deleted_at IS NULL)`, id).Scan(&isMaterial); err == nil && isMaterial {
		return r.updateMaterialContent(ctx, id, req)
	}

	sets = append(sets, "updated_at = NOW()")
	args = append(args, id)

	query := fmt.Sprintf("UPDATE contents SET %s WHERE id = $%d", strings.Join(sets, ", "), argN)
	_, err := r.pool.Exec(ctx, query, args...)
	return err
}

func (r *repository) DeleteContent(ctx context.Context, id uuid.UUID) error {
	_, err := r.pool.Exec(ctx, `DELETE FROM contents WHERE id = $1`, id)
	return err
}

func (r *repository) GetUserGradeID(ctx context.Context, userID uuid.UUID) (*uuid.UUID, error) {
	var gradeID *uuid.UUID
	err := r.pool.QueryRow(ctx, `SELECT grade_id FROM users WHERE id = $1`, userID).Scan(&gradeID)
	if err != nil {
		return nil, err
	}
	return gradeID, nil
}

func (r *repository) ListContent(ctx context.Context, filter ContentFilter) ([]Content, int, error) {
	where := "WHERE 1=1"
	args := []interface{}{}
	argN := 1

	if filter.ContentType != nil {
		where += fmt.Sprintf(" AND content_type = $%d", argN)
		args = append(args, *filter.ContentType)
		argN++
	}
	if filter.GradeID != nil {
		where += fmt.Sprintf(" AND grade_id = $%d", argN)
		args = append(args, *filter.GradeID)
		argN++
	}
	if filter.SubjectID != nil {
		where += fmt.Sprintf(" AND subject_id = $%d", argN)
		args = append(args, *filter.SubjectID)
		argN++
	}
	if filter.Status != nil {
		where += fmt.Sprintf(" AND status = $%d", argN)
		args = append(args, *filter.Status)
		argN++
	}
	if filter.CreatedBy != nil {
		where += fmt.Sprintf(" AND created_by = $%d", argN)
		args = append(args, *filter.CreatedBy)
		argN++
	}
	if filter.Search != "" {
		where += fmt.Sprintf(" AND (title ILIKE $%d OR body ILIKE $%d)", argN, argN)
		args = append(args, "%"+filter.Search+"%")
		argN++
	}

	var total int
	countQuery := "SELECT COUNT(*) FROM contents " + where
	err := r.pool.QueryRow(ctx, countQuery, args...).Scan(&total)
	if err != nil {
		return nil, 0, err
	}

	limit := filter.Limit
	if limit <= 0 {
		limit = 20
	}
	offset := filter.Offset

	query := fmt.Sprintf(`
		SELECT id, content_type, grade_id, subject_id, chapter_id, topic_id, lo_id, title, body, status, created_by, metadata, published_at, created_at, updated_at
		FROM contents %s ORDER BY created_at DESC LIMIT $%d OFFSET $%d
	`, where, argN, argN+1)
	args = append(args, limit, offset)

	rows, err := r.pool.Query(ctx, query, args...)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	var contents []Content
	for rows.Next() {
		var c Content
		if err := rows.Scan(&c.ID, &c.ContentType, &c.GradeID, &c.SubjectID, &c.ChapterID, &c.TopicID, &c.LOID, &c.Title, &c.Body, &c.Status, &c.CreatedBy, &c.Metadata, &c.PublishedAt, &c.CreatedAt, &c.UpdatedAt); err != nil {
			return nil, 0, err
		}
		contents = append(contents, c)
	}
	return contents, total, nil
}

func (r *repository) GetContentByGrade(ctx context.Context, gradeID uuid.UUID, contentType ContentType, limit, offset int) ([]Content, int, error) {
	filter := ContentFilter{
		GradeID:     &gradeID,
		ContentType: &contentType,
		Limit:       limit,
		Offset:      offset,
	}
	return r.ListContent(ctx, filter)
}

// ========== QUESTIONS ==========

func (r *repository) CreateQuestion(ctx context.Context, q *Question, opts []QuestionOption) error {
	tx, err := r.pool.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)

	// Note: grade_id, subject_id, created_by should be passed via CreateContentReq in real usage
	// This method assumes caller has already created the base content

	_, err = tx.Exec(ctx, `
		INSERT INTO content_questions (content_id, question_type, difficulty, bloom_level, thinking_level, language, source, subtopic_id, stimulus_id, score, negative_score, estimated_time, explanation)
		VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
	`, q.ContentID, q.QuestionType, q.Difficulty, q.BloomLevel, q.ThinkingLevel, q.Language, q.Source, q.SubTopicID, q.StimulusID, q.Score, q.NegativeScore, q.EstimatedTime, q.Explanation)
	if err != nil {
		return err
	}

	for i, opt := range opts {
		opt.ID = uuid.New()
		opt.ContentID = q.ContentID
		opt.DisplayOrder = i
		opt.CreatedAt = time.Now()
		_, err = tx.Exec(ctx, `
			INSERT INTO content_question_options (id, content_id, label, option_text, is_correct, explanation, display_order, created_at)
			VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
		`, opt.ID, opt.ContentID, opt.Label, opt.OptionText, opt.IsCorrect, opt.Explanation, opt.DisplayOrder, opt.CreatedAt)
		if err != nil {
			return err
		}
	}

	return tx.Commit(ctx)
}

func (r *repository) GetQuestion(ctx context.Context, contentID uuid.UUID) (*QuestionFull, error) {
	q := &QuestionFull{}
	err := r.pool.QueryRow(ctx, `
		SELECT c.id, c.content_type, c.grade_id, c.subject_id, c.chapter_id, c.topic_id, c.lo_id, c.title, c.body, c.status, c.created_by, c.metadata, c.published_at, c.created_at, c.updated_at,
		       q.question_type, q.difficulty, q.bloom_level, q.thinking_level, q.language, q.source, q.subtopic_id, q.stimulus_id, q.score, q.negative_score, q.estimated_time, q.explanation
		FROM contents c
		JOIN content_questions q ON c.id = q.content_id
		WHERE c.id = $1
	`, contentID).Scan(
		&q.Content.ID, &q.Content.ContentType, &q.Content.GradeID, &q.Content.SubjectID, &q.Content.ChapterID, &q.Content.TopicID, &q.Content.LOID, &q.Content.Title, &q.Content.Body, &q.Content.Status, &q.Content.CreatedBy, &q.Content.Metadata, &q.Content.PublishedAt, &q.Content.CreatedAt, &q.Content.UpdatedAt,
		&q.Question.QuestionType, &q.Question.Difficulty, &q.Question.BloomLevel, &q.Question.ThinkingLevel, &q.Question.Language, &q.Question.Source, &q.Question.SubTopicID, &q.Question.StimulusID, &q.Question.Score, &q.Question.NegativeScore, &q.Question.EstimatedTime, &q.Question.Explanation,
	)
	if err != nil {
		return nil, err
	}

	rows, err := r.pool.Query(ctx, `
		SELECT id, content_id, label, option_text, is_correct, explanation, display_order, created_at
		FROM content_question_options WHERE content_id = $1 ORDER BY display_order
	`, contentID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	for rows.Next() {
		var opt QuestionOption
		if err := rows.Scan(&opt.ID, &opt.ContentID, &opt.Label, &opt.OptionText, &opt.IsCorrect, &opt.Explanation, &opt.DisplayOrder, &opt.CreatedAt); err != nil {
			return nil, err
		}
		q.Options = append(q.Options, opt)
	}
	return q, nil
}

func (r *repository) UpdateQuestion(ctx context.Context, contentID uuid.UUID, q *Question) error {
	_, err := r.pool.Exec(ctx, `
		UPDATE content_questions SET
			question_type = $1, difficulty = $2, bloom_level = $3, thinking_level = $4,
			language = $5, source = $6, subtopic_id = $7, stimulus_id = $8,
			score = $9, negative_score = $10, estimated_time = $11, explanation = $12
		WHERE content_id = $13
	`, q.QuestionType, q.Difficulty, q.BloomLevel, q.ThinkingLevel, q.Language, q.Source,
		q.SubTopicID, q.StimulusID, q.Score, q.NegativeScore, q.EstimatedTime, q.Explanation, contentID)
	if err != nil {
		return err
	}
	return r.UpdateContent(ctx, contentID, UpdateContentReq{
		Title: &q.Explanation,
		Body:  &q.Explanation,
	})
}

func (r *repository) DeleteQuestion(ctx context.Context, contentID uuid.UUID) error {
	// CASCADE deletes content_question_options and content_questions
	return r.DeleteContent(ctx, contentID)
}

func (r *repository) ListQuestions(ctx context.Context, filter QuestionFilter) ([]QuestionFull, int, error) {
	where := "WHERE c.content_type = 'QUESTION'"
	args := []interface{}{}
	argN := 1

	if filter.GradeID != nil {
		where += fmt.Sprintf(" AND c.grade_id = $%d", argN)
		args = append(args, *filter.GradeID)
		argN++
	}
	if filter.SubjectID != nil {
		where += fmt.Sprintf(" AND c.subject_id = $%d", argN)
		args = append(args, *filter.SubjectID)
		argN++
	}
	if filter.Status != nil {
		where += fmt.Sprintf(" AND c.status = $%d", argN)
		args = append(args, *filter.Status)
		argN++
	}
	if filter.CreatedBy != nil {
		where += fmt.Sprintf(" AND c.created_by = $%d", argN)
		args = append(args, *filter.CreatedBy)
		argN++
	}
	if filter.Search != "" {
		where += fmt.Sprintf(" AND (c.title ILIKE $%d OR c.body ILIKE $%d OR q.explanation ILIKE $%d)", argN, argN, argN)
		args = append(args, "%"+filter.Search+"%")
		argN++
	}
	if filter.Difficulty != nil {
		where += fmt.Sprintf(" AND q.difficulty = $%d", argN)
		args = append(args, *filter.Difficulty)
		argN++
	}
	if filter.BloomLevel != nil {
		where += fmt.Sprintf(" AND q.bloom_level = $%d", argN)
		args = append(args, *filter.BloomLevel)
		argN++
	}
	if filter.ThinkingLevel != nil {
		where += fmt.Sprintf(" AND q.thinking_level = $%d", argN)
		args = append(args, *filter.ThinkingLevel)
		argN++
	}
	if filter.QuestionType != nil {
		where += fmt.Sprintf(" AND q.question_type = $%d", argN)
		args = append(args, *filter.QuestionType)
		argN++
	}
	if filter.TopicID != nil {
		where += fmt.Sprintf(" AND q.topic_id = $%d", argN)
		args = append(args, *filter.TopicID)
		argN++
	}

	var total int
	countQuery := fmt.Sprintf("SELECT COUNT(*) FROM contents c JOIN content_questions q ON c.id = q.content_id %s", where)
	err := r.pool.QueryRow(ctx, countQuery, args...).Scan(&total)
	if err != nil {
		return nil, 0, err
	}

	limit := filter.Limit
	if limit <= 0 {
		limit = 20
	}
	offset := filter.Offset

	query := fmt.Sprintf(`
		SELECT c.id, c.content_type, c.grade_id, c.subject_id, c.chapter_id, c.topic_id, c.lo_id, c.title, c.body, c.status, c.created_by, c.metadata, c.published_at, c.created_at, c.updated_at,
		       q.question_type, q.difficulty, q.bloom_level, q.thinking_level, q.language, q.source, q.subtopic_id, q.stimulus_id, q.score, q.negative_score, q.estimated_time, q.explanation
		FROM contents c
		JOIN content_questions q ON c.id = q.content_id
		%s ORDER BY c.created_at DESC LIMIT $%d OFFSET $%d
	`, where, argN, argN+1)
	args = append(args, limit, offset)

	rows, err := r.pool.Query(ctx, query, args...)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	var questions []QuestionFull
	for rows.Next() {
		var q QuestionFull
		if err := rows.Scan(
			&q.Content.ID, &q.Content.ContentType, &q.Content.GradeID, &q.Content.SubjectID, &q.Content.ChapterID, &q.Content.TopicID, &q.Content.LOID, &q.Content.Title, &q.Content.Body, &q.Content.Status, &q.Content.CreatedBy, &q.Content.Metadata, &q.Content.PublishedAt, &q.Content.CreatedAt, &q.Content.UpdatedAt,
			&q.Question.QuestionType, &q.Question.Difficulty, &q.Question.BloomLevel, &q.Question.ThinkingLevel, &q.Question.Language, &q.Question.Source, &q.Question.SubTopicID, &q.Question.StimulusID, &q.Question.Score, &q.Question.NegativeScore, &q.Question.EstimatedTime, &q.Question.Explanation,
		); err != nil {
			return nil, 0, err
		}
		// Load options
		optRows, err := r.pool.Query(ctx, `
			SELECT id, content_id, label, option_text, is_correct, explanation, display_order, created_at
			FROM content_question_options WHERE content_id = $1 ORDER BY display_order
		`, q.Content.ID)
		if err != nil {
			return nil, 0, err
		}
		for optRows.Next() {
			var opt QuestionOption
			if err := optRows.Scan(&opt.ID, &opt.ContentID, &opt.Label, &opt.OptionText, &opt.IsCorrect, &opt.Explanation, &opt.DisplayOrder, &opt.CreatedAt); err != nil {
				optRows.Close()
				return nil, 0, err
			}
			q.Options = append(q.Options, opt)
		}
		optRows.Close()
		questions = append(questions, q)
	}
	return questions, total, nil
}

func (r *repository) ReplaceOptions(ctx context.Context, contentID uuid.UUID, opts []QuestionOption) error {
	tx, err := r.pool.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)

	_, err = tx.Exec(ctx, `DELETE FROM content_question_options WHERE content_id = $1`, contentID)
	if err != nil {
		return err
	}

	for i, opt := range opts {
		opt.ID = uuid.New()
		opt.ContentID = contentID
		opt.DisplayOrder = i
		opt.CreatedAt = time.Now()
		_, err = tx.Exec(ctx, `
			INSERT INTO content_question_options (id, content_id, label, option_text, is_correct, explanation, display_order, created_at)
			VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
		`, opt.ID, opt.ContentID, opt.Label, opt.OptionText, opt.IsCorrect, opt.Explanation, opt.DisplayOrder, opt.CreatedAt)
		if err != nil {
			return err
		}
	}

	return tx.Commit(ctx)
}

// ========== MATERIALS ==========

// materialColumns projects a content.material master plus its current version
// block, metadata, statistics and academic names into a MaterialFull row.
// Junction access is 1:1 via LATERAL so a material always yields exactly one
// row even with multiple academic links.
const materialColumns = `
	m.id,
	'MATERIAL'::text,
	COALESCE(gr.grade_id, '00000000-0000-0000-0000-000000000000')::uuid,
	COALESCE(subj.subject_id, '00000000-0000-0000-0000-000000000000')::uuid,
	ch.chapter_id,
	tp.topic_id,
	NULL::uuid,
	m.title,
	COALESCE(blk.content, COALESCE(m.summary, ''))::text,
	COALESCE(st.code, 'DRAFT')::text,
	COALESCE(m.owner_id, '00000000-0000-0000-0000-000000000000')::uuid,
	NULL::jsonb,
	m.published_at,
	m.created_at,
	m.updated_at,
	m.id,
	COALESCE(mt.code, 'TEXT')::text,
	md.estimated_minutes,
	COALESCE(ms.view_count, 0),
	COALESCE(md.is_premium, false),
	NULL::uuid[],
	COALESCE(s.name, '')::text,
	COALESCE(ach.title, '')::text`

const materialFrom = `
	FROM content.material m
	LEFT JOIN content.material_status st ON st.id = m.status_id
	LEFT JOIN content.material_type mt ON mt.id = m.material_type_id
	LEFT JOIN content.material_version mv ON mv.id = m.current_version_id
	LEFT JOIN content.material_block blk ON blk.material_version_id = mv.id AND blk.block_order = 0
	LEFT JOIN content.material_metadata md ON md.material_id = m.id
	LEFT JOIN content.material_statistics ms ON ms.material_id = m.id
	LEFT JOIN LATERAL (SELECT subject_id FROM content.material_subject WHERE material_id = m.id LIMIT 1) subj ON true
	LEFT JOIN LATERAL (SELECT grade_id FROM content.material_grade WHERE material_id = m.id LIMIT 1) gr ON true
	LEFT JOIN LATERAL (SELECT chapter_id FROM content.material_chapter WHERE material_id = m.id LIMIT 1) ch ON true
	LEFT JOIN LATERAL (SELECT topic_id FROM content.material_topic WHERE material_id = m.id LIMIT 1) tp ON true
	LEFT JOIN academic.subject s ON s.id = subj.subject_id
	LEFT JOIN academic.grade g ON g.id = gr.grade_id
	LEFT JOIN academic.chapter ach ON ach.id = ch.chapter_id
	LEFT JOIN academic.topic t ON t.id = tp.topic_id`

func scanMaterial(row pgx.Row) (*MaterialFull, error) {
	m := &MaterialFull{}
	var meta map[string]interface{}
	if err := row.Scan(
		&m.Content.ID, &m.Content.ContentType, &m.Content.GradeID, &m.Content.SubjectID, &m.Content.ChapterID, &m.Content.TopicID, &m.Content.LOID, &m.Content.Title, &m.Content.Body, &m.Content.Status, &m.Content.CreatedBy, &meta, &m.Content.PublishedAt, &m.Content.CreatedAt, &m.Content.UpdatedAt,
		&m.Material.ContentID, &m.Material.ContentFormat, &m.Material.EstimatedDuration, &m.Material.ReadCount, &m.Material.IsPreview, &m.Material.Prerequisites,
		&m.SubjectName, &m.ChapterName,
	); err != nil {
		return nil, err
	}
	if len(meta) > 0 {
		m.Content.Metadata = meta
	}
	return m, nil
}

// CreateMaterial writes the metadata/statistics/history rows for a material
// master whose version + body block were created by CreateContent.
func (r *repository) CreateMaterial(ctx context.Context, m *Material) error {
	tx, err := r.pool.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)

	_, err = tx.Exec(ctx, `
		INSERT INTO content.material_metadata (material_id, estimated_minutes, difficulty_level, language, is_premium)
		VALUES ($1, $2, $3, 'id', $4)
		ON CONFLICT (material_id) DO UPDATE SET
			estimated_minutes = EXCLUDED.estimated_minutes,
			is_premium = EXCLUDED.is_premium`,
		m.ContentID, m.EstimatedDuration, nil, m.IsPreview)
	if err != nil {
		return err
	}

	_, err = tx.Exec(ctx, `
		INSERT INTO content.material_statistics (material_id, view_count)
		VALUES ($1, $2)
		ON CONFLICT (material_id) DO UPDATE SET view_count = EXCLUDED.view_count`,
		m.ContentID, m.ReadCount)
	if err != nil {
		return err
	}

	for _, prereq := range m.Prerequisites {
		if _, err := tx.Exec(ctx, `
			INSERT INTO content.material_tag (material_id, tag) VALUES ($1, $2)
			ON CONFLICT (material_id, tag) DO NOTHING`, m.ContentID, "prereq:"+prereq.String()); err != nil {
			return err
		}
	}

	_, err = tx.Exec(ctx, `
		INSERT INTO content.material_history (material_id, action, new_json)
		VALUES ($1, 'CREATE', $2::jsonb)`, m.ContentID, `{"action":"CREATE"}`)
	if err != nil {
		return err
	}
	return tx.Commit(ctx)
}

func (r *repository) GetMaterial(ctx context.Context, contentID uuid.UUID) (*MaterialFull, error) {
	return scanMaterial(r.pool.QueryRow(ctx, `
		SELECT `+materialColumns+materialFrom+` WHERE m.id = $1 AND m.deleted_at IS NULL`, contentID))
}

// UpdateMaterial creates a new version (body carried from the master summary,
// which UpdateContent refreshed), flips the old current flag, and refreshes
// metadata + statistics + history atomically.
func (r *repository) UpdateMaterial(ctx context.Context, contentID uuid.UUID, m *Material) error {
	tx, err := r.pool.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)

	var curVer *uuid.UUID
	if err := tx.QueryRow(ctx, `
		SELECT current_version_id FROM content.material WHERE id = $1 AND deleted_at IS NULL`, contentID).Scan(&curVer); err != nil {
		return err
	}
	if curVer == nil {
		return pgx.ErrNoRows
	}

	var nextNo int
	if err := tx.QueryRow(ctx, `
		SELECT COALESCE(MAX(version_no), 0) + 1 FROM content.material_version WHERE material_id = $1`, contentID).Scan(&nextNo); err != nil {
		return err
	}

	// Body lives on master.summary after UpdateContent; carry it into the new
	// version's block so GetMaterial reflects the updated body.
	var body string
	var ownerID *uuid.UUID
	if err := tx.QueryRow(ctx, `SELECT COALESCE(summary, ''), owner_id FROM content.material WHERE id = $1`, contentID).Scan(&body, &ownerID); err != nil {
		return err
	}

	var newVer uuid.UUID
	if err := tx.QueryRow(ctx, `
		INSERT INTO content.material_version (material_id, version_no, change_summary, created_by, is_current)
		VALUES ($1, $2, 'content updated', $3, true) RETURNING id`, contentID, nextNo, ownerID).Scan(&newVer); err != nil {
		return err
	}
	if _, err := tx.Exec(ctx, `UPDATE content.material_version SET is_current = false WHERE id = $1`, *curVer); err != nil {
		return err
	}
	if _, err := tx.Exec(ctx, `
		UPDATE content.material SET current_version_id = $1, updated_by = $2, updated_at = NOW() WHERE id = $3`,
		newVer, ownerID, contentID); err != nil {
		return err
	}
	if _, err := tx.Exec(ctx, `
		INSERT INTO content.material_block (material_version_id, block_order, block_type, content)
		VALUES ($1, 0, 'PARAGRAPH', $2)`, newVer, body); err != nil {
		return err
	}

	if _, err := tx.Exec(ctx, `
		INSERT INTO content.material_metadata (material_id, estimated_minutes, is_premium)
		VALUES ($1, $2, $3)
		ON CONFLICT (material_id) DO UPDATE SET
			estimated_minutes = EXCLUDED.estimated_minutes,
			is_premium = EXCLUDED.is_premium`,
		contentID, m.EstimatedDuration, m.IsPreview); err != nil {
		return err
	}
	if _, err := tx.Exec(ctx, `
		INSERT INTO content.material_statistics (material_id, view_count) VALUES ($1, 0)
		ON CONFLICT (material_id) DO NOTHING`, contentID); err != nil {
		return err
	}

	_, err = tx.Exec(ctx, `
		INSERT INTO content.material_history (material_id, action, new_json)
		VALUES ($1, 'UPDATE', $2::jsonb)`, contentID, `{"action":"UPDATE"}`)
	if err != nil {
		return err
	}
	return tx.Commit(ctx)
}

func (r *repository) DeleteMaterial(ctx context.Context, contentID uuid.UUID) error {
	tx, err := r.pool.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)

	var tag pgconn.CommandTag
	tag, err = tx.Exec(ctx, `
		UPDATE content.material SET deleted_at = NOW() WHERE id = $1 AND deleted_at IS NULL`, contentID)
	if err != nil {
		return err
	}
	if tag.RowsAffected() == 0 {
		return pgx.ErrNoRows
	}
	_, err = tx.Exec(ctx, `
		INSERT INTO content.material_history (material_id, action, new_json)
		VALUES ($1, 'DELETE', $2::jsonb)`, contentID, `{"action":"DELETE"}`)
	if err != nil {
		return err
	}
	return tx.Commit(ctx)
}

func (r *repository) ListMaterials(ctx context.Context, filter MaterialFilter) ([]MaterialFull, int, error) {
	where := " WHERE m.deleted_at IS NULL"
	args := []interface{}{}
	argN := 1

	if filter.SubjectID != nil {
		where += fmt.Sprintf(" AND subj.subject_id = $%d", argN)
		args = append(args, *filter.SubjectID)
		argN++
	}
	if filter.GradeID != nil {
		where += fmt.Sprintf(" AND gr.grade_id = $%d", argN)
		args = append(args, *filter.GradeID)
		argN++
	}
	if filter.Status != nil {
		where += fmt.Sprintf(" AND st.code = $%d", argN)
		args = append(args, string(*filter.Status))
		argN++
	}
	if filter.CreatedBy != nil {
		where += fmt.Sprintf(" AND m.owner_id = $%d", argN)
		args = append(args, *filter.CreatedBy)
		argN++
	}
	if filter.Search != "" {
		where += fmt.Sprintf(" AND (m.title ILIKE $%d OR COALESCE(blk.content, '') ILIKE $%d)", argN, argN)
		args = append(args, "%"+filter.Search+"%")
		argN++
	}
	if filter.ContentFormat != nil {
		where += fmt.Sprintf(" AND mt.code = $%d", argN)
		args = append(args, string(*filter.ContentFormat))
		argN++
	}

	var total int
	if err := r.pool.QueryRow(ctx, "SELECT COUNT(*) "+materialFrom+where, args...).Scan(&total); err != nil {
		return nil, 0, err
	}

	limit := filter.Limit
	if limit <= 0 {
		limit = 20
	}
	offset := filter.Offset

	query := fmt.Sprintf("SELECT "+materialColumns+materialFrom+where+
		" ORDER BY m.created_at DESC LIMIT $%d OFFSET $%d", argN, argN+1)
	args = append(args, limit, offset)

	rows, err := r.pool.Query(ctx, query, args...)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	materials := make([]MaterialFull, 0)
	for rows.Next() {
		m, err := scanMaterial(rows)
		if err != nil {
			return nil, 0, err
		}
		materials = append(materials, *m)
	}
	return materials, total, rows.Err()
}

func (r *repository) IncrementReadCount(ctx context.Context, contentID uuid.UUID) error {
	_, err := r.pool.Exec(ctx, `
		INSERT INTO content.material_statistics (material_id, view_count) VALUES ($1, 1)
		ON CONFLICT (material_id) DO UPDATE SET view_count = content.material_statistics.view_count + 1`, contentID)
	return err
}

// ========== LEARNING PROGRESS ==========

// parseLastPosition converts the legacy *string API field into the int column.
func parseLastPosition(s *string) int {
	if s == nil {
		return 0
	}
	n, err := strconv.Atoi(*s)
	if err != nil {
		return 0
	}
	return n
}

func lastPositionPtr(n int) *string {
	s := fmt.Sprint(n)
	return &s
}

func (r *repository) UpsertProgress(ctx context.Context, lp *LearningProgress) error {
	lp.ID = uuid.New()
	_, err := r.pool.Exec(ctx, `
		INSERT INTO content.learning_progress (id, student_id, material_id, progress_percent, last_position, completed, created_at, updated_at)
		VALUES ($1,$2,$3,$4,$5,$6,NOW(),NOW())
		ON CONFLICT (student_id, material_id) DO UPDATE SET
			progress_percent = $4,
			last_position = $5,
			completed = $6,
			completed_at = CASE WHEN EXCLUDED.completed THEN NOW() ELSE content.learning_progress.completed_at END,
			updated_at = NOW()
	`, lp.ID, lp.UserID, lp.MaterialID, lp.Progress, parseLastPosition(lp.LastPosition), lp.Completed)
	return err
}

func scanProgress(row pgx.Row) (*LearningProgress, error) {
	lp := &LearningProgress{}
	var lastPos int
	if err := row.Scan(&lp.ID, &lp.UserID, &lp.MaterialID, &lp.Progress, &lastPos, &lp.Completed, &lp.CreatedAt, &lp.UpdatedAt); err != nil {
		return nil, err
	}
	lp.LastPosition = lastPositionPtr(lastPos)
	return lp, nil
}

func (r *repository) GetProgress(ctx context.Context, userID, materialID uuid.UUID) (*LearningProgress, error) {
	return scanProgress(r.pool.QueryRow(ctx, `
		SELECT id, student_id, material_id, progress_percent::float8, last_position, completed, created_at, updated_at
		FROM content.learning_progress
		WHERE student_id=$1 AND material_id=$2
	`, userID, materialID))
}

func (r *repository) ListProgressByUser(ctx context.Context, userID uuid.UUID, limit, offset int) ([]LearningProgress, int, error) {
	var total int
	if err := r.pool.QueryRow(ctx, `
		SELECT COUNT(*) FROM content.learning_progress lp
		JOIN content.material m ON m.id = lp.material_id AND m.deleted_at IS NULL
		WHERE lp.student_id=$1`, userID).Scan(&total); err != nil {
		return nil, 0, err
	}

	rows, err := r.pool.Query(ctx, `
		SELECT lp.id, lp.student_id, lp.material_id, lp.progress_percent::float8, lp.last_position, lp.completed, lp.created_at, lp.updated_at
		FROM content.learning_progress lp
		JOIN content.material m ON m.id = lp.material_id AND m.deleted_at IS NULL
		WHERE lp.student_id=$1 ORDER BY lp.updated_at DESC LIMIT $2 OFFSET $3`, userID, limit, offset)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	list := make([]LearningProgress, 0)
	for rows.Next() {
		lp, err := scanProgress(rows)
		if err != nil {
			return nil, 0, err
		}
		list = append(list, *lp)
	}
	return list, total, rows.Err()
}

// ========== EXAMS ==========

func (r *repository) CreateExam(ctx context.Context, e *Exam) error {
	_, err := r.pool.Exec(ctx, `
		INSERT INTO content_exams (content_id, description, duration_minutes, passing_score, shuffle_questions, shuffle_options, max_attempts, start_time, end_time, blueprint)
		VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
	`, e.ContentID, e.Description, e.DurationMinutes, e.PassingScore, e.ShuffleQuestions, e.ShuffleOptions, e.MaxAttempts, e.StartTime, e.EndTime, e.Blueprint)
	return err
}

func (r *repository) GetExam(ctx context.Context, contentID uuid.UUID) (*ExamFull, error) {
	e := &ExamFull{}
	err := r.pool.QueryRow(ctx, `
		SELECT c.id, c.content_type, c.grade_id, c.subject_id, c.chapter_id, c.topic_id, c.lo_id, c.title, c.body, c.status, c.created_by, c.metadata, c.published_at, c.created_at, c.updated_at,
		       e.description, e.duration_minutes, e.passing_score, e.shuffle_questions, e.shuffle_options, e.max_attempts, e.start_time, e.end_time, e.blueprint
		FROM contents c
		JOIN content_exams e ON c.id = e.content_id
		WHERE c.id = $1
	`, contentID).Scan(
		&e.Content.ID, &e.Content.ContentType, &e.Content.GradeID, &e.Content.SubjectID, &e.Content.ChapterID, &e.Content.TopicID, &e.Content.LOID, &e.Content.Title, &e.Content.Body, &e.Content.Status, &e.Content.CreatedBy, &e.Content.Metadata, &e.Content.PublishedAt, &e.Content.CreatedAt, &e.Content.UpdatedAt,
		&e.Exam.Description, &e.Exam.DurationMinutes, &e.Exam.PassingScore, &e.Exam.ShuffleQuestions, &e.Exam.ShuffleOptions, &e.Exam.MaxAttempts, &e.Exam.StartTime, &e.Exam.EndTime, &e.Exam.Blueprint,
	)
	if err != nil {
		return nil, err
	}

	// Load questions
	eqRows, err := r.pool.Query(ctx, `
		SELECT id, exam_content_id, question_content_id, display_order, points, created_at
		FROM content_exam_questions WHERE exam_content_id = $1 ORDER BY display_order
	`, contentID)
	if err != nil {
		return nil, err
	}
	for eqRows.Next() {
		var eq ExamQuestion
		if err := eqRows.Scan(&eq.ID, &eq.ExamContentID, &eq.QuestionContentID, &eq.DisplayOrder, &eq.Points, &eq.CreatedAt); err != nil {
			eqRows.Close()
			return nil, err
		}
		e.Questions = append(e.Questions, eq)
	}
	eqRows.Close()

	// Load blueprint
	bp := &ExamBlueprint{}
	err = r.pool.QueryRow(ctx, `
		SELECT id, exam_content_id, easy_count, medium_count, hard_count, total_questions, created_at
		FROM content_exam_blueprints WHERE exam_content_id = $1
	`, contentID).Scan(&bp.ID, &bp.ExamContentID, &bp.EasyCount, &bp.MediumCount, &bp.HardCount, &bp.TotalQuestions, &bp.CreatedAt)
	if err == nil {
		e.Blueprint = bp
	}

	return e, nil
}

func (r *repository) UpdateExam(ctx context.Context, contentID uuid.UUID, e *Exam) error {
	if e.Blueprint == nil {
		e.Blueprint = make(map[string]interface{})
	}
	bpBytes, err := json.Marshal(e.Blueprint)
	if err != nil {
		bpBytes = []byte("{}")
	}

	_, err = r.pool.Exec(ctx, `
		UPDATE content_exams SET
			description = COALESCE(NULLIF($1, ''), description),
			duration_minutes = CASE WHEN $2 > 0 THEN $2 ELSE duration_minutes END,
			passing_score = CASE WHEN $3 >= 0 THEN $3 ELSE passing_score END,
			shuffle_questions = $4,
			shuffle_options = $5,
			max_attempts = CASE WHEN $6 > 0 THEN $6 ELSE max_attempts END,
			start_time = COALESCE($7, start_time),
			end_time = COALESCE($8, end_time),
			blueprint = $9::jsonb
		WHERE content_id = $10
	`, e.Description, e.DurationMinutes, e.PassingScore, e.ShuffleQuestions, e.ShuffleOptions, e.MaxAttempts, e.StartTime, e.EndTime, string(bpBytes), contentID)
	return err
}

func (r *repository) DeleteExam(ctx context.Context, contentID uuid.UUID) error {
	return r.DeleteContent(ctx, contentID)
}

func (r *repository) ListExams(ctx context.Context, filter ExamFilter) ([]ExamFull, int, error) {
	where := "WHERE c.content_type = 'EXAM'"
	args := []interface{}{}
	argN := 1

	if filter.GradeID != nil && *filter.GradeID != uuid.Nil {
		where += fmt.Sprintf(" AND (c.grade_id = $%d OR c.grade_id IS NULL OR c.grade_id IN (SELECT g.id FROM grades g WHERE g.education_level_id = (SELECT g2.education_level_id FROM grades g2 WHERE g2.id = $%d)))", argN, argN)
		args = append(args, *filter.GradeID)
		argN++
	}
	if filter.SubjectID != nil {
		where += fmt.Sprintf(" AND c.subject_id = $%d", argN)
		args = append(args, *filter.SubjectID)
		argN++
	}
	if filter.Status != nil {
		where += fmt.Sprintf(" AND c.status = $%d", argN)
		args = append(args, *filter.Status)
		argN++
	}
	if filter.CreatedBy != nil {
		where += fmt.Sprintf(" AND c.created_by = $%d", argN)
		args = append(args, *filter.CreatedBy)
		argN++
	}
	if filter.Search != "" {
		where += fmt.Sprintf(" AND (c.title ILIKE $%d OR c.body ILIKE $%d OR e.description ILIKE $%d)", argN, argN, argN)
		args = append(args, "%"+filter.Search+"%")
		argN++
	}
	if filter.StartTime != nil {
		where += fmt.Sprintf(" AND e.start_time >= $%d", argN)
		args = append(args, *filter.StartTime)
		argN++
	}
	if filter.EndTime != nil {
		where += fmt.Sprintf(" AND e.end_time <= $%d", argN)
		args = append(args, *filter.EndTime)
		argN++
	}

	var total int
	countQuery := fmt.Sprintf("SELECT COUNT(*) FROM contents c JOIN content_exams e ON c.id = e.content_id %s", where)
	err := r.pool.QueryRow(ctx, countQuery, args...).Scan(&total)
	if err != nil {
		return nil, 0, err
	}

	limit := filter.Limit
	if limit <= 0 {
		limit = 20
	}
	offset := filter.Offset

	query := fmt.Sprintf(`
		SELECT c.id, c.content_type, c.grade_id, c.subject_id, c.chapter_id, c.topic_id, c.lo_id, c.title, c.body, c.status, c.created_by, c.metadata, c.published_at, c.created_at, c.updated_at,
		       e.description, e.duration_minutes, e.passing_score, e.shuffle_questions, e.shuffle_options, e.max_attempts, e.start_time, e.end_time, e.blueprint
		FROM contents c
		JOIN content_exams e ON c.id = e.content_id
		%s ORDER BY c.created_at DESC LIMIT $%d OFFSET $%d
	`, where, argN, argN+1)
	args = append(args, limit, offset)

	rows, err := r.pool.Query(ctx, query, args...)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	var exams []ExamFull
	for rows.Next() {
		var e ExamFull
		if err := rows.Scan(
			&e.Content.ID, &e.Content.ContentType, &e.Content.GradeID, &e.Content.SubjectID, &e.Content.ChapterID, &e.Content.TopicID, &e.Content.LOID, &e.Content.Title, &e.Content.Body, &e.Content.Status, &e.Content.CreatedBy, &e.Content.Metadata, &e.Content.PublishedAt, &e.Content.CreatedAt, &e.Content.UpdatedAt,
			&e.Exam.Description, &e.Exam.DurationMinutes, &e.Exam.PassingScore, &e.Exam.ShuffleQuestions, &e.Exam.ShuffleOptions, &e.Exam.MaxAttempts, &e.Exam.StartTime, &e.Exam.EndTime, &e.Exam.Blueprint,
		); err != nil {
			return nil, 0, err
		}
		exams = append(exams, e)
	}
	return exams, total, nil
}

// ========== EXAM QUESTIONS ==========

func (r *repository) AddExamQuestion(ctx context.Context, eq *ExamQuestion) error {
	eq.ID = uuid.New()
	eq.CreatedAt = time.Now()
	_, err := r.pool.Exec(ctx, `
		INSERT INTO content_exam_questions (id, exam_content_id, question_content_id, display_order, points, created_at)
		VALUES ($1,$2,$3,$4,$5,$6)
	`, eq.ID, eq.ExamContentID, eq.QuestionContentID, eq.DisplayOrder, eq.Points, eq.CreatedAt)
	return err
}

func (r *repository) RemoveExamQuestion(ctx context.Context, examContentID, questionContentID uuid.UUID) error {
	_, err := r.pool.Exec(ctx, `
		DELETE FROM content_exam_questions WHERE exam_content_id = $1 AND question_content_id = $2
	`, examContentID, questionContentID)
	return err
}

func (r *repository) GetExamQuestions(ctx context.Context, examContentID uuid.UUID) ([]ExamQuestion, error) {
	rows, err := r.pool.Query(ctx, `
		SELECT id, exam_content_id, question_content_id, display_order, points, created_at
		FROM content_exam_questions WHERE exam_content_id = $1 ORDER BY display_order
	`, examContentID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var questions []ExamQuestion
	for rows.Next() {
		var eq ExamQuestion
		if err := rows.Scan(&eq.ID, &eq.ExamContentID, &eq.QuestionContentID, &eq.DisplayOrder, &eq.Points, &eq.CreatedAt); err != nil {
			return nil, err
		}
		questions = append(questions, eq)
	}
	return questions, nil
}

func (r *repository) ReorderExamQuestions(ctx context.Context, examContentID uuid.UUID, questionIDs []uuid.UUID) error {
	tx, err := r.pool.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)

	for i, qID := range questionIDs {
		_, err = tx.Exec(ctx, `
			UPDATE content_exam_questions SET display_order = $1
			WHERE exam_content_id = $2 AND question_content_id = $3
		`, i, examContentID, qID)
		if err != nil {
			return err
		}
	}
	return tx.Commit(ctx)
}

// ========== EXAM BLUEPRINTS ==========

func (r *repository) CreateExamBlueprint(ctx context.Context, eb *ExamBlueprint) error {
	eb.ID = uuid.New()
	eb.CreatedAt = time.Now()
	_, err := r.pool.Exec(ctx, `
		INSERT INTO content_exam_blueprints (id, exam_content_id, easy_count, medium_count, hard_count, total_questions, created_at)
		VALUES ($1,$2,$3,$4,$5,$6,$7)
	`, eb.ID, eb.ExamContentID, eb.EasyCount, eb.MediumCount, eb.HardCount, eb.TotalQuestions, eb.CreatedAt)
	return err
}

func (r *repository) GetExamBlueprint(ctx context.Context, examContentID uuid.UUID) (*ExamBlueprint, error) {
	eb := &ExamBlueprint{}
	err := r.pool.QueryRow(ctx, `
		SELECT id, exam_content_id, easy_count, medium_count, hard_count, total_questions, created_at
		FROM content_exam_blueprints WHERE exam_content_id = $1
	`, examContentID).Scan(&eb.ID, &eb.ExamContentID, &eb.EasyCount, &eb.MediumCount, &eb.HardCount, &eb.TotalQuestions, &eb.CreatedAt)
	if err != nil {
		return nil, err
	}
	return eb, nil
}

// ========== EXAM PARTICIPANTS ==========

func (r *repository) AddExamParticipant(ctx context.Context, ep *ExamParticipant) error {
	ep.ID = uuid.New()
	ep.CreatedAt = time.Now()
	_, err := r.pool.Exec(ctx, `
		INSERT INTO content_exam_participants (id, exam_content_id, user_id, created_at)
		VALUES ($1,$2,$3,$4)
	`, ep.ID, ep.ExamContentID, ep.UserID, ep.CreatedAt)
	return err
}

func (r *repository) RemoveExamParticipant(ctx context.Context, examContentID, userID uuid.UUID) error {
	_, err := r.pool.Exec(ctx, `
		DELETE FROM content_exam_participants WHERE exam_content_id = $1 AND user_id = $2
	`, examContentID, userID)
	return err
}

func (r *repository) GetExamParticipants(ctx context.Context, examContentID uuid.UUID) ([]ExamParticipant, error) {
	rows, err := r.pool.Query(ctx, `
		SELECT id, exam_content_id, user_id, created_at
		FROM content_exam_participants WHERE exam_content_id = $1
	`, examContentID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var participants []ExamParticipant
	for rows.Next() {
		var ep ExamParticipant
		if err := rows.Scan(&ep.ID, &ep.ExamContentID, &ep.UserID, &ep.CreatedAt); err != nil {
			return nil, err
		}
		participants = append(participants, ep)
	}
	return participants, nil
}

// ========== EXAM ATTEMPTS ==========

func (r *repository) CreateExamAttempt(ctx context.Context, ea *ExamAttempt) error {
	ea.ID = uuid.New()
	ea.CreatedAt = time.Now()
	_, err := r.pool.Exec(ctx, `
		INSERT INTO content_exam_attempts (id, exam_content_id, user_id, attempt_number, status, started_at, created_at)
		VALUES ($1,$2,$3,$4,$5,$6,$7)
	`, ea.ID, ea.ExamContentID, ea.UserID, ea.AttemptNumber, ea.Status, ea.StartedAt, ea.CreatedAt)
	return err
}

func (r *repository) GetExamAttempt(ctx context.Context, attemptID uuid.UUID) (*ExamAttempt, error) {
	ea := &ExamAttempt{}
	err := r.pool.QueryRow(ctx, `
		SELECT id, exam_content_id, user_id, attempt_number, status, started_at, submitted_at, graded_at, total_score, max_score, time_spent_seconds, created_at
		FROM content_exam_attempts WHERE id = $1
	`, attemptID).Scan(&ea.ID, &ea.ExamContentID, &ea.UserID, &ea.AttemptNumber, &ea.Status, &ea.StartedAt, &ea.SubmittedAt, &ea.GradedAt, &ea.TotalScore, &ea.MaxScore, &ea.TimeSpentSeconds, &ea.CreatedAt)
	if err != nil {
		return nil, err
	}
	return ea, nil
}

func (r *repository) UpdateExamAttempt(ctx context.Context, ea *ExamAttempt) error {
	_, err := r.pool.Exec(ctx, `
		UPDATE content_exam_attempts SET
			status = $1, submitted_at = $2, graded_at = $3,
			total_score = $4, max_score = $5, time_spent_seconds = $6
		WHERE id = $7
	`, ea.Status, ea.SubmittedAt, ea.GradedAt, ea.TotalScore, ea.MaxScore, ea.TimeSpentSeconds, ea.ID)
	return err
}

func (r *repository) GetUserExamAttempts(ctx context.Context, examContentID, userID uuid.UUID) ([]ExamAttempt, error) {
	rows, err := r.pool.Query(ctx, `
		SELECT id, exam_content_id, user_id, attempt_number, status, started_at, submitted_at, graded_at, total_score, max_score, time_spent_seconds, created_at
		FROM content_exam_attempts WHERE exam_content_id = $1 AND user_id = $2 ORDER BY attempt_number
	`, examContentID, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var attempts []ExamAttempt
	for rows.Next() {
		var ea ExamAttempt
		if err := rows.Scan(&ea.ID, &ea.ExamContentID, &ea.UserID, &ea.AttemptNumber, &ea.Status, &ea.StartedAt, &ea.SubmittedAt, &ea.GradedAt, &ea.TotalScore, &ea.MaxScore, &ea.TimeSpentSeconds, &ea.CreatedAt); err != nil {
			return nil, err
		}
		attempts = append(attempts, ea)
	}
	return attempts, nil
}

// ========== EXAM ANSWERS ==========

func (r *repository) CreateExamAnswer(ctx context.Context, ea *ExamAnswer) error {
	ea.ID = uuid.New()
	ea.CreatedAt = time.Now()
	_, err := r.pool.Exec(ctx, `
		INSERT INTO content_exam_answers (id, attempt_id, question_content_id, selected_options, text_answer, is_correct, points_earned, graded_by, graded_at, created_at)
		VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
	`, ea.ID, ea.AttemptID, ea.QuestionContentID, ea.SelectedOptions, ea.TextAnswer, ea.IsCorrect, ea.PointsEarned, ea.GradedBy, ea.GradedAt, ea.CreatedAt)
	return err
}

func (r *repository) GetExamAnswers(ctx context.Context, attemptID uuid.UUID) ([]ExamAnswer, error) {
	rows, err := r.pool.Query(ctx, `
		SELECT id, attempt_id, question_content_id, selected_options, text_answer, is_correct, points_earned, graded_by, graded_at, created_at
		FROM content_exam_answers WHERE attempt_id = $1
	`, attemptID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var answers []ExamAnswer
	for rows.Next() {
		var ea ExamAnswer
		if err := rows.Scan(&ea.ID, &ea.AttemptID, &ea.QuestionContentID, &ea.SelectedOptions, &ea.TextAnswer, &ea.IsCorrect, &ea.PointsEarned, &ea.GradedBy, &ea.GradedAt, &ea.CreatedAt); err != nil {
			return nil, err
		}
		answers = append(answers, ea)
	}
	return answers, nil
}

func (r *repository) UpdateExamAnswer(ctx context.Context, ea *ExamAnswer) error {
	_, err := r.pool.Exec(ctx, `
		UPDATE content_exam_answers
		SET selected_options = $2, text_answer = $3, is_correct = $4, points_earned = $5, graded_by = $6, graded_at = $7
		WHERE id = $1
	`, ea.ID, ea.SelectedOptions, ea.TextAnswer, ea.IsCorrect, ea.PointsEarned, ea.GradedBy, ea.GradedAt)
	return err
}

func (r *repository) BatchCreateExamAnswers(ctx context.Context, answers []ExamAnswer) error {
	tx, err := r.pool.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)

	for _, ea := range answers {
		ea.ID = uuid.New()
		ea.CreatedAt = time.Now()
		_, err = tx.Exec(ctx, `
			INSERT INTO content_exam_answers (id, attempt_id, question_content_id, selected_options, text_answer, is_correct, points_earned, graded_by, graded_at, created_at)
			VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
		`, ea.ID, ea.AttemptID, ea.QuestionContentID, ea.SelectedOptions, ea.TextAnswer, ea.IsCorrect, ea.PointsEarned, ea.GradedBy, ea.GradedAt, ea.CreatedAt)
		if err != nil {
			return err
		}
	}
	return tx.Commit(ctx)
}

// ========== QUESTION POOLS ==========

func (r *repository) CreateQuestionPool(ctx context.Context, qp *QuestionPool) error {
	qp.ID = uuid.New()
	qp.CreatedAt = time.Now()
	qp.UpdatedAt = time.Now()
	_, err := r.pool.Exec(ctx, `
		INSERT INTO content_question_pools (id, exam_content_id, subject_id, chapter_ids, easy_pct, medium_pct, hard_pct, total_pool_size, questions_per_student, shuffle_questions, shuffle_options, created_at, updated_at)
		VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
	`, qp.ID, qp.ExamContentID, qp.SubjectID, qp.ChapterIDs, qp.EasyPct, qp.MediumPct, qp.HardPct, qp.TotalPoolSize, qp.QuestionsPerStudent, qp.ShuffleQuestions, qp.ShuffleOptions, qp.CreatedAt, qp.UpdatedAt)
	return err
}

func (r *repository) GetQuestionPool(ctx context.Context, examContentID uuid.UUID) (*QuestionPool, error) {
	qp := &QuestionPool{}
	err := r.pool.QueryRow(ctx, `
		SELECT id, exam_content_id, subject_id, chapter_ids, easy_pct, medium_pct, hard_pct, total_pool_size, questions_per_student, shuffle_questions, shuffle_options, created_at, updated_at
		FROM content_question_pools WHERE exam_content_id = $1
	`, examContentID).Scan(&qp.ID, &qp.ExamContentID, &qp.SubjectID, &qp.ChapterIDs, &qp.EasyPct, &qp.MediumPct, &qp.HardPct, &qp.TotalPoolSize, &qp.QuestionsPerStudent, &qp.ShuffleQuestions, &qp.ShuffleOptions, &qp.CreatedAt, &qp.UpdatedAt)
	if err != nil {
		return nil, err
	}
	return qp, nil
}

func (r *repository) UpdateQuestionPool(ctx context.Context, qp *QuestionPool) error {
	qp.UpdatedAt = time.Now()
	_, err := r.pool.Exec(ctx, `
		UPDATE content_question_pools SET subject_id=$1, chapter_ids=$2, easy_pct=$3, medium_pct=$4, hard_pct=$5, total_pool_size=$6, questions_per_student=$7, shuffle_questions=$8, shuffle_options=$9, updated_at=$10 WHERE id=$11
	`, qp.SubjectID, qp.ChapterIDs, qp.EasyPct, qp.MediumPct, qp.HardPct, qp.TotalPoolSize, qp.QuestionsPerStudent, qp.ShuffleQuestions, qp.ShuffleOptions, qp.UpdatedAt, qp.ID)
	return err
}

func (r *repository) DeleteQuestionPool(ctx context.Context, id uuid.UUID) error {
	_, err := r.pool.Exec(ctx, `DELETE FROM content_question_pools WHERE id=$1`, id)
	return err
}

func (r *repository) GetQuestionsForPool(ctx context.Context, pool *QuestionPool) ([]uuid.UUID, error) {
	whereClause := `WHERE content_type = 'QUESTION' AND status = 'PUBLISHED' AND subject_id = $1`
	args := []interface{}{pool.SubjectID}
	argN := 2

	if len(pool.ChapterIDs) > 0 {
		whereClause += ` AND chapter_id = ANY($` + strconv.Itoa(argN) + `)`
		args = append(args, pool.ChapterIDs)
		argN++
	}

	easyCount := pool.TotalPoolSize * pool.EasyPct / 100
	mediumCount := pool.TotalPoolSize * pool.MediumPct / 100
	hardCount := pool.TotalPoolSize - easyCount - mediumCount

	var allIDs []uuid.UUID

	rows, err := r.pool.Query(ctx, `SELECT id FROM content_questions_full `+whereClause+` AND difficulty = 'EASY' ORDER BY RANDOM() LIMIT $`+strconv.Itoa(argN), append(args, easyCount)...)
	if err != nil {
		return nil, err
	}
	for rows.Next() {
		var id uuid.UUID
		rows.Scan(&id)
		allIDs = append(allIDs, id)
	}
	rows.Close()

	rows, err = r.pool.Query(ctx, `SELECT id FROM content_questions_full `+whereClause+` AND difficulty = 'MEDIUM' ORDER BY RANDOM() LIMIT $`+strconv.Itoa(argN), append(args, mediumCount)...)
	if err != nil {
		return nil, err
	}
	for rows.Next() {
		var id uuid.UUID
		rows.Scan(&id)
		allIDs = append(allIDs, id)
	}
	rows.Close()

	rows, err = r.pool.Query(ctx, `SELECT id FROM content_questions_full `+whereClause+` AND difficulty = 'HARD' ORDER BY RANDOM() LIMIT $`+strconv.Itoa(argN), append(args, hardCount)...)
	if err != nil {
		return nil, err
	}
	for rows.Next() {
		var id uuid.UUID
		rows.Scan(&id)
		allIDs = append(allIDs, id)
	}
	rows.Close()

	return allIDs, nil
}

// ========== EXAM SESSION QUESTIONS ==========

func (r *repository) AddSessionQuestions(ctx context.Context, sessionID uuid.UUID, questionIDs []uuid.UUID, shuffleQuestions, shuffleOptions bool) error {
	tx, err := r.pool.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)

	var examContentID uuid.UUID
	err = tx.QueryRow(ctx, `SELECT exam_content_id FROM content_exam_sessions WHERE id=$1`, sessionID).Scan(&examContentID)
	if err != nil {
		return err
	}

	for i, qid := range questionIDs {
		var eqID uuid.UUID
		err = tx.QueryRow(ctx, `SELECT id FROM content_exam_questions WHERE exam_content_id=$1 AND question_content_id=$2`, examContentID, qid).Scan(&eqID)
		if err != nil {
			return err
		}

		displayOrder := i + 1
		var optionOrder []byte
		if shuffleOptions {
			optRows, err := tx.Query(ctx, `SELECT id FROM content_question_options WHERE question_content_id=$1 ORDER BY RANDOM()`, qid)
			if err != nil {
				return err
			}
			var optIDs []uuid.UUID
			for optRows.Next() {
				var oid uuid.UUID
				optRows.Scan(&oid)
				optIDs = append(optIDs, oid)
			}
			optRows.Close()
			optionOrder, _ = json.Marshal(optIDs)
		}

		_, err = tx.Exec(ctx, `
			INSERT INTO content_exam_session_questions (id, session_id, exam_question_id, display_order, assigned_option_order)
			VALUES ($1,$2,$3,$4,$5)
		`, uuid.New(), sessionID, eqID, displayOrder, optionOrder)
		if err != nil {
			return err
		}
	}

	return tx.Commit(ctx)
}

// ========== EXAM ANALYTICS ==========

func (r *repository) GetExamAnalytics(ctx context.Context, examContentID uuid.UUID) (*ExamAnalytics, error) {
	a := &ExamAnalytics{}

	r.pool.QueryRow(ctx, `SELECT COUNT(*) FROM content_exam_participants WHERE exam_content_id=$1`, examContentID).Scan(&a.TotalParticipants)
	r.pool.QueryRow(ctx, `SELECT COUNT(*) FROM content_exam_sessions WHERE exam_content_id=$1`, examContentID).Scan(&a.TotalStarted)
	r.pool.QueryRow(ctx, `SELECT COUNT(*) FROM content_exam_sessions WHERE exam_content_id=$1 AND status IN ('FINISHED','TERMINATED')`, examContentID).Scan(&a.TotalFinished)
	r.pool.QueryRow(ctx, `SELECT COALESCE(AVG(total_score),0) FROM content_exam_attempts WHERE exam_content_id=$1`, examContentID).Scan(&a.AverageScore)
	r.pool.QueryRow(ctx, `SELECT COALESCE(MAX(total_score),0) FROM content_exam_attempts WHERE exam_content_id=$1`, examContentID).Scan(&a.HighestScore)
	r.pool.QueryRow(ctx, `SELECT COALESCE(MIN(total_score),0) FROM content_exam_attempts WHERE exam_content_id=$1`, examContentID).Scan(&a.LowestScore)

	var totalResults, passed int
	r.pool.QueryRow(ctx, `SELECT COUNT(*) FROM content_exam_attempts WHERE exam_content_id=$1`, examContentID).Scan(&totalResults)
	if totalResults > 0 {
		r.pool.QueryRow(ctx, `SELECT COUNT(*) FROM content_exam_attempts WHERE exam_content_id=$1 AND status='GRADED' AND total_score >= (SELECT passing_score FROM content_exams WHERE content_id=$1)`, examContentID).Scan(&passed)
		a.PassRate = float64(passed) / float64(totalResults) * 100
	}

	return a, nil
}

// ========== EXAM SUBJECT BLUEPRINTS ==========

func (r *repository) CreateExamSubjectBlueprint(ctx context.Context, esb *ExamSubjectBlueprint) error {
	esb.ID = uuid.New()
	esb.CreatedAt = time.Now()
	_, err := r.pool.Exec(ctx, `
		INSERT INTO content_exam_subject_blueprints (id, exam_content_id, subject_id, easy_count, medium_count, hard_count, created_at)
		VALUES ($1,$2,$3,$4,$5,$6,$7)
	`, esb.ID, esb.ExamContentID, esb.SubjectID, esb.EasyCount, esb.MediumCount, esb.HardCount, esb.CreatedAt)
	return err
}

func (r *repository) GetExamSubjectBlueprints(ctx context.Context, examContentID uuid.UUID) ([]ExamSubjectBlueprint, error) {
	rows, err := r.pool.Query(ctx, `
		SELECT id, exam_content_id, subject_id, easy_count, medium_count, hard_count, total_questions, created_at
		FROM content_exam_subject_blueprints WHERE exam_content_id = $1 ORDER BY subject_id
	`, examContentID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var blueprints []ExamSubjectBlueprint
	for rows.Next() {
		var esb ExamSubjectBlueprint
		if err := rows.Scan(&esb.ID, &esb.ExamContentID, &esb.SubjectID, &esb.EasyCount, &esb.MediumCount, &esb.HardCount, &esb.TotalQuestions, &esb.CreatedAt); err != nil {
			return nil, err
		}
		blueprints = append(blueprints, esb)
	}
	return blueprints, nil
}

func (r *repository) DeleteExamSubjectBlueprint(ctx context.Context, examContentID, subjectID uuid.UUID) error {
	_, err := r.pool.Exec(ctx, `DELETE FROM content_exam_subject_blueprints WHERE exam_content_id=$1 AND subject_id=$2`, examContentID, subjectID)
	return err
}

// ========== PRACTICE SETS ==========

func (r *repository) CreatePracticeSet(ctx context.Context, ps *PracticeSet) error {
	ps.ID = uuid.New()
	ps.CreatedAt = time.Now()
	_, err := r.pool.Exec(ctx, `
		INSERT INTO content_practice_sets (id, content_id, practice_content_id, questions_count, time_limit_seconds, created_at)
		VALUES ($1,$2,$3,$4,$5,$6)
	`, ps.ID, ps.ContentID, ps.PracticeContentID, ps.QuestionsCount, ps.TimeLimitSeconds, ps.CreatedAt)
	return err
}

func (r *repository) GetPracticeSet(ctx context.Context, contentID uuid.UUID) (*PracticeSet, error) {
	ps := &PracticeSet{}
	err := r.pool.QueryRow(ctx, `
		SELECT id, content_id, practice_content_id, questions_count, time_limit_seconds, created_at
		FROM content_practice_sets WHERE content_id = $1
	`, contentID).Scan(&ps.ID, &ps.ContentID, &ps.PracticeContentID, &ps.QuestionsCount, &ps.TimeLimitSeconds, &ps.CreatedAt)
	if err != nil {
		return nil, err
	}
	return ps, nil
}

func (r *repository) GetPracticeSetByPracticeContent(ctx context.Context, practiceContentID uuid.UUID) (*PracticeSet, error) {
	ps := &PracticeSet{}
	err := r.pool.QueryRow(ctx, `
		SELECT id, content_id, practice_content_id, questions_count, time_limit_seconds, created_at
		FROM content_practice_sets WHERE practice_content_id = $1
	`, practiceContentID).Scan(&ps.ID, &ps.ContentID, &ps.PracticeContentID, &ps.QuestionsCount, &ps.TimeLimitSeconds, &ps.CreatedAt)
	if err != nil {
		return nil, err
	}
	return ps, nil
}

func (r *repository) DeletePracticeSet(ctx context.Context, contentID uuid.UUID) error {
	_, err := r.pool.Exec(ctx, `DELETE FROM content_practice_sets WHERE content_id=$1`, contentID)
	return err
}

// ========== PRACTICE SESSIONS ==========

func (r *repository) CreatePracticeSession(ctx context.Context, ps *PracticeSession) error {
	ps.ID = uuid.New()
	ps.CreatedAt = time.Now()
	ps.StartedAt = time.Now()
	_, err := r.pool.Exec(ctx, `
		INSERT INTO content_practice_sessions (id, user_id, practice_set_id, subject_id, grade_id, tag_filter, status, started_at, created_at)
		VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
	`, ps.ID, ps.UserID, ps.PracticeSetID, ps.SubjectID, ps.GradeID, ps.TagFilter, ps.Status, ps.StartedAt, ps.CreatedAt)
	return err
}

func (r *repository) GetPracticeSession(ctx context.Context, sessionID uuid.UUID) (*PracticeSession, error) {
	ps := &PracticeSession{}
	err := r.pool.QueryRow(ctx, `
		SELECT id, user_id, practice_set_id, subject_id, grade_id, tag_filter, status, started_at, submitted_at, graded_at, total_score, max_score, time_spent_seconds, subject_breakdown, created_at
		FROM content_practice_sessions WHERE id = $1
	`, sessionID).Scan(&ps.ID, &ps.UserID, &ps.PracticeSetID, &ps.SubjectID, &ps.GradeID, &ps.TagFilter, &ps.Status, &ps.StartedAt, &ps.SubmittedAt, &ps.GradedAt, &ps.TotalScore, &ps.MaxScore, &ps.TimeSpentSeconds, &ps.SubjectBreakdown, &ps.CreatedAt)
	if err != nil {
		return nil, err
	}
	return ps, nil
}

func (r *repository) UpdatePracticeSession(ctx context.Context, ps *PracticeSession) error {
	_, err := r.pool.Exec(ctx, `
		UPDATE content_practice_sessions SET
			status = $1, submitted_at = $2, graded_at = $3,
			total_score = $4, max_score = $5, time_spent_seconds = $6,
			subject_breakdown = $7
		WHERE id = $8
	`, ps.Status, ps.SubmittedAt, ps.GradedAt, ps.TotalScore, ps.MaxScore, ps.TimeSpentSeconds, ps.SubjectBreakdown, ps.ID)
	return err
}

func (r *repository) GetUserPracticeSessions(ctx context.Context, userID uuid.UUID, limit, offset int) ([]PracticeSession, int, error) {
	var total int
	err := r.pool.QueryRow(ctx, `SELECT COUNT(*) FROM content_practice_sessions WHERE user_id=$1`, userID).Scan(&total)
	if err != nil {
		return nil, 0, err
	}

	rows, err := r.pool.Query(ctx, `
		SELECT id, user_id, practice_set_id, subject_id, grade_id, tag_filter, status, started_at, submitted_at, graded_at, total_score, max_score, time_spent_seconds, subject_breakdown, created_at
		FROM content_practice_sessions WHERE user_id=$1 ORDER BY created_at DESC LIMIT $2 OFFSET $3
	`, userID, limit, offset)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	var sessions []PracticeSession
	for rows.Next() {
		var ps PracticeSession
		if err := rows.Scan(&ps.ID, &ps.UserID, &ps.PracticeSetID, &ps.SubjectID, &ps.GradeID, &ps.TagFilter, &ps.Status, &ps.StartedAt, &ps.SubmittedAt, &ps.GradedAt, &ps.TotalScore, &ps.MaxScore, &ps.TimeSpentSeconds, &ps.SubjectBreakdown, &ps.CreatedAt); err != nil {
			return nil, 0, err
		}
		sessions = append(sessions, ps)
	}
	return sessions, total, nil
}

// ========== PRACTICE QUESTION SELECTION ==========

func (r *repository) GetQuestionsForPractice(ctx context.Context, subjectID, gradeID *uuid.UUID, tagFilter map[string]interface{}, count int) ([]uuid.UUID, error) {
	whereClause := `WHERE content_type = 'QUESTION' AND status = 'PUBLISHED'`
	args := []interface{}{}
	argN := 1

	if subjectID != nil {
		whereClause += fmt.Sprintf(` AND subject_id = $%d`, argN)
		args = append(args, *subjectID)
		argN++
	}
	if gradeID != nil {
		whereClause += fmt.Sprintf(` AND grade_id = $%d`, argN)
		args = append(args, *gradeID)
		argN++
	}

	// Tag filtering via question_tag_map (if tags table exists)
	if tagFilter != nil && len(tagFilter) > 0 {
		// Simplified: assume tagFilter has "tags" array and "operator" (AND/OR)
		// For now, use a basic approach - would need tags table for full implementation
	}

	query := fmt.Sprintf(`SELECT id FROM contents %s ORDER BY RANDOM() LIMIT $%d`, whereClause, argN)
	args = append(args, count)

	rows, err := r.pool.Query(ctx, query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var ids []uuid.UUID
	for rows.Next() {
		var id uuid.UUID
		if err := rows.Scan(&id); err != nil {
			return nil, err
		}
		ids = append(ids, id)
	}
	return ids, nil
}

func (r *repository) GetQuestionsForMaterialPractice(ctx context.Context, materialContentID uuid.UUID, count int) ([]uuid.UUID, error) {
	// Get the material's chapter_id, topic_id, lo_id to find related questions
	var chapterID, topicID, loID *uuid.UUID
	var gradeID, subjectID uuid.UUID

	err := r.pool.QueryRow(ctx, `
		SELECT grade_id, subject_id, chapter_id, topic_id, lo_id
		FROM contents WHERE id = $1
	`, materialContentID).Scan(&gradeID, &subjectID, &chapterID, &topicID, &loID)
	if err != nil {
		return nil, err
	}

	whereClause := `WHERE content_type = 'QUESTION' AND status = 'PUBLISHED' AND grade_id = $1 AND subject_id = $2`
	args := []interface{}{gradeID, subjectID}
	argN := 3

	if chapterID != nil {
		whereClause += fmt.Sprintf(` AND chapter_id = $%d`, argN)
		args = append(args, *chapterID)
		argN++
	}
	if topicID != nil {
		whereClause += fmt.Sprintf(` AND topic_id = $%d`, argN)
		args = append(args, *topicID)
		argN++
	}
	if loID != nil {
		whereClause += fmt.Sprintf(` AND lo_id = $%d`, argN)
		args = append(args, *loID)
		argN++
	}

	query := fmt.Sprintf(`SELECT id FROM contents %s ORDER BY RANDOM() LIMIT $%d`, whereClause, argN)
	args = append(args, count)

	rows, err := r.pool.Query(ctx, query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var ids []uuid.UUID
	for rows.Next() {
		var id uuid.UUID
		if err := rows.Scan(&id); err != nil {
			return nil, err
		}
		ids = append(ids, id)
	}
	return ids, nil
}

// ========== PRACTICE QUESTION SELECTION (Extended) ==========

func (r *repository) AddSessionQuestionsWithSubject(ctx context.Context, sessionID uuid.UUID, questionIDs []uuid.UUID, shuffleQuestions, shuffleOptions bool) error {
	tx, err := r.pool.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)

	// Get exam_content_id from the attempt
	var examContentID uuid.UUID
	err = tx.QueryRow(ctx, `SELECT exam_content_id FROM content_exam_attempts WHERE id=$1`, sessionID).Scan(&examContentID)
	if err != nil {
		return err
	}

	for i, qid := range questionIDs {
		var eqID uuid.UUID
		var subjectID *uuid.UUID

		// Get exam_question id and subject_id from contents
		err = tx.QueryRow(ctx, `
			SELECT eq.id, c.subject_id
			FROM content_exam_questions eq
			JOIN contents c ON eq.question_content_id = c.id
			WHERE eq.exam_content_id = $1
			AND eq.question_content_id = $2
		`, examContentID, qid).Scan(&eqID, &subjectID)
		if err != nil {
			return err
		}

		displayOrder := i + 1
		var optionOrder []byte
		if shuffleOptions {
			optRows, err := tx.Query(ctx, `SELECT id FROM content_question_options WHERE question_content_id=$1 ORDER BY RANDOM()`, qid)
			if err != nil {
				return err
			}
			var optIDs []uuid.UUID
			for optRows.Next() {
				var oid uuid.UUID
				optRows.Scan(&oid)
				optIDs = append(optIDs, oid)
			}
			optRows.Close()
			optionOrder, _ = json.Marshal(optIDs)
		}

		_, err = tx.Exec(ctx, `
			INSERT INTO content_exam_session_questions (id, session_id, exam_question_id, display_order, assigned_option_order, subject_id)
			VALUES ($1,$2,$3,$4,$5,$6)
		`, uuid.New(), sessionID, eqID, displayOrder, optionOrder, subjectID)
		if err != nil {
			return err
		}
	}

	return tx.Commit(ctx)
}

func (r *repository) GetSubjectName(ctx context.Context, subjectID uuid.UUID) (string, error) {
	var name string
	err := r.pool.QueryRow(ctx, `SELECT name FROM subjects WHERE id = $1`, subjectID).Scan(&name)
	if err != nil {
		return "", err
	}
	return name, nil
}

func (r *repository) GetQuestionSubject(ctx context.Context, questionContentID uuid.UUID) (uuid.UUID, error) {
	var subjectID uuid.UUID
	err := r.pool.QueryRow(ctx, `SELECT subject_id FROM contents WHERE id = $1`, questionContentID).Scan(&subjectID)
	if err != nil {
		return uuid.Nil, err
	}
	return subjectID, nil
}
