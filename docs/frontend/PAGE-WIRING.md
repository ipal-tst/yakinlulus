# Frontend Page Wiring

Maps every page/route of the frontend to the backend endpoints it consumes, per role.
Base path: `/api/v1`. Auth guard: `SISWA` students and `GURU`/`STAFF`/`SUPER_ADMIN`
are routed to their own app shells after login.

The same auth hooks apply to every shell: store the Bearer token from `/auth/login`,
refresh via `/auth/refresh` before expiry, attach to every request.

---

## 1. SISWA (Student)

**Top nav:** Belajar (Materials) · Latihan (Practice) · Try Out (Exams) · Hasil (Results) ·
Peringkat (Ranking) · AI Tutor · Profil

| Page | Frontend route | Purpose | Backend endpoints |
|---|---|---|---|
| Login / Register | `/login`, `/register` | auth | `POST /auth/login`, `POST /auth/register` |
| Home (student) | `/` | overview | `GET /dashboard/student`, `GET /notifications` |
| Material list | `/materials` | browse lessons | `GET /material`, `GET /academic/subjects`, `GET /academic/grades` |
| Material detail | `/materials/:id` | read lesson, track progress | `GET /material/:id`, `POST /material/:id/progress` |
| Practice start | `/practice` | pick subject/topic | `GET /academic/subjects`, `GET /academic/chapters` |
| Practice session | `/practice/:id` | answer questions w/ feedback | `POST /practice/sessions/start`, `POST /practice/sessions/:id/answer` |
| Practice history | `/practice/history` | past sessions | `GET /practice/sessions`, `GET /practice/stats` |
| Exam list | `/exams` | browse try-outs | `GET /exams` |
| Exam start / runner | `/exams/:id` | attempt CBT | `POST /cbt/:exam_id/start`, `POST /cbt/:session_id/sync`, `POST /cbt/:session_id/finish` |
| Exam review | `/exams/:id/review` | pembahasan | `GET /cbt/:session_id/review`, `GET /cbt/:session_id/questions` |
| Exam-practice start | `/exam-practice` | material/subject practice | `POST /exam-practice/material/:materialId`, `POST /exam-practice/subject` |
| Exam-practice session | `/exam-practice/:sessionId` | run + submit | `POST /exam-practice/:sessionId/submit`, `GET /exam-practice/:sessionId` |
| Results | `/results` | score history | `GET /results`, `GET /results/:session_id` |
| Ranking | `/ranking` | leaderboard | `GET /ranking/leaderboard` |
| My targets | `/targets` | target schools | `GET /profile/targets`, `PUT /profile/targets` |
| Certificates | `/certificates` | certificates | `GET /profile/certificates`, `GET /profile/certificates/:id/download` |
| AI Tutor | `/ai` | chat with tutor | `POST /ai/tutor/chat`, `POST /ai/tutor/conversations`, `GET /ai/tutor/conversations/:id` |
| Notifications | `/notifications` | inbox | `GET /notifications`, `POST /notifications/:id/read`, `POST /notifications/read-all` |
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
