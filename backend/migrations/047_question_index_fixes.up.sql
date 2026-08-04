-- Migration 047: index remaining question FK columns.

CREATE INDEX idx_question_current_version ON question.question(current_version_id);
CREATE INDEX idx_question_history_changed_by ON question.question_history(changed_by);
CREATE INDEX idx_question_import_job_file ON question.question_import_job(file_id);
CREATE INDEX idx_option_block_asset ON question.option_block(asset_id);
CREATE INDEX idx_explanation_block_asset ON question.explanation_block(asset_id);
CREATE INDEX idx_solution_step_asset ON question.solution_step(asset_id);
