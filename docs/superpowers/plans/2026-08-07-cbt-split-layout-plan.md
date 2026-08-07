# CBT Split Layout & Floating Navigation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign `/app/(siswa)/exams/[id]/cbt/page.tsx` to separate Question text (Left Panel) from Answer Options (Right Panel), and add a Floating/Hover Question Navigation Grid widget at the bottom-left corner.

**Architecture:** Next.js 16 App Router using React client components, Tailwind CSS v4 split layouts, Lucide icons.

---

### Task 1: Update `/app/(siswa)/exams/[id]/cbt/page.tsx` with Split Layout & Floating Navigation

**Files:**
- Modify: `frontend/src/app/(siswa)/exams/[id]/cbt/page.tsx`

- [ ] **Step 1: Implement 2-Column Split-Screen Grid**

Divide main panel into Left (Question text & stimulus, scrollable) and Right (Options A-E, scrollable, previous/next controls).

- [ ] **Step 2: Implement Bottom-Left Floating Question Navigation Widget**

Create a fixed floating widget (`fixed bottom-6 left-6 z-40`) with hover/click trigger showing progress and expanding a scrollable popover number grid with status color coding.

- [ ] **Step 3: Preserve Timer & Auto-Save Functionality**

Keep timer, auto-save state, finish confirmation modal, and flag/ragu-ragu toggling active.

- [ ] **Step 4: Verify Type Safety & Compilation**

Run `cmd /c "npx tsc --noEmit"` in `frontend/`.  
Expected: PASS with 0 errors.

- [ ] **Step 5: Commit Implementation**

```bash
git add "frontend/src/app/(siswa)/exams/[id]/cbt/page.tsx"
git commit -m "feat(siswa-cbt): redesign CBT interface with split question/options panels and floating navigation widget"
```
