-- Migration 210 down: drop soft-delete column from cms_post.
ALTER TABLE cms.cms_post DROP COLUMN IF EXISTS deleted_at;