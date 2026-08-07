package content

import (
	"context"
	"time"

	"github.com/google/uuid"
)

// ========== BASE CONTENT ==========

type ContentType string

const (
	ContentTypeQuestion  ContentType = "QUESTION"
	ContentTypeMaterial  ContentType = "MATERIAL"
	ContentTypeExam      ContentType = "EXAM"
	ContentTypePractice  ContentType = "PRACTICE_SET"
	ContentTypeFlashcard ContentType = "FLASHCARD"
)

type ContentStatus string

const (
	StatusDraft     ContentStatus = "DRAFT"
	StatusReview    ContentStatus = "REVIEW"
	StatusApproved  ContentStatus = "APPROVED"
	StatusPublished ContentStatus = "PUBLISHED"
	StatusArchived  ContentStatus = "ARCHIVED"
	StatusOngoing   ContentStatus = "ONGOING"
	StatusCompleted ContentStatus = "COMPLETED"
)

type Content struct {
	ID          uuid.UUID              `json:"id"`
	ContentType ContentType            `json:"content_type"`
	GradeID     uuid.UUID              `json:"grade_id"`
	SubjectID   uuid.UUID              `json:"subject_id"`
	ChapterID   *uuid.UUID             `json:"chapter_id,omitempty"`
	TopicID     *uuid.UUID             `json:"topic_id,omitempty"`
	LOID        *uuid.UUID             `json:"lo_id,omitempty"`
	Title       string                 `json:"title"`
	Body        string                 `json:"body"`
	Status      ContentStatus          `json:"status"`
	CreatedBy   uuid.UUID              `json:"created_by"`
	Metadata    map[string]interface{} `json:"metadata,omitempty"`
	PublishedAt *time.Time             `json:"published_at,omitempty"`
	CreatedAt   time.Time              `json:"created_at"`
	UpdatedAt   time.Time              `json:"updated_at"`
}

type CreateContentReq struct {
	ContentType ContentType            `json:"content_type" validate:"required"`
	GradeID     uuid.UUID              `json:"grade_id" validate:"required"`
	SubjectID   uuid.UUID              `json:"subject_id" validate:"required"`
	ChapterID   *uuid.UUID             `json:"chapter_id,omitempty"`
	TopicID     *uuid.UUID             `json:"topic_id,omitempty"`
	LOID        *uuid.UUID             `json:"lo_id,omitempty"`
	Title       string                 `json:"title" validate:"required,max=500"`
	Body        string                 `json:"body"`
	Status      ContentStatus          `json:"status,omitempty"`
	CreatedBy   uuid.UUID              `json:"created_by" validate:"required"`
	Metadata    map[string]interface{} `json:"metadata,omitempty"`
}

type UpdateContentReq struct {
	Title       *string                `json:"title,omitempty" validate:"omitempty,max=500"`
	Body        *string                `json:"body,omitempty"`
	SubjectID   *uuid.UUID             `json:"subject_id,omitempty"`
	ChapterID   *uuid.UUID             `json:"chapter_id,omitempty"`
	TopicID     *uuid.UUID             `json:"topic_id,omitempty"`
	LOID        *uuid.UUID             `json:"lo_id,omitempty"`
	Status      *ContentStatus         `json:"status,omitempty"`
	Metadata    map[string]interface{} `json:"metadata,omitempty"`
	PublishedAt *time.Time             `json:"published_at,omitempty"`
}

// ========== QUESTION SUBTYPE ==========

type QuestionType string

const (
	QuestionTypeSingleChoice   QuestionType = "SINGLE_CHOICE"
	QuestionTypeMultipleChoice QuestionType = "MULTIPLE_CHOICE"
	QuestionTypeTrueFalse      QuestionType = "TRUE_FALSE"
	QuestionTypeEssay          QuestionType = "ESSAY"
	QuestionTypeShortAnswer    QuestionType = "SHORT_ANSWER"
)

type Difficulty string

const (
	DifficultyEasy   Difficulty = "EASY"
	DifficultyMedium Difficulty = "MEDIUM"
	DifficultyHard   Difficulty = "HARD"
)

type BloomLevel string

const (
	BloomC1 BloomLevel = "C1"
	BloomC2 BloomLevel = "C2"
	BloomC3 BloomLevel = "C3"
	BloomC4 BloomLevel = "C4"
	BloomC5 BloomLevel = "C5"
	BloomC6 BloomLevel = "C6"
)

type ThinkingLevel string

const (
	ThinkingLOTS ThinkingLevel = "LOTS"
	ThinkingMOTS ThinkingLevel = "MOTS"
	ThinkingHOTS ThinkingLevel = "HOTS"
)

type QuestionSource string

const (
	SourceManual      QuestionSource = "MANUAL"
	SourceAIGenerated QuestionSource = "AI_GENERATED"
	SourceImported    QuestionSource = "IMPORTED"
)

type Question struct {
	ContentID     uuid.UUID      `json:"content_id"`
	QuestionType  QuestionType   `json:"question_type"`
	Difficulty    Difficulty     `json:"difficulty"`
	BloomLevel    *BloomLevel    `json:"bloom_level,omitempty"`
	ThinkingLevel *ThinkingLevel `json:"thinking_level,omitempty"`
	Language      string         `json:"language"`
	Source        QuestionSource `json:"source"`
	SubTopicID    *uuid.UUID     `json:"subtopic_id,omitempty"`
	StimulusID    *uuid.UUID     `json:"stimulus_id,omitempty"`
	Score         float64        `json:"score"`
	NegativeScore float64        `json:"negative_score"`
	EstimatedTime int            `json:"estimated_time"`
	Explanation   string         `json:"explanation"`
}

type QuestionOption struct {
	ID           uuid.UUID `json:"id"`
	ContentID    uuid.UUID `json:"content_id"`
	Label        string    `json:"label"`
	OptionText   string    `json:"option_text"`
	IsCorrect    bool      `json:"is_correct"`
	Explanation  string    `json:"explanation"`
	DisplayOrder int       `json:"display_order"`
	CreatedAt    time.Time `json:"created_at"`
}

type CreateQuestionReq struct {
	CreateContentReq
	QuestionType  QuestionType              `json:"question_type" validate:"required"`
	Difficulty    Difficulty                `json:"difficulty" validate:"required"`
	BloomLevel    *BloomLevel               `json:"bloom_level,omitempty"`
	ThinkingLevel *ThinkingLevel            `json:"thinking_level,omitempty"`
	Language      string                    `json:"language" validate:"required,len=2"`
	Source        QuestionSource            `json:"source" validate:"required"`
	SubTopicID    *uuid.UUID                `json:"subtopic_id,omitempty"`
	StimulusID    *uuid.UUID                `json:"stimulus_id,omitempty"`
	Score         float64                   `json:"score" validate:"required,min=0"`
	NegativeScore float64                   `json:"negative_score" validate:"min=0"`
	EstimatedTime int                       `json:"estimated_time" validate:"required,min=1"`
	Explanation   string                    `json:"explanation"`
	Options       []CreateQuestionOptionReq `json:"options" validate:"required,min=2,max=6,dive"`
}

type CreateQuestionOptionReq struct {
	Label        string `json:"label" validate:"required,len=1"`
	OptionText   string `json:"option_text" validate:"required"`
	IsCorrect    bool   `json:"is_correct"`
	Explanation  string `json:"explanation"`
	DisplayOrder int    `json:"display_order"`
}

type QuestionFull struct {
	Content
	Question
	Options []QuestionOption `json:"options"`
}

// ========== MATERIAL SUBTYPE ==========

type MaterialFormat string

const (
	MaterialFormatText        MaterialFormat = "TEXT"
	MaterialFormatRichText    MaterialFormat = "RICH_TEXT"
	MaterialFormatMarkdown    MaterialFormat = "MARKDOWN"
	MaterialFormatVideo       MaterialFormat = "VIDEO"
	MaterialFormatPDF         MaterialFormat = "PDF"
	MaterialFormatAudio       MaterialFormat = "AUDIO"
	MaterialFormatInteractive MaterialFormat = "INTERACTIVE"
)

type Material struct {
	ContentID         uuid.UUID      `json:"content_id"`
	ContentFormat     MaterialFormat `json:"content_format"`
	EstimatedDuration *int           `json:"estimated_duration,omitempty"`
	ReadCount         int            `json:"read_count"`
	IsPreview         bool           `json:"is_preview"`
	Prerequisites     []uuid.UUID    `json:"prerequisites,omitempty"`
}

type CreateMaterialReq struct {
	CreateContentReq
	ContentFormat     MaterialFormat `json:"content_format" validate:"required"`
	EstimatedDuration *int           `json:"estimated_duration,omitempty"`
	IsPreview         bool           `json:"is_preview"`
	Prerequisites     []uuid.UUID    `json:"prerequisites,omitempty"`
}

type MaterialFull struct {
	Content
	Material
	SubjectName string `json:"subject_name,omitempty"`
	ChapterName string `json:"chapter_name,omitempty"`
}

// LearningProgress for material tracking
type LearningProgress struct {
	ID           uuid.UUID `json:"id"`
	UserID       uuid.UUID `json:"user_id"`
	MaterialID   uuid.UUID `json:"material_id"`
	Progress     float64   `json:"progress"`
	Completed    bool      `json:"completed"`
	LastPosition *string   `json:"last_position,omitempty"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}

// ========== EXAM SUBTYPE ==========

type Exam struct {
	ContentID        uuid.UUID              `json:"content_id"`
	Description      string                 `json:"description"`
	DurationMinutes  int                    `json:"duration_minutes"`
	PassingScore     float64                `json:"passing_score"`
	ShuffleQuestions bool                   `json:"shuffle_questions"`
	ShuffleOptions   bool                   `json:"shuffle_options"`
	MaxAttempts      int                    `json:"max_attempts"`
	NegativeMarking  float64                `json:"negative_marking"`
	StartTime        *time.Time             `json:"start_time,omitempty"`
	EndTime          *time.Time             `json:"end_time,omitempty"`
	Blueprint        map[string]interface{} `json:"blueprint,omitempty"`
}

type CreateExamReq struct {
	CreateContentReq
	Description      string                 `json:"description"`
	DurationMinutes  int                    `json:"duration_minutes" validate:"required,min=1"`
	PassingScore     float64                `json:"passing_score" validate:"min=0,max=100"`
	ShuffleQuestions bool                   `json:"shuffle_questions"`
	ShuffleOptions   bool                   `json:"shuffle_options"`
	MaxAttempts      int                    `json:"max_attempts" validate:"min=1"`
	StartTime        *time.Time             `json:"start_time,omitempty"`
	EndTime          *time.Time             `json:"end_time,omitempty"`
	Blueprint        map[string]interface{} `json:"blueprint,omitempty"`
}

type ExamQuestion struct {
	ID                uuid.UUID  `json:"id"`
	ExamContentID     uuid.UUID  `json:"exam_content_id"`
	QuestionContentID uuid.UUID  `json:"question_content_id"`
	SubjectID         *uuid.UUID `json:"subject_id,omitempty"`
	DisplayOrder      int        `json:"display_order"`
	Points            float64    `json:"points"`
	CreatedAt         time.Time  `json:"created_at"`
}

type ExamBlueprint struct {
	ID             uuid.UUID `json:"id"`
	ExamContentID  uuid.UUID `json:"exam_content_id"`
	EasyCount      int       `json:"easy_count"`
	MediumCount    int       `json:"medium_count"`
	HardCount      int       `json:"hard_count"`
	TotalQuestions int       `json:"total_questions"`
	CreatedAt      time.Time `json:"created_at"`
}

type ExamParticipant struct {
	ID            uuid.UUID `json:"id"`
	ExamContentID uuid.UUID `json:"exam_content_id"`
	UserID        uuid.UUID `json:"user_id"`
	CreatedAt     time.Time `json:"created_at"`
}

type ExamAttemptStatus string

const (
	AttemptInProgress ExamAttemptStatus = "IN_PROGRESS"
	AttemptSubmitted  ExamAttemptStatus = "SUBMITTED"
	AttemptGraded     ExamAttemptStatus = "GRADED"
	AttemptExpired    ExamAttemptStatus = "EXPIRED"
)

type ExamAttempt struct {
	ID               uuid.UUID         `json:"id"`
	ExamContentID    uuid.UUID         `json:"exam_content_id"`
	UserID           uuid.UUID         `json:"user_id"`
	AttemptNumber    int               `json:"attempt_number"`
	Status           ExamAttemptStatus `json:"status"`
	StartedAt        time.Time         `json:"started_at"`
	SubmittedAt      *time.Time        `json:"submitted_at,omitempty"`
	GradedAt         *time.Time        `json:"graded_at,omitempty"`
	TotalScore       *float64          `json:"total_score,omitempty"`
	MaxScore         *float64          `json:"max_score,omitempty"`
	TimeSpentSeconds *int              `json:"time_spent_seconds,omitempty"`
	CreatedAt        time.Time         `json:"created_at"`
}

type ExamAnswer struct {
	ID                uuid.UUID   `json:"id"`
	AttemptID         uuid.UUID   `json:"attempt_id"`
	QuestionContentID uuid.UUID   `json:"question_content_id"`
	SelectedOptions   []uuid.UUID `json:"selected_options,omitempty"`
	TextAnswer        string      `json:"text_answer"`
	IsCorrect         *bool       `json:"is_correct,omitempty"`
	PointsEarned      *float64    `json:"points_earned,omitempty"`
	GradedBy          *uuid.UUID  `json:"graded_by,omitempty"`
	GradedAt          *time.Time  `json:"graded_at,omitempty"`
	CreatedAt         time.Time   `json:"created_at"`
}

type ExamFull struct {
	Content
	Exam
	Questions    []ExamQuestion    `json:"questions,omitempty"`
	Blueprint    *ExamBlueprint    `json:"blueprint,omitempty"`
	Participants []ExamParticipant `json:"participants,omitempty"`
	Attempts     []ExamAttempt     `json:"attempts,omitempty"`
}

// ========== QUESTION POOL ==========

type QuestionPool struct {
	ID                  uuid.UUID              `json:"id"`
	ExamContentID       *uuid.UUID             `json:"exam_content_id,omitempty"`
	SubjectID           uuid.UUID              `json:"subject_id"`
	GradeIDs            []uuid.UUID            `json:"grade_ids,omitempty"`
	ChapterIDs          []uuid.UUID            `json:"chapter_ids,omitempty"`
	EasyPct             int                    `json:"easy_pct"`
	MediumPct           int                    `json:"medium_pct"`
	HardPct             int                    `json:"hard_pct"`
	TotalPoolSize       int                    `json:"total_pool_size"`
	QuestionsPerStudent int                    `json:"questions_per_student"`
	ShuffleQuestions    bool                   `json:"shuffle_questions"`
	ShuffleOptions      bool                   `json:"shuffle_options"`
	TagFilters          map[string]interface{} `json:"tag_filters,omitempty"`
	CreatedAt           time.Time              `json:"created_at"`
	UpdatedAt           time.Time              `json:"updated_at"`
}

// ========== SUBJECT BLUEPRINT (for mixed-subject exams) ==========

type ExamSubjectBlueprint struct {
	ID             uuid.UUID `json:"id"`
	ExamContentID  uuid.UUID `json:"exam_content_id"`
	SubjectID      uuid.UUID `json:"subject_id"`
	EasyCount      int       `json:"easy_count"`
	MediumCount    int       `json:"medium_count"`
	HardCount      int       `json:"hard_count"`
	TotalQuestions int       `json:"total_questions"`
	CreatedAt      time.Time `json:"created_at"`
}

// ========== PRACTICE SETS (Post-material practice) ==========

type PracticeSet struct {
	ID                uuid.UUID `json:"id"`
	ContentID         uuid.UUID `json:"content_id"`          // The material content
	PracticeContentID uuid.UUID `json:"practice_content_id"` // Practice exam content
	QuestionsCount    int       `json:"questions_count"`
	TimeLimitSeconds  int       `json:"time_limit_seconds"`
	CreatedAt         time.Time `json:"created_at"`
}

type CreatePracticeSetReq struct {
	ContentID         uuid.UUID `json:"content_id" validate:"required"`
	PracticeContentID uuid.UUID `json:"practice_content_id" validate:"required"`
	QuestionsCount    int       `json:"questions_count" validate:"min=1"`
	TimeLimitSeconds  int       `json:"time_limit_seconds" validate:"min=30"`
}

type PracticeSessionStatus string

const (
	PracticeInProgress PracticeSessionStatus = "IN_PROGRESS"
	PracticeSubmitted  PracticeSessionStatus = "SUBMITTED"
	PracticeGraded     PracticeSessionStatus = "GRADED"
	PracticeExpired    PracticeSessionStatus = "EXPIRED"
)

type SubjectBreakdown struct {
	SubjectID      uuid.UUID `json:"subject_id"`
	SubjectName    string    `json:"subject_name"`
	QuestionsCount int       `json:"questions_count"`
	CorrectCount   int       `json:"correct_count"`
	TotalScore     float64   `json:"total_score"`
	MaxScore       float64   `json:"max_score"`
	Percentage     float64   `json:"percentage"`
}

type PracticeSession struct {
	ID               uuid.UUID              `json:"id"`
	UserID           uuid.UUID              `json:"user_id"`
	PracticeSetID    *uuid.UUID             `json:"practice_set_id,omitempty"`
	SubjectID        *uuid.UUID             `json:"subject_id,omitempty"`
	GradeID          *uuid.UUID             `json:"grade_id,omitempty"`
	TagFilter        map[string]interface{} `json:"tag_filter,omitempty"`
	Status           PracticeSessionStatus  `json:"status"`
	StartedAt        time.Time              `json:"started_at"`
	SubmittedAt      *time.Time             `json:"submitted_at,omitempty"`
	GradedAt         *time.Time             `json:"graded_at,omitempty"`
	TotalScore       *float64               `json:"total_score,omitempty"`
	MaxScore         *float64               `json:"max_score,omitempty"`
	TimeSpentSeconds *int                   `json:"time_spent_seconds,omitempty"`
	SubjectBreakdown []SubjectBreakdown     `json:"subject_breakdown,omitempty"`
	CreatedAt        time.Time              `json:"created_at"`
}

// ========== EXAM ANALYTICS ==========

type ExamAnalytics struct {
	TotalParticipants int     `json:"total_participants"`
	TotalStarted      int     `json:"total_started"`
	TotalFinished     int     `json:"total_finished"`
	AverageScore      float64 `json:"average_score"`
	HighestScore      float64 `json:"highest_score"`
	LowestScore       float64 `json:"lowest_score"`
	PassRate          float64 `json:"pass_rate"`
}

// ========== REPOSITORY INTERFACE ==========

type Repository interface {
	// Base content
	CreateContent(ctx context.Context, c *Content) error
	GetContent(ctx context.Context, id uuid.UUID) (*Content, error)
	UpdateContent(ctx context.Context, id uuid.UUID, req UpdateContentReq) error
	DeleteContent(ctx context.Context, id uuid.UUID) error
	ListContent(ctx context.Context, filter ContentFilter) ([]Content, int, error)
	GetContentByGrade(ctx context.Context, gradeID uuid.UUID, contentType ContentType, limit, offset int) ([]Content, int, error)

	// Questions
	CreateQuestion(ctx context.Context, q *Question, opts []QuestionOption) error
	GetQuestion(ctx context.Context, contentID uuid.UUID) (*QuestionFull, error)
	UpdateQuestion(ctx context.Context, contentID uuid.UUID, q *Question) error
	DeleteQuestion(ctx context.Context, contentID uuid.UUID) error
	ListQuestions(ctx context.Context, filter QuestionFilter) ([]QuestionFull, int, error)
	ReplaceOptions(ctx context.Context, contentID uuid.UUID, opts []QuestionOption) error

	// Materials
	CreateMaterial(ctx context.Context, m *Material) error
	GetMaterial(ctx context.Context, contentID uuid.UUID) (*MaterialFull, error)
	UpdateMaterial(ctx context.Context, contentID uuid.UUID, m *Material) error
	DeleteMaterial(ctx context.Context, contentID uuid.UUID) error
	ListMaterials(ctx context.Context, filter MaterialFilter) ([]MaterialFull, int, error)
	IncrementReadCount(ctx context.Context, contentID uuid.UUID) error

	// Learning progress (for materials)
	UpsertProgress(ctx context.Context, lp *LearningProgress) error
	GetProgress(ctx context.Context, userID, materialID uuid.UUID) (*LearningProgress, error)
	ListProgressByUser(ctx context.Context, userID uuid.UUID, limit, offset int) ([]LearningProgress, int, error)

	// Exams
	CreateExam(ctx context.Context, e *Exam) error
	GetExam(ctx context.Context, contentID uuid.UUID) (*ExamFull, error)
	UpdateExam(ctx context.Context, contentID uuid.UUID, e *Exam) error
	DeleteExam(ctx context.Context, contentID uuid.UUID) error
	ListExams(ctx context.Context, filter ExamFilter) ([]ExamFull, int, error)

	// Exam questions
	AddExamQuestion(ctx context.Context, eq *ExamQuestion) error
	RemoveExamQuestion(ctx context.Context, examContentID, questionContentID uuid.UUID) error
	GetExamQuestions(ctx context.Context, examContentID uuid.UUID) ([]ExamQuestion, error)
	ReorderExamQuestions(ctx context.Context, examContentID uuid.UUID, questionIDs []uuid.UUID) error

	// Exam blueprints
	CreateExamBlueprint(ctx context.Context, eb *ExamBlueprint) error
	GetExamBlueprint(ctx context.Context, examContentID uuid.UUID) (*ExamBlueprint, error)

	// Exam subject blueprints
	CreateExamSubjectBlueprint(ctx context.Context, esb *ExamSubjectBlueprint) error
	GetExamSubjectBlueprints(ctx context.Context, examContentID uuid.UUID) ([]ExamSubjectBlueprint, error)
	DeleteExamSubjectBlueprint(ctx context.Context, examContentID, subjectID uuid.UUID) error

	// Exam participants
	AddExamParticipant(ctx context.Context, ep *ExamParticipant) error
	RemoveExamParticipant(ctx context.Context, examContentID, userID uuid.UUID) error
	GetExamParticipants(ctx context.Context, examContentID uuid.UUID) ([]ExamParticipant, error)

	// Exam attempts
	CreateExamAttempt(ctx context.Context, ea *ExamAttempt) error
	GetExamAttempt(ctx context.Context, attemptID uuid.UUID) (*ExamAttempt, error)
	UpdateExamAttempt(ctx context.Context, ea *ExamAttempt) error
	GetUserExamAttempts(ctx context.Context, examContentID, userID uuid.UUID) ([]ExamAttempt, error)

	// Exam answers
	CreateExamAnswer(ctx context.Context, ea *ExamAnswer) error
	GetExamAnswers(ctx context.Context, attemptID uuid.UUID) ([]ExamAnswer, error)
	BatchCreateExamAnswers(ctx context.Context, answers []ExamAnswer) error
	UpdateExamAnswer(ctx context.Context, ea *ExamAnswer) error

	// Question pools
	CreateQuestionPool(ctx context.Context, qp *QuestionPool) error
	GetQuestionPool(ctx context.Context, examContentID uuid.UUID) (*QuestionPool, error)
	UpdateQuestionPool(ctx context.Context, qp *QuestionPool) error
	DeleteQuestionPool(ctx context.Context, id uuid.UUID) error
	GetQuestionsForPool(ctx context.Context, pool *QuestionPool) ([]uuid.UUID, error)

	// Exam session questions
	AddSessionQuestions(ctx context.Context, sessionID uuid.UUID, questionIDs []uuid.UUID, shuffleQuestions, shuffleOptions bool) error

	// Exam analytics
	GetExamAnalytics(ctx context.Context, examContentID uuid.UUID) (*ExamAnalytics, error)

	// Practice sets
	CreatePracticeSet(ctx context.Context, ps *PracticeSet) error
	GetPracticeSet(ctx context.Context, contentID uuid.UUID) (*PracticeSet, error)
	GetPracticeSetByPracticeContent(ctx context.Context, practiceContentID uuid.UUID) (*PracticeSet, error)
	DeletePracticeSet(ctx context.Context, contentID uuid.UUID) error

	// Practice sessions
	CreatePracticeSession(ctx context.Context, ps *PracticeSession) error
	GetPracticeSession(ctx context.Context, sessionID uuid.UUID) (*PracticeSession, error)
	UpdatePracticeSession(ctx context.Context, ps *PracticeSession) error
	GetUserPracticeSessions(ctx context.Context, userID uuid.UUID, limit, offset int) ([]PracticeSession, int, error)

	// Practice question selection
	GetQuestionsForPractice(ctx context.Context, subjectID, gradeID *uuid.UUID, tagFilter map[string]interface{}, count int) ([]uuid.UUID, error)
	GetQuestionsForMaterialPractice(ctx context.Context, materialContentID uuid.UUID, count int) ([]uuid.UUID, error)

	// Session questions with subject (for per-subject scoring)
	AddSessionQuestionsWithSubject(ctx context.Context, sessionID uuid.UUID, questionIDs []uuid.UUID, shuffleQuestions, shuffleOptions bool) error

	// Get subject name by ID (for practice scoring)
	GetSubjectName(ctx context.Context, subjectID uuid.UUID) (string, error)

	// Get question's subject ID
	GetQuestionSubject(ctx context.Context, questionContentID uuid.UUID) (uuid.UUID, error)

	// User helpers
	GetUserGradeID(ctx context.Context, userID uuid.UUID) (*uuid.UUID, error)

	// Name-based resolvers for bulk import
	FindSubjectIDByName(ctx context.Context, name string) (*uuid.UUID, error)
	FindGradeIDByName(ctx context.Context, name string) (*uuid.UUID, error)
}

// ========== FILTERS ==========

type ContentFilter struct {
	ContentType *ContentType   `json:"content_type,omitempty"`
	GradeID     *uuid.UUID     `json:"grade_id,omitempty"`
	SubjectID   *uuid.UUID     `json:"subject_id,omitempty"`
	Status      *ContentStatus `json:"status,omitempty"`
	CreatedBy   *uuid.UUID     `json:"created_by,omitempty"`
	Search      string         `json:"search,omitempty"`
	Limit       int            `json:"limit"`
	Offset      int            `json:"offset"`
}

type QuestionFilter struct {
	ContentFilter
	Difficulty    *Difficulty    `json:"difficulty,omitempty"`
	BloomLevel    *BloomLevel    `json:"bloom_level,omitempty"`
	ThinkingLevel *ThinkingLevel `json:"thinking_level,omitempty"`
	QuestionType  *QuestionType  `json:"question_type,omitempty"`
	TopicID       *uuid.UUID     `json:"topic_id,omitempty"`
}

type MaterialFilter struct {
	ContentFilter
	ContentFormat *MaterialFormat `json:"content_format,omitempty"`
}

type ExamFilter struct {
	ContentFilter
	StartTime *time.Time `json:"start_time,omitempty"`
	EndTime   *time.Time `json:"end_time,omitempty"`
}
