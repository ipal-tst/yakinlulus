-- Migration 160: configuration group, definition, value & environment.

CREATE TABLE config.configuration_group (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    code varchar(40) NOT NULL
        CHECK (code IN ('APPLICATION','SECURITY','CBT','AI','PAYMENT','EMAIL','WHATSAPP','STORAGE','SYSTEM','ACADEMIC','MEMBERSHIP','ANALYTICS')),
    name varchar(200) NOT NULL,
    description text,
    sort_order int NOT NULL DEFAULT 0,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW(),
    UNIQUE (code)
);
CREATE TRIGGER trg_configuration_group_updated BEFORE UPDATE ON config.configuration_group
    FOR EACH ROW EXECUTE FUNCTION shared.set_updated_at();

CREATE TABLE config.environment (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    code varchar(20) NOT NULL CHECK (code IN ('DEV','STAGING','UAT','PRODUCTION')),
    name varchar(120) NOT NULL,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    UNIQUE (code)
);

CREATE TABLE config.configuration_definition (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id uuid REFERENCES config.configuration_group(id) ON DELETE CASCADE,
    config_key varchar(120) NOT NULL,
    display_name varchar(200),
    description text,
    data_type varchar(20) NOT NULL DEFAULT 'STRING'
        CHECK (data_type IN ('STRING','INTEGER','BOOLEAN','FLOAT','JSON','ARRAY','DATE','TIME','DATETIME')),
    validation_rule jsonb,
    default_value jsonb,
    is_required boolean NOT NULL DEFAULT false,
    is_secret boolean NOT NULL DEFAULT false,
    restart_required boolean NOT NULL DEFAULT false,
    editable boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW(),
    UNIQUE (config_key)
);
CREATE INDEX idx_config_definition_group ON config.configuration_definition(group_id);
CREATE TRIGGER trg_configuration_definition_updated BEFORE UPDATE ON config.configuration_definition
    FOR EACH ROW EXECUTE FUNCTION shared.set_updated_at();

CREATE TABLE config.configuration_value (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    definition_id uuid NOT NULL REFERENCES config.configuration_definition(id) ON DELETE CASCADE,
    organization_id uuid,
    environment_id uuid REFERENCES config.environment(id) ON DELETE CASCADE,
    config_value jsonb,
    effective_from timestamptz NOT NULL DEFAULT NOW(),
    effective_until timestamptz,
    updated_by uuid REFERENCES identity.user(id) ON DELETE SET NULL,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    UNIQUE (definition_id, organization_id, environment_id, effective_from)
);
CREATE INDEX idx_config_value_definition ON config.configuration_value(definition_id);