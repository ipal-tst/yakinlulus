-- Migration 193: tracing transaction & span.

CREATE TABLE monitoring.tracing_transaction (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    trace_id uuid NOT NULL,
    span_id uuid,
    parent_span uuid,
    service_id uuid REFERENCES monitoring.monitored_service(id) ON DELETE SET NULL,
    operation varchar(200),
    duration_ms int,
    status varchar(20) NOT NULL DEFAULT 'OK' CHECK (status IN ('OK','ERROR','TIMEOUT')),
    request_id uuid,
    created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_tracing_transaction_trace ON monitoring.tracing_transaction(trace_id);
CREATE INDEX idx_tracing_transaction_time ON monitoring.tracing_transaction(created_at);

CREATE TABLE monitoring.tracing_span (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    trace_id uuid NOT NULL,
    service_name varchar(200),
    operation varchar(200),
    start_time timestamptz NOT NULL DEFAULT NOW(),
    end_time timestamptz,
    duration_ms int,
    status varchar(20) NOT NULL DEFAULT 'OK' CHECK (status IN ('OK','ERROR','TIMEOUT')),
    created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_tracing_span_trace ON monitoring.tracing_span(trace_id);
CREATE INDEX idx_tracing_span_time ON monitoring.tracing_span(start_time);