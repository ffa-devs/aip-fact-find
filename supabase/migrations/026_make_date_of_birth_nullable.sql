-- Migration: Make date_of_birth nullable in people table
-- Date: 2025-10-23
-- Description: Since date_of_birth is now collected in Step 2 instead of Step 1,
-- we need to allow creating people records without it initially

-- Make date_of_birth nullable in people table
ALTER TABLE people ALTER COLUMN date_of_birth DROP NOT NULL;

-- Add comment explaining the change
COMMENT ON COLUMN people.date_of_birth IS 'Date of birth (nullable) - collected in Step 2 of application form';