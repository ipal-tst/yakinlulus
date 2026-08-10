# API Contract — User Siswa (Master Document)

> **File:** `docs/frontend/API-contract-siswa.md`
> **Status:** ACTIVE (endpoint existing) + DRAFT (endpoint `[KONTRAK BARU]` belum rilis)
> **Base URL:** `http://localhost:8080/api/v1`
> **Auth:** Bearer JWT — butuh `Authorization: Bearer <token>` (kecuali endpoint publik)
> **Standar isi:** JSON (`application/json`), key **snake_case**, waktu ISO-8601 UTC
> **Versi dokumen:** v1.7 (2026-08-09)

> **Dokumen ini adalah MASTER KONTRAK API untuk pengguna SISWA.**
> Setiap kontrak baru terkait siswa **ditambahkan ke dokumen ini** di bagian yang sesuai,
> lengkap dengan `Versi` + `Status` (DRAFT/BLOCKED/ACTIVE) pada tabel baris endpoint-nya.

---

## Isi / Daftar

1. Konvensi Global (envelope, error, pagination)
2. Auth
3. Dashboard & Widget
4. Master Academic (picker)
5. Materi (Materials)
6. Latihan (Practice)
7. Latihan Ujian (Exam-Practice)
8. Ujian / CBT (Exams + Runtime)
9. Hasil (Results / Scoring)
10. Peringkat (Leaderboard)
11. Analitik (Analytics siswa)
12. Profil / Target / Sertifikat
13. Notifikasi
14. AI Tutor
15. Paket Ujian & Media (read)
16. `[KONTRAK BARU]` — DRAFT (belum rilis, dibuat menyusul)
17. Lampiran: mapping DB & versi/revisi

---

## 1. Konvensi

### 1.1 Response envelope (semua endpoint non-file)

```json
{
  "success": true,
  "message": "ok",
  "data": { },
  "meta": { "page": 1, "limit": 20, "total": 5, "total_pages": 1, "has_next": false, "has_previous": false }
}
```

- `data` selalu ada (objek/array). `meta` hanya ada bila endpoint paginated.
- File/certificate di-download langsung (bukan `application/json`).

### 1.2 Error envelope

```json
{ "success": false, "message": "...", "error_code": "VALIDATION_ERROR", "errors": [] }
```

Error codes: `VALIDATION_ERROR` (400), `UNAUTHORIZED` (401), `FORBIDDEN` (403),
`NOT_FOUND` (404), `CONFLICT`/`ATTEMPT_ALREADY_SUBMITTED` (409),
`EXAM_NOT_STARTED`/`EXAM_FINISHED` (409), `MAX_ATTEMPTS_REACHED` (409), `INTERNAL_ERROR` (500).

### 1.3 Pagination

Query `?page=<number>&limit=<number>` (default `1 / 20`, max `100`). Baca `meta`.

### 1.4 Konvensi error 401

Frontend `src/lib/api.ts` otomatis logout saat `401`.

---

## 2. Auth

| Method | Path | Auth | Diperuntukkan |
|---|---|---|---|
| POST | `/auth/register` | Publik | Registrasi siswa (`role` dipaksa `SISWA`) |
| POST | `/auth/login` | Publik | Login |
| POST | `/auth/refresh` | JWT | Refresh token (`{refresh_token}`) |
| GET | `/auth/me` | JWT | Data user aktif |
| PUT | `/auth/profile` | JWT | Update profil |
| POST | `/auth/change-password` | JWT | Ganti password |
| POST | `/auth/logout` | JWT | Logout (clear cookies) |

### `POST /auth/register`

```jsonc
// request
{ "email": "siswa@mail.com", "password": "S&raPassword1", "full_name": "Budi" }
// 201 data
{
  "user": { "id": "...", "email": "...", "full_name": "Budi", "role": "SISWA", "is_active": true },
  "token": "eyJ..."
}
```
> Password: min 10 karakter, kombinasi huruf besar/kecil, angka, simbol.

### `POST /auth/login`
`{ "email": "...", "password": "..." }` → sama `{user, token}` + cookie HTTP-only `token`.
Simpan `token` di `localStorage["yl_token"]`, `user` di `localStorage["yl_user"]`.

### `GET /auth/me` → `data`
```json
{
  "id": "uuid", "email": "string", "full_name": "string", "role": "SISWA",
  "grade_id": "uuid|null", "is_active": true, "avatar_url": "string|null",
  "school_name": "string|null", "gender": "string|null", "phone": "string|null",
  "major": "string|null", "created_at": "ISO", "updated_at": "ISO"
}
```

### `PUT /auth/profile`
```json
// optional fields
{ "full_name": "string", "school_name": "string", "gender": "F|M", "avatar_url": "string",
  "phone": "string", "major": "string", "grade_id": "uuid" }
```
> Catatan: saat ini `grade_id`/`school_name` di-strip untuk non-admin. Kelas diutus lewat
> endpoint enrollment (lihat `[KONTRAK BARU]` bila perlu).

### `POST /auth/change-password`
```json
{ "current_password": "string", "new_password": "string" }
```

### `POST /auth/forgot-password` / `POST /auth/reset-password`
```json
// forgot { "email": "..." }
// reset  { "token": "string", "password": "string" }
```

---

## 2. Dashboard Siswa

### `GET /dashboard/student` — **ACTIVE**

| Method | Auth | Role | Keterangan |
|---|---|---|---|
| GET | JWT | SISWA (any) | Keseluruhan widget dashboard |

Konten grade sudah otomatis di-filter sesuai enrollment siswa.

**`data` (skema lengkap):**
```json
{
  "greeting": { "full_name": "string", "greeting": "string", "date": "string", "motivation": "string" },
  "continue_learning": {
    "material_id": "uuid", "title": "string", "subject_name": "string",
    "progress": 62.5, "remaining_minutes": 15
  },
  "today_goal": {
    "target_materials": 3, "completed_materials": 1,
    "target_questions": 10, "answered_questions": 4, "progress_pct": 38.46
  },
  "learning_progress": [
    { "subject_id": "uuid", "subject_name": "Matematika", "total_materials": 12, "completed_materials": 5, "progress_pct": 41.67 }
  ],
  "weekly_activity": [
    { "date": "2026-08-03", "materials": 2, "questions": 15, "minutes": 30 }
  ],
  "upcoming_exams": [
    { "exam_id": "uuid", "title": "Try Out ...", "subject_name": "UTBK", "scheduled_date": "ISO",
      "duration_minutes": 150, "status": "PUBLISHED" }
  ],
  "exam_stats": { "total_completed": 14, "average_score": 695.0, "highest_score": 720.0, "national_rank": 38 },
  "recent_activity": [
    { "type": "exam|material", "message": "string", "created_at": "ISO" }
  ]
}
```

> Widget yang TIDAK ada di payload ini (Target Comparison, Subject Mastery, Subject Progress
> berbasis soal, streak, tryout mingguan) → lihat **Section 16 `[KONTRAK BARU]`**.

### Referensi PAGE-WIRING
Halaman `/` siswa memanggil: `GET /dashboard/student` + `GET /notifications/unread-count`.

---

## 3. Master Academic (picker)

Semua GET = auth. `education_level` dipakai untuk filter pencarian (SD/SMP/SMA/GapYear).

| Method | Endpoint | Data |
|---|---|---|
| GET | `/academic/levels` | `[{id, name, code, display_order, is_active}]` |
| GET | `/academic/levels/:id` | `{...}` |
| GET | `/academic/grades?level_id=` | `[{id, education_level_id, level_code, name, alias, display_order, is_active}]` |
| GET | `/academic/grades/:id` | `{...}` |
| GET | `/academic/subjects?level_id=&grade_id=` | `[{id, name, code?, icon?, color?, display_order}]` |
| GET | `/academic/subjects/:id` | `{...}` |
| GET | `/academic/subjects/:id/chapters` | `[{id, curriculum_subject_id, name, description, display_order}]` |
| GET | `/academic/chapters` | `[...]` |
| GET | `/academic/chapters/:id` | `{...}` |
| GET | `/academic/topics?chapter_id=` | `[...]` |
| GET | `/academic/curriculums` | `[...]` |

---

## 4. Materi (Materials)

Prefix: `/materials`. Read und der grade siswa (auto-filter untuk SISWA tanpa `grade_id`).

| Method | Endpoint | Body/Query | Data |
|---|---|---|---|
| GET | `/materials` | `?subject_id=&grade_id=&page=&limit=` | paginated `[]MaterialFull` |
| GET | `/materials/:id` | — | `MaterialFull` (increment read_count) |
| GET | `/materials/progress` | `?page=&limit=` | paginated progress milik user |
| GET | `/materials/:id/progress` | — | `LearningProgress` (default 0 bila kosong) |
| POST | `/materials/:id/progress` | `{progress: number}` | `LearningProgress` (completed otomatis jika ≥100) |

`MaterialFull` mencakup: `{id, type, content_format, title, body, media_url?, estimated_duration?,
subject_id?, subject_name, grade_id?, is_preview, read_count, ...}`.

`LearningProgress`: `{id, student_id, material_id, progress_percent, last_position, completed,
completed_at?, updated_at}`.

---

## 5. Latihan (`/practice`)

Sesi latihan standalone, soal acak 1–50, umpan balik per soal.

| Method | Endpoint | Body/Query | Data |
|---|---|---|---|
| POST | `/practice/sessions/start` | `{subject_id, grade_id?, question_count}` (1–50) | `{session_id, questions:[{question_id, content, options:[{id,key,content}]}]}` |
| POST | `/practice/sessions/:id/answer` | `{question_id, selected_option_id}` | `{is_correct, correct_option_id, explanation}` |
| GET | `/practice/sessions` | `?page=&limit=` | paginated `[]SessionListItem` |
| GET | `/practice/sessions/:id` | owner | `SessionDetail` + `answers[]` |
| GET | `/practice/stats` | — | `{total_sessions, total_questions, total_correct, avg_score, accuracy_pct}` |

---

## 6. Latihan Ujian (`/exam-practice`)

Sesi berdasarkan materi/subject/tag; hasil dengan rincian per mapel. Prefer utk latihan pasca-materi.

| Method | Endpoint | Body | Data |
|---|---|---|---|
| POST | `/exam-practice/material/:materialId` | `{questions_count?}` default 10 | 201 `PracticeSession` |
| POST | `/exam-practice/subject` | `{subject_id?, grade_id?, questions_count?}` default 20 | 201 `PracticeSession` |
| POST | `/exam-practice/tags` | `{tag_filter, questions_count?}` | 201 `PracticeSession` |
| POST | `/exam-practice/:sessionId/submit` | `{answers:[ExamAnswer]}` | `PracticeSession` + `status=GRADED` + `subject_breakdown[]` |
| GET | `/exam-practice/:sessionId` | — | `PracticeSession` w/ results |

```json
// submit body.answers[]
{ "question_content_id": "uuid", "selected_options": ["uuid"], "text_answer": null }
// subject_breakdown[]
{ "subject_id": "uuid", "subject_name": "string", "questions_count": 3,
  "correct_count": 2, "total_score": 20, "max_score": 30, "percentage": 66.67 }
```

---

## 7. Ujian / Try Out (Exams + CBT Runtime)

### 7.1 Katalog & mulai attempt (`/exams`)

| Method | Endpoint | Query/Body | Data |
|---|---|---|---|
| GET | `/exams` | `?grade_id=&subject_id=&search=&status=&start_time=&end_time=&page=&limit=` | paginated `[]ExamFull` |
| GET | `/exams/:id` | — | `ExamFull` |
| POST | `/exams/:id/attempts/start` | — | 201 `ExamAttempt` |
| POST | `/exams/:id/attempts/start-with-blueprints` | — | 201 `ExamAttempt` |
| POST | `/exams/:id/attempts/start-tag-based` | `{tag_filter, total_questions}` | 201 `ExamAttempt` |
| GET | `/exams/attempts/:attemptId` | owner | `ExamAttempt` |
| POST | `/exams/attempts/:attemptId/submit` | `{answers:[ExamAnswer]}` | `{message}` (grade ulang server-side) |
| POST | `/exams/attempts/:attemptId/grade` | owner | `{message}` (hanya status SUBMITTED) |

`ExamAttempt`: `{id, exam_content_id, user_id, attempt_number, status, started_at, submitted_at?,
graded_at?, total_score?, max_score?, time_spent_seconds?, created_at}`.

Error: 403 bukan peserta; 409 `MAX_ATTEMPTS_REACHED`.

### 7.2 Runner CBT (`/cbt`) — sesi interaktif

| Method | Endpoint | Body | Data |
|---|---|---|---|
| POST | `/cbt/:exam_id/start` | — | 201 `ExamSession {id, exam_id, user_id, status:"ACTIVE", started_at, remaining_seconds, violation_score, is_terminated}` |
| GET | `/cbt/sessions` | — | `[{id, exam_content_id, status, score?, started_at}]` |
| POST | `/cbt/:session_id/sync` | `{answers:[{exam_question_id, selected_option_ids?:[], selected_option_id?:string, is_doubtful}]}` | `{message}` |
| POST | `/cbt/:session_id/navigate` | `{exam_question_id, is_current}` | `{message}` |
| POST | `/cbt/:session_id/pause` | `{remaining_seconds}` | `{message}` |
| POST | `/cbt/:session_id/resume` | — | `{message}` |
| POST | `/cbt/:session_id/finish` | — | `Result` (score: `(correct − wrong×negative)/total × 100`, min 0) |
| POST | `/cbt/:session_id/violation` | `{violation_type, details?}` | `ExamSession` (+ violation_score) |
| GET | `/cbt/:session_id/answers` | owner | `[]ExamAnswer` |
| GET | `/cbt/:session_id/questions` | owner | `[]SessionQuestion` |
| GET | `/cbt/:session_id/review` | owner | `SessionReview` |

```json
// violation_type (enum)
"FULLSCREEN_EXIT" | "TAB_SWITCH" | "KEYBOARD_SHORTCUT" | "DEVTOOLS_OPEN" |
"COPY_ATTEMPT" | "MULTIPLE_IP" | "SUSPICIOUS_ACTIVITY"
```

`SessionQuestion`: `{exam_question_id, question_content_id, display_order, subjectName, stimulus, stem,
questionType, difficulty, options:[{id, label, text}]}`.

`SessionReview`: `{session_id, exam_id, exam_title, user_id, total_questions, correct_count, wrong_count,
unanswered_count, score, passing_grade, is_passed, duration_seconds,
questions:[{exam_question_id, display_order, question, question_type, difficulty, content,
correct_option, selected_option_id?, is_correct?, explanation?}], created_at}`.

> WebSocket live sync: `WS /ws/exam/:session_id` (JWT, owner).

---

## 8. Hasil / Scoring (`/results`)

| Method | Endpoint | Data |
|---|---|---|
| GET | `/results` | paginated `[]Result` (`?page=&limit=`) |
| GET | `/results/:session_id` | `Result` (403 bila bukan owner) |

```json
// Result
{ "id": "uuid", "session_id": "uuid", "exam_id": "uuid", "user_id": "uuid",
  "total_questions": 100, "answered_count": 92, "correct_count": 70, "wrong_count": 22,
  "unanswered_count": 8, "score": 700.0, "passing_grade": 600.0, "is_passed": true,
  "duration_seconds": 5400, "created_at": "ISO",
  "subject_breakdown": [
    { "subject_id": "uuid", "subject_name": "Matematika", "questions_count": 30,
      "correct_count": 20, "total_score": 2000, "max_score": 3000, "percentage": 66.67 }
  ] }
```

> Widget **analisis mapel kuat/lemah page dashboard** dibuat agregat dari `/results` semua sesi
> → `subject_breakdown` (lihat `[KONTRAK BARU]` `/dashboard/student/subject-mastery`).

---

## 9. Peringkat (`/leaderboard`)

| Method | Endpoint | Query | Data |
|---|---|---|---|
| GET | `/leaderboard` | `?package_id=<uuid>&month=YYYY-MM&limit=1–100` | `[]RankingRow` |

```json
// RankingRow
{ "rank": 3, "user_id": "uuid", "full_name": "string", "school_name": "string",
  "subject_scores": { "subject_id": 720.0 }, "total": 720.0, "average": 720.0 }
```

---

## 10. Analitik siswa (`/analytics`) — read

| Method | Endpoint | Data |
|---|---|---|
| GET | `/analytics/exams/:id` | `ExamAnalyticsDetail` (participants, average/high/low, pass_rate, `question_breakdown[]`) |
| GET | `/analytics/students/:id` | `StudentAnalytics` (own id) |
| GET | `/analytics/students/:id/timeline` | `[]ProgressEntry` |
| GET | `/analytics/exams/:id/difficulty` | `{easy:{count,avg_score}, medium:{...}, hard:{...}}` |
| GET | `/analytics/leaderboard/subject/:subject_id` | `[]LeaderboardEntry {user_id, full_name, avg_score, total_exams, rank}` |

---

## 11. Profil / Target / Sertifikat (`/profile`)

| Method | Endpoint | Body | Data |
|---|---|---|---|
| GET | `/profile/targets` | — | `[]EnrichedTarget` |
| PUT | `/profile/targets` | `{targets:[{choice:1|2, target_school_id, school_name, major?, passing_score_irt?}]}` | `[]EnrichedTarget` (upsert) |
| GET | `/profile/certificates` | — | `[]Certificate {id,title,exam_id,score,max_score,percent,rank,total,date}` |
| GET | `/profile/certificates/:id/download` | — | HTML certificate (inline) |

```json
// EnrichedTarget (selected items terkait dashboard)
{ "id": "uuid", "choice": 1, "target_type": "string", "target_school_id": "uuid|null",
  "school_name": "string", "major": "string|null", "passing_score_irt": 720,
  "min_score": 700, "max_total_score": 760, "subjects": [],
  "student_score": 695, "progress_pct": 84.9, "has_score_data": true, "threshold_state": "BELOW" }
```

> **Catatan integrasi:** `GET /target-schools/:id` saat ini ber-gate role `write`; siswa harus pakai
> `/profile/targets` (yang resolve school internal) untuk membaca data sekolah target. `/target-schools`
> (list) tersedia untuk semua JWT.

---

## 12. Notifikasi

| Method | Endpoint | Auth | Data |
|---|---|---|---|
| GET | `/notifications` | JWT | paginated `[]Notification` |
| GET | `/notifications/unread-count` | JWT | `{count}` |
| GET | `/notifications/preferences` | JWT | `[]NotificationPreference` |
| PUT | `/notifications/preferences/:channel` | JWT | toggle channel |
| GET | `/notifications/:id` | owner | `Notification` |
| POST | `/notifications/:id/read` | owner | ack |
| POST | `/notifications/:id/archive` | owner | ack |
| POST | `/notifications/read-all` | JWT | ack |
| DELETE | `/notifications/:id` | owner | ack |

Channel: `EMAIL | PUSH | SMS | WHATSAPP | IN_APP | EXAM | PAYMENT | LEARNING | AI | SYSTEM`.

---

## 13. AI Tutor (`/ai`)

| Method | Endpoint | Body | Data |
|---|---|---|---|
| POST | `/ai/tutor/chat` | `{message}` (butuh `AI_API_KEY` server) | AI reply |
| POST | `/ai/tutor/conversations` | — | conversation baru |
| GET | `/ai/tutor/conversations/:id` | owner | list messages |
| DELETE | `/ai/tutor/conversations/:id` | owner | ack |

---

## 14. Paket & Media (read)

| Method | Endpoint | Data |
|---|---|---|
| GET | `/exam-packages?education_level=` | `[]ExamPackage {id, code, name, education_level, grade_id?}` |
| GET | `/exam-packages/:id/exams` | `[{exam_content_id, subject_name, display_order}]` |
| GET | `/media/entity/:type/:id` | file (publik) |
| GET | `/media/:id` | file (publik) |

---

## 15. `[KONTRAK BARU]` — DRAFT (belum rilis, dibuat menyusul)

> **Semua endpoint bawah ini BELUM ADA** di backend. Status `DRAFT`.
> Frontend/mockup presentasi membangun dari skema ini. Selesai & disetujui user → IMPLEMENT ke
> backend (`internal/dashboard`) + tambahkan ke `openapi.yaml`. Setiap perubahan → naikkan versi di bawah.

### 15.0 Konvensi khusus
- Semua: `GET`, auth JWT, role SISWA.
- Threshold & band-config yang dipakai widget dibaca dari `GET /config/student-dashboard`.
- Skema warna (band % diterima): `≤70` MERAH, `70.1–95` KUNING/AMBER, `95.1–100` HIJAU.

### 15.1 `GET /dashboard/student/target`

Perbandingan — skor tryout khusus siswa vs **nilai terendah seleksi** + **kuota** (masukan admin/staff di `/staff/target-schools`).

```json
{
  "has_target": true,
  "school_name": "Universitas Melati",
  "major": "Teknik Informatika",
  "academic_year": "2026",
  "seat_quota": 120,
  "passing_score_lowest": 721,
  "student_score": 696,
  "score_gap": -25,
  "chance_pct": 96.0,
  "verdict": "SAFE|NEAR|CRITICAL"
}
```
> `score_gap = student_score − passing_score_lowest`; `chance_pct` dihitung server-side
> (default: `min(100, student_score / passing_score_lowest × 100)`), `verdict` dari band.

### 15.2 `GET /dashboard/student/subject-mastery`

Agregat **semua soal** pada seluruh attempt ujian + latihan, per mapel.

```json
{
  "config": { "strong_threshold": 70 },
  "subjects": [
    { "subject_id": "uuid", "subject_name": "Matematika", "total_questions": 320,
      "correct_count": 250, "accuracy_pct": 78.13, "level": "strong|weak" }
  ]
}
```

### 15.3 `GET /dashboard/student/subject-progress`

Progress per mapel **berbasis soal** (target = jumlah jawaban benar, default 50).

```json
{
  "config": { "correct_target": 50 },
  "subjects": [
    { "subject_id": "uuid", "subject_name": "Fisika",
      "correct_target": 50, "correct_count": 19, "progress_pct": 38.0 }
  ]
}
```

### 15.4 `GET /dashboard/student/weekly-exam`

Try out khusus mingguan (acuan ranking & target) — satu kartu terdekat.

```json
{
  "exam_id": "uuid", "title": "Try Out Khusus #7", "subject_name": "UTBK",
  "scheduled_start": "ISO", "scheduled_end": "ISO", "duration_minutes": 150,
  "total_questions": 120, "is_ranking_basis": true
}
```

### 15.5 `GET /dashboard/student/streak`

```json
{ "current_streak": 5, "longest_streak": 12 }
```

### 15.6 `GET /config/student-dashboard` (SISWA) / `PUT` (STAFF/ADMIN)

```json
{
  "strong_subject_threshold": 70,
  "correct_progress_target": 50,
  "color_bands": [
    { "min": 0, "max": 70,   "label": "CRITICAL" },
    { "min": 70.1, "max": 95, "label": "GUARD" },
    { "min": 95.1, "max": 100, "label": "SAFE" }
  ]
}
```

### 15.7 Penanda flag di administrasi
- `ALTER TABLE cbt.exam ADD COLUMN is_weekly_rank_basis boolean DEFAULT false` (Sprint?)
- Form admin/staff menandai tryout pekanan; lihat wireframe `01-siswa-dashboard.md`.

### 15.8 Latihan hierarki & runner (`/practice`) — wireframe `03-siswa-latihan.md`

Latihan pengganti alur lama `/practice` (start-acak + jawaban per-soal). Katalog & runner dihitung
dari hierarki kurikulum; penguasaan berbasis skor ≥ threshold (default 85). Jawaban **hanya
dikirim saat submit** (tidak ada `answer` per-soal).

| # | Method | Endpoint | Body/Query | Data |
|---|---|---|---|---|
| 1 | GET | `/practice/catalog` | — | `{config:{threshold:85}, subjects:[{subject_id,name,icon,color,progress_pct,status,chapters:[{chapter_id,title,progress_pct,status,topics:[{topic_id,title,progress_pct,status,question_count}]}]}]}` |
| 2 | POST | `/practice/start` | `{level:"SUBJECT\|CHAPTER\|TOPIC", subject_id?, chapter_id?, topic_id?}` | 201 `{session_id}` |
| 3 | GET | `/practice/sessions/:sessionId` | owner | `{session_id, scope, questions:[{question_id, content, options:[{id,key,content}]}]}` (tanpa timer) |
| 4 | POST | `/practice/sessions/:sessionId/submit` | `{answers:[{question_id, selected_option_id}]}` | `{session_id, correct, wrong, unanswered, accuracy_pct, duration_seconds, passed}` |
| 5 | GET | `/practice/sessions/:sessionId/result` | owner | statistik detail |
| 6 | GET | `/practice/sessions/:sessionId/review` | owner | `{questions:[{number,content,options:[{key,text,is_correct}],selected_key?,is_correct,explanation}]}` |
| 7 | PUT | `/config/student-dashboard` (extend) | tambah `practice_master_threshold` (default 85) | ack |
| 8 | GET | `/practice/sessions` (extend) | `?page=&limit=` | item + `practice_scope`, `duration_seconds`, `accuracy_pct` |

> Aturan hijau recursive: topik `≥ threshold` → hijau; bab hijau bila semua topik hijau **ATAU**
> `pct(bab) ≥ threshold`; mapel hijau bila **semua bab** hijau. `passed = accuracy_pct ≥ threshold`.

### 15.9 Katalog & widget ujian (paket) — wireframe `04-siswa-ujian.md`

Runner/hasil/pembahasan memakai endpoint existing (`/cbt`, `/results`, `/exams/:id/attempts/start`).
Ekstensi di bawah hanya untuk **katalog paket + widget summary**.

| # | Method | Endpoint | Body/Query | Data |
|---|---|---|---|---|
| 1 | GET | `/exam-packages` (extend) | `?education_level=` | `ExamPackage` + `max_attempts`, `attempts_used`, `subjects_count`, `total_questions`, `duration_minutes`, `status`, `last_score?` |
| 2 | GET | `/exams/summary` | — | `{last_score:{package_name, score, passing_score, above_passing}, avg_score, total_taken}` |
| 3 | GET | `/exam-packages/:id` (extend) | — | `{...ExamPackage, subjects:[{exam_content_id, subject_name, display_order}], package_mode}` |
| 4 | POST | `/exams/:packageId/sessions/start` (opsional) | — | 201 `{session_id}` (mode SINGLE: satu runner utk seluruh sub-test) |
| 5 | — | enum `ExamCategory` (extend) | — | tambah `CAT_PNS` |

> `package_mode` = `SINGLE` (satu sesi seluruh sub-test) | `PER_SUBTEST` (mulai terpisah).

### 15.10 Hasil & Analisis belajar lengkap — wireframe `05-siswa-hasil.md`

Halaman **detail** dari widget dashboard. Sebagian besar data memakai endpoint existing
(`/analytics/students/:id`, `/practice/stats`, `/materials/progress`, `/results`,
`/config/student-dashboard`). Satu endpoint agregat diusulkan untuk memadatkan statistik
status/saran per mapel (dapat juga dikomposisi di client).

| # | Method | Endpoint | Body/Query | Data |
|---|---|---|---|---|
| 1 | GET | `/results/analytics` (usulan) | — | `{ summary:{accuracy_total, mastered_count, subject_total, material_completed, material_total, exam_taken}, subjects:[{subject_id, subject_name, status:"MASTERED\|GUARD\|WEAK", accuracy_pct_ujian, accuracy_pct_latihan, material_pct, exam_avg, exam_count, weakest_topic:{topic_id, name, accuracy}, recommended:[{topic_id, name, reason, action}]}] }` |
| 2 | GET | `/practice/catalog` (extend, §15.8) | `?subject_id=` | status bab/topic → dipakai drill `/results/subjects/:subjectId` |
| 3 | GET | `/analytics/students/:id` (existing) | — | akurasi ujian per mapel + total (digunakan langsung) |
| 4 | GET | `/practice/stats` (existing) | — | `{total_sessions, total_questions, total_correct, avg_score, accuracy_pct}` (latihan) |

> `status` band: `≥ strong_subject_threshold` (default 70) = `MASTERED`; `70.1–84.9` = `GUARD`;
> `≤ 70` = `WEAK`. Threshold dari `GET /config/student-dashboard` (§15.6).

### 15.11 Peringkat / Leaderboard — wireframe `06-siswa-peringkat.md`

Mode existing (`GET /leaderboard`) tetap dipakai (per paket). Tambahan untuk mode
**rata-rata multi-ujian** dan **filter per mapel**.

| # | Method | Endpoint | Body/Query | Data |
|---|---|---|---|---|
| 1 | GET | `/leaderboard` (existing) | `?package_id=&month=YYYY-MM&limit=` | `[]RankingRow {rank, user_id, full_name, school_name, subject_scores{subject_id: score}, total, average}` |
| 2 | GET | `/leaderboard/aggregate` (BARU) | `?package_ids=a,b&month=&limit=` | `[]RankingRow` agregat: `total = AVG(score)` seluruh paket, `average` = rata-rata, `subject_scores` di-`AVG` per mapel |
| 3 | GET | `/leaderboard` (extend) | tambah `subject_id=` | filter ranking hanya pada satu mapel (`subject_scores[subject_id]`) → sub-rute `/ranking/subjects/:subjectId` |
| 4 | GET | `/leaderboard/me` (opsional) | `?package_id=&month=&package_ids=` | `{rank, total_siswa, delta_rank}` untuk kartu "Posisi Saya" |

> Backend saat ini hanya `GetLeaderboard(package_id, month, limit)` (`internal/ranking`). Mode
> rata-rata (`/leaderboard/aggregate`) & filter mapel & `/leaderboard/me` = `[KONTRAK BARU]`.
> Fallback frontend tanpa backend baru: komposisi client (fetch beberapa paket, rata-rata lokal).

### 15.12 Target Sekolah — wireframe `07-siswa-target.md`

Halaman **Target Sekolah** (`/targets`): katalog sekolah tujuan (SMP/SMA/UNIVERSITY sesuai
jenjang siswa **+1 tingkat**: SD→SMP, SMP→SMA, SMA→UNIVERSITY), filter provinsi/kabupaten/kota,
perbandingan **nilai siswa vs nilai masuk** (Gap & peluang), dan **CRUD target** (max 2 slot:
pilihan 1 & 2). Reuse endpoint existing (`GET /target-schools`, `GET/PUT /profile/targets`);
tambahan sketched di bawah.

| # | Method | Endpoint | Body/Query | Data |
|---|---|---|---|---|
| 1 | GET | `/target-schools` (existing) | `?level=` | `[]TargetSchool {id, name, level, min_score, max_score, max_total_score, subjects, academic_year}` |
| 2 | GET | `/target-schools` (extend) | tambah `?province=&city=&q=` | sama + field `province`, `city`, `district`, `academic_year` per item (dari join `academic.school`) |
| 3 | GET | `/targets/catalog` (usulan) | `?level=&province=&city=&q=` | `[{school_id, name, level, province, city, min_score, max_score, academic_year, subjects, student_score, has_score_data, gap, chance_pct, status:"PASSED\|BELOW\|PENDING"}]` — perbandingan & peluang dihitung **server-side** |
| 4 | GET | `/profile/targets` (existing) | — | `[]EnrichedTarget {id, choice:1\|2, school_name, major, min_score, max_total_score, subjects, student_score, progress_pct, has_score_data, threshold_state, motivational}` |
| 5 | PUT | `/profile/targets` (existing) | `{targets:[{choice:1\|2, target_school_id, school_name, major?, passing_score_irt?}]}` | upsert → `[]EnrichedTarget` |
| 6 | DELETE | `/profile/targets/:choice` (usulan) | `1\|2` | hapus target pilihan tsb → ack |

> Identitas level: `target_school.Level` (`SMP|SMA|UNIVERSITY`). `academic.target_school` punya FK
> `school_id → academic.school` (opsional) — bila terisi, lokasi dibaca dari `academic.school`
> (`province`, `city`, `district`). Bila kosong, definisikan region kosong di katalog
> (`[KONTRAK BARU]`).
> `chance_pct` & `status` fallback client: `chance_pct = min(100, student_score / max(min_score,1) × 100)`;
> `PASSED` bila `student_score ≥ min_score`.

### 15.13 Membership Siswa — wireframe `08-siswa-membership.md`

Halaman **Membership** (`/membership`): status keanggotaan (paket/level/sisa hari/auto-renew),
katalog paket **Basic → Premium → Pro → Enterprise** (harga & fitur), alur **perpanjang (renew)** dan
**upgrade level**, serta pembuatan order/invoice.

> Endpoint `/subscriptions/*` di backend **admin-only** (SUPER_ADMIN/STAFF/FINANCE/INVESTOR) — tidak
> dipakai siswa. Namespace baru untuk siswa: `/membership/*` di bawah ini `[KONTRAK BARU]`.

| # | Method | Endpoint | Body/Query | Data |
|---|---|---|---|---|
| 1 | GET | `/membership/me` | — | `{ has_membership, plan:{id, name, level, price, duration_days, features[]}, status:"ACTIVE\|TRIAL\|INACTIVE\|EXPIRED\|CANCELLED", active_from, expired_at, remaining_day, auto_renew, is_trial, limits_used:[{feature_name, used?, max?}] }` |
| 2 | GET | `/membership/plans` | — | `[{id, name, level, package_type, price, discount_price, duration_days, features:[{name, is_unlimited, value}], is_featured, is_active, sort_order}]` (hanya `is_active = true`) |
| 3 | POST | `/membership/orders` | `{plan_id, duration, method?}` | 201 `{invoice_id, invoice_number, subtotal, discount, total, status:"UNPAID\|PENDING", payment_methods[]}` — order baru (renew/upgrade) |
| 4 | PATCH | `/membership/me/auto-renew` | `{auto_renew:boolean}` | ack |
| 5 | GET | `/membership/orders` (opsional) | `?page=&limit=` | riwayat invoice: `[{invoice_number, plan_name, total, status, issued_at, paid_at}]` |
| 6 | GET | `/exam-packages` (existing §14) | `?education_level=` | hanya untuk blok katalog tryout bila halaman menyertainya |

> **Sumber:** `finance.membership_package`, `finance.package_feature`, `finance.user_membership`,
> `finance.subscription`, `finance.invoice`. **Level order:** `basic < premium < pro < enterprise`
> (dijamin backend; frontend pakai `sort_order`). **Pro-rate upgrade** opsional (v1: paket baru aktif
> saat bayar, paket lama nonaktif).

---

### 15.14 Konfigurasi Siswa — wireframe `09-siswa-konfigurasi.md`

Halaman **Konfigurasi** (`/settings`): profil lengkap yang bisa diedit siswa — **username/nama**,
**sekolah asal**, **foto profil** (upload avatar), **ganti kata sandi**, **jenjang** & **kelas**
(opsional), **nomor HP** (opsional), plus kartu Target & Preferensi.

> **Batasan backend saat ini (`auth.go`):** `restrictGradeSchoolForRole` menghapus `grade_id` &
> `school_name` untuk role non `SUPER_ADMIN/STAFF/GURU` → siswa **belum bisa** ubah jenjang/sekolah
> lewat `PUT /auth/profile`. Diangkat di sini sebagai `[KONTRAK BARU]` (ubah policy / via enrollment).

| # | Method | Endpoint | Body/Query | Data |
|---|---|---|---|---|
| 1 | GET | `/auth/me` (existing §2) | — | profil user: `full_name`, `email`, `role`, `avatar_url`, `grade_id`, `school_name`, `phone` (jenjang/kelas via enrollment) |
| 2 | PUT | `/auth/profile` (extend) | `{full_name?, school_name?, grade_id?, education_level?, phone?, avatar_url?, gender?, major?}` | ack user — **hapus strip `grade_id`/`school_name` untuk SISWA**; buat/update `academic.student_enrollment` bila grade berubah |
| 3 | POST | `/auth/change-password` (existing §2) | `{current_password, new_password}` | ack — verifikasi sandi lama; frontend harus kirim `current_password` (bukan `old_password`) |
| 4 | GET | `/academic/levels` (existing §4) | — | daftar jenjang (picker) |
| 5 | GET | `/academic/grades?level_id=` (existing §4) | `?level_id=` | daftar kelas per jenjang (picker) |
| 6 | POST | `/media/upload` (extend) | multipart, hanya avatar | `{url}` — izinkan role SISWA, batasi jpg/png ≤ 2 MB |

> **Sumber:** `identity.user`, `identity.user_profile`, `academic.education_level`, `academic.grade`,
> `academic.student_enrollment`, `media.*`, `identity.user_profile.avatar_url`.
> **Catatan:** `username` terpisah dari email = field baru opsional `[KONTRAK BARU]`; v1 cukup
> `full_name` sebagai nama tampilan.

---

## 16. Mapping Endpoint → Tabel Sumber (ikhtisar)

| Endpoint | Tabel utama |
|---|---|
| `/dashboard/student` | `identity.user`, `identity.user_profile`, `content.learning_progress`, `content.material`, `academic.subject`, `academic.student_enrollment`, `cbt.exam*`, `cbt.grading_result`, `ranking.user_rank_summary` |
| `/dashboard/student/*` (BARU) | `academic.target_school`, `identity.student_target`, `cbt.grading_detail`, `question.question`, `cbt.exam`, `analytics.analytics_events` |
| `/materials*` | `content.material`, `content.material_subject`, `content.learning_progress` |
| `/practice*` | `content.practice_session`, `question.question`, `question.question_option` |
| `/exam-practice*` | `content.practice_session`, `question.question`, `cbt.attempt_question`, `cbt.attempt_option` |
| `/exams`, `/cbt` | `cbt.exam`, `cbt.exam_metadata`, `cbt.exam_schedule`, `cbt.exam_attempt`, `cbt.attempt_question`, `cbt.attempt_option`, `cbt.student_answer`, `cbt.grading_result`, `cbt.grading_detail`, `cbt.exam_timer`, `cbt.cheating_log` |
| `/results` | `cbt.exam_attempt`, `cbt.grading_result`, `cbt.grading_detail`, `question.question`, `academic.subject` |
| `/leaderboard` | `ranking.leaderboard_entry`, `ranking.subject_ranking`, `cbt.exam_attempt`, `cbt.grading_result` |
| `/target-schools` | `academic.target_school`, `academic.school` (join region) |
| `/targets/catalog` (BARU) | `academic.target_school`, `academic.school`, `identity.student_target`, `cbt.grading_detail`, `academic.subject` |
| `/membership/*` (BARU) | `finance.membership_package`, `finance.package_feature`, `finance.user_membership`, `finance.subscription`, `finance.invoice` |
| `/auth/profile`, `/auth/change-password`, `/media/upload` (extend) | `identity.user`, `identity.user_profile`, `academic.student_enrollment`, `academic.grade`, `academic.education_level`, `media.*` |
| `/profile/certificates` | `cbt.exam`, `cbt.grading_result`, `ranking.*` |
| `/notifications` | `notification.*` (dari `identity`, `user_notification`) |
| `/ai/*` | `ai.*` (conversation) |

### Catatan alias / disparitas dengan `docs/frontend/API-contract.md`
- Prefix sebenarnya di kode: **`/materials`**, **`/leaderboard`** (bukan `/material`, `/ranking/leaderboard`).
- Dokumen ini mengikuti path **backend aktual** (main.go); jika `/material`, `/ranking/...` dipakai
  sebagai alias, cek/daftarkan di sini sebelum implementasi.

---

## 17. Revisi

| Versi | Tanggal | Perubahan |
|---|---|---|
| v1.0 | 2026-08-09 | Dokumen master kontrak API siswa; 5 kontrak baru DRAFT (`target`, `subject-mastery`, `subject-progress`, `weekly-exam`, `streak`) + `config` |
| v1.1 | 2026-08-09 | Tambah §15.8 DRAFT: katalog/runner/result/review latihan hierarki + extend `practice_master_threshold` |
| v1.2 | 2026-08-09 | Tambah §15.9 DRAFT: katalog paket ujian + widget summary + `package_mode` + `CAT_PNS` |
| v1.3 | 2026-08-09 | Tambah §15.10 DRAFT: analisis hasil belajar lengkap (`/results/analytics` usulan, reuse `/analytics`, `/practice/stats`, `/materials/progress`, `/practice/catalog`) |
| v1.4 | 2026-08-09 | Tambah §15.11 DRAFT: peringkat 2 mode (nilai terbaik per paket — existing, rata-rata multi ujian via `/leaderboard/aggregate`) + filter mapel + `/leaderboard/me` |
| v1.5 | 2026-08-09 | Tambah §15.12 DRAFT: Target Sekolah — extend `/target-schools` (filter `province`/`city`/`q` + field region), usulan `GET /targets/catalog` (perbandingan & peluang server-side), reuse `GET/PUT /profile/targets`, usulan `DELETE /profile/targets/:choice` |
| v1.6 | 2026-08-09 | Tambah §15.13 DRAFT: Membership Siswa — namespace `/membership/*` (me, plans, orders, auto-renew, orders history) `[KONTRAK BARU]`, sumber `finance.*`, catatan `/subscriptions/*` admin-only |
| v1.7 | 2026-08-09 | Tambah §15.14 DRAFT: Konfigurasi Siswa (`/settings`) — extend `PUT /auth/profile` (hapus strip `grade_id`/`school_name` utk SISWA + enrollment), koreksi body `change-password` ke `current_password`, extend `POST /media/upload` (role SISWA, avatar), reuse `/academic/levels` + `/academic/grades` |

### Cara menambah kontrak baru
1. Tambahkan baris di tabel bagian sesuai (dengan kolom `Status`).
2. Jika masuk kategori baru `[KONTRAK BARU]`, buat sub-bagian di **Section 15** dengan skema JSON.
3. Bump `Versi` & catat di tabel Revisi.
4. Bila kontrak sudah disetujui backend → ubah `DRAFT` → `ACTIVE` dan beri tanggal.