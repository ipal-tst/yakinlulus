# Database Rebuild Phase 13 Implementation Plan (OCR / Import Engine)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bangun domain `ocr` (OCR / Import Engine) — **28 tabel** — sesuai design doc `docs/superpowers/specs/2026-08-04-database-rebuild-design.md` §4.14, menggantikan pipeline impor/OCR legacy yang tersebar di `question.question_import_*`.

**Architecture:** Mekanisme per design doc §4.14: import job → file → document pages → OCR engine → OCR result + layout analysis → extraction (block/image/table/formula) → AI parsing job → parsed question/option/explanation/metadata → review + duplicate detection → validation (rule/result) → batch import (batch/result/error) + templates → versioning, processing queue/worker, statistics, configuration. `ocr` adalah **support domain** yang memakai FK ke `identity.user` (uploaded_by/reviewer/created_by) dan `media.asset` (file referensi) sesuai runbook §1.

**Tech Stack:** PostgreSQL (Supabase), runner Go `go run cmd/migrate/main.go up` (dari `backend/`), verifikasi via throwaway Go program (pgx) di `C:\Users\ADMINI~1\AppData\Local\Temp\opencode\verify_13\main.go`.

**Files target:** `backend/migrations/130_*.up.sql` s.d. `139_*.up.sql` (10 file pasangan, range 130–139 sesuai runbook §2).

---

## Global Constraints

Semua tabel mematuhi **Global Conventions** (`docs/superpowers/specs/2026-08-04-database-rebuild-design.md` §2):

- PK: `id uuid PRIMARY KEY DEFAULT gen_random_uuid()` di setiap tabel.
- Nama `snake_case` singular; kolom referensi `<entity>_id`.
- `created_at timestamptz NOT NULL DEFAULT NOW()` wajib; `updated_at` untuk tabel mutable.
- Enum: `varchar` + `CHECK (col IN (...))`, tidak `CREATE TYPE`.
- Indeks semua FK + filter umum; indeks unik sesuai spec.
- JSONB untuk payload/config (`bounding_box`, `layout_json`, `table_json`, `schema_json`, `raw_data`).
- Migrasi harus `up` bersih, dibungkus transaksi (runner sudah tx per file).
- Jangan sentuh kode Go runner.
- **Keputusan desain (deviasi minor, dicatat):**
  1. **Tidak ada partisi fisik** — konsisten dengan semua fase sebelumnya; strategi partisi ditunda.
  2. **FK policy:** `import_job.uploaded_by/assigned_reviewer` → `identity.user` (SET NULL); `import_file.file_id` konteks tetap `import_job` internal; storage paths (`path`, `image_path`, `thumbnail_path`, `sample_file`) tetap `varchar` — TIDAK wajib FK `media.asset` kecuali katalog menyebut entity media; FK media tidak ditambahkan untuk menghindari coupling yang tidak diperlukan (deviasi dicatat).
  3. **Tabel append-only** (tanpa `updated_at`, tanpa trigger): `import_file`, `document_page`, `ocr_result`, `layout_analysis`, `extracted_block`, `extracted_image`, `extracted_table`, `extracted_formula`, `ai_parsing_job`, `parsed_option`, `parsed_explanation`, `parsed_metadata`, `parsing_review`, `validation_result`, `duplicate_detection`, `import_batch`, `import_result`, `import_error`, `import_statistics`.
  4. Tabel mutable + trigger `shared.set_updated_at()`: `import_job`, `ocr_engine`, `parsed_question`, `import_validation_rule`, `import_template`, `document_version`, `processing_queue`, `processing_worker`, `import_configuration`.
  5. `similar_question` di `duplicate_detection` dan `record_id` di `import_result` memakai `uuid` tanpa FK (referensi lintas-domain / snapshot).

---

## Task 13A: Import Job & Import File

**Files:**
- Create: `backend/migrations/130_import_job.up.sql`
- Create: `backend/migrations/130_import_job.down.sql`

**Interfaces:**
- Consumes: schema `ocr` (000), `shared.set_updated_at()` (001), `identity.user`.
- Produces: `ocr.import_job`, `ocr.import_file`.

- [ ] **Step 1: Tulis `130_import_job.up.sql`**

```sql
-- Migration 130: import job & import file.

CREATE TABLE ocr.import_job (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    job_number varchar(50) NOT NULL,
    job_name varchar(200),
    module varchar(30) NOT NULL DEFAULT 'OTHER' CHECK (module IN ('QUESTION_BANK','LEARNING_MATERIAL','USER','ACADEMIC','EXAM','CMS','OTHER')),
    job_type varchar(20) NOT NULL DEFAULT 'IMPORT' CHECK (job_type IN ('OCR','IMPORT','OCR_AI','IMPORT_AI','MIGRATION')),
    source_type varchar(20) NOT NULL DEFAULT 'FILE' CHECK (source_type IN ('PDF','DOCX','PPTX','IMAGE','EXCEL','CSV','ZIP')),
    status varchar(20) NOT NULL DEFAULT 'UPLOADED'
        CHECK (status IN ('UPLOADED','VALIDATING','PROCESSING','OCR','AI_PARSING','REVIEW','APPROVED','IMPORTING','COMPLETED','FAILED','CANCELLED')),
    priority int NOT NULL DEFAULT 0,
    uploaded_by uuid REFERENCES identity.user(id) ON DELETE SET NULL,
    assigned_reviewer uuid REFERENCES identity.user(id) ON DELETE SET NULL,
    started_at timestamptz,
    completed_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX uq_import_job_number ON ocr.import_job(job_number);
CREATE INDEX idx_import_job_status ON ocr.import_job(status);
CREATE INDEX idx_import_job_uploaded_by ON ocr.import_job(uploaded_by);
CREATE INDEX idx_import_job_reviewer ON ocr.import_job(assigned_reviewer);
CREATE TRIGGER trg_import_job_updated BEFORE UPDATE ON ocr.import_job
    FOR EACH ROW EXECUTE FUNCTION shared.set_updated_at();

CREATE TABLE ocr.import_file (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id uuid NOT NULL REFERENCES ocr.import_job(id) ON DELETE CASCADE,
    original_filename varchar(255) NOT NULL,
    stored_filename varchar(255),
    storage_provider varchar(60),
    bucket varchar(120),
    path text,
    mime_type varchar(120),
    extension varchar(20),
    file_size bigint NOT NULL DEFAULT 0,
    total_pages int NOT NULL DEFAULT 0,
    checksum varchar(64),
    version int NOT NULL DEFAULT 1,
    is_encrypted boolean NOT NULL DEFAULT false,
    uploaded_at timestamptz NOT NULL DEFAULT NOW(),
    created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_import_file_job ON ocr.import_file(job_id);
CREATE INDEX idx_import_file_checksum ON ocr.import_file(checksum);
```

- [ ] **Step 2: Tulis `130_import_job.down.sql`**

```sql
DROP TABLE IF EXISTS ocr.import_file;
DROP TABLE IF EXISTS ocr.import_job;
```

- [ ] **Step 3: Verifikasi**

Dari `backend/`:
```bash
go run cmd/migrate/main.go up
```
Expected: `Migration applied name=130_import_job.up.sql`; `All migrations applied total=100`.

Verifikasi via throwaway Go (pgx, `$env:PQURL`): `SELECT count(*) FROM information_schema.tables WHERE table_schema='ocr';` → **2**

- [ ] **Step 4: Commit**

```bash
git add backend/migrations
git commit -m "feat(db): ocr import job & file (phase 13)"
```

---

## Task 13B: Document Page & OCR Engine

**Files:**
- Create: `backend/migrations/131_document_page.up.sql`
- Create: `backend/migrations/131_document_page.down.sql`

**Interfaces:**
- Consumes: `ocr.import_file`, `shared.set_updated_at()`.
- Produces: `ocr.document_page`, `ocr.ocr_engine`.

- [ ] **Step 1: Tulis `131_document_page.up.sql`**

```sql
-- Migration 131: document page & ocr engine.

CREATE TABLE ocr.document_page (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    file_id uuid NOT NULL REFERENCES ocr.import_file(id) ON DELETE CASCADE,
    page_number int NOT NULL DEFAULT 1,
    image_path text,
    thumbnail_path text,
    width int,
    height int,
    dpi int,
    rotation numeric(5,2) NOT NULL DEFAULT 0,
    language varchar(10) DEFAULT 'id',
    ocr_status varchar(20) NOT NULL DEFAULT 'PENDING' CHECK (ocr_status IN ('PENDING','OCR_PROCESSING','OCR_DONE','OCR_FAILED')),
    created_at timestamptz NOT NULL DEFAULT NOW(),
    UNIQUE (file_id, page_number)
);
CREATE INDEX idx_document_page_file ON ocr.document_page(file_id, page_number);

CREATE TABLE ocr.ocr_engine (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    engine_name varchar(100) NOT NULL,
    provider varchar(30) NOT NULL CHECK (provider IN ('TESSERACT','GOOGLE_VISION','AZURE_VISION','AWS_TEXTRACT','OPENAI','GEMINI')),
    version varchar(30),
    supports_table boolean NOT NULL DEFAULT false,
    supports_formula boolean NOT NULL DEFAULT false,
    supports_handwriting boolean NOT NULL DEFAULT false,
    supports_layout boolean NOT NULL DEFAULT false,
    supports_multilanguage boolean NOT NULL DEFAULT false,
    status varchar(20) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE','INACTIVE','DEPRECATED')),
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW(),
    UNIQUE (engine_name, provider)
);
CREATE INDEX idx_ocr_engine_status ON ocr.ocr_engine(status);
CREATE TRIGGER trg_ocr_engine_updated BEFORE UPDATE ON ocr.ocr_engine
    FOR EACH ROW EXECUTE FUNCTION shared.set_updated_at();
```

- [ ] **Step 2: Tulis `131_document_page.down.sql`**

```sql
DROP TABLE IF EXISTS ocr.ocr_engine;
DROP TABLE IF EXISTS ocr.document_page;
```

- [ ] **Step 3: Verifikasi**

```bash
go run cmd/migrate/main.go up
```
Expected: applied 131; `All migrations applied total=101`.
`SELECT count(*) FROM information_schema.tables WHERE table_schema='ocr';` → **4**

- [ ] **Step 4: Commit**

```bash
git add backend/migrations
git commit -m "feat(db): ocr document page & engine (phase 13)"
```

---

## Task 13C: OCR Result & Layout Analysis

**Files:**
- Create: `backend/migrations/132_ocr_result.up.sql`
- Create: `backend/migrations/132_ocr_result.down.sql`

**Interfaces:**
- Consumes: `ocr.document_page`, `ocr.ocr_engine`.
- Produces: `ocr.ocr_result`, `ocr.layout_analysis` (keduanya append-only).

- [ ] **Step 1: Tulis `132_ocr_result.up.sql`**

```sql
-- Migration 132: ocr result & layout analysis.

CREATE TABLE ocr.ocr_result (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    page_id uuid NOT NULL REFERENCES ocr.document_page(id) ON DELETE CASCADE,
    engine_id uuid REFERENCES ocr.ocr_engine(id) ON DELETE SET NULL,
    raw_text text,
    confidence numeric(5,4),
    processing_time_ms int,
    language varchar(10),
    rotation_detected numeric(5,2) NOT NULL DEFAULT 0,
    created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_ocr_result_page ON ocr.ocr_result(page_id);
CREATE INDEX idx_ocr_result_engine ON ocr.ocr_result(engine_id);

CREATE TABLE ocr.layout_analysis (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    page_id uuid NOT NULL REFERENCES ocr.document_page(id) ON DELETE CASCADE,
    layout_json jsonb,
    column_count int NOT NULL DEFAULT 1,
    header_detected boolean NOT NULL DEFAULT false,
    footer_detected boolean NOT NULL DEFAULT false,
    table_detected boolean NOT NULL DEFAULT false,
    image_detected boolean NOT NULL DEFAULT false,
    formula_detected boolean NOT NULL DEFAULT false,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    UNIQUE (page_id)
);
```

- [ ] **Step 2: Tulis `132_ocr_result.down.sql`**

```sql
DROP TABLE IF EXISTS ocr.layout_analysis;
DROP TABLE IF EXISTS ocr.ocr_result;
```

- [ ] **Step 3: Verifikasi**

```bash
go run cmd/migrate/main.go up
```
Expected: applied 132; `All migrations applied total=102`.
`SELECT count(*) FROM information_schema.tables WHERE table_schema='ocr';` → **6**

- [ ] **Step 4: Commit**

```bash
git add backend/migrations
git commit -m "feat(db): ocr result & layout analysis (phase 13)"
```

---

## Task 13D: Extracted Block, Image, Table, Formula

**Files:**
- Create: `backend/migrations/133_extracted_block.up.sql`
- Create: `backend/migrations/133_extracted_block.down.sql`

**Interfaces:**
- Consumes: `ocr.document_page`.
- Produces: `ocr.extracted_block`, `ocr.extracted_image`, `ocr.extracted_table`, `ocr.extracted_formula` (semua append-only).

- [ ] **Step 1: Tulis `133_extracted_block.up.sql`**

```sql
-- Migration 133: extracted block, image, table, formula.

CREATE TABLE ocr.extracted_block (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    page_id uuid NOT NULL REFERENCES ocr.document_page(id) ON DELETE CASCADE,
    block_type varchar(20) NOT NULL CHECK (block_type IN ('TEXT','TABLE','IMAGE','FORMULA','HEADER','FOOTER')),
    block_order int NOT NULL DEFAULT 0,
    bounding_box jsonb,
    content text,
    confidence numeric(5,4),
    created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_extracted_block_page ON ocr.extracted_block(page_id, block_order);
CREATE INDEX idx_extracted_block_type ON ocr.extracted_block(block_type);

CREATE TABLE ocr.extracted_image (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    page_id uuid NOT NULL REFERENCES ocr.document_page(id) ON DELETE CASCADE,
    image_path text,
    width int,
    height int,
    caption text,
    hash varchar(64),
    created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_extracted_image_page ON ocr.extracted_image(page_id);

CREATE TABLE ocr.extracted_table (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    page_id uuid NOT NULL REFERENCES ocr.document_page(id) ON DELETE CASCADE,
    table_json jsonb,
    row_count int NOT NULL DEFAULT 0,
    column_count int NOT NULL DEFAULT 0,
    confidence numeric(5,4),
    created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_extracted_table_page ON ocr.extracted_table(page_id);

CREATE TABLE ocr.extracted_formula (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    page_id uuid NOT NULL REFERENCES ocr.document_page(id) ON DELETE CASCADE,
    latex text,
    mathml text,
    confidence numeric(5,4),
    created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_extracted_formula_page ON ocr.extracted_formula(page_id);
```

- [ ] **Step 2: Tulis `133_extracted_block.down.sql`**

```sql
DROP TABLE IF EXISTS ocr.extracted_formula;
DROP TABLE IF EXISTS ocr.extracted_table;
DROP TABLE IF EXISTS ocr.extracted_image;
DROP TABLE IF EXISTS ocr.extracted_block;
```

- [ ] **Step 3: Verifikasi**

```bash
go run cmd/migrate/main.go up
```
Expected: applied 133; `All migrations applied total=103`.
`SELECT count(*) FROM information_schema.tables WHERE table_schema='ocr';` → **10**

- [ ] **Step 4: Commit**

```bash
git add backend/migrations
git commit -m "feat(db): ocr extracted block/image/table/formula (phase 13)"
```

---

## Task 13E: AI Parsing Job & Parsed Question

**Files:**
- Create: `backend/migrations/134_ai_parsing.up.sql`
- Create: `backend/migrations/134_ai_parsing.down.sql`

**Interfaces:**
- Consumes: `ocr.import_job`, `shared.set_updated_at()`.
- Produces: `ocr.ai_parsing_job` (append-only), `ocr.parsed_question`.

- [ ] **Step 1: Tulis `134_ai_parsing.up.sql`**

```sql
-- Migration 134: ai parsing job & parsed question.

CREATE TABLE ocr.ai_parsing_job (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id uuid NOT NULL REFERENCES ocr.import_job(id) ON DELETE CASCADE,
    provider varchar(30),
    model varchar(120),
    prompt_version varchar(30),
    status varchar(20) NOT NULL DEFAULT 'STARTED' CHECK (status IN ('STARTED','SUCCESS','FAILED')),
    input_token int NOT NULL DEFAULT 0,
    output_token int NOT NULL DEFAULT 0,
    cost numeric(12,4) NOT NULL DEFAULT 0,
    duration_ms int,
    created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_ai_parsing_job_job ON ocr.ai_parsing_job(job_id);
CREATE INDEX idx_ai_parsing_job_status ON ocr.ai_parsing_job(status);

CREATE TABLE ocr.parsed_question (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id uuid NOT NULL REFERENCES ocr.ai_parsing_job(id) ON DELETE CASCADE,
    question_number int NOT NULL DEFAULT 1,
    question_text text,
    question_image text,
    difficulty varchar(20),
    subject_prediction varchar(100),
    chapter_prediction varchar(100),
    topic_prediction varchar(100),
    confidence numeric(5,4),
    status varchar(20) NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT','REVIEW','APPROVED')),
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_parsed_question_job ON ocr.parsed_question(job_id);
CREATE INDEX idx_parsed_question_status ON ocr.parsed_question(status);
CREATE TRIGGER trg_parsed_question_updated BEFORE UPDATE ON ocr.parsed_question
    FOR EACH ROW EXECUTE FUNCTION shared.set_updated_at();
```

- [ ] **Step 2: Tulis `134_ai_parsing.down.sql`**

```sql
DROP TABLE IF EXISTS ocr.parsed_question;
DROP TABLE IF EXISTS ocr.ai_parsing_job;
```

- [ ] **Step 3: Verifikasi**

```bash
go run cmd/migrate/main.go up
```
Expected: applied 134; `All migrations applied total=104`.
`SELECT count(*) FROM information_schema.tables WHERE table_schema='ocr';` → **12**

- [ ] **Step 4: Commit**

```bash
git add backend/migrations
git commit -m "feat(db): ocr ai parsing & parsed question (phase 13)"
```

---

## Task 13F: Parsed Option, Explanation, Metadata

**Files:**
- Create: `backend/migrations/135_parsed_detail.up.sql`
- Create: `backend/migrations/135_parsed_detail.down.sql`

**Interfaces:**
- Consumes: `ocr.parsed_question`.
- Produces: `ocr.parsed_option`, `ocr.parsed_explanation`, `ocr.parsed_metadata` (semua append-only).

- [ ] **Step 1: Tulis `135_parsed_detail.up.sql`**

```sql
-- Migration 135: parsed option, explanation, metadata.

CREATE TABLE ocr.parsed_option (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    question_id uuid NOT NULL REFERENCES ocr.parsed_question(id) ON DELETE CASCADE,
    option_label varchar(10) NOT NULL,
    option_text text,
    option_image text,
    is_answer boolean NOT NULL DEFAULT false,
    confidence numeric(5,4),
    created_at timestamptz NOT NULL DEFAULT NOW(),
    UNIQUE (question_id, option_label)
);
CREATE INDEX idx_parsed_option_question ON ocr.parsed_option(question_id);

CREATE TABLE ocr.parsed_explanation (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    question_id uuid NOT NULL REFERENCES ocr.parsed_question(id) ON DELETE CASCADE,
    explanation text,
    reference text,
    confidence numeric(5,4),
    created_at timestamptz NOT NULL DEFAULT NOW(),
    UNIQUE (question_id)
);

CREATE TABLE ocr.parsed_metadata (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    question_id uuid NOT NULL REFERENCES ocr.parsed_question(id) ON DELETE CASCADE,
    education_level varchar(30),
    grade varchar(20),
    subject varchar(100),
    chapter varchar(100),
    subchapter varchar(100),
    difficulty varchar(20),
    estimated_duration int,
    question_type varchar(30),
    language varchar(10) DEFAULT 'id',
    created_at timestamptz NOT NULL DEFAULT NOW(),
    UNIQUE (question_id)
);
```

- [ ] **Step 2: Tulis `135_parsed_detail.down.sql`**

```sql
DROP TABLE IF EXISTS ocr.parsed_metadata;
DROP TABLE IF EXISTS ocr.parsed_explanation;
DROP TABLE IF EXISTS ocr.parsed_option;
```

- [ ] **Step 3: Verifikasi**

```bash
go run cmd/migrate/main.go up
```
Expected: applied 135; `All migrations applied total=105`.
`SELECT count(*) FROM information_schema.tables WHERE table_schema='ocr';` → **15**

- [ ] **Step 4: Commit**

```bash
git add backend/migrations
git commit -m "feat(db): ocr parsed option/explanation/metadata (phase 13)"
```

---

## Task 13G: Parsing Review & Duplicate Detection

**Files:**
- Create: `backend/migrations/136_parsing_review.up.sql`
- Create: `backend/migrations/136_parsing_review.down.sql`

**Interfaces:**
- Consumes: `ocr.parsed_question`, `identity.user`.
- Produces: `ocr.parsing_review` (append-only), `ocr.duplicate_detection` (append-only).

- [ ] **Step 1: Tulis `136_parsing_review.up.sql`**

```sql
-- Migration 136: parsing review & duplicate detection.

CREATE TABLE ocr.parsing_review (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    question_id uuid NOT NULL REFERENCES ocr.parsed_question(id) ON DELETE CASCADE,
    reviewer uuid REFERENCES identity.user(id) ON DELETE SET NULL,
    status varchar(20) NOT NULL CHECK (status IN ('APPROVED','REJECTED','REVISION')),
    notes text,
    reviewed_at timestamptz NOT NULL DEFAULT NOW(),
    created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_parsing_review_question ON ocr.parsing_review(question_id);
CREATE INDEX idx_parsing_review_status ON ocr.parsing_review(status);

CREATE TABLE ocr.duplicate_detection (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    question_id uuid NOT NULL REFERENCES ocr.parsed_question(id) ON DELETE CASCADE,
    similar_question uuid,
    similarity_score numeric(5,4),
    algorithm varchar(50),
    status varchar(20) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING','CONFIRMED','FALSE_POSITIVE')),
    created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_duplicate_detection_question ON ocr.duplicate_detection(question_id);
```

- [ ] **Step 2: Tulis `136_parsing_review.down.sql`**

```sql
DROP TABLE IF EXISTS ocr.duplicate_detection;
DROP TABLE IF EXISTS ocr.parsing_review;
```

- [ ] **Step 3: Verifikasi**

```bash
go run cmd/migrate/main.go up
```
Expected: applied 136; `All migrations applied total=106`.
`SELECT count(*) FROM information_schema.tables WHERE table_schema='ocr';` → **17**

- [ ] **Step 4: Commit**

```bash
git add backend/migrations
git commit -m "feat(db): ocr parsing review & duplicate detection (phase 13)"
```

---

## Task 13H: Validation Rule & Validation Result

**Files:**
- Create: `backend/migrations/137_validation.up.sql`
- Create: `backend/migrations/137_validation.down.sql`

**Interfaces:**
- Consumes: `ocr.import_job`, `shared.set_updated_at()`.
- Produces: `ocr.import_validation_rule`, `ocr.validation_result` (append-only).

- [ ] **Step 1: Tulis `137_validation.up.sql`**

```sql
-- Migration 137: import validation rule & validation result.

CREATE TABLE ocr.import_validation_rule (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    rule_name varchar(120) NOT NULL,
    module varchar(30) NOT NULL DEFAULT 'OTHER' CHECK (module IN ('QUESTION_BANK','LEARNING_MATERIAL','USER','ACADEMIC','EXAM','CMS','OTHER')),
    validation_type varchar(20) NOT NULL DEFAULT 'REGEX' CHECK (validation_type IN ('REGEX','AI','SCRIPT')),
    rule_expression text,
    error_message text,
    severity varchar(20) NOT NULL DEFAULT 'ERROR' CHECK (severity IN ('WARNING','ERROR')),
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW(),
    UNIQUE (rule_name)
);
CREATE INDEX idx_import_validation_rule_module ON ocr.import_validation_rule(module);
CREATE TRIGGER trg_import_validation_rule_updated BEFORE UPDATE ON ocr.import_validation_rule
    FOR EACH ROW EXECUTE FUNCTION shared.set_updated_at();

CREATE TABLE ocr.validation_result (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id uuid NOT NULL REFERENCES ocr.import_job(id) ON DELETE CASCADE,
    rule_id uuid REFERENCES ocr.import_validation_rule(id) ON DELETE SET NULL,
    object_type varchar(20) NOT NULL DEFAULT 'FILE' CHECK (object_type IN ('FILE','QUESTION','OPTION','IMAGE')),
    object_id uuid,
    status varchar(20) NOT NULL CHECK (status IN ('PASSED','FAILED')),
    message text,
    created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_validation_result_job ON ocr.validation_result(job_id);
CREATE INDEX idx_validation_result_status ON ocr.validation_result(status);
```

- [ ] **Step 2: Tulis `137_validation.down.sql`**

```sql
DROP TABLE IF EXISTS ocr.validation_result;
DROP TABLE IF EXISTS ocr.import_validation_rule;
```

- [ ] **Step 3: Verifikasi**

```bash
go run cmd/migrate/main.go up
```
Expected: applied 137; `All migrations applied total=107`.
`SELECT count(*) FROM information_schema.tables WHERE table_schema='ocr';` → **19**

- [ ] **Step 4: Commit**

```bash
git add backend/migrations
git commit -m "feat(db): ocr validation rule & result (phase 13)"
```

---

## Task 13I: Import Batch, Result, Error, Template

**Files:**
- Create: `backend/migrations/138_import_batch.up.sql`
- Create: `backend/migrations/138_import_batch.down.sql`

**Interfaces:**
- Consumes: `ocr.import_job`, `shared.set_updated_at()`.
- Produces: `ocr.import_batch`, `ocr.import_result`, `ocr.import_error` (append-only), `ocr.import_template`.

- [ ] **Step 1: Tulis `138_import_batch.up.sql`**

```sql
-- Migration 138: import batch, result, error, template.

CREATE TABLE ocr.import_batch (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id uuid NOT NULL REFERENCES ocr.import_job(id) ON DELETE CASCADE,
    batch_no int NOT NULL DEFAULT 1,
    total_record int NOT NULL DEFAULT 0,
    success_record int NOT NULL DEFAULT 0,
    failed_record int NOT NULL DEFAULT 0,
    processing_time int,
    status varchar(20) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING','PROCESSING','SUCCESS','FAILED','PARTIAL')),
    created_at timestamptz NOT NULL DEFAULT NOW(),
    UNIQUE (job_id, batch_no)
);
CREATE INDEX idx_import_batch_job ON ocr.import_batch(job_id);

CREATE TABLE ocr.import_result (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    batch_id uuid NOT NULL REFERENCES ocr.import_batch(id) ON DELETE CASCADE,
    target_table varchar(100),
    record_id uuid,
    status varchar(20) NOT NULL CHECK (status IN ('SUCCESS','FAILED')),
    error_message text,
    created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_import_result_batch ON ocr.import_result(batch_id);
CREATE INDEX idx_import_result_status ON ocr.import_result(status);

CREATE TABLE ocr.import_error (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id uuid NOT NULL REFERENCES ocr.import_job(id) ON DELETE CASCADE,
    page int,
    line int,
    error_type varchar(50),
    description text,
    raw_data jsonb,
    created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_import_error_job ON ocr.import_error(job_id);

CREATE TABLE ocr.import_template (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    module varchar(30) NOT NULL DEFAULT 'OTHER' CHECK (module IN ('QUESTION_BANK','LEARNING_MATERIAL','USER','ACADEMIC','EXAM','CMS','OTHER')),
    template_name varchar(120) NOT NULL,
    template_version varchar(30) NOT NULL DEFAULT '1.0',
    schema_json jsonb,
    sample_file text,
    status varchar(20) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE','INACTIVE','DEPRECATED')),
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW(),
    UNIQUE (module, template_name, template_version)
);
CREATE INDEX idx_import_template_status ON ocr.import_template(status);
CREATE TRIGGER trg_import_template_updated BEFORE UPDATE ON ocr.import_template
    FOR EACH ROW EXECUTE FUNCTION shared.set_updated_at();
```

- [ ] **Step 2: Tulis `138_import_batch.down.sql`**

```sql
DROP TABLE IF EXISTS ocr.import_template;
DROP TABLE IF EXISTS ocr.import_error;
DROP TABLE IF EXISTS ocr.import_result;
DROP TABLE IF EXISTS ocr.import_batch;
```

- [ ] **Step 3: Verifikasi**

```bash
go run cmd/migrate/main.go up
```
Expected: applied 138; `All migrations applied total=108`.
`SELECT count(*) FROM information_schema.tables WHERE table_schema='ocr';` → **23**

- [ ] **Step 4: Commit**

```bash
git add backend/migrations
git commit -m "feat(db): ocr import batch/result/error/template (phase 13)"
```

---

## Task 13J: Version, Processing Queue/Worker, Statistics, Configuration

**Files:**
- Create: `backend/migrations/139_processing_config.up.sql`
- Create: `backend/migrations/139_processing_config.down.sql`

**Interfaces:**
- Consumes: `ocr.import_file`, `ocr.import_job`, `identity.user`, `shared.set_updated_at()`.
- Produces: `ocr.document_version`, `ocr.processing_queue`, `ocr.processing_worker`, `ocr.import_statistics`, `ocr.import_configuration`. **Completes ocr domain (28 tables).**

- [ ] **Step 1: Tulis `139_processing_config.up.sql`**

```sql
-- Migration 139: document version, processing queue/worker, statistics, configuration. Completes ocr domain (28 tables).

CREATE TABLE ocr.document_version (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    file_id uuid NOT NULL REFERENCES ocr.import_file(id) ON DELETE CASCADE,
    version int NOT NULL DEFAULT 1,
    change_log text,
    created_by uuid REFERENCES identity.user(id) ON DELETE SET NULL,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW(),
    UNIQUE (file_id, version)
);
CREATE INDEX idx_document_version_file ON ocr.document_version(file_id, version);
CREATE TRIGGER trg_document_version_updated BEFORE UPDATE ON ocr.document_version
    FOR EACH ROW EXECUTE FUNCTION shared.set_updated_at();

CREATE TABLE ocr.processing_queue (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id uuid NOT NULL REFERENCES ocr.import_job(id) ON DELETE CASCADE,
    worker_name varchar(120),
    priority int NOT NULL DEFAULT 0,
    status varchar(20) NOT NULL DEFAULT 'WAITING' CHECK (status IN ('WAITING','RUNNING','FAILED','SUCCESS')),
    retry_count int NOT NULL DEFAULT 0,
    scheduled_at timestamptz,
    started_at timestamptz,
    finished_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_processing_queue_job ON ocr.processing_queue(job_id);
CREATE INDEX idx_processing_queue_status ON ocr.processing_queue(status, priority);
CREATE TRIGGER trg_processing_queue_updated BEFORE UPDATE ON ocr.processing_queue
    FOR EACH ROW EXECUTE FUNCTION shared.set_updated_at();

CREATE TABLE ocr.processing_worker (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    worker_name varchar(120) NOT NULL,
    hostname varchar(200),
    cpu numeric(5,2),
    memory numeric(5,2),
    current_job uuid,
    status varchar(20) NOT NULL DEFAULT 'HEALTHY' CHECK (status IN ('HEALTHY','BUSY','DOWN')),
    last_heartbeat timestamptz NOT NULL DEFAULT NOW(),
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW(),
    UNIQUE (worker_name)
);
CREATE INDEX idx_processing_worker_status ON ocr.processing_worker(status);
CREATE TRIGGER trg_processing_worker_updated BEFORE UPDATE ON ocr.processing_worker
    FOR EACH ROW EXECUTE FUNCTION shared.set_updated_at();

CREATE TABLE ocr.import_statistics (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    date date NOT NULL,
    total_job int NOT NULL DEFAULT 0,
    total_file int NOT NULL DEFAULT 0,
    total_question int NOT NULL DEFAULT 0,
    total_page int NOT NULL DEFAULT 0,
    success_rate numeric(5,2) NOT NULL DEFAULT 0,
    avg_processing_time numeric(12,2) NOT NULL DEFAULT 0,
    avg_ocr_confidence numeric(5,4) NOT NULL DEFAULT 0,
    avg_ai_confidence numeric(5,4) NOT NULL DEFAULT 0,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW(),
    UNIQUE (date)
);
CREATE INDEX idx_import_statistics_date ON ocr.import_statistics(date);
CREATE TRIGGER trg_import_statistics_updated BEFORE UPDATE ON ocr.import_statistics
    FOR EACH ROW EXECUTE FUNCTION shared.set_updated_at();

CREATE TABLE ocr.import_configuration (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    key varchar(100) NOT NULL,
    value text,
    description text,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW(),
    UNIQUE (key)
);
CREATE TRIGGER trg_import_configuration_updated BEFORE UPDATE ON ocr.import_configuration
    FOR EACH ROW EXECUTE FUNCTION shared.set_updated_at();
```

- [ ] **Step 2: Tulis `139_processing_config.down.sql`**

```sql
DROP TABLE IF EXISTS ocr.import_configuration;
DROP TABLE IF EXISTS ocr.import_statistics;
DROP TABLE IF EXISTS ocr.processing_worker;
DROP TABLE IF EXISTS ocr.processing_queue;
DROP TABLE IF EXISTS ocr.document_version;
```

- [ ] **Step 3: Verifikasi**

```bash
go run cmd/migrate/main.go up
```
Expected: applied 139; `All migrations applied total=109`.
`SELECT count(*) FROM information_schema.tables WHERE table_schema='ocr';` → **28** ✅ (menyelesaikan domain ocr)

- [ ] **Step 4: Commit**

```bash
git add backend/migrations
git commit -m "feat(db): ocr version/processing/statistics/config (phase 13) - completes ocr domain (28 tables)"
```

---

## Final Verification (mandatory)

1. `go run cmd/migrate/main.go up` (dari `backend/`) → bersih, `All migrations applied total=109`.
2. Throwaway verifier `C:\Users\ADMINI~1\AppData\Local\Temp\opencode\verify_13\main.go`:
   - `SELECT count(*) FROM information_schema.tables WHERE table_schema='ocr';` → **28**
   - `SELECT count(*) FROM public._migrations WHERE name ~ '^13[0-9]_';` → 10
3. Update `.superpowers/sdd/progress.md` (ledger phase 13, base 3efd12d).
4. Commit plan doc + progress ledger.

## Self-Review

**Spec coverage:** design doc §4.14 fase 13 (OCR / Import Engine, 28 tabel) terpenuhi: 10 file migrasi (130–139), 28 tabel sesuai katalog. Daftar 1:1 — import_job, import_file, document_page, ocr_engine, ocr_result, layout_analysis, extracted_block, extracted_image, extracted_table, extracted_formula, ai_parsing_job, parsed_question, parsed_option, parsed_explanation, parsed_metadata, parsing_review, import_validation_rule, validation_result, duplicate_detection, import_batch, import_result, import_error, import_template, document_version, processing_queue, processing_worker, import_statistics, import_configuration = 28.

**Placeholder scan:** tidak ada TBD/TODO; SQL lengkap per task; enum & indeks eksplisit.

**Type/name consistency:** konvensi global diterapkan (uuid PK, snake_case, timestamps, CHECK enum, indeks FK/komposit/unik, `numeric(5,4)` untuk confidence, `numeric(5,2)` untuk persen/CPU, `numeric(12,2)` untuk waktu/persentase agregat). FK ke `identity.user` (uploaded_by/reviewer/created_by) dengan `ON DELETE SET NULL`; storage paths tetap `varchar` (deviasi dicatat: tidak ada FK `media.asset` karena katalog menyimpan path sebagai string).

**Cacat design yang dihindari:** tidak ada dual-schema legacy (sudah dihapus di Phase 0 via `question_import_*` dihapus? — tabel legacy `question.question_import_job` dst. TETAP DIPERTAHANKAN karena tidak dihapus oleh fase ini; tidak ada bentrok nama karena schema berbeda); append-only untuk log/result; `duplicate_detection.similar_question` dan `import_result.record_id` uuid tanpa FK (referensi lintas-domain/snapshot); enum eksplisit sesuai katalog.

## Execution Handoff

**Plan selesai & tersimpan: `docs/superpowers/plans/2026-08-05-database-rebuild-phase13-ocr.md`.**

**Opsi eksekusi:** eksekusi inline task-by-task di sesi ini (tulis SQL → commit → `go run cmd/migrate/main.go up` → verifikasi) tanpa dispatch subagent terpisah, mengingat lingkup kecil (10 file). Setiap task WAJIB commit.
