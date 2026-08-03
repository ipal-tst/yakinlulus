-- Migration 040: Exam packages (paket ujian) grouping multiple subject exams
CREATE TABLE exam_packages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(200) NOT NULL,
    education_level VARCHAR(10) NOT NULL CHECK (education_level IN ('SD','SMP','SMA','UNIVERSITY')),
    grade_id UUID REFERENCES grades(id),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_exam_packages_level ON exam_packages(education_level);
CREATE INDEX idx_exam_packages_active ON exam_packages(is_active);

CREATE TABLE exam_package_exams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    package_id UUID NOT NULL REFERENCES exam_packages(id) ON DELETE CASCADE,
    exam_content_id UUID NOT NULL REFERENCES contents(id) ON DELETE CASCADE,
    subject_id UUID NOT NULL REFERENCES subjects(id),
    display_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (package_id, exam_content_id)
);

CREATE INDEX idx_exam_package_exams_package ON exam_package_exams(package_id);
CREATE INDEX idx_exam_package_exams_exam ON exam_package_exams(exam_content_id);

-- Optional school name on student profile (kolom Sekolah di peringkat)
ALTER TABLE users ADD COLUMN IF NOT EXISTS school_name VARCHAR(255);
