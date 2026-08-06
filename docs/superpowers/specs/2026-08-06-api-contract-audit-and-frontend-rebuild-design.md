# Design — API Contract Audit + Backend Completion (Batch 4) + Frontend Rebuild Ready

> **Konteks:** Migrasi backend pasca-rebuild database. Batch 1–3 selesai & di-merge (auth core, content-CMS, core-loop siswa: practice, cbt_runtime, scoring, analytics, dashboard, ranking, exam_packages). Masih ada modul yang menunjuk tabel `public.*` lama (sudah di-drop, `search_path` kosong) sehingga endpoint terkait akan 500 saat benar-benar dipakai. Frontend akan dibangun ulang seluruhnya oleh developer memakai Google Antigravity — repo ini HANYA menyediakan backend final + dokumentasi kontrak & wiring.

**Keputusan terkonfirmasi dengan user:**
1. Selesaikan backend dulu (Batch 4), **bukan** frontend dulu.
2. Bagian frontend dikerjakan sendiri oleh user; repo ini hanya output backend + dokumentasi kontrak API & wiring halaman yang lengkap/detail.
3. Antigravity dipakai user untuk membangun frontend; saya hanya menyiapkan dokumen yang siap dilempar ke Antigravity.
4. Role set = 6 role dari DB: `SUPER_ADMIN, STAFF, FINANCE, GURU, SISWA, INVESTOR`.
5. Konflik `/api/v1/practice/*` diselesaikan dengan **rename prefix** (bukan biarkan tabrakan).
6. Dokumentasi kontrak: **keduanya** (dokumen markdown + `openapi.yaml` formal).

## 1. Tujuan

1. **Selesaikan semua query backend** agar menunjuk schema baru (`identity`, `academic`, `finance`, `notification`, `content`, `cbt`, dll) — tidak ada endpoint yang menunjuk `public.*` yang ter-drop.
2. **Seragamkan RBAC** ke 6 role final, konfirmasi live di `identity.role`: `SUPER_ADMIN`, `STAFF`, `FINANCE`, `GURU`, `SISWA`, `INVESTOR`. Hilangkan role lama `ADMIN/TEACHER/STUDENT` dari gate.
3. **Resolve konflik route** `/api/v1/practice/*` antara `cbt_engine` dan `practice` dengan rename prefix.
4. **Kunci kontrak API final** (daftar endpoint + role gate + request/response) sebagai dasar frontend.
5. **Produksi dokumentasi kontrak & wiring halaman** untuk 6 peran, siap diserahkan ke Antigravity.

## 2. Lingkup & Non-lingkup

**Lingkup backend (agen):** rewrite Repository SQL modul tersisa; rename prefix route; migrasi kecil bila schema baru belum pas; seragamkan role gate; verifikasi (`go build/vet/test`); sinkronkan `openapi.yaml`.

**Non-lingkup (TIDAK dikerjakan di repo ini):**
- Seluruh frontend Next.js (dibangun user via Antigravity, di luar repo / branch terpisah).
- Tidak menambah fitur bisnis baru selain yang dibutuhkan untuk mempertahankan kontrak.

## 3. Kontrak API — Audit & Temuan (baseline)

> Route di bawah = daftar HTTP + role gate; label ⚠️ = masih menunjuk `public.*` lama.

### 3.1 Auth — `internal/auth`
Sudah benar: `/auth/me`, `/auth/profile`, `/auth/change-password`, `/auth/logout`, `/auth/refresh`, register/login/forgot/reset.
⚠️ Admin user-management menunjuk `public.users` / `public.sessions` / `public.password_resets`:
- `GET /auth/users`, `GET /auth/users/search`, `GET /auth/users/:id`, `POST /auth/users`
- `PUT /auth/users/:id`, `DELETE /auth/users/:id` (cascade di banyak tabel legacy), `PATCH /auth/users/:id/activate`
- Role gate lama `RequireRole(ADMIN,STAFF)` → `RequireRole(SUPER_ADMIN, STAFF)`.
- Target: `identity.user`, `identity.login_session`, `identity.password_reset`, junction role `identity.user_role`→`identity.role`; cascade pindah ke schema baru.

### 3.2 Academic delete
⚠️ `DELETE /academic/{resources}` menunjuk `public.{contents, subjects, chapters, topics, learning_outcomes, grades, education_levels, curriculums, academic_programs}`.
- Resource: `levels`, `grades`, `subjects`, `chapters`, `topics`, `learning-outcomes`, `curriculums`, `programs`.
- Target: `academic.{education_level,grade,subject,chapter,topic,learning_outcome,curriculum}` + junction `cbt.exam_*`, `question.question_*`. Cascade rewrite ke schema baru.
- Catatan: `academic.program` TIDAK ada di schema baru → perlu migrasi kecil (buat `academic.program`) atau keputusan dihapus/mapping.

### 3.3 Content CUD — `GET/POST/PUT/DELETE /contents`
- `CreateContent`/`GetContent`/`ListContent`/`DeleteContent` masih memakai `public.contents`, `public.subjects`, `public.grades` (resolver default).
- Target: `content.{material, exam}` sebagai model konten; resolver `academic.{subject,grade}`.
- Bagian lain content (materialFrom/GetSubjectName) SUDAH pakai schema baru.

### 3.4 Profile — `GET/PUT /profile/targets`, `GET /profile/certificates`
- `GetTargets`/`SaveTargets` → `public.users`, `public.grades`, `public.education_levels`, `public.student_targets`.
- `GetCertificates` → `public.content_exam_attempts`, `public.contents`.
- Target: `identity.user_profile`, `cbt.exam_attempt` + `cbt.grading_result` (sertifikat: skor dari grading). `student_targets` perlu migrasi baru (lihat §4).

### 3.5 Target Schools — seluruh CRUD `/target-schools`
- DTO `TargetSchool` butuh: `name, level, min_score, max_score, max_total_score, subjects (json), academic_year, is_active`. `academic.school` TIDAK punya kolom level/skor penyerta.
- Keputusan: **tabel baru `academic.target_school`** (independen, tak mengotori master `academic.school`), dengan FK ke `academic.level`/`academic.school` (nullable).

### 3.6 Subscription — seluruh `/subscriptions`
- `subscription_plans`, `user_subscriptions`, `users` → `finance.membership_package`, `finance.user_membership`, `finance.subscription`, `identity.user`.
- Template untuk `/subscriptions/stats` (KPI finance).

### 3.7 Notification — seluruh query
- `notifications` → `notification.user_notification` + `notification.notification_preferences` + `notification.notification_template`.
- Route: `/notifications`, `/unread-count`, `/notifications/:id`, `/notifications/:id/read`, `/:id/archive`, `/read-all`, `/send`, `/broadcast`, `/preferences`, template CRUD.

### 3.8 Seragamkan role gate — global
- Semua `RequireRole("ADMIN","TEACHER","STUDENT")` di route → 6 role baru.
- Pola umum: write authoring = `(SUPER_ADMIN, STAFF, GURU)`; admin-only = `SUPER_ADMIN`; read siswa = `SISWA` (+ Guru utk read data murid).

### 3.9 Konflik `/practice/*`
- `cbt_engine`: `/practice/material/:materialId`, `/practice/subject`, `/practice/tags`, `/practice/:sessionId/*` (start/flow attempt ujian).
- `practice`: `/practice/sessions/*`, `/practice/stats`.
- Keputusan: **rename prefix** — modul `practice` (latihan) tetap di `/practice/sessions/*`; modul `cbt_engine` (mulai ujian) dipindah ke **`/exam-practice/*`** (mis. `/exam-practice/material/:materialId`, `/exam-practice/subject`, dst) supaya tak bentrok dan jelas beda makna.

**Penting untuk frontend:** daftar route final ini adalah KONTRAK yang dikunci di dokument — tidak berubah lagi setelah Batch 4.

## 4. Migrasi SQL baru (perkiraan; diverifikasi saat implementasi)

| No | Isi | Alasan |
|---|---|---|
| `213_*` | Tabel `academic.target_school` (id, school_id FK `academic.school` nullable, level, min_score, max_score, max_total_score, subjects jsonb, academic_year, is_active) | DTO `TargetSchool` tak cocok ke `academic.school` |
| `214_*` | (opsional) relasi target/progress siswa jika `student_targets` diperlukan | tergantung verifikasi profile |
| (bisa lebih) | `academic.program` bila perlu | tergantung verifikasi |

Konvensi `NNN_*`, di-apply via `go run ./cmd/migrate/main.go up` dari `backend/`, direkam ke `_migrations`.

## 5. RBAC final — 6 role + mapping akses (kontrak frontend)

| Role | Deskripsi | Area |
|---|---|---|
| `SUPER_ADMIN` | Semua akses | semua |
| `STAFF` | Authoring + kelola CMS/school/level + admin non-finans | content/cms/akademik |
| `FINANCE` | Beranda finance | `finance.*`, dashboard finance, membership, payment, invoice, wallet, laporan |
| `GURU` | Kelola murid/kelas (read), authoring | content (own), analytics sempit |
| `SISWA` | Core loop siswa | materi, practice, CBT, hasil, rekomendasi, ranking, profil |
| `INVESTOR` | Laporan finansial read-only | finance reports (board investor baru) |

Catatan: **FINANCE** dan **INVESTOR** adalah peran baru di UI (tak ada di frontend lama) — struktur halaman di dokumentasi.

## 6. Verifikasi

- `go build ./...`, `go vet ./...`, `go test ./...` hijau (DB-backed test skip tanpa DB_URL).
- **Tidak ada** query di `backend/internal` yang lagi memakai tabel `public.*`-legacy unprefixed (`FROM users`, `contents`, `notifications`, `subscription_plans`, `target_schools`, `student_targets`, `subjects`, `grades`, ...). Scan → 0 (kecuali di file yang memang pakai schema baru).
- `openapi.yaml` sinkron dengan daftar route final.
- Probes DB zero-residue setelah test.

## 7. Deliverables — dokumentasi untuk frontend (di `docs/frontend/`)

1. `API-contract.md` — semua endpoint: method, path (final), role gate, deskripsi, req/res, sumber tabel.
2. `openapi.yaml` — spesifikasi formal lengkap untuk seluruh endpoint (bukan sekadar listing).
3. `PAGE-WIRING.md` — struktur halaman + wiring per role (nav, page list, hook + endpoint, guard) untuk 6 peran; termasuk halaman baru FINANCE & INVESTOR; dan page-map siswa/lengkap.
4. `ANTIGRAVITY-SETUP.md` — panduan membawa kamus/kontrak ke Antigravity (AGENTS.md, skill mount, verifikasi) untuk membangun frontend.

## 8. Urutan eksekusi (backend → dokumentasi)

1. **A1:** auth admin rewrite (`identity.*` + role gate).
2. **A2:** academic delete cascade rewrite.
3. **A3:** content CUD rewrite.
4. **A4:** profile (targets + certificates).
5. **A5:** target_schools + migrasi `213`.
6. **A6:** subscription/finance.
7. **A7:** notification.
8. **A8:** role-gate harmonize + rename route `/exam-practice`.
9. **Final:** full build/test + residue + `openapi` sync + tulis dokumen frontend + verifikasi.

Tiap sub-modul dikembangkan ke `main` setelah review (pola batch sebelumnya).

---

## Lampiran — ringkas status
- Batch 1 (auth-master), 2 (content-cms), 3 (core-loop) selesai.
- Batch 4 (ini): auth (admin), academic (delete), content (CUD), profile, target_schools, subscription/finance, notification + harmonize role + fix route conflict.

- Branch `main` (HEAD `a199491`).