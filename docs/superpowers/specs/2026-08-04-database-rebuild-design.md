# YakinLulus.id — Database Rebuild (Design Document)

- Tanggal: 2026-08-04
- Status: DRAFT — menunggu approval sebelum implementasi
- Scope: **Postgres schema hanya** (schema `public` lama di-drop, namespace per domain baru). Migrasi backend + kode di luar scope dokumen ini.
- Keputusan user: drop semua & rebuild big-bang; tanpa migrasi data; per-domain schema namespace; ikuti urutan fase.

---

## 1. Ringkasan Arsitektur

Database dibangun ulang dari nol menjadi **arsitektur multi-schema (bounded-context)**, total **±626 tabel** tersebar dalam **21 namespace** Postgres:

```
identity    - user, RBAC/ABAC, auth, audit dasar
academic    - kurikulum, jenjang, mapel, sekolah, kalender
question    - bank soal, versi, blok konten, import, statistik
cbt         - engine ujian (sesi, attempt, grading, proctor, offline)
content     - materi pembelajaran (LCMS)
media       - asset management (DAM)
finance     - membership, langganan, invoice, payment, wallet, voucher
ranking     - leaderboard snapshot + event-driven
analytics   - event store + snapshot agregasi
cms         - website/blog/media
notification- template, queue, delivery, preference, device
ocr         - pipeline import/OCR/AI parsing
ai          - AI tutor, chat, prompt, knowledge base, RAG, usage
report      - definisi, job, ekspor, scheduler, snapshot
queue       - scheduler & job queue, workflow, distributed lock
search      - FTS + pgvector
config      - system configuration
audit       - logging & audit (append-only)
integration - API provider, webhook, OAuth, idempotency
monitoring  - service health, metric, alert, SLA
shared      - enum, helper, migration tooling (bukan namespace bisnis)
```

PK seluruh tabel: **UUID v7** (`gen_random_uuid()` default — atau `uuidv7()` helper bila diinginkan).

---

## 2. Global Conventions (Global Constraints)

Semua tabel WAJIB mematuhi konvensi ini. Konvensi ini bagian dari setiap fase dan tidak boleh dilanggar:

1. **Primary key**: `id uuid PRIMARY KEY DEFAULT gen_random_uuid()` di SETIAP tabel (kecuali junction yang memakai composite PK).
2. **Nama**: tabel & kolom `snake_case`, singular (mis. `question`, bukan `questions`). Prefix schema = domain (mis. `question`), sehingga nama tabel TIDAK perlu mengulang domain (pakai `question.question`), kecuali menghindari ambigu (mis. `content.material`).
3. **Timestamp**: `created_at timestamptz NOT NULL DEFAULT NOW()` wajib. `updated_at timestamptz NOT NULL DEFAULT NOW()` untuk tabel mutable. Semua tipe waktu `timestamptz` (UTC).
4. **Soft delete**: tabel master (users, role, organization, question, material, dst.) punya `deleted_at timestamptz NULL`. Pengecualian: tabel transaksi/log.
5. **Audit**: kolom `created_by uuid REFERENCES identity.user(id)`, `updated_by uuid` pada tabel master yang dikelola user. Log audit terperinci tidak disimpan inline — lewat domain `audit`.
6. **Enum**: gunakan `text` + `CHECK (col IN (...))` ATAU domain/custom type per schema bila dipakai luas. Hindari VARCHAR dengan nilai berubah. Status flow ditulis huruf besar (mis. `DRAFT|REVIEW|APPROVED|PUBLISHED|ARCHIVED`).
7. **FK**: `ON DELETE` dievaluasi per relasi (CASCADE untuk child/junction, RESTRICT/SET NULL untuk referensi master). Junction pakai composite PK `(a_id, b_id)`.
8. **JSONB** untuk data dinamis/metadata (old_data/new_data, konfigurasi, dsb.).
9. **Indeks**: indeks semua FK + kolom filter umum. Indeks komposit untuk query panas (mis. `(user_id, status)`, `(event_time DESC)`).
10. **Partisi**: tabel volume tinggi (log, event, attempt jawaban, delivery) memakai `PARTITION BY RANGE` (bulanan/tahunan) dengan strategi dibuat di fase Foundation.
11. **Secure secret**: kredensial/secret (`api_key`, `client_secret`, `server_key`, token) TIDAK plaintext — simpan encrypted / pointer ke vault.
12. **Immutable log**: tabel log append-only; tanpa UPDATE/DELETE dari aplikasi.
13. **Naming FK**: kolom referensi = `<entity>_id`.
14. **Rata-rata numerik**: gunakan `numeric` untuk uang (`numeric(12,2)`), `numeric(5,2)` untuk persen/rating, `int/bigint` untuk count.
15. **Konvensi status umum**: `ACTIVE/INACTIVE`, `DRAFT/REVIEW/APPROVED/PUBLISHED/ARCHIVED`, `ENABLED/DISABLED` dipakai konsisten.

---

## 3. Urutan Fase Implementasi

Fase dieksekusi berurutan; tiap fase = satu plan + satu set migrasi + verifikasi. FK antar-domain harus mengikuti urutan ini (boleh mereferensi tabel yang sudah ada).

1. **Phase 0 — Foundation**: drop seluruh schema `public` lama, buat helper/fungsi (uuid, updated_at trigger), pola audit/soft-delete, konvensi, seed enum inti.
2. **Phase 1 — Identity** (`identity`): user, profile, auth, RBAC/ABAC, org, audit dasar. 35 tabel.
3. **Phase 2 — Academic** (`academic`): kurikulum → jenjang → mapel → bab/topik, sekolah, kalender. 23 tabel.
4. **Phase 3 — Media** (`media`): asset, storage, versi, kategori, referensi. 30 tabel.
5. **Phase 4 — Question** (`question`): bank soal + versi + blok + import + statistik. 38 tabel. (Menghapus dual-schema legacy.)
6. **Phase 5 — CBT** (`cbt`): engine ujian. 55 tabel. (Menggantikan `exam_*` legacy.)
7. **Phase 6 — Content** (`content`): materi/LCMS. 46 tabel.
8. **Phase 7 — Finance** (`finance`): membership, payment, wallet, voucher. 24 tabel.
9. **Phase 8 — Ranking** (`ranking`): 25 tabel (snapshot + event-driven).
10. **Phase 9 — Analytics** (`analytics`): 20 tabel (event store + snapshot).
11. **Phase 10 — Notification** (`notification`): 20 tabel.
12. **Phase 11 — Queue & Scheduler** (`queue`): 35 tabel.
13. **Phase 12 — AI** (`ai`): AI tutor, chat, RAG. (+ katalog konseptual, detail ditulis di fase ini.)
14. **Phase 13 — OCR** (`ocr`): pipeline import. 28 tabel.
15. **Phase 14 — Report** (`report`): 24 tabel.
16. **Phase 15 — Search** (`search`): 22 tabel.
17. **Phase 16 — Config** (`config`): 52 tabel.
18. **Phase 17 — Audit & Logging** (`audit`): 62 tabel.
19. **Phase 18 — Integration** (`integration`): 28 tabel.
20. **Phase 19 — Monitoring** (`monitoring`): 28 tabel.
21. **Phase 20 — CMS** (`cms`): 31 tabel.

> Catatan: phase bisa dijalankan paralel untuk domain yang saling independen (mis. media/notification/queue) setelah Phase 0–2 selesai.

---

## 4. Katalog Tabel per Domain

### 4.1 `identity` — User & Access Management (35)

- **user** — akun inti. username, email, phone, password_hash, status(ACTIVE|INACTIVE|LOCKED|PENDING), avatar, last_login_at, email_verified, phone_verified, created_at, updated_at, deleted_at. Unik email/username/phone.
- **user_profile** — data personal (full_name, gender, birth_place, birth_date, religion, nationality, photo, bio, language, timezone). 1:1 user.
- **user_address** — province, city, district, village, postal_code, address, latitude, longitude. 1:1 user.
- **user_identity** — identity_type, identity_number, issued_date, expired_date, is_verified.
- **organization** — code, name, type(SYSTEM|SCHOOL|PARTNER|COMPANY), description, status, deleted_at.
- **organization_member** — organization_id, user_id, joined_at, status.
- **role** — code(SUPER_ADMIN|STAFF|FINANCE|GURU|SISWA|ORTU|CS|AI), name, description, priority, is_system.
- **permission_module** — code(QUESTION|EXAM|MATERIAL|FINANCE|MEMBERSHIP|AI|USER|REPORT|SETTING), name, icon, sort_order.
- **permission_resource** — module_id, code(QUESTION_BANK|QUESTION|...), nama resource.
- **permission** — resource_id, code(`question.create`), action granular.
- **role_permission** — role_id, permission_id, allow. Composite PK.
- **user_role** — user_id, role_id, organization_id, start_date, end_date, is_primary.
- **permission_scope** — code(SELF|CLASS|SCHOOL|REGIONAL|NATIONAL|GLOBAL) utk ABAC.
- **user_permission_override** — user_id, permission_id, allow.
- **menu** — parent_id(self), title, icon, route, sort_order, is_visible.
- **role_menu** — role_id, menu_id. Composite PK.
- **login_session** — user_id, access_token, refresh_token, expired_at, logout_at, ip, device, browser, os.
- **device** — user_id, device_uuid, device_name, platform, last_active.
- **trusted_device** — device_id, verified_at.
- **otp_request** — user_id, type(EMAIL|SMS|WA), code, expired_at, verified_at.
- **password_history** — user_id, password_hash.
- **password_reset** — user_id, token, expired_at, used_at.
- **email_verification** — user_id, token, expired_at, verified_at.
- **api_token** — user_id, token, scope, expired_at, last_used.
- **login_history** — user_id, login_time, logout_time, ip, country, city, browser, device, status(FAILED|SUCCESS). Partisi bulanan.
- **activity_log** — user_id, module, action, entity, entity_id, old_data(jsonb), new_data(jsonb). Partisi bulanan.
- **security_log** — user_id, event(FAILED_LOGIN|OTP|PASSWORD_CHANGE|ROLE_CHANGE|MFA), ip. Partisi bulanan.
- **notification_preference** — user_id, email, push, sms, whatsapp.
- **user_setting** — theme, language, timezone, dashboard_layout.
- **user_preference** — favorite_subject, difficulty, study_target, daily_target, learning_style.
- **user_status_history** — old_status, new_status, reason, changed_by.
- **impersonation_log** — admin_id, target_user_id, reason, started_at, ended_at.
- **mfa_configuration** — user_id, method(TOTP|EMAIL|SMS|WA), secret, is_enabled.
- **refresh_token_blacklist** — token, expired_at.
- **user_agreement** — user_id, agreement_type(PRIVACY|TERM), version, accepted_at.

### 4.2 `academic` — Master Akademik (23)

- **academic_year** — code, name, start_date, end_date, is_active.
- **semester** — academic_year_id, name, order_no, start_date, end_date, is_active.
- **education_level** — code(SD|SMP|SMA|SMK|GAPYEAR), name, sort_order, icon, color.
- **grade** — education_level_id, code(4|5|6|7|8|9|10|11|12|GY), name, sort_order.
- **major** — education_level_id, code(IPA|IPS|BAHASA|TKJ|RPL|AKL|DKV), name, description, is_active.
- **curriculum** — code(K13|MERDEKA|UTBK|AKM|TKA), name, version, effective_year, description, is_active.
- **subject** — code(MAT|BIO|FIS|KIM|IND|ENG), name, description, icon, color, is_active.
- **curriculum_subject** — curriculum_id, subject_id, education_level_id, grade_id, major_id, semester_id, is_required, credit, sort_order. Unik kombinasi.
- **chapter** — curriculum_subject_id, code, title, order_no, description, estimated_minutes, is_active.
- **subchapter** — chapter_id, code, title, order_no, description, estimated_minutes.
- **competency** — chapter_id, code(KD 3.1|CP-01), title, description, difficulty_level, is_active.
- **learning_outcome** — competency_id, title, description, blooms_level(REMEMBER..CREATE).
- **topic** — subchapter_id, name, description, order_no.
- **skill** — code(NUMERIC|LOGIC|READING|ANALYSIS|WRITING), name.
- **topic_skill** — topic_id, skill_id. Composite PK.
- **learning_path** — grade_id, subject_id, title, description, estimated_hours.
- **learning_path_topic** — learning_path_id, topic_id, sequence_no.
- **academic_event** — academic_year_id, semester_id, title, event_type(PTS|PAS|LIBUR|PPDB|UTBK|AKM|TKA), start_date, end_date.
- **school** — npsn, name, province, city, district, address, phone, email, website, is_active.
- **school_class** — school_id, grade_id, major_id, academic_year_id, name, capacity.
- **teacher_subject** — teacher_id, school_id, subject_id, grade_id, major_id.
- **teacher_homeroom** — teacher_id, school_class_id, academic_year_id.
- **academic_configuration** — active_academic_year, active_semester, default_curriculum, grading_method, minimum_score, passing_score, max_exam_retry.

### 4.3 `media` — Asset Management / DAM (30)

- **asset** — asset_code, original_name, display_name, asset_type_id, mime_type, extension, size, checksum_sha256, storage_id, current_version_id, visibility(PUBLIC|PRIVATE|PROTECTED), status(ACTIVE|ARCHIVED|DELETED), uploaded_by, deleted_at. Unik asset_code & checksum.
- **asset_version** — asset_id, version, file_name, storage_path, file_size, checksum, uploaded_by, change_note. Unik (asset_id, version).
- **asset_type** — code(IMAGE|VIDEO|AUDIO|PDF|DOCUMENT|SPREADSHEET|PRESENTATION|ZIP|FONT|MODEL|OTHER), name, icon.
- **asset_category** — parent_id(self), code(QUESTION|MATERIAL|PROFILE|CERTIFICATE|THUMBNAIL|AI|SYSTEM|EXPORT|BACKUP), name.
- **asset_folder** — parent_id, organization_id, name, description, path, created_by. Unik (parent_id, name).
- **asset_folder_item** — folder_id, asset_id. Composite PK.
- **asset_tag** — name, color.
- **asset_tag_map** — asset_id, tag_id. Composite PK.
- **asset_metadata** — asset_id, width, height, duration, pages, dpi, language, camera, gps, json_metadata(jsonb).
- **asset_storage** — provider_id, bucket, storage_path, public_url, cdn_url, region, status.
- **storage_provider** — code(SUPABASE|S3|MINIO|AZURE|GCS|LOCAL), name, endpoint.
- **asset_thumbnail** — asset_id, size, path, width, height.
- **asset_preview** — asset_id, preview_path, generated_at.
- **asset_conversion** — asset_id, source_format, target_format, status, output_asset_id.
- **asset_relation** — parent_asset_id, child_asset_id, relation_type. Unik triple.
- **asset_reference** — asset_id, module, entity, entity_id (polimorfik). Indeks (module, entity, entity_id).
- **asset_permission** — asset_id, role_id, permission(READ|WRITE|DELETE|DOWNLOAD).
- **asset_share** — asset_id, token, expired_at, password_hash, max_download.
- **asset_download** — asset_id, user_id, download_time, ip, device.
- **asset_usage** — asset_id, module, entity, entity_id, used_at.
- **asset_archive** — asset_id, archive_reason, archived_by, archived_at.
- **asset_delete_queue** — asset_id, scheduled_delete, status.
- **asset_scan** — asset_id, engine, status, scan_result, scanned_at.
- **asset_ai_analysis** — asset_id, provider, analysis_type(OCR|QUESTION_PARSE|IMAGE_CLASSIFY), result_json.
- **asset_processing_job** — asset_id, job_type(OCR|TRANSCODE|THUMBNAIL|INDEX), status, started_at, finished_at.
- **asset_audit_log** — asset_id, user_id, action(UPLOAD|UPDATE|DELETE|DOWNLOAD|RESTORE).
- **cdn_provider** — name, endpoint, region, enabled.
- **asset_cache** — asset_id, cache_key, expired_at. Unik cache_key.
- **asset_favorite** — asset_id, user_id. Composite PK.
- **asset_comment** — asset_id, user_id, comment.

### 4.4 `question` — Bank Soal (38)

- **question** — question_code, question_type_id, current_version_id, status_id, owner_id, created_by, updated_by, deleted_at. (identitas saja; isi di versi/blok)
- **question_version** — question_id, version_no, change_summary, created_by, is_current. Unik (question_id, version_no).
- **question_metadata** — question_id, estimated_time, difficulty_level, blooms_level, cognitive_level, language, source_type, source_name, publication_year, reference_code, is_hots, is_calculator_allowed, is_randomizable.
- **question_status** — code(DRAFT|REVIEW|REVISION|APPROVED|PUBLISHED|ARCHIVED).
- **question_history** — question_id, action, changed_by, old_json, new_json.
- **question_block** — question_version_id, block_order, block_type(PARAGRAPH|IMAGE|TABLE|LATEX|SVG|AUDIO|VIDEO|GRAPH|CODE|HTML|MARKDOWN), content, asset_id, style_json.
- **question_option** — question_version_id, label(A..E), score, is_correct, display_order.
- **option_block** — option_id, block_order, block_type, content, asset_id, style_json.
- **explanation** — question_version_id.
- **explanation_block** — explanation_id, block_order, block_type, content, asset_id.
- **hint** — question_version_id, hint_order, content.
- **solution_step** — question_version_id, step_no, title, content, asset_id.
- **question_subject / question_grade / question_major / question_curriculum / question_chapter / question_subchapter / question_topic / question_competency / question_skill / question_tag** — junction N:M ke domain academic. Composite PK.
- **question_review** — question_id, reviewer_id, status, comment, reviewed_at.
- **question_approval** — question_id, approved_by, approved_at, approval_note.
- **question_validation_issue** — question_id, issue_type, severity, description, resolved.
- **question_duplicate** — question_id, duplicate_question_id, similarity_score.
- **question_exam** — junction ke cbt.exam.
- **question_practice** — junction ke content.practice_set.
- **question_learning_material** — junction ke content.material.
- **question_ai_usage** — question_id, ai_model, generated_at.
- **question_statistics** — question_id, total_answer, correct, wrong, skip, accuracy.
- **question_irt** — question_id, parameter_a/b/c.
- **question_answer_distribution** — question_id, option_label, selected_count.
- **question_usage_counter** — question_id, exam_count, practice_count, favorite_count, report_count.
- **question_import_job** — file_id, status, started_at, finished_at.
- **question_import_row** — job_id, row_no, status, error_message.
- **question_ocr_result** — asset_id, ocr_json.
- **question_ai_parsing** — asset_id, model_name, result_json, confidence.

### 4.5 `cbt` — Engine Ujian (55)

- **exam** — exam_code, title, description, exam_type(TRYOUT|CBT|QUIZ|MID|FINAL|UTBK|AKM), status, owner_id, created_by. (identitas)
- **exam_metadata** — exam_id, duration_minute, passing_score, certificate, negative_marking, calculator_allowed, fullscreen_required, safe_browser, show_result, show_answer.
- **exam_status** — code(DRAFT|REVIEW|PUBLISHED|RUNNING|FINISHED|ARCHIVED).
- **exam_subject / exam_grade / exam_curriculum / exam_chapter / exam_topic / exam_competency / exam_tag** — junction N:M.
- **exam_package** — exam_id, name, random_seed.
- **exam_package_question** — package_id, question_id, question_order, score.
- **exam_question_pool** — exam_id, subject_id, chapter_id, difficulty, total_question.
- **exam_randomization** — exam_id, random_question, random_option, random_seed.
- **exam_random_log** — attempt_id, seed, hasil.
- **exam_schedule** — exam_id, start_time, end_time, timezone.
- **exam_session** — exam_id, session_name, capacity, token, location.
- **exam_proctor** — session_id, teacher_id.
- **exam_participant** — exam_id, student_id, status(REGISTER|READY|STARTED|FINISHED|ABSENT).
- **participant_package** — participant_id, package_id.
- **exam_attempt** — participant_id, attempt_no, started_at, finished_at, last_sync, status(REGISTERED→READY→STARTED→[PAUSED→RESUMED]→SUBMITTED→GRADING→COMPLETED).
- **attempt_question** — attempt_id, question_id, display_order, snapshot_version.
- **attempt_option** — attempt_question_id, option_label, display_order.
- **student_answer** — attempt_question_id, selected_option, answered_at.
- **essay_answer** — attempt_question_id, text_answer, asset_id.
- **answer_history** — student_answer_id, previous_value, changed_at.
- **navigation_log** — attempt_id, question_no, visited_at.
- **bookmark_question** — attempt_question_id.
- **question_time** — attempt_question_id, duration_second.
- **exam_timer** — attempt_id, remaining_second, last_update.
- **timer_history** — attempt_id, snapshot, waktu.
- **auto_submit** — attempt_id, reason(TIMEOUT|MANUAL|DISCONNECT|CHEATING).
- **grading_result** — attempt_id, score, correct, wrong, blank, passed.
- **essay_grading** — essay_answer_id, grader_id, score, comment, graded_at.
- **ai_grading** — attempt_question_id, model, score, confidence.
- **grading_detail** — attempt_question_id, question_id, status_correct, score, is_blank.
- **live_monitor** — attempt_id, current_question, remaining_time, status.
- **heartbeat** — attempt_id/client, waktu, status online.
- **connection_log** — attempt_id, event, waktu.
- **cheating_log** — attempt_id, event(TAB_CHANGE|COPY|PASTE|SCREENSHOT|WINDOW_BLUR), detail.
- **browser_log** — attempt_id, event (safe browser).
- **camera_log** — attempt_id, snapshot.
- **face_detection** — attempt_id, hasil, confidence.
- **microphone_detection** — attempt_id, hasil.
- **offline_sync** — attempt_id, last_sync, status.
- **sync_log** — attempt_id, hasil.
- **sync_conflict** — attempt_id, detail.
- **exam_statistics** — exam_id, average, highest, lowest, std_dev.
- **question_statistics** — question_id, statistik (dari domain question).
- **participant_statistics** — participant_id, agregat.
- **realtime_dashboard** — snapshot realtime.
- **exam_history / attempt_history / grading_history / publish_history** — audit append-only per entitas. Partisi bulanan.

### 4.6 `content` — Materi Pembelajaran / LCMS (46)

- **material** — material_code, title, slug, summary, material_type_id, current_version_id, status_id, owner_id, created_by, updated_by, published_at, deleted_at.
- **material_type** — code(ARTICLE|VIDEO|COURSE|MODULE|BOOK|PDF|AUDIO|SLIDE|INTERACTIVE|LIVE_CLASS).
- **material_status** — code(DRAFT|REVIEW|REVISION|APPROVED|PUBLISHED|ARCHIVED).
- **material_metadata** — material_id, estimated_minutes, reading_level, difficulty_level, language, is_premium, certificate_enabled, downloadable, printable.
- **material_version** — material_id, version_no, change_summary, created_by, is_current.
- **material_history** — material_id, old_json, new_json, changed_by.
- **material_block** — material_version_id, block_order, block_type(PARAGRAPH|IMAGE|VIDEO|AUDIO|LATEX|TABLE|SVG|GRAPH|CODE|HTML|MARKDOWN|QUIZ|CALLOUT|TIMELINE|EMBED|ACCORDION|CHECKLIST), content, asset_id, style_json.
- **material_section** — material_version_id, title, description, order_no.
- **material_section_block** — section_id, block_order, block_type, content, asset_id.
- **material_table_of_content** — material_id, parent_id(self), title, order_no.
- **material_subject / material_grade / material_major / material_curriculum / material_chapter / material_subchapter / material_topic / material_competency / material_skill / material_tag** — junction N:M.
- **material_attachment** — material_id, asset_id, attachment_type(PRIMARY|SUPPORT|DOWNLOAD).
- **material_thumbnail** — material_id, asset_id.
- **material_subtitle** — material_id, language, asset_id.
- **material_transcript** — material_id, content.
- **material_quiz** — material_id, title.
- **material_quiz_question** — quiz_id, question_id.
- **material_assignment** — material_id, title, instruction.
- **material_assignment_submission** — assignment_id, student_id, asset_id, submitted_at.
- **material_review** — material_id, reviewer_id, status, comment.
- **material_approval** — material_id, approved_by, approved_at.
- **material_validation** — material_id, issue_type, description.
- **learning_progress** — student_id, material_id, progress_percent, last_position, completed, completed_at.
- **material_session** — student_id, material_id, started_at, ended_at, duration_second.
- **material_bookmark** — student_id, material_id, block_id.
- **material_note** — student_id, material_id, block_id, note.
- **material_highlight** — student_id, block_id, start_offset, end_offset, color.
- **material_certificate** — material_id, certificate_template, passing_score.
- **student_certificate** — student_id, material_id, asset_id, issued_at.
- **material_statistics** — material_id, view_count, completion_count, average_duration, rating.
- **material_rating** — material_id, student_id, rating, review.
- **material_feedback** — material_id, student_id, feedback.
- **material_popularity** — material_id, score.
- **material_ai_summary** — material_id, summary.
- **material_ai_keyword** — material_id, keyword.
- **material_embedding** — material_id, embedding_id (pgvector).
- **material_recommendation** — material_id, recommended_material_id.

### 4.7 `finance` — Finance & Membership (24)

- **membership_package** — code, name, slug, package_type(trial|monthly|quarterly|semester|yearly|lifetime), level(basic|premium|pro|enterprise), duration_day, price numeric(12,2), discount_price, currency, max_device, max_login, max_student, max_teacher, is_trial, trial_day, is_active, is_featured, sort_order, created_by, updated_by, deleted_at.
- **package_feature** — membership_package_id, feature_code, feature_name, feature_value, is_unlimited. Unik (package, feature_code).
- **user_membership** — user_id, membership_package_id, invoice_id, subscription_id, status, active_from, expired_at, remaining_day, is_trial, auto_renew, renewal_count, cancel_reason, cancelled_at.
- **subscription** — user_id, membership_package_id, billing_cycle, next_billing_date, last_billing_date, status(ACTIVE|PAUSED|CANCELLED|EXPIRED|FAILED), payment_method, gateway, retry_count.
- **invoice** — invoice_number(unik), user_id, membership_id, subtotal, discount, voucher_discount, tax, service_fee, total, currency, status(DRAFT|UNPAID|PENDING|PAID|FAILED|EXPIRED|VOID|REFUND), issued_at, expired_at, paid_at. Partisi kuartalan.
- **payment** — invoice_id, user_id, payment_method, payment_channel, gateway, amount, fee, net_amount, currency, status, payment_time, gateway_reference, gateway_transaction_id(unik), approval_code. Partisi bulanan.
- **payment_transaction** — payment_id, event_type, gateway_status, request_payload, response_payload, signature, verified. Partisi bulanan.
- **payment_gateway_log** — gateway, endpoint, request, response, http_status, latency. Partisi bulanan.
- **wallet** — user_id(unik), balance, locked_balance, currency.
- **wallet_transaction** — wallet_id, reference_type, reference_id, transaction_type(TOPUP|PAYMENT|REFUND|BONUS|CASHBACK|WITHDRAW), amount, balance_before, balance_after, description. Partisi bulanan.
- **voucher** — code(unik), title, description, discount_type, discount_value, maximum_discount, minimum_purchase, usage_limit, usage_per_user, valid_from, valid_until, is_active.
- **user_voucher** — voucher_id, user_id, claimed_at, expired_at, status.
- **coupon_usage** — voucher_id, invoice_id, user_id, discount_amount, used_at.
- **refund** — payment_id, invoice_id, amount, reason, status, requested_by, approved_by, requested_at, approved_at, completed_at.
- **tax** — country, province, tax_name, tax_percentage, effective_from, effective_until, active.
- **commission** — reference_type, reference_id, user_id, school_id, amount, percentage, status, paid_at.
- **revenue_summary** — date(unik), gross_income, net_income, tax, refund, transaction_count, new_subscription, renewal, cancel. Partisi tahunan.
- **financial_report** — report_name, period_start, period_end, report_type, generated_by, file_url, generated_at.
- **financial_audit_log** — actor_id, actor_role, action, table_name, record_id, old_data, new_data, ip_address, device. Partisi bulanan.
- **payment_method** — code(unik), name, category, gateway, is_active, sort_order.
- **promotion** — title, description, start_date, end_date, discount_type, discount_value, maximum_discount, minimum_purchase, quota, remaining_quota, active.
- **recurring_billing** — subscription_id, scheduled_date, status, retry, processed_at.
- **finance_notification** — user_id, invoice_id, payment_id, notification_type, channel, status, sent_at.
- **finance_setting** — setting_key(unik), setting_value, description.

### 4.8 `ranking` — Ranking (25)

Mekanisme: raw score → formula versioned → snapshot leaderboard → cache Top-N → event-driven recalculation.

- **ranking_category** — category_code(unik), category_name, description, ranking_type(OVERALL|ACADEMIC|EXAM|PRACTICE|SUBJECT|SPEED|CONSISTENCY|ACHIEVEMENT|STREAK|CUSTOM), scope(GLOBAL|PROVINCE|CITY|SCHOOL|CLASS|GROUP), is_active.
- **ranking_period** — period_name, period_type(DAILY|WEEKLY|MONTHLY|QUARTERLY|SEMESTER|YEARLY|CUSTOM), start_date, end_date, is_closed.
- **leaderboard** — leaderboard_code(unik), leaderboard_name, category_id, period_id, scope, province_id, city_id, school_id, class_id, subject_id, exam_id, is_active.
- **leaderboard_entry** — leaderboard_id, user_id, rank_position, score, weighted_score, correct_answer, wrong_answer, unanswered, accuracy, average_score, average_duration, total_exam, total_practice, total_study_minutes, consistency_score, speed_score, achievement_score, streak_score, bonus_score, penalty_score, percentile, previous_rank, rank_change. Indeks (leaderboard_id, rank_position).
- **ranking_score** — user_id, category_id, subject_id, exam_session_id, score_type(EXAM|PRACTICE|HOMEWORK|TRYOUT|DAILY), raw_score, normalized_score, weighted_score, difficulty_factor, speed_factor, accuracy_factor, bonus_factor, penalty_factor, final_score, calculated_at.
- **ranking_formula** — formula_name, category_id, description, accuracy_weight, speed_weight, difficulty_weight, consistency_weight, streak_weight, achievement_weight, bonus_weight, penalty_weight, formula_expression, version, is_active.
- **ranking_calculation_job** — job_name, leaderboard_id, period_id, status(PENDING|RUNNING|SUCCESS|FAILED), total_user, processed_user, duration_ms.
- **ranking_history** — user_id, leaderboard_id, old_rank, new_rank, rank_difference, old_score, new_score, changed_reason.
- **user_rank_summary** — user_id(unik), global_rank, province_rank, city_rank, school_rank, class_rank, average_rank, best_rank, highest_score, total_leaderboard, last_updated.
- **subject_ranking** — user_id, subject_id, leaderboard_id, rank, score, accuracy, speed, exam_count, practice_count.
- **exam_ranking** — exam_id, exam_session_id, user_id, rank, score, correct_answer, wrong_answer, duration, percentile.
- **school_ranking** — school_id, leaderboard_id, rank, average_score, highest_score, participant_count, exam_count.
- **class_ranking** — class_id, leaderboard_id, rank, average_score, highest_score, participant_count.
- **province_ranking / city_ranking** — region_id, leaderboard_id, rank, average_score, participant_count.
- **ranking_reward** — leaderboard_id, minimum_rank, maximum_rank, reward_type(BADGE|POINT|COIN|CERTIFICATE|MEMBERSHIP|TROPHY), reward_value.
- **user_ranking_reward** — user_id, reward_id, leaderboard_id, received_at, claimed_at, status(PENDING|CLAIMED|EXPIRED).
- **ranking_badge** — badge_code(unik), badge_name, icon, color, description, level(BRONZE|SILVER|GOLD|PLATINUM|DIAMOND).
- **user_ranking_badge** — user_id, badge_id, leaderboard_id, earned_at.
- **ranking_achievement** — achievement_code(unik), achievement_name, score_bonus, description.
- **user_ranking_achievement** — user_id, achievement_id, earned_at.
- **ranking_streak** — user_id(unik), current_streak, longest_streak, total_day, last_activity, streak_score.
- **ranking_notification** — user_id, leaderboard_id, notification_type(RANK_UP|RANK_DOWN|NEW_BADGE|NEW_REWARD), title, message, is_read.
- **ranking_statistic** — leaderboard_id, participant_count, average_score, median_score, highest_score, lowest_score, standard_deviation, generated_at.
- **ranking_setting** — key(unik), value, description.

### 4.9 `analytics` — Analytics (20)

Mekanisme: append-only event store → background worker → snapshot harian → dashboard cache & materialized view.

- **analytics_events** — event_time, event_type, event_name, user_id, student_id, teacher_id, school_id, membership_id, exam_id, attempt_id, question_id, material_id, chapter_id, subject_id, class_id, device, browser, platform, os, app_version, ip_address, country, province, city, latitude, longitude, session_id, duration_second, metadata(jsonb). Partisi bulanan. Append-only.
- **analytics_student** — student_id, date, total_login, total_learning_time, total_exam, total_question, correct/wrong/empty_answer, average/highest/lowest_score, mastery_percentage, accuracy, speed_answer, streak_day, xp, level, ranking, coins, badge. Unik (date, student_id).
- **analytics_teacher** — teacher_id, date, total_student, active_student, total_exam_created, total_exam_approved, total_question_created, total_material_created, average_student_score, average_completion, average_learning_time.
- **analytics_school** — school_id, date, active_student, active_teacher, exam_count, learning_hour, average_score, average_completion, ranking.
- **analytics_exam** — exam_id, date, participant, finished, unfinished, average/highest/lowest_score, pass_rate, average_duration, average_correct/wrong/blank. Partisi bulanan.
- **analytics_question** — question_id, date, shown, answered, correct, wrong, blank, average_duration, difficulty_index, discrimination_index, reliability. Partisi bulanan.
- **analytics_material** — material_id, date, view, completed, download, bookmark, share, average_duration, completion_rate, drop_rate. Partisi bulanan.
- **analytics_subject** — subject_id, date, student, exam, average_score, average_accuracy, average_speed, completion.
- **analytics_chapter** — chapter_id, date, view, exercise, average_score, mastery, weakness(jsonb).
- **analytics_membership** — membership_package_id, date, new_user, renewal, expired, cancel, active, conversion_rate.
- **analytics_finance** — date(unik), gross_income, net_income, transaction, refund, failed_payment, average_transaction, arpu, ltv, mrr, arr. Partisi tahunan.
- **analytics_daily_summary** — date(unik), new_user, active_user, new_student, new_teacher, exam_count, question_answered, material_view, membership_purchase, income. Partisi tahunan.
- **analytics_dashboard_cache** — dashboard_type, owner_type, owner_id, cache_key(unik per scope), cache_data(jsonb), generated_at, expired_at.
- **analytics_kpi** — kpi_name, period, value, target, achievement, status.
- **analytics_report** — report_name, report_type, period_start, period_end, generated_by, file_url, status, generated_at.
- **analytics_leaderboard** — period, student_id, school_id, class_id, subject_id, score, xp, ranking.
- **analytics_ai_recommendation** — student_id, subject_id, chapter_id, recommended_material(uuid[]), recommended_question_set(uuid[]), confidence_score, reason.
- **analytics_retention** — date(unik), day1, day7, day14, day30, day60, day90.
- **analytics_session** — session_id(unik), student_id, login_time, logout_time, duration, device, platform, browser, ip. Partisi bulanan.
- **analytics_funnel** — date(unik), visitor, register, verification, membership_trial, membership_paid, active_student, conversion_rate.

Materialized view opsional: mv_daily_active_users, mv_monthly_active_users, mv_exam_summary, mv_student_progress, mv_teacher_performance, mv_school_performance, mv_subject_performance, mv_question_difficulty, mv_learning_completion, mv_finance_revenue, mv_membership_growth, mv_retention_cohort.

### 4.10 `cms` — CMS (31)

- **cms_page** — slug(unik), title, subtitle, description, page_type(HOME|ABOUT|CONTACT|FAQ|PRIVACY|TERM|LANDING|CUSTOM), template, status(DRAFT|REVIEW|APPROVED|PUBLISHED|ARCHIVED), visibility, cover_image, thumbnail, author_id, editor_id, published_at, deleted_at.
- **cms_page_block** — page_id, component_type, component_name, sort_order, config(jsonb), active.
- **cms_page_version** — page_id, version, title, content, editor_id, published. Unik (page_id, version).
- **cms_page_publish** — page_id(unik aktif), status, approved_by, approved_at, scheduled_publish, published_at.
- **cms_page_seo** — page_id(unik), meta_title, meta_description, meta_keyword, canonical_url, robots, og_title, og_description, og_image, schema_json.
- **cms_post** — slug(unik), title, excerpt, content, cover_image, category_id, author_id, status, published_at, reading_time, view_count, like_count, share_count.
- **cms_post_version** — post_id, version, content, editor_id.
- **cms_category** — parent_id(self), name, slug(unik), description, icon, sort_order, active.
- **cms_tag** — name, slug(unik), color.
- **cms_post_tag** — post_id, tag_id. Composite PK.
- **cms_comment** — post_id, user_id, parent_comment(self), content, status.
- **cms_media** — uuid(unik), filename, original_name, mime_type, extension, size, width, height, duration, storage_provider, storage_path, public_url, thumbnail_url, hash(unik), uploaded_by, folder_id.
- **cms_media_folder** — parent_id, name, path(unik), created_by.
- **cms_banner** — title, subtitle, image, mobile_image, button_text, button_link, position, priority, start_date, end_date, status.
- **cms_widget** — name, widget_type, config(jsonb), active.
- **cms_component** — component_name, component_type, component_schema(jsonb), version, active. Unik (component_name, version).
- **cms_menu** — name, location(HEADER|FOOTER|SIDEBAR|MOBILE), active.
- **cms_menu_item** — menu_id, parent_id, title, url, icon, sort_order, target, active.
- **cms_faq** — category, question, answer, sort_order, active.
- **cms_testimonial** — name, photo, school, city, rating, content, active.
- **cms_partner** — name, logo, website, priority, active.
- **cms_event** — title, description, banner, start_time, end_time, location, registration_url, status.
- **cms_news** — title, slug(unik), content, cover, category, status, published_at.
- **cms_redirect** — from_url(unik), to_url, redirect_type(301|302), active.
- **cms_sitemap** — url(unik), priority, change_frequency, last_modified.
- **cms_setting** — setting_key(unik), setting_value, description.
- **cms_language** — code(unik), name, default, active.
- **cms_translation** — language_id, table_name, record_id, field_name, translated_text. Unik (language, table, record, field).
- **cms_form** — title, slug(unik), success_message, email_receiver, active.
- **cms_form_submission** — form_id, payload(jsonb), ip_address.
- **cms_audit_log** — actor_id, action, table_name, record_id, old_data, new_data, ip_address. Partisi bulanan. Append-only.

Tabel tambahan (direkomendasikan, kolom disusun saat fase): cms_landing_page, cms_ab_test, cms_popup, cms_content_schedule, cms_content_relation, cms_search_index.

### 4.11 `notification` — Notification (20)

Mekanisme: event → template → queue → channel router → delivery → inbox.

- **notification_template** — code, name, category(SYSTEM|EXAM|LEARNING|MEMBERSHIP|PAYMENT|SECURITY|PROMOTION|REMINDER|AI|ANNOUNCEMENT), title_template, body_template, email_subject, email_template, whatsapp_template, sms_template, push_title, push_body, variables(jsonb), language, version, is_active, created_by, updated_by. Unik (code, version, language).
- **notification_event** — event_name, event_type, reference_type, reference_id, user_id, payload(jsonb), priority, scheduled_at, status. Partisi bulanan.
- **notification_queue** — event_id, template_id, user_id, channel, priority, scheduled_at, status(WAITING|PROCESSING|SUCCESS|FAILED|RETRY|CANCELLED), retry_count, worker_id, locked_at, processed_at. Partisi bulanan.
- **notification_delivery** — queue_id, provider, provider_message_id(unik), channel, status, request_payload, response_payload, response_time, sent_at, delivered_at, read_at, failed_reason. Partisi bulanan.
- **notification_history** — user_id, template_id, channel, title, body, status. Partisi bulanan.
- **user_notification** — user_id, notification_history_id, title, body, image_url, action_url, action_type, icon, badge, priority, is_read, read_at, expired_at.
- **notification_preferences** — user_id(unik), allow_email, allow_push, allow_sms, allow_whatsapp, allow_in_app, allow_marketing, allow_exam, allow_payment, allow_learning, allow_ai, allow_system, quiet_hour_start, quiet_hour_end.
- **notification_device** — user_id, device_uuid(unik), device_name, platform, manufacturer, model, os, app_version, firebase_token(unik), onesignal_token, last_login, last_seen, active.
- **notification_read_log** — notification_id, user_id, opened_at, clicked_at, device, platform. Partisi bulanan.
- **broadcast** — title, description, target_type(ALL|STUDENT|TEACHER|STAFF|SCHOOL|PREMIUM|FREE), target_filter(jsonb), template_id, scheduled_at, status, created_by.
- **announcement** — title, content, cover_image, category, publish_at, expired_at, is_popup, priority, created_by.
- **campaign** — campaign_name, template_id, start_date, end_date, target_filter(jsonb), estimated_recipient, status, created_by.
- **notification_webhook** — provider, endpoint, request, response, http_status, verified.
- **notification_retry** — delivery_id, retry_number, next_retry, status, reason. Unik (delivery_id, retry_number).
- **notification_channel** — code(EMAIL|PUSH|WHATSAPP|SMS|IN_APP|TELEGRAM), name, provider, active, priority, rate_limit_per_minute.
- **notification_provider** — channel_id, provider_name, api_key(encrypted), secret_key(encrypted), endpoint, active, priority, config(jsonb).
- **notification_scheduler** — template_id, cron_expression, next_run, last_run, active.
- **notification_rule** — event_name, template_id, channel, priority, delay_second, condition(jsonb), active. Unik (event_name, channel).
- **notification_statistics** — date, channel, total_sent, total_delivered, total_opened, total_clicked, total_failed, delivery_rate, open_rate, click_rate. Unik (date, channel). Partisi tahunan.
- **notification_audit_log** — actor_id, actor_role, action, table_name, record_id, old_data, new_data, ip_address, device. Partisi bulanan.

### 4.12 `queue` — Scheduler & Queue (35)

- **queue_definition** — queue_name(unik), description, max_retry, retry_delay_second, priority, visibility_timeout, enabled.
- **queue_job** — queue_id, job_type, status(WAITING|DELAYED|RUNNING|SUCCESS|FAILED|RETRY|DEAD|CANCELLED), payload_id, priority, attempt, max_attempt, worker_id, scheduled_at, started_at, finished_at. Partial index (queue_id, status).
- **queue_payload** — payload(jsonb), checksum(unik).
- **queue_retry** — job_id, retry_no, error. Unik (job_id, retry_no).
- **queue_dead_letter** — job_id(unik), reason, payload.
- **queue_priority** — name(LOW|NORMAL|HIGH|CRITICAL), weight.
- **queue_worker** — worker_name, hostname, ip, version, status, started_at, heartbeat.
- **worker_heartbeat** — worker_id, cpu, memory, queue_count.
- **queue_batch** — batch_name(unik), total_job, completed, failed.
- **batch_job** — batch_id, job_id. Composite PK.
- **queue_schedule** — queue_id, cron_expression, timezone, enabled, next_run.
- **cron_job** — job_name, expression, description, enabled.
- **recurring_task** — name, interval, last_run, next_run.
- **scheduler_history** — referensi job/schedule, status, run_at, error.
- **scheduled_event** — event_name, trigger_at, payload(jsonb). Indeks (trigger_at, status).
- **workflow** — name, status.
- **workflow_step** — workflow_id, step_order, job_type, config(jsonb). Unik step_order per workflow.
- **workflow_execution** — workflow_id, status, started_at, finished_at.
- **task_dependency** — task, depends_on (ke queue_job). Unik (task, depends_on).
- **distributed_lock** — lock_key(unik), owner, expired_at.
- **rate_limit** — service(unik), limit, window_second.
- **rate_limit_log** — service, key, allowed, requested_at.
- **background_service** — service_name(unik), version, status.
- **service_health** — service_name, status, checked_at, detail(jsonb).
- **queue_monitor** — queue, waiting, running, failed, dead.
- **worker_monitor** — worker_id, status, job_running.
- **scheduler_monitor** — schedule_id, status, last_run_at.
- **queue_metrics** — queue, avg_latency, throughput, success_rate.
- **worker_metrics** — worker_id, jobs_processed, avg_duration_ms.
- **scheduler_metrics** — schedule_id, missed_runs, avg_latency_ms.
- **archived_job** — mirror queue_job + archived_at.
- **archived_payload** — payload + archived_at.
- **job_history** — job, status, changed_at.
- **worker_history** — worker_id, action, performed_at.
- **notification_queue** — (channel-spec) referensi queue.

### 4.13 `ai` — AI Tutor / Recommendation (konseptual, detail di fase 12)

Dokumen visi `Recommendation Engine.md` berisi roadmap kebutuhan, bukan schema. Rancangan tabel final disusun saat Phase 12 berdasar kebutuhan berikut (minimal):

- **ai_conversation** — user_id, title, subject_id, status.
- **ai_message** — conversation_id, role, content, tokens, created_at.
- **ai_prompt_template** — code, name, system_prompt, user_template, model, version, is_active.
- **ai_usage** — user_id, provider, model, input_token, output_token, estimated_cost.
- **ai_credit / ai_credit_transaction** — user_id, balance, usage ledger.
- **ai_model** — provider, model_name, purpose(OCR|CHAT|EMBEDDING|QUESTION|SUMMARY), cost.
- **ai_knowledge_base / ai_document** — sumber dokumen + metadata.
- **ai_embedding** — document_id, embedding vector, model, dimension. (pgvector)
- **ai_rag_chunk** — chunk teks + embedding + source.
- **ai_recommendation** — user_id, type(weak_topic|material|practice), recommended, reason, confidence.
- **weak_topic** — user_id, topic_id, mastery_level, updated_at.

### 4.14 `ocr` — OCR / Import Engine (28)

- **import_job** — job_number, job_name, module(QUESTION_BANK|LEARNING_MATERIAL|USER|ACADEMIC|EXAM|CMS|OTHER), job_type(OCR|IMPORT|OCR_AI|IMPORT_AI|MIGRATION), source_type(PDF|DOCX|PPTX|IMAGE|EXCEL|CSV|ZIP), status(UPLOADED|VALIDATING|PROCESSING|OCR|AI_PARSING|REVIEW|APPROVED|IMPORTING|COMPLETED|FAILED|CANCELLED), priority, uploaded_by, assigned_reviewer, started_at, completed_at.
- **import_file** — job_id, original_filename, stored_filename, storage_provider, bucket, path, mime_type, extension, file_size, total_pages, checksum, version, is_encrypted, uploaded_at.
- **document_page** — file_id, page_number, image_path, thumbnail_path, width, height, dpi, rotation, language, ocr_status.
- **ocr_engine** — engine_name, provider(TESSERACT|GOOGLE_VISION|AZURE_VISION|AWS_TEXTRACT|OPENAI|GEMINI), version, supports_table, supports_formula, supports_handwriting, supports_layout, supports_multilanguage, status.
- **ocr_result** — page_id, engine_id, raw_text, confidence numeric(5,4), processing_time_ms, language, rotation_detected.
- **layout_analysis** — page_id, layout_json, column_count, header_detected, footer_detected, table_detected, image_detected, formula_detected.
- **extracted_block** — page_id, block_type(TEXT|TABLE|IMAGE|FORMULA|HEADER|FOOTER), block_order, bounding_box(jsonb), content, confidence.
- **extracted_image** — page_id, image_path, width, height, caption, hash.
- **extracted_table** — page_id, table_json, row_count, column_count, confidence.
- **extracted_formula** — page_id, latex, mathml, confidence.
- **ai_parsing_job** — job_id, provider, model, prompt_version, status(STARTED|SUCCESS|FAILED), input_token, output_token, cost, duration_ms.
- **parsed_question** — job_id, question_number, question_text, question_image, difficulty, subject_prediction, chapter_prediction, topic_prediction, confidence, status(DRAFT|REVIEW|APPROVED).
- **parsed_option** — question_id, option_label, option_text, option_image, is_answer, confidence.
- **parsed_explanation** — question_id, explanation, reference, confidence.
- **parsed_metadata** — question_id, education_level, grade, subject, chapter, subchapter, difficulty, estimated_duration, question_type, language.
- **parsing_review** — question_id, reviewer, status(APPROVED|REJECTED|REVISION), notes, reviewed_at.
- **import_validation_rule** — rule_name, module, validation_type(REGEX|AI|SCRIPT), rule_expression, error_message, severity(WARNING|ERROR).
- **validation_result** — job_id, rule_id, object_type(FILE|QUESTION|OPTION|IMAGE), object_id, status(PASSED|FAILED), message.
- **duplicate_detection** — question_id, similar_question, similarity_score, algorithm, status.
- **import_batch** — job_id, batch_no, total_record, success_record, failed_record, processing_time, status.
- **import_result** — batch_id, target_table, record_id, status(SUCCESS|FAILED), error_message.
- **import_error** — job_id, page, line, error_type, description, raw_data(jsonb).
- **import_template** — module, template_name, template_version, schema_json, sample_file, status.
- **document_version** — file_id, version, change_log, created_by.
- **processing_queue** — job_id, worker_name, priority, status(WAITING|RUNNING|FAILED|SUCCESS), retry_count, scheduled_at, started_at, finished_at.
- **processing_worker** — worker_name, hostname, cpu, memory, current_job, status(HEALTHY|BUSY|DOWN), last_heartbeat.
- **import_statistics** — date, total_job, total_file, total_question, total_page, success_rate, avg_processing_time, avg_ocr_confidence, avg_ai_confidence.
- **import_configuration** — key(unik), value, description.

### 4.15 `report` — Reporting (24)

- **report_category** — code(unik, ACADEMIC|FINANCE|ANALYTICS|SECURITY|MEMBERSHIP|SYSTEM|SCHOOL|AI), name, description, sort_order, active.
- **report_definition** — code(unik), name, category_id, description, query_name, template_id, default_format, allow_schedule, allow_export, active, created_by.
- **report_template** — name, layout(jsonb), header, footer, orientation, paper_size, logo, theme, version.
- **report_job** — definition_id, requested_by, status(QUEUED|PROCESSING|SUCCESS|FAILED|CANCELLED), parameter(jsonb), started_at, finished_at, duration, error_message. Partisi bulanan.
- **report_export** — job_id, format(PDF|EXCEL|CSV|JSON|XML), storage_provider, file_path, file_size, checksum, download_count, expired_at. Partisi bulanan.
- **report_history** — definition_id, user_id, generated_at, parameter(jsonb), status, downloaded, downloaded_at. Partisi bulanan.
- **report_scheduler** — definition_id, cron_expression, next_run, last_run, active, created_by.
- **report_delivery** — job_id, channel(EMAIL|WHATSAPP|TELEGRAM|DOWNLOAD), recipient, status, sent_at, read_at. Partisi bulanan.
- **report_permission** — definition_id, role_id, allow_view, allow_download, allow_schedule. Unik (definition, role).
- **report_parameter** — definition_id, parameter_name, parameter_type, default_value, required, sort_order.
- **report_snapshot** — snapshot_date, dashboard_name, snapshot_data(jsonb). Partisi tahunan.
- **report_kpi_snapshot** — snapshot_date, kpi_name, kpi_value, target, achievement. Partisi tahunan.
- **report_finance** — period, gross_income, net_income, tax, refund, membership, invoice, transaction.
- **report_academic** — period, student, teacher, school, exam, average_score, completion.
- **report_student** — student_id, period, average_score, ranking, attendance, learning_time, completion, recommendation.
- **report_teacher** — teacher_id, period, student_count, material_created, exam_created, average_score.
- **report_school** — school_id, period, student, teacher, exam, completion, average_score.
- **report_operational** — period, login, active_user, error, api_request, storage, cpu, memory.
- **report_audit_log** — actor, action, table_name, record_id, old_data, new_data. Partisi bulanan.
- **report_distribution_list** — definition_id, recipient_type, recipient, active.
- **report_bookmark** — user_id, definition_id, created_at. Unik (user, definition).
- **report_comment** — report_history_id, user_id, comment.
- **report_version** — template_id, version, layout(jsonb).
- **report_storage** — provider, bucket, path, public_url, checksum.

### 4.16 `search` — Search (22)

- **search_document** — document_type(QUESTION|MATERIAL|VIDEO|BLOG|FAQ|NEWS|EVENT|PAGE|TEACHER|SCHOOL|MEMBERSHIP|ANNOUNCEMENT|AI_DOCUMENT), reference_table, reference_id(polimorfik), title, subtitle, description, content, summary, language, slug(unik), thumbnail, cover_image, status, visibility, published_at. GIN FTS pada title/summary/content.
- **search_vector** — document_id, embedding(vector), embedding_model(OPENAI|BGE|E5|INSTRUCTOR|GEMINI|NOMIC), dimension. Unik (document, model). HNSW/IVFFLAT index.
- **search_category** — parent_id(self), name, slug(unik), sort_order, active.
- **search_keyword** — document_id, keyword, weight, frequency. Unik (document, keyword).
- **search_tag** — document_id, tag, weight. Unik (document, tag).
- **search_filter** — document_type, filter_name, filter_key, filter_type, sort_order. Unik (type, key).
- **search_ranking** — document_id(unik), popularity_score, view_score, click_score, ai_score, manual_score, final_score.
- **search_query** — user_id, keyword, normalized_keyword, language, search_type, result_count, duration_ms. Partisi bulanan.
- **search_click_log** — query_id, document_id, position, clicked_at. Partisi bulanan.
- **search_history** — user_id, keyword, searched_at. Partisi bulanan.
- **search_saved** — user_id, keyword. Unik (user, keyword).
- **search_suggestion** — keyword, popularity, language, active.
- **search_synonym** — word, synonym, language. Unik triple.
- **search_stopword** — word, language. Unik (word, language).
- **search_trending** — date, keyword, total_search, ranking. Unik (date, keyword). Partisi tahunan.
- **search_cache** — cache_key(unik), query_hash, response(jsonb), expired_at.
- **search_index_log** — document_id, operation(INSERT|UPDATE|DELETE|REINDEX), status, duration. Partisi bulanan.
- **search_collection** — name(unik), description, active.
- **search_collection_document** — collection_id, document_id. Composite PK.
- **search_setting** — setting_key(unik), setting_value(jsonb).
- **search_analytics** — date(unik), total_query, unique_user, average_time, cache_hit, cache_miss, no_result. Partisi tahunan.
- **search_audit_log** — actor, action, table_name, record_id, old_data, new_data.

### 4.17 `config` — System Configuration (52)

- **configuration_group** — code(unik, APPLICATION|SECURITY|CBT|AI|PAYMENT|EMAIL|WHATSAPP|STORAGE|SYSTEM|ACADEMIC|MEMBERSHIP|ANALYTICS), name, description, sort_order.
- **configuration_definition** — group_id, config_key(unik), display_name, description, data_type(STRING|INTEGER|BOOLEAN|FLOAT|JSON|ARRAY|DATE|TIME|DATETIME), validation_rule(jsonb), default_value(jsonb), is_required, is_secret, restart_required, editable.
- **configuration_value** — definition_id, organization_id, environment_id, config_value(jsonb), effective_from, effective_until, updated_by. Unik (definition, organization, environment, effective_from).
- **environment** — code(DEV|STAGING|UAT|PRODUCTION), name.
- **application_configuration** — app_name, version, company_name, website, support_email, support_phone, default_language, default_timezone, maintenance_mode, maintenance_message.
- **branding_configuration** — organization_id, logo_asset_id, favicon_asset_id, primary_color, secondary_color, accent_color, font_family, login_background_asset_id.
- **localization_configuration** — default_language, default_timezone, date_format, time_format, currency, number_format.
- **security_configuration** — password_min_length, password_expired_day, password_history, max_failed_login, lock_duration, otp_expired_second, jwt_expired_minute, refresh_token_day, allow_multiple_session, require_mfa.
- **password_policy** — uppercase_required, lowercase_required, number_required, symbol_required, minimum_length.
- **ip_whitelist** — ip_address(unik), description, enabled.
- **ip_blacklist** — ip_address(unik), description, enabled.
- **security_header** — header_name, header_value, enabled.
- **authentication_provider** — provider(LOCAL|GOOGLE|MICROSOFT|APPLE), enabled.
- **oauth_configuration** — provider(unik), client_id, client_secret(encrypted), redirect_uri.
- **default_role** — organization_id(unik), student_role, teacher_role.
- **permission_configuration** — (mengacu role/permission).
- **academic_configuration** — active_academic_year, active_semester, default_curriculum, grading_method, passing_score.
- **cbt_configuration** — fullscreen, safe_browser, random_question, random_option, auto_submit, allow_resume, offline_mode, heartbeat_second, cheating_threshold.
- **grading_configuration / timer_configuration** — konfigurasi penilaian & timer.
- **ai_provider** — provider(OPENAI|GEMINI|ANTHROPIC|OLLAMA), endpoint, api_key(encrypted), enabled.
- **ai_model** — provider_id, model_name, purpose(OCR|CHAT|EMBEDDING|QUESTION|SUMMARY). Unik (provider, model, purpose).
- **ai_parameter** — model_id, temperature, max_token, top_p, frequency_penalty, presence_penalty.
- **storage_configuration** — provider(unik), bucket, region, cdn, max_upload_size, allowed_extension(jsonb).
- **image_configuration / video_configuration** — konfigurasi media.
- **email_configuration** — host, port, username, password(encrypted), from_email, encryption.
- **whatsapp_configuration** — provider, api_key/token(encrypted), phone_number.
- **sms_configuration / push_configuration** — konfigurasi kanal.
- **notification_template** — channel, code, subject, body, variables(jsonb).
- **payment_gateway** — provider(MIDTRANS|XENDIT|STRIPE), enabled, server_key(encrypted), client_key.
- **invoice_configuration / tax_configuration** — konfigurasi invoice & pajak.
- **membership_configuration** — trial_day, renewal_day, grace_period.
- **analytics_configuration** — tracking_id, provider, enabled.
- **dashboard_configuration** — konfigurasi dashboard.
- **cron_job** — job_name(unik), cron_expression, enabled, last_run, next_run. (nama overlap dengan queue.cron_job → bedakan via schema namespace).
- **scheduler_configuration** — konfigurasi scheduler.
- **integration_provider** — provider(unik, SLACK|GOOGLE|ZOOM|TELEGRAM|WEBHOOK).
- **webhook_configuration** — url, secret(encrypted), events(jsonb), enabled.
- **api_integration** — konfigurasi API.
- **feature_flag** — code, enabled, rollout_percentage, environment. Unik (code, environment).
- **feature_target** — flag_id, target_type, target_value. Unik triple.
- **backup_configuration** — frequency, retention, compression, storage.
- **restore_configuration** — konfigurasi restore.
- **maintenance_schedule** — start, finish, message.
- **maintenance_history** — riwayat maintenance.
- **configuration_version** — version(unik), published_by, published_at.
- **configuration_snapshot** — version_id, snapshot(jsonb).
- **configuration_history** — before_json, after_json, changed_by, changed_at.
- **configuration_audit** — user_id, config, old(jsonb), new(jsonb), request_id.

### 4.18 `audit` — Logging & Audit (62)

Semua tabel audit **append-only** (no UPDATE), partisi bulanan, `request_id`/`trace_id` untuk korelasi.

- **activity_log** — user_id, organization_id, module, entity, entity_id, action(CREATE|UPDATE|DELETE|READ|DOWNLOAD|EXPORT|IMPORT|APPROVE|PUBLISH|RESTORE), metadata(jsonb), ip_address, device, browser, platform.
- **activity_type** — code(LOGIN|LOGOUT|CREATE|UPDATE|DELETE|EXPORT|IMPORT|VIEW).
- **activity_category** — name(SECURITY|ACADEMIC|FINANCE|SYSTEM|AI).
- **audit_log** — user_id, entity_type, entity_id, action, before_data(jsonb), after_data(jsonb), reason, request_id. Immutable.
- **audit_entity** — entity_name(unik).
- **audit_snapshot** — entity_type, entity_id, snapshot(jsonb).
- **login_log** — user_id, email, login_time, logout_time, status(SUCCESS|FAILED|LOCKED), ip, device, browser, location.
- **logout_log** — user_id, logout_time, ip, device.
- **password_change_log** — user_id, changed_by, changed_at, ip.
- **password_reset_log** — user_id, email, requested_at, status, ip.
- **otp_log** — user_id, channel, status, expires_at.
- **mfa_log** — user_id, method, status.
- **role_change_log** — target_user, old_role, new_role, changed_by.
- **permission_change_log** — permission, old_value, new_value, changed_by.
- **access_denied_log** — user_id, endpoint, reason, ip.
- **security_event** — event(FAILED_LOGIN|TOKEN_EXPIRED|SQL_INJECTION|XSS|CSRF|FILE_SCAN), ip, severity.
- **suspicious_activity** — user_id, activity, risk_score.
- **account_lock_log** — user_id, reason, locked_at, unlocked_at.
- **token_log** — user_id, token_type, action, expires_at.
- **session_log** — user_id, session_id, ip, device, started_at, ended_at.
- **trusted_device_log** — user_id, device_fingerprint, device_name, trusted_at, revoked_at.
- **api_request_log** — request_id, endpoint, method, status_code, latency_ms, user_id, ip, request_size, response_size.
- **api_error_log** — request_id, status_code, error_code, error_message, stack_trace.
- **api_rate_limit_log** — user_id, endpoint, limit, reset_at.
- **application_error** — service, module, error_code, message, stack_trace, user_id.
- **database_error** — db_error_code, message, query.
- **worker_error** — job_id, error, stack_trace.
- **frontend_error** — user_id, url, message, stack_trace, user_agent.
- **system_event** — service, event, started_at, finished_at.
- **configuration_change** — config_key, old_value, new_value, changed_by.
- **deployment_log** — service, version, environment, deployed_by, started_at, finished_at, status.
- **backup_log** — backup_type, started_at, finished_at, size, status, location.
- **restore_log** — backup_id, restored_by, started_at, finished_at, status.
- **performance_log** — service, cpu, memory, latency.
- **slow_query_log** — query, duration_ms, rows_scanned.
- **cache_log** — cache_key, operation, hit, latency_ms.
- **queue_log** — queue_name, event, job_count.
- **websocket_log** — user_id, connection_id, event.
- **worker_job** — job_type, status, started_at, finished_at.
- **worker_retry** — job_id, attempt, last_error, next_retry_at.
- **worker_queue** — queue_name, pending, processing, failed.
- **notification_log** — notification_id, user_id, channel(EMAIL|WA|SMS|PUSH), status.
- **notification_delivery** — notification_id, channel, provider, status, delivered_at.
- **notification_open** — notification_id, user_id, opened_at.
- **ai_request_log** — provider, model, token, latency, user_id.
- **ai_generation_log** — request_id, user_id, type, input_tokens, output_tokens.
- **ai_chat_log** — user_id, session_id, message, response.
- **ai_ocr_log** — asset_id, duration_ms, status, confidence.
- **ai_embedding_log** — provider, model, dimension, token.
- **import_log** — file, module, user_id, status.
- **export_log** — file, module, user_id, format, row_count, status.
- **bulk_update_log** — module, affected_rows, user_id.
- **entity_history** — entity, entity_id, version, snapshot(jsonb). Immutable.
- **restore_history** — entity, entity_id, from_version, to_version, restored_by.
- **merge_history** — entity, source_ids(uuid[]), target_id, merged_by.
- **consent_log** — user_id, consent_type, granted, granted_at.
- **privacy_log** — user_id, event, description.
- **retention_log** — dataset, retention_days, deleted_count, executed_at.
- **anonymization_log** — user_id, fields(text[]), anonymized_by.
- **archive_log** — source_table, period, record_count, archived_at.
- **log_partition** — table_name, partition_name, start_date, end_date.
- **log_retention** — log_type, retention_days, archive_after_days.

### 4.19 `integration` — API Integration (28)

- **api_provider** — provider_code(unik), provider_name, category(PAYMENT|EMAIL|SMS|WHATSAPP|PUSH|AI|OCR|STORAGE|CDN|AUTH|VIDEO|ANALYTICS|SEARCH|OTHER), vendor, base_url, documentation_url, version, environment(SANDBOX|PRODUCTION), status(ACTIVE|INACTIVE|MAINTENANCE), supports_webhook, supports_retry, supports_batch, supports_async.
- **api_credential** — provider_id, credential_name, api_key, api_secret, client_id, client_secret, access_token, refresh_token, jwt_secret, certificate, private_key, public_key, expires_at, is_encrypted, rotation_date, last_used_at, status. (semua secret encrypted).
- **api_endpoint** — provider_id, service_name, endpoint_name, base_url, path, http_method, timeout_seconds, content_type, authentication_type(NONE|API_KEY|JWT|BASIC|BEARER|OAUTH2), rate_limit, retry_enabled, retry_policy(jsonb), is_active.
- **api_request_log** — request_id, provider_id, endpoint_id, user_id, module, request_method, request_url, request_headers(jsonb), request_body(jsonb), payload_hash, request_size, sent_at.
- **api_response_log** — request_id, status_code, response_headers(jsonb), response_body(jsonb), response_size, latency_ms, success, provider_reference, error_code, error_message, received_at.
- **webhook_endpoint** — provider_id, endpoint_name, url, secret_key(encrypted), signature_algorithm, is_active, verification_enabled.
- **webhook_event** — provider_id, event_name, event_type, description, is_enabled.
- **webhook_log** — provider_id, event_id, request_id, headers(jsonb), payload(jsonb), signature, signature_valid, status, processing_time, response(jsonb), retry_count, received_at.
- **api_retry_queue** — request_id, provider_id, endpoint_id, payload(jsonb), attempt, max_attempt, next_retry, status(PENDING|RUNNING|SUCCESS|FAILED|CANCELLED), last_error.
- **api_rate_limit** — provider_id, endpoint_id, window_type(SECOND|MINUTE|HOUR|DAY), limit_request, remaining_request, reset_time.
- **api_usage_statistics** — provider_id, endpoint_id, date, total_request, success_request, failed_request, avg_latency, max_latency, min_latency, total_data_sent, total_data_received, estimated_cost. Partisi bulanan.
- **api_error_catalog** — provider_id, error_code, error_name, description, severity(LOW|MEDIUM|HIGH|CRITICAL), recommended_action.
- **api_sync_job** — provider_id, job_name, module, sync_direction(IMPORT|EXPORT|BIDIRECTIONAL), schedule, cron_expression, last_sync, next_sync, status(ACTIVE|PAUSED|FAILED|SUCCESS).
- **api_sync_history** — job_id, started_at, finished_at, duration_ms, record_processed, success_count, failed_count, status, error_message.
- **oauth_client** — provider(GOOGLE|MICROSOFT|APPLE|FACEBOOK), client_id, client_secret(encrypted), redirect_uri, scope, status.
- **oauth_token** — user_id, provider, access_token, refresh_token, expires_at, scope. (token encrypted).
- **integration_module** — provider_id, module_name, enabled, priority, fallback_provider.
- **provider_health_check** — provider_id, status(UP|DOWN|DEGRADED), latency_ms, http_code, checked_at.
- **provider_incident** — provider_id, title, description, started_at, resolved_at, impact_level(LOW|MEDIUM|HIGH|CRITICAL), status.
- **idempotency_key** — idempotency_key(unik), provider_id, request_hash, response_hash, expires_at.
- **api_batch_job** — provider_id, job_name, batch_size, status, total_record, processed_record, failed_record, started_at, finished_at.
- **api_batch_item** — batch_job_id, reference_id, payload(jsonb), status, response(jsonb), error_message.
- **integration_event_log** — provider_id, module, event_type(CONNECT|DISCONNECT|TOKEN_REFRESH|RETRY|TIMEOUT|WEBHOOK|SYNC|ERROR), description, performed_by.
- **ai_provider_model** — provider_id, model_name, version, context_window, max_output_token, cost_input, cost_output, supports_image, supports_audio, supports_video, supports_function_call, status.
- **ai_usage_log** — provider_id, model_id, user_id, module, prompt_token, completion_token, total_token, latency_ms, estimated_cost, status.
- **external_file_transfer_log** — provider_id, operation(UPLOAD|DOWNLOAD|DELETE|MOVE|COPY), filename, mime_type, size, duration_ms, status.
- **callback_queue** — provider_id, request_id, callback_url, payload(jsonb), status, retry_count, scheduled_at, processed_at.
- **api_configuration** — provider_id, key, value, description.

### 4.20 `monitoring` — Monitoring (28)

- **monitored_service** — service_code(unik), service_name, service_type(API|BACKEND|FRONTEND|DATABASE|REDIS|QUEUE|WORKER|STORAGE|SEARCH|AI|PAYMENT|AUTH|EMAIL|SMS|WHATSAPP|OCR|OTHER), host_name, ip_address, port, environment(LOCAL|DEV|STAGING|PRODUCTION), version, health_endpoint, owner, status(ACTIVE|INACTIVE|MAINTENANCE).
- **service_instance** — service_id, instance_name, container_name, pod_name, node_name, hostname, ip_address, zone, region, status(STARTING|RUNNING|STOPPED|FAILED), started_at, last_heartbeat.
- **health_check** — service_id, instance_id, check_type(HTTP|TCP|PING|SQL|REDIS|QUEUE|CUSTOM), status(HEALTHY|UNHEALTHY|DEGRADED), response_time_ms, http_status, message, checked_at.
- **service_metrics** — service_id, instance_id, metric_time, cpu_usage, memory_usage, disk_usage, network_in, network_out, request_per_second, error_rate, success_rate, active_connection, queue_length, thread_count, gc_time, uptime.
- **database_metrics** — database_name, active_connection, idle_connection, max_connection, transaction_per_second, query_per_second, slow_query, deadlock, cache_hit_ratio, replication_delay, disk_size, table_size, index_size, captured_at.
- **redis_metrics** — instance, memory_used, memory_peak, connected_client, key_count, hit_rate, miss_rate, evicted_key, expired_key, ops_per_second, captured_at.
- **queue_metrics** — queue_name, waiting_job, processing_job, completed_job, failed_job, retry_job, worker_count, avg_processing_time, captured_at.
- **api_metrics** — service_id, endpoint, http_method, request_count, success_count, failed_count, avg_latency, p95_latency, p99_latency, max_latency, captured_at.
- **endpoint_availability** — service_id, endpoint, uptime_percentage, downtime_second, availability_status, captured_at.
- **error_metrics** — service_id, error_type, error_count, critical_count, warning_count, captured_at.
- **tracing_transaction** — trace_id, span_id, parent_span, service_id, operation, duration_ms, status, request_id.
- **tracing_span** — trace_id, service_name, operation, start_time, end_time, duration_ms, status.
- **alert** — alert_name, alert_type(CPU|MEMORY|DATABASE|API|NETWORK|QUEUE|SECURITY|CUSTOM), severity(INFO|WARNING|HIGH|CRITICAL), condition_expression, enabled.
- **alert_event** — alert_id, service_id, trigger_value, threshold, status(OPEN|ACKNOWLEDGED|RESOLVED), triggered_at, resolved_at.
- **alert_notification** — alert_event_id, channel(EMAIL|SMS|WHATSAPP|PUSH|SLACK|DISCORD|WEBHOOK), recipient, status, sent_at.
- **sla_configuration** — service_id, availability_target, response_target, error_rate_target, uptime_target.
- **sla_report** — service_id, period, uptime, availability, average_response, error_rate, sla_pass, generated_at.
- **synthetic_monitor** — monitor_name, url, method, interval_second, expected_status, expected_response, enabled.
- **synthetic_result** — monitor_id, status, response_time, http_status, error, checked_at.
- **capacity_forecast** — service_id, forecast_date, predicted_cpu, predicted_memory, predicted_storage, predicted_bandwidth, prediction_model, generated_at.
- **business_metrics** — metric_date, active_user, online_user, new_registration, active_exam, completed_exam, question_answered, revenue, conversion_rate, retention_rate.
- **worker_metrics** — worker_name, job_running, job_success, job_failed, avg_duration, memory_usage, cpu_usage, heartbeat, captured_at.
- **storage_metrics** — provider, bucket, used_storage, free_storage, object_count, upload_count, download_count, captured_at.
- **monitoring_dashboard** — dashboard_name, description, layout_json(jsonb), visibility, created_by.
- **dashboard_widget** — dashboard_id, widget_name, widget_type, chart_type, query, position(jsonb), size(jsonb), refresh_interval.
- **monitoring_incident** — incident_no, service_id, severity(LOW|MEDIUM|HIGH|CRITICAL), title, description, started_at, resolved_at, root_cause, resolution, status.
- **maintenance_window** — service_id, title, start_time, end_time, description, created_by.
- **monitoring_configuration** — config_key(unik), config_value, description.

---

## 5. Cross-Domain Reference Rules

- `identity.user` adalah pusat identitas. Semua `*_id` yang menunjuk user merujuk ke sini.
- `academic.subject/grade/chapter/topic/competency/skill` adalah referensi bersama untuk `question`, `content`, `cbt`, `ranking`, `analytics`. Junction menggunakan composite PK.
- `media.asset` adalah pusat file. `question.*`, `content.material_*`, `cms.cms_media` mereferensikan asset via `asset_id` atau `asset_reference`.
- `queue`, `notification`, `audit`, `integration`, `monitoring`, `config`, `search` adalah **pendukung lintas-domain** — berdiri sendiri, tidak direferensikan balik oleh domain inti (kecuali job/payload id).
- Hindari FK silang antar-domain yang menciptakan siklus; gunakan `entity_type`+`entity_id` polimorfik untuk referensi lintas entitas (asset_reference, analytics_events, activity_log).
- `ranking`, `analytics` membaca dari `cbt`/`question`/`content`/`finance` — hanya event-driven, TANPA FK langsung yang membuat kunci.

---

## 6. Verifikasi & Quality Gates

Setiap fase harus lulus:
1. Migrasi `up` jalan bersih dari nol (`migrate -path ... up`) tanpa error.
2. Migrasi `down` (hingga titik awal) bersih.
3. `\d <schema>.<tabel>` menampilkan struktur sesuai spec.
4. Semua FK valid; tidak ada tabel yang hilang dari katalog.
5. Index kunci ada (FK, filter umum, unik).
6. Tabel log sudah di-partisi & append-only.
7. Konvensi §2 terpenuhi (nama, timestamp, soft-delete, enum).
