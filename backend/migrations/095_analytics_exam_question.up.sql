-- Migration 095: daily exam & question analytics (append-only).

CREATE TABLE analytics.analytics_exam (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    exam_id uuid NOT NULL,
    date date NOT NULL,
    participant int NOT NULL DEFAULT 0,
    finished int NOT NULL DEFAULT 0,
    unfinished int NOT NULL DEFAULT 0,
    average_score numeric(5,2) NOT NULL DEFAULT 0,
    highest_score numeric(5,2) NOT NULL DEFAULT 0,
    lowest_score numeric(5,2) NOT NULL DEFAULT 0,
    pass_rate numeric(5,2) NOT NULL DEFAULT 0,
    average_duration int NOT NULL DEFAULT 0,
    average_correct numeric(5,2) NOT NULL DEFAULT 0,
    average_wrong numeric(5,2) NOT NULL DEFAULT 0,
    average_blank numeric(5,2) NOT NULL DEFAULT 0,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    UNIQUE (date, exam_id)
);
CREATE INDEX idx_analytics_exam_exam ON analytics.analytics_exam(exam_id);
CREATE INDEX idx_analytics_exam_date ON analytics.analytics_exam(date);
-- exam_id: uuid TANPA FK (event-driven, per 5). Append-only, tanpa updated_at.

CREATE TABLE analytics.analytics_question (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    question_id uuid NOT NULL,
    date date NOT NULL,
    shown int NOT NULL DEFAULT 0,
    answered int NOT NULL DEFAULT 0,
    correct int NOT NULL DEFAULT 0,
    wrong int NOT NULL DEFAULT 0,
    blank int NOT NULL DEFAULT 0,
    average_duration int NOT NULL DEFAULT 0,
    difficulty_index numeric(5,2) NOT NULL DEFAULT 0,
    discrimination_index numeric(5,2) NOT NULL DEFAULT 0,
    reliability numeric(5,2) NOT NULL DEFAULT 0,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    UNIQUE (date, question_id)
);
CREATE INDEX idx_analytics_question_question ON analytics.analytics_question(question_id);
CREATE INDEX idx_analytics_question_date ON analytics.analytics_question(date);
-- question_id: uuid TANPA FK (event-driven, per 5). Append-only, tanpa updated_at.
