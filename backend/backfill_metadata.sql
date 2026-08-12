-- Backfill metadata from description <!--BP:{...}--> to metadata column
-- This copies blueprint data that was embedded in description to the new metadata JSONB column

-- First, create a temporary function to extract blueprint from description
CREATE OR REPLACE FUNCTION extract_blueprint_from_description(desc text) RETURNS jsonb AS $$
DECLARE
    bp_start int;
    bp_end int;
    json_str text;
BEGIN
    bp_start := POSITION('<!--BP:' IN desc);
    IF bp_start = 0 THEN
        RETURN '{}'::jsonb;
    END IF;
    
    bp_end := POSITION('-->' IN SUBSTRING(desc FROM bp_start));
    IF bp_end = 0 THEN
        RETURN '{}'::jsonb;
    END IF;
    
    json_str := SUBSTRING(desc FROM bp_start + 6 FOR bp_end - 6);
    
    -- Validate it's valid JSON
    BEGIN
        RETURN json_str::jsonb;
    EXCEPTION WHEN OTHERS THEN
        RETURN '{}'::jsonb;
    END;
END;
$$ LANGUAGE plpgsql;

-- Update all exam rows with metadata from description
UPDATE cbt.exam 
SET metadata = extract_blueprint_from_description(description)
WHERE deleted_at IS NULL;

-- Drop the temporary function
DROP FUNCTION IF EXISTS extract_blueprint_from_description(text);

SELECT COUNT(*) as rows_updated FROM cbt.exam WHERE metadata != '{}'::jsonb AND deleted_at IS NULL;
