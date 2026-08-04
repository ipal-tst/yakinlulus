-- Migration 041: question content - metadata, blocks, options, explanation, hint, solution.

CREATE TABLE question.question_metadata (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    question_id uuid NOT NULL REFERENCES question.question(id) ON DELETE CASCADE,
    estimated_time int,
    difficulty_level varchar(20) CHECK (difficulty_level IN ('EASY','MEDIUM','HARD','VERY_HARD')),
    blooms_level varchar(20) CHECK (blooms_level IN ('REMEMBER','UNDERSTAND','APPLY','ANALYZE','EVALUATE','CREATE')),
    cognitive_level varchar(30),
    language varchar(16) DEFAULT 'id',
    source_type varchar(40),
    source_name varchar(200),
    publication_year int,
    reference_code varchar(50),
    is_hots boolean NOT NULL DEFAULT false,
    is_calculator_allowed boolean NOT NULL DEFAULT false,
    is_randomizable boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    UNIQUE (question_id)
);

CREATE TABLE question.question_block (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    question_version_id uuid NOT NULL REFERENCES question.question_version(id) ON DELETE CASCADE,
    block_order int NOT NULL DEFAULT 0,
    block_type text NOT NULL CHECK (block_type IN ('PARAGRAPH','IMAGE','TABLE','LATEX','SVG','AUDIO','VIDEO','GRAPH','CODE','HTML','MARKDOWN')),
    content text,
    asset_id uuid REFERENCES media.asset(id) ON DELETE SET NULL,
    style_json jsonb,
    created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_question_block_version ON question.question_block(question_version_id);
CREATE INDEX idx_question_block_asset ON question.question_block(asset_id);

CREATE TABLE question.question_option (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    question_version_id uuid NOT NULL REFERENCES question.question_version(id) ON DELETE CASCADE,
    label varchar(10) NOT NULL,
    score numeric(10,2) NOT NULL DEFAULT 0,
    is_correct boolean NOT NULL DEFAULT false,
    display_order int NOT NULL DEFAULT 0,
    created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_question_option_version ON question.question_option(question_version_id);

CREATE TABLE question.option_block (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    option_id uuid NOT NULL REFERENCES question.question_option(id) ON DELETE CASCADE,
    block_order int NOT NULL DEFAULT 0,
    block_type text NOT NULL CHECK (block_type IN ('PARAGRAPH','IMAGE','TABLE','LATEX','SVG','AUDIO','VIDEO','GRAPH','CODE','HTML','MARKDOWN')),
    content text,
    asset_id uuid REFERENCES media.asset(id) ON DELETE SET NULL,
    style_json jsonb,
    created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_option_block_option ON question.option_block(option_id);

CREATE TABLE question.explanation (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    question_version_id uuid NOT NULL REFERENCES question.question_version(id) ON DELETE CASCADE,
    content text,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    UNIQUE (question_version_id)
);

CREATE TABLE question.explanation_block (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    explanation_id uuid NOT NULL REFERENCES question.explanation(id) ON DELETE CASCADE,
    block_order int NOT NULL DEFAULT 0,
    block_type text NOT NULL CHECK (block_type IN ('PARAGRAPH','IMAGE','TABLE','LATEX','SVG','AUDIO','VIDEO','GRAPH','CODE','HTML','MARKDOWN')),
    content text,
    asset_id uuid REFERENCES media.asset(id) ON DELETE SET NULL,
    created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_explanation_block ON question.explanation_block(explanation_id);

CREATE TABLE question.hint (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    question_version_id uuid NOT NULL REFERENCES question.question_version(id) ON DELETE CASCADE,
    hint_order int NOT NULL DEFAULT 0,
    content text,
    created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_hint_version ON question.hint(question_version_id);

CREATE TABLE question.solution_step (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    question_version_id uuid NOT NULL REFERENCES question.question_version(id) ON DELETE CASCADE,
    step_no int NOT NULL DEFAULT 0,
    title varchar(200),
    content text,
    asset_id uuid REFERENCES media.asset(id) ON DELETE SET NULL,
    created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_solution_step_version ON question.solution_step(question_version_id);