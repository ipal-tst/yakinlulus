-- Migration 001: shared functions, triggers, extensions.
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS vector;

-- Sets updated_at = NOW() on BEFORE UPDATE. Attach to tables that have updated_at.
CREATE OR REPLACE FUNCTION shared.set_updated_at() RETURNS trigger AS $$
BEGIN
    NEW.updated_at := NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
