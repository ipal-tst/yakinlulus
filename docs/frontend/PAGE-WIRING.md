# Frontend Page Wiring

Maps every page/route of the frontend to the backend endpoints it consumes, per role.
Base path: `/api/v1`. Auth guard: `SISWA` students and `GURU`/`STAFF`/`SUPER_ADMIN`
are routed to their own app shells after login.

> **Design system:** implement all pages with the components, colors, typography, spacing,
> and motion tokens in `design.md` (Design System YakinLulus.id v1.0). Stack: Next.js 16 +
> React 19 + Tailwind CSS v4 + shadcn/ui.

The same auth hooks apply to every shell: store the Bearer token from `/auth/login`,
refresh via `/auth/refresh` before expiry, attach to every request.

---

## 1. SISWA (Student)

**Top nav:** Belajar (Materials) · Latihan (Practice) · Ujian (Exams) · Hasil (Results) ·
Peringkat (Ranking) · Target · Membership · Konfigurasi

| Page | Frontend route | Purpose | Backend endpoints |
|---|---|---|---|
| Login / Register | `/login`, `/register` | auth | `POST /auth/login`, `POST /auth/register` |
| Home (student) | `/siswa` | overview | `GET /dashboard/student`, `GET /notifications` |
| Material list (katalog mapel) | `/materials` | browse subjects + non-mapel (tips/video/audio) | `GET /materials/catalog` `[BARU]`, `GET /academic/subjects`, `GET /academic/grades` |
| Subject chapters (daftar bab) | `/materials/:subjectId` | progress per bab & ujian bab | `GET /materials/:subjectId/chapters` `[BARU]` |
| Chapter detail (Topik → CP/KD) | `/materials/:subjectId/:chapterId` | read lesson (teks/rumus/grafik/video), track progress | `GET /materials/:subjectId/:chapterId` `[BARU]`, `POST /materials/:id/progress` |
| Practice list (Mapel→Bab→Topik) | `/practice` | daftar latihan + riwayat, indikator hijau ≥85% | `GET /practice/catalog` `[BARU]`, `GET /practice/sessions`, `GET /config/student-dashboard` |
| Practice runner (full main, no timer) | `/practice/:sessionId` | kerjakan soal (navigasi + flag ragu-ragu) | `GET /practice/sessions/:sessionId` `[BARU]`, `POST /practice/start` `[BARU]`, `POST /practice/sessions/:sessionId/submit` `[BARU]` |
| Practice result | `/practice/:sessionId/result` | statistik detik + skor | `GET /practice/sessions/:sessionId/result` `[BARU]` |
| Practice review | `/practice/:sessionId/review` | pembahasan vertikal (soal→opsi→pembahasan) | `GET /practice/sessions/:sessionId/review` `[BARU]` |
| Exam list (paket ujian) | `/exams` | katalog paket (1-attempt & repeatable) + widget (nilai terakhir, rata-rata) | `GET /exam-packages`, `GET /exams/summary` `[BARU]` |
| Exam package detail | `/exams/:packageId` | detail paket + daftar sub-test (multi mapel) | `GET /exam-packages/:id/exams` |
| Exam instructions | `/exams/:packageId/instructions` | petunjuk (Setuju/Tidak) | `POST /exams/:id/attempts/start` |
| Exam runner (full-screen, timer) | `/exams/run/:sessionId` | attempt CBT (tanpa AppShell) | `GET /cbt/:session_id/questions`, `POST /cbt/:session_id/sync`, `POST /cbt/:session_id/finish` |
| Exam result | `/exams/run/:sessionId/result` | nilai + statistik (detik) | `GET /results/:session_id` |
| Exam review | `/exams/run/:sessionId/review` | pembahasan | `GET /cbt/:session_id/review` |
| Exam-practice start | `/exam-practice` | material/subject practice | `POST /exam-practice/material/:materialId`, `POST /exam-practice/subject` |
| Exam-practice session | `/exam-practice/:sessionId` | run + submit | `POST /exam-practice/:sessionId/submit`, `GET /exam-practice/:sessionId` |
| Results (analisis belajar) | `/results` | analisis hasil lengkap (materi+latihan+ujian), chart, status mapel, saran penguatan | `GET /results/analytics` `[BARU]`, `GET /analytics/students/:id`, `GET /practice/stats`, `GET /materials/progress`, `GET /config/student-dashboard` |
| Subject analysis | `/results/subjects/:subjectId` | detail satu mapel: materi/bab/topic mastery + rekomendasi | `GET /practice/catalog` `[BARU]`, `GET /results` |
| Result detail (ujian) | `/results/:id` | skor & subtest ujian | `GET /results/:session_id` |
| Ranking (per paket / rata-rata) | `/ranking` | leaderboard seluruh siswa: mode nilai terbaik 1-attempt & rata-rata multi ujian + podium + tabel | `GET /leaderboard`, `GET /leaderboard/aggregate` `[BARU]`, `GET /exam-packages` |
| Subject ranking | `/ranking/subjects/:subjectId` | ranking per mapel | `GET /leaderboard?subject_id=` `[BARU]` |
| My targets | `/targets` | target schools (jenjang otomatis, filter provinsi/kabupaten, banding skor vs nilai masuk, panel target max 2 slot) | `GET /target-schools`, `GET /target-schools?level=` (extend `province`/`city` `[BARU]`), `GET /targets/catalog` `[BARU]`, `GET /profile/targets`, `PUT /profile/targets` |
| Membership | `/membership` | status keanggotaan (paket/level/sisa hari), katalog paket Basic→Enterprise, perpanjang (renew) & upgrade, buat order | `GET /membership/me` `[BARU]`, `GET /membership/plans` `[BARU]`, `POST /membership/orders` `[BARU]`, `PATCH /membership/me/auto-renew` `[BARU]`, `GET /membership/orders` `[BARU]` |
| Konfigurasi | `/settings` | profil lengkap editable (username, sekolah, foto profil, ganti sandi, jenjang, kelas opsional, no HP opsional) + kartu Target & Preferensi | `GET /auth/me` (existing), `PUT /auth/profile` (extend `school_name`/`grade_id`/`education_level` `[BARU]`), `POST /auth/change-password` (existing; body `current_password`), `GET /academic/levels` (existing), `GET /academic/grades?level_id=` (existing), `POST /media/upload` (extend role SISWA `[BARU]`) |
| Profile | `/profile` | account | `GET /auth/me`, `PUT /auth/profile`, `POST /auth/change-password` |

**Student loop:** Materials → Practice/Exam-Practice → Exam (CBT) → Results → Ranking.

---

## 2. GURU (Teacher)

**Top nav:** Beranda · Bank Soal · Materi · Kelola Ujian · Media · Sekolah (read) · CMS

| Page | Frontend route | Backend endpoints |
|---|---|---|
| Teacher dashboard | `/guru` | `GET /dashboard/teacher` |
| Question bank | `/guru/questions` | `GET /questions`, `POST /questions`, `GET /questions/:id`, `PUT /questions/:id`, `DELETE /questions/:id`, `POST /questions/:id/publish` |
| Question import | `/guru/questions/import` | `POST /questions/import` (multipart), `GET /questions/export` |
| Material authoring | `/guru/materials` | `GET /material`, `POST /material`, `PUT /material/:id`, `PATCH /material/:id/publish` |
| Exam authoring | `/guru/exams` | `GET /exams`, `POST /exams`, `PUT /exams/:id`, `POST /exams/:id/questions`, `POST /exams/:id/blueprint`, `POST /exams/:id/subject-blueprints` |
| Exam grading | `/guru/exams/:id/grade` | `POST /exams/attempts/:attemptId/grade`, `GET /exams/:id/analytics` |
| Media | `/guru/media` | `GET /media`, `POST /media/upload`, `DELETE /media/:id` |
| School (read) | `/guru/schools` | `GET /school`, `GET /school/:id` |
| Academic master (read) | `/guru/academic` | `GET /academic/levels`, `GET /academic/grades`, `GET /academic/subjects`, `GET /academic/chapters`, `GET /academic/topics` |
| CMS authoring | `/guru/cms` | `POST /cms/pages`, `PUT /cms/pages/:id`, `POST /cms/pages/:id/publish`, `POST /cms/posts`, `PUT /cms/posts/:id` |

**Ownership rule:** GURU can edit/delete only content they own (server-enforced).

---

## 3. STAFF

Same as GURU authoring, plus:

| Page | Frontend route | Backend endpoints |
|---|---|---|
| User management | `/staff/users` | `GET /auth/users`, `POST /auth/users`, `PUT /auth/users/:id`, `PATCH /auth/users/:id/activate` |
| School management | `/staff/schools` | `POST /school`, `PUT /school/:id`, `DELETE /school/:id`, `GET /school/:id/settings` |
| Target schools | `/staff/target-schools` | `GET /target-schools`, `POST /target-schools`, `PUT /target-schools/:id`, `DELETE /target-schools/:id` |
| Notifications broadcast | `/staff/notifications` | `POST /notifications/send`, `POST /notifications/broadcast`, `GET /notifications/templates` |
| Audit logs | `/staff/audit` | `GET /audit-logs`, `GET /audit-logs/stats` |
| AI config | `/staff/ai` | `GET /ai/config`, `PUT /ai/config`, `POST /ai/test-connection` |

**Super Admin** (SUPER_ADMIN) is STAFF +:
- Admin health/logs: `GET /admin/health`, `GET /admin/logs`
- All analytics/admin reports: `GET /analytics/admin/overview`, `GET /analytics/admin/reports/exams`, `GET /analytics/admin/reports/exams/:id`, `GET /analytics/school/stats`
- Admin dashboard: `GET /dashboard/admin`

---

## 4. FINANCE

**Top nav:** Dashboard Finance · Membership · Pembayaran · Invoice · Laporan · Wallet

| Page | Frontend route | Backend endpoints |
|---|---|---|
| Finance dashboard | `/finance` | `GET /dashboard/admin` (KPI subset), `GET /subscriptions/stats` |
| Memberships / plans | `/finance/plans` | `GET /subscriptions/plans`, `POST /subscriptions/plans`, `PUT /subscriptions/plans/:id`, `DELETE /subscriptions/plans/:id` |
| Subscribers | `/finance/subscribers` | `GET /subscriptions/users` |
| Payments & invoices | `/finance/payments` | `GET /subscriptions/users` (payment_method/status via `finance.subscription`), invoice data |
| Reports | `/finance/reports` | `GET /subscriptions/stats`, `GET /analytics/admin/overview` |
| Wallet | `/finance/wallet` | `GET /subscriptions/stats` (MRR/balance) |

> **Greenfield note:** payments/invoices/wallet pages have no dedicated REST module yet;
> they are served by the subscription stats + `finance.invoice`/`finance.subscription`
> reads documented in the API contract.

---

## 5. INVESTOR

**Top nav:** Investor Board · Financial Reports

| Page | Frontend route | Backend endpoints |
|---|---|---|
| Investor board | `/investor` | `GET /subscriptions/stats` (MRR, active memberships), `GET /analytics/admin/overview` |
| Financial reports | `/investor/reports` | `GET /subscriptions/stats`, `GET /analytics/admin/reports/exams` (usage) |

> **Greenfield note:** investor views are read-only aggregates of the finance/analytics
> endpoints; no dedicated investor module exists yet.

---

## 6. Public / Shared

| Page | Frontend route | Backend endpoints |
|---|---|---|
| Landing | `/` (public) | `GET /cms/pages/slug/:slug`, `GET /cms/posts/slug/:slug`, `GET /cms/banners`, `GET /cms/faqs`, `GET /cms/news` |
| Password reset | `/forgot-password` | `POST /auth/forgot-password`, `POST /auth/reset-password` |

---

## Cross-check

Every page above maps to at least one endpoint in the API contract. No page references a
route that does not exist; the only routes intentionally not surfaced in a page are
server-admin helpers (`/auth/users/:id/activate`, `/ai/parse-questions`, proctor WS) used
by SUPER_ADMIN tooling.
