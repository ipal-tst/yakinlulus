-- Migration 071: material AI - summary, keyword, embedding (FK to ai deferred), recommendation.

CREATE TABLE content.material_ai_summary (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    material_id uuid NOT NULL REFERENCES content.material(id) ON DELETE CASCADE,
    summary text,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    UNIQUE (material_id)
);

CREATE TABLE content.material_ai_keyword (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    material_id uuid NOT NULL REFERENCES content.material(id) ON DELETE CASCADE,
    keyword varchar(120) NOT NULL,
    created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_material_ai_keyword_material ON content.material_ai_keyword(material_id);

CREATE TABLE content.material_embedding (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    material_id uuid NOT NULL REFERENCES content.material(id) ON DELETE CASCADE,
    embedding_id uuid,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    UNIQUE (material_id)
);
-- FK embedding_id -> ai.embedding ditambahkan di Phase 12 (ALTER TABLE ADD CONSTRAINT).

CREATE TABLE content.material_recommendation (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    material_id uuid NOT NULL REFERENCES content.material(id) ON DELETE CASCADE,
    recommended_material_id uuid NOT NULL REFERENCES content.material(id) ON DELETE CASCADE,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    UNIQUE (material_id, recommended_material_id)
);
CREATE INDEX idx_material_recommendation_ref ON content.material_recommendation(recommended_material_id);
