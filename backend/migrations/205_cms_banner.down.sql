-- Migration 205 down: cms banner, widget, component & menu.

DROP TABLE IF EXISTS cms.cms_menu_item;
DROP TABLE IF EXISTS cms.cms_menu;
DROP TABLE IF EXISTS cms.cms_component;
DROP TABLE IF EXISTS cms.cms_widget;
DROP TABLE IF EXISTS cms.cms_banner;