-- Migration 166: storage, image, video, email & whatsapp configuration.

CREATE TABLE config.storage_configuration (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    provider varchar(30) NOT NULL,
    bucket varchar(120),
    region varchar(60),
    cdn varchar(255),
    max_upload_size bigint NOT NULL DEFAULT 10485760,
    allowed_extension jsonb,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW(),
    UNIQUE (provider)
);
CREATE TRIGGER trg_storage_configuration_updated BEFORE UPDATE ON config.storage_configuration
    FOR EACH ROW EXECUTE FUNCTION shared.set_updated_at();

CREATE TABLE config.image_configuration (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    allowed_format jsonb,
    max_width int NOT NULL DEFAULT 4000,
    max_height int NOT NULL DEFAULT 4000,
    max_size bigint NOT NULL DEFAULT 5242880,
    quality int NOT NULL DEFAULT 85,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE TRIGGER trg_image_configuration_updated BEFORE UPDATE ON config.image_configuration
    FOR EACH ROW EXECUTE FUNCTION shared.set_updated_at();

CREATE TABLE config.video_configuration (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    allowed_format jsonb,
    max_size bigint NOT NULL DEFAULT 104857600,
    max_duration_second int NOT NULL DEFAULT 3600,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE TRIGGER trg_video_configuration_updated BEFORE UPDATE ON config.video_configuration
    FOR EACH ROW EXECUTE FUNCTION shared.set_updated_at();

CREATE TABLE config.email_configuration (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    host varchar(255),
    port int NOT NULL DEFAULT 587,
    username varchar(255),
    password varchar(255),
    from_email varchar(255),
    encryption varchar(20) NOT NULL DEFAULT 'STARTTLS' CHECK (encryption IN ('NONE','SSL','STARTTLS')),
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE TRIGGER trg_email_configuration_updated BEFORE UPDATE ON config.email_configuration
    FOR EACH ROW EXECUTE FUNCTION shared.set_updated_at();

CREATE TABLE config.whatsapp_configuration (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    provider varchar(40),
    api_key varchar(255),
    phone_number varchar(40),
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE TRIGGER trg_whatsapp_configuration_updated BEFORE UPDATE ON config.whatsapp_configuration
    FOR EACH ROW EXECUTE FUNCTION shared.set_updated_at();