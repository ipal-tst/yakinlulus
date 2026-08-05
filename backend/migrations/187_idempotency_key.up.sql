-- Migration 187: idempotency key, api batch job & item.

CREATE TABLE integration.idempotency_key (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    idempotency_key varchar(255) NOT NULL,
    provider_id uuid REFERENCES integration.api_provider(id) ON DELETE CASCADE,
    request_hash varchar(64),
    response_hash varchar(64),
    expires_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    UNIQUE (idempotency_key)
);
CREATE INDEX idx_idempotency_key_expired ON integration.idempotency_key(expires_at);

CREATE TABLE integration.api_batch_job (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    provider_id uuid REFERENCES integration.api_provider(id) ON DELETE CASCADE,
    job_name varchar(200) NOT NULL,
    batch_size int NOT NULL DEFAULT 100,
    status varchar(20) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING','PROCESSING','SUCCESS','FAILED','PARTIAL')),
    total_record int NOT NULL DEFAULT 0,
    processed_record int NOT NULL DEFAULT 0,
    failed_record int NOT NULL DEFAULT 0,
    started_at timestamptz,
    finished_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_api_batch_job_provider ON integration.api_batch_job(provider_id);
CREATE INDEX idx_api_batch_job_status ON integration.api_batch_job(status);

CREATE TABLE integration.api_batch_item (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    batch_job_id uuid NOT NULL REFERENCES integration.api_batch_job(id) ON DELETE CASCADE,
    reference_id varchar(120),
    payload jsonb,
    status varchar(20) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING','PROCESSING','SUCCESS','FAILED')),
    response jsonb,
    error_message text,
    created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_api_batch_item_job ON integration.api_batch_item(batch_job_id);
CREATE INDEX idx_api_batch_item_status ON integration.api_batch_item(status);