package notification

import (
	"context"
	"fmt"
	"net/http"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"yakinlulus.id/backend/internal/middleware"
	"yakinlulus.id/backend/internal/shared"
)

// --- Models ---

type Notification struct {
	ID            uuid.UUID  `json:"id"`
	UserID        uuid.UUID  `json:"user_id"`
	Title         string     `json:"title"`
	Body          string     `json:"body"`
	Channel       string     `json:"channel"`
	Status        string     `json:"status"`
	ReferenceType *string    `json:"reference_type,omitempty"`
	ReferenceID   *uuid.UUID `json:"reference_id,omitempty"`
	CreatedAt     time.Time  `json:"created_at"`
	DeliveredAt   *time.Time `json:"delivered_at,omitempty"`
	ReadAt        *time.Time `json:"read_at,omitempty"`
	ArchivedAt    *time.Time `json:"archived_at,omitempty"`
}

type NotificationTemplate struct {
	ID      uuid.UUID `json:"id"`
	Code    string    `json:"code"`
	Name    string    `json:"name"`
	Subject *string   `json:"subject,omitempty"`
	Body    string    `json:"body"`
	Channel string    `json:"channel"`
}

type NotificationPreference struct {
	ID      uuid.UUID `json:"id"`
	UserID  uuid.UUID `json:"user_id"`
	Channel string    `json:"channel"`
	Enabled bool      `json:"enabled"`
}

// --- Repository ---

type Repository struct {
	pool *pgxpool.Pool
}

func NewRepository(pool *pgxpool.Pool) *Repository {
	return &Repository{pool: pool}
}

func (r *Repository) Create(ctx context.Context, n *Notification) error {
	n.ID = uuid.New()
	return r.pool.QueryRow(ctx,
		`INSERT INTO notification.user_notification (id, user_id, title, body, channel, status, reference_type, reference_id, is_read)
		 VALUES ($1,$2,$3,$4,$5,$6,$7,$8,false)
		 RETURNING created_at`,
		n.ID, n.UserID, n.Title, n.Body, n.Channel, n.Status, n.ReferenceType, n.ReferenceID,
	).Scan(&n.CreatedAt)
}

func (r *Repository) FindByUser(ctx context.Context, userID uuid.UUID, limit, offset int) ([]Notification, int, error) {
	var total int
	err := r.pool.QueryRow(ctx,
		`SELECT COUNT(*) FROM notification.user_notification WHERE user_id=$1 AND archived_at IS NULL`, userID).Scan(&total)
	if err != nil {
		return nil, 0, err
	}
	rows, err := r.pool.Query(ctx,
		`SELECT id, user_id, title, body, channel, status, reference_type, reference_id,
		 created_at, delivered_at, read_at, archived_at
		 FROM notification.user_notification WHERE user_id=$1 AND archived_at IS NULL
		 ORDER BY created_at DESC LIMIT $2 OFFSET $3`, userID, limit, offset)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()
	var notifs []Notification
	for rows.Next() {
		var n Notification
		if err := rows.Scan(&n.ID, &n.UserID, &n.Title, &n.Body, &n.Channel, &n.Status,
			&n.ReferenceType, &n.ReferenceID, &n.CreatedAt, &n.DeliveredAt, &n.ReadAt, &n.ArchivedAt); err != nil {
			return nil, 0, err
		}
		notifs = append(notifs, n)
	}
	return notifs, total, nil
}

func (r *Repository) MarkRead(ctx context.Context, id uuid.UUID, userID uuid.UUID) error {
	now := time.Now()
	_, err := r.pool.Exec(ctx,
		`UPDATE notification.user_notification SET is_read=true, read_at=$1 WHERE id=$2 AND user_id=$3`,
		now, id, userID)
	return err
}

func (r *Repository) Archive(ctx context.Context, id uuid.UUID, userID uuid.UUID) error {
	now := time.Now()
	_, err := r.pool.Exec(ctx,
		`UPDATE notification.user_notification SET archived_at=$1 WHERE id=$2 AND user_id=$3`,
		now, id, userID)
	return err
}

func (r *Repository) MarkAllRead(ctx context.Context, userID uuid.UUID) error {
	now := time.Now()
	_, err := r.pool.Exec(ctx,
		`UPDATE notification.user_notification SET is_read=true, read_at=$1 WHERE user_id=$2 AND is_read=false`,
		now, userID)
	return err
}

func (r *Repository) GetUnreadCount(ctx context.Context, userID uuid.UUID) (int, error) {
	var n int
	err := r.pool.QueryRow(ctx,
		`SELECT COUNT(*) FROM notification.user_notification WHERE user_id=$1 AND is_read=false AND archived_at IS NULL`,
		userID).Scan(&n)
	return n, err
}

func (r *Repository) FindByID(ctx context.Context, id uuid.UUID) (*Notification, error) {
	n := &Notification{}
	err := r.pool.QueryRow(ctx,
		`SELECT id, user_id, title, body, channel, status, reference_type, reference_id,
		 created_at, delivered_at, read_at, archived_at
		 FROM notification.user_notification WHERE id=$1`, id).Scan(&n.ID, &n.UserID, &n.Title, &n.Body, &n.Channel, &n.Status,
		&n.ReferenceType, &n.ReferenceID, &n.CreatedAt, &n.DeliveredAt, &n.ReadAt, &n.ArchivedAt)
	if err != nil {
		if err == pgx.ErrNoRows {
			return nil, nil
		}
		return nil, err
	}
	return n, nil
}

func (r *Repository) Delete(ctx context.Context, id uuid.UUID, userID uuid.UUID) error {
	_, err := r.pool.Exec(ctx, `DELETE FROM notification.user_notification WHERE id=$1 AND user_id=$2`, id, userID)
	return err
}

func (r *Repository) Broadcast(ctx context.Context, userIDs []uuid.UUID, title, body, channel string) error {
	if len(userIDs) == 0 {
		return nil
	}
	tx, err := r.pool.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)

	for _, userID := range userIDs {
		_, err = tx.Exec(ctx,
			`INSERT INTO notification.user_notification (id, user_id, title, body, channel, status, is_read, created_at)
			 VALUES ($1,$2,$3,$4,$5,$6,false,NOW())`,
			uuid.New(), userID, title, body, channel, "PENDING")
		if err != nil {
			return err
		}
	}
	return tx.Commit(ctx)
}

var prefChannelCol = map[string]string{
	"EMAIL":     "allow_email",
	"PUSH":      "allow_push",
	"SMS":       "allow_sms",
	"WHATSAPP":  "allow_whatsapp",
	"IN_APP":    "allow_in_app",
	"MARKETING": "allow_marketing",
	"EXAM":      "allow_exam",
	"PAYMENT":   "allow_payment",
	"LEARNING":  "allow_learning",
	"AI":        "allow_ai",
	"SYSTEM":    "allow_system",
}

func (r *Repository) GetPreferences(ctx context.Context, userID uuid.UUID) ([]NotificationPreference, error) {
	var id uuid.UUID
	var email, push, sms, whatsapp, inApp bool
	var marketing, exam, payment, learning, ai, system bool
	err := r.pool.QueryRow(ctx,
		`SELECT id, allow_email, allow_push, allow_sms, allow_whatsapp, allow_in_app,
		 allow_marketing, allow_exam, allow_payment, allow_learning, allow_ai, allow_system
		 FROM notification.notification_preferences WHERE user_id=$1`, userID,
	).Scan(&id, &email, &push, &sms, &whatsapp, &inApp,
		&marketing, &exam, &payment, &learning, &ai, &system)
	if err != nil {
		if err == pgx.ErrNoRows {
			return []NotificationPreference{}, nil
		}
		return nil, err
	}
	return []NotificationPreference{
		{ID: id, UserID: userID, Channel: "EMAIL", Enabled: email},
		{ID: id, UserID: userID, Channel: "PUSH", Enabled: push},
		{ID: id, UserID: userID, Channel: "WHATSAPP", Enabled: whatsapp},
		{ID: id, UserID: userID, Channel: "SMS", Enabled: sms},
		{ID: id, UserID: userID, Channel: "IN_APP", Enabled: inApp},
		{ID: id, UserID: userID, Channel: "MARKETING", Enabled: marketing},
		{ID: id, UserID: userID, Channel: "EXAM", Enabled: exam},
		{ID: id, UserID: userID, Channel: "PAYMENT", Enabled: payment},
		{ID: id, UserID: userID, Channel: "LEARNING", Enabled: learning},
		{ID: id, UserID: userID, Channel: "AI", Enabled: ai},
		{ID: id, UserID: userID, Channel: "SYSTEM", Enabled: system},
	}, nil
}

func (r *Repository) UpsertPreference(ctx context.Context, p *NotificationPreference) error {
	col, ok := prefChannelCol[p.Channel]
	if !ok {
		return fmt.Errorf("unknown notification channel %q", p.Channel)
	}
	query := fmt.Sprintf(
		`INSERT INTO notification.notification_preferences (user_id, %s) VALUES ($1, $2)
		 ON CONFLICT (user_id) DO UPDATE SET %s=EXCLUDED.%s, updated_at=NOW()
		 RETURNING id`,
		col, col, col)
	return r.pool.QueryRow(ctx, query, p.UserID, p.Enabled).Scan(&p.ID)
}

func (r *Repository) GetTemplate(ctx context.Context, code string) (*NotificationTemplate, error) {
	t := &NotificationTemplate{}
	err := r.pool.QueryRow(ctx,
		`SELECT id, code, name, email_subject, body_template, 'EMAIL'::text
		 FROM notification.notification_template
		 WHERE code=$1 AND is_active=true AND language='id'
		 ORDER BY version DESC, created_at DESC LIMIT 1`, code,
	).Scan(&t.ID, &t.Code, &t.Name, &t.Subject, &t.Body, &t.Channel)
	if err != nil && err != pgx.ErrNoRows {
		return nil, err
	}
	return t, nil
}

func (r *Repository) FindTemplateByID(ctx context.Context, id uuid.UUID) (*NotificationTemplate, error) {
	t := &NotificationTemplate{}
	err := r.pool.QueryRow(ctx,
		`SELECT id, code, name, email_subject, body_template, 'EMAIL'::text
		 FROM notification.notification_template WHERE id=$1`, id,
	).Scan(&t.ID, &t.Code, &t.Name, &t.Subject, &t.Body, &t.Channel)
	if err != nil {
		return nil, err
	}
	return t, nil
}

func (r *Repository) CreateTemplate(ctx context.Context, t *NotificationTemplate) error {
	t.ID = uuid.New()
	return r.pool.QueryRow(ctx,
		`INSERT INTO notification.notification_template (id, code, name, category, title_template, body_template, email_subject, language)
		 VALUES ($1,$2,$3,'SYSTEM',$4,$5,$6,'id') RETURNING id`,
		t.ID, t.Code, t.Name, t.Body, t.Body, t.Subject,
	).Scan(&t.ID)
}

func (r *Repository) UpdateTemplate(ctx context.Context, t *NotificationTemplate) error {
	_, err := r.pool.Exec(ctx,
		`UPDATE notification.notification_template SET name=$1, body_template=$2, email_subject=$3, updated_at=NOW() WHERE id=$4`,
		t.Name, t.Body, t.Subject, t.ID)
	return err
}

func (r *Repository) DeleteTemplate(ctx context.Context, id uuid.UUID) error {
	_, err := r.pool.Exec(ctx, `DELETE FROM notification.notification_template WHERE id=$1`, id)
	return err
}

func (r *Repository) ListTemplates(ctx context.Context) ([]NotificationTemplate, error) {
	rows, err := r.pool.Query(ctx,
		`SELECT id, code, name, email_subject, body_template, 'EMAIL'::text
		 FROM notification.notification_template ORDER BY code`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var templates []NotificationTemplate
	for rows.Next() {
		var t NotificationTemplate
		if err := rows.Scan(&t.ID, &t.Code, &t.Name, &t.Subject, &t.Body, &t.Channel); err != nil {
			return nil, err
		}
		templates = append(templates, t)
	}
	return templates, nil
}

// --- Service ---

type Service struct {
	repo *Repository
}

func NewService(repo *Repository) *Service {
	return &Service{repo: repo}
}

func (s *Service) Send(ctx context.Context, n *Notification) error {
	// Check user preference — default enabled unless explicitly disabled
	if n.Channel == "" {
		n.Channel = "in_app"
	}
	if n.Status == "" {
		n.Status = "PENDING"
	}
	return s.repo.Create(ctx, n)
}

func (s *Service) SendToUser(ctx context.Context, userID uuid.UUID, title, body string) error {
	n := &Notification{
		UserID:  userID,
		Title:   title,
		Body:    body,
		Channel: "in_app",
		Status:  "PENDING",
	}
	return s.repo.Create(ctx, n)
}

func (s *Service) SendWithRef(ctx context.Context, userID uuid.UUID, title, body, refType string, refID uuid.UUID) error {
	n := &Notification{
		UserID:        userID,
		Title:         title,
		Body:          body,
		Channel:       "in_app",
		Status:        "PENDING",
		ReferenceType: &refType,
		ReferenceID:   &refID,
	}
	return s.repo.Create(ctx, n)
}

func (s *Service) List(ctx context.Context, userID uuid.UUID, page, limit int) ([]Notification, int, error) {
	return s.repo.FindByUser(ctx, userID, limit, (page-1)*limit)
}

func (s *Service) MarkRead(ctx context.Context, id uuid.UUID, userID uuid.UUID) error {
	return s.repo.MarkRead(ctx, id, userID)
}

func (s *Service) Archive(ctx context.Context, id uuid.UUID, userID uuid.UUID) error {
	return s.repo.Archive(ctx, id, userID)
}

func (s *Service) MarkAllRead(ctx context.Context, userID uuid.UUID) error {
	return s.repo.MarkAllRead(ctx, userID)
}

func (s *Service) UnreadCount(ctx context.Context, userID uuid.UUID) (int, error) {
	return s.repo.GetUnreadCount(ctx, userID)
}

func (s *Service) GetByID(ctx context.Context, id uuid.UUID) (*Notification, error) {
	return s.repo.FindByID(ctx, id)
}

func (s *Service) Delete(ctx context.Context, id uuid.UUID, userID uuid.UUID) error {
	return s.repo.Delete(ctx, id, userID)
}

func (s *Service) Broadcast(ctx context.Context, userIDs []uuid.UUID, title, body string) error {
	for _, uid := range userIDs {
		if err := s.SendToUser(ctx, uid, title, body); err != nil {
			return err
		}
	}
	return nil
}

func (s *Service) GetPreferences(ctx context.Context, userID uuid.UUID) ([]NotificationPreference, error) {
	return s.repo.GetPreferences(ctx, userID)
}

func (s *Service) UpdatePreference(ctx context.Context, userID uuid.UUID, channel string, enabled bool) error {
	p := &NotificationPreference{
		UserID:  userID,
		Channel: channel,
		Enabled: enabled,
	}
	return s.repo.UpsertPreference(ctx, p)
}

func (s *Service) CreateTemplate(ctx context.Context, req CreateTemplateReq) (*NotificationTemplate, error) {
	t := &NotificationTemplate{
		Code:    req.Code,
		Name:    req.Name,
		Subject: req.Subject,
		Body:    req.Body,
		Channel: req.Channel,
	}
	if t.Channel == "" {
		t.Channel = "in_app"
	}
	if err := s.repo.CreateTemplate(ctx, t); err != nil {
		return nil, err
	}
	return t, nil
}

func (s *Service) UpdateTemplate(ctx context.Context, id uuid.UUID, req UpdateTemplateReq) (*NotificationTemplate, error) {
	t, err := s.repo.FindTemplateByID(ctx, id)
	if err != nil {
		return nil, fiber.NewError(404, "Template not found")
	}
	if req.Code != nil {
		t.Code = *req.Code
	}
	if req.Name != nil {
		t.Name = *req.Name
	}
	if req.Subject != nil {
		t.Subject = req.Subject
	}
	if req.Body != nil {
		t.Body = *req.Body
	}
	if req.Channel != nil {
		t.Channel = *req.Channel
	}
	if err := s.repo.UpdateTemplate(ctx, t); err != nil {
		return nil, err
	}
	return t, nil
}

func (s *Service) DeleteTemplate(ctx context.Context, id uuid.UUID) error {
	return s.repo.DeleteTemplate(ctx, id)
}

func (s *Service) ListTemplates(ctx context.Context) ([]NotificationTemplate, error) {
	return s.repo.ListTemplates(ctx)
}

// --- DTOs ---

type CreateTemplateReq struct {
	Code    string  `json:"code"`
	Name    string  `json:"name"`
	Subject *string `json:"subject,omitempty"`
	Body    string  `json:"body"`
	Channel string  `json:"channel"`
}

type UpdateTemplateReq struct {
	Code    *string `json:"code,omitempty"`
	Name    *string `json:"name,omitempty"`
	Subject *string `json:"subject,omitempty"`
	Body    *string `json:"body,omitempty"`
	Channel *string `json:"channel,omitempty"`
}

// --- Handler ---

type Handler struct {
	svc  *Service
	auth string
}

func NewHandler(svc *Service, jwtSecret string) *Handler {
	return &Handler{svc: svc, auth: jwtSecret}
}

func (h *Handler) RegisterRoutes(router fiber.Router) {
	authM := middleware.RequireAuth(h.auth)
	admin := middleware.RequireRole("SUPER_ADMIN", "STAFF")

	r := router.Group("/notifications", authM)
	r.Get("/", h.List)
	r.Get("/unread-count", h.UnreadCount)
	r.Get("/:id", h.GetByID)
	r.Post("/:id/read", h.MarkRead)
	r.Post("/:id/archive", h.Archive)
	r.Delete("/:id", h.Delete)
	r.Post("/read-all", h.MarkAllRead)
	r.Post("/send", admin, h.Send)
	r.Post("/broadcast", admin, h.Broadcast)
	r.Get("/preferences", h.GetPreferences)
	r.Put("/preferences/:channel", h.UpdatePreference)

	// Template CRUD (admin/staff only)
	tr := router.Group("/notification-templates", authM, admin)
	tr.Get("/", h.ListTemplates)
	tr.Post("/", h.CreateTemplate)
	tr.Put("/:id", h.UpdateTemplate)
	tr.Delete("/:id", h.DeleteTemplate)
}

func (h *Handler) List(c *fiber.Ctx) error {
	userID, err := uuid.Parse(c.Locals("user_id").(string))
	if err != nil {
		return c.Status(401).JSON(shared.Error(shared.ErrUnauthorized, "Unauthorized"))
	}
	page, limit := shared.ParsePagination(c)
	notifs, total, err := h.svc.List(c.Context(), userID, page, limit)
	if err != nil {
		return c.Status(500).JSON(shared.Error(shared.ErrInternal, "Failed to list notifications"))
	}
	return c.JSON(shared.SuccessWithMeta(notifs, shared.BuildMeta(page, limit, total)))
}

func (h *Handler) UnreadCount(c *fiber.Ctx) error {
	userID, err := uuid.Parse(c.Locals("user_id").(string))
	if err != nil {
		return c.Status(401).JSON(shared.Error(shared.ErrUnauthorized, "Unauthorized"))
	}
	count, err := h.svc.UnreadCount(c.Context(), userID)
	if err != nil {
		return c.Status(500).JSON(shared.Error(shared.ErrInternal, "Failed to get unread count"))
	}
	return c.JSON(shared.Success(fiber.Map{"unread_count": count}))
}

func (h *Handler) MarkRead(c *fiber.Ctx) error {
	userID, _ := uuid.Parse(c.Locals("user_id").(string))
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(400).JSON(shared.Error(shared.ErrValidation, "Invalid notification ID"))
	}
	if err := h.svc.MarkRead(c.Context(), id, userID); err != nil {
		return c.Status(500).JSON(shared.Error(shared.ErrInternal, "Failed to mark read"))
	}
	return c.JSON(shared.Success(fiber.Map{"status": "read"}))
}

func (h *Handler) Archive(c *fiber.Ctx) error {
	userID, _ := uuid.Parse(c.Locals("user_id").(string))
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(400).JSON(shared.Error(shared.ErrValidation, "Invalid notification ID"))
	}
	if err := h.svc.Archive(c.Context(), id, userID); err != nil {
		return c.Status(500).JSON(shared.Error(shared.ErrInternal, "Failed to archive"))
	}
	return c.SendStatus(http.StatusNoContent)
}

func (h *Handler) MarkAllRead(c *fiber.Ctx) error {
	userID, _ := uuid.Parse(c.Locals("user_id").(string))
	if err := h.svc.MarkAllRead(c.Context(), userID); err != nil {
		return c.Status(500).JSON(shared.Error(shared.ErrInternal, "Failed to mark all read"))
	}
	return c.JSON(shared.Success(fiber.Map{"status": "all_read"}))
}

func (h *Handler) GetByID(c *fiber.Ctx) error {
	userID, _ := uuid.Parse(c.Locals("user_id").(string))
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(400).JSON(shared.Error(shared.ErrValidation, "Invalid notification ID"))
	}
	n, err := h.svc.GetByID(c.Context(), id)
	if err != nil {
		return c.Status(500).JSON(shared.Error(shared.ErrInternal, "Failed to get notification"))
	}
	if n == nil || n.UserID != userID {
		return c.Status(404).JSON(shared.Error(shared.ErrNotFound, "Notification not found"))
	}
	return c.JSON(shared.Success(n))
}

func (h *Handler) Delete(c *fiber.Ctx) error {
	userID, _ := uuid.Parse(c.Locals("user_id").(string))
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(400).JSON(shared.Error(shared.ErrValidation, "Invalid notification ID"))
	}
	if err := h.svc.Delete(c.Context(), id, userID); err != nil {
		return c.Status(500).JSON(shared.Error(shared.ErrInternal, "Failed to delete notification"))
	}
	return c.SendStatus(http.StatusNoContent)
}

type SendNotificationReq struct {
	UserIDs []uuid.UUID `json:"user_ids"`
	Title   string      `json:"title"`
	Body    string      `json:"body"`
	Channel string      `json:"channel,omitempty"`
}

func (h *Handler) Send(c *fiber.Ctx) error {
	var req SendNotificationReq
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(shared.Error(shared.ErrValidation, "Invalid request body"))
	}
	if req.Title == "" || req.Body == "" || len(req.UserIDs) == 0 {
		return c.Status(400).JSON(shared.Error(shared.ErrValidation, "user_ids, title, body required"))
	}
	if req.Channel == "" {
		req.Channel = "in_app"
	}
	for _, uid := range req.UserIDs {
		if err := h.svc.SendToUser(c.Context(), uid, req.Title, req.Body); err != nil {
			return c.Status(500).JSON(shared.Error(shared.ErrInternal, "Failed to send notification"))
		}
	}
	return c.JSON(shared.Success(fiber.Map{"sent": len(req.UserIDs)}))
}

func (h *Handler) Broadcast(c *fiber.Ctx) error {
	var req SendNotificationReq
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(shared.Error(shared.ErrValidation, "Invalid request body"))
	}
	if req.Title == "" || req.Body == "" || len(req.UserIDs) == 0 {
		return c.Status(400).JSON(shared.Error(shared.ErrValidation, "user_ids, title, body required"))
	}
	if req.Channel == "" {
		req.Channel = "in_app"
	}
	if err := h.svc.Broadcast(c.Context(), req.UserIDs, req.Title, req.Body); err != nil {
		return c.Status(500).JSON(shared.Error(shared.ErrInternal, "Failed to broadcast notification"))
	}
	return c.JSON(shared.Success(fiber.Map{"broadcast": len(req.UserIDs)}))
}

func (h *Handler) GetPreferences(c *fiber.Ctx) error {
	userID, _ := uuid.Parse(c.Locals("user_id").(string))
	prefs, err := h.svc.GetPreferences(c.Context(), userID)
	if err != nil {
		return c.Status(500).JSON(shared.Error(shared.ErrInternal, "Failed to get preferences"))
	}
	return c.JSON(shared.Success(prefs))
}

func (h *Handler) UpdatePreference(c *fiber.Ctx) error {
	userID, _ := uuid.Parse(c.Locals("user_id").(string))
	channel := c.Params("channel")
	var req struct {
		Enabled bool `json:"enabled"`
	}
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(shared.Error(shared.ErrValidation, "Invalid request body"))
	}
	if err := h.svc.UpdatePreference(c.Context(), userID, channel, req.Enabled); err != nil {
		return c.Status(500).JSON(shared.Error(shared.ErrInternal, "Failed to update preference"))
	}
	return c.JSON(shared.Success(fiber.Map{"channel": channel, "enabled": req.Enabled}))
}

// --- Template Handlers ---

func (h *Handler) ListTemplates(c *fiber.Ctx) error {
	templates, err := h.svc.ListTemplates(c.Context())
	if err != nil {
		return c.Status(500).JSON(shared.Error(shared.ErrInternal, "Failed to list templates"))
	}
	if templates == nil {
		templates = []NotificationTemplate{}
	}
	return c.JSON(shared.Success(templates))
}

func (h *Handler) CreateTemplate(c *fiber.Ctx) error {
	var req CreateTemplateReq
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(shared.Error(shared.ErrValidation, "Invalid request body"))
	}
	if req.Code == "" || req.Name == "" || req.Body == "" {
		return c.Status(400).JSON(shared.Error(shared.ErrValidation, "code, name, body required"))
	}
	t, err := h.svc.CreateTemplate(c.Context(), req)
	if err != nil {
		return c.Status(500).JSON(shared.Error(shared.ErrInternal, "Failed to create template"))
	}
	return c.Status(201).JSON(shared.Success(t))
}

func (h *Handler) UpdateTemplate(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(400).JSON(shared.Error(shared.ErrValidation, "Invalid template ID"))
	}
	var req UpdateTemplateReq
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(shared.Error(shared.ErrValidation, "Invalid request body"))
	}
	t, err := h.svc.UpdateTemplate(c.Context(), id, req)
	if err != nil {
		if fe, ok := err.(*fiber.Error); ok {
			return c.Status(fe.Code).JSON(shared.Error(shared.ErrorCode(fe.Message), fe.Message))
		}
		return c.Status(500).JSON(shared.Error(shared.ErrInternal, "Failed to update template"))
	}
	return c.JSON(shared.Success(t))
}

func (h *Handler) DeleteTemplate(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(400).JSON(shared.Error(shared.ErrValidation, "Invalid template ID"))
	}
	if err := h.svc.DeleteTemplate(c.Context(), id); err != nil {
		return c.Status(500).JSON(shared.Error(shared.ErrInternal, "Failed to delete template"))
	}
	return c.SendStatus(http.StatusNoContent)
}
