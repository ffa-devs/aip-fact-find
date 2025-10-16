-- Migration 008: Restructure for One Person, Multiple Applications
-- This creates a normalized structure where one person can have multiple applications over time

-- =====================================================
-- 1. PEOPLE TABLE (Core person data)
-- =====================================================
CREATE TABLE IF NOT EXISTS people (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Core Identity (should never change for a person)
  email VARCHAR(255) UNIQUE NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  date_of_birth DATE NOT NULL,
  
  -- Contact Information (can be updated)
  telephone VARCHAR(20),
  mobile VARCHAR(20) NOT NULL,
  nationality VARCHAR(100),
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 2. APPLICATION_PARTICIPANTS TABLE (Junction table)
-- =====================================================
CREATE TABLE IF NOT EXISTS application_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Foreign Keys
  application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  person_id UUID NOT NULL REFERENCES people(id) ON DELETE CASCADE,
  
  -- Participant Role
  participant_role VARCHAR(20) NOT NULL CHECK (participant_role IN ('primary', 'co-applicant')),
  participant_order INTEGER NOT NULL,
  
  -- Application-specific personal data that can change per application
  marital_status VARCHAR(50),
  age INTEGER,
  
  -- Current Residence (application-specific)
  current_address TEXT,
  time_at_current_address_years INTEGER,
  time_at_current_address_months INTEGER,
  previous_address TEXT,
  time_at_previous_address_years INTEGER,
  time_at_previous_address_months INTEGER,
  
  -- Tax & Ownership (application-specific)
  tax_country VARCHAR(100),
  homeowner_or_tenant VARCHAR(20),
  monthly_mortgage_or_rent DECIMAL(10, 2),
  current_property_value DECIMAL(12, 2),
  mortgage_outstanding DECIMAL(12, 2),
  lender_or_landlord_details TEXT,
  
  -- Employment Status (application-specific)
  employment_status VARCHAR(50),
  
  -- Co-applicant specific fields
  relationship_to_primary VARCHAR(50), -- Only used when participant_role = 'co-applicant'
  same_address_as_primary BOOLEAN DEFAULT TRUE,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(application_id, person_id), -- One person can only be in an application once
  UNIQUE(application_id, participant_role, participant_order) -- Ensure order uniqueness per role
);

-- =====================================================
-- 3. EMPLOYMENT_DETAILS TABLE (Updated to reference participants)
-- =====================================================
CREATE TABLE IF NOT EXISTS employment_details (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_id UUID NOT NULL REFERENCES application_participants(id) ON DELETE CASCADE,
  
  -- Employment Information
  employer_name VARCHAR(255),
  job_title VARCHAR(255),
  employment_type VARCHAR(50), -- permanent, contract, self_employed, etc.
  annual_income DECIMAL(12, 2),
  net_monthly_income DECIMAL(10, 2),
  time_with_employer_years INTEGER,
  time_with_employer_months INTEGER,
  
  -- Additional income
  other_income_sources TEXT,
  other_income_amount DECIMAL(10, 2),
  
  -- Previous employment (if current < 2 years)
  previous_employer_name VARCHAR(255),
  previous_job_title VARCHAR(255),
  previous_employment_duration_years INTEGER,
  previous_employment_duration_months INTEGER,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 4. FINANCIAL_COMMITMENTS TABLE (Updated to reference participants)
-- =====================================================
CREATE TABLE IF NOT EXISTS financial_commitments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_id UUID NOT NULL REFERENCES application_participants(id) ON DELETE CASCADE,
  
  -- Monthly commitments
  personal_loans DECIMAL(10, 2) DEFAULT 0,
  credit_card_debt DECIMAL(10, 2) DEFAULT 0,
  car_loans_lease DECIMAL(10, 2) DEFAULT 0,
  other_commitments DECIMAL(10, 2) DEFAULT 0,
  total_monthly_commitments DECIMAL(10, 2),
  
  -- Legal issues
  has_credit_or_legal_issues BOOLEAN DEFAULT FALSE,
  credit_legal_issues_details TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 5. RENTAL_PROPERTIES TABLE (Updated to reference participants)
-- =====================================================
CREATE TABLE IF NOT EXISTS rental_properties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_id UUID NOT NULL REFERENCES application_participants(id) ON DELETE CASCADE,
  
  -- Property details
  property_address TEXT NOT NULL,
  purchase_price DECIMAL(12, 2),
  current_value DECIMAL(12, 2),
  monthly_rental_income DECIMAL(10, 2),
  mortgage_outstanding DECIMAL(12, 2),
  monthly_mortgage_payment DECIMAL(10, 2),
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 6. INDEXES FOR PERFORMANCE
-- =====================================================

-- People table indexes
CREATE INDEX IF NOT EXISTS idx_people_email ON people(email);
CREATE INDEX IF NOT EXISTS idx_people_name ON people(first_name, last_name);

-- Application participants indexes
CREATE INDEX IF NOT EXISTS idx_app_participants_application ON application_participants(application_id);
CREATE INDEX IF NOT EXISTS idx_app_participants_person ON application_participants(person_id);
CREATE INDEX IF NOT EXISTS idx_app_participants_role ON application_participants(participant_role);
CREATE INDEX IF NOT EXISTS idx_app_participants_order ON application_participants(application_id, participant_order);

-- Employment details indexes
CREATE INDEX IF NOT EXISTS idx_employment_participant ON employment_details(participant_id);

-- Financial commitments indexes
CREATE INDEX IF NOT EXISTS idx_financial_participant ON financial_commitments(participant_id);

-- Rental properties indexes
CREATE INDEX IF NOT EXISTS idx_rental_participant ON rental_properties(participant_id);

-- =====================================================
-- 7. UPDATE VERIFICATION_CODES FOREIGN KEY
-- =====================================================

-- Drop existing foreign key constraint
ALTER TABLE verification_codes 
DROP CONSTRAINT IF EXISTS fk_verification_codes_application_id;

-- Add back with proper constraint name
ALTER TABLE verification_codes 
ADD CONSTRAINT fk_verification_codes_application_id 
FOREIGN KEY (application_id) REFERENCES applications(id) ON DELETE CASCADE;

-- =====================================================
-- 8. HELPFUL VIEWS FOR COMMON QUERIES
-- =====================================================

-- View to get primary applicant for each application (replaces old applicants table queries)
CREATE OR REPLACE VIEW primary_applicants AS
SELECT 
  ap.application_id,
  p.id as person_id,
  p.email,
  p.first_name,
  p.last_name,
  p.date_of_birth,
  p.telephone,
  p.mobile,
  p.nationality,
  ap.marital_status,
  ap.age,
  ap.current_address,
  ap.time_at_current_address_years,
  ap.time_at_current_address_months,
  ap.previous_address,
  ap.time_at_previous_address_years,
  ap.time_at_previous_address_months,
  ap.tax_country,
  ap.homeowner_or_tenant,
  ap.monthly_mortgage_or_rent,
  ap.current_property_value,
  ap.mortgage_outstanding,
  ap.lender_or_landlord_details,
  ap.employment_status,
  ap.created_at,
  ap.updated_at
FROM application_participants ap
JOIN people p ON ap.person_id = p.id
WHERE ap.participant_role = 'primary' AND ap.participant_order = 1;

-- View to get all participants for applications
CREATE OR REPLACE VIEW application_participants_full AS
SELECT 
  ap.id as participant_id,
  ap.application_id,
  ap.participant_role,
  ap.participant_order,
  p.id as person_id,
  p.email,
  p.first_name,
  p.last_name,
  p.date_of_birth,
  p.telephone,
  p.mobile,
  p.nationality,
  ap.marital_status,
  ap.age,
  ap.current_address,
  ap.time_at_current_address_years,
  ap.time_at_current_address_months,
  ap.previous_address,
  ap.time_at_previous_address_years,
  ap.time_at_previous_address_months,
  ap.tax_country,
  ap.homeowner_or_tenant,
  ap.monthly_mortgage_or_rent,
  ap.current_property_value,
  ap.mortgage_outstanding,
  ap.lender_or_landlord_details,
  ap.employment_status,
  ap.relationship_to_primary,
  ap.same_address_as_primary,
  ap.created_at as participant_created_at,
  ap.updated_at as participant_updated_at,
  p.created_at as person_created_at,
  p.updated_at as person_updated_at
FROM application_participants ap
JOIN people p ON ap.person_id = p.id;

-- Comment on tables
COMMENT ON TABLE people IS 'Core person data - one record per unique individual';
COMMENT ON TABLE application_participants IS 'Junction table linking people to applications with role-specific data';
COMMENT ON TABLE employment_details IS 'Employment information per participant per application';
COMMENT ON TABLE financial_commitments IS 'Financial obligations per participant per application';
COMMENT ON TABLE rental_properties IS 'Rental property portfolios per participant per application';