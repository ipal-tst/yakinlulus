Berikut **08_database_schema / 07_postgresql_ddl.sql**.

Dokumen ini adalah rancangan **Physical Database Definition Language (DDL)** untuk PostgreSQL.

Catatan:

* Ini adalah **baseline schema**.
* Beberapa tabel (`users`, `organizations`, `subjects`, `grades`, dll.) diasumsikan berasal dari core platform YakinLulus.id.
* DDL dibuat modular agar mudah dipisahkan menjadi migration files.
* Constraint, index, extension, dan schema sudah mengikuti dokumen sebelumnya.

---

```sql
-- ============================================================
-- YakinLulus.id
-- Question Bank Database DDL
--
-- PostgreSQL 16+
--
-- Module:
-- 08_database_schema
--
-- Version:
-- 1.0
-- ============================================================


-- ============================================================
-- 01. EXTENSION
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE EXTENSION IF NOT EXISTS vector;



-- ============================================================
-- 02. SCHEMA
-- ============================================================

CREATE SCHEMA IF NOT EXISTS question_bank;

CREATE SCHEMA IF NOT EXISTS ai;

CREATE SCHEMA IF NOT EXISTS audit;

CREATE SCHEMA IF NOT EXISTS analytics;



-- ============================================================
-- 03. QUESTION MASTER
-- ============================================================

CREATE TABLE question_bank.questions
(
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    question_code VARCHAR(100) NOT NULL,

    question_type VARCHAR(50) NOT NULL,

    difficulty_level VARCHAR(20) NOT NULL,

    status VARCHAR(50) NOT NULL DEFAULT 'DRAFT',


    subject_id UUID,

    grade_id UUID,

    curriculum_id UUID,


    metadata JSONB DEFAULT '{}'::jsonb,


    created_by UUID NOT NULL,

    created_at TIMESTAMPTZ
        DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMPTZ
        DEFAULT CURRENT_TIMESTAMP,

    deleted_at TIMESTAMPTZ,


    CONSTRAINT uq_question_code
        UNIQUE(question_code),


    CONSTRAINT chk_question_difficulty
        CHECK
        (
            difficulty_level IN
            (
                'EASY',
                'MEDIUM',
                'HARD'
            )
        ),


    CONSTRAINT chk_question_status
        CHECK
        (
            status IN
            (
                'DRAFT',
                'READY_FOR_REVIEW',
                'UNDER_REVIEW',
                'APPROVED',
                'PUBLISHED',
                'ARCHIVED'
            )
        )
);



-- ============================================================
-- 04. QUESTION VERSION
-- ============================================================

CREATE TABLE question_bank.question_versions
(
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),


    question_id UUID NOT NULL,


    version_number INTEGER NOT NULL,


    content TEXT NOT NULL,


    answer_key VARCHAR(10),


    explanation TEXT,


    created_by UUID NOT NULL,


    created_at TIMESTAMPTZ
        DEFAULT CURRENT_TIMESTAMP,


    CONSTRAINT fk_question_version_question

        FOREIGN KEY(question_id)

        REFERENCES question_bank.questions(id)

        ON DELETE RESTRICT,


    CONSTRAINT uq_question_version

        UNIQUE
        (
            question_id,
            version_number
        ),


    CONSTRAINT chk_version_number

        CHECK(version_number > 0)
);



-- ============================================================
-- 05. QUESTION CONTENT BLOCK
-- ============================================================

CREATE TABLE question_bank.question_contents
(
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),


    question_version_id UUID NOT NULL,


    content_type VARCHAR(50) NOT NULL,


    content_data JSONB NOT NULL,


    order_number INTEGER DEFAULT 1,


    CONSTRAINT fk_question_content_version

    FOREIGN KEY(question_version_id)

    REFERENCES question_bank.question_versions(id)

    ON DELETE CASCADE
);



-- ============================================================
-- 06. QUESTION OPTIONS
-- ============================================================

CREATE TABLE question_bank.question_options
(
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),


    question_version_id UUID NOT NULL,


    option_label VARCHAR(5) NOT NULL,


    option_text TEXT NOT NULL,


    is_correct BOOLEAN DEFAULT FALSE,


    order_number INTEGER DEFAULT 1,


    CONSTRAINT fk_question_option_version

    FOREIGN KEY(question_version_id)

    REFERENCES question_bank.question_versions(id)

    ON DELETE CASCADE,


    CONSTRAINT uq_option_label

    UNIQUE
    (
        question_version_id,
        option_label
    )
);



-- ============================================================
-- 07. EXPLANATION
-- ============================================================

CREATE TABLE question_bank.question_explanations
(
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),


    question_version_id UUID NOT NULL,


    explanation_type VARCHAR(50),


    content TEXT,


    created_at TIMESTAMPTZ
        DEFAULT CURRENT_TIMESTAMP,


    CONSTRAINT fk_explanation_version

    FOREIGN KEY(question_version_id)

    REFERENCES question_bank.question_versions(id)

    ON DELETE CASCADE
);



-- ============================================================
-- 08. TAXONOMY
-- ============================================================

CREATE TABLE question_bank.question_taxonomies
(
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),


    question_id UUID NOT NULL,


    subject_id UUID,

    grade_id UUID,

    curriculum_id UUID,

    chapter_id UUID,

    topic_id UUID,


    created_at TIMESTAMPTZ
        DEFAULT CURRENT_TIMESTAMP,


    CONSTRAINT fk_taxonomy_question

    FOREIGN KEY(question_id)

    REFERENCES question_bank.questions(id)

    ON DELETE CASCADE,


    CONSTRAINT uq_question_taxonomy

    UNIQUE
    (
        question_id,
        subject_id,
        grade_id,
        curriculum_id,
        chapter_id,
        topic_id
    )
);



-- ============================================================
-- 09. TAG
-- ============================================================

CREATE TABLE question_bank.tags
(
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    name VARCHAR(100) NOT NULL,

    category VARCHAR(50),

    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,


    CONSTRAINT uq_tag_name UNIQUE(name)
);



CREATE TABLE question_bank.question_tags
(
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    question_id UUID NOT NULL,

    tag_id UUID NOT NULL,


    FOREIGN KEY(question_id)

    REFERENCES question_bank.questions(id)

    ON DELETE CASCADE,


    FOREIGN KEY(tag_id)

    REFERENCES question_bank.tags(id)

    ON DELETE CASCADE,


    UNIQUE(question_id, tag_id)
);



-- ============================================================
-- 10. REVIEW WORKFLOW
-- ============================================================

CREATE TABLE question_bank.question_reviews
(
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),


    question_id UUID NOT NULL,


    reviewer_id UUID NOT NULL,


    status VARCHAR(50) NOT NULL,


    comment TEXT,


    started_at TIMESTAMPTZ,


    completed_at TIMESTAMPTZ,


    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,


    FOREIGN KEY(question_id)

    REFERENCES question_bank.questions(id)

    ON DELETE CASCADE
);



CREATE TABLE question_bank.question_review_comments
(
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),


    review_id UUID NOT NULL,


    user_id UUID NOT NULL,


    comment TEXT NOT NULL,


    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,


    FOREIGN KEY(review_id)

    REFERENCES question_bank.question_reviews(id)

    ON DELETE CASCADE
);



-- ============================================================
-- 11. ATTACHMENT
-- ============================================================

CREATE TABLE question_bank.question_attachments
(
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),


    question_version_id UUID NOT NULL,


    file_name VARCHAR(255),


    storage_key TEXT NOT NULL,


    mime_type VARCHAR(100),


    file_size BIGINT,


    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,


    FOREIGN KEY(question_version_id)

    REFERENCES question_bank.question_versions(id)

    ON DELETE CASCADE
);



-- ============================================================
-- 12. IMPORT EXPORT
-- ============================================================

CREATE TABLE question_bank.question_import_jobs
(
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),


    file_id UUID,


    status VARCHAR(50),


    total_rows INTEGER DEFAULT 0,


    success_rows INTEGER DEFAULT 0,


    failed_rows INTEGER DEFAULT 0,


    error_report JSONB,


    created_by UUID NOT NULL,


    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);



CREATE TABLE question_bank.question_import_errors
(
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),


    job_id UUID NOT NULL,


    row_number INTEGER,


    error_code VARCHAR(100),


    message TEXT,


    payload JSONB,


    FOREIGN KEY(job_id)

    REFERENCES question_bank.question_import_jobs(id)

    ON DELETE CASCADE
);



CREATE TABLE question_bank.question_export_jobs
(
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),


    format VARCHAR(20),


    filter_json JSONB,


    status VARCHAR(50),


    file_id UUID,


    created_by UUID NOT NULL,


    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);



-- ============================================================
-- 13. AI TABLE
-- ============================================================

CREATE TABLE ai.ai_generation_jobs
(
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),


    model VARCHAR(100),


    prompt TEXT,


    status VARCHAR(50),


    created_by UUID,


    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);



CREATE TABLE ai.ai_generation_results
(
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),


    job_id UUID NOT NULL,


    generated_content JSONB,


    validation_status VARCHAR(50),


    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);



CREATE TABLE ai.question_embeddings
(
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),


    question_id UUID NOT NULL,


    model VARCHAR(100),


    embedding VECTOR(1536),


    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,


    UNIQUE(question_id, model)
);



-- ============================================================
-- 14. AUDIT
-- ============================================================

CREATE TABLE audit.audit_logs
(
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),


    user_id UUID,


    action VARCHAR(100),


    entity_type VARCHAR(100),


    entity_id UUID,


    metadata JSONB,


    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);



CREATE TABLE audit.audit_changes
(
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),


    audit_id UUID NOT NULL,


    old_value JSONB,


    new_value JSONB,


    changed_fields JSONB,


    FOREIGN KEY(audit_id)

    REFERENCES audit.audit_logs(id)

    ON DELETE CASCADE
);



-- ============================================================
-- 15. ANALYTICS
-- ============================================================

CREATE TABLE analytics.question_usage_events
(
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),


    question_id UUID,


    event_type VARCHAR(50),


    user_id UUID,


    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);



CREATE TABLE analytics.question_metrics
(
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),


    question_id UUID UNIQUE,


    attempt_count BIGINT DEFAULT 0,


    correct_rate NUMERIC(5,2),


    quality_score NUMERIC(5,2),


    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);



-- ============================================================
-- 16. INDEX
-- ============================================================


CREATE INDEX idx_questions_status

ON question_bank.questions(status);


CREATE INDEX idx_questions_subject_grade

ON question_bank.questions
(
subject_id,
grade_id
);



CREATE INDEX idx_question_versions_question

ON question_bank.question_versions(question_id);



CREATE INDEX idx_question_review_queue

ON question_bank.question_reviews
(
reviewer_id,
status
);



CREATE INDEX idx_question_search

ON question_bank.question_versions

USING GIN
(
to_tsvector('indonesian', content)
);



CREATE INDEX idx_embedding_vector

ON ai.question_embeddings

USING hnsw
(
embedding vector_cosine_ops
);



CREATE INDEX idx_audit_entity

ON audit.audit_logs
(
entity_type,
entity_id
);
```

---

# Catatan Implementasi

DDL di atas adalah **base physical model**. Pada implementasi production, beberapa bagian perlu dipisah menjadi migration:

```
001_extensions.sql

002_schema.sql

003_question_core.sql

004_question_workflow.sql

005_ai.sql

006_audit.sql

007_analytics.sql

008_indexes.sql

009_constraints.sql
```

---

Ada satu hal yang perlu diperhatikan sebelum production:

Tabel berikut kemungkinan akan menjadi **high growth table**:

```
audit.audit_logs

analytics.question_usage_events

question_bank.question_versions
```

Pada fase scale-up perlu:

* partitioning berdasarkan waktu;
* retention policy;
* archive strategy.

---

Dokumen berikutnya:

```
08_database_schema/

00_database_overview.md
01_schema_design.md
02_table_specification.md
03_index_strategy.md
04_constraint_strategy.md
05_migration_plan.md
06_seed_data.md
07_postgresql_ddl.sql
➡ 08_erdiagram.md
```

Selanjutnya kita buat **08_erdiagram.md** sebagai penutup database schema specification.
