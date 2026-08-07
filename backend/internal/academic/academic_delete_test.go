package academic

import (
	"context"
	"os"
	"sync"
	"testing"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
)

var (
	poolOnce   sync.Once
	poolSingle *pgxpool.Pool
	poolErr    error
)

func testPool(t *testing.T) *pgxpool.Pool {
	t.Helper()
	url := os.Getenv("DB_URL")
	if url == "" {
		t.Skip("DB_URL not set; skipping academic repository integration test")
	}
	poolOnce.Do(func() {
		cfg, err := pgxpool.ParseConfig(url)
		if err != nil {
			poolErr = err
			return
		}
		cfg.MaxConns = 4
		poolSingle, poolErr = pgxpool.NewWithConfig(context.Background(), cfg)
	})
	if poolErr != nil {
		t.Fatalf("connect: %v", poolErr)
	}
	return poolSingle
}

func TestAcademicDeleteCascade(t *testing.T) {
	p := testPool(t)
	repo := NewRepository(p)
	ctx := context.Background()

	level := &EducationLevel{Name: "Level Uji", Code: "LVL_UJI_" + uuid.New().String()[:6]}
	if err := repo.CreateLevel(ctx, level); err != nil {
		t.Fatalf("CreateLevel: %v", err)
	}
	t.Cleanup(func() { _, _ = p.Exec(ctx, `DELETE FROM academic.education_level WHERE id = $1`, level.ID) })

	grade := &Grade{EducationLevelID: level.ID, Name: "Kelas Uji", DisplayOrder: 1}
	if err := repo.CreateGrade(ctx, grade); err != nil {
		t.Fatalf("CreateGrade: %v", err)
	}

	sub := &Subject{LevelID: level.ID, Name: "Mapel Uji", Code: "MPL_UJI_" + uuid.New().String()[:6], DisplayOrder: 1}
	if err := repo.CreateSubject(ctx, sub); err != nil {
		t.Fatalf("CreateSubject: %v", err)
	}

	chapter := &Chapter{SubjectID: sub.ID, Name: "Bab Uji", DisplayOrder: 1}
	if err := repo.CreateChapter(ctx, chapter); err != nil {
		t.Fatalf("CreateChapter: %v", err)
	}

	topic := &Topic{ChapterID: chapter.ID, Title: "Topik Uji", Sequence: 1}
	if err := repo.CreateTopic(ctx, topic); err != nil {
		t.Fatalf("CreateTopic: %v", err)
	}

	bloom := "ANALYZE"
	outcome := &LearningOutcome{TopicID: topic.ID, Title: "Outcome Uji", BloomDefault: &bloom}
	if err := repo.CreateLearningOutcome(ctx, outcome); err != nil {
		t.Fatalf("CreateLearningOutcome: %v", err)
	}

	t.Run("TreeReadable", func(t *testing.T) {
		gotLevel, err := repo.GetLevel(ctx, level.ID)
		if err != nil || gotLevel == nil || gotLevel.Code != level.Code {
			t.Errorf("GetLevel mismatch: %+v err=%v", gotLevel, err)
		}
		chapters, err := repo.ListChapters(ctx, sub.ID)
		if err != nil || len(chapters) != 1 || chapters[0].ID != chapter.ID {
			t.Errorf("ListChapters: %+v err=%v", chapters, err)
		}
		topics, err := repo.ListAllTopics(ctx, nil)
		if err != nil {
			t.Fatalf("ListAllTopics: %v", err)
		}
		found := false
		for _, tp := range topics {
			if tp.ID == topic.ID && tp.ChapterID == chapter.ID && tp.ChapterName == "Bab Uji" {
				found = true
			}
		}
		if !found {
			t.Errorf("ListAllTopics missing seeded topic: %+v", topics)
		}
		outcomes, err := repo.ListLearningOutcomes(ctx, topic.ID)
		if err != nil || len(outcomes) != 1 || outcomes[0].ID != outcome.ID {
			t.Errorf("ListLearningOutcomes: %+v err=%v", outcomes, err)
		}
		userGrade, err := repo.GetUserGradeID(ctx, uuid.Nil)
		if err != nil {
			t.Errorf("GetUserGradeID should not error: %v", err)
		}
		if userGrade != nil {
			t.Errorf("GetUserGradeID for nil user should return nil, got %v", userGrade)
		}
	})

	t.Run("DeleteLevelCascades", func(t *testing.T) {
		if err := repo.DeleteLevel(ctx, level.ID); err != nil {
			t.Fatalf("DeleteLevel: %v", err)
		}
		gotLevel, _ := repo.GetLevel(ctx, level.ID)
		if gotLevel != nil {
			t.Errorf("level should be gone after DeleteLevel")
		}
		var count int
		if err := p.QueryRow(ctx,
			`SELECT COUNT(*) FROM academic.grade WHERE education_level_id = $1`, level.ID).Scan(&count); err != nil || count != 0 {
			t.Errorf("grade residue = %d err=%v", count, err)
		}
		if err := p.QueryRow(ctx,
			`SELECT COUNT(*) FROM academic.curriculum_subject WHERE education_level_id = $1`, level.ID).Scan(&count); err != nil || count != 0 {
			t.Errorf("curriculum_subject residue = %d err=%v", count, err)
		}
		if err := p.QueryRow(ctx,
			`SELECT COUNT(*) FROM academic.chapter ch
			 JOIN academic.curriculum_subject cs ON cs.id = ch.curriculum_subject_id
			 WHERE cs.education_level_id = $1`, level.ID).Scan(&count); err != nil || count != 0 {
			t.Errorf("chapter residue = %d err=%v", count, err)
		}
		if err := p.QueryRow(ctx,
			`SELECT COUNT(*) FROM academic.topic t
			 JOIN academic.subchapter sc ON sc.id = t.subchapter_id
			 JOIN academic.chapter ch ON ch.id = sc.chapter_id
			 JOIN academic.curriculum_subject cs ON cs.id = ch.curriculum_subject_id
			 WHERE cs.education_level_id = $1`, level.ID).Scan(&count); err != nil || count != 0 {
			t.Errorf("topic residue = %d err=%v", count, err)
		}
		if err := p.QueryRow(ctx,
			`SELECT COUNT(*) FROM academic.learning_outcome lo
			 JOIN academic.competency comp ON comp.id = lo.competency_id
			 JOIN academic.chapter ch ON ch.id = comp.chapter_id
			 JOIN academic.curriculum_subject cs ON cs.id = ch.curriculum_subject_id
			 WHERE cs.education_level_id = $1`, level.ID).Scan(&count); err != nil || count != 0 {
			t.Errorf("learning_outcome residue = %d err=%v", count, err)
		}
	})
}

func TestProgramSoftDelete(t *testing.T) {
	p := testPool(t)
	repo := NewRepository(p)
	ctx := context.Background()

	prog := &Program{Code: "PRG_" + uuid.New().String()[:6], Name: "Program Uji"}
	if err := repo.CreateProgram(ctx, prog); err != nil {
		t.Fatalf("CreateProgram: %v", err)
	}
	t.Cleanup(func() { _, _ = p.Exec(ctx, `DELETE FROM academic.program WHERE id = $1`, prog.ID) })

	list, err := repo.ListPrograms(ctx)
	if err != nil {
		t.Fatalf("ListPrograms: %v", err)
	}
	found := false
	for _, x := range list {
		if x.ID == prog.ID {
			found = true
			if x.Status != "ACTIVE" {
				t.Errorf("program status = %q, want ACTIVE", x.Status)
			}
		}
	}
	if !found {
		t.Fatalf("ListPrograms missing created program")
	}

	if err := repo.DeleteProgram(ctx, prog.ID); err != nil {
		t.Fatalf("DeleteProgram: %v", err)
	}
	list, _ = repo.ListPrograms(ctx)
	for _, x := range list {
		if x.ID == prog.ID {
			t.Errorf("program should be soft-deleted and hidden from list")
		}
	}
}
