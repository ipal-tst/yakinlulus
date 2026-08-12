package cbt_engine

import (
	"context"
	"testing"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"yakinlulus.id/backend/internal/content"
)

// mockContentRepo implements content.Repository for tests, embedding the real
// interface so only the methods used by the service need overrides.
type mockContentRepo struct {
	content.Repository

	attempt    *content.ExamAttempt
	answers    []content.ExamAnswer
	questions  map[uuid.UUID]*content.QuestionFull
	examQ      []content.ExamQuestion
	updatedAns []content.ExamAnswer
	updatedAt  *content.ExamAttempt

	practiceSession   *content.PracticeSession
	updatedPractice   *content.PracticeSession
	qSubjectID        uuid.UUID
}

func (m *mockContentRepo) GetExamAttempt(ctx context.Context, attemptID uuid.UUID) (*content.ExamAttempt, error) {
	return m.attempt, nil
}

func (m *mockContentRepo) GetExamAnswers(ctx context.Context, attemptID uuid.UUID) ([]content.ExamAnswer, error) {
	return m.answers, nil
}

func (m *mockContentRepo) GetExamQuestions(ctx context.Context, examContentID uuid.UUID) ([]content.ExamQuestion, error) {
	return m.examQ, nil
}

func (m *mockContentRepo) GetQuestion(ctx context.Context, contentID uuid.UUID) (*content.QuestionFull, error) {
	return m.questions[contentID], nil
}

func (m *mockContentRepo) UpdateExamAttempt(ctx context.Context, ea *content.ExamAttempt) error {
	m.updatedAt = ea
	return nil
}

func (m *mockContentRepo) UpdateExamAnswer(ctx context.Context, ea *content.ExamAnswer) error {
	m.updatedAns = append(m.updatedAns, *ea)
	return nil
}

func (m *mockContentRepo) BatchCreateExamAnswers(ctx context.Context, answers []content.ExamAnswer) error {
	m.updatedAns = answers
	return nil
}

func (m *mockContentRepo) GetPracticeSession(ctx context.Context, sessionID uuid.UUID) (*content.PracticeSession, error) {
	return m.practiceSession, nil
}

func (m *mockContentRepo) IsExamParticipant(ctx context.Context, examContentID, userID uuid.UUID) (bool, error) {
	if m.attempt != nil && m.attempt.UserID == userID {
		return true, nil
	}
	return false, nil
}

func (m *mockContentRepo) GetExam(ctx context.Context, contentID uuid.UUID) (*content.ExamFull, error) {
	return &content.ExamFull{
		Content: content.Content{
			ID:    contentID,
			Title: "Test Exam",
		},
	}, nil
}

func (m *mockContentRepo) UpdatePracticeSession(ctx context.Context, ps *content.PracticeSession) error {
	m.updatedPractice = ps
	return nil
}

func (m *mockContentRepo) GetQuestionSubject(ctx context.Context, questionContentID uuid.UUID) (uuid.UUID, error) {
	if m.qSubjectID != uuid.Nil {
		return m.qSubjectID, nil
	}
	return uuid.Nil, nil
}

func (m *mockContentRepo) GetSubjectName(ctx context.Context, subjectID uuid.UUID) (string, error) {
	return "Matematika", nil
}

func TestSubmitPracticeSessionOwnershipAndRecompute(t *testing.T) {
	owner := uuid.New()
	intruder := uuid.New()
	sessionID := uuid.New()
	q1ID := uuid.New()
	correctOpt := uuid.New()
	wrongOpt := uuid.New()

	started := time.Now()
	mock := &mockContentRepo{
		practiceSession: &content.PracticeSession{
			ID:        sessionID,
			UserID:    owner,
			Status:    content.PracticeInProgress,
			StartedAt: started,
		},
		questions: map[uuid.UUID]*content.QuestionFull{
			q1ID: {
				Options: []content.QuestionOption{
					{ID: correctOpt, IsCorrect: true},
					{ID: wrongOpt, IsCorrect: false},
				},
			},
		},
	}

	svc := NewService(mock)

	// Intruder submits on someone else's session -> 403.
	clientIsCorrect := true
	clientPoints := 100.0
	_, err := svc.SubmitPracticeSession(context.Background(), sessionID, intruder, []content.ExamAnswer{
		{
			QuestionContentID: q1ID,
			SelectedOptions:   []uuid.UUID{wrongOpt},
			IsCorrect:         &clientIsCorrect,
			PointsEarned:      &clientPoints,
		},
	})
	assert.Error(t, err)
	fe, ok := err.(*fiber.Error)
	assert.True(t, ok)
	assert.Equal(t, fiber.StatusForbidden, fe.Code)

	// Owner submits; wrong option chosen -> recomputed to 0 points, not 100.
	_, err = svc.SubmitPracticeSession(context.Background(), sessionID, owner, []content.ExamAnswer{
		{
			QuestionContentID: q1ID,
			SelectedOptions:   []uuid.UUID{wrongOpt},
			IsCorrect:         &clientIsCorrect,
			PointsEarned:      &clientPoints,
		},
	})
	assert.NoError(t, err)

	require := assert.New(t)
	require.NotNil(mock.updatedPractice)
	require.Equal(content.PracticeGraded, mock.updatedPractice.Status)
	require.NotNil(mock.updatedPractice.TotalScore)
	require.Equal(0.0, *mock.updatedPractice.TotalScore)
	require.NotNil(mock.updatedPractice.MaxScore)
	require.Equal(1.0, *mock.updatedPractice.MaxScore)
}

func TestGetPracticeSessionOwnership(t *testing.T) {
	owner := uuid.New()
	intruder := uuid.New()
	sessionID := uuid.New()

	mock := &mockContentRepo{
		practiceSession: &content.PracticeSession{
			ID:     sessionID,
			UserID: owner,
			Status: content.PracticeGraded,
		},
	}

	svc := NewService(mock)
	_, err := svc.GetPracticeSession(context.Background(), sessionID, intruder)
	assert.Error(t, err)
	fe, ok := err.(*fiber.Error)
	assert.True(t, ok)
	assert.Equal(t, fiber.StatusForbidden, fe.Code)

	s, err := svc.GetPracticeSession(context.Background(), sessionID, owner)
	assert.NoError(t, err)
	assert.Equal(t, sessionID, s.ID)
}

func TestGradeAttemptRecomputesCorrectnessServerSide(t *testing.T) {
	userID := uuid.New()
	examID := uuid.New()
	attemptID := uuid.New()

	q1ID := uuid.New()
	correctOpt := uuid.New()
	wrongOpt := uuid.New()

	// Client fraudulently claims the wrong answer is correct and awards points.
	clientIsCorrect := true
	clientPoints := 5.0
	answers := []content.ExamAnswer{
		{
			ID:                uuid.New(),
			AttemptID:         attemptID,
			QuestionContentID: q1ID,
			SelectedOptions:   []uuid.UUID{wrongOpt},
			IsCorrect:         &clientIsCorrect,
			PointsEarned:      &clientPoints,
		},
	}

	mock := &mockContentRepo{
		attempt: &content.ExamAttempt{
			ID:            attemptID,
			ExamContentID: examID,
			UserID:        userID,
			Status:        content.AttemptSubmitted,
		},
		answers: answers,
		examQ: []content.ExamQuestion{
			{QuestionContentID: q1ID, Points: 5},
		},
		questions: map[uuid.UUID]*content.QuestionFull{
			q1ID: {
				Options: []content.QuestionOption{
					{ID: correctOpt, IsCorrect: true},
					{ID: wrongOpt, IsCorrect: false},
				},
			},
		},
	}

	svc := NewService(mock)
	err := svc.GradeAttempt(context.Background(), attemptID, userID)
	assert.NoError(t, err)

	require := assert.New(t)
	require.NotNil(mock.updatedAt)
	require.Equal(content.AttemptGraded, mock.updatedAt.Status)

	// Persisted answer must be recomputed: wrong option selected => not correct, 0 points.
	require.Len(mock.updatedAns, 1)
	persisted := mock.updatedAns[0]
	require.NotNil(persisted.IsCorrect)
	require.False(*persisted.IsCorrect)
	require.NotNil(persisted.PointsEarned)
	require.Equal(0.0, *persisted.PointsEarned)

	require.NotNil(mock.updatedAt.TotalScore)
	require.Equal(0.0, *mock.updatedAt.TotalScore)
}

func TestGradeAttemptGrantsPointsForCorrectSelection(t *testing.T) {
	userID := uuid.New()
	examID := uuid.New()
	attemptID := uuid.New()

	q1ID := uuid.New()
	correctOpt := uuid.New()

	// Client claims wrong (but should not matter) - server recomputes.
	clientIsCorrect := false
	answers := []content.ExamAnswer{
		{
			ID:                uuid.New(),
			AttemptID:         attemptID,
			QuestionContentID: q1ID,
			SelectedOptions:   []uuid.UUID{correctOpt},
			IsCorrect:         &clientIsCorrect,
		},
	}

	mock := &mockContentRepo{
		attempt: &content.ExamAttempt{
			ID:            attemptID,
			ExamContentID: examID,
			UserID:        userID,
			Status:        content.AttemptSubmitted,
		},
		answers: answers,
		examQ: []content.ExamQuestion{
			{QuestionContentID: q1ID, Points: 5},
		},
		questions: map[uuid.UUID]*content.QuestionFull{
			q1ID: {
				Options: []content.QuestionOption{
					{ID: correctOpt, IsCorrect: true},
				},
			},
		},
	}

	svc := NewService(mock)
	err := svc.GradeAttempt(context.Background(), attemptID, userID)
	assert.NoError(t, err)

	require := assert.New(t)
	require.NotNil(mock.updatedAns[0].IsCorrect)
	require.True(*mock.updatedAns[0].IsCorrect)
	require.NotNil(mock.updatedAns[0].PointsEarned)
	require.Equal(5.0, *mock.updatedAns[0].PointsEarned)
	require.NotNil(mock.updatedAt.TotalScore)
	require.Equal(5.0, *mock.updatedAt.TotalScore)
}

func TestSubmitAttemptStripsClientGradingFields(t *testing.T) {
	userID := uuid.New()
	examID := uuid.New()
	attemptID := uuid.New()
	started := time.Now()

	clientIsCorrect := true
	clientPoints := 100.0
	gb := userID
	gt := started

	mock := &mockContentRepo{
		attempt: &content.ExamAttempt{
			ID:            attemptID,
			ExamContentID: examID,
			UserID:        userID,
			Status:        content.AttemptInProgress,
			StartedAt:     started,
		},
	}

	svc := NewService(mock)
	err := svc.SubmitAttempt(context.Background(), attemptID, userID, []content.ExamAnswer{
		{
			QuestionContentID: uuid.New(),
			SelectedOptions:   []uuid.UUID{uuid.New()},
			IsCorrect:         &clientIsCorrect,
			PointsEarned:      &clientPoints,
			GradedBy:          &gb,
			GradedAt:          &gt,
		},
	})
	assert.NoError(t, err)

	require := assert.New(t)
	require.Len(mock.updatedAns, 1)
	stored := mock.updatedAns[0]
	require.Nil(stored.IsCorrect)
	require.Nil(stored.PointsEarned)
	require.Nil(stored.GradedBy)
	require.Nil(stored.GradedAt)
	require.Equal(content.AttemptSubmitted, mock.updatedAt.Status)
}

func TestGetExamForStudentOwnership(t *testing.T) {
	owner := uuid.New()
	intruder := uuid.New()
	examID := uuid.New()

	mock := &mockContentRepo{
		attempt: &content.ExamAttempt{
			UserID: owner,
		},
	}

	svc := NewService(mock)

	// Intruder gets someone else's exam -> 403
	_, err := svc.GetExamForStudent(context.Background(), examID, intruder)
	assert.Error(t, err)
	fe, ok := err.(*fiber.Error)
	assert.True(t, ok)
	assert.Equal(t, fiber.StatusForbidden, fe.Code)

	// Owner gets exam -> Success
	exam, err := svc.GetExamForStudent(context.Background(), examID, owner)
	assert.NoError(t, err)
	assert.Equal(t, examID, exam.Content.ID)
}
