-- Migration 161: application, branding, localization & security configuration.

CREATE TABLE config.application_configuration (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    app_name varchar(200) NOT NULL DEFAULT 'Yakinlulus',
    version varchar(30),
    company_name varchar(200),
    website varchar(255),
    support_email varchar(255),
    support_phone varchar(40),
    default_language varchar(10) NOT NULL DEFAULT 'id',
    default_timezone varchar(60) NOT NULL DEFAULT 'Asia/Jakarta',
    maintenance_mode boolean NOT NULL DEFAULT false,
    maintenance_message text,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE TRIGGER trg_application_configuration_updated BEFORE UPDATE ON config.application_configuration
    FOR EACH ROW EXECUTE FUNCTION shared.set_updated_at();

CREATE TABLE config.branding_configuration (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id uuid,
    logo_asset_id uuid REFERENCES media.asset(id) ON DELETE SET NULL,
    favicon_asset_id uuid REFERENCES media.asset(id) ON DELETE SET NULL,
    primary_color varchar(20),
    secondary_color varchar(20),
    accent_color varchar(20),
    font_family varchar(120),
    login_background_asset_id uuid REFERENCES media.asset(id) ON DELETE SET NULL,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE TRIGGER trg_branding_configuration_updated BEFORE UPDATE ON config.branding_configuration
    FOR EACH ROW EXECUTE FUNCTION shared.set_updated_at();

CREATE TABLE config.localization_configuration (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    default_language varchar(10) NOT NULL DEFAULT 'id',
    default_timezone varchar(60) NOT NULL DEFAULT 'Asia/Jakarta',
    date_format varchar(30) NOT NULL DEFAULT 'd/m/Y',
    time_format varchar(30) NOT NULL DEFAULT 'H:i',
    currency varchar(10) NOT NULL DEFAULT 'IDR',
    number_format varchar(30) NOT NULL DEFAULT '1,000.00',
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE TRIGGER trg_localization_configuration_updated BEFORE UPDATE ON config.localization_configuration
    FOR EACH ROW EXECUTE FUNCTION shared.set_updated_at();

CREATE TABLE config.security_configuration (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    password_min_length int NOT NULL DEFAULT 8,
    password_expired_day int NOT NULL DEFAULT 0,
    password_history int NOT NULL DEFAULT 5,
    max_failed_login int NOT NULL DEFAULT 5,
    lock_duration int NOT NULL DEFAULT 15,
    otp_expired_second int NOT NULL DEFAULT 300,
    jwt_expired_minute int NOT NULL DEFAULT 60,
    refresh_token_day int NOT NULL DEFAULT 30,
    allow_multiple_session boolean NOT NULL DEFAULT false,
    require_mfa boolean NOT NULL DEFAULT false,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE TRIGGER trg_security_configuration_updated BEFORE UPDATE ON config.security_configuration
    FOR EACH ROW EXECUTE FUNCTION shared.set_updated_at();