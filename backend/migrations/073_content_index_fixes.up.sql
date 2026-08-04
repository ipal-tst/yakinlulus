-- Migration 073: index remaining FK columns in content schema.

CREATE INDEX idx_material_current_version ON content.material(current_version_id);
CREATE INDEX idx_material_created_by ON content.material(created_by);
CREATE INDEX idx_material_updated_by ON content.material(updated_by);
CREATE INDEX idx_material_version_created_by ON content.material_version(created_by);
CREATE INDEX idx_material_history_changed_by ON content.material_history(changed_by);
CREATE INDEX idx_material_thumbnail_asset ON content.material_thumbnail(asset_id);
CREATE INDEX idx_material_approval_approved_by ON content.material_approval(approved_by);
CREATE INDEX idx_material_bookmark_block ON content.material_bookmark(block_id);
CREATE INDEX idx_material_note_material ON content.material_note(material_id);
CREATE INDEX idx_material_note_block ON content.material_note(block_id);
CREATE INDEX idx_student_certificate_asset ON content.student_certificate(asset_id);
CREATE INDEX idx_practice_set_created_by ON content.practice_set(created_by);
