-- Migration 151: search vector & ranking.

CREATE TABLE search.search_vector (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id uuid NOT NULL REFERENCES search.search_document(id) ON DELETE CASCADE,
    embedding vector(1536),
    embedding_model varchar(30) NOT NULL DEFAULT 'OPENAI'
        CHECK (embedding_model IN ('OPENAI','BGE','E5','INSTRUCTOR','GEMINI','NOMIC')),
    dimension int NOT NULL DEFAULT 0,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    UNIQUE (document_id, embedding_model)
);
CREATE INDEX idx_search_vector_document ON search.search_vector(document_id);
CREATE INDEX idx_search_vector_embedding ON search.search_vector
    USING hnsw (embedding vector_cosine_ops);

CREATE TABLE search.search_ranking (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id uuid NOT NULL REFERENCES search.search_document(id) ON DELETE CASCADE,
    popularity_score numeric(8,4) NOT NULL DEFAULT 0,
    view_score numeric(8,4) NOT NULL DEFAULT 0,
    click_score numeric(8,4) NOT NULL DEFAULT 0,
    ai_score numeric(8,4) NOT NULL DEFAULT 0,
    manual_score numeric(8,4) NOT NULL DEFAULT 0,
    final_score numeric(8,4) NOT NULL DEFAULT 0,
    updated_at timestamptz NOT NULL DEFAULT NOW(),
    UNIQUE (document_id)
);
CREATE INDEX idx_search_ranking_score ON search.search_ranking(final_score DESC);
CREATE TRIGGER trg_search_ranking_updated BEFORE UPDATE ON search.search_ranking
    FOR EACH ROW EXECUTE FUNCTION shared.set_updated_at();