package cbt_engine

import (
	"net/http"
	"strconv"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"

	"yakinlulus.id/backend/internal/content"
	"yakinlulus.id/backend/internal/shared"
)

// Handler handles HTTP requests for CBT exams.
type Handler struct {
	svc    *Service
	secret string
}

// NewHandler creates a new CBT exam handler.
func NewHandler(svc *Service, secret string) *Handler {
	return &Handler{svc: svc, secret: secret}
}

// RegisterRoutes registers the CBT exam routes.
func (h *Handler) RegisterRoutes(r fiber.Router) {
	exams := r.Group("/exams")
	exams.Post("/", h.CreateExam)
	exams.Post("/import", h.ImportExams)
	exams.Get("/", h.ListExams)
	exams.Get("/:id", h.GetExam)
	exams.Put("/:id", h.UpdateExam)
	exams.Delete("/:id", h.DeleteExam)

	// Exam questions
	exams.Post("/:id/questions", h.AddQuestionToExam)
	exams.Delete("/:id/questions/:questionId", h.RemoveQuestionFromExam)
	exams.Put("/:id/questions/reorder", h.ReorderQuestions)

	// Exam blueprint
	exams.Post("/:id/blueprint", h.SetBlueprint)
	exams.Get("/:id/blueprint", h.GetBlueprint)

	// Exam subject blueprints
	exams.Post("/:id/subject-blueprints", h.SetSubjectBlueprint)
	exams.Get("/:id/subject-blueprints", h.GetSubjectBlueprints)

	// Participants
	exams.Post("/:id/participants", h.AddParticipant)
	exams.Delete("/:id/participants/:userId", h.RemoveParticipant)
	exams.Get("/:id/participants", h.GetParticipants)

	// Attempts
	exams.Post("/:id/attempts/start", h.StartAttempt)
	exams.Post("/:id/attempts/start-with-blueprints", h.StartAttemptWithSubjectBlueprints)
	exams.Post("/:id/attempts/start-tag-based", h.StartTagBasedExam)
	exams.Get("/attempts/:attemptId", h.GetAttempt)
	exams.Post("/attempts/:attemptId/submit", h.SubmitAttempt)
	exams.Post("/attempts/:attemptId/grade", h.GradeAttempt)

	// Analytics
	exams.Get("/:id/analytics", h.GetAnalytics)

	// Practice endpoints
	practice := r.Group("/practice")
	practice.Post("/material/:materialId", h.StartMaterialPractice)
	practice.Post("/subject", h.StartSubjectPractice)
	practice.Post("/tags", h.StartTagBasedPractice)
	practice.Post("/:sessionId/submit", h.SubmitPracticeSession)
	practice.Get("/:sessionId", h.GetPracticeSession)
}

// --- Exam Handlers ---

// CreateExamRequest represents the request body for creating an exam.
type CreateExamRequest struct {
	Title            string      `json:"title" validate:"required"`
	Description      string      `json:"description"`
	GradeID          *uuid.UUID  `json:"grade_id"`
	SubjectID        *uuid.UUID  `json:"subject_id"`
	DurationMinutes  int         `json:"duration_minutes"`
	PassingScore     float64     `json:"passing_score"`
	ShuffleQuestions bool        `json:"shuffle_questions"`
	ShuffleOptions   bool        `json:"shuffle_options"`
	MaxAttempts      int         `json:"max_attempts"`
	StartTime        *int64      `json:"start_time"` // Unix timestamp
	EndTime          *int64      `json:"end_time"`   // Unix timestamp
	Blueprint        interface{} `json:"blueprint"`  // JSONB
	CreatedBy        uuid.UUID   `json:"created_by"`
}

func (h *Handler) CreateExam(c *fiber.Ctx) error {
	var req CreateExamRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(http.StatusBadRequest).JSON(shared.Error(shared.ErrValidation, "Invalid request body"))
	}

	startTime := req.StartTime
	endTime := req.EndTime

	var start, end *time.Time
	if startTime != nil {
		t := time.Unix(*startTime, 0)
		start = &t
	}
	if endTime != nil {
		t := time.Unix(*endTime, 0)
		end = &t
	}

	createdBy := req.CreatedBy
	if createdBy == uuid.Nil {
		if uid, ok := c.Locals("user_id").(uuid.UUID); ok && uid != uuid.Nil {
			createdBy = uid
		} else {
			createdBy = uuid.MustParse("00000000-0000-0000-0000-000000000001")
		}
	}

	gradeID := uuid.MustParse("11000000-0000-0000-0000-000000000099") // Default UTBK Grade if omitted
	if req.GradeID != nil && *req.GradeID != uuid.Nil {
		gradeID = *req.GradeID
	}

	subjectID := uuid.MustParse("21000000-0000-0000-0000-000000000002") // Default Penalaran Umum Subject if omitted
	if req.SubjectID != nil && *req.SubjectID != uuid.Nil {
		subjectID = *req.SubjectID
	}

	duration := req.DurationMinutes
	if duration <= 0 {
		duration = 90
	}

	maxAttempts := req.MaxAttempts
	if maxAttempts <= 0 {
		maxAttempts = 1
	}

	var bp map[string]interface{}
	if req.Blueprint != nil {
		if m, ok := req.Blueprint.(map[string]interface{}); ok {
			bp = m
		}
	}
	if bp == nil {
		bp = make(map[string]interface{})
	}

	exam, err := h.svc.CreateExam(c.Context(), &content.CreateExamReq{
		CreateContentReq: content.CreateContentReq{
			ContentType: content.ContentTypeExam,
			GradeID:     gradeID,
			SubjectID:   subjectID,
			Title:       req.Title,
			Body:        req.Description,
			Status:      content.StatusDraft,
			CreatedBy:   createdBy,
		},
		Description:      req.Description,
		DurationMinutes:  duration,
		PassingScore:     req.PassingScore,
		ShuffleQuestions: req.ShuffleQuestions,
		ShuffleOptions:   req.ShuffleOptions,
		MaxAttempts:      maxAttempts,
		StartTime:        start,
		EndTime:          end,
		Blueprint:        bp,
	})
	if err != nil {
		return c.Status(http.StatusInternalServerError).JSON(shared.Error(shared.ErrInternal, "Failed to create exam: "+err.Error()))
	}

	return c.Status(http.StatusCreated).JSON(shared.Success(exam))
}

// ImportExams accepts an array of CreateExamRequest and inserts them in batch.
func (h *Handler) ImportExams(c *fiber.Ctx) error {
	var reqs []CreateExamRequest
	if err := c.BodyParser(&reqs); err != nil {
		return c.Status(http.StatusBadRequest).JSON(shared.Error(shared.ErrValidation, "Invalid request payload for bulk import"))
	}

	if len(reqs) == 0 {
		return c.Status(http.StatusBadRequest).JSON(shared.Error(shared.ErrValidation, "Import list is empty"))
	}

	var createdExams []*content.ExamFull
	for _, req := range reqs {
		createdBy := req.CreatedBy
		if createdBy == uuid.Nil {
			if uid, ok := c.Locals("user_id").(uuid.UUID); ok && uid != uuid.Nil {
				createdBy = uid
			} else {
				createdBy = uuid.MustParse("00000000-0000-0000-0000-000000000001")
			}
		}

		var bp map[string]interface{}
		if req.Blueprint != nil {
			if m, ok := req.Blueprint.(map[string]interface{}); ok {
				bp = m
			}
		}
		if bp == nil {
			bp = make(map[string]interface{})
		}

		duration := req.DurationMinutes
		if duration <= 0 {
			duration = 90
		}

		gradeID := uuid.MustParse("11000000-0000-0000-0000-000000000099") // Default UTBK Grade if omitted
		if req.GradeID != nil && *req.GradeID != uuid.Nil {
			gradeID = *req.GradeID
		}

		subjectID := uuid.MustParse("21000000-0000-0000-0000-000000000002") // Default Penalaran Umum Subject if omitted
		if req.SubjectID != nil && *req.SubjectID != uuid.Nil {
			subjectID = *req.SubjectID
		}

		exam, err := h.svc.CreateExam(c.Context(), &content.CreateExamReq{
			CreateContentReq: content.CreateContentReq{
				ContentType: content.ContentTypeExam,
				GradeID:     gradeID,
				SubjectID:   subjectID,
				Title:       req.Title,
				Body:        req.Description,
				Status:      content.StatusDraft,
				CreatedBy:   createdBy,
			},
			Description:      req.Description,
			DurationMinutes:  duration,
			PassingScore:     req.PassingScore,
			ShuffleQuestions: req.ShuffleQuestions,
			ShuffleOptions:   req.ShuffleOptions,
			MaxAttempts:      req.MaxAttempts,
			Blueprint:        bp,
		})
		if err == nil && exam != nil {
			createdExams = append(createdExams, exam)
		}
	}

	return c.Status(http.StatusCreated).JSON(shared.Success(fiber.Map{
		"message":        "Bulk import processed successfully",
		"imported_count": len(createdExams),
		"exams":          createdExams,
	}))
}

func (h *Handler) GetExam(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(http.StatusBadRequest).JSON(shared.Error(shared.ErrValidation, "Invalid exam ID"))
	}

	exam, err := h.svc.GetExam(c.Context(), id)
	if err != nil {
		return c.Status(http.StatusNotFound).JSON(shared.Error(shared.ErrNotFound, "Exam not found"))
	}

	return c.JSON(shared.Success(exam))
}

func (h *Handler) ListExams(c *fiber.Ctx) error {
	filter := content.ExamFilter{
		ContentFilter: content.ContentFilter{
			GradeID:   parseUUID(c.Query("grade_id")),
			SubjectID: parseUUID(c.Query("subject_id")),
			Search:    c.Query("search"),
			Limit:     c.QueryInt("limit", 20),
			Offset:    c.QueryInt("offset", 0),
		},
		StartTime: parseTime(c.Query("start_time")),
		EndTime:   parseTime(c.Query("end_time")),
	}

	if status := c.Query("status"); status != "" {
		s := content.ContentStatus(status)
		filter.Status = &s
	}

	exams, total, err := h.svc.ListExams(c.Context(), filter)
	if err != nil {
		return c.Status(http.StatusInternalServerError).JSON(shared.Error(shared.ErrInternal, "Failed to list exams"))
	}

	return c.JSON(shared.SuccessWithMeta(exams, shared.BuildMeta(c.QueryInt("page", 1), c.QueryInt("limit", 20), total)))
}

func (h *Handler) UpdateExam(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(http.StatusBadRequest).JSON(shared.Error(shared.ErrValidation, "Invalid exam ID"))
	}

	var req struct {
		Title            *string  `json:"title"`
		Description      *string  `json:"description"`
		DurationMinutes  *int     `json:"duration_minutes"`
		PassingScore     *float64 `json:"passing_score"`
		ShuffleQuestions *bool    `json:"shuffle_questions"`
		ShuffleOptions   *bool    `json:"shuffle_options"`
		MaxAttempts      *int     `json:"max_attempts"`
		StartTime        *int64   `json:"start_time"`
		EndTime          *int64   `json:"end_time"`
		Status           *string  `json:"status"`
	}
	if err := c.BodyParser(&req); err != nil {
		return c.Status(http.StatusBadRequest).JSON(shared.Error(shared.ErrValidation, "Invalid request body"))
	}

	var start, end *time.Time
	if req.StartTime != nil {
		t := time.Unix(*req.StartTime, 0)
		start = &t
	}
	if req.EndTime != nil {
		t := time.Unix(*req.EndTime, 0)
		end = &t
	}

	contentReq := content.UpdateContentReq{
		Title:  req.Title,
		Body:   req.Description,
		Status: (*content.ContentStatus)(req.Status),
	}

	exam := &content.Exam{
		Description:      derefString(req.Description),
		DurationMinutes:  derefInt(req.DurationMinutes),
		PassingScore:     derefFloat(req.PassingScore),
		ShuffleQuestions: derefBool(req.ShuffleQuestions),
		ShuffleOptions:   derefBool(req.ShuffleOptions),
		MaxAttempts:      derefInt(req.MaxAttempts),
		StartTime:        start,
		EndTime:          end,
	}

	if err := h.svc.UpdateExam(c.Context(), id, &contentReq, exam); err != nil {
		return c.Status(http.StatusInternalServerError).JSON(shared.Error(shared.ErrInternal, "Failed to update exam: "+err.Error()))
	}

	return c.JSON(shared.Success(fiber.Map{"message": "Exam updated"}))
}

func (h *Handler) DeleteExam(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(http.StatusBadRequest).JSON(shared.Error(shared.ErrValidation, "Invalid exam ID"))
	}

	if err := h.svc.DeleteExam(c.Context(), id); err != nil {
		return c.Status(http.StatusInternalServerError).JSON(shared.Error(shared.ErrInternal, "Failed to delete exam"))
	}

	return c.JSON(shared.Success(fiber.Map{"message": "Exam deleted"}))
}

// --- Exam Questions Handlers ---

func (h *Handler) AddQuestionToExam(c *fiber.Ctx) error {
	examID, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(http.StatusBadRequest).JSON(shared.Error(shared.ErrValidation, "Invalid exam ID"))
	}

	var req struct {
		QuestionID   uuid.UUID `json:"question_id" validate:"required"`
		DisplayOrder int       `json:"display_order"`
		Points       float64   `json:"points" validate:"gt=0"`
	}
	if err := c.BodyParser(&req); err != nil {
		return c.Status(http.StatusBadRequest).JSON(shared.Error(shared.ErrValidation, "Invalid request body"))
	}

	if err := h.svc.AddQuestionToExam(c.Context(), examID, req.QuestionID, req.DisplayOrder, req.Points); err != nil {
		return c.Status(http.StatusInternalServerError).JSON(shared.Error(shared.ErrInternal, "Failed to add question to exam"))
	}

	return c.JSON(shared.Success(fiber.Map{"message": "Question added to exam"}))
}

func (h *Handler) RemoveQuestionFromExam(c *fiber.Ctx) error {
	examID, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(http.StatusBadRequest).JSON(shared.Error(shared.ErrValidation, "Invalid exam ID"))
	}

	questionID, err := uuid.Parse(c.Params("questionId"))
	if err != nil {
		return c.Status(http.StatusBadRequest).JSON(shared.Error(shared.ErrValidation, "Invalid question ID"))
	}

	if err := h.svc.RemoveQuestionFromExam(c.Context(), examID, questionID); err != nil {
		return c.Status(http.StatusInternalServerError).JSON(shared.Error(shared.ErrInternal, "Failed to remove question from exam"))
	}

	return c.JSON(shared.Success(fiber.Map{"message": "Question removed from exam"}))
}

func (h *Handler) ReorderQuestions(c *fiber.Ctx) error {
	examID, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(http.StatusBadRequest).JSON(shared.Error(shared.ErrValidation, "Invalid exam ID"))
	}

	var req struct {
		QuestionIDs []uuid.UUID `json:"question_ids" validate:"required"`
	}
	if err := c.BodyParser(&req); err != nil {
		return c.Status(http.StatusBadRequest).JSON(shared.Error(shared.ErrValidation, "Invalid request body"))
	}

	if err := h.svc.ReorderExamQuestions(c.Context(), examID, req.QuestionIDs); err != nil {
		return c.Status(http.StatusInternalServerError).JSON(shared.Error(shared.ErrInternal, "Failed to reorder questions"))
	}

	return c.JSON(shared.Success(fiber.Map{"message": "Questions reordered"}))
}

// --- Exam Blueprint Handlers ---

func (h *Handler) SetBlueprint(c *fiber.Ctx) error {
	examID, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(http.StatusBadRequest).JSON(shared.Error(shared.ErrValidation, "Invalid exam ID"))
	}

	var bp content.ExamBlueprint
	if err := c.BodyParser(&bp); err != nil {
		return c.Status(http.StatusBadRequest).JSON(shared.Error(shared.ErrValidation, "Invalid blueprint data"))
	}

	bp.ExamContentID = examID
	if err := h.svc.SetBlueprint(c.Context(), examID, &bp); err != nil {
		return c.Status(http.StatusInternalServerError).JSON(shared.Error(shared.ErrInternal, "Failed to set blueprint"))
	}

	return c.JSON(shared.Success(fiber.Map{"message": "Blueprint set"}))
}

func (h *Handler) GetBlueprint(c *fiber.Ctx) error {
	examID, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(http.StatusBadRequest).JSON(shared.Error(shared.ErrValidation, "Invalid exam ID"))
	}

	bp, err := h.svc.GetBlueprint(c.Context(), examID)
	if err != nil {
		return c.Status(http.StatusNotFound).JSON(shared.Error(shared.ErrNotFound, "Blueprint not found"))
	}

	return c.JSON(shared.Success(bp))
}

// SetSubjectBlueprint sets a subject blueprint for an exam.
func (h *Handler) SetSubjectBlueprint(c *fiber.Ctx) error {
	examID, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(http.StatusBadRequest).JSON(shared.Error(shared.ErrValidation, "Invalid exam ID"))
	}

	var sb content.ExamSubjectBlueprint
	if err := c.BodyParser(&sb); err != nil {
		return c.Status(http.StatusBadRequest).JSON(shared.Error(shared.ErrValidation, "Invalid subject blueprint data"))
	}

	sb.ExamContentID = examID
	if err := h.svc.SetSubjectBlueprint(c.Context(), examID, &sb); err != nil {
		return c.Status(http.StatusInternalServerError).JSON(shared.Error(shared.ErrInternal, "Failed to set subject blueprint"))
	}

	return c.JSON(shared.Success(fiber.Map{"message": "Subject blueprint set"}))
}

// GetSubjectBlueprints gets all subject blueprints for an exam.
func (h *Handler) GetSubjectBlueprints(c *fiber.Ctx) error {
	examID, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(http.StatusBadRequest).JSON(shared.Error(shared.ErrValidation, "Invalid exam ID"))
	}

	blueprints, err := h.svc.GetSubjectBlueprints(c.Context(), examID)
	if err != nil {
		return c.Status(http.StatusInternalServerError).JSON(shared.Error(shared.ErrInternal, "Failed to get subject blueprints"))
	}

	return c.JSON(shared.Success(blueprints))
}

// --- Participant Handlers ---

func (h *Handler) AddParticipant(c *fiber.Ctx) error {
	examID, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(http.StatusBadRequest).JSON(shared.Error(shared.ErrValidation, "Invalid exam ID"))
	}

	var req struct {
		UserID uuid.UUID `json:"user_id" validate:"required"`
	}
	if err := c.BodyParser(&req); err != nil {
		return c.Status(http.StatusBadRequest).JSON(shared.Error(shared.ErrValidation, "Invalid request body"))
	}

	if err := h.svc.AddParticipant(c.Context(), examID, req.UserID); err != nil {
		return c.Status(http.StatusInternalServerError).JSON(shared.Error(shared.ErrInternal, "Failed to add participant"))
	}

	return c.JSON(shared.Success(fiber.Map{"message": "Participant added"}))
}

func (h *Handler) RemoveParticipant(c *fiber.Ctx) error {
	examID, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(http.StatusBadRequest).JSON(shared.Error(shared.ErrValidation, "Invalid exam ID"))
	}

	userID, err := uuid.Parse(c.Params("userId"))
	if err != nil {
		return c.Status(http.StatusBadRequest).JSON(shared.Error(shared.ErrValidation, "Invalid user ID"))
	}

	if err := h.svc.RemoveParticipant(c.Context(), examID, userID); err != nil {
		return c.Status(http.StatusInternalServerError).JSON(shared.Error(shared.ErrInternal, "Failed to remove participant"))
	}

	return c.JSON(shared.Success(fiber.Map{"message": "Participant removed"}))
}

func (h *Handler) GetParticipants(c *fiber.Ctx) error {
	examID, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(http.StatusBadRequest).JSON(shared.Error(shared.ErrValidation, "Invalid exam ID"))
	}

	participants, err := h.svc.GetParticipants(c.Context(), examID)
	if err != nil {
		return c.Status(http.StatusInternalServerError).JSON(shared.Error(shared.ErrInternal, "Failed to get participants"))
	}

	return c.JSON(shared.Success(participants))
}

// --- Attempt Handlers ---

func (h *Handler) StartAttempt(c *fiber.Ctx) error {
	examID, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(http.StatusBadRequest).JSON(shared.Error(shared.ErrValidation, "Invalid exam ID"))
	}

	// Get user ID from JWT context
	userID := c.Locals("user_id").(uuid.UUID)

	attempt, err := h.svc.StartAttempt(c.Context(), examID, userID)
	if err != nil {
		if err == ErrNotParticipant {
			return c.Status(http.StatusForbidden).JSON(shared.Error(shared.ErrForbidden, "Not a participant of this exam"))
		}
		if err == ErrMaxAttemptsReached {
			return c.Status(http.StatusConflict).JSON(shared.Error(shared.ErrConflict, "Maximum attempts reached"))
		}
		return c.Status(http.StatusInternalServerError).JSON(shared.Error(shared.ErrInternal, "Failed to start attempt"))
	}

	return c.Status(http.StatusCreated).JSON(shared.Success(attempt))
}

func (h *Handler) GetAttempt(c *fiber.Ctx) error {
	attemptID, err := uuid.Parse(c.Params("attemptId"))
	if err != nil {
		return c.Status(http.StatusBadRequest).JSON(shared.Error(shared.ErrValidation, "Invalid attempt ID"))
	}

	attempt, err := h.svc.GetAttempt(c.Context(), attemptID)
	if err != nil {
		return c.Status(http.StatusNotFound).JSON(shared.Error(shared.ErrNotFound, "Attempt not found"))
	}

	return c.JSON(shared.Success(attempt))
}

func (h *Handler) SubmitAttempt(c *fiber.Ctx) error {
	attemptID, err := uuid.Parse(c.Params("attemptId"))
	if err != nil {
		return c.Status(http.StatusBadRequest).JSON(shared.Error(shared.ErrValidation, "Invalid attempt ID"))
	}

	var req struct {
		Answers []content.ExamAnswer `json:"answers" validate:"required"`
	}
	if err := c.BodyParser(&req); err != nil {
		return c.Status(http.StatusBadRequest).JSON(shared.Error(shared.ErrValidation, "Invalid request body"))
	}

	if err := h.svc.SubmitAttempt(c.Context(), attemptID, req.Answers); err != nil {
		if err == ErrAttemptAlreadySubmitted {
			return c.Status(http.StatusConflict).JSON(shared.Error(shared.ErrConflict, "Attempt already submitted"))
		}
		return c.Status(http.StatusInternalServerError).JSON(shared.Error(shared.ErrInternal, "Failed to submit attempt"))
	}

	return c.JSON(shared.Success(fiber.Map{"message": "Attempt submitted successfully"}))
}

func (h *Handler) GradeAttempt(c *fiber.Ctx) error {
	attemptID, err := uuid.Parse(c.Params("attemptId"))
	if err != nil {
		return c.Status(http.StatusBadRequest).JSON(shared.Error(shared.ErrValidation, "Invalid attempt ID"))
	}

	if err := h.svc.GradeAttempt(c.Context(), attemptID); err != nil {
		if err == ErrInvalidState {
			return c.Status(http.StatusConflict).JSON(shared.Error(shared.ErrConflict, "Attempt cannot be graded in current state"))
		}
		return c.Status(http.StatusInternalServerError).JSON(shared.Error(shared.ErrInternal, "Failed to grade attempt"))
	}

	return c.JSON(shared.Success(fiber.Map{"message": "Attempt graded successfully"}))
}

// --- Analytics ---

func (h *Handler) GetAnalytics(c *fiber.Ctx) error {
	examID, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(http.StatusBadRequest).JSON(shared.Error(shared.ErrValidation, "Invalid exam ID"))
	}

	analytics, err := h.svc.GetAnalytics(c.Context(), examID)
	if err != nil {
		return c.Status(http.StatusInternalServerError).JSON(shared.Error(shared.ErrInternal, "Failed to get analytics"))
	}

	return c.JSON(shared.Success(analytics))
}

// --- Advanced Practice Exam Handlers ---

// StartAttemptWithSubjectBlueprints starts an exam attempt using per-subject blueprints.
func (h *Handler) StartAttemptWithSubjectBlueprints(c *fiber.Ctx) error {
	examID, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(http.StatusBadRequest).JSON(shared.Error(shared.ErrValidation, "Invalid exam ID"))
	}

	userID := c.Locals("user_id").(uuid.UUID)

	attempt, err := h.svc.StartAttemptWithSubjectBlueprints(c.Context(), examID, userID)
	if err != nil {
		if err == ErrNotParticipant {
			return c.Status(http.StatusForbidden).JSON(shared.Error(shared.ErrForbidden, "Not a participant of this exam"))
		}
		if err == ErrMaxAttemptsReached {
			return c.Status(http.StatusConflict).JSON(shared.Error(shared.ErrConflict, "Maximum attempts reached"))
		}
		return c.Status(http.StatusInternalServerError).JSON(shared.Error(shared.ErrInternal, "Failed to start attempt"))
	}

	return c.Status(http.StatusCreated).JSON(shared.Success(attempt))
}

// StartTagBasedExam starts an exam attempt from tag-filtered question pool.
func (h *Handler) StartTagBasedExam(c *fiber.Ctx) error {
	examID, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(http.StatusBadRequest).JSON(shared.Error(shared.ErrValidation, "Invalid exam ID"))
	}

	userID := c.Locals("user_id").(uuid.UUID)

	var req struct {
		TagFilter      map[string]interface{} `json:"tag_filter" validate:"required"`
		TotalQuestions int                    `json:"total_questions" validate:"required,gt=0"`
	}
	if err := c.BodyParser(&req); err != nil {
		return c.Status(http.StatusBadRequest).JSON(shared.Error(shared.ErrValidation, "Invalid request body"))
	}

	attempt, err := h.svc.StartTagBasedExam(c.Context(), examID, userID, req.TagFilter, req.TotalQuestions)
	if err != nil {
		if err == ErrNotParticipant {
			return c.Status(http.StatusForbidden).JSON(shared.Error(shared.ErrForbidden, "Not a participant of this exam"))
		}
		if err == ErrMaxAttemptsReached {
			return c.Status(http.StatusConflict).JSON(shared.Error(shared.ErrConflict, "Maximum attempts reached"))
		}
		return c.Status(http.StatusInternalServerError).JSON(shared.Error(shared.ErrInternal, "Failed to start tag-based exam"))
	}

	return c.Status(http.StatusCreated).JSON(shared.Success(attempt))
}

// --- Practice Session Handlers ---

// StartMaterialPractice starts a practice session for a specific material.
func (h *Handler) StartMaterialPractice(c *fiber.Ctx) error {
	materialID, err := uuid.Parse(c.Params("materialId"))
	if err != nil {
		return c.Status(http.StatusBadRequest).JSON(shared.Error(shared.ErrValidation, "Invalid material ID"))
	}

	userID := c.Locals("user_id").(uuid.UUID)

	var req struct {
		QuestionsCount int `json:"questions_count" validate:"gt=0"`
	}
	if err := c.BodyParser(&req); err != nil {
		return c.Status(http.StatusBadRequest).JSON(shared.Error(shared.ErrValidation, "Invalid request body"))
	}
	if req.QuestionsCount == 0 {
		req.QuestionsCount = 10
	}

	session, err := h.svc.StartMaterialPractice(c.Context(), userID, materialID, req.QuestionsCount)
	if err != nil {
		return c.Status(http.StatusInternalServerError).JSON(shared.Error(shared.ErrInternal, err.Error()))
	}

	return c.Status(http.StatusCreated).JSON(shared.Success(session))
}

// StartSubjectPractice starts a practice session by subject and grade.
func (h *Handler) StartSubjectPractice(c *fiber.Ctx) error {
	userID := c.Locals("user_id").(uuid.UUID)

	var req struct {
		SubjectID      *uuid.UUID `json:"subject_id"`
		GradeID        *uuid.UUID `json:"grade_id"`
		QuestionsCount int        `json:"questions_count" validate:"gt=0"`
	}
	if err := c.BodyParser(&req); err != nil {
		return c.Status(http.StatusBadRequest).JSON(shared.Error(shared.ErrValidation, "Invalid request body"))
	}
	if req.QuestionsCount == 0 {
		req.QuestionsCount = 20
	}

	session, err := h.svc.StartSubjectPractice(c.Context(), userID, req.SubjectID, req.GradeID, req.QuestionsCount)
	if err != nil {
		return c.Status(http.StatusInternalServerError).JSON(shared.Error(shared.ErrInternal, err.Error()))
	}

	return c.Status(http.StatusCreated).JSON(shared.Success(session))
}

// StartTagBasedPractice starts a practice session filtered by tags.
func (h *Handler) StartTagBasedPractice(c *fiber.Ctx) error {
	userID := c.Locals("user_id").(uuid.UUID)

	var req struct {
		TagFilter      map[string]interface{} `json:"tag_filter" validate:"required"`
		QuestionsCount int                    `json:"questions_count" validate:"gt=0"`
	}
	if err := c.BodyParser(&req); err != nil {
		return c.Status(http.StatusBadRequest).JSON(shared.Error(shared.ErrValidation, "Invalid request body"))
	}
	if req.QuestionsCount == 0 {
		req.QuestionsCount = 20
	}

	session, err := h.svc.StartTagBasedPractice(c.Context(), userID, req.TagFilter, req.QuestionsCount)
	if err != nil {
		return c.Status(http.StatusInternalServerError).JSON(shared.Error(shared.ErrInternal, err.Error()))
	}

	return c.Status(http.StatusCreated).JSON(shared.Success(session))
}

// SubmitPracticeSession submits and grades a practice session.
func (h *Handler) SubmitPracticeSession(c *fiber.Ctx) error {
	sessionID, err := uuid.Parse(c.Params("sessionId"))
	if err != nil {
		return c.Status(http.StatusBadRequest).JSON(shared.Error(shared.ErrValidation, "Invalid session ID"))
	}

	var req struct {
		Answers []content.ExamAnswer `json:"answers" validate:"required"`
	}
	if err := c.BodyParser(&req); err != nil {
		return c.Status(http.StatusBadRequest).JSON(shared.Error(shared.ErrValidation, "Invalid request body"))
	}

	session, err := h.svc.SubmitPracticeSession(c.Context(), sessionID, req.Answers)
	if err != nil {
		if err == ErrAttemptAlreadySubmitted {
			return c.Status(http.StatusConflict).JSON(shared.Error(shared.ErrConflict, "Session already submitted"))
		}
		return c.Status(http.StatusInternalServerError).JSON(shared.Error(shared.ErrInternal, "Failed to submit practice session"))
	}

	return c.JSON(shared.Success(session))
}

// GetPracticeSession retrieves a practice session with results.
func (h *Handler) GetPracticeSession(c *fiber.Ctx) error {
	sessionID, err := uuid.Parse(c.Params("sessionId"))
	if err != nil {
		return c.Status(http.StatusBadRequest).JSON(shared.Error(shared.ErrValidation, "Invalid session ID"))
	}

	session, err := h.svc.GetPracticeSession(c.Context(), sessionID)
	if err != nil {
		return c.Status(http.StatusNotFound).JSON(shared.Error(shared.ErrNotFound, "Practice session not found"))
	}

	return c.JSON(shared.Success(session))
}

// --- Helper functions ---

func parseUUID(s string) *uuid.UUID {
	if s == "" {
		return nil
	}
	id, err := uuid.Parse(s)
	if err != nil {
		return nil
	}
	return &id
}

func parseTime(s string) *time.Time {
	if s == "" {
		return nil
	}
	ts, err := strconv.ParseInt(s, 10, 64)
	if err != nil {
		return nil
	}
	t := time.Unix(ts, 0)
	return &t
}

func derefInt(i *int) int {
	if i == nil {
		return 0
	}
	return *i
}

func derefFloat(f *float64) float64 {
	if f == nil {
		return 0
	}
	return *f
}

func derefBool(b *bool) bool {
	if b == nil {
		return false
	}
	return *b
}

func derefString(s *string) string {
	if s == nil {
		return ""
	}
	return *s
}
