-- Migration 206 down: cms faq, testimonial, partner & event.

DROP TABLE IF EXISTS cms.cms_event;
DROP TABLE IF EXISTS cms.cms_partner;
DROP TABLE IF EXISTS cms.cms_testimonial;
DROP TABLE IF EXISTS cms.cms_faq;