package dashboard

import (
	"context"
	"fmt"
	"math"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
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
	Achievement      AchievementSummary `json:"achievement"`
	Leaderboard      []LeaderboardEntry `json:"leaderboard"`
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

type AchievementSummary struct {
	TotalXP     int `json:"total_xp"`
	Level       int `json:"level"`
	Streak      int `json:"streak"`
	BadgesCount int `json:"badges_count"`
}

type LeaderboardEntry struct {
	Rank      int       `json:"rank"`
	UserID    uuid.UUID `json:"user_id"`
	FullName  string    `json:"full_name"`
	TotalXP   int       `json:"total_xp"`
	Level     int       `json:"level"`
	AvatarURL string    `json:"avatar_url"`
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
	err := r.pool.QueryRow(ctx, `SELECT full_name FROM users WHERE id=$1`, userID).Scan(&name)
	return name, err
}

func (r *Repository) GetContinueLearning(ctx context.Context, userID uuid.UUID, gradeID *uuid.UUID) *ContinueLearning {
	cl := &ContinueLearning{}
	args := []interface{}{userID}
	query := `SELECT c.id, c.title, COALESCE(s.name, ''), lp.progress
		 FROM content_learning_progress lp
		 JOIN contents c ON c.id = lp.content_id AND c.content_type = 'MATERIAL'
		 LEFT JOIN subjects s ON s.id = c.subject_id
		 WHERE lp.user_id = $1`
	if gradeID != nil {
		query += ` AND c.grade_id = $2`
		args = append(args, *gradeID)
	}
	query += ` AND lp.progress < 100
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

	mQ := `SELECT COUNT(*) FROM content_learning_progress lp
		 JOIN contents c ON c.id = lp.content_id AND c.content_type = 'MATERIAL'
		 WHERE lp.user_id = $1 AND lp.progress >= 100 AND lp.updated_at::date = $2::date`
	eQ := `SELECT COUNT(*) FROM content_exam_attempts a
		 JOIN contents c ON c.id = a.exam_content_id
		 WHERE a.user_id = $1 AND a.started_at::date = $2`
	if gradeID != nil {
		mQ += ` AND c.grade_id = $3`
		eQ += ` AND c.grade_id = $3`
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
		 COUNT(c.id) AS total,
		 COUNT(lp.id) FILTER (WHERE lp.progress >= 100) AS completed
		 FROM subjects s
		 JOIN contents c ON c.subject_id = s.id AND c.content_type = 'MATERIAL'
		 LEFT JOIN content_learning_progress lp ON lp.content_id = c.id AND lp.user_id = $1
		 WHERE 1=1`
	args := []interface{}{userID}
	if gradeID != nil {
		args = append(args, *gradeID)
		query += fmt.Sprintf(` AND c.grade_id = $%d`, len(args))
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
	gradeFilter := ""
	if gradeID != nil {
		gradeFilter = ` AND c.grade_id = '` + gradeID.String() + `'`
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
		   FROM content_learning_progress lp
		   JOIN contents c ON c.id = lp.content_id AND c.content_type = 'MATERIAL'`+gradeFilter+`
		   WHERE lp.user_id = $1 AND lp.progress >= 100 AND lp.updated_at >= CURRENT_DATE - INTERVAL '6 days'
		   GROUP BY lp.updated_at::date
		 ) m ON m.date = d.date
		 LEFT JOIN (
		   SELECT a.started_at::date AS date, COUNT(*) AS cnt
		   FROM content_exam_attempts a
		   JOIN contents c ON c.id = a.exam_content_id`+gradeFilter+`
		   WHERE a.user_id = $1 AND a.started_at >= CURRENT_DATE - INTERVAL '6 days'
		   GROUP BY a.started_at::date
		 ) q ON q.date = d.date
		 ORDER BY d.date`, userID)
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
	query := `SELECT c.id, c.title, COALESCE(s.name, ''), COALESCE(c.published_at::text, c.created_at::text), e.duration_minutes, c.status
		 FROM contents c
		 JOIN content_exams e ON e.content_id = c.id
		 LEFT JOIN subjects s ON s.id = c.subject_id
		 WHERE c.content_type = 'EXAM' AND c.status IN ('PUBLISHED')`
	args := []interface{}{}
	if gradeID != nil {
		args = append(args, *gradeID)
		query += fmt.Sprintf(` AND c.grade_id = $%d`, len(args))
	}
	query += ` ORDER BY c.created_at DESC`
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

func (r *Repository) GetAchievement(ctx context.Context, userID uuid.UUID) AchievementSummary {
	a := AchievementSummary{}
	err := r.pool.QueryRow(ctx,
		`SELECT COALESCE(total_xp_earned, 0), COALESCE(level, 0)
		 FROM user_levels WHERE user_id = $1`, userID,
	).Scan(&a.TotalXP, &a.Level)
	if err != nil {
		return a
	}
	r.pool.QueryRow(ctx,
		`SELECT COALESCE(current_streak, 0) FROM user_streaks WHERE user_id = $1`, userID,
	).Scan(&a.Streak)
	r.pool.QueryRow(ctx,
		`SELECT COUNT(*) FROM user_badges WHERE user_id = $1`, userID,
	).Scan(&a.BadgesCount)
	return a
}

func (r *Repository) GetLeaderboard(ctx context.Context) []LeaderboardEntry {
	rows, err := r.pool.Query(ctx,
		`SELECT ul.user_id, u.full_name, ul.total_xp_earned, ul.level, COALESCE(u.avatar_url, '')
		 FROM user_levels ul
		 JOIN users u ON u.id = ul.user_id
		 ORDER BY ul.total_xp_earned DESC LIMIT 10`)
	if err != nil {
		return []LeaderboardEntry{}
	}
	defer rows.Close()

	var items []LeaderboardEntry
	rank := 1
	for rows.Next() {
		var entry LeaderboardEntry
		if err := rows.Scan(&entry.UserID, &entry.FullName, &entry.TotalXP, &entry.Level, &entry.AvatarURL); err != nil {
			continue
		}
		entry.Rank = rank
		rank++
		items = append(items, entry)
	}
	return items
}

func (r *Repository) GetStudentRecentActivity(ctx context.Context, userID uuid.UUID, gradeID *uuid.UUID) []ActivityItem {
	gradeFilter := ""
	if gradeID != nil {
		gradeFilter = ` AND c.grade_id = '` + gradeID.String() + `'`
	}
	rows, err := r.pool.Query(ctx,
		`SELECT type, message, created_at FROM (
		 SELECT 'exam' AS type, 'Menyelesaikan ujian: ' || c.title AS message, a.submitted_at AS created_at
		 FROM content_exam_attempts a JOIN contents c ON c.id = a.exam_content_id WHERE a.user_id = $1 AND a.submitted_at IS NOT NULL`+gradeFilter+`
		 UNION ALL
		 SELECT 'material' AS type, 'Menyelesaikan materi: ' || c.title AS message, lp.updated_at AS created_at
		 FROM content_learning_progress lp JOIN contents c ON c.id = lp.content_id
		 WHERE lp.user_id = $1 AND lp.progress >= 100`+gradeFilter+`
		 UNION ALL
		 SELECT 'badge' AS type, 'Mendapatkan lencana: ' || b.name AS message, ub.created_at AS created_at
		 FROM user_badges ub JOIN badges b ON b.id = ub.badge_id WHERE ub.user_id = $1
		) sub ORDER BY created_at DESC LIMIT 10`, userID)
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
		`SELECT c.id, c.title, COALESCE(s.name, ''), COALESCE(c.published_at::text, c.created_at::text), e.duration_minutes, c.status
		 FROM contents c
		 JOIN content_exams e ON e.content_id = c.id
		 LEFT JOIN subjects s ON s.id = c.subject_id
		 WHERE c.content_type = 'EXAM' AND c.created_by = $1 AND c.status IN ('SCHEDULED','PUBLISHED')
		 ORDER BY c.created_at ASC`, userID)
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
		 COUNT(DISTINCT lp.material_id) FILTER (WHERE lp.progress >= 100) AS completed
		 FROM subjects s
		 JOIN materials m ON m.subject_id = s.id
		 LEFT JOIN learning_progress lp ON lp.material_id = m.id
		 WHERE s.created_by = $1
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
	r.pool.QueryRow(ctx, `SELECT COUNT(*) FROM content_questions WHERE created_by = $1`, userID).Scan(&stat.Total)
	r.pool.QueryRow(ctx, `SELECT COUNT(*) FROM content_questions WHERE created_by = $1 AND status = 'DRAFT'`, userID).Scan(&stat.Draft)
	r.pool.QueryRow(ctx, `SELECT COUNT(*) FROM content_questions WHERE created_by = $1 AND status = 'PUBLISHED'`, userID).Scan(&stat.Published)
	return stat
}

func (r *Repository) GetTeacherRecentActivity(ctx context.Context, userID uuid.UUID) []ActivityItem {
	rows, err := r.pool.Query(ctx,
		`SELECT 'exam' AS type, 'Ujian selesai: ' || c.title AS message, a.submitted_at AS created_at
		 FROM content_exam_attempts a
		 JOIN contents c ON c.id = a.exam_content_id
		 WHERE c.created_by = $1 AND a.submitted_at IS NOT NULL
		 ORDER BY a.submitted_at DESC LIMIT 10`, userID)
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
	r.pool.QueryRow(ctx, `SELECT COUNT(*) FROM users`).Scan(&kpi.TotalUsers)
	r.pool.QueryRow(ctx, `SELECT COUNT(*) FROM users WHERE role = 'TEACHER'`).Scan(&kpi.TotalTeachers)
	r.pool.QueryRow(ctx, `SELECT COUNT(*) FROM users WHERE role = 'STUDENT'`).Scan(&kpi.TotalStudents)
	r.pool.QueryRow(ctx, `SELECT COUNT(*) FROM schools`).Scan(&kpi.TotalSchools)
	r.pool.QueryRow(ctx, `SELECT COUNT(*) FROM contents WHERE content_type = 'EXAM'`).Scan(&kpi.TotalExams)
	r.pool.QueryRow(ctx, `SELECT COUNT(*) FROM contents WHERE content_type = 'MATERIAL'`).Scan(&kpi.TotalMaterials)
	r.pool.QueryRow(ctx, `SELECT COUNT(*) FROM content_questions`).Scan(&kpi.TotalQuestions)
	// Active today: users with any active session
	r.pool.QueryRow(ctx,
		`SELECT COUNT(DISTINCT user_id) FROM sessions WHERE expires_at > NOW()`).Scan(&kpi.ActiveToday)
	return kpi
}

func (r *Repository) GetActiveUsers(ctx context.Context) ActiveUserStat {
	stat := ActiveUserStat{}
	r.pool.QueryRow(ctx,
		`SELECT COUNT(*) FROM sessions WHERE expires_at > NOW()`).Scan(&stat.OnlineNow)
	r.pool.QueryRow(ctx,
		`SELECT COUNT(DISTINCT user_id) FROM sessions WHERE expires_at > NOW() - INTERVAL '24 hours'`).Scan(&stat.Active24h)
	return stat
}

func (r *Repository) GetSchoolStats(ctx context.Context) SchoolStat {
	var stat SchoolStat
	r.pool.QueryRow(ctx, `SELECT COUNT(*) FROM schools`).Scan(&stat.Total)
	r.pool.QueryRow(ctx, `SELECT COUNT(*) FROM schools WHERE status = 'ACTIVE'`).Scan(&stat.Active)
	r.pool.QueryRow(ctx, `SELECT COUNT(*) FROM schools WHERE is_verified = true`).Scan(&stat.Verified)
	return stat
}

func (r *Repository) GetCBTMonitoring(ctx context.Context) CBTMonitoring {
	var m CBTMonitoring
	r.pool.QueryRow(ctx, `SELECT COUNT(*) FROM contents WHERE content_type = 'EXAM' AND status = 'DRAFT'`).Scan(&m.Scheduled)
	r.pool.QueryRow(ctx, `SELECT COUNT(*) FROM contents WHERE content_type = 'EXAM' AND status = 'PUBLISHED'`).Scan(&m.Running)
	r.pool.QueryRow(ctx, `SELECT COUNT(*) FROM contents WHERE content_type = 'EXAM' AND status IN ('FINISHED','CLOSED','ARCHIVED')`).Scan(&m.Finished)
	return m
}

func (r *Repository) GetAdminRecentActivity(ctx context.Context) []ActivityItem {
	rows, err := r.pool.Query(ctx,
		`SELECT 'user' AS type, 'Pengguna baru: ' || full_name AS message, created_at FROM users
		 UNION ALL
		 SELECT 'exam' AS type, 'Ujian baru: ' || title AS message, created_at FROM contents WHERE content_type = 'EXAM'
		 UNION ALL
		 SELECT 'material' AS type, 'Materi baru: ' || title AS message, created_at FROM contents WHERE content_type = 'MATERIAL'
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
	var gradeID uuid.UUID
	err := r.pool.QueryRow(ctx, `SELECT grade_id FROM users WHERE id = $1`, userID).Scan(&gradeID)
	if err != nil {
		return nil, err
	}
	return &gradeID, nil
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
		Achievement:      s.repo.GetAchievement(ctx, userID),
		Leaderboard:      s.repo.GetLeaderboard(ctx),
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
	admin := middleware.RequireRole("ADMIN")

	d := router.Group("/dashboard", auth)
	d.Get("/student", h.GetStudentDashboard)
	d.Get("/teacher", h.GetTeacherDashboard)
	d.Get("/admin", admin, h.GetAdminDashboard)
}
