CREATE TABLE identity.organization (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    code varchar(50) NOT NULL,
    name varchar(200) NOT NULL,
    type text NOT NULL DEFAULT 'COMPANY' CHECK (type IN ('SYSTEM','SCHOOL','PARTNER','COMPANY')),
    description text,
    status text NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE','INACTIVE')),
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW(),
    deleted_at timestamptz
);
CREATE UNIQUE INDEX uq_org_code ON identity.organization(code) WHERE deleted_at IS NULL;
CREATE TRIGGER trg_org_updated BEFORE UPDATE ON identity.organization
    FOR EACH ROW EXECUTE FUNCTION shared.set_updated_at();

CREATE TABLE identity.organization_member (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id uuid NOT NULL REFERENCES identity.organization(id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES identity.user(id) ON DELETE CASCADE,
    joined_at timestamptz NOT NULL DEFAULT NOW(),
    status text NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE','INACTIVE','REMOVED')),
    created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX uq_org_member ON identity.organization_member(organization_id, user_id);
