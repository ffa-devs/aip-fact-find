-- AIP Application Database Schema
-- Migration 001: Core application tables

-- =====================================================
-- 1. APPLICATIONS TABLE (Main table)
-- =====================================================
CREATE TABLE applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Status & Metadata
  status VARCHAR(50) DEFAULT 'draft',
  current_step INTEGER DEFAULT 1,
  progress_percentage INTEGER DEFAULT 0,
  
  -- GHL Integration
  ghl_contact_id VARCHAR(255),
  
  -- Spanish Property Information
  urgency_level VARCHAR(20),
  purchase_price DECIMAL(12, 2),
  deposit_available DECIMAL(12, 2),
  property_address TEXT,
  property_type VARCHAR(50),
  home_status VARCHAR(50),
  
  -- Professional Contacts
  real_estate_agent_contact TEXT,
  lawyer_contact TEXT,
  
  -- Additional Information
  additional_notes TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  submitted_at TIMESTAMPTZ,
  
  -- Auto-save data
  draft_data JSONB
);

-- Indexes
CREATE INDEX idx_applications_status ON applications(status);
CREATE INDEX idx_applications_created_at ON applications(created_at);
CREATE INDEX idx_applications_ghl_contact_id ON applications(ghl_contact_id);

-- =====================================================
-- 2. APPLICANTS TABLE
-- =====================================================
CREATE TABLE applicants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID REFERENCES applications(id) ON DELETE CASCADE,
  
  -- Basic Information
  applicant_order INTEGER NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  date_of_birth DATE NOT NULL,
  age INTEGER,
  nationality VARCHAR(100),
  marital_status VARCHAR(50),
  
  -- Contact Information
  telephone VARCHAR(20),
  mobile VARCHAR(20) NOT NULL,
  email VARCHAR(255) NOT NULL,
  
  -- Current Residence
  current_address TEXT,
  time_at_current_address_years INTEGER,
  time_at_current_address_months INTEGER,
  previous_address TEXT,
  time_at_previous_address_years INTEGER,
  time_at_previous_address_months INTEGER,
  
  -- Tax & Ownership
  tax_country VARCHAR(100),
  homeowner_or_tenant VARCHAR(20),
  monthly_mortgage_or_rent DECIMAL(10, 2),
  current_property_value DECIMAL(12, 2),
  mortgage_outstanding DECIMAL(12, 2),
  lender_or_landlord_details TEXT,
  
  -- Employment Status
  employment_status VARCHAR(50),
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_applicants_application_id ON applicants(application_id);
CREATE INDEX idx_applicants_order ON applicants(application_id, applicant_order);

-- Unique constraint: one primary applicant per application
CREATE UNIQUE INDEX idx_primary_applicant ON applicants(application_id, applicant_order) 
WHERE applicant_order = 1;

-- =====================================================
-- 3. APPLICANT CHILDREN TABLE
-- =====================================================
CREATE TABLE applicant_children (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  applicant_id UUID REFERENCES applicants(id) ON DELETE CASCADE,
  
  age INTEGER NOT NULL,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index
CREATE INDEX idx_children_applicant_id ON applicant_children(applicant_id);

-- =====================================================
-- 4. EMPLOYMENT DETAILS TABLE
-- =====================================================
CREATE TABLE employment_details (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  applicant_id UUID REFERENCES applicants(id) ON DELETE CASCADE,
  
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
CREATE INDEX idx_employment_applicant_id ON employment_details(applicant_id);
CREATE UNIQUE INDEX idx_one_employment_per_applicant ON employment_details(applicant_id);

-- =====================================================
-- 5. FINANCIAL COMMITMENTS TABLE
-- =====================================================
CREATE TABLE financial_commitments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  applicant_id UUID REFERENCES applicants(id) ON DELETE CASCADE,
  
  personal_loans DECIMAL(10, 2) DEFAULT 0,
  credit_card_debt DECIMAL(10, 2) DEFAULT 0,
  car_loans_lease DECIMAL(10, 2) DEFAULT 0,
  total_monthly_commitments DECIMAL(10, 2),
  
  -- Legal Issues
  has_credit_or_legal_issues BOOLEAN DEFAULT FALSE,
  credit_legal_issues_details TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index
CREATE INDEX idx_commitments_applicant_id ON financial_commitments(applicant_id);
CREATE UNIQUE INDEX idx_one_commitment_per_applicant ON financial_commitments(applicant_id);

-- =====================================================
-- 6. RENTAL PROPERTIES TABLE
-- =====================================================
CREATE TABLE rental_properties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID REFERENCES applications(id) ON DELETE CASCADE,
  
  property_address TEXT NOT NULL,
  current_valuation DECIMAL(12, 2),
  mortgage_outstanding DECIMAL(12, 2),
  monthly_mortgage_payment DECIMAL(10, 2),
  monthly_rent_received DECIMAL(10, 2),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index
CREATE INDEX idx_rental_properties_application_id ON rental_properties(application_id);

-- =====================================================
-- 7. ADDITIONAL ASSETS TABLE
-- =====================================================
CREATE TABLE additional_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID REFERENCES applications(id) ON DELETE CASCADE,
  
  asset_description TEXT,
  estimated_value DECIMAL(12, 2),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index
CREATE INDEX idx_assets_application_id ON additional_assets(application_id);

-- =====================================================
-- 8. FORM PROGRESS TABLE
-- =====================================================
CREATE TABLE form_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID REFERENCES applications(id) ON DELETE CASCADE,
  
  last_completed_step INTEGER,
  step_data JSONB,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index
CREATE INDEX idx_progress_application_id ON form_progress(application_id);

-- =====================================================
-- FUNCTIONS & TRIGGERS
-- =====================================================

-- Function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers to all tables with updated_at
CREATE TRIGGER update_applications_updated_at 
  BEFORE UPDATE ON applications
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_applicants_updated_at 
  BEFORE UPDATE ON applicants
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_employment_updated_at 
  BEFORE UPDATE ON employment_details
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_commitments_updated_at 
  BEFORE UPDATE ON financial_commitments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_rental_updated_at 
  BEFORE UPDATE ON rental_properties
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_assets_updated_at 
  BEFORE UPDATE ON additional_assets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_progress_updated_at 
  BEFORE UPDATE ON form_progress
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to auto-calculate age from date of birth
CREATE OR REPLACE FUNCTION calculate_age()
RETURNS TRIGGER AS $$
BEGIN
  NEW.age = EXTRACT(YEAR FROM AGE(NEW.date_of_birth));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER calculate_applicant_age 
  BEFORE INSERT OR UPDATE ON applicants
  FOR EACH ROW EXECUTE FUNCTION calculate_age();

-- Function to auto-calculate total monthly commitments
CREATE OR REPLACE FUNCTION calculate_total_commitments()
RETURNS TRIGGER AS $$
BEGIN
  NEW.total_monthly_commitments = 
    COALESCE(NEW.personal_loans, 0) + 
    COALESCE(NEW.credit_card_debt, 0) + 
    COALESCE(NEW.car_loans_lease, 0);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER calculate_total_before_save 
  BEFORE INSERT OR UPDATE ON financial_commitments
  FOR EACH ROW EXECUTE FUNCTION calculate_total_commitments();

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE applicants ENABLE ROW LEVEL SECURITY;
ALTER TABLE applicant_children ENABLE ROW LEVEL SECURITY;
ALTER TABLE employment_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_commitments ENABLE ROW LEVEL SECURITY;
ALTER TABLE rental_properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE additional_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE form_progress ENABLE ROW LEVEL SECURITY;

-- Service role can do everything (for server-side operations)
CREATE POLICY "Service role full access on applications"
  ON applications FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access on applicants"
  ON applicants FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access on children"
  ON applicant_children FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access on employment"
  ON employment_details FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access on commitments"
  ON financial_commitments FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access on rentals"
  ON rental_properties FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access on assets"
  ON additional_assets FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access on progress"
  ON form_progress FOR ALL TO service_role USING (true) WITH CHECK (true);

-- =====================================================
-- COMMENTS
-- =====================================================
COMMENT ON TABLE applications IS 'Main application records for AIP form';
COMMENT ON TABLE applicants IS 'Applicant details (primary and co-applicants)';
COMMENT ON TABLE applicant_children IS 'Children information for each applicant';
COMMENT ON TABLE employment_details IS 'Employment and income information';
COMMENT ON TABLE financial_commitments IS 'Monthly financial commitments and obligations';
COMMENT ON TABLE rental_properties IS 'Buy-to-let and rental property portfolio';
COMMENT ON TABLE additional_assets IS 'Other assets and savings';
COMMENT ON TABLE form_progress IS 'Save and resume functionality tracking';
