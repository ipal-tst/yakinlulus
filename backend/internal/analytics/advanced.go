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
		SELECT u.id, COALESCE(pf.full_name, u.username),
			COALESCE(AVG(g.score), 0),
			COUNT(DISTINCT p.exam_id) AS total_exams
		FROM cbt.exam_attempt a
		JOIN cbt.exam_participant p ON p.id = a.participant_id
		JOIN identity.user u ON u.id = p.student_id
		LEFT JOIN identity.user_profile pf ON pf.user_id = u.id
		JOIN cbt.grading_result g ON g.attempt_id = a.id
		WHERE EXISTS (
			SELECT 1 FROM cbt.attempt_question aq
			JOIN question.question_subject qs ON qs.question_id = aq.question_id
			WHERE aq.attempt_id = a.id AND qs.subject_id = $1)
		GROUP BY u.id, pf.full_name, u.username
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
		SELECT COALESCE(a.finished_at, a.created_at)::date AS date,
			COALESCE(g.score, 0) AS score, e.title AS exam_title,
			COALESCE(s.name, '') AS subject
		FROM cbt.exam_attempt a
		JOIN cbt.exam_participant p ON p.id = a.participant_id
		JOIN cbt.exam e ON e.id = p.exam_id
		LEFT JOIN cbt.grading_result g ON g.attempt_id = a.id
		LEFT JOIN LATERAL (
			SELECT subj.name FROM cbt.exam_subject es
			JOIN academic.subject subj ON subj.id = es.subject_id
			WHERE es.exam_id = e.id LIMIT 1) s ON true
		WHERE p.student_id = $1 AND COALESCE(a.finished_at, a.created_at) >= NOW() - INTERVAL '30 days'
		ORDER BY COALESCE(a.finished_at, a.created_at) DESC`, studentID)
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
		SELECT COALESCE(qm.difficulty_level, 'MEDIUM'),
			COUNT(DISTINCT pq.question_id) AS count,
			COALESCE(AVG(CASE WHEN gd.status_correct THEN 100.0 ELSE 0.0 END), 0) AS avg_score
		FROM cbt.exam_package_question pq
		JOIN cbt.exam_package pkg ON pkg.id = pq.package_id
		LEFT JOIN question.question_metadata qm ON qm.question_id = pq.question_id
		LEFT JOIN cbt.attempt_question aq ON aq.question_id = pq.question_id
		LEFT JOIN cbt.grading_detail gd ON gd.attempt_question_id = aq.id
		WHERE pkg.exam_id = $1
		GROUP BY COALESCE(qm.difficulty_level, 'MEDIUM')`, examID)
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
			(SELECT COUNT(DISTINCT ur.user_id) FROM identity.user_role ur JOIN identity.role rol ON rol.id = ur.role_id WHERE rol.code = 'STUDENT'),
			(SELECT COUNT(DISTINCT ur.user_id) FROM identity.user_role ur JOIN identity.role rol ON rol.id = ur.role_id WHERE rol.code IN ('GURU','TEACHER')),
			(SELECT COUNT(*) FROM cbt.exam WHERE deleted_at IS NULL),
			(SELECT COUNT(*) FROM question.question WHERE deleted_at IS NULL),
			(SELECT COUNT(*) FROM cbt.exam_attempt WHERE status = 'STARTED'),
			(SELECT COALESCE(AVG(score), 0) FROM cbt.grading_result)`).Scan(
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
