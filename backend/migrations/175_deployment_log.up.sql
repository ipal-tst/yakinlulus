-- Migration 175: deployment/backup/restore/performance/slow query/cache logs (append-only).

CREATE TABLE audit.deployment_log (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    service varchar(120),
    version varchar(60),
    environment varchar(30) CHECK (environment IN ('DEV','STAGING','UAT','PRODUCTION')),
    deployed_by uuid REFERENCES identity.user(id) ON DELETE SET NULL,
    started_at timestamptz,
    finished_at timestamptz,
    status varchar(20) NOT NULL DEFAULT 'IN_PROGRESS' CHECK (status IN ('IN_PROGRESS','SUCCESS','FAILED','ROLLED_BACK')),
    created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_deployment_log_time ON audit.deployment_log(created_at);

CREATE TABLE audit.backup_log (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    backup_type varchar(30) NOT NULL DEFAULT 'FULL' CHECK (backup_type IN ('FULL','INCREMENTAL','LOG')),
    started_at timestamptz,
    finished_at timestamptz,
    size bigint,
    status varchar(20) NOT NULL DEFAULT 'IN_PROGRESS' CHECK (status IN ('IN_PROGRESS','SUCCESS','FAILED')),
    location text,
    created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_backup_log_time ON audit.backup_log(created_at);

CREATE TABLE audit.restore_log (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    backup_id uuid,
    restored_by uuid REFERENCES identity.user(id) ON DELETE SET NULL,
    started_at timestamptz,
    finished_at timestamptz,
    status varchar(20) NOT NULL DEFAULT 'IN_PROGRESS' CHECK (status IN ('IN_PROGRESS','SUCCESS','FAILED')),
    created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_restore_log_time ON audit.restore_log(created_at);

CREATE TABLE audit.performance_log (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    service varchar(120),
    cpu numeric(5,2),
    memory bigint,
    latency numeric(10,2),
    created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_performance_log_time ON audit.performance_log(created_at);
CREATE INDEX idx_performance_log_service ON audit.performance_log(service);

CREATE TABLE audit.slow_query_log (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    query text,
    duration_ms int,
    rows_scanned bigint,
    created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_slow_query_log_time ON audit.slow_query_log(created_at);
CREATE INDEX idx_slow_query_log_duration ON audit.slow_query_log(duration_ms);

CREATE TABLE audit.cache_log (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    cache_key varchar(255),
    operation varchar(20) CHECK (operation IN ('GET','SET','DELETE','HIT','MISS')),
    hit boolean NOT NULL DEFAULT false,
    latency_ms int,
    created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_cache_log_time ON audit.cache_log(created_at);