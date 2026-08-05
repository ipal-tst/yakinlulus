-- Migration 164: cbt, grading & timer configuration.

CREATE TABLE config.cbt_configuration (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    fullscreen boolean NOT NULL DEFAULT true,
    safe_browser boolean NOT NULL DEFAULT false,
    random_question boolean NOT NULL DEFAULT true,
    random_option boolean NOT NULL DEFAULT true,
    auto_submit boolean NOT NULL DEFAULT true,
    allow_resume boolean NOT NULL DEFAULT true,
    offline_mode boolean NOT NULL DEFAULT false,
    heartbeat_second int NOT NULL DEFAULT 30,
    cheating_threshold int NOT NULL DEFAULT 5,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE TRIGGER trg_cbt_configuration_updated BEFORE UPDATE ON config.cbt_configuration
    FOR EACH ROW EXECUTE FUNCTION shared.set_updated_at();

CREATE TABLE config.grading_configuration (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    grading_method varchar(30) NOT NULL DEFAULT 'NUMBER' CHECK (grading_method IN ('NUMBER','LETTER','PASS_FAIL','PERCENTILE')),
    auto_grade boolean NOT NULL DEFAULT true,
    negative_marking boolean NOT NULL DEFAULT false,
    negative_score numeric(6,2) NOT NULL DEFAULT 0,
    partial_credit boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE TRIGGER trg_grading_configuration_updated BEFORE UPDATE ON config.grading_configuration
    FOR EACH ROW EXECUTE FUNCTION shared.set_updated_at();

CREATE TABLE config.timer_configuration (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    default_duration_minute int NOT NULL DEFAULT 120,
    allow_extend boolean NOT NULL DEFAULT false,
    extend_minute int NOT NULL DEFAULT 15,
    auto_submit_on_timeout boolean NOT NULL DEFAULT true,
    warning_before_minute int NOT NULL DEFAULT 5,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE TRIGGER trg_timer_configuration_updated BEFORE UPDATE ON config.timer_configuration
    FOR EACH ROW EXECUTE FUNCTION shared.set_updated_at();