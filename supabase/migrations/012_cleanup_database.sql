-- Migration 012: Clean Database - Remove Legacy Tables and Dependencies
-- This migration safely removes all legacy tables and their dependencies

-- =====================================================
-- 1. DROP FOREIGN KEY CONSTRAINTS (LEGACY REFERENCES)
-- =====================================================

-- Drop foreign key constraints that reference legacy applicants table
DO $$
BEGIN
  -- Drop applicant_children constraint if it exists
  IF EXISTS (SELECT 1 FROM information_schema.table_constraints 
             WHERE constraint_name = 'applicant_children_applicant_id_fkey') THEN
    ALTER TABLE applicant_children DROP CONSTRAINT applicant_children_applicant_id_fkey;
    RAISE NOTICE 'Dropped applicant_children_applicant_id_fkey constraint';
  END IF;

  -- Drop employment_details constraint if it exists
  IF EXISTS (SELECT 1 FROM information_schema.table_constraints 
             WHERE constraint_name = 'employment_details_applicant_id_fkey') THEN
    ALTER TABLE employment_details DROP CONSTRAINT employment_details_applicant_id_fkey;
    RAISE NOTICE 'Dropped employment_details_applicant_id_fkey constraint';
  END IF;

  -- Drop financial_commitments constraint if it exists
  IF EXISTS (SELECT 1 FROM information_schema.table_constraints 
             WHERE constraint_name = 'financial_commitments_applicant_id_fkey') THEN
    ALTER TABLE financial_commitments DROP CONSTRAINT financial_commitments_applicant_id_fkey;
    RAISE NOTICE 'Dropped financial_commitments_applicant_id_fkey constraint';
  END IF;

  -- Drop rental_properties constraint if it exists
  IF EXISTS (SELECT 1 FROM information_schema.table_constraints 
             WHERE constraint_name = 'rental_properties_applicant_id_fkey') THEN
    ALTER TABLE rental_properties DROP CONSTRAINT rental_properties_applicant_id_fkey;
    RAISE NOTICE 'Dropped rental_properties_applicant_id_fkey constraint';
  END IF;

  -- Drop additional_assets constraint if it exists
  IF EXISTS (SELECT 1 FROM information_schema.table_constraints 
             WHERE constraint_name = 'additional_assets_applicant_id_fkey') THEN
    ALTER TABLE additional_assets DROP CONSTRAINT additional_assets_applicant_id_fkey;
    RAISE NOTICE 'Dropped additional_assets_applicant_id_fkey constraint';
  END IF;
END $$;

-- Drop foreign key constraints that reference legacy co_applicants table
DO $$
BEGIN
  -- Drop co_applicant_employment_details constraints if they exist
  IF EXISTS (SELECT 1 FROM information_schema.table_constraints 
             WHERE constraint_name = 'co_applicant_employment_details_co_applicant_id_fkey') THEN
    ALTER TABLE co_applicant_employment_details DROP CONSTRAINT co_applicant_employment_details_co_applicant_id_fkey;
    RAISE NOTICE 'Dropped co_applicant_employment_details constraint';
  END IF;

  -- Drop co_applicant_children constraints if they exist
  IF EXISTS (SELECT 1 FROM information_schema.table_constraints 
             WHERE constraint_name = 'co_applicant_children_co_applicant_id_fkey') THEN
    ALTER TABLE co_applicant_children DROP CONSTRAINT co_applicant_children_co_applicant_id_fkey;
    RAISE NOTICE 'Dropped co_applicant_children constraint';
  END IF;
END $$;

-- =====================================================
-- 2. DROP LEGACY COLUMNS (APPLICANT_ID REFERENCES)
-- =====================================================

-- Remove legacy applicant_id columns from tables that now use participant_id
DO $$
BEGIN
  -- Remove applicant_id from applicant_children if it exists
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_name = 'applicant_children' AND column_name = 'applicant_id') THEN
    ALTER TABLE applicant_children DROP COLUMN applicant_id;
    RAISE NOTICE 'Dropped applicant_id column from applicant_children';
  END IF;

  -- Remove applicant_id from employment_details if it exists
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_name = 'employment_details' AND column_name = 'applicant_id') THEN
    ALTER TABLE employment_details DROP COLUMN applicant_id;
    RAISE NOTICE 'Dropped applicant_id column from employment_details';
  END IF;

  -- Remove applicant_id from financial_commitments if it exists
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_name = 'financial_commitments' AND column_name = 'applicant_id') THEN
    ALTER TABLE financial_commitments DROP COLUMN applicant_id;
    RAISE NOTICE 'Dropped applicant_id column from financial_commitments';
  END IF;

  -- Remove applicant_id from rental_properties if it exists
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_name = 'rental_properties' AND column_name = 'applicant_id') THEN
    ALTER TABLE rental_properties DROP COLUMN applicant_id;
    RAISE NOTICE 'Dropped applicant_id column from rental_properties';
  END IF;

  -- Remove applicant_id from additional_assets if it exists
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_name = 'additional_assets' AND column_name = 'applicant_id') THEN
    ALTER TABLE additional_assets DROP COLUMN applicant_id;
    RAISE NOTICE 'Dropped applicant_id column from additional_assets';
  END IF;
END $$;

-- =====================================================
-- 3. DROP BACKUP TABLES
-- =====================================================

DROP TABLE IF EXISTS applicants_backup;
DROP TABLE IF EXISTS co_applicants_backup;

RAISE NOTICE 'Dropped backup tables';

-- =====================================================
-- 4. DROP REDUNDANT VIEWS
-- =====================================================

DROP VIEW IF EXISTS application_participants_full;
DROP VIEW IF EXISTS primary_applicants;

RAISE NOTICE 'Dropped redundant views';

-- =====================================================
-- 5. DROP LEGACY CO-APPLICANT TABLES
-- =====================================================

DROP TABLE IF EXISTS co_applicant_children;
DROP TABLE IF EXISTS co_applicant_employment_details;
DROP TABLE IF EXISTS co_applicants;

RAISE NOTICE 'Dropped legacy co-applicant tables';

-- =====================================================
-- 6. DROP LEGACY APPLICANTS TABLE
-- =====================================================

DROP TABLE IF EXISTS applicants;

RAISE NOTICE 'Dropped legacy applicants table';

-- =====================================================
-- 7. CLEANUP TEMPORARY MIGRATION COLUMNS
-- =====================================================

-- Remove temporary migration tracking columns
DO $$
BEGIN
  -- Remove temp columns from employment_details
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_name = 'employment_details' AND column_name = 'temp_old_applicant_id') THEN
    ALTER TABLE employment_details DROP COLUMN temp_old_applicant_id;
    RAISE NOTICE 'Dropped temp_old_applicant_id from employment_details';
  END IF;

  -- Remove temp columns from financial_commitments
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_name = 'financial_commitments' AND column_name = 'temp_old_applicant_id') THEN
    ALTER TABLE financial_commitments DROP COLUMN temp_old_applicant_id;
    RAISE NOTICE 'Dropped temp_old_applicant_id from financial_commitments';
  END IF;

  -- Remove temp columns from rental_properties
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_name = 'rental_properties' AND column_name = 'temp_old_applicant_id') THEN
    ALTER TABLE rental_properties DROP COLUMN temp_old_applicant_id;
    RAISE NOTICE 'Dropped temp_old_applicant_id from rental_properties';
  END IF;

  -- Remove temp columns from additional_assets
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_name = 'additional_assets' AND column_name = 'temp_old_applicant_id') THEN
    ALTER TABLE additional_assets DROP COLUMN temp_old_applicant_id;
    RAISE NOTICE 'Dropped temp_old_applicant_id from additional_assets';
  END IF;

  -- Remove temp columns from applicant_children
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_name = 'applicant_children' AND column_name = 'temp_old_applicant_id') THEN
    ALTER TABLE applicant_children DROP COLUMN temp_old_applicant_id;
    RAISE NOTICE 'Dropped temp_old_applicant_id from applicant_children';
  END IF;
END $$;

-- =====================================================
-- 8. UPDATE TABLE COMMENTS
-- =====================================================

COMMENT ON TABLE people IS 'Normalized person data - stores unique individuals across multiple applications';
COMMENT ON TABLE application_participants IS 'Junction table linking people to applications with application-specific participant data';
COMMENT ON TABLE employment_details IS 'Employment information linked to application participants';
COMMENT ON TABLE financial_commitments IS 'Financial commitments linked to application participants';
COMMENT ON TABLE rental_properties IS 'Rental property assets linked to application participants';
COMMENT ON TABLE additional_assets IS 'Additional assets linked to application participants';
COMMENT ON TABLE applicant_children IS 'Children information linked to application participants';

-- =====================================================
-- 9. FINAL SUMMARY
-- =====================================================

DO $$
DECLARE
  table_count INTEGER;
BEGIN
  -- Count remaining tables
  SELECT COUNT(*) INTO table_count 
  FROM information_schema.tables 
  WHERE table_schema = 'public' 
    AND table_type = 'BASE TABLE';
    
  RAISE NOTICE '========================================';
  RAISE NOTICE 'DATABASE CLEANUP COMPLETED SUCCESSFULLY';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Remaining tables: %', table_count;
  RAISE NOTICE 'Legacy tables removed: applicants, co_applicants, backup tables';
  RAISE NOTICE 'Foreign key constraints cleaned up';
  RAISE NOTICE 'Temporary migration columns removed';
  RAISE NOTICE 'Database is now using normalized schema only';
  RAISE NOTICE '========================================';
END $$;