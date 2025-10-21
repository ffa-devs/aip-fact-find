-- Migration: Add same_children_as_primary field to application_participants table
-- Date: 2025-10-21
-- Description: Add same_children_as_primary boolean field to application_participants table to support co-applicants sharing children with primary applicant

-- Add same_children_as_primary column to application_participants table
ALTER TABLE application_participants 
ADD COLUMN same_children_as_primary BOOLEAN DEFAULT FALSE;

-- Add index for better query performance
CREATE INDEX idx_application_participants_same_children ON application_participants(same_children_as_primary);

-- Update existing records to default FALSE (already handled by DEFAULT)
-- UPDATE application_participants SET same_children_as_primary = FALSE WHERE same_children_as_primary IS NULL;