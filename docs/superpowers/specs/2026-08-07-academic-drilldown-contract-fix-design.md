# Design: Academic-Master Drill-down Contract Fix

Date: 2026-08-07

## Problem

The Admin Academic hierarchy (Jenjang → Kelas → Mapel → Bab → Topik) does not
show the correct seeded data because two frontend→backend calls hit handlers
that ignore their filter parameters:

1. `getChapters(subjectId)` calls `GET /academic/chapters?subject_id=…`, which
   routes to `ListAllChapters` — a handler that returns every chapter in the
   system, ignoring `subject_id`.
2. `getTopics(chapterId)` calls `GET /academic/topics?chapter_id=…`, which
   routes to `ListAllTopics` — a handler that returns every topic, ignoring
   `chapter_id`.

## Domain model

Backend stores `subject → chapter → subchapter → topic` plus
`learning_outcome` keyed through competencies. The Admin UI renders
`subject → Bab(chapter) → Topik(topic)` — subchapters are an intermediate
grouping not surfaced in this view. Topic rows already carry the owning
`chapter_id` (via `JOIN academic.subchapter sc ON sc.id = t.subchapter_id`),
so a `chapter_id` filter maps directly onto the existing query.

## Design

### Change 1 — Frontend conforms to the existing backend contract (chapters)

The backend already exposes the correct filtered route
`GET /academic/subjects/:id/chapters` (`ListChapters`), returning rows that
match the frontend `Chapter` type. Fix the frontend service to use it:

- `frontend/src/services/academic-master.service.ts` — `getChapters`:
  `/academic/chapters?subject_id=${subjectId}` → `/academic/subjects/${subjectId}/chapters`.

No backend change for chapters.

### Change 2 — Backend accepts `chapter_id` on `/topics`

Extend the existing endpoint so it filters when `chapter_id` is provided and
behaves as before when absent (safe default, no breakage for other callers):

- `Repository.ListAllTopics(ctx)` → `ListAllTopics(ctx, chapterID *uuid.UUID)`;
  append `WHERE sc.chapter_id=$1` when non-nil.
- `Service.ListAllTopics` → pass the parameter through.
- `Handler.ListAllTopics` — parse `chapter_id` with `uuid.Parse`, return 400 on
  invalid input (same pattern as `ListSubjects`/`ListGrades`).
- `Router.RegisterAcademicRoutes` unchanged (path stays `/topics`).

The frontend already sends `chapter_id`; no FE change for topics.

### Non-goals

- No schema/table changes.
- No subchapter CRUD in the admin UI.
- No changes to `/learning-outcomes` (already filters by `topic_id`).

## Verification

- Backend: `go build ./...`, `go vet ./internal/academic/`, `gofmt -l`,
  `go test ./internal/academic/ -count=1`.
- Frontend: `npx tsc --noEmit`, `npm run lint`.
