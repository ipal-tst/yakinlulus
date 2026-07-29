package analytics

import (
	"context"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"

	"yakinlulus.id/backend/internal/shared"
)

// --- DTOs ---

type LeaderboardEntry struct {
	UserID     uuid.UUID `json:"user_id"`
	FullName   string    `json:"full_name"`
	AvgScore   float64   `json:"avg_score"`
	TotalExams int       `json:"total_exams"`
	Rank       int       `json:"rank"`
}

type ProgressEntry struct {
	Date      time.Time `json:"date"`
	Score     float64   `json:"score"`
	Subject   string    `json:"subject"`
	ExamTitle string    `json:"exam_title"`
}

type DifficultyBreakdown struct {
	Count    int     `json:"count"`
	AvgScore float64 `json:"avg_score"`
}

type ExamDifficulty struct {
	Easy   DifficultyBreakdown `json:"easy"`
	Medium DifficultyBreakdown `json:"medium"`
	Hard   DifficultyBreakdown `json:"hard"`
}

type SchoolStats struct {
	TotalStudents  int     `json:"total_students"`
	TotalTeachers  int     `json:"total_teachers"`
	TotalExams     int     `json:"total_exams"`
	TotalQuestions int     `json:"total_questions"`
	ActiveSessions int     `json:"active_sessions"`
	AvgScore       float64 `json:"avg_score"`
}

// --- Repository ---

func (r *Repository) GetLeaderboardBySubject(ctx context.Context, subjectID uuid.UUID) ([]LeaderboardEntry, error) {
	rows, err := r.pool.Query(ctx, `
		SELECT u.id, u.full_name,
			COALESCE(COUNT(*) FILTER (WHERE aa.is_correct = true)::float8 / NULLIF(COUNT(*), 0) * 100, 0) AS avg_score,
			COUNT(DISTINCT a.exam_content_id) AS total_exams
		FROM content_exam_attempt_answers aa
		JOIN content_exam_attempts a ON a.id = aa.attempt_id
		JOIN content_exam_questions eq ON eq.question_content_id = aa.question_content_id
		JOIN contents q ON q.id = eq.question_content_id
		JOIN users u ON u.id = a.user_id
		WHERE q.subject_id = $1 AND aa.is_correct IS NOT NULL
		GROUP BY u.id, u.full_name
		ORDER BY avg_score DESC`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var entries []LeaderboardEntry
	rank := 0
	for rows.Next() {
		var e LeaderboardEntry
		if err := rows.Scan(&e.UserID, &e.FullName, &e.AvgScore, &e.TotalExams); err != nil {
			continue
		}
		rank++
		e.Rank = rank
		entries = append(entries, e)
	}
	if entries == nil {
		entries = []LeaderboardEntry{}
	}
	return entries, nil
}

func (r *Repository) GetStudentTimeline(ctx context.Context, studentID uuid.UUID) ([]ProgressEntry, error) {
	rows, err := r.pool.Query(ctx, `
		SELECT a.created_at::date AS date, COALESCE(a.total_score, 0) AS score, c.title AS exam_title,
			COALESCE(s.name, '') AS subject
		FROM content_exam_attempts a
		JOIN contents c ON c.id = a.exam_content_id
		LEFT JOIN subjects s ON s.id = c.subject_id
		WHERE a.user_id = $1 AND a.created_at >= NOW() - INTERVAL '30 days'
		ORDER BY a.created_at DESC`, studentID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var entries []ProgressEntry
	for rows.Next() {
		var e ProgressEntry
		if err := rows.Scan(&e.Date, &e.Score, &e.ExamTitle, &e.Subject); err != nil {
			continue
		}
		entries = append(entries, e)
	}
	if entries == nil {
		entries = []ProgressEntry{}
	}
	return entries, nil
}

func (r *Repository) GetExamDifficulty(ctx context.Context, examID uuid.UUID) (*ExamDifficulty, error) {
	d := &ExamDifficulty{
		Easy:   DifficultyBreakdown{},
		Medium: DifficultyBreakdown{},
		Hard:   DifficultyBreakdown{},
	}

	rows, err := r.pool.Query(ctx, `
		SELECT cq.difficulty,
			COUNT(DISTINCT eq.question_content_id) AS count,
			COALESCE(AVG(CASE WHEN qa.correct_count > 0 THEN 1.0 ELSE 0.0 END), 0) * 100 AS avg_score
		FROM content_exam_questions eq
		JOIN content_questions cq ON cq.content_id = eq.question_content_id
		LEFT JOIN question_analytics qa ON qa.question_id = eq.question_content_id
		WHERE eq.exam_content_id = $1
		GROUP BY cq.difficulty`, examID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	for rows.Next() {
		var diff string
		var item DifficultyBreakdown
		if err := rows.Scan(&diff, &item.Count, &item.AvgScore); err != nil {
			continue
		}
		switch diff {
		case "EASY":
			d.Easy = item
		case "MEDIUM":
			d.Medium = item
		case "HARD":
			d.Hard = item
		}
	}
	return d, nil
}

func (r *Repository) GetSchoolStats(ctx context.Context) (*SchoolStats, error) {
	s := &SchoolStats{}
	err := r.pool.QueryRow(ctx, `
		SELECT
			(SELECT COUNT(*) FROM users WHERE role = 'STUDENT'),
			(SELECT COUNT(*) FROM users WHERE role = 'TEACHER'),
			(SELECT COUNT(*) FROM contents WHERE content_type = 'EXAM'),
			(SELECT COUNT(*) FROM content_questions),
			(SELECT COUNT(*) FROM content_exam_attempts WHERE status = 'IN_PROGRESS'),
			(SELECT COALESCE(AVG(total_score), 0) FROM content_exam_attempts)`).Scan(
		&s.TotalStudents, &s.TotalTeachers, &s.TotalExams,
		&s.TotalQuestions, &s.ActiveSessions, &s.AvgScore)
	if err != nil {
		return nil, err
	}
	return s, nil
}

// --- Service ---

func (s *Service) GetLeaderboardBySubject(ctx context.Context, subjectID uuid.UUID) ([]LeaderboardEntry, error) {
	return s.repo.GetLeaderboardBySubject(ctx, subjectID)
}

func (s *Service) GetStudentTimeline(ctx context.Context, studentID uuid.UUID) ([]ProgressEntry, error) {
	return s.repo.GetStudentTimeline(ctx, studentID)
}

func (s *Service) GetExamDifficulty(ctx context.Context, examID uuid.UUID) (*ExamDifficulty, error) {
	return s.repo.GetExamDifficulty(ctx, examID)
}

func (s *Service) GetSchoolStats(ctx context.Context) (*SchoolStats, error) {
	return s.repo.GetSchoolStats(ctx)
}

// --- Handler ---

func (h *Handler) GetLeaderboardBySubject(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("subject_id"))
	if err != nil {
		return c.Status(400).JSON(shared.Error(shared.ErrValidation, "Invalid subject ID"))
	}
	entries, err := h.svc.GetLeaderboardBySubject(c.Context(), id)
	if err != nil {
		return c.Status(500).JSON(shared.Error(shared.ErrInternal, "Failed to get leaderboard"))
	}
	return c.JSON(shared.Success(entries))
}

func (h *Handler) GetStudentTimeline(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(400).JSON(shared.Error(shared.ErrValidation, "Invalid student ID"))
	}
	entries, err := h.svc.GetStudentTimeline(c.Context(), id)
	if err != nil {
		return c.Status(500).JSON(shared.Error(shared.ErrInternal, "Failed to get timeline"))
	}
	return c.JSON(shared.Success(entries))
}

func (h *Handler) GetExamDifficulty(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(400).JSON(shared.Error(shared.ErrValidation, "Invalid exam ID"))
	}
	d, err := h.svc.GetExamDifficulty(c.Context(), id)
	if err != nil {
		return c.Status(500).JSON(shared.Error(shared.ErrInternal, "Failed to get difficulty distribution"))
	}
	return c.JSON(shared.Success(d))
}

func (h *Handler) GetSchoolStats(c *fiber.Ctx) error {
	s, err := h.svc.GetSchoolStats(c.Context())
	if err != nil {
		return c.Status(500).JSON(shared.Error(shared.ErrInternal, "Failed to get school stats"))
	}
	return c.JSON(shared.Success(s))
}
