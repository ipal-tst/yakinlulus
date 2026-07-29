-- Migration 021: Rollback academic normalize
-- Tables created: grades, curriculums, topics, learning_outcomes, question_stimuli
-- Columns added: subjects(grade_id, curriculum_id), chapters(grade_id), questions(topic_id, subtopic_id, stimulus_id, score, negative_score, estimated_time, thinking_level, difficulty_params, distractor_patterns, cognitive_skills, prerequisites, ai_metadata)

-- ========== DROP QUESTIONS AI COLUMNS ==========
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='questions' AND column_name='ai_metadata') THEN
        ALTER TABLE questions
            DROP COLUMN ai_metadata,
            DROP COLUMN prerequisites,
            DROP COLUMN cognitive_skills,
            DROP COLUMN distractor_patterns,
            DROP COLUMN difficulty_params,
            DROP COLUMN thinking_level,
            DROP COLUMN estimated_time,
            DROP COLUMN negative_score,
            DROP COLUMN score,
            DROP COLUMN stimulus_id,
            DROP COLUMN subtopic_id,
            DROP COLUMN topic_id;
    END IF;
END $$;

-- ========== DROP CHAPTERS GRADE FK ==========
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='chapters' AND column_name='grade_id') THEN
        ALTER TABLE chapters DROP COLUMN IF EXISTS grade_id;
    END IF;
END $$;

-- ========== DROP SUBJECTS GRADE + CURRICULUM FK ==========
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='subjects' AND column_name='grade_id') THEN
        ALTER TABLE subjects DROP COLUMN IF EXISTS grade_id;
        ALTER TABLE subjects DROP COLUMN IF EXISTS curriculum_id;
    END IF;
END $$;

-- ========== DROP NEW TABLES ==========
DROP TABLE IF EXISTS learning_outcomes CASCADE;
DROP TABLE IF EXISTS topics CASCADE;
DROP TABLE IF EXISTS question_stimuli CASCADE;
DROP TABLE IF EXISTS curriculums CASCADE;

-- grades has FK from subjects, drop after subjects column removed
DROP TABLE IF EXISTS grades CASCADE;
