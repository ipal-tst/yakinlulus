-- Migration 212: exam_packages compatibility views over the cbt schema.
--
-- Legacy public.exam_packages / public.exam_package_exams presented a
-- 1-package -> N-exams model. The new schema models a package as 1:1 with a
-- cbt.exam. This migration (a) adds the is_active flag (and a soft-delete hook)
-- to cbt.exam_package and (b) republishes the legacy interface as cms views so
-- the exam_packages API surface stays unchanged.
--
-- cbt.exam has no grade_id column; the grade link lives on cbt.exam_grade.
-- education_level is derived through academic.grade -> academic.education_level.
--
-- NOTE (multi-grade package): cbt.exam_grade is N:M, so an exam registered
-- against more than one academic.grade would make this view emit one package
-- row per grade (an API-level duplicate, since ExamPackage has a single
-- GradeID). The exam_packages Create/Update path writes exactly one grade, so
-- the common case yields one row. Leave documented rather than aggregate so the
-- committed view matches what is applied on the shared DB.

ALTER TABLE cbt.exam_package ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true;
ALTER TABLE cbt.exam_package ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

DROP VIEW IF EXISTS cms.exam_package_exams;
DROP VIEW IF EXISTS cms.exam_packages;

CREATE VIEW cms.exam_packages AS
SELECT ep.id,
       COALESCE(e.exam_code, ep.id::text)                                  AS code,
       COALESCE(e.title, ep.name::text)                                    AS name,
       COALESCE(el.code, 'SD')                                          AS education_level,
       eg.grade_id,
       ep.is_active,
       ep.created_at,
       COALESCE(e.updated_at, ep.created_at)                          AS updated_at
FROM cbt.exam_package ep
JOIN cbt.exam e ON e.id = ep.exam_id
LEFT JOIN cbt.exam_grade eg ON eg.exam_id = e.id
LEFT JOIN academic.grade g ON g.id = eg.grade_id
LEFT JOIN academic.education_level el ON el.id = g.education_level_id
WHERE ep.deleted_at IS NULL
  AND e.deleted_at IS NULL;

CREATE VIEW cms.exam_package_exams AS
SELECT ep.id          AS package_id,
       e.id          AS exam_content_id,
       es.subject_id,
       s.name        AS subject_name,
       ROW_NUMBER() OVER (PARTITION BY ep.id ORDER BY es.subject_id NULLS LAST)::int AS display_order
FROM cbt.exam_package ep
JOIN cbt.exam e ON e.id = ep.exam_id
LEFT JOIN cbt.exam_subject es ON es.exam_id = e.id
LEFT JOIN academic.subject s ON s.id = es.subject_id
WHERE ep.deleted_at IS NULL
  AND e.deleted_at IS NULL;