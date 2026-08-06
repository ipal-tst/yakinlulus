# Batch 3 — Core Loop Siswa (Student Core Loop) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Status:** ✅ SELESAI — seluruh 6 sub-fase (3.1 cbt_runtime, 3.2 practice+migration 211, 3.3 scoring, 3.4 analytics, 3.5 dashboard, 3.6 ranking+exam_packages+migration 212) sudah di-implementasi, di-review, dan di-merge FF ke `main`.

**Goal:** Menghidupkan kembali loop inti siswa terhadap schema baru (`cbt`, `ranking`, `analytics`): latihan per topik, simulasi CBT (timer/proctor/fullscreen), hasil+pembahasan, mastery per topik, rekomendasi, dashboard, dan leaderboard. Batch 2 (media/question/material/CBT-authoring/CBT-runtime/CMS/ownership) sudah di-merge.

**Architecture:** Rewrite lapisan Repository SQL per modul dari schema `public` lama (sudah di-drop) menuju schema baru ber-prefix. Kontrak HTTP API dipertahankan. Delivered sebagai **satu plan banyak sub-fase** (masing-masing di-review + merge ke `main`), mengikuti pola Batch 2. Hanya lapisan Repository yang berubah; Service/Handler tetap.

**Tech Stack:** Go 1.26 + Fiber v2, pgx/v5, PostgreSQL 16 (Supabase). Schema: `cbt`, `ranking`, `analytics`, referensi `identity`/`academic`/`question`/`content`/`media`.

## Global Constraints

- **Semua query WAJIB prefix skema** (`cbt.`, `ranking.`, `analytics.`, `question.`, `academic.`, `identity.`, `content.`, `media.`). Schema `public` lama TIDAK ADA (kecuali `_migrations`).
- **Kontrak API dipertahankan**: struct domain di `analytics.go`, `advanced.go`, `dashboard.go`, `ranking.go`, `exam_packages.go`, `runtime.go`, `practice.go`, `scoring.go` TETAP (field/JSON tag sama). Boleh menambah field opsional `omitempty`, tidak menghapus.
- **Role baru**: `SUPER_ADMIN`, `STAFF`, `FINANCE`, `GURU`, `SISWA`, `INVESTOR`. Legacy `RequireRole("ADMIN","STAFF","TEACHER")` → `HasAnyRole(SUPER_ADMIN, STAFF, GURU)`; `STUDENT` → `SISWA`; `ADMIN` alone → `SUPER_ADMIN`. Modul yang melayani siswa pakai `RequireAuth` + ownership (user_id dari JWT).
- **PK uuid, timestamptz, soft-delete `deleted_at`** di master, trigger `shared.set_updated_at()`.
- **Ownership siswa**: `c.Locals("user_id")`/`role` dipakai; siswa hanya lihat data/riwayat sendiri (kecuali role admin/GURU/staff).
- TIDAK menambah migrasi baru kecuali benar-benar mengisi gap (crow: practice-session trajectory — lihat sub-fase 3.3).
- Batas lingkup: modul di luar Batch 3 (`subscription`, `finance`, `notification`, `target_schools`, `profile`, `school`, `ai`, `audit`, `ws`, `auth`, `academic`, `admin`, `content` kunsumen) TIDAK diubah strukturnya, kecuali penyamaan query yang diperlukan. Kompilasi semesta tetap hijau.

## Scope & Deliverables (PRD §10 Batch 3)

1. **Latihan per topik / practice** → `practice` module: mulai sesi, jawab soal (per-question feedback), daftar sesi, riwayat, stats akurasi. Question dari `question.question`; sesi → lihat keputusan sub-fase 3.3.
2. **Simulasi CBT (timer/proctor/fullscreen)** — cbt_runtime (`cbt.exam_attempt`, `cbt.exam_timer`, `cbt.cheating_log`, `cbt.attempt_question`/`attempt_option`, `cbt.student_answer`).
3. **Hasil+pembahasan** — `cbt.grading_result`+`grading_detail`+`question.question` (review).
4. **Mastery per topik** — `analytics.analytics_student`/`analytics_exam`, `cbt.question_statistics`.
5. **Rekomendasi & target** — persist rule-based di `analytics.analytics_insight`/dashboard cache (ringkas).
6. **Dashboard** (`student`/`teacher`/`admin`) — baca `cbt`, `content`, `analytics`, `ranking`.
7. **Ranking** — `ranking.leaderboard`/`leaderboard_entry`/`subject_ranking`/`user_rank_summary`.
8. **exam_packages** — `cbt.exam_package` + `cbt.exam_package_question`; satu baca `contents`-EXAM → `cbt.exam`.

## Gate (PRD §10 Batch 3)
Siswa menyelesaikan loop penuh: **latihan → CBT → hasil → rekomendasi → ranking**.

---

## Subphase Breakdown (setiap sub-fase di-review + merge ke `main` terpisah)

Urutan: cbt_runtime (fondasi runtime) → practice → scoring → analytics+mastery → dashboard → ranking → exam_packages.

## Subphase 3.1 — CBT runtime (cbt_runtime module)

**Files:**
- Modify: `backend/internal/cbt_runtime/runtime.go`

**Legacy→New:** `exam_sessions`→`cbt.exam_attempt`(+`cbt.exam_participant`); `exam_questions`→`cbt.attempt_question`; `exam_session_questions`→`cbt.attempt_question`/`attempt_option`; `question_options`→`question.question_option`; `violations`→`cbt.cheating_log`; `results`→`cbt.grading_result`/`grading_detail`; `question_analytics`→`cbt.question_statistics`; duration/passing/negative → `cbt.exam_metadata`; `content_exams`→`cbt.exam`+`cbt.exam_metadata`; `questions`/`contents`(question)→`question.question`.

**Task 3.1.1 — Session lifecycle (start/find/list/pause/resume/finish/terminate)**
- TDD. `Start` (verify exam published, create `cbt.exam_participant`+`cbt.exam_attempt` READY/STARTED, seed `attempt_question` + `attempt_option` from package/pool, set `cbt.exam_timer.remaining_second`), `GetExamQuestions` (`cbt.attempt_question`→`question.question` current version), `CheckExamstarted` (participant), Pause/Resume/Finish (attempt status + timer + last_sync), Terminate (`exam_attempt`+`cbt.auto_submit` reason CHEATING).
- Preserve `ExamSession`/`SessionQuestion`/`SessionQuestionOption` JSON.

**Task 3.1.2 — Answer sync + review + grading**
- Sync/Answer → `cbt.student_answer` (attempt→attempt_question map, selected_option). Finish → compute correct/wrong/blank → `cbt.grading_result` (easy score, passed from `exam_metadata.passing_score`) + `cbt.grading_detail` per question. GetAnswers round-trip. Review → `grading_detail`+`question.question` (options + is_correct came true option).
- SaveViolation → `cbt.cheating_log` (event map TAB_CHANGE/COPY/PASTE/SCREENSHOT/WINDOW_BLUR). Question analytics upsert → `cbt.question_statistics`.

**Task 3.1.3 — Proctor/timer/auto-submit/offline (ringkas)**
- Timer `cbt.exam_timer`/`timer_history`; auto-submit `cbt.auto_submit` (TIMEOUT/MANUAL/CHEATING/..). Minimum agar route lama tidak runtime-fail; sertakan `cbt.offline_sync` jika dipakai.

## Subphase 3.2 — Practice module
**Files:** `backend/internal/practice/practice.go`.
**Legacy→New:** question/option reads → `question.question`+`question.question_option`; `content_practice_sessions` (INSERT/UPDATE/COUNT/list) dan stats → keputusan trajectory `practice_session` (lihat bawah); `subjects` join → `academic.subject`; `content.Repository.GetUserGradeID` sudah migrated ke `academic`.
- pickQuestions: `question.question` `status=PUBLISHED` (via `question_status`), filter subject/junctions `question.question_subject`.
- GetCorrectOption/is_correct → `question_option.is_correct` current version.
- Sesi (list/stats): baca dari sink practice-session (lihat keputusan di bawah).
- **KEPUTUSAN (confirmed):** tambah migrasi `211_content_practice_session.up/.down.sql` — tabel `content.practice_session` (id uuid PK, student_id FK identity.user, subject_id uuid nullable (academic.subject), grade_id uuid nullable (academic.grade), status text CHECK (IN_PROGRESS/GRADED/SUBMITTED), total_score numeric(10,2) default 0, max_score numeric(10,2) default 0, answered_count int default 0, correct_count int default 0, started_at, finished_at, created_at, updated_at). Practice module memakai tabel ini sebagai master sesi; soal/opsi tetap dari `question.*`.

## Subphase 3.3 — Scoring (hasil)
- `backend/internal/scoring/scoring.go`: GetResult/ListByUser/GetSubjectBreakdown → `cbt.exam_attempt`+`cbt.grading_result`+`cbt.grading_detail`+`question.question`+`academic.subject`. `content.Repository`? hanya read. 
- `Result` JSON contract dipertahankan; `session_id` field menunjuk `attempt_id`.

## Subphase 3.4 — Analytics & mastery & admin reports
- `backend/internal/analytics/analytics.go` + `advanced.go`: rewrite GetExamAnalytics/GetStudentAnalytics/GetQuestionAnalytics/GetAdminExamReports/GetAdminExamReportByID/GetAdminOverviewAnalytics → `cbt` + `analytics` + `academic`; leaderboard/timeline/difficulty/school → `ranking`/`analytics`+`question.question`.
- KPI/aggregates → `analytics.*` snapshot tables.
- Route remap role (`TEACHER`→`GURU`, `ADMIN`→`SUPER_ADMIN`).

## Subphase 3.5 — Dashboard
- `backend/internal/dashboard/dashboard.go`: student/teacher → `cbt`+`content`+`analytics`+`ranking`(national rank); admin → `analytics`+`identity`+`academic`; KPI/active/users → `analytics.*`.

## Subphase 3.6 — Ranking + exam_packages
- `backend/internal/ranking/ranking.go`: FetchRawScores → `cbt.exam_attempt`+`cbt.grading_result`+`participant_statistics`; buildRanking → `ranking.leaderboard_entry`/`subject_ranking`; Monthly time-window & limit.
- `backend/internal/exam_packages/exam_packages.go`: `exam_packages`→`cbt.exam_package`+`cbt.exam_package_question`; `IsExamContent`→`EXISTS(cbt.exam WHERE id=$1)`. Role gate remap.

---

## Verification Gate (per sub-fase)
- [x] `go build ./...`, `go vet ./...`, `go test ./...` hijau.
- [x] DB-backed integration test (skip tanpa DB_URL) memverifikasi behaviour nyata; cleanup zero-residue.
- [x] Whole-branch review oleh task-reviewer; serapan temuan sebelum merge. Merge FF ke `main`, hapus branch/worktree.
- [ ] (opsional) smoke-test `go run ./cmd/api` prosedur port 8081 + config temp (port 8080 dipakai `api.exe`).

## Deliverables Checklist (final Batch 3)
- [x] Latihan: pick-soal topik → jawab (feedback per-question) → riwayat/stats.
- [x] CBT: start → sync answers → finish → grading/result → review (pembahasan).
- [x] Mastery/analytics per topik.
- [x] Dashboard student/teacher/admin.
- [x] Ranking + leaderboard.
- [x] exam_packages di `cbt.*`.
- [x] Kompilasi semesta hijau (subscription/finance/notif/target_schools/profil dsb tetap kompilasi).

---

## Follow-ups terdefer (ponytail:)
- Practice-session master not exist in new schema → pilih ringan (detail di Sub 3.2).
- `question_analytics` legacy-only → gunakan `cbt.question_statistics`/`analytics.analytics_question`.
- Fullscreen/proctor deep-integration (WebSocket `ws`) tetap di ws module.