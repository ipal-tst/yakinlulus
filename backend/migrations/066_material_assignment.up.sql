-- Migration 066: material assignment & submissions.

CREATE TABLE content.material_assignment (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    material_id uuid NOT NULL REFERENCES content.material(id) ON DELETE CASCADE,
    title varchar(200) NOT NULL,
    instruction text,
    created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_material_assignment_material ON content.material_assignment(material_id);

CREATE TABLE content.material_assignment_submission (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    assignment_id uuid NOT NULL REFERENCES content.material_assignment(id) ON DELETE CASCADE,
    student_id uuid NOT NULL REFERENCES identity.user(id) ON DELETE CASCADE,
    asset_id uuid REFERENCES media.asset(id) ON DELETE SET NULL,
    submitted_at timestamptz NOT NULL DEFAULT NOW(),
    created_at timestamptz NOT NULL DEFAULT NOW(),
    UNIQUE (assignment_id, student_id)
);
CREATE INDEX idx_material_assignment_submission_student ON content.material_assignment_submission(student_id);
CREATE INDEX idx_material_assignment_submission_asset ON content.material_assignment_submission(asset_id);
