# API List YakinLulus.id — Sprint 16 ✅

> **Generated**: 27 Juli 2026 (Updated: all gaps closed — Sprint 16+)
> **Base**: `/api/v1`
> **Total**: 14 modules, **131 endpoints**

---

## ✅ Auth (18 endpoints)

| # | Method | Path | Auth | Role | Status |
|---|--------|------|------|------|--------|
| 1 | POST | `/auth/register` | ✗ | — | ✅ |
| 2 | POST | `/auth/login` | ✗ | — | ✅ |
| 3 | POST | `/auth/forgot-password` | ✗ | — | ✅ |
| 4 | POST | `/auth/reset-password` | ✗ | — | ✅ |
| 5 | GET | `/auth/me` | JWT | any | ✅ |
| 6 | PUT | `/auth/profile` | JWT | any | ✅ |
| 7 | POST | `/auth/logout` | JWT | any | ✅ |
| 8 | POST | `/auth/refresh` | JWT | any | ✅ |
| 9 | GET | `/auth/users` | JWT | ADMIN/STAFF | ✅ |
| 10 | GET | `/auth/users/search` | JWT | ADMIN/STAFF | ✅ |
| 11 | GET | `/auth/users/:id` | JWT | ADMIN/STAFF | ✅ |
| 12 | POST | `/auth/users` | JWT | ADMIN/STAFF | ✅ |
| 13 | PUT | `/auth/users/:id` | JWT | ADMIN/STAFF | ✅ |
| 14 | DELETE | `/auth/users/:id` | JWT | ADMIN/STAFF | ✅ |
| 15 | PATCH | `/auth/users/:id/activate` | JWT | ADMIN/STAFF | ✅ |

---

## ✅ Academic (16 endpoints)

| # | Method | Path | Auth | Role | Status |
|---|--------|------|------|------|--------|
| 16 | GET | `/academic/levels` | JWT | any | ✅ |
| 17 | GET | `/academic/levels/:id` | JWT | any | ✅ |
| 18 | POST | `/academic/levels` | JWT | ADMIN/STAFF | ✅ |
| 19 | PUT | `/academic/levels/:id` | JWT | ADMIN/STAFF | ✅ |
| 20 | DELETE | `/academic/levels/:id` | JWT | ADMIN/STAFF | ✅ |
| 21 | GET | `/academic/subjects` | JWT | any | ✅ |
| 22 | GET | `/academic/subjects/:id` | JWT | any | ✅ |
| 23 | POST | `/academic/subjects` | JWT | ADMIN/STAFF | ✅ |
| 24 | PUT | `/academic/subjects/:id` | JWT | ADMIN/STAFF | ✅ |
| 25 | DELETE | `/academic/subjects/:id` | JWT | ADMIN/STAFF | ✅ |
| 26 | GET | `/academic/subjects/:id/chapters` | JWT | any | ✅ |
| 27 | GET | `/academic/chapters/:id` | JWT | any | ✅ |
| 28 | POST | `/academic/chapters` | JWT | ADMIN/STAFF | ✅ |
| 29 | PUT | `/academic/chapters/:id` | JWT | ADMIN/STAFF | ✅ |
| 30 | DELETE | `/academic/chapters/:id` | JWT | ADMIN/STAFF | ✅ |
| 31 | GET | `/academic/curriculums` | JWT | any | ✅ |

---

## ✅ Question Bank (10 endpoints)

| # | Method | Path | Auth | Role | Status |
|---|--------|------|------|------|--------|
| 32 | POST | `/questions` | JWT | ADMIN/STAFF/TEACHER | ✅ |
| 33 | POST | `/questions/import` | JWT | ADMIN/STAFF/TEACHER | ✅ |
| 34 | GET | `/questions/export` | JWT | ADMIN/STAFF/TEACHER | ✅ |
| 35 | GET | `/questions` | JWT | any | ✅ |
| 36 | GET | `/questions/:id` | JWT | any | ✅ |
| 37 | GET | `/questions/:id/options` | JWT | any | ✅ |
| 38 | PUT | `/questions/:id/options` | JWT | ADMIN/STAFF/TEACHER | ✅ |
| 39 | PUT | `/questions/:id` | JWT | ADMIN/STAFF/TEACHER | ✅ |
| 40 | DELETE | `/questions/:id` | JWT | ADMIN/STAFF/TEACHER | ✅ |
| 41 | PATCH | `/questions/:id/publish` | JWT | ADMIN/STAFF/TEACHER | ✅ |

---

## ✅ CBT Engine - Exams (19 endpoints)

| # | Method | Path | Auth | Role | Status |
|---|--------|------|------|------|--------|
| 42 | GET | `/exams` | JWT | any | ✅ |
| 43 | POST | `/exams` | JWT | ADMIN/STAFF/TEACHER | ✅ |
| 44 | GET | `/exams/:id` | JWT | any | ✅ |
| 45 | GET | `/exams/:id/analytics` | JWT | any | ✅ |
| 46 | PUT | `/exams/:id` | JWT | ADMIN/STAFF/TEACHER | ✅ |
| 47 | DELETE | `/exams/:id` | JWT | ADMIN/STAFF/TEACHER | ✅ |
| 48 | POST | `/exams/:id/publish` | JWT | ADMIN/STAFF/TEACHER | ✅ |
| 49 | POST | `/exams/:id/schedule` | JWT | ADMIN/STAFF/TEACHER | ✅ |
| 50 | POST | `/exams/:id/archive` | JWT | ADMIN/STAFF/TEACHER | ✅ |
| 51 | PUT | `/exams/:id/rule` | JWT | ADMIN/STAFF/TEACHER | ✅ |
| 52 | GET | `/exams/:id/rule` | JWT | any | ✅ |
| 53 | POST | `/exams/:id/clone` | JWT | ADMIN/STAFF/TEACHER | ✅ |
| 54 | POST | `/exams/:id/blueprint` | JWT | ADMIN/STAFF/TEACHER | ✅ |
| 55 | GET | `/exams/:id/blueprint` | JWT | any | ✅ |
| 56 | POST | `/exams/:id/pool` | JWT | ADMIN/STAFF/TEACHER | ✅ |
| 57 | GET | `/exams/:id/pool` | JWT | any | ✅ |
| 58 | PUT | `/exams/:id/pool` | JWT | ADMIN/STAFF/TEACHER | ✅ |
| 59 | DELETE | `/exams/:id/pool` | JWT | ADMIN/STAFF/TEACHER | ✅ |
| 60 | POST | `/exams/:id/participants` | JWT | ADMIN/STAFF/TEACHER | ✅ |
| 61 | DELETE | `/exams/:id/participants/:userId` | JWT | ADMIN/STAFF/TEACHER | ✅ |
| 62 | GET | `/exams/:id/participants` | JWT | any | ✅ |
| 63 | GET | `/exams/:id/questions` | JWT | any | ✅ |
| 64 | GET | `/exams/:id/exam-questions` | JWT | any | ✅ |
| 65 | POST | `/exams/:id/questions` | JWT | ADMIN/STAFF/TEACHER | ✅ |

---

## ✅ CBT Runtime (9 endpoints)

| # | Method | Path | Auth | Role | Status |
|---|--------|------|------|------|--------|
| 66 | POST | `/cbt/:exam_id/start` | JWT | any | ✅ |
| 67 | POST | `/cbt/:session_id/sync` | JWT | any | ✅ |
| 68 | POST | `/cbt/:session_id/navigate` | JWT | any | ✅ |
| 69 | POST | `/cbt/:session_id/pause` | JWT | any | ✅ |
| 70 | POST | `/cbt/:session_id/resume` | JWT | any | ✅ |
| 71 | POST | `/cbt/:session_id/finish` | JWT | any | ✅ |
| 72 | POST | `/cbt/:session_id/violation` | JWT | any | ✅ |
| 73 | GET | `/cbt/:session_id/answers` | JWT | any | ✅ |
| 74 | GET | `/cbt/:session_id/questions` | JWT | any | ✅ |
| — | POST | `/cbt/admin/auto-submit` | JWT | ADMIN | ✅ (registered in main.go) |

---

## ✅ Scoring (2 endpoints)

| # | Method | Path | Auth | Role | Status |
|---|--------|------|------|------|--------|
| 75 | GET | `/results/` | JWT | any | ✅ |
| 76 | GET | `/results/:session_id` | JWT | any | ✅ |

---

## ✅ Analytics (5 endpoints)

| # | Method | Path | Auth | Role | Status |
|---|--------|------|------|------|--------|
| 77 | GET | `/analytics/exams/:id` | JWT | any | ✅ |
| 78 | GET | `/analytics/students/:id` | JWT | any | ✅ |
| 79 | GET | `/analytics/questions/:id` | JWT | any | ✅ |
| 80 | GET | `/analytics/admin/reports/exams` | JWT | ADMIN/STAFF/TEACHER | ✅ |
| 81 | GET | `/analytics/admin/reports/exams/:id` | JWT | ADMIN/STAFF/TEACHER | ✅ |

---

## ✅ Media (4 endpoints)

| # | Method | Path | Auth | Role | Status |
|---|--------|------|------|------|--------|
| 82 | POST | `/media/upload` | JWT | ADMIN/STAFF/TEACHER | ✅ |
| 83 | GET | `/media/entity/:type/:id` | JWT | any | ✅ |
| 84 | GET | `/media/:id` | JWT | any | ✅ |
| 85 | DELETE | `/media/:id` | JWT | ADMIN/STAFF/TEACHER | ✅ |

---

## ✅ Material (11 endpoints)

| # | Method | Path | Auth | Role | Status |
|---|--------|------|------|------|--------|
| 86 | GET | `/materials/progress` | JWT | any | ✅ |
| 87 | GET | `/materials/` | JWT | any | ✅ |
| 88 | POST | `/materials/` | JWT | ADMIN/STAFF/TEACHER | ✅ |
| 89 | GET | `/materials/:id` | JWT | any | ✅ |
| 90 | PUT | `/materials/:id` | JWT | ADMIN/STAFF/TEACHER | ✅ |
| 91 | DELETE | `/materials/:id` | JWT | ADMIN/STAFF/TEACHER | ✅ |
| 92 | PATCH | `/materials/:id/publish` | JWT | ADMIN/STAFF/TEACHER | ✅ |
| 93 | PATCH | `/materials/:id/archive` | JWT | ADMIN/STAFF/TEACHER | ✅ |
| 94 | POST | `/materials/:id/progress` | JWT | any | ✅ |
| 95 | GET | `/materials/:id/progress` | JWT | any | ✅ |

---

## ✅ School + Branding (9 endpoints)

| # | Method | Path | Auth | Role | Status |
|---|--------|------|------|------|--------|
| 96 | GET | `/schools` | JWT | ADMIN/STAFF | ✅ |
| 97 | POST | `/schools` | JWT | ADMIN/STAFF | ✅ |
| 98 | GET | `/schools/:id` | JWT | any | ✅ |
| 99 | PUT | `/schools/:id` | JWT | ADMIN/STAFF | ✅ |
| 100 | PATCH | `/schools/:id/status` | JWT | ADMIN/STAFF | ✅ |
| 101 | DELETE | `/schools/:id` | JWT | ADMIN/STAFF | ✅ |
| 102 | GET | `/schools/:id/settings` | JWT | any | ✅ |
| 103 | PUT | `/schools/:id/settings` | JWT | ADMIN/STAFF | ✅ |
| 104 | GET | `/schools/:id/branding` | JWT | any | ✅ |
| 105 | PUT | `/schools/:id/branding` | JWT | ADMIN/STAFF | ✅ |

---

## ✅ Notification + Templates (13 endpoints)

| # | Method | Path | Auth | Role | Status |
|---|--------|------|------|------|--------|
| 106 | GET | `/notifications` | JWT | any | ✅ |
| 107 | GET | `/notifications/unread-count` | JWT | any | ✅ |
| 108 | GET | `/notifications/:id` | JWT | any | ✅ |
| 109 | POST | `/notifications/:id/read` | JWT | any | ✅ |
| 110 | POST | `/notifications/:id/archive` | JWT | any | ✅ |
| 111 | DELETE | `/notifications/:id` | JWT | any | ✅ |
| 112 | POST | `/notifications/read-all` | JWT | any | ✅ |
| 113 | POST | `/notifications/send` | JWT | ADMIN/STAFF | ✅ |
| 114 | POST | `/notifications/broadcast` | JWT | ADMIN/STAFF | ✅ |
| 115 | GET | `/notifications/preferences` | JWT | any | ✅ |
| 116 | PUT | `/notifications/preferences/:channel` | JWT | any | ✅ |
| 117 | GET | `/notification-templates` | JWT | ADMIN/STAFF | ✅ |
| 118 | POST | `/notification-templates` | JWT | ADMIN/STAFF | ✅ |
| 119 | PUT | `/notification-templates/:id` | JWT | ADMIN/STAFF | ✅ |
| 120 | DELETE | `/notification-templates/:id` | JWT | ADMIN/STAFF | ✅ |

---

## ✅ Dashboard (3 endpoints) — Sprint 16

| # | Method | Path | Auth | Role | Status |
|---|--------|------|------|------|--------|
| 121 | GET | `/dashboard/student` | JWT | any | ✅ |
| 122 | GET | `/dashboard/teacher` | JWT | TEACHER | ✅ |
| 123 | GET | `/dashboard/admin` | JWT | ADMIN | ✅ |

---

## ✅ Exam Packages (7 endpoints) — Sprint 17

| # | Method | Path | Auth | Role | Status |
|---|--------|------|------|------|--------|
| 124 | GET | `/exam-packages` | JWT | any | ✅ |
| 125 | POST | `/exam-packages` | JWT | ADMIN/TEACHER | ✅ |
| 126 | PUT | `/exam-packages/:id` | JWT | ADMIN/TEACHER | ✅ |
| 127 | DELETE | `/exam-packages/:id` | JWT | ADMIN/TEACHER | ✅ |
| 128 | GET | `/exam-packages/:id/exams` | JWT | any | ✅ |
| 129 | POST | `/exam-packages/:id/exams` | JWT | ADMIN/TEACHER | ✅ |
| 130 | DELETE | `/exam-packages/:id/exams/:examContentId` | JWT | ADMIN/TEACHER | ✅ |

## ✅ Ranking (1 endpoint) — Sprint 17

| # | Method | Path | Auth | Role | Status |
|---|--------|------|------|------|--------|
| 131 | GET | `/leaderboard?package_id=&month=&limit=` | JWT | any | ✅ |

---

## ✅ Practice (5 endpoints) — Sprint 16

| # | Method | Path | Auth | Role | Status |
|---|--------|------|------|------|--------|
| 132 | POST | `/practice/sessions/start` | JWT | any | ✅ |
| 133 | POST | `/practice/sessions/:id/answer` | JWT | any | ✅ |
| 134 | GET | `/practice/sessions/:id` | JWT | any | ✅ |
| 135 | GET | `/practice/sessions` | JWT | any | ✅ |
| 136 | GET | `/practice/stats` | JWT | any | ✅ |

---

## ✅ AI Tutor (5 endpoints) — Sprint 16

| # | Method | Path | Auth | Role | Status |
|---|--------|------|------|------|--------|
| 137 | POST | `/ai/tutor/chat` | JWT | any | ✅ (butuh AI_API_KEY) |
| 138 | POST | `/ai/tutor/conversations` | JWT | any | ✅ |
| 139 | GET | `/ai/tutor/conversations/:id` | JWT | any | ✅ |
| 140 | DELETE | `/ai/tutor/conversations/:id` | JWT | any | ✅ |
| 141 | POST | `/ai/generate-question` | JWT | any | ✅ (butuh AI_API_KEY) |

---

## ✅ WebSocket (2 endpoints)

| # | Method | Path | Auth | Role | Status |
|---|--------|------|------|------|--------|
| 1 | GET | `/ws/proctor` | JWT | ADMIN/STAFF/TEACHER | ✅ Live proctoring |
| 2 | GET | `/ws/exam/:session_id` | JWT | any | ✅ Student session sync |

---

## ✅ OpenAPI 3.1

| Item | Value | Status |
|------|-------|--------|
| Spec file | `backend/openapi.yaml` | ✅ 3150 lines, 103 paths |
| Swagger UI | `/docs` (CDN petstore) | ✅ Redirect to swagger-ui |
| Raw spec | `/openapi.yaml` | ✅ Serve static |

---

## Extra: Health & Admin

| # | Method | Path | Auth | Role | Status |
|---|--------|------|------|------|--------|
| — | GET | `/health` | ✗ | — | ✅ |

---

## Ringkasan Count

| Module | Count | Sprint |
|--------|-------|--------|
| Auth | 15 | Sprint 1 |
| Academic | 16 | Sprint 2 |
| Question Bank | 10 | Sprint 3 |
| CBT Engine | 24 | Sprint 4 / Sprint 15 |
| CBT Runtime | 10 | Sprint 5 |
| Scoring | 2 | Sprint 6 |
| Analytics | 9 | Sprint 7 + Sprint 16 advanced |
| Media | 4 | Sprint 8 |
| Material | 10 | Sprint 8 |
| School + Branding | 10 | Sprint 12/13 |
| Notification + Templates | 15 | Sprint 12/13 |
| **Dashboard** | **3** | **Sprint 16 ✅** |
| **Exam Packages** | **7** | **Sprint 17 ✅** |
| **Ranking** | **1** | **Sprint 17 ✅** |
| **Practice** | **5** | **Sprint 16 ✅** |
| **AI Tutor** | **5** | **Sprint 16 ✅** |
| **TOTAL** | **149** | |

---

## ❌ Remaining Gaps

| Gap | Priority | Status |
|-----|----------|--------|
| Swagger/OpenAPI | ~~HIGH~~ | ✅ DONE — openapi.yaml + /docs |
| WebSocket realtime | ~~MEDIUM~~ | ✅ DONE — /ws/proctor + /ws/exam/:id |
| Redis integration | ~~LOW~~ | ✅ DONE — pkg/cache/cache.go |
| Advanced analytics | ~~LOW~~ | ✅ DONE — 4 new endpoints in advanced.go |
| Rate limiter config | ~~LOW~~ | ✅ DONE — RPM→RPS fix |
| Offline sync engine | MEDIUM | Belum — frontend IndexedDB |
| Comprehensive tests | LOW | Belum — 0 unit tests |
| AI Recommendation | LOW | Difer ke frontend dulu |
