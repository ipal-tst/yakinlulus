-- Migration 126: ai knowledge base, document, document processing.

CREATE TABLE ai.ai_knowledge_base (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name varchar(200) NOT NULL,
    description text,
    kb_type varchar(20) NOT NULL CHECK (kb_type IN ('DOCUMENT','WEB','MANUAL','ACADEMIC','MF_FEATURE')),
    material_id uuid REFERENCES content.material(id) ON DELETE SET NULL,
    subject_id uuid REFERENCES academic.subject(id) ON DELETE SET NULL,
    is_active boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_ai_knowledge_base_active ON ai.ai_knowledge_base(is_active);
CREATE INDEX idx_ai_knowledge_base_material ON ai.ai_knowledge_base(material_id);
CREATE TRIGGER trg_ai_knowledge_base_updated BEFORE UPDATE ON ai.ai_knowledge_base
    FOR EACH ROW EXECUTE FUNCTION shared.set_updated_at();

CREATE TABLE ai.ai_document (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    knowledge_base_id uuid NOT NULL REFERENCES ai.ai_knowledge_base(id) ON DELETE CASCADE,
    title varchar(300) NOT NULL,
    source_type varchar(20) NOT NULL CHECK (source_type IN ('PDF','DOCX','PPTX','IMAGE','TEXT','HTML','MARKDOWN','AUDIO','VIDEO','Q&A')),
    storage_path text,
    media_asset_id uuid REFERENCES media.asset(id) ON DELETE SET NULL,
    checksum varchar(64),
    status varchar(20) NOT NULL DEFAULT 'QUEUED' CHECK (status IN ('QUEUED','PROCESSING','INDEXED','PARTIAL','FAILED','PURGED')),
    meta jsonb,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_ai_document_kb ON ai.ai_document(knowledge_base_id);
CREATE INDEX idx_ai_document_status ON ai.ai_document(status);
CREATE INDEX idx_ai_document_asset ON ai.ai_document(media_asset_id);
CREATE TRIGGER trg_ai_document_updated BEFORE UPDATE ON ai.ai_document
    FOR EACH ROW EXECUTE FUNCTION shared.set_updated_at();

CREATE TABLE ai.ai_document_processing (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id uuid NOT NULL REFERENCES ai.ai_document(id) ON DELETE CASCADE,
    stage varchar(30) NOT NULL CHECK (stage IN ('EXTRACT','CHUNK','EMBED','INDEX')),
    status varchar(20) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING','RUNNING','SUCCESS','FAILED')),
    model_id uuid REFERENCES ai.ai_model(id) ON DELETE SET NULL,
    error_message text,
    duration_ms int,
    started_at timestamptz,
    finished_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_ai_doc_processing_doc ON ai.ai_document_processing(document_id, stage);