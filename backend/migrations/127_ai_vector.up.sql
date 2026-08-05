-- Migration 127: ai embedding, rag chunk.

CREATE TABLE ai.embedding (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    model varchar(120) NOT NULL,
    dimension int NOT NULL,
    created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_ai_embedding_model ON ai.embedding(model, dimension);

CREATE TABLE ai.ai_rag_chunk (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id uuid NOT NULL REFERENCES ai.ai_document(id) ON DELETE CASCADE,
    chunk_index int NOT NULL,
    content text NOT NULL,
    embedding vector,
    embedding_id uuid REFERENCES ai.embedding(id) ON DELETE SET NULL,
    token_count int NOT NULL DEFAULT 0,
    meta jsonb,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    UNIQUE (document_id, chunk_index)
);
CREATE INDEX idx_ai_rag_chunk_document ON ai.ai_rag_chunk(document_id);