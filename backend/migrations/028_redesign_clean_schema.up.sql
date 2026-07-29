-- Migration 028: Redesign Clean Architecture for YakinLulus EdTech & CBT

-- ========== 1. SUB_CHAPTERS (Sub-Bab) ==========
CREATE TABLE IF NOT EXISTS sub_chapters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chapter_id UUID NOT NULL REFERENCES chapters(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    sequence INT NOT NULL DEFAULT 1,
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sub_chapters_chapter_id ON sub_chapters(chapter_id);

-- ========== 2. MATERIAL MEDIA (Multi-Media Materials) ==========
CREATE TABLE IF NOT EXISTS material_media (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    material_id UUID NOT NULL REFERENCES materials(id) ON DELETE CASCADE,
    media_type VARCHAR(30) NOT NULL CHECK (media_type IN ('IMAGE', 'GRAPHIC', 'VIDEO_YOUTUBE', 'VIDEO_HLS', 'DOCUMENT_PDF')),
    url TEXT NOT NULL,
    caption VARCHAR(255),
    display_order INT NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_material_media_material_id ON material_media(material_id);

-- ========== 3. MATERIAL PRACTICES (Latihan Soal per Materi) ==========
CREATE TABLE IF NOT EXISTS material_practices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    material_id UUID NOT NULL REFERENCES materials(id) ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    display_order INT NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(material_id, question_id)
);

CREATE INDEX IF NOT EXISTS idx_material_practices_material ON material_practices(material_id);

-- ========== 4. EXAM CUSTOM CONFIGS (Custom Ujian Builder) ==========
CREATE TABLE IF NOT EXISTS exam_custom_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    grade_ids UUID[] DEFAULT '{}',
    subject_ids UUID[] DEFAULT '{}',
    chapter_ids UUID[] DEFAULT '{}',
    easy_count INT NOT NULL DEFAULT 5,
    medium_count INT NOT NULL DEFAULT 10,
    hard_count INT NOT NULL DEFAULT 5,
    duration_minutes INT NOT NULL DEFAULT 30,
    shuffle_questions BOOLEAN NOT NULL DEFAULT true,
    shuffle_options BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_exam_custom_configs_user ON exam_custom_configs(user_id);

-- ========== 5. EXAM ANALYTICS (Analisis & Evaluasi Ujian) ==========
CREATE TABLE IF NOT EXISTS exam_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    attempt_id UUID NOT NULL UNIQUE REFERENCES content_exam_attempts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    total_correct INT NOT NULL DEFAULT 0,
    total_wrong INT NOT NULL DEFAULT 0,
    total_unanswered INT NOT NULL DEFAULT 0,
    easy_accuracy_pct DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    medium_accuracy_pct DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    hard_accuracy_pct DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    subject_breakdown JSONB DEFAULT '{}',
    national_rank INT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_exam_analytics_user ON exam_analytics(user_id);
CREATE INDEX IF NOT EXISTS idx_exam_analytics_rank ON exam_analytics(national_rank);
