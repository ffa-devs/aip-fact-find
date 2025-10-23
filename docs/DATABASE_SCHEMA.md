# AIP Form - Supabase Database Schema

## Overview
This schema is designed for scalability, data integrity, and easy querying. It normalizes the data to avoid repetition and supports multiple applicants and properties dynamically.

---

## Table Structure

### 1. `applications` (Main Application Table)
Primary table that holds the main application record.

```sql
CREATE TABLE applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Status & Metadata
  status VARCHAR(50) DEFAULT 'draft', -- draft, in_review, approved, rejected, incomplete
  current_step INTEGER DEFAULT 1,
  progress_percentage INTEGER DEFAULT 0,
  
  -- Spanish Property Information
  urgency_level VARCHAR(20), -- low, medium, high, very_high
  purchase_price DECIMAL(12, 2),
  deposit_available DECIMAL(12, 2),
  property_address TEXT,
  property_type VARCHAR(50), -- villa, apartment, townhouse, land, commercial, other
  home_status VARCHAR(50), -- primary_residence, second_home, investment
  
  -- Professional Contacts
  real_estate_agent_contact TEXT,
  lawyer_contact TEXT,
  
  -- Additional Information
  additional_notes TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  submitted_at TIMESTAMPTZ,
  
  -- User tracking (if using Supabase Auth)
  user_id UUID REFERENCES auth.users(id),
  
  -- Auto-save data (JSON for temporary storage)
  draft_data JSONB
);

-- Indexes
CREATE INDEX idx_applications_user_id ON applications(user_id);
CREATE INDEX idx_applications_status ON applications(status);
CREATE INDEX idx_applications_created_at ON applications(created_at);
```

---

### 2. `applicants` (Applicant Details)
Stores information for each applicant (primary and co-applicants).

```sql
CREATE TABLE applicants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID REFERENCES applications(id) ON DELETE CASCADE,
  
  -- Basic Information
  applicant_order INTEGER NOT NULL, -- 1 for primary, 2+ for co-applicants
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  date_of_birth DATE NOT NULL,
  age INTEGER, -- calculated field
  nationality VARCHAR(100),
  marital_status VARCHAR(50), -- single, married, civil_partnership, divorced, widowed
  
  -- Contact Information
  telephone VARCHAR(20),
  mobile VARCHAR(20) NOT NULL,
  email VARCHAR(255) NOT NULL,
  
  -- Current Residence
  current_address TEXT,
  time_at_current_address_years INTEGER,
  time_at_current_address_months INTEGER,
  
  -- Tax & Ownership
  tax_country VARCHAR(100),
  homeowner_or_tenant VARCHAR(20), -- homeowner, tenant
  monthly_mortgage_or_rent DECIMAL(10, 2),
  current_property_value DECIMAL(12, 2),
  mortgage_outstanding DECIMAL(12, 2),
  lender_or_landlord_details TEXT,
  
  -- Employment Status
  employment_status VARCHAR(50), -- employed, self_employed, director, retired, unemployed, other
  
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
```

---

### 3. `applicant_children` (Children Information)
Stores children data for each applicant.

```sql
CREATE TABLE applicant_children (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  applicant_id UUID REFERENCES applicants(id) ON DELETE CASCADE,
  
  age INTEGER NOT NULL,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index
CREATE INDEX idx_children_applicant_id ON applicant_children(applicant_id);
```

---

### 4. `employment_details` (Employment Information)
Stores employment details for employed applicants.

```sql
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
  previous_employment_details TEXT, -- if less than 3 years
  
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

-- One employment record per applicant
CREATE UNIQUE INDEX idx_one_employment_per_applicant ON employment_details(applicant_id);
```

---

### 5. `financial_commitments` (Monthly Outgoings)
Stores financial commitments for each applicant.

```sql
CREATE TABLE financial_commitments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  applicant_id UUID REFERENCES applicants(id) ON DELETE CASCADE,
  
  personal_loans DECIMAL(10, 2) DEFAULT 0,
  credit_card_debt DECIMAL(10, 2) DEFAULT 0,
  car_loans_lease DECIMAL(10, 2) DEFAULT 0,
  total_monthly_commitments DECIMAL(10, 2), -- calculated field
  
  -- Legal Issues
  has_credit_or_legal_issues BOOLEAN DEFAULT FALSE,
  credit_legal_issues_details TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index
CREATE INDEX idx_commitments_applicant_id ON financial_commitments(applicant_id);

-- One record per applicant
CREATE UNIQUE INDEX idx_one_commitment_per_applicant ON financial_commitments(applicant_id);
```

---

### 6. `rental_properties` (Buy-to-Let Portfolio)
Stores rental/investment property details.

```sql
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
```

---

### 7. `additional_assets` (Other Assets)
Stores information about savings, investments, and other assets.

```sql
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
```

---

### 8. `form_progress` (Save & Resume Functionality)
Tracks user progress and allows resuming incomplete applications.

```sql
CREATE TABLE form_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID REFERENCES applications(id) ON DELETE CASCADE,
  
  last_completed_step INTEGER,
  step_data JSONB, -- stores the data for the current step
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index
CREATE INDEX idx_progress_application_id ON form_progress(application_id);
```

---

## Row Level Security (RLS) Policies

### Enable RLS on all tables
```sql
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE applicants ENABLE ROW LEVEL SECURITY;
ALTER TABLE applicant_children ENABLE ROW LEVEL SECURITY;
ALTER TABLE employment_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_commitments ENABLE ROW LEVEL SECURITY;
ALTER TABLE rental_properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE additional_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE form_progress ENABLE ROW LEVEL SECURITY;
```

### Applications Policies
```sql
-- Users can view their own applications
CREATE POLICY "Users can view own applications"
  ON applications FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own applications
CREATE POLICY "Users can create own applications"
  ON applications FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own applications
CREATE POLICY "Users can update own applications"
  ON applications FOR UPDATE
  USING (auth.uid() = user_id);
```

### Applicants Policies
```sql
-- Users can view applicants for their applications
CREATE POLICY "Users can view applicants for their applications"
  ON applicants FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM applications
      WHERE applications.id = applicants.application_id
      AND applications.user_id = auth.uid()
    )
  );

-- Users can insert applicants for their applications
CREATE POLICY "Users can insert applicants for their applications"
  ON applicants FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM applications
      WHERE applications.id = applicants.application_id
      AND applications.user_id = auth.uid()
    )
  );

-- Users can update applicants for their applications
CREATE POLICY "Users can update applicants for their applications"
  ON applicants FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM applications
      WHERE applications.id = applicants.application_id
      AND applications.user_id = auth.uid()
    )
  );
```

### Similar policies for other tables
```sql
-- Apply similar RLS policies for:
-- applicant_children, employment_details, financial_commitments,
-- rental_properties, additional_assets, form_progress
-- (following the same pattern as applicants)
```

---

## Database Functions & Triggers

### Auto-update `updated_at` timestamp
```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all tables
CREATE TRIGGER update_applications_updated_at BEFORE UPDATE ON applications
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_applicants_updated_at BEFORE UPDATE ON applicants
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- (repeat for other tables)
```

### Auto-calculate age from date of birth
```sql
CREATE OR REPLACE FUNCTION calculate_age()
RETURNS TRIGGER AS $$
BEGIN
  NEW.age = EXTRACT(YEAR FROM AGE(NEW.date_of_birth));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER calculate_applicant_age BEFORE INSERT OR UPDATE ON applicants
  FOR EACH ROW EXECUTE FUNCTION calculate_age();
```

### Auto-calculate total monthly commitments
```sql
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

CREATE TRIGGER calculate_total_before_save BEFORE INSERT OR UPDATE ON financial_commitments
  FOR EACH ROW EXECUTE FUNCTION calculate_total_commitments();
```

---

## Useful Views

### Complete Application View
```sql
CREATE VIEW complete_applications AS
SELECT 
  a.*,
  json_agg(
    json_build_object(
      'id', ap.id,
      'name', ap.first_name || ' ' || ap.last_name,
      'email', ap.email,
      'age', ap.age,
      'employment_status', ap.employment_status
    )
  ) as applicants
FROM applications a
LEFT JOIN applicants ap ON a.id = ap.application_id
GROUP BY a.id;
```

---

## Migration Strategy

### Phase 1: Create Tables
1. Create all tables in order (respecting foreign key dependencies)
2. Enable RLS on all tables
3. Create RLS policies

### Phase 2: Create Functions & Triggers
1. Create utility functions (update timestamps, calculate fields)
2. Create triggers

### Phase 3: Create Views
1. Create helpful views for querying

### Phase 4: Seed Initial Data (if needed)
1. Create lookup tables for dropdowns (if not hardcoded in frontend)

---

## API Usage Examples

### Create a new application
```typescript
const { data, error } = await supabase
  .from('applications')
  .insert({
    status: 'draft',
    current_step: 1,
    user_id: user.id
  })
  .select()
  .single();
```

### Add primary applicant
```typescript
const { data, error } = await supabase
  .from('applicants')
  .insert({
    application_id: applicationId,
    applicant_order: 1,
    first_name: 'John',
    last_name: 'Doe',
    date_of_birth: '1990-01-01',
    mobile: '+34123456789',
    email: 'john@example.com',
    nationality: 'UK',
    marital_status: 'single'
  });
```

### Add co-applicant
```typescript
const { data, error } = await supabase
  .from('applicants')
  .insert({
    application_id: applicationId,
    applicant_order: 2, // co-applicant
    first_name: 'Jane',
    last_name: 'Doe',
    // ... other fields
  });
```

### Add rental property
```typescript
const { data, error } = await supabase
  .from('rental_properties')
  .insert({
    application_id: applicationId,
    property_address: '123 Main St, London',
    current_valuation: 500000,
    monthly_rent_received: 2000
  });
```

### Update application progress
```typescript
const { data, error } = await supabase
  .from('applications')
  .update({
    current_step: 5,
    progress_percentage: 40
  })
  .eq('id', applicationId);
```

### Get complete application with all related data
```typescript
const { data, error } = await supabase
  .from('applications')
  .select(`
    *,
    applicants (
      *,
      applicant_children (*),
      employment_details (*),
      financial_commitments (*)
    ),
    rental_properties (*),
    additional_assets (*)
  `)
  .eq('id', applicationId)
  .single();
```

---

## Performance Considerations

1. **Indexing**: All foreign keys are indexed for fast joins
2. **Pagination**: Use `.range()` for large datasets
3. **Selective Queries**: Only select needed columns
4. **Caching**: Cache static data (countries, property types) in frontend
5. **Batch Operations**: Use `.insert([...])` for multiple records

---

## Data Validation

### Frontend Validation
- Required fields
- Email format
- Phone number format
- Date ranges
- Numeric ranges (percentages, currency)

### Database Constraints
```sql
-- Add constraints to ensure data quality
ALTER TABLE applicants 
  ADD CONSTRAINT valid_email CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');

ALTER TABLE applicants
  ADD CONSTRAINT valid_age CHECK (age >= 18 AND age <= 100);

ALTER TABLE employment_details
  ADD CONSTRAINT valid_stake CHECK (company_stake_percentage >= 0 AND company_stake_percentage <= 100);
```

---

## Backup & Recovery

1. Enable Point-in-Time Recovery (PITR) in Supabase
2. Regular backups (daily recommended)
3. Test restore procedures
4. Export critical data periodically

---

## Next Steps

1. Review and adjust schema based on business requirements
2. Create TypeScript types from database schema
3. Set up Supabase client in Next.js app
4. Implement form state management (React Hook Form + Zustand/Context)
5. Build UI components for each step
6. Implement auto-save functionality
7. Add email notifications for application status changes
