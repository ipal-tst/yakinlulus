# Design: Target Sekolah & Jurusan — Multi-Jenjang + Pemacu Semangat

**Date:** 2026-08-02
**Status:** Approved
**Frontend:** Next.js at :3000 | **Backend:** Go Fiber at :8080

## Objective

Enhance the Target Sekolah & Jurusan feature in the student profile. Currently it
only supports universities (PTN) with fixed fields. Now it must support **SMP**,
**SMA**, and **Universitas** targets with admin-managed school master data
(acceptance score thresholds), auto-computed student scores, and a motivating,
informative UI.

## Key Decisions (from brainstorming)

1. **Target type derived from student's grade** — SD→SMP, SMP→SMA, SMA/SMK→Universitas.
   Set automatically by backend from `users.grade_id`; students pick the school/major.
2. **Admin-managed master data** — `target_schools` with acceptance score range,
   updated annually. Students select a school from the master list.
3. **Custom score scale** — total score is NOT hardcoded at 400. Each school record
   carries `max_total_score` + `subjects` (JSONB) so subjects can grow/shrink.
4. **Student score auto-computed** — Universitas: IRT score from gamification.
   SMP/SMA: sum of best-per-subject tryout scores, compared to school threshold.
   Fallback to "Belum ada nilai tryout" when empty.

## Backend Changes

### Migration 039

**New table `target_schools`:**
```
id UUID PK
name VARCHAR(200) NOT NULL
level VARCHAR(20) NOT NULL CHECK (level IN ('SMP','SMA','UNIVERSITY'))
min_score INT
max_score INT
max_total_score INT NOT NULL DEFAULT 400
subjects JSONB NOT NULL DEFAULT '[]'
academic_year VARCHAR(20)
is_active BOOLEAN NOT NULL DEFAULT true
created_at / updated_at
```

**Alter `student_targets`:**
- ADD `target_type VARCHAR(20)` CHECK (target_type IN ('SMP','SMA','UNIVERSITY'))
- ADD `target_school_id UUID REFERENCES target_schools(id) ON DELETE SET NULL`
- RENAME `university` → `school_name` (fallback text when not from master)
- `major`, `passing_score_irt` become nullable (PTN only)

### Endpoints

- `GET /target-schools?level=SMP` — list active schools (dropdown + enrichment)
- `GET /profile/targets` — enriched per-target: school threshold, student score,
  gap, progress %
- `PUT /profile/targets` — save targets (type auto from grade)
- Admin CRUD `GET/POST/PUT/DELETE /admin/target-schools` (+ toggle is_active)

### Score computation (backend, dynamic)

- Read `subjects` from the school's `target_schools` record.
- Sum best-per-subject tryout scores for those subjects (from results/attempts).
- `progress% = student_score / max_total_score`.
- No hardcoded 400 anywhere; driven by master data.

## Frontend Changes (student profile)

### Target card redesign (informative + motivating)
- Shows target type badge (SMP/SMA/Universitas)
- School name, major (PTN only), threshold range (min–max)
- Student's current score vs threshold → progress bar + gap ("Kurang X poin")
- Motivational state: Lulus/Lebih (green), Kurang (amber/red), Belum ada nilai (neutral)
- Edit button → dialog

### Targets dialog
- Target type auto-selected (from grade), shown as read-only info
- School dropdown from `/target-schools?level=<type>` (searchable)
- Major + passing score only for Universitas
- Save → `PUT /profile/targets`

### Admin page (target schools management)
- Table of schools + thresholds + year
- Create/edit/delete + toggle active
- Fields: name, level, min_score, max_score, max_total_score, subjects, academic_year

## Conventions

- Migration pattern per `038_student_profile.up.sql` (+ down file).
- Type-check: `cmd /c "npm run type-check 2>&1"`. Tests: `npm test` (vitest).
- Backend tests: testify; new tests for profile score computation + admin CRUD.
- TDD: write failing tests first for backend score logic and admin handlers.
- `apiFetch` auto-unwraps `{data}`; admin login `admin@yakinlulus.id` / `Admin@123!`.

## Out of Scope

- Notifications, certificate generation (already done).
- Historical yearly threshold versioning (single current record per school; update in place).
