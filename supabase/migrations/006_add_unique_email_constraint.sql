-- Migration 006: Add unique constraint on email
-- This migration adds a unique constraint on the email field in the applicants table
-- to prevent duplicate email addresses across different applications

-- First, let's see if there are any existing duplicates
DO $$
DECLARE
    duplicate_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO duplicate_count
    FROM (
        SELECT email, COUNT(*) as cnt 
        FROM applicants 
        WHERE email IS NOT NULL 
        GROUP BY email 
        HAVING COUNT(*) > 1
    ) as duplicates;
    
    IF duplicate_count > 0 THEN
        RAISE NOTICE 'Found % duplicate email addresses that need to be resolved before adding unique constraint', duplicate_count;
        RAISE NOTICE 'Please resolve duplicate emails manually before running this migration';
        -- Uncomment the line below to prevent migration if duplicates exist
        -- RAISE EXCEPTION 'Cannot add unique constraint due to existing duplicates';
    ELSE
        RAISE NOTICE 'No duplicate emails found, proceeding with unique constraint';
    END IF;
END
$$;

-- Add unique constraint on email field
-- This will prevent multiple applicants from having the same email address
-- Note: This constraint is applied globally across all applications
ALTER TABLE applicants ADD CONSTRAINT unique_applicant_email UNIQUE (email);

-- Create an index to improve performance of email lookups
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_applicants_email ON applicants(email) WHERE email IS NOT NULL;

-- Add comment to document the constraint
COMMENT ON CONSTRAINT unique_applicant_email ON applicants IS 'Ensures no duplicate email addresses across all applications';