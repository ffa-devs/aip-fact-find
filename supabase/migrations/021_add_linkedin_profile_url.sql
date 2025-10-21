-- Add LinkedIn profile URL field to persons table
-- Migration: 021_add_linkedin_profile_url

-- Add linkedin_profile_url column to persons table
ALTER TABLE persons 
ADD COLUMN linkedin_profile_url VARCHAR(255);

-- Add index for better search performance (optional but recommended)
CREATE INDEX idx_persons_linkedin_profile_url ON persons(linkedin_profile_url);

-- Add comment for documentation
COMMENT ON COLUMN persons.linkedin_profile_url IS 'Optional LinkedIn profile URL for the person';