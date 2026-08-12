-- Migration 220 (down): hapus perluasan identitas katalog sekolah.

ALTER TABLE academic.school DROP CONSTRAINT IF EXISTS academic_school_status_check;
ALTER TABLE academic.school DROP CONSTRAINT IF EXISTS academic_school_institution_type_check;
ALTER TABLE academic.school DROP CONSTRAINT IF EXISTS academic_school_education_level_check;
ALTER TABLE academic.school DROP COLUMN IF EXISTS curriculum_code;
ALTER TABLE academic.school DROP COLUMN IF EXISTS postal_code;
ALTER TABLE academic.school DROP COLUMN IF EXISTS village;
ALTER TABLE academic.school DROP COLUMN IF EXISTS yayasan_name;
ALTER TABLE academic.school DROP COLUMN IF EXISTS school_status;
ALTER TABLE academic.school DROP COLUMN IF EXISTS institution_type;
