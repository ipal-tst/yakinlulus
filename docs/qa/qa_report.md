# QA Endpoint Validation Report

**Generated**: 2026-08-10 05:52:17  
**Total Tests**: 46 | **Passed**: 19 | **Failed**: 27 | **Pass Rate**: 41.30%  
**Avg Latency**: 64.398941ms

## Results Summary Table

| # | Module | Method | Endpoint Path | Role | Status | Expected | Result | Latency |
|---|--------|--------|---------------|------|--------|----------|--------|---------|
| 1 | Auth | `GET` | `/auth/me` | SUPER_ADMIN | 200 | 200 | ✅ PASS | 73ms |
| 2 | Auth | `GET` | `/auth/users` | SUPER_ADMIN | 200 | 200 | ✅ PASS | 157ms |
| 3 | Auth | `GET` | `/auth/users/search?q=test` | SUPER_ADMIN | 200 | 200 | ✅ PASS | 148ms |
| 4 | Auth | `GET` | `/auth/me` | UNAUTH | 401 | 401 | ✅ PASS | 1ms |
| 5 | Auth | `GET` | `/auth/users` | SISWA | 403 | 403 | ✅ PASS | 1ms |
| 6 | Academic | `GET` | `/academic/levels` | SUPER_ADMIN | 200 | 200 | ✅ PASS | 72ms |
| 7 | Academic | `GET` | `/academic/subjects` | SUPER_ADMIN | 200 | 200 | ✅ PASS | 95ms |
| 8 | Academic | `GET` | `/academic/curriculums` | SUPER_ADMIN | 200 | 200 | ✅ PASS | 70ms |
| 9 | Academic | `GET` | `/academic/subjects/00000000-0000-0000-0000-000000000000` | SUPER_ADMIN | 404 | 404 | ✅ PASS | 83ms |
| 10 | Question Bank | `GET` | `/questions` | SUPER_ADMIN | 200 | 200 | ✅ PASS | 1.533s |
| 11 | Question Bank | `GET` | `/questions/export` | SUPER_ADMIN | 400 | 200 | ❌ FAIL | 0s |
| 12 | Question Bank | `GET` | `/questions/00000000-0000-0000-0000-000000000000` | SUPER_ADMIN | 404 | 404 | ✅ PASS | 93ms |
| 13 | CBT Engine | `GET` | `/exams` | SUPER_ADMIN | 200 | 200 | ✅ PASS | 192ms |
| 14 | CBT Engine | `GET` | `/exams/00000000-0000-0000-0000-000000000000` | SUPER_ADMIN | 404 | 404 | ✅ PASS | 77ms |
| 15 | CBT Engine | `GET` | `/exams/00000000-0000-0000-0000-000000000000/rule` | SUPER_ADMIN | 404 | 404 | ✅ PASS | 1ms |
| 16 | CBT Engine | `GET` | `/exams/00000000-0000-0000-0000-000000000000/blueprint` | SUPER_ADMIN | 404 | 404 | ✅ PASS | 77ms |
| 17 | CBT Runtime | `POST` | `/cbt/00000000-0000-0000-0000-000000000000/start` | SISWA | 404 | 404 | ✅ PASS | 64ms |
| 18 | CBT Runtime | `POST` | `/cbt/admin/auto-submit` | SUPER_ADMIN | 200 | 200 | ✅ PASS | 75ms |
| 19 | CBT Runtime | `POST` | `/cbt/admin/auto-submit` | SISWA | 403 | 403 | ✅ PASS | 1ms |
| 20 | Scoring | `GET` | `/results/` | SISWA | 200 | 200 | ✅ PASS | 146ms |
| 21 | Scoring | `GET` | `/results/00000000-0000-0000-0000-000000000000` | SISWA | 429 | 404 | ❌ FAIL | 1ms |
| 22 | Analytics | `GET` | `/analytics/admin/reports/exams` | SUPER_ADMIN | 429 | 200 | ❌ FAIL | 1ms |
| 23 | Analytics | `GET` | `/analytics/students/00000000-0000-0000-0000-000000000000` | SUPER_ADMIN | 429 | 200 | ❌ FAIL | 0s |
| 24 | Analytics | `GET` | `/analytics/admin/reports/exams` | SISWA | 429 | 403 | ❌ FAIL | 1ms |
| 25 | Media | `GET` | `/media/entity/question/00000000-0000-0000-0000-000000000000` | SUPER_ADMIN | 429 | 200 | ❌ FAIL | 0s |
| 26 | Media | `GET` | `/media/00000000-0000-0000-0000-000000000000` | SUPER_ADMIN | 429 | 404 | ❌ FAIL | 1ms |
| 27 | Material | `GET` | `/materials/` | SISWA | 429 | 200 | ❌ FAIL | 0s |
| 28 | Material | `GET` | `/materials/progress` | SISWA | 429 | 200 | ❌ FAIL | 0s |
| 29 | Material | `GET` | `/materials/00000000-0000-0000-0000-000000000000` | SISWA | 429 | 404 | ❌ FAIL | 0s |
| 30 | School | `GET` | `/schools` | SUPER_ADMIN | 429 | 200 | ❌ FAIL | 1ms |
| 31 | School | `GET` | `/schools/00000000-0000-0000-0000-000000000000/branding` | SUPER_ADMIN | 429 | 500 | ❌ FAIL | 0s |
| 32 | School | `GET` | `/schools/00000000-0000-0000-0000-000000000000/settings` | SUPER_ADMIN | 429 | 500 | ❌ FAIL | 0s |
| 33 | Notifications | `GET` | `/notifications` | SISWA | 429 | 200 | ❌ FAIL | 1ms |
| 34 | Notifications | `GET` | `/notifications/unread-count` | SISWA | 429 | 200 | ❌ FAIL | 0s |
| 35 | Notifications | `GET` | `/notification-templates` | SUPER_ADMIN | 429 | 200 | ❌ FAIL | 0s |
| 36 | Notifications | `GET` | `/notification-templates` | SISWA | 429 | 403 | ❌ FAIL | 0s |
| 37 | Dashboard | `GET` | `/dashboard/student` | SISWA | 429 | 200 | ❌ FAIL | 1ms |
| 38 | Dashboard | `GET` | `/dashboard/teacher` | GURU | 429 | 200 | ❌ FAIL | 0s |
| 39 | Dashboard | `GET` | `/dashboard/admin` | SUPER_ADMIN | 429 | 200 | ❌ FAIL | 0s |
| 40 | Dashboard | `GET` | `/dashboard/admin` | SISWA | 429 | 403 | ❌ FAIL | 1ms |
| 41 | Exam Packages | `GET` | `/exam-packages` | SISWA | 429 | 200 | ❌ FAIL | 0s |
| 42 | Exam Packages | `GET` | `/leaderboard` | SISWA | 429 | 400 | ❌ FAIL | 0s |
| 43 | Exam Packages | `GET` | `/exam-packages/00000000-0000-0000-0000-000000000000/exams` | SISWA | 429 | 200 | ❌ FAIL | 0s |
| 44 | Practice & AI | `GET` | `/practice/sessions` | SISWA | 429 | 200 | ❌ FAIL | 1ms |
| 45 | Practice & AI | `GET` | `/practice/stats` | SISWA | 429 | 200 | ❌ FAIL | 0s |
| 46 | Practice & AI | `POST` | `/ai/tutor/conversations` | SISWA | 429 | 500 | ❌ FAIL | 0s |
