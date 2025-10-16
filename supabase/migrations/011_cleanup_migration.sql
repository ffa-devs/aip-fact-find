-- Migration 011: Database Cleanup
-- This migration removes backup tables and unnecessary duplicate structures after verification

-- =====================================================
-- 1. REMOVE BACKUP TABLES (After verification)
-- =====================================================

-- Drop backup tables created during migration
-- NOTE: Only run this after confirming the migration was successful!

-- Remove applicants backup table
-- DROP TABLE IF EXISTS applicants_backup;

-- Remove co-applicants backup table  
-- DROP TABLE IF EXISTS co_applicants_backup;

-- =====================================================
-- 2. REMOVE UNNECESSARY VIEWS/TABLES
-- =====================================================

-- Drop primary_applicants view if it exists (this may be a duplicate view)
-- DROP VIEW IF EXISTS primary_applicants;

-- Drop application_participants_full view if it exists (this may be a duplicate view)
-- DROP VIEW IF EXISTS application_participants_full;

-- =====================================================
-- 3. UPDATE TABLE COMMENTS FOR CLARITY
-- =====================================================

-- Update table comments to reflect their new purpose
COMMENT ON TABLE applicants IS 'DEPRECATED: Legacy applicants table. Data migrated to people/application_participants. Will be removed in future migration.';
COMMENT ON TABLE co_applicants IS 'DEPRECATED: Legacy co-applicants table. Data migrated to people/application_participants. Will be removed in future migration.';

-- =====================================================
-- 4. PERFORMANCE OPTIMIZATIONS
-- =====================================================

-- Add additional indexes for better performance
CREATE INDEX IF NOT EXISTS idx_application_participants_lookup 
ON application_participants(application_id, participant_role, participant_order);

-- Only create indexes for tables that have participant_id column (added in migration 008)
DO $$
BEGIN
  -- Index for employment_details if it has participant_id
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_name = 'employment_details' AND column_name = 'participant_id') THEN
    CREATE INDEX IF NOT EXISTS idx_employment_details_participant 
    ON employment_details(participant_id);
  END IF;

  -- Index for financial_commitments if it has participant_id
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_name = 'financial_commitments' AND column_name = 'participant_id') THEN
    CREATE INDEX IF NOT EXISTS idx_financial_commitments_participant 
    ON financial_commitments(participant_id);
  END IF;

  -- Index for rental_properties if it has participant_id
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_name = 'rental_properties' AND column_name = 'participant_id') THEN
    CREATE INDEX IF NOT EXISTS idx_rental_properties_participant 
    ON rental_properties(participant_id);
  END IF;

  -- Index for additional_assets if it has participant_id
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_name = 'additional_assets' AND column_name = 'participant_id') THEN
    CREATE INDEX IF NOT EXISTS idx_additional_assets_participant 
    ON additional_assets(participant_id);
  END IF;

  -- Index for applicant_children if it has participant_id
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_name = 'applicant_children' AND column_name = 'participant_id') THEN
    CREATE INDEX IF NOT EXISTS idx_applicant_children_participant 
    ON applicant_children(participant_id);
  END IF;

END $$;

-- =====================================================
-- 5. VALIDATION QUERIES (For manual verification)
-- =====================================================

-- These are commented out but can be used to verify data integrity

/*
-- Check that all applications have corresponding participants
SELECT COUNT(*) as orphaned_applications 
FROM applications a 
WHERE NOT EXISTS (
  SELECT 1 FROM application_participants ap 
  WHERE ap.application_id = a.id
);

-- Check that all participants have corresponding people records
SELECT COUNT(*) as orphaned_participants
FROM application_participants ap
WHERE NOT EXISTS (
  SELECT 1 FROM people p 
  WHERE p.id = ap.person_id
);

-- Check employment details migration
SELECT COUNT(*) as employment_with_old_references
FROM employment_details ed
WHERE ed.applicant_id IS NOT NULL 
  AND ed.participant_id IS NULL;

-- Check financial commitments migration  
SELECT COUNT(*) as financial_with_old_references
FROM financial_commitments fc
WHERE fc.applicant_id IS NOT NULL 
  AND fc.participant_id IS NULL;

-- Check rental properties migration
SELECT COUNT(*) as rental_with_old_references
FROM rental_properties rp
WHERE rp.applicant_id IS NOT NULL 
  AND rp.participant_id IS NULL;
*/