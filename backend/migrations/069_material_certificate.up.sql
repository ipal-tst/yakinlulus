-- Migration 069: material certificate & student certificate.

CREATE TABLE content.material_certificate (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    material_id uuid NOT NULL REFERENCES content.material(id) ON DELETE CASCADE,
    certificate_template varchar(200),
    passing_score numeric(5,2),
    created_at timestamptz NOT NULL DEFAULT NOW(),
    UNIQUE (material_id)
);

CREATE TABLE content.student_certificate (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id uuid NOT NULL REFERENCES identity.user(id) ON DELETE CASCADE,
    material_id uuid NOT NULL REFERENCES content.material(id) ON DELETE CASCADE,
    asset_id uuid REFERENCES media.asset(id) ON DELETE SET NULL,
    issued_at timestamptz NOT NULL DEFAULT NOW(),
    created_at timestamptz NOT NULL DEFAULT NOW(),
    UNIQUE (student_id, material_id)
);
CREATE INDEX idx_student_certificate_student ON content.student_certificate(student_id);
CREATE INDEX idx_student_certificate_material ON content.student_certificate(material_id);
