-- Migration 000: Clean slate. Remove ALL legacy objects and recreate schema.
-- NOTE: the runner creates _migrations in schema public before running files,
-- so we DROP SCHEMA public CASCADE then recreate _migrations with identical shape.

DROP SCHEMA IF EXISTS public CASCADE;
CREATE SCHEMA public;

-- Recreate the runner's tracking table (same shape AutoMigrate expects).
CREATE TABLE public._migrations (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    applied_at TIMESTAMPTZ DEFAULT NOW()
);

-- Drop any legacy extension we no longer rely on being at old state (idempotent).
-- Namespace schemas per bounded-context.
CREATE SCHEMA identity;
CREATE SCHEMA academic;
CREATE SCHEMA media;
CREATE SCHEMA question;
CREATE SCHEMA cbt;
CREATE SCHEMA content;
CREATE SCHEMA finance;
CREATE SCHEMA ranking;
CREATE SCHEMA analytics;
CREATE SCHEMA cms;
CREATE SCHEMA notification;
CREATE SCHEMA queue;
CREATE SCHEMA ai;
CREATE SCHEMA ocr;
CREATE SCHEMA report;
CREATE SCHEMA search;
CREATE SCHEMA config;
CREATE SCHEMA audit;
CREATE SCHEMA integration;
CREATE SCHEMA monitoring;
CREATE SCHEMA shared;