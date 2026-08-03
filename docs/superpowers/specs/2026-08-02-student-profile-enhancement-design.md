# Design: Student Profile Page Enhancement (Full-Stack)

**Date:** 2026-08-02
**Status:** Approved
**Frontend:** Next.js at :3000 | **Backend:** Go Fiber at :8080

## Objective

Make every button/action on `frontend/app/(portal)/student/profile/page.tsx` functional, backed by real Go backend endpoints, real data, and graceful fallbacks to the existing hardcoded values.

## Scope

### Backend (new endpoints + migration 038)

1. **Change password** — `POST /auth/change-password` (auth-protected)
   - Body: `{ current_password, new_password }`
   - Verify current password (bcrypt) against stored hash, validate `new_password` with existing `validatePassword()`, update hash.
   - Reuse `ResetPassword` flow patterns in `backend/internal/auth/auth.go`.

2. **Student targets** — new table `student_targets`
   - Columns: `id UUID PK`, `user_id UUID NOT NULL UNIQUE`, `choice INT NOT NULL (1|2)`, `university TEXT`, `major TEXT`, `passing_score_irt INT`, `created_at`, `updated_at`.
   - Endpoints: `GET /profile/targets`, `PUT /profile/targets` (upsert the two choices).

3. **Certificates** — new table `student_certificates`
   - Columns: `id UUID PK`, `user_id UUID NOT NULL`, `title TEXT`, `exam_title TEXT`, `exam_date TIMESTAMPTZ`, `rank INT`, `score_irt INT`, `created_at`.
   - Endpoints: `GET /profile/certificates`, `GET /profile/certificates/:id/download` (returns HTML, print-to-PDF).
   - **Download format: HTML print-to-PDF** (no PDF library). Open in new tab, user Ctrl+P → save as PDF.

### Frontend — `student/profile/page.tsx` redesign

| Section | Current | New |
|---|---|---|
| Stat cards | Hardcoded #12 / 8 tryout / 690 | `GET /gamification/achievements` → rank, level, streak, badges, exams_completed + score from analytics/results. Fallback to old values on error/zero. |
| Avatar | Placeholder | `user.avatar_url` from `GET /auth/me` |
| Name/email | Text | From `user`; Edit Profile dialog → `PUT /auth/profile` (`full_name`) |
| Target & Prioritas | Static ITB/UNPAD card | `GET/PUT /profile/targets` via edit dialog (2 choices, major, passing score) |
| Download Sertifikat | Dead button | Dialog listing certificates → open HTML print-to-PDF |
| Pengaturan (top) | Dead button | Dropdown: Edit Profil, Notifikasi, Ubah Sandi, Keluar |
| Notifikasi & Pengingat | Non-functional | Dialog: list + `GET/PUT /notifications/preferences` channel toggles |
| Ubah Kata Sandi | Non-functional | Dialog → `POST /auth/change-password` |
| Keluar | Non-functional | `useAuth().logout()` + redirect `/login` |

New components under `app/(portal)/student/profile/`: `ProfileHeader`, `StatCards`, `TargetCard`, and dialogs (EditProfile, ChangePassword, Targets, Notifications, Certificates).

New hooks in `lib/api.ts`: `useAchievements()`, `useMyTargets()`, `useMyCertificates()`.

## Conventions

- Migration pattern: `037_academic_programs.up.sql` (CREATE TABLE IF NOT EXISTS + INDEX).
- Type-check: `cmd /c "npm run type-check 2>&1"`. Tests: `npm test` (vitest); backend Go tests use existing testify pattern.
- `apiFetch` auto-unwraps `{data}`; admin login `admin@yakinlulus.id` / `Admin@123!`.

## Out of Scope

- Admin notification send/broadcast (already exists, admin-only).
- Real photo upload endpoint (uses existing `avatar_url` / media endpoint).
