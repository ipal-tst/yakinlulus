# Import XLSX Template — Bank Soal & Materi — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans.

**Goal:** Ship Excel template download + XLSX import so teachers bulk-create **questions** (block-content, rich text–image–text) and **materials**, with no DB schema change.

**Architecture:** Backend parses `.xlsx` (excelize) in-memory into block rows and reuses the existing question/material create paths (extended to persist multiple ordered blocks). Frontend re-wires the mocked import wizard to the real endpoints + template download.

**Tech Stack:** Go (pgx, Fiber, `github.com/xuri/excelize/v2`), Next.js 16 + TS strict.

## Global Constraints

- **No DB schema change.** Only backend Go code + frontend TS.
- Blocks inserted in user order (block_order = column order).
- Parameterized SQL; `uuid.Parse` and 400 `shared.ErrValidation` on bad ids.
- Role gate on import/template: reuse `middleware.RequireRole("SUPER_ADMIN","STAFF","GURU")`.
- File ≤15MB, `.xlsx` only, parsed in-memory (no file persistence).
- Difficulty: EASY/MEDIUM/HARD/EXPERT. Option labels A–H. Block cap 8.
- No commits without explicit user request (AGENTS.md).

---

### Task 1: Add excelize dependency

**Files:**
- Modify: `backend/go.mod`, `backend/go.sum`

- [ ] **Step 1: Add the module**

Run (in `backend/`): `go get github.com/xuri/excelize/v2@v2.8.0`
Expected: go.mod/go.sum updated; `go build ./...` exit 0.

---

### Task 2: Question multi-block support

**Files:**
- Modify: `backend/internal/question_bank/question_bank.go` — structs (31-63, 890-915), `Service.Create` (938-1010), `Repository.Create` (289-364)

**Interfaces:**
- Produces: `QuestionBlock{ BlockType string; Content string; AssetID *uuid.UUID }`; `CreateQuestionReq.Blocks []QuestionBlockReq`.

- [ ] **Step 1: Define struct types**

Add after `QuestionOption` (line 72) and inside `CreateQuestionReq`:

```go
type QuestionBlock struct {
	BlockType string     `json:"block_type"`
	Content   string     `json:"content"`
	AssetID   *uuid.UUID `json:"asset_id,omitempty"`
}
```
Add field to `Question` struct:
```go
Blocks []QuestionBlock `json:"blocks,omitempty"`
```
Inside `CreateQuestionReq` add:
```go
Blocks []QuestionBlock `json:"blocks,omitempty"`
```
(Reuse the same `QuestionBlock` type.)

- [ ] **Step 2: Thread blocks in `Service.Create`**

After `q.UpdatedAt` assignment (near line 959), before building opts:

```go
for _, b := range req.Blocks {
	q.Blocks = append(q.Blocks, QuestionBlock{BlockType: b.BlockType, Content: b.Content, AssetID: b.AssetID})
}
```

- [ ] **Step 3: `Repository.Create` inserts ordered blocks**

Replace lines 334-338 with:

```go
if len(q.Blocks) > 0 {
	for i, b := range q.Blocks {
		if _, err := tx.Exec(ctx, `
			INSERT INTO question.question_block (question_version_id, block_order, block_type, content, asset_id)
			VALUES ($1,$2,$3,$4,$5)`, versionID, i, b.BlockType, b.Content, b.AssetID); err != nil {
			return err
		}
	}
} else if q.Content != "" {
	if _, err := tx.Exec(ctx, `
		INSERT INTO question.question_block (question_version_id, block_order, block_type, content)
		VALUES ($1, 0, 'PARAGRAPH', $2)`, versionID, q.Content); err != nil {
		return err
	}
}
```

- [ ] **Step 4: Verify**

Run: `gofmt -w internal/question_bank/question_bank.go && go build ./... && go vet ./internal/question_bank/`
Expected: exit 0. `go test ./internal/question_bank/ -count=1` → ok (DB tests skip w/o `DB_URL`).

---

### Task 3: XLSX parse + template + import endpoints (questions)

**Files:**
- Create: `backend/internal/question_bank/import_xlsx.go`
- Modify: `backend/internal/question_bank/question_bank.go` (RegisterRoutes ~1170, add handlers)

**Interfaces:**
- Creates: `XLSXRow` struct; `ParseQuestionWorkbook(r io.Reader) ([]XLSXRow, error)`; `BuildQuestionTemplate() (*excelize.File, error)`.
- Produces: `Handler.ImportTemplate`, `Handler.ImportXLSX`; routes `GET /import/template`, `POST /import/xlsx` under `/questions`.

- [ ] **Step 1: Create `import_xlsx.go`**

```go
package question_bank

import (
	"bytes"
	"fmt"
	"io"
	"strings"

	"github.com/xuri/excelize/v2"
)

const questionSheet = "Soal"

type XLSXRow struct {
	Number      string
	Code        string
	Subject     string
	Grade       string
	Chapter     string
	Type        string
	Difficulty  string
	Blocks      []QuestionBlock
	Options     []string // labels iterate over columns indexed alphabetically
	Correct     string
	Score       float64
	Negative    float64
	Explanation string
	Bloom       string
	Language    string
}

func clean(v string) string { return strings.TrimSpace(v) }

var xlsxBlockTypes = []string{"PARAGRAPH","IMAGE","TABLE","LATEX","SVG","AUDIO","VIDEO","GRAPH","CODE","HTML","MARKDOWN"}

func BuildQuestionTemplate() (*excelize.File, error) {
	f := excelize.NewFile()
	defer f.SetActiveSheet(f.GetSheetIndex(questionSheet))
	setSheetName(f, questionSheet)
	for i, h := range questionHeaders() {
		f.SetCellValue(questionSheet, fmt.Sprintf("%c1", 'A'+i), h)
	}
	ex := exampleQuestion()
	for r, v := range ex {
		f.SetCellValue(questionSheet, "A2", v) // single example row, cols replaced manually per index
		_ = r
	}
	return f, nil
}
```

> **Implementation note (do this fully):** the template builder must write headers (A..Z) + one example row (the text–image–text single-choice from the spec) with styles (header bold, col widths). The example question boxes: subject=Matematika, type=SINGLE_CHOICE, difficulty=EASY, Blok pairs, options A-D, key=B. Do not ship the abbreviated helper above — replace with complete code.

- [ ] **Step 2: Parser**

Complete `ParseQuestionWorkbook(r io.Reader)` in the same file:
- `excelize.OpenReader(r)`.
- Sheet `soal` (fallback first sheet). Rows[0] = headers (skip). For each subsequent row: read map by header offset using `f.Rows(sheet)` or `GetRows`.
- Map column indices: 5 → Type; 6 → Difficulty; block pairs start at col 8: `(blokTipeIdx = 8+2*(i-1), blokIsiIdx = 9+2*(i-1))` for i in 1..8. Options A-H start after blocks: `optIdx = 8+2*8` = 24 → col 24 (X) for A onward. `Kunci` at col 33, `Skor` 34, `SkorNeg` 35, `Pembahasan` 36, `Bloom` 37, `Bahasa` 38.
- Build `Blocks` only for non-empty type or content; type must be in `xlsxBlockTypes` else row error.
- Return `[]XLSXRow` plus per-row `error`? Return `([]XLSXRow, []ImportError, error)`.

- [ ] **Step 3: Handlers + routes**

Add to `RegisterRoutes` (inside `r.Group("/questions")`, before `r.Get("/:id"...)`):

```go
r.Get("/import/template", read, h.ImportTemplate)
r.Post("/import/xlsx", write, h.ImportXLSX)
```

```go
func buildBook(f *excelize.File) ([]byte, error) {
	var buf bytes.Buffer
	if _, err := f.WriteTo(&buf); err != nil { return nil, err }
	return buf.Bytes(), nil
}

func (h *Handler) ImportTemplate(c *fiber.Ctx) error {
	f, err := BuildQuestionTemplate()
	if err != nil { return c.Status(500).JSON(shared.Error("internal", "template error")) }
	b, err := f.WriteToBuffer()
	if err != nil { return c.Status(500).... }
	return c.Type(".xlsx").SendStreamMime... // send bytes as attachment
}
```
- Set `c.Set("Content-Type","application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")` and `Content-Disposition: attachment; filename="template-soal.xlsx"`, `return c.Send(b)`.

`ImportXLSX`:
- `file, err := c.FormFile("file")`; size guard ≤ 15MB; open stream; `ParseQuestionWorkbook(f)`.
- Create audit via `repo.CreateImportJob(ctx, file.Filename, len(rows), userID)`.
- Per row: resolve subject (reuse logic in existing `Import` rows loop at question_bank.go ~1531-1550 — extract to helper `resolveSubjectID`), build `CreateQuestionReq` (map blocks + options A–H + CorrectKey to `CreateOptionReq{Label,Content,Correct}`, difficulty, explanation, bloom, language, score, negative), call `h.svc.Create`, log via `repo.CreateImportRowLog`, count created/failed.
- `repo.UpdateImportJob` success/fail.
- Return `{job_id, created, failed, errors[]}` (errors = list of `{row, message}`), 200; 400 if 0 created.

- [ ] **Step 4: Unit test for parse (no DB)**

Create `backend/internal/question_bank/import_xlsx_test.go` — build a small `excelize.File` in-memory, write header + one row (blocks text-image-text + options + Correct=B), call `ParseQuestionWorkbook`, assert `len(row.Blocks)==3`, types `[PARAGRAPH,IMAGE,PARAGRAPH]`, 1 correct option (B). Run: `go test ./internal/question_bank/ -run TestParseQuestionWorkbook -v`.

---

### Task 4: Unit test for Create-with-blocks

**Files:**
- Create: `backend/internal/question_bank/create_blocks_test.go` (no DB: test the slice assembly only, not DB writes)

- [ ] **Step 1: Test that `Create` threads blocks (pure)**

Write a test calling `Service.Create` is DB-bound; instead unit-test the block→Question assembly by extracting a helper `applyQuestionReq(q,req)` in service, then test that. If DB unavailable, assert compile + existing suite ok. (If `DB_URL` set, extend integration test to create a multi-block question and assert 3 blocks.)

- [ ] **Step 2: Run**

`go test ./internal/question_bank/ -count=1`

---

### Task 5: Materials import (template + XLSX)

**Files:**
- Create: `backend/internal/material/import_xlsx.go`
- Modify: `backend/internal/material/material.go` (RegisterRoutes ~164)

- [ ] **Step 1: Template + parser** (mirror question) with headers: Mapel, Kelas, Bab, Subbab, JudulMateri, Format, Isi, LinkAset, DurasiMenit, Status, IsPreview.
- [ ] **Step 2: Routes in `RegisterRoutes`:** `GET /import/template`, `POST /import/xlsx`.
- [ ] **Step 3: Import handler** — per row build `CreateMaterialReq` (map format, duration, preview, body/link) and call existing material create service; collect `{created, failed, errors}`.
- [ ] **Step 4: Verify** `gofmt`, `go build ./...`, `go vet ./internal/material/`.

---

### Task 6: Frontend wiring (replace mock)

**Files:**
- Modify: `frontend/src/services/question-import.service.ts`
- Modify: `frontend/src/app/(admin)/admin/questions/import/page.tsx`
- Create: `frontend/src/services/material-import.service.ts`

- [ ] **Step 1: Rewrite `question-import.service.ts`** to real HTTP:
```ts
uploadQuestionFile(file) -> POST /questions/import/xlsx (FormData) -> { job_id, created, failed, errors[] }
downloadQuestionTemplate() -> GET /questions/import/template (blob)
```
- [ ] **Step 2: Update import page** — Stage 1 keeps upload; Stage 2 calls `uploadQuestionFile` with progress; Stage 3 review renders returned result table (created + per-row errors); drop mock commitImport; Stage 4 shows `job_id`. Add "Download template" button.
- [ ] **Step 3: Create `material-import.service.ts`** mirror (upload/download) + add a materials import page (or button if page exists).
- [ ] **Step 4: Verify** `tsc --noEmit`.

---

### Task 7: Final verification

- [ ] **Step 1: Backend** `gofmt -l` (changed files), `go build ./...`, `go vet ./internal/question_bank/ ./internal/material/`, `go test ./internal/question_bank/ ./internal/material/ -count=1`.
- [ ] **Step 2: Frontend** `tsc --noEmit`; lint only pre-existing warnings.