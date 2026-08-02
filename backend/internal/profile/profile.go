package profile

import (
	"context"
	"fmt"
	"html/template"
	"strings"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"yakinlulus.id/backend/internal/middleware"
	"yakinlulus.id/backend/internal/shared"
	"yakinlulus.id/backend/internal/target_schools"
)

// ---- Models ----

type StudentTarget struct {
	ID              uuid.UUID  `json:"id"`
	Choice          int        `json:"choice"`
	TargetType      string     `json:"target_type"`
	SchoolID        *uuid.UUID `json:"target_school_id,omitempty"`
	SchoolName      string     `json:"school_name"`
	Major           *string    `json:"major,omitempty"`
	PassingScoreIRT *int       `json:"passing_score_irt,omitempty"`
	CreatedAt       time.Time  `json:"created_at"`
	UpdatedAt       time.Time  `json:"updated_at"`
}

type SaveTargetsRequest struct {
	Targets []TargetInput `json:"targets"`
}

type TargetInput struct {
	Choice          int    `json:"choice"`
	TargetSchoolID  string `json:"target_school_id"`
	SchoolName      string `json:"school_name"`
	Major           *string `json:"major,omitempty"`
	PassingScoreIRT *int   `json:"passing_score_irt,omitempty"`
}

type EnrichedTarget struct {
	ID              uuid.UUID  `json:"id"`
	Choice          int        `json:"choice"`
	TargetType      string     `json:"target_type"`
	SchoolID        *uuid.UUID `json:"target_school_id,omitempty"`
	SchoolName      string     `json:"school_name"`
	Major           *string    `json:"major,omitempty"`
	PassingScoreIRT *int       `json:"passing_score_irt,omitempty"`
	MinScore        *int       `json:"min_score,omitempty"`
	MaxScore        *int       `json:"max_score,omitempty"`
	MaxTotalScore   int        `json:"max_total_score"`
	Subjects        []string   `json:"subjects"`
	StudentScore    int        `json:"student_score"`
	ProgressPct     float64    `json:"progress_pct"`
	HasScoreData    bool       `json:"has_score_data"`
	ThresholdState  string     `json:"threshold_state"`
	Motivational    string     `json:"motivational"`
	CreatedAt       time.Time  `json:"created_at"`
	UpdatedAt       time.Time  `json:"updated_at"`
}

type Certificate struct {
	ID       uuid.UUID `json:"id"`
	Title    string    `json:"title"`
	ExamID   uuid.UUID `json:"exam_id"`
	Score    float64   `json:"score"`
	MaxScore float64   `json:"max_score"`
	Pct      float64   `json:"percent"`
	Rank     int       `json:"rank"`
	Total    int       `json:"total"`
	Date     time.Time `json:"date"`
}

// ---- Repository ----

type Repository struct {
	pool *pgxpool.Pool
}

func NewRepository(pool *pgxpool.Pool) *Repository {
	return &Repository{pool: pool}
}

func (r *Repository) GetUserLevelCode(ctx context.Context, userID uuid.UUID) (string, error) {
	var code string
	err := r.pool.QueryRow(ctx,
		`SELECT COALESCE(el.code, '') FROM users u
		 LEFT JOIN grades g ON g.id = u.grade_id
		 LEFT JOIN education_levels el ON el.id = g.education_level_id
		 WHERE u.id = $1`, userID).Scan(&code)
	if err != nil && err != pgx.ErrNoRows {
		return "", err
	}
	return code, nil
}

func (r *Repository) ListTargets(ctx context.Context, userID uuid.UUID) ([]StudentTarget, error) {
	rows, err := r.pool.Query(ctx,
		`SELECT id, choice, COALESCE(target_type,''), target_school_id, COALESCE(school_name,''),
		   major, passing_score_irt, created_at, updated_at
		 FROM student_targets WHERE user_id = $1 ORDER BY choice`, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	targets := []StudentTarget{}
	for rows.Next() {
		var t StudentTarget
		if err := rows.Scan(&t.ID, &t.Choice, &t.TargetType, &t.SchoolID, &t.SchoolName,
			&t.Major, &t.PassingScoreIRT, &t.CreatedAt, &t.UpdatedAt); err != nil {
			return nil, err
		}
		targets = append(targets, t)
	}
	return targets, rows.Err()
}

func (r *Repository) UpsertTargets(ctx context.Context, userID uuid.UUID, targets []TargetInput) ([]StudentTarget, error) {
	tx, err := r.pool.Begin(ctx)
	if err != nil {
		return nil, err
	}
	defer tx.Rollback(ctx)

	for _, in := range targets {
		if in.Choice != 1 && in.Choice != 2 {
			continue
		}
		var schoolID *uuid.UUID
		if in.TargetSchoolID != "" {
			if id, perr := uuid.Parse(in.TargetSchoolID); perr == nil {
				schoolID = &id
			}
		}
		_, err := tx.Exec(ctx,
			`INSERT INTO student_targets (user_id, choice, target_type, target_school_id, school_name, major, passing_score_irt)
			 VALUES ($1, $2, $3, $4, $5, $6, $7)
			 ON CONFLICT (user_id, choice)
			 DO UPDATE SET target_type = EXCLUDED.target_type,
			   target_school_id = EXCLUDED.target_school_id,
			   school_name = EXCLUDED.school_name,
			   major = EXCLUDED.major,
			   passing_score_irt = EXCLUDED.passing_score_irt,
			   updated_at = NOW()`,
			userID, in.Choice, targetTypeFromGrade(""), schoolID, in.SchoolName, in.Major, in.PassingScoreIRT)
		if err != nil {
			return nil, err
		}
	}

	if err := tx.Commit(ctx); err != nil {
		return nil, err
	}
	return r.ListTargets(ctx, userID)
}

func (r *Repository) BestCertificatePct(ctx context.Context, userID uuid.UUID) (float64, bool, error) {
	var pct float64
	err := r.pool.QueryRow(ctx,
		`SELECT COALESCE(MAX(CASE WHEN COALESCE(a.max_score,0) > 0
		        THEN ROUND(COALESCE(a.total_score,0)/a.max_score*100,1) ELSE 0 END),0)
		 FROM content_exam_attempts a
		 WHERE a.user_id = $1 AND a.status = 'SUBMITTED'`, userID).Scan(&pct)
	if err != nil {
		return 0, false, err
	}
	return pct, pct > 0, nil
}

// SumBestPerSubject sums the best score per subject across the student's
// submitted attempts, only counting subjects present in the given list.
func (r *Repository) SumBestPerSubject(ctx context.Context, userID uuid.UUID, subjects []string) (int, bool, error) {
	if len(subjects) == 0 {
		return 0, false, nil
	}
	rows, err := r.pool.Query(ctx,
		`SELECT s.name, MAX(COALESCE(a.total_score,0))
		 FROM content_exam_attempts a
		 JOIN contents c ON c.id = a.exam_content_id
		 JOIN subjects s ON s.id = c.subject_id
		 WHERE a.user_id = $1 AND a.status = 'SUBMITTED'
		   AND LOWER(s.name) = ANY($2)
		 GROUP BY s.name`, userID, lowerAll(subjects))
	if err != nil {
		return 0, false, err
	}
	defer rows.Close()
	total := 0
	found := false
	for rows.Next() {
		var name string
		var sc int
		if err := rows.Scan(&name, &sc); err != nil {
			return 0, false, err
		}
		total += sc
		found = true
	}
	return total, found, rows.Err()
}

func lowerAll(in []string) []string {
	out := make([]string, len(in))
	for i, v := range in {
		out[i] = strings.ToLower(strings.TrimSpace(v))
	}
	return out
}

func (r *Repository) ListCertificates(ctx context.Context, userID uuid.UUID) ([]Certificate, error) {
	rows, err := r.pool.Query(ctx,
		`SELECT
		   a.id,
		   COALESCE(c.title, 'Tryout'),
		   a.exam_content_id,
		   COALESCE(a.total_score, 0),
		   COALESCE(a.max_score, 0),
		   CASE WHEN COALESCE(a.max_score, 0) > 0
		        THEN ROUND(COALESCE(a.total_score, 0) / a.max_score * 100, 1) ELSE 0 END,
		   COALESCE(a.submitted_at, a.created_at),
		   (SELECT COUNT(*) FROM content_exam_attempts x
		     WHERE x.exam_content_id = a.exam_content_id
		       AND x.status = 'SUBMITTED'
		       AND COALESCE(x.total_score, 0) > COALESCE(a.total_score, 0)) + 1,
		   (SELECT COUNT(*) FROM content_exam_attempts x
		     WHERE x.exam_content_id = a.exam_content_id
		       AND x.status = 'SUBMITTED')
		 FROM content_exam_attempts a
		 LEFT JOIN contents c ON c.id = a.exam_content_id
		 WHERE a.user_id = $1 AND a.status = 'SUBMITTED'
		 ORDER BY COALESCE(a.submitted_at, a.created_at) DESC`, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	certs := []Certificate{}
	for rows.Next() {
		var cr Certificate
		if err := rows.Scan(&cr.ID, &cr.Title, &cr.ExamID, &cr.Score, &cr.MaxScore, &cr.Pct, &cr.Date, &cr.Rank, &cr.Total); err != nil {
			return nil, err
		}
		certs = append(certs, cr)
	}
	return certs, rows.Err()
}

// ---- Service ----

type Service struct {
	repo       *Repository
	schoolRepo *target_schools.Repository
}

func NewService(repo *Repository, schoolRepo *target_schools.Repository) *Service {
	return &Service{repo: repo, schoolRepo: schoolRepo}
}

// targetTypeFromGrade maps a student's education level to the next target type.
func targetTypeFromGrade(levelCode string) string {
	switch strings.ToUpper(strings.TrimSpace(levelCode)) {
	case "SD":
		return "SMP"
	case "SMP":
		return "SMA"
	default:
		return "UNIVERSITY"
	}
}

// motivationalState derives the motivating state for a target.
func motivationalState(hasData bool, score, minScore int) (state, motivational string) {
	if !hasData {
		return "PENDING", "Belum ada nilai tryout"
	}
	if score >= minScore {
		return "PASSED", "Nilai kamu di atas ambang sekolah"
	}
	return "BELOW", fmt.Sprintf("Kurang %d poin lagi untuk lolos ambang", minScore-score)
}

// ResolveStudentScore computes the student's current score against a school.
// UNIVERSITY -> IRT (best certificate percent * 10). SMP/SMA -> sum of
// best-per-subject tryout scores driven by school.Subjects / MaxTotalScore.
func (s *Service) ResolveStudentScore(ctx context.Context, userID uuid.UUID, school *target_schools.TargetSchool) (score int, progress float64, hasData bool, err error) {
	if school == nil {
		return 0, 0, false, nil
	}
	if school.Level == "UNIVERSITY" {
		best, ok, cerr := s.repo.BestCertificatePct(ctx, userID)
		if cerr != nil {
			return 0, 0, false, cerr
		}
		if !ok {
			return 0, 0, false, nil
		}
		score = int(best * 10)
		max := school.MaxTotalScore
		if max <= 0 {
			max = 700
		}
		if max > 0 {
			progress = float64(score) / float64(max) * 100
		}
		return score, progress, true, nil
	}

	total, hasData, cerr := s.repo.SumBestPerSubject(ctx, userID, school.Subjects)
	if cerr != nil {
		return 0, 0, false, cerr
	}
	if !hasData {
		return 0, 0, false, nil
	}
	score = total
	max := school.MaxTotalScore
	if max <= 0 {
		max = 400
	}
	if max > 0 {
		progress = float64(score) / float64(max) * 100
	}
	return score, progress, true, nil
}

func (s *Service) GetEnrichedTargets(ctx context.Context, userID uuid.UUID) ([]EnrichedTarget, error) {
	levelCode, err := s.repo.GetUserLevelCode(ctx, userID)
	if err != nil {
		return nil, err
	}
	targetType := targetTypeFromGrade(levelCode)

	targets, err := s.repo.ListTargets(ctx, userID)
	if err != nil {
		return nil, err
	}
	out := []EnrichedTarget{}
	for _, t := range targets {
		et := EnrichedTarget{
			ID: t.ID, Choice: t.Choice, TargetType: targetType,
			SchoolID: t.SchoolID, SchoolName: t.SchoolName,
			Major: t.Major, PassingScoreIRT: t.PassingScoreIRT,
			Subjects: []string{}, CreatedAt: t.CreatedAt, UpdatedAt: t.UpdatedAt,
		}
		if t.SchoolID != nil {
			school, serr := s.schoolRepo.GetByID(ctx, *t.SchoolID)
			if serr == nil && school != nil {
				et.MinScore = school.MinScore
				et.MaxScore = school.MaxScore
				et.MaxTotalScore = school.MaxTotalScore
				et.Subjects = school.Subjects
				if et.SchoolName == "" {
					et.SchoolName = school.Name
				}
				score, progress, hasData, serr2 := s.ResolveStudentScore(ctx, userID, school)
				if serr2 == nil {
					et.StudentScore = score
					et.ProgressPct = progress
					et.HasScoreData = hasData
					min := 0
					if school.MinScore != nil {
						min = *school.MinScore
					}
					et.ThresholdState, et.Motivational = motivationalState(hasData, score, min)
				}
			}
		} else {
			et.ThresholdState, et.Motivational = motivationalState(false, 0, 0)
		}
		out = append(out, et)
	}
	return out, nil
}

func (s *Service) GetTargets(ctx context.Context, userID uuid.UUID) ([]StudentTarget, error) {
	return s.repo.ListTargets(ctx, userID)
}

func (s *Service) SaveTargets(ctx context.Context, userID uuid.UUID, req SaveTargetsRequest) ([]StudentTarget, error) {
	if len(req.Targets) == 0 {
		return nil, fiber.NewError(fiber.StatusBadRequest, "targets required")
	}
	for _, t := range req.Targets {
		if strings.TrimSpace(t.SchoolName) == "" && strings.TrimSpace(t.TargetSchoolID) == "" {
			return nil, fiber.NewError(fiber.StatusBadRequest, "school_name or target_school_id required for each target")
		}
	}
	return s.repo.UpsertTargets(ctx, userID, req.Targets)
}

func (s *Service) GetCertificates(ctx context.Context, userID uuid.UUID) ([]Certificate, error) {
	return s.repo.ListCertificates(ctx, userID)
}

func (s *Service) RenderCertificateHTML(cert Certificate, studentName string) (string, error) {
	scoreLine := fmt.Sprintf("%.1f%%", cert.Pct)
	tpl := `<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8">
<title>{{.Title}} — Sertifikat</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: Georgia, 'Times New Roman', serif; }
  .certificate { width: 794px; min-height: 1123px; margin: 0 auto; padding: 48px;
    border: 12px double #b7791f; background: #fffdf7; position: relative; }
  .certificate::before { content: ''; position: absolute; inset: 24px;
    border: 1px solid #e5d9c5; }
  .brand { text-align: center; font-size: 13px; letter-spacing: 6px;
    color: #b7791f; text-transform: uppercase; margin-bottom: 28px; }
  h1 { text-align: center; font-size: 38px; color: #1a365d; margin: 18px 0 6px; }
  .subtitle { text-align: center; font-size: 15px; color: #4a5568; margin-bottom: 36px; }
  .name { text-align: center; font-size: 30px; color: #1a365d;
    border-bottom: 2px solid #b7791f; display: inline-block; padding: 0 36px 6px;
    margin: 20px 0; }
  .wrap { text-align: center; }
  .desc { text-align: center; font-size: 15px; color: #4a5568; line-height: 1.8;
    max-width: 520px; margin: 24px auto; }
  .meta { text-align: center; margin-top: 40px; }
  .meta table { margin: 0 auto; border-collapse: collapse; }
  .meta td { padding: 6px 18px; font-size: 14px; }
  .meta .label { color: #718096; }
  .meta .value { color: #1a365d; font-weight: bold; }
  .footer { position: absolute; bottom: 40px; left: 0; right: 0; text-align: center;
    font-size: 11px; color: #a0aec0; letter-spacing: 2px; }
  @media print {
    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .certificate { border: 12px double #b7791f; }
  }
</style>
</head>
<body>
  <div class="certificate">
    <div class="brand">Yakinlulus.id</div>
    <h1>SERTIFIKAT PENCAPAIAN</h1>
    <div class="subtitle">Diberikan kepada</div>
    <div class="wrap"><span class="name">{{.StudentName}}</span></div>
    <p class="desc">
      Telah menyelesaikan tryout <strong>{{.Title}}</strong> pada
      tanggal {{.Date}} dengan skor {{.ScoreLine}} dan berada pada peringkat
      <strong>{{.Rank}} dari {{.Total}}</strong> peserta.
    </p>
    <div class="meta">
      <table>
        <tr><td class="label">Peringkat</td><td class="value">#{{.Rank}} dari {{.Total}}</td></tr>
        <tr><td class="label">Skor</td><td class="value">{{.ScoreLine}}</td></tr>
        <tr><td class="label">Tanggal</td><td class="value">{{.Date}}</td></tr>
      </table>
    </div>
    <div class="footer">YAKINLULUS.ID — SERTIFIKAT INI DITERBITKAN OTOMATIS</div>
  </div>
</body>
</html>`

	data := struct {
		StudentName string
		Title       string
		ScoreLine   string
		Rank        int
		Total       int
		Date        string
	}{
		StudentName: studentName,
		Title:       cert.Title,
		ScoreLine:   scoreLine,
		Rank:        cert.Rank,
		Total:       cert.Total,
		Date:        cert.Date.Format("02 January 2006"),
	}
	t, err := template.New("certificate").Parse(tpl)
	if err != nil {
		return "", err
	}
	var sb strings.Builder
	if err := t.Execute(&sb, data); err != nil {
		return "", err
	}
	return sb.String(), nil
}

// ---- Handler ----

type Handler struct {
	svc  *Service
	auth string
}

func NewHandler(svc *Service, jwtSecret string) *Handler {
	return &Handler{svc: svc, auth: jwtSecret}
}

func (h *Handler) RegisterRoutes(router fiber.Router) {
	authM := middleware.RequireAuth(h.auth)
	r := router.Group("/profile", authM)
	r.Get("/targets", h.GetTargets)
	r.Put("/targets", h.SaveTargets)
	r.Get("/certificates", h.GetCertificates)
	r.Get("/certificates/:id/download", h.DownloadCertificate)
}

func (h *Handler) currentUser(c *fiber.Ctx) (uuid.UUID, error) {
	uid, ok := c.Locals("user_id").(string)
	if !ok {
		return uuid.Nil, fiber.NewError(fiber.StatusUnauthorized, "Not authenticated")
	}
	return uuid.Parse(uid)
}

func (h *Handler) GetTargets(c *fiber.Ctx) error {
	userID, err := h.currentUser(c)
	if err != nil {
		return c.Status(401).JSON(shared.Error(shared.ErrUnauthorized, "Not authenticated"))
	}
	targets, err := h.svc.GetEnrichedTargets(c.Context(), userID)
	if err != nil {
		return c.Status(500).JSON(shared.Error(shared.ErrInternal, "Failed to list targets"))
	}
	if targets == nil {
		targets = []EnrichedTarget{}
	}
	return c.JSON(shared.Success(targets))
}

func (h *Handler) SaveTargets(c *fiber.Ctx) error {
	userID, err := h.currentUser(c)
	if err != nil {
		return c.Status(401).JSON(shared.Error(shared.ErrUnauthorized, "Not authenticated"))
	}
	var req SaveTargetsRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(shared.Error(shared.ErrValidation, "Invalid request body"))
	}
	if len(req.Targets) == 0 {
		return c.Status(400).JSON(shared.Error(shared.ErrValidation, "targets required"))
	}
	for _, t := range req.Targets {
		if strings.TrimSpace(t.SchoolName) == "" && strings.TrimSpace(t.TargetSchoolID) == "" {
			return c.Status(400).JSON(shared.Error(shared.ErrValidation, "school_name or target_school_id required for each target"))
		}
	}
	if _, err := h.svc.SaveTargets(c.Context(), userID, req); err != nil {
		if e, ok := err.(*fiber.Error); ok {
			return c.Status(e.Code).JSON(shared.Error(shared.ErrorCode(e.Message), e.Message))
		}
		return c.Status(500).JSON(shared.Error(shared.ErrInternal, "Failed to save targets"))
	}
	enriched, err := h.svc.GetEnrichedTargets(c.Context(), userID)
	if err != nil {
		return c.Status(500).JSON(shared.Error(shared.ErrInternal, "Failed to load targets"))
	}
	return c.JSON(shared.Success(enriched))
}

func (h *Handler) GetCertificates(c *fiber.Ctx) error {
	userID, err := h.currentUser(c)
	if err != nil {
		return c.Status(401).JSON(shared.Error(shared.ErrUnauthorized, "Not authenticated"))
	}
	certs, err := h.svc.GetCertificates(c.Context(), userID)
	if err != nil {
		return c.Status(500).JSON(shared.Error(shared.ErrInternal, "Failed to list certificates"))
	}
	return c.JSON(shared.Success(certs))
}

func (h *Handler) DownloadCertificate(c *fiber.Ctx) error {
	userID, err := h.currentUser(c)
	if err != nil {
		return c.Status(401).JSON(shared.Error(shared.ErrUnauthorized, "Not authenticated"))
	}
	certID, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(400).JSON(shared.Error(shared.ErrValidation, "Invalid certificate ID"))
	}

	cert, err := h.findCert(c.Context(), userID, certID)
	if err != nil {
		if err == pgx.ErrNoRows {
			return c.Status(404).JSON(shared.Error(shared.ErrNotFound, "Certificate not found"))
		}
		return c.Status(500).JSON(shared.Error(shared.ErrInternal, "Failed to load certificate"))
	}

	name, err := h.studentName(c.Context(), userID)
	if err != nil {
		name = "Siswa"
	}
	html, err := h.svc.RenderCertificateHTML(*cert, name)
	if err != nil {
		return c.Status(500).JSON(shared.Error(shared.ErrInternal, "Failed to render certificate"))
	}

	c.Set("Content-Type", "text/html; charset=utf-8")
	c.Set("Content-Disposition", fmt.Sprintf(`inline; filename="sertifikat-%s.html"`, cert.Title))
	return c.SendString(html)
}

func (h *Handler) findCert(ctx context.Context, userID, certID uuid.UUID) (*Certificate, error) {
	cert := &Certificate{}
	err := h.svc.repo.pool.QueryRow(ctx,
		`SELECT a.id, COALESCE(c.title, 'Tryout'), a.exam_content_id,
		   COALESCE(a.total_score, 0), COALESCE(a.max_score, 0),
		   CASE WHEN COALESCE(a.max_score, 0) > 0
		        THEN ROUND(COALESCE(a.total_score, 0) / a.max_score * 100, 1) ELSE 0 END,
		   COALESCE(a.submitted_at, a.created_at),
		   (SELECT COUNT(*) FROM content_exam_attempts x
		     WHERE x.exam_content_id = a.exam_content_id
		       AND x.status = 'SUBMITTED'
		       AND COALESCE(x.total_score, 0) > COALESCE(a.total_score, 0)) + 1,
		   (SELECT COUNT(*) FROM content_exam_attempts x
		     WHERE x.exam_content_id = a.exam_content_id
		       AND x.status = 'SUBMITTED')
		 FROM content_exam_attempts a
		 LEFT JOIN contents c ON c.id = a.exam_content_id
		 WHERE a.id = $1 AND a.user_id = $2 AND a.status = 'SUBMITTED'`,
		certID, userID,
	).Scan(&cert.ID, &cert.Title, &cert.ExamID, &cert.Score, &cert.MaxScore, &cert.Pct, &cert.Date, &cert.Rank, &cert.Total)
	return cert, err
}

func (h *Handler) studentName(ctx context.Context, userID uuid.UUID) (string, error) {
	var name string
	err := h.svc.repo.pool.QueryRow(ctx,
		`SELECT full_name FROM users WHERE id = $1`, userID).Scan(&name)
	return name, err
}
