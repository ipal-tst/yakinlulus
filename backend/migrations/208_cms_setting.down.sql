-- Migration 208 down: cms setting, language & translation.

DROP TABLE IF EXISTS cms.cms_translation;
DROP TABLE IF EXISTS cms.cms_language;
DROP TABLE IF EXISTS cms.cms_setting;