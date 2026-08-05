-- Migration 202 down: cms post, post version & category.

DROP TABLE IF EXISTS cms.cms_category;
DROP TABLE IF EXISTS cms.cms_post_version;
DROP TABLE IF EXISTS cms.cms_post;