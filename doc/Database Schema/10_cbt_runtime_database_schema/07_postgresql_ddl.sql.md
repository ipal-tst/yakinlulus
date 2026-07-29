Berikut **10_cbt_runtime_database_schema / 07_postgresql_ddl.sql**.

Dokumen ini berisi implementasi fisik PostgreSQL untuk schema **CBT Runtime**.

Desain mengikuti:

* PostgreSQL 16+
* UUID primary key
* bounded context `cbt_runtime`
* runtime high transaction
* offline synchronization
* immutable academic record

---

```sql id="cbt07ddl"
-- ============================================================
-- YakinLulus.id
-- CBT Runtime Database Schema
--
-- PostgreSQL DDL
--
-- Module:
-- 10_cbt_runtime_database_schema
--
-- Version:
-- 1.0
-- ============================================================


-- ============================================================
-- EXTENSION
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";


-- ============================================================
-- SCHEMA
-- ============================================================

CREATE SCHEMA IF NOT EXISTS cbt_runtime;



-- ============================================================
-- REFERENCE TABLE
-- ============================================================


CREATE TABLE cbt_runtime.session_statuses
(
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    code VARCHAR(50) NOT NULL,

    name VARCHAR(100) NOT NULL,


    CONSTRAINT uq_session_status_code

    UNIQUE(code)
);



CREATE TABLE cbt_runtime.question_statuses
(
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    code VARCHAR(50) NOT NULL,

    name VARCHAR(100) NOT NULL,


    CONSTRAINT uq_question_status_code

    UNIQUE(code)
);



CREATE TABLE cbt_runtime.sync_statuses
(
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    code VARCHAR(50) NOT NULL,

    name VARCHAR(100) NOT NULL,


    CONSTRAINT uq_sync_status_code

    UNIQUE(code)
);



CREATE TABLE cbt_runtime.event_types
(
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    code VARCHAR(100) NOT NULL,

    name VARCHAR(150) NOT NULL,


    CONSTRAINT uq_event_type_code

    UNIQUE(code)
);



CREATE TABLE cbt_runtime.security_event_types
(
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    code VARCHAR(100) NOT NULL,

    name VARCHAR(150) NOT NULL,


    CONSTRAINT uq_security_event_type_code

    UNIQUE(code)
);



CREATE TABLE cbt_runtime.security_severities
(
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    code VARCHAR(50) NOT NULL,

    name VARCHAR(100) NOT NULL,


    CONSTRAINT uq_security_severity_code

    UNIQUE(code)
);



-- ============================================================
-- CBT SESSION
-- ============================================================


CREATE TABLE cbt_runtime.cbt_sessions
(
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),


    exam_id UUID NOT NULL,


    user_id UUID NOT NULL,


    attempt_number INTEGER NOT NULL DEFAULT 1,


    session_token VARCHAR(255) NOT NULL,


    status VARCHAR(50) NOT NULL,


    device_id VARCHAR(255),


    client_type VARCHAR(50),


    started_at TIMESTAMPTZ,


    finished_at TIMESTAMPTZ,


    last_activity_at TIMESTAMPTZ,


    created_at TIMESTAMPTZ
        DEFAULT CURRENT_TIMESTAMP,


    updated_at TIMESTAMPTZ
        DEFAULT CURRENT_TIMESTAMP,


    CONSTRAINT uq_session_token

    UNIQUE(session_token),


    CONSTRAINT chk_attempt_number

    CHECK(attempt_number > 0),


    CONSTRAINT chk_session_time

    CHECK
    (
        finished_at IS NULL
        OR
        finished_at >= started_at
    )
);



-- ============================================================
-- SESSION QUESTION SNAPSHOT
-- ============================================================


CREATE TABLE cbt_runtime.cbt_session_questions
(
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),


    session_id UUID NOT NULL,


    question_version_id UUID NOT NULL,


    sequence_number INTEGER NOT NULL,


    option_order JSONB,


    question_status VARCHAR(50)
        DEFAULT 'NOT_VISITED',


    opened_at TIMESTAMPTZ,


    created_at TIMESTAMPTZ
        DEFAULT CURRENT_TIMESTAMP,


    CONSTRAINT uq_session_question_sequence

    UNIQUE
    (
        session_id,
        sequence_number
    ),


    CONSTRAINT chk_sequence_number

    CHECK(sequence_number > 0),


    CONSTRAINT fk_question_session

    FOREIGN KEY(session_id)

    REFERENCES cbt_runtime.cbt_sessions(id)

    ON DELETE RESTRICT
);



-- ============================================================
-- ANSWER STORAGE
-- ============================================================


CREATE TABLE cbt_runtime.cbt_answers
(
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),


    session_question_id UUID NOT NULL,


    session_id UUID NOT NULL,


    answer_value VARCHAR(20),


    answer_payload JSONB,


    sync_version INTEGER DEFAULT 1,


    is_synced BOOLEAN DEFAULT FALSE,


    answered_at TIMESTAMPTZ
        DEFAULT CURRENT_TIMESTAMP,


    updated_at TIMESTAMPTZ
        DEFAULT CURRENT_TIMESTAMP,


    CONSTRAINT uq_answer_question

    UNIQUE(session_question_id),


    CONSTRAINT chk_sync_version

    CHECK(sync_version > 0),


    CONSTRAINT fk_answer_question

    FOREIGN KEY(session_question_id)

    REFERENCES cbt_runtime.cbt_session_questions(id)

    ON DELETE RESTRICT
);



-- ============================================================
-- TIMER STATE
-- ============================================================


CREATE TABLE cbt_runtime.cbt_timer_states
(
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),


    session_id UUID NOT NULL,


    duration_seconds INTEGER NOT NULL,


    remaining_seconds INTEGER NOT NULL,


    started_at TIMESTAMPTZ,


    last_sync_at TIMESTAMPTZ,


    server_time TIMESTAMPTZ,


    updated_at TIMESTAMPTZ
        DEFAULT CURRENT_TIMESTAMP,


    CONSTRAINT uq_timer_session

    UNIQUE(session_id),


    CONSTRAINT chk_timer_duration

    CHECK(duration_seconds > 0),


    CONSTRAINT chk_timer_remaining

    CHECK(remaining_seconds >= 0),


    CONSTRAINT fk_timer_session

    FOREIGN KEY(session_id)

    REFERENCES cbt_runtime.cbt_sessions(id)

    ON DELETE RESTRICT
);



-- ============================================================
-- NAVIGATION STATE
-- ============================================================


CREATE TABLE cbt_runtime.cbt_navigation_states
(
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),


    session_id UUID NOT NULL,


    current_question_number INTEGER DEFAULT 1,


    visited_questions JSONB DEFAULT '[]',


    flagged_questions JSONB DEFAULT '[]',


    updated_at TIMESTAMPTZ
        DEFAULT CURRENT_TIMESTAMP,


    CONSTRAINT uq_navigation_session

    UNIQUE(session_id),


    CONSTRAINT chk_current_question

    CHECK(current_question_number >= 1)
);



-- ============================================================
-- OFFLINE SYNC QUEUE
-- ============================================================


CREATE TABLE cbt_runtime.cbt_sync_queue
(
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),


    session_id UUID NOT NULL,


    event_type VARCHAR(100) NOT NULL,


    payload JSONB NOT NULL,


    version INTEGER NOT NULL,


    sync_status VARCHAR(50)
        DEFAULT 'PENDING',


    created_at TIMESTAMPTZ
        DEFAULT CURRENT_TIMESTAMP,


    synced_at TIMESTAMPTZ,


    CONSTRAINT chk_sync_version_number

    CHECK(version > 0)
);



-- ============================================================
-- EVENT STORE
-- ============================================================


CREATE TABLE cbt_runtime.cbt_events
(
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),


    session_id UUID NOT NULL,


    event_type VARCHAR(100) NOT NULL,


    entity_id UUID,


    payload JSONB,


    created_at TIMESTAMPTZ
        DEFAULT CURRENT_TIMESTAMP
);



-- ============================================================
-- SECURITY LOG
-- ============================================================


CREATE TABLE cbt_runtime.cbt_security_logs
(
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),


    session_id UUID NOT NULL,


    event_type VARCHAR(100) NOT NULL,


    severity VARCHAR(50) NOT NULL,


    metadata JSONB,


    created_at TIMESTAMPTZ
        DEFAULT CURRENT_TIMESTAMP
);



-- ============================================================
-- DEVICE TRACKING
-- ============================================================


CREATE TABLE cbt_runtime.cbt_session_devices
(
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),


    session_id UUID NOT NULL,


    device_fingerprint VARCHAR(255) NOT NULL,


    browser_info JSONB,


    ip_address INET,


    created_at TIMESTAMPTZ
        DEFAULT CURRENT_TIMESTAMP,


    CONSTRAINT uq_session_device

    UNIQUE
    (
        session_id,
        device_fingerprint
    )
);



-- ============================================================
-- PROGRESS STATE
-- ============================================================


CREATE TABLE cbt_runtime.cbt_progress_states
(
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),


    session_id UUID NOT NULL,


    total_question INTEGER DEFAULT 0,


    answered_count INTEGER DEFAULT 0,


    unanswered_count INTEGER DEFAULT 0,


    flagged_count INTEGER DEFAULT 0,


    completion_percentage NUMERIC(5,2)
        DEFAULT 0,


    updated_at TIMESTAMPTZ
        DEFAULT CURRENT_TIMESTAMP,


    CONSTRAINT uq_progress_session

    UNIQUE(session_id)
);



-- ============================================================
-- INDEXES
-- ============================================================


CREATE INDEX idx_session_user_status

ON cbt_runtime.cbt_sessions
(
user_id,
status
);



CREATE INDEX idx_session_exam

ON cbt_runtime.cbt_sessions
(
exam_id
);



CREATE INDEX idx_question_sequence

ON cbt_runtime.cbt_session_questions
(
session_id,
sequence_number
);



CREATE INDEX idx_answer_session

ON cbt_runtime.cbt_answers
(
session_id
);



CREATE INDEX idx_sync_queue_status

ON cbt_runtime.cbt_sync_queue
(
sync_status,
created_at
);



CREATE INDEX idx_event_session_time

ON cbt_runtime.cbt_events
(
session_id,
created_at
);



CREATE INDEX idx_security_session

ON cbt_runtime.cbt_security_logs
(
session_id,
created_at
);



CREATE INDEX idx_event_payload

ON cbt_runtime.cbt_events

USING GIN(payload);



-- ============================================================
-- END CBT RUNTIME SCHEMA
-- ============================================================
```

---

## Catatan Implementasi

Beberapa keputusan penting:

### 1. Tidak ada FK lintas domain

Contoh:

```sql
exam_id UUID
user_id UUID
question_version_id UUID
```

Tidak langsung:

```sql
REFERENCES exam.exams
```

Karena:

* CBT Runtime adalah bounded context sendiri;
* memungkinkan service separation;
* menghindari coupling database.

---

### 2. Jawaban menggunakan snapshot reference

Flow:

```
Question Bank
      |
      |
question_version
      |
      |
CBT Session Snapshot
      |
      |
Student Answer
```

Jika soal diperbaiki setelah ujian:

hasil lama tetap valid.

---

### 3. Tabel high-write

Perlu perhatian khusus:

```
cbt_answers
cbt_events
cbt_sync_queue
```

Future:

* partition;
* write replica;
* event streaming.

---

Status:

```text
10_cbt_runtime_database_schema/

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

Berikutnya:

**10_cbt_runtime_database_schema / 08_erdiagram.md**.
Berikut **10_cbt_runtime_database_schema / 07_postgresql_ddl.sql**.

Dokumen ini berisi implementasi fisik PostgreSQL untuk schema **CBT Runtime**.

Desain mengikuti:

* PostgreSQL 16+
* UUID primary key
* bounded context `cbt_runtime`
* runtime high transaction
* offline synchronization
* immutable academic record

---

```sql id="cbt07ddl"
-- ============================================================
-- YakinLulus.id
-- CBT Runtime Database Schema
--
-- PostgreSQL DDL
--
-- Module:
-- 10_cbt_runtime_database_schema
--
-- Version:
-- 1.0
-- ============================================================


-- ============================================================
-- EXTENSION
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";


-- ============================================================
-- SCHEMA
-- ============================================================

CREATE SCHEMA IF NOT EXISTS cbt_runtime;



-- ============================================================
-- REFERENCE TABLE
-- ============================================================


CREATE TABLE cbt_runtime.session_statuses
(
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    code VARCHAR(50) NOT NULL,

    name VARCHAR(100) NOT NULL,


    CONSTRAINT uq_session_status_code

    UNIQUE(code)
);



CREATE TABLE cbt_runtime.question_statuses
(
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    code VARCHAR(50) NOT NULL,

    name VARCHAR(100) NOT NULL,


    CONSTRAINT uq_question_status_code

    UNIQUE(code)
);



CREATE TABLE cbt_runtime.sync_statuses
(
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    code VARCHAR(50) NOT NULL,

    name VARCHAR(100) NOT NULL,


    CONSTRAINT uq_sync_status_code

    UNIQUE(code)
);



CREATE TABLE cbt_runtime.event_types
(
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    code VARCHAR(100) NOT NULL,

    name VARCHAR(150) NOT NULL,


    CONSTRAINT uq_event_type_code

    UNIQUE(code)
);



CREATE TABLE cbt_runtime.security_event_types
(
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    code VARCHAR(100) NOT NULL,

    name VARCHAR(150) NOT NULL,


    CONSTRAINT uq_security_event_type_code

    UNIQUE(code)
);



CREATE TABLE cbt_runtime.security_severities
(
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    code VARCHAR(50) NOT NULL,

    name VARCHAR(100) NOT NULL,


    CONSTRAINT uq_security_severity_code

    UNIQUE(code)
);



-- ============================================================
-- CBT SESSION
-- ============================================================


CREATE TABLE cbt_runtime.cbt_sessions
(
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),


    exam_id UUID NOT NULL,


    user_id UUID NOT NULL,


    attempt_number INTEGER NOT NULL DEFAULT 1,


    session_token VARCHAR(255) NOT NULL,


    status VARCHAR(50) NOT NULL,


    device_id VARCHAR(255),


    client_type VARCHAR(50),


    started_at TIMESTAMPTZ,


    finished_at TIMESTAMPTZ,


    last_activity_at TIMESTAMPTZ,


    created_at TIMESTAMPTZ
        DEFAULT CURRENT_TIMESTAMP,


    updated_at TIMESTAMPTZ
        DEFAULT CURRENT_TIMESTAMP,


    CONSTRAINT uq_session_token

    UNIQUE(session_token),


    CONSTRAINT chk_attempt_number

    CHECK(attempt_number > 0),


    CONSTRAINT chk_session_time

    CHECK
    (
        finished_at IS NULL
        OR
        finished_at >= started_at
    )
);



-- ============================================================
-- SESSION QUESTION SNAPSHOT
-- ============================================================


CREATE TABLE cbt_runtime.cbt_session_questions
(
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),


    session_id UUID NOT NULL,


    question_version_id UUID NOT NULL,


    sequence_number INTEGER NOT NULL,


    option_order JSONB,


    question_status VARCHAR(50)
        DEFAULT 'NOT_VISITED',


    opened_at TIMESTAMPTZ,


    created_at TIMESTAMPTZ
        DEFAULT CURRENT_TIMESTAMP,


    CONSTRAINT uq_session_question_sequence

    UNIQUE
    (
        session_id,
        sequence_number
    ),


    CONSTRAINT chk_sequence_number

    CHECK(sequence_number > 0),


    CONSTRAINT fk_question_session

    FOREIGN KEY(session_id)

    REFERENCES cbt_runtime.cbt_sessions(id)

    ON DELETE RESTRICT
);



-- ============================================================
-- ANSWER STORAGE
-- ============================================================


CREATE TABLE cbt_runtime.cbt_answers
(
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),


    session_question_id UUID NOT NULL,


    session_id UUID NOT NULL,


    answer_value VARCHAR(20),


    answer_payload JSONB,


    sync_version INTEGER DEFAULT 1,


    is_synced BOOLEAN DEFAULT FALSE,


    answered_at TIMESTAMPTZ
        DEFAULT CURRENT_TIMESTAMP,


    updated_at TIMESTAMPTZ
        DEFAULT CURRENT_TIMESTAMP,


    CONSTRAINT uq_answer_question

    UNIQUE(session_question_id),


    CONSTRAINT chk_sync_version

    CHECK(sync_version > 0),


    CONSTRAINT fk_answer_question

    FOREIGN KEY(session_question_id)

    REFERENCES cbt_runtime.cbt_session_questions(id)

    ON DELETE RESTRICT
);



-- ============================================================
-- TIMER STATE
-- ============================================================


CREATE TABLE cbt_runtime.cbt_timer_states
(
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),


    session_id UUID NOT NULL,


    duration_seconds INTEGER NOT NULL,


    remaining_seconds INTEGER NOT NULL,


    started_at TIMESTAMPTZ,


    last_sync_at TIMESTAMPTZ,


    server_time TIMESTAMPTZ,


    updated_at TIMESTAMPTZ
        DEFAULT CURRENT_TIMESTAMP,


    CONSTRAINT uq_timer_session

    UNIQUE(session_id),


    CONSTRAINT chk_timer_duration

    CHECK(duration_seconds > 0),


    CONSTRAINT chk_timer_remaining

    CHECK(remaining_seconds >= 0),


    CONSTRAINT fk_timer_session

    FOREIGN KEY(session_id)

    REFERENCES cbt_runtime.cbt_sessions(id)

    ON DELETE RESTRICT
);



-- ============================================================
-- NAVIGATION STATE
-- ============================================================


CREATE TABLE cbt_runtime.cbt_navigation_states
(
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),


    session_id UUID NOT NULL,


    current_question_number INTEGER DEFAULT 1,


    visited_questions JSONB DEFAULT '[]',


    flagged_questions JSONB DEFAULT '[]',


    updated_at TIMESTAMPTZ
        DEFAULT CURRENT_TIMESTAMP,


    CONSTRAINT uq_navigation_session

    UNIQUE(session_id),


    CONSTRAINT chk_current_question

    CHECK(current_question_number >= 1)
);



-- ============================================================
-- OFFLINE SYNC QUEUE
-- ============================================================


CREATE TABLE cbt_runtime.cbt_sync_queue
(
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),


    session_id UUID NOT NULL,


    event_type VARCHAR(100) NOT NULL,


    payload JSONB NOT NULL,


    version INTEGER NOT NULL,


    sync_status VARCHAR(50)
        DEFAULT 'PENDING',


    created_at TIMESTAMPTZ
        DEFAULT CURRENT_TIMESTAMP,


    synced_at TIMESTAMPTZ,


    CONSTRAINT chk_sync_version_number

    CHECK(version > 0)
);



-- ============================================================
-- EVENT STORE
-- ============================================================


CREATE TABLE cbt_runtime.cbt_events
(
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),


    session_id UUID NOT NULL,


    event_type VARCHAR(100) NOT NULL,


    entity_id UUID,


    payload JSONB,


    created_at TIMESTAMPTZ
        DEFAULT CURRENT_TIMESTAMP
);



-- ============================================================
-- SECURITY LOG
-- ============================================================


CREATE TABLE cbt_runtime.cbt_security_logs
(
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),


    session_id UUID NOT NULL,


    event_type VARCHAR(100) NOT NULL,


    severity VARCHAR(50) NOT NULL,


    metadata JSONB,


    created_at TIMESTAMPTZ
        DEFAULT CURRENT_TIMESTAMP
);



-- ============================================================
-- DEVICE TRACKING
-- ============================================================


CREATE TABLE cbt_runtime.cbt_session_devices
(
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),


    session_id UUID NOT NULL,


    device_fingerprint VARCHAR(255) NOT NULL,


    browser_info JSONB,


    ip_address INET,


    created_at TIMESTAMPTZ
        DEFAULT CURRENT_TIMESTAMP,


    CONSTRAINT uq_session_device

    UNIQUE
    (
        session_id,
        device_fingerprint
    )
);



-- ============================================================
-- PROGRESS STATE
-- ============================================================


CREATE TABLE cbt_runtime.cbt_progress_states
(
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),


    session_id UUID NOT NULL,


    total_question INTEGER DEFAULT 0,


    answered_count INTEGER DEFAULT 0,


    unanswered_count INTEGER DEFAULT 0,


    flagged_count INTEGER DEFAULT 0,


    completion_percentage NUMERIC(5,2)
        DEFAULT 0,


    updated_at TIMESTAMPTZ
        DEFAULT CURRENT_TIMESTAMP,


    CONSTRAINT uq_progress_session

    UNIQUE(session_id)
);



-- ============================================================
-- INDEXES
-- ============================================================


CREATE INDEX idx_session_user_status

ON cbt_runtime.cbt_sessions
(
user_id,
status
);



CREATE INDEX idx_session_exam

ON cbt_runtime.cbt_sessions
(
exam_id
);



CREATE INDEX idx_question_sequence

ON cbt_runtime.cbt_session_questions
(
session_id,
sequence_number
);



CREATE INDEX idx_answer_session

ON cbt_runtime.cbt_answers
(
session_id
);



CREATE INDEX idx_sync_queue_status

ON cbt_runtime.cbt_sync_queue
(
sync_status,
created_at
);



CREATE INDEX idx_event_session_time

ON cbt_runtime.cbt_events
(
session_id,
created_at
);



CREATE INDEX idx_security_session

ON cbt_runtime.cbt_security_logs
(
session_id,
created_at
);



CREATE INDEX idx_event_payload

ON cbt_runtime.cbt_events

USING GIN(payload);



-- ============================================================
-- END CBT RUNTIME SCHEMA
-- ============================================================
```

---

## Catatan Implementasi

Beberapa keputusan penting:

### 1. Tidak ada FK lintas domain

Contoh:

```sql
exam_id UUID
user_id UUID
question_version_id UUID
```

Tidak langsung:

```sql
REFERENCES exam.exams
```

Karena:

* CBT Runtime adalah bounded context sendiri;
* memungkinkan service separation;
* menghindari coupling database.

---

### 2. Jawaban menggunakan snapshot reference

Flow:

```
Question Bank
      |
      |
question_version
      |
      |
CBT Session Snapshot
      |
      |
Student Answer
```

Jika soal diperbaiki setelah ujian:

hasil lama tetap valid.

---

### 3. Tabel high-write

Perlu perhatian khusus:

```
cbt_answers
cbt_events
cbt_sync_queue
```

Future:

* partition;
* write replica;
* event streaming.

---
