package ai

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"

	"yakinlulus.id/backend/internal/middleware"
	"yakinlulus.id/backend/internal/shared"
)

// --- DTOs ---

type ChatReq struct {
	ConversationID string `json:"conversation_id"`
	Message        string `json:"message"`
}

type ChatResp struct {
	ConversationID string `json:"conversation_id"`
	Reply          string `json:"reply"`
	Model          string `json:"model"`
}

type ConvListItem struct {
	ID           uuid.UUID `json:"id"`
	Title        string    `json:"title"`
	UpdatedAt    time.Time `json:"updated_at"`
	MessageCount int       `json:"message_count"`
}

type ConvDetail struct {
	ID       uuid.UUID `json:"id"`
	Title    string    `json:"title"`
	Messages []MsgItem `json:"messages"`
}

type MsgItem struct {
	Role      string    `json:"role"`
	Content   string    `json:"content"`
	CreatedAt time.Time `json:"created_at"`
}

type GenQuestionReq struct {
	Prompt     string `json:"prompt"`
	Difficulty string `json:"difficulty"`
	SubjectID  string `json:"subject_id"`
}

type ParsedOption struct {
	Label      string `json:"label"`
	OptionText string `json:"option_text"`
	IsCorrect  bool   `json:"is_correct"`
}

type ParsedQuestion struct {
	QuestionType string         `json:"question_type"`
	Content      string         `json:"content"`
	Difficulty   string         `json:"difficulty"`
	BloomLevel   string         `json:"bloom_level"`
	Source       string         `json:"source"`
	HasImage     bool           `json:"has_image"`
	Options      []ParsedOption `json:"options"`
	Explanation  string         `json:"explanation"`
}

type ParseQuestionsReq struct {
	ImageBase64 string `json:"image_base64"`
	Prompt      string `json:"prompt,omitempty"`
	Source      string `json:"source,omitempty"`
	SubjectID   string `json:"subject_id,omitempty"`
}

// --- OpenAI types ---

type ChatMessage struct {
	Role    string `json:"role"`
	Content string `json:"content"`
}

type ChatRequest struct {
	Model       string        `json:"model"`
	Messages    []ChatMessage `json:"messages"`
	Temperature float64       `json:"temperature,omitempty"`
}

type ChatChoice struct {
	Message ChatMessage `json:"message"`
}

type ChatResponse struct {
	Choices []ChatChoice `json:"choices"`
	Model   string       `json:"model"`
}

// --- Repository ---

type Repository struct {
	pool *pgxpool.Pool
}

func NewRepository(pool *pgxpool.Pool) *Repository {
	return &Repository{pool: pool}
}

func (r *Repository) getSetting(ctx context.Context, key string) (string, error) {
	var val string
	err := r.pool.QueryRow(ctx, `SELECT value FROM system_settings WHERE key = $1`, key).Scan(&val)
	return val, err
}

func (r *Repository) setSetting(ctx context.Context, key, val, desc string) error {
	_, err := r.pool.Exec(ctx,
		`INSERT INTO system_settings (key, value, description, updated_at)
		 VALUES ($1, $2, $3, NOW())
		 ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()`,
		key, val, desc)
	return err
}

func (r *Repository) createConversation(ctx context.Context, userID uuid.UUID, title string) (uuid.UUID, error) {
	var id uuid.UUID
	err := r.pool.QueryRow(ctx,
		`INSERT INTO ai_conversations (user_id, title) VALUES ($1, $2) RETURNING id`,
		userID, title).Scan(&id)
	return id, err
}

func (r *Repository) getConversation(ctx context.Context, convID uuid.UUID, userID uuid.UUID) (*ConvDetail, error) {
	c := &ConvDetail{}
	err := r.pool.QueryRow(ctx,
		`SELECT id, title FROM ai_conversations WHERE id=$1 AND user_id=$2`, convID, userID).
		Scan(&c.ID, &c.Title)
	if err != nil {
		return nil, err
	}

	rows, err := r.pool.Query(ctx,
		`SELECT role, content, created_at FROM ai_messages WHERE conversation_id=$1 ORDER BY created_at`, convID)
	if err != nil {
		return c, nil
	}
	defer rows.Close()
	for rows.Next() {
		var m MsgItem
		if err := rows.Scan(&m.Role, &m.Content, &m.CreatedAt); err != nil {
			continue
		}
		c.Messages = append(c.Messages, m)
	}
	return c, nil
}

func (r *Repository) insertMessage(ctx context.Context, convID uuid.UUID, role, content string) error {
	_, err := r.pool.Exec(ctx,
		`INSERT INTO ai_messages (conversation_id, role, content) VALUES ($1, $2, $3)`,
		convID, role, content)
	if err != nil {
		return err
	}
	_, err = r.pool.Exec(ctx,
		`UPDATE ai_conversations SET updated_at=NOW() WHERE id=$1`, convID)
	return err
}

func (r *Repository) getLastMessages(ctx context.Context, convID uuid.UUID, limit int) ([]ChatMessage, error) {
	rows, err := r.pool.Query(ctx,
		`SELECT role, content FROM ai_messages WHERE conversation_id=$1 ORDER BY created_at DESC LIMIT $2`,
		convID, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var msgs []ChatMessage
	for rows.Next() {
		var m ChatMessage
		if err := rows.Scan(&m.Role, &m.Content); err != nil {
			continue
		}
		msgs = append(msgs, m)
	}
	// Reverse to get chronological order
	for i, j := 0, len(msgs)-1; i < j; i, j = i+1, j-1 {
		msgs[i], msgs[j] = msgs[j], msgs[i]
	}
	return msgs, nil
}

func (r *Repository) listConversations(ctx context.Context, userID uuid.UUID) ([]ConvListItem, error) {
	rows, err := r.pool.Query(ctx,
		`SELECT c.id, c.title, c.updated_at,
		        (SELECT COUNT(*) FROM ai_messages WHERE conversation_id=c.id) AS msg_count
		 FROM ai_conversations c WHERE c.user_id=$1
		 ORDER BY c.updated_at DESC`, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var items []ConvListItem
	for rows.Next() {
		var item ConvListItem
		if err := rows.Scan(&item.ID, &item.Title, &item.UpdatedAt, &item.MessageCount); err != nil {
			continue
		}
		items = append(items, item)
	}
	return items, nil
}

func (r *Repository) adminListConversations(ctx context.Context, limit, offset int) ([]ConvListItem, int, error) {
	var total int
	err := r.pool.QueryRow(ctx, `SELECT COUNT(*) FROM ai_conversations`).Scan(&total)
	if err != nil {
		return nil, 0, err
	}
	rows, err := r.pool.Query(ctx,
		`SELECT c.id, c.title, c.updated_at,
		        (SELECT COUNT(*) FROM ai_messages WHERE conversation_id=c.id) AS msg_count
		 FROM ai_conversations c
		 ORDER BY c.updated_at DESC LIMIT $1 OFFSET $2`, limit, offset)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()
	var items []ConvListItem
	for rows.Next() {
		var item ConvListItem
		if err := rows.Scan(&item.ID, &item.Title, &item.UpdatedAt, &item.MessageCount); err != nil {
			continue
		}
		items = append(items, item)
	}
	return items, total, nil
}

func (r *Repository) getStats(ctx context.Context) (fiber.Map, error) {
	var totalConversations, totalMessages, todayConversations, activeUsers int
	r.pool.QueryRow(ctx, `SELECT COUNT(*) FROM ai_conversations`).Scan(&totalConversations)
	r.pool.QueryRow(ctx, `SELECT COUNT(*) FROM ai_messages`).Scan(&totalMessages)
	r.pool.QueryRow(ctx, `SELECT COUNT(*) FROM ai_conversations WHERE created_at >= CURRENT_DATE`).Scan(&todayConversations)
	r.pool.QueryRow(ctx, `SELECT COUNT(DISTINCT user_id) FROM ai_conversations`).Scan(&activeUsers)
	return fiber.Map{
		"total_conversations": totalConversations,
		"total_messages":      totalMessages,
		"today_conversations": todayConversations,
		"active_users":        activeUsers,
	}, nil
}

func (r *Repository) deleteConversation(ctx context.Context, convID, userID uuid.UUID) error {
	tag, err := r.pool.Exec(ctx,
		`DELETE FROM ai_conversations WHERE id=$1 AND user_id=$2`, convID, userID)
	if err != nil {
		return err
	}
	if tag.RowsAffected() == 0 {
		return fiber.NewError(fiber.StatusNotFound, "Conversation not found")
	}
	return nil
}

// --- Service ---

type Service struct {
	repo     *Repository
	endpoint string
	apiKey   string
	model    string
	client   *http.Client
}

func NewService(repo *Repository, endpoint, apiKey, model string) *Service {
	return &Service{
		repo:     repo,
		endpoint: endpoint,
		apiKey:   apiKey,
		model:    model,
		client:   &http.Client{Timeout: 60 * time.Second},
	}
}

const systemPrompt = `Kamu adalah AI Tutor YakinLulus.id, asisten belajar untuk siswa SMA/SMK Indonesia. Jawab pertanyaan dengan bahasa Indonesia yang mudah dipahami. Berikan penjelasan langkah demi langkah. Gunakan format markdown untuk rumus matematika (LaTeX). Bila ditanya di luar pelajaran sekolah, arahkan kembali ke topik belajar.`

func (s *Service) Chat(ctx context.Context, userID uuid.UUID, convID *uuid.UUID, message string) (*ChatResp, error) {
	// Create conversation if new
	if convID == nil {
		title := message
		if len([]rune(title)) > 100 {
			title = string([]rune(title)[:100])
		}
		id, err := s.repo.createConversation(ctx, userID, title)
		if err != nil {
			return nil, err
		}
		convID = &id
	}

	// Insert user message
	if err := s.repo.insertMessage(ctx, *convID, "user", message); err != nil {
		return nil, err
	}

	// Build context from last 10 messages
	history, err := s.repo.getLastMessages(ctx, *convID, 10)
	if err != nil {
		return nil, err
	}

	msgs := []ChatMessage{{Role: "system", Content: systemPrompt}}
	msgs = append(msgs, history...)
	msgs = append(msgs, ChatMessage{Role: "user", Content: message})

	// Call LLM API
	reply, model, err := s.callLLM(ctx, msgs)
	if err != nil {
		return nil, err
	}

	// Insert assistant response
	if err := s.repo.insertMessage(ctx, *convID, "assistant", reply); err != nil {
		return nil, err
	}

	return &ChatResp{
		ConversationID: convID.String(),
		Reply:          reply,
		Model:          model,
	}, nil
}

func (s *Service) GenerateQuestion(ctx context.Context, prompt, difficulty string, subjectID *uuid.UUID) (fiber.Map, error) {
	genPrompt := fmt.Sprintf(`Kamu adalah AI Tutor YakinLulus.id. Berdasarkan prompt berikut, buatlah 1 soal pilihan ganda untuk siswa SMA/SMK Indonesia.

Prompt: %s
Tingkat kesulitan: %s
%s

Kembalikan dalam format JSON (tanpa markdown, tanpa triple backtick):
{
  "question_text": "...",
  "type": "MULTIPLE_CHOICE",
  "difficulty": "%s",
  "options": [
    {"key": "A", "text": "..."},
    {"key": "B", "text": "..."},
    {"key": "C", "text": "..."},
    {"key": "D", "text": "..."}
  ],
  "correct_key": "A",
  "rationalization": "..."
}

Pastikan soal sesuai kurikulum Indonesia. Gunakan LaTeX untuk rumus matematika.`,
		prompt, difficulty, subjectPrompt(subjectID), difficulty)

	msgs := []ChatMessage{
		{Role: "system", Content: "Kamu adalah generator soal untuk siswa SMA/SMK Indonesia. Keluarkan hanya JSON."},
		{Role: "user", Content: genPrompt},
	}

	reply, _, err := s.callLLM(ctx, msgs)
	if err != nil {
		return nil, err
	}

	// Parse JSON response
	var result fiber.Map
	if err := json.Unmarshal([]byte(reply), &result); err != nil {
		// Fallback: return raw text
		return fiber.Map{
			"question_text": reply,
			"type":          "MULTIPLE_CHOICE",
			"difficulty":    difficulty,
		}, nil
	}
	return result, nil
}

func subjectPrompt(subjectID *uuid.UUID) string {
	if subjectID == nil {
		return ""
	}
	return fmt.Sprintf("Subject ID: %s. Gunakan materi yang relevan dengan subject tersebut.", subjectID.String())
}

type AIConfigDTO struct {
	Endpoint     string `json:"endpoint,omitempty"`
	AIEndpoint   string `json:"ai_endpoint,omitempty"`
	APIKey       string `json:"api_key,omitempty"`
	AIAPIKey     string `json:"ai_api_key,omitempty"`
	Model        string `json:"model,omitempty"`
	AIModel      string `json:"ai_model,omitempty"`
	IsConfigured bool   `json:"is_configured"`
}

type TestConnectionReq struct {
	Endpoint string `json:"endpoint"`
	APIKey   string `json:"api_key"`
	Model    string `json:"model"`
}

func (s *Service) GetConfig(ctx context.Context) (*AIConfigDTO, error) {
	endpoint, _ := s.repo.getSetting(ctx, "ai_endpoint")
	apiKey, _ := s.repo.getSetting(ctx, "ai_api_key")
	model, _ := s.repo.getSetting(ctx, "ai_model")

	if endpoint == "" {
		endpoint = s.endpoint
	}
	if apiKey == "" {
		apiKey = s.apiKey
	}
	if model == "" {
		model = s.model
	}

	maskedKey := ""
	if apiKey != "" {
		if len(apiKey) > 8 {
			maskedKey = apiKey[:4] + "..." + apiKey[len(apiKey)-4:]
		} else {
			maskedKey = "****"
		}
	}

	return &AIConfigDTO{
		Endpoint:     endpoint,
		AIEndpoint:   endpoint,
		APIKey:       maskedKey,
		AIAPIKey:     maskedKey,
		Model:        model,
		AIModel:      model,
		IsConfigured: apiKey != "",
	}, nil
}

func (s *Service) UpdateConfig(ctx context.Context, req AIConfigDTO) error {
	ep := req.Endpoint
	if ep == "" {
		ep = req.AIEndpoint
	}
	if ep != "" {
		s.endpoint = ep
		_ = s.repo.setSetting(ctx, "ai_endpoint", ep, "AI Provider Endpoint Base URL")
	}

	key := req.APIKey
	if key == "" {
		key = req.AIAPIKey
	}
	if key != "" && !strings.Contains(key, "...") && !strings.Contains(key, "****") {
		s.apiKey = key
		_ = s.repo.setSetting(ctx, "ai_api_key", key, "AI Provider API Key")
	}

	mdl := req.Model
	if mdl == "" {
		mdl = req.AIModel
	}
	if mdl != "" {
		s.model = mdl
		_ = s.repo.setSetting(ctx, "ai_model", mdl, "AI Vision Model ID")
	}
	return nil
}

func normalizeEndpoint(ep string) string {
	ep = strings.TrimSpace(ep)
	ep = strings.Replace(ep, "http://localhost:", "http://127.0.0.1:", 1)
	ep = strings.Replace(ep, "https://localhost:", "https://127.0.0.1:", 1)
	return strings.TrimRight(ep, "/")
}

func (s *Service) TestConnection(ctx context.Context, req TestConnectionReq) error {
	ep := req.Endpoint
	if ep == "" {
		ep, _ = s.repo.getSetting(ctx, "ai_endpoint")
	}
	if ep == "" {
		ep = s.endpoint
	}
	if ep == "" {
		ep = "https://api.openai.com/v1"
	}
	ep = normalizeEndpoint(ep)

	key := req.APIKey
	if key == "" || strings.Contains(key, "...") || strings.Contains(key, "****") {
		key, _ = s.repo.getSetting(ctx, "ai_api_key")
	}
	if key == "" {
		key = s.apiKey
	}
	if key == "" {
		return fmt.Errorf("API Key belum terisi. Silakan masukkan API Key valid.")
	}

	mdl := req.Model
	if mdl == "" {
		mdl, _ = s.repo.getSetting(ctx, "ai_model")
	}
	if mdl == "" {
		mdl = s.model
	}
	if mdl == "" {
		mdl = "gpt-4o-mini"
	}

	url := ep + "/chat/completions"
	body := ChatRequest{
		Model: mdl,
		Messages: []ChatMessage{
			{Role: "user", Content: "Test connection ping"},
		},
	}

	payload, err := json.Marshal(body)
	if err != nil {
		return fmt.Errorf("marshal request: %w", err)
	}

	httpReq, err := http.NewRequestWithContext(ctx, "POST", url, bytes.NewReader(payload))
	if err != nil {
		return fmt.Errorf("create request: %w", err)
	}
	httpReq.Header.Set("Content-Type", "application/json")
	httpReq.Header.Set("Authorization", "Bearer "+key)

	resp, err := s.client.Do(httpReq)
	if err != nil {
		return fmt.Errorf("Gagal terhubung ke endpoint (%s): %w", ep, err)
	}
	defer resp.Body.Close()

	respBody, _ := io.ReadAll(resp.Body)

	if resp.StatusCode != 200 {
		return fmt.Errorf("HTTP %d: %s", resp.StatusCode, string(respBody))
	}

	return nil
}

func (s *Service) callLLM(ctx context.Context, msgs []ChatMessage) (reply, model string, err error) {
	if dbEndpoint, err := s.repo.getSetting(ctx, "ai_endpoint"); err == nil && dbEndpoint != "" {
		s.endpoint = dbEndpoint
	}
	if dbKey, err := s.repo.getSetting(ctx, "ai_api_key"); err == nil && dbKey != "" {
		s.apiKey = dbKey
	}
	if dbModel, err := s.repo.getSetting(ctx, "ai_model"); err == nil && dbModel != "" {
		s.model = dbModel
	}

	endpoint := s.endpoint
	if endpoint == "" {
		endpoint = "https://api.openai.com/v1"
	}
	endpoint = normalizeEndpoint(endpoint)
	url := endpoint + "/chat/completions"

	if s.apiKey == "" {
		return "", "", fmt.Errorf("AI API key tidak dikonfigurasi. Silakan atur AI API Key di Pengaturan Sistem Admin.")
	}

	body := ChatRequest{
		Model:    s.model,
		Messages: msgs,
	}
	if s.model == "" {
		body.Model = "gpt-4o-mini"
	}

	payload, err := json.Marshal(body)
	if err != nil {
		return "", "", fmt.Errorf("marshal request: %w", err)
	}

	req, err := http.NewRequestWithContext(ctx, "POST", url, bytes.NewReader(payload))
	if err != nil {
		return "", "", fmt.Errorf("create request: %w", err)
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+s.apiKey)

	resp, err := s.client.Do(req)
	if err != nil {
		return "", "", fmt.Errorf("api call: %w", err)
	}
	defer resp.Body.Close()

	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", "", fmt.Errorf("read response: %w", err)
	}

	if resp.StatusCode != 200 {
		return "", "", fmt.Errorf("API error %d: %s", resp.StatusCode, string(respBody))
	}

	var chatResp ChatResponse
	if err := json.Unmarshal(respBody, &chatResp); err != nil {
		return "", "", fmt.Errorf("parse response: %w", err)
	}

	if len(chatResp.Choices) == 0 {
		return "", "", fmt.Errorf("no choices in response")
	}

	model = chatResp.Model
	if model == "" {
		model = s.model
	}
	return chatResp.Choices[0].Message.Content, model, nil
}

func (s *Service) ListConversations(ctx context.Context, userID uuid.UUID) ([]ConvListItem, error) {
	return s.repo.listConversations(ctx, userID)
}

func (s *Service) GetConversation(ctx context.Context, convID, userID uuid.UUID) (*ConvDetail, error) {
	return s.repo.getConversation(ctx, convID, userID)
}

func (s *Service) DeleteConversation(ctx context.Context, convID, userID uuid.UUID) error {
	return s.repo.deleteConversation(ctx, convID, userID)
}

func (s *Service) AdminListConversations(ctx context.Context, limit, offset int) ([]ConvListItem, int, error) {
	return s.repo.adminListConversations(ctx, limit, offset)
}

func (s *Service) GetStats(ctx context.Context) (fiber.Map, error) {
	return s.repo.getStats(ctx)
}

// --- Handler ---

type Handler struct {
	svc  *Service
	role string
}

func NewHandler(svc *Service, jwtSecret string) *Handler {
	return &Handler{svc: svc, role: jwtSecret}
}

func (h *Handler) TutorChat(c *fiber.Ctx) error {
	var req ChatReq
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(shared.Error(shared.ErrValidation, "Invalid request body"))
	}
	if req.Message == "" {
		return c.Status(400).JSON(shared.Error(shared.ErrValidation, "Message is required"))
	}
	userID := uuid.MustParse(c.Locals("user_id").(string))

	var convID *uuid.UUID
	if req.ConversationID != "" {
		id, err := uuid.Parse(req.ConversationID)
		if err != nil {
			return c.Status(400).JSON(shared.Error(shared.ErrValidation, "Invalid conversation_id"))
		}
		convID = &id
	}

	resp, err := h.svc.Chat(c.Context(), userID, convID, req.Message)
	if err != nil {
		return c.Status(500).JSON(shared.Error(shared.ErrInternal, "AI chat failed: "+err.Error()))
	}
	return c.JSON(shared.Success(resp))
}

func (h *Handler) GenerateQuestion(c *fiber.Ctx) error {
	var req GenQuestionReq
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(shared.Error(shared.ErrValidation, "Invalid request body"))
	}
	if req.Prompt == "" {
		return c.Status(400).JSON(shared.Error(shared.ErrValidation, "Prompt is required"))
	}

	diff := req.Difficulty
	if diff == "" {
		diff = "MEDIUM"
	}

	var subjectID *uuid.UUID
	if req.SubjectID != "" {
		id, err := uuid.Parse(req.SubjectID)
		if err != nil {
			return c.Status(400).JSON(shared.Error(shared.ErrValidation, "Invalid subject_id"))
		}
		subjectID = &id
	}

	result, err := h.svc.GenerateQuestion(c.Context(), req.Prompt, diff, subjectID)
	if err != nil {
		return c.Status(500).JSON(shared.Error(shared.ErrInternal, "Failed to generate question: "+err.Error()))
	}
	return c.JSON(shared.Success(result))
}

func (h *Handler) ListConversations(c *fiber.Ctx) error {
	userID := uuid.MustParse(c.Locals("user_id").(string))
	items, err := h.svc.ListConversations(c.Context(), userID)
	if err != nil {
		return c.Status(500).JSON(shared.Error(shared.ErrInternal, "Failed to list conversations"))
	}
	return c.JSON(shared.Success(items))
}

func (h *Handler) GetConversation(c *fiber.Ctx) error {
	convID, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(400).JSON(shared.Error(shared.ErrValidation, "Invalid conversation ID"))
	}
	userID := uuid.MustParse(c.Locals("user_id").(string))
	conv, err := h.svc.GetConversation(c.Context(), convID, userID)
	if err != nil {
		return c.Status(404).JSON(shared.Error(shared.ErrNotFound, "Conversation not found"))
	}
	return c.JSON(shared.Success(conv))
}

func (h *Handler) DeleteConversation(c *fiber.Ctx) error {
	convID, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(400).JSON(shared.Error(shared.ErrValidation, "Invalid conversation ID"))
	}
	userID := uuid.MustParse(c.Locals("user_id").(string))
	if err := h.svc.DeleteConversation(c.Context(), convID, userID); err != nil {
		if fe, ok := err.(*fiber.Error); ok {
			return c.Status(fe.Code).JSON(shared.Error(shared.ErrorCode(fe.Message), fe.Message))
		}
		return c.Status(500).JSON(shared.Error(shared.ErrInternal, "Failed to delete conversation"))
	}
	return c.JSON(shared.Success(fiber.Map{"deleted": true}))
}

func (h *Handler) AdminListConversations(c *fiber.Ctx) error {
	limit := c.QueryInt("limit", 20)
	offset := c.QueryInt("offset", 0)
	items, total, err := h.svc.AdminListConversations(c.Context(), limit, offset)
	if err != nil {
		return c.Status(500).JSON(shared.Error(shared.ErrInternal, "Failed to list conversations"))
	}
	return c.JSON(shared.Success(fiber.Map{
		"conversations": items,
		"total":         total,
	}))
}

func extractJSONBlock(text string) string {
	text = strings.TrimSpace(text)

	// If wrapped in ```json ... ``` or ``` ... ```
	if idx := strings.Index(text, "```"); idx != -1 {
		endIdx := strings.LastIndex(text, "```")
		if endIdx > idx {
			sub := text[idx+3 : endIdx]
			if strings.HasPrefix(strings.ToLower(strings.TrimSpace(sub)), "json") {
				lines := strings.Split(sub, "\n")
				if len(lines) > 0 && strings.EqualFold(strings.TrimSpace(lines[0]), "json") {
					sub = strings.Join(lines[1:], "\n")
				}
			}
			text = strings.TrimSpace(sub)
		}
	}

	startArr := strings.Index(text, "[")
	startObj := strings.Index(text, "{")

	if startArr != -1 && (startObj == -1 || startArr < startObj) {
		end := strings.LastIndex(text, "]")
		if end > startArr {
			return text[startArr : end+1]
		}
	} else if startObj != -1 {
		end := strings.LastIndex(text, "}")
		if end > startObj {
			return text[startObj : end+1]
		}
	}

	return text
}

func (s *Service) ParseQuestionsFromImage(ctx context.Context, req ParseQuestionsReq) ([]ParsedQuestion, error) {
	visionPrompt := `Anda adalah pakar ekstraksi bank soal CBT EdTech terkemuka. Tugas Anda adalah membaca gambar lembar soal ini dan mengonversinya menjadi JSON murni yang sangat presisi.

Instruksi Khusus:
1. Ekstrak setiap soal beserta opsi jawaban (A, B, C, D, E).
2. Jika ada rumus matematika/fisika/kimia, gunakan format LaTeX terstandar (contoh: $x^2 + 2x + 1 = 0$).
3. Jika dokumen TIDAK MEMILIKI kunci/pembahasan, Anda WAJIB memecahkan jawaban terbenar dan membuatkan pembahasan langkah-demi-langkah yang ilmiah.
4. Tentukan tingkat kesulitan (EASY, MEDIUM, HARD) dan Taksonomi Bloom (C1-C6) untuk setiap soal.
5. Jika terdapat diagram/gambar pada soal, tandai has_image: true.

Format JSON Output Wajib (kembalikan berupa JSON Array):
[
  {
    "question_type": "SINGLE_CHOICE",
    "content": "Pertanyaan soal...",
    "difficulty": "MEDIUM",
    "bloom_level": "C3",
    "source": "UTBK SNBT 2025",
    "has_image": false,
    "options": [
      {"label": "A", "option_text": "Opsi A", "is_correct": false},
      {"label": "B", "option_text": "Opsi B", "is_correct": true},
      {"label": "C", "option_text": "Opsi C", "is_correct": false},
      {"label": "D", "option_text": "Opsi D", "is_correct": false},
      {"label": "E", "option_text": "Opsi E", "is_correct": false}
    ],
    "explanation": "Pembahasan rinci..."
  }
]`

	if req.Prompt != "" {
		visionPrompt += "\n\nInstruksi Tambahan: " + req.Prompt
	}

	msgs := []ChatMessage{
		{Role: "system", Content: visionPrompt},
		{Role: "user", Content: "Ekstrak lembar soal berikut ke dalam JSON murni. Jangan tambahkan teks salam atau kalimat pengantar di luar JSON."},
	}

	reply, _, err := s.callLLM(ctx, msgs)
	if err != nil {
		return nil, err
	}

	cleaned := extractJSONBlock(reply)

	var questions []ParsedQuestion
	if err := json.Unmarshal([]byte(cleaned), &questions); err != nil {
		var single ParsedQuestion
		if err2 := json.Unmarshal([]byte(cleaned), &single); err2 == nil {
			return []ParsedQuestion{single}, nil
		}
		return nil, fmt.Errorf("failed to parse AI JSON output: %w. Raw: %s", err, cleaned)
	}

	return questions, nil
}

func (h *Handler) GetStats(c *fiber.Ctx) error {
	stats, err := h.svc.GetStats(c.Context())
	if err != nil {
		return c.Status(500).JSON(shared.Error(shared.ErrInternal, "Failed to get stats"))
	}
	return c.JSON(shared.Success(stats))
}

func (h *Handler) ParseQuestions(c *fiber.Ctx) error {
	var req ParseQuestionsReq
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(shared.Error(shared.ErrValidation, "Invalid request body"))
	}

	questions, err := h.svc.ParseQuestionsFromImage(c.Context(), req)
	if err != nil {
		return c.Status(500).JSON(shared.Error(shared.ErrInternal, "AI vision parsing failed: "+err.Error()))
	}
	return c.JSON(shared.Success(questions))
}

func (h *Handler) GetConfig(c *fiber.Ctx) error {
	cfg, err := h.svc.GetConfig(c.Context())
	if err != nil {
		return c.Status(500).JSON(shared.Error(shared.ErrInternal, "Failed to get AI config"))
	}
	return c.JSON(shared.Success(cfg))
}

func (h *Handler) UpdateConfig(c *fiber.Ctx) error {
	var req AIConfigDTO
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(shared.Error(shared.ErrValidation, "Invalid request body"))
	}
	if err := h.svc.UpdateConfig(c.Context(), req); err != nil {
		return c.Status(500).JSON(shared.Error(shared.ErrInternal, "Failed to update AI config"))
	}
	return c.JSON(shared.Success(fiber.Map{"message": "AI configuration updated successfully"}))
}

func (h *Handler) TestConnection(c *fiber.Ctx) error {
	var req TestConnectionReq
	_ = c.BodyParser(&req)

	if err := h.svc.TestConnection(c.Context(), req); err != nil {
		return c.Status(400).JSON(shared.Error(shared.ErrValidation, err.Error()))
	}
	return c.JSON(shared.Success(fiber.Map{"message": "Koneksi ke AI Provider Berhasil!"}))
}

func (h *Handler) RegisterRoutes(router fiber.Router) {
	authM := middleware.RequireAuth(h.role)
	admin := middleware.RequireRole("ADMIN", "STAFF")

	r := router.Group("/ai", authM)
	r.Post("/tutor/chat", h.TutorChat)
	r.Post("/tutor/conversations", h.ListConversations)
	r.Get("/tutor/conversations/:id", h.GetConversation)
	r.Delete("/tutor/conversations/:id", h.DeleteConversation)
	r.Post("/generate-question", h.GenerateQuestion)
	r.Post("/parse-questions", admin, h.ParseQuestions)
	r.Get("/config", admin, h.GetConfig)
	r.Put("/config", admin, h.UpdateConfig)
	r.Post("/test-connection", admin, h.TestConnection)

	r.Get("/tutor/admin/conversations", admin, h.AdminListConversations)
	r.Get("/tutor/admin/stats", admin, h.GetStats)
	r.Delete("/tutor/admin/conversations/:id", admin, h.DeleteConversation)
}
