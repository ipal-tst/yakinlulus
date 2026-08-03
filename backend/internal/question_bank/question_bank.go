package question_bank

import (
	"context"
	"encoding/json"
	"strconv"
	"strings"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
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

func (r *Repository) Create(ctx context.Context, q *Question, opts []QuestionOption) error {
	tx, err := r.pool.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)

	q.ID = uuid.New()
	if q.Status == "" {
		q.Status = "APPROVED"
	}
	q.CreatedAt = time.Now()
	q.UpdatedAt = time.Now()
	if q.QuestionType == "" {
		q.QuestionType = QuestionTypeSingleChoice
	}
	if q.Language == "" {
		q.Language = "id"
	}
	if q.Score <= 0 {
		q.Score = 1.0
	}

	// Look up grade_id from subject
	var gradeID uuid.UUID
	err = tx.QueryRow(ctx, `SELECT COALESCE(grade_id, '00000000-0000-0000-0000-000000000000')::uuid FROM subjects WHERE id=$1`, q.SubjectID).Scan(&gradeID)
	if err != nil {
		return err
	}

	title := q.Content
	if len(title) > 500 {
		title = title[:500]
	}

	_, err = tx.Exec(ctx,
		`INSERT INTO contents (id, content_type, grade_id, subject_id, chapter_id, topic_id, title, body, status, created_by, created_at, updated_at)
		 VALUES ($1, 'QUESTION', $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
		q.ID, gradeID, q.SubjectID, q.ChapterID, q.TopicID, title, q.Content, q.Status, q.CreatedBy, q.CreatedAt, q.UpdatedAt)
	if err != nil {
		return err
	}

	_, err = tx.Exec(ctx,
		`INSERT INTO content_questions (content_id, question_type, difficulty, bloom_level, thinking_level, language, source, subtopic_id, stimulus_id, score, negative_score, estimated_time, explanation)
		 VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)`,
		q.ID, q.QuestionType, q.Difficulty, q.BloomLevel, q.ThinkingLevel, q.Language, q.Source, q.SubTopicID, q.StimulusID, q.Score, q.NegativeScore, q.EstimatedTime, q.Explanation)
	if err != nil {
		return err
	}

	for i, opt := range opts {
		opt.QuestionID = q.ID
		opt.DisplayOrder = i
		opt.ID = uuid.New()
		_, err = tx.Exec(ctx,
			`INSERT INTO content_question_options (id, content_id, label, option_text, is_correct, display_order, created_at)
			 VALUES ($1,$2,$3,$4,$5,$6, NOW())`,
			opt.ID, opt.QuestionID, opt.Label, opt.Content, opt.IsCorrect, opt.DisplayOrder)
		if err != nil {
			return err
		}
	}

	return tx.Commit(ctx)
}

func (r *Repository) Update(ctx context.Context, q *Question) error {
	q.UpdatedAt = time.Now()
	tx, err := r.pool.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)

	title := q.Content
	if len(title) > 500 {
		title = title[:500]
	}

	_, err = tx.Exec(ctx,
		`UPDATE contents SET subject_id=$1, chapter_id=$2, topic_id=$3, title=$4, body=$5, updated_at=$6 WHERE id=$7`,
		q.SubjectID, q.ChapterID, q.TopicID, title, q.Content, q.UpdatedAt, q.ID)
	if err != nil {
		return err
	}

	_, err = tx.Exec(ctx,
		`UPDATE content_questions SET difficulty=$1, question_type=$2, bloom_level=$3, thinking_level=$4, language=$5, source=$6, subtopic_id=$7, stimulus_id=$8, score=$9, negative_score=$10, estimated_time=$11, explanation=$12 WHERE content_id=$13`,
		q.Difficulty, q.QuestionType, q.BloomLevel, q.ThinkingLevel, q.Language, q.Source,
		q.SubTopicID, q.StimulusID, q.Score, q.NegativeScore, q.EstimatedTime, q.Explanation, q.ID)
	if err != nil {
		return err
	}

	return tx.Commit(ctx)
}

func (r *Repository) Delete(ctx context.Context, id uuid.UUID) error {
	tx, err := r.pool.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)

	_, err = tx.Exec(ctx, `DELETE FROM content_question_options WHERE content_id=$1`, id)
	if err != nil {
		return err
	}
	_, err = tx.Exec(ctx, `DELETE FROM content_questions WHERE content_id=$1`, id)
	if err != nil {
		return err
	}
	_, err = tx.Exec(ctx, `DELETE FROM contents WHERE id=$1`, id)
	if err != nil {
		return err
	}
	return tx.Commit(ctx)
}

func (r *Repository) Publish(ctx context.Context, id uuid.UUID) error {
	now := time.Now()
	_, err := r.pool.Exec(ctx,
		`UPDATE contents SET status='PUBLISHED', published_at=$1, updated_at=$1 WHERE id=$2 AND status='DRAFT'`,
		now, id)
	return err
}

func (r *Repository) ArchiveQuestion(ctx context.Context, id uuid.UUID) error {
	_, err := r.pool.Exec(ctx,
		`UPDATE contents SET status='ARCHIVED', updated_at=NOW() WHERE id=$1 AND status IN ('DRAFT','PUBLISHED')`,
		id)
	return err
}

func (r *Repository) RestoreQuestion(ctx context.Context, id uuid.UUID) error {
	_, err := r.pool.Exec(ctx,
		`UPDATE contents SET status='DRAFT', updated_at=NOW() WHERE id=$1 AND status='ARCHIVED'`,
		id)
	return err
}

func (r *Repository) UnpublishQuestion(ctx context.Context, id uuid.UUID) error {
	_, err := r.pool.Exec(ctx,
		`UPDATE contents SET status='DRAFT', published_at=NULL, updated_at=NOW() WHERE id=$1 AND status='PUBLISHED'`,
		id)
	return err
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
	q := &Question{}
	err := r.pool.QueryRow(ctx,
		`SELECT c.id, COALESCE(c.subject_id, '00000000-0000-0000-0000-000000000000')::uuid, c.chapter_id, COALESCE(c.title, '')::text, '', COALESCE(q.difficulty, 'MEDIUM')::text, COALESCE(q.question_type, 'SINGLE_CHOICE')::text, '', q.bloom_level, COALESCE(q.language, 'id')::text, q.source, c.topic_id, q.subtopic_id, q.stimulus_id, COALESCE(q.score, 1.0)::float8, COALESCE(q.negative_score, 0.0)::float8, q.estimated_time, q.thinking_level, COALESCE(q.explanation, '')::text, COALESCE(c.status, 'APPROVED')::text, COALESCE(c.created_by, '00000000-0000-0000-0000-000000000000')::uuid, c.published_at, c.created_at, c.updated_at, COALESCE(s.name, '')::text, COALESCE(ch.name, '')::text, c.grade_id, COALESCE(g.name, '')::text, COALESCE(l.name, '')::text, COALESCE(l.code, '')::text
		 FROM contents c
		 JOIN content_questions q ON c.id = q.content_id
		 LEFT JOIN subjects s ON c.subject_id = s.id
		 LEFT JOIN chapters ch ON c.chapter_id = ch.id
		 LEFT JOIN grades g ON c.grade_id = g.id
		 LEFT JOIN education_levels l ON g.education_level_id = l.id
		 WHERE c.id = $1`, id,
	).Scan(&q.ID, &q.SubjectID, &q.ChapterID, &q.Content, &q.ImageURL, &q.Difficulty, &q.QuestionType, &q.Topic, &q.BloomLevel, &q.Language, &q.Source,
		&q.TopicID, &q.SubTopicID, &q.StimulusID, &q.Score, &q.NegativeScore, &q.EstimatedTime, &q.ThinkingLevel,
		&q.Explanation, &q.Status, &q.CreatedBy, &q.PublishedAt, &q.CreatedAt, &q.UpdatedAt, &q.SubjectName, &q.ChapterName,
		&q.GradeID, &q.GradeName, &q.LevelName, &q.LevelCode)
	if err != nil {
		return nil, err
	}
	opts, _ := r.GetOptions(ctx, id)
	q.Options = opts
	return q, nil
}

func (r *Repository) List(ctx context.Context, subjectID *uuid.UUID, gradeID *uuid.UUID, difficulty string, status string, search string, limit, offset int) ([]Question, int, error) {
	where := " WHERE c.content_type = 'QUESTION'"
	args := []interface{}{}
	argN := 1

	if search != "" {
		where += " AND (c.title ILIKE $" + itoa(argN) + " OR q.explanation ILIKE $" + itoa(argN) + ")"
		args = append(args, "%"+search+"%")
		argN++
	}
	if subjectID != nil {
		where += " AND c.subject_id = $" + itoa(argN)
		args = append(args, *subjectID)
		argN++
	}
	if gradeID != nil {
		where += " AND c.grade_id = $" + itoa(argN)
		args = append(args, *gradeID)
		argN++
	}
	if difficulty != "" {
		where += " AND q.difficulty = $" + itoa(argN)
		args = append(args, difficulty)
		argN++
	}
	if status != "" {
		where += " AND c.status = $" + itoa(argN)
		args = append(args, status)
		argN++
	}

	var total int
	err := r.pool.QueryRow(ctx, "SELECT COUNT(*) FROM contents c JOIN content_questions q ON c.id = q.content_id"+where, args...).Scan(&total)
	if err != nil {
		return nil, 0, err
	}

	query := "SELECT c.id, COALESCE(c.subject_id, '00000000-0000-0000-0000-000000000000')::uuid, c.chapter_id, COALESCE(c.title, '')::text, '', COALESCE(q.difficulty, 'MEDIUM')::text, COALESCE(q.question_type, 'SINGLE_CHOICE')::text, '', q.bloom_level, COALESCE(q.language, 'id')::text, q.source, c.topic_id, q.subtopic_id, q.stimulus_id, COALESCE(q.score, 1.0)::float8, COALESCE(q.negative_score, 0.0)::float8, q.estimated_time, q.thinking_level, COALESCE(q.explanation, '')::text, COALESCE(c.status, 'APPROVED')::text, COALESCE(c.created_by, '00000000-0000-0000-0000-000000000000')::uuid, c.published_at, c.created_at, c.updated_at, COALESCE(s.name, '')::text, COALESCE(ch.name, '')::text, c.grade_id, COALESCE(g.name, '')::text, COALESCE(l.name, '')::text, COALESCE(l.code, '')::text FROM contents c JOIN content_questions q ON c.id = q.content_id LEFT JOIN subjects s ON c.subject_id = s.id LEFT JOIN chapters ch ON c.chapter_id = ch.id LEFT JOIN grades g ON c.grade_id = g.id LEFT JOIN education_levels l ON g.education_level_id = l.id" + where + " ORDER BY c.created_at DESC LIMIT $" + itoa(argN) + " OFFSET $" + itoa(argN+1)

	queryArgs := make([]interface{}, len(args), len(args)+2)
	copy(queryArgs, args)
	queryArgs = append(queryArgs, limit, offset)

	rows, err := r.pool.Query(ctx, query, queryArgs...)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	var questions []Question
	for rows.Next() {
		var q Question
		var qTypeStr string
		if err := rows.Scan(&q.ID, &q.SubjectID, &q.ChapterID, &q.Content, &q.ImageURL, &q.Difficulty, &qTypeStr, &q.Topic, &q.BloomLevel, &q.Language, &q.Source,
			&q.TopicID, &q.SubTopicID, &q.StimulusID, &q.Score, &q.NegativeScore, &q.EstimatedTime, &q.ThinkingLevel,
			&q.Explanation, &q.Status, &q.CreatedBy, &q.PublishedAt, &q.CreatedAt, &q.UpdatedAt, &q.SubjectName, &q.ChapterName,
			&q.GradeID, &q.GradeName, &q.LevelName, &q.LevelCode); err != nil {
			return nil, 0, err
		}
		q.QuestionType = QuestionType(qTypeStr)
		opts, _ := r.GetOptions(ctx, q.ID)
		q.Options = opts
		questions = append(questions, q)
	}
	return questions, total, nil
}

func (r *Repository) GetOptions(ctx context.Context, questionID uuid.UUID) ([]QuestionOption, error) {
	rows, err := r.pool.Query(ctx,
		"SELECT id, content_id, label, option_text, is_correct, display_order FROM content_question_options WHERE content_id = $1 ORDER BY display_order", questionID)
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

func (r *Repository) ReplaceOptions(ctx context.Context, questionID uuid.UUID, opts []QuestionOption) error {
	tx, err := r.pool.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)

	_, err = tx.Exec(ctx, `DELETE FROM content_question_options WHERE content_id=$1`, questionID)
	if err != nil {
		return err
	}

	for i, opt := range opts {
		opt.QuestionID = questionID
		opt.DisplayOrder = i
		opt.ID = uuid.New()
		_, err = tx.Exec(ctx,
			`INSERT INTO content_question_options (id, content_id, label, option_text, is_correct, display_order, created_at)
			 VALUES ($1,$2,$3,$4,$5,$6, NOW())`,
			opt.ID, opt.QuestionID, opt.Label, opt.Content, opt.IsCorrect, opt.DisplayOrder)
		if err != nil {
			return err
		}
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
	optionsJSON, _ := json.Marshal(opts)
	_, err := r.pool.Exec(ctx,
		`INSERT INTO question_revisions (question_id, revision, content, difficulty, explanation, options, changed_by, change_type, summary)
		 VALUES ($1, (SELECT COALESCE(MAX(revision),0)+1 FROM question_revisions WHERE question_id=$1), $2, $3, $4, $5, $6, $7, $8)`,
		q.ID, q.Content, q.Difficulty, ptrStr(q.Explanation), optionsJSON, changedBy, changeType, summary)
	return err
}

func (r *Repository) ListRevisions(ctx context.Context, questionID uuid.UUID) ([]QuestionRevision, error) {
	rows, err := r.pool.Query(ctx,
		`SELECT id, question_id, revision, content, difficulty, explanation, options, changed_by, change_type, summary, created_at
		 FROM question_revisions WHERE question_id=$1 ORDER BY revision DESC`, questionID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var revs []QuestionRevision
	for rows.Next() {
		var rev QuestionRevision
		if err := rows.Scan(&rev.ID, &rev.QuestionID, &rev.Revision, &rev.Content, &rev.Difficulty, &rev.Explanation, &rev.Options, &rev.ChangedBy, &rev.ChangeType, &rev.Summary, &rev.CreatedAt); err != nil {
			return nil, err
		}
		revs = append(revs, rev)
	}
	return revs, nil
}

func ptrStr(s string) *string {
	if s == "" {
		return nil
	}
	return &s
}

// --- Import Job Logging ---

func (r *Repository) CreateImportJob(ctx context.Context, filename string, totalRows int, createdBy uuid.UUID) (uuid.UUID, error) {
	jobID := uuid.New()
	_, err := r.pool.Exec(ctx,
		`INSERT INTO question_import_jobs (id, filename, total_rows, status, created_by, created_at, updated_at)
		 VALUES ($1, $2, $3, 'PROCESSING', $4, NOW(), NOW())`,
		jobID, filename, totalRows, createdBy)
	return jobID, err
}

func (r *Repository) UpdateImportJob(ctx context.Context, jobID uuid.UUID, successCount int, errorCount int, status string, errorLog string) error {
	_, err := r.pool.Exec(ctx,
		`UPDATE question_import_jobs
		 SET success_count=$1, error_count=$2, status=$3, error_log=$4, updated_at=NOW()
		 WHERE id=$5`,
		successCount, errorCount, status, errorLog, jobID)
	return err
}

func (r *Repository) CreateImportRowLog(ctx context.Context, jobID uuid.UUID, rowNumber int, rawData []byte, status string, errStr string, questionID *uuid.UUID) error {
	_, err := r.pool.Exec(ctx,
		`INSERT INTO question_import_rows (id, job_id, row_number, raw_data, errors, status, question_id, created_at)
		 VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())`,
		uuid.New(), jobID, rowNumber, rawData, errStr, status, questionID)
	return err
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

	if err := s.repo.Update(ctx, q); err != nil {
		return nil, err
	}

	changeType := "updated"
	summary := "content/difficulty updated"
	if existing.Content != q.Content {
		summary = "content updated"
	} else if existing.Difficulty != q.Difficulty {
		summary = "difficulty changed to " + q.Difficulty
	} else if existing.QuestionType != q.QuestionType {
		summary = "question_type changed to " + string(q.QuestionType)
	}

	// Record revision
	var opts []QuestionOption
	if len(req.Options) > 0 {
		for _, o := range req.Options {
			opts = append(opts, QuestionOption{Label: o.Label, Content: o.Content, IsCorrect: o.Correct})
		}
		if err := s.repo.ReplaceOptions(ctx, id, opts); err != nil {
			return nil, err
		}
		changeType = "updated"
		summary = "content and options updated"
	}

	// If no new options provided, fetch existing for revision record
	if len(opts) == 0 {
		existingOpts, _ := s.repo.GetOptions(ctx, id)
		opts = existingOpts
	}

	if err := s.repo.RecordRevision(ctx, q, opts, &changedBy, changeType, summary); err != nil {
		return nil, err
	}

	return s.repo.FindByID(ctx, id)
}

func (s *Service) ListRevisions(ctx context.Context, questionID uuid.UUID) ([]QuestionRevision, error) {
	return s.repo.ListRevisions(ctx, questionID)
}

func (s *Service) Delete(ctx context.Context, id uuid.UUID) error {
	return s.repo.Delete(ctx, id)
}

func (s *Service) Publish(ctx context.Context, id uuid.UUID) (*Question, error) {
	if err := s.repo.Publish(ctx, id); err != nil {
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

func (s *Service) ArchiveQuestion(ctx context.Context, id uuid.UUID) error {
	return s.repo.ArchiveQuestion(ctx, id)
}

func (s *Service) RestoreQuestion(ctx context.Context, id uuid.UUID) error {
	return s.repo.RestoreQuestion(ctx, id)
}

func (s *Service) UnpublishQuestion(ctx context.Context, id uuid.UUID) error {
	return s.repo.UnpublishQuestion(ctx, id)
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
	write := middleware.RequireRole("ADMIN", "STAFF", "TEACHER")
	read := middleware.RequireAuth(h.jwt)
	auth := middleware.RequireAuth(h.jwt)

	r.Get("/", read, h.List)
	r.Get("/:id", read, h.GetByID)
	r.Post("/", auth, write, h.Create)
	r.Get("/export", auth, write, h.Export)
	r.Post("/import", auth, write, h.Import)
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
	if gradeID == nil && c.Locals("role") == "STUDENT" {
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
		buf.WriteString(strconv.Quote(q.Content) + "," + q.Difficulty + "," + q.SubjectID.String() + "," + chID + "," + strconv.Quote(q.Explanation) + "\n")
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
	if err := h.svc.Delete(c.Context(), id); err != nil {
		return c.Status(500).JSON(shared.Error(shared.ErrInternal, "Failed to delete question"))
	}
	return c.JSON(shared.Success(map[string]string{"message": "Question deleted"}))
}

func (h *Handler) Publish(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(400).JSON(shared.Error(shared.ErrValidation, "Invalid question ID"))
	}
	q, err := h.svc.Publish(c.Context(), id)
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
	if err := h.svc.repo.ArchiveQuestion(c.Context(), id); err != nil {
		return c.Status(500).JSON(shared.Error(shared.ErrInternal, "Failed to archive question"))
	}
	return c.JSON(shared.Success(fiber.Map{"message": "Question archived"}))
}

func (h *Handler) RestoreQuestion(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(400).JSON(shared.Error(shared.ErrValidation, "Invalid question ID"))
	}
	if err := h.svc.repo.RestoreQuestion(c.Context(), id); err != nil {
		return c.Status(500).JSON(shared.Error(shared.ErrInternal, "Failed to restore question"))
	}
	return c.JSON(shared.Success(fiber.Map{"message": "Question restored"}))
}

func (h *Handler) UnpublishQuestion(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(400).JSON(shared.Error(shared.ErrValidation, "Invalid question ID"))
	}
	if err := h.svc.repo.UnpublishQuestion(c.Context(), id); err != nil {
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
			err2 := h.svc.repo.pool.QueryRow(c.Context(), `SELECT id FROM subjects WHERE name ILIKE $1 OR code ILIKE $1 LIMIT 1`, strings.TrimSpace(row.SubjectID)).Scan(&foundID)
			if err2 == nil {
				subjID = foundID
			} else {
				err3 := h.svc.repo.pool.QueryRow(c.Context(), `SELECT id FROM subjects ORDER BY created_at ASC LIMIT 1`).Scan(&foundID)
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
