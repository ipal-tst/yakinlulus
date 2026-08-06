package scoring

import (
	"context"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"

	"yakinlulus.id/backend/internal/middleware"
	"yakinlulus.id/backend/internal/shared"
)

type Result struct {
	ID               uuid.UUID          `json:"id"`
	SessionID        uuid.UUID          `json:"session_id"`
	ExamID           uuid.UUID          `json:"exam_id"`
	UserID           uuid.UUID          `json:"user_id"`
	TotalQuestions   int                `json:"total_questions"`
	AnsweredCount    int                `json:"answered_count"`
	CorrectCount     int                `json:"correct_count"`
	WrongCount       int                `json:"wrong_count"`
	UnansweredCount  int                `json:"unanswered_count"`
	Score            float64            `json:"score"`
	PassingGrade     float64            `json:"passing_grade"`
	IsPassed         bool               `json:"is_passed"`
	DurationSeconds  int                `json:"duration_seconds"`
	SubjectBreakdown []SubjectBreakdown `json:"subject_breakdown,omitempty"`
	CreatedAt        time.Time          `json:"created_at"`
}

type SubjectBreakdown struct {
	SubjectID      uuid.UUID `json:"subject_id"`
	SubjectName    string    `json:"subject_name"`
	QuestionsCount int       `json:"questions_count"`
	CorrectCount   int       `json:"correct_count"`
	TotalScore     float64   `json:"total_score"`
	MaxScore       float64   `json:"max_score"`
	Percentage     float64   `json:"percentage"`
}

type Repository struct {
	pool *pgxpool.Pool
}

func NewRepository(pool *pgxpool.Pool) *Repository {
	return &Repository{pool: pool}
}

const resultProjection = `
	a.id,
	a.id AS session_id,
	p.exam_id AS exam_id,
	p.student_id AS user_id,
	COALESCE(g.correct,0)+COALESCE(g.wrong,0)+COALESCE(g.blank,0) AS total_questions,
	COALESCE(g.correct,0)+COALESCE(g.wrong,0) AS answered_count,
	COALESCE(g.correct,0) AS correct_count,
	COALESCE(g.wrong,0) AS wrong_count,
	COALESCE(g.blank,0) AS unanswered_count,
	COALESCE(g.score,0) AS score,
	COALESCE(md.passing_score, 60.0) AS passing_grade,
	COALESCE(g.passed, false) AS is_passed,
	EXTRACT(EPOCH FROM (COALESCE(a.finished_at, a.started_at) - a.started_at))::int AS duration_seconds,
	a.started_at AS created_at`

func (r *Repository) GetResult(ctx context.Context, sessionID uuid.UUID) (*Result, error) {
	res := &Result{}
	err := r.pool.QueryRow(ctx, `
		SELECT `+resultProjection+`
		FROM cbt.exam_attempt a
		JOIN cbt.exam_participant p ON p.id = a.participant_id
		LEFT JOIN cbt.grading_result g ON g.attempt_id = a.id
		LEFT JOIN cbt.exam_metadata md ON md.exam_id = p.exam_id
		WHERE a.id = $1`, sessionID,
	).Scan(&res.ID, &res.SessionID, &res.ExamID, &res.UserID, &res.TotalQuestions, &res.AnsweredCount, &res.CorrectCount, &res.WrongCount, &res.UnansweredCount, &res.Score, &res.PassingGrade, &res.IsPassed, &res.DurationSeconds, &res.CreatedAt)
	if err != nil {
		return nil, err
	}

	breakdown, err := r.GetSubjectBreakdown(ctx, sessionID)
	if err == nil {
		res.SubjectBreakdown = breakdown
	}

	return res, nil
}

func (r *Repository) GetSubjectBreakdown(ctx context.Context, sessionID uuid.UUID) ([]SubjectBreakdown, error) {
	rows, err := r.pool.Query(ctx, `
		SELECT
			sub.subject_id,
			s.name AS subject_name,
			COUNT(*) AS questions_count,
			COALESCE(SUM(CASE WHEN gd.status_correct THEN 1 ELSE 0 END),0) AS correct_count,
			COALESCE(SUM(gd.score),0) AS total_score,
			COUNT(*) * 1.0 AS max_score
		FROM cbt.grading_detail gd
		JOIN cbt.attempt_question aq ON aq.id = gd.attempt_question_id
		JOIN question.question_subject sub ON sub.question_id = aq.question_id
		JOIN academic.subject s ON s.id = sub.subject_id
		WHERE aq.attempt_id = $1
		GROUP BY sub.subject_id, s.name`, sessionID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var breakdown []SubjectBreakdown
	for rows.Next() {
		var sb SubjectBreakdown
		err := rows.Scan(&sb.SubjectID, &sb.SubjectName, &sb.QuestionsCount, &sb.CorrectCount, &sb.TotalScore, &sb.MaxScore)
		if err != nil {
			return nil, err
		}
		if sb.MaxScore > 0 {
			sb.Percentage = sb.TotalScore / sb.MaxScore * 100
		}
		breakdown = append(breakdown, sb)
	}
	return breakdown, nil
}

func (r *Repository) ListByUser(ctx context.Context, userID uuid.UUID, limit, offset int) ([]Result, int, error) {
	var total int
	r.pool.QueryRow(ctx, `
		SELECT COUNT(*) FROM cbt.exam_attempt a
		JOIN cbt.exam_participant p ON p.id = a.participant_id
		WHERE p.student_id = $1`, userID).Scan(&total)

	rows, err := r.pool.Query(ctx, `
		SELECT `+resultProjection+`
		FROM cbt.exam_attempt a
		JOIN cbt.exam_participant p ON p.id = a.participant_id
		LEFT JOIN cbt.grading_result g ON g.attempt_id = a.id
		LEFT JOIN cbt.exam_metadata md ON md.exam_id = p.exam_id
		WHERE p.student_id = $1 ORDER BY a.started_at DESC LIMIT $2 OFFSET $3`,
		userID, limit, offset)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	var results []Result
	for rows.Next() {
		var r Result
		if err := rows.Scan(&r.ID, &r.SessionID, &r.ExamID, &r.UserID, &r.TotalQuestions, &r.AnsweredCount, &r.CorrectCount, &r.WrongCount, &r.UnansweredCount, &r.Score, &r.PassingGrade, &r.IsPassed, &r.DurationSeconds, &r.CreatedAt); err != nil {
			return nil, 0, err
		}
		results = append(results, r)
	}
	return results, total, nil
}

type Service struct {
	repo *Repository
}

func NewService(repo *Repository) *Service {
	return &Service{repo: repo}
}

type Handler struct {
	svc *Service
	jwt string
}

func NewHandler(svc *Service, jwtSecret string) *Handler {
	return &Handler{svc: svc, jwt: jwtSecret}
}

func (h *Handler) RegisterRoutes(router fiber.Router) {
	r := router.Group("/results", middleware.RequireAuth(h.jwt))
	r.Get("/", h.MyResults)
	r.Get("/:session_id", h.GetBySession)
}

func (h *Handler) GetBySession(c *fiber.Ctx) error {
	sessionID, err := uuid.Parse(c.Params("session_id"))
	if err != nil {
		return c.Status(400).JSON(shared.Error(shared.ErrValidation, "Invalid session ID"))
	}

	userID, ok := middleware.UserIDFromCtx(c)
	if !ok {
		return c.Status(401).JSON(shared.Error(shared.ErrUnauthorized, "Unauthorized"))
	}

	result, err := h.svc.repo.GetResult(c.Context(), sessionID)
	if err != nil {
		return c.Status(404).JSON(shared.Error(shared.ErrNotFound, "Result not found"))
	}
	if result.UserID != userID {
		return c.Status(403).JSON(shared.Error(shared.ErrForbidden, "Not your result"))
	}

	return c.JSON(shared.Success(result))
}

func (h *Handler) MyResults(c *fiber.Ctx) error {
	userID := uuid.MustParse(c.Locals("user_id").(string))
	page, limit := shared.ParsePagination(c)

	results, total, err := h.svc.repo.ListByUser(c.Context(), userID, limit, (page-1)*limit)
	if err != nil {
		return c.Status(500).JSON(shared.Error(shared.ErrInternal, "Failed to list results"))
	}

	return c.JSON(shared.SuccessWithMeta(results, shared.BuildMeta(page, limit, total)))
}
