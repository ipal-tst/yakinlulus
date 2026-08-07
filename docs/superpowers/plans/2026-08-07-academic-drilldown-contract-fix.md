# Academic Drill-down Contract Fix — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the Admin academic drill-down show correct seeded data by wiring chapters and topics to the backend contract.

**Architecture:** (1) Frontend `getChapters` uses the existing filtered backend route `/subjects/:id/chapters`. (2) Backend `/topics` gains an optional `chapter_id` filter (repo/service/handler), preserving the no-param behavior. No schema changes.

**Tech Stack:** Go (pgx), Fiber; Next.js 16 + TypeScript strict.

## Global Constraints

- Parameterized queries only (no string-interpolated SQL values).
- `uuid.Parse` on every id query param; 400 `shared.ErrValidation` on invalid input.
- Do not change route paths; `/subjects/:id/chapters` already exists.
- No commits without explicit user request (AGENTS.md).

---

### Task 1: Backend — `ListAllTopics` accepts optional `chapter_id`

**Files:**
- Modify: `backend/internal/academic/academic.go:656` (repo), `:1242` (service), `:1785` (handler)
- Test: `backend/internal/academic/academic_topics_test.go` (create)

**Interfaces:**
- Consumes: `*uuid.UUID`, existing `Topic`, `Chapter`, `Subject`, `EducationLevel` repo methods.
- Produces: `Repository.ListAllTopics(ctx, chapterID *uuid.UUID) ([]Topic, error)`; `Service.ListAllTopics(ctx, chapterID *uuid.UUID) ([]Topic, error)`.

- [ ] **Step 1: Write the failing integration test**

Create `backend/internal/academic/academic_topics_test.go`:

```go
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
```

- [ ] **Step 2: Run the test to verify it fails to compile (signature mismatch)**

Run: `go vet ./internal/academic/`
Expected: compile error — `ListAllTopics` called with an argument.

- [ ] **Step 3: Implement repo + service + handler**

Replace repo (line 656) body start with a filterable query:

```go
func (r *Repository) ListAllTopics(ctx context.Context, chapterID *uuid.UUID) ([]Topic, error) {
	query := `SELECT t.id, sc.chapter_id AS chapter_id, t.name AS title, t.order_no AS sequence,
		t.description, true AS is_active, t.created_at, NOW(),
		COALESCE(ch.title, '')::text AS chapter_name, COALESCE(s.name, '')::text AS subject_name
		FROM academic.topic t
		JOIN academic.subchapter sc ON sc.id = t.subchapter_id
		JOIN academic.chapter ch ON ch.id = sc.chapter_id
		JOIN academic.curriculum_subject cs ON cs.id = ch.curriculum_subject_id
		JOIN academic.subject s ON s.id = cs.subject_id`
	if chapterID != nil {
		query += ` WHERE sc.chapter_id=$1`
	}
	query += ` ORDER BY ch.order_no, sc.order_no, t.order_no`
	var rows pgx.Rows
	var err error
	if chapterID != nil {
		rows, err = r.pool.Query(ctx, query, *chapterID)
	} else {
		rows, err = r.pool.Query(ctx, query)
	}
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	// scan loop unchanged
```

Service (line 1242):

```go
func (s *Service) ListAllTopics(ctx context.Context, chapterID *uuid.UUID) ([]Topic, error) {
	return s.repo.ListAllTopics(ctx, chapterID)
}
```

Handler (line 1785):

```go
func (h *Handler) ListAllTopics(c *fiber.Ctx) error {
	var chapterID *uuid.UUID
	if cid := c.Query("chapter_id"); cid != "" && cid != "undefined" && cid != "null" {
		id, err := uuid.Parse(cid)
		if err != nil {
			return c.Status(400).JSON(shared.Error(shared.ErrValidation, "Invalid chapter_id"))
		}
		chapterID = &id
	}
	topics, err := h.svc.ListAllTopics(c.Context(), chapterID)
	if err != nil {
		return c.Status(500).JSON(shared.Error(shared.ErrInternal, "Failed to list topics"))
	}
	return c.JSON(shared.Success(topics))
}
```

- [ ] **Step 4: Run verification**

Run: `gofmt -w internal/academic/academic.go && go build ./... && go vet ./internal/academic/`
Expected: exit 0, no output. Then `go test ./internal/academic/ -count=1`.
Expected: `ok` (new test skips unless `DB_URL` is set).

---

### Task 2: Frontend — `getChapters` uses the filtered route

**Files:**
- Modify: `frontend/src/services/academic-master.service.ts:46`

**Interfaces:**
- Consumes: `api`, existing `Chapter` type.
- Produces: unchanged `getChapters(subjectId: string): Promise<Chapter[]>`.

- [ ] **Step 1: Update the call**

```ts
getChapters: (subjectId: string): Promise<Chapter[]> => api(`/academic/subjects/${subjectId}/chapters`),
```

- [ ] **Step 2: Run typecheck and lint**

Run: `npx tsc --noEmit` then `npm run lint` (in `frontend/`).
Expected: exit 0, no errors.

---

### Task 3: Final verification

- [ ] **Step 1: Backend**

Run: `gofmt -l internal/academic/ && go build ./... && go vet ./internal/academic/ && go test ./internal/academic/ -count=1`
Expected: gofmt lists nothing; build/vet exit 0; test `ok`.

- [ ] **Step 2: Frontend**

Run: `npx tsc --noEmit && npm run lint`
Expected: exit 0.
