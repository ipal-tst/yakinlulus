Berikut **09_exam_database_schema / 07_postgresql_ddl.sql**.

Dokumen ini berisi physical implementation PostgreSQL untuk modul **Exam Database**.

Desain mengikuti:

* Question Bank schema sebagai dependency;
* UUID primary key;
* immutable exam attempt;
* CBT runtime optimization;
* future partitioning readiness.

---

```sql id="ex07ddl"
-- ============================================================
-- YakinLulus.id
-- Exam Database Schema
--
-- PostgreSQL 16+
--
-- Module:
-- 09_exam_database_schema
--
-- Version:
-- 1.0
-- ============================================================


-- ============================================================
-- 01. EXTENSION
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";



-- ============================================================
-- 02. SCHEMA
-- ============================================================

CREATE SCHEMA IF NOT EXISTS exam;



-- ============================================================
-- 03. MASTER TABLE
-- ============================================================


CREATE TABLE exam.exam_types
(
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    code VARCHAR(50) NOT NULL,

    name VARCHAR(100) NOT NULL,


    created_at TIMESTAMPTZ
        DEFAULT CURRENT_TIMESTAMP,


    CONSTRAINT uq_exam_type_code
        UNIQUE(code)
);



CREATE TABLE exam.exam_statuses
(
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    code VARCHAR(50) NOT NULL,


    CONSTRAINT uq_exam_status_code
        UNIQUE(code)
);



CREATE TABLE exam.session_statuses
(
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    code VARCHAR(50) NOT NULL,


    CONSTRAINT uq_session_status_code
        UNIQUE(code)
);



CREATE TABLE exam.question_selection_types
(
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    code VARCHAR(50) NOT NULL,


    CONSTRAINT uq_selection_type_code
        UNIQUE(code)
);



-- ============================================================
-- 04. EXAM TEMPLATE
-- ============================================================


CREATE TABLE exam.exam_templates
(
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),


    name VARCHAR(150) NOT NULL,


    exam_type VARCHAR(50) NOT NULL,


    description TEXT,


    default_duration INTEGER,


    configuration JSONB DEFAULT '{}'::jsonb,


    created_by UUID NOT NULL,


    created_at TIMESTAMPTZ
        DEFAULT CURRENT_TIMESTAMP,


    updated_at TIMESTAMPTZ
        DEFAULT CURRENT_TIMESTAMP
);



-- ============================================================
-- 05. EXAM CORE
-- ============================================================


CREATE TABLE exam.exams
(
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),


    template_id UUID,


    title VARCHAR(255) NOT NULL,


    description TEXT,


    exam_type VARCHAR(50) NOT NULL,


    status VARCHAR(50)
        NOT NULL
        DEFAULT 'DRAFT',


    visibility VARCHAR(50)
        DEFAULT 'PRIVATE',


    created_by UUID NOT NULL,


    published_at TIMESTAMPTZ,


    created_at TIMESTAMPTZ
        DEFAULT CURRENT_TIMESTAMP,


    updated_at TIMESTAMPTZ
        DEFAULT CURRENT_TIMESTAMP,


    CONSTRAINT fk_exam_template

        FOREIGN KEY(template_id)

        REFERENCES exam.exam_templates(id)

        ON DELETE RESTRICT
);



-- ============================================================
-- 06. EXAM SETTINGS
-- ============================================================


CREATE TABLE exam.exam_settings
(
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),


    exam_id UUID NOT NULL,


    duration_minutes INTEGER NOT NULL,


    attempt_limit INTEGER DEFAULT 1,


    navigation_mode VARCHAR(50)
        DEFAULT 'FREE',


    random_question BOOLEAN
        DEFAULT FALSE,


    random_option BOOLEAN
        DEFAULT FALSE,


    show_result VARCHAR(50)
        DEFAULT 'AFTER_SUBMIT',


    configuration JSONB DEFAULT '{}'::jsonb,


    CONSTRAINT uq_exam_settings

        UNIQUE(exam_id),


    CONSTRAINT fk_exam_setting_exam

        FOREIGN KEY(exam_id)

        REFERENCES exam.exams(id)

        ON DELETE CASCADE
);



-- ============================================================
-- 07. EXAM SECTION
-- ============================================================


CREATE TABLE exam.exam_sections
(
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),


    exam_id UUID NOT NULL,


    name VARCHAR(150) NOT NULL,


    description TEXT,


    order_number INTEGER NOT NULL,


    duration_minutes INTEGER,


    CONSTRAINT fk_section_exam

        FOREIGN KEY(exam_id)

        REFERENCES exam.exams(id)

        ON DELETE CASCADE,


    CONSTRAINT uq_section_order

        UNIQUE
        (
            exam_id,
            order_number
        )
);



-- ============================================================
-- 08. EXAM SCHEDULE
-- ============================================================


CREATE TABLE exam.exam_schedules
(
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),


    exam_id UUID NOT NULL,


    start_time TIMESTAMPTZ NOT NULL,


    end_time TIMESTAMPTZ NOT NULL,


    timezone VARCHAR(50)
        DEFAULT 'Asia/Jakarta',


    status VARCHAR(50),


    CONSTRAINT fk_schedule_exam

        FOREIGN KEY(exam_id)

        REFERENCES exam.exams(id)

        ON DELETE CASCADE,


    CONSTRAINT chk_schedule_time

        CHECK(end_time > start_time)
);



-- ============================================================
-- 09. QUESTION MAPPING
-- ============================================================


CREATE TABLE exam.exam_question_sets
(
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),


    exam_id UUID NOT NULL,


    selection_type VARCHAR(50) NOT NULL,


    total_question INTEGER NOT NULL,


    rule_json JSONB,


    created_at TIMESTAMPTZ
        DEFAULT CURRENT_TIMESTAMP,


    FOREIGN KEY(exam_id)

    REFERENCES exam.exams(id)

    ON DELETE CASCADE
);



CREATE TABLE exam.exam_question_rules
(
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),


    exam_id UUID NOT NULL,


    subject_id UUID,


    grade_id UUID,


    chapter_id UUID,


    difficulty_level VARCHAR(20),


    question_count INTEGER NOT NULL,


    rule_priority INTEGER DEFAULT 1,


    FOREIGN KEY(exam_id)

    REFERENCES exam.exams(id)

    ON DELETE CASCADE
);



CREATE TABLE exam.exam_questions
(
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),


    exam_id UUID NOT NULL,


    section_id UUID,


    question_version_id UUID NOT NULL,


    question_order INTEGER NOT NULL,


    score_weight NUMERIC(10,2)
        DEFAULT 1,


    created_at TIMESTAMPTZ
        DEFAULT CURRENT_TIMESTAMP,


    FOREIGN KEY(exam_id)

    REFERENCES exam.exams(id)

    ON DELETE CASCADE,


    FOREIGN KEY(section_id)

    REFERENCES exam.exam_sections(id)

    ON DELETE SET NULL,


    CONSTRAINT uq_exam_question_order

    UNIQUE
    (
        exam_id,
        question_order
    )
);



-- ============================================================
-- 10. CBT RUNTIME
-- ============================================================


CREATE TABLE exam.exam_sessions
(
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),


    exam_id UUID NOT NULL,


    user_id UUID NOT NULL,


    attempt_number INTEGER DEFAULT 1,


    status VARCHAR(50)
        DEFAULT 'CREATED',


    started_at TIMESTAMPTZ,


    finished_at TIMESTAMPTZ,


    device_id VARCHAR(255),


    offline_token VARCHAR(255),


    last_sync_at TIMESTAMPTZ,


    created_at TIMESTAMPTZ
        DEFAULT CURRENT_TIMESTAMP,


    FOREIGN KEY(exam_id)

    REFERENCES exam.exams(id)

    ON DELETE RESTRICT,


    CONSTRAINT uq_exam_attempt

    UNIQUE
    (
        exam_id,
        user_id,
        attempt_number
    )
);



CREATE TABLE exam.session_questions
(
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),


    session_id UUID NOT NULL,


    question_version_id UUID NOT NULL,


    sequence_number INTEGER NOT NULL,


    option_order JSONB,


    visited BOOLEAN DEFAULT FALSE,


    flagged BOOLEAN DEFAULT FALSE,


    created_at TIMESTAMPTZ
        DEFAULT CURRENT_TIMESTAMP,


    FOREIGN KEY(session_id)

    REFERENCES exam.exam_sessions(id)

    ON DELETE RESTRICT,


    CONSTRAINT uq_session_question_order

    UNIQUE
    (
        session_id,
        sequence_number
    )
);



-- ============================================================
-- 11. ANSWER
-- ============================================================


CREATE TABLE exam.student_answers
(
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),


    session_question_id UUID NOT NULL,


    selected_option VARCHAR(10),


    answer_text TEXT,


    is_correct BOOLEAN,


    answer_time_ms INTEGER,


    answered_at TIMESTAMPTZ
        DEFAULT CURRENT_TIMESTAMP,


    updated_at TIMESTAMPTZ
        DEFAULT CURRENT_TIMESTAMP,


    FOREIGN KEY(session_question_id)

    REFERENCES exam.session_questions(id)

    ON DELETE RESTRICT,


    CONSTRAINT uq_student_answer

    UNIQUE(session_question_id)
);



CREATE TABLE exam.answer_events
(
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),


    session_id UUID NOT NULL,


    event_type VARCHAR(50),


    payload JSONB,


    created_at TIMESTAMPTZ
        DEFAULT CURRENT_TIMESTAMP
);



-- ============================================================
-- 12. RESULT
-- ============================================================


CREATE TABLE exam.exam_results
(
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),


    session_id UUID NOT NULL,


    user_id UUID NOT NULL,


    total_score NUMERIC(10,2),


    percentage NUMERIC(5,2),


    passed BOOLEAN,


    generated_at TIMESTAMPTZ
        DEFAULT CURRENT_TIMESTAMP,


    CONSTRAINT uq_result_session

    UNIQUE(session_id),


    FOREIGN KEY(session_id)

    REFERENCES exam.exam_sessions(id)

    ON DELETE RESTRICT
);



CREATE TABLE exam.exam_scores
(
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),


    result_id UUID NOT NULL,


    category VARCHAR(100),


    raw_score NUMERIC(10,2),


    weighted_score NUMERIC(10,2),


    normalized_score NUMERIC(10,2),


    FOREIGN KEY(result_id)

    REFERENCES exam.exam_results(id)

    ON DELETE CASCADE
);



-- ============================================================
-- 13. RANKING
-- ============================================================


CREATE TABLE exam.exam_rankings
(
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),


    exam_id UUID NOT NULL,


    result_id UUID NOT NULL,


    user_id UUID NOT NULL,


    rank_position INTEGER NOT NULL,


    score NUMERIC(10,2),


    calculated_at TIMESTAMPTZ
        DEFAULT CURRENT_TIMESTAMP,


    FOREIGN KEY(exam_id)

    REFERENCES exam.exams(id)

    ON DELETE CASCADE
);



-- ============================================================
-- 14. INDEXES
-- ============================================================


CREATE INDEX idx_exam_status

ON exam.exams(status);



CREATE INDEX idx_session_user_status

ON exam.exam_sessions
(
user_id,
status
);



CREATE INDEX idx_session_question_order

ON exam.session_questions
(
session_id,
sequence_number
);



CREATE INDEX idx_answer_session_question

ON exam.student_answers
(
session_question_id
);



CREATE INDEX idx_ranking_board

ON exam.exam_rankings
(
exam_id,
rank_position
);



-- ============================================================
-- END
-- ============================================================
```

---

# Catatan Implementasi

Beberapa FK ke Question Bank sengaja tidak dibuat langsung:

Contoh:

```sql
question_version_id UUID
```

bukan:

```sql
FOREIGN KEY REFERENCES question_bank.question_versions
```

Alasan:

* memungkinkan service boundary terpisah;
* mendukung microservice evolution;
* menghindari coupling antar domain;
* validasi dilakukan pada application layer.

---

## Status Modul

```text
09_exam_database_schema/

✅ 00_database_overview.md
✅ 01_schema_design.md
✅ 02_table_specification.md
✅ 03_index_strategy.md
✅ 04_constraint_strategy.md
✅ 05_migration_plan.md
✅ 06_seed_data.md
✅ 07_postgresql_ddl.sql
⬜ 08_erdiagram.md
```

Selanjutnya:

**09_exam_database_schema / 08_erdiagram.md** (penutup database schema Exam).
