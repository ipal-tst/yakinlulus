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
