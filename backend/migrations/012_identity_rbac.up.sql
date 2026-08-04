CREATE TABLE identity.role (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    code varchar(40) NOT NULL,
    name varchar(100) NOT NULL,
    description text,
    priority int NOT NULL DEFAULT 0,
    is_system boolean NOT NULL DEFAULT false,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    deleted_at timestamptz
);
CREATE UNIQUE INDEX uq_role_code ON identity.role(code) WHERE deleted_at IS NULL;

CREATE TABLE identity.permission_module (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    code varchar(40) NOT NULL,
    name varchar(100) NOT NULL,
    icon text,
    sort_order int NOT NULL DEFAULT 0,
    created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX uq_perm_module_code ON identity.permission_module(code);

CREATE TABLE identity.permission_resource (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    module_id uuid NOT NULL REFERENCES identity.permission_module(id) ON DELETE CASCADE,
    code varchar(60) NOT NULL,
    name varchar(120) NOT NULL,
    created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX uq_perm_resource_code ON identity.permission_resource(code);

CREATE TABLE identity.permission (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    resource_id uuid NOT NULL REFERENCES identity.permission_resource(id) ON DELETE CASCADE,
    code varchar(80) NOT NULL,
    name varchar(120),
    created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX uq_permission_code ON identity.permission(code);
CREATE INDEX idx_permission_resource ON identity.permission(resource_id);

CREATE TABLE identity.role_permission (
    role_id uuid NOT NULL REFERENCES identity.role(id) ON DELETE CASCADE,
    permission_id uuid NOT NULL REFERENCES identity.permission(id) ON DELETE CASCADE,
    allow boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    PRIMARY KEY (role_id, permission_id)
);

CREATE TABLE identity.permission_scope (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    code varchar(20) NOT NULL,
    name varchar(60),
    created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX uq_perm_scope_code ON identity.permission_scope(code);

CREATE TABLE identity.user_role (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES identity.user(id) ON DELETE CASCADE,
    role_id uuid NOT NULL REFERENCES identity.role(id) ON DELETE CASCADE,
    organization_id uuid REFERENCES identity.organization(id) ON DELETE SET NULL,
    scope_id uuid REFERENCES identity.permission_scope(id) ON DELETE SET NULL,
    start_date date,
    end_date date,
    is_primary boolean NOT NULL DEFAULT false,
    created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_user_role_user ON identity.user_role(user_id);
CREATE INDEX idx_user_role_role ON identity.user_role(role_id);

CREATE TABLE identity.user_permission_override (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES identity.user(id) ON DELETE CASCADE,
    permission_id uuid NOT NULL REFERENCES identity.permission(id) ON DELETE CASCADE,
    allow boolean NOT NULL DEFAULT false,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    UNIQUE (user_id, permission_id)
);

CREATE TABLE identity.menu (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    parent_id uuid REFERENCES identity.menu(id) ON DELETE CASCADE,
    title varchar(120) NOT NULL,
    icon text,
    route text,
    sort_order int NOT NULL DEFAULT 0,
    is_visible boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    deleted_at timestamptz
);
CREATE INDEX idx_menu_parent ON identity.menu(parent_id);

CREATE TABLE identity.role_menu (
    role_id uuid NOT NULL REFERENCES identity.role(id) ON DELETE CASCADE,
    menu_id uuid NOT NULL REFERENCES identity.menu(id) ON DELETE CASCADE,
    PRIMARY KEY (role_id, menu_id)
);
