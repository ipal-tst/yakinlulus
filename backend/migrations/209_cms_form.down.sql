-- Migration 209 down: cms form, contact & subscriber.

DROP TABLE IF EXISTS cms.cms_subscriber;
DROP TABLE IF EXISTS cms.cms_contact;
DROP TABLE IF EXISTS cms.cms_form;