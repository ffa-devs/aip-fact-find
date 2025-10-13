-- Add GHL opportunity ID to applications table
-- Migration 004: Add GHL opportunity ID tracking

ALTER TABLE applications 
ADD COLUMN ghl_opportunity_id VARCHAR(255);

-- Add index for GHL opportunity ID lookups
CREATE INDEX idx_applications_ghl_opportunity_id ON applications(ghl_opportunity_id);