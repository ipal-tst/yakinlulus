-- Migration 139: processing queue & worker, import statistics & configuration.

CREATE TABLE ocr.processing_queue (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id uuid NOT NULL REFERENCES ocr.import_job(id) ON DELETE CASCADE,
    worker_name varchar(100),
    priority int NOT NULL DEFAULT 0,
    status varchar(20) NOT NULL DEFAULT 'WAITING' CHECK (status IN ('WAITING','RUNNING','FAILED','SUCCESS')),
    retry_count int NOT NULL DEFAULT 0,
    scheduled_at timestamptz,
    started_at timestamptz,
    finished_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_processing_queue_job ON ocr.processing_queue(job_id);
CREATE INDEX idx_processing_queue_status ON ocr.processing_queue(status);

CREATE TABLE ocr.processing_worker (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    worker_name varchar(100) NOT NULL,
    hostname varchar(120),
    cpu numeric(5,2),
    memory bigint,
    current_job uuid,
    status varchar(20) NOT NULL DEFAULT 'HEALTHY' CHECK (status IN ('HEALTHY','BUSY','DOWN')),
    last_heartbeat timestamptz,
    created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX uq_processing_worker_name ON ocr.processing_worker(worker_name);

CREATE TABLE ocr.import_statistics (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    date date NOT NULL,
    total_job int NOT NULL DEFAULT 0,
    total_file int NOT NULL DEFAULT 0,
    total_question int NOT NULL DEFAULT 0,
    total_page int NOT NULL DEFAULT 0,
    success_rate numeric(5,2),
    avg_processing_time int,
    avg_ocr_confidence numeric(5,4),
    avg_ai_confidence numeric(5,4),
    created_at timestamptz NOT NULL DEFAULT NOW(),
    UNIQUE (date)
);

CREATE TABLE ocr.import_configuration (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    key varchar(120) NOT NULL,
    value text,
    description text,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW(),
    UNIQUE (key)
);
CREATE TRIGGER trg_import_configuration_updated BEFORE UPDATE ON ocr.import_configuration
    FOR EACH ROW EXECUTE FUNCTION shared.set_updated_at();