package practice

import (
	"context"
	"fmt"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"

	"yakinlulus.id/backend/internal/content"
	"yakinlulus.id/backend/internal/middleware"
	"yakinlulus.id/backend/internal/shared"
)

// --- DTOs ---

type StartSessionReq struct {
	SubjectID     string `json:"subject_id"`
	GradeID       string `json:"grade_id,omitempty"`
	QuestionCount int    `json:"question_count"`
}

type StartSessionResp struct {
	SessionID uuid.UUID      `json:"session_id"`
	Questions []QuestionItem `json:"questions"`
}

type QuestionItem struct {
	QuestionID uuid.UUID    `json:"question_id"`
	Content    string       `json:"content"`
	Options    []OptionItem `json:"options"`
}

type OptionItem struct {
	ID      uuid.UUID `json:"id"`
	Key     string    `json:"key"`
	Content string    `json:"content"`
}

type AnswerReq struct {
	QuestionID       string `json:"question_id"`
	SelectedOptionID string `json:"selected_option_id"`
}

type AnswerResp struct {
	IsCorrect       bool   `json:"is_correct"`
	CorrectOptionID string `json:"correct_option_id"`
	Explanation     string `json:"explanation"`
}

type SessionListItem struct {
	ID             uuid.UUID `json:"id"`
	Title          string    `json:"title"`
	Score          float64   `json:"score"`
	TotalQuestions int       `json:"total_questions"`
	AnsweredCount  int       `json:"answered_count"`
	CorrectCount   int       `json:"correct_count"`
	Status         string    `json:"status"`
	CreatedAt      time.Time `json:"created_at"`
}

type SessionDetail struct {
	ID             uuid.UUID      `json:"id"`
	Title          string         `json:"title"`
	SubjectID      *uuid.UUID     `json:"subject_id,omitempty"`
	TotalQuestions int            `json:"total_questions"`
	AnsweredCount  int            `json:"answered_count"`
	CorrectCount   int            `json:"correct_count"`
	Score          float64        `json:"score"`
	Status         string         `json:"status"`
	CreatedAt      time.Time      `json:"created_at"`
	CompletedAt    *time.Time     `json:"completed_at,omitempty"`
	Answers        []AnswerDetail `json:"answers"`
}

type AnswerDetail struct {
	QuestionID   uuid.UUID  `json:"question_id"`
	QuestionText string     `json:"question_text"`
	SelectedID   *uuid.UUID `json:"selected_option_id,omitempty"`
	CorrectID    uuid.UUID  `json:"correct_option_id"`
	IsCorrect    *bool      `json:"is_correct,omitempty"`
}

type StatsResp struct {
	TotalSessions  int     `json:"total_sessions"`
	TotalQuestions int     `json:"total_questions"`
	TotalCorrect   int     `json:"total_correct"`
	AverageScore   float64 `json:"average_score"`
	Accuracy       float64 `json:"accuracy"`
}

// --- Repository ---

type Repository struct {
	pool *pgxpool.Pool
}

func NewRepository(pool *pgxpool.Pool) *Repository {
	return &Repository{pool: pool}
}

type questionRow struct {
	ID      uuid.UUID
	Content string
}

type optionRow struct {
	ID      uuid.UUID
	Label   string
	Content string
}

func (r *Repository) pickRandomQuestions(ctx context.Context, subjectID, gradeID *uuid.UUID, limit int) ([]questionRow, error) {
	query := `SELECT c.id, COALESCE(c.title, '') FROM contents c WHERE c.content_type='QUESTION' AND c.status IN ('PUBLISHED','APPROVED')`
	args := []interface{}{}
	argN := 1

	if subjectID != nil {
		query += fmt.Sprintf(" AND c.subject_id = $%d", argN)
		args = append(args, *subjectID)
		argN++
	}
	if gradeID != nil {
		query += fmt.Sprintf(" AND c.grade_id = $%d", argN)
		args = append(args, *gradeID)
		argN++
	}

	query += fmt.Sprintf(" ORDER BY RANDOM() LIMIT $%d", argN)
	args = append(args, limit)

	rows, err := r.pool.Query(ctx, query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var qs []questionRow
	for rows.Next() {
		var q questionRow
		if err := rows.Scan(&q.ID, &q.Content); err != nil {
			return nil, err
		}
		qs = append(qs, q)
	}
	return qs, nil
}

func (r *Repository) getOptions(ctx context.Context, questionID uuid.UUID) ([]optionRow, error) {
	rows, err := r.pool.Query(ctx,
		`SELECT id, label, option_text FROM content_question_options WHERE content_id=$1 ORDER BY display_order`, questionID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var opts []optionRow
	for rows.Next() {
		var o optionRow
		if err := rows.Scan(&o.ID, &o.Label, &o.Content); err != nil {
			return nil, err
		}
		opts = append(opts, o)
	}
	return opts, nil
}

func (r *Repository) createSession(ctx context.Context, userID uuid.UUID, subjectID *uuid.UUID, questionCount int) (uuid.UUID, error) {
	var id uuid.UUID
	err := r.pool.QueryRow(ctx,
		`INSERT INTO content_practice_sessions (user_id, subject_id, total_questions) VALUES ($1, $2, $3) RETURNING id`,
		userID, subjectID, questionCount).Scan(&id)
	return id, err
}

func (r *Repository) getSessionByID(ctx context.Context, sessionID uuid.UUID) (*SessionDetail, error) {
	s := &SessionDetail{}
	err := r.pool.QueryRow(ctx,
		`SELECT id, COALESCE(title, 'Latihan Mandiri'), subject_id, total_questions, answered_count, correct_count, score, status, created_at, completed_at
		 FROM content_practice_sessions WHERE id=$1`, sessionID).Scan(
		&s.ID, &s.Title, &s.SubjectID, &s.TotalQuestions, &s.AnsweredCount, &s.CorrectCount,
		&s.Score, &s.Status, &s.CreatedAt, &s.CompletedAt)
	if err != nil {
		return nil, err
	}

	return s, nil
}

func (r *Repository) getCorrectOption(ctx context.Context, questionID uuid.UUID) (*optionRow, error) {
	o := &optionRow{}
	err := r.pool.QueryRow(ctx,
		`SELECT id, label, option_text FROM content_question_options WHERE content_id=$1 AND is_correct=true LIMIT 1`,
		questionID).Scan(&o.ID, &o.Label, &o.Content)
	if err != nil {
		return nil, err
	}
	return o, nil
}

func (r *Repository) getQuestionExplanation(ctx context.Context, questionID uuid.UUID) (string, error) {
	var explanation string
	err := r.pool.QueryRow(ctx, `SELECT COALESCE(explanation,'') FROM content_questions WHERE content_id=$1`, questionID).Scan(&explanation)
	return explanation, err
}

func (r *Repository) insertAnswer(ctx context.Context, sessionID, questionID, selectedOptionID uuid.UUID, isCorrect bool) error {
	return nil
}

func (r *Repository) updateSessionCounters(ctx context.Context, sessionID uuid.UUID, isCorrect bool) error {
	correctInc := 0
	if isCorrect {
		correctInc = 1
	}
	_, err := r.pool.Exec(ctx,
		`UPDATE content_practice_sessions 
		 SET answered_count = answered_count + 1,
		     correct_count = correct_count + $2
		 WHERE id=$1`, sessionID, correctInc)
	return err
}

func (r *Repository) completeSession(ctx context.Context, sessionID uuid.UUID) error {
	_, err := r.pool.Exec(ctx,
		`UPDATE content_practice_sessions
		 SET status='COMPLETED',
		     score = CASE WHEN total_questions > 0 THEN (correct_count::float / total_questions) * 100 ELSE 0 END,
		     completed_at = NOW()
		 WHERE id=$1 AND status='IN_PROGRESS'`, sessionID)
	return err
}

func (r *Repository) listSessions(ctx context.Context, userID uuid.UUID, limit, offset int) ([]SessionListItem, int, error) {
	var total int
	r.pool.QueryRow(ctx, `SELECT COUNT(*) FROM content_practice_sessions WHERE user_id=$1`, userID).Scan(&total)

	rows, err := r.pool.Query(ctx,
		`SELECT id, COALESCE(title, 'Latihan Mandiri'), score, total_questions, answered_count, correct_count, status, created_at
		 FROM content_practice_sessions WHERE user_id=$1
		 ORDER BY created_at DESC LIMIT $2 OFFSET $3`, userID, limit, offset)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()
	var items []SessionListItem
	for rows.Next() {
		var item SessionListItem
		if err := rows.Scan(&item.ID, &item.Title, &item.Score, &item.TotalQuestions,
			&item.AnsweredCount, &item.CorrectCount, &item.Status, &item.CreatedAt); err != nil {
			continue
		}
		items = append(items, item)
	}
	return items, total, nil
}

func (r *Repository) getStats(ctx context.Context, userID uuid.UUID) (*StatsResp, error) {
	s := &StatsResp{}
	err := r.pool.QueryRow(ctx,
		`SELECT COUNT(*), COALESCE(SUM(total_questions),0), COALESCE(SUM(correct_count),0), COALESCE(AVG(score),0)
		 FROM content_practice_sessions WHERE user_id=$1 AND status='COMPLETED'`,
		userID).Scan(&s.TotalSessions, &s.TotalQuestions, &s.TotalCorrect, &s.AverageScore)
	if err != nil {
		return nil, err
	}
	if s.TotalQuestions > 0 {
		s.Accuracy = float64(s.TotalCorrect) / float64(s.TotalQuestions) * 100
	}
	return s, nil
}

// --- Service ---

type Service struct {
	repo    *Repository
	content content.Repository
}

func NewService(repo *Repository, contentRepo content.Repository) *Service {
	return &Service{repo: repo, content: contentRepo}
}

func (s *Service) StartSession(ctx context.Context, userID uuid.UUID, subjectID, gradeID *uuid.UUID, questionCount int) (*StartSessionResp, error) {
	if questionCount <= 0 {
		questionCount = 10
	}
	if questionCount > 50 {
		questionCount = 50
	}

	qs, err := s.repo.pickRandomQuestions(ctx, subjectID, gradeID, questionCount)
	if err != nil {
		return nil, err
	}
	if len(qs) == 0 {
		return nil, fiber.NewError(fiber.StatusNotFound, "No questions available")
	}

	sessionID, err := s.repo.createSession(ctx, userID, subjectID, len(qs))
	if err != nil {
		return nil, err
	}

	var items []QuestionItem
	for _, q := range qs {
		opts, err := s.repo.getOptions(ctx, q.ID)
		if err != nil {
			continue
		}
		var optItems []OptionItem
		for _, o := range opts {
			optItems = append(optItems, OptionItem{ID: o.ID, Key: o.Label, Content: o.Content})
		}
		items = append(items, QuestionItem{QuestionID: q.ID, Content: q.Content, Options: optItems})
	}

	return &StartSessionResp{SessionID: sessionID, Questions: items}, nil
}

func (s *Service) AnswerQuestion(ctx context.Context, sessionID, userID uuid.UUID, questionID uuid.UUID, selectedOptionID uuid.UUID) (*AnswerResp, error) {
	// Verify session belongs to user
	var dbUserID uuid.UUID
	err := s.repo.pool.QueryRow(ctx, `SELECT user_id FROM practice_sessions WHERE id=$1`, sessionID).Scan(&dbUserID)
	if err != nil {
		return nil, fiber.NewError(fiber.StatusNotFound, "Session not found")
	}
	if dbUserID != userID {
		return nil, fiber.NewError(fiber.StatusForbidden, "Not your session")
	}

	correctOpt, err := s.repo.getCorrectOption(ctx, questionID)
	if err != nil {
		return nil, fiber.NewError(fiber.StatusNotFound, "Question not found")
	}

	isCorrect := selectedOptionID == correctOpt.ID

	if err := s.repo.insertAnswer(ctx, sessionID, questionID, selectedOptionID, isCorrect); err != nil {
		return nil, err
	}

	// Update counters
	if err := s.repo.updateSessionCounters(ctx, sessionID, isCorrect); err != nil {
		return nil, err
	}

	// Check if session should be completed
	var answered, total int
	s.repo.pool.QueryRow(ctx, `SELECT answered_count, total_questions FROM content_practice_sessions WHERE id=$1`, sessionID).Scan(&answered, &total)
	if answered >= total {
		s.repo.completeSession(ctx, sessionID)
	}

	explanation, _ := s.repo.getQuestionExplanation(ctx, questionID)

	return &AnswerResp{
		IsCorrect:       isCorrect,
		CorrectOptionID: correctOpt.ID.String(),
		Explanation:     explanation,
	}, nil
}

func (s *Service) GetSession(ctx context.Context, sessionID, userID uuid.UUID) (*SessionDetail, error) {
	session, err := s.repo.getSessionByID(ctx, sessionID)
	if err != nil {
		return nil, fiber.NewError(fiber.StatusNotFound, "Session not found")
	}
	return session, nil
}

func (s *Service) ListSessions(ctx context.Context, userID uuid.UUID, page, limit int) ([]SessionListItem, int, error) {
	return s.repo.listSessions(ctx, userID, limit, (page-1)*limit)
}

func (s *Service) GetStats(ctx context.Context, userID uuid.UUID) (*StatsResp, error) {
	return s.repo.getStats(ctx, userID)
}

// --- Handler ---

type Handler struct {
	svc  *Service
	role string
}

func NewHandler(svc *Service, jwtSecret string) *Handler {
	return &Handler{svc: svc, role: jwtSecret}
}

func (h *Handler) StartSession(c *fiber.Ctx) error {
	var req StartSessionReq
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(shared.Error(shared.ErrValidation, "Invalid request body"))
	}
	userID := uuid.MustParse(c.Locals("user_id").(string))

	var subjectID *uuid.UUID
	if req.SubjectID != "" {
		id, err := uuid.Parse(req.SubjectID)
		if err != nil {
			return c.Status(400).JSON(shared.Error(shared.ErrValidation, "Invalid subject_id"))
		}
		subjectID = &id
	}

	var gradeID *uuid.UUID
	if req.GradeID != "" {
		id, err := uuid.Parse(req.GradeID)
		if err == nil {
			gradeID = &id
		}
	}
	if gradeID == nil && c.Locals("role") == "STUDENT" {
		if uid, err := uuid.Parse(c.Locals("user_id").(string)); err == nil {
			if gid, err := h.svc.content.GetUserGradeID(c.Context(), uid); err == nil && gid != nil {
				gradeID = gid
			}
		}
	}

	resp, err := h.svc.StartSession(c.Context(), userID, subjectID, gradeID, req.QuestionCount)
	if err != nil {
		if fe, ok := err.(*fiber.Error); ok {
			return c.Status(fe.Code).JSON(shared.Error(shared.ErrorCode(fe.Message), fe.Message))
		}
		return c.Status(500).JSON(shared.Error(shared.ErrInternal, "Failed to start session"))
	}
	return c.JSON(shared.Success(resp))
}

func (h *Handler) AnswerQuestion(c *fiber.Ctx) error {
	sessionID, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(400).JSON(shared.Error(shared.ErrValidation, "Invalid session ID"))
	}
	userID := uuid.MustParse(c.Locals("user_id").(string))

	var req AnswerReq
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(shared.Error(shared.ErrValidation, "Invalid request body"))
	}

	qID, err := uuid.Parse(req.QuestionID)
	if err != nil {
		return c.Status(400).JSON(shared.Error(shared.ErrValidation, "Invalid question_id"))
	}
	optID, err := uuid.Parse(req.SelectedOptionID)
	if err != nil {
		return c.Status(400).JSON(shared.Error(shared.ErrValidation, "Invalid selected_option_id"))
	}

	resp, err := h.svc.AnswerQuestion(c.Context(), sessionID, userID, qID, optID)
	if err != nil {
		if fe, ok := err.(*fiber.Error); ok {
			return c.Status(fe.Code).JSON(shared.Error(shared.ErrorCode(fe.Message), fe.Message))
		}
		return c.Status(500).JSON(shared.Error(shared.ErrInternal, "Failed to submit answer"))
	}
	return c.JSON(shared.Success(resp))
}

func (h *Handler) GetSession(c *fiber.Ctx) error {
	sessionID, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(400).JSON(shared.Error(shared.ErrValidation, "Invalid session ID"))
	}
	userID := uuid.MustParse(c.Locals("user_id").(string))
	session, err := h.svc.GetSession(c.Context(), sessionID, userID)
	if err != nil {
		if fe, ok := err.(*fiber.Error); ok {
			return c.Status(fe.Code).JSON(shared.Error(shared.ErrorCode(fe.Message), fe.Message))
		}
		return c.Status(500).JSON(shared.Error(shared.ErrInternal, "Failed to get session"))
	}
	return c.JSON(shared.Success(session))
}

func (h *Handler) ListSessions(c *fiber.Ctx) error {
	userID := uuid.MustParse(c.Locals("user_id").(string))
	page, limit := shared.ParsePagination(c)
	items, total, err := h.svc.ListSessions(c.Context(), userID, page, limit)
	if err != nil {
		return c.Status(500).JSON(shared.Error(shared.ErrInternal, "Failed to list sessions"))
	}
	return c.JSON(shared.SuccessWithMeta(items, shared.BuildMeta(page, limit, total)))
}

func (h *Handler) GetStats(c *fiber.Ctx) error {
	userID := uuid.MustParse(c.Locals("user_id").(string))
	stats, err := h.svc.GetStats(c.Context(), userID)
	if err != nil {
		return c.Status(500).JSON(shared.Error(shared.ErrInternal, "Failed to get stats"))
	}
	return c.JSON(shared.Success(stats))
}

func (h *Handler) RegisterRoutes(router fiber.Router) {
	auth := middleware.RequireAuth(h.role)
	p := router.Group("/practice", auth)
	p.Post("/sessions/start", h.StartSession)
	p.Post("/sessions/:id/answer", h.AnswerQuestion)
	p.Get("/sessions", h.ListSessions)
	p.Get("/sessions/:id", h.GetSession)
	p.Get("/stats", h.GetStats)
}
