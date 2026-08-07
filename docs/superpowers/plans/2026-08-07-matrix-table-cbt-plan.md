# Matrix Table UI Layout Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform the UI rendering of `TRUE_FALSE_MATRIX` and `SUITABILITY_MATRIX` questions in `/app/(siswa)/exams/[id]/cbt/page.tsx` into a structured HTML table with column headers (`Opsi`, `Pernyataan`, `Benar`/`Salah`, `Sesuai`/`Tidak Sesuai`) and row labels (`A`, `B`, `C`, etc.).

---

### Task 1: Update Matrix Question Rendering to Clean HTML Table Layout

**Files:**
- Modify: `frontend/src/app/(siswa)/exams/[id]/cbt/page.tsx`

- [ ] **Step 1: Replace Matrix Rows Div with Structured HTML `<table>`**

Implement `<table>` element with styled `<thead>` and `<tbody>` for `TRUE_FALSE_MATRIX` and `SUITABILITY_MATRIX` question types.

- [ ] **Step 2: Add Letter Labels (A, B, C, D) to Statement Rows**

Map row indices to capital letters (`A`, `B`, `C`, `D`, etc.) in the first table column.

- [ ] **Step 3: Verify Type Safety & Compilation**

Run `cmd /c "npx tsc --noEmit"` in `frontend/`.  
Expected: PASS with 0 errors.

- [ ] **Step 4: Commit Implementation**

```bash
git add "frontend/src/app/(siswa)/exams/[id]/cbt/page.tsx"
git commit -m "feat(siswa-cbt): render true/false and suitability matrix questions as clean HTML table with row labels A, B, C"
```
