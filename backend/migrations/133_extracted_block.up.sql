-- Migration 133: extracted block, image, table, formula.

CREATE TABLE ocr.extracted_block (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    page_id uuid NOT NULL REFERENCES ocr.document_page(id) ON DELETE CASCADE,
    block_type varchar(20) NOT NULL CHECK (block_type IN ('TEXT','TABLE','IMAGE','FORMULA','HEADER','FOOTER')),
    block_order int NOT NULL DEFAULT 0,
    bounding_box jsonb,
    content text,
    confidence numeric(5,4),
    created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_extracted_block_page ON ocr.extracted_block(page_id, block_order);
CREATE INDEX idx_extracted_block_type ON ocr.extracted_block(block_type);

CREATE TABLE ocr.extracted_image (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    page_id uuid NOT NULL REFERENCES ocr.document_page(id) ON DELETE CASCADE,
    image_path text,
    width int,
    height int,
    caption text,
    hash varchar(64),
    created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_extracted_image_page ON ocr.extracted_image(page_id);

CREATE TABLE ocr.extracted_table (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    page_id uuid NOT NULL REFERENCES ocr.document_page(id) ON DELETE CASCADE,
    table_json jsonb,
    row_count int NOT NULL DEFAULT 0,
    column_count int NOT NULL DEFAULT 0,
    confidence numeric(5,4),
    created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_extracted_table_page ON ocr.extracted_table(page_id);

CREATE TABLE ocr.extracted_formula (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    page_id uuid NOT NULL REFERENCES ocr.document_page(id) ON DELETE CASCADE,
    latex text,
    mathml text,
    confidence numeric(5,4),
    created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_extracted_formula_page ON ocr.extracted_formula(page_id);