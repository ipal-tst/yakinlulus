-- Migration 149: audit log, bookmark, comment, storage. Completes report domain (24 tables).

CREATE TABLE report.report_audit_log (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    actor uuid,
    action varchar(60) NOT NULL,
    table_name varchar(80) NOT NULL,
    record_id uuid,
    old_data jsonb,
    new_data jsonb,
    created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_report_audit_actor ON report.report_audit_log(actor);
CREATE INDEX idx_report_audit_table ON report.report_audit_log(table_name);
CREATE INDEX idx_report_audit_created ON report.report_audit_log(created_at);

CREATE TABLE report.report_bookmark (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES identity.user(id) ON DELETE CASCADE,
    definition_id uuid NOT NULL REFERENCES report.report_definition(id) ON DELETE CASCADE,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    UNIQUE (user_id, definition_id)
);
CREATE INDEX idx_report_bookmark_definition ON report.report_bookmark(definition_id);

CREATE TABLE report.report_comment (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    report_history_id uuid NOT NULL REFERENCES report.report_history(id) ON DELETE CASCADE,
    user_id uuid REFERENCES identity.user(id) ON DELETE SET NULL,
    comment text NOT NULL,
    created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_report_comment_history ON report.report_comment(report_history_id);
CREATE INDEX idx_report_comment_user ON report.report_comment(user_id);

CREATE TABLE report.report_storage (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    provider varchar(50) NOT NULL,
    bucket varchar(100) NOT NULL,
    path text NOT NULL,
    public_url text,
    checksum varchar(64),
    created_at timestamptz NOT NULL DEFAULT NOW(),
    UNIQUE (provider, bucket, path)
);
CREATE INDEX idx_report_storage_provider ON report.report_storage(provider);
