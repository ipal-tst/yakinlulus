package cbt_engine

import (
	"context"
	"errors"
	"math/rand"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"

	"yakinlulus.id/backend/internal/content"
)

var (
	ErrMaxAttemptsReached      = errors.New("maximum attempts reached")
	ErrExamNotStarted          = errors.New("exam not started yet")
	ErrExamFinished            = errors.New("exam has finished")
	ErrAttemptAlreadySubmitted = errors.New("attempt already submitted")
	ErrNotParticipant          = errors.New("user is not a participant of this exam")
	ErrInvalidState            = errors.New("invalid attempt state")
)

// Service handles CBT related logic.
type Service struct {
	content content.Repository
}

// NewService creates a new CBT service.
func NewService(contentRepo content.Repository) *Service {
	return &Service{content: contentRepo}
}

// CreateExam creates a new exam.
func (s *Service) CreateExam(ctx context.Context, req *content.CreateExamReq) (*content.ExamFull, error) {
	baseID := uuid.New()
	base := &content.Content{
		ID:          baseID,
		ContentType: content.ContentTypeExam,
		GradeID:     req.GradeID,
		SubjectID:   req.SubjectID,
		Title:       req.Title,
		Body:        req.Description,
		Status:      content.StatusDraft,
		CreatedBy:   req.CreatedBy,
	}

	exam := &content.Exam{
		ContentID:        baseID,
		Description:      req.Description,
		DurationMinutes:  req.DurationMinutes,
		PassingScore:     req.PassingScore,
		ShuffleQuestions: req.ShuffleQuestions,
		ShuffleOptions:   req.ShuffleOptions,
		MaxAttempts:      req.MaxAttempts,
		StartTime:        req.StartTime,
		EndTime:          req.EndTime,
		Blueprint:        req.Blueprint,
	}

	if err := s.content.CreateContent(ctx, base); err != nil {
		return nil, err
	}
	if err := s.content.CreateExam(ctx, exam); err != nil {
		return nil, err
	}

	return s.content.GetExam(ctx, baseID)
}

// GetExam retrieves an exam by ID.
func (s *Service) GetExam(ctx context.Context, id uuid.UUID) (*content.ExamFull, error) {
	return s.content.GetExam(ctx, id)
}

// UpdateExam updates an exam.
func (s *Service) UpdateExam(ctx context.Context, id uuid.UUID, req *content.UpdateContentReq, exam *content.Exam) error {
	if err := s.content.UpdateContent(ctx, id, *req); err != nil {
		return err
	}
	return s.content.UpdateExam(ctx, id, exam)
}

// DeleteExam deletes an exam.
func (s *Service) DeleteExam(ctx context.Context, id uuid.UUID) error {
	return s.content.DeleteContent(ctx, id)
}

// ListExams lists exams with filters.
func (s *Service) ListExams(ctx context.Context, filter content.ExamFilter) ([]content.ExamFull, int, error) {
	return s.content.ListExams(ctx, filter)
}

// AddQuestionToExam adds a question to an exam.
func (s *Service) AddQuestionToExam(ctx context.Context, examID, questionID uuid.UUID, displayOrder int, points float64) error {
	eq := &content.ExamQuestion{
		ExamContentID:     examID,
		QuestionContentID: questionID,
		DisplayOrder:      displayOrder,
		Points:            points,
	}
	return s.content.AddExamQuestion(ctx, eq)
}

// RemoveQuestionFromExam removes a question from an exam.
func (s *Service) RemoveQuestionFromExam(ctx context.Context, examID, questionID uuid.UUID) error {
	return s.content.RemoveExamQuestion(ctx, examID, questionID)
}

// ReorderExamQuestions reorders questions in an exam.
func (s *Service) ReorderExamQuestions(ctx context.Context, examID uuid.UUID, questionIDs []uuid.UUID) error {
	return s.content.ReorderExamQuestions(ctx, examID, questionIDs)
}

// SetBlueprint sets the exam blueprint.
func (s *Service) SetBlueprint(ctx context.Context, examID uuid.UUID, bp *content.ExamBlueprint) error {
	return s.content.CreateExamBlueprint(ctx, bp)
}

// GetBlueprint gets the exam blueprint.
func (s *Service) GetBlueprint(ctx context.Context, examID uuid.UUID) (*content.ExamBlueprint, error) {
	return s.content.GetExamBlueprint(ctx, examID)
}

// SetSubjectBlueprint sets a subject blueprint for an exam.
func (s *Service) SetSubjectBlueprint(ctx context.Context, examID uuid.UUID, sb *content.ExamSubjectBlueprint) error {
	return s.content.CreateExamSubjectBlueprint(ctx, sb)
}

// GetSubjectBlueprints gets all subject blueprints for an exam.
func (s *Service) GetSubjectBlueprints(ctx context.Context, examID uuid.UUID) ([]content.ExamSubjectBlueprint, error) {
	return s.content.GetExamSubjectBlueprints(ctx, examID)
}

// StartAttempt starts a new exam attempt for a user.
func (s *Service) StartAttempt(ctx context.Context, examID, userID uuid.UUID) (*content.ExamAttempt, error) {
	// Check if user is participant
	participants, err := s.content.GetExamParticipants(ctx, examID)
	if err != nil {
		return nil, err
	}
	isParticipant := false
	for _, p := range participants {
		if p.UserID == userID {
			isParticipant = true
			break
		}
	}
	if !isParticipant {
		return nil, ErrNotParticipant
	}

	// Check max attempts
	attempts, err := s.content.GetUserExamAttempts(ctx, examID, userID)
	if err != nil {
		return nil, err
	}

	examFull, err := s.content.GetExam(ctx, examID)
	if err != nil {
		return nil, err
	}

	if len(attempts) >= examFull.Exam.MaxAttempts {
		return nil, ErrMaxAttemptsReached
	}

	attemptNumber := len(attempts) + 1
	attempt := &content.ExamAttempt{
		ID:            uuid.New(),
		ExamContentID: examID,
		UserID:        userID,
		AttemptNumber: attemptNumber,
		Status:        content.AttemptInProgress,
		StartedAt:     time.Now(),
		CreatedAt:     time.Now(),
	}

	if err := s.content.CreateExamAttempt(ctx, attempt); err != nil {
		return nil, err
	}

	// If exam has question pool, select questions dynamically
	pool, _ := s.content.GetQuestionPool(ctx, examID)
	if pool != nil {
		questionIDs, err := s.content.GetQuestionsForPool(ctx, pool)
		if err != nil {
			return nil, err
		}
		// Shuffle if needed
		if pool.ShuffleQuestions {
			rand.Shuffle(len(questionIDs), func(i, j int) {
				questionIDs[i], questionIDs[j] = questionIDs[j], questionIDs[i]
			})
		}
		// Add session questions
		if err := s.content.AddSessionQuestions(ctx, attempt.ID, questionIDs, pool.ShuffleQuestions, pool.ShuffleOptions); err != nil {
			return nil, err
		}
	} else {
		// Use static exam questions
		examQuestions, err := s.content.GetExamQuestions(ctx, examID)
		if err != nil {
			return nil, err
		}
		questionIDs := make([]uuid.UUID, len(examQuestions))
		for i, eq := range examQuestions {
			questionIDs[i] = eq.QuestionContentID
		}
		if examFull.Exam.ShuffleQuestions {
			rand.Shuffle(len(questionIDs), func(i, j int) {
				questionIDs[i], questionIDs[j] = questionIDs[j], questionIDs[i]
			})
		}
		if err := s.content.AddSessionQuestions(ctx, attempt.ID, questionIDs, examFull.Exam.ShuffleQuestions, examFull.Exam.ShuffleOptions); err != nil {
			return nil, err
		}
	}

	return attempt, nil
}

// GetAttempt retrieves an attempt by ID.
func (s *Service) GetAttempt(ctx context.Context, attemptID uuid.UUID, userID uuid.UUID) (*content.ExamAttempt, error) {
	attempt, err := s.content.GetExamAttempt(ctx, attemptID)
	if err != nil {
		return nil, err
	}
	if attempt.UserID != userID {
		return nil, fiber.NewError(fiber.StatusForbidden, "Not your attempt")
	}
	return attempt, nil
}

// SubmitAttempt submits an exam attempt.
func (s *Service) SubmitAttempt(ctx context.Context, attemptID uuid.UUID, userID uuid.UUID, answers []content.ExamAnswer) error {
	attempt, err := s.content.GetExamAttempt(ctx, attemptID)
	if err != nil {
		return err
	}
	if attempt.UserID != userID {
		return fiber.NewError(fiber.StatusForbidden, "Not your attempt")
	}

	if attempt.Status != content.AttemptInProgress {
		return ErrAttemptAlreadySubmitted
	}

	now := time.Now()
	attempt.Status = content.AttemptSubmitted
	attempt.SubmittedAt = &now

	// Calculate time spent
	timeSpent := int(now.Sub(attempt.StartedAt).Seconds())
	attempt.TimeSpentSeconds = &timeSpent

	if err := s.content.UpdateExamAttempt(ctx, attempt); err != nil {
		return err
	}

	// Batch create answers. Client-supplied correctness/grading fields are
	// stripped — they are recomputed server-side during GradeAttempt.
	for i := range answers {
		answers[i].AttemptID = attemptID
		answers[i].CreatedAt = time.Now()
		answers[i].IsCorrect = nil
		answers[i].PointsEarned = nil
		answers[i].GradedBy = nil
		answers[i].GradedAt = nil
		if answers[i].ID == uuid.Nil {
			answers[i].ID = uuid.New()
		}
	}

	return s.content.BatchCreateExamAnswers(ctx, answers)
}

// GradeAttempt grades a submitted attempt.
func (s *Service) GradeAttempt(ctx context.Context, attemptID uuid.UUID, userID uuid.UUID) error {
	attempt, err := s.content.GetExamAttempt(ctx, attemptID)
	if err != nil {
		return err
	}
	if attempt.UserID != userID {
		return fiber.NewError(fiber.StatusForbidden, "Not your attempt")
	}

	if attempt.Status != content.AttemptSubmitted {
		return ErrInvalidState
	}

	answers, err := s.content.GetExamAnswers(ctx, attemptID)
	if err != nil {
		return err
	}

	// Get exam questions for points
	examQuestions, err := s.content.GetExamQuestions(ctx, attempt.ExamContentID)
	if err != nil {
		return err
	}

	pointsMap := make(map[uuid.UUID]float64)
	for _, eq := range examQuestions {
		pointsMap[eq.QuestionContentID] = eq.Points
	}

	var totalScore, maxScore float64
	now := time.Now()

	for i := range answers {
		points := pointsMap[answers[i].QuestionContentID]
		maxScore += points

		// Recompute correctness server-side from the question's options. The
		// client-supplied IsCorrect/PointsEarned are never trusted.
		isCorrect := false
		if q, err := s.content.GetQuestion(ctx, answers[i].QuestionContentID); err == nil {
			correct := make(map[uuid.UUID]bool)
			for _, opt := range q.Options {
				if opt.IsCorrect {
					correct[opt.ID] = true
				}
			}
			if len(answers[i].SelectedOptions) > 0 {
				isCorrect = true
				for _, sel := range answers[i].SelectedOptions {
					if !correct[sel] {
						isCorrect = false
						break
					}
				}
			}
		}

		answers[i].IsCorrect = &isCorrect
		if isCorrect {
			answers[i].PointsEarned = &points
			totalScore += points
		} else {
			zero := 0.0
			answers[i].PointsEarned = &zero
		}
		answers[i].GradedAt = &now
		if err := s.content.UpdateExamAnswer(ctx, &answers[i]); err != nil {
			return err
		}
	}

	attempt.TotalScore = &totalScore
	attempt.MaxScore = &maxScore
	attempt.Status = content.AttemptGraded
	attempt.GradedAt = &now

	return s.content.UpdateExamAttempt(ctx, attempt)
}

// AddParticipant adds a participant to an exam.
func (s *Service) AddParticipant(ctx context.Context, examID, userID uuid.UUID) error {
	ep := &content.ExamParticipant{
		ExamContentID: examID,
		UserID:        userID,
	}
	return s.content.AddExamParticipant(ctx, ep)
}

// RemoveParticipant removes a participant from an exam.
func (s *Service) RemoveParticipant(ctx context.Context, examID, userID uuid.UUID) error {
	return s.content.RemoveExamParticipant(ctx, examID, userID)
}

// GetParticipants lists participants of an exam.
func (s *Service) GetParticipants(ctx context.Context, examID uuid.UUID) ([]content.ExamParticipant, error) {
	return s.content.GetExamParticipants(ctx, examID)
}

// GetAnalytics gets exam analytics.
func (s *Service) GetAnalytics(ctx context.Context, examID uuid.UUID) (*content.ExamAnalytics, error) {
	return s.content.GetExamAnalytics(ctx, examID)
}

// ========== ADVANCED EXAM GENERATION ==========

// StartAttemptWithSubjectBlueprints starts an exam attempt using per-subject blueprints.
func (s *Service) StartAttemptWithSubjectBlueprints(ctx context.Context, examID, userID uuid.UUID) (*content.ExamAttempt, error) {
	// Check if user is participant
	participants, err := s.content.GetExamParticipants(ctx, examID)
	if err != nil {
		return nil, err
	}
	isParticipant := false
	for _, p := range participants {
		if p.UserID == userID {
			isParticipant = true
			break
		}
	}
	if !isParticipant {
		return nil, ErrNotParticipant
	}

	// Check max attempts
	attempts, err := s.content.GetUserExamAttempts(ctx, examID, userID)
	if err != nil {
		return nil, err
	}

	examFull, err := s.content.GetExam(ctx, examID)
	if err != nil {
		return nil, err
	}

	if len(attempts) >= examFull.Exam.MaxAttempts {
		return nil, ErrMaxAttemptsReached
	}

	attemptNumber := len(attempts) + 1
	attempt := &content.ExamAttempt{
		ID:            uuid.New(),
		ExamContentID: examID,
		UserID:        userID,
		AttemptNumber: attemptNumber,
		Status:        content.AttemptInProgress,
		StartedAt:     time.Now(),
		CreatedAt:     time.Now(),
	}

	if err := s.content.CreateExamAttempt(ctx, attempt); err != nil {
		return nil, err
	}

	// Get subject blueprints
	subjectBlueprints, err := s.content.GetExamSubjectBlueprints(ctx, examID)
	if err != nil {
		return nil, err
	}

	if len(subjectBlueprints) > 0 {
		// Multi-subject exam: generate questions per subject blueprint
		var allQuestionIDs []uuid.UUID
		for _, sb := range subjectBlueprints {
			// Build a temporary pool for this subject
			pool := &content.QuestionPool{
				SubjectID:           sb.SubjectID,
				ChapterIDs:          []uuid.UUID{}, // Could be extended with chapter filter per subject
				EasyPct:             sb.EasyCount * 100 / sb.TotalQuestions,
				MediumPct:           sb.MediumCount * 100 / sb.TotalQuestions,
				HardPct:             sb.HardCount * 100 / sb.TotalQuestions,
				TotalPoolSize:       sb.TotalQuestions * 3, // Pool larger than needed for randomness
				QuestionsPerStudent: sb.TotalQuestions,
			}
			questionIDs, err := s.content.GetQuestionsForPool(ctx, pool)
			if err != nil {
				return nil, err
			}
			// Shuffle and take required count
			if len(questionIDs) > sb.TotalQuestions {
				rand.Shuffle(len(questionIDs), func(i, j int) {
					questionIDs[i], questionIDs[j] = questionIDs[j], questionIDs[i]
				})
				questionIDs = questionIDs[:sb.TotalQuestions]
			}
			allQuestionIDs = append(allQuestionIDs, questionIDs...)
		}

		// Shuffle final combined list
		if examFull.Exam.ShuffleQuestions {
			rand.Shuffle(len(allQuestionIDs), func(i, j int) {
				allQuestionIDs[i], allQuestionIDs[j] = allQuestionIDs[j], allQuestionIDs[i]
			})
		}

		// Add session questions with subject_id denormalized
		if err := s.addSessionQuestionsWithSubject(ctx, attempt.ID, allQuestionIDs, examFull.Exam.ShuffleQuestions, examFull.Exam.ShuffleOptions); err != nil {
			return nil, err
		}
	} else {
		// Fallback to existing logic
		pool, _ := s.content.GetQuestionPool(ctx, examID)
		if pool != nil {
			questionIDs, err := s.content.GetQuestionsForPool(ctx, pool)
			if err != nil {
				return nil, err
			}
			if pool.ShuffleQuestions {
				rand.Shuffle(len(questionIDs), func(i, j int) {
					questionIDs[i], questionIDs[j] = questionIDs[j], questionIDs[i]
				})
			}
			if err := s.content.AddSessionQuestions(ctx, attempt.ID, questionIDs, pool.ShuffleQuestions, pool.ShuffleOptions); err != nil {
				return nil, err
			}
		} else {
			examQuestions, err := s.content.GetExamQuestions(ctx, examID)
			if err != nil {
				return nil, err
			}
			questionIDs := make([]uuid.UUID, len(examQuestions))
			for i, eq := range examQuestions {
				questionIDs[i] = eq.QuestionContentID
			}
			if examFull.Exam.ShuffleQuestions {
				rand.Shuffle(len(questionIDs), func(i, j int) {
					questionIDs[i], questionIDs[j] = questionIDs[j], questionIDs[i]
				})
			}
			if err := s.content.AddSessionQuestions(ctx, attempt.ID, questionIDs, examFull.Exam.ShuffleQuestions, examFull.Exam.ShuffleOptions); err != nil {
				return nil, err
			}
		}
	}

	return attempt, nil
}

// StartTagBasedExam starts an exam attempt from tag-filtered question pool.
func (s *Service) StartTagBasedExam(ctx context.Context, examID, userID uuid.UUID, tagFilter map[string]interface{}, totalQuestions int) (*content.ExamAttempt, error) {
	participants, err := s.content.GetExamParticipants(ctx, examID)
	if err != nil {
		return nil, err
	}
	isParticipant := false
	for _, p := range participants {
		if p.UserID == userID {
			isParticipant = true
			break
		}
	}
	if !isParticipant {
		return nil, ErrNotParticipant
	}

	attempts, err := s.content.GetUserExamAttempts(ctx, examID, userID)
	if err != nil {
		return nil, err
	}

	examFull, err := s.content.GetExam(ctx, examID)
	if err != nil {
		return nil, err
	}

	if len(attempts) >= examFull.Exam.MaxAttempts {
		return nil, ErrMaxAttemptsReached
	}

	attemptNumber := len(attempts) + 1
	attempt := &content.ExamAttempt{
		ID:            uuid.New(),
		ExamContentID: examID,
		UserID:        userID,
		AttemptNumber: attemptNumber,
		Status:        content.AttemptInProgress,
		StartedAt:     time.Now(),
		CreatedAt:     time.Now(),
	}

	if err := s.content.CreateExamAttempt(ctx, attempt); err != nil {
		return nil, err
	}

	// Get questions matching tag filter
	questionIDs, err := s.content.GetQuestionsForPractice(ctx, nil, nil, tagFilter, totalQuestions)
	if err != nil {
		return nil, err
	}

	if examFull.Exam.ShuffleQuestions {
		rand.Shuffle(len(questionIDs), func(i, j int) {
			questionIDs[i], questionIDs[j] = questionIDs[j], questionIDs[i]
		})
	}

	if err := s.addSessionQuestionsWithSubject(ctx, attempt.ID, questionIDs, examFull.Exam.ShuffleQuestions, examFull.Exam.ShuffleOptions); err != nil {
		return nil, err
	}

	return attempt, nil
}

// addSessionQuestionsWithSubject adds session questions with denormalized subject_id
func (s *Service) addSessionQuestionsWithSubject(ctx context.Context, sessionID uuid.UUID, questionIDs []uuid.UUID, shuffleQuestions, shuffleOptions bool) error {
	return s.content.AddSessionQuestionsWithSubject(ctx, sessionID, questionIDs, shuffleQuestions, shuffleOptions)
}

// ========== PRACTICE SESSIONS ==========

// StartMaterialPractice starts a practice session for a specific material.
func (s *Service) StartMaterialPractice(ctx context.Context, userID, materialContentID uuid.UUID, questionsCount int) (*content.PracticeSession, error) {
	// Get practice set for this material
	practiceSet, err := s.content.GetPracticeSet(ctx, materialContentID)
	if err != nil {
		return nil, err
	}

	// Get questions related to this material
	questionIDs, err := s.content.GetQuestionsForMaterialPractice(ctx, materialContentID, questionsCount)
	if err != nil {
		return nil, err
	}

	if len(questionIDs) == 0 {
		return nil, errors.New("no questions available for this material")
	}

	// Create practice session
	session := &content.PracticeSession{
		UserID:        userID,
		PracticeSetID: &practiceSet.ID,
		Status:        content.PracticeInProgress,
		StartedAt:     time.Now(),
	}

	if err := s.content.CreatePracticeSession(ctx, session); err != nil {
		return nil, err
	}

	// TODO: Store practice session questions (need practice_session_questions table or reuse exam logic)
	// For now, return session - questions can be fetched via practiceSet.PracticeContentID

	return session, nil
}

// StartSubjectPractice starts a practice session filtered by subject and grade.
func (s *Service) StartSubjectPractice(ctx context.Context, userID uuid.UUID, subjectID, gradeID *uuid.UUID, questionsCount int) (*content.PracticeSession, error) {
	questionIDs, err := s.content.GetQuestionsForPractice(ctx, subjectID, gradeID, nil, questionsCount)
	if err != nil {
		return nil, err
	}

	if len(questionIDs) == 0 {
		return nil, errors.New("no questions available for this subject/grade")
	}

	session := &content.PracticeSession{
		UserID:    userID,
		SubjectID: subjectID,
		GradeID:   gradeID,
		Status:    content.PracticeInProgress,
		StartedAt: time.Now(),
	}

	if err := s.content.CreatePracticeSession(ctx, session); err != nil {
		return nil, err
	}

	return session, nil
}

// StartTagBasedPractice starts a practice session filtered by tags.
func (s *Service) StartTagBasedPractice(ctx context.Context, userID uuid.UUID, tagFilter map[string]interface{}, questionsCount int) (*content.PracticeSession, error) {
	questionIDs, err := s.content.GetQuestionsForPractice(ctx, nil, nil, tagFilter, questionsCount)
	if err != nil {
		return nil, err
	}

	if len(questionIDs) == 0 {
		return nil, errors.New("no questions available for these tags")
	}

	session := &content.PracticeSession{
		UserID:    userID,
		TagFilter: tagFilter,
		Status:    content.PracticeInProgress,
		StartedAt: time.Now(),
	}

	if err := s.content.CreatePracticeSession(ctx, session); err != nil {
		return nil, err
	}

	return session, nil
}

// SubmitPracticeSession submits and grades a practice session.
func (s *Service) SubmitPracticeSession(ctx context.Context, sessionID, userID uuid.UUID, answers []content.ExamAnswer) (*content.PracticeSession, error) {
	session, err := s.content.GetPracticeSession(ctx, sessionID)
	if err != nil {
		return nil, err
	}
	if session.UserID != userID {
		return nil, fiber.NewError(fiber.StatusForbidden, "Not your session")
	}

	if session.Status != content.PracticeInProgress {
		return nil, ErrAttemptAlreadySubmitted
	}

	now := time.Now()
	session.Status = content.PracticeSubmitted
	session.SubmittedAt = &now

	timeSpent := int(now.Sub(session.StartedAt).Seconds())
	session.TimeSpentSeconds = &timeSpent

	// Recompute correctness server-side from the question's options. The
	// client-supplied IsCorrect/PointsEarned are never trusted.
	var totalScore, maxScore float64
	subjectScores := make(map[uuid.UUID]*content.SubjectBreakdown)

	for i := range answers {
		answers[i].AttemptID = sessionID // Using same ID for practice
		answers[i].CreatedAt = time.Now()
		answers[i].IsCorrect = nil
		answers[i].PointsEarned = nil
		answers[i].GradedBy = nil
		answers[i].GradedAt = nil
		if answers[i].ID == uuid.Nil {
			answers[i].ID = uuid.New()
		}

		points := float64(1)
		isCorrect := false
		if q, err := s.content.GetQuestion(ctx, answers[i].QuestionContentID); err == nil {
			correct := make(map[uuid.UUID]bool)
			for _, opt := range q.Options {
				if opt.IsCorrect {
					correct[opt.ID] = true
				}
			}
			if len(answers[i].SelectedOptions) > 0 {
				isCorrect = true
				for _, sel := range answers[i].SelectedOptions {
					if !correct[sel] {
						isCorrect = false
						break
					}
				}
			}
		}
		answers[i].IsCorrect = &isCorrect
		if isCorrect {
			answers[i].PointsEarned = &points
		} else {
			zero := 0.0
			answers[i].PointsEarned = &zero
		}

		// Get question's subject
		qSubjectID, err := s.content.GetQuestionSubject(ctx, answers[i].QuestionContentID)
		if err == nil {
			sb := subjectScores[qSubjectID]
			if sb == nil {
				// Get subject name
				subName, _ := s.content.GetSubjectName(ctx, qSubjectID)
				sb = &content.SubjectBreakdown{
					SubjectID:   qSubjectID,
					SubjectName: subName,
				}
				subjectScores[qSubjectID] = sb
			}
			sb.QuestionsCount++
			maxScore += points
			if isCorrect {
				totalScore += points
				sb.CorrectCount++
				sb.TotalScore += points
			}
			sb.MaxScore += points
		}
	}

	// Build breakdown slice
	breakdown := make([]content.SubjectBreakdown, 0, len(subjectScores))
	for _, sb := range subjectScores {
		if sb.MaxScore > 0 {
			sb.Percentage = sb.TotalScore / sb.MaxScore * 100
		}
		breakdown = append(breakdown, *sb)
	}

	session.TotalScore = &totalScore
	session.MaxScore = &maxScore
	session.SubjectBreakdown = breakdown
	session.GradedAt = &now
	session.Status = content.PracticeGraded

	if err := s.content.UpdatePracticeSession(ctx, session); err != nil {
		return nil, err
	}

	// Batch create answers (reuse exam answers table or create practice answers table)
	// For now, reuse exam answers
	_ = s.content.BatchCreateExamAnswers(ctx, answers)

	return session, nil
}

// GetPracticeSession retrieves a practice session with results.
func (s *Service) GetPracticeSession(ctx context.Context, sessionID, userID uuid.UUID) (*content.PracticeSession, error) {
	session, err := s.content.GetPracticeSession(ctx, sessionID)
	if err != nil {
		return nil, err
	}
	if session.UserID != userID {
		return nil, fiber.NewError(fiber.StatusForbidden, "Not your session")
	}
	return session, nil
}
