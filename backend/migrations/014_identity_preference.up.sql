CREATE TABLE identity.notification_preference (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES identity.user(id) ON DELETE CASCADE,
    email boolean NOT NULL DEFAULT true,
    push boolean NOT NULL DEFAULT true,
    sms boolean NOT NULL DEFAULT false,
    whatsapp boolean NOT NULL DEFAULT false,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW(),
    UNIQUE (user_id)
);
CREATE TRIGGER trg_notif_pref_updated BEFORE UPDATE ON identity.notification_preference
    FOR EACH ROW EXECUTE FUNCTION shared.set_updated_at();

CREATE TABLE identity.user_setting (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES identity.user(id) ON DELETE CASCADE,
    theme varchar(30) DEFAULT 'system',
    language varchar(16) DEFAULT 'id',
    timezone varchar(64) DEFAULT 'Asia/Jakarta',
    dashboard_layout text,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW(),
    UNIQUE (user_id)
);
CREATE TRIGGER trg_user_setting_updated BEFORE UPDATE ON identity.user_setting
    FOR EACH ROW EXECUTE FUNCTION shared.set_updated_at();

CREATE TABLE identity.user_preference (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES identity.user(id) ON DELETE CASCADE,
    favorite_subject text,
    difficulty text,
    study_target text,
    daily_target int,
    learning_style text,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW(),
    UNIQUE (user_id)
);
CREATE TRIGGER trg_user_pref_updated BEFORE UPDATE ON identity.user_preference
    FOR EACH ROW EXECUTE FUNCTION shared.set_updated_at();
