-- Migration 179: merge/consent/privacy/retention/anonymization/archive logs, partition & retention (append-only).

CREATE TABLE audit.merge_history (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    entity varchar(120),
    entity_id uuid,
    source_ids uuid[],
    target_id uuid,
    merged_by uuid REFERENCES identity.user(id) ON DELETE SET NULL,
    created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_merge_history_entity ON audit.merge_history(entity);

CREATE TABLE audit.consent_log (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES identity.user(id) ON DELETE SET NULL,
    consent_type varchar(60),
    granted boolean NOT NULL DEFAULT true,
    granted_at timestamptz NOT NULL DEFAULT NOW(),
    created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_consent_log_user ON audit.consent_log(user_id);

CREATE TABLE audit.privacy_log (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES identity.user(id) ON DELETE SET NULL,
    event varchar(120),
    description text,
    created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_privacy_log_user ON audit.privacy_log(user_id);

CREATE TABLE audit.retention_log (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    dataset varchar(120),
    retention_days int,
    deleted_count int,
    executed_at timestamptz NOT NULL DEFAULT NOW(),
    created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_retention_log_dataset ON audit.retention_log(dataset);

CREATE TABLE audit.anonymization_log (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES identity.user(id) ON DELETE SET NULL,
    fields text[],
    anonymized_by uuid REFERENCES identity.user(id) ON DELETE SET NULL,
    created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_anonymization_log_user ON audit.anonymization_log(user_id);

CREATE TABLE audit.archive_log (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    source_table varchar(120),
    period varchar(20),
    record_count int,
    archived_at timestamptz NOT NULL DEFAULT NOW(),
    created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_archive_log_source ON audit.archive_log(source_table);

CREATE TABLE audit.log_partition (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    table_name varchar(120),
    partition_name varchar(120),
    start_date date,
    end_date date,
    created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX uq_log_partition_name ON audit.log_partition(partition_name);

CREATE TABLE audit.log_retention (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    log_type varchar(120),
    retention_days int,
    archive_after_days int,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    UNIQUE (log_type)
);