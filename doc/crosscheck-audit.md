# Crosscheck Audit — Backend vs Spec Docs

Date: 2026-07-26
Method: Baca `doc/Backend Specification/**/*.md` + bandingkan route registers di setiap modul

## Methodology

Baca semua 46 spec docs (Foundation, Academic, Core Learning, Supporting Service). Cocokkan API summary dari setiap spec dengan actual route registrations di 11 module. Catat gap.

## Gap Summary

| Domain | Spec vs Impl | Gap Severity |
|--------|-------------|-------------|
| 01_authentication | ✅ Match | - |
| 02_user_management | ⚠️ Prefix `/auth/users/` vs spec `/users/`; missing GET /users/:id, POST /users, PUT /users/:id, DELETE /users/:id | HIGH |
| 03_school_management | ✅ Match (branding is bonus); missing school search | LOW |
| 04_curriculum | ❌ **FULLY MISSING** — 0 curriculums endpoints, no table | FUTURE |
| 05_subject | ✅ Match via /academic/subjects | - |
| 06_chapter | ✅ Match via /academic/chapters | - |
| 07_question_bank | ⚠️ Missing archive/restore/clone/unpublish, no review workflow | MEDIUM |
| 08_material | ✅ Core CRUD done; missing search, bookmark, versioning | LOW (future) |
| 09_exam | ⚠️ Missing search exam | LOW |
| 10_cbt_runtime | ✅ Richer than spec | - |
| 11_analytics | ⚠️ Missing teacher/school/material analytics, leaderboard, report export | MEDIUM |
| 13_notification | ⚠️ Missing send, broadcast, schedule, delete, single-get | MEDIUM |
| 14_file_management | ⚠️ Missing restore, replace, signed URL | LOW (future) |
| 12_ai | ❌ **FULLY MISSING** | FUTURE |

## Priority Gaps to Fix Now

### P1 — High Alignment
1. **User admin CRUD** — POST /users (admin create), GET /users/:id, PUT /users/:id, DELETE /users/:id
2. **Question archive/restore/clone** — POST /questions/:id/archive|restore|clone  
3. **Question unpublish** — POST /questions/:id/unpublish
4. **Notification send, broadcast, delete, single-get** — POST /notifications, POST /notifications/broadcast, DELETE /notifications/:id, GET /notifications/:id
5. **Exam search** — GET /exams?q=...
6. **School search** — GET /schools?q=...

### P2 — Future Sprint
- Curriculum module (04_curriculum.md) — full module, plan later
- Review workflow (07_question_bank: review queues, approve/reject)
- Analytics teacher/school/material + leaderboard
- Report export
- File restore/replace/signed URL
- AI module (12_ai.md)
