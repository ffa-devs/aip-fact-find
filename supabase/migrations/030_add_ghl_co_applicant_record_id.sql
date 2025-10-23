-- Migration: Add GHL co-applicant record ID to application_participants
-- Date: 2025-10-23
-- Purpose: Store GHL co-applicant record IDs to enable updates instead of recreation

BEGIN;

-- Add ghl_co_applicant_record_id column to application_participants table
ALTER TABLE application_participants 
ADD COLUMN IF NOT EXISTS ghl_co_applicant_record_id VARCHAR(255) NULL;

-- Add comment for documentation
COMMENT ON COLUMN application_participants.ghl_co_applicant_record_id IS 'GoHighLevel co-applicant custom object record ID (only populated for co-applicants)';

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_application_participants_ghl_co_applicant_record_id 
ON application_participants(ghl_co_applicant_record_id) 
WHERE ghl_co_applicant_record_id IS NOT NULL;

COMMIT;