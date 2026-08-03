-- Migration 043: Student identity fields for the profile edit feature
ALTER TABLE users ADD COLUMN IF NOT EXISTS gender VARCHAR(10) CHECK (gender IN ('L','P'));
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(20);
ALTER TABLE users ADD COLUMN IF NOT EXISTS major VARCHAR(30) CHECK (major IN ('IPA','IPS','BAHASA','OLAHRAGA'));
