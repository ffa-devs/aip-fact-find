-- Migration: Remove all previous address related fields
-- Date: 2025-10-23

BEGIN;

-- Remove previous address fields from application_participants table
ALTER TABLE application_participants 
DROP COLUMN IF EXISTS previous_address,
DROP COLUMN IF EXISTS time_at_previous_address_years,
DROP COLUMN IF EXISTS time_at_previous_address_months,
DROP COLUMN IF EXISTS previous_move_in_date,
DROP COLUMN IF EXISTS previous_move_out_date;

-- Remove previous address fields from applications table (if they exist)
ALTER TABLE applications 
DROP COLUMN IF EXISTS previous_address,
DROP COLUMN IF EXISTS time_at_previous_address_years,
DROP COLUMN IF EXISTS time_at_previous_address_months,
DROP COLUMN IF EXISTS previous_move_in_date,
DROP COLUMN IF EXISTS previous_move_out_date;

-- Drop any indexes related to previous address fields
DROP INDEX IF EXISTS idx_applications_previous_dates;
DROP INDEX IF EXISTS idx_application_participants_previous_dates;

COMMIT;