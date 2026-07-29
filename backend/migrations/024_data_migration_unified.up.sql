-- Migration 024: Legacy Data Migration (No-op for fresh database builds)
DO $$
BEGIN
    -- No-op for fresh database rebuild
    NULL;
END $$;