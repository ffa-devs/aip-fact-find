-- Migration: Remove additional_assets table
-- Date: 2025-10-23
-- Purpose: Remove the additional_assets table since other_assets is now stored directly in application_participants table

BEGIN;

-- Drop the additional_assets table if it exists
DROP TABLE IF EXISTS additional_assets CASCADE;

-- Remove any foreign key constraints or indexes that referenced this table
-- (CASCADE will handle most of these automatically)

COMMIT;