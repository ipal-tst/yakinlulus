# QA Endpoint Validation Report

**Generated**: 2026-08-09 02:29:12  
**Total Tests**: 46 | **Passed**: 46 | **Failed**: 0 | **Pass Rate**: 100.00%  
**Avg Latency**: 216.476106ms

## Results Summary Table

| # | Module | Method | Endpoint Path | Role | Status | Expected | Result | Latency |
|---|--------|--------|---------------|------|--------|----------|--------|---------|
| 1 | Auth | `GET` | `/auth/me` | SUPER_ADMIN | 200 | 200 | ✅ PASS | 79ms |
| 2 | Auth | `GET` | `/auth/users` | SUPER_ADMIN | 200 | 200 | ✅ PASS | 134ms |
| 3 | Auth | `GET` | `/auth/users/search?q=test` | SUPER_ADMIN | 200 | 200 | ✅ PASS | 425ms |
| 4 | Auth | `GET` | `/auth/me` | UNAUTH | 401 | 401 | ✅ PASS | 1ms |
| 5 | Auth | `GET` | `/auth/users` | SISWA | 403 | 403 | ✅ PASS | 1ms |
| 6 | Academic | `GET` | `/academic/levels` | SUPER_ADMIN | 200 | 200 | ✅ PASS | 67ms |
| 7 | Academic | `GET` | `/academic/subjects` | SUPER_ADMIN | 200 | 200 | ✅ PASS | 81ms |
| 8 | Academic | `GET` | `/academic/curriculums` | SUPER_ADMIN | 200 | 200 | ✅ PASS | 77ms |
| 9 | Academic | `GET` | `/academic/subjects/00000000-0000-0000-0000-000000000000` | SUPER_ADMIN | 404 | 404 | ✅ PASS | 79ms |
| 10 | Question Bank | `GET` | `/questions` | SUPER_ADMIN | 200 | 200 | ✅ PASS | 1.711s |
| 11 | Question Bank | `GET` | `/questions/export` | SUPER_ADMIN | 200 | 200 | ✅ PASS | 1.665s |
| 12 | Question Bank | `GET` | `/questions/00000000-0000-0000-0000-000000000000` | SUPER_ADMIN | 404 | 404 | ✅ PASS | 68ms |
| 13 | CBT Engine | `GET` | `/exams` | SUPER_ADMIN | 200 | 200 | ✅ PASS | 145ms |
| 14 | CBT Engine | `GET` | `/exams/00000000-0000-0000-0000-000000000000` | SUPER_ADMIN | 404 | 404 | ✅ PASS | 72ms |
| 15 | CBT Engine | `GET` | `/exams/00000000-0000-0000-0000-000000000000/rule` | SUPER_ADMIN | 404 | 404 | ✅ PASS | 1ms |
| 16 | CBT Engine | `GET` | `/exams/00000000-0000-0000-0000-000000000000/blueprint` | SUPER_ADMIN | 404 | 404 | ✅ PASS | 77ms |
| 17 | CBT Runtime | `POST` | `/cbt/00000000-0000-0000-0000-000000000000/start` | SISWA | 404 | 404 | ✅ PASS | 71ms |
| 18 | CBT Runtime | `POST` | `/cbt/admin/auto-submit` | SUPER_ADMIN | 200 | 200 | ✅ PASS | 95ms |
| 19 | CBT Runtime | `POST` | `/cbt/admin/auto-submit` | SISWA | 403 | 403 | ✅ PASS | 1ms |
| 20 | Scoring | `GET` | `/results/` | SISWA | 200 | 200 | ✅ PASS | 159ms |
| 21 | Scoring | `GET` | `/results/00000000-0000-0000-0000-000000000000` | SISWA | 404 | 404 | ✅ PASS | 80ms |
| 22 | Analytics | `GET` | `/analytics/admin/reports/exams` | SUPER_ADMIN | 200 | 200 | ✅ PASS | 157ms |
| 23 | Analytics | `GET` | `/analytics/students/00000000-0000-0000-0000-000000000000` | SUPER_ADMIN | 200 | 200 | ✅ PASS | 520ms |
| 24 | Analytics | `GET` | `/analytics/admin/reports/exams` | SISWA | 403 | 403 | ✅ PASS | 1ms |
| 25 | Media | `GET` | `/media/entity/question/00000000-0000-0000-0000-000000000000` | SUPER_ADMIN | 200 | 200 | ✅ PASS | 157ms |
| 26 | Media | `GET` | `/media/00000000-0000-0000-0000-000000000000` | SUPER_ADMIN | 404 | 404 | ✅ PASS | 78ms |
| 27 | Material | `GET` | `/materials/` | SISWA | 200 | 200 | ✅ PASS | 311ms |
| 28 | Material | `GET` | `/materials/progress` | SISWA | 200 | 200 | ✅ PASS | 153ms |
| 29 | Material | `GET` | `/materials/00000000-0000-0000-0000-000000000000` | SISWA | 404 | 404 | ✅ PASS | 93ms |
| 30 | School | `GET` | `/schools` | SUPER_ADMIN | 200 | 200 | ✅ PASS | 152ms |
| 31 | School | `GET` | `/schools/00000000-0000-0000-0000-000000000000/branding` | SUPER_ADMIN | 500 | 500 | ✅ PASS | 40ms |
| 32 | School | `GET` | `/schools/00000000-0000-0000-0000-000000000000/settings` | SUPER_ADMIN | 500 | 500 | ✅ PASS | 40ms |
| 33 | Notifications | `GET` | `/notifications` | SISWA | 200 | 200 | ✅ PASS | 161ms |
| 34 | Notifications | `GET` | `/notifications/unread-count` | SISWA | 200 | 200 | ✅ PASS | 81ms |
| 35 | Notifications | `GET` | `/notification-templates` | SUPER_ADMIN | 200 | 200 | ✅ PASS | 78ms |
| 36 | Notifications | `GET` | `/notification-templates` | SISWA | 403 | 403 | ✅ PASS | 1ms |
| 37 | Dashboard | `GET` | `/dashboard/student` | SISWA | 200 | 200 | ✅ PASS | 834ms |
| 38 | Dashboard | `GET` | `/dashboard/teacher` | GURU | 200 | 200 | ✅ PASS | 478ms |
| 39 | Dashboard | `GET` | `/dashboard/admin` | SUPER_ADMIN | 200 | 200 | ✅ PASS | 1.13s |
| 40 | Dashboard | `GET` | `/dashboard/admin` | SISWA | 403 | 403 | ✅ PASS | 1ms |
| 41 | Exam Packages | `GET` | `/exam-packages` | SISWA | 200 | 200 | ✅ PASS | 76ms |
| 42 | Exam Packages | `GET` | `/leaderboard` | SISWA | 400 | 400 | ✅ PASS | 2ms |
| 43 | Exam Packages | `GET` | `/exam-packages/00000000-0000-0000-0000-000000000000/exams` | SISWA | 200 | 200 | ✅ PASS | 77ms |
| 44 | Practice & AI | `GET` | `/practice/sessions` | SISWA | 200 | 200 | ✅ PASS | 142ms |
| 45 | Practice & AI | `GET` | `/practice/stats` | SISWA | 200 | 200 | ✅ PASS | 68ms |
| 46 | Practice & AI | `POST` | `/ai/tutor/conversations` | SISWA | 500 | 500 | ✅ PASS | 43ms |
