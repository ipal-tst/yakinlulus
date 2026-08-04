-- Migration 068: learning progress - progress, session, bookmark, note, highlight.

CREATE TABLE content.learning_progress (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id uuid NOT NULL REFERENCES identity.user(id) ON DELETE CASCADE,
    material_id uuid NOT NULL REFERENCES content.material(id) ON DELETE CASCADE,
    progress_percent numeric(5,2) NOT NULL DEFAULT 0,
    last_position int,
    completed boolean NOT NULL DEFAULT false,
    completed_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW(),
    UNIQUE (student_id, material_id)
);
CREATE INDEX idx_learning_progress_student ON content.learning_progress(student_id);
CREATE INDEX idx_learning_progress_material ON content.learning_progress(material_id);
CREATE TRIGGER trg_learning_progress_updated BEFORE UPDATE ON content.learning_progress
    FOR EACH ROW EXECUTE FUNCTION shared.set_updated_at();

CREATE TABLE content.material_session (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id uuid NOT NULL REFERENCES identity.user(id) ON DELETE CASCADE,
    material_id uuid NOT NULL REFERENCES content.material(id) ON DELETE CASCADE,
    started_at timestamptz NOT NULL DEFAULT NOW(),
    ended_at timestamptz,
    duration_second int NOT NULL DEFAULT 0,
    created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_material_session_student ON content.material_session(student_id);
CREATE INDEX idx_material_session_material ON content.material_session(material_id);

CREATE TABLE content.material_bookmark (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id uuid NOT NULL REFERENCES identity.user(id) ON DELETE CASCADE,
    material_id uuid NOT NULL REFERENCES content.material(id) ON DELETE CASCADE,
    block_id uuid REFERENCES content.material_block(id) ON DELETE SET NULL,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    UNIQUE (student_id, material_id)
);

CREATE TABLE content.material_note (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id uuid NOT NULL REFERENCES identity.user(id) ON DELETE CASCADE,
    material_id uuid NOT NULL REFERENCES content.material(id) ON DELETE CASCADE,
    block_id uuid REFERENCES content.material_block(id) ON DELETE SET NULL,
    note text,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_material_note_student ON content.material_note(student_id);
CREATE TRIGGER trg_material_note_updated BEFORE UPDATE ON content.material_note
    FOR EACH ROW EXECUTE FUNCTION shared.set_updated_at();

CREATE TABLE content.material_highlight (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id uuid NOT NULL REFERENCES identity.user(id) ON DELETE CASCADE,
    block_id uuid NOT NULL REFERENCES content.material_block(id) ON DELETE CASCADE,
    start_offset int NOT NULL DEFAULT 0,
    end_offset int NOT NULL DEFAULT 0,
    color varchar(20),
    created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_material_highlight_student ON content.material_highlight(student_id);
CREATE INDEX idx_material_highlight_block ON content.material_highlight(block_id);
