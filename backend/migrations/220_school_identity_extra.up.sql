-- Migration 220: perluas identitas katalog sekolah (desain 02 §2.1).
-- Kolom baru: institution_type, school_status, yayasan_name, village, postal_code, curriculum_code.
-- education_level diperluas dari (SMP,SMA,UNIVERSITY) menjadi (SD,SMP,SMA,SMK,UNIVERSITY) dan nullable
-- (institution_type='PT' boleh tanpa jenjang).

ALTER TABLE academic.school ADD COLUMN institution_type varchar(20) NOT NULL DEFAULT 'SEKOLAH';
ALTER TABLE academic.school ADD COLUMN school_status varchar(20) NOT NULL DEFAULT 'NEGERI';
ALTER TABLE academic.school ADD COLUMN yayasan_name varchar(200);
ALTER TABLE academic.school ADD COLUMN village varchar(100);
ALTER TABLE academic.school ADD COLUMN postal_code varchar(10);
ALTER TABLE academic.school ADD COLUMN curriculum_code varchar(20);

ALTER TABLE academic.school DROP CONSTRAINT IF EXISTS academic_school_education_level_check;
-- nullable agar PT (institution_type='PT') bisa tanpa jenjang; nilai lama 'SMA' tetap valid
ALTER TABLE academic.school ADD CONSTRAINT academic_school_education_level_check
  CHECK (education_level IS NULL OR education_level IN ('SD','SMP','SMA','SMK','UNIVERSITY'));

ALTER TABLE academic.school ADD CONSTRAINT academic_school_institution_type_check
  CHECK (institution_type IN ('SEKOLAH','PT'));
ALTER TABLE academic.school ADD CONSTRAINT academic_school_status_check
  CHECK (school_status IN ('NEGERI','SWASTA'));
