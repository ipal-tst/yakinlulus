# Question Duplicate Detection Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a robust Question Duplicate Detection System that detects identical questions during Excel batch imports (`/admin/questions/import`) and single question manual creation/editing (`QuestionEditModal`).

**Architecture:** Normalization algorithm cleans question text and options A-E to compute SHA-256 (`content_hash`). Database table `question.question` indexes `(subject_id, content_hash)`. A new Go backend API endpoint `POST /api/v1/questions/check-duplicates` provides batch duplicate verification. Frontend Excel parser and QuestionEditModal trigger internal & DB duplicate checks with user controls for Skip, Update, and Force Import.

**Tech Stack:** Go (Fiber, pgxpool), PostgreSQL, TypeScript, Next.js 16, React Query.

## Global Constraints

- Backend normalization: SHA-256 hash formatted as 64 hex characters.
- API Route: `POST /api/v1/questions/check-duplicates`.
- Database Table: `question.question`, column `content_hash VARCHAR(64)`.

---

### Task 1: Backend Content Normalization & Database Schema Migration

**Files:**
- Create: `backend/internal/question_bank/hash.go`
- Modify: `backend/internal/question_bank/question_bank.go`

**Interfaces:**
- Consumes: Raw question content string & option content strings
- Produces: `CalculateContentHash(content string, options []QuestionOption) string`

- [ ] **Step 1: Create `backend/internal/question_bank/hash.go` with `CalculateContentHash`**

```go
package question_bank

import (
	"crypto/sha256"
	"encoding/hex"
	"regexp"
	"strings"
)

var (
	htmlRegex = regexp.MustCompile(`<[^>]*>`)
	spaceRegex = regexp.MustCompile(`\s+`)
)

func NormalizeText(input string) string {
	cleaned := htmlRegex.ReplaceAllString(input, "")
	cleaned = strings.ToLower(cleaned)
	cleaned = spaceRegex.ReplaceAllString(cleaned, " ")
	return strings.TrimSpace(cleaned)
}

func CalculateContentHash(content string, options []QuestionOption) string {
	normContent := NormalizeText(content)
	optContents := make([]string, 0, len(options))
	for _, opt := range options {
		optContents = append(optContents, NormalizeText(opt.Content))
	}
	
	rawString := normContent + "|" + strings.Join(optContents, "|")
	hash := sha256.Sum256([]byte(rawString))
	return hex.EncodeToString(hash[:])
}
```

- [ ] **Step 2: Add `content_hash` column and migration query in `question_bank.go`**

Ensure `Question` struct has `ContentHash string` and `Create`/`Update` methods calculate and write `content_hash`.

- [ ] **Step 3: Run backend build to verify compilation**

Run: `go build -o api.exe ./cmd/api` in `d:\Project\EdTech\Yakinlulus.id\backend`
Expected: Success with 0 errors.

- [ ] **Step 4: Commit**

```bash
git add backend/internal/question_bank/hash.go backend/internal/question_bank/question_bank.go
git commit -m "feat(question_bank): add content normalization and hash calculation"
```

---

### Task 2: Backend Check-Duplicates Endpoint (`POST /api/v1/questions/check-duplicates`)

**Files:**
- Modify: `backend/internal/question_bank/question_bank.go`

**Interfaces:**
- Consumes: `POST /api/v1/questions/check-duplicates` payload `CheckDuplicatesRequest`
- Produces: `CheckDuplicatesResponse` list of matching duplicate entries

- [ ] **Step 1: Define DTOs & Handler method `CheckDuplicates` in `question_bank.go`**

```go
type DuplicateCheckItem struct {
	ID      string           `json:"id"`
	Content string           `json:"content"`
	Options []QuestionOption `json:"options"`
}

type CheckDuplicatesRequest struct {
	SubjectID uuid.UUID            `json:"subject_id"`
	Items     []DuplicateCheckItem `json:"items"`
}

type DuplicateCheckResult struct {
	ID                   string `json:"id"`
	IsDuplicate          bool   `json:"is_duplicate"`
	ExistingQuestionID   string `json:"existing_question_id,omitempty"`
	ExistingQuestionCode string `json:"existing_question_code,omitempty"`
	DuplicateType        string `json:"duplicate_type,omitempty"`
}

func (h *Handler) CheckDuplicates(c *fiber.Ctx) error {
	var req CheckDuplicatesRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid request body"})
	}

	results, err := h.svc.CheckDuplicates(c.Context(), req)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}
	return c.JSON(results)
}
```

- [ ] **Step 2: Register route `r.Post("/check-duplicates", h.CheckDuplicates)` in `RegisterRoutes`**

- [ ] **Step 3: Test backend compilation**

Run: `go build -o api.exe ./cmd/api` in `d:\Project\EdTech\Yakinlulus.id\backend`
Expected: Success with 0 errors.

- [ ] **Step 4: Commit**

```bash
git add backend/internal/question_bank/question_bank.go
git commit -m "feat(question_bank): implement check-duplicates batch endpoint"
```

---

### Task 3: Frontend Excel Import Duplicate Detection (`question.service.ts` & `import/page.tsx`)

**Files:**
- Modify: `frontend/src/services/question.service.ts`
- Modify: `frontend/src/services/question-excel-parser.ts`
- Modify: `frontend/src/app/(admin)/admin/questions/import/page.tsx`

**Interfaces:**
- Consumes: Parsed Excel rows
- Produces: Visual duplicate badges (`DUPLIKAT (FILE)` / `DUPLIKAT (DATABASE)`) and per-row resolution selector (`SKIP` / `UPDATE` / `FORCE`)

- [ ] **Step 1: Add `checkDuplicates` method to `questionService` in `question.service.ts`**

- [ ] **Step 2: Add internal hash calculator in `question-excel-parser.ts`**

- [ ] **Step 3: Integrate duplicate verification into `ImportPage` in `page.tsx`**

- [ ] **Step 4: Verify TypeScript compilation**

Run: `cmd /c "npx tsc --noEmit"` in `d:\Project\EdTech\Yakinlulus.id\frontend`
Expected: Success with 0 errors.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/services/question.service.ts frontend/src/services/question-excel-parser.ts frontend/src/app/(admin)/admin/questions/import/page.tsx
git commit -m "feat(frontend): integrate duplicate detection into Excel question import"
```

---

### Task 4: Real-time Duplicate Alert in `QuestionEditModal`

**Files:**
- Modify: `frontend/src/components/admin/questions/question-edit-modal.tsx`

**Interfaces:**
- Consumes: Question content & options
- Produces: Inline alert warning if matching duplicate exists in DB

- [ ] **Step 1: Add debounced check in `QuestionEditModal`**

- [ ] **Step 2: Render duplicate warning banner if duplicate detected**

- [ ] **Step 3: Verify TypeScript compilation**

Run: `cmd /c "npx tsc --noEmit"` in `d:\Project\EdTech\Yakinlulus.id\frontend`
Expected: Success with 0 errors.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/components/admin/questions/question-edit-modal.tsx
git commit -m "feat(frontend): add real-time duplicate detection alert in QuestionEditModal"
```
