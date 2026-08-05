ALTER TABLE content.material_embedding DROP CONSTRAINT IF EXISTS fk_material_embedding_embedding_id;
DROP TABLE IF EXISTS ai.ai_moderation_log;
DROP TABLE IF EXISTS ai.ai_generation_log;