-- Migration 060: index remaining cbt FK columns.

CREATE INDEX idx_exam_created_by ON cbt.exam(created_by);
CREATE INDEX idx_exam_question_pool_subject ON cbt.exam_question_pool(subject_id);
CREATE INDEX idx_exam_question_pool_chapter ON cbt.exam_question_pool(chapter_id);
CREATE INDEX idx_essay_answer_asset ON cbt.essay_answer(asset_id);
CREATE INDEX idx_grading_detail_q ON cbt.grading_detail(question_id);
CREATE INDEX idx_exam_history_changed_by ON cbt.exam_history(changed_by);
CREATE INDEX idx_attempt_history_changed_by ON cbt.attempt_history(changed_by);
CREATE INDEX idx_grading_history_changed_by ON cbt.grading_history(changed_by);
CREATE INDEX idx_publish_history_published_by ON cbt.publish_history(published_by);
