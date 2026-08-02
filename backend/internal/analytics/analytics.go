package analytics

import (
	"context"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"

	"yakinlulus.id/backend/internal/middleware"
	"yakinlulus.id/backend/internal/shared"
)

// --- DTOs ---

type ExamAnalyticsDetail struct {
	TotalParticipants int                 `json:"total_participants"`
	TotalStarted      int                 `json:"total_started"`
	TotalFinished     int                 `json:"total_finished"`
	AverageScore      float64             `json:"average_score"`
	HighestScore      float64             `json:"highest_score"`
	LowestScore       float64             `json:"lowest_score"`
	PassRate          float64             `json:"pass_rate"`
	AvgDurationSec    float64             `json:"avg_duration_seconds"`
	QuestionBreakdown []QuestionBreakdown `json:"question_breakdown,omitempty"`
}

type QuestionBreakdown struct {
	QuestionID    uuid.UUID `json:"question_id"`
	QuestionText  string    `json:"question_text"`
	TotalAttempts int       `json:"total_attempts"`
	CorrectCount  int       `json:"correct_count"`
	WrongCount    int       `json:"wrong_count"`
	Accuracy      float64   `json:"accuracy"`
}

type StudentAnalytics struct {
	TotalExamsTaken int                `json:"total_exams_taken"`
	AverageScore    float64            `json:"average_score"`
	TotalPassed     int                `json:"total_passed"`
	TotalFailed     int                `json:"total_failed"`
	TotalQuestions  int                `json:"total_questions"`
	TotalCorrect    int                `json:"total_correct"`
	TotalWrong      int                `json:"total_wrong"`
	TotalUnanswered int                `json:"total_unanswered"`
	Accuracy        float64            `json:"accuracy"`
	Subjects        []SubjectBreakdown `json:"subjects,omitempty"`
	RecentResults   []RecentResult     `json:"recent_results,omitempty"`
}

type SubjectBreakdown struct {
	SubjectID      uuid.UUID `json:"subject_id"`
	SubjectName    string    `json:"subject_name"`
	QuestionsCount int       `json:"questions_count"`
	CorrectCount   int       `json:"correct_count"`
	WrongCount     int       `json:"wrong_count"`
	TotalScore     float64   `json:"total_score"`
	MaxScore       float64   `json:"max_score"`
	Percentage     float64   `json:"percentage"`
}

type RecentResult struct {
	ExamContentID uuid.UUID `json:"exam_content_id"`
	ExamTitle     string    `json:"exam_title"`
	Score         float64   `json:"score"`
	IsPassed      bool      `json:"is_passed"`
	CreatedAt     time.Time `json:"created_at"`
}

type QuestionAnalyticsDetail struct {
	TotalAttempts    int               `json:"total_attempts"`
	CorrectCount     int               `json:"correct_count"`
	WrongCount       int               `json:"wrong_count"`
	Accuracy         float64           `json:"accuracy"`
	OptionBreakdown  []OptionBreakdown `json:"option_breakdown,omitempty"`
	UsedInExamsCount int               `json:"used_in_exams_count"`
}

type OptionBreakdown struct {
	OptionID    uuid.UUID `json:"option_id"`
	OptionText  string    `json:"option_text"`
	TimesPicked int       `json:"times_picked"`
}

// AdminReportDetail combines exam info with analytics
type AdminReportDetail struct {
	ExamID            uuid.UUID `json:"exam_id"`
	Title             string    `json:"title"`
	Status            string    `json:"status"`
	DurationMinutes   int       `json:"duration_minutes"`
	PassingGrade      float64   `json:"passing_grade"`
	TotalParticipants int       `json:"total_participants"`
	TotalStarted      int       `json:"total_started"`
	TotalFinished     int       `json:"total_finished"`
	AverageScore      float64   `json:"average_score"`
	HighestScore      float64   `json:"highest_score"`
	LowestScore       float64   `json:"lowest_score"`
	PassRate          float64   `json:"pass_rate"`
	AvgDurationSec    float64   `json:"avg_duration_seconds"`
	ScoreDistribution []int     `json:"score_distribution"`
}

type AdminReportItem struct {
	ExamID            uuid.UUID `json:"exam_id"`
	Title             string    `json:"title"`
	TotalParticipants int       `json:"total_participants"`
	TotalStarted      int       `json:"total_started"`
	TotalFinished     int       `json:"total_finished"`
	AverageScore      float64   `json:"average_score"`
	PassRate          float64   `json:"pass_rate"`
}

// AdminOverviewAnalytics represents aggregate analytics for the admin dashboard
type AdminOverviewAnalytics struct {
	TotalParticipants  int                        `json:"total_participants"`
	TotalExams         int                        `json:"total_exams"`
	TotalQuestions     int                        `json:"total_questions"`
	TotalAnswers       int                        `json:"total_answers"`
	AverageScore       float64                    `json:"average_score"`
	PassRate           float64                    `json:"pass_rate"`
	ItemFitIndex       float64                    `json:"item_fit_index"`
	ScoreDistribution  ScoreDistributionBreakdown `json:"score_distribution"`
	SubjectPerformance []SubjectPerformanceItem   `json:"subject_performance"`
}

type ScoreDistributionBreakdown struct {
	Bracket700Plus  int `json:"bracket_700_plus"`
	Bracket600_699  int `json:"bracket_600_699"`
	Bracket500_599  int `json:"bracket_500_599"`
	BracketBelow500 int `json:"bracket_below_500"`
}

type SubjectPerformanceItem struct {
	SubjectID      uuid.UUID `json:"subject_id"`
	SubjectName    string    `json:"subject_name"`
	AvgScore       float64   `json:"avg_score"`
	Difficulty     string    `json:"difficulty"`
	TotalQuestions int       `json:"total_questions"`
}

// --- Repository ---

type Repository struct {
	pool *pgxpool.Pool
}

func NewRepository(pool *pgxpool.Pool) *Repository {
	return &Repository{pool: pool}
}

func (r *Repository) GetExamAnalytics(ctx context.Context, examID uuid.UUID) (*ExamAnalyticsDetail, error) {
	a := &ExamAnalyticsDetail{}

	r.pool.QueryRow(ctx, `SELECT COUNT(*) FROM content_exam_participants WHERE exam_content_id=$1`, examID).Scan(&a.TotalParticipants)
	r.pool.QueryRow(ctx, `SELECT COUNT(*) FROM content_exam_attempts WHERE exam_content_id=$1`, examID).Scan(&a.TotalStarted)
	r.pool.QueryRow(ctx, `SELECT COUNT(*) FROM content_exam_attempts WHERE exam_content_id=$1 AND status IN ('FINISHED','SUBMITTED','GRADED','TERMINATED')`, examID).Scan(&a.TotalFinished)
	r.pool.QueryRow(ctx, `SELECT COALESCE(AVG(total_score),0) FROM content_exam_attempts WHERE exam_content_id=$1`, examID).Scan(&a.AverageScore)
	r.pool.QueryRow(ctx, `SELECT COALESCE(MAX(total_score),0) FROM content_exam_attempts WHERE exam_content_id=$1`, examID).Scan(&a.HighestScore)
	r.pool.QueryRow(ctx, `SELECT COALESCE(MIN(total_score),0) FROM content_exam_attempts WHERE exam_content_id=$1`, examID).Scan(&a.LowestScore)

	var totalResults, passed int
	r.pool.QueryRow(ctx, `SELECT COUNT(*) FROM content_exam_attempts WHERE exam_content_id=$1`, examID).Scan(&totalResults)
	if totalResults > 0 {
		r.pool.QueryRow(ctx, `SELECT COUNT(*) FROM content_exam_attempts WHERE exam_content_id=$1 AND is_passed=true`, examID).Scan(&passed)
		a.PassRate = float64(passed) / float64(totalResults) * 100
	}

	r.pool.QueryRow(ctx, `SELECT COALESCE(AVG(time_spent_seconds),0) FROM content_exam_attempts WHERE exam_content_id=$1`, examID).Scan(&a.AvgDurationSec)

	// Question breakdown for this exam
	rows, err := r.pool.Query(ctx,
		`SELECT cq.content_id, c.title,
		 COUNT(aa.attempt_id) AS total_attempts,
		 COUNT(*) FILTER (WHERE aa.is_correct = true) AS correct_count,
		 COUNT(*) FILTER (WHERE aa.is_correct = false) AS wrong_count
		 FROM content_exam_questions eq
		 JOIN content_questions cq ON cq.content_id = eq.question_content_id
		 JOIN contents c ON c.id = cq.content_id
		 LEFT JOIN content_exam_answers aa ON aa.question_content_id = cq.content_id
		 WHERE eq.exam_content_id = $1
		 GROUP BY cq.content_id, c.title
		 ORDER BY total_attempts DESC`, examID)
	if err == nil {
		defer rows.Close()
		for rows.Next() {
			var qb QuestionBreakdown
			if err := rows.Scan(&qb.QuestionID, &qb.QuestionText, &qb.TotalAttempts, &qb.CorrectCount, &qb.WrongCount); err != nil {
				continue
			}
			total := qb.CorrectCount + qb.WrongCount
			if total > 0 {
				qb.Accuracy = float64(qb.CorrectCount) / float64(total) * 100
			}
			a.QuestionBreakdown = append(a.QuestionBreakdown, qb)
		}
	}

	return a, nil
}

func (r *Repository) GetStudentAnalytics(ctx context.Context, studentID uuid.UUID) (*StudentAnalytics, error) {
	a := &StudentAnalytics{}

	r.pool.QueryRow(ctx, `SELECT COUNT(*) FROM content_exam_attempts WHERE user_id=$1`, studentID).Scan(&a.TotalExamsTaken)
	r.pool.QueryRow(ctx, `SELECT COALESCE(AVG(total_score),0) FROM content_exam_attempts WHERE user_id=$1`, studentID).Scan(&a.AverageScore)
	r.pool.QueryRow(ctx, `SELECT COUNT(*) FROM content_exam_attempts a JOIN content_exams ce ON ce.content_id = a.exam_content_id WHERE a.user_id=$1 AND a.total_score >= ce.passing_score`, studentID).Scan(&a.TotalPassed)
	r.pool.QueryRow(ctx, `SELECT COUNT(*) FROM content_exam_attempts WHERE user_id=$1 AND total_score IS NOT NULL`, studentID).Scan(new(int))

	// TotalQuestions, TotalCorrect, TotalWrong, TotalUnanswered, Accuracy
	r.pool.QueryRow(ctx,
		`SELECT COALESCE(COUNT(*), 0),
		        COALESCE(COUNT(*) FILTER (WHERE is_correct = true), 0),
		        COALESCE(COUNT(*) FILTER (WHERE is_correct = false), 0),
		        COALESCE(COUNT(*) FILTER (WHERE is_correct IS NULL), 0)
		 FROM content_exam_answers aa
		 JOIN content_exam_attempts a ON a.id = aa.attempt_id
		 WHERE a.user_id = $1`, studentID,
	).Scan(&a.TotalQuestions, &a.TotalCorrect, &a.TotalWrong, &a.TotalUnanswered)
	if a.TotalCorrect+a.TotalWrong > 0 {
		a.Accuracy = float64(a.TotalCorrect) / float64(a.TotalCorrect+a.TotalWrong) * 100
	}

	// TotalFailed = took exam with score < passing
	var totalWithScore int
	r.pool.QueryRow(ctx, `SELECT COUNT(*) FROM content_exam_attempts WHERE user_id=$1 AND total_score IS NOT NULL`, studentID).Scan(&totalWithScore)
	a.TotalFailed = totalWithScore - a.TotalPassed

	// Subject breakdown
	sRows, err := r.pool.Query(ctx,
		`SELECT s.id, s.name,
		 COUNT(aa.attempt_id) AS total,
		 COUNT(*) FILTER (WHERE aa.is_correct = true) AS correct,
		 COUNT(*) FILTER (WHERE aa.is_correct = false) AS wrong
		 FROM content_exam_answers aa
		 JOIN content_exam_questions eq ON eq.question_content_id = aa.question_content_id
		 JOIN contents q ON q.id = eq.question_content_id
		 JOIN subjects s ON s.id = q.subject_id
		 JOIN content_exam_attempts a ON a.id = aa.attempt_id
		 WHERE a.user_id = $1
		 GROUP BY s.id, s.name
		 ORDER BY correct::float / NULLIF(total,0) ASC`, studentID)
	if err == nil {
		defer sRows.Close()
		for sRows.Next() {
			var sb SubjectBreakdown
			if err := sRows.Scan(&sb.SubjectID, &sb.SubjectName, &sb.QuestionsCount, &sb.CorrectCount, &sb.WrongCount); err != nil {
				continue
			}
			if sb.QuestionsCount > 0 {
				sb.Percentage = float64(sb.CorrectCount) / float64(sb.QuestionsCount) * 100
				sb.TotalScore = float64(sb.CorrectCount) * 1.0
				sb.MaxScore = float64(sb.QuestionsCount) * 1.0
			}
			a.Subjects = append(a.Subjects, sb)
		}
	}

	// Recent results
	rRows, err := r.pool.Query(ctx,
		`SELECT a.exam_content_id, c.title, COALESCE(a.total_score, 0),
		        COALESCE(a.total_score >= ce.passing_score, false), a.created_at
		 FROM content_exam_attempts a
		 JOIN contents c ON c.id = a.exam_content_id
		 LEFT JOIN content_exams ce ON ce.content_id = a.exam_content_id
		 WHERE a.user_id = $1
		 ORDER BY a.created_at DESC LIMIT 10`, studentID)
	if err == nil {
		defer rRows.Close()
		for rRows.Next() {
			var rr RecentResult
			if err := rRows.Scan(&rr.ExamContentID, &rr.ExamTitle, &rr.Score, &rr.IsPassed, &rr.CreatedAt); err != nil {
				continue
			}
			a.RecentResults = append(a.RecentResults, rr)
		}
	}

	return a, nil
}

func (r *Repository) GetQuestionAnalytics(ctx context.Context, questionID uuid.UUID) (*QuestionAnalyticsDetail, error) {
	a := &QuestionAnalyticsDetail{}

	r.pool.QueryRow(ctx,
		`SELECT COUNT(*),
		 COUNT(*) FILTER (WHERE is_correct = true),
		 COUNT(*) FILTER (WHERE is_correct = false)
		 FROM content_exam_answers WHERE question_content_id=$1`, questionID).Scan(&a.TotalAttempts, &a.CorrectCount, &a.WrongCount)
	total := a.CorrectCount + a.WrongCount
	if total > 0 {
		a.Accuracy = float64(a.CorrectCount) / float64(total) * 100
	}

	r.pool.QueryRow(ctx, `SELECT COUNT(*) FROM content_exam_questions WHERE question_content_id=$1`, questionID).Scan(&a.UsedInExamsCount)

	oRows, err := r.pool.Query(ctx,
		`SELECT o.id, o.option_text,
		 (SELECT COUNT(*) FROM content_exam_answers aa WHERE aa.question_content_id = $1 AND o.id = ANY(aa.selected_options)) AS picked
		 FROM content_question_options o WHERE o.content_id = $1
		 ORDER BY o.display_order`, questionID)
	if err == nil {
		defer oRows.Close()
		for oRows.Next() {
			var ob OptionBreakdown
			if err := oRows.Scan(&ob.OptionID, &ob.OptionText, &ob.TimesPicked); err != nil {
				continue
			}
			a.OptionBreakdown = append(a.OptionBreakdown, ob)
		}
	}

	return a, nil
}

func (r *Repository) GetAdminExamReports(ctx context.Context, limit, offset int) ([]AdminReportItem, int, error) {
	var total int
	r.pool.QueryRow(ctx, `SELECT COUNT(*) FROM contents WHERE content_type = 'EXAM'`).Scan(&total)

	rows, err := r.pool.Query(ctx,
		`SELECT e.id, e.title,
		 (SELECT COUNT(*) FROM content_exam_participants WHERE exam_content_id=e.id) AS participants,
		 (SELECT COUNT(*) FROM content_exam_attempts WHERE exam_content_id=e.id) AS started,
		 (SELECT COUNT(*) FROM content_exam_attempts WHERE exam_content_id=e.id AND status IN ('FINISHED','SUBMITTED','GRADED','TERMINATED')) AS finished,
		 (SELECT COALESCE(AVG(total_score),0) FROM content_exam_attempts WHERE exam_content_id=e.id) AS avg_score,
		 CASE
		   WHEN (SELECT COUNT(*) FROM content_exam_attempts WHERE exam_content_id=e.id) > 0
		   THEN (SELECT COUNT(*) FROM content_exam_attempts WHERE exam_content_id=e.id AND total_score >= 60)::float
		      / (SELECT COUNT(*) FROM content_exam_attempts WHERE exam_content_id=e.id) * 100
		   ELSE 0
		 END AS pass_rate
		 FROM contents e
		 WHERE e.content_type = 'EXAM'
		 ORDER BY e.created_at DESC
		 LIMIT $1 OFFSET $2`, limit, offset)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	var items []AdminReportItem
	for rows.Next() {
		var item AdminReportItem
		if err := rows.Scan(&item.ExamID, &item.Title, &item.TotalParticipants, &item.TotalStarted, &item.TotalFinished, &item.AverageScore, &item.PassRate); err != nil {
			continue
		}
		items = append(items, item)
	}
	return items, total, nil
}

func (r *Repository) GetAdminExamReportByID(ctx context.Context, examID uuid.UUID) (*AdminReportDetail, error) {
	d := &AdminReportDetail{}

	err := r.pool.QueryRow(ctx,
		`SELECT c.id, c.title, c.status, ce.duration_minutes, ce.passing_score
		 FROM contents c JOIN content_exams ce ON ce.content_id = c.id
		 WHERE c.id=$1 AND c.content_type='EXAM'`, examID,
	).Scan(&d.ExamID, &d.Title, &d.Status, &d.DurationMinutes, &d.PassingGrade)
	if err != nil {
		return nil, err
	}

	r.pool.QueryRow(ctx, `SELECT COUNT(*) FROM content_exam_participants WHERE exam_content_id=$1`, examID).Scan(&d.TotalParticipants)
	r.pool.QueryRow(ctx, `SELECT COUNT(*) FROM content_exam_attempts WHERE exam_content_id=$1`, examID).Scan(&d.TotalStarted)
	r.pool.QueryRow(ctx, `SELECT COUNT(*) FROM content_exam_attempts WHERE exam_content_id=$1 AND status IN ('FINISHED','SUBMITTED','GRADED','TERMINATED')`, examID).Scan(&d.TotalFinished)
	r.pool.QueryRow(ctx, `SELECT COALESCE(AVG(total_score),0) FROM content_exam_attempts WHERE exam_content_id=$1`, examID).Scan(&d.AverageScore)
	r.pool.QueryRow(ctx, `SELECT COALESCE(MAX(total_score),0) FROM content_exam_attempts WHERE exam_content_id=$1`, examID).Scan(&d.HighestScore)
	r.pool.QueryRow(ctx, `SELECT COALESCE(MIN(total_score),0) FROM content_exam_attempts WHERE exam_content_id=$1`, examID).Scan(&d.LowestScore)

	var totalResults, passed int
	r.pool.QueryRow(ctx, `SELECT COUNT(*) FROM content_exam_attempts WHERE exam_content_id=$1`, examID).Scan(&totalResults)
	if totalResults > 0 {
		r.pool.QueryRow(ctx, `SELECT COUNT(*) FROM content_exam_attempts WHERE exam_content_id=$1 AND total_score >= $2`, examID, d.PassingGrade).Scan(&passed)
		d.PassRate = float64(passed) / float64(totalResults) * 100
	}

	r.pool.QueryRow(ctx, `SELECT COALESCE(AVG(time_spent_seconds),0) FROM content_exam_attempts WHERE exam_content_id=$1`, examID).Scan(&d.AvgDurationSec)

	d.ScoreDistribution = []int{0, 0, 0, 0, 0}
	distRows, err := r.pool.Query(ctx,
		`SELECT total_score FROM content_exam_attempts WHERE exam_content_id=$1`, examID)
	if err == nil {
		defer distRows.Close()
		for distRows.Next() {
			var score float64
			distRows.Scan(&score)
			switch {
			case score <= 20:
				d.ScoreDistribution[0]++
			case score <= 40:
				d.ScoreDistribution[1]++
			case score <= 60:
				d.ScoreDistribution[2]++
			case score <= 80:
				d.ScoreDistribution[3]++
			default:
				d.ScoreDistribution[4]++
			}
		}
	}

	return d, nil
}

func (r *Repository) GetAdminOverviewAnalytics(ctx context.Context) (*AdminOverviewAnalytics, error) {
	ov := &AdminOverviewAnalytics{
		ItemFitIndex: 0.42,
	}

	r.pool.QueryRow(ctx, `SELECT COUNT(*) FROM content_exam_participants`).Scan(&ov.TotalParticipants)
	r.pool.QueryRow(ctx, `SELECT COUNT(*) FROM contents WHERE content_type = 'EXAM'`).Scan(&ov.TotalExams)
	r.pool.QueryRow(ctx, `SELECT COUNT(*) FROM content_questions`).Scan(&ov.TotalQuestions)
	r.pool.QueryRow(ctx, `SELECT COUNT(*) FROM content_exam_answers`).Scan(&ov.TotalAnswers)

	r.pool.QueryRow(ctx, `SELECT COALESCE(AVG(total_score), 0) FROM content_exam_attempts WHERE status IN ('FINISHED','SUBMITTED','GRADED')`).Scan(&ov.AverageScore)

	var totalAttempts, passed int
	r.pool.QueryRow(ctx, `SELECT COUNT(*) FROM content_exam_attempts WHERE status IN ('FINISHED','SUBMITTED','GRADED')`).Scan(&totalAttempts)
	if totalAttempts > 0 {
		r.pool.QueryRow(ctx, `SELECT COUNT(*) FROM content_exam_attempts WHERE status IN ('FINISHED','SUBMITTED','GRADED') AND total_score >= 600`).Scan(&passed)
		ov.PassRate = float64(passed) / float64(totalAttempts) * 100
	} else {
		ov.PassRate = 0.0
	}

	// Calculate Item Fit Index (Item Discrimination) from attempt answers ratio
	var totalAnsCount, correctAnsCount int
	r.pool.QueryRow(ctx, `SELECT COUNT(*), COUNT(*) FILTER (WHERE is_correct = true) FROM content_exam_answers`).Scan(&totalAnsCount, &correctAnsCount)
	if totalAnsCount > 0 {
		ov.ItemFitIndex = float64(correctAnsCount) / float64(totalAnsCount)
	} else {
		ov.ItemFitIndex = 0.0
	}

	distRows, err := r.pool.Query(ctx, `SELECT total_score FROM content_exam_attempts`)
	if err == nil {
		defer distRows.Close()
		for distRows.Next() {
			var score float64
			distRows.Scan(&score)
			switch {
			case score >= 700:
				ov.ScoreDistribution.Bracket700Plus++
			case score >= 600:
				ov.ScoreDistribution.Bracket600_699++
			case score >= 500:
				ov.ScoreDistribution.Bracket500_599++
			default:
				ov.ScoreDistribution.BracketBelow500++
			}
		}
	}

	subjRows, err := r.pool.Query(ctx,
		`SELECT s.id, s.name,
		 COALESCE(AVG(a.total_score), 0) AS avg_score,
		 COUNT(DISTINCT cq.id) AS total_q
		 FROM subjects s
		 LEFT JOIN contents cq ON cq.subject_id = s.id AND cq.content_type = 'QUESTION'
		 LEFT JOIN contents ce ON ce.subject_id = s.id AND ce.content_type = 'EXAM'
		 LEFT JOIN content_exam_attempts a ON a.exam_content_id = ce.id
		 GROUP BY s.id, s.name
		 ORDER BY s.name LIMIT 10`)
	if err == nil {
		defer subjRows.Close()
		for subjRows.Next() {
			var item SubjectPerformanceItem
			if err := subjRows.Scan(&item.SubjectID, &item.SubjectName, &item.AvgScore, &item.TotalQuestions); err == nil {
				if item.AvgScore == 0 {
					item.Difficulty = "Belum Ada Data"
				} else if item.AvgScore < 550 {
					item.Difficulty = "Sangat Tinggi"
				} else if item.AvgScore < 620 {
					item.Difficulty = "Tinggi"
				} else if item.AvgScore < 680 {
					item.Difficulty = "Sedang"
				} else {
					item.Difficulty = "Mudah"
				}
				ov.SubjectPerformance = append(ov.SubjectPerformance, item)
			}
		}
	}

	return ov, nil
}

// --- Service ---

type Service struct {
	repo *Repository
}

func NewService(repo *Repository) *Service {
	return &Service{repo: repo}
}

func (s *Service) GetExamAnalytics(ctx context.Context, examID uuid.UUID) (*ExamAnalyticsDetail, error) {
	return s.repo.GetExamAnalytics(ctx, examID)
}

func (s *Service) GetStudentAnalytics(ctx context.Context, studentID uuid.UUID) (*StudentAnalytics, error) {
	return s.repo.GetStudentAnalytics(ctx, studentID)
}

func (s *Service) GetQuestionAnalytics(ctx context.Context, questionID uuid.UUID) (*QuestionAnalyticsDetail, error) {
	return s.repo.GetQuestionAnalytics(ctx, questionID)
}

func (s *Service) GetAdminOverviewAnalytics(ctx context.Context) (*AdminOverviewAnalytics, error) {
	return s.repo.GetAdminOverviewAnalytics(ctx)
}

func (s *Service) GetAdminExamReports(ctx context.Context, page, limit int) ([]AdminReportItem, int, error) {
	return s.repo.GetAdminExamReports(ctx, limit, (page-1)*limit)
}

func (s *Service) GetAdminExamReportByID(ctx context.Context, examID uuid.UUID) (*AdminReportDetail, error) {
	return s.repo.GetAdminExamReportByID(ctx, examID)
}

// --- Handler ---

type Handler struct {
	svc  *Service
	role string
}

func NewHandler(svc *Service, jwtSecret string) *Handler {
	return &Handler{svc: svc, role: jwtSecret}
}

func (h *Handler) GetAdminOverviewAnalytics(c *fiber.Ctx) error {
	ov, err := h.svc.GetAdminOverviewAnalytics(c.Context())
	if err != nil {
		return c.Status(500).JSON(shared.Error(shared.ErrInternal, "Failed to get overview analytics"))
	}
	return c.JSON(shared.Success(ov))
}

func (h *Handler) GetExamAnalytics(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(400).JSON(shared.Error(shared.ErrValidation, "Invalid exam ID"))
	}
	a, err := h.svc.GetExamAnalytics(c.Context(), id)
	if err != nil {
		return c.Status(500).JSON(shared.Error(shared.ErrInternal, "Failed to get analytics"))
	}
	return c.JSON(shared.Success(a))
}

func (h *Handler) GetStudentAnalytics(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(400).JSON(shared.Error(shared.ErrValidation, "Invalid student ID"))
	}
	a, err := h.svc.GetStudentAnalytics(c.Context(), id)
	if err != nil {
		return c.Status(500).JSON(shared.Error(shared.ErrInternal, "Failed to get student analytics"))
	}
	return c.JSON(shared.Success(a))
}

func (h *Handler) GetQuestionAnalytics(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(400).JSON(shared.Error(shared.ErrValidation, "Invalid question ID"))
	}
	a, err := h.svc.GetQuestionAnalytics(c.Context(), id)
	if err != nil {
		return c.Status(500).JSON(shared.Error(shared.ErrInternal, "Failed to get question analytics"))
	}
	return c.JSON(shared.Success(a))
}

func (h *Handler) GetAdminExamReports(c *fiber.Ctx) error {
	page, limit := shared.ParsePagination(c)
	items, total, err := h.svc.GetAdminExamReports(c.Context(), page, limit)
	if err != nil {
		return c.Status(500).JSON(shared.Error(shared.ErrInternal, "Failed to get reports"))
	}
	return c.JSON(shared.SuccessWithMeta(items, shared.BuildMeta(page, limit, total)))
}

func (h *Handler) GetAdminExamReportByID(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(400).JSON(shared.Error(shared.ErrValidation, "Invalid exam ID"))
	}
	d, err := h.svc.GetAdminExamReportByID(c.Context(), id)
	if err != nil {
		return c.Status(500).JSON(shared.Error(shared.ErrInternal, "Failed to get report"))
	}
	return c.JSON(shared.Success(d))
}

func (h *Handler) RegisterRoutes(router fiber.Router) {
	auth := middleware.RequireAuth(h.role)
	ro := middleware.RequireRole("ADMIN", "STAFF", "TEACHER")
	adminOnly := middleware.RequireRole("ADMIN")

	an := router.Group("/analytics", auth)
	an.Get("/exams/:id", h.GetExamAnalytics)
	an.Get("/students/:id", h.GetStudentAnalytics)
	an.Get("/questions/:id", h.GetQuestionAnalytics)

	// Advanced analytics
	an.Get("/leaderboard/subject/:subject_id", h.GetLeaderboardBySubject)
	an.Get("/students/:id/timeline", h.GetStudentTimeline)
	an.Get("/exams/:id/difficulty", h.GetExamDifficulty)

	// Admin-only
	an.Get("/admin/overview", ro, h.GetAdminOverviewAnalytics)
	an.Get("/admin/reports/exams", ro, h.GetAdminExamReports)
	an.Get("/admin/reports/exams/:id", ro, h.GetAdminExamReportByID)
	an.Get("/school/stats", adminOnly, h.GetSchoolStats)
}
