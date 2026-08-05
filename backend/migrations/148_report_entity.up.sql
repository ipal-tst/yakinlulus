-- Migration 148: per-entity reports (student, teacher, school). entity_id uuid TANPA FK (cross-domain, per 5).

CREATE TABLE report.report_student (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id uuid,
    period varchar(10) NOT NULL,
    average_score numeric(5,2),
    ranking int,
    attendance numeric(5,2),
    learning_time int NOT NULL DEFAULT 0,
    completion numeric(5,2),
    recommendation text,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    UNIQUE (student_id, period)
);
CREATE INDEX idx_report_student_student ON report.report_student(student_id);
CREATE INDEX idx_report_student_period ON report.report_student(period);

CREATE TABLE report.report_teacher (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    teacher_id uuid,
    period varchar(10) NOT NULL,
    student_count int NOT NULL DEFAULT 0,
    material_created int NOT NULL DEFAULT 0,
    exam_created int NOT NULL DEFAULT 0,
    average_score numeric(5,2),
    created_at timestamptz NOT NULL DEFAULT NOW(),
    UNIQUE (teacher_id, period)
);
CREATE INDEX idx_report_teacher_teacher ON report.report_teacher(teacher_id);
CREATE INDEX idx_report_teacher_period ON report.report_teacher(period);

CREATE TABLE report.report_school (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id uuid,
    period varchar(10) NOT NULL,
    student int NOT NULL DEFAULT 0,
    teacher int NOT NULL DEFAULT 0,
    exam int NOT NULL DEFAULT 0,
    completion numeric(5,2),
    average_score numeric(5,2),
    created_at timestamptz NOT NULL DEFAULT NOW(),
    UNIQUE (school_id, period)
);
CREATE INDEX idx_report_school_school ON report.report_school(school_id);
CREATE INDEX idx_report_school_period ON report.report_school(period);
