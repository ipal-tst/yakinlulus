-- Migration 203 down: cms tag, post tag & comment.

DROP TABLE IF EXISTS cms.cms_comment;
DROP TABLE IF EXISTS cms.cms_post_tag;
DROP TABLE IF EXISTS cms.cms_tag;