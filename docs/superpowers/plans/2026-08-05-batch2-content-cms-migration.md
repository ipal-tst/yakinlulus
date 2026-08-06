# Batch 2 — Content Pipeline & Authoring (+ Full CMS + Full CBT) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Menghidupkan kembali pipeline konten backend terhadap schema baru (`media`, `question`, `content`, `cbt`, `cms`): authoring soal berbentuk blok, authoring materi, authoring CBT + blueprint, full CMS, dan ownership delete (guru hanya hapus konten miliknya). Sesuai keputusan user: **Full CMS sekarang** + **Full cbt schema sekarang**, dan Batch 2 di-deliver sebagai **satu plan dengan banyak merge antar-subfase**.

**Architecture:** Rewrite lapisan Repository SQL per modul dari schema `public` lama (sudah di-drop) ke skema baru ber-prefix. Kontrak HTTP API dipertahankan. Hanya lapisan Repository yang berubah; Service/Handler tetap. Verifikasi tiap task: TDD (`go test ./...`), `go build ./...`, `go vet ./...`, dan smoke-test per subfase.

**Tech Stack:** Go 1.26 + Fiber v2, pgx/v5, PostgreSQL 16 (Supabase). Skema: `media`, `question`, `content`, `cbt`, `cms`, referensi `identity`/`academic`/`shared`.

## Global Constraints

- **Semua query WAJIB prefix skema** (`media.`, `question.`, `content.`, `cbt.`, `cms.`, `identity.`, `academic.`). Schema `public` lama TIDAK ADA (kecuali `_migrations`).
- **Kontrak API dipertahankan**: struct domain di `content.go`, `question_bank.go`, `material.go`, `media.go`, `cbt_engine/handler.go` TETAP (field/JSON tag sama). Boleh menambah field opsional untuk "blok" dengan `omitempty`, tidak menghapus yang ada.
- **Role baru**: `SUPER_ADMIN`, `STAFF`, `FINANCE`, `GURU`, `SISWA`, `INVESTOR`. Authoring: `SUPER_ADMIN`, `STAFF`, `GURU`. **Ownership delete**: `GURU` hanya dapat delete konten dengan `owner_id = users.id` (dirinya); `SUPER_ADMIN`/`STAFF` boleh delete semua. Middleware lama yang menulis `RequireRole("ADMIN","STAFF","TEACHER")` di-remap ke `HasAnyRole(SUPER_ADMIN, STAFF, GURU)`.
- **PK uuid, timestamptz, soft-delete `deleted_at`** di master, trigger `shared.set_updated_at()`. TIDAK menambah migrasi baru kecuali benar-benar mengisi gap (default: jangan).
- **`shared.set_updated_at()`** dipakai DB; jangan set ulang di Go.
- Batas lingkup: modul yang TIDAK masuk Batch 2 (`scoring`, `dashboard`, `analytics`, `ranking`, `subscription`, `notification`, `profile`, `school`, `ai`, `audit`, `exam_packages`, `practice`, `cbt_runtime`, `target_schools`, `ws`, `admin`, `auth`, `academic`, `middleware`) TIDAK diubah strukturnya. Namun banyak modul tersebut mereferensikan `content.Repository` (mis. `practice`, `cbt_engine`, `material`, `analytics`). Perubahan pada `content.Repository` interface harus mempertahankan method signature agar modul pemakai tetap kompilasi hijau.

## Scope & Deliverables (PRD §10 Batch 2 + keputusan user)

1. **Format soal blok** TEXT/IMAGE/STIMULUS → `question.question_block` (PARAGRAPH/IMAGE/LATEX/tbl), `question.question_option`, `question.option_block`.
2. **3 tipe jawaban**: SINGLE_CHOICE, MULTIPLE_CHOICE, TRUE_FALSE (kolom `question_type` CHECK sudah mendukung + ESSAY/SHORT_ANSWER/MAKING/COMPLEX yang didefinisikan di migration 040).
3. **Referensi berderet** → `question.question_metadata` (source_type, source_name, reference_code, publication_year).
4. **Import docx/pdf → blok otomatis** → `question.question_import_job`, `question.question_import_row`, `question.question_ai_parsing`, `question.question_ocr_result`.
5. **Authoring materi** → `content.material`, `material_version`, `material_block`, `material_section`, `material_status`, `material_metadata`.
6. **Authoring CBT + blueprint** → `cbt.exam`, `exam_metadata`, `exam_package`, `exam_package_question`, `exam_question_pool`, `exam_schedule`, `exam_randomization`, `exam_subject`/`_grade`/`_topic`.
7. **Full CBT runtime** (keputusan user) → `cbt.exam_participant`, `exam_attempt`, `attempt_question`, `attempt_option`, `student_answer`, `essay_answer`, `grading_result`, `grading_detail`, `exam_session`, `exam_proctor`, `exam_timer`.
8. **Full CMS** → `cms.cms_page`, `cms_page_block`, `cms_page_version`, `cms_page_publish`, `cms_page_seo`, `cms_post`, `cms_post_version`, `cms_category` (+ 203–209 lain sesuai pilihan implementer: tag, banner, media, faq, news, setting, form).
9. **Ownership delete** → logika `where deleted_at IS NULL AND owner_id = $userID` untuk GURU di modul authoring.

---

## Subphase Breakdown (setiap subfase di-review + merge ke `main` secara terpisah)

Setiap subfase berjalan di worktree `yl-batch2-<n>`, verifikasi gate-nya, whole-branch review oleh task-reviewer, lalu merge FF ke `main`. Urutan ini menegakkan dependensi schema: media → question → content → cbt → cms.

---

## Subphase 2.1 — Media schema (pendahulu semua blok)

**Files:**
- Modify: `backend/internal/media/media.go`

**Legacy→New mapping:** `media` → `media.asset` (+ `media.asset_version`, `media.asset_storage`, `media.asset_type`, `media.asset_reference` untuk dokumentasi referensi entity).

**Task 2.1.1 — Repository media ke `media.asset`**
- [ ] Step 1: Tulis unit/integration test (atau smoke plan) untuk Create/FindByID/ListByEntity/ListAll/Delete/GetStoragePath.
- [ ] Step 2: Jalankan, pastikan gagal (query legacy).
- [ ] Step 3: Rewrite `media.go` repository:
  - `INSERT INTO media.asset (asset_code, original_name, mime_type, extension, size, storage_id, visibility, status, uploaded_by, created_at, updated_at)`.
  - `FindByID/ListByEntity/ListAll/Delete/GetStoragePath` → `media.asset` + `media.asset_reference` (polymorphic `module, entity, entity_id` menggantikan kolom `entity_type/entity_id`).
  - Gunakan `public_url` dari `media.asset_storage` untuk kolom `URL` respons (kontrak `url` dipertahankan). Jika storage belum ada, fallback ke `media.asset_channel`/nil.
- [ ] Step 4: Build + test hijau.
- [ ] Step 5: Commit + verifikasi gate + review + merge.

> **Keputusan desain untuk GURU ownership**: `media.asset.uploaded_by` dipakai sebagai owner; delete media oleh GURU hanya boleh miliknya. Bandingkan `c.Locals("user_id")`.

---

## Subphase 2.2 — Question bank & blok authoring (schema `question`)

**Files:**
- Modify: `backend/internal/question_bank/question_bank.go`

**Legacy→New mapping:**
- `contents` + `content_questions` → `question.question` + `question.question_version` (is_current).
- `content_question_options` → `question.question_option` + `question.option_block`.
- `question_revisions` → `question.question_history`.
- `question_import_jobs`/`question_import_rows` → `question.question_import_job`/`question_question_import_row`.
- Referensi berderet → `question.question_metadata` (source_type, source_name, source_code, publication_year).
- Vars. akademik (`subjects`/`grades`/`chapters`/`education_levels`) → `academic.*` (+ junction `question.question_subject`/`_grade`/`_chapter`/`_topic`).

**Task 2.2.1 — Repository `question` core + Create/Get by ID**
- [ ] TDD: buat soal blok → verifikasi `question.question`, `question_version`, `question_block`, `question_option`, `question_metadata` terisi; API response mempertahankan field lama (content, options, difficulty, status, etc.).
- [ ] Rewrite Create: wajib membuat baris `question.question` (question_code = gen dari UUID acak singkat), `question_status` lookup (default DRAFT→APPROVED mapping dari status legacy), `question_version` (v1, is_current), blok dari `content` (parse paragraf/image), `question_option`+`option_block`, `question_metadata` (difficulty, blooms, source reference), junction academic.
- [ ] Rewrite FindByID: join `question` + current version + blocks + options + metadata + academic names (LN: subject_name, grade_name, level_name) → map balik ke struct `Question`.

**Task 2.2.2 — List + filter + export**
- [ ] Rewrite `List` dynamic WHERE (subject/grade/difficulty/status/search) terhadap `question.question` + junction + opts, count query. Pertahankan filter param & status semantics lama (APPROVED/DRAFT/ARCHIVED ↔ `question_status` code).
- [ ] `Export` CSV tetap bekerja (kontrak).

**Task 2.2.3 — Update / Publish / Archive / Restore / Unpublish / Clone**
- [ ] `Update`: buat `question_version` baru (version_no+1) dan rewrite blocks/options → ganti `current_version_id`.
- [ ] `Publish`/`Archive`/`Restore`/`Unpublish`: update `question_status` + `question_history` (action CREATE/UPDATE/REVIEW/APPROVE/ARCHIVE/RESTORE/DELETE) + set `published_at` di metadata/master.
- [ ] `Clone`: insert duplicate question (copy blocks/options/metadata) + `question_duplicate`.

**Task 2.2.4 — Import docx/pdf → blok otomatis**
- [ ] `CreateImportJob`/`UpdateImportJob`/`CreateImportRowLog` → `question.question_import_job`/`question.question_import_row`.
- [ ] Parse docx/pdf menjadi blok: gunakan parser teks minimum (buat blok PARAGRAPH) + simpan `question_ai_parsing`/`question_ocr_result` placeholder. DOCX adalah prioritas; PDF gambar → simpan `asset_id` + baris import failed/skipped dengan pesan (import asinkron job).
- [ ] Gate: setelah import, soal blok bisa di-edit lalu publish. (Verifikasi unit: JSON roundtrip blok→domain.)

**Task 2.2.5 — Ownership delete soal**
- [ ] `Delete` hanya menghapus soal dengan `ownered by` user (kecuali role SUPER_ADMIN/STAFF). Bandingkan `question.owner_id` dengan `c.Locals("user_id")`.

> **Keputusan struct blok**: Tambahkan field opsional `Blocks []Block` dan `ImageURL` di `Question` untuk menangkap TEXT/IMAGE/STIMULUS, `omitempty`, tanpa merusak frontend. STIMULUS = blok urutan 0 (PARAGRAPH/IMAGE yang memuat stimulus sebelum pertanyaan).

---

## Subphase 2.3 — Material authoring (schema `content`)

**Files:**
- Modify: `backend/internal/content/repository.go` (hanya bagian material), `backend/internal/content/content.go` (struct, opsional), `backend/internal/material/material.go`.

**Legacy→New mapping:**
- `contents` (MATERIAL) + `content_materials` → `content.material` + `material_version`.
- `material_block` → blok-blok (kaya tipe: PARAGRAPH/IMAGE/VIDEO/QUIZ/CALLOUT/TIMELINE/EMBED/ACCORDION/CHECKLIST) + `material_section`/`material_section_block`.
- `learning_progress` → `content.learning_progress` (+ last_position/persen_display sesuai struct; jaga `material.LearningProgress` tanpa LastPosition tetap kompilasi).

**Task 2.3.1 — Repository material ke `content.material`**
- [ ] TDD: CreateMaterial → `material`, `material_version`, `material_block`, `material_section`, `material_metadata` (estimated_minutes, difficulty, is_premium, certificate_enabled). Status → `material_status` lookup.
- [ ] Rewrite CreateMaterial/UpdateMaterial (buat version baru saat update), GetMaterial (join material by current version + blocks + section), ListMaterials (filter), IncrementReadCount → `material_statistics.view_count`, DeleteMaterial (soft) + ownership.
- [ ] GetMaterial/ListMaterials memetakan `material_block` → konten (untuk API lama yang mengembalikan field `Body`/`Content`, parse blok PARAGRAPH pertama atau concat blok teks).

**Task 2.3.2 — Learning progress**
- [ ] Rewrite `UpsertProgress`/`GetProgress`/`ListProgressByUser` → `content.learning_progress` (ON CONFLICT (student_id, material_id)). `student_id` = `identity.user` role SISWA. Pertahankan field `progress`/`completed`/`last_position`; hitung `progress_percent`.

---

## Subphase 2.4 — Full CBT (schema `cbt`) — authoring + runtime

**Files:**
- Modify: `backend/internal/content/repository.go` (bagian exam — GANTI arah ke `cbt.*`), `backend/internal/cbt_engine/handler.go` (setelah repo jadi), dan modul konsumen `practice`, `cbt_runtime`.

**IMPORTANT — ketergantungan**: Karena `content.Repository` jadi perantara, dan `cbt_engine`/`practice`/`cbt_runtime` memakai interface itu, strategi: (A) jika memungkinkan, rewrite method Repository exam/practice langsung ke `cbt.*`/`content.*` sambil mempertahankan signature interface, ATAU (B) buat service/adapter yang memanggil fungsi query baru `cbt.*` di balik interface yang sama. Pilih (A) bila review lebih bersih; dokumentasikan pilihan.

**Legacy→New mapping (authoring):**
- `contents`(EXAM)+`content_exams` → `cbt.exam` + `cbt.exam_metadata` (duration_minute, passing_score, negative_marking, show_result, show_answer).
- `content_exam_questions` → `cbt.exam_package` + `cbt.exam_package_question` (score, question_order).
- `content_exam_blueprints`/`content_exam_subject_blueprints` → nyata di `cbt.exam_question_pool` (subject/chapter/difficulty/total_question) + `cbt.exam_subject`.
- `content_exam_participants`/`_attempts`/`_answers`/`_sessions`/`_session_questions` → `cbt.exam_participant`, `cbt.exam_attempt`, `cbt.attempt_question`, `cbt.attempt_option`, `cbt.student_answer`, `cbt.essay_answer`, `cbt.exam_session`, `cbt.grading_result`, `cbt.grading_detail`.

**Task 2.4.1 — Exam core authoring**
- [ ] TDD: CreateExam → `cbt.exam` (type mapping TRYOUT/CBT/QUIZ/MID/FINAL/UTBK/AKM), `cbt.exam_status`, `cbt.exam_metadata`. GetByID/Update/List/Delete (soft+ownership).
- [ ] SetBlueprint/GetBlueprint → `cbt.exam_question_pool` (+ `cbt.exam_subject`). SetSubjectBlueprint/GetSubjectBlueprints → pool per subject.

**Task 2.4.2 — Exam package & questions**
- [ ] `AddExamQuestion`/`RemoveExamQuestion`/`ReorderExamQuestions` → `cbt.exam_package`/`cbt.exam_package_question`.
- [ ] `GetExamQuestions` → package questions join `question.question` current version + blocks.

**Task 2.4.3 — Runtime attempt (autorun/seed)**
- [ ] `CreateExamParticipant`/`AddExamParticipant` → `cbt.exam_participant`. `StartAttempt`→`cbt.exam_attempt`+`attempt_question`+`attempt_option` (assign dari package/pool, random order pakai `exam_randomization`). 
- [ ] `SubmitAttempt`/`GradeAttempt` → `cbt.student_answer`/`essay_answer` + `cbt.grading_result`/`grading_detail` (hitung benar/salah/blank/score+passed dari passing_score). `GetExamAnswers`→ answer read.
- [ ] `GetAnalytics` → `cbt.exam_attempt`, `grading_result`, `exam_participant`.

**Task 2.4.4 — Timer / proctor / session (ringkas)**
- [ ] Timer `exam_timer`, proctor `exam_proctor`, session `exam_session` — implementasi minimum agar API lama (bilamana dipakai frontend) tidak runtime-fail; sertakan query yang ada.

---

## Subphase 2.5 — Full CMS (schema `cms`) — MODUL BARU

**Files:**
- **Create:** `backend/internal/cms/` (domain.go, repository.go, service.go, handler.go) + route wiring di `backend/cmd/api/main.go` + `RegisterRoutes`.

**Task 2.5.1 — CMS core: Page**
- [ ] TDD: CRUD halaman → `cms.cms_page` (slug unik, page_type, status, visibility, cover_image, author_id/editor_id), `cms_page_block` (sort_order, component_type, config jsonb), `cms_page_version` (version+1 saat update), `cms_page_publish` (status review/approve/publish + published_at), `cms_page_seo`.
- [ ] Endpoint: `/cms/pages` GET list, POST, GET/:id, PUT/:id, DELETE/:id (soft), POST/:id/publish, POST/:id/approve.
- [ ] Public: GET `/cms/pages/slug/:slug` hanya untuk status PUBLISHED & visibility PUBLIC.

**Task 2.5.2 — CMS: Post & Category**
- [ ] CRUD `cms_post` (slug, title, excerpt, content, cover_image, category_id, author_id, status, published_at, reading_time, view_count). 
- [ ] CRUD `cms_category` (parent_id sendiri, slug unik, sort_order, active). 
- [ ] Public read hanya yang PUBLISHED.

**Task 2.5.3 — CMS: komponen tambahan (203–209)**
- [ ] Implementasi minimum sesuai pilihan: `cms_tag`/`cms_post_tag`, `cms_media`+`cms_media_folder`, `cms_banner`, `cms_faq`, `cms_news`, `cms_setting`, `cms_form`/`cms_form_submission`. Susun prioritas: Setting + Banner + Faq + Media paling berguna; sisanya boleh endpoint dasar.
- [ ] Ownership: author/editor hanya bisa delete/edit miliknya (kecuali SUPER_ADMIN/STAFF).

> **Catatan**: CMS adalah modul baru tanpa legacy mapping — kontrak API baru, urutan endpoint konsisten dengan pola Handler yang ada (pagination `shared.ParsePagination`, `shared.Success`/`Error`).

---

## Subphase 2.6 — Ownership delete lintas modul + hardening

**Files:**
- Modify: `backend/internal/question_bank/question_bank.go`, `backend/internal/media/media.go`, `backend/internal/material/material.go` (via content repo), `backend/internal/cbt_engine/handler.go`, `backend/internal/cms/`.

- [ ] Enum `RequireRole("ADMIN","STAFF","TEACHER")` di seluruh modul → `HasAnyRole("SUPER_ADMIN","STAFF","GURU")` (+ helper dari Batch 1). 
- [ ] Delete di setiap modul authoring memeriksa ownership: tambahkan `and owner_id = any($userID::uuid)` pada DELETE/soft-delete untuk role GURU; lakukan pengecekan di Service/Handler memakai role dari JWT (`c.Locals("role")`).
- [ ] Smoke test ownership: GURU A buat soal → GURU B DELETE → 403/404; GURU A delete → 204; SUPER_ADMIN delete sembarang → 204.
- [ ] Regresi seluruh build + semua route Batch 2 hijau.

---

## Verification Gate (per subfase)

- [ ] `go build ./...` berhasil.
- [ ] `go vet ./...` bersih.
- [ ] `go test ./...` hijau (termasuk test yang ditulis).
- [ ] Smoke-test via `go run ./cmd/api` (gunakan prosedur port 8081 + config temp karena port 8080 dipakai `api.exe` legacy — lihat runbook verify_main).
- [ ] Whole-branch review oleh task-reviewer; serapan temuan sebelum merge.
- [ ] Merge FF ke `main`, hapus branch/worktree.

---

## Deliverables Checklist (final Batch 2)

- [ ] Soal blok: buat → import (docx/pdf) → edit → publish, end-to-end.
- [ ] Materi: buat → blok/section → publish.
- [ ] CBT: exam + blueprint + package + participant + attempt + grade.
- [ ] CMS: page/post/category + publish workflow (full).
- [ ] Ownership: guru hanya delete punya sendiri (semua modul authoring).
- [ ] Kompilasi + ekosistem modul konsumen (`practice`, `cbt_runtime`, `analytics`, `material`) tetap hijau.