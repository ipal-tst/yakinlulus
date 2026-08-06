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

// finishedAttempt filters cbt.exam_attempt rows to those treated as finished
// (same status mapping as Batch 3 runtime 3.1: COMPLETED/SUBMITTED/GRADING).
func finishedAttemptStatus() string {
	return `'COMPLETED','SUBMITTED','GRADING'`
}

func (r *Repository) GetExamAnalytics(ctx context.Context, examID uuid.UUID) (*ExamAnalyticsDetail, error) {
	a := &ExamAnalyticsDetail{}

	r.pool.QueryRow(ctx, `SELECT COUNT(*) FROM cbt.exam_participant WHERE exam_id=$1`, examID).Scan(&a.TotalParticipants)
	r.pool.QueryRow(ctx, `SELECT COUNT(*) FROM cbt.exam_attempt a JOIN cbt.exam_participant p ON p.id=a.participant_id WHERE p.exam_id=$1`, examID).Scan(&a.TotalStarted)
	r.pool.QueryRow(ctx, `SELECT COUNT(*) FROM cbt.exam_attempt a JOIN cbt.exam_participant p ON p.id=a.participant_id WHERE p.exam_id=$1 AND a.status IN (`+finishedAttemptStatus()+`)`, examID).Scan(&a.TotalFinished)

	r.pool.QueryRow(ctx, `SELECT COALESCE(AVG(g.score),0) FROM cbt.grading_result g
		JOIN cbt.exam_attempt a ON a.id=g.attempt_id JOIN cbt.exam_participant p ON p.id=a.participant_id WHERE p.exam_id=$1`, examID).Scan(&a.AverageScore)
	r.pool.QueryRow(ctx, `SELECT COALESCE(MAX(g.score),0) FROM cbt.grading_result g
		JOIN cbt.exam_attempt a ON a.id=g.attempt_id JOIN cbt.exam_participant p ON p.id=a.participant_id WHERE p.exam_id=$1`, examID).Scan(&a.HighestScore)
	r.pool.QueryRow(ctx, `SELECT COALESCE(MIN(g.score),0) FROM cbt.grading_result g
		JOIN cbt.exam_attempt a ON a.id=g.attempt_id JOIN cbt.exam_participant p ON p.id=a.participant_id WHERE p.exam_id=$1`, examID).Scan(&a.LowestScore)

	var totalResults, passed int
	r.pool.QueryRow(ctx, `SELECT COUNT(*) FROM cbt.grading_result g
		JOIN cbt.exam_attempt a ON a.id=g.attempt_id JOIN cbt.exam_participant p ON p.id=a.participant_id WHERE p.exam_id=$1`, examID).Scan(&totalResults)
	if totalResults > 0 {
		r.pool.QueryRow(ctx, `SELECT COUNT(*) FROM cbt.grading_result g
			JOIN cbt.exam_attempt a ON a.id=g.attempt_id JOIN cbt.exam_participant p ON p.id=a.participant_id WHERE p.exam_id=$1 AND g.passed=true`, examID).Scan(&passed)
		a.PassRate = float64(passed) / float64(totalResults) * 100
	}

	r.pool.QueryRow(ctx, `SELECT COALESCE(AVG(EXTRACT(EPOCH FROM (a.finished_at - a.started_at))),0) FROM cbt.exam_attempt a
		JOIN cbt.exam_participant p ON p.id=a.participant_id WHERE p.exam_id=$1 AND a.finished_at IS NOT NULL`, examID).Scan(&a.AvgDurationSec)

	// Question breakdown for this exam.
	rows, err := r.pool.Query(ctx,
		`SELECT gd.question_id,
		 COALESCE((SELECT b.content FROM question.question_block b
		           JOIN question.question_version v ON v.id=b.question_version_id
		           WHERE v.question_id=gd.question_id AND v.is_current AND b.block_type='PARAGRAPH'
		           ORDER BY b.block_order LIMIT 1), q.question_code),
		 COUNT(gd.id),
		 COUNT(*) FILTER (WHERE gd.status_correct),
		 COUNT(*) FILTER (WHERE NOT gd.status_correct)
		 FROM cbt.grading_detail gd
		 JOIN cbt.attempt_question aq ON aq.id=gd.attempt_question_id
		 JOIN cbt.exam_attempt a ON a.id=aq.attempt_id
		 JOIN cbt.exam_participant p ON p.id=a.participant_id
		 JOIN question.question q ON q.id=gd.question_id
		 WHERE p.exam_id=$1
		 GROUP BY gd.question_id, q.question_code
		 ORDER BY COUNT(gd.id) DESC`, examID)
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

	r.pool.QueryRow(ctx, `SELECT COUNT(*) FROM cbt.exam_attempt a JOIN cbt.exam_participant p ON p.id=a.participant_id WHERE p.student_id=$1`, studentID).Scan(&a.TotalExamsTaken)
	r.pool.QueryRow(ctx, `SELECT COALESCE(AVG(g.score),0) FROM cbt.grading_result g
		JOIN cbt.exam_attempt a ON a.id=g.attempt_id JOIN cbt.exam_participant p ON p.id=a.participant_id WHERE p.student_id=$1`, studentID).Scan(&a.AverageScore)

	var scored, passed int
	r.pool.QueryRow(ctx, `SELECT COUNT(*) FROM cbt.grading_result g
		JOIN cbt.exam_attempt a ON a.id=g.attempt_id JOIN cbt.exam_participant p ON p.id=a.participant_id WHERE p.student_id=$1`, studentID).Scan(&scored)
	r.pool.QueryRow(ctx, `SELECT COUNT(*) FROM cbt.grading_result g
		JOIN cbt.exam_attempt a ON a.id=g.attempt_id JOIN cbt.exam_participant p ON p.id=a.participant_id WHERE p.student_id=$1 AND g.passed=true`, studentID).Scan(&passed)
	a.TotalPassed = passed
	a.TotalFailed = scored - passed

	// TotalQuestions, TotalCorrect, TotalWrong, TotalUnanswered, Accuracy.
	r.pool.QueryRow(ctx,
		`SELECT COALESCE(COUNT(*), 0),
		        COALESCE(COUNT(*) FILTER (WHERE gd.status_correct), 0),
		        COALESCE(COUNT(*) FILTER (WHERE NOT gd.status_correct AND NOT gd.is_blank), 0),
		        COALESCE(COUNT(*) FILTER (WHERE gd.is_blank), 0)
		 FROM cbt.grading_detail gd
		 JOIN cbt.attempt_question aq ON aq.id=gd.attempt_question_id
		 JOIN cbt.exam_attempt a ON a.id=aq.attempt_id
		 JOIN cbt.exam_participant p ON p.id=a.participant_id
		 WHERE p.student_id=$1`, studentID,
	).Scan(&a.TotalQuestions, &a.TotalCorrect, &a.TotalWrong, &a.TotalUnanswered)
	if a.TotalCorrect+a.TotalWrong > 0 {
		a.Accuracy = float64(a.TotalCorrect) / float64(a.TotalCorrect+a.TotalWrong) * 100
	}

	// Subject breakdown.
	sRows, err := r.pool.Query(ctx,
		`SELECT s.id, s.name,
		 COUNT(gd.id),
		 COUNT(*) FILTER (WHERE gd.status_correct),
		 COUNT(*) FILTER (WHERE NOT gd.status_correct)
		 FROM cbt.grading_detail gd
		 JOIN cbt.attempt_question aq ON aq.id=gd.attempt_question_id
		 JOIN cbt.exam_attempt a ON a.id=aq.attempt_id
		 JOIN cbt.exam_participant p ON p.id=a.participant_id
		 JOIN question.question_subject qs ON qs.question_id=gd.question_id
		 JOIN academic.subject s ON s.id=qs.subject_id
		 WHERE p.student_id=$1
		 GROUP BY s.id, s.name
		 ORDER BY COUNT(gd.id) ASC`, studentID)
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

	// Recent results.
	rRows, err := r.pool.Query(ctx,
		`SELECT p.exam_id, e.title, COALESCE(g.score, 0), COALESCE(g.passed, false), COALESCE(a.finished_at, a.created_at)
		 FROM cbt.exam_attempt a
		 JOIN cbt.exam_participant p ON p.id=a.participant_id
		 LEFT JOIN cbt.grading_result g ON g.attempt_id=a.id
		 JOIN cbt.exam e ON e.id=p.exam_id
		 WHERE p.student_id=$1
		 ORDER BY COALESCE(a.finished_at, a.created_at) DESC LIMIT 10`, studentID)
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
		 COUNT(*) FILTER (WHERE status_correct),
		 COUNT(*) FILTER (WHERE NOT status_correct)
		 FROM cbt.grading_detail WHERE question_id=$1`, questionID).Scan(&a.TotalAttempts, &a.CorrectCount, &a.WrongCount)
	total := a.CorrectCount + a.WrongCount
	if total > 0 {
		a.Accuracy = float64(a.CorrectCount) / float64(total) * 100
	}

	r.pool.QueryRow(ctx, `SELECT COUNT(DISTINCT pkg.exam_id) FROM cbt.exam_package_question pq JOIN cbt.exam_package pkg ON pkg.id=pq.package_id WHERE pq.question_id=$1`, questionID).Scan(&a.UsedInExamsCount)

	oRows, err := r.pool.Query(ctx,
		`SELECT o.id, o.label,
		 (SELECT COUNT(*) FROM cbt.student_answer sa
		  JOIN cbt.attempt_question aq ON aq.id=sa.attempt_question_id
		  WHERE aq.question_id = $1 AND o.label = ANY(string_to_array(sa.selected_option, ','))) AS picked
		 FROM question.question_option o
		 JOIN question.question_version v ON v.id=o.question_version_id
		 WHERE v.question_id=$1 AND v.is_current
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
	r.pool.QueryRow(ctx, `SELECT COUNT(*) FROM cbt.exam WHERE deleted_at IS NULL`).Scan(&total)

	rows, err := r.pool.Query(ctx,
		`SELECT e.id, e.title,
		 (SELECT COUNT(*) FROM cbt.exam_participant ep WHERE ep.exam_id=e.id) AS participants,
		 (SELECT COUNT(*) FROM cbt.exam_attempt a JOIN cbt.exam_participant p ON p.id=a.participant_id WHERE p.exam_id=e.id) AS started,
		 (SELECT COUNT(*) FROM cbt.exam_attempt a JOIN cbt.exam_participant p ON p.id=a.participant_id WHERE p.exam_id=e.id AND a.status IN (`+finishedAttemptStatus()+`)) AS finished,
		 (SELECT COALESCE(AVG(g.score),0) FROM cbt.grading_result g JOIN cbt.exam_attempt a ON a.id=g.attempt_id JOIN cbt.exam_participant p ON p.id=a.participant_id WHERE p.exam_id=e.id) AS avg_score,
		 CASE
		   WHEN (SELECT COUNT(*) FROM cbt.grading_result g JOIN cbt.exam_attempt a ON a.id=g.attempt_id JOIN cbt.exam_participant p ON p.id=a.participant_id WHERE p.exam_id=e.id) > 0
		   THEN (SELECT COUNT(*) FROM cbt.grading_result g JOIN cbt.exam_attempt a ON a.id=g.attempt_id JOIN cbt.exam_participant p ON p.id=a.participant_id WHERE p.exam_id=e.id AND g.passed)::float
		      / (SELECT COUNT(*) FROM cbt.grading_result g JOIN cbt.exam_attempt a ON a.id=g.attempt_id JOIN cbt.exam_participant p ON p.id=a.participant_id WHERE p.exam_id=e.id) * 100
		   ELSE 0
		 END AS pass_rate
		 FROM cbt.exam e
		 WHERE e.deleted_at IS NULL
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
		`SELECT e.id, e.title, COALESCE(st.code,''), COALESCE(md.duration_minute,0), COALESCE(md.passing_score,0)
		 FROM cbt.exam e
		 LEFT JOIN cbt.exam_status st ON st.id=e.status_id
		 LEFT JOIN cbt.exam_metadata md ON md.exam_id=e.id
		 WHERE e.id=$1 AND e.deleted_at IS NULL`, examID,
	).Scan(&d.ExamID, &d.Title, &d.Status, &d.DurationMinutes, &d.PassingGrade)
	if err != nil {
		return nil, err
	}

	r.pool.QueryRow(ctx, `SELECT COUNT(*) FROM cbt.exam_participant WHERE exam_id=$1`, examID).Scan(&d.TotalParticipants)
	r.pool.QueryRow(ctx, `SELECT COUNT(*) FROM cbt.exam_attempt a JOIN cbt.exam_participant p ON p.id=a.participant_id WHERE p.exam_id=$1`, examID).Scan(&d.TotalStarted)
	r.pool.QueryRow(ctx, `SELECT COUNT(*) FROM cbt.exam_attempt a JOIN cbt.exam_participant p ON p.id=a.participant_id WHERE p.exam_id=$1 AND a.status IN (`+finishedAttemptStatus()+`)`, examID).Scan(&d.TotalFinished)
	r.pool.QueryRow(ctx, `SELECT COALESCE(AVG(g.score),0) FROM cbt.grading_result g
		JOIN cbt.exam_attempt a ON a.id=g.attempt_id JOIN cbt.exam_participant p ON p.id=a.participant_id WHERE p.exam_id=$1`, examID).Scan(&d.AverageScore)
	r.pool.QueryRow(ctx, `SELECT COALESCE(MAX(g.score),0) FROM cbt.grading_result g
		JOIN cbt.exam_attempt a ON a.id=g.attempt_id JOIN cbt.exam_participant p ON p.id=a.participant_id WHERE p.exam_id=$1`, examID).Scan(&d.HighestScore)
	r.pool.QueryRow(ctx, `SELECT COALESCE(MIN(g.score),0) FROM cbt.grading_result g
		JOIN cbt.exam_attempt a ON a.id=g.attempt_id JOIN cbt.exam_participant p ON p.id=a.participant_id WHERE p.exam_id=$1`, examID).Scan(&d.LowestScore)

	var totalResults, passed int
	r.pool.QueryRow(ctx, `SELECT COUNT(*) FROM cbt.grading_result g
		JOIN cbt.exam_attempt a ON a.id=g.attempt_id JOIN cbt.exam_participant p ON p.id=a.participant_id WHERE p.exam_id=$1`, examID).Scan(&totalResults)
	if totalResults > 0 {
		r.pool.QueryRow(ctx, `SELECT COUNT(*) FROM cbt.grading_result g
			JOIN cbt.exam_attempt a ON a.id=g.attempt_id JOIN cbt.exam_participant p ON p.id=a.participant_id WHERE p.exam_id=$1 AND g.passed=true`, examID).Scan(&passed)
		d.PassRate = float64(passed) / float64(totalResults) * 100
	}

	r.pool.QueryRow(ctx, `SELECT COALESCE(AVG(EXTRACT(EPOCH FROM (a.finished_at - a.started_at))),0) FROM cbt.exam_attempt a
		JOIN cbt.exam_participant p ON p.id=a.participant_id WHERE p.exam_id=$1 AND a.finished_at IS NOT NULL`, examID).Scan(&d.AvgDurationSec)

	d.ScoreDistribution = []int{0, 0, 0, 0, 0}
	distRows, err := r.pool.Query(ctx,
		`SELECT g.score FROM cbt.grading_result g
		 JOIN cbt.exam_attempt a ON a.id=g.attempt_id JOIN cbt.exam_participant p ON p.id=a.participant_id WHERE p.exam_id=$1`, examID)
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

	r.pool.QueryRow(ctx, `SELECT COUNT(*) FROM cbt.exam_participant`).Scan(&ov.TotalParticipants)
	r.pool.QueryRow(ctx, `SELECT COUNT(*) FROM cbt.exam WHERE deleted_at IS NULL`).Scan(&ov.TotalExams)
	r.pool.QueryRow(ctx, `SELECT COUNT(*) FROM question.question WHERE deleted_at IS NULL`).Scan(&ov.TotalQuestions)
	r.pool.QueryRow(ctx, `SELECT COUNT(*) FROM cbt.student_answer`).Scan(&ov.TotalAnswers)

	r.pool.QueryRow(ctx, `SELECT COALESCE(AVG(g.score), 0) FROM cbt.grading_result g
		JOIN cbt.exam_attempt a ON a.id=g.attempt_id WHERE a.status IN (`+finishedAttemptStatus()+`)`).Scan(&ov.AverageScore)

	var totalAttempts, passed int
	r.pool.QueryRow(ctx, `SELECT COUNT(*) FROM cbt.grading_result g JOIN cbt.exam_attempt a ON a.id=g.attempt_id WHERE a.status IN (`+finishedAttemptStatus()+`)`).Scan(&totalAttempts)
	if totalAttempts > 0 {
		r.pool.QueryRow(ctx, `SELECT COUNT(*) FROM cbt.grading_result g JOIN cbt.exam_attempt a ON a.id=g.attempt_id WHERE a.status IN (`+finishedAttemptStatus()+`) AND g.passed`).Scan(&passed)
		ov.PassRate = float64(passed) / float64(totalAttempts) * 100
	} else {
		ov.PassRate = 0.0
	}

	// Item Fit Index from grading_detail correctness ratio.
	var totalAnsCount, correctAnsCount int
	r.pool.QueryRow(ctx, `SELECT COUNT(*), COUNT(*) FILTER (WHERE status_correct) FROM cbt.grading_detail`).Scan(&totalAnsCount, &correctAnsCount)
	if totalAnsCount > 0 {
		ov.ItemFitIndex = float64(correctAnsCount) / float64(totalAnsCount)
	} else {
		ov.ItemFitIndex = 0.0
	}

	// grading_result.score is 0-100 (matching every other consumer in this
	// migration); distribute across the four legacy nominal bands.
	distRows, err := r.pool.Query(ctx, `SELECT g.score FROM cbt.grading_result g`)
	if err == nil {
		defer distRows.Close()
		for distRows.Next() {
			var score float64
			distRows.Scan(&score)
			switch {
			case score >= 85:
				ov.ScoreDistribution.Bracket700Plus++
			case score >= 70:
				ov.ScoreDistribution.Bracket600_699++
			case score >= 60:
				ov.ScoreDistribution.Bracket500_599++
			default:
				ov.ScoreDistribution.BracketBelow500++
			}
		}
	}

	subjRows, err := r.pool.Query(ctx,
		`SELECT s.id, s.name,
		 COALESCE(AVG(g.score), 0) AS avg_score,
		 COUNT(DISTINCT gd.question_id) AS total_q
		 FROM academic.subject s
		 LEFT JOIN question.question_subject qs ON qs.subject_id=s.id
		 LEFT JOIN cbt.grading_detail gd ON gd.question_id=qs.question_id
		 LEFT JOIN cbt.attempt_question aq ON aq.id=gd.attempt_question_id
		 LEFT JOIN cbt.exam_attempt a ON a.id=aq.attempt_id
		 LEFT JOIN cbt.grading_result g ON g.attempt_id=a.id
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
	ro := middleware.RequireRole("SUPER_ADMIN", "STAFF", "GURU")
	adminOnly := middleware.RequireRole("SUPER_ADMIN")

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
