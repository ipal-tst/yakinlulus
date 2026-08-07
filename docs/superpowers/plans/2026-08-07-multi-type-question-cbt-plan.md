# Multi-Type Question CBT Support & Sample Package Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extend CBT interface (`/exams/[id]/cbt`) and Exam Result page (`/exams/[id]/result`) to render 4 distinct question types:
1. `SINGLE_CHOICE`: Pilihan Ganda (Single choice)
2. `MULTIPLE_CHOICE`: Pilihan Ganda Kompleks (Multiple choice checkboxes)
3. `TRUE_FALSE_MATRIX`: Tabel Pernyataan `| Benar | Salah |`
4. `SUITABILITY_MATRIX`: Tabel Pernyataan `| Sesuai | Tidak Sesuai |`

---

### Task 1: Update `/app/(siswa)/exams/[id]/cbt/page.tsx` with Multi-Type Question Renderers & Package

**Files:**
- Modify: `frontend/src/app/(siswa)/exams/[id]/cbt/page.tsx`

- [ ] **Step 1: Define `MockQuestion` Interface with Type Discriminators**

Add `type: "SINGLE_CHOICE" | "MULTIPLE_CHOICE" | "TRUE_FALSE_MATRIX" | "SUITABILITY_MATRIX"` and statement matrix row arrays to the question data model.

- [ ] **Step 2: Build Sample Master Question Dataset with All 4 Question Types**

Add 6 comprehensive sample questions representing all 4 question types:
- Q1: Single Choice (Pilihan Ganda A-E)
- Q2: Multiple Choice (Pilihan Ganda Kompleks Checkbox)
- Q3: True/False Matrix (`| Benar | Salah |`)
- Q4: Suitability Matrix (`| Sesuai | Tidak Sesuai |`)
- Q5: Multiple Choice (Literasi Bahasa)
- Q6: True/False Matrix (Pengetahuan Kuantitatif)

- [ ] **Step 3: Implement Custom Renderers for Checkbox & Matrix Row Selection**

Implement state handling for multi-choice arrays and matrix row key-value objects.

- [ ] **Step 4: Update Result Page (`/exams/[id]/result/page.tsx`) to Render Multi-Type Answers**

Update answer key display logic to support matrix tables and checkboxes.

- [ ] **Step 5: Verify Type Safety & Compilation**

Run `cmd /c "npx tsc --noEmit"` in `frontend/`.  
Expected: PASS with 0 errors.

- [ ] **Step 6: Commit Implementation**

```bash
git add "frontend/src/app/(siswa)/exams/[id]/cbt/page.tsx" "frontend/src/app/(siswa)/exams/[id]/result/page.tsx"
git commit -m "feat(siswa-cbt): add full support for multi-choice, true/false, and suitability matrix question types"
```
