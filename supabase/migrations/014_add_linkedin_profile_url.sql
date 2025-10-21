-- Migration: Add LinkedIn Profile URL to people table
-- Created: 2025-10-21
-- Description: Add linkedin_profile_url field to people table for Step 2 form

-- Add linkedin_profile_url column to people table
ALTER TABLE people 
ADD COLUMN linkedin_profile_url VARCHAR(500);

-- Add comment for documentation
COMMENT ON COLUMN people.linkedin_profile_url IS 'LinkedIn profile URL for professional networking';