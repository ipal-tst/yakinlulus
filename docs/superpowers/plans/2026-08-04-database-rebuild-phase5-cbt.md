# Database Rebuild Phase 5 Implementation Plan (CBT / Exam Engine)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bangun domain `cbt` (engine ujian) — 55 tabel — sesuai design doc `docs/superpowers/specs/2026-08-04-database-rebuild-design.md` §4.5, menggantikan `exam_*` legacy (sudah dihapus di Phase 0).

**Architecture:** `cbt.exam` adalah identitas ujian → metadata, junction akademik, package/randomisasi, schedule/session/participant → attempt → jawaban → grading → proctor/offline → statistik → history append-only. FK `question.question_exam.exam_id → cbt.exam` yang ditunda di Phase 4 ditambahkan di Task 5A.

**Tech Stack:** PostgreSQL (Supabase), runner Go `go run cmd/migrate/main.go up`, verifikasi via throwaway Go program (pgx) + `cmd/tools/dbcheck`.

**Files target:** `backend/migrations/050_exam_core.{up,down}.sql` s.d. `059_exam_statistics.{up,down}.sql` (10 file pasangan).

---

## Global Constraints

Semua tabel mematuhi **Global Conventions** (`docs/superpowers/specs/2026-08-04-database-rebuild-design.md` §2):

- PK: `id uuid PRIMARY KEY DEFAULT gen_random_uuid()` di setiap tabel (junction pakai composite PK).
- Nama `snake_case` singular; kolom referensi `<entity>_id`.
- `created_at timestamptz NOT NULL DEFAULT NOW()` wajib; `updated_at` untuk tabel mutable.
- Soft delete `deleted_at` hanya pada master (`cbt.exam`).
- Enum: `text` + `CHECK (col IN (...))`, tidak `CREATE TYPE`.
- Indeks semua FK + filter umum; indeks unik sesuai spec.
- FK lintas schema: `identity.user` (owner/student/teacher/grader), `question.question` (package/pool/attempt question), `media.asset` (essay answer), `academic.subject|grade|curriculum|chapter|topic|competency` (junction).
- Migrasi harus `up` bersih dari nol, dibungkus transaksi (runner sudah tx per file).
- Jangan sentuh kode Go runner.
- **Keputusan desain (deviasi minor, dicatat):**
  1. **Tidak ada partisi fisik** (`PARTITION BY RANGE`) — konsisten dengan semua fase sebelumnya (0–4 tidak membuat partisi meski §2.10 & katalog menyebut "Partisi bulanan"); strategi partisi ditunda ke fase infrastruktur. Tabel log tetap append-only.
  2. `exam_tag` dimodelkan sebagai junction `(exam_id, tag text)` composite PK — tidak ada tabel tag di `academic` (sama dengan `question_tag` Phase 4).
  3. `exam_random_log` (membutuhkan `cbt.exam_attempt`) dikelompokkan ke Task 5E bersama attempt.
  4. **FK tertunda Phase 4:** `question.question_exam.exam_id → cbt.exam` ditambahkan via `ALTER TABLE ADD CONSTRAINT` di Task 5A (setelah `cbt.exam` dibuat) — follow-up yang dijanjikan di plan Phase 4.

---

## Task 5A: Exam Core — status, exam, metadata

**Files:**
- Create: `backend/migrations/050_exam_core.up.sql`
- Create: `backend/migrations/050_exam_core.down.sql`

**Interfaces:**
- Consumes: `identity.user`, schema `cbt` (000), `shared.set_updated_at()` (001), `question.question_exam` (044, untuk menambahkan FK tertunda).
- Produces: `cbt.exam_status`, `cbt.exam` (master), `cbt.exam_metadata`, plus `fk_question_exam_exam` pada `question.question_exam`. Domain CBT lain mereferensikan `cbt.exam` via FK.

- [ ] **Step 1: Tulis `050_exam_core.up.sql`**

```sql
-- Migration 050: exam core - status lookup, exam master, metadata.

CREATE TABLE cbt.exam_status (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    code varchar(30) NOT NULL,
    name varchar(100) NOT NULL,
    description text,
    created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX uq_exam_status_code ON cbt.exam_status(code);

CREATE TABLE cbt.exam (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    exam_code varchar(50) NOT NULL,
    title varchar(200) NOT NULL,
    description text,
    exam_type text NOT NULL DEFAULT 'CBT' CHECK (exam_type IN ('TRYOUT','CBT','QUIZ','MID','FINAL','UTBK','AKM')),
    status_id uuid REFERENCES cbt.exam_status(id) ON DELETE SET NULL,
    owner_id uuid REFERENCES identity.user(id) ON DELETE SET NULL,
    created_by uuid REFERENCES identity.user(id) ON DELETE SET NULL,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW(),
    deleted_at timestamptz
);
CREATE UNIQUE INDEX uq_exam_code ON cbt.exam(exam_code) WHERE deleted_at IS NULL;
CREATE INDEX idx_exam_type ON cbt.exam(exam_type);
CREATE INDEX idx_exam_status ON cbt.exam(status_id);
CREATE INDEX idx_exam_owner ON cbt.exam(owner_id);
CREATE TRIGGER trg_exam_updated BEFORE UPDATE ON cbt.exam
    FOR EACH ROW EXECUTE FUNCTION shared.set_updated_at();

CREATE TABLE cbt.exam_metadata (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    exam_id uuid NOT NULL REFERENCES cbt.exam(id) ON DELETE CASCADE,
    duration_minute int,
    passing_score numeric(5,2),
    certificate boolean NOT NULL DEFAULT false,
    negative_marking boolean NOT NULL DEFAULT false,
    calculator_allowed boolean NOT NULL DEFAULT false,
    fullscreen_required boolean NOT NULL DEFAULT false,
    safe_browser boolean NOT NULL DEFAULT false,
    show_result boolean NOT NULL DEFAULT true,
    show_answer boolean NOT NULL DEFAULT false,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    UNIQUE (exam_id)
);

-- Deferred FK from Phase 4: question.question_exam.exam_id -> cbt.exam.
ALTER TABLE question.question_exam ADD CONSTRAINT fk_question_exam_exam
    FOREIGN KEY (exam_id) REFERENCES cbt.exam(id);
```

- [ ] **Step 2: Tulis `050_exam_core.down.sql`**

```sql
ALTER TABLE question.question_exam DROP CONSTRAINT IF EXISTS fk_question_exam_exam;
DROP TABLE IF EXISTS cbt.exam_metadata;
DROP TABLE IF EXISTS cbt.exam;
DROP TABLE IF EXISTS cbt.exam_status;
```

- [ ] **Step 3: Verifikasi**

Dari `backend/`:
```bash
go run cmd/migrate/main.go up
```
Expected: `Migration applied name=050_exam_core.up.sql`; `All migrations applied total=30`.

Kemudian verifikasi via throwaway Go program (pgx, URL dari `backend/config.yaml` `database.url`):
- `SELECT count(*) FROM information_schema.tables WHERE table_schema='cbt';` → **3**
- `SELECT count(*) FROM pg_constraint WHERE conname='fk_question_exam_exam';` → **1**

- [ ] **Step 4: Commit**

```bash
git add migrations
git commit -m "feat(db): exam core - status/exam/metadata + resolve question_exam FK (phase 5)"
```

---

## Task 5B: Exam Junctions — subject/grade/curriculum/chapter/topic/competency/tag

**Files:**
- Create: `backend/migrations/051_exam_junction.up.sql`
- Create: `backend/migrations/051_exam_junction.down.sql`

**Interfaces:**
- Consumes: `cbt.exam`, `academic.subject|grade|curriculum|chapter|topic|competency`.
- Produces: 7 junction N:M (`exam_subject`, `exam_grade`, `exam_curriculum`, `exam_chapter`, `exam_topic`, `exam_competency`, `exam_tag`). `exam_tag` memakai `(exam_id, tag text)` composite PK.

- [ ] **Step 1: Tulis `051_exam_junction.up.sql`**

```sql
-- Migration 051: exam junctions N:M to academic domain.

CREATE TABLE cbt.exam_subject (
    exam_id uuid NOT NULL REFERENCES cbt.exam(id) ON DELETE CASCADE,
    subject_id uuid NOT NULL REFERENCES academic.subject(id) ON DELETE CASCADE,
    PRIMARY KEY (exam_id, subject_id)
);
CREATE INDEX idx_exam_subject_ref ON cbt.exam_subject(subject_id);

CREATE TABLE cbt.exam_grade (
    exam_id uuid NOT NULL REFERENCES cbt.exam(id) ON DELETE CASCADE,
    grade_id uuid NOT NULL REFERENCES academic.grade(id) ON DELETE CASCADE,
    PRIMARY KEY (exam_id, grade_id)
);
CREATE INDEX idx_exam_grade_ref ON cbt.exam_grade(grade_id);

CREATE TABLE cbt.exam_curriculum (
    exam_id uuid NOT NULL REFERENCES cbt.exam(id) ON DELETE CASCADE,
    curriculum_id uuid NOT NULL REFERENCES academic.curriculum(id) ON DELETE CASCADE,
    PRIMARY KEY (exam_id, curriculum_id)
);
CREATE INDEX idx_exam_curriculum_ref ON cbt.exam_curriculum(curriculum_id);

CREATE TABLE cbt.exam_chapter (
    exam_id uuid NOT NULL REFERENCES cbt.exam(id) ON DELETE CASCADE,
    chapter_id uuid NOT NULL REFERENCES academic.chapter(id) ON DELETE CASCADE,
    PRIMARY KEY (exam_id, chapter_id)
);
CREATE INDEX idx_exam_chapter_ref ON cbt.exam_chapter(chapter_id);

CREATE TABLE cbt.exam_topic (
    exam_id uuid NOT NULL REFERENCES cbt.exam(id) ON DELETE CASCADE,
    topic_id uuid NOT NULL REFERENCES academic.topic(id) ON DELETE CASCADE,
    PRIMARY KEY (exam_id, topic_id)
);
CREATE INDEX idx_exam_topic_ref ON cbt.exam_topic(topic_id);

CREATE TABLE cbt.exam_competency (
    exam_id uuid NOT NULL REFERENCES cbt.exam(id) ON DELETE CASCADE,
    competency_id uuid NOT NULL REFERENCES academic.competency(id) ON DELETE CASCADE,
    PRIMARY KEY (exam_id, competency_id)
);
CREATE INDEX idx_exam_competency_ref ON cbt.exam_competency(competency_id);

CREATE TABLE cbt.exam_tag (
    exam_id uuid NOT NULL REFERENCES cbt.exam(id) ON DELETE CASCADE,
    tag varchar(80) NOT NULL,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    PRIMARY KEY (exam_id, tag)
);
```

- [ ] **Step 2: Tulis `051_exam_junction.down.sql`**

```sql
DROP TABLE IF EXISTS cbt.exam_tag;
DROP TABLE IF EXISTS cbt.exam_competency;
DROP TABLE IF EXISTS cbt.exam_topic;
DROP TABLE IF EXISTS cbt.exam_chapter;
DROP TABLE IF EXISTS cbt.exam_curriculum;
DROP TABLE IF EXISTS cbt.exam_grade;
DROP TABLE IF EXISTS cbt.exam_subject;
```

- [ ] **Step 3: Verifikasi**

```bash
go run cmd/migrate/main.go up
```
Expected: applied 051; `All migrations applied total=31`.
`SELECT count(*) FROM information_schema.tables WHERE table_schema='cbt';` → **10**

- [ ] **Step 4: Commit**

```bash
git add migrations
git commit -m "feat(db): exam junctions to academic (phase 5)"
```

---

## Task 5C: Exam Package & Randomization — package, package_question, question_pool, randomization, schedule

**Files:**
- Create: `backend/migrations/052_exam_package.up.sql`
- Create: `backend/migrations/052_exam_package.down.sql`

**Interfaces:**
- Consumes: `cbt.exam`, `question.question`, `academic.subject|chapter`.
- Produces: `cbt.exam_package`, `cbt.exam_package_question`, `cbt.exam_question_pool`, `cbt.exam_randomization`, `cbt.exam_schedule`.

- [ ] **Step 1: Tulis `052_exam_package.up.sql`**

```sql
-- Migration 052: exam package, question pool, randomization, schedule.

CREATE TABLE cbt.exam_package (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    exam_id uuid NOT NULL REFERENCES cbt.exam(id) ON DELETE CASCADE,
    name varchar(200) NOT NULL,
    random_seed int,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    UNIQUE (exam_id, name)
);
CREATE INDEX idx_exam_package_exam ON cbt.exam_package(exam_id);

CREATE TABLE cbt.exam_package_question (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    package_id uuid NOT NULL REFERENCES cbt.exam_package(id) ON DELETE CASCADE,
    question_id uuid NOT NULL REFERENCES question.question(id) ON DELETE CASCADE,
    question_order int NOT NULL DEFAULT 0,
    score numeric(10,2) NOT NULL DEFAULT 0,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    UNIQUE (package_id, question_id)
);
CREATE INDEX idx_exam_package_question_package ON cbt.exam_package_question(package_id);
CREATE INDEX idx_exam_package_question_q ON cbt.exam_package_question(question_id);

CREATE TABLE cbt.exam_question_pool (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    exam_id uuid NOT NULL REFERENCES cbt.exam(id) ON DELETE CASCADE,
    subject_id uuid REFERENCES academic.subject(id) ON DELETE SET NULL,
    chapter_id uuid REFERENCES academic.chapter(id) ON DELETE SET NULL,
    difficulty varchar(20) CHECK (difficulty IN ('EASY','MEDIUM','HARD','VERY_HARD')),
    total_question int NOT NULL DEFAULT 0,
    created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_exam_question_pool_exam ON cbt.exam_question_pool(exam_id);

CREATE TABLE cbt.exam_randomization (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    exam_id uuid NOT NULL REFERENCES cbt.exam(id) ON DELETE CASCADE,
    random_question boolean NOT NULL DEFAULT true,
    random_option boolean NOT NULL DEFAULT true,
    random_seed int,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    UNIQUE (exam_id)
);

CREATE TABLE cbt.exam_schedule (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    exam_id uuid NOT NULL REFERENCES cbt.exam(id) ON DELETE CASCADE,
    start_time timestamptz NOT NULL,
    end_time timestamptz NOT NULL,
    timezone varchar(64) NOT NULL DEFAULT 'Asia/Jakarta',
    created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_exam_schedule_exam ON cbt.exam_schedule(exam_id);
CREATE INDEX idx_exam_schedule_time ON cbt.exam_schedule(start_time, end_time);
```

- [ ] **Step 2: Tulis `052_exam_package.down.sql`**

```sql
DROP TABLE IF EXISTS cbt.exam_schedule;
DROP TABLE IF EXISTS cbt.exam_randomization;
DROP TABLE IF EXISTS cbt.exam_question_pool;
DROP TABLE IF EXISTS cbt.exam_package_question;
DROP TABLE IF EXISTS cbt.exam_package;
```

- [ ] **Step 3: Verifikasi**

```bash
go run cmd/migrate/main.go up
```
Expected: applied 052; `All migrations applied total=32`.
`SELECT count(*) FROM information_schema.tables WHERE table_schema='cbt';` → **15**

- [ ] **Step 4: Commit**

```bash
git add migrations
git commit -m "feat(db): exam package/pool/randomization/schedule (phase 5)"
```

---

## Task 5D: Exam Session & Participant — session, proctor, participant, participant_package

**Files:**
- Create: `backend/migrations/053_exam_session.up.sql`
- Create: `backend/migrations/053_exam_session.down.sql`

**Interfaces:**
- Consumes: `cbt.exam`, `cbt.exam_package`, `identity.user`.
- Produces: `cbt.exam_session`, `cbt.exam_proctor`, `cbt.exam_participant`, `cbt.participant_package`.

- [ ] **Step 1: Tulis `053_exam_session.up.sql`**

```sql
-- Migration 053: exam session, proctor, participant, participant package.

CREATE TABLE cbt.exam_session (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    exam_id uuid NOT NULL REFERENCES cbt.exam(id) ON DELETE CASCADE,
    session_name varchar(200) NOT NULL,
    capacity int,
    token varchar(64),
    location varchar(200),
    created_at timestamptz NOT NULL DEFAULT NOW(),
    UNIQUE (exam_id, session_name)
);
CREATE INDEX idx_exam_session_exam ON cbt.exam_session(exam_id);

CREATE TABLE cbt.exam_proctor (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id uuid NOT NULL REFERENCES cbt.exam_session(id) ON DELETE CASCADE,
    teacher_id uuid NOT NULL REFERENCES identity.user(id) ON DELETE CASCADE,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    UNIQUE (session_id, teacher_id)
);
CREATE INDEX idx_exam_proctor_session ON cbt.exam_proctor(session_id);
CREATE INDEX idx_exam_proctor_teacher ON cbt.exam_proctor(teacher_id);

CREATE TABLE cbt.exam_participant (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    exam_id uuid NOT NULL REFERENCES cbt.exam(id) ON DELETE CASCADE,
    student_id uuid NOT NULL REFERENCES identity.user(id) ON DELETE CASCADE,
    status text NOT NULL DEFAULT 'REGISTER' CHECK (status IN ('REGISTER','READY','STARTED','FINISHED','ABSENT')),
    created_at timestamptz NOT NULL DEFAULT NOW(),
    UNIQUE (exam_id, student_id)
);
CREATE INDEX idx_exam_participant_student ON cbt.exam_participant(student_id);
CREATE INDEX idx_exam_participant_status ON cbt.exam_participant(status);

CREATE TABLE cbt.participant_package (
    participant_id uuid NOT NULL REFERENCES cbt.exam_participant(id) ON DELETE CASCADE,
    package_id uuid NOT NULL REFERENCES cbt.exam_package(id) ON DELETE CASCADE,
    PRIMARY KEY (participant_id, package_id)
);
CREATE INDEX idx_participant_package_ref ON cbt.participant_package(package_id);
```

- [ ] **Step 2: Tulis `053_exam_session.down.sql`**

```sql
DROP TABLE IF EXISTS cbt.participant_package;
DROP TABLE IF EXISTS cbt.exam_participant;
DROP TABLE IF EXISTS cbt.exam_proctor;
DROP TABLE IF EXISTS cbt.exam_session;
```

- [ ] **Step 3: Verifikasi**

```bash
go run cmd/migrate/main.go up
```
Expected: applied 053; `All migrations applied total=33`.
`SELECT count(*) FROM information_schema.tables WHERE table_schema='cbt';` → **19**

- [ ] **Step 4: Commit**

```bash
git add migrations
git commit -m "feat(db): exam session/proctor/participant (phase 5)"
```

---

## Task 5E: Exam Attempt — attempt, random_log, attempt_question, attempt_option

**Files:**
- Create: `backend/migrations/054_exam_attempt.up.sql`
- Create: `backend/migrations/054_exam_attempt.down.sql`

**Interfaces:**
- Consumes: `cbt.exam_participant`, `question.question`.
- Produces: `cbt.exam_attempt`, `cbt.exam_random_log`, `cbt.attempt_question`, `cbt.attempt_option`.

- [ ] **Step 1: Tulis `054_exam_attempt.up.sql`**

```sql
-- Migration 054: exam attempt, random log, attempt question & option.

CREATE TABLE cbt.exam_attempt (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    participant_id uuid NOT NULL REFERENCES cbt.exam_participant(id) ON DELETE CASCADE,
    attempt_no int NOT NULL DEFAULT 1,
    started_at timestamptz,
    finished_at timestamptz,
    last_sync timestamptz,
    status text NOT NULL DEFAULT 'REGISTERED' CHECK (status IN ('REGISTERED','READY','STARTED','PAUSED','RESUMED','SUBMITTED','GRADING','COMPLETED')),
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW(),
    UNIQUE (participant_id, attempt_no)
);
CREATE INDEX idx_exam_attempt_participant ON cbt.exam_attempt(participant_id);
CREATE INDEX idx_exam_attempt_status ON cbt.exam_attempt(status);
CREATE TRIGGER trg_exam_attempt_updated BEFORE UPDATE ON cbt.exam_attempt
    FOR EACH ROW EXECUTE FUNCTION shared.set_updated_at();

CREATE TABLE cbt.exam_random_log (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    attempt_id uuid NOT NULL REFERENCES cbt.exam_attempt(id) ON DELETE CASCADE,
    seed int,
    result_json jsonb,
    created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_exam_random_log_attempt ON cbt.exam_random_log(attempt_id);

CREATE TABLE cbt.attempt_question (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    attempt_id uuid NOT NULL REFERENCES cbt.exam_attempt(id) ON DELETE CASCADE,
    question_id uuid NOT NULL REFERENCES question.question(id) ON DELETE CASCADE,
    display_order int NOT NULL DEFAULT 0,
    snapshot_version int NOT NULL DEFAULT 1,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    UNIQUE (attempt_id, display_order)
);
CREATE INDEX idx_attempt_question_attempt ON cbt.attempt_question(attempt_id);
CREATE INDEX idx_attempt_question_q ON cbt.attempt_question(question_id);

CREATE TABLE cbt.attempt_option (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    attempt_question_id uuid NOT NULL REFERENCES cbt.attempt_question(id) ON DELETE CASCADE,
    option_label varchar(10) NOT NULL,
    display_order int NOT NULL DEFAULT 0,
    created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_attempt_option_aq ON cbt.attempt_option(attempt_question_id);
```

- [ ] **Step 2: Tulis `054_exam_attempt.down.sql`**

```sql
DROP TABLE IF EXISTS cbt.attempt_option;
DROP TABLE IF EXISTS cbt.attempt_question;
DROP TABLE IF EXISTS cbt.exam_random_log;
DROP TABLE IF EXISTS cbt.exam_attempt;
```

- [ ] **Step 3: Verifikasi**

```bash
go run cmd/migrate/main.go up
```
Expected: applied 054; `All migrations applied total=34`.
`SELECT count(*) FROM information_schema.tables WHERE table_schema='cbt';` → **23**

- [ ] **Step 4: Commit**

```bash
git add migrations
git commit -m "feat(db): exam attempt + random log + attempt question/option (phase 5)"
```

---

## Task 5F: Exam Answers — student_answer, essay_answer, answer_history, navigation_log, bookmark, question_time

**Files:**
- Create: `backend/migrations/055_exam_answer.up.sql`
- Create: `backend/migrations/055_exam_answer.down.sql`

**Interfaces:**
- Consumes: `cbt.attempt_question`, `media.asset`, `cbt.exam_attempt`.
- Produces: `cbt.student_answer`, `cbt.essay_answer`, `cbt.answer_history`, `cbt.navigation_log`, `cbt.bookmark_question`, `cbt.question_time`.

- [ ] **Step 1: Tulis `055_exam_answer.up.sql`**

```sql
-- Migration 055: student/essay answers, answer history, navigation, bookmark, time.

CREATE TABLE cbt.student_answer (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    attempt_question_id uuid NOT NULL REFERENCES cbt.attempt_question(id) ON DELETE CASCADE,
    selected_option varchar(10),
    answered_at timestamptz NOT NULL DEFAULT NOW(),
    created_at timestamptz NOT NULL DEFAULT NOW(),
    UNIQUE (attempt_question_id)
);

CREATE TABLE cbt.essay_answer (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    attempt_question_id uuid NOT NULL REFERENCES cbt.attempt_question(id) ON DELETE CASCADE,
    text_answer text,
    asset_id uuid REFERENCES media.asset(id) ON DELETE SET NULL,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    UNIQUE (attempt_question_id)
);

CREATE TABLE cbt.answer_history (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    student_answer_id uuid NOT NULL REFERENCES cbt.student_answer(id) ON DELETE CASCADE,
    previous_value varchar(10),
    changed_at timestamptz NOT NULL DEFAULT NOW(),
    created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_answer_history_sa ON cbt.answer_history(student_answer_id);

CREATE TABLE cbt.navigation_log (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    attempt_id uuid NOT NULL REFERENCES cbt.exam_attempt(id) ON DELETE CASCADE,
    question_no int NOT NULL,
    visited_at timestamptz NOT NULL DEFAULT NOW(),
    created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_navigation_log_attempt ON cbt.navigation_log(attempt_id);

CREATE TABLE cbt.bookmark_question (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    attempt_question_id uuid NOT NULL REFERENCES cbt.attempt_question(id) ON DELETE CASCADE,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    UNIQUE (attempt_question_id)
);

CREATE TABLE cbt.question_time (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    attempt_question_id uuid NOT NULL REFERENCES cbt.attempt_question(id) ON DELETE CASCADE,
    duration_second int NOT NULL DEFAULT 0,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    UNIQUE (attempt_question_id)
);
```

- [ ] **Step 2: Tulis `055_exam_answer.down.sql`**

```sql
DROP TABLE IF EXISTS cbt.question_time;
DROP TABLE IF EXISTS cbt.bookmark_question;
DROP TABLE IF EXISTS cbt.navigation_log;
DROP TABLE IF EXISTS cbt.answer_history;
DROP TABLE IF EXISTS cbt.essay_answer;
DROP TABLE IF EXISTS cbt.student_answer;
```

- [ ] **Step 3: Verifikasi**

```bash
go run cmd/migrate/main.go up
```
Expected: applied 055; `All migrations applied total=35`.
`SELECT count(*) FROM information_schema.tables WHERE table_schema='cbt';` → **29**

- [ ] **Step 4: Commit**

```bash
git add migrations
git commit -m "feat(db): exam answers/navigation/bookmark/time (phase 5)"
```

---

## Task 5G: Exam Timer & Grading — timer, timer_history, auto_submit, grading_result, essay_grading, ai_grading, grading_detail

**Files:**
- Create: `backend/migrations/056_exam_grading.up.sql`
- Create: `backend/migrations/056_exam_grading.down.sql`

**Interfaces:**
- Consumes: `cbt.exam_attempt`, `cbt.essay_answer`, `cbt.attempt_question`, `question.question`, `identity.user`.
- Produces: `cbt.exam_timer`, `cbt.timer_history`, `cbt.auto_submit`, `cbt.grading_result`, `cbt.essay_grading`, `cbt.ai_grading`, `cbt.grading_detail`.

- [ ] **Step 1: Tulis `056_exam_grading.up.sql`**

```sql
-- Migration 056: exam timer, auto submit, grading result & details.

CREATE TABLE cbt.exam_timer (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    attempt_id uuid NOT NULL REFERENCES cbt.exam_attempt(id) ON DELETE CASCADE,
    remaining_second int NOT NULL DEFAULT 0,
    last_update timestamptz NOT NULL DEFAULT NOW(),
    created_at timestamptz NOT NULL DEFAULT NOW(),
    UNIQUE (attempt_id)
);

CREATE TABLE cbt.timer_history (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    attempt_id uuid NOT NULL REFERENCES cbt.exam_attempt(id) ON DELETE CASCADE,
    snapshot_json jsonb,
    created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_timer_history_attempt ON cbt.timer_history(attempt_id);

CREATE TABLE cbt.auto_submit (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    attempt_id uuid NOT NULL REFERENCES cbt.exam_attempt(id) ON DELETE CASCADE,
    reason text NOT NULL CHECK (reason IN ('TIMEOUT','MANUAL','DISCONNECT','CHEATING')),
    created_at timestamptz NOT NULL DEFAULT NOW(),
    UNIQUE (attempt_id)
);

CREATE TABLE cbt.grading_result (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    attempt_id uuid NOT NULL REFERENCES cbt.exam_attempt(id) ON DELETE CASCADE,
    score numeric(10,2) NOT NULL DEFAULT 0,
    correct int NOT NULL DEFAULT 0,
    wrong int NOT NULL DEFAULT 0,
    blank int NOT NULL DEFAULT 0,
    passed boolean NOT NULL DEFAULT false,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    UNIQUE (attempt_id)
);

CREATE TABLE cbt.essay_grading (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    essay_answer_id uuid NOT NULL REFERENCES cbt.essay_answer(id) ON DELETE CASCADE,
    grader_id uuid REFERENCES identity.user(id) ON DELETE SET NULL,
    score numeric(5,2),
    comment text,
    graded_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_essay_grading_ea ON cbt.essay_grading(essay_answer_id);
CREATE INDEX idx_essay_grading_grader ON cbt.essay_grading(grader_id);

CREATE TABLE cbt.ai_grading (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    attempt_question_id uuid NOT NULL REFERENCES cbt.attempt_question(id) ON DELETE CASCADE,
    model varchar(120),
    score numeric(5,2),
    confidence numeric(5,4),
    created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_ai_grading_aq ON cbt.ai_grading(attempt_question_id);

CREATE TABLE cbt.grading_detail (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    attempt_question_id uuid NOT NULL REFERENCES cbt.attempt_question(id) ON DELETE CASCADE,
    question_id uuid NOT NULL REFERENCES question.question(id) ON DELETE CASCADE,
    status_correct boolean NOT NULL DEFAULT false,
    score numeric(10,2) NOT NULL DEFAULT 0,
    is_blank boolean NOT NULL DEFAULT false,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    UNIQUE (attempt_question_id)
);
```

- [ ] **Step 2: Tulis `056_exam_grading.down.sql`**

```sql
DROP TABLE IF EXISTS cbt.grading_detail;
DROP TABLE IF EXISTS cbt.ai_grading;
DROP TABLE IF EXISTS cbt.essay_grading;
DROP TABLE IF EXISTS cbt.grading_result;
DROP TABLE IF EXISTS cbt.auto_submit;
DROP TABLE IF EXISTS cbt.timer_history;
DROP TABLE IF EXISTS cbt.exam_timer;
```

- [ ] **Step 3: Verifikasi**

```bash
go run cmd/migrate/main.go up
```
Expected: applied 056; `All migrations applied total=36`.
`SELECT count(*) FROM information_schema.tables WHERE table_schema='cbt';` → **36**

- [ ] **Step 4: Commit**

```bash
git add migrations
git commit -m "feat(db): exam timer/auto-submit/grading (phase 5)"
```

---

## Task 5H: Exam Proctor & Monitoring — live_monitor, heartbeat, connection, cheating, browser, camera, face, microphone

**Files:**
- Create: `backend/migrations/057_exam_proctor.up.sql`
- Create: `backend/migrations/057_exam_proctor.down.sql`

**Interfaces:**
- Consumes: `cbt.exam_attempt`.
- Produces: `cbt.live_monitor`, `cbt.heartbeat`, `cbt.connection_log`, `cbt.cheating_log`, `cbt.browser_log`, `cbt.camera_log`, `cbt.face_detection`, `cbt.microphone_detection`. Semua append-only.

- [ ] **Step 1: Tulis `057_exam_proctor.up.sql`**

```sql
-- Migration 057: proctor & monitoring - live monitor, heartbeat, logs, detection.

CREATE TABLE cbt.live_monitor (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    attempt_id uuid NOT NULL REFERENCES cbt.exam_attempt(id) ON DELETE CASCADE,
    current_question int,
    remaining_time int,
    status varchar(30),
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW(),
    UNIQUE (attempt_id)
);
CREATE TRIGGER trg_live_monitor_updated BEFORE UPDATE ON cbt.live_monitor
    FOR EACH ROW EXECUTE FUNCTION shared.set_updated_at();

CREATE TABLE cbt.heartbeat (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    attempt_id uuid NOT NULL REFERENCES cbt.exam_attempt(id) ON DELETE CASCADE,
    client_id varchar(64),
    status varchar(30) NOT NULL DEFAULT 'ONLINE',
    created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_heartbeat_attempt ON cbt.heartbeat(attempt_id);

CREATE TABLE cbt.connection_log (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    attempt_id uuid NOT NULL REFERENCES cbt.exam_attempt(id) ON DELETE CASCADE,
    event varchar(60) NOT NULL,
    created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_connection_log_attempt ON cbt.connection_log(attempt_id);

CREATE TABLE cbt.cheating_log (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    attempt_id uuid NOT NULL REFERENCES cbt.exam_attempt(id) ON DELETE CASCADE,
    event text NOT NULL CHECK (event IN ('TAB_CHANGE','COPY','PASTE','SCREENSHOT','WINDOW_BLUR')),
    detail jsonb,
    created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_cheating_log_attempt ON cbt.cheating_log(attempt_id);

CREATE TABLE cbt.browser_log (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    attempt_id uuid NOT NULL REFERENCES cbt.exam_attempt(id) ON DELETE CASCADE,
    event varchar(60) NOT NULL,
    created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_browser_log_attempt ON cbt.browser_log(attempt_id);

CREATE TABLE cbt.camera_log (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    attempt_id uuid NOT NULL REFERENCES cbt.exam_attempt(id) ON DELETE CASCADE,
    snapshot_json jsonb,
    created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_camera_log_attempt ON cbt.camera_log(attempt_id);

CREATE TABLE cbt.face_detection (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    attempt_id uuid NOT NULL REFERENCES cbt.exam_attempt(id) ON DELETE CASCADE,
    result_json jsonb,
    confidence numeric(5,4),
    created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_face_detection_attempt ON cbt.face_detection(attempt_id);

CREATE TABLE cbt.microphone_detection (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    attempt_id uuid NOT NULL REFERENCES cbt.exam_attempt(id) ON DELETE CASCADE,
    result_json jsonb,
    created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_microphone_detection_attempt ON cbt.microphone_detection(attempt_id);
```

- [ ] **Step 2: Tulis `057_exam_proctor.down.sql`**

```sql
DROP TABLE IF EXISTS cbt.microphone_detection;
DROP TABLE IF EXISTS cbt.face_detection;
DROP TABLE IF EXISTS cbt.camera_log;
DROP TABLE IF EXISTS cbt.browser_log;
DROP TABLE IF EXISTS cbt.cheating_log;
DROP TABLE IF EXISTS cbt.connection_log;
DROP TABLE IF EXISTS cbt.heartbeat;
DROP TABLE IF EXISTS cbt.live_monitor;
```

- [ ] **Step 3: Verifikasi**

```bash
go run cmd/migrate/main.go up
```
Expected: applied 057; `All migrations applied total=37`.
`SELECT count(*) FROM information_schema.tables WHERE table_schema='cbt';` → **44**

- [ ] **Step 4: Commit**

```bash
git add migrations
git commit -m "feat(db): exam proctor & monitoring logs (phase 5)"
```

---

## Task 5I: Exam Offline & Sync — offline_sync, sync_log, sync_conflict

**Files:**
- Create: `backend/migrations/058_exam_offline.up.sql`
- Create: `backend/migrations/058_exam_offline.down.sql`

**Interfaces:**
- Consumes: `cbt.exam_attempt`.
- Produces: `cbt.offline_sync`, `cbt.sync_log`, `cbt.sync_conflict`. Append-only untuk log/conflict.

- [ ] **Step 1: Tulis `058_exam_offline.up.sql`**

```sql
-- Migration 058: offline sync - sync status, log, conflict.

CREATE TABLE cbt.offline_sync (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    attempt_id uuid NOT NULL REFERENCES cbt.exam_attempt(id) ON DELETE CASCADE,
    last_sync timestamptz,
    status varchar(30) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING','SYNCING','SYNCED','FAILED')),
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW(),
    UNIQUE (attempt_id)
);
CREATE TRIGGER trg_offline_sync_updated BEFORE UPDATE ON cbt.offline_sync
    FOR EACH ROW EXECUTE FUNCTION shared.set_updated_at();

CREATE TABLE cbt.sync_log (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    attempt_id uuid NOT NULL REFERENCES cbt.exam_attempt(id) ON DELETE CASCADE,
    result_json jsonb,
    created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_sync_log_attempt ON cbt.sync_log(attempt_id);

CREATE TABLE cbt.sync_conflict (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    attempt_id uuid NOT NULL REFERENCES cbt.exam_attempt(id) ON DELETE CASCADE,
    detail_json jsonb,
    created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_sync_conflict_attempt ON cbt.sync_conflict(attempt_id);
```

- [ ] **Step 2: Tulis `058_exam_offline.down.sql`**

```sql
DROP TABLE IF EXISTS cbt.sync_conflict;
DROP TABLE IF EXISTS cbt.sync_log;
DROP TABLE IF EXISTS cbt.offline_sync;
```

- [ ] **Step 3: Verifikasi**

```bash
go run cmd/migrate/main.go up
```
Expected: applied 058; `All migrations applied total=38`.
`SELECT count(*) FROM information_schema.tables WHERE table_schema='cbt';` → **47**

- [ ] **Step 4: Commit**

```bash
git add migrations
git commit -m "feat(db): exam offline sync & conflict (phase 5)"
```

---

## Task 5J: Exam Statistics & History — statistics, question_statistics, participant_statistics, realtime_dashboard, 4 history

**Files:**
- Create: `backend/migrations/059_exam_statistics.up.sql`
- Create: `backend/migrations/059_exam_statistics.down.sql`

**Interfaces:**
- Consumes: `cbt.exam`, `cbt.exam_participant`, `question.question`, `identity.user`.
- Produces: `cbt.exam_statistics`, `cbt.question_statistics`, `cbt.participant_statistics`, `cbt.realtime_dashboard`, `cbt.exam_history`, `cbt.attempt_history`, `cbt.grading_history`, `cbt.publish_history` (append-only).

- [ ] **Step 1: Tulis `059_exam_statistics.up.sql`**

```sql
-- Migration 059: exam statistics & append-only history tables.

CREATE TABLE cbt.exam_statistics (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    exam_id uuid NOT NULL REFERENCES cbt.exam(id) ON DELETE CASCADE,
    average_score numeric(5,2),
    highest_score numeric(5,2),
    lowest_score numeric(5,2),
    std_dev numeric(6,3),
    created_at timestamptz NOT NULL DEFAULT NOW(),
    UNIQUE (exam_id)
);

CREATE TABLE cbt.question_statistics (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    question_id uuid NOT NULL REFERENCES question.question(id) ON DELETE CASCADE,
    shown_count int NOT NULL DEFAULT 0,
    correct_count int NOT NULL DEFAULT 0,
    wrong_count int NOT NULL DEFAULT 0,
    blank_count int NOT NULL DEFAULT 0,
    accuracy numeric(5,2) NOT NULL DEFAULT 0,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    UNIQUE (question_id)
);

CREATE TABLE cbt.participant_statistics (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    participant_id uuid NOT NULL REFERENCES cbt.exam_participant(id) ON DELETE CASCADE,
    total_score numeric(10,2) NOT NULL DEFAULT 0,
    correct int NOT NULL DEFAULT 0,
    wrong int NOT NULL DEFAULT 0,
    blank int NOT NULL DEFAULT 0,
    duration_second int NOT NULL DEFAULT 0,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    UNIQUE (participant_id)
);

CREATE TABLE cbt.realtime_dashboard (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    exam_id uuid NOT NULL REFERENCES cbt.exam(id) ON DELETE CASCADE,
    snapshot_json jsonb,
    created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_realtime_dashboard_exam ON cbt.realtime_dashboard(exam_id);

CREATE TABLE cbt.exam_history (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    exam_id uuid REFERENCES cbt.exam(id) ON DELETE SET NULL,
    action varchar(40) NOT NULL CHECK (action IN ('CREATE','UPDATE','REVIEW','PUBLISH','ARCHIVE','RESTORE','DELETE')),
    changed_by uuid REFERENCES identity.user(id) ON DELETE SET NULL,
    old_json jsonb,
    new_json jsonb,
    created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_exam_history_exam ON cbt.exam_history(exam_id);
CREATE INDEX idx_exam_history_time ON cbt.exam_history(created_at);

CREATE TABLE cbt.attempt_history (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    attempt_id uuid REFERENCES cbt.exam_attempt(id) ON DELETE SET NULL,
    action varchar(40) NOT NULL CHECK (action IN ('CREATE','START','PAUSE','RESUME','SUBMIT','GRADE','DELETE')),
    changed_by uuid REFERENCES identity.user(id) ON DELETE SET NULL,
    old_json jsonb,
    new_json jsonb,
    created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_attempt_history_attempt ON cbt.attempt_history(attempt_id);
CREATE INDEX idx_attempt_history_time ON cbt.attempt_history(created_at);

CREATE TABLE cbt.grading_history (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    attempt_id uuid REFERENCES cbt.exam_attempt(id) ON DELETE SET NULL,
    action varchar(40) NOT NULL CHECK (action IN ('GRADE','REGRADE','MANUAL_FIX','AI_REVIEW')),
    changed_by uuid REFERENCES identity.user(id) ON DELETE SET NULL,
    old_json jsonb,
    new_json jsonb,
    created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_grading_history_attempt ON cbt.grading_history(attempt_id);
CREATE INDEX idx_grading_history_time ON cbt.grading_history(created_at);

CREATE TABLE cbt.publish_history (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    exam_id uuid REFERENCES cbt.exam(id) ON DELETE SET NULL,
    status varchar(30) NOT NULL,
    published_by uuid REFERENCES identity.user(id) ON DELETE SET NULL,
    published_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_publish_history_exam ON cbt.publish_history(exam_id);
```

- [ ] **Step 2: Tulis `059_exam_statistics.down.sql`**

```sql
DROP TABLE IF EXISTS cbt.publish_history;
DROP TABLE IF EXISTS cbt.grading_history;
DROP TABLE IF EXISTS cbt.attempt_history;
DROP TABLE IF EXISTS cbt.exam_history;
DROP TABLE IF EXISTS cbt.realtime_dashboard;
DROP TABLE IF EXISTS cbt.participant_statistics;
DROP TABLE IF EXISTS cbt.question_statistics;
DROP TABLE IF EXISTS cbt.exam_statistics;
```

- [ ] **Step 3: Verifikasi**

```bash
go run cmd/migrate/main.go up
```
Expected: applied 059; `All migrations applied total=39`.
`SELECT count(*) FROM information_schema.tables WHERE table_schema='cbt';` → **55** ✓ (menyelesaikan domain cbt)

- [ ] **Step 4: Commit**

```bash
git add migrations
git commit -m "feat(db): exam statistics & history (phase 5) - completes cbt domain (55 tables)"
```

---

## Self-Review

**Spec coverage:** design doc §3 fase 5 (CBT, 55 tabel) terpenuhi: 10 file migrasi (050–059), 55 tabel sesuai §4.5 katalog. Daftar 1:1 — exam, exam_metadata, exam_status, exam_subject, exam_grade, exam_curriculum, exam_chapter, exam_topic, exam_competency, exam_tag, exam_package, exam_package_question, exam_question_pool, exam_randomization, exam_random_log, exam_schedule, exam_session, exam_proctor, exam_participant, participant_package, exam_attempt, attempt_question, attempt_option, student_answer, essay_answer, answer_history, navigation_log, bookmark_question, question_time, exam_timer, timer_history, auto_submit, grading_result, essay_grading, ai_grading, grading_detail, live_monitor, heartbeat, connection_log, cheating_log, browser_log, camera_log, face_detection, microphone_detection, offline_sync, sync_log, sync_conflict, exam_statistics, question_statistics, participant_statistics, realtime_dashboard, exam_history, attempt_history, grading_history, publish_history = 55.

**Placeholder scan:** tidak ada TBD/TODO; SQL lengkap per task; enum & indeks eksplisit.

**Type/name consistency:** konvensi §2 diterapkan (uuid PK, snake_case, timestamps, deleted_at pada `cbt.exam`, CHECK enum, indeks FK/komposit/unik). FK tertunda Phase 4 (`question.question_exam.exam_id`) diresolusi di Task 5A. `exam_random_log` dikelompokkan ke Task 5E karena butuh `cbt.exam_attempt`. Junction `exam_tag` memakai `(exam_id, tag)` — konsisten dengan `question_tag` Phase 4.

**Cacat design yang dihindari:** tidak ada dual-schema legacy (`exam_*` lama sudah dihapus di Phase 0); attempt/answer/grading terpisah bersih; log append-only tanpa `updated_at`; tabel history memakai `ON DELETE SET NULL` agar audit survive penghapusan entitas (pola yang sama dengan `question_history` Phase 4).

## Execution Handoff

**Plan selesai & tersimpan: `docs/superpowers/plans/2026-08-04-database-rebuild-phase5-cbt.md`. Dua opsi eksekusi:**

1. **Subagent-Driven (recommended)** — dispatch subagent baru per task, review antar task, iterasi cepat.
2. **Inline Execution** — eksekusi tasks di sesi ini dengan checkpoints.

**Pilih yang mana?**
