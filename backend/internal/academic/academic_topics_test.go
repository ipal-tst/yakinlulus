package academic

import (
	"context"
	"testing"

	"github.com/google/uuid"
)

func TestListAllTopicsFilterByChapter(t *testing.T) {
	p := testPool(t)
	repo := NewRepository(p)
	ctx := context.Background()

	level := &EducationLevel{Name: "Level Topik", Code: "LVL_TOP_" + uuid.New().String()[:6]}
	if err := repo.CreateLevel(ctx, level); err != nil {
		t.Fatalf("CreateLevel: %v", err)
	}
	t.Cleanup(func() { _, _ = p.Exec(ctx, `DELETE FROM academic.education_level WHERE id = $1`, level.ID) })

	sub := &Subject{LevelID: level.ID, Name: "Mapel Topik", Code: "MPL_TOP_" + uuid.New().String()[:6], DisplayOrder: 1}
	if err := repo.CreateSubject(ctx, sub); err != nil {
		t.Fatalf("CreateSubject: %v", err)
	}

	chA := &Chapter{SubjectID: sub.ID, Name: "Bab A", DisplayOrder: 1}
	if err := repo.CreateChapter(ctx, chA); err != nil {
		t.Fatalf("CreateChapter A: %v", err)
	}
	chB := &Chapter{SubjectID: sub.ID, Name: "Bab B", DisplayOrder: 2}
	if err := repo.CreateChapter(ctx, chB); err != nil {
		t.Fatalf("CreateChapter B: %v", err)
	}
	topA := &Topic{ChapterID: chA.ID, Title: "Topik A1", Sequence: 1}
	if err := repo.CreateTopic(ctx, topA); err != nil {
		t.Fatalf("CreateTopic A1: %v", err)
	}
	topB := &Topic{ChapterID: chB.ID, Title: "Topik B1", Sequence: 1}
	if err := repo.CreateTopic(ctx, topB); err != nil {
		t.Fatalf("CreateTopic B1: %v", err)
	}

	got, err := repo.ListAllTopics(ctx, &chA.ID)
	if err != nil {
		t.Fatalf("ListAllTopics: %v", err)
	}
	found := false
	for _, tp := range got {
		if tp.ID == topA.ID && tp.ChapterID == chA.ID {
			found = true
		}
		if tp.ID == topB.ID {
			t.Errorf("unexpected topic from other chapter: %s", tp.ID)
		}
	}
	if !found {
		t.Errorf("expected topic %s in results", topA.ID)
	}
}
