-- Migration 131: document page & ocr engine.

CREATE TABLE ocr.document_page (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    file_id uuid NOT NULL REFERENCES ocr.import_file(id) ON DELETE CASCADE,
    page_number int NOT NULL DEFAULT 1,
    image_path text,
    thumbnail_path text,
    width int,
    height int,
    dpi int,
    rotation numeric(5,2) NOT NULL DEFAULT 0,
    language varchar(10) DEFAULT 'id',
    ocr_status varchar(20) NOT NULL DEFAULT 'PENDING' CHECK (ocr_status IN ('PENDING','OCR_PROCESSING','OCR_DONE','OCR_FAILED')),
    created_at timestamptz NOT NULL DEFAULT NOW(),
    UNIQUE (file_id, page_number)
);
CREATE INDEX idx_document_page_file ON ocr.document_page(file_id, page_number);

CREATE TABLE ocr.ocr_engine (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    engine_name varchar(100) NOT NULL,
    provider varchar(30) NOT NULL CHECK (provider IN ('TESSERACT','GOOGLE_VISION','AZURE_VISION','AWS_TEXTRACT','OPENAI','GEMINI')),
    version varchar(30),
    supports_table boolean NOT NULL DEFAULT false,
    supports_formula boolean NOT NULL DEFAULT false,
    supports_handwriting boolean NOT NULL DEFAULT false,
    supports_layout boolean NOT NULL DEFAULT false,
    supports_multilanguage boolean NOT NULL DEFAULT false,
    status varchar(20) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE','INACTIVE','DEPRECATED')),
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW(),
    UNIQUE (engine_name, provider)
);
CREATE INDEX idx_ocr_engine_status ON ocr.ocr_engine(status);
CREATE TRIGGER trg_ocr_engine_updated BEFORE UPDATE ON ocr.ocr_engine
    FOR EACH ROW EXECUTE FUNCTION shared.set_updated_at();
