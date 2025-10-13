-- Migration 005: Add separate co_applicants table
-- This creates a dedicated table for co-applicants separate from the main applicants table

-- =====================================================
-- CO-APPLICANTS TABLE
-- =====================================================
CREATE TABLE co_applicants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID REFERENCES applications(id) ON DELETE CASCADE,
  
  -- Basic Information
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  date_of_birth DATE NOT NULL,
  age INTEGER,
  nationality VARCHAR(100),
  relationship_to_main_applicant VARCHAR(50), -- spouse, partner, family_member, business_partner, etc.
  
  -- Contact Information
  telephone VARCHAR(20),
  mobile VARCHAR(20) NOT NULL,
  email VARCHAR(255) NOT NULL,
  
  -- Current Residence (if different from main applicant)
  same_address_as_main BOOLEAN DEFAULT TRUE,
  current_address TEXT,
  time_at_current_address_years INTEGER,
  time_at_current_address_months INTEGER,
  previous_address TEXT,
  time_at_previous_address_years INTEGER,
  time_at_previous_address_months INTEGER,
  
  -- Tax & Financial Status
  tax_country VARCHAR(100),
  employment_status VARCHAR(50),
  
  -- Income Information
  annual_income DECIMAL(12, 2),
  net_monthly_income DECIMAL(10, 2),
  
  -- Financial Commitments
  personal_loans DECIMAL(10, 2) DEFAULT 0,
  credit_card_debt DECIMAL(10, 2) DEFAULT 0,
  car_loans_lease DECIMAL(10, 2) DEFAULT 0,
  total_monthly_commitments DECIMAL(10, 2),
  
  -- Legal Issues
  has_credit_or_legal_issues BOOLEAN DEFAULT FALSE,
  credit_legal_issues_details TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_co_applicants_application_id ON co_applicants(application_id);
CREATE INDEX idx_co_applicants_email ON co_applicants(email);
CREATE INDEX idx_co_applicants_name ON co_applicants(first_name, last_name);

-- =====================================================
-- CO-APPLICANT EMPLOYMENT DETAILS TABLE
-- =====================================================
CREATE TABLE co_applicant_employment_details (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  co_applicant_id UUID REFERENCES co_applicants(id) ON DELETE CASCADE,
  
  -- For Employed
  job_title VARCHAR(255),
  employer_name VARCHAR(255),
  employer_address TEXT,
  gross_annual_salary DECIMAL(12, 2),
  net_monthly_income DECIMAL(10, 2),
  employment_length_years INTEGER,
  employment_length_months INTEGER,
  previous_employment_details TEXT,
  
  -- For Self-Employed / Directors
  business_name VARCHAR(255),
  business_address TEXT,
  business_website VARCHAR(255),
  company_creation_date DATE,
  total_gross_annual_income DECIMAL(12, 2),
  net_annual_income DECIMAL(12, 2),
  bonus_overtime_commission_details TEXT,
  company_stake_percentage DECIMAL(5, 2),
  accountant_can_provide_info BOOLEAN,
  accountant_contact_details TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index
CREATE INDEX idx_co_applicant_employment_co_applicant_id ON co_applicant_employment_details(co_applicant_id);
CREATE UNIQUE INDEX idx_one_employment_per_co_applicant ON co_applicant_employment_details(co_applicant_id);

-- =====================================================
-- CO-APPLICANT CHILDREN TABLE
-- =====================================================
CREATE TABLE co_applicant_children (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  co_applicant_id UUID REFERENCES co_applicants(id) ON DELETE CASCADE,
  
  age INTEGER NOT NULL,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index
CREATE INDEX idx_co_applicant_children_co_applicant_id ON co_applicant_children(co_applicant_id);

-- =====================================================
-- RLS POLICIES
-- =====================================================

-- Co-applicants table
ALTER TABLE co_applicants ENABLE ROW LEVEL SECURITY;

-- Policy: Allow full access (for now - can be restricted later based on authentication)
CREATE POLICY "Allow all operations on co_applicants" ON co_applicants
  FOR ALL USING (true) WITH CHECK (true);

-- Co-applicant employment details table
ALTER TABLE co_applicant_employment_details ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations on co_applicant_employment_details" ON co_applicant_employment_details
  FOR ALL USING (true) WITH CHECK (true);

-- Co-applicant children table
ALTER TABLE co_applicant_children ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations on co_applicant_children" ON co_applicant_children
  FOR ALL USING (true) WITH CHECK (true);