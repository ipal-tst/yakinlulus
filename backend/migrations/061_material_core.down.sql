ALTER TABLE question.question_learning_material DROP CONSTRAINT IF EXISTS fk_question_material;
ALTER TABLE content.material DROP CONSTRAINT IF EXISTS fk_material_current_version;
DROP TABLE IF EXISTS content.material_metadata;
DROP TABLE IF EXISTS content.material_version;
DROP TABLE IF EXISTS content.material;
DROP TABLE IF EXISTS content.material_status;
DROP TABLE IF EXISTS content.material_type;
