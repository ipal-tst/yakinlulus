-- Migration 021: Normalize academic hierarchy + AI generation metadata
-- Education Level → Grade → Curriculum → Subject → Chapter → Topic → Learning Outcome
-- + Question enrichment for AI datasheet

-- ========== GRADES ==========
CREATE TABLE IF NOT EXISTS grades (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    education_level_id UUID NOT NULL REFERENCES education_levels(id),
    name VARCHAR(100) NOT NULL,
    alias VARCHAR(50),
    display_order INT NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_grades_education_level_id ON grades(education_level_id);

-- Grade seed
WITH levels AS (
    SELECT id, code FROM education_levels WHERE code IN ('SD','SMP','SMA','SMK')
)
INSERT INTO grades (education_level_id, name, alias, display_order)
SELECT l.id, g.name, g.alias, g.display_order
FROM levels l
JOIN (
    VALUES ('SD', 1, 'Kelas 4', NULL),
           ('SD', 2, 'Kelas 5', NULL),
           ('SD', 3, 'Kelas 6', NULL),
           ('SMP', 1, 'Kelas 7', NULL),
           ('SMP', 2, 'Kelas 8', NULL),
           ('SMP', 3, 'Kelas 9', NULL),
           ('SMA', 1, 'Kelas 10', 'X'),
           ('SMA', 2, 'Kelas 11', 'XI'),
           ('SMA', 3, 'Kelas 12', 'XII'),
           ('SMK', 1, 'Kelas 10 SMK', NULL),
           ('SMK', 2, 'Kelas 11 SMK', NULL),
           ('SMK', 3, 'Kelas 12 SMK', NULL)
) AS g(level_code, display_order, name, alias)
    ON l.code = g.level_code
ON CONFLICT DO NOTHING;

-- ========== CURRICULUMS ==========
CREATE TABLE IF NOT EXISTS curriculums (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    code VARCHAR(20) NOT NULL UNIQUE,
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO curriculums (name, code, description) VALUES
    ('Kurikulum 2013', 'K13', 'Kurikulum 2013'),
    ('Kurikulum Merdeka', 'Merdeka', 'Kurikulum Merdeka / Prototype'),
    ('UTBK', 'UTBK', 'UTBK SNBT preparation'),
    ('Internal', 'Internal', 'Internal YakinLulus curriculum')
ON CONFLICT (code) DO NOTHING;

-- ========== SUBJECTS: add grade + curriculum FK ==========
ALTER TABLE subjects
    ADD COLUMN IF NOT EXISTS grade_id UUID REFERENCES grades(id),
    ADD COLUMN IF NOT EXISTS curriculum_id UUID REFERENCES curriculums(id);

CREATE INDEX IF NOT EXISTS idx_subjects_grade_id ON subjects(grade_id);
CREATE INDEX IF NOT EXISTS idx_subjects_curriculum_id ON subjects(curriculum_id);

-- ========== CHAPTERS: add grade FK ==========
ALTER TABLE chapters
    ADD COLUMN IF NOT EXISTS grade_id UUID REFERENCES grades(id);

CREATE INDEX IF NOT EXISTS idx_chapters_grade_id ON chapters(grade_id);

-- ========== TOPICS ==========
CREATE TABLE IF NOT EXISTS topics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chapter_id UUID NOT NULL REFERENCES chapters(id),
    title VARCHAR(255) NOT NULL,
    sequence INT NOT NULL DEFAULT 0,
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_topics_chapter_id ON topics(chapter_id);

-- ========== LEARNING OUTCOMES (SubTopics / CP/TP/ATP) ==========
CREATE TABLE IF NOT EXISTS learning_outcomes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    topic_id UUID NOT NULL REFERENCES topics(id),
    code VARCHAR(50),
    title VARCHAR(500) NOT NULL,
    sequence INT NOT NULL DEFAULT 0,
    description TEXT,
    bloom_default VARCHAR(5) CHECK (bloom_default IN ('C1','C2','C3','C4','C5','C6')),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_learning_outcomes_topic_id ON learning_outcomes(topic_id);
CREATE INDEX IF NOT EXISTS idx_learning_outcomes_code ON learning_outcomes(code);

-- ========== QUESTION STIMULI (UTBK style: 1 story → N questions) ==========
CREATE TABLE IF NOT EXISTS question_stimuli (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255),
    content_html TEXT NOT NULL,
    image_url TEXT,
    source VARCHAR(50),
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ========== QUESTIONS: add normalized FK + AI metadata ==========
-- NOTE: old `topic` VARCHAR from migration 020 is NOT dropped — kept for backward compat
ALTER TABLE questions
    ADD COLUMN IF NOT EXISTS topic_id UUID REFERENCES topics(id),
    ADD COLUMN IF NOT EXISTS subtopic_id UUID REFERENCES learning_outcomes(id),
    ADD COLUMN IF NOT EXISTS stimulus_id UUID REFERENCES question_stimuli(id),
    ADD COLUMN IF NOT EXISTS score DECIMAL(5,2) NOT NULL DEFAULT 1.00,
    ADD COLUMN IF NOT EXISTS negative_score DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    ADD COLUMN IF NOT EXISTS estimated_time INT,
    ADD COLUMN IF NOT EXISTS thinking_level VARCHAR(5) CHECK (thinking_level IN ('LOTS','MOTS','HOTS')),
    ADD COLUMN IF NOT EXISTS difficulty_params JSONB,
    ADD COLUMN IF NOT EXISTS distractor_patterns JSONB,
    ADD COLUMN IF NOT EXISTS cognitive_skills JSONB,
    ADD COLUMN IF NOT EXISTS prerequisites JSONB,
    ADD COLUMN IF NOT EXISTS ai_metadata JSONB;

CREATE INDEX IF NOT EXISTS idx_questions_topic_id ON questions(topic_id);
CREATE INDEX IF NOT EXISTS idx_questions_subtopic_id ON questions(subtopic_id);
CREATE INDEX IF NOT EXISTS idx_questions_stimulus_id ON questions(stimulus_id);
CREATE INDEX IF NOT EXISTS idx_questions_thinking_level ON questions(thinking_level);
