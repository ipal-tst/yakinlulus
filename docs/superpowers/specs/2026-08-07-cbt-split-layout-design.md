# Design Specification: Split-Screen CBT Interface with Floating Question Navigation

**Date:** 2026-08-07  
**Status:** Approved by User  
**Target File:** `frontend/src/app/(siswa)/exams/[id]/cbt/page.tsx`

---

## 1. Objective

Redesign the Computer-Based Test (CBT) student exam interface (`/exams/[id]/cbt`) to provide a split-screen layout separating the Question Content (Left) from the Answer Options (Right), while introducing a floating/hover Question Navigation widget at the bottom-left corner.

---

## 2. Layout Structure & Components

### 2.1 Header Bar (Sticky Top)
- Exam Title & Subtest metadata on the left.
- Countdown Timer & Auto-Save indicator in the center.
- Finish Exam button ("Selesai Ujian") on the right.

### 2.2 Split Main Panel (`flex-1 flex overflow-hidden`)
- **Left Panel: Question Section (50-60% width on Desktop)**:
  - Scrollable view for question number badge, stimulus text, passage, formulas, or images.
  - Dedicated header for question metadata (e.g. *Soal Nomor 1 dari 155*).
- **Right Panel: Options Section (40-50% width on Desktop)**:
  - Scrollable view containing options A, B, C, D, E with tactile selection states.
  - "Ragu-Ragu" toggle button at the top of options.
  - Previous ("Soal Sebelumnya") and Next ("Soal Selanjutnya") navigation buttons at the bottom right.

### 2.3 Floating Question Navigation Widget (Bottom-Left Corner)
- **Position**: `fixed bottom-6 left-6 z-40`.
- **Behavior**: Hover / Click trigger button showing current active question badge and progress.
- **Popover / Drawer Grid**:
  - Displays color-coded number grid:
    - **Green**: Answered
    - **Amber**: Flagged / Ragu-Ragu
    - **Blue / Ring**: Currently Active
    - **Muted**: Unanswered
  - Expands smooth popover overlay on hover/click without obstructing question content.

---

## 3. Verification Plan

1. **Type Safety**: Run `npx tsc --noEmit` in `frontend/` to confirm 0 compilation errors.
2. **UI Verification**: Ensure split-screen layout renders correctly on desktop and stacks gracefully on mobile screens.
