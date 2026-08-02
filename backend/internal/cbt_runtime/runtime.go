package cbt_runtime

import (
	"context"
	"encoding/json"
	"math/rand"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"yakinlulus.id/backend/internal/middleware"
	"yakinlulus.id/backend/internal/shared"
)

// --- Domain ---

type ExamSession struct {
	ID               uuid.UUID  `json:"id"`
	ExamID           uuid.UUID  `json:"exam_id"`
	UserID           uuid.UUID  `json:"user_id"`
	Status           string     `json:"status"`
	StartedAt        time.Time  `json:"started_at"`
	FinishedAt       *time.Time `json:"finished_at,omitempty"`
	RemainingSeconds *int       `json:"remaining_seconds,omitempty"`
	ViolationScore   int        `json:"violation_score"`
	IsTerminated     bool       `json:"is_terminated"`
	FinalScore       *float64   `json:"final_score,omitempty"`
}

type ExamAnswer struct {
	ID               uuid.UUID  `json:"id"`
	SessionID        uuid.UUID  `json:"session_id"`
	ExamQuestionID   uuid.UUID  `json:"exam_question_id"`
	SelectedOptionID *uuid.UUID `json:"selected_option_id,omitempty"`
	IsDoubtful       bool       `json:"is_doubtful"`
	IsCorrect        *bool      `json:"is_correct,omitempty"`
	PointsEarned     float64    `json:"points_earned"`
	QuestionContent  string     `json:"question_content,omitempty"`
	Difficulty       string     `json:"difficulty,omitempty"`
}

type Violation struct {
	ID            uuid.UUID `json:"id"`
	SessionID     uuid.UUID `json:"session_id"`
	ViolationType string    `json:"violation_type"`
	Details       string    `json:"details,omitempty"`
	CreatedAt     time.Time `json:"created_at"`
}

type QuestionPool struct {
	ID                  uuid.UUID   `json:"id"`
	ExamID              uuid.UUID   `json:"exam_id"`
	SubjectID           uuid.UUID   `json:"subject_id"`
	ChapterIDs          []uuid.UUID `json:"chapter_ids,omitempty"`
	EasyPct             int         `json:"easy_pct"`
	MediumPct           int         `json:"medium_pct"`
	HardPct             int         `json:"hard_pct"`
	TotalPoolSize       int         `json:"total_pool_size"`
	QuestionsPerStudent int         `json:"questions_per_student"`
	ShuffleQuestions    bool        `json:"shuffle_questions"`
	ShuffleOptions      bool        `json:"shuffle_options"`
	CreatedAt           time.Time   `json:"created_at"`
	UpdatedAt           time.Time   `json:"updated_at"`
}

// --- Repository ---

type Repository struct {
	pool *pgxpool.Pool
}

func NewRepository(pool *pgxpool.Pool) *Repository {
	return &Repository{pool: pool}
}

func (r *Repository) CreateSession(ctx context.Context, s *ExamSession, examDurationMinutes int) error {
	s.ID = uuid.New()
	s.Status = "ACTIVE"
	s.StartedAt = time.Now()
	rem := examDurationMinutes * 60
	s.RemainingSeconds = &rem
	s.ViolationScore = 0
	s.IsTerminated = false
	_, err := r.pool.Exec(ctx,
		`INSERT INTO exam_sessions (id, exam_id, user_id, status, started_at, remaining_seconds, violation_score, is_terminated)
		 VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
		s.ID, s.ExamID, s.UserID, s.Status, s.StartedAt, *s.RemainingSeconds, s.ViolationScore, s.IsTerminated)
	return err
}

func (r *Repository) FindSession(ctx context.Context, sessionID uuid.UUID) (*ExamSession, error) {
	s := &ExamSession{}
	err := r.pool.QueryRow(ctx,
		`SELECT id, exam_id, user_id, status, started_at, finished_at, remaining_seconds, violation_score, is_terminated, final_score
		 FROM exam_sessions WHERE id = $1`, sessionID,
	).Scan(&s.ID, &s.ExamID, &s.UserID, &s.Status, &s.StartedAt, &s.FinishedAt,
		&s.RemainingSeconds, &s.ViolationScore, &s.IsTerminated, &s.FinalScore)
	if err != nil {
		return nil, err
	}
	return s, nil
}

func (r *Repository) FindSessionByExamUser(ctx context.Context, examID, userID uuid.UUID) (*ExamSession, error) {
	s := &ExamSession{}
	err := r.pool.QueryRow(ctx,
		`SELECT id, exam_id, user_id, status, started_at, finished_at, remaining_seconds, violation_score, is_terminated, final_score
		 FROM exam_sessions WHERE exam_id = $1 AND user_id = $2 AND status = 'ACTIVE'`, examID, userID,
	).Scan(&s.ID, &s.ExamID, &s.UserID, &s.Status, &s.StartedAt, &s.FinishedAt,
		&s.RemainingSeconds, &s.ViolationScore, &s.IsTerminated, &s.FinalScore)
	if err != nil {
		return nil, err
	}
	return s, nil
}

func (r *Repository) ListUserSessions(ctx context.Context, userID uuid.UUID) ([]UserSessionSummary, error) {
	rows, err := r.pool.Query(ctx, `
		SELECT id, exam_id, status, final_score AS score, started_at
		FROM exam_sessions WHERE user_id = $1
		ORDER BY started_at DESC
	`, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var sessions []UserSessionSummary
	for rows.Next() {
		var s UserSessionSummary
		if err := rows.Scan(&s.ID, &s.ExamContentID, &s.Status, &s.Score, &s.StartedAt); err != nil {
			return nil, err
		}
		sessions = append(sessions, s)
	}
	return sessions, nil
}

type UserSessionSummary struct {
	ID            uuid.UUID `json:"id"`
	ExamContentID uuid.UUID `json:"exam_content_id"`
	Status        string    `json:"status"`
	Score         *float64  `json:"score,omitempty"`
	StartedAt     time.Time `json:"started_at"`
}

func (r *Repository) GetExamDuration(ctx context.Context, examID uuid.UUID) (int, error) {
	var dur int
	err := r.pool.QueryRow(ctx, `SELECT duration_minutes FROM content_exams WHERE content_id = $1`, examID).Scan(&dur)
	if err == pgx.ErrNoRows {
		return 120, nil // default duration
	}
	return dur, err
}

func (r *Repository) GetExamQuestions(ctx context.Context, examID uuid.UUID) ([]struct {
	ID         uuid.UUID
	QuestionID uuid.UUID
	Order      int
}, error) {
	rows, err := r.pool.Query(ctx,
		`SELECT eq.id, eq.question_id, eq.display_order FROM exam_questions eq
		 WHERE eq.exam_id = $1 ORDER BY eq.display_order`, examID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var result []struct {
		ID         uuid.UUID
		QuestionID uuid.UUID
		Order      int
	}
	for rows.Next() {
		var item struct {
			ID         uuid.UUID
			QuestionID uuid.UUID
			Order      int
		}
		if err := rows.Scan(&item.ID, &item.QuestionID, &item.Order); err != nil {
			return nil, err
		}
		result = append(result, item)
	}
	return result, nil
}

// GetQuestionPool fetches the question pool config for an exam
func (r *Repository) GetQuestionPool(ctx context.Context, examID uuid.UUID) (*QuestionPool, error) {
	qp := &QuestionPool{}
	err := r.pool.QueryRow(ctx,
		`SELECT id, exam_id, subject_id, chapter_ids, easy_pct, medium_pct, hard_pct, total_pool_size, questions_per_student, shuffle_questions, shuffle_options, created_at, updated_at
		 FROM exam_question_pools WHERE exam_id = $1`, examID,
	).Scan(&qp.ID, &qp.ExamID, &qp.SubjectID, &qp.ChapterIDs, &qp.EasyPct, &qp.MediumPct, &qp.HardPct, &qp.TotalPoolSize, &qp.QuestionsPerStudent, &qp.ShuffleQuestions, &qp.ShuffleOptions, &qp.CreatedAt, &qp.UpdatedAt)
	if err != nil {
		return nil, err
	}
	return qp, nil
}

// SelectQuestionsForSession picks random questions from the pool matching difficulty distribution
func (r *Repository) SelectQuestionsForSession(ctx context.Context, pool *QuestionPool) ([]uuid.UUID, error) {
	chapterFilter := ""
	args := []interface{}{pool.SubjectID}
	argN := 2
	if len(pool.ChapterIDs) > 0 {
		chapterFilter = " AND chapter_id = ANY($" + itoa(argN) + ")"
		args = append(args, pool.ChapterIDs)
		argN++
	}

	easyCount := pool.TotalPoolSize * pool.EasyPct / 100
	mediumCount := pool.TotalPoolSize * pool.MediumPct / 100
	hardCount := pool.TotalPoolSize - easyCount - mediumCount

	query := `SELECT id FROM questions WHERE subject_id = $1 AND status = 'PUBLISHED' AND difficulty = 'EASY'` + chapterFilter + ` ORDER BY RANDOM() LIMIT $` + itoa(argN)
	args = append(args, easyCount)
	argN++

	var easyIDs []uuid.UUID
	rows, err := r.pool.Query(ctx, query, args...)
	if err != nil {
		return nil, err
	}
	for rows.Next() {
		var id uuid.UUID
		if err := rows.Scan(&id); err != nil {
			rows.Close()
			return nil, err
		}
		easyIDs = append(easyIDs, id)
	}
	rows.Close()

	query = `SELECT id FROM questions WHERE subject_id = $1 AND status = 'PUBLISHED' AND difficulty = 'MEDIUM'` + chapterFilter + ` ORDER BY RANDOM() LIMIT $` + itoa(argN)
	args = append(args, mediumCount)
	argN++

	var mediumIDs []uuid.UUID
	rows, err = r.pool.Query(ctx, query, args...)
	if err != nil {
		return nil, err
	}
	for rows.Next() {
		var id uuid.UUID
		if err := rows.Scan(&id); err != nil {
			rows.Close()
			return nil, err
		}
		mediumIDs = append(mediumIDs, id)
	}
	rows.Close()

	query = `SELECT id FROM questions WHERE subject_id = $1 AND status = 'PUBLISHED' AND difficulty = 'HARD'` + chapterFilter + ` ORDER BY RANDOM() LIMIT $` + itoa(argN)
	args = append(args, hardCount)

	var hardIDs []uuid.UUID
	rows, err = r.pool.Query(ctx, query, args...)
	if err != nil {
		return nil, err
	}
	for rows.Next() {
		var id uuid.UUID
		if err := rows.Scan(&id); err != nil {
			rows.Close()
			return nil, err
		}
		hardIDs = append(hardIDs, id)
	}
	rows.Close()

	allIDs := make([]uuid.UUID, 0, len(easyIDs)+len(mediumIDs)+len(hardIDs))
	allIDs = append(allIDs, easyIDs...)
	allIDs = append(allIDs, mediumIDs...)
	allIDs = append(allIDs, hardIDs...)

	if len(allIDs) == 0 {
		return nil, nil
	}

	// Shuffle all selected questions
	rand.Shuffle(len(allIDs), func(i, j int) {
		allIDs[i], allIDs[j] = allIDs[j], allIDs[i]
	})

	// Take only questions_per_student
	count := pool.QuestionsPerStudent
	if count > len(allIDs) {
		count = len(allIDs)
	}
	return allIDs[:count], nil
}

// AddSessionQuestions creates exam_session_questions with shuffled options for a session
func (r *Repository) AddSessionQuestions(ctx context.Context, sessionID uuid.UUID, questionIDs []uuid.UUID, shuffleQuestions, shuffleOptions bool) error {
	tx, err := r.pool.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)

	for i, qid := range questionIDs {
		var eqID uuid.UUID
		err := tx.QueryRow(ctx, `SELECT id FROM exam_questions WHERE exam_id = (SELECT exam_id FROM exam_sessions WHERE id=$1) AND question_id=$2`, sessionID, qid).Scan(&eqID)
		if err != nil {
			eqID = uuid.New()
			_, err = tx.Exec(ctx, `INSERT INTO exam_questions (id, exam_id, question_id, display_order) VALUES ($1, (SELECT exam_id FROM exam_sessions WHERE id=$2), $3, $4) ON CONFLICT DO NOTHING`, eqID, sessionID, qid, i+1)
			if err != nil {
				return err
			}
		}

		displayOrder := i + 1

		var optionOrder []byte
		if shuffleOptions {
			optRows, err := tx.Query(ctx, `SELECT id FROM question_options WHERE question_id=$1 ORDER BY RANDOM()`, qid)
			if err != nil {
				return err
			}
			var optIDs []uuid.UUID
			for optRows.Next() {
				var oid uuid.UUID
				if err := optRows.Scan(&oid); err != nil {
					optRows.Close()
					return err
				}
				optIDs = append(optIDs, oid)
			}
			optRows.Close()
			optionOrderBytes, _ := json.Marshal(optIDs)
			optionOrder = optionOrderBytes
		}

		_, err = tx.Exec(ctx,
			`INSERT INTO exam_session_questions (id, session_id, exam_question_id, display_order, assigned_option_order) VALUES ($1,$2,$3,$4,$5)`,
			uuid.New(), sessionID, eqID, displayOrder, optionOrder)
		if err != nil {
			return err
		}
	}
	return tx.Commit(ctx)
}

// GetSessionQuestions fetches the session-specific questions with their order and option shuffle
func (r *Repository) GetSessionQuestions(ctx context.Context, sessionID uuid.UUID) ([]struct {
	ExamQuestionID      uuid.UUID
	DisplayOrder        int
	AssignedOptionOrder []uuid.UUID
}, error) {
	rows, err := r.pool.Query(ctx,
		`SELECT esq.exam_question_id, esq.display_order, esq.assigned_option_order
		 FROM exam_session_questions esq
		 WHERE esq.session_id = $1 ORDER BY esq.display_order`, sessionID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var result []struct {
		ExamQuestionID      uuid.UUID
		DisplayOrder        int
		AssignedOptionOrder []uuid.UUID
	}
	for rows.Next() {
		var item struct {
			ExamQuestionID      uuid.UUID
			DisplayOrder        int
			AssignedOptionOrder []uuid.UUID
		}
		if err := rows.Scan(&item.ExamQuestionID, &item.DisplayOrder, &item.AssignedOptionOrder); err != nil {
			return nil, err
		}
		result = append(result, item)
	}
	return result, nil
}

// GetSessionQuestionsFull fetches the full question content for a session,
// pulling the exam's questions from content_exam_questions (joined to
// contents/content_questions/subjects) in display order. Option order is
// honored via assigned_option_order when present, otherwise DB display_order.
func (r *Repository) GetSessionQuestionsFull(ctx context.Context, sessionID uuid.UUID) ([]SessionQuestion, error) {
	var examID uuid.UUID
	err := r.pool.QueryRow(ctx, `SELECT exam_id FROM exam_sessions WHERE id = $1`, sessionID).Scan(&examID)
	if err != nil {
		return nil, err
	}

	rows, err := r.pool.Query(ctx, `
		SELECT ceq.id, ceq.question_content_id, ceq.display_order
		FROM content_exam_questions ceq
		WHERE ceq.exam_content_id = $1
		ORDER BY ceq.display_order, ceq.created_at`, examID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	type qrow struct {
		examQID      uuid.UUID
		contentID    uuid.UUID
		displayOrder int
	}
	var qrows []qrow
	for rows.Next() {
		var q qrow
		if err := rows.Scan(&q.examQID, &q.contentID, &q.displayOrder); err != nil {
			return nil, err
		}
		qrows = append(qrows, q)
	}

	var result []SessionQuestion
	for _, q := range qrows {
		sq := SessionQuestion{
			ExamQuestionID:    q.examQID,
			QuestionContentID: q.contentID,
			DisplayOrder:      q.displayOrder,
		}
		err := r.pool.QueryRow(ctx, `
			SELECT COALESCE(c.body, ''), COALESCE(cq.question_type, 'SINGLE_CHOICE'),
			       COALESCE(cq.difficulty, 'MEDIUM'), COALESCE(s.name, ''),
			       COALESCE(stim.body, '')
			FROM contents c
			JOIN content_questions cq ON cq.content_id = c.id
			LEFT JOIN subjects s ON s.id = c.subject_id
			LEFT JOIN contents stim ON stim.id = cq.stimulus_id
			WHERE c.id = $1`, q.contentID,
		).Scan(&sq.Stem, &sq.QuestionType, &sq.Difficulty, &sq.SubjectName, &sq.Stimulus)
		if err != nil {
			continue
		}

		optRows, err := r.pool.Query(ctx, `
			SELECT id, label, option_text
			FROM content_question_options
			WHERE content_id = $1 ORDER BY display_order`, q.contentID)
		if err == nil {
			for optRows.Next() {
				var o SessionQuestionOption
				if err := optRows.Scan(&o.ID, &o.Label, &o.Text); err == nil {
					sq.Options = append(sq.Options, o)
				}
			}
			optRows.Close()
		}

		result = append(result, sq)
	}
	return result, nil
}

func (r *Repository) CheckExamStarted(ctx context.Context, examID uuid.UUID) (bool, error) {
	var count int
	err := r.pool.QueryRow(ctx,
		`SELECT COUNT(*) FROM exam_sessions WHERE exam_id = $1 AND status = 'ACTIVE'`, examID).Scan(&count)
	return count > 0, err
}

func (r *Repository) SaveAnswer(ctx context.Context, a *ExamAnswer) error {
	a.ID = uuid.New()
	_, err := r.pool.Exec(ctx,
		`INSERT INTO exam_answers (id, session_id, exam_question_id, selected_option_id, is_doubtful, is_correct, points_earned)
		 VALUES ($1,$2,$3,$4,$5,$6,$7)
		 ON CONFLICT (session_id, exam_question_id) DO UPDATE
		 SET selected_option_id = $4, is_doubtful = $5, is_correct = $6, points_earned = $7`,
		a.ID, a.SessionID, a.ExamQuestionID, a.SelectedOptionID, a.IsDoubtful, a.IsCorrect, a.PointsEarned)
	return err
}

func (r *Repository) GetAnswers(ctx context.Context, sessionID uuid.UUID) ([]ExamAnswer, error) {
	rows, err := r.pool.Query(ctx,
		`SELECT ea.id, ea.session_id, ea.exam_question_id, ea.selected_option_id, ea.is_doubtful, ea.is_correct, ea.points_earned
		 FROM exam_answers ea WHERE ea.session_id = $1 ORDER BY ea.created_at`, sessionID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var answers []ExamAnswer
	for rows.Next() {
		var a ExamAnswer
		if err := rows.Scan(&a.ID, &a.SessionID, &a.ExamQuestionID, &a.SelectedOptionID,
			&a.IsDoubtful, &a.IsCorrect, &a.PointsEarned); err != nil {
			return nil, err
		}
		answers = append(answers, a)
	}
	return answers, nil
}

func (r *Repository) GetSessionReview(ctx context.Context, sessionID uuid.UUID) (*SessionReview, error) {
	review := &SessionReview{SessionID: sessionID}
	err := r.pool.QueryRow(ctx, `
		SELECT r.exam_id, COALESCE(c.title, ''), r.user_id, r.total_questions, r.correct_count, r.wrong_count, r.unanswered_count,
		       r.score, COALESCE(r.passing_grade, 0), COALESCE(r.is_passed, false),
		       r.duration_seconds, r.created_at
		FROM results r
		LEFT JOIN contents c ON c.id = r.exam_id
		WHERE r.session_id = $1`, sessionID,
	).Scan(&review.ExamID, &review.ExamTitle, &review.UserID, &review.TotalQuestions, &review.CorrectCount, &review.WrongCount,
		&review.UnansweredCount, &review.Score, &review.PassingGrade, &review.IsPassed, &review.DurationSeconds, &review.CreatedAt)
	if err != nil {
		return nil, err
	}

	qRows, err := r.pool.Query(ctx, `
		SELECT esq.exam_question_id, ceq.question_content_id, esq.display_order
		FROM exam_session_questions esq
		JOIN content_exam_questions ceq ON ceq.id = esq.exam_question_id
		WHERE esq.session_id = $1
		ORDER BY esq.display_order`, sessionID)
	if err != nil {
		return nil, err
	}
	defer qRows.Close()

	type qid struct {
		examQID      uuid.UUID
		contentID    uuid.UUID
		displayOrder int
	}
	var qids []qid
	for qRows.Next() {
		var q qid
		if err := qRows.Scan(&q.examQID, &q.contentID, &q.displayOrder); err != nil {
			return nil, err
		}
		qids = append(qids, q)
	}

	answersMap := make(map[uuid.UUID]ExamAnswer)
	answers, err := r.GetAnswers(ctx, sessionID)
	if err == nil {
		for _, a := range answers {
			answersMap[a.ExamQuestionID] = a
		}
	}

	for _, q := range qids {
		rq := ReviewQuestion{
			ExamQuestionID:    q.examQID,
			QuestionContentID: q.contentID,
			DisplayOrder:      q.displayOrder,
		}

		r.pool.QueryRow(ctx, `
			SELECT COALESCE(c.body, ''), COALESCE(cq.question_type, ''), COALESCE(cq.difficulty, ''), COALESCE(cq.explanation, '')
			FROM contents c
			JOIN content_questions cq ON cq.content_id = c.id
			WHERE c.id = $1`, q.contentID,
		).Scan(&rq.Stem, &rq.QuestionType, &rq.Difficulty, &rq.Explanation)

		optRows, err := r.pool.Query(ctx, `
			SELECT id, label, option_text, is_correct
			FROM content_question_options
			WHERE content_id = $1 ORDER BY display_order`, q.contentID)
		if err == nil {
			for optRows.Next() {
				var opt ReviewQuestionOption
				if err := optRows.Scan(&opt.ID, &opt.Label, &opt.Text, &opt.IsCorrect); err == nil {
					rq.Options = append(rq.Options, opt)
				}
			}
			optRows.Close()
		}

		if ans, ok := answersMap[q.examQID]; ok {
			rq.SelectedOptionID = ans.SelectedOptionID
			rq.IsCorrect = ans.IsCorrect
			rq.IsDoubtful = ans.IsDoubtful
		}

		review.Questions = append(review.Questions, rq)
	}

	return review, nil
}

func (r *Repository) GetCorrectOptionForQuestion(ctx context.Context, questionID uuid.UUID) (*uuid.UUID, error) {
	var optionID uuid.UUID
	err := r.pool.QueryRow(ctx,
		`SELECT id FROM question_options WHERE question_id = $1 AND is_correct = true LIMIT 1`, questionID).Scan(&optionID)
	if err != nil {
		return nil, err
	}
	return &optionID, nil
}

func (r *Repository) GetCorrectOptionsForQuestion(ctx context.Context, questionID uuid.UUID) ([]uuid.UUID, error) {
	rows, err := r.pool.Query(ctx, `SELECT id FROM question_options WHERE question_id = $1 AND is_correct = true`, questionID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var optionIDs []uuid.UUID
	for rows.Next() {
		var id uuid.UUID
		if err := rows.Scan(&id); err != nil {
			return nil, err
		}
		optionIDs = append(optionIDs, id)
	}
	return optionIDs, nil
}

func (r *Repository) GetQuestionType(ctx context.Context, questionID uuid.UUID) (string, error) {
	var qType string
	err := r.pool.QueryRow(ctx, `SELECT question_type FROM questions WHERE id = $1`, questionID).Scan(&qType)
	if err != nil {
		return "", err
	}
	return qType, nil
}

func (r *Repository) GetQuestionIDByExamQuestion(ctx context.Context, examQuestionID uuid.UUID) (uuid.UUID, error) {
	var qID uuid.UUID
	err := r.pool.QueryRow(ctx, `SELECT question_id FROM exam_questions WHERE id = $1`, examQuestionID).Scan(&qID)
	return qID, err
}

func (r *Repository) FinishSession(ctx context.Context, sessionID uuid.UUID, remainingSeconds *int) error {
	now := time.Now()
	_, err := r.pool.Exec(ctx,
		`UPDATE exam_sessions SET status = 'FINISHED', finished_at = $1, remaining_seconds = $2 WHERE id = $3`,
		now, remainingSeconds, sessionID)
	return err
}

func (r *Repository) PauseSession(ctx context.Context, sessionID uuid.UUID, remainingSeconds int) error {
	_, err := r.pool.Exec(ctx,
		`UPDATE exam_sessions SET status = 'PAUSED', remaining_seconds = $1 WHERE id = $2`,
		remainingSeconds, sessionID)
	return err
}

func (r *Repository) ResumeSession(ctx context.Context, sessionID uuid.UUID) error {
	_, err := r.pool.Exec(ctx,
		`UPDATE exam_sessions SET status = 'ACTIVE' WHERE id = $1`, sessionID)
	return err
}

func (r *Repository) SaveViolation(ctx context.Context, v *Violation) error {
	v.ID = uuid.New()
	v.CreatedAt = time.Now()
	_, err := r.pool.Exec(ctx,
		`INSERT INTO violations (id, session_id, violation_type, details, created_at) VALUES ($1,$2,$3,$4,$5)`,
		v.ID, v.SessionID, v.ViolationType, v.Details, v.CreatedAt)
	if err != nil {
		return err
	}

	// Increment violation score
	_, err = r.pool.Exec(ctx,
		`UPDATE exam_sessions SET violation_score = violation_score + 1 WHERE id = $1`, v.SessionID)
	return err
}

func (r *Repository) GetViolationScore(ctx context.Context, sessionID uuid.UUID) (int, error) {
	var score int
	err := r.pool.QueryRow(ctx, `SELECT violation_score FROM exam_sessions WHERE id = $1`, sessionID).Scan(&score)
	return score, err
}

func (r *Repository) TerminateSession(ctx context.Context, sessionID uuid.UUID) error {
	now := time.Now()
	_, err := r.pool.Exec(ctx,
		`UPDATE exam_sessions SET status = 'TERMINATED', is_terminated = true, finished_at = $1 WHERE id = $2`,
		now, sessionID)
	return err
}

func (r *Repository) GetExamPassingScore(ctx context.Context, examID uuid.UUID) (float64, error) {
	var ps float64
	err := r.pool.QueryRow(ctx, `SELECT passing_score FROM content_exams WHERE content_id = $1`, examID).Scan(&ps)
	if err != nil {
		return 70.0, nil // default passing score
	}
	return ps, nil
}

func (r *Repository) GetExamNegativeMarking(ctx context.Context, examID uuid.UUID) (float64, error) {
	var nm float64
	err := r.pool.QueryRow(ctx, `SELECT COALESCE(negative_marking, 0) FROM content_exams WHERE content_id = $1`, examID).Scan(&nm)
	if err != nil {
		return 0.0, nil // default negative marking
	}
	return nm, nil
}

func (r *Repository) UpdateQuestionAnalytics(ctx context.Context, questionID uuid.UUID, correct bool) error {
	_, err := r.pool.Exec(ctx,
		`INSERT INTO question_analytics (question_id, total_attempts, correct_count, wrong_count)
		 VALUES ($1, 1, CASE WHEN $2 THEN 1 ELSE 0 END, CASE WHEN $2 THEN 0 ELSE 1 END)
		 ON CONFLICT (question_id) DO UPDATE
		 SET total_attempts = question_analytics.total_attempts + 1,
		     correct_count = question_analytics.correct_count + CASE WHEN $2 THEN 1 ELSE 0 END,
		     wrong_count = question_analytics.wrong_count + CASE WHEN $2 THEN 0 ELSE 1 END,
		     updated_at = NOW()`,
		questionID, correct)
	return err
}

func (r *Repository) SaveResult(ctx context.Context, res *Result) error {
	res.ID = uuid.New()
	res.CreatedAt = time.Now()
	_, err := r.pool.Exec(ctx,
		`INSERT INTO results (id, session_id, exam_id, user_id, total_questions, answered_count, correct_count,
		 wrong_count, unanswered_count, score, passing_grade, is_passed, duration_seconds, created_at)
		 VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
		 ON CONFLICT (session_id) DO UPDATE
		 SET total_questions=$5, answered_count=$6, correct_count=$7, wrong_count=$8,
		 unanswered_count=$9, score=$10, passing_grade=$11, is_passed=$12, duration_seconds=$13`,
		res.ID, res.SessionID, res.ExamID, res.UserID, res.TotalQuestions, res.AnsweredCount,
		res.CorrectCount, res.WrongCount, res.UnansweredCount, res.Score, res.PassingGrade,
		res.IsPassed, res.DurationSeconds, res.CreatedAt)
	return err
}

func (r *Repository) GetResult(ctx context.Context, sessionID uuid.UUID) (*Result, error) {
	res := &Result{}
	err := r.pool.QueryRow(ctx,
		`SELECT id, session_id, exam_id, user_id, total_questions, answered_count, correct_count,
		 wrong_count, unanswered_count, score, passing_grade, is_passed, duration_seconds, created_at
		 FROM results WHERE session_id = $1`, sessionID,
	).Scan(&res.ID, &res.SessionID, &res.ExamID, &res.UserID, &res.TotalQuestions, &res.AnsweredCount,
		&res.CorrectCount, &res.WrongCount, &res.UnansweredCount, &res.Score, &res.PassingGrade,
		&res.IsPassed, &res.DurationSeconds, &res.CreatedAt)
	if err != nil {
		return nil, err
	}
	return res, nil
}

func (r *Repository) UpdateSessionFinalScore(ctx context.Context, sessionID uuid.UUID, score float64) error {
	_, err := r.pool.Exec(ctx,
		`UPDATE exam_sessions SET final_score = $1 WHERE id = $2`, score, sessionID)
	return err
}

func (r *Repository) GetQuestionsPerStudent(ctx context.Context, examID uuid.UUID) (int, error) {
	var bpStr *string
	err := r.pool.QueryRow(ctx, `SELECT blueprint::text FROM content_exams WHERE content_id = $1`, examID).Scan(&bpStr)
	if err != nil {
		return 0, err
	}
	if bpStr == nil || *bpStr == "" {
		return 0, nil
	}
	var bp struct {
		QuestionsPerStudent int `json:"questions_per_student"`
	}
	if err := json.Unmarshal([]byte(*bpStr), &bp); err != nil {
		return 0, err
	}
	return bp.QuestionsPerStudent, nil
}

func (r *Repository) PickRandomExamQuestions(ctx context.Context, examID uuid.UUID, count int) ([]uuid.UUID, error) {
	rows, err := r.pool.Query(ctx,
		`SELECT ceq.id FROM content_exam_questions ceq
		 WHERE ceq.exam_content_id = $1
		 ORDER BY RANDOM() LIMIT $2`, examID, count)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var ids []uuid.UUID
	for rows.Next() {
		var id uuid.UUID
		if err := rows.Scan(&id); err != nil {
			return nil, err
		}
		ids = append(ids, id)
	}
	return ids, nil
}

func (r *Repository) FindExpiredActiveSessions(ctx context.Context) ([]struct {
	ID               uuid.UUID
	ExamID           uuid.UUID
	UserID           uuid.UUID
	RemainingSeconds *int
	ExamDuration     int
	StartTime        time.Time
}, error) {
	rows, err := r.pool.Query(ctx,
		`SELECT es.id, es.exam_id, es.user_id, es.remaining_seconds, e.duration_minutes, es.started_at
		 FROM exam_sessions es JOIN exams e ON e.id = es.exam_id
		 WHERE es.status = 'ACTIVE'
		 AND (es.started_at + (e.duration_minutes * interval '1 minute')) < NOW()`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var result []struct {
		ID               uuid.UUID
		ExamID           uuid.UUID
		UserID           uuid.UUID
		RemainingSeconds *int
		ExamDuration     int
		StartTime        time.Time
	}
	for rows.Next() {
		var item struct {
			ID               uuid.UUID
			ExamID           uuid.UUID
			UserID           uuid.UUID
			RemainingSeconds *int
			ExamDuration     int
			StartTime        time.Time
		}
		if err := rows.Scan(&item.ID, &item.ExamID, &item.UserID, &item.RemainingSeconds, &item.ExamDuration, &item.StartTime); err != nil {
			return nil, err
		}
		result = append(result, item)
	}
	return result, nil
}

// --- Result DTO (shared with scoring module) ---

type Result struct {
	ID              uuid.UUID `json:"id"`
	SessionID       uuid.UUID `json:"session_id"`
	ExamID          uuid.UUID `json:"exam_id"`
	UserID          uuid.UUID `json:"user_id"`
	TotalQuestions  int       `json:"total_questions"`
	AnsweredCount   int       `json:"answered_count"`
	CorrectCount    int       `json:"correct_count"`
	WrongCount      int       `json:"wrong_count"`
	UnansweredCount int       `json:"unanswered_count"`
	Score           float64   `json:"score"`
	PassingGrade    float64   `json:"passing_grade"`
	IsPassed        bool      `json:"is_passed"`
	DurationSeconds int       `json:"duration_seconds"`
	CreatedAt       time.Time `json:"created_at"`
}

// --- Service ---

type Service struct {
	repo *Repository
}

func NewService(repo *Repository) *Service {
	return &Service{repo: repo}
}

func (s *Service) Start(ctx context.Context, examID, userID uuid.UUID) (*ExamSession, error) {
	// Check exam exists and is PUBLISHED
	var status string
	err := s.repo.pool.QueryRow(ctx, `SELECT status FROM contents WHERE id = $1 AND content_type = 'EXAM'`, examID).Scan(&status)
	if err != nil {
		if err == pgx.ErrNoRows {
			return nil, fiber.NewError(404, "Exam not found")
		}
		return nil, err
	}
	if status != "PUBLISHED" {
		return nil, fiber.NewError(400, "Exam is not published")
	}

	// Check no active session for this user+exam
	existing, err := s.repo.FindSessionByExamUser(ctx, examID, userID)
	if err == nil && existing != nil {
		return existing, nil
	}

	dur, err := s.repo.GetExamDuration(ctx, examID)
	if err != nil {
		return nil, err
	}

	session := &ExamSession{
		ExamID: examID,
		UserID: userID,
	}

	if err := s.repo.CreateSession(ctx, session, dur); err != nil {
		return nil, err
	}

	// Check if exam has a question pool - if so, generate session questions
	pool, err := s.repo.GetQuestionPool(ctx, examID)
	if err == nil && pool != nil {
		// Select questions for this session based on pool config
		questionIDs, err := s.repo.SelectQuestionsForSession(ctx, pool)
		if err != nil {
			return nil, err
		}
		if len(questionIDs) > 0 {
			err = s.repo.AddSessionQuestions(ctx, session.ID, questionIDs, pool.ShuffleQuestions, pool.ShuffleOptions)
			if err != nil {
				return nil, err
			}
		}
		return session, nil
	}

	// Fallback: pick random questions from admin-selected pool (questions_per_student in blueprint)
	qps, bpErr := s.repo.GetQuestionsPerStudent(ctx, examID)
	if bpErr == nil && qps > 0 {
		questionIDs, qErr := s.repo.PickRandomExamQuestions(ctx, examID, qps)
		if qErr == nil && len(questionIDs) > 0 {
			if err := s.repo.AddSessionQuestions(ctx, session.ID, questionIDs, true, true); err != nil {
				return nil, err
			}
		}
	}

	return session, nil
}

func (s *Service) SyncAnswers(ctx context.Context, sessionID uuid.UUID, answers []SyncAnswerReq) error {
	session, err := s.repo.FindSession(ctx, sessionID)
	if err != nil {
		return fiber.NewError(404, "Session not found")
	}
	if session.Status != "ACTIVE" {
		return fiber.NewError(400, "Session is not active")
	}

	for _, a := range answers {
		eqID, _ := uuid.Parse(a.ExamQuestionID)
		answer := &ExamAnswer{
			SessionID:      sessionID,
			ExamQuestionID: eqID,
			IsDoubtful:     a.IsDoubtful,
		}

		// Handle selected options - support both single and multiple
		var selectedOptionIDs []uuid.UUID
		if len(a.SelectedOptionIDs) > 0 {
			for _, sid := range a.SelectedOptionIDs {
				id, _ := uuid.Parse(sid)
				selectedOptionIDs = append(selectedOptionIDs, id)
			}
		} else if a.SelectedOptionID != nil {
			id, _ := uuid.Parse(*a.SelectedOptionID)
			selectedOptionIDs = append(selectedOptionIDs, id)
		}

		if len(selectedOptionIDs) > 0 {
			answer.SelectedOptionID = &selectedOptionIDs[0] // Keep first for backward compat
		}

		// Grade: find correct option for the question based on question type
		questionID, err := s.repo.GetQuestionIDByExamQuestion(ctx, eqID)
		if err == nil {
			qType, err := s.repo.GetQuestionType(ctx, questionID)
			if err == nil && len(selectedOptionIDs) > 0 {
				var isCorrect bool
				switch qType {
				case "SINGLE_CHOICE":
					// Single choice: only one correct answer
					correctOpt, err := s.repo.GetCorrectOptionForQuestion(ctx, questionID)
					if err == nil && len(selectedOptionIDs) > 0 {
						isCorrect = selectedOptionIDs[0] == *correctOpt
					}
				case "MULTIPLE_CHOICE":
					// Multiple choice: need to select ALL correct options (exact match)
					correctOpts, err := s.repo.GetCorrectOptionsForQuestion(ctx, questionID)
					if err == nil {
						// Check if selected options exactly match correct options
						if len(selectedOptionIDs) == len(correctOpts) {
							match := true
							for _, sel := range selectedOptionIDs {
								found := false
								for _, cor := range correctOpts {
									if sel == cor {
										found = true
										break
									}
								}
								if !found {
									match = false
									break
								}
							}
							isCorrect = match
						}
					}
				case "TRUE_FALSE":
					// True/False: single correct answer (Benar/Salah)
					correctOpt, err := s.repo.GetCorrectOptionForQuestion(ctx, questionID)
					if err == nil && len(selectedOptionIDs) > 0 {
						isCorrect = selectedOptionIDs[0] == *correctOpt
					}
				default:
					// Fallback to single choice logic
					correctOpt, err := s.repo.GetCorrectOptionForQuestion(ctx, questionID)
					if err == nil && len(selectedOptionIDs) > 0 {
						isCorrect = selectedOptionIDs[0] == *correctOpt
					}
				}
				answer.IsCorrect = &isCorrect
				if isCorrect {
					answer.PointsEarned = 1
				}
			}
		}

		if err := s.repo.SaveAnswer(ctx, answer); err != nil {
			return err
		}
	}
	return nil
}

func (s *Service) Navigate(ctx context.Context, sessionID uuid.UUID, examQuestionID string, isDoubtful bool) error {
	session, err := s.repo.FindSession(ctx, sessionID)
	if err != nil {
		return fiber.NewError(404, "Session not found")
	}
	if session.Status != "ACTIVE" {
		return fiber.NewError(400, "Session is not active")
	}

	eqID, _ := uuid.Parse(examQuestionID)
	answer := &ExamAnswer{
		SessionID:      sessionID,
		ExamQuestionID: eqID,
		IsDoubtful:     isDoubtful,
	}

	if err := s.repo.SaveAnswer(ctx, answer); err != nil {
		return err
	}
	return nil
}

func (s *Service) GetAnswers(ctx context.Context, sessionID uuid.UUID) ([]ExamAnswer, error) {
	_, err := s.repo.FindSession(ctx, sessionID)
	if err != nil {
		return nil, fiber.NewError(404, "Session not found")
	}

	answers, err := s.repo.GetAnswers(ctx, sessionID)
	if err != nil {
		return nil, err
	}
	return answers, nil
}

func (s *Service) GetSessionReview(ctx context.Context, sessionID uuid.UUID) (*SessionReview, error) {
	review, err := s.repo.GetSessionReview(ctx, sessionID)
	if err != nil {
		return nil, err
	}
	return review, nil
}

func (s *Service) ListUserSessions(ctx context.Context, userID uuid.UUID) ([]UserSessionSummary, error) {
	return s.repo.ListUserSessions(ctx, userID)
}

func (s *Service) GetSessionQuestions(ctx context.Context, sessionID uuid.UUID) ([]SessionQuestion, error) {
	_, err := s.repo.FindSession(ctx, sessionID)
	if err != nil {
		return nil, fiber.NewError(404, "Session not found")
	}

	return s.repo.GetSessionQuestionsFull(ctx, sessionID)
}

func (s *Service) Pause(ctx context.Context, sessionID uuid.UUID, remainingSeconds int) error {
	session, err := s.repo.FindSession(ctx, sessionID)
	if err != nil {
		return fiber.NewError(404, "Session not found")
	}
	if session.Status != "ACTIVE" {
		return fiber.NewError(400, "Session is not active")
	}

	return s.repo.PauseSession(ctx, sessionID, remainingSeconds)
}

func (s *Service) Resume(ctx context.Context, sessionID uuid.UUID) error {
	session, err := s.repo.FindSession(ctx, sessionID)
	if err != nil {
		return fiber.NewError(404, "Session not found")
	}
	if session.Status != "PAUSED" {
		return fiber.NewError(400, "Session is not paused")
	}
	return s.repo.ResumeSession(ctx, sessionID)
}

func (s *Service) ReportViolation(ctx context.Context, sessionID uuid.UUID, violationType, details string) (*ExamSession, error) {
	session, err := s.repo.FindSession(ctx, sessionID)
	if err != nil {
		return nil, fiber.NewError(404, "Session not found")
	}

	v := &Violation{
		SessionID:     sessionID,
		ViolationType: violationType,
		Details:       details,
	}
	if err := s.repo.SaveViolation(ctx, v); err != nil {
		return nil, err
	}

	// Re-read violation score
	score, err := s.repo.GetViolationScore(ctx, sessionID)
	if err != nil {
		return nil, err
	}

	// Auto-terminate at 5 violations
	if score >= 5 {
		if err := s.repo.TerminateSession(ctx, sessionID); err != nil {
			return nil, err
		}
		// Auto-score on termination
		if _, err := s.Finish(ctx, sessionID); err != nil {
			// don't fail on scoring error
		}
		session.Status = "TERMINATED"
		session.IsTerminated = true
	} else {
		session.ViolationScore = score
	}

	return session, nil
}

func (s *Service) Finish(ctx context.Context, sessionID uuid.UUID) (*Result, error) {
	session, err := s.repo.FindSession(ctx, sessionID)
	if err != nil {
		return nil, fiber.NewError(404, "Session not found")
	}
	if session.Status == "FINISHED" || session.Status == "TERMINATED" {
		// Already finished, return existing result if available
		existingRes, err := s.repo.GetResult(ctx, sessionID)
		if err == nil && existingRes != nil {
			return existingRes, nil
		}
	}

	// Calculate stats
	answers, err := s.repo.GetAnswers(ctx, sessionID)
	if err != nil {
		return nil, err
	}

	// Use session-specific questions if available, fall back to exam questions
	sessionQuestions, err := s.repo.GetSessionQuestions(ctx, sessionID)
	if err != nil || len(sessionQuestions) == 0 {
		// Fallback to exam questions
		examQuestions, err := s.repo.GetExamQuestions(ctx, session.ExamID)
		if err != nil {
			return nil, err
		}
		totalQuestions := len(examQuestions)
		answeredCount := 0
		correctCount := 0
		for _, a := range answers {
			if a.SelectedOptionID != nil {
				answeredCount++
			}
			if a.IsCorrect != nil && *a.IsCorrect {
				correctCount++
			}
		}
		wrongCount := answeredCount - correctCount
		unansweredCount := totalQuestions - answeredCount

		// Get negative_marking for this exam
		negMarking, err := s.repo.GetExamNegativeMarking(ctx, session.ExamID)
		if err != nil {
			return nil, err
		}

		// Score with negative marking: correct=+1pt, wrong=-negMarking pt, unanswered=0
		var score float64
		if totalQuestions > 0 {
			score = (float64(correctCount) - float64(wrongCount)*negMarking) / float64(totalQuestions) * 100
			if score < 0 {
				score = 0
			}
		}

		passingGrade, err := s.repo.GetExamPassingScore(ctx, session.ExamID)
		if err != nil {
			return nil, err
		}

		isPassed := score >= passingGrade

		// Update question_analytics for each answered question
		for _, a := range answers {
			qid, err := s.repo.GetQuestionIDByExamQuestion(ctx, a.ExamQuestionID)
			if err != nil {
				continue
			}
			if err := s.repo.UpdateQuestionAnalytics(ctx, qid, a.IsCorrect != nil && *a.IsCorrect); err != nil {
				// non-fatal
				continue
			}
		}

		// Calculate duration
		durationSeconds := int(time.Since(session.StartedAt).Seconds())
		if session.FinishedAt != nil {
			durationSeconds = int(session.FinishedAt.Sub(session.StartedAt).Seconds())
		}

		// Determine remaining seconds
		var remainingSec *int
		if session.RemainingSeconds != nil {
			elapsed := int(time.Since(session.StartedAt).Seconds())
			rem := *session.RemainingSeconds - elapsed
			if rem < 0 {
				rem = 0
			}
			remainingSec = &rem
		}

		// Finish session
		if err := s.repo.FinishSession(ctx, sessionID, remainingSec); err != nil {
			return nil, err
		}

		// Save result
		result := &Result{
			SessionID:       sessionID,
			ExamID:          session.ExamID,
			UserID:          session.UserID,
			TotalQuestions:  totalQuestions,
			AnsweredCount:   answeredCount,
			CorrectCount:    correctCount,
			WrongCount:      wrongCount,
			UnansweredCount: unansweredCount,
			Score:           score,
			PassingGrade:    passingGrade,
			IsPassed:        isPassed,
			DurationSeconds: durationSeconds,
		}

		if err := s.repo.SaveResult(ctx, result); err != nil {
			return nil, err
		}

		// Update session final_score
		if err := s.repo.UpdateSessionFinalScore(ctx, sessionID, score); err != nil {
			return nil, err
		}

		return result, nil
	}

	// Use session questions
	totalQuestions := len(sessionQuestions)
	answeredCount := 0
	correctCount := 0
	for _, a := range answers {
		if a.SelectedOptionID != nil {
			answeredCount++
		}
		if a.IsCorrect != nil && *a.IsCorrect {
			correctCount++
		}
	}
	wrongCount := answeredCount - correctCount
	unansweredCount := totalQuestions - answeredCount

	// Get negative_marking for this exam
	negMarking, err := s.repo.GetExamNegativeMarking(ctx, session.ExamID)
	if err != nil {
		return nil, err
	}

	// Score with negative marking: correct=+1pt, wrong=-negMarking pt, unanswered=0
	var score float64
	if totalQuestions > 0 {
		score = (float64(correctCount) - float64(wrongCount)*negMarking) / float64(totalQuestions) * 100
		if score < 0 {
			score = 0
		}
	}

	passingGrade, err := s.repo.GetExamPassingScore(ctx, session.ExamID)
	if err != nil {
		return nil, err
	}

	isPassed := score >= passingGrade

	// Update question_analytics for each answered question
	for _, a := range answers {
		qid, err := s.repo.GetQuestionIDByExamQuestion(ctx, a.ExamQuestionID)
		if err != nil {
			continue
		}
		if err := s.repo.UpdateQuestionAnalytics(ctx, qid, a.IsCorrect != nil && *a.IsCorrect); err != nil {
			// non-fatal
			continue
		}
	}

	// Calculate duration
	durationSeconds := int(time.Since(session.StartedAt).Seconds())
	if session.FinishedAt != nil {
		durationSeconds = int(session.FinishedAt.Sub(session.StartedAt).Seconds())
	}

	// Determine remaining seconds
	var remainingSec *int
	if session.RemainingSeconds != nil {
		elapsed := int(time.Since(session.StartedAt).Seconds())
		rem := *session.RemainingSeconds - elapsed
		if rem < 0 {
			rem = 0
		}
		remainingSec = &rem
	}

	// Finish session
	if err := s.repo.FinishSession(ctx, sessionID, remainingSec); err != nil {
		return nil, err
	}

	// Save result
	result := &Result{
		SessionID:       sessionID,
		ExamID:          session.ExamID,
		UserID:          session.UserID,
		TotalQuestions:  totalQuestions,
		AnsweredCount:   answeredCount,
		CorrectCount:    correctCount,
		WrongCount:      wrongCount,
		UnansweredCount: unansweredCount,
		Score:           score,
		PassingGrade:    passingGrade,
		IsPassed:        isPassed,
		DurationSeconds: durationSeconds,
	}

	if err := s.repo.SaveResult(ctx, result); err != nil {
		return nil, err
	}

	// Update session final_score
	if err := s.repo.UpdateSessionFinalScore(ctx, sessionID, score); err != nil {
		return nil, err
	}

	return result, nil
}

func (s *Service) AutoSubmitExpired(ctx context.Context) (int, error) {
	sessions, err := s.repo.FindExpiredActiveSessions(ctx)
	if err != nil {
		return 0, err
	}
	count := 0
	for _, sess := range sessions {
		if _, err := s.Finish(ctx, sess.ID); err == nil {
			count++
		}
	}
	return count, nil
}

// --- DTOs ---

type SessionQuestionOption struct {
	ID    uuid.UUID `json:"id"`
	Label string    `json:"label"`
	Text  string    `json:"text"`
}

type SessionQuestion struct {
	ExamQuestionID    uuid.UUID              `json:"exam_question_id"`
	QuestionContentID uuid.UUID              `json:"question_content_id"`
	DisplayOrder      int                    `json:"display_order"`
	SubjectName       string                 `json:"subjectName"`
	Stimulus          string                 `json:"stimulus"`
	Stem              string                 `json:"stem"`
	QuestionType      string                 `json:"questionType"`
	Difficulty        string                 `json:"difficulty"`
	Options           []SessionQuestionOption `json:"options"`
}

type ReviewQuestionOption struct {
	ID        uuid.UUID `json:"id"`
	Label     string    `json:"label"`
	Text      string    `json:"text"`
	IsCorrect bool      `json:"is_correct"`
}

type ReviewQuestion struct {
	ExamQuestionID    uuid.UUID              `json:"exam_question_id"`
	QuestionContentID uuid.UUID              `json:"question_content_id"`
	DisplayOrder      int                    `json:"display_order"`
	Stem              string                 `json:"stem"`
	QuestionType      string                 `json:"question_type"`
	Difficulty        string                 `json:"difficulty"`
	Explanation       string                 `json:"explanation"`
	Options           []ReviewQuestionOption `json:"options"`
	SelectedOptionID  *uuid.UUID             `json:"selected_option_id,omitempty"`
	IsCorrect         *bool                  `json:"is_correct,omitempty"`
	IsDoubtful        bool                   `json:"is_doubtful"`
}

type SessionReview struct {
	SessionID       uuid.UUID        `json:"session_id"`
	ExamID          uuid.UUID        `json:"exam_id"`
	ExamTitle       string           `json:"exam_title"`
	UserID          uuid.UUID        `json:"user_id"`
	TotalQuestions  int              `json:"total_questions"`
	CorrectCount    int              `json:"correct_count"`
	WrongCount      int              `json:"wrong_count"`
	UnansweredCount int              `json:"unanswered_count"`
	Score           float64          `json:"score"`
	PassingGrade    float64          `json:"passing_grade"`
	IsPassed        bool             `json:"is_passed"`
	DurationSeconds int              `json:"duration_seconds"`
	Questions       []ReviewQuestion `json:"questions"`
	CreatedAt       time.Time        `json:"created_at"`
}

type SyncAnswerReq struct {
	ExamQuestionID    string   `json:"exam_question_id"`
	SelectedOptionIDs []string `json:"selected_option_ids,omitempty"` // For MULTIPLE_CHOICE
	SelectedOptionID  *string  `json:"selected_option_id,omitempty"`  // For SINGLE_CHOICE, TRUE_FALSE
	IsDoubtful        bool     `json:"is_doubtful"`
}

type ViolationReq struct {
	ViolationType string `json:"violation_type"`
	Details       string `json:"details,omitempty"`
}

type NavigateReq struct {
	ExamQuestionID string `json:"exam_question_id"`
	IsDoubtful     bool   `json:"is_doubtful"`
}

type PauseReq struct {
	RemainingSeconds int `json:"remaining_seconds"`
}

// --- Handler ---

type Handler struct {
	svc *Service
	jwt string
}

func NewHandler(svc *Service, jwtSecret string) *Handler {
	return &Handler{svc: svc, jwt: jwtSecret}
}

func (h *Handler) RegisterRoutes(router fiber.Router) {
	r := router.Group("/cbt", middleware.RequireAuth(h.jwt))
	r.Get("/sessions", h.ListSessions)
	r.Post("/:exam_id/start", h.Start)
	r.Post("/:session_id/sync", h.Sync)
	r.Post("/:session_id/navigate", h.Navigate)
	r.Post("/:session_id/pause", h.Pause)
	r.Post("/:session_id/resume", h.Resume)
	r.Post("/:session_id/finish", h.Finish)
	r.Post("/:session_id/violation", h.ReportViolation)
	r.Get("/:session_id/answers", h.GetAnswers)
	r.Get("/:session_id/questions", h.GetSessionQuestions)
	r.Get("/:session_id/review", h.GetReview)
}

func (h *Handler) AutoSubmitExpired(c *fiber.Ctx) error {
	count, err := h.svc.AutoSubmitExpired(c.Context())
	if err != nil {
		return c.Status(500).JSON(shared.Error(shared.ErrInternal, "Failed to auto-submit expired sessions: "+err.Error()))
	}
	return c.JSON(shared.Success(fiber.Map{"auto_submitted": count}))
}

func (h *Handler) Start(c *fiber.Ctx) error {
	examID, err := uuid.Parse(c.Params("exam_id"))
	if err != nil {
		return c.Status(400).JSON(shared.Error(shared.ErrValidation, "Invalid exam ID"))
	}
	userID := uuid.MustParse(c.Locals("user_id").(string))

	session, err := h.svc.Start(c.Context(), examID, userID)
	if err != nil {
		if fe, ok := err.(*fiber.Error); ok {
			return c.Status(fe.Code).JSON(shared.Error(shared.ErrorCode(fe.Message), fe.Message))
		}
		return c.Status(500).JSON(shared.Error(shared.ErrInternal, "Failed to start exam: "+err.Error()))
	}
	return c.Status(201).JSON(shared.Success(session))
}

func (h *Handler) Sync(c *fiber.Ctx) error {
	sessionID, err := uuid.Parse(c.Params("session_id"))
	if err != nil {
		return c.Status(400).JSON(shared.Error(shared.ErrValidation, "Invalid session ID"))
	}

	var req struct {
		Answers []SyncAnswerReq `json:"answers"`
	}
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(shared.Error(shared.ErrValidation, "Invalid request body"))
	}
	if len(req.Answers) == 0 {
		return c.Status(400).JSON(shared.Error(shared.ErrValidation, "answers required"))
	}

	if err := h.svc.SyncAnswers(c.Context(), sessionID, req.Answers); err != nil {
		if fe, ok := err.(*fiber.Error); ok {
			return c.Status(fe.Code).JSON(shared.Error(shared.ErrorCode(fe.Message), fe.Message))
		}
		return c.Status(500).JSON(shared.Error(shared.ErrInternal, "Failed to sync answers"))
	}
	return c.JSON(shared.Success(fiber.Map{"message": "Answers saved"}))
}

func (h *Handler) Navigate(c *fiber.Ctx) error {
	sessionID, err := uuid.Parse(c.Params("session_id"))
	if err != nil {
		return c.Status(400).JSON(shared.Error(shared.ErrValidation, "Invalid session ID"))
	}

	var req NavigateReq
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(shared.Error(shared.ErrValidation, "Invalid request body"))
	}

	if err := h.svc.Navigate(c.Context(), sessionID, req.ExamQuestionID, req.IsDoubtful); err != nil {
		if fe, ok := err.(*fiber.Error); ok {
			return c.Status(fe.Code).JSON(shared.Error(shared.ErrorCode(fe.Message), fe.Message))
		}
		return c.Status(500).JSON(shared.Error(shared.ErrInternal, "Failed to navigate"))
	}
	return c.JSON(shared.Success(fiber.Map{"message": "Doubtful flag updated"}))
}

func (h *Handler) Pause(c *fiber.Ctx) error {
	sessionID, err := uuid.Parse(c.Params("session_id"))
	if err != nil {
		return c.Status(400).JSON(shared.Error(shared.ErrValidation, "Invalid session ID"))
	}

	var req PauseReq
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(shared.Error(shared.ErrValidation, "Invalid request body"))
	}

	if err := h.svc.Pause(c.Context(), sessionID, req.RemainingSeconds); err != nil {
		if fe, ok := err.(*fiber.Error); ok {
			return c.Status(fe.Code).JSON(shared.Error(shared.ErrorCode(fe.Message), fe.Message))
		}
		return c.Status(500).JSON(shared.Error(shared.ErrInternal, "Failed to pause session"))
	}
	return c.JSON(shared.Success(fiber.Map{"message": "Session paused"}))
}

func (h *Handler) Resume(c *fiber.Ctx) error {
	sessionID, err := uuid.Parse(c.Params("session_id"))
	if err != nil {
		return c.Status(400).JSON(shared.Error(shared.ErrValidation, "Invalid session ID"))
	}

	if err := h.svc.Resume(c.Context(), sessionID); err != nil {
		if fe, ok := err.(*fiber.Error); ok {
			return c.Status(fe.Code).JSON(shared.Error(shared.ErrorCode(fe.Message), fe.Message))
		}
		return c.Status(500).JSON(shared.Error(shared.ErrInternal, "Failed to resume session"))
	}
	return c.JSON(shared.Success(fiber.Map{"message": "Session resumed"}))
}

func (h *Handler) Finish(c *fiber.Ctx) error {
	sessionID, err := uuid.Parse(c.Params("session_id"))
	if err != nil {
		return c.Status(400).JSON(shared.Error(shared.ErrValidation, "Invalid session ID"))
	}

	result, err := h.svc.Finish(c.Context(), sessionID)
	if err != nil {
		if fe, ok := err.(*fiber.Error); ok {
			return c.Status(fe.Code).JSON(shared.Error(shared.ErrorCode(fe.Message), fe.Message))
		}
		return c.Status(500).JSON(shared.Error(shared.ErrInternal, "Failed to finish exam"))
	}
	return c.JSON(shared.Success(result))
}

func (h *Handler) ReportViolation(c *fiber.Ctx) error {
	sessionID, err := uuid.Parse(c.Params("session_id"))
	if err != nil {
		return c.Status(400).JSON(shared.Error(shared.ErrValidation, "Invalid session ID"))
	}

	var req ViolationReq
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(shared.Error(shared.ErrValidation, "Invalid request body"))
	}

	validTypes := map[string]bool{
		"FULLSCREEN_EXIT": true, "TAB_SWITCH": true, "KEYBOARD_SHORTCUT": true,
		"DEVTOOLS_OPEN": true, "COPY_ATTEMPT": true, "MULTIPLE_IP": true, "SUSPICIOUS_ACTIVITY": true,
	}
	if !validTypes[req.ViolationType] {
		return c.Status(400).JSON(shared.Error(shared.ErrValidation, "Invalid violation type"))
	}

	session, err := h.svc.ReportViolation(c.Context(), sessionID, req.ViolationType, req.Details)
	if err != nil {
		if fe, ok := err.(*fiber.Error); ok {
			return c.Status(fe.Code).JSON(shared.Error(shared.ErrorCode(fe.Message), fe.Message))
		}
		return c.Status(500).JSON(shared.Error(shared.ErrInternal, "Failed to report violation"))
	}

	// TODO: Broadcast violation_alert via WebSocket hub.
	//   import and call wsHub.SendToRole("ADMIN", msg) or wsHub.Broadcast <- msgBytes
	//   This will push real-time violation to all connected proctors.

	return c.JSON(shared.Success(session))
}

func (h *Handler) GetAnswers(c *fiber.Ctx) error {
	sessionID, err := uuid.Parse(c.Params("session_id"))
	if err != nil {
		return c.Status(400).JSON(shared.Error(shared.ErrValidation, "Invalid session ID"))
	}

	answers, err := h.svc.GetAnswers(c.Context(), sessionID)
	if err != nil {
		if fe, ok := err.(*fiber.Error); ok {
			return c.Status(fe.Code).JSON(shared.Error(shared.ErrorCode(fe.Message), fe.Message))
		}
		return c.Status(500).JSON(shared.Error(shared.ErrInternal, "Failed to get answers"))
	}
	return c.JSON(shared.Success(answers))
}

func (h *Handler) GetSessionQuestions(c *fiber.Ctx) error {
	sessionID, err := uuid.Parse(c.Params("session_id"))
	if err != nil {
		return c.Status(400).JSON(shared.Error(shared.ErrValidation, "Invalid session ID"))
	}

	questions, err := h.svc.GetSessionQuestions(c.Context(), sessionID)
	if err != nil {
		if fe, ok := err.(*fiber.Error); ok {
			return c.Status(fe.Code).JSON(shared.Error(shared.ErrorCode(fe.Message), fe.Message))
		}
		return c.Status(500).JSON(shared.Error(shared.ErrInternal, "Failed to get session questions"))
	}
	return c.JSON(shared.Success(questions))
}

func (h *Handler) GetReview(c *fiber.Ctx) error {
	sessionID, err := uuid.Parse(c.Params("session_id"))
	if err != nil {
		return c.Status(400).JSON(shared.Error(shared.ErrValidation, "Invalid session ID"))
	}

	userID := uuid.MustParse(c.Locals("user_id").(string))

	review, err := h.svc.GetSessionReview(c.Context(), sessionID)
	if err != nil {
		if fe, ok := err.(*fiber.Error); ok {
			return c.Status(fe.Code).JSON(shared.Error(shared.ErrorCode(fe.Message), fe.Message))
		}
		return c.Status(500).JSON(shared.Error(shared.ErrInternal, "Failed to get review"))
	}
	if review == nil || review.UserID != userID {
		return c.Status(404).JSON(shared.Error(shared.ErrNotFound, "Session not found"))
	}
	return c.JSON(shared.Success(review))
}

func (h *Handler) ListSessions(c *fiber.Ctx) error {
	userID := uuid.MustParse(c.Locals("user_id").(string))
	sessions, err := h.svc.ListUserSessions(c.Context(), userID)
	if err != nil {
		return c.Status(500).JSON(shared.Error(shared.ErrInternal, "Failed to list sessions"))
	}
	return c.JSON(shared.Success(sessions))
}

func itoa(n int) string {
	if n == 0 {
		return "0"
	}
	s := ""
	for n > 0 {
		s = string(rune('0'+n%10)) + s
		n /= 10
	}
	return s
}
