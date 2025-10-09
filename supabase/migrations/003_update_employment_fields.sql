-- Update Employment Details Table
-- Migration 003: Add employment_start_date field and update employment status values

-- =====================================================
-- 1. ADD employment_start_date field
-- =====================================================
ALTER TABLE employment_details 
ADD COLUMN employment_start_date DATE;

-- =====================================================
-- 2. UPDATE employment_status values in applicants table
-- =====================================================
-- The employment_status field needs to support new values:
-- 'retired_pension' and 'home_maker' instead of 'retired' and 'unemployed' 

-- First, update any existing data
UPDATE applicants 
SET employment_status = 'retired_pension' 
WHERE employment_status = 'retired';

UPDATE applicants 
SET employment_status = 'home_maker' 
WHERE employment_status = 'unemployed';

-- =====================================================
-- 3. ADD CHECK CONSTRAINT for employment_status
-- =====================================================
-- Remove any old constraint if exists
ALTER TABLE applicants DROP CONSTRAINT IF EXISTS check_employment_status;

-- Add new constraint with updated values
ALTER TABLE applicants 
ADD CONSTRAINT check_employment_status 
CHECK (employment_status IN (
  'employed', 
  'self_employed', 
  'director', 
  'retired_pension', 
  'home_maker', 
  'other'
));

-- =====================================================
-- COMMENTS
-- =====================================================
COMMENT ON COLUMN employment_details.employment_start_date IS 'Date when employment started (replaces employment_length_years/months)';
COMMENT ON CONSTRAINT check_employment_status ON applicants IS 'Valid employment status values including new retired_pension and home_maker options';