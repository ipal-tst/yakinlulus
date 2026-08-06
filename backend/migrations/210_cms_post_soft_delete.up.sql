-- Migration 210: add soft-delete column to cms_post (matches cms_page.deleted_at).
ALTER TABLE cms.cms_post ADD COLUMN IF NOT EXISTS deleted_at timestamptz;