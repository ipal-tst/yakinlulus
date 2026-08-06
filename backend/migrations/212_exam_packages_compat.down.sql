DROP VIEW IF EXISTS cms.exam_package_exams;
DROP VIEW IF EXISTS cms.exam_packages;

ALTER TABLE cbt.exam_package DROP COLUMN IF EXISTS is_active;
ALTER TABLE cbt.exam_package DROP COLUMN IF EXISTS deleted_at;