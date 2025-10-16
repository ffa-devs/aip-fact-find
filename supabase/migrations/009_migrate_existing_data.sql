-- Migration 009: Data Migration from Old to New Structure
-- This migrates existing applicants and co_applicants to the new people/application_participants structure

-- =====================================================
-- 1. MIGRATE EXISTING APPLICANTS TO NEW STRUCTURE
-- =====================================================

-- First, insert unique people from existing applicants
INSERT INTO people (
  id,
  email,
  first_name,
  last_name,
  date_of_birth,
  telephone,
  mobile,
  nationality,
  created_at,
  updated_at
)
SELECT 
  id, -- Preserve the original applicant ID
  LOWER(email), -- Ensure email is lowercase
  first_name,
  last_name,
  date_of_birth,
  telephone,
  mobile,
  nationality,
  created_at,
  NOW()
FROM applicants
WHERE applicant_order = 1 -- Only primary applicants for now
ON CONFLICT (email) DO NOTHING; -- Skip if email already exists

-- Now create application_participants records for primary applicants
INSERT INTO application_participants (
  id,
  application_id,
  person_id,
  participant_role,
  participant_order,
  marital_status,
  age,
  current_address,
  time_at_current_address_years,
  time_at_current_address_months,
  previous_address,
  time_at_previous_address_years,
  time_at_previous_address_months,
  tax_country,
  homeowner_or_tenant,
  monthly_mortgage_or_rent,
  current_property_value,
  mortgage_outstanding,
  lender_or_landlord_details,
  employment_status,
  created_at,
  updated_at
)
SELECT 
  gen_random_uuid(), -- Generate new UUID for participant
  a.application_id,
  a.id, -- Use applicant ID directly as person_id since we preserved it in people table
  'primary',
  1, -- Primary applicant is always order 1
  a.marital_status,
  a.age,
  a.current_address,
  a.time_at_current_address_years,
  a.time_at_current_address_months,
  a.previous_address,
  a.time_at_previous_address_years,
  a.time_at_previous_address_months,
  a.tax_country,
  a.homeowner_or_tenant,
  a.monthly_mortgage_or_rent,
  a.current_property_value,
  a.mortgage_outstanding,
  a.lender_or_landlord_details,
  a.employment_status,
  a.created_at,
  a.updated_at
FROM applicants a
WHERE a.applicant_order = 1; -- Only primary applicants

-- =====================================================
-- 2. MIGRATE EXISTING CO-APPLICANTS TO NEW STRUCTURE
-- =====================================================

-- First, insert unique people from co_applicants table (if they don't already exist)
INSERT INTO people (
  id,
  email,
  first_name,
  last_name,
  date_of_birth,
  telephone,
  mobile,
  nationality,
  created_at,
  updated_at
)
SELECT 
  gen_random_uuid(),
  LOWER(email),
  first_name,
  last_name,
  date_of_birth,
  telephone,
  mobile,
  nationality,
  MIN(created_at),
  NOW()
FROM co_applicants
GROUP BY 
  LOWER(email),
  first_name,
  last_name,
  date_of_birth,
  telephone,
  mobile,
  nationality
ON CONFLICT (email) DO NOTHING;

-- Now create application_participants records for co-applicants
INSERT INTO application_participants (
  id,
  application_id,
  person_id,
  participant_role,
  participant_order,
  marital_status,
  age,
  current_address,
  time_at_current_address_years,
  time_at_current_address_months,
  previous_address,
  time_at_previous_address_years,
  time_at_previous_address_months,
  tax_country,
  employment_status,
  relationship_to_primary,
  same_address_as_primary,
  created_at,
  updated_at
)
SELECT 
  ca.id, -- Use co_applicant id as participant id
  ca.application_id,
  p.id, -- Person ID from people table
  'co-applicant',
  ROW_NUMBER() OVER (PARTITION BY ca.application_id ORDER BY ca.created_at) + 1, -- Start from 2 (after primary)
  NULL, -- marital_status not in co_applicants table
  ca.age,
  CASE 
    WHEN ca.same_address_as_main = false THEN ca.current_address 
    ELSE NULL 
  END,
  CASE 
    WHEN ca.same_address_as_main = false THEN ca.time_at_current_address_years 
    ELSE NULL 
  END,
  CASE 
    WHEN ca.same_address_as_main = false THEN ca.time_at_current_address_months 
    ELSE NULL 
  END,
  CASE 
    WHEN ca.same_address_as_main = false THEN ca.previous_address 
    ELSE NULL 
  END,
  CASE 
    WHEN ca.same_address_as_main = false THEN ca.time_at_previous_address_years 
    ELSE NULL 
  END,
  CASE 
    WHEN ca.same_address_as_main = false THEN ca.time_at_previous_address_months 
    ELSE NULL 
  END,
  ca.tax_country,
  ca.employment_status,
  ca.relationship_to_main_applicant,
  ca.same_address_as_main,
  ca.created_at,
  ca.updated_at
FROM co_applicants ca
JOIN people p ON LOWER(p.email) = LOWER(ca.email);

-- =====================================================
-- 3. MIGRATE EMPLOYMENT DETAILS (IF TABLE EXISTS)
-- =====================================================

DO $$
BEGIN
  -- Check if employment_details table exists and has applicant_id
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'employment_details') 
     AND EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'employment_details' AND column_name = 'applicant_id') THEN
    
    -- Add temporary column to track migration
    ALTER TABLE employment_details ADD COLUMN IF NOT EXISTS temp_old_applicant_id UUID;
    
    -- Update employment_details to reference application_participants using participant_id
    UPDATE employment_details 
    SET 
      temp_old_applicant_id = applicant_id,
      participant_id = ap.id
    FROM application_participants ap
    WHERE employment_details.applicant_id = ap.person_id;
    
    RAISE NOTICE 'Updated employment_details to use participant_id';
  END IF;
END $$;

-- =====================================================
-- 4. MIGRATE FINANCIAL COMMITMENTS (IF TABLE EXISTS)
-- =====================================================

DO $$
BEGIN
  -- Check if financial_commitments table exists and has applicant_id
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'financial_commitments')
     AND EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'financial_commitments' AND column_name = 'applicant_id') THEN
    
    -- Add temporary column to track migration
    ALTER TABLE financial_commitments ADD COLUMN IF NOT EXISTS temp_old_applicant_id UUID;
    
    -- Update to reference participants using participant_id
    UPDATE financial_commitments 
    SET 
      temp_old_applicant_id = applicant_id,
      participant_id = ap.id
    FROM application_participants ap
    WHERE financial_commitments.applicant_id = ap.person_id;
    
    RAISE NOTICE 'Updated financial_commitments to use participant_id';
  END IF;
END $$;

-- =====================================================
-- 5. MIGRATE RENTAL PROPERTIES (IF TABLE EXISTS)
-- =====================================================

DO $$
BEGIN
  -- Check if rental_properties table exists and has applicant_id
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'rental_properties')
     AND EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'rental_properties' AND column_name = 'applicant_id') THEN
    
    -- Add temporary column to track migration
    ALTER TABLE rental_properties ADD COLUMN IF NOT EXISTS temp_old_applicant_id UUID;
    
    -- Update to reference participants using participant_id
    UPDATE rental_properties 
    SET 
      temp_old_applicant_id = applicant_id,
      participant_id = ap.id
    FROM application_participants ap
    WHERE rental_properties.applicant_id = ap.person_id;
    
    RAISE NOTICE 'Updated rental_properties to use participant_id';
  END IF;
END $$;

-- =====================================================
-- 6. VALIDATION QUERIES
-- =====================================================

-- Count records to verify migration
DO $$ 
DECLARE
  old_applicant_count INTEGER;
  old_co_applicant_count INTEGER;
  new_people_count INTEGER;
  new_participant_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO old_applicant_count FROM applicants;
  SELECT COUNT(*) INTO old_co_applicant_count FROM co_applicants;
  SELECT COUNT(*) INTO new_people_count FROM people;
  SELECT COUNT(*) INTO new_participant_count FROM application_participants;
  
  RAISE NOTICE 'Migration Summary:';
  RAISE NOTICE 'Old applicants: %', old_applicant_count;
  RAISE NOTICE 'Old co-applicants: %', old_co_applicant_count;
  RAISE NOTICE 'New people: %', new_people_count;
  RAISE NOTICE 'New participants: %', new_participant_count;
  
  -- Basic validation
  IF new_participant_count < old_applicant_count THEN
    RAISE WARNING 'Participant count is less than applicant count - check migration!';
  END IF;
END $$;

-- Create temporary backup tables for safety
CREATE TABLE applicants_backup AS SELECT * FROM applicants;
CREATE TABLE co_applicants_backup AS SELECT * FROM co_applicants;

-- Add comments
COMMENT ON TABLE applicants_backup IS 'Backup of applicants table before migration - can be dropped after validation';
COMMENT ON TABLE co_applicants_backup IS 'Backup of co_applicants table before migration - can be dropped after validation';