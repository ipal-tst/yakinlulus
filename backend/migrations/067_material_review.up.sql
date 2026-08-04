-- Migration 067: material review workflow.

CREATE TABLE content.material_review (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    material_id uuid NOT NULL REFERENCES content.material(id) ON DELETE CASCADE,
    reviewer_id uuid REFERENCES identity.user(id) ON DELETE SET NULL,
    status varchar(30) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING','APPROVED','REJECTED','REVISION')),
    comment text,
    reviewed_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_material_review_material ON content.material_review(material_id);
CREATE INDEX idx_material_review_reviewer ON content.material_review(reviewer_id);

CREATE TABLE content.material_approval (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    material_id uuid NOT NULL REFERENCES content.material(id) ON DELETE CASCADE,
    approved_by uuid REFERENCES identity.user(id) ON DELETE SET NULL,
    approved_at timestamptz NOT NULL DEFAULT NOW(),
    created_at timestamptz NOT NULL DEFAULT NOW(),
    UNIQUE (material_id)
);

CREATE TABLE content.material_validation (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    material_id uuid NOT NULL REFERENCES content.material(id) ON DELETE CASCADE,
    issue_type varchar(60) NOT NULL,
    description text,
    created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_material_validation_material ON content.material_validation(material_id);
