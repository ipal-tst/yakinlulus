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
