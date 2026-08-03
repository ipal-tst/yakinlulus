package academic

import (
	"context"
	"errors"
	"strings"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"yakinlulus.id/backend/internal/middleware"
	"yakinlulus.id/backend/internal/shared"
)

// --- Domain ---

type EducationLevel struct {
	ID           uuid.UUID `json:"id"`
	Name         string    `json:"name"`
	Code         string    `json:"code"`
	DisplayOrder int       `json:"display_order"`
	IsActive     bool      `json:"is_active"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}

type Grade struct {
	ID               uuid.UUID `json:"id"`
	EducationLevelID uuid.UUID `json:"education_level_id"`
	LevelCode        string    `json:"level_code,omitempty"`
	Name             string    `json:"name"`
	Alias            *string   `json:"alias,omitempty"`
	DisplayOrder     int       `json:"display_order"`
	IsActive         bool      `json:"is_active"`
	CreatedAt        time.Time `json:"created_at"`
	UpdatedAt        time.Time `json:"updated_at"`
}

type Subject struct {
	ID           uuid.UUID  `json:"id"`
	LevelID      uuid.UUID  `json:"level_id"`
	GradeID      *uuid.UUID `json:"grade_id,omitempty"`
	LevelCode    string     `json:"level_code,omitempty"`
	LevelName    string     `json:"level_name,omitempty"`
	GradeCode    string     `json:"grade_code,omitempty"`
	GradeName    string     `json:"grade_name,omitempty"`
	Name         string     `json:"name"`
	Code         string     `json:"code"`
	Description  *string    `json:"description,omitempty"`
	IsActive     bool       `json:"is_active"`
	DisplayOrder int        `json:"display_order"`
	CreatedAt    time.Time  `json:"created_at"`
	UpdatedAt    time.Time  `json:"updated_at"`
}

type Chapter struct {
	ID           uuid.UUID `json:"id"`
	SubjectID    uuid.UUID `json:"subject_id"`
	Name         string    `json:"name"`
	Description  *string   `json:"description,omitempty"`
	DisplayOrder int       `json:"display_order"`
	IsActive     bool      `json:"is_active"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
	SubjectName  string    `json:"subject_name,omitempty"`
}

type Curriculum struct {
	ID           uuid.UUID `json:"id"`
	Name         string    `json:"name"`
	Code         string    `json:"code"`
	Description  *string   `json:"description,omitempty"`
	IsActive     bool      `json:"is_active"`
	DisplayOrder int       `json:"display_order"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}

type Program struct {
	ID               uuid.UUID `json:"id"`
	Code             string    `json:"code"`
	Name             string    `json:"name"`
	AcademicYear     string    `json:"academic_year"`
	TargetType       string    `json:"target_type"`
	Status           string    `json:"status"`
	Description      *string   `json:"description,omitempty"`
	EnrolledStudents int       `json:"enrolled_students"`
	IsActive         bool      `json:"is_active"`
	CreatedAt        time.Time `json:"created_at"`
	UpdatedAt        time.Time `json:"updated_at"`
}

type Topic struct {
	ID           uuid.UUID `json:"id"`
	ChapterID    uuid.UUID `json:"chapter_id"`
	Title        string    `json:"title"`
	Sequence     int       `json:"sequence"`
	Description  *string   `json:"description,omitempty"`
	IsActive     bool      `json:"is_active"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
	ChapterName  string    `json:"chapter_name,omitempty"`
	SubjectName  string    `json:"subject_name,omitempty"`
}

type LearningOutcome struct {
	ID           uuid.UUID  `json:"id"`
	TopicID      uuid.UUID  `json:"topic_id"`
	Code         *string    `json:"code,omitempty"`
	Title        string     `json:"title"`
	Sequence     int        `json:"sequence"`
	Description  *string    `json:"description,omitempty"`
	BloomDefault *string    `json:"bloom_default,omitempty"`
	IsActive     bool       `json:"is_active"`
	CreatedAt    time.Time  `json:"created_at"`
	UpdatedAt    time.Time  `json:"updated_at"`
}

type CreateTopicReq struct {
	ChapterID   string `json:"chapter_id"`
	Title       string `json:"title"`
	Sequence    int    `json:"sequence"`
	Description string `json:"description,omitempty"`
}

type UpdateTopicReq struct {
	Title       string `json:"title"`
	Sequence    int    `json:"sequence"`
	Description string `json:"description,omitempty"`
}

type CreateLearningOutcomeReq struct {
	TopicID      string  `json:"topic_id"`
	Code         string  `json:"code,omitempty"`
	Title        string  `json:"title"`
	Sequence     int     `json:"sequence"`
	Description  string  `json:"description,omitempty"`
	BloomDefault string  `json:"bloom_default,omitempty"`
}

type UpdateLearningOutcomeReq struct {
	Code         string `json:"code,omitempty"`
	Title        string `json:"title"`
	Sequence     int    `json:"sequence"`
	Description  string `json:"description,omitempty"`
	BloomDefault string `json:"bloom_default,omitempty"`
}

// --- Repository ---

type Repository struct {
	pool *pgxpool.Pool
}

func NewRepository(pool *pgxpool.Pool) *Repository {
	return &Repository{pool: pool}
}

func (r *Repository) ListLevels(ctx context.Context) ([]EducationLevel, error) {
	rows, err := r.pool.Query(ctx, "SELECT id, name, code, display_order, is_active, created_at, updated_at FROM education_levels ORDER BY display_order")
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	return scanLevels(rows)
}

func (r *Repository) ListGrades(ctx context.Context) ([]Grade, error) {
	rows, err := r.pool.Query(ctx, `
		SELECT g.id, g.education_level_id, COALESCE(el.code, ''), g.name, g.alias, g.display_order, g.is_active, g.created_at, g.updated_at 
		FROM grades g
		LEFT JOIN education_levels el ON g.education_level_id = el.id
		ORDER BY g.display_order
	`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var list []Grade
	for rows.Next() {
		var g Grade
		if err := rows.Scan(&g.ID, &g.EducationLevelID, &g.LevelCode, &g.Name, &g.Alias, &g.DisplayOrder, &g.IsActive, &g.CreatedAt, &g.UpdatedAt); err != nil {
			return nil, err
		}
		list = append(list, g)
	}
	return list, nil
}

func (r *Repository) CreateGrade(ctx context.Context, g *Grade) error {
	g.ID = uuid.New()
	g.IsActive = true
	_, err := r.pool.Exec(ctx,
		`INSERT INTO grades (id, education_level_id, name, alias, display_order, is_active) VALUES ($1,$2,$3,$4,$5,$6)`,
		g.ID, g.EducationLevelID, g.Name, g.Alias, g.DisplayOrder, g.IsActive)
	return err
}

func (r *Repository) UpdateGrade(ctx context.Context, g *Grade) error {
	_, err := r.pool.Exec(ctx,
		`UPDATE grades SET name=$1, alias=$2, display_order=$3, updated_at=NOW() WHERE id=$4`,
		g.Name, g.Alias, g.DisplayOrder, g.ID)
	return err
}

func (r *Repository) DeleteGrade(ctx context.Context, id uuid.UUID) error {
	_, err := r.pool.Exec(ctx, `DELETE FROM grades WHERE id=$1`, id)
	return err
}

func (r *Repository) FindEducationLevelByCodeOrID(ctx context.Context, levelIDOrCode string) (*uuid.UUID, error) {
	if parsedID, err := uuid.Parse(levelIDOrCode); err == nil {
		var exists bool
		if err := r.pool.QueryRow(ctx, `SELECT EXISTS(SELECT 1 FROM education_levels WHERE id=$1)`, parsedID).Scan(&exists); err != nil {
			return nil, err
		}
		if exists {
			return &parsedID, nil
		}
		return nil, nil
	}
	var id uuid.UUID
	err := r.pool.QueryRow(ctx, `SELECT id FROM education_levels WHERE UPPER(code)=UPPER($1) OR UPPER(name)=UPPER($1) LIMIT 1`, levelIDOrCode).Scan(&id)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	return &id, nil
}

// EnsureEducationLevel returns the id of the education level matching code,
// creating it if it does not exist yet.
func (r *Repository) EnsureEducationLevel(ctx context.Context, code string) (*uuid.UUID, error) {
	levelID, err := r.FindEducationLevelByCodeOrID(ctx, code)
	if err != nil {
		return nil, err
	}
	if levelID != nil {
		return levelID, nil
	}
	l := &EducationLevel{Name: levelNameFromCode(code), Code: code}
	if err := r.CreateLevel(ctx, l); err != nil {
		return nil, err
	}
	return &l.ID, nil
}

// resolveLevelCode determines which level code/identifier should be used.
func resolveLevelCode(levelCode, educationLevelID string) string {
	if levelCode != "" {
		return levelCode
	}
	if educationLevelID != "" {
		return educationLevelID
	}
	return "SD"
}

// levelNameFromCode returns a human-readable name for a known level code.
func levelNameFromCode(code string) string {
	switch strings.ToUpper(code) {
	case "SD":
		return "Sekolah Dasar"
	case "SMP":
		return "Sekolah Menengah Pertama"
	case "SMA":
		return "Sekolah Menengah Atas"
	case "SMK":
		return "Sekolah Menengah Kejuruan"
	case "ALUMNI":
		return "Alumni / Gap Year"
	case "UTBK":
		return "Persiapan UTBK"
	default:
		return code
	}
}

func (r *Repository) ListCurriculums(ctx context.Context) ([]Curriculum, error) {
	rows, err := r.pool.Query(ctx, `
		SELECT id, name, code, COALESCE(description, ''), is_active, created_at, updated_at
		FROM curriculums
		ORDER BY created_at ASC
	`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var list []Curriculum
	for rows.Next() {
		var c Curriculum
		if err := rows.Scan(&c.ID, &c.Name, &c.Code, &c.Description, &c.IsActive, &c.CreatedAt, &c.UpdatedAt); err != nil {
			return nil, err
		}
		list = append(list, c)
	}
	return list, nil
}

func (r *Repository) CreateCurriculum(ctx context.Context, c *Curriculum) error {
	c.ID = uuid.New()
	c.IsActive = true
	_, err := r.pool.Exec(ctx,
		`INSERT INTO curriculums (id, name, code, description, is_active) VALUES ($1,$2,$3,$4,$5)`,
		c.ID, c.Name, c.Code, c.Description, c.IsActive)
	return err
}

func (r *Repository) UpdateCurriculum(ctx context.Context, c *Curriculum) error {
	_, err := r.pool.Exec(ctx,
		`UPDATE curriculums SET name=$1, code=$2, description=$3, updated_at=NOW() WHERE id=$4`,
		c.Name, c.Code, c.Description, c.ID)
	return err
}

func (r *Repository) DeleteCurriculum(ctx context.Context, id uuid.UUID) error {
	_, err := r.pool.Exec(ctx, `DELETE FROM curriculums WHERE id=$1`, id)
	return err
}

func (r *Repository) ListPrograms(ctx context.Context) ([]Program, error) {
	rows, err := r.pool.Query(ctx, `
		SELECT id, code, name, academic_year, target_type, status,
		       COALESCE(description, ''), enrolled_students, is_active, created_at, updated_at
		FROM academic_programs
		ORDER BY created_at ASC
	`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var list []Program
	for rows.Next() {
		var p Program
		if err := rows.Scan(&p.ID, &p.Code, &p.Name, &p.AcademicYear, &p.TargetType, &p.Status,
			&p.Description, &p.EnrolledStudents, &p.IsActive, &p.CreatedAt, &p.UpdatedAt); err != nil {
			return nil, err
		}
		list = append(list, p)
	}
	return list, nil
}

func (r *Repository) CreateProgram(ctx context.Context, p *Program) error {
	p.ID = uuid.New()
	p.IsActive = true
	_, err := r.pool.Exec(ctx,
		`INSERT INTO academic_programs (id, code, name, academic_year, target_type, status, description, enrolled_students, is_active)
		 VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
		p.ID, p.Code, p.Name, p.AcademicYear, p.TargetType, p.Status, p.Description, p.EnrolledStudents, p.IsActive)
	return err
}

func (r *Repository) UpdateProgram(ctx context.Context, p *Program) error {
	_, err := r.pool.Exec(ctx,
		`UPDATE academic_programs SET code=$1, name=$2, academic_year=$3, target_type=$4, status=$5,
		 description=$6, updated_at=NOW() WHERE id=$7`,
		p.Code, p.Name, p.AcademicYear, p.TargetType, p.Status, p.Description, p.ID)
	return err
}

func (r *Repository) DeleteProgram(ctx context.Context, id uuid.UUID) error {
	_, err := r.pool.Exec(ctx, `DELETE FROM academic_programs WHERE id=$1`, id)
	return err
}

func (r *Repository) GetLevel(ctx context.Context, id uuid.UUID) (*EducationLevel, error) {
	row, err := r.pool.Query(ctx, "SELECT id, name, code, display_order, is_active, created_at, updated_at FROM education_levels WHERE id=$1", id)
	if err != nil {
		return nil, err
	}
	defer row.Close()
	if !row.Next() {
		return nil, nil
	}
	var l EducationLevel
	if err := row.Scan(&l.ID, &l.Name, &l.Code, &l.DisplayOrder, &l.IsActive, &l.CreatedAt, &l.UpdatedAt); err != nil {
		return nil, err
	}
	return &l, nil
}

func (r *Repository) CreateLevel(ctx context.Context, l *EducationLevel) error {
	l.ID = uuid.New()
	l.IsActive = true
	_, err := r.pool.Exec(ctx,
		`INSERT INTO education_levels (id, name, code, display_order, is_active) VALUES ($1,$2,$3,$4,$5)`,
		l.ID, l.Name, l.Code, l.DisplayOrder, l.IsActive)
	return err
}

func (r *Repository) UpdateLevel(ctx context.Context, l *EducationLevel) error {
	_, err := r.pool.Exec(ctx,
		`UPDATE education_levels SET name=$1, code=$2, display_order=$3, updated_at=NOW() WHERE id=$4`,
		l.Name, l.Code, l.DisplayOrder, l.ID)
	return err
}

func (r *Repository) DeleteLevel(ctx context.Context, id uuid.UUID) error {
	tx, err := r.pool.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)

	// Clean up unified contents referencing subjects/grades under this level
	_, _ = tx.Exec(ctx, `DELETE FROM content_question_options WHERE content_id IN (
		SELECT id FROM contents WHERE subject_id IN (SELECT id FROM subjects WHERE level_id=$1)
		OR grade_id IN (SELECT id FROM grades WHERE education_level_id=$1)
	)`, id)
	_, _ = tx.Exec(ctx, `DELETE FROM content_questions WHERE content_id IN (
		SELECT id FROM contents WHERE subject_id IN (SELECT id FROM subjects WHERE level_id=$1)
		OR grade_id IN (SELECT id FROM grades WHERE education_level_id=$1)
	)`, id)
	_, _ = tx.Exec(ctx, `DELETE FROM content_materials WHERE content_id IN (
		SELECT id FROM contents WHERE subject_id IN (SELECT id FROM subjects WHERE level_id=$1)
		OR grade_id IN (SELECT id FROM grades WHERE education_level_id=$1)
	)`, id)
	_, _ = tx.Exec(ctx, `DELETE FROM content_exams WHERE content_id IN (
		SELECT id FROM contents WHERE subject_id IN (SELECT id FROM subjects WHERE level_id=$1)
		OR grade_id IN (SELECT id FROM grades WHERE education_level_id=$1)
	)`, id)
	_, _ = tx.Exec(ctx, `DELETE FROM contents WHERE subject_id IN (SELECT id FROM subjects WHERE level_id=$1)
		OR grade_id IN (SELECT id FROM grades WHERE education_level_id=$1)`, id)

	_, _ = tx.Exec(ctx, `DELETE FROM learning_outcomes WHERE topic_id IN (
		SELECT id FROM topics WHERE chapter_id IN (
			SELECT id FROM chapters WHERE subject_id IN (
				SELECT id FROM subjects WHERE level_id=$1
			)
		)
	)`, id)
	_, _ = tx.Exec(ctx, `DELETE FROM topics WHERE chapter_id IN (
		SELECT id FROM chapters WHERE subject_id IN (
			SELECT id FROM subjects WHERE level_id=$1
		)
	)`, id)
	_, _ = tx.Exec(ctx, `DELETE FROM chapters WHERE subject_id IN (SELECT id FROM subjects WHERE level_id=$1)`, id)
	_, _ = tx.Exec(ctx, `DELETE FROM subjects WHERE level_id=$1`, id)
	_, _ = tx.Exec(ctx, `DELETE FROM grades WHERE education_level_id=$1`, id)

	// Clean up optional school/profile references if any
	_, _ = tx.Exec(ctx, `UPDATE schools SET level_id = NULL WHERE level_id=$1`, id)

	_, err = tx.Exec(ctx, `DELETE FROM education_levels WHERE id=$1`, id)
	if err != nil {
		return err
	}
	return tx.Commit(ctx)
}

func (r *Repository) ListSubjects(ctx context.Context, levelID, gradeID *uuid.UUID) ([]Subject, error) {
	query := `SELECT s.id, s.level_id, s.grade_id,
		COALESCE(el.code, ''), COALESCE(el.name, ''),
		COALESCE(g.alias, ''), COALESCE(g.name, ''),
		s.name, s.code, s.description, s.is_active, s.display_order, s.created_at, s.updated_at
		FROM subjects s
		LEFT JOIN education_levels el ON s.level_id = el.id
		LEFT JOIN grades g ON s.grade_id = g.id`
	var rows pgx.Rows
	var err error
	switch {
	case gradeID != nil:
		rows, err = r.pool.Query(ctx, query+` WHERE s.grade_id=$1 ORDER BY s.display_order`, *gradeID)
	case levelID != nil:
		rows, err = r.pool.Query(ctx, query+` WHERE s.level_id=$1 ORDER BY s.display_order`, *levelID)
	default:
		rows, err = r.pool.Query(ctx, query+` ORDER BY s.display_order`)
	}
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	return scanSubjects(rows)
}

func (r *Repository) GetUserGradeID(ctx context.Context, userID uuid.UUID) (*uuid.UUID, error) {
	var gradeID uuid.UUID
	err := r.pool.QueryRow(ctx, `SELECT grade_id FROM users WHERE id = $1`, userID).Scan(&gradeID)
	if err != nil {
		return nil, err
	}
	return &gradeID, nil
}

func (r *Repository) GetSubject(ctx context.Context, id uuid.UUID) (*Subject, error) {
	row, err := r.pool.Query(ctx, `SELECT s.id, s.level_id, s.grade_id,
		COALESCE(el.code, ''), COALESCE(el.name, ''),
		COALESCE(g.alias, ''), COALESCE(g.name, ''),
		s.name, s.code, s.description, s.is_active, s.display_order, s.created_at, s.updated_at
		FROM subjects s
		LEFT JOIN education_levels el ON s.level_id = el.id
		LEFT JOIN grades g ON s.grade_id = g.id
		WHERE s.id=$1`, id)
	if err != nil {
		return nil, err
	}
	defer row.Close()
	if !row.Next() {
		return nil, nil
	}
	var s Subject
	if err := row.Scan(&s.ID, &s.LevelID, &s.GradeID,
		&s.LevelCode, &s.LevelName,
		&s.GradeCode, &s.GradeName,
		&s.Name, &s.Code, &s.Description, &s.IsActive, &s.DisplayOrder, &s.CreatedAt, &s.UpdatedAt); err != nil {
		return nil, err
	}
	return &s, nil
}

func (r *Repository) CreateSubject(ctx context.Context, s *Subject) error {
	s.ID = uuid.New()
	s.IsActive = true
	_, err := r.pool.Exec(ctx,
		`INSERT INTO subjects (id, level_id, grade_id, name, code, description, display_order, is_active) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
		s.ID, s.LevelID, s.GradeID, s.Name, s.Code, s.Description, s.DisplayOrder, s.IsActive)
	return err
}

func (r *Repository) UpdateSubject(ctx context.Context, s *Subject) error {
	_, err := r.pool.Exec(ctx,
		`UPDATE subjects SET name=$1, code=$2, description=$3, display_order=$4, updated_at=NOW() WHERE id=$5`,
		s.Name, s.Code, s.Description, s.DisplayOrder, s.ID)
	return err
}

func (r *Repository) DeleteSubject(ctx context.Context, id uuid.UUID) error {
	tx, err := r.pool.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)

	// Clean up unified contents referencing this subject
	_, _ = tx.Exec(ctx, `DELETE FROM content_question_options WHERE content_id IN (SELECT id FROM contents WHERE subject_id=$1)`, id)
	_, _ = tx.Exec(ctx, `DELETE FROM content_questions WHERE content_id IN (SELECT id FROM contents WHERE subject_id=$1)`, id)
	_, _ = tx.Exec(ctx, `DELETE FROM content_materials WHERE content_id IN (SELECT id FROM contents WHERE subject_id=$1)`, id)
	_, _ = tx.Exec(ctx, `DELETE FROM content_exams WHERE content_id IN (SELECT id FROM contents WHERE subject_id=$1)`, id)
	_, _ = tx.Exec(ctx, `DELETE FROM contents WHERE subject_id=$1`, id)

	_, _ = tx.Exec(ctx, `DELETE FROM learning_outcomes WHERE topic_id IN (
		SELECT id FROM topics WHERE chapter_id IN (
			SELECT id FROM chapters WHERE subject_id=$1
		)
	)`, id)
	_, _ = tx.Exec(ctx, `DELETE FROM topics WHERE chapter_id IN (
		SELECT id FROM chapters WHERE subject_id=$1
	)`, id)
	_, _ = tx.Exec(ctx, `DELETE FROM chapters WHERE subject_id=$1`, id)

	_, err = tx.Exec(ctx, `DELETE FROM subjects WHERE id=$1`, id)
	if err != nil {
		return err
	}
	return tx.Commit(ctx)
}

func (r *Repository) ListChapters(ctx context.Context, subjectID uuid.UUID) ([]Chapter, error) {
	rows, err := r.pool.Query(ctx, "SELECT id, subject_id, name, description, display_order, is_active, created_at, updated_at FROM chapters WHERE subject_id=$1 ORDER BY display_order", subjectID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	return scanChapters(rows)
}

func (r *Repository) ListAllChapters(ctx context.Context) ([]Chapter, error) {
	rows, err := r.pool.Query(ctx, `SELECT c.id, c.subject_id, c.name, c.description, c.display_order, c.is_active, c.created_at, c.updated_at, COALESCE(s.name, '')::text
		FROM chapters c
		LEFT JOIN subjects s ON c.subject_id = s.id
		ORDER BY s.name, c.display_order`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var chapters []Chapter
	for rows.Next() {
		var c Chapter
		if err := rows.Scan(&c.ID, &c.SubjectID, &c.Name, &c.Description, &c.DisplayOrder, &c.IsActive, &c.CreatedAt, &c.UpdatedAt, &c.SubjectName); err != nil {
			return nil, err
		}
		chapters = append(chapters, c)
	}
	return chapters, nil
}

func (r *Repository) GetChapter(ctx context.Context, id uuid.UUID) (*Chapter, error) {
	row, err := r.pool.Query(ctx, "SELECT id, subject_id, name, description, display_order, is_active, created_at, updated_at FROM chapters WHERE id=$1", id)
	if err != nil {
		return nil, err
	}
	defer row.Close()
	if !row.Next() {
		return nil, nil
	}
	var c Chapter
	if err := row.Scan(&c.ID, &c.SubjectID, &c.Name, &c.Description, &c.DisplayOrder, &c.IsActive, &c.CreatedAt, &c.UpdatedAt); err != nil {
		return nil, err
	}
	return &c, nil
}

func (r *Repository) CreateChapter(ctx context.Context, c *Chapter) error {
	c.ID = uuid.New()
	c.IsActive = true
	_, err := r.pool.Exec(ctx,
		`INSERT INTO chapters (id, subject_id, name, description, display_order, is_active) VALUES ($1,$2,$3,$4,$5,$6)`,
		c.ID, c.SubjectID, c.Name, c.Description, c.DisplayOrder, c.IsActive)
	return err
}

func (r *Repository) UpdateChapter(ctx context.Context, c *Chapter) error {
	_, err := r.pool.Exec(ctx,
		`UPDATE chapters SET name=$1, description=$2, display_order=$3, updated_at=NOW() WHERE id=$4`,
		c.Name, c.Description, c.DisplayOrder, c.ID)
	return err
}

func (r *Repository) DeleteChapter(ctx context.Context, id uuid.UUID) error {
	tx, err := r.pool.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)

	// Clean up unified contents referencing this chapter
	_, _ = tx.Exec(ctx, `DELETE FROM content_question_options WHERE content_id IN (SELECT id FROM contents WHERE chapter_id=$1)`, id)
	_, _ = tx.Exec(ctx, `DELETE FROM content_questions WHERE content_id IN (SELECT id FROM contents WHERE chapter_id=$1)`, id)
	_, _ = tx.Exec(ctx, `DELETE FROM content_materials WHERE content_id IN (SELECT id FROM contents WHERE chapter_id=$1)`, id)
	_, _ = tx.Exec(ctx, `DELETE FROM content_exams WHERE content_id IN (SELECT id FROM contents WHERE chapter_id=$1)`, id)
	_, _ = tx.Exec(ctx, `DELETE FROM contents WHERE chapter_id=$1`, id)

	_, _ = tx.Exec(ctx, `DELETE FROM learning_outcomes WHERE topic_id IN (
		SELECT id FROM topics WHERE chapter_id=$1
	)`, id)
	_, _ = tx.Exec(ctx, `DELETE FROM topics WHERE chapter_id=$1`, id)

	_, err = tx.Exec(ctx, `DELETE FROM chapters WHERE id=$1`, id)
	if err != nil {
		return err
	}
	return tx.Commit(ctx)
}

func (r *Repository) ListAllTopics(ctx context.Context) ([]Topic, error) {
	rows, err := r.pool.Query(ctx, `SELECT t.id, t.chapter_id, t.title, t.sequence, t.description, t.is_active, t.created_at, t.updated_at, COALESCE(ch.name, '')::text, COALESCE(s.name, '')::text
		FROM topics t
		LEFT JOIN chapters ch ON t.chapter_id = ch.id
		LEFT JOIN subjects s ON ch.subject_id = s.id
		ORDER BY s.name, ch.display_order, t.sequence`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var topics []Topic
	for rows.Next() {
		var t Topic
		if err := rows.Scan(&t.ID, &t.ChapterID, &t.Title, &t.Sequence, &t.Description, &t.IsActive, &t.CreatedAt, &t.UpdatedAt, &t.ChapterName, &t.SubjectName); err != nil {
			return nil, err
		}
		topics = append(topics, t)
	}
	return topics, nil
}

func (r *Repository) CreateTopic(ctx context.Context, t *Topic) error {
	t.ID = uuid.New()
	t.IsActive = true
	_, err := r.pool.Exec(ctx,
		`INSERT INTO topics (id, chapter_id, title, sequence, description, is_active) VALUES ($1,$2,$3,$4,$5,$6)`,
		t.ID, t.ChapterID, t.Title, t.Sequence, t.Description, t.IsActive)
	return err
}

func (r *Repository) GetTopic(ctx context.Context, id uuid.UUID) (*Topic, error) {
	var t Topic
	err := r.pool.QueryRow(ctx,
		`SELECT id, chapter_id, title, sequence, description, is_active, created_at, updated_at FROM topics WHERE id=$1`, id,
	).Scan(&t.ID, &t.ChapterID, &t.Title, &t.Sequence, &t.Description, &t.IsActive, &t.CreatedAt, &t.UpdatedAt)
	if err != nil {
		return nil, err
	}
	return &t, nil
}

func (r *Repository) UpdateTopic(ctx context.Context, id uuid.UUID, t *Topic) error {
	_, err := r.pool.Exec(ctx,
		`UPDATE topics SET title=$1, sequence=$2, description=$3, updated_at=NOW() WHERE id=$4`,
		t.Title, t.Sequence, t.Description, id)
	return err
}

func (r *Repository) DeleteTopic(ctx context.Context, id uuid.UUID) error {
	tx, err := r.pool.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)

	_, _ = tx.Exec(ctx, `DELETE FROM learning_outcomes WHERE topic_id=$1`, id)
	_, err = tx.Exec(ctx, `DELETE FROM topics WHERE id=$1`, id)
	if err != nil {
		return err
	}
	return tx.Commit(ctx)
}

func (r *Repository) ListLearningOutcomes(ctx context.Context, topicID uuid.UUID) ([]LearningOutcome, error) {
	rows, err := r.pool.Query(ctx, `SELECT id, topic_id, code, title, sequence, description, bloom_default, is_active, created_at, updated_at FROM learning_outcomes WHERE topic_id=$1 ORDER BY sequence`, topicID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var outcomes []LearningOutcome
	for rows.Next() {
		var o LearningOutcome
		if err := rows.Scan(&o.ID, &o.TopicID, &o.Code, &o.Title, &o.Sequence, &o.Description, &o.BloomDefault, &o.IsActive, &o.CreatedAt, &o.UpdatedAt); err != nil {
			return nil, err
		}
		outcomes = append(outcomes, o)
	}
	return outcomes, nil
}

func (r *Repository) CreateLearningOutcome(ctx context.Context, o *LearningOutcome) error {
	o.ID = uuid.New()
	o.IsActive = true
	_, err := r.pool.Exec(ctx,
		`INSERT INTO learning_outcomes (id, topic_id, code, title, sequence, description, bloom_default, is_active) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
		o.ID, o.TopicID, o.Code, o.Title, o.Sequence, o.Description, o.BloomDefault, o.IsActive)
	return err
}

func (r *Repository) GetLearningOutcome(ctx context.Context, id uuid.UUID) (*LearningOutcome, error) {
	var o LearningOutcome
	err := r.pool.QueryRow(ctx,
		`SELECT id, topic_id, code, title, sequence, description, bloom_default, is_active, created_at, updated_at FROM learning_outcomes WHERE id=$1`, id,
	).Scan(&o.ID, &o.TopicID, &o.Code, &o.Title, &o.Sequence, &o.Description, &o.BloomDefault, &o.IsActive, &o.CreatedAt, &o.UpdatedAt)
	if err != nil {
		return nil, err
	}
	return &o, nil
}

func (r *Repository) UpdateLearningOutcome(ctx context.Context, id uuid.UUID, o *LearningOutcome) error {
	_, err := r.pool.Exec(ctx,
		`UPDATE learning_outcomes SET code=$1, title=$2, sequence=$3, description=$4, bloom_default=$5, updated_at=NOW() WHERE id=$6`,
		o.Code, o.Title, o.Sequence, o.Description, o.BloomDefault, id)
	return err
}

func (r *Repository) DeleteLearningOutcome(ctx context.Context, id uuid.UUID) error {
	_, err := r.pool.Exec(ctx, `DELETE FROM learning_outcomes WHERE id=$1`, id)
	return err
}

// --- Scan helpers ---

func scanLevels(rows pgx.Rows) ([]EducationLevel, error) {
	var levels []EducationLevel
	for rows.Next() {
		var l EducationLevel
		if err := rows.Scan(&l.ID, &l.Name, &l.Code, &l.DisplayOrder, &l.IsActive, &l.CreatedAt, &l.UpdatedAt); err != nil {
			return nil, err
		}
		levels = append(levels, l)
	}
	return levels, nil
}

func scanSubjects(rows pgx.Rows) ([]Subject, error) {
	var subjects []Subject
	for rows.Next() {
		var s Subject
		if err := rows.Scan(&s.ID, &s.LevelID, &s.GradeID,
			&s.LevelCode, &s.LevelName,
			&s.GradeCode, &s.GradeName,
			&s.Name, &s.Code, &s.Description, &s.IsActive, &s.DisplayOrder, &s.CreatedAt, &s.UpdatedAt); err != nil {
			return nil, err
		}
		subjects = append(subjects, s)
	}
	return subjects, nil
}

func scanChapters(rows pgx.Rows) ([]Chapter, error) {
	var chapters []Chapter
	for rows.Next() {
		var c Chapter
		if err := rows.Scan(&c.ID, &c.SubjectID, &c.Name, &c.Description, &c.DisplayOrder, &c.IsActive, &c.CreatedAt, &c.UpdatedAt); err != nil {
			return nil, err
		}
		chapters = append(chapters, c)
	}
	return chapters, nil
}

// --- Service ---

type Service struct {
	repo *Repository
}

func NewService(repo *Repository) *Service {
	return &Service{repo: repo}
}

type CreateLevelReq struct {
	Name         string `json:"name"`
	Code         string `json:"code"`
	DisplayOrder int    `json:"display_order"`
}

type UpdateLevelReq struct {
	Name         string `json:"name"`
	Code         string `json:"code"`
	DisplayOrder int    `json:"display_order"`
}

type CreateGradeReq struct {
	EducationLevelID string `json:"education_level_id,omitempty"`
	LevelCode        string `json:"level_code,omitempty"`
	Name             string `json:"name"`
	Alias            string `json:"alias,omitempty"`
	DisplayOrder     int    `json:"display_order"`
}

type UpdateGradeReq struct {
	Name         string `json:"name"`
	Alias        string `json:"alias,omitempty"`
	DisplayOrder int    `json:"display_order"`
}

type CreateCurriculumReq struct {
	Name        string `json:"name"`
	Code        string `json:"code"`
	Description string `json:"description,omitempty"`
}

type UpdateCurriculumReq struct {
	Name        string `json:"name"`
	Code        string `json:"code"`
	Description string `json:"description,omitempty"`
}

type CreateProgramReq struct {
	Code         string `json:"code"`
	Name         string `json:"name"`
	AcademicYear string `json:"academic_year"`
	TargetType   string `json:"target_type"`
	Description  string `json:"description,omitempty"`
}

type UpdateProgramReq struct {
	Code         string `json:"code"`
	Name         string `json:"name"`
	AcademicYear string `json:"academic_year"`
	TargetType   string `json:"target_type"`
	Status       string `json:"status"`
	Description  string `json:"description,omitempty"`
}

type CreateSubjectReq struct {
	LevelID      string `json:"level_id"`
	GradeID      string `json:"grade_id,omitempty"`
	Name         string `json:"name"`
	Code         string `json:"code"`
	Description  string `json:"description,omitempty"`
	DisplayOrder int    `json:"display_order"`
}

type UpdateSubjectReq struct {
	Name         string `json:"name"`
	Code         string `json:"code"`
	GradeID      string `json:"grade_id,omitempty"`
	Description  string `json:"description,omitempty"`
	DisplayOrder int    `json:"display_order"`
}

type CreateChapterReq struct {
	SubjectID    string `json:"subject_id"`
	Name         string `json:"name"`
	Description  string `json:"description,omitempty"`
	DisplayOrder int    `json:"display_order"`
}

type UpdateChapterReq struct {
	Name         string `json:"name"`
	Description  string `json:"description,omitempty"`
	DisplayOrder int    `json:"display_order"`
}

func (s *Service) ListLevels(ctx context.Context) ([]EducationLevel, error) {
	return s.repo.ListLevels(ctx)
}

func (s *Service) ListGrades(ctx context.Context) ([]Grade, error) {
	return s.repo.ListGrades(ctx)
}

func (s *Service) CreateGrade(ctx context.Context, req CreateGradeReq) (*Grade, error) {
	levelCode := resolveLevelCode(req.LevelCode, req.EducationLevelID)
	levelID, err := s.repo.EnsureEducationLevel(ctx, levelCode)
	if err != nil {
		return nil, fiber.NewError(400, "Invalid education level")
	}

	aliasStr := req.Alias
	if aliasStr == "" {
		aliasStr = req.Name
	}

	g := &Grade{
		EducationLevelID: *levelID,
		Name:             req.Name,
		Alias:            &aliasStr,
		DisplayOrder:     req.DisplayOrder,
	}

	if err := s.repo.CreateGrade(ctx, g); err != nil {
		return nil, err
	}
	g.LevelCode = levelCode
	return g, nil
}

func (s *Service) UpdateGrade(ctx context.Context, id uuid.UUID, req UpdateGradeReq) (*Grade, error) {
	aliasStr := req.Alias
	g := &Grade{
		ID:           id,
		Name:         req.Name,
		Alias:        &aliasStr,
		DisplayOrder: req.DisplayOrder,
	}
	if err := s.repo.UpdateGrade(ctx, g); err != nil {
		return nil, err
	}
	return g, nil
}

func (s *Service) DeleteGrade(ctx context.Context, id uuid.UUID) error {
	return s.repo.DeleteGrade(ctx, id)
}

func (s *Service) ListCurriculums(ctx context.Context) ([]Curriculum, error) {
	return s.repo.ListCurriculums(ctx)
}

func (s *Service) CreateCurriculum(ctx context.Context, req CreateCurriculumReq) (*Curriculum, error) {
	var desc *string
	if req.Description != "" {
		desc = &req.Description
	}
	c := &Curriculum{
		Name:        req.Name,
		Code:        req.Code,
		Description: desc,
	}
	if err := s.repo.CreateCurriculum(ctx, c); err != nil {
		return nil, err
	}
	return c, nil
}

func (s *Service) UpdateCurriculum(ctx context.Context, id uuid.UUID, req UpdateCurriculumReq) (*Curriculum, error) {
	var desc *string
	if req.Description != "" {
		desc = &req.Description
	}
	c := &Curriculum{
		ID:          id,
		Name:        req.Name,
		Code:        req.Code,
		Description: desc,
	}
	if err := s.repo.UpdateCurriculum(ctx, c); err != nil {
		return nil, err
	}
	return c, nil
}

func (s *Service) DeleteCurriculum(ctx context.Context, id uuid.UUID) error {
	return s.repo.DeleteCurriculum(ctx, id)
}

func (s *Service) ListPrograms(ctx context.Context) ([]Program, error) {
	return s.repo.ListPrograms(ctx)
}

func (s *Service) CreateProgram(ctx context.Context, req CreateProgramReq) (*Program, error) {
	var desc *string
	if req.Description != "" {
		desc = &req.Description
	}
	p := &Program{
		Code:         req.Code,
		Name:         req.Name,
		AcademicYear: req.AcademicYear,
		TargetType:   req.TargetType,
		Status:       "ACTIVE",
		Description:  desc,
	}
	if err := s.repo.CreateProgram(ctx, p); err != nil {
		return nil, err
	}
	return p, nil
}

func (s *Service) UpdateProgram(ctx context.Context, id uuid.UUID, req UpdateProgramReq) (*Program, error) {
	var desc *string
	if req.Description != "" {
		desc = &req.Description
	}
	p := &Program{
		ID:           id,
		Code:         req.Code,
		Name:         req.Name,
		AcademicYear: req.AcademicYear,
		TargetType:   req.TargetType,
		Status:       req.Status,
		Description:  desc,
	}
	if err := s.repo.UpdateProgram(ctx, p); err != nil {
		return nil, err
	}
	return p, nil
}

func (s *Service) DeleteProgram(ctx context.Context, id uuid.UUID) error {
	return s.repo.DeleteProgram(ctx, id)
}

func (s *Service) GetLevel(ctx context.Context, id uuid.UUID) (*EducationLevel, error) {
	return s.repo.GetLevel(ctx, id)
}

func (s *Service) CreateLevel(ctx context.Context, req CreateLevelReq) (*EducationLevel, error) {
	l := &EducationLevel{Name: req.Name, Code: req.Code, DisplayOrder: req.DisplayOrder}
	if err := s.repo.CreateLevel(ctx, l); err != nil {
		return nil, err
	}
	return l, nil
}

func (s *Service) UpdateLevel(ctx context.Context, id uuid.UUID, req UpdateLevelReq) (*EducationLevel, error) {
	l := &EducationLevel{ID: id, Name: req.Name, Code: req.Code, DisplayOrder: req.DisplayOrder}
	if err := s.repo.UpdateLevel(ctx, l); err != nil {
		return nil, err
	}
	return s.repo.GetLevel(ctx, id)
}

func (s *Service) DeleteLevel(ctx context.Context, id uuid.UUID) error {
	return s.repo.DeleteLevel(ctx, id)
}

func (s *Service) ListSubjects(ctx context.Context, levelID, gradeID *uuid.UUID) ([]Subject, error) {
	return s.repo.ListSubjects(ctx, levelID, gradeID)
}

func (s *Service) GetSubject(ctx context.Context, id uuid.UUID) (*Subject, error) {
	return s.repo.GetSubject(ctx, id)
}

func (s *Service) CreateSubject(ctx context.Context, req CreateSubjectReq) (*Subject, error) {
	levelID, err := uuid.Parse(req.LevelID)
	if err != nil {
		return nil, fiber.NewError(400, "Invalid level_id")
	}
	sub := &Subject{LevelID: levelID, Name: req.Name, Code: req.Code, DisplayOrder: req.DisplayOrder}
	if req.GradeID != "" {
		gradeID, err := uuid.Parse(req.GradeID)
		if err != nil {
			return nil, fiber.NewError(400, "Invalid grade_id")
		}
		sub.GradeID = &gradeID
	}
	if req.Description != "" {
		sub.Description = &req.Description
	}
	if err := s.repo.CreateSubject(ctx, sub); err != nil {
		return nil, err
	}
	return sub, nil
}

func (s *Service) UpdateSubject(ctx context.Context, id uuid.UUID, req UpdateSubjectReq) (*Subject, error) {
	sub := &Subject{ID: id, Name: req.Name, Code: req.Code, DisplayOrder: req.DisplayOrder}
	if req.GradeID != "" {
		gradeID, err := uuid.Parse(req.GradeID)
		if err != nil {
			return nil, fiber.NewError(400, "Invalid grade_id")
		}
		sub.GradeID = &gradeID
	}
	if req.Description != "" {
		sub.Description = &req.Description
	}
	if err := s.repo.UpdateSubject(ctx, sub); err != nil {
		return nil, err
	}
	return s.repo.GetSubject(ctx, id)
}

func (s *Service) DeleteSubject(ctx context.Context, id uuid.UUID) error {
	return s.repo.DeleteSubject(ctx, id)
}

func (s *Service) ListChapters(ctx context.Context, subjectID uuid.UUID) ([]Chapter, error) {
	return s.repo.ListChapters(ctx, subjectID)
}

func (s *Service) ListAllChapters(ctx context.Context) ([]Chapter, error) {
	return s.repo.ListAllChapters(ctx)
}

func (s *Service) GetChapter(ctx context.Context, id uuid.UUID) (*Chapter, error) {
	return s.repo.GetChapter(ctx, id)
}

func (s *Service) CreateChapter(ctx context.Context, req CreateChapterReq) (*Chapter, error) {
	subjectID, err := uuid.Parse(req.SubjectID)
	if err != nil {
		return nil, fiber.NewError(400, "Invalid subject_id")
	}
	ch := &Chapter{SubjectID: subjectID, Name: req.Name, DisplayOrder: req.DisplayOrder}
	if req.Description != "" {
		ch.Description = &req.Description
	}
	if err := s.repo.CreateChapter(ctx, ch); err != nil {
		return nil, err
	}
	return ch, nil
}

func (s *Service) UpdateChapter(ctx context.Context, id uuid.UUID, req UpdateChapterReq) (*Chapter, error) {
	ch := &Chapter{ID: id, Name: req.Name, DisplayOrder: req.DisplayOrder}
	if req.Description != "" {
		ch.Description = &req.Description
	}
	if err := s.repo.UpdateChapter(ctx, ch); err != nil {
		return nil, err
	}
	return s.repo.GetChapter(ctx, id)
}

func (s *Service) DeleteChapter(ctx context.Context, id uuid.UUID) error {
	return s.repo.DeleteChapter(ctx, id)
}

func (s *Service) ListAllTopics(ctx context.Context) ([]Topic, error) {
	return s.repo.ListAllTopics(ctx)
}

func (s *Service) CreateTopic(ctx context.Context, req CreateTopicReq) (*Topic, error) {
	chapterID, err := uuid.Parse(req.ChapterID)
	if err != nil {
		return nil, fiber.NewError(400, "Invalid chapter_id")
	}
	t := &Topic{ChapterID: chapterID, Title: req.Title, Sequence: req.Sequence}
	if req.Description != "" {
		t.Description = &req.Description
	}
	if err := s.repo.CreateTopic(ctx, t); err != nil {
		return nil, err
	}
	return t, nil
}

func (s *Service) UpdateTopic(ctx context.Context, id uuid.UUID, req UpdateTopicReq) (*Topic, error) {
	t := &Topic{Title: req.Title, Sequence: req.Sequence}
	if req.Description != "" {
		t.Description = &req.Description
	}
	if err := s.repo.UpdateTopic(ctx, id, t); err != nil {
		return nil, err
	}
	return s.repo.GetTopic(ctx, id)
}

func (s *Service) DeleteTopic(ctx context.Context, id uuid.UUID) error {
	return s.repo.DeleteTopic(ctx, id)
}

func (s *Service) ListLearningOutcomes(ctx context.Context, topicID uuid.UUID) ([]LearningOutcome, error) {
	return s.repo.ListLearningOutcomes(ctx, topicID)
}

func (s *Service) CreateLearningOutcome(ctx context.Context, req CreateLearningOutcomeReq) (*LearningOutcome, error) {
	topicID, err := uuid.Parse(req.TopicID)
	if err != nil {
		return nil, fiber.NewError(400, "Invalid topic_id")
	}
	o := &LearningOutcome{TopicID: topicID, Title: req.Title, Sequence: req.Sequence}
	if req.Code != "" {
		o.Code = &req.Code
	}
	if req.Description != "" {
		o.Description = &req.Description
	}
	if req.BloomDefault != "" {
		o.BloomDefault = &req.BloomDefault
	}
	if err := s.repo.CreateLearningOutcome(ctx, o); err != nil {
		return nil, err
	}
	return o, nil
}

func (s *Service) UpdateLearningOutcome(ctx context.Context, id uuid.UUID, req UpdateLearningOutcomeReq) (*LearningOutcome, error) {
	o := &LearningOutcome{Title: req.Title, Sequence: req.Sequence}
	if req.Code != "" {
		o.Code = &req.Code
	}
	if req.Description != "" {
		o.Description = &req.Description
	}
	if req.BloomDefault != "" {
		o.BloomDefault = &req.BloomDefault
	}
	if err := s.repo.UpdateLearningOutcome(ctx, id, o); err != nil {
		return nil, err
	}
	return s.repo.GetLearningOutcome(ctx, id)
}

func (s *Service) DeleteLearningOutcome(ctx context.Context, id uuid.UUID) error {
	return s.repo.DeleteLearningOutcome(ctx, id)
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
	r := router.Group("/academic")
	write := middleware.RequireRole("ADMIN", "STAFF")

	// Levels
	r.Get("/levels", middleware.RequireAuth(h.jwt), h.ListLevels)
	r.Get("/levels/:id", middleware.RequireAuth(h.jwt), h.GetLevel)
	r.Post("/levels", middleware.RequireAuth(h.jwt), write, h.CreateLevel)
	r.Put("/levels/:id", middleware.RequireAuth(h.jwt), write, h.UpdateLevel)
	r.Delete("/levels/:id", middleware.RequireAuth(h.jwt), write, h.DeleteLevel)

	// Grades
	r.Get("/grades", middleware.RequireAuth(h.jwt), h.ListGrades)
	r.Post("/grades", middleware.RequireAuth(h.jwt), write, h.CreateGrade)
	r.Put("/grades/:id", middleware.RequireAuth(h.jwt), write, h.UpdateGrade)
	r.Delete("/grades/:id", middleware.RequireAuth(h.jwt), write, h.DeleteGrade)

	// Subjects
	r.Get("/subjects", middleware.RequireAuth(h.jwt), h.ListSubjects)
	r.Get("/subjects/:id", middleware.RequireAuth(h.jwt), h.GetSubject)
	r.Post("/subjects", middleware.RequireAuth(h.jwt), write, h.CreateSubject)
	r.Put("/subjects/:id", middleware.RequireAuth(h.jwt), write, h.UpdateSubject)
	r.Delete("/subjects/:id", middleware.RequireAuth(h.jwt), write, h.DeleteSubject)

	// Chapters (nested under subject, top-level CRUD)
	r.Get("/chapters", middleware.RequireAuth(h.jwt), h.ListAllChapters)
	r.Get("/subjects/:id/chapters", middleware.RequireAuth(h.jwt), h.ListChapters)
	r.Get("/chapters/:id", middleware.RequireAuth(h.jwt), h.GetChapter)
	r.Post("/chapters", middleware.RequireAuth(h.jwt), write, h.CreateChapter)
	r.Put("/chapters/:id", middleware.RequireAuth(h.jwt), write, h.UpdateChapter)
	r.Delete("/chapters/:id", middleware.RequireAuth(h.jwt), write, h.DeleteChapter)

	// Topics
	r.Get("/topics", middleware.RequireAuth(h.jwt), h.ListAllTopics)
	r.Post("/topics", middleware.RequireAuth(h.jwt), write, h.CreateTopic)
	r.Put("/topics/:id", middleware.RequireAuth(h.jwt), write, h.UpdateTopic)
	r.Delete("/topics/:id", middleware.RequireAuth(h.jwt), write, h.DeleteTopic)

	// Learning Outcomes (Sub-Topik)
	r.Get("/learning-outcomes", middleware.RequireAuth(h.jwt), h.ListLearningOutcomes)
	r.Post("/learning-outcomes", middleware.RequireAuth(h.jwt), write, h.CreateLearningOutcome)
	r.Put("/learning-outcomes/:id", middleware.RequireAuth(h.jwt), write, h.UpdateLearningOutcome)
	r.Delete("/learning-outcomes/:id", middleware.RequireAuth(h.jwt), write, h.DeleteLearningOutcome)

	// Curriculums
	r.Get("/curriculums", middleware.RequireAuth(h.jwt), h.ListCurriculums)
	r.Post("/curriculums", middleware.RequireAuth(h.jwt), write, h.CreateCurriculum)
	r.Put("/curriculums/:id", middleware.RequireAuth(h.jwt), write, h.UpdateCurriculum)
	r.Delete("/curriculums/:id", middleware.RequireAuth(h.jwt), write, h.DeleteCurriculum)

	// Programs
	r.Get("/programs", middleware.RequireAuth(h.jwt), h.ListPrograms)
	r.Post("/programs", middleware.RequireAuth(h.jwt), write, h.CreateProgram)
	r.Put("/programs/:id", middleware.RequireAuth(h.jwt), write, h.UpdateProgram)
	r.Delete("/programs/:id", middleware.RequireAuth(h.jwt), write, h.DeleteProgram)
}

func (h *Handler) ListCurriculums(c *fiber.Ctx) error {
	curriculums, err := h.svc.ListCurriculums(c.Context())
	if err != nil {
		return c.Status(500).JSON(shared.Error(shared.ErrInternal, "Failed to list curriculums"))
	}
	return c.JSON(shared.Success(curriculums))
}

func (h *Handler) CreateCurriculum(c *fiber.Ctx) error {
	var req CreateCurriculumReq
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(shared.Error(shared.ErrValidation, "Invalid request body"))
	}
	curr, err := h.svc.CreateCurriculum(c.Context(), req)
	if err != nil {
		return c.Status(500).JSON(shared.Error(shared.ErrInternal, "Failed to create curriculum"))
	}
	return c.Status(201).JSON(shared.Success(curr))
}

func (h *Handler) UpdateCurriculum(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(400).JSON(shared.Error(shared.ErrValidation, "Invalid curriculum id"))
	}
	var req UpdateCurriculumReq
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(shared.Error(shared.ErrValidation, "Invalid request body"))
	}
	curr, err := h.svc.UpdateCurriculum(c.Context(), id, req)
	if err != nil {
		return c.Status(500).JSON(shared.Error(shared.ErrInternal, "Failed to update curriculum"))
	}
	return c.JSON(shared.Success(curr))
}

func (h *Handler) DeleteCurriculum(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(400).JSON(shared.Error(shared.ErrValidation, "Invalid curriculum id"))
	}
	if err := h.svc.DeleteCurriculum(c.Context(), id); err != nil {
		return c.Status(500).JSON(shared.Error(shared.ErrInternal, "Failed to delete curriculum"))
	}
	return c.JSON(shared.Success(map[string]string{"message": "Curriculum deleted"}))
}

func (h *Handler) ListPrograms(c *fiber.Ctx) error {
	programs, err := h.svc.ListPrograms(c.Context())
	if err != nil {
		return c.Status(500).JSON(shared.Error(shared.ErrInternal, "Failed to list programs"))
	}
	return c.JSON(shared.Success(programs))
}

func (h *Handler) CreateProgram(c *fiber.Ctx) error {
	var req CreateProgramReq
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(shared.Error(shared.ErrValidation, "Invalid request body"))
	}
	program, err := h.svc.CreateProgram(c.Context(), req)
	if err != nil {
		return c.Status(500).JSON(shared.Error(shared.ErrInternal, "Failed to create program"))
	}
	return c.Status(201).JSON(shared.Success(program))
}

func (h *Handler) UpdateProgram(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(400).JSON(shared.Error(shared.ErrValidation, "Invalid program id"))
	}
	var req UpdateProgramReq
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(shared.Error(shared.ErrValidation, "Invalid request body"))
	}
	program, err := h.svc.UpdateProgram(c.Context(), id, req)
	if err != nil {
		return c.Status(500).JSON(shared.Error(shared.ErrInternal, "Failed to update program"))
	}
	return c.JSON(shared.Success(program))
}

func (h *Handler) DeleteProgram(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(400).JSON(shared.Error(shared.ErrValidation, "Invalid program id"))
	}
	if err := h.svc.DeleteProgram(c.Context(), id); err != nil {
		return c.Status(500).JSON(shared.Error(shared.ErrInternal, "Failed to delete program"))
	}
	return c.JSON(shared.Success(map[string]string{"message": "Program deleted"}))
}

func (h *Handler) ListLevels(c *fiber.Ctx) error {
	levels, err := h.svc.ListLevels(c.Context())
	if err != nil {
		return c.Status(500).JSON(shared.Error(shared.ErrInternal, "Failed to list levels"))
	}
	return c.JSON(shared.Success(levels))
}

func (h *Handler) ListGrades(c *fiber.Ctx) error {
	grades, err := h.svc.ListGrades(c.Context())
	if err != nil {
		return c.Status(500).JSON(shared.Error(shared.ErrInternal, "Failed to list grades"))
	}
	return c.JSON(shared.Success(grades))
}

func (h *Handler) CreateGrade(c *fiber.Ctx) error {
	var req CreateGradeReq
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(shared.Error(shared.ErrValidation, "Invalid request body"))
	}
	g, err := h.svc.CreateGrade(c.Context(), req)
	if err != nil {
		if e, ok := err.(*fiber.Error); ok {
			return c.Status(e.Code).JSON(shared.Error(shared.ErrorCode(e.Message), e.Message))
		}
		return c.Status(500).JSON(shared.Error(shared.ErrInternal, "Failed to create grade"))
	}
	return c.Status(201).JSON(shared.Success(g))
}

func (h *Handler) UpdateGrade(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(400).JSON(shared.Error(shared.ErrValidation, "Invalid grade id"))
	}
	var req UpdateGradeReq
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(shared.Error(shared.ErrValidation, "Invalid request body"))
	}
	g, err := h.svc.UpdateGrade(c.Context(), id, req)
	if err != nil {
		return c.Status(500).JSON(shared.Error(shared.ErrInternal, "Failed to update grade"))
	}
	return c.JSON(shared.Success(g))
}

func (h *Handler) DeleteGrade(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(400).JSON(shared.Error(shared.ErrValidation, "Invalid grade id"))
	}
	if err := h.svc.DeleteGrade(c.Context(), id); err != nil {
		return c.Status(500).JSON(shared.Error(shared.ErrInternal, "Failed to delete grade"))
	}
	return c.JSON(shared.Success(map[string]string{"message": "Grade deleted"}))
}

func (h *Handler) GetLevel(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(400).JSON(shared.Error(shared.ErrValidation, "Invalid level id"))
	}
	level, err := h.svc.GetLevel(c.Context(), id)
	if err != nil {
		return c.Status(500).JSON(shared.Error(shared.ErrInternal, "Failed to get level"))
	}
	if level == nil {
		return c.Status(404).JSON(shared.Error(shared.ErrNotFound, "Level not found"))
	}
	return c.JSON(shared.Success(level))
}

func (h *Handler) CreateLevel(c *fiber.Ctx) error {
	var req CreateLevelReq
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(shared.Error(shared.ErrValidation, "Invalid request body"))
	}
	if req.Name == "" || req.Code == "" {
		return c.Status(400).JSON(shared.Error(shared.ErrValidation, "name and code are required"))
	}
	level, err := h.svc.CreateLevel(c.Context(), req)
	if err != nil {
		return c.Status(500).JSON(shared.Error(shared.ErrInternal, "Failed to create level"))
	}
	return c.Status(201).JSON(shared.Success(level))
}

func (h *Handler) UpdateLevel(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(400).JSON(shared.Error(shared.ErrValidation, "Invalid level id"))
	}
	var req UpdateLevelReq
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(shared.Error(shared.ErrValidation, "Invalid request body"))
	}
	level, err := h.svc.UpdateLevel(c.Context(), id, req)
	if err != nil {
		return c.Status(500).JSON(shared.Error(shared.ErrInternal, "Failed to update level"))
	}
	return c.JSON(shared.Success(level))
}

func (h *Handler) DeleteLevel(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(400).JSON(shared.Error(shared.ErrValidation, "Invalid level id"))
	}
	if err := h.svc.DeleteLevel(c.Context(), id); err != nil {
		return c.Status(500).JSON(shared.Error(shared.ErrInternal, "Failed to delete level"))
	}
	return c.JSON(shared.Success(map[string]string{"message": "Level deleted"}))
}

func (h *Handler) ListSubjects(c *fiber.Ctx) error {
	levelIDStr := c.Query("level_id")
	var levelID *uuid.UUID
	if levelIDStr != "" && levelIDStr != "all" && levelIDStr != "undefined" && levelIDStr != "null" {
		id, err := uuid.Parse(levelIDStr)
		if err != nil {
			return c.Status(400).JSON(shared.Error(shared.ErrValidation, "Invalid level_id"))
		}
		levelID = &id
	}

	// For students, auto-filter subjects by their grade
	var gradeID *uuid.UUID
	if c.Locals("role") == "STUDENT" {
		if uid, err := uuid.Parse(c.Locals("user_id").(string)); err == nil {
			gid, err := h.svc.repo.GetUserGradeID(c.Context(), uid)
			if err == nil && gid != nil {
				gradeID = gid
				levelID = nil // grade filter takes precedence for students
			}
		}
	}

	subjects, err := h.svc.ListSubjects(c.Context(), levelID, gradeID)
	if err != nil {
		return c.Status(500).JSON(shared.Error(shared.ErrInternal, "Failed to list subjects"))
	}
	return c.JSON(shared.Success(subjects))
}

func (h *Handler) GetSubject(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(400).JSON(shared.Error(shared.ErrValidation, "Invalid subject id"))
	}
	sub, err := h.svc.GetSubject(c.Context(), id)
	if err != nil {
		return c.Status(500).JSON(shared.Error(shared.ErrInternal, "Failed to get subject"))
	}
	if sub == nil {
		return c.Status(404).JSON(shared.Error(shared.ErrNotFound, "Subject not found"))
	}
	return c.JSON(shared.Success(sub))
}

func (h *Handler) CreateSubject(c *fiber.Ctx) error {
	var req CreateSubjectReq
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(shared.Error(shared.ErrValidation, "Invalid request body"))
	}
	sub, err := h.svc.CreateSubject(c.Context(), req)
	if err != nil {
		if e, ok := err.(*fiber.Error); ok {
			return c.Status(e.Code).JSON(shared.Error(shared.ErrorCode(e.Message), e.Message))
		}
		return c.Status(500).JSON(shared.Error(shared.ErrInternal, "Failed to create subject"))
	}
	return c.Status(201).JSON(shared.Success(sub))
}

func (h *Handler) UpdateSubject(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(400).JSON(shared.Error(shared.ErrValidation, "Invalid subject id"))
	}
	var req UpdateSubjectReq
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(shared.Error(shared.ErrValidation, "Invalid request body"))
	}
	sub, err := h.svc.UpdateSubject(c.Context(), id, req)
	if err != nil {
		return c.Status(500).JSON(shared.Error(shared.ErrInternal, "Failed to update subject"))
	}
	return c.JSON(shared.Success(sub))
}

func (h *Handler) DeleteSubject(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(400).JSON(shared.Error(shared.ErrValidation, "Invalid subject id"))
	}
	if err := h.svc.DeleteSubject(c.Context(), id); err != nil {
		return c.Status(500).JSON(shared.Error(shared.ErrInternal, "Failed to delete subject"))
	}
	return c.JSON(shared.Success(map[string]string{"message": "Subject deleted"}))
}

func (h *Handler) ListChapters(c *fiber.Ctx) error {
	subjectIDStr := c.Params("id")
	subjectID, err := uuid.Parse(subjectIDStr)
	if err != nil {
		return c.Status(400).JSON(shared.Error(shared.ErrValidation, "Invalid subject_id"))
	}
	chapters, err := h.svc.ListChapters(c.Context(), subjectID)
	if err != nil {
		return c.Status(500).JSON(shared.Error(shared.ErrInternal, "Failed to list chapters"))
	}
	return c.JSON(shared.Success(chapters))
}

func (h *Handler) ListAllChapters(c *fiber.Ctx) error {
	chapters, err := h.svc.ListAllChapters(c.Context())
	if err != nil {
		return c.Status(500).JSON(shared.Error(shared.ErrInternal, "Failed to list chapters"))
	}
	return c.JSON(shared.Success(chapters))
}

func (h *Handler) GetChapter(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(400).JSON(shared.Error(shared.ErrValidation, "Invalid chapter id"))
	}
	ch, err := h.svc.GetChapter(c.Context(), id)
	if err != nil {
		return c.Status(500).JSON(shared.Error(shared.ErrInternal, "Failed to get chapter"))
	}
	if ch == nil {
		return c.Status(404).JSON(shared.Error(shared.ErrNotFound, "Chapter not found"))
	}
	return c.JSON(shared.Success(ch))
}

func (h *Handler) CreateChapter(c *fiber.Ctx) error {
	var req CreateChapterReq
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(shared.Error(shared.ErrValidation, "Invalid request body"))
	}
	ch, err := h.svc.CreateChapter(c.Context(), req)
	if err != nil {
		if e, ok := err.(*fiber.Error); ok {
			return c.Status(e.Code).JSON(shared.Error(shared.ErrorCode(e.Message), e.Message))
		}
		return c.Status(500).JSON(shared.Error(shared.ErrInternal, "Failed to create chapter"))
	}
	return c.Status(201).JSON(shared.Success(ch))
}

func (h *Handler) UpdateChapter(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(400).JSON(shared.Error(shared.ErrValidation, "Invalid chapter id"))
	}
	var req UpdateChapterReq
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(shared.Error(shared.ErrValidation, "Invalid request body"))
	}
	ch, err := h.svc.UpdateChapter(c.Context(), id, req)
	if err != nil {
		return c.Status(500).JSON(shared.Error(shared.ErrInternal, "Failed to update chapter"))
	}
	return c.JSON(shared.Success(ch))
}

func (h *Handler) DeleteChapter(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(400).JSON(shared.Error(shared.ErrValidation, "Invalid chapter id"))
	}
	if err := h.svc.DeleteChapter(c.Context(), id); err != nil {
		return c.Status(500).JSON(shared.Error(shared.ErrInternal, "Failed to delete chapter"))
	}
	return c.JSON(shared.Success(map[string]string{"message": "Chapter deleted"}))
}

func (h *Handler) ListAllTopics(c *fiber.Ctx) error {
	topics, err := h.svc.ListAllTopics(c.Context())
	if err != nil {
		return c.Status(500).JSON(shared.Error(shared.ErrInternal, "Failed to list topics"))
	}
	return c.JSON(shared.Success(topics))
}

func (h *Handler) CreateTopic(c *fiber.Ctx) error {
	var req CreateTopicReq
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(shared.Error(shared.ErrValidation, "Invalid request body"))
	}
	if req.Title == "" {
		return c.Status(400).JSON(shared.Error(shared.ErrValidation, "Title is required"))
	}
	t, err := h.svc.CreateTopic(c.Context(), req)
	if err != nil {
		if e, ok := err.(*fiber.Error); ok {
			return c.Status(e.Code).JSON(shared.Error(shared.ErrorCode(e.Message), e.Message))
		}
		return c.Status(500).JSON(shared.Error(shared.ErrInternal, "Failed to create topic"))
	}
	return c.Status(201).JSON(shared.Success(t))
}

func (h *Handler) UpdateTopic(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(400).JSON(shared.Error(shared.ErrValidation, "Invalid topic id"))
	}
	var req UpdateTopicReq
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(shared.Error(shared.ErrValidation, "Invalid request body"))
	}
	t, err := h.svc.UpdateTopic(c.Context(), id, req)
	if err != nil {
		return c.Status(500).JSON(shared.Error(shared.ErrInternal, "Failed to update topic"))
	}
	return c.JSON(shared.Success(t))
}

func (h *Handler) DeleteTopic(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(400).JSON(shared.Error(shared.ErrValidation, "Invalid topic id"))
	}
	if err := h.svc.DeleteTopic(c.Context(), id); err != nil {
		return c.Status(500).JSON(shared.Error(shared.ErrInternal, "Failed to delete topic"))
	}
	return c.JSON(shared.Success(map[string]string{"message": "Topic deleted"}))
}

func (h *Handler) ListLearningOutcomes(c *fiber.Ctx) error {
	topicIDStr := c.Query("topic_id")
	if topicIDStr == "" {
		return c.Status(400).JSON(shared.Error(shared.ErrValidation, "topic_id is required"))
	}
	topicID, err := uuid.Parse(topicIDStr)
	if err != nil {
		return c.Status(400).JSON(shared.Error(shared.ErrValidation, "Invalid topic_id"))
	}
	outcomes, err := h.svc.ListLearningOutcomes(c.Context(), topicID)
	if err != nil {
		return c.Status(500).JSON(shared.Error(shared.ErrInternal, "Failed to list learning outcomes"))
	}
	return c.JSON(shared.Success(outcomes))
}

func (h *Handler) CreateLearningOutcome(c *fiber.Ctx) error {
	var req CreateLearningOutcomeReq
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(shared.Error(shared.ErrValidation, "Invalid request body"))
	}
	if req.Title == "" {
		return c.Status(400).JSON(shared.Error(shared.ErrValidation, "Title is required"))
	}
	o, err := h.svc.CreateLearningOutcome(c.Context(), req)
	if err != nil {
		if e, ok := err.(*fiber.Error); ok {
			return c.Status(e.Code).JSON(shared.Error(shared.ErrorCode(e.Message), e.Message))
		}
		return c.Status(500).JSON(shared.Error(shared.ErrInternal, "Failed to create learning outcome"))
	}
	return c.Status(201).JSON(shared.Success(o))
}

func (h *Handler) UpdateLearningOutcome(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(400).JSON(shared.Error(shared.ErrValidation, "Invalid learning outcome id"))
	}
	var req UpdateLearningOutcomeReq
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(shared.Error(shared.ErrValidation, "Invalid request body"))
	}
	o, err := h.svc.UpdateLearningOutcome(c.Context(), id, req)
	if err != nil {
		return c.Status(500).JSON(shared.Error(shared.ErrInternal, "Failed to update learning outcome"))
	}
	return c.JSON(shared.Success(o))
}

func (h *Handler) DeleteLearningOutcome(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(400).JSON(shared.Error(shared.ErrValidation, "Invalid learning outcome id"))
	}
	if err := h.svc.DeleteLearningOutcome(c.Context(), id); err != nil {
		return c.Status(500).JSON(shared.Error(shared.ErrInternal, "Failed to delete learning outcome"))
	}
	return c.JSON(shared.Success(map[string]string{"message": "Learning outcome deleted"}))
}
