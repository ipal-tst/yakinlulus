-- Migration 093: daily student & teacher analytics snapshot.

CREATE TABLE analytics.analytics_student (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id uuid NOT NULL,
    date date NOT NULL,
    total_login int NOT NULL DEFAULT 0,
    total_learning_time int NOT NULL DEFAULT 0,
    total_exam int NOT NULL DEFAULT 0,
    total_question int NOT NULL DEFAULT 0,
    correct_answer int NOT NULL DEFAULT 0,
    wrong_answer int NOT NULL DEFAULT 0,
    empty_answer int NOT NULL DEFAULT 0,
    average_score numeric(5,2) NOT NULL DEFAULT 0,
    highest_score numeric(5,2) NOT NULL DEFAULT 0,
    lowest_score numeric(5,2) NOT NULL DEFAULT 0,
    mastery_percentage numeric(5,2) NOT NULL DEFAULT 0,
    accuracy numeric(5,2) NOT NULL DEFAULT 0,
    speed_answer int NOT NULL DEFAULT 0,
    streak_day int NOT NULL DEFAULT 0,
    xp int NOT NULL DEFAULT 0,
    level int NOT NULL DEFAULT 1,
    ranking int,
    coins int NOT NULL DEFAULT 0,
    badge int NOT NULL DEFAULT 0,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW(),
    UNIQUE (date, student_id)
);
CREATE INDEX idx_analytics_student_student ON analytics.analytics_student(student_id);
CREATE INDEX idx_analytics_student_date ON analytics.analytics_student(date);
CREATE TRIGGER trg_analytics_student_updated BEFORE UPDATE ON analytics.analytics_student
    FOR EACH ROW EXECUTE FUNCTION shared.set_updated_at();
-- student_id: uuid TANPA FK (event-driven, per 5).

CREATE TABLE analytics.analytics_teacher (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    teacher_id uuid NOT NULL,
    date date NOT NULL,
    total_student int NOT NULL DEFAULT 0,
    active_student int NOT NULL DEFAULT 0,
    total_exam_created int NOT NULL DEFAULT 0,
    total_exam_approved int NOT NULL DEFAULT 0,
    total_question_created int NOT NULL DEFAULT 0,
    total_material_created int NOT NULL DEFAULT 0,
    average_student_score numeric(5,2) NOT NULL DEFAULT 0,
    average_completion numeric(5,2) NOT NULL DEFAULT 0,
    average_learning_time int NOT NULL DEFAULT 0,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW(),
    UNIQUE (date, teacher_id)
);
CREATE INDEX idx_analytics_teacher_teacher ON analytics.analytics_teacher(teacher_id);
CREATE INDEX idx_analytics_teacher_date ON analytics.analytics_teacher(date);
CREATE TRIGGER trg_analytics_teacher_updated BEFORE UPDATE ON analytics.analytics_teacher
    FOR EACH ROW EXECUTE FUNCTION shared.set_updated_at();
-- teacher_id: uuid TANPA FK (event-driven, per 5).
