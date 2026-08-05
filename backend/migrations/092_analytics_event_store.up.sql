-- Migration 092: analytics event store & session (append-only).

CREATE TABLE analytics.analytics_events (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    event_time timestamptz NOT NULL DEFAULT NOW(),
    event_type varchar(30) NOT NULL,
    event_name varchar(120) NOT NULL,
    user_id uuid REFERENCES identity.user(id) ON DELETE SET NULL,
    student_id uuid,
    teacher_id uuid,
    school_id uuid,
    membership_id uuid,
    exam_id uuid,
    attempt_id uuid,
    question_id uuid,
    material_id uuid,
    chapter_id uuid,
    subject_id uuid,
    class_id uuid,
    device varchar(120),
    browser varchar(120),
    platform varchar(50),
    os varchar(50),
    app_version varchar(30),
    ip_address varchar(45),
    country varchar(100),
    province varchar(100),
    city varchar(100),
    latitude numeric(10,7),
    longitude numeric(10,7),
    session_id varchar(100),
    duration_second int,
    metadata jsonb,
    created_at timestamptz NOT NULL DEFAULT NOW()
);
-- Kolom student_id/teacher_id/school_id/membership_id/exam_id/attempt_id/question_id/
-- material_id/chapter_id/subject_id/class_id: uuid TANPA FK (event-driven, per 5).
CREATE INDEX idx_analytics_events_time ON analytics.analytics_events(event_time);
CREATE INDEX idx_analytics_events_type ON analytics.analytics_events(event_type);
CREATE INDEX idx_analytics_events_user ON analytics.analytics_events(user_id);
CREATE INDEX idx_analytics_events_session ON analytics.analytics_events(session_id);
CREATE INDEX idx_analytics_events_exam ON analytics.analytics_events(exam_id);
CREATE INDEX idx_analytics_events_question ON analytics.analytics_events(question_id);
CREATE INDEX idx_analytics_events_material ON analytics.analytics_events(material_id);
CREATE INDEX idx_analytics_events_subject ON analytics.analytics_events(subject_id);
CREATE INDEX idx_analytics_events_event ON analytics.analytics_events(event_type, event_time);

CREATE TABLE analytics.analytics_session (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id varchar(100) NOT NULL,
    student_id uuid,
    login_time timestamptz NOT NULL DEFAULT NOW(),
    logout_time timestamptz,
    duration int,
    device varchar(120),
    platform varchar(50),
    browser varchar(120),
    ip varchar(45),
    created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX uq_analytics_session_id ON analytics.analytics_session(session_id);
CREATE INDEX idx_analytics_session_student ON analytics.analytics_session(student_id);
CREATE INDEX idx_analytics_session_login ON analytics.analytics_session(login_time);
