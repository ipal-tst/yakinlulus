-- Migration 070: material statistics - statistics, rating, feedback, popularity.

CREATE TABLE content.material_statistics (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    material_id uuid NOT NULL REFERENCES content.material(id) ON DELETE CASCADE,
    view_count int NOT NULL DEFAULT 0,
    completion_count int NOT NULL DEFAULT 0,
    average_duration int NOT NULL DEFAULT 0,
    rating numeric(2,1),
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW(),
    UNIQUE (material_id)
);
CREATE TRIGGER trg_material_statistics_updated BEFORE UPDATE ON content.material_statistics
    FOR EACH ROW EXECUTE FUNCTION shared.set_updated_at();

CREATE TABLE content.material_rating (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    material_id uuid NOT NULL REFERENCES content.material(id) ON DELETE CASCADE,
    student_id uuid NOT NULL REFERENCES identity.user(id) ON DELETE CASCADE,
    rating numeric(2,1) NOT NULL,
    review text,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    UNIQUE (material_id, student_id)
);
CREATE INDEX idx_material_rating_student ON content.material_rating(student_id);

CREATE TABLE content.material_feedback (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    material_id uuid NOT NULL REFERENCES content.material(id) ON DELETE CASCADE,
    student_id uuid NOT NULL REFERENCES identity.user(id) ON DELETE CASCADE,
    feedback text,
    created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_material_feedback_material ON content.material_feedback(material_id);
CREATE INDEX idx_material_feedback_student ON content.material_feedback(student_id);

CREATE TABLE content.material_popularity (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    material_id uuid NOT NULL REFERENCES content.material(id) ON DELETE CASCADE,
    score numeric(10,2) NOT NULL DEFAULT 0,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW(),
    UNIQUE (material_id)
);
CREATE TRIGGER trg_material_popularity_updated BEFORE UPDATE ON content.material_popularity
    FOR EACH ROW EXECUTE FUNCTION shared.set_updated_at();
