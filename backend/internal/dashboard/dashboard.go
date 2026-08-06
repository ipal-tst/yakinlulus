package dashboard

import (
	"context"
	"fmt"
	"math"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"yakinlulus.id/backend/internal/middleware"
	"yakinlulus.id/backend/internal/shared"
)

// --- DTOs ---

type StudentDashboard struct {
	Greeting         GreetingInfo       `json:"greeting"`
	ContinueLearning *ContinueLearning  `json:"continue_learning,omitempty"`
	TodayGoal        TodayGoal          `json:"today_goal"`
	LearningProgress []SubjectProgress  `json:"learning_progress"`
	WeeklyActivity   []DailyActivity    `json:"weekly_activity"`
	UpcomingExams    []UpcomingExam     `json:"upcoming_exams"`
	ExamStats        ExamStats          `json:"exam_stats"`
	RecentActivity   []ActivityItem     `json:"recent_activity"`
}

type GreetingInfo struct {
	FullName   string `json:"full_name"`
	Greeting   string `json:"greeting"`
	Date       string `json:"date"`
	Motivation string `json:"motivation"`
}

type ContinueLearning struct {
	MaterialID   uuid.UUID `json:"material_id"`
	Title        string    `json:"title"`
	SubjectName  string    `json:"subject_name"`
	Progress     float64   `json:"progress"`
	RemainingMin int       `json:"remaining_minutes"`
}

type TodayGoal struct {
	TargetMaterials    int     `json:"target_materials"`
	CompletedMaterials int     `json:"completed_materials"`
	TargetQuestions    int     `json:"target_questions"`
	AnsweredQuestions  int     `json:"answered_questions"`
	ProgressPct        float64 `json:"progress_pct"`
}

type SubjectProgress struct {
	SubjectID          uuid.UUID `json:"subject_id"`
	SubjectName        string    `json:"subject_name"`
	TotalMaterials     int       `json:"total_materials"`
	CompletedMaterials int       `json:"completed_materials"`
	ProgressPct        float64   `json:"progress_pct"`
}

type DailyActivity struct {
	Date      string `json:"date"`
	Materials int    `json:"materials"`
	Questions int    `json:"questions"`
	Minutes   int    `json:"minutes"`
}

type UpcomingExam struct {
	ExamID        uuid.UUID `json:"exam_id"`
	Title         string    `json:"title"`
	SubjectName   string    `json:"subject_name"`
	ScheduledDate string    `json:"scheduled_date"`
	DurationMin   int       `json:"duration_minutes"`
	Status        string    `json:"status"`
}

type ExamStats struct {
	TotalCompleted int     `json:"total_completed"`
	AverageScore   float64 `json:"average_score"`
	HighestScore   float64 `json:"highest_score"`
	NationalRank   int     `json:"national_rank"`
}

type ActivityItem struct {
	Type      string    `json:"type"`
	Message   string    `json:"message"`
	CreatedAt time.Time `json:"created_at"`
}

type TeacherDashboard struct {
	Greeting         GreetingInfo      `json:"greeting"`
	TodaySchedule    []ClassSchedule   `json:"today_schedule"`
	QuickActions     []QuickAction     `json:"quick_actions"`
	MyClasses        []ClassSummary    `json:"my_classes"`
	UpcomingExams    []UpcomingExam    `json:"upcoming_exams"`
	StudentProgress  []SubjectProgress `json:"student_progress"`
	QuestionBankStat QuestionBankStat  `json:"question_bank_stat"`
	RecentActivity   []ActivityItem    `json:"recent_activity"`
}

type ClassSchedule struct {
	TimeStart   string `json:"time_start"`
	TimeEnd     string `json:"time_end"`
	SubjectName string `json:"subject_name"`
	ClassName   string `json:"class_name"`
}

type ClassSummary struct {
	ClassName    string  `json:"class_name"`
	SubjectName  string  `json:"subject_name"`
	StudentCount int     `json:"student_count"`
	ProgressPct  float64 `json:"progress_pct"`
}

type QuickAction struct {
	Label string `json:"label"`
	Icon  string `json:"icon"`
	Path  string `json:"path"`
}

type QuestionBankStat struct {
	Total     int `json:"total"`
	Draft     int `json:"draft"`
	Published int `json:"published"`
}

type AdminDashboard struct {
	KPI            KPIData        `json:"kpi"`
	SystemHealth   SystemHealth   `json:"system_health"`
	ActiveUsers    ActiveUserStat `json:"active_users"`
	SchoolStats    SchoolStat     `json:"school_stats"`
	CBTMonitoring  CBTMonitoring  `json:"cbt_monitoring"`
	RecentActivity []ActivityItem `json:"recent_activity"`
}

type KPIData struct {
	TotalUsers     int `json:"total_users"`
	ActiveToday    int `json:"active_today"`
	TotalSchools   int `json:"total_schools"`
	TotalTeachers  int `json:"total_teachers"`
	TotalStudents  int `json:"total_students"`
	TotalExams     int `json:"total_exams"`
	TotalMaterials int `json:"total_materials"`
	TotalQuestions int `json:"total_questions"`
}

type SystemHealth struct {
	APIStatus    string `json:"api_status"`
	DBStatus     string `json:"db_status"`
	StorageUsage int    `json:"storage_usage"`
	Uptime       int    `json:"uptime_hours"`
}

type ActiveUserStat struct {
	OnlineNow int `json:"online_now"`
	Active24h int `json:"active_24h"`
}

type SchoolStat struct {
	Total    int `json:"total"`
	Active   int `json:"active"`
	Verified int `json:"verified"`
}

type CBTMonitoring struct {
	Scheduled int `json:"scheduled"`
	Running   int `json:"running"`
	Finished  int `json:"finished"`
}

// --- Repository ---

type Repository struct {
	pool *pgxpool.Pool
}

func NewRepository(pool *pgxpool.Pool) *Repository {
	return &Repository{pool: pool}
}

// --- Student dashboard repository ---

func (r *Repository) GetUserFullName(ctx context.Context, userID uuid.UUID) (string, error) {
	var name string
	err := r.pool.QueryRow(ctx, `
		SELECT COALESCE(p.full_name, u.username)
		FROM identity.user u
		LEFT JOIN identity.user_profile p ON p.user_id = u.id
		WHERE u.id=$1 AND u.deleted_at IS NULL`, userID).Scan(&name)
	return name, err
}

// materialGradeFilter returns a WHERE fragment pinning a material to a grade
// via the content.material_grade junction. Parameterized ($n) — never string
// interpolated.
func materialGradeFilter(gradeID *uuid.UUID, argN int) string {
	if gradeID == nil {
		return ""
	}
	return fmt.Sprintf(` AND EXISTS (SELECT 1 FROM content.material_grade mg WHERE mg.material_id = m.id AND mg.grade_id = $%d)`, argN)
}

// examGradeFilter is the cbt.exam_grade analog of materialGradeFilter.
func examGradeFilter(gradeID *uuid.UUID, argN int) string {
	if gradeID == nil {
		return ""
	}
	return fmt.Sprintf(` AND EXISTS (SELECT 1 FROM cbt.exam_grade eg WHERE eg.exam_id = e.id AND eg.grade_id = $%d)`, argN)
}

func (r *Repository) GetContinueLearning(ctx context.Context, userID uuid.UUID, gradeID *uuid.UUID) *ContinueLearning {
	cl := &ContinueLearning{}
	args := []interface{}{userID}
	query := `SELECT m.id, m.title, COALESCE(s.name, ''), lp.progress_percent
		 FROM content.learning_progress lp
		 JOIN content.material m ON m.id = lp.material_id AND m.deleted_at IS NULL
		 LEFT JOIN LATERAL (SELECT subject_id FROM content.material_subject WHERE material_id = m.id LIMIT 1) ms ON true
		 LEFT JOIN academic.subject s ON s.id = ms.subject_id
		 WHERE lp.student_id = $1`
	query += materialGradeFilter(gradeID, 2)
	if gradeID != nil {
		args = append(args, *gradeID)
	}
	query += ` AND lp.progress_percent < 100
		 ORDER BY lp.updated_at DESC LIMIT 1`
	err := r.pool.QueryRow(ctx, query, args...).Scan(&cl.MaterialID, &cl.Title, &cl.SubjectName, &cl.Progress)
	if err != nil {
		return nil
	}
	if cl.Progress > 0 {
		remaining := int(math.Ceil((100 - cl.Progress) / cl.Progress * 15))
		if remaining < 1 {
			remaining = 1
		}
		cl.RemainingMin = remaining
	} else {
		cl.RemainingMin = 15
	}
	return cl
}

func (r *Repository) GetTodayGoal(ctx context.Context, userID uuid.UUID, gradeID *uuid.UUID) TodayGoal {
	tg := TodayGoal{TargetMaterials: 3, TargetQuestions: 10}
	today := time.Now().Format("2006-01-02")

	mQ := `SELECT COUNT(*) FROM content.learning_progress lp
		 JOIN content.material m ON m.id = lp.material_id AND m.deleted_at IS NULL
		 WHERE lp.student_id = $1 AND lp.progress_percent >= 100 AND lp.updated_at::date = $2::date`
	eQ := `SELECT COUNT(*) FROM cbt.exam_attempt a
		 JOIN cbt.exam_participant p ON p.id = a.participant_id
		 JOIN cbt.exam e ON e.id = p.exam_id AND e.deleted_at IS NULL
		 WHERE p.student_id = $1 AND a.started_at::date = $2`
	if gradeID != nil {
		mQ += materialGradeFilter(gradeID, 3)
		eQ += examGradeFilter(gradeID, 3)
		r.pool.QueryRow(ctx, mQ, userID, today, *gradeID).Scan(&tg.CompletedMaterials)
		r.pool.QueryRow(ctx, eQ, userID, today, *gradeID).Scan(&tg.AnsweredQuestions)
	} else {
		r.pool.QueryRow(ctx, mQ, userID, today).Scan(&tg.CompletedMaterials)
		r.pool.QueryRow(ctx, eQ, userID, today).Scan(&tg.AnsweredQuestions)
	}

	total := tg.TargetMaterials + tg.TargetQuestions
	done := tg.CompletedMaterials + tg.AnsweredQuestions
	if total > 0 {
		tg.ProgressPct = math.Round(float64(done)/float64(total)*100) / 100
	}
	return tg
}

func (r *Repository) GetLearningProgress(ctx context.Context, userID uuid.UUID, gradeID *uuid.UUID) []SubjectProgress {
	query := `SELECT s.id, s.name,
		 COUNT(DISTINCT m.id) AS total,
		 COUNT(DISTINCT lp.material_id) FILTER (WHERE lp.progress_percent >= 100) AS completed
		 FROM academic.subject s
		 JOIN content.material_subject ms ON ms.subject_id = s.id
		 JOIN content.material m ON m.id = ms.material_id AND m.deleted_at IS NULL
		 LEFT JOIN content.learning_progress lp ON lp.material_id = m.id AND lp.student_id = $1
		 WHERE 1=1`
	args := []interface{}{userID}
	if gradeID != nil {
		args = append(args, *gradeID)
		query += materialGradeFilter(gradeID, 2)
	}
	query += ` GROUP BY s.id, s.name ORDER BY s.name`
	rows, err := r.pool.Query(ctx, query, args...)
	if err != nil {
		return []SubjectProgress{}
	}
	defer rows.Close()

	var items []SubjectProgress
	for rows.Next() {
		var sp SubjectProgress
		if err := rows.Scan(&sp.SubjectID, &sp.SubjectName, &sp.TotalMaterials, &sp.CompletedMaterials); err != nil {
			continue
		}
		if sp.TotalMaterials > 0 {
			sp.ProgressPct = math.Round(float64(sp.CompletedMaterials)/float64(sp.TotalMaterials)*10000) / 100
		}
		items = append(items, sp)
	}
	return items
}

func (r *Repository) GetWeeklyActivity(ctx context.Context, userID uuid.UUID, gradeID *uuid.UUID) []DailyActivity {
	// Material and exam subqueries share the student ($1) and optional grade
	// ($2) parameters; both are bound once below.
	args := []interface{}{userID}
	mGrade := ""
	eGrade := ""
	if gradeID != nil {
		args = append(args, *gradeID)
		mGrade = ` AND EXISTS (SELECT 1 FROM content.material_grade mg WHERE mg.material_id = m.id AND mg.grade_id = $2)`
		eGrade = ` AND EXISTS (SELECT 1 FROM cbt.exam_grade eg WHERE eg.exam_id = e.id AND eg.grade_id = $2)`
	}
	rows, err := r.pool.Query(ctx,
		`SELECT d.date,
		 COALESCE(m.cnt, 0) AS materials,
		 COALESCE(q.cnt, 0) AS questions
		 FROM (
		   SELECT generate_series(
		     CURRENT_DATE - INTERVAL '6 days',
		     CURRENT_DATE,
		     INTERVAL '1 day'
		   )::date AS date
		 ) d
		 LEFT JOIN (
		   SELECT lp.updated_at::date AS date, COUNT(*) AS cnt
		   FROM content.learning_progress lp
		   JOIN content.material m ON m.id = lp.material_id AND m.deleted_at IS NULL`+mGrade+`
		   WHERE lp.student_id = $1 AND lp.progress_percent >= 100 AND lp.updated_at >= CURRENT_DATE - INTERVAL '6 days'
		   GROUP BY lp.updated_at::date
		 ) m ON m.date = d.date
		 LEFT JOIN (
		   SELECT a.started_at::date AS date, COUNT(*) AS cnt
		   FROM cbt.exam_attempt a
		   JOIN cbt.exam_participant p ON p.id = a.participant_id
		   JOIN cbt.exam e ON e.id = p.exam_id AND e.deleted_at IS NULL`+eGrade+`
		   WHERE p.student_id = $1 AND a.started_at >= CURRENT_DATE - INTERVAL '6 days'
		   GROUP BY a.started_at::date
		 ) q ON q.date = d.date
		 ORDER BY d.date`, args...)
	if err != nil {
		return []DailyActivity{}
	}
	defer rows.Close()

	var items []DailyActivity
	for rows.Next() {
		var da DailyActivity
		if err := rows.Scan(&da.Date, &da.Materials, &da.Questions); err != nil {
			continue
		}
		da.Minutes = da.Materials * 15
		items = append(items, da)
	}
	return items
}

func (r *Repository) GetUpcomingExams(ctx context.Context, userID uuid.UUID, gradeID *uuid.UUID) []UpcomingExam {
	query := `SELECT e.id, e.title, COALESCE(s.name, ''),
		 COALESCE(sch.start_time::text, e.created_at::text),
		 COALESCE(md.duration_minute, 0), COALESCE(st.code, '')
		 FROM cbt.exam e
		 LEFT JOIN cbt.exam_status st ON st.id = e.status_id
		 LEFT JOIN cbt.exam_metadata md ON md.exam_id = e.id
		 LEFT JOIN LATERAL (SELECT subject_id FROM cbt.exam_subject WHERE exam_id = e.id LIMIT 1) es ON true
		 LEFT JOIN academic.subject s ON s.id = es.subject_id
		 LEFT JOIN LATERAL (SELECT start_time, end_time FROM cbt.exam_schedule WHERE exam_id = e.id ORDER BY created_at DESC LIMIT 1) sch ON true
		 WHERE e.deleted_at IS NULL AND st.code IN ('PUBLISHED')`
	args := []interface{}{}
	if gradeID != nil {
		args = append(args, *gradeID)
		query += examGradeFilter(gradeID, 1)
	}
	query += ` ORDER BY e.created_at DESC`
	rows, err := r.pool.Query(ctx, query, args...)
	if err != nil {
		return []UpcomingExam{}
	}
	defer rows.Close()

	var items []UpcomingExam
	for rows.Next() {
		var ue UpcomingExam
		if err := rows.Scan(&ue.ExamID, &ue.Title, &ue.SubjectName, &ue.ScheduledDate, &ue.DurationMin, &ue.Status); err != nil {
			continue
		}
		items = append(items, ue)
	}
	return items
}

func (r *Repository) GetExamStats(ctx context.Context, userID uuid.UUID) ExamStats {
	var s ExamStats
	r.pool.QueryRow(ctx,
		`SELECT COUNT(*),
		        COALESCE(AVG(g.score), 0),
		        COALESCE(MAX(g.score), 0)
		 FROM cbt.exam_attempt a
		 JOIN cbt.exam_participant p ON p.id = a.participant_id
		 JOIN cbt.grading_result g ON g.attempt_id = a.id
		 WHERE p.student_id = $1 AND a.status IN ('COMPLETED','SUBMITTED','GRADING')
		   AND g.score IS NOT NULL`,
		userID).Scan(&s.TotalCompleted, &s.AverageScore, &s.HighestScore)
	s.NationalRank = r.GetNationalRank(ctx, userID)
	return s
}

func (r *Repository) GetNationalRank(ctx context.Context, userID uuid.UUID) int {
	var rank int
	err := r.pool.QueryRow(ctx,
		`SELECT COALESCE(global_rank, 0)
		 FROM ranking.user_rank_summary
		 WHERE user_id = $1`, userID).Scan(&rank)
	if err != nil {
		return 0
	}
	return rank
}

func (r *Repository) GetStudentRecentActivity(ctx context.Context, userID uuid.UUID, gradeID *uuid.UUID) []ActivityItem {
	args := []interface{}{userID}
	mGrade := ""
	eGrade := ""
	if gradeID != nil {
		args = append(args, *gradeID)
		mGrade = ` AND EXISTS (SELECT 1 FROM content.material_grade mg WHERE mg.material_id = m.id AND mg.grade_id = $2)`
		eGrade = ` AND EXISTS (SELECT 1 FROM cbt.exam_grade eg WHERE eg.exam_id = e.id AND eg.grade_id = $2)`
	}
	rows, err := r.pool.Query(ctx,
		`SELECT type, message, created_at FROM (
		 SELECT 'exam' AS type, 'Menyelesaikan ujian: ' || e.title AS message, COALESCE(a.finished_at, a.updated_at) AS created_at
		 FROM cbt.exam_attempt a
		 JOIN cbt.exam_participant p ON p.id = a.participant_id
		 JOIN cbt.exam e ON e.id = p.exam_id AND e.deleted_at IS NULL
		 WHERE p.student_id = $1 AND a.finished_at IS NOT NULL`+eGrade+`
		 UNION ALL
		 SELECT 'material' AS type, 'Menyelesaikan materi: ' || m.title AS message, lp.updated_at AS created_at
		 FROM content.learning_progress lp
		 JOIN content.material m ON m.id = lp.material_id AND m.deleted_at IS NULL
		 WHERE lp.student_id = $1 AND lp.progress_percent >= 100`+mGrade+`
		) sub ORDER BY created_at DESC LIMIT 10`, args...)
	if err != nil {
		return []ActivityItem{}
	}
	defer rows.Close()

	var items []ActivityItem
	for rows.Next() {
		var ai ActivityItem
		if err := rows.Scan(&ai.Type, &ai.Message, &ai.CreatedAt); err != nil {
			continue
		}
		items = append(items, ai)
	}
	return items
}

// --- Teacher dashboard repository ---

func (r *Repository) GetTeacherUpcomingExams(ctx context.Context, userID uuid.UUID) []UpcomingExam {
	rows, err := r.pool.Query(ctx,
		`SELECT e.id, e.title, COALESCE(s.name, ''),
		 COALESCE(sch.start_time::text, e.created_at::text),
		 COALESCE(md.duration_minute, 0), COALESCE(st.code, '')
		 FROM cbt.exam e
		 LEFT JOIN cbt.exam_status st ON st.id = e.status_id
		 LEFT JOIN cbt.exam_metadata md ON md.exam_id = e.id
		 LEFT JOIN LATERAL (SELECT subject_id FROM cbt.exam_subject WHERE exam_id = e.id LIMIT 1) es ON true
		 LEFT JOIN academic.subject s ON s.id = es.subject_id
		 LEFT JOIN LATERAL (SELECT start_time, end_time FROM cbt.exam_schedule WHERE exam_id = e.id ORDER BY created_at DESC LIMIT 1) sch ON true
		 WHERE e.deleted_at IS NULL AND e.created_by = $1 AND st.code = 'PUBLISHED'
		 ORDER BY e.created_at ASC`, userID)
	if err != nil {
		return []UpcomingExam{}
	}
	defer rows.Close()

	var items []UpcomingExam
	for rows.Next() {
		var ue UpcomingExam
		if err := rows.Scan(&ue.ExamID, &ue.Title, &ue.SubjectName, &ue.ScheduledDate, &ue.DurationMin, &ue.Status); err != nil {
			continue
		}
		items = append(items, ue)
	}
	return items
}

func (r *Repository) GetTeacherStudentProgress(ctx context.Context, userID uuid.UUID) []SubjectProgress {
	rows, err := r.pool.Query(ctx,
		`SELECT s.id, s.name, COUNT(DISTINCT m.id) AS total,
		 COUNT(DISTINCT lp.material_id) FILTER (WHERE lp.progress_percent >= 100) AS completed
		 FROM academic.subject s
		 JOIN content.material_subject ms ON ms.subject_id = s.id
		 JOIN content.material m ON m.id = ms.material_id AND m.deleted_at IS NULL
		 LEFT JOIN content.learning_progress lp ON lp.material_id = m.id
		 WHERE m.owner_id = $1
		 GROUP BY s.id, s.name`, userID)
	if err != nil {
		return []SubjectProgress{}
	}
	defer rows.Close()

	var items []SubjectProgress
	for rows.Next() {
		var sp SubjectProgress
		if err := rows.Scan(&sp.SubjectID, &sp.SubjectName, &sp.TotalMaterials, &sp.CompletedMaterials); err != nil {
			continue
		}
		if sp.TotalMaterials > 0 {
			sp.ProgressPct = math.Round(float64(sp.CompletedMaterials)/float64(sp.TotalMaterials)*10000) / 100
		}
		items = append(items, sp)
	}
	return items
}

func (r *Repository) GetQuestionBankStat(ctx context.Context, userID uuid.UUID) QuestionBankStat {
	var stat QuestionBankStat
	r.pool.QueryRow(ctx, `SELECT COUNT(*) FROM question.question WHERE owner_id = $1 AND deleted_at IS NULL`, userID).Scan(&stat.Total)
	r.pool.QueryRow(ctx, `SELECT COUNT(*) FROM question.question q JOIN question.question_status st ON st.id = q.status_id WHERE q.owner_id = $1 AND st.code = 'DRAFT'`, userID).Scan(&stat.Draft)
	r.pool.QueryRow(ctx, `SELECT COUNT(*) FROM question.question q JOIN question.question_status st ON st.id = q.status_id WHERE q.owner_id = $1 AND st.code = 'PUBLISHED'`, userID).Scan(&stat.Published)
	return stat
}

func (r *Repository) GetTeacherRecentActivity(ctx context.Context, userID uuid.UUID) []ActivityItem {
	rows, err := r.pool.Query(ctx,
		`SELECT 'exam' AS type, 'Ujian selesai: ' || e.title AS message, COALESCE(a.finished_at, a.updated_at) AS created_at
		 FROM cbt.exam_attempt a
		 JOIN cbt.exam_participant p ON p.id = a.participant_id
		 JOIN cbt.exam e ON e.id = p.exam_id AND e.deleted_at IS NULL
		 WHERE e.created_by = $1 AND a.finished_at IS NOT NULL
		 ORDER BY a.finished_at DESC LIMIT 10`, userID)
	if err != nil {
		return []ActivityItem{}
	}
	defer rows.Close()

	var items []ActivityItem
	for rows.Next() {
		var ai ActivityItem
		if err := rows.Scan(&ai.Type, &ai.Message, &ai.CreatedAt); err != nil {
			continue
		}
		items = append(items, ai)
	}
	return items
}

// --- Admin dashboard repository ---

func (r *Repository) GetKPI(ctx context.Context) KPIData {
	var kpi KPIData
	r.pool.QueryRow(ctx, `SELECT COUNT(*) FROM identity.user WHERE deleted_at IS NULL`).Scan(&kpi.TotalUsers)
	r.pool.QueryRow(ctx, `SELECT COUNT(DISTINCT ur.user_id) FROM identity.user_role ur JOIN identity.role r ON r.id = ur.role_id JOIN identity.user u ON u.id = ur.user_id AND u.deleted_at IS NULL WHERE r.code = 'GURU'`).Scan(&kpi.TotalTeachers)
	r.pool.QueryRow(ctx, `SELECT COUNT(DISTINCT ur.user_id) FROM identity.user_role ur JOIN identity.role r ON r.id = ur.role_id JOIN identity.user u ON u.id = ur.user_id AND u.deleted_at IS NULL WHERE r.code = 'SISWA'`).Scan(&kpi.TotalStudents)
	r.pool.QueryRow(ctx, `SELECT COUNT(*) FROM academic.school WHERE deleted_at IS NULL`).Scan(&kpi.TotalSchools)
	r.pool.QueryRow(ctx, `SELECT COUNT(*) FROM cbt.exam WHERE deleted_at IS NULL`).Scan(&kpi.TotalExams)
	r.pool.QueryRow(ctx, `SELECT COUNT(*) FROM content.material WHERE deleted_at IS NULL`).Scan(&kpi.TotalMaterials)
	r.pool.QueryRow(ctx, `SELECT COUNT(*) FROM question.question WHERE deleted_at IS NULL`).Scan(&kpi.TotalQuestions)
	// Active today: distinct students with a session logged in within 24h.
	r.pool.QueryRow(ctx,
		`SELECT COUNT(DISTINCT student_id) FROM analytics.analytics_session WHERE login_time > NOW() - INTERVAL '24 hours'`).Scan(&kpi.ActiveToday)
	return kpi
}

func (r *Repository) GetActiveUsers(ctx context.Context) ActiveUserStat {
	stat := ActiveUserStat{}
	r.pool.QueryRow(ctx,
		`SELECT COUNT(*) FROM analytics.analytics_session WHERE logout_time IS NULL AND login_time > NOW() - INTERVAL '15 minutes'`).Scan(&stat.OnlineNow)
	r.pool.QueryRow(ctx,
		`SELECT COUNT(DISTINCT student_id) FROM analytics.analytics_session WHERE login_time > NOW() - INTERVAL '24 hours'`).Scan(&stat.Active24h)
	return stat
}

func (r *Repository) GetSchoolStats(ctx context.Context) SchoolStat {
	var stat SchoolStat
	r.pool.QueryRow(ctx, `SELECT COUNT(*) FROM academic.school WHERE deleted_at IS NULL`).Scan(&stat.Total)
	r.pool.QueryRow(ctx, `SELECT COUNT(*) FROM academic.school WHERE is_active = true AND deleted_at IS NULL`).Scan(&stat.Active)
	r.pool.QueryRow(ctx, `SELECT COUNT(*) FROM academic.school WHERE npsn IS NOT NULL AND deleted_at IS NULL`).Scan(&stat.Verified)
	return stat
}

func (r *Repository) GetCBTMonitoring(ctx context.Context) CBTMonitoring {
	var m CBTMonitoring
	r.pool.QueryRow(ctx, `SELECT COUNT(*) FROM cbt.exam e JOIN cbt.exam_status st ON st.id = e.status_id WHERE e.deleted_at IS NULL AND st.code = 'DRAFT'`).Scan(&m.Scheduled)
	r.pool.QueryRow(ctx, `SELECT COUNT(*) FROM cbt.exam e JOIN cbt.exam_status st ON st.id = e.status_id WHERE e.deleted_at IS NULL AND st.code = 'PUBLISHED'`).Scan(&m.Running)
	r.pool.QueryRow(ctx, `SELECT COUNT(*) FROM cbt.exam e JOIN cbt.exam_status st ON st.id = e.status_id WHERE e.deleted_at IS NULL AND st.code = 'ARCHIVED'`).Scan(&m.Finished)
	return m
}

func (r *Repository) GetAdminRecentActivity(ctx context.Context) []ActivityItem {
	rows, err := r.pool.Query(ctx,
		`SELECT 'user' AS type, 'Pengguna baru: ' || COALESCE(p.full_name, u.username) AS message, u.created_at FROM identity.user u
		 LEFT JOIN identity.user_profile p ON p.user_id = u.id WHERE u.deleted_at IS NULL
		 UNION ALL
		 SELECT 'exam' AS type, 'Ujian baru: ' || e.title AS message, e.created_at FROM cbt.exam e WHERE e.deleted_at IS NULL
		 UNION ALL
		 SELECT 'material' AS type, 'Materi baru: ' || m.title AS message, m.created_at FROM content.material m WHERE m.deleted_at IS NULL
		 ORDER BY created_at DESC LIMIT 10`)
	if err != nil {
		return []ActivityItem{}
	}
	defer rows.Close()

	var items []ActivityItem
	for rows.Next() {
		var ai ActivityItem
		if err := rows.Scan(&ai.Type, &ai.Message, &ai.CreatedAt); err != nil {
			continue
		}
		items = append(items, ai)
	}
	return items
}

func (r *Repository) GetUserGradeID(ctx context.Context, userID uuid.UUID) (*uuid.UUID, error) {
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

// --- Service ---

type Service struct {
	repo *Repository
}

func NewService(repo *Repository) *Service {
	return &Service{repo: repo}
}

func (s *Service) GetStudentDashboard(ctx context.Context, userID uuid.UUID) (*StudentDashboard, error) {
	fullName, err := s.repo.GetUserFullName(ctx, userID)
	if err != nil {
		fullName = "Siswa"
	}

	// Fetch student's grade_id for content filtering
	gradeID, _ := s.repo.GetUserGradeID(ctx, userID)

	now := time.Now()
	greeting := greetingForHour(now.Hour())

	motivations := []string{
		"Terus belajar, masa depan cerah menanti!",
		"Setiap langkah kecil membawamu lebih dekat ke mimpi.",
		"Jangan menyerah, kamu lebih hebat dari yang kamu kira!",
		"Belajar hari ini, sukses esok hari.",
		"Kunci kesuksesan adalah konsistensi.",
	}
	motivation := motivations[now.Day()%len(motivations)]

	dash := &StudentDashboard{
		Greeting: GreetingInfo{
			FullName:   fullName,
			Greeting:   greeting,
			Date:       now.Format("Monday, 2 January 2006"),
			Motivation: motivation,
		},
		ContinueLearning: s.repo.GetContinueLearning(ctx, userID, gradeID),
		TodayGoal:        s.repo.GetTodayGoal(ctx, userID, gradeID),
		LearningProgress: s.repo.GetLearningProgress(ctx, userID, gradeID),
		WeeklyActivity:   s.repo.GetWeeklyActivity(ctx, userID, gradeID),
		UpcomingExams:    s.repo.GetUpcomingExams(ctx, userID, gradeID),
		ExamStats:        s.repo.GetExamStats(ctx, userID),
		RecentActivity:   s.repo.GetStudentRecentActivity(ctx, userID, gradeID),
	}
	return dash, nil
}

func (s *Service) GetTeacherDashboard(ctx context.Context, userID uuid.UUID) (*TeacherDashboard, error) {
	fullName, err := s.repo.GetUserFullName(ctx, userID)
	if err != nil {
		fullName = "Guru"
	}

	now := time.Now()
	greeting := greetingForHour(now.Hour())

	dash := &TeacherDashboard{
		Greeting: GreetingInfo{
			FullName:   fullName,
			Greeting:   greeting,
			Date:       now.Format("Monday, 2 January 2006"),
			Motivation: "Tetap semangat mendidik generasi penerus bangsa!",
		},
		// ponytail: no schedule/class-assignment tables yet — return empty
		TodaySchedule: []ClassSchedule{},
		QuickActions: []QuickAction{
			{Label: "Buat Ujian Baru", Icon: "file-plus", Path: "/exams/create"},
			{Label: "Tambah Soal", Icon: "help-circle", Path: "/questions/create"},
			{Label: "Lihat Laporan", Icon: "bar-chart", Path: "/reports"},
			{Label: "Buat Materi", Icon: "book-open", Path: "/materials/create"},
		},
		MyClasses:        []ClassSummary{},
		UpcomingExams:    s.repo.GetTeacherUpcomingExams(ctx, userID),
		StudentProgress:  s.repo.GetTeacherStudentProgress(ctx, userID),
		QuestionBankStat: s.repo.GetQuestionBankStat(ctx, userID),
		RecentActivity:   s.repo.GetTeacherRecentActivity(ctx, userID),
	}
	return dash, nil
}

func (s *Service) GetAdminDashboard(ctx context.Context) (*AdminDashboard, error) {
	dash := &AdminDashboard{
		KPI: s.repo.GetKPI(ctx),
		SystemHealth: SystemHealth{
			APIStatus:    "healthy",
			DBStatus:     "healthy",
			StorageUsage: 0,
			Uptime:       0,
		},
		ActiveUsers:    s.repo.GetActiveUsers(ctx),
		SchoolStats:    s.repo.GetSchoolStats(ctx),
		CBTMonitoring:  s.repo.GetCBTMonitoring(ctx),
		RecentActivity: s.repo.GetAdminRecentActivity(ctx),
	}
	return dash, nil
}

func greetingForHour(hour int) string {
	switch {
	case hour < 11:
		return "Selamat Pagi"
	case hour < 15:
		return "Selamat Siang"
	case hour < 18:
		return "Selamat Sore"
	default:
		return "Selamat Malam"
	}
}

// --- Handler ---

type Handler struct {
	svc  *Service
	role string
}

func NewHandler(svc *Service, jwtSecret string) *Handler {
	return &Handler{svc: svc, role: jwtSecret}
}

func (h *Handler) GetStudentDashboard(c *fiber.Ctx) error {
	userIDStr := c.Locals("user_id")
	if userIDStr == nil {
		return c.Status(401).JSON(shared.Error(shared.ErrUnauthorized, "Not authenticated"))
	}
	userID, err := uuid.Parse(userIDStr.(string))
	if err != nil {
		return c.Status(400).JSON(shared.Error(shared.ErrValidation, "Invalid user ID"))
	}

	dash, err := h.svc.GetStudentDashboard(c.Context(), userID)
	if err != nil {
		return c.Status(500).JSON(shared.Error(shared.ErrInternal, "Failed to load dashboard"))
	}
	return c.JSON(shared.Success(dash))
}

func (h *Handler) GetTeacherDashboard(c *fiber.Ctx) error {
	userIDStr := c.Locals("user_id")
	if userIDStr == nil {
		return c.Status(401).JSON(shared.Error(shared.ErrUnauthorized, "Not authenticated"))
	}
	userID, err := uuid.Parse(userIDStr.(string))
	if err != nil {
		return c.Status(400).JSON(shared.Error(shared.ErrValidation, "Invalid user ID"))
	}

	dash, err := h.svc.GetTeacherDashboard(c.Context(), userID)
	if err != nil {
		return c.Status(500).JSON(shared.Error(shared.ErrInternal, "Failed to load dashboard"))
	}
	return c.JSON(shared.Success(dash))
}

func (h *Handler) GetAdminDashboard(c *fiber.Ctx) error {
	dash, err := h.svc.GetAdminDashboard(c.Context())
	if err != nil {
		return c.Status(500).JSON(shared.Error(shared.ErrInternal, "Failed to load dashboard"))
	}
	return c.JSON(shared.Success(dash))
}

func (h *Handler) RegisterRoutes(router fiber.Router) {
	auth := middleware.RequireAuth(h.role)
	admin := middleware.RequireRole("SUPER_ADMIN")

	d := router.Group("/dashboard", auth)
	d.Get("/student", h.GetStudentDashboard)
	d.Get("/teacher", h.GetTeacherDashboard)
	d.Get("/admin", admin, h.GetAdminDashboard)
}
