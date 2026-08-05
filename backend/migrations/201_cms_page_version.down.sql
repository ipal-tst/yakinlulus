-- Migration 201 down: cms page version, publish & seo.

DROP TABLE IF EXISTS cms.cms_page_seo;
DROP TABLE IF EXISTS cms.cms_page_publish;
DROP TABLE IF EXISTS cms.cms_page_version;