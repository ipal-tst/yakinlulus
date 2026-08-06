-- Migration 217: target_school.name (TargetSchool DTO exposes a free-text name).

ALTER TABLE academic.target_school
    ADD COLUMN IF NOT EXISTS name varchar(200) NOT NULL DEFAULT '';