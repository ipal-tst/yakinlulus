# Sprint 19 Summary: Advanced Practice & Exam System

Date: 2026-07-28
Status: COMPLETED

## Migrations
- `025_advanced_practice_exam_pool.up.sql` - Practice sets, sessions, question pools, exam blueprints
- `025_advanced_practice_exam_pool.down.sql` - Rollback

## Backend Changes
### Domain Models (content/content.go)
- Added: `PracticeSession`, `PracticeSet`, `QuestionPool`, `ExamSubjectBlueprint`, `SubjectBreakdown`
- Extended: `Repository` interface with 17 new methods

### Repository Layer (content/repository.go)
- Implemented: 17 new methods for practice/exam CRUD

### CBT Engine (cbt_engine/engine.go)
- Refactored: `AddSessionQuestionsWithSubject` - uses content.Repository interface methods
- Added: `GetBlueprint`, `StartAttemptWithSubjectBlueprints`, `StartTagBasedExam`, `StartMultiSubjectExam`

### Handlers (cbt_engine/handler.go)
- Added 11 new handlers:
  - `GetPracticeSets`, `GetPracticeSet`
  - `StartMaterialPractice`, `StartPracticeSet`
  - `StartTagBasedExam`, `StartMultiSubjectExam`
  - `SubmitAnswer`, `GetSession`, `GetSessionResults`
  - `GetSubjectBreakdown`
- Updated: `RegisterRoutes` with new routes

### Scoring (scoring/scoring.go)
- Extended: `Result` struct with `SubjectBreakdown` field (JSON: `subject_breakdown`)
- Updated: `GetResult` query to include subject_breakdown

## Frontend Changes
### New Components
- `frontend/app/(portal)/teacher/exam/custom/page.tsx` - CustomExamBuilder (tag-based & multi-subject exam creation)
- `frontend/app/(portal)/student/tryout/[id]/result/page.tsx` - ExamResultPerSubject (per-subject score breakdown)
- `frontend/app/(portal)/student/practice/material/[materialId]/page.tsx` - Post-material practice page

### Updated Files
- `frontend/lib/api-client.ts` - 10 new API methods
- `frontend/app/(portal)/student/practice/page.tsx` - Added practice package types
- `frontend/app/(portal)/student/materials/[materialId]/page.tsx` - Added practice button integration

### UI Components Added
- `components/ui/progress.tsx` - Progress bar
- `components/ui/select.tsx` - Select dropdown (Radix-based)

## Build Status
- Frontend: PASS (next build exit 0)
- Backend: PASS (go build + go test exit 0)

## Routes Added
- `/practice-sets`, `/practice-sets/:id`
- `/practice/material/:materialId`, `/practice/set/:setId`
- `/exams/tag-based`, `/exams/multi-subject`
- `/sessions/:sessionId/answer`, `/sessions/:sessionId`
- `/sessions/:sessionId/results`, `/sessions/:sessionId/subject-breakdown`

## Deferred (Sprint 18)
- Separate handlers/repositories for content/ and cbt_engine/
