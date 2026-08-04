-- Migration 053: exam session, proctor, participant, participant package.

CREATE TABLE cbt.exam_session (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    exam_id uuid NOT NULL REFERENCES cbt.exam(id) ON DELETE CASCADE,
    session_name varchar(200) NOT NULL,
    capacity int,
    token varchar(64),
    location varchar(200),
    created_at timestamptz NOT NULL DEFAULT NOW(),
    UNIQUE (exam_id, session_name)
);
CREATE INDEX idx_exam_session_exam ON cbt.exam_session(exam_id);

CREATE TABLE cbt.exam_proctor (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id uuid NOT NULL REFERENCES cbt.exam_session(id) ON DELETE CASCADE,
    teacher_id uuid NOT NULL REFERENCES identity.user(id) ON DELETE CASCADE,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    UNIQUE (session_id, teacher_id)
);
CREATE INDEX idx_exam_proctor_session ON cbt.exam_proctor(session_id);
CREATE INDEX idx_exam_proctor_teacher ON cbt.exam_proctor(teacher_id);

CREATE TABLE cbt.exam_participant (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    exam_id uuid NOT NULL REFERENCES cbt.exam(id) ON DELETE CASCADE,
    student_id uuid NOT NULL REFERENCES identity.user(id) ON DELETE CASCADE,
    status text NOT NULL DEFAULT 'REGISTER' CHECK (status IN ('REGISTER','READY','STARTED','FINISHED','ABSENT')),
    created_at timestamptz NOT NULL DEFAULT NOW(),
    UNIQUE (exam_id, student_id)
);
CREATE INDEX idx_exam_participant_student ON cbt.exam_participant(student_id);
CREATE INDEX idx_exam_participant_status ON cbt.exam_participant(status);

CREATE TABLE cbt.participant_package (
    participant_id uuid NOT NULL REFERENCES cbt.exam_participant(id) ON DELETE CASCADE,
    package_id uuid NOT NULL REFERENCES cbt.exam_package(id) ON DELETE CASCADE,
    PRIMARY KEY (participant_id, package_id)
);
CREATE INDEX idx_participant_package_ref ON cbt.participant_package(package_id);
