# Database Rebuild Phase 4 Implementation Plan (Question Bank)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bangun domain `question` (bank soal) — 38 tabel — sesuai design doc `docs/superpowers/specs/2026-08-04-database-rebuild-design.md` §4.4, menghilangkan dual-schema legacy (`questions`/`exam_*` lama sudah dihapus di Phase 0).

**Architecture:** `question.question` adalah identitas soal (mengikuti pola versioned-content: identitas → versi → blok konten). Isi soal disimpan sebagai blok modular (`question_block`, `option_block`, `explanation_block`) agar mendukung PARAGRAPH/IMAGE/LATEX/SVG/dsb. Junction N:M ke `academic.*` memakai composite PK. Statistik & IRT terpisah dari konten.

**Tech Stack:** PostgreSQL (Supabase), runner Go `go run cmd/migrate/main.go up`, verifikasi via throwaway Go program (pgx) + `cmd/tools/dbcheck`.

**Files target:** `backend/migrations/040_question_core.{up,down}.sql` s.d. `046_question_import.{up,down}.sql` (7 file pasangan).

---

## Global Constraints

Semua tabel mematuhi **Global Conventions** (`docs/superpowers/specs/2026-08-04-database-rebuild-design.md` §2):

- PK: `id uuid PRIMARY KEY DEFAULT gen_random_uuid()` di setiap tabel (junction pakai composite PK).
- Nama `snake_case` singular; kolom referensi `<entity>_id`.
- `created_at timestamptz NOT NULL DEFAULT NOW()` wajib; `updated_at` untuk tabel mutable.
- Soft delete `deleted_at` hanya pada master (`question.question`).
- Enum: `text` + `CHECK (col IN (...))`, tidak `CREATE TYPE`.
- Indeks semua FK + filter umum; indeks unik sesuai spec.
- FK lintas schema: `identity.user` (owner/reviewer), `media.asset` (block/option/explanation asset). Junction akademik → `academic.*`.
- Migrasi harus `up` bersih dari nol, dibungkus transaksi (runner sudah tx per file).
- Jangan sentuh kode Go runner.
- **Keputusan desain (deviasi minor, dicatat):**
  1. `question.question_type` dimodelkan sebagai kolom `text` + `CHECK` (tidak ada tabel lookup `question_type` di katalog §4.4; konvensi §2.6 mendukung enum inline).
  2. `question_tag` tidak punya tabel tag di `academic` — dimodelkan sebagai junction `(question_id, tag text)` composite PK.
  3. Junction ke domain yang belum ada (cbt/content) dibuat di Phase 4 **tanpa FK** pada kolom lintas; FK ditambahkan lewat `ALTER TABLE ADD CONSTRAINT` di fase pemilik (cbt=Phase 5, content=Phase 6) — dicatat sebagai follow-up di task terkait.

---

## Task 4A: Question Core — status, question, version

**Files:**
- Create: `backend/migrations/040_question_core.up.sql`
- Create: `backend/migrations/040_question_core.down.sql`

**Interfaces:**
- Consumes: `identity.user`, schema `question` (000), `shared.set_updated_at()` (001).
- Produces: `question.question_status`, `question.question` (master), `question.question_version`. Domain lain mereferensikan `question.question` via FK.

- [ ] **Step 1: Tulis `040_question_core.up.sql`**

```sql
-- Migration 040: question core - status lookup, question master, version.

CREATE TABLE question.question_status (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    code varchar(30) NOT NULL,
    name varchar(100) NOT NULL,
    description text,
    created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX uq_question_status_code ON question.question_status(code);

CREATE TABLE question.question (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    question_code varchar(50) NOT NULL,
    question_type text NOT NULL DEFAULT 'SINGLE_CHOICE' CHECK (question_type IN ('SINGLE_CHOICE','MULTIPLE_CHOICE','TRUE_FALSE','ESSAY','SHORT_ANSWER','MATCHING','COMPLEX_MULTIPLE','NUMERIC','OTHER')),
    current_version_id uuid,
    status_id uuid REFERENCES question.question_status(id) ON DELETE SET NULL,
    owner_id uuid REFERENCES identity.user(id) ON DELETE SET NULL,
    created_by uuid REFERENCES identity.user(id) ON DELETE SET NULL,
    updated_by uuid REFERENCES identity.user(id) ON DELETE SET NULL,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW(),
    deleted_at timestamptz
);
CREATE UNIQUE INDEX uq_question_code ON question.question(question_code) WHERE deleted_at IS NULL;
CREATE INDEX idx_question_type ON question.question(question_type);
CREATE INDEX idx_question_status ON question.question(status_id);
CREATE INDEX idx_question_owner ON question.question(owner_id);
CREATE TRIGGER trg_question_updated BEFORE UPDATE ON question.question
    FOR EACH ROW EXECUTE FUNCTION shared.set_updated_at();

CREATE TABLE question.question_version (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    question_id uuid NOT NULL REFERENCES question.question(id) ON DELETE CASCADE,
    version_no int NOT NULL DEFAULT 1,
    change_summary text,
    created_by uuid REFERENCES identity.user(id) ON DELETE SET NULL,
    is_current boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    UNIQUE (question_id, version_no)
);
CREATE INDEX idx_question_version_question ON question.question_version(question_id);
CREATE INDEX idx_question_version_current ON question.question_version(question_id) WHERE is_current;

-- Circular FK: question.current_version_id -> question_version (resolved after both tables exist).
ALTER TABLE question.question ADD CONSTRAINT fk_question_current_version
    FOREIGN KEY (current_version_id) REFERENCES question.question_version(id);
```

- [ ] **Step 2: Tulis `040_question_core.down.sql`**

```sql
ALTER TABLE question.question DROP CONSTRAINT IF EXISTS fk_question_current_version;
DROP TABLE IF EXISTS question.question_version;
DROP TABLE IF EXISTS question.question;
DROP TABLE IF EXISTS question.question_status;
```

- [ ] **Step 3: Verifikasi**

Dari `backend/`:
```bash
go run cmd/migrate/main.go up
```
Expected: `Migration applied name=040_question_core.up.sql`; `All migrations applied total=22`.

Kemudian verifikasi via throwaway Go program (pgx, URL dari `backend/config.yaml` `database.url`):
- `SELECT count(*) FROM information_schema.tables WHERE table_schema='question';` → **3**
- `SELECT count(*) FROM pg_constraint WHERE conrelid='question.question'::regclass AND conname='fk_question_current_version';` → **1**

- [ ] **Step 4: Commit**

```bash
git add migrations
git commit -m "feat(db): question core - status/question/version (phase 4)"
```

---

## Task 4B: Question Content — metadata, blocks, options, explanation, hint, solution

**Files:**
- Create: `backend/migrations/041_question_content.up.sql`
- Create: `backend/migrations/041_question_content.down.sql`

**Interfaces:**
- Consumes: `question.question`, `question.question_version`, `media.asset`.
- Produces: `question.question_metadata`, `question.question_block`, `question.question_option`, `question.option_block`, `question.explanation`, `question.explanation_block`, `question.hint`, `question.solution_step`.

- [ ] **Step 1: Tulis `041_question_content.up.sql`**

```sql
-- Migration 041: question content - metadata, blocks, options, explanation, hint, solution.

CREATE TABLE question.question_metadata (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    question_id uuid NOT NULL REFERENCES question.question(id) ON DELETE CASCADE,
    estimated_time int,
    difficulty_level varchar(20) CHECK (difficulty_level IN ('EASY','MEDIUM','HARD','VERY_HARD')),
    blooms_level varchar(20) CHECK (blooms_level IN ('REMEMBER','UNDERSTAND','APPLY','ANALYZE','EVALUATE','CREATE')),
    cognitive_level varchar(30),
    language varchar(16) DEFAULT 'id',
    source_type varchar(40),
    source_name varchar(200),
    publication_year int,
    reference_code varchar(50),
    is_hots boolean NOT NULL DEFAULT false,
    is_calculator_allowed boolean NOT NULL DEFAULT false,
    is_randomizable boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    UNIQUE (question_id)
);

CREATE TABLE question.question_block (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    question_version_id uuid NOT NULL REFERENCES question.question_version(id) ON DELETE CASCADE,
    block_order int NOT NULL DEFAULT 0,
    block_type text NOT NULL CHECK (block_type IN ('PARAGRAPH','IMAGE','TABLE','LATEX','SVG','AUDIO','VIDEO','GRAPH','CODE','HTML','MARKDOWN')),
    content text,
    asset_id uuid REFERENCES media.asset(id) ON DELETE SET NULL,
    style_json jsonb,
    created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_question_block_version ON question.question_block(question_version_id);
CREATE INDEX idx_question_block_asset ON question.question_block(asset_id);

CREATE TABLE question.question_option (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    question_version_id uuid NOT NULL REFERENCES question.question_version(id) ON DELETE CASCADE,
    label varchar(10) NOT NULL,
    score numeric(10,2) NOT NULL DEFAULT 0,
    is_correct boolean NOT NULL DEFAULT false,
    display_order int NOT NULL DEFAULT 0,
    created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_question_option_version ON question.question_option(question_version_id);

CREATE TABLE question.option_block (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    option_id uuid NOT NULL REFERENCES question.question_option(id) ON DELETE CASCADE,
    block_order int NOT NULL DEFAULT 0,
    block_type text NOT NULL CHECK (block_type IN ('PARAGRAPH','IMAGE','TABLE','LATEX','SVG','AUDIO','VIDEO','GRAPH','CODE','HTML','MARKDOWN')),
    content text,
    asset_id uuid REFERENCES media.asset(id) ON DELETE SET NULL,
    style_json jsonb,
    created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_option_block_option ON question.option_block(option_id);

CREATE TABLE question.explanation (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    question_version_id uuid NOT NULL REFERENCES question.question_version(id) ON DELETE CASCADE,
    content text,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    UNIQUE (question_version_id)
);

CREATE TABLE question.explanation_block (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    explanation_id uuid NOT NULL REFERENCES question.explanation(id) ON DELETE CASCADE,
    block_order int NOT NULL DEFAULT 0,
    block_type text NOT NULL CHECK (block_type IN ('PARAGRAPH','IMAGE','TABLE','LATEX','SVG','AUDIO','VIDEO','GRAPH','CODE','HTML','MARKDOWN')),
    content text,
    asset_id uuid REFERENCES media.asset(id) ON DELETE SET NULL,
    created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_explanation_block ON question.explanation_block(explanation_id);

CREATE TABLE question.hint (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    question_version_id uuid NOT NULL REFERENCES question.question_version(id) ON DELETE CASCADE,
    hint_order int NOT NULL DEFAULT 0,
    content text,
    created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_hint_version ON question.hint(question_version_id);

CREATE TABLE question.solution_step (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    question_version_id uuid NOT NULL REFERENCES question.question_version(id) ON DELETE CASCADE,
    step_no int NOT NULL DEFAULT 0,
    title varchar(200),
    content text,
    asset_id uuid REFERENCES media.asset(id) ON DELETE SET NULL,
    created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_solution_step_version ON question.solution_step(question_version_id);
```

- [ ] **Step 2: Tulis `041_question_content.down.sql`**

```sql
DROP TABLE IF EXISTS question.solution_step;
DROP TABLE IF EXISTS question.hint;
DROP TABLE IF EXISTS question.explanation_block;
DROP TABLE IF EXISTS question.explanation;
DROP TABLE IF EXISTS question.option_block;
DROP TABLE IF EXISTS question.question_option;
DROP TABLE IF EXISTS question.question_block;
DROP TABLE IF EXISTS question.question_metadata;
```

- [ ] **Step 3: Verifikasi**

```bash
go run cmd/migrate/main.go up
```
Expected: applied 041; `All migrations applied total=23`.
`SELECT count(*) FROM information_schema.tables WHERE table_schema='question';` → **11**

- [ ] **Step 4: Commit**

```bash
git add migrations
git commit -m "feat(db): question content - blocks/options/explanation/hint/solution (phase 4)"
```

---

## Task 4C: Question Junctions — subject/grade/major/curriculum/chapter/topic/competency/skill/tag

**Files:**
- Create: `backend/migrations/042_question_junction.up.sql`
- Create: `backend/migrations/042_question_junction.down.sql`

**Interfaces:**
- Consumes: `question.question`, `academic.subject|grade|major|curriculum|chapter|subchapter|topic|competency|skill`.
- Produces: 10 junction N:M (`question_subject`, `question_grade`, `question_major`, `question_curriculum`, `question_chapter`, `question_subchapter`, `question_topic`, `question_competency`, `question_skill`, `question_tag`). `question_tag` memakai `(question_id, tag text)` composite PK (tidak ada tabel tag akademik).

- [ ] **Step 1: Tulis `042_question_junction.up.sql`**

```sql
-- Migration 042: question junctions N:M to academic domain.

CREATE TABLE question.question_subject (
    question_id uuid NOT NULL REFERENCES question.question(id) ON DELETE CASCADE,
    subject_id uuid NOT NULL REFERENCES academic.subject(id) ON DELETE CASCADE,
    PRIMARY KEY (question_id, subject_id)
);
CREATE INDEX idx_question_subject_ref ON question.question_subject(subject_id);

CREATE TABLE question.question_grade (
    question_id uuid NOT NULL REFERENCES question.question(id) ON DELETE CASCADE,
    grade_id uuid NOT NULL REFERENCES academic.grade(id) ON DELETE CASCADE,
    PRIMARY KEY (question_id, grade_id)
);
CREATE INDEX idx_question_grade_ref ON question.question_grade(grade_id);

CREATE TABLE question.question_major (
    question_id uuid NOT NULL REFERENCES question.question(id) ON DELETE CASCADE,
    major_id uuid NOT NULL REFERENCES academic.major(id) ON DELETE CASCADE,
    PRIMARY KEY (question_id, major_id)
);
CREATE INDEX idx_question_major_ref ON question.question_major(major_id);

CREATE TABLE question.question_curriculum (
    question_id uuid NOT NULL REFERENCES question.question(id) ON DELETE CASCADE,
    curriculum_id uuid NOT NULL REFERENCES academic.curriculum(id) ON DELETE CASCADE,
    PRIMARY KEY (question_id, curriculum_id)
);
CREATE INDEX idx_question_curriculum_ref ON question.question_curriculum(curriculum_id);

CREATE TABLE question.question_chapter (
    question_id uuid NOT NULL REFERENCES question.question(id) ON DELETE CASCADE,
    chapter_id uuid NOT NULL REFERENCES academic.chapter(id) ON DELETE CASCADE,
    PRIMARY KEY (question_id, chapter_id)
);
CREATE INDEX idx_question_chapter_ref ON question.question_chapter(chapter_id);

CREATE TABLE question.question_subchapter (
    question_id uuid NOT NULL REFERENCES question.question(id) ON DELETE CASCADE,
    subchapter_id uuid NOT NULL REFERENCES academic.subchapter(id) ON DELETE CASCADE,
    PRIMARY KEY (question_id, subchapter_id)
);
CREATE INDEX idx_question_subchapter_ref ON question.question_subchapter(subchapter_id);

CREATE TABLE question.question_topic (
    question_id uuid NOT NULL REFERENCES question.question(id) ON DELETE CASCADE,
    topic_id uuid NOT NULL REFERENCES academic.topic(id) ON DELETE CASCADE,
    PRIMARY KEY (question_id, topic_id)
);
CREATE INDEX idx_question_topic_ref ON question.question_topic(topic_id);

CREATE TABLE question.question_competency (
    question_id uuid NOT NULL REFERENCES question.question(id) ON DELETE CASCADE,
    competency_id uuid NOT NULL REFERENCES academic.competency(id) ON DELETE CASCADE,
    PRIMARY KEY (question_id, competency_id)
);
CREATE INDEX idx_question_competency_ref ON question.question_competency(competency_id);

CREATE TABLE question.question_skill (
    question_id uuid NOT NULL REFERENCES question.question(id) ON DELETE CASCADE,
    skill_id uuid NOT NULL REFERENCES academic.skill(id) ON DELETE CASCADE,
    PRIMARY KEY (question_id, skill_id)
);
CREATE INDEX idx_question_skill_ref ON question.question_skill(skill_id);

CREATE TABLE question.question_tag (
    question_id uuid NOT NULL REFERENCES question.question(id) ON DELETE CASCADE,
    tag varchar(80) NOT NULL,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    PRIMARY KEY (question_id, tag)
);
```

- [ ] **Step 2: Tulis `042_question_junction.down.sql`**

```sql
DROP TABLE IF EXISTS question.question_tag;
DROP TABLE IF EXISTS question.question_skill;
DROP TABLE IF EXISTS question.question_competency;
DROP TABLE IF EXISTS question.question_topic;
DROP TABLE IF EXISTS question.question_subchapter;
DROP TABLE IF EXISTS question.question_chapter;
DROP TABLE IF EXISTS question.question_curriculum;
DROP TABLE IF EXISTS question.question_major;
DROP TABLE IF EXISTS question.question_grade;
DROP TABLE IF EXISTS question.question_subject;
```

- [ ] **Step 3: Verifikasi**

```bash
go run cmd/migrate/main.go up
```
Expected: applied 042; `All migrations applied total=24`.
`SELECT count(*) FROM information_schema.tables WHERE table_schema='question';` → **21**
`SELECT count(*) FROM information_schema.tables WHERE table_schema='question' AND table_name='question_subject';` → **1**

- [ ] **Step 4: Commit**

```bash
git add migrations
git commit -m "feat(db): question junctions to academic (phase 4)"
```

---

## Task 4D: Question Review & History — review, approval, validation, duplicate, history

**Files:**
- Create: `backend/migrations/043_question_review.up.sql`
- Create: `backend/migrations/043_question_review.down.sql`

**Interfaces:**
- Consumes: `question.question`, `identity.user`.
- Produces: `question.question_review`, `question.question_approval`, `question.question_validation_issue`, `question.question_duplicate`, `question.question_history` (append-only audit).

- [ ] **Step 1: Tulis `043_question_review.up.sql`**

```sql
-- Migration 043: question review workflow & history (append-only).

CREATE TABLE question.question_review (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    question_id uuid NOT NULL REFERENCES question.question(id) ON DELETE CASCADE,
    reviewer_id uuid REFERENCES identity.user(id) ON DELETE SET NULL,
    status varchar(30) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING','APPROVED','REJECTED','REVISION')),
    comment text,
    reviewed_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_question_review_question ON question.question_review(question_id);
CREATE INDEX idx_question_review_reviewer ON question.question_review(reviewer_id);

CREATE TABLE question.question_approval (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    question_id uuid NOT NULL REFERENCES question.question(id) ON DELETE CASCADE,
    approved_by uuid REFERENCES identity.user(id) ON DELETE SET NULL,
    approved_at timestamptz NOT NULL DEFAULT NOW(),
    approval_note text,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    UNIQUE (question_id)
);

CREATE TABLE question.question_validation_issue (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    question_id uuid NOT NULL REFERENCES question.question(id) ON DELETE CASCADE,
    issue_type varchar(60) NOT NULL,
    severity varchar(20) NOT NULL DEFAULT 'WARNING' CHECK (severity IN ('INFO','WARNING','ERROR')),
    description text,
    resolved boolean NOT NULL DEFAULT false,
    created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_question_validation_question ON question.question_validation_issue(question_id);

CREATE TABLE question.question_duplicate (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    question_id uuid NOT NULL REFERENCES question.question(id) ON DELETE CASCADE,
    duplicate_question_id uuid NOT NULL REFERENCES question.question(id) ON DELETE CASCADE,
    similarity_score numeric(5,4),
    created_at timestamptz NOT NULL DEFAULT NOW(),
    UNIQUE (question_id, duplicate_question_id)
);
CREATE INDEX idx_question_duplicate_ref ON question.question_duplicate(duplicate_question_id);

CREATE TABLE question.question_history (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    question_id uuid REFERENCES question.question(id) ON DELETE SET NULL,
    action varchar(40) NOT NULL CHECK (action IN ('CREATE','UPDATE','REVIEW','APPROVE','REVISION','ARCHIVE','RESTORE','DELETE')),
    changed_by uuid REFERENCES identity.user(id) ON DELETE SET NULL,
    old_json jsonb,
    new_json jsonb,
    created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_question_history_question ON question.question_history(question_id);
CREATE INDEX idx_question_history_time ON question.question_history(created_at);
```

- [ ] **Step 2: Tulis `043_question_review.down.sql`**

```sql
DROP TABLE IF EXISTS question.question_history;
DROP TABLE IF EXISTS question.question_duplicate;
DROP TABLE IF EXISTS question.question_validation_issue;
DROP TABLE IF EXISTS question.question_approval;
DROP TABLE IF EXISTS question.question_review;
```

- [ ] **Step 3: Verifikasi**

```bash
go run cmd/migrate/main.go up
```
Expected: applied 043; `All migrations applied total=25`.
`SELECT count(*) FROM information_schema.tables WHERE table_schema='question';` → **26**

- [ ] **Step 4: Commit**

```bash
git add migrations
git commit -m "feat(db): question review workflow & history (phase 4)"
```

---

## Task 4E: Question Cross-Reference — exam, practice, learning material, AI usage

**Files:**
- Create: `backend/migrations/044_question_crossref.up.sql`
- Create: `backend/migrations/044_question_crossref.down.sql`

**Interfaces:**
- Consumes: `question.question`.
- Produces: `question.question_exam`, `question.question_practice`, `question.question_learning_material`, `question.question_ai_usage`.

**Follow-up (di luar task ini):** `question_exam.exam_id` FK ditambahkan ke `cbt.exam` saat Phase 5; `question_practice.practice_set_id` & `question_learning_material.material_id` FK ditambahkan ke `content.*` saat Phase 6 (kolom dibuat `uuid NOT NULL` tanpa FK di sini, sesuai urutan fase §3).

- [ ] **Step 1: Tulis `044_question_crossref.up.sql`**

```sql
-- Migration 044: question cross-reference (FK to cbt/content added in their phases).

CREATE TABLE question.question_exam (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    question_id uuid NOT NULL REFERENCES question.question(id) ON DELETE CASCADE,
    exam_id uuid NOT NULL,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    UNIQUE (question_id, exam_id)
);
CREATE INDEX idx_question_exam_exam ON question.question_exam(exam_id);
-- FK exam_id -> cbt.exam ditambahkan di Phase 5 (ALTER TABLE ADD CONSTRAINT).

CREATE TABLE question.question_practice (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    question_id uuid NOT NULL REFERENCES question.question(id) ON DELETE CASCADE,
    practice_set_id uuid NOT NULL,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    UNIQUE (question_id, practice_set_id)
);
CREATE INDEX idx_question_practice_set ON question.question_practice(practice_set_id);
-- FK practice_set_id -> content.practice_set ditambahkan di Phase 6.

CREATE TABLE question.question_learning_material (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    question_id uuid NOT NULL REFERENCES question.question(id) ON DELETE CASCADE,
    material_id uuid NOT NULL,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    UNIQUE (question_id, material_id)
);
CREATE INDEX idx_question_material ON question.question_learning_material(material_id);
-- FK material_id -> content.material ditambahkan di Phase 6.

CREATE TABLE question.question_ai_usage (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    question_id uuid NOT NULL REFERENCES question.question(id) ON DELETE CASCADE,
    ai_model varchar(120),
    generated_at timestamptz NOT NULL DEFAULT NOW(),
    created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_question_ai_usage_question ON question.question_ai_usage(question_id);
```

- [ ] **Step 2: Tulis `044_question_crossref.down.sql`**

```sql
DROP TABLE IF EXISTS question.question_ai_usage;
DROP TABLE IF EXISTS question.question_learning_material;
DROP TABLE IF EXISTS question.question_practice;
DROP TABLE IF EXISTS question.question_exam;
```

- [ ] **Step 3: Verifikasi**

```bash
go run cmd/migrate/main.go up
```
Expected: applied 044; `All migrations applied total=26`.
`SELECT count(*) FROM information_schema.tables WHERE table_schema='question';` → **30**
`SELECT count(*) FROM pg_constraint WHERE conrelid='question.question_exam'::regclass;` → **1** (hanya FK ke question; FK exam belum ada)

- [ ] **Step 4: Commit**

```bash
git add migrations
git commit -m "feat(db): question cross-reference - exam/practice/material/ai (phase 4)"
```

---

## Task 4F: Question Statistics — statistics, IRT, answer distribution, usage counter

**Files:**
- Create: `backend/migrations/045_question_statistics.up.sql`
- Create: `backend/migrations/045_question_statistics.down.sql`

**Interfaces:**
- Consumes: `question.question`.
- Produces: `question.question_statistics`, `question.question_irt`, `question.question_answer_distribution`, `question.question_usage_counter`.

- [ ] **Step 1: Tulis `045_question_statistics.up.sql`**

```sql
-- Migration 045: question statistics - statistics, IRT params, answer distribution, usage counter.

CREATE TABLE question.question_statistics (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    question_id uuid NOT NULL REFERENCES question.question(id) ON DELETE CASCADE,
    total_answer int NOT NULL DEFAULT 0,
    correct int NOT NULL DEFAULT 0,
    wrong int NOT NULL DEFAULT 0,
    skip int NOT NULL DEFAULT 0,
    accuracy numeric(5,2) NOT NULL DEFAULT 0,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW(),
    UNIQUE (question_id)
);
CREATE TRIGGER trg_question_statistics_updated BEFORE UPDATE ON question.question_statistics
    FOR EACH ROW EXECUTE FUNCTION shared.set_updated_at();

CREATE TABLE question.question_irt (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    question_id uuid NOT NULL REFERENCES question.question(id) ON DELETE CASCADE,
    parameter_a numeric(6,3),
    parameter_b numeric(6,3),
    parameter_c numeric(6,3),
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW(),
    UNIQUE (question_id)
);
CREATE TRIGGER trg_question_irt_updated BEFORE UPDATE ON question.question_irt
    FOR EACH ROW EXECUTE FUNCTION shared.set_updated_at();

CREATE TABLE question.question_answer_distribution (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    question_id uuid NOT NULL REFERENCES question.question(id) ON DELETE CASCADE,
    option_label varchar(10) NOT NULL,
    selected_count int NOT NULL DEFAULT 0,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    UNIQUE (question_id, option_label)
);
CREATE INDEX idx_answer_distribution_question ON question.question_answer_distribution(question_id);

CREATE TABLE question.question_usage_counter (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    question_id uuid NOT NULL REFERENCES question.question(id) ON DELETE CASCADE,
    exam_count int NOT NULL DEFAULT 0,
    practice_count int NOT NULL DEFAULT 0,
    favorite_count int NOT NULL DEFAULT 0,
    report_count int NOT NULL DEFAULT 0,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW(),
    UNIQUE (question_id)
);
CREATE TRIGGER trg_question_usage_updated BEFORE UPDATE ON question.question_usage_counter
    FOR EACH ROW EXECUTE FUNCTION shared.set_updated_at();
```

- [ ] **Step 2: Tulis `045_question_statistics.down.sql`**

```sql
DROP TABLE IF EXISTS question.question_usage_counter;
DROP TABLE IF EXISTS question.question_answer_distribution;
DROP TABLE IF EXISTS question.question_irt;
DROP TABLE IF EXISTS question.question_statistics;
```

- [ ] **Step 3: Verifikasi**

```bash
go run cmd/migrate/main.go up
```
Expected: applied 045; `All migrations applied total=27`.
`SELECT count(*) FROM information_schema.tables WHERE table_schema='question';` → **34**

- [ ] **Step 4: Commit**

```bash
git add migrations
git commit -m "feat(db): question statistics - stats/irt/distribution/usage (phase 4)"
```

---

## Task 4G: Question Import & AI Parsing — import job, row, OCR result, AI parsing

**Files:**
- Create: `backend/migrations/046_question_import.up.sql`
- Create: `backend/migrations/046_question_import.down.sql`

**Interfaces:**
- Consumes: `question.question_import_job` (self), `media.asset`.
- Produces: `question.question_import_job`, `question.question_import_row`, `question.question_ocr_result`, `question.question_ai_parsing`.

- [ ] **Step 1: Tulis `046_question_import.up.sql`**

```sql
-- Migration 046: question import & AI parsing - job, row, OCR result, AI parsing.

CREATE TABLE question.question_import_job (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    file_id uuid REFERENCES media.asset(id) ON DELETE SET NULL,
    status text NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING','VALIDATING','PROCESSING','SUCCESS','FAILED','CANCELLED')),
    started_at timestamptz,
    finished_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_question_import_job_status ON question.question_import_job(status);
CREATE TRIGGER trg_question_import_job_updated BEFORE UPDATE ON question.question_import_job
    FOR EACH ROW EXECUTE FUNCTION shared.set_updated_at();

CREATE TABLE question.question_import_row (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id uuid NOT NULL REFERENCES question.question_import_job(id) ON DELETE CASCADE,
    row_no int NOT NULL,
    status text NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING','SUCCESS','FAILED','SKIPPED')),
    error_message text,
    created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_question_import_row_job ON question.question_import_row(job_id);

CREATE TABLE question.question_ocr_result (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    asset_id uuid NOT NULL REFERENCES media.asset(id) ON DELETE CASCADE,
    ocr_json jsonb,
    created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_question_ocr_asset ON question.question_ocr_result(asset_id);

CREATE TABLE question.question_ai_parsing (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    asset_id uuid NOT NULL REFERENCES media.asset(id) ON DELETE CASCADE,
    model_name varchar(120),
    result_json jsonb,
    confidence numeric(5,4),
    created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_question_ai_parsing_asset ON question.question_ai_parsing(asset_id);
```

- [ ] **Step 2: Tulis `046_question_import.down.sql`**

```sql
DROP TABLE IF EXISTS question.question_ai_parsing;
DROP TABLE IF EXISTS question.question_ocr_result;
DROP TABLE IF EXISTS question.question_import_row;
DROP TABLE IF EXISTS question.question_import_job;
```

- [ ] **Step 3: Verifikasi**

```bash
go run cmd/migrate/main.go up
```
Expected: applied 046; `All migrations applied total=28`.
`SELECT count(*) FROM information_schema.tables WHERE table_schema='question';` → **38** ✓ (menyelesaikan domain question)

- [ ] **Step 4: Commit**

```bash
git add migrations
git commit -m "feat(db): question import & AI parsing (phase 4) - completes question domain (38 tables)"
```

---

## Self-Review

**Spec coverage:** design doc §3 fase 4 (Question, 38 tabel) terpenuhi: 7 file migrasi (040–046), 38 tabel sesuai §4.4 katalog. Daftar 1:1 — question, question_version, question_metadata, question_status, question_history, question_block, question_option, option_block, explanation, explanation_block, hint, solution_step, question_subject, question_grade, question_major, question_curriculum, question_chapter, question_subchapter, question_topic, question_competency, question_skill, question_tag, question_review, question_approval, question_validation_issue, question_duplicate, question_exam, question_practice, question_learning_material, question_ai_usage, question_statistics, question_irt, question_answer_distribution, question_usage_counter, question_import_job, question_import_row, question_ocr_result, question_ai_parsing = 38.

**Placeholder scan:** tidak ada TBD/TODO; SQL lengkap per task; enum & indeks eksplisit.

**Type/name consistency:** konvensi §2 diterapkan (uuid PK, snake_case, timestamps, deleted_at pada `question`, CHECK enum, indeks FK/komposit/unik). Circular FK `question.current_version_id` diselesaikan via `ALTER TABLE ADD CONSTRAINT` (Task 4A). Junction `question_tag` memakai `(question_id, tag)` karena tidak ada tabel tag akademik — konsisten dengan pola junction lain. FK lintas domain yang belum ada (cbt.exam, content.practice_set, content.material) dibuat sebagai kolom uuid tanpa FK dan ditambahkan di fase pemilik (dicatat di Task 4E).

**Cacat design yang dihindari:** tidak ada dual-schema legacy (menu/`questions` lama sudah dihapus di Phase 0); konten soal versioned melalui `question_version` + blok modular; statistik & IRT terpisah dari konten (bukan on-the-fly).

## Execution Handoff

**Plan selesai & tersimpan: `docs/superpowers/plans/2026-08-04-database-rebuild-phase4-question.md`. Dua opsi eksekusi:**

1. **Subagent-Driven (recommended)** — dispatch subagent baru per task, review antar task, iterasi cepat.
2. **Inline Execution** — eksekusi tasks di sesi ini dengan checkpoints.

**Pilih yang mana?**
