-- Migration 132: ocr result & layout analysis.

CREATE TABLE ocr.ocr_result (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    page_id uuid NOT NULL REFERENCES ocr.document_page(id) ON DELETE CASCADE,
    engine_id uuid REFERENCES ocr.ocr_engine(id) ON DELETE SET NULL,
    raw_text text,
    confidence numeric(5,4),
    processing_time_ms int,
    language varchar(10),
    rotation_detected numeric(5,2) NOT NULL DEFAULT 0,
    created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_ocr_result_page ON ocr.ocr_result(page_id);
CREATE INDEX idx_ocr_result_engine ON ocr.ocr_result(engine_id);

CREATE TABLE ocr.layout_analysis (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    page_id uuid NOT NULL REFERENCES ocr.document_page(id) ON DELETE CASCADE,
    layout_json jsonb,
    column_count int NOT NULL DEFAULT 1,
    header_detected boolean NOT NULL DEFAULT false,
    footer_detected boolean NOT NULL DEFAULT false,
    table_detected boolean NOT NULL DEFAULT false,
    image_detected boolean NOT NULL DEFAULT false,
    formula_detected boolean NOT NULL DEFAULT false,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    UNIQUE (page_id)
);