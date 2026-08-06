# Backend API Contract

Authoritative reference for the frontend. Server is a Go/Fiber backend; every route is
under the base path `/api/v1`. Auth = Bearer JWT from `POST /api/v1/auth/login`.

Role codes used in gates: `SUPER_ADMIN`, `STAFF`, `FINANCE`, `GURU`, `SISWA`, `INVESTOR`.

Conventions:

- Response envelope: `{ "success": true, "data": <payload>, "message": "..." }` via `shared.Success`.
- Errors: `{ "success": false, "error": { "code": "...", "message": "..." } }` via `shared.Error`.
- Pagination query params (when listed): `page` (1-based), `limit` (default 20).
- `:id` path params are required string/uuid. `{ }` in this doc means object.

---

## Auth

| Method | Path | Role | Body | Returns |
|---|---|---|---|---|
| POST | `/auth/register` | public | `{email, password, full_name, role:"SISWA"}` | token + user |
| POST | `/auth/login` | public | `{email, password}` | token + user |
| POST | `/auth/forgot-password` | public | `{email}` | ack |
| POST | `/auth/reset-password` | public | `{token, password}` | ack |
| GET | `/auth/me` | any auth | - | current user |
| PUT | `/auth/profile` | any auth | `{full_name?, gender?, phone?, avatar_url?}` | user |
| POST | `/auth/change-password` | any auth | `{old_password, new_password}` | ack |
| POST | `/auth/logout` | any auth | - | ack |
| POST | `/auth/refresh` | any auth | `{refresh_token}` | token |
| GET | `/auth/users` | SUPER_ADMIN, STAFF | - | paginated users |
| GET | `/auth/users/search` | SUPER_ADMIN, STAFF | `?q=` | match users |
| GET | `/auth/users/:id` | SUPER_ADMIN, STAFF | - | user |
| POST | `/auth/users` | SUPER_ADMIN, STAFF | `{email, password, full_name, role}` | user |
| PUT | `/auth/users/:id` | SUPER_ADMIN, STAFF | `{full_name?, role?}` | user |
| DELETE | `/auth/users/:id` | SUPER_ADMIN, STAFF | - | ack |
| PATCH | `/auth/users/:id/activate` | SUPER_ADMIN, STAFF | `{active}` | user |

User shape: `{ id, email, full_name, role, is_active, avatar_url, grade_id, school_name,
gender, phone, major, created_at, updated_at }`.

Source tables: `identity.user`, `identity.user_profile`, `identity.user_role`,
`identity.role`, `identity.login_session`, `identity.password_reset`.

## Academic (master data)

| Method | Path | Role | Returns |
|---|---|---|---|
| GET | `/academic/levels` | any auth | levels |
| GET | `/academic/levels/:id` | any auth | level |
| POST | `/academic/levels` | SUPER_ADMIN, STAFF, GURU | level |
| PUT | `/academic/levels/:id` | SUPER_ADMIN, STAFF, GURU | level |
| DELETE | `/academic/levels/:id` | SUPER_ADMIN, STAFF, GURU | ack |
| GET | `/academic/grades` | any auth | grades |
| POST | `/academic/grades` | SUPER_ADMIN, STAFF, GURU | grade |
| PUT | `/academic/grades/:id` | SUPER_ADMIN, STAFF, GURU | grade |
| DELETE | `/academic/grades/:id` | SUPER_ADMIN, STAFF, GURU | ack |
| GET | `/academic/subjects` | any auth | subjects |
| GET | `/academic/subjects/:id` | any auth | subject |
| GET | `/academic/subjects/:id/chapters` | any auth | chapters |
| POST | `/academic/subjects` | SUPER_ADMIN, STAFF, GURU | subject |
| PUT | `/academic/subjects/:id` | SUPER_ADMIN, STAFF, GURU | subject |
| DELETE | `/academic/subjects/:id` | SUPER_ADMIN, STAFF, GURU | ack |
| GET | `/academic/chapters` | any auth | all chapters |
| GET | `/academic/chapters/:id` | any auth | chapter |
| POST | `/academic/chapters` | SUPER_ADMIN, STAFF, GURU | chapter |
| PUT | `/academic/chapters/:id` | SUPER_ADMIN, STAFF, GURU | chapter |
| DELETE | `/academic/chapters/:id` | SUPER_ADMIN, STAFF, GURU | ack |
| GET | `/academic/topics` | any auth | topics |
| POST | `/academic/topics` | SUPER_ADMIN, STAFF, GURU | topic |
| PUT | `/academic/topics/:id` | SUPER_ADMIN, STAFF, GURU | topic |
| DELETE | `/academic/topics/:id` | SUPER_ADMIN, STAFF, GURU | ack |
| GET | `/academic/learning-outcomes` | any auth | outcomes |
| POST | `/academic/learning-outcomes` | SUPER_ADMIN, STAFF, GURU | outcome |
| PUT | `/academic/learning-outcomes/:id` | SUPER_ADMIN, STAFF, GURU | outcome |
| DELETE | `/academic/learning-outcomes/:id` | SUPER_ADMIN, STAFF, GURU | ack |
| GET | `/academic/curriculums` | any auth | curriculums |
| POST | `/academic/curriculums` | SUPER_ADMIN, STAFF, GURU | curriculum |
| PUT | `/academic/curriculums/:id` | SUPER_ADMIN, STAFF, GURU | curriculum |
| DELETE | `/academic/curriculums/:id` | SUPER_ADMIN, STAFF, GURU | ack |
| GET | `/academic/programs` | any auth | programs |
| POST | `/academic/programs` | SUPER_ADMIN, STAFF, GURU | program |
| PUT | `/academic/programs/:id` | SUPER_ADMIN, STAFF, GURU | program |
| DELETE | `/academic/programs/:id` | SUPER_ADMIN, STAFF, GURU | ack |

Source tables: `academic.education_level`, `academic.grade`, `academic.subject`,
`academic.chapter`, `academic.topic`, `academic.learning_outcome`,
`academic.curriculum`, `academic.program`.

## Questions (Question Bank)

| Method | Path | Role | Body | Returns |
|---|---|---|---|---|
| GET | `/questions` | any auth | `?subject_id=&grade_id=&difficulty=&status=&q=` | questions |
| GET | `/questions/:id` | any auth | - | question |
| POST | `/questions` | SUPER_ADMIN, STAFF, GURU | question payload | question |
| PUT | `/questions/:id` | SUPER_ADMIN, STAFF, GURU | question payload | question |
| DELETE | `/questions/:id` | SUPER_ADMIN, STAFF, GURU (owner-only for GURU) | - | ack |
| POST | `/questions/:id/publish` | SUPER_ADMIN, STAFF, GURU | - | ack |
| POST | `/questions/:id/archive` | SUPER_ADMIN, STAFF, GURU | - | ack |
| POST | `/questions/:id/restore` | SUPER_ADMIN, STAFF, GURU | - | ack |
| POST | `/questions/:id/unpublish` | SUPER_ADMIN, STAFF, GURU | - | ack |
| POST | `/questions/:id/clone` | SUPER_ADMIN, STAFF, GURU | - | question |
| GET | `/questions/export` | SUPER_ADMIN, STAFF, GURU | - | CSV |
| POST | `/questions/import` | SUPER_ADMIN, STAFF, GURU | multipart (docx/pdf) | import job |
| GET | `/questions/:id/options` | read | - | options |
| PUT | `/questions/:id/options` | SUPER_ADMIN, STAFF, GURU | `{options:[...]}` | options |
| GET | `/questions/:id/revisions` | read | - | history |

Question shape: `{ id, content, options:[{id,text,is_correct?}], difficulty, question_type,
status, source, explanation, blocks?:[...], image_url?, ... }`.

Source tables: `question.question`, `question.question_version`,
`question.question_block`, `question.question_option`, `question.question_metadata`,
`question.question_status`, join `question.question_subject/_grade/_chapter`.

## Content (generic authoring containers)

| Method | Path | Role | Body | Returns |
|---|---|---|---|---|
| GET | `/contents` | any auth | `?content_type=&grade_id=&subject_id=` | contents |
| GET | `/contents/:id` | any auth | - | content |
| GET | `/contents/:id/subtype` | any auth | - | subtype |
| POST | `/contents` | SUPER_ADMIN, STAFF, GURU | `{content_type, title, ...}` | content |
| PUT | `/contents/:id` | SUPER_ADMIN, STAFF, GURU | content payload | content |
| DELETE | `/contents/:id` | SUPER_ADMIN, STAFF, GURU | - | ack |

Dispatches by `content_type` to `content.material`, `question.question`, or `cbt.exam`.

Source tables: `content.material`/`content.material_version`/`material_block`,
`question.question`, `cbt.exam`.

## Material

| Method | Path | Role | Returns |
|---|---|---|---|
| GET | `/material` | SUPER_ADMIN, STAFF, GURU, SISWA | materials |
| POST | `/material` | SUPER_ADMIN, STAFF, GURU | material |
| GET | `/material/:id` | SUPER_ADMIN, STAFF, GURU, SISWA | material |
| PUT | `/material/:id` | SUPER_ADMIN, STAFF, GURU | material |
| DELETE | `/material/:id` | SUPER_ADMIN, STAFF, GURU | ack |
| PATCH | `/material/:id/publish` | SUPER_ADMIN, STAFF, GURU | ack |
| PATCH | `/material/:id/archive` | SUPER_ADMIN, STAFF, GURU | ack |
| POST | `/material/:id/progress` | SISWA | `{progress, completed, last_position}` | progress |
| GET | `/material/:id/progress` | SISWA | - | progress |
| GET | `/material/progress` | SISWA | - | progress list |

Source tables: `content.material`, `content.material_version`,
`content.material_block`, `content.learning_progress`, `content.material_statistics`.

## Products: Exam / Exam Packages / CBT runtime

### cbt_engine — Exam authoring (`/exams`)

| Method | Path | Role | Body |
|---|---|---|---|
| POST | `/exams` | write | exam payload |
| POST | `/exams/import` | write | import payload |
| GET | `/exams` | auth | - |
| GET | `/exams/:id` | auth | - |
| PUT | `/exams/:id` | write | exam payload |
| DELETE | `/exams/:id` | write | - |
| POST | `/exams/:id/questions` | write | `{question_id, score}` |
| DELETE | `/exams/:id/questions/:questionId` | write | - |
| PUT | `/exams/:id/questions/reorder` | write | `{order:[ids]}` |
| POST | `/exams/:id/blueprint` | write | blueprint |
| GET | `/exams/:id/blueprint` | auth | - |
| POST | `/exams/:id/subject-blueprints` | write | per-subject blueprint |
| GET | `/exams/:id/subject-blueprints` | auth | - |
| POST | `/exams/:id/participants` | write | `{participants:[{userId, gradeId}]}` |
| DELETE | `/exams/:id/participants/:userId` | write | - |
| GET | `/exams/:id/participants` | auth | - |
| POST | `/exams/:id/attempts/start` | SISWA | - |
| POST | `/exams/:id/attempts/start-with-blueprints` | SISWA | - |
| POST | `/exams/:id/attempts/start-tag-based` | SISWA | `{tag_filter}` |
| GET | `/exams/attempts/:attemptId` | SISWA | - |
| POST | `/exams/attempts/:attemptId/submit` | SISWA | `{answers}` |
| POST | `/exams/attempts/:attemptId/grade` | SUPER_ADMIN, STAFF, GURU | - |
| GET | `/exams/:id/publish` | write | publish |
| GET | `/exams/:id/schedule` | auth | - |
| GET | `/exams/:id/analytics` | auth | - |
| GET | `/exams/:id/rule` | auth | - |
| GET | `/exams/:id/clone` | write | - |

### cbt_runtime — student session (`/cbt`)

| Method | Path | Role | Body |
|---|---|---|---|
| GET | `/cbt/sessions` | SISWA | - |
| POST | `/cbt/:exam_id/start` | SISWA | - |
| POST | `/cbt/:session_id/sync` | SISWA | `{answers}` |
| POST | `/cbt/:session_id/navigate` | SISWA | `{question_id}` |
| POST | `/cbt/:session_id/pause` | SISWA | - |
| POST | `/cbt/:session_id/resume` | SISWA | - |
| POST | `/cbt/:session_id/finish` | SISWA | - |
| POST | `/cbt/:session_id/violation` | SISWA | `{event}` |
| GET | `/cbt/:session_id/answers` | SISWA | - |
| GET | `/cbt/:session_id/questions` | SISWA | - |
| GET | `/cbt/:session_id/review` | SISWA | - |

Source tables: `cbt.exam`, `cbt.exam_attempt`, `cbt.attempt_question`,
`cbt.attempt_option`, `cbt.student_answer`, `cbt.grading_result`,
`cbt.grading_detail`, `cbt.exam_timer`, `cbt.cheating_log`, `question.question`.

## Exam-Practice (`/exam-practice`, from cbt_engine)

| Method | Path | Role | Body | Returns |
|---|---|---|---|---|
| POST | `/exam-practice/material/:materialId` | SISWA (GURU/STAFF) | `{questions_count}` | session (201) |
| POST | `/exam-practice/subject` | SISWA | `{subject_id, grade_id, questions_count}` | 201 |
| POST | `/exam-practice/tags` | SISWA | `{tag_filter, questions_count}` | 201 |
| POST | `/exam-practice/:sessionId/submit` | SISWA | `{answers:[{question_content_id, selected_option_ids}]}` | graded |
| GET | `/exam-practice/:sessionId` | SISWA | - | session + results |

Source tables: `content.practice_session`, `question.question`,
`cbt.attempt_question`, `cbt.attempt_option`.

> **Route note:** the generic practice (below) uses `/practice/sessions`; the exam
> practice above uses `/exam-practice`. They are distinct prefixes and do not collide.

## Practice (standalone, `/practice`)

| Method | Path | Role | Body | Returns |
|---|---|---|---|---|
| POST | `/practice/sessions/start` | SISWA | `{subject_id, chapter_id?, question_count?, difficulty?}` | 201 |
| POST | `/practice/sessions/:id/answer` | SISWA | `{question_id, answer, time_spent?}` | feedback |
| GET | `/practice/sessions` | SISWA | `?subject_id=&page=&limit=` | paginated |
| GET | `/practice/sessions/:id` | SISWA | - | session |
| GET | `/practice/stats` | SISWA | - | stats |

Source tables: `content.practice_session` (master), `question.question`,
`question.question_option`, `academic.subject`.

## Results / Scoring

| Method | Path | Role | Returns |
|---|---|---|---|
| GET | `/results` | SISWA | my results |
| GET | `/results/:session_id` | SISWA | result by session |

Source tables: `cbt.exam_attempt`, `cbt.grading_result`, `cbt.grading_detail`,
`question.question`, `academic.subject`.

## Analytics

| Method | Path | Role | Returns |
|---|---|---|---|
| GET | `/analytics/exams/:id` | SISWA/STAFF/GURU | exam analytics |
| GET | `/analytics/students/:id` | SISWA/STAFF/GURU | student analytics |
| GET | `/analytics/questions/:id` | SISWA/STAFF/GURU | question analytics |
| GET | `/analytics/leaderboard/subject/:subject_id` | public auth | leaderboard |
| GET | `/analytics/students/:id/timeline` | SISWA/STAFF/GURU | timeline |
| GET | `/analytics/exams/:id/difficulty` | SISWA/STAFF/GURU | difficulty |
| GET | `/analytics/admin/overview` | SUPER_ADMIN | overview |
| GET | `/analytics/admin/reports/exams` | SUPER_ADMIN | reports |
| GET | `/analytics/admin/reports/exams/:id` | SUPER_ADMIN | report |
| GET | `/analytics/school/stats` | SUPER_ADMIN | school stats |

Source tables: `cbt.*`, `analytics.*`, `academic.subject`, `question.question`,
`ranking.*`.

## Dashboard

| Method | Path | Role | Returns |
|---|---|---|---|
| GET | `/dashboard/student` | SISWA | student dashboard |
| GET | `/dashboard/teacher` | GURU/STAFF | teacher dashboard |
| GET | `/dashboard/admin` | SUPER_ADMIN | admin dashboard |

## Ranking

| Method | Path | Role | Returns |
|---|---|---|---|
| GET | `/ranking/leaderboard` | SISWA/STAFF/GURU/STAFF | leaderboard |
| GET | `/ranking/leaderboard?month=` | SISWA/STAFF/GURU/STAFF | filtered |

Source tables: `ranking.leaderboard_entry`, `ranking.subject_ranking`,
`cbt.exam_attempt`, `cbt.grading_result`.

## Profile / Targets

| Method | Path | Role | Body |
|---|---|---|---|
| GET | `/profile/targets` | SISWA | - |
| PUT | `/profile/targets` | SISWA | `{targets:[...]}` |
| GET | `/profile/certificates` | SISWA | - |
| GET | `/profile/certificates/:id/download` | SISWA | file |

Source tables: `identity.student_target`, `identity.user_profile`,
`cbt.exam_attempt`, `cbt.grading_result`.

## Target Schools

| Method | Path | Role |
|---|---|---|
| GET | `/target-schools` | SUPER_ADMIN, STAFF |
| GET | `/target-schools/:id` | SUPER_ADMIN, STAFF |
| POST | `/target-schools` | SUPER_ADMIN, STAFF |
| PUT | `/target-schools/:id` | SUPER_ADMIN, STAFF |
| DELETE | `/target-schools/:id` | SUPER_ADMIN, STAFF |

Source table: `academic.target_school`.

## Subscription / Finance

| Method | Path | Role |
|---|---|---|
| GET | `/subscriptions/stats` | SUPER_ADMIN, STAFF, FINANCE, INVESTOR |
| GET | `/subscriptions/plans` | SUPER_ADMIN, STAFF, FINANCE, INVESTOR |
| POST | `/subscriptions/plans` | SUPER_ADMIN, STAFF |
| GET | `/subscriptions/plans/:id` | SUPER_ADMIN, STAFF, FINANCE, INVESTOR |
| PUT | `/subscriptions/plans/:id` | SUPER_ADMIN, STAFF |
| DELETE | `/subscriptions/plans/:id` | SUPER_ADMIN, STAFF |
| GET | `/subscriptions/users` | SUPER_ADMIN, STAFF, FINANCE, INVESTOR |

Source tables: `finance.membership_package`, `finance.user_membership`,
`finance.subscription`, `finance.package_feature`, `finance.invoice`.

## Media

| Method | Path | Role |
|---|---|---|
| GET | `/media` | SUPER_ADMIN, STAFF, GURU |
| POST | `/media/upload` | SUPER_ADMIN, STAFF, GURU |
| GET | `/media/entity/:type/:id` | auth |
| GET | `/media/:id` | auth |
| DELETE | `/media/:id` | SUPER_ADMIN, STAFF, GURU |

Source tables: `media.asset`, `media.asset_version`, `media.asset_storage`,
`media.asset_reference`.

## School

| Method | Path | Role |
|---|---|---|
| GET | `/school` | SUPER_ADMIN, STAFF |
| POST | `/school` | SUPER_ADMIN, STAFF |
| GET | `/school/:id` | auth |
| PUT | `/school/:id` | SUPER_ADMIN, STAFF |
| PATCH | `/school/:id/status` | SUPER_ADMIN, STAFF |
| DELETE | `/school/:id` | SUPER_ADMIN, STAFF |
| GET | `/school/:id/settings` | auth |
| PUT | `/school/:id/settings` | SUPER_ADMIN, STAFF |
| GET | `/school/:id/branding` | auth |
| PUT | `/school/:id/branding` | SUPER_ADMIN, STAFF |

Source tables: `academic.school`, `academic.student_enrollment`,
`academic.school_class`, `academic.school_settings` (settings/branding).

## Notification

| Method | Path | Role |
|---|---|---|
| GET | `/notifications` | any auth |
| GET | `/notifications/unread-count` | any auth |
| GET | `/notifications/:id` | any auth |
| POST | `/notifications/:id/read` | any auth |
| POST | `/notifications/:id/archive` | any auth |
| DELETE | `/notifications/:id` | any auth |
| POST | `/notifications/read-all` | any auth |
| POST | `/notifications/send` | SUPER_ADMIN, STAFF |
| POST | `/notifications/broadcast` | SUPER_ADMIN, STAFF |
| GET | `/notifications/preferences` | any auth |
| PUT | `/notifications/preferences/:channel` | any auth |
| GET | `/notifications/templates` | SUPER_ADMIN, STAFF |
| POST | `/notifications/templates` | SUPER_ADMIN, STAFF |
| PUT | `/notifications/templates/:id` | SUPER_ADMIN, STAFF |
| DELETE | `/notifications/templates/:id` | SUPER_ADMIN, STAFF |

Source tables: `notification.user_notification`,
`notification.notification_preferences`, `notification.notification_template`,
`notification.notification_history`.

## AI

| Method | Path | Role |
|---|---|---|
| POST | `/ai/tutor/chat` | any auth |
| POST | `/ai/tutor/conversations` | any auth |
| GET | `/ai/tutor/conversations/:id` | any auth |
| DELETE | `/ai/tutor/conversations/:id` | any auth |
| POST | `/ai/generate-question` | any auth |
| POST | `/ai/parse-questions` | SUPER_ADMIN, STAFF |
| GET | `/ai/config` | SUPER_ADMIN, STAFF |
| PUT | `/ai/config` | SUPER_ADMIN, STAFF |
| POST | `/ai/test-connection` | SUPER_ADMIN, STAFF |
| GET | `/ai/tutor/admin/conversations` | SUPER_ADMIN, STAFF |
| GET | `/ai/tutor/admin/stats` | SUPER_ADMIN, STAFF |
| DELETE | `/ai/tutor/admin/conversations/:id` | SUPER_ADMIN, STAFF |

## Audit Logs

| Method | Path | Role |
|---|---|---|
| GET | `/audit-logs/stats` | SUPER_ADMIN, STAFF |
| GET | `/audit-logs` | SUPER_ADMIN, STAFF |
| POST | `/audit-logs` | SUPER_ADMIN, STAFF |

Source table: `audit.audit_log`.

## Admin

| Method | Path | Role |
|---|---|---|
| GET | `/admin/health` | SUPER_ADMIN |
| GET | `/admin/logs` | SUPER_ADMIN |

## Exam Packages

| Method | Path | Role |
|---|---|---|
| GET | `/exam-packages` | SUPER_ADMIN, STAFF, GURU |
| POST | `/exam-packages` | SUPER_ADMIN, STAFF, GURU |
| PUT | `/exam-packages/:id` | SUPER_ADMIN, STAFF, GURU |
| DELETE | `/exam-packages/:id` | SUPER_ADMIN, STAFF, GURU |
| GET | `/exam-packages/:id/exams` | SUPER_ADMIN, STAFF, GURU |
| POST | `/exam-packages/:id/exams` | SUPER_ADMIN, STAFF, GURU |
| DELETE | `/exam-packages/:id/exams/:examContentId` | SUPER_ADMIN, STAFF, GURU |

Source tables: `cbt.exam_package`, `cbt.exam_package_question`.

## CMS

| Method | Path | Role |
|---|---|---|
| GET | `/cms/pages` | auth read |
| POST | `/cms/pages` | authoring |
| GET | `/cms/pages/slug/:slug` | public |
| GET | `/cms/pages/:id` | auth read |
| PUT | `/cms/pages/:id` | authoring |
| DELETE | `/cms/pages/:id` | authoring |
| POST | `/cms/pages/:id/publish` | authoring |
| POST | `/cms/pages/:id/approve` | authoring |
| POST | `/cms/pages/:id/review` | authoring |
| POST | `/cms/pages/:id/version` | authoring |
| GET | `/cms/pages/:id/versions` | auth read |
| PUT | `/cms/pages/:id/seo` | authoring |
| GET | `/cms/posts` | auth read |
| POST | `/cms/posts` | authoring |
| GET | `/cms/posts/slug/:slug` | public |
| GET | `/cms/posts/:id` | auth read |
| PUT | `/cms/posts/:id` | authoring |
| DELETE | `/cms/posts/:id` | authoring |
| POST | `/cms/posts/:id/publish` | authoring |
| GET | `/cms/categories` | auth read |
| POST | `/cms/categories` | authoring |
| PUT | `/cms/categories/:id` | authoring |
| DELETE | `/cms/categories/:id` | authoring |
| GET | `/cms/tags` | auth read |
| POST | `/cms/tags` | authoring |
| PUT | `/cms/tags/:id` | authoring |
| DELETE | `/cms/tags/:id` | authoring |
| GET | `/cms/settings` | auth read |
| GET | `/cms/settings/:key` | public |
| PUT | `/cms/settings/:key` | authoring |
| GET | `/cms/faqs` | public |
| POST | `/cms/faqs` | auth |
| PUT | `/cms/faqs/:id` | auth |
| DELETE | `/cms/faqs/:id` | auth |
| GET | `/cms/banners` | public |
| POST | `/cms/banners` | auth |
| PUT | `/cms/banners/:id` | auth |
| DELETE | `/cms/banners/:id` | auth |
| GET | `/cms/news` | public |
| POST | `/cms/news` | auth |
| PUT | `/cms/news/:id` | auth |
| DELETE | `/cms/news/:id` | auth |
| POST | `/cms/news/:id/publish` | auth |

**authoring** = SUPER_ADMIN, STAFF, GURU (GURU may edit/delete only own content).
Source tables: `cms.*` schema.