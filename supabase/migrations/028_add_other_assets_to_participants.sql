-- Migration: Add other_assets field to application_participants table
-- Date: 2025-10-23
-- Purpose: Store other assets information directly in participant record instead of separate table

BEGIN;

-- Add other_assets column to application_participants table
ALTER TABLE application_participants 
ADD COLUMN IF NOT EXISTS other_assets TEXT DEFAULT '';

-- Add comment for documentation
COMMENT ON COLUMN application_participants.other_assets IS 'Text description of any other assets the participant owns (from Step 5 of the application form)';

COMMIT;