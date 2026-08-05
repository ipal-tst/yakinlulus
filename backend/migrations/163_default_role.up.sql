-- Migration 163: default role, permission & academic configuration.

CREATE TABLE config.default_role (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id uuid,
    student_role varchar(60),
    teacher_role varchar(60),
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW(),
    UNIQUE (organization_id)
);
CREATE TRIGGER trg_default_role_updated BEFORE UPDATE ON config.default_role
    FOR EACH ROW EXECUTE FUNCTION shared.set_updated_at();

CREATE TABLE config.permission_configuration (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    role_id uuid NOT NULL REFERENCES identity.role(id) ON DELETE CASCADE,
    permission_code varchar(60) NOT NULL,
    enabled boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW(),
    UNIQUE (role_id, permission_code)
);
CREATE TRIGGER trg_permission_configuration_updated BEFORE UPDATE ON config.permission_configuration
    FOR EACH ROW EXECUTE FUNCTION shared.set_updated_at();

CREATE TABLE config.academic_configuration (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    active_academic_year varchar(20),
    active_semester int DEFAULT 1,
    default_curriculum varchar(60),
    grading_method varchar(30) NOT NULL DEFAULT 'NUMBER' CHECK (grading_method IN ('NUMBER','LETTER','PASS_FAIL','PERCENTILE')),
    passing_score numeric(6,2) NOT NULL DEFAULT 75,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE TRIGGER trg_academic_configuration_updated BEFORE UPDATE ON config.academic_configuration
    FOR EACH ROW EXECUTE FUNCTION shared.set_updated_at();