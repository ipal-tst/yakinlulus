CREATE TABLE identity.user (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    username varchar(100) NOT NULL,
    email varchar(255),
    phone varchar(30),
    password_hash text NOT NULL,
    status text NOT NULL DEFAULT 'PENDING' CHECK (status IN ('ACTIVE','INACTIVE','LOCKED','PENDING')),
    avatar text,
    last_login_at timestamptz,
    email_verified boolean NOT NULL DEFAULT false,
    phone_verified boolean NOT NULL DEFAULT false,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW(),
    deleted_at timestamptz
);
CREATE UNIQUE INDEX uq_user_username ON identity.user(username) WHERE deleted_at IS NULL;
CREATE UNIQUE INDEX uq_user_email ON identity.user(email) WHERE email IS NOT NULL AND deleted_at IS NULL;
CREATE UNIQUE INDEX uq_user_phone ON identity.user(phone) WHERE phone IS NOT NULL AND deleted_at IS NULL;
CREATE INDEX idx_user_status ON identity.user(status);
CREATE TRIGGER trg_user_updated BEFORE UPDATE ON identity.user
    FOR EACH ROW EXECUTE FUNCTION shared.set_updated_at();

CREATE TABLE identity.user_profile (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES identity.user(id) ON DELETE CASCADE,
    full_name varchar(200),
    gender varchar(20),
    birth_place varchar(200),
    birth_date date,
    religion varchar(50),
    nationality varchar(100),
    photo text,
    bio text,
    language varchar(16) DEFAULT 'id',
    timezone varchar(64) DEFAULT 'Asia/Jakarta',
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX uq_user_profile_user ON identity.user_profile(user_id);
CREATE TRIGGER trg_user_profile_updated BEFORE UPDATE ON identity.user_profile
    FOR EACH ROW EXECUTE FUNCTION shared.set_updated_at();

CREATE TABLE identity.user_address (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES identity.user(id) ON DELETE CASCADE,
    province varchar(100),
    city varchar(100),
    district varchar(100),
    village varchar(100),
    postal_code varchar(10),
    address text,
    latitude numeric(10,7),
    longitude numeric(10,7),
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_user_address_user ON identity.user_address(user_id);
CREATE TRIGGER trg_user_address_updated BEFORE UPDATE ON identity.user_address
    FOR EACH ROW EXECUTE FUNCTION shared.set_updated_at();

CREATE TABLE identity.user_identity (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES identity.user(id) ON DELETE CASCADE,
    identity_type varchar(20) NOT NULL DEFAULT 'KTP' CHECK (identity_type IN ('KTP','NISN','NIP','OTHER')),
    identity_number varchar(50) NOT NULL,
    issued_date date,
    expired_date date,
    is_verified boolean NOT NULL DEFAULT false,
    created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX uq_user_identity_num ON identity.user_identity(identity_type, identity_number);
