-- Backfill metadata from description to new metadata column
UPDATE cbt.exam 
SET metadata = (
    CASE 
        WHEN description ~ '<!--BP:' THEN 
            substring(description from '<!--BP:(.*)-->'::text)::jsonb
        ELSE '{}'::jsonb
    END
)
WHERE deleted_at IS NULL;

-- Verify
SELECT COUNT(*) as total_exams, 
       COUNT(*) FILTER (WHERE metadata != '{}'::jsonb) as with_metadata
FROM cbt.exam 
WHERE deleted_at IS NULL;
