-- Migration 219: education_level pada academic.school (katalog sekolah).
-- Enum identik dengan academic.target_school.level.

ALTER TABLE academic.school
    ADD COLUMN education_level varchar(20) NOT NULL DEFAULT 'SMA'
        CHECK (education_level IN ('SMP', 'SMA', 'UNIVERSITY'));