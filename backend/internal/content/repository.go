package content

import (
	"context"
	"database/sql"
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

	// MATERIAL masters live in content.material (new schema); EXAM masters live
	// in cbt.exam. Question rows stay on the legacy `contents` insert until the
	// question migration lands.
	if c.ContentType == ContentTypeMaterial {
		return r.createMaterialContent(ctx, c)
	}
	if c.ContentType == ContentTypeExam {
		return r.createExamContent(ctx, c)
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
	if f, ok := c.Metadata["content_format"]; ok {
		var format string
		switch v := f.(type) {
		case MaterialFormat:
			format = string(v)
		case string:
			format = v
		}
		if t, ok := types[format]; ok {
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

	// published_at is only written on an explicit status transition: set on
	// PUBLISHED, cleared when leaving PUBLISHED, untouched on nil-status edits.
	sets := []string{"title = COALESCE($2, title)", "summary = COALESCE($3, summary)", "status_id = COALESCE($4, status_id)"}
	args := []interface{}{id, req.Title, req.Body, statusID}
	argN := 5
	if req.Status != nil {
		sets = append(sets, fmt.Sprintf("published_at = $%d", argN))
		if *req.Status == StatusPublished {
			if req.PublishedAt != nil {
				args = append(args, *req.PublishedAt)
			} else {
				args = append(args, time.Now())
			}
		} else {
			args = append(args, nil)
		}
		argN++
	}
	sets = append(sets, "updated_at = NOW()")

	if _, err := tx.Exec(ctx, fmt.Sprintf("UPDATE content.material SET %s WHERE id = $1", strings.Join(sets, ", ")), args...); err != nil {
		return err
	}

	// Rebuild junctions on an academic-field edit; preserve the existing grade
	// link (UpdateContentReq carries no GradeID, so read it before clearing).
	if req.SubjectID != nil || req.ChapterID != nil || req.TopicID != nil {
		var curGrade uuid.UUID
		_ = tx.QueryRow(ctx, `
			SELECT COALESCE(gr.grade_id, '00000000-0000-0000-0000-000000000000')
			FROM (SELECT grade_id FROM content.material_grade WHERE material_id = $1 LIMIT 1) gr`, id).Scan(&curGrade)

		if err := r.clearMaterialJunctions(ctx, tx, id); err != nil {
			return err
		}
		if err := r.insertMaterialJunctions(ctx, tx, id, &Content{
			SubjectID: ptrUUIDOrNil(req.SubjectID),
			GradeID:   curGrade,
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
	// EXAM masters live in cbt.exam; project them back into the Content shape.
	var isExam bool
	if err := r.pool.QueryRow(ctx, `SELECT EXISTS (SELECT 1 FROM cbt.exam WHERE id = $1 AND deleted_at IS NULL)`, id).Scan(&isExam); err == nil && isExam {
		c := &Content{}
		var meta map[string]interface{}
		err := r.pool.QueryRow(ctx, `
			SELECT m.id, 'EXAM',
			       COALESCE(gr.grade_id, '00000000-0000-0000-0000-000000000000')::uuid,
			       COALESCE(subj.subject_id, '00000000-0000-0000-0000-000000000000')::uuid,
			       ch.chapter_id, tp.topic_id, NULL::uuid, m.title,
			       COALESCE(m.description, '')::text, COALESCE(st.code, 'DRAFT')::text, m.owner_id,
			       NULL::jsonb, NULL::timestamptz, m.created_at, m.updated_at
			FROM cbt.exam m
			LEFT JOIN cbt.exam_status st ON st.id = m.status_id
			LEFT JOIN LATERAL (SELECT grade_id FROM cbt.exam_grade WHERE exam_id = m.id LIMIT 1) gr ON true
			LEFT JOIN LATERAL (SELECT subject_id FROM cbt.exam_subject WHERE exam_id = m.id LIMIT 1) subj ON true
			LEFT JOIN LATERAL (SELECT chapter_id FROM cbt.exam_chapter WHERE exam_id = m.id LIMIT 1) ch ON true
			LEFT JOIN LATERAL (SELECT topic_id FROM cbt.exam_topic WHERE exam_id = m.id LIMIT 1) tp ON true
			WHERE m.id = $1`, id).Scan(
			&c.ID, &c.ContentType, &c.GradeID, &c.SubjectID, &c.ChapterID, &c.TopicID, &c.LOID,
			&c.Title, &c.Body, &c.Status, &c.CreatedBy, &meta, &c.PublishedAt, &c.CreatedAt, &c.UpdatedAt)
		if err != nil {
			return nil, err
		}
		if len(meta) > 0 {
			c.Metadata = meta
		}
		return c, nil
	}

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

	// EXAM masters update against cbt.exam.
	var isExam bool
	if err := r.pool.QueryRow(ctx, `SELECT EXISTS (SELECT 1 FROM cbt.exam WHERE id = $1 AND deleted_at IS NULL)`, id).Scan(&isExam); err == nil && isExam {
		return r.updateExamContent(ctx, id, req)
	}

	sets = append(sets, "updated_at = NOW()")
	args = append(args, id)

	query := fmt.Sprintf("UPDATE contents SET %s WHERE id = $%d", strings.Join(sets, ", "), argN)
	_, err := r.pool.Exec(ctx, query, args...)
	return err
}

func (r *repository) DeleteContent(ctx context.Context, id uuid.UUID) error {
	// Route deletes for content.material masters to the new-schema soft-delete;
	// the legacy `contents` DELETE below keeps serving question/exam rows.
	var isMaterial bool
	if err := r.pool.QueryRow(ctx, `SELECT EXISTS (SELECT 1 FROM content.material WHERE id = $1)`, id).Scan(&isMaterial); err == nil && isMaterial {
		return r.DeleteMaterial(ctx, id)
	}

	// EXAM masters soft-delete against cbt.exam.
	var isExam bool
	if err := r.pool.QueryRow(ctx, `SELECT EXISTS (SELECT 1 FROM cbt.exam WHERE id = $1)`, id).Scan(&isExam); err == nil && isExam {
		return r.softDeleteExam(ctx, id)
	}
	_, err := r.pool.Exec(ctx, `DELETE FROM contents WHERE id = $1`, id)
	return err
}

func (r *repository) GetUserGradeID(ctx context.Context, userID uuid.UUID) (*uuid.UUID, error) {
	var gradeID *uuid.UUID
	err := r.pool.QueryRow(ctx, `
		SELECT grade_id FROM academic.student_enrollment
		WHERE student_id = $1 AND status = 'ACTIVE'
		ORDER BY updated_at DESC LIMIT 1`, userID).Scan(&gradeID)
	if err == pgx.ErrNoRows {
		return nil, nil
	}
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
		INSERT INTO content.learning_progress (id, student_id, material_id, progress_percent, last_position, completed, completed_at, created_at, updated_at)
		VALUES ($1,$2,$3,$4,$5,$6, CASE WHEN $6 THEN NOW() ELSE NULL END, NOW(), NOW())
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

// ensureExamStatuses idempotently seeds the cbt.exam_status lookup rows and
// returns a code->id map. Safe to call on every write.
func (r *repository) ensureExamStatuses(ctx context.Context, tx pgx.Tx) (map[string]uuid.UUID, error) {
	rows := [][2]string{
		{"DRAFT", "Draft"},
		{"REVIEW", "In Review"},
		{"APPROVED", "Approved"},
		{"PUBLISHED", "Published"},
		{"ARCHIVED", "Archived"},
	}
	for _, s := range rows {
		if _, err := tx.Exec(ctx, `INSERT INTO cbt.exam_status (code, name) VALUES ($1, $2) ON CONFLICT (code) DO NOTHING`, s[0], s[1]); err != nil {
			return nil, err
		}
	}
	statuses := map[string]uuid.UUID{}
	rws, err := tx.Query(ctx, `SELECT code, id FROM cbt.exam_status WHERE code = ANY($1)`,
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

// linkExamJunction inserts an N:M row only when the referenced academic row
// exists, so an empty academic catalog degrades gracefully.
func (r *repository) linkExamJunction(ctx context.Context, tx pgx.Tx, junction, refTable, refCol string, examID, refID uuid.UUID) error {
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
	_, err := tx.Exec(ctx, `INSERT INTO cbt.`+junction+` (exam_id, `+refCol+`) VALUES ($1, $2)`, examID, refID)
	return err
}

func (r *repository) insertExamJunctions(ctx context.Context, tx pgx.Tx, examID uuid.UUID, c *Content) error {
	link := func(junction, refTable, refCol string, refID uuid.UUID) error {
		return r.linkExamJunction(ctx, tx, junction, refTable, refCol, examID, refID)
	}
	if err := link("exam_subject", "academic.subject", "subject_id", c.SubjectID); err != nil {
		return err
	}
	if err := link("exam_grade", "academic.grade", "grade_id", c.GradeID); err != nil {
		return err
	}
	if c.ChapterID != nil {
		if err := link("exam_chapter", "academic.chapter", "chapter_id", *c.ChapterID); err != nil {
			return err
		}
	}
	if c.TopicID != nil {
		if err := link("exam_topic", "academic.topic", "topic_id", *c.TopicID); err != nil {
			return err
		}
	}
	return nil
}

func (r *repository) clearExamJunctions(ctx context.Context, tx pgx.Tx, examID uuid.UUID) error {
	for _, t := range []string{"exam_subject", "exam_grade", "exam_chapter", "exam_topic"} {
		if _, err := tx.Exec(ctx, `DELETE FROM cbt.`+t+` WHERE exam_id = $1`, examID); err != nil {
			return err
		}
	}
	return nil
}

// createExamContent creates the cbt.exam master plus its academic junctions in
// one transaction. The exam_metadata row is written by CreateExam.
func (r *repository) createExamContent(ctx context.Context, c *Content) error {
	tx, err := r.pool.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)

	statuses, err := r.ensureExamStatuses(ctx, tx)
	if err != nil {
		return err
	}
	statusID := statuses[string(c.Status)]
	if statusID == uuid.Nil {
		statusID = statuses[string(StatusDraft)]
	}

	code := "exm_" + strings.ReplaceAll(uuid.NewString(), "-", "")[:12]
	_, err = tx.Exec(ctx, `
		INSERT INTO cbt.exam (id, exam_code, title, description, exam_type, status_id, owner_id, created_by)
		VALUES ($1, $2, $3, $4, 'CBT', $5, $6, $7)`,
		c.ID, code, c.Title, c.Body, statusID, c.CreatedBy, c.CreatedBy)
	if err != nil {
		return err
	}
	if err := r.insertExamJunctions(ctx, tx, c.ID, c); err != nil {
		return err
	}
	return tx.Commit(ctx)
}

// updateExamContent updates master-level fields and junctions for a cbt.exam
// row. The metadata/randomization refresh lives in UpdateExam.
func (r *repository) updateExamContent(ctx context.Context, id uuid.UUID, req UpdateContentReq) error {
	tx, err := r.pool.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)

	statuses, err := r.ensureExamStatuses(ctx, tx)
	if err != nil {
		return err
	}
	var statusID *uuid.UUID
	if req.Status != nil {
		if sid, ok := statuses[string(*req.Status)]; ok && sid != uuid.Nil {
			statusID = &sid
		}
	}

	sets := []string{"title = COALESCE($2, title)", "description = COALESCE($3, description)", "status_id = COALESCE($4, status_id)", "updated_at = NOW()"}
	args := []interface{}{id, req.Title, req.Body, statusID}
	if _, err := tx.Exec(ctx, fmt.Sprintf("UPDATE cbt.exam SET %s WHERE id = $1 AND deleted_at IS NULL", strings.Join(sets, ", ")), args...); err != nil {
		return err
	}

	if req.SubjectID != nil || req.ChapterID != nil || req.TopicID != nil {
		var curGrade uuid.UUID
		_ = tx.QueryRow(ctx, `
			SELECT COALESCE(gr.grade_id, '00000000-0000-0000-0000-000000000000')
			FROM (SELECT grade_id FROM cbt.exam_grade WHERE exam_id = $1 LIMIT 1) gr`, id).Scan(&curGrade)
		if err := r.clearExamJunctions(ctx, tx, id); err != nil {
			return err
		}
		if err := r.insertExamJunctions(ctx, tx, id, &Content{
			SubjectID: ptrUUIDOrNil(req.SubjectID),
			GradeID:   curGrade,
			ChapterID: req.ChapterID,
			TopicID:   req.TopicID,
		}); err != nil {
			return err
		}
	}
	return tx.Commit(ctx)
}

func (r *repository) softDeleteExam(ctx context.Context, contentID uuid.UUID) error {
	tag, err := r.pool.Exec(ctx, `UPDATE cbt.exam SET deleted_at = NOW() WHERE id = $1 AND deleted_at IS NULL`, contentID)
	if err != nil {
		return err
	}
	if tag.RowsAffected() == 0 {
		return pgx.ErrNoRows
	}
	return nil
}

// examColumns projects a cbt.exam master plus its status, metadata,
// randomization, schedule and academic junctions into the ExamFull shape.
const examColumns = `
	m.id,
	'EXAM'::text,
	COALESCE(gr.grade_id, '00000000-0000-0000-0000-000000000000')::uuid,
	COALESCE(subj.subject_id, '00000000-0000-0000-0000-000000000000')::uuid,
	ch.chapter_id,
	tp.topic_id,
	NULL::uuid,
	m.title,
	COALESCE(m.description, '')::text,
	COALESCE(st.code, 'DRAFT')::text,
	COALESCE(m.owner_id, '00000000-0000-0000-0000-000000000000')::uuid,
	NULL::jsonb,
	NULL::timestamptz,
	m.created_at,
	m.updated_at,
	COALESCE(m.description, '')::text,
	COALESCE(md.duration_minute, 0),
	COALESCE(md.passing_score, 0),
	COALESCE(rz.random_question, false),
	COALESCE(rz.random_option, false),
	1::int,
	sch.start_time,
	sch.end_time,
	'{}'::jsonb`

const examFrom = `
	FROM cbt.exam m
	LEFT JOIN cbt.exam_status st ON st.id = m.status_id
	LEFT JOIN cbt.exam_metadata md ON md.exam_id = m.id
	LEFT JOIN cbt.exam_randomization rz ON rz.exam_id = m.id
	LEFT JOIN LATERAL (SELECT start_time, end_time FROM cbt.exam_schedule WHERE exam_id = m.id ORDER BY created_at DESC LIMIT 1) sch ON true
	LEFT JOIN LATERAL (SELECT subject_id FROM cbt.exam_subject WHERE exam_id = m.id LIMIT 1) subj ON true
	LEFT JOIN LATERAL (SELECT grade_id FROM cbt.exam_grade WHERE exam_id = m.id LIMIT 1) gr ON true
	LEFT JOIN LATERAL (SELECT chapter_id FROM cbt.exam_chapter WHERE exam_id = m.id LIMIT 1) ch ON true
	LEFT JOIN LATERAL (SELECT topic_id FROM cbt.exam_topic WHERE exam_id = m.id LIMIT 1) tp ON true`

func scanExam(row pgx.Row) (*ExamFull, error) {
	e := &ExamFull{}
	var meta map[string]interface{}
	if err := row.Scan(
		&e.Content.ID, &e.Content.ContentType, &e.Content.GradeID, &e.Content.SubjectID, &e.Content.ChapterID, &e.Content.TopicID, &e.Content.LOID, &e.Content.Title, &e.Content.Body, &e.Content.Status, &e.Content.CreatedBy, &meta, &e.Content.PublishedAt, &e.Content.CreatedAt, &e.Content.UpdatedAt,
		&e.Exam.Description, &e.Exam.DurationMinutes, &e.Exam.PassingScore, &e.Exam.ShuffleQuestions, &e.Exam.ShuffleOptions, &e.Exam.MaxAttempts, &e.Exam.StartTime, &e.Exam.EndTime, &e.Exam.Blueprint,
	); err != nil {
		return nil, err
	}
	if len(meta) > 0 {
		e.Content.Metadata = meta
	}
	return e, nil
}

func (r *repository) loadExamQuestions(ctx context.Context, examID uuid.UUID) ([]ExamQuestion, error) {
	rows, err := r.pool.Query(ctx, `
		SELECT pq.id, p.exam_id, pq.question_id, qs.subject_id, pq.question_order, pq.score, pq.created_at
		FROM cbt.exam_package_question pq
		JOIN cbt.exam_package p ON p.id = pq.package_id
		LEFT JOIN LATERAL (SELECT subject_id FROM question.question_subject WHERE question_id = pq.question_id LIMIT 1) qs ON true
		WHERE p.exam_id = $1 ORDER BY pq.question_order`, examID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var list []ExamQuestion
	for rows.Next() {
		var q ExamQuestion
		if err := rows.Scan(&q.ID, &q.ExamContentID, &q.QuestionContentID, &q.SubjectID, &q.DisplayOrder, &q.Points, &q.CreatedAt); err != nil {
			return nil, err
		}
		list = append(list, q)
	}
	return list, rows.Err()
}

func (r *repository) loadExamBlueprint(ctx context.Context, examID uuid.UUID) (*ExamBlueprint, error) {
	var bpID *uuid.UUID
	var createdAt *time.Time
	var n, easy, medium, hard int
	err := r.pool.QueryRow(ctx, `
		SELECT (SELECT id FROM cbt.exam_question_pool WHERE exam_id = $1 AND subject_id IS NULL ORDER BY created_at LIMIT 1),
		       MIN(created_at), COUNT(*),
		       COALESCE(SUM(total_question) FILTER (WHERE difficulty = 'EASY'), 0),
		       COALESCE(SUM(total_question) FILTER (WHERE difficulty = 'MEDIUM'), 0),
		       COALESCE(SUM(total_question) FILTER (WHERE difficulty = 'HARD'), 0)
		FROM cbt.exam_question_pool WHERE exam_id = $1 AND subject_id IS NULL`, examID).Scan(&bpID, &createdAt, &n, &easy, &medium, &hard)
	if err != nil {
		return nil, err
	}
	if n == 0 {
		return nil, nil
	}
	bp := &ExamBlueprint{
		ID:             *bpID,
		ExamContentID:  examID,
		EasyCount:      easy,
		MediumCount:    medium,
		HardCount:      hard,
		TotalQuestions: easy + medium + hard,
	}
	if createdAt != nil {
		bp.CreatedAt = *createdAt
	}
	return bp, nil
}

func (r *repository) CreateExam(ctx context.Context, e *Exam) error {
	tx, err := r.pool.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)

	// cbt.exam_metadata carries the authored duration/score/flags; shuffle
	// flags land on cbt.exam_randomization (max_attempts has no cbt column and
	// is dropped). Blueprint is dropped here: exam_question_pool (via the
	// explicit blueprint methods) is the source of truth.
	_, err = tx.Exec(ctx, `
		INSERT INTO cbt.exam_metadata (exam_id, duration_minute, passing_score, certificate, negative_marking, show_result, show_answer)
		VALUES ($1, $2, $3, false, $4, true, false)
		ON CONFLICT (exam_id) DO UPDATE SET
			duration_minute = CASE WHEN EXCLUDED.duration_minute > 0 THEN EXCLUDED.duration_minute ELSE cbt.exam_metadata.duration_minute END,
			passing_score = CASE WHEN EXCLUDED.passing_score > 0 THEN EXCLUDED.passing_score ELSE cbt.exam_metadata.passing_score END,
			negative_marking = EXCLUDED.negative_marking`,
		e.ContentID, e.DurationMinutes, e.PassingScore, e.NegativeMarking > 0)
	if err != nil {
		return err
	}
	_, err = tx.Exec(ctx, `
		INSERT INTO cbt.exam_randomization (exam_id, random_question, random_option)
		VALUES ($1, $2, $3)
		ON CONFLICT (exam_id) DO UPDATE SET
			random_question = EXCLUDED.random_question,
			random_option = EXCLUDED.random_option`,
		e.ContentID, e.ShuffleQuestions, e.ShuffleOptions)
	if err != nil {
		return err
	}
	return tx.Commit(ctx)
}

func (r *repository) GetExam(ctx context.Context, contentID uuid.UUID) (*ExamFull, error) {
	e, err := scanExam(r.pool.QueryRow(ctx, `SELECT `+examColumns+examFrom+` WHERE m.id = $1 AND m.deleted_at IS NULL`, contentID))
	if err != nil {
		return nil, err
	}
	qs, err := r.loadExamQuestions(ctx, contentID)
	if err != nil {
		return nil, err
	}
	e.Questions = qs
	bp, err := r.loadExamBlueprint(ctx, contentID)
	if err != nil {
		return nil, err
	}
	e.Blueprint = bp
	return e, nil
}

func (r *repository) UpdateExam(ctx context.Context, contentID uuid.UUID, e *Exam) error {
	tx, err := r.pool.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)

	_, err = tx.Exec(ctx, `
		INSERT INTO cbt.exam_metadata (exam_id, duration_minute, passing_score, negative_marking)
		VALUES ($1, $2, $3, $4)
		ON CONFLICT (exam_id) DO UPDATE SET
			duration_minute = CASE WHEN EXCLUDED.duration_minute > 0 THEN EXCLUDED.duration_minute ELSE cbt.exam_metadata.duration_minute END,
			passing_score = CASE WHEN EXCLUDED.passing_score > 0 THEN EXCLUDED.passing_score ELSE cbt.exam_metadata.passing_score END,
			negative_marking = CASE WHEN $4 THEN $4 ELSE cbt.exam_metadata.negative_marking END`,
		contentID, e.DurationMinutes, e.PassingScore, e.NegativeMarking > 0)
	if err != nil {
		return err
	}
	_, err = tx.Exec(ctx, `
		INSERT INTO cbt.exam_randomization (exam_id, random_question, random_option)
		VALUES ($1, $2, $3)
		ON CONFLICT (exam_id) DO UPDATE SET
			random_question = EXCLUDED.random_question,
			random_option = EXCLUDED.random_option`,
		contentID, e.ShuffleQuestions, e.ShuffleOptions)
	if err != nil {
		return err
	}
	return tx.Commit(ctx)
}

func (r *repository) DeleteExam(ctx context.Context, contentID uuid.UUID) error {
	return r.softDeleteExam(ctx, contentID)
}

func (r *repository) ListExams(ctx context.Context, filter ExamFilter) ([]ExamFull, int, error) {
	where := " WHERE m.deleted_at IS NULL"
	args := []interface{}{}
	argN := 1

	if filter.GradeID != nil && *filter.GradeID != uuid.Nil {
		// Match exact grade, ungraded exams, and exams whose grade shares the
		// same education level (legacy ListExams semantics).
		where += fmt.Sprintf(` AND (gr.grade_id = $%d OR gr.grade_id IS NULL OR gr.grade_id IN (
			SELECT g.id FROM academic.grade g
			WHERE g.education_level_id = (SELECT g2.education_level_id FROM academic.grade g2 WHERE g2.id = $%d)))`, argN, argN)
		args = append(args, *filter.GradeID)
		argN++
	}
	if filter.SubjectID != nil && *filter.SubjectID != uuid.Nil {
		where += fmt.Sprintf(" AND subj.subject_id = $%d", argN)
		args = append(args, *filter.SubjectID)
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
		where += fmt.Sprintf(" AND (m.title ILIKE $%d OR COALESCE(m.description, '') ILIKE $%d)", argN, argN)
		args = append(args, "%"+filter.Search+"%")
		argN++
	}

	var total int
	if err := r.pool.QueryRow(ctx, "SELECT COUNT(*) "+examFrom+where, args...).Scan(&total); err != nil {
		return nil, 0, err
	}

	limit := filter.Limit
	if limit <= 0 {
		limit = 20
	}
	offset := filter.Offset

	query := fmt.Sprintf("SELECT "+examColumns+examFrom+where+
		" ORDER BY m.created_at DESC LIMIT $%d OFFSET $%d", argN, argN+1)
	args = append(args, limit, offset)

	rows, err := r.pool.Query(ctx, query, args...)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	var exams []ExamFull
	for rows.Next() {
		e, err := scanExam(rows)
		if err != nil {
			return nil, 0, err
		}
		exams = append(exams, *e)
	}
	return exams, total, rows.Err()
}

// ========== EXAM QUESTIONS ==========

func (r *repository) AddExamQuestion(ctx context.Context, eq *ExamQuestion) error {
	tx, err := r.pool.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)

	var packageID uuid.UUID
	if err := tx.QueryRow(ctx, `
		INSERT INTO cbt.exam_package (exam_id, name) VALUES ($1, 'default')
		ON CONFLICT (exam_id, name) DO UPDATE SET name = EXCLUDED.name
		RETURNING id`, eq.ExamContentID).Scan(&packageID); err != nil {
		return err
	}

	nextOrder := eq.DisplayOrder
	if nextOrder <= 0 {
		if err := tx.QueryRow(ctx, `SELECT COALESCE(MAX(question_order) + 1, 0) FROM cbt.exam_package_question WHERE package_id = $1`, packageID).Scan(&nextOrder); err != nil {
			return err
		}
	}

	var id uuid.UUID
	var created time.Time
	if err := tx.QueryRow(ctx, `
		INSERT INTO cbt.exam_package_question (package_id, question_id, question_order, score)
		VALUES ($1, $2, $3, $4)
		ON CONFLICT (package_id, question_id) DO UPDATE SET
			question_order = EXCLUDED.question_order,
			score = EXCLUDED.score
		RETURNING id, created_at`, packageID, eq.QuestionContentID, nextOrder, eq.Points).Scan(&id, &created); err != nil {
		return err
	}
	eq.ID = id
	eq.DisplayOrder = nextOrder
	eq.CreatedAt = created
	return tx.Commit(ctx)
}

func (r *repository) RemoveExamQuestion(ctx context.Context, examContentID, questionContentID uuid.UUID) error {
	_, err := r.pool.Exec(ctx, `
		DELETE FROM cbt.exam_package_question pq
		USING cbt.exam_package p
		WHERE pq.package_id = p.id AND p.exam_id = $1 AND pq.question_id = $2`, examContentID, questionContentID)
	return err
}

func (r *repository) GetExamQuestions(ctx context.Context, examContentID uuid.UUID) ([]ExamQuestion, error) {
	return r.loadExamQuestions(ctx, examContentID)
}

func (r *repository) ReorderExamQuestions(ctx context.Context, examContentID uuid.UUID, questionIDs []uuid.UUID) error {
	tx, err := r.pool.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)

	for i, qID := range questionIDs {
		_, err = tx.Exec(ctx, `
			UPDATE cbt.exam_package_question pq SET question_order = $1
			FROM cbt.exam_package p
			WHERE pq.package_id = p.id AND p.exam_id = $2 AND pq.question_id = $3`, i, examContentID, qID)
		if err != nil {
			return err
		}
	}
	return tx.Commit(ctx)
}

// ========== EXAM BLUEPRINTS ==========

func (r *repository) CreateExamBlueprint(ctx context.Context, eb *ExamBlueprint) error {
	tx, err := r.pool.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)

	// Reset the exam-level pool rows (subject_id NULL) then insert one pool row
	// per difficulty bucket; exam_question_pool is the blueprint source of truth.
	if _, err := tx.Exec(ctx, `DELETE FROM cbt.exam_question_pool WHERE exam_id = $1 AND subject_id IS NULL`, eb.ExamContentID); err != nil {
		return err
	}
	buckets := []struct {
		diff string
		n    int
	}{
		{"EASY", eb.EasyCount},
		{"MEDIUM", eb.MediumCount},
		{"HARD", eb.HardCount},
	}
	for _, b := range buckets {
		if b.n <= 0 {
			continue
		}
		if _, err := tx.Exec(ctx, `
			INSERT INTO cbt.exam_question_pool (exam_id, subject_id, chapter_id, difficulty, total_question)
			VALUES ($1, NULL, NULL, $2, $3)`, eb.ExamContentID, b.diff, b.n); err != nil {
			return err
		}
	}
	eb.CreatedAt = time.Now()
	return tx.Commit(ctx)
}

func (r *repository) GetExamBlueprint(ctx context.Context, examContentID uuid.UUID) (*ExamBlueprint, error) {
	bp, err := r.loadExamBlueprint(ctx, examContentID)
	if err != nil {
		return nil, err
	}
	if bp == nil {
		return nil, pgx.ErrNoRows
	}
	return bp, nil
}

// ========== EXAM PARTICIPANTS ==========

func (r *repository) AddExamParticipant(ctx context.Context, ep *ExamParticipant) error {
	var id uuid.UUID
	var created time.Time
	if err := r.pool.QueryRow(ctx, `
		INSERT INTO cbt.exam_participant (exam_id, student_id, status)
		VALUES ($1, $2, 'REGISTER')
		ON CONFLICT (exam_id, student_id) DO UPDATE SET status = EXCLUDED.status
		RETURNING id, created_at`, ep.ExamContentID, ep.UserID).Scan(&id, &created); err != nil {
		return err
	}
	ep.ID = id
	ep.CreatedAt = created
	return nil
}

func (r *repository) RemoveExamParticipant(ctx context.Context, examContentID, userID uuid.UUID) error {
	_, err := r.pool.Exec(ctx, `DELETE FROM cbt.exam_participant WHERE exam_id = $1 AND student_id = $2`, examContentID, userID)
	return err
}

func (r *repository) GetExamParticipants(ctx context.Context, examContentID uuid.UUID) ([]ExamParticipant, error) {
	rows, err := r.pool.Query(ctx, `
		SELECT id, exam_id, student_id, created_at
		FROM cbt.exam_participant WHERE exam_id = $1 ORDER BY created_at`, examContentID)
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

// cbtAttemptStatus and legacyAttemptStatus define the bijection between the
// legacy ExamAttemptStatus set used by the engine (IN_PROGRESS/SUBMITTED/
// GRADED/EXPIRED) and the cbt.exam_attempt.status CHECK values.
func cbtAttemptStatus(s ExamAttemptStatus) string {
	switch s {
	case AttemptInProgress:
		return "STARTED"
	case AttemptSubmitted, AttemptExpired:
		return "SUBMITTED"
	case AttemptGraded:
		return "COMPLETED"
	default:
		return "STARTED"
	}
}

func legacyAttemptStatus(cbtStatus string) ExamAttemptStatus {
	switch cbtStatus {
	case "STARTED", "READY", "REGISTERED", "PAUSED", "RESUMED":
		return AttemptInProgress
	case "SUBMITTED", "GRADING":
		return AttemptSubmitted
	case "COMPLETED":
		return AttemptGraded
	default:
		return AttemptInProgress
	}
}

// findOrCreateParticipant resolves (exam_id, student_id) to a cbt.exam_participant
// row, creating one (status REGISTER) when absent.
func (r *repository) findOrCreateParticipant(ctx context.Context, tx pgx.Tx, examID, studentID uuid.UUID) (uuid.UUID, error) {
	var pid uuid.UUID
	if err := tx.QueryRow(ctx, `
		INSERT INTO cbt.exam_participant (exam_id, student_id, status)
		VALUES ($1, $2, 'REGISTER')
		ON CONFLICT (exam_id, student_id) DO UPDATE SET status = EXCLUDED.status
		RETURNING id`, examID, studentID).Scan(&pid); err != nil {
		return uuid.Nil, err
	}
	return pid, nil
}

func (r *repository) CreateExamAttempt(ctx context.Context, ea *ExamAttempt) error {
	ea.ID = uuid.New()
	ea.CreatedAt = time.Now()
	if ea.Status == "" {
		ea.Status = AttemptInProgress
	}

	tx, err := r.pool.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)

	pid, err := r.findOrCreateParticipant(ctx, tx, ea.ExamContentID, ea.UserID)
	if err != nil {
		return err
	}

	attemptNo := ea.AttemptNumber
	if attemptNo <= 0 {
		if err := tx.QueryRow(ctx, `
			SELECT COALESCE(MAX(attempt_no), 0) + 1 FROM cbt.exam_attempt WHERE participant_id = $1`, pid).Scan(&attemptNo); err != nil {
			return err
		}
		ea.AttemptNumber = attemptNo
	}

	startedAt := ea.StartedAt
	if startedAt.IsZero() {
		startedAt = ea.CreatedAt
	}

	_, err = tx.Exec(ctx, `
		INSERT INTO cbt.exam_attempt (id, participant_id, attempt_no, started_at, status, created_at)
		VALUES ($1, $2, $3, $4, $5, $6)`,
		ea.ID, pid, attemptNo, startedAt, cbtAttemptStatus(ea.Status), ea.CreatedAt)
	if err != nil {
		return err
	}
	ea.StartedAt = startedAt
	return tx.Commit(ctx)
}

// scanExamAttempt projects a cbt.exam_attempt row (joined to its participant
// and optional grading_result) back into the legacy ExamAttempt shape.
func scanExamAttempt(row pgx.Row) (*ExamAttempt, error) {
	ea := &ExamAttempt{}
	var pExamID, pStudent uuid.UUID
	var status string
	var startedAt, submittedAt, gCreated *time.Time
	var score sql.NullFloat64
	if err := row.Scan(&ea.ID, &pExamID, &pStudent, &ea.AttemptNumber, &status, &startedAt, &submittedAt, &gCreated, &score, &ea.CreatedAt); err != nil {
		return nil, err
	}
	ea.ExamContentID = pExamID
	ea.UserID = pStudent
	ea.Status = legacyAttemptStatus(status)
	if startedAt != nil {
		ea.StartedAt = *startedAt
	} else {
		ea.StartedAt = ea.CreatedAt
	}
	ea.SubmittedAt = submittedAt
	if gCreated != nil {
		ea.GradedAt = gCreated
	}
	if score.Valid {
		v := score.Float64
		ea.TotalScore = &v
	}
	return ea, nil
}

const examAttemptColumns = `
	a.id, p.exam_id, p.student_id, a.attempt_no, a.status, a.started_at, a.finished_at,
	g.created_at, g.score, a.created_at`

const examAttemptFrom = `
	FROM cbt.exam_attempt a
	JOIN cbt.exam_participant p ON p.id = a.participant_id
	LEFT JOIN cbt.grading_result g ON g.attempt_id = a.id`

func (r *repository) GetExamAttempt(ctx context.Context, attemptID uuid.UUID) (*ExamAttempt, error) {
	return scanExamAttempt(r.pool.QueryRow(ctx, `SELECT `+examAttemptColumns+examAttemptFrom+` WHERE a.id = $1`, attemptID))
}

// upsertGrading writes the cbt.grading_result row for an attempt. correct/
// wrong/blank are derived from recorded student_answers against each
// question's current correct-option labels; score comes from the caller.
func (r *repository) upsertGrading(ctx context.Context, tx pgx.Tx, attemptID uuid.UUID, totalScore *float64) error {
	var score float64
	if totalScore != nil {
		score = *totalScore
	}
	// passed compares score against the exam's passing_score (defaults to pass
	// when the exam defines none). Attempt → participant → exam → metadata.
	var passingScore *float64
	_ = tx.QueryRow(ctx, `
		SELECT md.passing_score
		FROM cbt.exam_attempt a
		JOIN cbt.exam_participant p ON p.id = a.participant_id
		JOIN cbt.exam_metadata md ON md.exam_id = p.exam_id
		WHERE a.id = $1`, attemptID).Scan(&passingScore)
	passed := true
	if passingScore != nil && *passingScore > 0 {
		passed = score >= *passingScore
	}

	var total, answered, correct int
	err := tx.QueryRow(ctx, `
		WITH aq AS (
			SELECT aq.question_id, sa.selected_option
			FROM cbt.attempt_question aq
			LEFT JOIN cbt.student_answer sa ON sa.attempt_question_id = aq.id
			WHERE aq.attempt_id = $1
		)
		SELECT
			COUNT(*),
			COUNT(*) FILTER (WHERE selected_option IS NOT NULL AND selected_option <> ''),
			COUNT(*) FILTER (WHERE selected_option IS NOT NULL AND selected_option <> ''
				AND selected_option = (
					SELECT string_agg(op.label, ',' ORDER BY op.display_order)
					FROM question.question q
					JOIN question.question_option op ON op.question_version_id = q.current_version_id AND op.is_correct
					WHERE q.id = aq.question_id))
		FROM aq`, attemptID).Scan(&total, &answered, &correct)
	if err != nil {
		return err
	}
	wrong := answered - correct
	blank := total - answered
	_, err = tx.Exec(ctx, `
		INSERT INTO cbt.grading_result (attempt_id, score, correct, wrong, blank, passed)
		VALUES ($1, $2, $3, $4, $5, $6)
		ON CONFLICT (attempt_id) DO UPDATE SET
			score = EXCLUDED.score,
			correct = EXCLUDED.correct,
			wrong = EXCLUDED.wrong,
			blank = EXCLUDED.blank,
			passed = EXCLUDED.passed`,
		attemptID, score, correct, wrong, blank, passed)
	return err
}

func (r *repository) UpdateExamAttempt(ctx context.Context, ea *ExamAttempt) error {
	tx, err := r.pool.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)

	_, err = tx.Exec(ctx, `
		UPDATE cbt.exam_attempt
		SET status = $1, finished_at = COALESCE($2, finished_at), updated_at = NOW()
		WHERE id = $3`,
		cbtAttemptStatus(ea.Status), ea.SubmittedAt, ea.ID)
	if err != nil {
		return err
	}

	// GRADED carries the grading_result write; other transitions (e.g. the
	// SUBMITTED step of SubmitAttempt) leave grading untouched.
	if ea.Status == AttemptGraded {
		if err := r.upsertGrading(ctx, tx, ea.ID, ea.TotalScore); err != nil {
			return err
		}
	}
	return tx.Commit(ctx)
}

func (r *repository) GetUserExamAttempts(ctx context.Context, examContentID, userID uuid.UUID) ([]ExamAttempt, error) {
	rows, err := r.pool.Query(ctx, `
		SELECT `+examAttemptColumns+examAttemptFrom+`
		WHERE p.exam_id = $1 AND p.student_id = $2
		ORDER BY a.attempt_no`, examContentID, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var attempts []ExamAttempt
	for rows.Next() {
		ea, err := scanExamAttempt(rows)
		if err != nil {
			return nil, err
		}
		attempts = append(attempts, *ea)
	}
	return attempts, rows.Err()
}

// ========== EXAM ANSWERS ==========

// optionIDsToLabels resolves a set of question_option ids into a
// display_order-sorted comma-label string, matching the string_agg used for
// grading so a recorded answer round-trips to the correct-option comparison.
func (r *repository) optionIDsToLabels(ctx context.Context, tx pgx.Tx, ids []uuid.UUID) (string, error) {
	filtered := make([]uuid.UUID, 0, len(ids))
	for _, id := range ids {
		if id != uuid.Nil {
			filtered = append(filtered, id)
		}
	}
	if len(filtered) == 0 {
		return "", nil
	}
	var labels string
	if err := tx.QueryRow(ctx, `
		SELECT string_agg(op.label, ',' ORDER BY op.display_order)
		FROM question.question_option op WHERE op.id = ANY($1)`, filtered).Scan(&labels); err != nil {
		return "", err
	}
	return labels, nil
}

// ensureAttemptQuestion resolves (attempt_id, question_id) to its
// cbt.attempt_question row, creating it (next display_order) when absent.
func (r *repository) ensureAttemptQuestion(ctx context.Context, tx pgx.Tx, attemptID, questionID uuid.UUID) (uuid.UUID, error) {
	var id uuid.UUID
	err := tx.QueryRow(ctx, `SELECT id FROM cbt.attempt_question WHERE attempt_id = $1 AND question_id = $2`, attemptID, questionID).Scan(&id)
	if err == nil {
		return id, nil
	}
	if err != pgx.ErrNoRows {
		return uuid.Nil, err
	}
	var next int
	if err := tx.QueryRow(ctx, `SELECT COALESCE(MAX(display_order), 0) + 1 FROM cbt.attempt_question WHERE attempt_id = $1`, attemptID).Scan(&next); err != nil {
		return uuid.Nil, err
	}
	id = uuid.New()
	if _, err := tx.Exec(ctx, `
		INSERT INTO cbt.attempt_question (id, attempt_id, question_id, display_order)
		VALUES ($1, $2, $3, $4)`, id, attemptID, questionID, next); err != nil {
		return uuid.Nil, err
	}
	return id, nil
}

func (r *repository) upsertStudentAnswer(ctx context.Context, tx pgx.Tx, ea *ExamAnswer, aqID uuid.UUID, labels string) error {
	answeredAt := ea.CreatedAt
	if answeredAt.IsZero() {
		answeredAt = time.Now()
	}
	_, err := tx.Exec(ctx, `
		INSERT INTO cbt.student_answer (id, attempt_question_id, selected_option, answered_at)
		VALUES ($1, $2, NULLIF($3, ''), $4)
		ON CONFLICT (attempt_question_id) DO UPDATE SET
			selected_option = NULLIF(EXCLUDED.selected_option, ''),
			answered_at = EXCLUDED.answered_at`,
		ea.ID, aqID, labels, answeredAt)
	return err
}

func (r *repository) CreateExamAnswer(ctx context.Context, ea *ExamAnswer) error {
	ea.ID = uuid.New()
	ea.CreatedAt = time.Now()

	tx, err := r.pool.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)

	aqID, err := r.ensureAttemptQuestion(ctx, tx, ea.AttemptID, ea.QuestionContentID)
	if err != nil {
		return err
	}
	labels, err := r.optionIDsToLabels(ctx, tx, ea.SelectedOptions)
	if err != nil {
		return err
	}
	if err := r.upsertStudentAnswer(ctx, tx, ea, aqID, labels); err != nil {
		return err
	}
	return tx.Commit(ctx)
}

func (r *repository) GetExamAnswers(ctx context.Context, attemptID uuid.UUID) ([]ExamAnswer, error) {
	rows, err := r.pool.Query(ctx, `
		SELECT sa.id, aq.attempt_id, aq.question_id, sa.selected_option, sa.answered_at
		FROM cbt.student_answer sa
		JOIN cbt.attempt_question aq ON aq.id = sa.attempt_question_id
		WHERE aq.attempt_id = $1
		ORDER BY aq.display_order`, attemptID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var answers []ExamAnswer
	var labels *string
	for rows.Next() {
		var ea ExamAnswer
		if err := rows.Scan(&ea.ID, &ea.AttemptID, &ea.QuestionContentID, &labels, &ea.CreatedAt); err != nil {
			return nil, err
		}
		if labels != nil && *labels != "" {
			ids, err := r.labelsToOptionIDs(ctx, ea.QuestionContentID, *labels)
			if err != nil {
				return nil, err
			}
			ea.SelectedOptions = ids
		}
		answers = append(answers, ea)
	}
	return answers, rows.Err()
}

// labelsToOptionIDs reverses a stored selected_option label string back into
// the question's option uuids (only those still present on the current version).
func (r *repository) labelsToOptionIDs(ctx context.Context, questionID uuid.UUID, labels string) ([]uuid.UUID, error) {
	split := strings.Split(labels, ",")
	var ids []uuid.UUID
	rows, err := r.pool.Query(ctx, `
		SELECT op.id FROM question.question q
		JOIN question.question_option op ON op.question_version_id = q.current_version_id
		WHERE q.id = $1 AND op.label = ANY($2)
		ORDER BY op.display_order`, questionID, split)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	for rows.Next() {
		var id uuid.UUID
		if err := rows.Scan(&id); err != nil {
			return nil, err
		}
		ids = append(ids, id)
	}
	return ids, rows.Err()
}

func (r *repository) UpdateExamAnswer(ctx context.Context, ea *ExamAnswer) error {
	tx, err := r.pool.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)

	labels, err := r.optionIDsToLabels(ctx, tx, ea.SelectedOptions)
	if err != nil {
		return err
	}
	answeredAt := time.Now()
	_, err = tx.Exec(ctx, `
		UPDATE cbt.student_answer SET selected_option = NULLIF($2, ''), answered_at = $3 WHERE id = $1`,
		ea.ID, labels, answeredAt)
	if err != nil {
		return err
	}
	return tx.Commit(ctx)
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
		aqID, err := r.ensureAttemptQuestion(ctx, tx, ea.AttemptID, ea.QuestionContentID)
		if err != nil {
			return err
		}
		labels, err := r.optionIDsToLabels(ctx, tx, ea.SelectedOptions)
		if err != nil {
			return err
		}
		if err := r.upsertStudentAnswer(ctx, tx, &ea, aqID, labels); err != nil {
			return err
		}
	}
	return tx.Commit(ctx)
}

// ========== QUESTION POOLS ==========

// TODO(2.4b-followup): CreateQuestionPool/GetQuestionPool/UpdateQuestionPool/
// DeleteQuestionPool still target the dropped legacy content_question_pools
// table (superseded by cbt.exam_question_pool; the engine treats a missing
// pool as nil and falls back to static exam questions). Keep compile-only.
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
	// Selection runs against published question.question rows linked to the
	// pool's subject (+ optional chapters) via the academic junctions, split
	// by the difficulty distribution in question_metadata.
	from := `
		FROM question.question q
		JOIN question.question_metadata m ON m.question_id = q.id
		WHERE q.deleted_at IS NULL
		  AND q.status_id = (SELECT id FROM question.question_status WHERE code = 'PUBLISHED')
		  AND EXISTS (SELECT 1 FROM question.question_subject qs WHERE qs.question_id = q.id AND qs.subject_id = $1)`
	args := []interface{}{pool.SubjectID}
	argN := 2

	if len(pool.ChapterIDs) > 0 {
		from += fmt.Sprintf(` AND EXISTS (SELECT 1 FROM question.question_chapter qc WHERE qc.question_id = q.id AND qc.chapter_id = ANY($%d))`, argN)
		args = append(args, pool.ChapterIDs)
		argN++
	}

	easyCount := pool.TotalPoolSize * pool.EasyPct / 100
	mediumCount := pool.TotalPoolSize * pool.MediumPct / 100
	hardCount := pool.TotalPoolSize - easyCount - mediumCount

	buckets := []struct {
		diff     string
		count    int
	}{
		{"EASY", easyCount},
		{"MEDIUM", mediumCount},
		{"HARD", hardCount},
	}

	var allIDs []uuid.UUID
	for _, b := range buckets {
		if b.count <= 0 {
			continue
		}
		rows, err := r.pool.Query(ctx,
			fmt.Sprintf(`SELECT q.id %s AND m.difficulty_level = $%d ORDER BY RANDOM() LIMIT $%d`, from, argN, argN+1),
			append(append([]interface{}{}, args...), b.diff, b.count)...)
		if err != nil {
			return nil, err
		}
		for rows.Next() {
			var id uuid.UUID
			if err := rows.Scan(&id); err != nil {
				rows.Close()
				return nil, err
			}
			allIDs = append(allIDs, id)
		}
		rows.Close()
	}
	return allIDs, nil
}

// ========== EXAM SESSION QUESTIONS ==========

// TODO(2.4b-followup): AddSessionQuestions still writes the dropped legacy
// content_exam_sessions / content_exam_session_questions. The new runtime
// models per-question rows in cbt.attempt_question (Batch 3). Keep compile-only.
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

	_ = r.pool.QueryRow(ctx, `SELECT COUNT(*) FROM cbt.exam_participant WHERE exam_id = $1`, examContentID).Scan(&a.TotalParticipants)
	_ = r.pool.QueryRow(ctx, `SELECT COUNT(*) FROM cbt.exam_attempt a JOIN cbt.exam_participant p ON p.id = a.participant_id WHERE p.exam_id = $1`, examContentID).Scan(&a.TotalStarted)
	_ = r.pool.QueryRow(ctx, `SELECT COUNT(*) FROM cbt.exam_attempt a JOIN cbt.exam_participant p ON p.id = a.participant_id WHERE p.exam_id = $1 AND a.status = 'COMPLETED'`, examContentID).Scan(&a.TotalFinished)

	var passed, total int
	rows, err := r.pool.Query(ctx, `
		SELECT g.passed
		FROM cbt.exam_attempt a
		JOIN cbt.exam_participant p ON p.id = a.participant_id
		JOIN cbt.grading_result g ON g.attempt_id = a.id
		WHERE p.exam_id = $1`, examContentID)
	if err == nil {
		for rows.Next() {
			var ok bool
			if err := rows.Scan(&ok); err != nil {
				continue
			}
			total++
			if ok {
				passed++
			}
		}
		rows.Close()
	}

	_ = r.pool.QueryRow(ctx, `SELECT COALESCE(ROUND(AVG(g.score)::numeric, 2), 0) FROM cbt.grading_result g
		JOIN cbt.exam_attempt a ON a.id = g.attempt_id
		JOIN cbt.exam_participant p ON p.id = a.participant_id WHERE p.exam_id = $1`, examContentID).Scan(&a.AverageScore)
	_ = r.pool.QueryRow(ctx, `SELECT COALESCE(MAX(g.score), 0) FROM cbt.grading_result g
		JOIN cbt.exam_attempt a ON a.id = g.attempt_id
		JOIN cbt.exam_participant p ON p.id = a.participant_id WHERE p.exam_id = $1`, examContentID).Scan(&a.HighestScore)
	_ = r.pool.QueryRow(ctx, `SELECT COALESCE(MIN(g.score), 0) FROM cbt.grading_result g
		JOIN cbt.exam_attempt a ON a.id = g.attempt_id
		JOIN cbt.exam_participant p ON p.id = a.participant_id WHERE p.exam_id = $1`, examContentID).Scan(&a.LowestScore)
	if total > 0 {
		a.PassRate = float64(passed) / float64(total) * 100
	}
	return a, nil
}

// ========== EXAM SUBJECT BLUEPRINTS ==========

func (r *repository) CreateExamSubjectBlueprint(ctx context.Context, esb *ExamSubjectBlueprint) error {
	tx, err := r.pool.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)

	if _, err := tx.Exec(ctx, `DELETE FROM cbt.exam_question_pool WHERE exam_id = $1 AND subject_id = $2`, esb.ExamContentID, esb.SubjectID); err != nil {
		return err
	}
	buckets := []struct {
		diff string
		n    int
	}{
		{"EASY", esb.EasyCount},
		{"MEDIUM", esb.MediumCount},
		{"HARD", esb.HardCount},
	}
	for _, b := range buckets {
		if b.n <= 0 {
			continue
		}
		if _, err := tx.Exec(ctx, `
			INSERT INTO cbt.exam_question_pool (exam_id, subject_id, difficulty, total_question)
			VALUES ($1, $2, $3, $4)`, esb.ExamContentID, esb.SubjectID, b.diff, b.n); err != nil {
			return err
		}
	}
	esb.CreatedAt = time.Now()
	return tx.Commit(ctx)
}

func (r *repository) GetExamSubjectBlueprints(ctx context.Context, examContentID uuid.UUID) ([]ExamSubjectBlueprint, error) {
	rows, err := r.pool.Query(ctx, `
		SELECT (SELECT id FROM cbt.exam_question_pool p2 WHERE p2.exam_id = $1 AND p2.subject_id = p1.subject_id ORDER BY p2.created_at LIMIT 1),
		       MIN(p1.created_at), p1.subject_id,
		       COALESCE(SUM(p1.total_question) FILTER (WHERE p1.difficulty = 'EASY'), 0),
		       COALESCE(SUM(p1.total_question) FILTER (WHERE p1.difficulty = 'MEDIUM'), 0),
		       COALESCE(SUM(p1.total_question) FILTER (WHERE p1.difficulty = 'HARD'), 0)
		FROM cbt.exam_question_pool p1
		WHERE p1.exam_id = $1 AND p1.subject_id IS NOT NULL
		GROUP BY p1.subject_id ORDER BY p1.subject_id`, examContentID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var blueprints []ExamSubjectBlueprint
	for rows.Next() {
		var b ExamSubjectBlueprint
		if err := rows.Scan(&b.ID, &b.CreatedAt, &b.SubjectID, &b.EasyCount, &b.MediumCount, &b.HardCount); err != nil {
			return nil, err
		}
		b.ExamContentID = examContentID
		b.TotalQuestions = b.EasyCount + b.MediumCount + b.HardCount
		blueprints = append(blueprints, b)
	}
	return blueprints, rows.Err()
}

func (r *repository) DeleteExamSubjectBlueprint(ctx context.Context, examContentID, subjectID uuid.UUID) error {
	_, err := r.pool.Exec(ctx, `DELETE FROM cbt.exam_question_pool WHERE exam_id=$1 AND subject_id=$2`, examContentID, subjectID)
	return err
}

// ========== PRACTICE SETS ==========

// The content.practice_set layout (migration 072) has a master+question stem
// but no per-set config columns (they belong to Batch 3's practice runtime).
// ponytail: key the set by the material content id, pack practice_content_id
// into title and questions_count/time_limit into description (JSON) so the
// PracticeSet struct round-trips until a practice-set runtime lands.

type practiceSetMeta struct {
	QuestionsCount   int `json:"questions_count"`
	TimeLimitSeconds int `json:"time_limit_seconds"`
}

func (r *repository) CreatePracticeSet(ctx context.Context, ps *PracticeSet) error {
	if ps.ID == uuid.Nil {
		ps.ID = ps.ContentID
	}
	ps.CreatedAt = time.Now()
	meta, err := json.Marshal(practiceSetMeta{QuestionsCount: ps.QuestionsCount, TimeLimitSeconds: ps.TimeLimitSeconds})
	if err != nil {
		return err
	}
	code := "ps_" + strings.ReplaceAll(uuid.NewString(), "-", "")[:12]
	_, err = r.pool.Exec(ctx, `
		INSERT INTO content.practice_set (id, practice_set_code, title, description, created_by, created_at)
		VALUES ($1, $2, $3, $4, NULL, $5)`,
		ps.ID, code, ps.PracticeContentID.String(), string(meta), ps.CreatedAt)
	return err
}

func scanPracticeSet(row pgx.Row) (*PracticeSet, error) {
	ps := &PracticeSet{}
	var description string
	if err := row.Scan(&ps.ID, &ps.PracticeContentID, &description, &ps.CreatedAt); err != nil {
		return nil, err
	}
	ps.ContentID = ps.ID
	var meta practiceSetMeta
	if json.Unmarshal([]byte(description), &meta) == nil {
		ps.QuestionsCount = meta.QuestionsCount
		ps.TimeLimitSeconds = meta.TimeLimitSeconds
	}
	return ps, nil
}

func (r *repository) GetPracticeSet(ctx context.Context, contentID uuid.UUID) (*PracticeSet, error) {
	return scanPracticeSet(r.pool.QueryRow(ctx, `
		SELECT id, title, description, created_at
		FROM content.practice_set
		WHERE id = $1 AND deleted_at IS NULL`, contentID))
}

func (r *repository) GetPracticeSetByPracticeContent(ctx context.Context, practiceContentID uuid.UUID) (*PracticeSet, error) {
	return scanPracticeSet(r.pool.QueryRow(ctx, `
		SELECT id, title, description, created_at
		FROM content.practice_set
		WHERE title = $1 AND deleted_at IS NULL
		ORDER BY created_at LIMIT 1`, practiceContentID.String()))
}

func (r *repository) DeletePracticeSet(ctx context.Context, contentID uuid.UUID) error {
	_, err := r.pool.Exec(ctx, `DELETE FROM content.practice_set WHERE id = $1`, contentID)
	return err
}

// ========== PRACTICE SESSIONS ==========

// TODO(2.4b-followup): practice SESSIONS are a Batch 3 concern; no
// content.practice_session table exists yet, so these four methods keep their
// legacy SQL (compile-only).
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
	from := `
		FROM question.question q
		WHERE q.deleted_at IS NULL
		  AND q.status_id = (SELECT id FROM question.question_status WHERE code = 'PUBLISHED')`
	args := []interface{}{}
	argN := 1

	if subjectID != nil {
		from += fmt.Sprintf(` AND EXISTS (SELECT 1 FROM question.question_subject qs WHERE qs.question_id = q.id AND qs.subject_id = $%d)`, argN)
		args = append(args, *subjectID)
		argN++
	}
	if gradeID != nil {
		from += fmt.Sprintf(` AND EXISTS (SELECT 1 FROM question.question_grade qg WHERE qg.question_id = q.id AND qg.grade_id = $%d)`, argN)
		args = append(args, *gradeID)
		argN++
	}
	// ponytail: tag_filter (question.tag) is not wired to an exam/practice
	// filter yet; it was a no-op in the legacy query too. add when practice
	// runtime (Batch 3) lands.
	_ = tagFilter

	args = append(args, count)
	rows, err := r.pool.Query(ctx, fmt.Sprintf(`SELECT q.id %s ORDER BY RANDOM() LIMIT $%d`, from, argN), args...)
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
	// Questions authored against a material are linked via
	// question.question_learning_material.material_id; those are the practice
	// candidates, restricted to published rows.
	rows, err := r.pool.Query(ctx, `
		SELECT lm.question_id
		FROM question.question_learning_material lm
		JOIN question.question q ON q.id = lm.question_id
		WHERE lm.material_id = $1 AND q.deleted_at IS NULL
		  AND q.status_id = (SELECT id FROM question.question_status WHERE code = 'PUBLISHED')
		ORDER BY q.created_at DESC
		LIMIT $2`, materialContentID, count)
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

// TODO(2.4b-followup): AddSessionQuestionsWithSubject still writes the dropped
// legacy content_exam_session_questions. Keep compile-only (Batch 3 maps to
// cbt.attempt_question + subject-scored grading).
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
	err := r.pool.QueryRow(ctx, `SELECT name FROM academic.subject WHERE id = $1`, subjectID).Scan(&name)
	if err != nil {
		return "", err
	}
	return name, nil
}

func (r *repository) GetQuestionSubject(ctx context.Context, questionContentID uuid.UUID) (uuid.UUID, error) {
	var subjectID uuid.UUID
	err := r.pool.QueryRow(ctx, `
		SELECT subject_id FROM question.question_subject WHERE question_id = $1 LIMIT 1`, questionContentID).Scan(&subjectID)
	if err != nil {
		return uuid.Nil, err
	}
	return subjectID, nil
}
