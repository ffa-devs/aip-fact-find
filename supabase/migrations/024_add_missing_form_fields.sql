-- Migration: Add Missing Form Fields
-- Date: 2025-10-21
-- Description: Add all missing fields that are used in the form but don't exist in database schema

-- =====================================================
-- 1. ADD MISSING FIELDS TO PEOPLE TABLE
-- =====================================================

-- Add age field to people table (calculated from date_of_birth)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'people' AND column_name = 'age') THEN
    ALTER TABLE people ADD COLUMN age INTEGER;
    COMMENT ON COLUMN people.age IS 'Age calculated from date_of_birth, updated when person data changes';
  END IF;
END $$;

-- =====================================================
-- 2. ADD MISSING FIELDS TO APPLICATIONS TABLE
-- =====================================================

-- Add GHL opportunity ID field
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'applications' AND column_name = 'ghl_opportunity_id') THEN
    ALTER TABLE applications ADD COLUMN ghl_opportunity_id VARCHAR(255);
    COMMENT ON COLUMN applications.ghl_opportunity_id IS 'GoHighLevel opportunity ID for CRM integration';
  END IF;
END $$;

-- =====================================================
-- 2b. ADD GHL CO-APPLICANT RECORD ID TO APPLICATION_PARTICIPANTS
-- =====================================================

-- Add GHL co-applicant record ID field for co-applicant participants
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'application_participants' AND column_name = 'ghl_co_applicant_record_id') THEN
    ALTER TABLE application_participants ADD COLUMN ghl_co_applicant_record_id VARCHAR(255);
    COMMENT ON COLUMN application_participants.ghl_co_applicant_record_id IS 'GoHighLevel co-applicant custom object record ID for CRM integration';
  END IF;
END $$;

-- Add move-in date fields to applications table (property-specific dates)
DO $$ 
BEGIN
  -- Current property move-in date
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'applications' AND column_name = 'move_in_date') THEN
    ALTER TABLE applications ADD COLUMN move_in_date DATE;
    COMMENT ON COLUMN applications.move_in_date IS 'Date when primary applicant moved into current property';
  END IF;
  
  -- Previous property move-in date
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'applications' AND column_name = 'previous_move_in_date') THEN
    ALTER TABLE applications ADD COLUMN previous_move_in_date DATE;
    COMMENT ON COLUMN applications.previous_move_in_date IS 'Date when primary applicant moved into previous property';
  END IF;
  
  -- Previous property move-out date
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'applications' AND column_name = 'previous_move_out_date') THEN
    ALTER TABLE applications ADD COLUMN previous_move_out_date DATE;
    COMMENT ON COLUMN applications.previous_move_out_date IS 'Date when primary applicant moved out of previous property';
  END IF;
END $$;

-- =====================================================
-- 3. ADD MISSING FIELDS TO EMPLOYMENT_DETAILS TABLE
-- =====================================================

-- Ensure employment_details table has all required date fields
DO $$ 
BEGIN
  -- Employment start date (missing field - need to add this)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'employment_details' AND column_name = 'employment_start_date') THEN
    ALTER TABLE employment_details ADD COLUMN employment_start_date DATE;
    COMMENT ON COLUMN employment_details.employment_start_date IS 'Date when current employment started';
  END IF;
  
  -- Company creation date (should already exist but let's verify)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'employment_details' AND column_name = 'company_creation_date') THEN
    ALTER TABLE employment_details ADD COLUMN company_creation_date DATE;
    COMMENT ON COLUMN employment_details.company_creation_date IS 'Date when company/business was created';
  END IF;
  
  -- Job title (should already exist but let's verify)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'employment_details' AND column_name = 'job_title') THEN
    ALTER TABLE employment_details ADD COLUMN job_title VARCHAR(200);
    COMMENT ON COLUMN employment_details.job_title IS 'Job title for employed individuals';
  END IF;
  
  -- Employer name (should already exist but let's verify)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'employment_details' AND column_name = 'employer_name') THEN
    ALTER TABLE employment_details ADD COLUMN employer_name VARCHAR(200);
    COMMENT ON COLUMN employment_details.employer_name IS 'Name of employer company';
  END IF;
  
  -- Employer address (should already exist but let's verify)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'employment_details' AND column_name = 'employer_address') THEN
    ALTER TABLE employment_details ADD COLUMN employer_address TEXT;
    COMMENT ON COLUMN employment_details.employer_address IS 'Address of employer company';
  END IF;
  
  -- Gross annual salary (should already exist but let's verify)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'employment_details' AND column_name = 'gross_annual_salary') THEN
    ALTER TABLE employment_details ADD COLUMN gross_annual_salary DECIMAL(12, 2);
    COMMENT ON COLUMN employment_details.gross_annual_salary IS 'Gross annual salary for employed individuals';
  END IF;
  
  -- Net monthly income (should already exist but let's verify)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'employment_details' AND column_name = 'net_monthly_income') THEN
    ALTER TABLE employment_details ADD COLUMN net_monthly_income DECIMAL(12, 2);
    COMMENT ON COLUMN employment_details.net_monthly_income IS 'Net monthly income for employed individuals';
  END IF;
  
  -- Previous employment details (should already exist but let's verify)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'employment_details' AND column_name = 'previous_employment_details') THEN
    ALTER TABLE employment_details ADD COLUMN previous_employment_details TEXT;
    COMMENT ON COLUMN employment_details.previous_employment_details IS 'Details about previous employment';
  END IF;
  
  -- Business name (should already exist but let's verify)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'employment_details' AND column_name = 'business_name') THEN
    ALTER TABLE employment_details ADD COLUMN business_name VARCHAR(200);
    COMMENT ON COLUMN employment_details.business_name IS 'Name of business for self-employed/directors';
  END IF;
  
  -- Business address (should already exist but let's verify)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'employment_details' AND column_name = 'business_address') THEN
    ALTER TABLE employment_details ADD COLUMN business_address TEXT;
    COMMENT ON COLUMN employment_details.business_address IS 'Address of business for self-employed/directors';
  END IF;
  
  -- Business website (should already exist but let's verify)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'employment_details' AND column_name = 'business_website') THEN
    ALTER TABLE employment_details ADD COLUMN business_website VARCHAR(500);
    COMMENT ON COLUMN employment_details.business_website IS 'Website URL for business';
  END IF;
  
  -- Total gross annual income (should already exist but let's verify)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'employment_details' AND column_name = 'total_gross_annual_income') THEN
    ALTER TABLE employment_details ADD COLUMN total_gross_annual_income DECIMAL(12, 2);
    COMMENT ON COLUMN employment_details.total_gross_annual_income IS 'Total gross annual income for self-employed/directors';
  END IF;
  
  -- Net annual income (should already exist but let's verify)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'employment_details' AND column_name = 'net_annual_income') THEN
    ALTER TABLE employment_details ADD COLUMN net_annual_income DECIMAL(12, 2);
    COMMENT ON COLUMN employment_details.net_annual_income IS 'Net annual income for self-employed/directors';
  END IF;
  
  -- Company stake percentage (should already exist but let's verify)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'employment_details' AND column_name = 'company_stake_percentage') THEN
    ALTER TABLE employment_details ADD COLUMN company_stake_percentage DECIMAL(5, 2);
    COMMENT ON COLUMN employment_details.company_stake_percentage IS 'Percentage ownership stake in company for directors';
  END IF;
  
  -- Bonus overtime commission details (should already exist but let's verify)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'employment_details' AND column_name = 'bonus_overtime_commission_details') THEN
    ALTER TABLE employment_details ADD COLUMN bonus_overtime_commission_details TEXT;
    COMMENT ON COLUMN employment_details.bonus_overtime_commission_details IS 'Details about bonus, overtime, or commission income';
  END IF;
  
  -- Accountant can provide info (should already exist but let's verify)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'employment_details' AND column_name = 'accountant_can_provide_info') THEN
    ALTER TABLE employment_details ADD COLUMN accountant_can_provide_info BOOLEAN;
    COMMENT ON COLUMN employment_details.accountant_can_provide_info IS 'Whether accountant can provide additional information';
  END IF;
  
  -- Accountant contact details (should already exist but let's verify)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'employment_details' AND column_name = 'accountant_contact_details') THEN
    ALTER TABLE employment_details ADD COLUMN accountant_contact_details TEXT;
    COMMENT ON COLUMN employment_details.accountant_contact_details IS 'Contact details for accountant';
  END IF;
END $$;

-- =====================================================
-- 4. ADD MISSING FIELDS TO FINANCIAL_COMMITMENTS TABLE
-- =====================================================

-- Ensure financial_commitments table has all required fields
DO $$ 
BEGIN
  -- Personal loans (should already exist but let's verify)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'financial_commitments' AND column_name = 'personal_loans') THEN
    ALTER TABLE financial_commitments ADD COLUMN personal_loans DECIMAL(12, 2) DEFAULT 0;
    COMMENT ON COLUMN financial_commitments.personal_loans IS 'Monthly personal loan payments';
  END IF;
  
  -- Credit card debt (should already exist but let's verify)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'financial_commitments' AND column_name = 'credit_card_debt') THEN
    ALTER TABLE financial_commitments ADD COLUMN credit_card_debt DECIMAL(12, 2) DEFAULT 0;
    COMMENT ON COLUMN financial_commitments.credit_card_debt IS 'Monthly credit card debt payments';
  END IF;
  
  -- Car loans/lease (should already exist but let's verify)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'financial_commitments' AND column_name = 'car_loans_lease') THEN
    ALTER TABLE financial_commitments ADD COLUMN car_loans_lease DECIMAL(12, 2) DEFAULT 0;
    COMMENT ON COLUMN financial_commitments.car_loans_lease IS 'Monthly car loan or lease payments';
  END IF;
  
  -- Has credit or legal issues (should already exist but let's verify)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'financial_commitments' AND column_name = 'has_credit_or_legal_issues') THEN
    ALTER TABLE financial_commitments ADD COLUMN has_credit_or_legal_issues BOOLEAN DEFAULT FALSE;
    COMMENT ON COLUMN financial_commitments.has_credit_or_legal_issues IS 'Whether applicant has credit or legal issues';
  END IF;
  
  -- Credit/legal issues details (should already exist but let's verify)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'financial_commitments' AND column_name = 'credit_legal_issues_details') THEN
    ALTER TABLE financial_commitments ADD COLUMN credit_legal_issues_details TEXT;
    COMMENT ON COLUMN financial_commitments.credit_legal_issues_details IS 'Details about credit or legal issues';
  END IF;
END $$;

-- =====================================================
-- 5. ADD MISSING FIELDS TO PERSON_CHILDREN TABLE
-- =====================================================

-- Ensure person_children table has age field (calculated from date_of_birth)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'person_children' AND column_name = 'age') THEN
    ALTER TABLE person_children ADD COLUMN age INTEGER;
    COMMENT ON COLUMN person_children.age IS 'Age calculated from date_of_birth';
  END IF;
END $$;

-- =====================================================
-- 6. CREATE INDEXES FOR NEW FIELDS
-- =====================================================

-- Index for GHL opportunity ID
CREATE INDEX IF NOT EXISTS idx_applications_ghl_opportunity_id ON applications(ghl_opportunity_id);

-- Index for GHL co-applicant record ID
CREATE INDEX IF NOT EXISTS idx_application_participants_ghl_co_applicant_record_id ON application_participants(ghl_co_applicant_record_id);

-- Indexes for date fields in applications table
CREATE INDEX IF NOT EXISTS idx_applications_move_in_date ON applications(move_in_date);
CREATE INDEX IF NOT EXISTS idx_applications_previous_dates ON applications(previous_move_in_date, previous_move_out_date);

-- Indexes for employment dates
CREATE INDEX IF NOT EXISTS idx_employment_start_date ON employment_details(employment_start_date);
CREATE INDEX IF NOT EXISTS idx_company_creation_date ON employment_details(company_creation_date);

-- Indexes for age fields (for age-based queries)
CREATE INDEX IF NOT EXISTS idx_people_age ON people(age);
CREATE INDEX IF NOT EXISTS idx_children_age ON person_children(age);

-- =====================================================
-- 7. UPDATE EXISTING RECORDS (CALCULATE AGES)
-- =====================================================

-- Update ages for existing people records
UPDATE people 
SET age = EXTRACT(YEAR FROM AGE(CURRENT_DATE, date_of_birth))
WHERE age IS NULL AND date_of_birth IS NOT NULL;

-- Update ages for existing children records
UPDATE person_children 
SET age = EXTRACT(YEAR FROM AGE(CURRENT_DATE, date_of_birth))
WHERE age IS NULL AND date_of_birth IS NOT NULL;

-- =====================================================
-- 8. CREATE TRIGGERS TO AUTO-UPDATE AGES
-- =====================================================

-- Function to calculate age from date_of_birth
CREATE OR REPLACE FUNCTION calculate_age_from_dob()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.date_of_birth IS NOT NULL THEN
    NEW.age = EXTRACT(YEAR FROM AGE(CURRENT_DATE, NEW.date_of_birth));
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for people table
DROP TRIGGER IF EXISTS trigger_people_calculate_age ON people;
CREATE TRIGGER trigger_people_calculate_age
  BEFORE INSERT OR UPDATE OF date_of_birth ON people
  FOR EACH ROW
  EXECUTE FUNCTION calculate_age_from_dob();

-- Trigger for person_children table
DROP TRIGGER IF EXISTS trigger_children_calculate_age ON person_children;
CREATE TRIGGER trigger_children_calculate_age
  BEFORE INSERT OR UPDATE OF date_of_birth ON person_children
  FOR EACH ROW
  EXECUTE FUNCTION calculate_age_from_dob();

-- =====================================================
-- COMMENTS FOR DOCUMENTATION
-- =====================================================

-- Migration completed successfully
-- Added all missing form fields to ensure database schema matches application requirements
-- Tables updated: people, applications, employment_details, financial_commitments, person_children
-- Triggers added for automatic age calculation