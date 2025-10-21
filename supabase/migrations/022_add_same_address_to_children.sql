-- Migration: Add same_address_as_primary field to person_children table
-- Date: 2025-10-21
-- Description: Add same_address_as_primary boolean field to person_children table to support children living at the same address as primary applicant

-- Add same_address_as_primary column to person_children table
ALTER TABLE person_children 
ADD COLUMN same_address_as_primary BOOLEAN DEFAULT FALSE;

-- Add index for better query performance
CREATE INDEX idx_person_children_same_address ON person_children(same_address_as_primary);

-- Update existing records to default FALSE (already handled by DEFAULT)
-- UPDATE person_children SET same_address_as_primary = FALSE WHERE same_address_as_primary IS NULL;