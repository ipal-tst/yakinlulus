-- Migration 207 down: cms news, redirect & sitemap.

DROP TABLE IF EXISTS cms.cms_sitemap;
DROP TABLE IF EXISTS cms.cms_redirect;
DROP TABLE IF EXISTS cms.cms_news;