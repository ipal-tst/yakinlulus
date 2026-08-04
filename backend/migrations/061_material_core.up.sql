-- Migration 061: material core - type/status lookup, material master, version, metadata.

CREATE TABLE content.material_type (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    code varchar(30) NOT NULL,
    name varchar(100) NOT NULL,
    description text,
    created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX uq_material_type_code ON content.material_type(code);

CREATE TABLE content.material_status (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    code varchar(30) NOT NULL,
    name varchar(100) NOT NULL,
    description text,
    created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX uq_material_status_code ON content.material_status(code);

CREATE TABLE content.material (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    material_code varchar(50) NOT NULL,
    title varchar(200) NOT NULL,
    slug varchar(200) NOT NULL,
    summary text,
    material_type_id uuid REFERENCES content.material_type(id) ON DELETE SET NULL,
    current_version_id uuid,
    status_id uuid REFERENCES content.material_status(id) ON DELETE SET NULL,
    owner_id uuid REFERENCES identity.user(id) ON DELETE SET NULL,
    created_by uuid REFERENCES identity.user(id) ON DELETE SET NULL,
    updated_by uuid REFERENCES identity.user(id) ON DELETE SET NULL,
    published_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW(),
    deleted_at timestamptz
);
CREATE UNIQUE INDEX uq_material_code ON content.material(material_code) WHERE deleted_at IS NULL;
CREATE UNIQUE INDEX uq_material_slug ON content.material(slug) WHERE deleted_at IS NULL;
CREATE INDEX idx_material_type ON content.material(material_type_id);
CREATE INDEX idx_material_status ON content.material(status_id);
CREATE INDEX idx_material_owner ON content.material(owner_id);
CREATE INDEX idx_material_published ON content.material(published_at);
CREATE TRIGGER trg_material_updated BEFORE UPDATE ON content.material
    FOR EACH ROW EXECUTE FUNCTION shared.set_updated_at();

CREATE TABLE content.material_version (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    material_id uuid NOT NULL REFERENCES content.material(id) ON DELETE CASCADE,
    version_no int NOT NULL DEFAULT 1,
    change_summary text,
    created_by uuid REFERENCES identity.user(id) ON DELETE SET NULL,
    is_current boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    UNIQUE (material_id, version_no)
);
CREATE INDEX idx_material_version_material ON content.material_version(material_id);
CREATE INDEX idx_material_version_current ON content.material_version(material_id) WHERE is_current;

CREATE TABLE content.material_metadata (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    material_id uuid NOT NULL REFERENCES content.material(id) ON DELETE CASCADE,
    estimated_minutes int,
    reading_level varchar(30),
    difficulty_level varchar(20) CHECK (difficulty_level IN ('EASY','MEDIUM','HARD','VERY_HARD')),
    language varchar(16) DEFAULT 'id',
    is_premium boolean NOT NULL DEFAULT false,
    certificate_enabled boolean NOT NULL DEFAULT false,
    downloadable boolean NOT NULL DEFAULT true,
    printable boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    UNIQUE (material_id)
);

-- Circular FK: material.current_version_id -> material_version (resolved after both tables exist).
ALTER TABLE content.material ADD CONSTRAINT fk_material_current_version
    FOREIGN KEY (current_version_id) REFERENCES content.material_version(id);

-- Deferred FK from Phase 4: question.question_learning_material.material_id -> content.material.
ALTER TABLE question.question_learning_material ADD CONSTRAINT fk_question_material
    FOREIGN KEY (material_id) REFERENCES content.material(id);
