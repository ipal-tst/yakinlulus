package gamification

import (
	"context"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"yakinlulus.id/backend/internal/middleware"
	"yakinlulus.id/backend/internal/shared"
)

var errNoRows = pgx.ErrNoRows

// --- DTOs ---

type UserLevelResponse struct {
	UserID        uuid.UUID `json:"user_id"`
	Level         int       `json:"level"`
	CurrentXP     int       `json:"current_xp"`
	TotalXPEarned int       `json:"total_xp_earned"`
	XPToNextLevel int       `json:"xp_to_next_level"`
	ProgressPct   float64   `json:"progress_pct"`
}

type BadgeResponse struct {
	ID          uuid.UUID `json:"id"`
	Code        string    `json:"code"`
	Name        string    `json:"name"`
	Description *string   `json:"description"`
	IconURL     *string   `json:"icon_url"`
	Category    string    `json:"category"`
	XPReward    int       `json:"xp_reward"`
}

type UserBadgeResponse struct {
	BadgeID     uuid.UUID `json:"badge_id"`
	Code        string    `json:"code"`
	Name        string    `json:"name"`
	Description *string   `json:"description"`
	IconURL     *string   `json:"icon_url"`
	EarnedAt    time.Time `json:"earned_at"`
}

type StreakResponse struct {
	CurrentStreak int        `json:"current_streak"`
	LongestStreak int        `json:"longest_streak"`
	LastActivity  *time.Time `json:"last_activity_date"`
	IsActiveToday bool       `json:"is_active_today"`
}

type PingResponse struct {
	CurrentStreak int `json:"current_streak"`
	BonusXP       int `json:"bonus_xp"`
}

type LeaderboardEntry struct {
	Rank     int       `json:"rank"`
	UserID   uuid.UUID `json:"user_id"`
	FullName string    `json:"full_name"`
	TotalXP  int       `json:"total_xp"`
	Level    int       `json:"level"`
}

type AchievementResponse struct {
	TotalXP        int `json:"total_xp"`
	Level          int `json:"level"`
	Streak         int `json:"streak"`
	BadgesCount    int `json:"badges_count"`
	ExamsCompleted int `json:"exams_completed"`
	Rank           int `json:"rank"`
}

type AddXPRequest struct {
	UserID uuid.UUID `json:"user_id"`
	Amount int       `json:"amount"`
	Reason string    `json:"reason"`
}

// ---- DB row helpers ----

func computeLevel(totalXP int) int {
	return totalXP/1000 + 1
}

func computeLevelProgress(totalXP int) (int, int, float64) {
	level := computeLevel(totalXP)
	currentXP := totalXP - (level-1)*1000
	pct := float64(currentXP) / 1000.0 * 100
	return level, currentXP, pct
}

// --- Repository ---

type Repository struct {
	pool *pgxpool.Pool
}

func NewRepository(pool *pgxpool.Pool) *Repository {
	return &Repository{pool: pool}
}

func (r *Repository) GetUserLevel(ctx context.Context, userID uuid.UUID) (*UserLevelResponse, error) {
	ul := &UserLevelResponse{}
	err := r.pool.QueryRow(ctx,
		`SELECT user_id, level, current_xp, total_xp_earned FROM user_levels WHERE user_id=$1`, userID,
	).Scan(&ul.UserID, &ul.Level, &ul.CurrentXP, &ul.TotalXPEarned)
	if err != nil {
		if err == errNoRows {
			ul.UserID = userID
			ul.Level = 1
			ul.CurrentXP = 0
			ul.TotalXPEarned = 0
		} else {
			return nil, err
		}
	}
	ul.XPToNextLevel = ul.Level*1000 - ul.TotalXPEarned
	if ul.TotalXPEarned > 0 {
		ul.ProgressPct = float64(ul.CurrentXP) / 1000.0 * 100
	}
	return ul, nil
}

func (r *Repository) UpsertUserLevel(ctx context.Context, userID uuid.UUID, totalXPEarned int) (*UserLevelResponse, error) {
	level, currentXP, pct := computeLevelProgress(totalXPEarned)
	_, err := r.pool.Exec(ctx,
		`INSERT INTO user_levels (user_id, level, current_xp, total_xp_earned, updated_at)
		 VALUES ($1, $2, $3, $4, NOW())
		 ON CONFLICT (user_id) DO UPDATE SET
		   level = $2, current_xp = $3, total_xp_earned = $4, updated_at = NOW()`,
		userID, level, currentXP, totalXPEarned)
	if err != nil {
		return nil, err
	}
	return &UserLevelResponse{
		UserID:        userID,
		Level:         level,
		CurrentXP:     currentXP,
		TotalXPEarned: totalXPEarned,
		XPToNextLevel: level*1000 - totalXPEarned,
		ProgressPct:   pct,
	}, nil
}

func (r *Repository) InsertXPTransaction(ctx context.Context, userID uuid.UUID, amount int, reason string, metadata map[string]interface{}) error {
	_, err := r.pool.Exec(ctx,
		`INSERT INTO xp_transactions (user_id, amount, reason, metadata) VALUES ($1, $2, $3, $4)`,
		userID, amount, reason, metadata)
	return err
}

func (r *Repository) GetCurrentTotalXP(ctx context.Context, userID uuid.UUID) (int, error) {
	var total int
	err := r.pool.QueryRow(ctx,
		`SELECT COALESCE(total_xp_earned, 0) FROM user_levels WHERE user_id=$1`, userID).Scan(&total)
	if err != nil {
		if err == errNoRows {
			return 0, nil
		}
		return 0, err
	}
	return total, nil
}

func (r *Repository) ListBadges(ctx context.Context, category string) ([]BadgeResponse, error) {
	var pgxRows pgx.Rows
	if category != "" {
		rrows, err := r.pool.Query(ctx,
			`SELECT id, code, name, description, icon_url, category, xp_reward
			 FROM badges WHERE category=$1 ORDER BY created_at`, category)
		if err != nil {
			return nil, err
		}
		pgxRows = rrows
	} else {
		rrows, err := r.pool.Query(ctx,
			`SELECT id, code, name, description, icon_url, category, xp_reward
			 FROM badges ORDER BY created_at`)
		if err != nil {
			return nil, err
		}
		pgxRows = rrows
	}
	defer pgxRows.Close()

	var badges []BadgeResponse
	for pgxRows.Next() {
		var b BadgeResponse
		if err := pgxRows.Scan(&b.ID, &b.Code, &b.Name, &b.Description, &b.IconURL, &b.Category, &b.XPReward); err != nil {
			return nil, err
		}
		badges = append(badges, b)
	}
	return badges, nil
}

func (r *Repository) GetUserBadges(ctx context.Context, userID uuid.UUID) ([]UserBadgeResponse, error) {
	rows, err := r.pool.Query(ctx,
		`SELECT b.id, b.code, b.name, b.description, b.icon_url, ub.earned_at
		 FROM user_badges ub
		 JOIN badges b ON b.id = ub.badge_id
		 WHERE ub.user_id = $1
		 ORDER BY ub.earned_at DESC`, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var badges []UserBadgeResponse
	for rows.Next() {
		var ub UserBadgeResponse
		if err := rows.Scan(&ub.BadgeID, &ub.Code, &ub.Name, &ub.Description, &ub.IconURL, &ub.EarnedAt); err != nil {
			return nil, err
		}
		badges = append(badges, ub)
	}
	return badges, nil
}

func (r *Repository) GetBadgeByCode(ctx context.Context, code string) (*BadgeResponse, error) {
	b := &BadgeResponse{}
	err := r.pool.QueryRow(ctx,
		`SELECT id, code, name, description, icon_url, category, xp_reward
		 FROM badges WHERE code=$1`, code).Scan(&b.ID, &b.Code, &b.Name, &b.Description, &b.IconURL, &b.Category, &b.XPReward)
	if err != nil {
		return nil, err
	}
	return b, nil
}

func (r *Repository) EarnBadge(ctx context.Context, userID uuid.UUID, badgeID uuid.UUID) error {
	_, err := r.pool.Exec(ctx,
		`INSERT INTO user_badges (user_id, badge_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
		userID, badgeID)
	return err
}

func (r *Repository) HasBadge(ctx context.Context, userID uuid.UUID, badgeID uuid.UUID) (bool, error) {
	var count int
	err := r.pool.QueryRow(ctx,
		`SELECT COUNT(*) FROM user_badges WHERE user_id=$1 AND badge_id=$2`, userID, badgeID).Scan(&count)
	return count > 0, err
}

func (r *Repository) GetStreak(ctx context.Context, userID uuid.UUID) (*StreakResponse, error) {
	s := &StreakResponse{}
	err := r.pool.QueryRow(ctx,
		`SELECT current_streak, longest_streak, last_activity_date FROM user_streaks WHERE user_id=$1`, userID,
	).Scan(&s.CurrentStreak, &s.LongestStreak, &s.LastActivity)
	if err != nil {
		if err == errNoRows {
			s.CurrentStreak = 0
			s.LongestStreak = 0
			s.IsActiveToday = false
			return s, nil
		}
		return nil, err
	}
	if s.LastActivity != nil {
		today := time.Now().Truncate(24 * time.Hour)
		last := s.LastActivity.Truncate(24 * time.Hour)
		s.IsActiveToday = today.Equal(last)
	}
	return s, nil
}

func (r *Repository) UpsertStreak(ctx context.Context, userID uuid.UUID, current, longest int, lastActivity time.Time) error {
	_, err := r.pool.Exec(ctx,
		`INSERT INTO user_streaks (user_id, current_streak, longest_streak, last_activity_date, updated_at)
		 VALUES ($1, $2, $3, $4, NOW())
		 ON CONFLICT (user_id) DO UPDATE SET
		   current_streak = $2, longest_streak = $3, last_activity_date = $4, updated_at = NOW()`,
		userID, current, longest, lastActivity)
	return err
}

func (r *Repository) GetLeaderboardAll(ctx context.Context, limit int) ([]LeaderboardEntry, error) {
	rows, err := r.pool.Query(ctx,
		`SELECT ul.user_id, u.full_name, ul.total_xp_earned
		 FROM user_levels ul
		 JOIN users u ON u.id = ul.user_id
		 ORDER BY ul.total_xp_earned DESC
		 LIMIT $1`, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	return scanLeaderboard(rows)
}

func (r *Repository) GetLeaderboardPeriod(ctx context.Context, limit int, interval string) ([]LeaderboardEntry, error) {
	rows, err := r.pool.Query(ctx,
		`SELECT xp.user_id, u.full_name, SUM(xp.amount) AS total_xp
		 FROM xp_transactions xp
		 JOIN users u ON u.id = xp.user_id
		 WHERE xp.created_at >= NOW() - $2::INTERVAL
		 GROUP BY xp.user_id, u.full_name
		 ORDER BY total_xp DESC
		 LIMIT $1`, limit, interval)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	return scanLeaderboard(rows)
}

func scanLeaderboard(rows pgx.Rows) ([]LeaderboardEntry, error) {
	var entries []LeaderboardEntry
	rank := 1
	for rows.Next() {
		var e LeaderboardEntry
		if err := rows.Scan(&e.UserID, &e.FullName, &e.TotalXP); err != nil {
			return nil, err
		}
		e.Rank = rank
		e.Level = computeLevel(e.TotalXP)
		entries = append(entries, e)
		rank++
	}
	return entries, nil
}

func (r *Repository) GetUserRank(ctx context.Context, userID uuid.UUID) (int, error) {
	var rank int
	err := r.pool.QueryRow(ctx,
		`SELECT rnk FROM (
		   SELECT user_id, ROW_NUMBER() OVER (ORDER BY total_xp_earned DESC) AS rnk
		   FROM user_levels
		 ) sub WHERE sub.user_id = $1`, userID).Scan(&rank)
	if err != nil {
		return 0, nil // not ranked yet
	}
	return rank, nil
}

func (r *Repository) GetExamsCompleted(ctx context.Context, userID uuid.UUID) (int, error) {
	var count int
	err := r.pool.QueryRow(ctx,
		`SELECT COUNT(*) FROM results WHERE user_id=$1`, userID).Scan(&count)
	return count, err
}

func (r *Repository) CountBadges(ctx context.Context, userID uuid.UUID) (int, error) {
	var count int
	err := r.pool.QueryRow(ctx,
		`SELECT COUNT(*) FROM user_badges WHERE user_id=$1`, userID).Scan(&count)
	return count, err
}

// --- Service ---

type Service struct {
	repo *Repository
}

func NewService(repo *Repository) *Service {
	return &Service{repo: repo}
}

func (s *Service) GetMyXP(ctx context.Context, userID uuid.UUID) (*UserLevelResponse, error) {
	ul, err := s.repo.GetUserLevel(ctx, userID)
	if err != nil {
		return nil, err
	}
	// Ensure computed fields are set
	ul.XPToNextLevel = ul.Level*1000 - ul.TotalXPEarned
	if ul.TotalXPEarned > 0 {
		ul.ProgressPct = float64(ul.CurrentXP) / 1000.0 * 100
	}
	return ul, nil
}

func (s *Service) ListBadges(ctx context.Context, category string) ([]BadgeResponse, error) {
	return s.repo.ListBadges(ctx, category)
}

func (s *Service) GetUserBadges(ctx context.Context, userID uuid.UUID) ([]UserBadgeResponse, error) {
	return s.repo.GetUserBadges(ctx, userID)
}

func (s *Service) AddXP(ctx context.Context, adminID uuid.UUID, userID uuid.UUID, amount int, reason string) (*UserLevelResponse, error) {
	if amount <= 0 {
		return nil, fiber.NewError(fiber.StatusBadRequest, "Amount must be positive")
	}

	// Insert transaction
	metadata := map[string]interface{}{
		"granted_by": adminID.String(),
	}
	if err := s.repo.InsertXPTransaction(ctx, userID, amount, reason, metadata); err != nil {
		return nil, err
	}

	// Get current total and add
	currentTotal, err := s.repo.GetCurrentTotalXP(ctx, userID)
	if err != nil {
		return nil, err
	}

	newTotal := currentTotal + amount
	ul, err := s.repo.UpsertUserLevel(ctx, userID, newTotal)
	if err != nil {
		return nil, err
	}

	// Check badge unlocks
	if _, err := s.checkAndAwardBadges(ctx, userID); err != nil {
		// non-fatal: log but don't block response
	}

	return ul, nil
}

func (s *Service) GetStreak(ctx context.Context, userID uuid.UUID) (*StreakResponse, error) {
	return s.repo.GetStreak(ctx, userID)
}

func (s *Service) PingStreak(ctx context.Context, userID uuid.UUID) (*PingResponse, error) {
	today := time.Now().Truncate(24 * time.Hour)

	streak, err := s.repo.GetStreak(ctx, userID)
	if err != nil {
		return nil, err
	}

	// Already active today — no bonus
	if streak.IsActiveToday {
		return &PingResponse{CurrentStreak: streak.CurrentStreak, BonusXP: 0}, nil
	}

	var newCurrent, newLongest int
	if streak.LastActivity != nil {
		last := streak.LastActivity.Truncate(24 * time.Hour)
		yesterday := today.AddDate(0, 0, -1)

		if last.Equal(yesterday) {
			// Consecutive day — increment streak
			newCurrent = streak.CurrentStreak + 1
		} else {
			// Gap — reset streak
			newCurrent = 1
		}
	} else {
		// First activity ever
		newCurrent = 1
	}

	newLongest = streak.LongestStreak
	if newCurrent > newLongest {
		newLongest = newCurrent
	}

	if err := s.repo.UpsertStreak(ctx, userID, newCurrent, newLongest, today); err != nil {
		return nil, err
	}

	// Award streak bonus XP: 10 * streak day N
	bonusXP := 10 * newCurrent
	if err := s.repo.InsertXPTransaction(ctx, userID, bonusXP, "login_streak", nil); err != nil {
		return nil, err
	}

	// Update user level totals
	currentTotal, err := s.repo.GetCurrentTotalXP(ctx, userID)
	if err != nil {
		return nil, err
	}
	if _, err := s.repo.UpsertUserLevel(ctx, userID, currentTotal+bonusXP); err != nil {
		return nil, err
	}

	// Check badge unlocks
	if _, err := s.checkAndAwardBadges(ctx, userID); err != nil {
		// non-fatal
	}

	return &PingResponse{CurrentStreak: newCurrent, BonusXP: bonusXP}, nil
}

func (s *Service) GetLeaderboard(ctx context.Context, limit int, period string) ([]LeaderboardEntry, error) {
	if limit < 1 {
		limit = 20
	}
	if limit > 100 {
		limit = 100
	}

	switch period {
	case "weekly":
		return s.repo.GetLeaderboardPeriod(ctx, limit, "7 days")
	case "monthly":
		return s.repo.GetLeaderboardPeriod(ctx, limit, "30 days")
	default:
		return s.repo.GetLeaderboardAll(ctx, limit)
	}
}

func (s *Service) GetAchievements(ctx context.Context, userID uuid.UUID) (*AchievementResponse, error) {
	ul, err := s.repo.GetUserLevel(ctx, userID)
	if err != nil {
		return nil, err
	}

	streak, err := s.repo.GetStreak(ctx, userID)
	if err != nil {
		return nil, err
	}

	badgesCount, err := s.repo.CountBadges(ctx, userID)
	if err != nil {
		return nil, err
	}

	examsCompleted, err := s.repo.GetExamsCompleted(ctx, userID)
	if err != nil {
		return nil, err
	}

	rank, err := s.repo.GetUserRank(ctx, userID)
	if err != nil {
		return nil, err
	}

	return &AchievementResponse{
		TotalXP:        ul.TotalXPEarned,
		Level:          ul.Level,
		Streak:         streak.CurrentStreak,
		BadgesCount:    badgesCount,
		ExamsCompleted: examsCompleted,
		Rank:           rank,
	}, nil
}

func (s *Service) checkAndAwardBadges(ctx context.Context, userID uuid.UUID) ([]BadgeResponse, error) {
	var awarded []BadgeResponse

	_, err := s.repo.GetUserLevel(ctx, userID)
	if err != nil {
		return nil, err
	}

	examsDone, err := s.repo.GetExamsCompleted(ctx, userID)
	if err != nil {
		return nil, err
	}

	streak, err := s.repo.GetStreak(ctx, userID)
	if err != nil {
		return nil, err
	}

	userBadges, err := s.repo.GetUserBadges(ctx, userID)
	if err != nil {
		return nil, err
	}
	hasBadge := make(map[string]bool)
	for _, ub := range userBadges {
		hasBadge[ub.Code] = true
	}

	badges, err := s.repo.ListBadges(ctx, "")
	if err != nil {
		return nil, err
	}

	for _, badge := range badges {
		if hasBadge[badge.Code] {
			continue
		}

		unlock := false
		switch badge.Code {
		case "first_exam":
			if examsDone >= 1 {
				unlock = true
			}
		case "ten_exams":
			if examsDone >= 10 {
				unlock = true
			}
		case "streak_7":
			if streak.CurrentStreak >= 7 {
				unlock = true
			}
		case "streak_30":
			if streak.CurrentStreak >= 30 {
				unlock = true
			}
		case "perfect_score":
			// Checked via metadata when AddXP is called with reason='exam_completed'
			// This is handled separately — skip automatic check
		case "top_10":
			rank, _ := s.repo.GetUserRank(ctx, userID)
			if rank > 0 && rank <= 10 {
				unlock = true
			}
		case "social_butterfly":
			// Would need tryout count — skip for now
		case "night_owl":
			// Would need time-of-day check — skip for now
		}

		if unlock {
			if err := s.repo.EarnBadge(ctx, userID, badge.ID); err != nil {
				continue
			}
			// Award badge XP
			if badge.XPReward > 0 {
				metadata := map[string]interface{}{"badge_code": badge.Code}
				s.repo.InsertXPTransaction(ctx, userID, badge.XPReward, "badge_earned", metadata)
				currentTotal, _ := s.repo.GetCurrentTotalXP(ctx, userID)
				s.repo.UpsertUserLevel(ctx, userID, currentTotal+badge.XPReward)
			}
			awarded = append(awarded, badge)
		}
	}

	return awarded, nil
}

// --- Handler ---

type Handler struct {
	svc  *Service
	role string
}

func NewHandler(svc *Service, jwtSecret string) *Handler {
	return &Handler{svc: svc, role: jwtSecret}
}

func (h *Handler) GetMyXP(c *fiber.Ctx) error {
	userID, _ := uuid.Parse(c.Locals("user_id").(string))
	ul, err := h.svc.GetMyXP(c.Context(), userID)
	if err != nil {
		return c.Status(500).JSON(shared.Error(shared.ErrInternal, "Failed to get XP"))
	}
	return c.JSON(shared.Success(ul))
}

func (h *Handler) ListBadges(c *fiber.Ctx) error {
	category := c.Query("category")
	badges, err := h.svc.ListBadges(c.Context(), category)
	if err != nil {
		return c.Status(500).JSON(shared.Error(shared.ErrInternal, "Failed to list badges"))
	}
	return c.JSON(shared.Success(badges))
}

func (h *Handler) GetUserBadges(c *fiber.Ctx) error {
	userID, _ := uuid.Parse(c.Locals("user_id").(string))
	badges, err := h.svc.GetUserBadges(c.Context(), userID)
	if err != nil {
		return c.Status(500).JSON(shared.Error(shared.ErrInternal, "Failed to get user badges"))
	}
	return c.JSON(shared.Success(badges))
}

func (h *Handler) AddXP(c *fiber.Ctx) error {
	var req AddXPRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(shared.Error(shared.ErrValidation, "Invalid request body"))
	}
	if req.Amount <= 0 {
		return c.Status(400).JSON(shared.Error(shared.ErrValidation, "Amount must be positive"))
	}
	if req.Reason == "" {
		return c.Status(400).JSON(shared.Error(shared.ErrValidation, "Reason is required"))
	}

	adminID, _ := uuid.Parse(c.Locals("user_id").(string))
	ul, err := h.svc.AddXP(c.Context(), adminID, req.UserID, req.Amount, req.Reason)
	if err != nil {
		if fErr, ok := err.(*fiber.Error); ok {
			return c.Status(fErr.Code).JSON(shared.Error(shared.ErrValidation, fErr.Message))
		}
		return c.Status(500).JSON(shared.Error(shared.ErrInternal, "Failed to add XP"))
	}
	return c.JSON(shared.Success(ul))
}

func (h *Handler) GetStreak(c *fiber.Ctx) error {
	userID, _ := uuid.Parse(c.Locals("user_id").(string))
	s, err := h.svc.GetStreak(c.Context(), userID)
	if err != nil {
		return c.Status(500).JSON(shared.Error(shared.ErrInternal, "Failed to get streak"))
	}
	return c.JSON(shared.Success(s))
}

func (h *Handler) PingStreak(c *fiber.Ctx) error {
	userID, _ := uuid.Parse(c.Locals("user_id").(string))
	resp, err := h.svc.PingStreak(c.Context(), userID)
	if err != nil {
		return c.Status(500).JSON(shared.Error(shared.ErrInternal, "Failed to update streak"))
	}
	return c.JSON(shared.Success(resp))
}

func (h *Handler) GetLeaderboard(c *fiber.Ctx) error {
	limit := c.QueryInt("limit", 20)
	if limit < 1 {
		limit = 20
	}
	if limit > 100 {
		limit = 100
	}
	period := c.Query("period", "all")
	if period != "weekly" && period != "monthly" && period != "all" {
		period = "all"
	}

	entries, err := h.svc.GetLeaderboard(c.Context(), limit, period)
	if err != nil {
		return c.Status(500).JSON(shared.Error(shared.ErrInternal, "Failed to get leaderboard"))
	}
	return c.JSON(shared.Success(entries))
}

func (h *Handler) GetAchievements(c *fiber.Ctx) error {
	userID, _ := uuid.Parse(c.Locals("user_id").(string))
	a, err := h.svc.GetAchievements(c.Context(), userID)
	if err != nil {
		return c.Status(500).JSON(shared.Error(shared.ErrInternal, "Failed to get achievements"))
	}
	return c.JSON(shared.Success(a))
}

func (h *Handler) RegisterRoutes(router fiber.Router) {
	auth := middleware.RequireAuth(h.role)
	staffOnly := middleware.RequireRole("ADMIN", "STAFF")

	g := router.Group("/gamification", auth)

	// User-facing
	g.Get("/xp", h.GetMyXP)
	g.Get("/badges", h.ListBadges)
	g.Get("/user/badges", h.GetUserBadges)
	g.Get("/streak", h.GetStreak)
	g.Post("/streak/ping", h.PingStreak)
	g.Get("/leaderboard", h.GetLeaderboard)
	g.Get("/achievements", h.GetAchievements)

	// Admin/Staff
	g.Post("/xp/add", staffOnly, h.AddXP)
}
