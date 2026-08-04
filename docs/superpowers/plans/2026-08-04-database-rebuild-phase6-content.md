# Database Rebuild Phase 6 Implementation Plan (Content / LCMS)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bangun domain `content` (materi pembelajaran / LCMS) — 48 tabel — sesuai design doc `docs/superpowers/specs/2026-08-04-database-rebuild-design.md` §4.6, menggantikan `content_*`/`material_*` legacy.

**Architecture:** `content.material` adalah identitas materi (versi pola versioned-content seperti `question` Phase 4: identitas → versi → blok konten). Junction N:M ke `academic.*` pakai composite PK. Quiz/assignment/certificate/progress/statistik/AI terpisah dari konten. **Plus 2 tabel `practice_set`** (keputusan user 2026-08-05) untuk meresolusi FK `question.question_practice.practice_set_id → content.practice_set` yang dijanjikan Phase 4.

**Tech Stack:** PostgreSQL (Supabase), runner Go `go run cmd/migrate/main.go up`, verifikasi via throwaway Go program (pgx) + `cmd/tools/dbcheck`.

**Files target:** `backend/migrations/061_material_core.{up,down}.sql` s.d. `072_content_practice_set.{up,down}.sql` (12 file pasangan).

---

## Global Constraints

Semua tabel mematuhi **Global Conventions** (`docs/superpowers/specs/2026-08-04-database-rebuild-design.md` §2):

- PK: `id uuid PRIMARY KEY DEFAULT gen_random_uuid()` di setiap tabel (junction pakai composite PK).
- Nama `snake_case` singular; kolom referensi `<entity>_id`.
- `created_at timestamptz NOT NULL DEFAULT NOW()` wajib; `updated_at` untuk tabel mutable.
- Soft delete `deleted_at` hanya pada master (`content.material`, `content.practice_set`).
- Enum: `text` + `CHECK (col IN (...))`, tidak `CREATE TYPE`.
- Indeks semua FK + filter umum; indeks unik sesuai spec.
- FK lintas schema: `identity.user` (owner/student/reviewer), `question.question` (quiz/assignment/practice_set_question), `media.asset` (block/attachment/thumbnail/subtitle/submission), `academic.*` (junction).
- Migrasi harus `up` bersih dari nol, dibungkus transaksi (runner sudah tx per file).
- Jangan sentuh kode Go runner.
- **Keputusan desain (deviasi minor, dicatat):**
  1. **Tidak ada partisi fisik** — konsisten dengan semua fase sebelumnya; strategi partisi ditunda.
  2. `material_tag` junction `(material_id, tag text)` composite PK — pola sama dengan `question_tag`/`exam_tag`.
  3. **FK tertunda Phase 4:** `question.question_learning_material.material_id → content.material` (Task 6A) dan `question.question_practice.practice_set_id → content.practice_set` (Task 6L) ditambahkan via `ALTER TABLE ADD CONSTRAINT` — follow-up yang dijanjikan plan Phase 4.
  4. `practice_set` (2 tabel: `practice_set`, `practice_set_question`) ditambahkan ke domain content atas keputusan user — katalog §4.6 tidak memuatnya; total Content = 48 tabel (46 katalog + 2 baru).
  5. `material_embedding.embedding_id` dibuat `uuid` tanpa FK (target `ai.*` belum ada; FK ditunda ke Phase 12) — pola yang sama dengan deferred FK Phase 4/5.

---

## Task 6A: Material Core — type, status, material, version, metadata

**Files:**
- Create: `backend/migrations/061_material_core.up.sql`
- Create: `backend/migrations/061_material_core.down.sql`

**Interfaces:**
- Consumes: `identity.user`, schema `content` (000), `shared.set_updated_at()` (001), `question.question_learning_material` (044, untuk menambahkan FK tertunda).
- Produces: `content.material_type`, `content.material_status`, `content.material` (master), `content.material_version`, `content.material_metadata`, plus `fk_question_material` pada `question.question_learning_material`.

- [ ] **Step 1: Tulis `061_material_core.up.sql`**

```sql
-- Migration 061: material core - type/status lookup, material master, version, metadata.

CREATE TABLE content.material_type (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    code varchar(30) NOT NULL,
    name varchar(100) NOT NULL,
    description text,
    created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX uq_material_type_code ON content.material_type(code);

CREATE TABLE content.material_status (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    code varchar(30) NOT NULL,
    name varchar(100) NOT NULL,
    description text,
    created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX uq_material_status_code ON content.material_status(code);

CREATE TABLE content.material (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    material_code varchar(50) NOT NULL,
    title varchar(200) NOT NULL,
    slug varchar(200) NOT NULL,
    summary text,
    material_type_id uuid REFERENCES content.material_type(id) ON DELETE SET NULL,
    current_version_id uuid,
    status_id uuid REFERENCES content.material_status(id) ON DELETE SET NULL,
    owner_id uuid REFERENCES identity.user(id) ON DELETE SET NULL,
    created_by uuid REFERENCES identity.user(id) ON DELETE SET NULL,
    updated_by uuid REFERENCES identity.user(id) ON DELETE SET NULL,
    published_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW(),
    deleted_at timestamptz
);
CREATE UNIQUE INDEX uq_material_code ON content.material(material_code) WHERE deleted_at IS NULL;
CREATE UNIQUE INDEX uq_material_slug ON content.material(slug) WHERE deleted_at IS NULL;
CREATE INDEX idx_material_type ON content.material(material_type_id);
CREATE INDEX idx_material_status ON content.material(status_id);
CREATE INDEX idx_material_owner ON content.material(owner_id);
CREATE INDEX idx_material_published ON content.material(published_at);
CREATE TRIGGER trg_material_updated BEFORE UPDATE ON content.material
    FOR EACH ROW EXECUTE FUNCTION shared.set_updated_at();

CREATE TABLE content.material_version (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    material_id uuid NOT NULL REFERENCES content.material(id) ON DELETE CASCADE,
    version_no int NOT NULL DEFAULT 1,
    change_summary text,
    created_by uuid REFERENCES identity.user(id) ON DELETE SET NULL,
    is_current boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    UNIQUE (material_id, version_no)
);
CREATE INDEX idx_material_version_material ON content.material_version(material_id);
CREATE INDEX idx_material_version_current ON content.material_version(material_id) WHERE is_current;

CREATE TABLE content.material_metadata (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    material_id uuid NOT NULL REFERENCES content.material(id) ON DELETE CASCADE,
    estimated_minutes int,
    reading_level varchar(30),
    difficulty_level varchar(20) CHECK (difficulty_level IN ('EASY','MEDIUM','HARD','VERY_HARD')),
    language varchar(16) DEFAULT 'id',
    is_premium boolean NOT NULL DEFAULT false,
    certificate_enabled boolean NOT NULL DEFAULT false,
    downloadable boolean NOT NULL DEFAULT true,
    printable boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    UNIQUE (material_id)
);

-- Circular FK: material.current_version_id -> material_version (resolved after both tables exist).
ALTER TABLE content.material ADD CONSTRAINT fk_material_current_version
    FOREIGN KEY (current_version_id) REFERENCES content.material_version(id);

-- Deferred FK from Phase 4: question.question_learning_material.material_id -> content.material.
ALTER TABLE question.question_learning_material ADD CONSTRAINT fk_question_material
    FOREIGN KEY (material_id) REFERENCES content.material(id);
```

- [ ] **Step 2: Tulis `061_material_core.down.sql`**

```sql
ALTER TABLE question.question_learning_material DROP CONSTRAINT IF EXISTS fk_question_material;
ALTER TABLE content.material DROP CONSTRAINT IF EXISTS fk_material_current_version;
DROP TABLE IF EXISTS content.material_metadata;
DROP TABLE IF EXISTS content.material_version;
DROP TABLE IF EXISTS content.material;
DROP TABLE IF EXISTS content.material_status;
DROP TABLE IF EXISTS content.material_type;
```

- [ ] **Step 3: Verifikasi**

Dari `backend/`:
```bash
go run cmd/migrate/main.go up
```
Expected: `Migration applied name=061_material_core.up.sql`; `All migrations applied total=41`.

Kemudian verifikasi via throwaway Go program (pgx, URL dari `backend/config.yaml` `database.url`):
- `SELECT count(*) FROM information_schema.tables WHERE table_schema='content';` → **5**
- `SELECT count(*) FROM pg_constraint WHERE conname='fk_material_current_version';` → **1**
- `SELECT count(*) FROM pg_constraint WHERE conname='fk_question_material';` → **1**

- [ ] **Step 4: Commit**

```bash
git add migrations
git commit -m "feat(db): material core - type/status/material/version/metadata + resolve question_material FK (phase 6)"
```

---

## Task 6B: Material Content — block, section, section_block, toc, history

**Files:**
- Create: `backend/migrations/062_material_content.up.sql`
- Create: `backend/migrations/062_material_content.down.sql`

**Interfaces:**
- Consumes: `content.material`, `content.material_version`, `media.asset`.
- Produces: `content.material_block`, `content.material_section`, `content.material_section_block`, `content.material_table_of_content` (self-FK), `content.material_history` (append-only).

- [ ] **Step 1: Tulis `062_material_content.up.sql`**

```sql
-- Migration 062: material content - block, section, section block, table of content, history.

CREATE TABLE content.material_block (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    material_version_id uuid NOT NULL REFERENCES content.material_version(id) ON DELETE CASCADE,
    block_order int NOT NULL DEFAULT 0,
    block_type text NOT NULL CHECK (block_type IN ('PARAGRAPH','IMAGE','VIDEO','AUDIO','LATEX','TABLE','SVG','GRAPH','CODE','HTML','MARKDOWN','QUIZ','CALLOUT','TIMELINE','EMBED','ACCORDION','CHECKLIST')),
    content text,
    asset_id uuid REFERENCES media.asset(id) ON DELETE SET NULL,
    style_json jsonb,
    created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_material_block_version ON content.material_block(material_version_id);
CREATE INDEX idx_material_block_asset ON content.material_block(asset_id);

CREATE TABLE content.material_section (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    material_version_id uuid NOT NULL REFERENCES content.material_version(id) ON DELETE CASCADE,
    title varchar(200),
    description text,
    order_no int NOT NULL DEFAULT 0,
    created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_material_section_version ON content.material_section(material_version_id);

CREATE TABLE content.material_section_block (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    section_id uuid NOT NULL REFERENCES content.material_section(id) ON DELETE CASCADE,
    block_order int NOT NULL DEFAULT 0,
    block_type text NOT NULL CHECK (block_type IN ('PARAGRAPH','IMAGE','VIDEO','AUDIO','LATEX','TABLE','SVG','GRAPH','CODE','HTML','MARKDOWN','QUIZ','CALLOUT','TIMELINE','EMBED','ACCORDION','CHECKLIST')),
    content text,
    asset_id uuid REFERENCES media.asset(id) ON DELETE SET NULL,
    created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_material_section_block_section ON content.material_section_block(section_id);
CREATE INDEX idx_material_section_block_asset ON content.material_section_block(asset_id);

CREATE TABLE content.material_table_of_content (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    material_id uuid NOT NULL REFERENCES content.material(id) ON DELETE CASCADE,
    parent_id uuid REFERENCES content.material_table_of_content(id) ON DELETE SET NULL,
    title varchar(200) NOT NULL,
    order_no int NOT NULL DEFAULT 0,
    created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_material_toc_material ON content.material_table_of_content(material_id);
CREATE INDEX idx_material_toc_parent ON content.material_table_of_content(parent_id);

CREATE TABLE content.material_history (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    material_id uuid REFERENCES content.material(id) ON DELETE SET NULL,
    action varchar(40) NOT NULL CHECK (action IN ('CREATE','UPDATE','REVIEW','APPROVE','PUBLISH','ARCHIVE','RESTORE','DELETE')),
    changed_by uuid REFERENCES identity.user(id) ON DELETE SET NULL,
    old_json jsonb,
    new_json jsonb,
    created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_material_history_material ON content.material_history(material_id);
CREATE INDEX idx_material_history_time ON content.material_history(created_at);
```

- [ ] **Step 2: Tulis `062_material_content.down.sql`**

```sql
DROP TABLE IF EXISTS content.material_history;
DROP TABLE IF EXISTS content.material_table_of_content;
DROP TABLE IF EXISTS content.material_section_block;
DROP TABLE IF EXISTS content.material_section;
DROP TABLE IF EXISTS content.material_block;
```

- [ ] **Step 3: Verifikasi**

```bash
go run cmd/migrate/main.go up
```
Expected: applied 062; `All migrations applied total=42`.
`SELECT count(*) FROM information_schema.tables WHERE table_schema='content';` → **10**

- [ ] **Step 4: Commit**

```bash
git add migrations
git commit -m "feat(db): material content - block/section/toc/history (phase 6)"
```

---

## Task 6C: Material Junctions — subject/grade/major/curriculum/chapter/subchapter/topic/competency/skill/tag

**Files:**
- Create: `backend/migrations/063_material_junction.up.sql`
- Create: `backend/migrations/063_material_junction.down.sql`

**Interfaces:**
- Consumes: `content.material`, `academic.subject|grade|major|curriculum|chapter|subchapter|topic|competency|skill`.
- Produces: 10 junction N:M (`material_subject`, `material_grade`, `material_major`, `material_curriculum`, `material_chapter`, `material_subchapter`, `material_topic`, `material_competency`, `material_skill`, `material_tag`). `material_tag` memakai `(material_id, tag text)` composite PK.

- [ ] **Step 1: Tulis `063_material_junction.up.sql`**

```sql
-- Migration 063: material junctions N:M to academic domain.

CREATE TABLE content.material_subject (
    material_id uuid NOT NULL REFERENCES content.material(id) ON DELETE CASCADE,
    subject_id uuid NOT NULL REFERENCES academic.subject(id) ON DELETE CASCADE,
    PRIMARY KEY (material_id, subject_id)
);
CREATE INDEX idx_material_subject_ref ON content.material_subject(subject_id);

CREATE TABLE content.material_grade (
    material_id uuid NOT NULL REFERENCES content.material(id) ON DELETE CASCADE,
    grade_id uuid NOT NULL REFERENCES academic.grade(id) ON DELETE CASCADE,
    PRIMARY KEY (material_id, grade_id)
);
CREATE INDEX idx_material_grade_ref ON content.material_grade(grade_id);

CREATE TABLE content.material_major (
    material_id uuid NOT NULL REFERENCES content.material(id) ON DELETE CASCADE,
    major_id uuid NOT NULL REFERENCES academic.major(id) ON DELETE CASCADE,
    PRIMARY KEY (material_id, major_id)
);
CREATE INDEX idx_material_major_ref ON content.material_major(major_id);

CREATE TABLE content.material_curriculum (
    material_id uuid NOT NULL REFERENCES content.material(id) ON DELETE CASCADE,
    curriculum_id uuid NOT NULL REFERENCES academic.curriculum(id) ON DELETE CASCADE,
    PRIMARY KEY (material_id, curriculum_id)
);
CREATE INDEX idx_material_curriculum_ref ON content.material_curriculum(curriculum_id);

CREATE TABLE content.material_chapter (
    material_id uuid NOT NULL REFERENCES content.material(id) ON DELETE CASCADE,
    chapter_id uuid NOT NULL REFERENCES academic.chapter(id) ON DELETE CASCADE,
    PRIMARY KEY (material_id, chapter_id)
);
CREATE INDEX idx_material_chapter_ref ON content.material_chapter(chapter_id);

CREATE TABLE content.material_subchapter (
    material_id uuid NOT NULL REFERENCES content.material(id) ON DELETE CASCADE,
    subchapter_id uuid NOT NULL REFERENCES academic.subchapter(id) ON DELETE CASCADE,
    PRIMARY KEY (material_id, subchapter_id)
);
CREATE INDEX idx_material_subchapter_ref ON content.material_subchapter(subchapter_id);

CREATE TABLE content.material_topic (
    material_id uuid NOT NULL REFERENCES content.material(id) ON DELETE CASCADE,
    topic_id uuid NOT NULL REFERENCES academic.topic(id) ON DELETE CASCADE,
    PRIMARY KEY (material_id, topic_id)
);
CREATE INDEX idx_material_topic_ref ON content.material_topic(topic_id);

CREATE TABLE content.material_competency (
    material_id uuid NOT NULL REFERENCES content.material(id) ON DELETE CASCADE,
    competency_id uuid NOT NULL REFERENCES academic.competency(id) ON DELETE CASCADE,
    PRIMARY KEY (material_id, competency_id)
);
CREATE INDEX idx_material_competency_ref ON content.material_competency(competency_id);

CREATE TABLE content.material_skill (
    material_id uuid NOT NULL REFERENCES content.material(id) ON DELETE CASCADE,
    skill_id uuid NOT NULL REFERENCES academic.skill(id) ON DELETE CASCADE,
    PRIMARY KEY (material_id, skill_id)
);
CREATE INDEX idx_material_skill_ref ON content.material_skill(skill_id);

CREATE TABLE content.material_tag (
    material_id uuid NOT NULL REFERENCES content.material(id) ON DELETE CASCADE,
    tag varchar(80) NOT NULL,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    PRIMARY KEY (material_id, tag)
);
```

- [ ] **Step 2: Tulis `063_material_junction.down.sql`**

```sql
DROP TABLE IF EXISTS content.material_tag;
DROP TABLE IF EXISTS content.material_skill;
DROP TABLE IF EXISTS content.material_competency;
DROP TABLE IF EXISTS content.material_topic;
DROP TABLE IF EXISTS content.material_subchapter;
DROP TABLE IF EXISTS content.material_chapter;
DROP TABLE IF EXISTS content.material_curriculum;
DROP TABLE IF EXISTS content.material_major;
DROP TABLE IF EXISTS content.material_grade;
DROP TABLE IF EXISTS content.material_subject;
```

- [ ] **Step 3: Verifikasi**

```bash
go run cmd/migrate/main.go up
```
Expected: applied 063; `All migrations applied total=43`.
`SELECT count(*) FROM information_schema.tables WHERE table_schema='content';` → **20**

- [ ] **Step 4: Commit**

```bash
git add migrations
git commit -m "feat(db): material junctions to academic (phase 6)"
```

---

## Task 6D: Material Media — attachment, thumbnail, subtitle, transcript

**Files:**
- Create: `backend/migrations/064_material_media.up.sql`
- Create: `backend/migrations/064_material_media.down.sql`

**Interfaces:**
- Consumes: `content.material`, `media.asset`.
- Produces: `content.material_attachment`, `content.material_thumbnail`, `content.material_subtitle`, `content.material_transcript`.

- [ ] **Step 1: Tulis `064_material_media.up.sql`**

```sql
-- Migration 064: material media - attachment, thumbnail, subtitle, transcript.

CREATE TABLE content.material_attachment (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    material_id uuid NOT NULL REFERENCES content.material(id) ON DELETE CASCADE,
    asset_id uuid NOT NULL REFERENCES media.asset(id) ON DELETE CASCADE,
    attachment_type varchar(20) NOT NULL DEFAULT 'SUPPORT' CHECK (attachment_type IN ('PRIMARY','SUPPORT','DOWNLOAD')),
    created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_material_attachment_material ON content.material_attachment(material_id);
CREATE INDEX idx_material_attachment_asset ON content.material_attachment(asset_id);

CREATE TABLE content.material_thumbnail (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    material_id uuid NOT NULL REFERENCES content.material(id) ON DELETE CASCADE,
    asset_id uuid NOT NULL REFERENCES media.asset(id) ON DELETE CASCADE,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    UNIQUE (material_id)
);

CREATE TABLE content.material_subtitle (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    material_id uuid NOT NULL REFERENCES content.material(id) ON DELETE CASCADE,
    language varchar(16) NOT NULL DEFAULT 'id',
    asset_id uuid NOT NULL REFERENCES media.asset(id) ON DELETE CASCADE,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    UNIQUE (material_id, language)
);
CREATE INDEX idx_material_subtitle_asset ON content.material_subtitle(asset_id);

CREATE TABLE content.material_transcript (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    material_id uuid NOT NULL REFERENCES content.material(id) ON DELETE CASCADE,
    content text,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    UNIQUE (material_id)
);
```

- [ ] **Step 2: Tulis `064_material_media.down.sql`**

```sql
DROP TABLE IF EXISTS content.material_transcript;
DROP TABLE IF EXISTS content.material_subtitle;
DROP TABLE IF EXISTS content.material_thumbnail;
DROP TABLE IF EXISTS content.material_attachment;
```

- [ ] **Step 3: Verifikasi**

```bash
go run cmd/migrate/main.go up
```
Expected: applied 064; `All migrations applied total=44`.
`SELECT count(*) FROM information_schema.tables WHERE table_schema='content';` → **24**

- [ ] **Step 4: Commit**

```bash
git add migrations
git commit -m "feat(db): material media - attachment/thumbnail/subtitle/transcript (phase 6)"
```

---

## Task 6E: Material Quiz — quiz, quiz_question

**Files:**
- Create: `backend/migrations/065_material_quiz.up.sql`
- Create: `backend/migrations/065_material_quiz.down.sql`

**Interfaces:**
- Consumes: `content.material`, `question.question`.
- Produces: `content.material_quiz`, `content.material_quiz_question`.

- [ ] **Step 1: Tulis `065_material_quiz.up.sql`**

```sql
-- Migration 065: material quiz & quiz questions.

CREATE TABLE content.material_quiz (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    material_id uuid NOT NULL REFERENCES content.material(id) ON DELETE CASCADE,
    title varchar(200) NOT NULL,
    created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_material_quiz_material ON content.material_quiz(material_id);

CREATE TABLE content.material_quiz_question (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    quiz_id uuid NOT NULL REFERENCES content.material_quiz(id) ON DELETE CASCADE,
    question_id uuid NOT NULL REFERENCES question.question(id) ON DELETE CASCADE,
    display_order int NOT NULL DEFAULT 0,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    UNIQUE (quiz_id, question_id)
);
CREATE INDEX idx_material_quiz_question_quiz ON content.material_quiz_question(quiz_id);
CREATE INDEX idx_material_quiz_question_q ON content.material_quiz_question(question_id);
```

- [ ] **Step 2: Tulis `065_material_quiz.down.sql`**

```sql
DROP TABLE IF EXISTS content.material_quiz_question;
DROP TABLE IF EXISTS content.material_quiz;
```

- [ ] **Step 3: Verifikasi**

```bash
go run cmd/migrate/main.go up
```
Expected: applied 065; `All migrations applied total=45`.
`SELECT count(*) FROM information_schema.tables WHERE table_schema='content';` → **26**

- [ ] **Step 4: Commit**

```bash
git add migrations
git commit -m "feat(db): material quiz & quiz questions (phase 6)"
```

---

## Task 6F: Material Assignment — assignment, assignment_submission

**Files:**
- Create: `backend/migrations/066_material_assignment.up.sql`
- Create: `backend/migrations/066_material_assignment.down.sql`

**Interfaces:**
- Consumes: `content.material`, `identity.user`, `media.asset`.
- Produces: `content.material_assignment`, `content.material_assignment_submission`.

- [ ] **Step 1: Tulis `066_material_assignment.up.sql`**

```sql
-- Migration 066: material assignment & submissions.

CREATE TABLE content.material_assignment (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    material_id uuid NOT NULL REFERENCES content.material(id) ON DELETE CASCADE,
    title varchar(200) NOT NULL,
    instruction text,
    created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_material_assignment_material ON content.material_assignment(material_id);

CREATE TABLE content.material_assignment_submission (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    assignment_id uuid NOT NULL REFERENCES content.material_assignment(id) ON DELETE CASCADE,
    student_id uuid NOT NULL REFERENCES identity.user(id) ON DELETE CASCADE,
    asset_id uuid REFERENCES media.asset(id) ON DELETE SET NULL,
    submitted_at timestamptz NOT NULL DEFAULT NOW(),
    created_at timestamptz NOT NULL DEFAULT NOW(),
    UNIQUE (assignment_id, student_id)
);
CREATE INDEX idx_material_assignment_submission_student ON content.material_assignment_submission(student_id);
CREATE INDEX idx_material_assignment_submission_asset ON content.material_assignment_submission(asset_id);
```

- [ ] **Step 2: Tulis `066_material_assignment.down.sql`**

```sql
DROP TABLE IF EXISTS content.material_assignment_submission;
DROP TABLE IF EXISTS content.material_assignment;
```

- [ ] **Step 3: Verifikasi**

```bash
go run cmd/migrate/main.go up
```
Expected: applied 066; `All migrations applied total=46`.
`SELECT count(*) FROM information_schema.tables WHERE table_schema='content';` → **28**

- [ ] **Step 4: Commit**

```bash
git add migrations
git commit -m "feat(db): material assignment & submission (phase 6)"
```

---

## Task 6G: Material Review — review, approval, validation

**Files:**
- Create: `backend/migrations/067_material_review.up.sql`
- Create: `backend/migrations/067_material_review.down.sql`

**Interfaces:**
- Consumes: `content.material`, `identity.user`.
- Produces: `content.material_review`, `content.material_approval`, `content.material_validation`.

- [ ] **Step 1: Tulis `067_material_review.up.sql`**

```sql
-- Migration 067: material review workflow.

CREATE TABLE content.material_review (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    material_id uuid NOT NULL REFERENCES content.material(id) ON DELETE CASCADE,
    reviewer_id uuid REFERENCES identity.user(id) ON DELETE SET NULL,
    status varchar(30) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING','APPROVED','REJECTED','REVISION')),
    comment text,
    reviewed_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_material_review_material ON content.material_review(material_id);
CREATE INDEX idx_material_review_reviewer ON content.material_review(reviewer_id);

CREATE TABLE content.material_approval (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    material_id uuid NOT NULL REFERENCES content.material(id) ON DELETE CASCADE,
    approved_by uuid REFERENCES identity.user(id) ON DELETE SET NULL,
    approved_at timestamptz NOT NULL DEFAULT NOW(),
    created_at timestamptz NOT NULL DEFAULT NOW(),
    UNIQUE (material_id)
);

CREATE TABLE content.material_validation (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    material_id uuid NOT NULL REFERENCES content.material(id) ON DELETE CASCADE,
    issue_type varchar(60) NOT NULL,
    description text,
    created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_material_validation_material ON content.material_validation(material_id);
```

- [ ] **Step 2: Tulis `067_material_review.down.sql`**

```sql
DROP TABLE IF EXISTS content.material_validation;
DROP TABLE IF EXISTS content.material_approval;
DROP TABLE IF EXISTS content.material_review;
```

- [ ] **Step 3: Verifikasi**

```bash
go run cmd/migrate/main.go up
```
Expected: applied 067; `All migrations applied total=47`.
`SELECT count(*) FROM information_schema.tables WHERE table_schema='content';` → **31**

- [ ] **Step 4: Commit**

```bash
git add migrations
git commit -m "feat(db): material review/approval/validation (phase 6)"
```

---

## Task 6H: Learning Progress — progress, session, bookmark, note, highlight

**Files:**
- Create: `backend/migrations/068_learning_progress.up.sql`
- Create: `backend/migrations/068_learning_progress.down.sql`

**Interfaces:**
- Consumes: `identity.user`, `content.material`, `content.material_block`.
- Produces: `content.learning_progress`, `content.material_session`, `content.material_bookmark`, `content.material_note`, `content.material_highlight`.

- [ ] **Step 1: Tulis `068_learning_progress.up.sql`**

```sql
-- Migration 068: learning progress - progress, session, bookmark, note, highlight.

CREATE TABLE content.learning_progress (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id uuid NOT NULL REFERENCES identity.user(id) ON DELETE CASCADE,
    material_id uuid NOT NULL REFERENCES content.material(id) ON DELETE CASCADE,
    progress_percent numeric(5,2) NOT NULL DEFAULT 0,
    last_position int,
    completed boolean NOT NULL DEFAULT false,
    completed_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW(),
    UNIQUE (student_id, material_id)
);
CREATE INDEX idx_learning_progress_student ON content.learning_progress(student_id);
CREATE INDEX idx_learning_progress_material ON content.learning_progress(material_id);
CREATE TRIGGER trg_learning_progress_updated BEFORE UPDATE ON content.learning_progress
    FOR EACH ROW EXECUTE FUNCTION shared.set_updated_at();

CREATE TABLE content.material_session (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id uuid NOT NULL REFERENCES identity.user(id) ON DELETE CASCADE,
    material_id uuid NOT NULL REFERENCES content.material(id) ON DELETE CASCADE,
    started_at timestamptz NOT NULL DEFAULT NOW(),
    ended_at timestamptz,
    duration_second int NOT NULL DEFAULT 0,
    created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_material_session_student ON content.material_session(student_id);
CREATE INDEX idx_material_session_material ON content.material_session(material_id);

CREATE TABLE content.material_bookmark (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id uuid NOT NULL REFERENCES identity.user(id) ON DELETE CASCADE,
    material_id uuid NOT NULL REFERENCES content.material(id) ON DELETE CASCADE,
    block_id uuid REFERENCES content.material_block(id) ON DELETE SET NULL,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    UNIQUE (student_id, material_id)
);

CREATE TABLE content.material_note (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id uuid NOT NULL REFERENCES identity.user(id) ON DELETE CASCADE,
    material_id uuid NOT NULL REFERENCES content.material(id) ON DELETE CASCADE,
    block_id uuid REFERENCES content.material_block(id) ON DELETE SET NULL,
    note text,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_material_note_student ON content.material_note(student_id);
CREATE TRIGGER trg_material_note_updated BEFORE UPDATE ON content.material_note
    FOR EACH ROW EXECUTE FUNCTION shared.set_updated_at();

CREATE TABLE content.material_highlight (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id uuid NOT NULL REFERENCES identity.user(id) ON DELETE CASCADE,
    block_id uuid NOT NULL REFERENCES content.material_block(id) ON DELETE CASCADE,
    start_offset int NOT NULL DEFAULT 0,
    end_offset int NOT NULL DEFAULT 0,
    color varchar(20),
    created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_material_highlight_student ON content.material_highlight(student_id);
CREATE INDEX idx_material_highlight_block ON content.material_highlight(block_id);
```

- [ ] **Step 2: Tulis `068_learning_progress.down.sql`**

```sql
DROP TABLE IF EXISTS content.material_highlight;
DROP TABLE IF EXISTS content.material_note;
DROP TABLE IF EXISTS content.material_bookmark;
DROP TABLE IF EXISTS content.material_session;
DROP TABLE IF EXISTS content.learning_progress;
```

- [ ] **Step 3: Verifikasi**

```bash
go run cmd/migrate/main.go up
```
Expected: applied 068; `All migrations applied total=48`.
`SELECT count(*) FROM information_schema.tables WHERE table_schema='content';` → **36**

- [ ] **Step 4: Commit**

```bash
git add migrations
git commit -m "feat(db): learning progress/session/bookmark/note/highlight (phase 6)"
```

---

## Task 6I: Material Certificate — certificate, student_certificate

**Files:**
- Create: `backend/migrations/069_material_certificate.up.sql`
- Create: `backend/migrations/069_material_certificate.down.sql`

**Interfaces:**
- Consumes: `content.material`, `identity.user`, `media.asset`.
- Produces: `content.material_certificate`, `content.student_certificate`.

- [ ] **Step 1: Tulis `069_material_certificate.up.sql`**

```sql
-- Migration 069: material certificate & student certificate.

CREATE TABLE content.material_certificate (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    material_id uuid NOT NULL REFERENCES content.material(id) ON DELETE CASCADE,
    certificate_template varchar(200),
    passing_score numeric(5,2),
    created_at timestamptz NOT NULL DEFAULT NOW(),
    UNIQUE (material_id)
);

CREATE TABLE content.student_certificate (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id uuid NOT NULL REFERENCES identity.user(id) ON DELETE CASCADE,
    material_id uuid NOT NULL REFERENCES content.material(id) ON DELETE CASCADE,
    asset_id uuid REFERENCES media.asset(id) ON DELETE SET NULL,
    issued_at timestamptz NOT NULL DEFAULT NOW(),
    created_at timestamptz NOT NULL DEFAULT NOW(),
    UNIQUE (student_id, material_id)
);
CREATE INDEX idx_student_certificate_student ON content.student_certificate(student_id);
CREATE INDEX idx_student_certificate_material ON content.student_certificate(material_id);
```

- [ ] **Step 2: Tulis `069_material_certificate.down.sql`**

```sql
DROP TABLE IF EXISTS content.student_certificate;
DROP TABLE IF EXISTS content.material_certificate;
```

- [ ] **Step 3: Verifikasi**

```bash
go run cmd/migrate/main.go up
```
Expected: applied 069; `All migrations applied total=49`.
`SELECT count(*) FROM information_schema.tables WHERE table_schema='content';` → **38**

- [ ] **Step 4: Commit**

```bash
git add migrations
git commit -m "feat(db): material/student certificate (phase 6)"
```

---

## Task 6J: Material Statistics — statistics, rating, feedback, popularity

**Files:**
- Create: `backend/migrations/070_material_statistics.up.sql`
- Create: `backend/migrations/070_material_statistics.down.sql`

**Interfaces:**
- Consumes: `content.material`, `identity.user`.
- Produces: `content.material_statistics`, `content.material_rating`, `content.material_feedback`, `content.material_popularity`.

- [ ] **Step 1: Tulis `070_material_statistics.up.sql`**

```sql
-- Migration 070: material statistics - statistics, rating, feedback, popularity.

CREATE TABLE content.material_statistics (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    material_id uuid NOT NULL REFERENCES content.material(id) ON DELETE CASCADE,
    view_count int NOT NULL DEFAULT 0,
    completion_count int NOT NULL DEFAULT 0,
    average_duration int NOT NULL DEFAULT 0,
    rating numeric(2,1),
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW(),
    UNIQUE (material_id)
);
CREATE TRIGGER trg_material_statistics_updated BEFORE UPDATE ON content.material_statistics
    FOR EACH ROW EXECUTE FUNCTION shared.set_updated_at();

CREATE TABLE content.material_rating (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    material_id uuid NOT NULL REFERENCES content.material(id) ON DELETE CASCADE,
    student_id uuid NOT NULL REFERENCES identity.user(id) ON DELETE CASCADE,
    rating numeric(2,1) NOT NULL,
    review text,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    UNIQUE (material_id, student_id)
);
CREATE INDEX idx_material_rating_student ON content.material_rating(student_id);

CREATE TABLE content.material_feedback (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    material_id uuid NOT NULL REFERENCES content.material(id) ON DELETE CASCADE,
    student_id uuid NOT NULL REFERENCES identity.user(id) ON DELETE CASCADE,
    feedback text,
    created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_material_feedback_material ON content.material_feedback(material_id);
CREATE INDEX idx_material_feedback_student ON content.material_feedback(student_id);

CREATE TABLE content.material_popularity (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    material_id uuid NOT NULL REFERENCES content.material(id) ON DELETE CASCADE,
    score numeric(10,2) NOT NULL DEFAULT 0,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW(),
    UNIQUE (material_id)
);
CREATE TRIGGER trg_material_popularity_updated BEFORE UPDATE ON content.material_popularity
    FOR EACH ROW EXECUTE FUNCTION shared.set_updated_at();
```

- [ ] **Step 2: Tulis `070_material_statistics.down.sql`**

```sql
DROP TABLE IF EXISTS content.material_popularity;
DROP TABLE IF EXISTS content.material_feedback;
DROP TABLE IF EXISTS content.material_rating;
DROP TABLE IF EXISTS content.material_statistics;
```

- [ ] **Step 3: Verifikasi**

```bash
go run cmd/migrate/main.go up
```
Expected: applied 070; `All migrations applied total=50`.
`SELECT count(*) FROM information_schema.tables WHERE table_schema='content';` → **42**

- [ ] **Step 4: Commit**

```bash
git add migrations
git commit -m "feat(db): material statistics/rating/feedback/popularity (phase 6)"
```

---

## Task 6K: Material AI — ai_summary, ai_keyword, embedding, recommendation

**Files:**
- Create: `backend/migrations/071_material_ai.up.sql`
- Create: `backend/migrations/071_material_ai.down.sql`

**Interfaces:**
- Consumes: `content.material`.
- Produces: `content.material_ai_summary`, `content.material_ai_keyword`, `content.material_embedding` (embedding_id uuid tanpa FK, ditunda ke Phase 12), `content.material_recommendation` (self-FK).

- [ ] **Step 1: Tulis `071_material_ai.up.sql`**

```sql
-- Migration 071: material AI - summary, keyword, embedding (FK to ai deferred), recommendation.

CREATE TABLE content.material_ai_summary (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    material_id uuid NOT NULL REFERENCES content.material(id) ON DELETE CASCADE,
    summary text,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    UNIQUE (material_id)
);

CREATE TABLE content.material_ai_keyword (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    material_id uuid NOT NULL REFERENCES content.material(id) ON DELETE CASCADE,
    keyword varchar(120) NOT NULL,
    created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_material_ai_keyword_material ON content.material_ai_keyword(material_id);

CREATE TABLE content.material_embedding (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    material_id uuid NOT NULL REFERENCES content.material(id) ON DELETE CASCADE,
    embedding_id uuid,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    UNIQUE (material_id)
);
-- FK embedding_id -> ai.embedding ditambahkan di Phase 12 (ALTER TABLE ADD CONSTRAINT).

CREATE TABLE content.material_recommendation (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    material_id uuid NOT NULL REFERENCES content.material(id) ON DELETE CASCADE,
    recommended_material_id uuid NOT NULL REFERENCES content.material(id) ON DELETE CASCADE,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    UNIQUE (material_id, recommended_material_id)
);
CREATE INDEX idx_material_recommendation_ref ON content.material_recommendation(recommended_material_id);
```

- [ ] **Step 2: Tulis `071_material_ai.down.sql`**

```sql
DROP TABLE IF EXISTS content.material_recommendation;
DROP TABLE IF EXISTS content.material_embedding;
DROP TABLE IF EXISTS content.material_ai_keyword;
DROP TABLE IF EXISTS content.material_ai_summary;
```

- [ ] **Step 3: Verifikasi**

```bash
go run cmd/migrate/main.go up
```
Expected: applied 071; `All migrations applied total=51`.
`SELECT count(*) FROM information_schema.tables WHERE table_schema='content';` → **46**

- [ ] **Step 4: Commit**

```bash
git add migrations
git commit -m "feat(db): material AI summary/keyword/embedding/recommendation (phase 6)"
```

---

## Task 6L: Practice Set — practice_set, practice_set_question + resolve FK

**Files:**
- Create: `backend/migrations/072_content_practice_set.up.sql`
- Create: `backend/migrations/072_content_practice_set.down.sql`

**Interfaces:**
- Consumes: `identity.user`, `question.question`, `question.question_practice` (044, untuk menambahkan FK tertunda).
- Produces: `content.practice_set` (master), `content.practice_set_question`, plus `fk_question_practice` pada `question.question_practice`.

- [ ] **Step 1: Tulis `072_content_practice_set.up.sql`**

```sql
-- Migration 072: practice set + questions; resolve deferred question_practice FK from Phase 4.

CREATE TABLE content.practice_set (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    practice_set_code varchar(50) NOT NULL,
    title varchar(200) NOT NULL,
    description text,
    owner_id uuid REFERENCES identity.user(id) ON DELETE SET NULL,
    created_by uuid REFERENCES identity.user(id) ON DELETE SET NULL,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW(),
    deleted_at timestamptz
);
CREATE UNIQUE INDEX uq_practice_set_code ON content.practice_set(practice_set_code) WHERE deleted_at IS NULL;
CREATE INDEX idx_practice_set_owner ON content.practice_set(owner_id);
CREATE TRIGGER trg_practice_set_updated BEFORE UPDATE ON content.practice_set
    FOR EACH ROW EXECUTE FUNCTION shared.set_updated_at();

CREATE TABLE content.practice_set_question (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    practice_set_id uuid NOT NULL REFERENCES content.practice_set(id) ON DELETE CASCADE,
    question_id uuid NOT NULL REFERENCES question.question(id) ON DELETE CASCADE,
    question_order int NOT NULL DEFAULT 0,
    score numeric(10,2) NOT NULL DEFAULT 0,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    UNIQUE (practice_set_id, question_id)
);
CREATE INDEX idx_practice_set_question_set ON content.practice_set_question(practice_set_id);
CREATE INDEX idx_practice_set_question_q ON content.practice_set_question(question_id);

-- Deferred FK from Phase 4: question.question_practice.practice_set_id -> content.practice_set.
ALTER TABLE question.question_practice ADD CONSTRAINT fk_question_practice
    FOREIGN KEY (practice_set_id) REFERENCES content.practice_set(id);
```

- [ ] **Step 2: Tulis `072_content_practice_set.down.sql`**

```sql
ALTER TABLE question.question_practice DROP CONSTRAINT IF EXISTS fk_question_practice;
DROP TABLE IF EXISTS content.practice_set_question;
DROP TABLE IF EXISTS content.practice_set;
```

- [ ] **Step 3: Verifikasi**

```bash
go run cmd/migrate/main.go up
```
Expected: applied 072; `All migrations applied total=52`.
`SELECT count(*) FROM information_schema.tables WHERE table_schema='content';` → **48** ✓ (menyelesaikan domain content, termasuk 2 tabel practice_set)
`SELECT count(*) FROM pg_constraint WHERE conname='fk_question_practice';` → **1**

- [ ] **Step 4: Commit**

```bash
git add migrations
git commit -m "feat(db): practice set + resolve question_practice FK (phase 6) - completes content domain (48 tables)"
```

---

## Self-Review

**Spec coverage:** design doc §3 fase 6 (Content, 46 tabel katalog) + 2 tabel practice_set (keputusan user 2026-08-05) = 48 tabel terpenuhi: 12 file migrasi (061–072). Daftar 1:1 — material, material_type, material_status, material_metadata, material_version, material_history, material_block, material_section, material_section_block, material_table_of_content, material_subject, material_grade, material_major, material_curriculum, material_chapter, material_subchapter, material_topic, material_competency, material_skill, material_tag, material_attachment, material_thumbnail, material_subtitle, material_transcript, material_quiz, material_quiz_question, material_assignment, material_assignment_submission, material_review, material_approval, material_validation, learning_progress, material_session, material_bookmark, material_note, material_highlight, material_certificate, student_certificate, material_statistics, material_rating, material_feedback, material_popularity, material_ai_summary, material_ai_keyword, material_embedding, material_recommendation, practice_set, practice_set_question = 48.

**Placeholder scan:** tidak ada TBD/TODO; SQL lengkap per task; enum & indeks eksplisit.

**Type/name consistency:** konvensi §2 diterapkan (uuid PK, snake_case, timestamps, deleted_at pada `material`/`practice_set`, CHECK enum, indeks FK/komposit/unik). Circular FK `material.current_version_id` diselesaikan via ALTER (Task 6A). FK tertunda Phase 4 diresolusi: `question_learning_material.material_id → content.material` (6A) & `question_practice.practice_set_id → content.practice_set` (6L). `material_embedding.embedding_id` ditunda ke Phase 12. Junction `material_tag` memakai `(material_id, tag)` — konsisten pola Phase 4/5.

**Cacat design yang dihindari:** tidak ada dual-schema legacy (`content_*` lama sudah dihapus di Phase 0); konten materi versioned (material → material_version → blok); statistik & AI terpisah dari konten; log append-only (`material_history` memakai ON DELETE SET NULL agar audit survive penghapusan — pola yang sama dengan Phase 4/5).

## Execution Handoff

**Plan selesai & tersimpan: `docs/superpowers/plans/2026-08-04-database-rebuild-phase6-content.md`. Dua opsi eksekusi:**

1. **Subagent-Driven (recommended)** — dispatch subagent baru per task, review antar task, iterasi cepat.
2. **Inline Execution** — eksekusi tasks di sesi ini dengan checkpoints.

**Pilih yang mana?**
