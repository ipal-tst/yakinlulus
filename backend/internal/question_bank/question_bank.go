package question_bank

import (
	"context"
	"encoding/json"
	"fmt"
	"strconv"
	"strings"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/jackc/pgx/v5/pgxpool"

	"yakinlulus.id/backend/internal/content"
	"yakinlulus.id/backend/internal/middleware"
	"yakinlulus.id/backend/internal/shared"
)

// --- Domain ---

type QuestionType string

const (
	QuestionTypeSingleChoice   QuestionType = "SINGLE_CHOICE"   // Pilihan Ganda Biasa: 1 jawaban benar
	QuestionTypeMultipleChoice QuestionType = "MULTIPLE_CHOICE" // Pilihan Ganda Kompleks (MCMA): >1 jawaban benar
	QuestionTypeTrueFalse      QuestionType = "TRUE_FALSE"      // Benar/Salah atau Sesuai/Tidak: menilai pernyataan
)

type Question struct {
	ID            uuid.UUID        `json:"id"`
	SubjectID     uuid.UUID        `json:"subject_id"`
	GradeID       *uuid.UUID       `json:"grade_id,omitempty"`
	ChapterID     *uuid.UUID       `json:"chapter_id,omitempty"`
	Content       string           `json:"content"`
	ContentHash   string           `json:"content_hash,omitempty"`
	ImageURL      *string          `json:"image_url,omitempty"`
	Difficulty    string           `json:"difficulty"`
	QuestionType  QuestionType     `json:"question_type"`
	Topic         *string          `json:"topic,omitempty"` // deprecated, use topic_id
	BloomLevel    *string          `json:"bloom_level,omitempty"`
	Language      string           `json:"language"`
	Source        *string          `json:"source,omitempty"`
	TopicID       *uuid.UUID       `json:"topic_id,omitempty"`
	SubTopicID    *uuid.UUID       `json:"subtopic_id,omitempty"`
	StimulusID    *uuid.UUID       `json:"stimulus_id,omitempty"`
	Score         float64          `json:"score"`
	NegativeScore float64          `json:"negative_score"`
	EstimatedTime *int             `json:"estimated_time,omitempty"`
	ThinkingLevel *string          `json:"thinking_level,omitempty"`
	Explanation   string           `json:"explanation,omitempty"`
	Status        string           `json:"status"`
	CreatedBy     uuid.UUID        `json:"created_by"`
	PublishedAt   *time.Time       `json:"published_at,omitempty"`
	CreatedAt     time.Time        `json:"created_at"`
	UpdatedAt     time.Time        `json:"updated_at"`
	SubjectName   string           `json:"subject_name,omitempty"`
	GradeName     string           `json:"grade_name,omitempty"`
	LevelName     string           `json:"level_name,omitempty"`
	LevelCode     string           `json:"level_code,omitempty"`
	ChapterName   string           `json:"chapter_name,omitempty"`
	Options       []QuestionOption `json:"options,omitempty"`
	Blocks        []QuestionBlock  `json:"blocks,omitempty"`
}

type QuestionBlock struct {
	BlockType string     `json:"block_type"`
	Content   string     `json:"content"`
	AssetID   *uuid.UUID `json:"asset_id,omitempty"`
}

type QuestionOption struct {
	ID           uuid.UUID `json:"id"`
	QuestionID   uuid.UUID `json:"question_id"`
	Label        string    `json:"label"`
	Content      string    `json:"content"`
	IsCorrect    bool      `json:"is_correct"`
	DisplayOrder int       `json:"display_order"`
}

// --- Repository ---

type Repository struct {
	pool *pgxpool.Pool
}

func NewRepository(pool *pgxpool.Pool) *Repository {
	return &Repository{pool: pool}
}

const questionColumns = `
	q.id,
	COALESCE(subj.subject_id, '00000000-0000-0000-0000-000000000000')::uuid,
	grade.grade_id,
	chapter.chapter_id,
	COALESCE(b.content, '')::text,
	''::text,
	COALESCE(m.difficulty_level, 'MEDIUM')::text,
	q.question_type::text,
	NULL::text,
	m.blooms_level,
	COALESCE(m.language, 'id')::text,
	m.source_name,
	topic.topic_id,
	NULL::uuid,
	NULL::uuid,
	COALESCE((SELECT MAX(op.score) FROM question.question_option op WHERE op.question_version_id = v.id AND op.is_correct AND op.score > 0), 1.0)::float8,
	0.0::float8,
	m.estimated_time,
	m.cognitive_level,
	COALESCE(e.content, '')::text,
	COALESCE(st.code, 'DRAFT')::text,
	COALESCE(q.created_by, '00000000-0000-0000-0000-000000000000')::uuid,
	CASE WHEN st.code = 'PUBLISHED' THEN
		(SELECT MIN(h.created_at) FROM question.question_history h WHERE h.question_id = q.id AND h.new_json->>'status' = 'PUBLISHED')
	ELSE NULL END,
	q.created_at,
	q.updated_at,
	COALESCE(s.name, '')::text,
	COALESCE(ch.title, '')::text,
	grade.grade_id,
	COALESCE(g.name, '')::text,
	COALESCE(l.name, '')::text,
	COALESCE(l.code, '')::text`

const questionFrom = `
	FROM question.question q
	LEFT JOIN question.question_status st ON st.id = q.status_id
	LEFT JOIN question.question_version v ON v.id = q.current_version_id
	LEFT JOIN question.question_block b ON b.question_version_id = v.id AND b.block_order = 0
	LEFT JOIN question.explanation e ON e.question_version_id = v.id
	LEFT JOIN question.question_metadata m ON m.question_id = q.id
	LEFT JOIN LATERAL (SELECT subject_id FROM question.question_subject WHERE question_id = q.id LIMIT 1) subj ON true
	LEFT JOIN LATERAL (SELECT grade_id FROM question.question_grade WHERE question_id = q.id LIMIT 1) grade ON true
	LEFT JOIN LATERAL (SELECT chapter_id FROM question.question_chapter WHERE question_id = q.id LIMIT 1) chapter ON true
	LEFT JOIN LATERAL (SELECT topic_id FROM question.question_topic WHERE question_id = q.id LIMIT 1) topic ON true
	LEFT JOIN academic.subject s ON s.id = subj.subject_id
	LEFT JOIN academic.chapter ch ON ch.id = chapter.chapter_id
	LEFT JOIN academic.grade g ON g.id = grade.grade_id
	LEFT JOIN academic.education_level l ON l.id = g.education_level_id`

func scanQuestion(row pgx.Row) (*Question, error) {
	q := &Question{}
	var qType string
	if err := row.Scan(
		&q.ID, &q.SubjectID, &q.GradeID, &q.ChapterID, &q.Content, &q.ImageURL,
		&q.Difficulty, &qType, &q.Topic, &q.BloomLevel, &q.Language, &q.Source,
		&q.TopicID, &q.SubTopicID, &q.StimulusID, &q.Score, &q.NegativeScore,
		&q.EstimatedTime, &q.ThinkingLevel, &q.Explanation, &q.Status, &q.CreatedBy,
		&q.PublishedAt, &q.CreatedAt, &q.UpdatedAt,
		&q.SubjectName, &q.ChapterName, &q.GradeID, &q.GradeName, &q.LevelName, &q.LevelCode); err != nil {
		return nil, err
	}
	q.QuestionType = QuestionType(qType)
	return q, nil
}

// ensureStatuses idempotently seeds the question_status lookup rows and
// returns a code->id map. Safe to call on every write.
func (r *Repository) ensureStatuses(ctx context.Context, tx pgx.Tx) (map[string]uuid.UUID, error) {
	rows := [][2]string{
		{"DRAFT", "Draft"},
		{"REVIEW", "In Review"},
		{"APPROVED", "Approved"},
		{"PUBLISHED", "Published"},
		{"ARCHIVED", "Archived"},
	}
	for _, s := range rows {
		if _, err := tx.Exec(ctx, `INSERT INTO question.question_status (code, name) VALUES ($1, $2) ON CONFLICT (code) DO NOTHING`, s[0], s[1]); err != nil {
			return nil, err
		}
	}
	statuses := map[string]uuid.UUID{}
	rws, err := tx.Query(ctx, `SELECT code, id FROM question.question_status WHERE code = ANY($1)`, []string{"DRAFT", "REVIEW", "APPROVED", "PUBLISHED", "ARCHIVED"})
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

func (r *Repository) insertMetadata(ctx context.Context, tx pgx.Tx, q *Question) error {
	var diff any
	if q.Difficulty != "" {
		diff = normalizeDifficulty(q.Difficulty)
	}
	var blooms any
	if q.BloomLevel != nil {
		if b := normalizeBloom(*q.BloomLevel); b != "" {
			blooms = b
		}
	}
	var lang any
	if q.Language != "" {
		lang = q.Language
	}
	_, err := tx.Exec(ctx, `
		INSERT INTO question.question_metadata
			(question_id, estimated_time, difficulty_level, blooms_level, cognitive_level, language, source_name,
			 is_hots, is_calculator_allowed, is_randomizable)
		VALUES ($1, $2, $3, $4, $5, $6, $7, false, false, true)
		ON CONFLICT (question_id) DO UPDATE SET
			estimated_time = COALESCE(EXCLUDED.estimated_time, question_metadata.estimated_time),
			difficulty_level = COALESCE(EXCLUDED.difficulty_level, question_metadata.difficulty_level),
			blooms_level = COALESCE(EXCLUDED.blooms_level, question_metadata.blooms_level),
			cognitive_level = COALESCE(EXCLUDED.cognitive_level, question_metadata.cognitive_level),
			language = COALESCE(EXCLUDED.language, question_metadata.language),
			source_name = COALESCE(EXCLUDED.source_name, question_metadata.source_name)`,
		q.ID, q.EstimatedTime, diff, blooms, q.ThinkingLevel, lang, q.Source)
	return err
}

// linkJunction inserts an N:M row only when the referenced academic row
// exists, so an empty academic catalog degrades gracefully to nullable.
func (r *Repository) linkJunction(ctx context.Context, tx pgx.Tx, junction, refTable, refCol string, questionID, refID uuid.UUID) error {
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
	_, err := tx.Exec(ctx, `INSERT INTO question.`+junction+` (question_id, `+refCol+`) VALUES ($1, $2)`, questionID, refID)
	return err
}

func (r *Repository) insertJunctions(ctx context.Context, tx pgx.Tx, q *Question) error {
	if err := r.linkJunction(ctx, tx, "question_subject", "academic.subject", "subject_id", q.ID, q.SubjectID); err != nil {
		return err
	}
	if q.GradeID != nil {
		if err := r.linkJunction(ctx, tx, "question_grade", "academic.grade", "grade_id", q.ID, *q.GradeID); err != nil {
			return err
		}
	}
	if q.ChapterID != nil {
		if err := r.linkJunction(ctx, tx, "question_chapter", "academic.chapter", "chapter_id", q.ID, *q.ChapterID); err != nil {
			return err
		}
	}
	if q.TopicID != nil {
		if err := r.linkJunction(ctx, tx, "question_topic", "academic.topic", "topic_id", q.ID, *q.TopicID); err != nil {
			return err
		}
	}
	return nil
}

func (r *Repository) clearJunctions(ctx context.Context, tx pgx.Tx, questionID uuid.UUID) error {
	for _, t := range []string{"question_subject", "question_grade", "question_chapter", "question_topic"} {
		if _, err := tx.Exec(ctx, `DELETE FROM question.`+t+` WHERE question_id = $1`, questionID); err != nil {
			return err
		}
	}
	return nil
}

type historySnapshot struct {
	Content     string           `json:"content"`
	Difficulty  string           `json:"difficulty"`
	Explanation *string          `json:"explanation,omitempty"`
	Status      string           `json:"status"`
	Summary     string           `json:"summary,omitempty"`
	Options     []QuestionOption `json:"options"`
}

func buildHistorySnapshot(q *Question, opts []QuestionOption, summary string) ([]byte, error) {
	return json.Marshal(historySnapshot{
		Content:     q.Content,
		Difficulty:  q.Difficulty,
		Explanation: ptrStr(q.Explanation),
		Status:      q.Status,
		Summary:     summary,
		Options:     opts,
	})
}

func (r *Repository) insertHistory(ctx context.Context, tx pgx.Tx, questionID uuid.UUID, action string, changedBy uuid.UUID, oldJSON, newJSON []byte) error {
	_, err := tx.Exec(ctx, `
		INSERT INTO question.question_history (question_id, action, changed_by, old_json, new_json)
		VALUES ($1, $2, $3, $4, $5)`, questionID, action, changedBy, oldJSON, newJSON)
	return err
}

func (r *Repository) Create(ctx context.Context, q *Question, opts []QuestionOption) error {
	tx, err := r.pool.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)

	statuses, err := r.ensureStatuses(ctx, tx)
	if err != nil {
		return err
	}

	q.ID = uuid.New()
	q.Status = statusCode(q.Status)
	q.CreatedAt = time.Now()
	q.UpdatedAt = time.Now()
	if q.QuestionType == "" {
		q.QuestionType = QuestionTypeSingleChoice
	}
	if q.Language == "" {
		q.Language = "id"
	}
	score := q.Score
	if score <= 0 {
		score = 1.0
	}

	code := "Q" + strings.ReplaceAll(uuid.NewString(), "-", "")[:12]
	if _, err := tx.Exec(ctx, `
		INSERT INTO question.question (id, question_code, question_type, status_id, owner_id, created_by, updated_by, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
		q.ID, code, q.QuestionType, statuses[q.Status], q.CreatedBy, q.CreatedBy, q.CreatedBy, q.CreatedAt, q.UpdatedAt); err != nil {
		return err
	}

	var versionID uuid.UUID
	if err := tx.QueryRow(ctx, `
		INSERT INTO question.question_version (question_id, version_no, change_summary, created_by, is_current)
		VALUES ($1, 1, $2, $3, true) RETURNING id`, q.ID, "Initial version", q.CreatedBy).Scan(&versionID); err != nil {
		return err
	}
	if _, err := tx.Exec(ctx, `UPDATE question.question SET current_version_id = $1 WHERE id = $2`, versionID, q.ID); err != nil {
		return err
	}

	if len(q.Blocks) > 0 {
		for i, b := range q.Blocks {
			if _, err := tx.Exec(ctx, `
				INSERT INTO question.question_block (question_version_id, block_order, block_type, content, asset_id)
				VALUES ($1,$2,$3,$4,$5)`, versionID, i, b.BlockType, b.Content, b.AssetID); err != nil {
				return err
			}
		}
	} else if q.Content != "" {
		if _, err := tx.Exec(ctx, `
			INSERT INTO question.question_block (question_version_id, block_order, block_type, content)
			VALUES ($1, 0, 'PARAGRAPH', $2)`, versionID, q.Content); err != nil {
			return err
		}
	}

	if err := insertOptions(ctx, tx, versionID, opts, score); err != nil {
		return err
	}

	if q.Explanation != "" {
		if _, err := tx.Exec(ctx, `
			INSERT INTO question.explanation (question_version_id, content) VALUES ($1, $2)`, versionID, q.Explanation); err != nil {
			return err
		}
	}

	if err := r.insertMetadata(ctx, tx, q); err != nil {
		return err
	}
	if err := r.insertJunctions(ctx, tx, q); err != nil {
		return err
	}

	snap, _ := buildHistorySnapshot(q, opts, "question created")
	if err := r.insertHistory(ctx, tx, q.ID, "CREATE", q.CreatedBy, nil, snap); err != nil {
		return err
	}

	return tx.Commit(ctx)
}

func (r *Repository) Update(ctx context.Context, q *Question, opts []QuestionOption, changedBy uuid.UUID) error {
	tx, err := r.pool.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)

	var curVer *uuid.UUID
	if err := tx.QueryRow(ctx, `
		SELECT current_version_id FROM question.question WHERE id = $1 AND deleted_at IS NULL`, q.ID).Scan(&curVer); err != nil {
		return err
	}
	if curVer == nil {
		return pgx.ErrNoRows
	}

	var nextNo int
	if err := tx.QueryRow(ctx, `
		SELECT COALESCE(MAX(version_no), 0) + 1 FROM question.question_version WHERE question_id = $1`, q.ID).Scan(&nextNo); err != nil {
		return err
	}

	// Carry the question score through the version bump: the correct option's
	// stored score IS the question score. Explicit positive q.Score wins;
	// otherwise reuse the current correct-option score so it is never reset.
	score := q.Score
	if score <= 0 {
		if err := tx.QueryRow(ctx, `
			SELECT COALESCE((SELECT MAX(op.score) FROM question.question_option op
				WHERE op.question_version_id = $1 AND op.is_correct AND op.score > 0), 1.0)::float8`, *curVer).Scan(&score); err != nil {
			return err
		}
	}

	var newVer uuid.UUID
	if err := tx.QueryRow(ctx, `
		INSERT INTO question.question_version (question_id, version_no, change_summary, created_by, is_current)
		VALUES ($1, $2, 'content updated', $3, true) RETURNING id`, q.ID, nextNo, changedBy).Scan(&newVer); err != nil {
		return err
	}
	if _, err := tx.Exec(ctx, `UPDATE question.question_version SET is_current = false WHERE id = $1`, *curVer); err != nil {
		return err
	}
	if _, err := tx.Exec(ctx, `
		UPDATE question.question SET current_version_id = $1, updated_by = $2, updated_at = NOW() WHERE id = $3`,
		newVer, changedBy, q.ID); err != nil {
		return err
	}

	if len(q.Blocks) > 0 {
		for i, b := range q.Blocks {
			if _, err := tx.Exec(ctx, `
				INSERT INTO question.question_block (question_version_id, block_order, block_type, content, asset_id)
				VALUES ($1,$2,$3,$4,$5)`, newVer, i, b.BlockType, b.Content, b.AssetID); err != nil {
				return err
			}
		}
	} else if q.Content != "" {
		if _, err := tx.Exec(ctx, `
			INSERT INTO question.question_block (question_version_id, block_order, block_type, content)
			VALUES ($1, 0, 'PARAGRAPH', $2)`, newVer, q.Content); err != nil {
			return err
		}
	}
	if q.Explanation != "" {
		if _, err := tx.Exec(ctx, `
			INSERT INTO question.explanation (question_version_id, content) VALUES ($1, $2)`, newVer, q.Explanation); err != nil {
			return err
		}
	}
	if err := insertOptions(ctx, tx, newVer, opts, score); err != nil {
		return err
	}
	if err := r.insertMetadata(ctx, tx, q); err != nil {
		return err
	}
	if err := r.clearJunctions(ctx, tx, q.ID); err != nil {
		return err
	}
	if err := r.insertJunctions(ctx, tx, q); err != nil {
		return err
	}

	snap, err := buildHistorySnapshot(q, opts, "question updated")
	if err != nil {
		return err
	}
	if err := r.insertHistory(ctx, tx, q.ID, "UPDATE", changedBy, snap, snap); err != nil {
		return err
	}

	return tx.Commit(ctx)
}

// insertOptions writes the given options (with option_block content) into a
// version, applying score to the correct option. Create/Update/ReplaceOptions
// all funnel through here so scoring stays consistent.
func insertOptions(ctx context.Context, tx pgx.Tx, versionID uuid.UUID, opts []QuestionOption, score float64) error {
	for i, opt := range opts {
		opt.DisplayOrder = i
		opt.ID = uuid.New()
		optScore := 0.0
		if opt.IsCorrect {
			optScore = score
		}
		if _, err := tx.Exec(ctx, `
			INSERT INTO question.question_option (id, question_version_id, label, score, is_correct, display_order)
			VALUES ($1, $2, $3, $4, $5, $6)`,
			opt.ID, versionID, opt.Label, optScore, opt.IsCorrect, opt.DisplayOrder); err != nil {
			return err
		}
		if _, err := tx.Exec(ctx, `
			INSERT INTO question.option_block (option_id, block_order, block_type, content)
			VALUES ($1, 0, 'PARAGRAPH', $2)`, opt.ID, opt.Content); err != nil {
			return err
		}
	}
	return nil
}

func (r *Repository) Delete(ctx context.Context, id uuid.UUID, userID uuid.UUID, isAdmin bool) error {
	tx, err := r.pool.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)

	var tag pgconn.CommandTag
	if isAdmin {
		tag, err = tx.Exec(ctx, `UPDATE question.question SET deleted_at = NOW() WHERE id = $1 AND deleted_at IS NULL`, id)
	} else {
		tag, err = tx.Exec(ctx, `UPDATE question.question SET deleted_at = NOW() WHERE id = $1 AND deleted_at IS NULL AND owner_id = $2`, id, userID)
	}
	if err != nil {
		return err
	}
	if tag.RowsAffected() == 0 {
		return pgx.ErrNoRows
	}

	snap, _ := json.Marshal(historySnapshot{Status: "DELETED", Summary: "question deleted"})
	if err := r.insertHistory(ctx, tx, id, "DELETE", userID, nil, snap); err != nil {
		return err
	}
	return tx.Commit(ctx)
}

func (r *Repository) setStatus(ctx context.Context, id uuid.UUID, code, fromCode string, userID uuid.UUID, summary string) error {
	tx, err := r.pool.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)

	statuses, err := r.ensureStatuses(ctx, tx)
	if err != nil {
		return err
	}

	sql := `UPDATE question.question SET status_id = $1, updated_at = NOW() WHERE id = $2 AND deleted_at IS NULL`
	args := []interface{}{statuses[code], id}
	if fromCode != "" {
		sql += ` AND status_id = (SELECT id FROM question.question_status WHERE code = $3)`
		args = append(args, fromCode)
	}

	tag, err := tx.Exec(ctx, sql, args...)
	if err != nil {
		return err
	}
	if tag.RowsAffected() == 0 {
		// Status precondition not met; nothing changed.
		return tx.Commit(ctx)
	}

	snap, _ := json.Marshal(historySnapshot{Status: code, Summary: summary})
	if err := r.insertHistory(ctx, tx, id, historyActionForTransition(code, fromCode), userID, nil, snap); err != nil {
		return err
	}
	return tx.Commit(ctx)
}

func (r *Repository) Publish(ctx context.Context, id uuid.UUID, userID uuid.UUID) error {
	return r.setStatus(ctx, id, "PUBLISHED", "DRAFT", userID, "question published")
}

func (r *Repository) ArchiveQuestion(ctx context.Context, id uuid.UUID, userID uuid.UUID) error {
	return r.setStatus(ctx, id, "ARCHIVED", "", userID, "question archived")
}

func (r *Repository) RestoreQuestion(ctx context.Context, id uuid.UUID, userID uuid.UUID) error {
	return r.setStatus(ctx, id, "DRAFT", "ARCHIVED", userID, "question restored")
}

func (r *Repository) UnpublishQuestion(ctx context.Context, id uuid.UUID, userID uuid.UUID) error {
	return r.setStatus(ctx, id, "DRAFT", "PUBLISHED", userID, "question unpublished")
}

func (r *Repository) CloneQuestion(ctx context.Context, q *Question, opts []QuestionOption) error {
	q.ID = uuid.New()
	q.Status = "DRAFT"
	q.PublishedAt = nil
	q.CreatedAt = time.Now()
	q.UpdatedAt = time.Now()

	return r.Create(ctx, q, opts)
}

func (r *Repository) FindByID(ctx context.Context, id uuid.UUID) (*Question, error) {
	q, err := scanQuestion(r.pool.QueryRow(ctx,
		"SELECT "+questionColumns+questionFrom+" WHERE q.id = $1 AND q.deleted_at IS NULL", id))
	if err != nil {
		return nil, err
	}
	opts, _ := r.GetOptions(ctx, id)
	q.Options = opts
	blocks, _ := r.GetBlocks(ctx, id)
	q.Blocks = blocks

	return q, nil
}

func (r *Repository) List(ctx context.Context, subjectID *uuid.UUID, gradeID *uuid.UUID, difficulty string, status string, search string, limit, offset int) ([]Question, int, error) {
	where := " WHERE q.deleted_at IS NULL"
	args := []interface{}{}
	argN := 1

	if search != "" {
		where += " AND (COALESCE(b.content, '') ILIKE $" + itoa(argN) + " OR COALESCE(e.content, '') ILIKE $" + itoa(argN) + ")"
		args = append(args, "%"+search+"%")
		argN++
	}
	if subjectID != nil {
		where += " AND subj.subject_id = $" + itoa(argN)
		args = append(args, *subjectID)
		argN++
	}
	if gradeID != nil {
		where += " AND grade.grade_id = $" + itoa(argN)
		args = append(args, *gradeID)
		argN++
	}
	if difficulty != "" {
		where += " AND m.difficulty_level = $" + itoa(argN)
		args = append(args, difficulty)
		argN++
	}
	if status != "" {
		where += " AND st.code = $" + itoa(argN)
		args = append(args, status)
		argN++
	}

	var total int
	if err := r.pool.QueryRow(ctx, "SELECT COUNT(*) "+questionFrom+where, args...).Scan(&total); err != nil {
		return nil, 0, err
	}

	query := "SELECT " + questionColumns + questionFrom + where + " ORDER BY q.created_at DESC LIMIT $" + itoa(argN) + " OFFSET $" + itoa(argN+1)
	queryArgs := append(append([]interface{}{}, args...), limit, offset)

	rows, err := r.pool.Query(ctx, query, queryArgs...)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	var questions []Question
	for rows.Next() {
		q, err := scanQuestion(rows)
		if err != nil {
			return nil, 0, err
		}
		opts, _ := r.GetOptions(ctx, q.ID)
		q.Options = opts
		blocks, _ := r.GetBlocks(ctx, q.ID)
		q.Blocks = blocks

		questions = append(questions, *q)
	}
	return questions, total, nil
}

func (r *Repository) GetOptions(ctx context.Context, questionID uuid.UUID) ([]QuestionOption, error) {
	rows, err := r.pool.Query(ctx, `
		SELECT op.id, q.id, op.label, COALESCE(ob.content, '')::text, op.is_correct, op.display_order
		FROM question.question_option op
		JOIN question.question q ON q.current_version_id = op.question_version_id
		LEFT JOIN question.option_block ob ON ob.option_id = op.id AND ob.block_order = 0
		WHERE q.id = $1 AND q.deleted_at IS NULL
		ORDER BY op.display_order`, questionID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var opts []QuestionOption
	for rows.Next() {
		var o QuestionOption
		if err := rows.Scan(&o.ID, &o.QuestionID, &o.Label, &o.Content, &o.IsCorrect, &o.DisplayOrder); err != nil {
			return nil, err
		}
		opts = append(opts, o)
	}
	return opts, nil
}

func (r *Repository) GetBlocks(ctx context.Context, questionID uuid.UUID) ([]QuestionBlock, error) {
	rows, err := r.pool.Query(ctx, `
		SELECT qb.block_type,
		       qb.content,
		       qb.asset_id,
		       COALESCE(ast.public_url, '') AS image_url
		FROM question.question_block qb
		JOIN question.question q ON q.current_version_id = qb.question_version_id
		LEFT JOIN media.asset a ON a.id = qb.asset_id
		LEFT JOIN media.asset_storage ast ON ast.id = a.storage_id
		WHERE q.id = $1 AND q.deleted_at IS NULL
		ORDER BY qb.block_order ASC`, questionID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var blocks []QuestionBlock
	for rows.Next() {
		var b QuestionBlock
		var imgURL string
		if err := rows.Scan(&b.BlockType, &b.Content, &b.AssetID, &imgURL); err != nil {
			return nil, err
		}
		if b.BlockType == "IMAGE" && imgURL != "" && (b.Content == "" || (!strings.HasPrefix(b.Content, "http") && !strings.HasPrefix(b.Content, "/"))) {
			b.Content = imgURL
		}
		blocks = append(blocks, b)
	}
	return blocks, nil
}

func (r *Repository) ReplaceOptions(ctx context.Context, questionID uuid.UUID, opts []QuestionOption) error {
	tx, err := r.pool.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)

	var versionID uuid.UUID
	if err := tx.QueryRow(ctx, `
		SELECT current_version_id FROM question.question WHERE id = $1 AND deleted_at IS NULL`, questionID).Scan(&versionID); err != nil {
		return err
	}

	// Preserve the question score: the correct option's stored score IS the
	// question score. Read it before wiping options so a replace never resets
	// the score to 1.0 (data-loss regression).
	var score float64
	if err := tx.QueryRow(ctx, `
		SELECT COALESCE((SELECT MAX(op.score) FROM question.question_option op
			WHERE op.question_version_id = $1 AND op.is_correct AND op.score > 0), 1.0)::float8`, versionID).Scan(&score); err != nil {
		return err
	}

	if _, err := tx.Exec(ctx, `
		DELETE FROM question.option_block WHERE option_id IN
		(SELECT id FROM question.question_option WHERE question_version_id = $1)`, versionID); err != nil {
		return err
	}
	if _, err := tx.Exec(ctx, `DELETE FROM question.question_option WHERE question_version_id = $1`, versionID); err != nil {
		return err
	}

	if err := insertOptions(ctx, tx, versionID, opts, score); err != nil {
		return err
	}
	return tx.Commit(ctx)
}

// --- Revision ---

type QuestionRevision struct {
	ID          uuid.UUID  `json:"id"`
	QuestionID  uuid.UUID  `json:"question_id"`
	Revision    int        `json:"revision"`
	Content     string     `json:"content"`
	Difficulty  string     `json:"difficulty"`
	Explanation *string    `json:"explanation,omitempty"`
	Options     []byte     `json:"options"`
	ChangedBy   *uuid.UUID `json:"changed_by,omitempty"`
	ChangeType  string     `json:"change_type"`
	Summary     string     `json:"summary"`
	CreatedAt   time.Time  `json:"created_at"`
}

func (r *Repository) RecordRevision(ctx context.Context, q *Question, opts []QuestionOption, changedBy *uuid.UUID, changeType, summary string) error {
	snap, err := buildHistorySnapshot(q, opts, summary)
	if err != nil {
		return err
	}
	_, err = r.pool.Exec(ctx, `
		INSERT INTO question.question_history (question_id, action, changed_by, old_json, new_json)
		VALUES ($1, $2, $3, $4, $4)`,
		q.ID, historyAction(changeType), changedBy, snap)
	return err
}

func (r *Repository) ListRevisions(ctx context.Context, questionID uuid.UUID) ([]QuestionRevision, error) {
	rows, err := r.pool.Query(ctx, `
		WITH seq AS (
			SELECT id, ROW_NUMBER() OVER (ORDER BY created_at) AS rn
			FROM question.question_history WHERE question_id = $1
		)
		SELECT h.id, h.question_id, s.rn, h.changed_by, h.action, h.created_at, h.new_json
		FROM question.question_history h
		JOIN seq s ON s.id = h.id
		WHERE h.question_id = $1
		ORDER BY h.created_at DESC`, questionID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var revs []QuestionRevision
	for rows.Next() {
		var rev QuestionRevision
		var action string
		var newJSON []byte
		if err := rows.Scan(&rev.ID, &rev.QuestionID, &rev.Revision, &rev.ChangedBy, &action, &rev.CreatedAt, &newJSON); err != nil {
			return nil, err
		}
		rev.ChangeType = action
		var snap historySnapshot
		if len(newJSON) > 0 {
			_ = json.Unmarshal(newJSON, &snap)
		}
		rev.Content = snap.Content
		rev.Difficulty = snap.Difficulty
		rev.Explanation = snap.Explanation
		rev.Options, _ = json.Marshal(snap.Options)
		rev.Summary = snap.Summary
		revs = append(revs, rev)
	}
	return revs, nil
}

// --- Import Job Logging ---

// CreateImportJob keeps its legacy signature; filename/totalRows/createdBy
// have no columns in question.question_import_job, so they are dropped.
// ponytail: add file_id linkage in subphase 2.6 when media import lands.
func (r *Repository) CreateImportJob(ctx context.Context, filename string, totalRows int, createdBy uuid.UUID) (uuid.UUID, error) {
	jobID := uuid.New()
	_, err := r.pool.Exec(ctx, `
		INSERT INTO question.question_import_job (id, status, started_at, created_at, updated_at)
		VALUES ($1, 'PROCESSING', NOW(), NOW(), NOW())`, jobID)
	return jobID, err
}

func (r *Repository) UpdateImportJob(ctx context.Context, jobID uuid.UUID, successCount int, errorCount int, status string, errorLog string) error {
	var finishedAt any
	switch mapImportStatus(status) {
	case "SUCCESS", "FAILED", "CANCELLED":
		finishedAt = time.Now()
	}
	_, err := r.pool.Exec(ctx, `
		UPDATE question.question_import_job
		SET status = $1, finished_at = $2, updated_at = NOW()
		WHERE id = $3`, mapImportStatus(status), finishedAt, jobID)
	return err
}

func (r *Repository) CreateImportRowLog(ctx context.Context, jobID uuid.UUID, rowNumber int, rawData []byte, status string, errStr string, questionID *uuid.UUID) error {
	_, err := r.pool.Exec(ctx, `
		INSERT INTO question.question_import_row (job_id, row_no, status, error_message)
		VALUES ($1, $2, $3, $4)`,
		jobID, rowNumber, mapRowStatus(status), errStr)
	return err
}

// --- Normalization helpers ---

func statusCode(s string) string {
	switch strings.ToUpper(s) {
	case "APPROVED", "DRAFT", "REVIEW", "PUBLISHED", "ARCHIVED":
		return strings.ToUpper(s)
	}
	return "DRAFT"
}

func normalizeDifficulty(d string) string {
	switch strings.ToUpper(d) {
	case "EASY", "MEDIUM", "HARD", "VERY_HARD":
		return strings.ToUpper(d)
	}
	return "MEDIUM"
}

func normalizeBloom(b string) string {
	switch strings.ToUpper(b) {
	case "REMEMBER", "UNDERSTAND", "APPLY", "ANALYZE", "EVALUATE", "CREATE":
		return strings.ToUpper(b)
	}
	return ""
}

func historyAction(changeType string) string {
	switch strings.ToUpper(changeType) {
	case "CREATE", "CREATED":
		return "CREATE"
	case "UPDATE", "UPDATED":
		return "UPDATE"
	case "REVIEW", "APPROVE", "REVISION", "ARCHIVE", "RESTORE", "DELETE":
		return strings.ToUpper(changeType)
	}
	return "UPDATE"
}

func historyActionForTransition(code, fromCode string) string {
	switch code {
	case "ARCHIVED":
		return "ARCHIVE"
	case "DRAFT":
		if fromCode == "ARCHIVED" {
			return "RESTORE"
		}
		return "UPDATE" // includes unpublish (PUBLISHED->DRAFT)
	case "PUBLISHED":
		return "APPROVE"
	default:
		return "UPDATE"
	}
}

func mapImportStatus(s string) string {
	switch strings.ToUpper(s) {
	case "COMPLETED", "SUCCESS":
		return "SUCCESS"
	case "PROCESSING", "VALIDATING", "PENDING", "FAILED", "CANCELLED":
		return strings.ToUpper(s)
	}
	return "FAILED"
}

func mapRowStatus(s string) string {
	switch strings.ToUpper(s) {
	case "ERROR", "FAILED":
		return "FAILED"
	case "IMPORTED", "SUCCESS":
		return "SUCCESS"
	case "SKIPPED":
		return "SKIPPED"
	}
	return "PENDING"
}

// --- Service ---

type Service struct {
	repo    *Repository
	content content.Repository // Added
}

func NewService(repo *Repository, contentRepo content.Repository) *Service {
	return &Service{repo: repo, content: contentRepo}
}

type CreateQuestionReq struct {
	SubjectID     string            `json:"subject_id"`
	ChapterID     *string           `json:"chapter_id,omitempty"`
	Content       string            `json:"content"`
	Difficulty    string            `json:"difficulty"`
	QuestionType  string            `json:"question_type"`
	Topic         *string           `json:"topic,omitempty"`
	BloomLevel    *string           `json:"bloom_level,omitempty"`
	Language      string            `json:"language,omitempty"`
	Source        *string           `json:"source,omitempty"`
	TopicID       *string           `json:"topic_id,omitempty"`
	SubTopicID    *string           `json:"subtopic_id,omitempty"`
	StimulusID    *string           `json:"stimulus_id,omitempty"`
	Score         float64           `json:"score,omitempty"`
	NegativeScore float64           `json:"negative_score,omitempty"`
	EstimatedTime *int              `json:"estimated_time,omitempty"`
	ThinkingLevel *string           `json:"thinking_level,omitempty"`
	Explanation   string            `json:"explanation,omitempty"`
	Options       []CreateOptionReq `json:"options,omitempty"`
	Blocks        []QuestionBlock   `json:"blocks,omitempty"`
}

type CreateOptionReq struct {
	Label   string `json:"label"`
	Content string `json:"content"`
	Correct bool   `json:"correct"`
}

type UpdateQuestionReq struct {
	SubjectID     string            `json:"subject_id"`
	ChapterID     *string           `json:"chapter_id,omitempty"`
	Content       string            `json:"content"`
	Difficulty    string            `json:"difficulty"`
	QuestionType  string            `json:"question_type"`
	Topic         *string           `json:"topic,omitempty"`
	BloomLevel    *string           `json:"bloom_level,omitempty"`
	Language      string            `json:"language,omitempty"`
	Source        *string           `json:"source,omitempty"`
	TopicID       *string           `json:"topic_id,omitempty"`
	SubTopicID    *string           `json:"subtopic_id,omitempty"`
	StimulusID    *string           `json:"stimulus_id,omitempty"`
	Score         float64           `json:"score,omitempty"`
	NegativeScore float64           `json:"negative_score,omitempty"`
	EstimatedTime *int              `json:"estimated_time,omitempty"`
	ThinkingLevel *string           `json:"thinking_level,omitempty"`
	Explanation   string            `json:"explanation,omitempty"`
	Options       []CreateOptionReq `json:"options,omitempty"`
}

func (s *Service) Create(ctx context.Context, req CreateQuestionReq, createdBy uuid.UUID) (*Question, error) {
	subjectID, err := uuid.Parse(req.SubjectID)
	if err != nil {
		return nil, fiber.NewError(400, "Invalid subject_id")
	}

	q := &Question{
		SubjectID:     subjectID,
		Content:       req.Content,
		Difficulty:    req.Difficulty,
		QuestionType:  QuestionType(req.QuestionType),
		Topic:         req.Topic,
		BloomLevel:    req.BloomLevel,
		Language:      "id",
		Source:        req.Source,
		Score:         req.Score,
		NegativeScore: req.NegativeScore,
		EstimatedTime: req.EstimatedTime,
		ThinkingLevel: req.ThinkingLevel,
		Explanation:   req.Explanation,
		CreatedBy:     createdBy,
	}
	if q.QuestionType == "" {
		q.QuestionType = QuestionTypeSingleChoice
	}
	if req.Language != "" {
		q.Language = req.Language
	}
	if req.ChapterID != nil && *req.ChapterID != "" {
		cid, err := uuid.Parse(*req.ChapterID)
		if err == nil {
			q.ChapterID = &cid
		}
	}
	if req.TopicID != nil && *req.TopicID != "" {
		tid, err := uuid.Parse(*req.TopicID)
		if err == nil {
			q.TopicID = &tid
		}
	}
	if req.SubTopicID != nil && *req.SubTopicID != "" {
		stid, err := uuid.Parse(*req.SubTopicID)
		if err == nil {
			q.SubTopicID = &stid
		}
	}
	if req.StimulusID != nil && *req.StimulusID != "" {
		sid, err := uuid.Parse(*req.StimulusID)
		if err == nil {
			q.StimulusID = &sid
		}
	}

	var opts []QuestionOption
	for i, o := range req.Options {
		opts = append(opts, QuestionOption{
			Label:        o.Label,
			Content:      o.Content,
			IsCorrect:    o.Correct,
			DisplayOrder: i,
		})
	}

	for _, b := range req.Blocks {
		q.Blocks = append(q.Blocks, QuestionBlock{BlockType: b.BlockType, Content: b.Content, AssetID: b.AssetID})
	}

	if err := s.repo.Create(ctx, q, opts); err != nil {
		return nil, err
	}

	res, err := s.repo.FindByID(ctx, q.ID)
	if err != nil || res == nil {
		return q, nil
	}
	return res, nil
}

func (s *Service) GetByID(ctx context.Context, id uuid.UUID) (*Question, error) {
	q, err := s.repo.FindByID(ctx, id)
	if err != nil {
		if err == pgx.ErrNoRows {
			return nil, nil
		}
		return nil, err
	}
	return q, nil
}

func (s *Service) List(ctx context.Context, subjectID *uuid.UUID, gradeID *uuid.UUID, difficulty, status, search string, page, limit int) ([]Question, int, error) {
	return s.repo.List(ctx, subjectID, gradeID, difficulty, status, search, limit, (page-1)*limit)
}

func (s *Service) Update(ctx context.Context, id uuid.UUID, req UpdateQuestionReq, changedBy uuid.UUID) (*Question, error) {
	existing, err := s.repo.FindByID(ctx, id)
	if err != nil {
		return nil, err
	}
	if existing == nil {
		return nil, fiber.NewError(404, "Question not found")
	}

	subjectID, err := uuid.Parse(req.SubjectID)
	if err != nil {
		return nil, fiber.NewError(400, "Invalid subject_id")
	}

	q := &Question{
		ID:           id,
		SubjectID:    subjectID,
		Content:      req.Content,
		Difficulty:   req.Difficulty,
		QuestionType: QuestionType(req.QuestionType),
		Topic:        req.Topic,
		BloomLevel:   req.BloomLevel,
		Language:     "id",
		Source:       req.Source,
		Explanation:  req.Explanation,
	}
	if req.Language != "" {
		q.Language = req.Language
	}
	if req.ChapterID != nil && *req.ChapterID != "" {
		cid, err := uuid.Parse(*req.ChapterID)
		if err != nil {
			return nil, fiber.NewError(400, "Invalid chapter_id")
		}
		q.ChapterID = &cid
	}
	if req.TopicID != nil && *req.TopicID != "" {
		tid, err := uuid.Parse(*req.TopicID)
		if err != nil {
			return nil, fiber.NewError(400, "Invalid topic_id")
		}
		q.TopicID = &tid
	}
	if req.SubTopicID != nil && *req.SubTopicID != "" {
		stid, err := uuid.Parse(*req.SubTopicID)
		if err != nil {
			return nil, fiber.NewError(400, "Invalid subtopic_id")
		}
		q.SubTopicID = &stid
	}
	if req.StimulusID != nil && *req.StimulusID != "" {
		sid, err := uuid.Parse(*req.StimulusID)
		if err != nil {
			return nil, fiber.NewError(400, "Invalid stimulus_id")
		}
		q.StimulusID = &sid
	}

	// Carry options into the atomic update: use request options if provided,
	// otherwise reuse the current options so the new version keeps them.
	var opts []QuestionOption
	if len(req.Options) > 0 {
		for _, o := range req.Options {
			opts = append(opts, QuestionOption{Label: o.Label, Content: o.Content, IsCorrect: o.Correct})
		}
	} else {
		existingOpts, err := s.repo.GetOptions(ctx, id)
		if err != nil {
			return nil, err
		}
		opts = existingOpts
	}

	if err := s.repo.Update(ctx, q, opts, changedBy); err != nil {
		return nil, err
	}

	return s.repo.FindByID(ctx, id)
}

func (s *Service) ListRevisions(ctx context.Context, questionID uuid.UUID) ([]QuestionRevision, error) {
	return s.repo.ListRevisions(ctx, questionID)
}

func (s *Service) Delete(ctx context.Context, id uuid.UUID, userID uuid.UUID, isAdmin bool) error {
	return s.repo.Delete(ctx, id, userID, isAdmin)
}

func (s *Service) Publish(ctx context.Context, id uuid.UUID, userID uuid.UUID) (*Question, error) {
	if err := s.repo.Publish(ctx, id, userID); err != nil {
		return nil, err
	}
	return s.repo.FindByID(ctx, id)
}

func (s *Service) Clone(ctx context.Context, id uuid.UUID, userID uuid.UUID) (*Question, []QuestionOption, error) {
	q, err := s.repo.FindByID(ctx, id)
	if err != nil {
		return nil, nil, err
	}
	if q == nil {
		return nil, nil, fiber.NewError(fiber.StatusNotFound, "Question not found")
	}
	opts, err := s.repo.GetOptions(ctx, id)
	if err != nil {
		return nil, nil, err
	}
	newQ := *q
	newQ.CreatedBy = userID
	if err := s.repo.CloneQuestion(ctx, &newQ, opts); err != nil {
		return nil, nil, err
	}
	newOpts, _ := s.repo.GetOptions(ctx, newQ.ID)
	return &newQ, newOpts, nil
}

func (s *Service) ArchiveQuestion(ctx context.Context, id uuid.UUID, userID uuid.UUID) error {
	return s.repo.ArchiveQuestion(ctx, id, userID)
}

func (s *Service) RestoreQuestion(ctx context.Context, id uuid.UUID, userID uuid.UUID) error {
	return s.repo.RestoreQuestion(ctx, id, userID)
}

func (s *Service) UnpublishQuestion(ctx context.Context, id uuid.UUID, userID uuid.UUID) error {
	return s.repo.UnpublishQuestion(ctx, id, userID)
}

func (s *Service) GetOptions(ctx context.Context, questionID uuid.UUID) ([]QuestionOption, error) {
	return s.repo.GetOptions(ctx, questionID)
}

// --- Handler ---

type Handler struct {
	svc *Service
	jwt string
}

func NewHandler(svc *Service, jwtSecret string) *Handler {
	return &Handler{svc: svc, jwt: jwtSecret}
}

func (h *Handler) RegisterRoutes(router fiber.Router) {
	r := router.Group("/questions")
	write := middleware.RequireRole("SUPER_ADMIN", "STAFF", "GURU")
	read := middleware.RequireAuth(h.jwt)
	auth := middleware.RequireAuth(h.jwt)

	// Static routes FIRST (to prevent /:id parameter matching)
	r.Get("/", read, h.List)
	r.Get("/export", auth, write, h.Export)
	r.Get("/import/template", auth, write, h.QuestionImportTemplate)
	r.Post("/import", auth, write, h.Import)
	r.Post("/import/xlsx", auth, write, h.ImportQuestionsXLSX)
	r.Post("/check-duplicates", auth, write, h.CheckDuplicates)
	r.Post("/bulk-publish", auth, write, h.BulkPublish)
	r.Post("/bulk-status", auth, write, h.BulkUpdateStatus)
	r.Post("/bulk-update", auth, write, h.BulkUpdate)
	r.Post("/bulk-delete", auth, write, h.BulkDelete)

	// Parameterized /:id routes SECOND
	r.Get("/:id", read, h.GetByID)
	r.Put("/:id", auth, write, h.Update)
	r.Post("/:id/publish", auth, write, h.Publish)
	r.Post("/:id/archive", auth, write, h.ArchiveQuestion)
	r.Post("/:id/restore", auth, write, h.RestoreQuestion)
	r.Post("/:id/unpublish", auth, write, h.UnpublishQuestion)
	r.Post("/:id/clone", auth, write, h.CloneQuestion)
	r.Delete("/:id", auth, write, h.Delete)
	r.Get("/:id/options", read, h.GetOptions)
	r.Put("/:id/options", auth, write, h.ReplaceOptions)
	r.Get("/:id/revisions", read, h.ListRevisions)
}

func (h *Handler) Create(c *fiber.Ctx) error {
	var req CreateQuestionReq
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(shared.Error(shared.ErrValidation, "Invalid request body"))
	}
	if req.Content == "" || req.Difficulty == "" {
		return c.Status(400).JSON(shared.Error(shared.ErrValidation, "content and difficulty are required"))
	}

	userIDStr := c.Locals("user_id")
	if userIDStr == nil {
		return c.Status(401).JSON(shared.Error(shared.ErrUnauthorized, "Not authenticated"))
	}
	userID, err := uuid.Parse(userIDStr.(string))
	if err != nil {
		return c.Status(401).JSON(shared.Error(shared.ErrUnauthorized, "Invalid user ID in token"))
	}
	q, err := h.svc.Create(c.Context(), req, userID)
	if err != nil {
		if e, ok := err.(*fiber.Error); ok {
			return c.Status(e.Code).JSON(shared.Error(shared.ErrorCode(e.Message), e.Message))
		}
		return c.Status(500).JSON(shared.Error(shared.ErrInternal, "Failed to create question"))
	}
	return c.Status(201).JSON(shared.Success(q))
}

func (h *Handler) GetByID(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(400).JSON(shared.Error(shared.ErrValidation, "Invalid question ID"))
	}
	q, err := h.svc.GetByID(c.Context(), id)
	if err != nil {
		return c.Status(500).JSON(shared.Error(shared.ErrInternal, "Failed to get question"))
	}
	if q == nil {
		return c.Status(404).JSON(shared.Error(shared.ErrNotFound, "Question not found"))
	}
	return c.JSON(shared.Success(q))
}

func (h *Handler) List(c *fiber.Ctx) error {
	page, limit := shared.ParsePagination(c)
	var subjectID *uuid.UUID
	if s := c.Query("subject_id"); s != "" && s != "all" && s != "undefined" && s != "null" {
		id, err := uuid.Parse(s)
		if err != nil {
			return c.Status(400).JSON(shared.Error(shared.ErrValidation, "Invalid subject_id"))
		}
		subjectID = &id
	}

	var gradeID *uuid.UUID
	if s := c.Query("grade_id"); s != "" && s != "all" && s != "undefined" && s != "null" {
		id, err := uuid.Parse(s)
		if err != nil {
			return c.Status(400).JSON(shared.Error(shared.ErrValidation, "Invalid grade_id"))
		}
		gradeID = &id
	}
	if gradeID == nil && c.Locals("role") == "SISWA" {
		if uid, err := uuid.Parse(c.Locals("user_id").(string)); err == nil {
			if gid, err := h.svc.content.GetUserGradeID(c.Context(), uid); err == nil && gid != nil {
				gradeID = gid
			}
		}
	}

	difficulty := c.Query("difficulty")
	if difficulty == "all" || difficulty == "undefined" || difficulty == "null" {
		difficulty = ""
	}

	status := c.Query("status")
	if status == "all" || status == "undefined" || status == "null" {
		status = ""
	}

	search := c.Query("q")

	questions, total, err := h.svc.List(c.Context(), subjectID, gradeID, difficulty, status, search, page, limit)
	if err != nil {
		return c.Status(500).JSON(shared.Error(shared.ErrInternal, "Failed to list questions: "+err.Error()))
	}
	return c.JSON(shared.SuccessWithMeta(questions, shared.BuildMeta(page, limit, total)))
}

func (h *Handler) Export(c *fiber.Ctx) error {
	var subjectID *uuid.UUID
	if s := c.Query("subject_id"); s != "" {
		id, err := uuid.Parse(s)
		if err != nil {
			return c.Status(400).JSON(shared.Error(shared.ErrValidation, "Invalid subject_id"))
		}
		subjectID = &id
	}
	difficulty := c.Query("difficulty")
	status := c.Query("status")
	search := c.Query("q")

	questions, _, err := h.svc.List(c.Context(), subjectID, nil, difficulty, status, search, 1, 10000)
	if err != nil {
		return c.Status(500).JSON(shared.Error(shared.ErrInternal, "Failed to export questions"))
	}

	// Build CSV
	var buf strings.Builder
	buf.WriteString("content,difficulty,subject_id,chapter_id,explanation\n")
	for _, q := range questions {
		chID := ""
		if q.ChapterID != nil {
			chID = q.ChapterID.String()
		}
		fmt.Fprintf(&buf, "%s,%s,%s,%s,%s\n", strconv.Quote(q.Content), q.Difficulty, q.SubjectID.String(), chID, strconv.Quote(q.Explanation))
	}

	c.Set("Content-Type", "text/csv")
	c.Set("Content-Disposition", "attachment; filename=questions.csv")
	return c.SendString(buf.String())
}

func (h *Handler) Update(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(400).JSON(shared.Error(shared.ErrValidation, "Invalid question ID"))
	}
	var req UpdateQuestionReq
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(shared.Error(shared.ErrValidation, "Invalid request body"))
	}

	userIDStr := c.Locals("user_id")
	if userIDStr == nil {
		return c.Status(401).JSON(shared.Error(shared.ErrUnauthorized, "Not authenticated"))
	}
	userID, err := uuid.Parse(userIDStr.(string))
	if err != nil {
		return c.Status(401).JSON(shared.Error(shared.ErrUnauthorized, "Invalid user ID in token"))
	}

	q, err := h.svc.Update(c.Context(), id, req, userID)
	if err != nil {
		if e, ok := err.(*fiber.Error); ok {
			return c.Status(e.Code).JSON(shared.Error(shared.ErrorCode(e.Message), e.Message))
		}
		return c.Status(500).JSON(shared.Error(shared.ErrInternal, "Failed to update question: "+err.Error()))
	}
	return c.JSON(shared.Success(q))
}

func (h *Handler) Delete(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(400).JSON(shared.Error(shared.ErrValidation, "Invalid question ID"))
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
			return c.Status(404).JSON(shared.Error(shared.ErrNotFound, "Question not found or not owned by you"))
		}
		return c.Status(500).JSON(shared.Error(shared.ErrInternal, "Failed to delete question"))
	}
	return c.JSON(shared.Success(map[string]string{"message": "Question deleted"}))
}

func (h *Handler) Publish(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(400).JSON(shared.Error(shared.ErrValidation, "Invalid question ID"))
	}
	userIDStr, _ := c.Locals("user_id").(string)
	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		return c.Status(401).JSON(shared.Error(shared.ErrUnauthorized, "Not authenticated"))
	}
	q, err := h.svc.Publish(c.Context(), id, userID)
	if err != nil {
		return c.Status(500).JSON(shared.Error(shared.ErrInternal, "Failed to publish question"))
	}
	if q.Status != "PUBLISHED" {
		return c.Status(400).JSON(shared.Error(shared.ErrValidation, "Question must be in DRAFT status to publish"))
	}
	return c.JSON(shared.Success(q))
}

func (h *Handler) ArchiveQuestion(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(400).JSON(shared.Error(shared.ErrValidation, "Invalid question ID"))
	}
	userIDStr, _ := c.Locals("user_id").(string)
	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		return c.Status(401).JSON(shared.Error(shared.ErrUnauthorized, "Not authenticated"))
	}
	if err := h.svc.ArchiveQuestion(c.Context(), id, userID); err != nil {
		return c.Status(500).JSON(shared.Error(shared.ErrInternal, "Failed to archive question"))
	}
	return c.JSON(shared.Success(fiber.Map{"message": "Question archived"}))
}

func (h *Handler) RestoreQuestion(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(400).JSON(shared.Error(shared.ErrValidation, "Invalid question ID"))
	}
	userIDStr, _ := c.Locals("user_id").(string)
	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		return c.Status(401).JSON(shared.Error(shared.ErrUnauthorized, "Not authenticated"))
	}
	if err := h.svc.RestoreQuestion(c.Context(), id, userID); err != nil {
		return c.Status(500).JSON(shared.Error(shared.ErrInternal, "Failed to restore question"))
	}
	return c.JSON(shared.Success(fiber.Map{"message": "Question restored"}))
}

func (h *Handler) UnpublishQuestion(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(400).JSON(shared.Error(shared.ErrValidation, "Invalid question ID"))
	}
	userIDStr, _ := c.Locals("user_id").(string)
	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		return c.Status(401).JSON(shared.Error(shared.ErrUnauthorized, "Not authenticated"))
	}
	if err := h.svc.UnpublishQuestion(c.Context(), id, userID); err != nil {
		return c.Status(500).JSON(shared.Error(shared.ErrInternal, "Failed to unpublish question"))
	}
	return c.JSON(shared.Success(fiber.Map{"message": "Question unpublished"}))
}

func (h *Handler) CloneQuestion(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(400).JSON(shared.Error(shared.ErrValidation, "Invalid question ID"))
	}
	userIDStr := c.Locals("user_id")
	if userIDStr == nil {
		return c.Status(401).JSON(shared.Error(shared.ErrUnauthorized, "Not authenticated"))
	}
	userID, err := uuid.Parse(userIDStr.(string))
	if err != nil {
		return c.Status(401).JSON(shared.Error(shared.ErrUnauthorized, "Invalid user ID in token"))
	}
	q, _, err := h.svc.Clone(c.Context(), id, userID)
	if err != nil {
		if fe, ok := err.(*fiber.Error); ok {
			return c.Status(fe.Code).JSON(shared.Error(shared.ErrorCode(fe.Message), fe.Message))
		}
		return c.Status(500).JSON(shared.Error(shared.ErrInternal, "Failed to clone question"))
	}
	return c.Status(201).JSON(shared.Success(fiber.Map{"message": "Question cloned", "id": q.ID}))
}

func (h *Handler) GetOptions(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(400).JSON(shared.Error(shared.ErrValidation, "Invalid question ID"))
	}
	opts, err := h.svc.GetOptions(c.Context(), id)
	if err != nil {
		return c.Status(500).JSON(shared.Error(shared.ErrInternal, "Failed to get options"))
	}
	return c.JSON(shared.Success(opts))
}

func (h *Handler) ReplaceOptions(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(400).JSON(shared.Error(shared.ErrValidation, "Invalid question ID"))
	}
	var opts []QuestionOption
	if err := c.BodyParser(&opts); err != nil {
		return c.Status(400).JSON(shared.Error(shared.ErrValidation, "Invalid request body"))
	}
	if err := h.svc.repo.ReplaceOptions(c.Context(), id, opts); err != nil {
		return c.Status(500).JSON(shared.Error(shared.ErrInternal, "Failed to replace options"))
	}
	return c.JSON(shared.Success(fiber.Map{"message": "Options replaced"}))
}

type ImportRow struct {
	Content       string           `json:"content"`
	Difficulty    string           `json:"difficulty"`
	SubjectID     string           `json:"subject_id"`
	ChapterID     *string          `json:"chapter_id,omitempty"`
	Topic         *string          `json:"topic,omitempty"`
	BloomLevel    *string          `json:"bloom_level,omitempty"`
	Language      string           `json:"language,omitempty"`
	Source        *string          `json:"source,omitempty"`
	TopicID       *string          `json:"topic_id,omitempty"`
	SubTopicID    *string          `json:"subtopic_id,omitempty"`
	StimulusID    *string          `json:"stimulus_id,omitempty"`
	Score         float64          `json:"score,omitempty"`
	NegativeScore float64          `json:"negative_score,omitempty"`
	EstimatedTime *int             `json:"estimated_time,omitempty"`
	ThinkingLevel *string          `json:"thinking_level,omitempty"`
	Explanation   string           `json:"explanation,omitempty"`
	QuestionsType string           `json:"question_type,omitempty"`
	Options       []QuestionOption `json:"options"`
	Blocks        []QuestionBlock  `json:"blocks,omitempty"`
}

func (h *Handler) Import(c *fiber.Ctx) error {
	var rows []ImportRow
	if err := c.BodyParser(&rows); err != nil {
		return c.Status(400).JSON(shared.Error(shared.ErrValidation, "Invalid request body: expected array"))
	}
	if len(rows) == 0 {
		return c.Status(400).JSON(shared.Error(shared.ErrValidation, "Empty import data"))
	}

	userIDStr := c.Locals("user_id")
	if userIDStr == nil {
		return c.Status(401).JSON(shared.Error(shared.ErrUnauthorized, "Not authenticated"))
	}
	userID, err := uuid.Parse(userIDStr.(string))
	if err != nil {
		return c.Status(401).JSON(shared.Error(shared.ErrUnauthorized, "Invalid user ID in token"))
	}

	// Create Audit Import Job
	jobID, _ := h.svc.repo.CreateImportJob(c.Context(), "ai_pdf_import.json", len(rows), userID)

	var created int
	var errors []string

	for idx, row := range rows {
		rawBytes, _ := json.Marshal(row)
		subjID, err := uuid.Parse(row.SubjectID)
		if err != nil {
			var foundID uuid.UUID
			err2 := h.svc.repo.pool.QueryRow(c.Context(), `SELECT id FROM academic.subject WHERE name ILIKE $1 OR code ILIKE $1 LIMIT 1`, strings.TrimSpace(row.SubjectID)).Scan(&foundID)
			if err2 == nil {
				subjID = foundID
			} else {
				err3 := h.svc.repo.pool.QueryRow(c.Context(), `SELECT id FROM academic.subject ORDER BY created_at ASC LIMIT 1`).Scan(&foundID)
				if err3 == nil {
					subjID = foundID
				} else {
					errStr := "Invalid subject_id: '" + row.SubjectID + "' and no subject found in database"
					errors = append(errors, errStr)
					if jobID != uuid.Nil {
						_ = h.svc.repo.CreateImportRowLog(c.Context(), jobID, idx+1, rawBytes, "ERROR", errStr, nil)
					}
					continue
				}
			}
		}
		var chID *uuid.UUID
		if row.ChapterID != nil && *row.ChapterID != "" {
			if pid, err := uuid.Parse(*row.ChapterID); err == nil {
				chID = &pid
			}
		}
		var opts []CreateOptionReq
		for _, o := range row.Options {
			opts = append(opts, CreateOptionReq{
				Label:   o.Label,
				Content: o.Content,
				Correct: o.IsCorrect,
			})
		}
		req := CreateQuestionReq{
			SubjectID:     subjID.String(),
			ChapterID:     nil,
			Content:       row.Content,
			Difficulty:    row.Difficulty,
			QuestionType:  row.QuestionsType,
			Topic:         row.Topic,
			BloomLevel:    row.BloomLevel,
			Language:      row.Language,
			Source:        row.Source,
			TopicID:       row.TopicID,
			SubTopicID:    row.SubTopicID,
			StimulusID:    row.StimulusID,
			Score:         row.Score,
			NegativeScore: row.NegativeScore,
			EstimatedTime: row.EstimatedTime,
			ThinkingLevel: row.ThinkingLevel,
			Explanation:   row.Explanation,
			Options:       opts,
			Blocks:        row.Blocks,
		}
		if chID != nil {
			s := chID.String()
			req.ChapterID = &s
		}
		q, err := h.svc.Create(c.Context(), req, userID)
		if err != nil {
			e := row.Content
			if len(e) > 30 {
				e = e[:30]
			}
			errStr := "Row '" + e + "...': " + err.Error()
			errors = append(errors, errStr)
			if jobID != uuid.Nil {
				_ = h.svc.repo.CreateImportRowLog(c.Context(), jobID, idx+1, rawBytes, "ERROR", errStr, nil)
			}
		} else {
			created++
			if jobID != uuid.Nil && q != nil {
				qID := q.ID
				_ = h.svc.repo.CreateImportRowLog(c.Context(), jobID, idx+1, rawBytes, "IMPORTED", "", &qID)
			}
		}
	}

	// Finalize Job Audit Log
	if jobID != uuid.Nil {
		status := "COMPLETED"
		if created == 0 && len(errors) > 0 {
			status = "FAILED"
		}
		errLog := strings.Join(errors, "\n")
		_ = h.svc.repo.UpdateImportJob(c.Context(), jobID, created, len(errors), status, errLog)
	}

	if created == 0 && len(errors) > 0 {
		return c.Status(400).JSON(shared.Error(shared.ErrValidation, "Gagal mengimpor ke database: "+strings.Join(errors, "; ")))
	}

	return c.Status(200).JSON(shared.Success(fiber.Map{
		"job_id":  jobID,
		"created": created,
		"failed":  len(errors),
		"errors":  errors,
	}))
}

func min(a, b int) int {
	if a < b {
		return a
	}
	return b
}

func itoa(n int) string {
	if n == 0 {
		return "0"
	}
	s := ""
	for n > 0 {
		s = string(rune('0'+n%10)) + s
		n /= 10
	}
	return s
}

// --- Revision Handler ---

func (h *Handler) ListRevisions(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(400).JSON(shared.Error(shared.ErrValidation, "Invalid question ID"))
	}
	revs, err := h.svc.ListRevisions(c.Context(), id)
	if err != nil {
		return c.Status(500).JSON(shared.Error(shared.ErrInternal, "Failed to list revisions"))
	}
	if revs == nil {
		revs = []QuestionRevision{}
	}
	return c.JSON(shared.Success(revs))
}

// --- Check Duplicates ---

type DuplicateCheckItem struct {
	ID        string           `json:"id"`
	SubjectID *uuid.UUID       `json:"subject_id,omitempty"`
	Content   string           `json:"content"`
	Options   []QuestionOption `json:"options,omitempty"`
}

type CheckDuplicatesReq struct {
	SubjectID *uuid.UUID           `json:"subject_id,omitempty"`
	Items     []DuplicateCheckItem `json:"items"`
}

type DuplicateCheckResult struct {
	ID                   string `json:"id"`
	IsDuplicate          bool   `json:"is_duplicate"`
	ExistingQuestionID   string `json:"existing_question_id,omitempty"`
	ExistingQuestionCode string `json:"existing_question_code,omitempty"`
	DuplicateType        string `json:"duplicate_type,omitempty"`
}

func (r *Repository) CheckDuplicates(ctx context.Context, req CheckDuplicatesReq) ([]DuplicateCheckResult, error) {
	results := make([]DuplicateCheckResult, len(req.Items))

	hashMap := make(map[string][]int)
	for idx, item := range req.Items {
		results[idx] = DuplicateCheckResult{
			ID:          item.ID,
			IsDuplicate: false,
		}
		if strings.TrimSpace(item.Content) == "" {
			continue
		}

		hash := CalculateContentHash(item.Content, item.Options)
		hashMap[hash] = append(hashMap[hash], idx)
	}

	if len(hashMap) == 0 {
		return results, nil
	}

	var subjID *uuid.UUID
	if req.SubjectID != nil && *req.SubjectID != uuid.Nil {
		subjID = req.SubjectID
	} else {
		for _, item := range req.Items {
			if item.SubjectID != nil && *item.SubjectID != uuid.Nil {
				subjID = item.SubjectID
				break
			}
		}
	}

	var query string
	var args []any
	if subjID != nil && *subjID != uuid.Nil {
		query = `
			SELECT q.id, 
			       COALESCE(
			           (SELECT string_agg(b.content, E'\n' ORDER BY b.block_order)
			            FROM question.question_block b 
			            WHERE b.question_version_id = q.current_version_id AND b.content IS NOT NULL AND b.content != ''), 
			           ''
			       ) AS content
			FROM question.question q
			JOIN question.question_subject qs ON qs.question_id = q.id
			WHERE qs.subject_id = $1 AND q.deleted_at IS NULL
		`
		args = append(args, *subjID)
	} else {
		query = `
			SELECT q.id, 
			       COALESCE(
			           (SELECT string_agg(b.content, E'\n' ORDER BY b.block_order)
			            FROM question.question_block b 
			            WHERE b.question_version_id = q.current_version_id AND b.content IS NOT NULL AND b.content != ''), 
			           ''
			       ) AS content
			FROM question.question q
			WHERE q.deleted_at IS NULL
		`
	}

	rows, err := r.pool.Query(ctx, query, args...)
	if err != nil {
		return results, nil
	}
	defer rows.Close()

	type existingQ struct {
		id      uuid.UUID
		content string
	}
	var existingList []existingQ
	for rows.Next() {
		var eq existingQ
		if err := rows.Scan(&eq.id, &eq.content); err == nil {
			existingList = append(existingList, eq)
		}
	}

	for _, eq := range existingList {
		opts, _ := r.GetOptions(ctx, eq.id)
		existingHash := CalculateContentHash(eq.content, opts)
		if indices, found := hashMap[existingHash]; found {
			for _, idx := range indices {
				results[idx].IsDuplicate = true
				results[idx].ExistingQuestionID = eq.id.String()
				results[idx].ExistingQuestionCode = "QS-" + eq.id.String()[:8]
				results[idx].DuplicateType = "DATABASE"
			}
		}
	}

	return results, nil
}

func (s *Service) CheckDuplicates(ctx context.Context, req CheckDuplicatesReq) ([]DuplicateCheckResult, error) {
	return s.repo.CheckDuplicates(ctx, req)
}

func (h *Handler) CheckDuplicates(c *fiber.Ctx) error {
	var req CheckDuplicatesReq
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(shared.Error(shared.ErrValidation, "Invalid request body"))
	}
	results, err := h.svc.CheckDuplicates(c.Context(), req)
	if err != nil {
		return c.Status(500).JSON(shared.Error(shared.ErrInternal, "Failed to check duplicates"))
	}
	return c.JSON(shared.Success(results))
}

// --- Bulk Operations ---

type BulkIDsReq struct {
	IDs []string `json:"ids"`
}

type BulkStatusReq struct {
	IDs    []string `json:"ids"`
	Status string   `json:"status"`
}

type BulkUpdateReq struct {
	IDs           []string `json:"ids"`
	SubjectID     *string  `json:"subject_id,omitempty"`
	GradeID       *string  `json:"grade_id,omitempty"`
	ChapterID     *string  `json:"chapter_id,omitempty"`
	Difficulty    *string  `json:"difficulty,omitempty"`
	Status        *string  `json:"status,omitempty"`
	Score         *float64 `json:"score,omitempty"`
	NegativeScore *float64 `json:"negative_score,omitempty"`
}

func (r *Repository) BulkPublish(ctx context.Context, ids []uuid.UUID, userID uuid.UUID) error {
	for _, id := range ids {
		_ = r.setStatus(ctx, id, "PUBLISHED", "", userID, "bulk approval & publish")
	}
	return nil
}

func (r *Repository) BulkUpdateStatus(ctx context.Context, ids []uuid.UUID, status string, userID uuid.UUID) error {
	for _, id := range ids {
		_ = r.setStatus(ctx, id, status, "", userID, "bulk status update")
	}
	return nil
}

func (r *Repository) BulkUpdate(ctx context.Context, req BulkUpdateReq, userID uuid.UUID) error {
	for _, idStr := range req.IDs {
		id, err := uuid.Parse(idStr)
		if err != nil {
			continue
		}
		if req.Status != nil && *req.Status != "" {
			_ = r.setStatus(ctx, id, *req.Status, "", userID, "bulk update status")
		}
		if req.Difficulty != nil && *req.Difficulty != "" {
			diff := normalizeDifficulty(*req.Difficulty)
			_, _ = r.pool.Exec(ctx, `UPDATE question.question_metadata SET difficulty_level = $1 WHERE question_id = $2`, diff, id)
		}
		if req.SubjectID != nil && *req.SubjectID != "" {
			if sID, err := uuid.Parse(*req.SubjectID); err == nil {
				_, _ = r.pool.Exec(ctx, `DELETE FROM question.question_subject WHERE question_id = $1`, id)
				_, _ = r.pool.Exec(ctx, `INSERT INTO question.question_subject (question_id, subject_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`, id, sID)
			}
		}
		if req.GradeID != nil && *req.GradeID != "" {
			if gID, err := uuid.Parse(*req.GradeID); err == nil {
				_, _ = r.pool.Exec(ctx, `DELETE FROM question.question_grade WHERE question_id = $1`, id)
				_, _ = r.pool.Exec(ctx, `INSERT INTO question.question_grade (question_id, grade_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`, id, gID)
			}
		}
	}
	return nil
}

func (s *Service) BulkPublish(ctx context.Context, ids []uuid.UUID, userID uuid.UUID) error {
	return s.repo.BulkPublish(ctx, ids, userID)
}

func (s *Service) BulkUpdateStatus(ctx context.Context, ids []uuid.UUID, status string, userID uuid.UUID) error {
	return s.repo.BulkUpdateStatus(ctx, ids, status, userID)
}

func (s *Service) BulkUpdate(ctx context.Context, req BulkUpdateReq, userID uuid.UUID) error {
	return s.repo.BulkUpdate(ctx, req, userID)
}

func (h *Handler) BulkPublish(c *fiber.Ctx) error {
	var req BulkIDsReq
	if err := c.BodyParser(&req); err != nil || len(req.IDs) == 0 {
		return c.Status(400).JSON(shared.Error(shared.ErrValidation, "Invalid request body or empty IDs"))
	}
	userIDStr, _ := c.Locals("user_id").(string)
	userID, _ := uuid.Parse(userIDStr)

	var uuids []uuid.UUID
	for _, idStr := range req.IDs {
		if u, err := uuid.Parse(idStr); err == nil {
			uuids = append(uuids, u)
		}
	}
	if err := h.svc.BulkPublish(c.Context(), uuids, userID); err != nil {
		return c.Status(500).JSON(shared.Error(shared.ErrInternal, "Failed to bulk publish questions"))
	}
	return c.JSON(shared.Success(fiber.Map{"message": "Bulk questions published successfully", "count": len(uuids)}))
}

func (h *Handler) BulkUpdateStatus(c *fiber.Ctx) error {
	var req BulkStatusReq
	if err := c.BodyParser(&req); err != nil || len(req.IDs) == 0 {
		return c.Status(400).JSON(shared.Error(shared.ErrValidation, "Invalid request body or empty IDs"))
	}
	userIDStr, _ := c.Locals("user_id").(string)
	userID, _ := uuid.Parse(userIDStr)

	var uuids []uuid.UUID
	for _, idStr := range req.IDs {
		if u, err := uuid.Parse(idStr); err == nil {
			uuids = append(uuids, u)
		}
	}
	if err := h.svc.BulkUpdateStatus(c.Context(), uuids, req.Status, userID); err != nil {
		return c.Status(500).JSON(shared.Error(shared.ErrInternal, "Failed to bulk update question status"))
	}
	return c.JSON(shared.Success(fiber.Map{"message": "Bulk status updated successfully", "count": len(uuids)}))
}

func (h *Handler) BulkUpdate(c *fiber.Ctx) error {
	var req BulkUpdateReq
	if err := c.BodyParser(&req); err != nil || len(req.IDs) == 0 {
		return c.Status(400).JSON(shared.Error(shared.ErrValidation, "Invalid request body or empty IDs"))
	}
	userIDStr, _ := c.Locals("user_id").(string)
	userID, _ := uuid.Parse(userIDStr)

	if err := h.svc.BulkUpdate(c.Context(), req, userID); err != nil {
		return c.Status(500).JSON(shared.Error(shared.ErrInternal, "Failed to bulk update questions"))
	}
	return c.JSON(shared.Success(fiber.Map{"message": "Bulk questions updated successfully", "count": len(req.IDs)}))
}

func (r *Repository) BulkDelete(ctx context.Context, ids []uuid.UUID, userID uuid.UUID, isAdmin bool) error {
	for _, id := range ids {
		_ = r.Delete(ctx, id, userID, isAdmin)
	}
	return nil
}

func (s *Service) BulkDelete(ctx context.Context, ids []uuid.UUID, userID uuid.UUID, isAdmin bool) error {
	return s.repo.BulkDelete(ctx, ids, userID, isAdmin)
}

func (h *Handler) BulkDelete(c *fiber.Ctx) error {
	var req BulkIDsReq
	if err := c.BodyParser(&req); err != nil || len(req.IDs) == 0 {
		return c.Status(400).JSON(shared.Error(shared.ErrValidation, "Invalid request body or empty IDs"))
	}
	userIDStr, _ := c.Locals("user_id").(string)
	userID, _ := uuid.Parse(userIDStr)
	role, _ := c.Locals("role").(string)
	isAdmin := middleware.HasAnyRole(role, "SUPER_ADMIN", "STAFF")

	var uuids []uuid.UUID
	for _, idStr := range req.IDs {
		if u, err := uuid.Parse(idStr); err == nil {
			uuids = append(uuids, u)
		}
	}
	if err := h.svc.BulkDelete(c.Context(), uuids, userID, isAdmin); err != nil {
		return c.Status(500).JSON(shared.Error(shared.ErrInternal, "Failed to bulk delete questions"))
	}
	return c.JSON(shared.Success(fiber.Map{"message": "Bulk questions deleted successfully", "count": len(uuids)}))
}
