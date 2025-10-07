# AIP Form - Supabase Database Schema

## Overview
This schema supports a **two-stage application process**:
1. **Agent-initiated**: Data collected during GHL call by agent
2. **Applicant completion**: Self-service via magic link

The schema is designed for scalability, data integrity, and easy querying. It normalizes the data to avoid repetition and supports multiple applicants and properties dynamically.

---

## Workflow Integration

### Stage 1: GHL → Agent Call → Database
1. Lead captured in GHL (name, email, phone, residence)
2. Call scheduled and completed by agent
3. Agent fills form, creates application record in Supabase
4. Application marked as `agent_initiated`
5. Magic link token generated and sent to applicant

### Stage 2: Magic Link → Applicant Completion
1. Applicant clicks magic link from email
2. Token validated, application loaded
3. Applicant reviews agent-collected data
4. Applicant fills missing information
5. Applicant uploads documents
6. Application submitted → status changes to `submitted`
7. GHL pipeline updated via webhook

---

## Table Structure

### 1. `applications` (Main Application Table)
Primary table that holds the main application record.

```sql
CREATE TABLE applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- GHL Integration
  ghl_contact_id VARCHAR(255), -- GoHighLevel contact ID
  ghl_opportunity_id VARCHAR(255), -- GoHighLevel opportunity ID
  
  -- Status & Metadata
  status VARCHAR(50) DEFAULT 'agent_initiated', 
  -- Statuses: agent_initiated, applicant_in_progress, submitted, 
  --           in_review, approved, rejected, incomplete
  
  source VARCHAR(50) DEFAULT 'agent_call', -- agent_call, self_service, api
  current_step INTEGER DEFAULT 1,
  progress_percentage INTEGER DEFAULT 0,
  
  -- Agent Information
  agent_id UUID, -- reference to agent/user who created
  agent_name VARCHAR(255),
  agent_notes TEXT, -- notes from the call
  call_date TIMESTAMPTZ,
  
  -- Spanish Property Information
  urgency_level VARCHAR(20), -- low, medium, high, very_high
  purchase_price DECIMAL(12, 2),
  deposit_available DECIMAL(12, 2),
  deposit_source TEXT, -- savings, property_sale, gift, other
  property_address TEXT,
  property_type VARCHAR(50), -- villa, apartment, townhouse, land, commercial, other
  home_status VARCHAR(50), -- primary_residence, second_home, investment
  has_specific_property BOOLEAN DEFAULT FALSE,
  property_listing_url TEXT,
  
  -- Professional Contacts
  real_estate_agent_contact TEXT,
  has_lawyer BOOLEAN,
  lawyer_contact TEXT,
  
  -- Additional Information
  additional_notes TEXT, -- applicant's final notes
  applicant_questions TEXT, -- questions from applicant
  
  -- Completion Tracking
  sections_completed JSONB, -- {"personal_details": true, "employment": false, ...}
  required_documents JSONB, -- list of required docs based on employment type
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  agent_completed_at TIMESTAMPTZ, -- when agent finished their part
  applicant_started_at TIMESTAMPTZ, -- when applicant first accessed magic link
  submitted_at TIMESTAMPTZ,
  reviewed_at TIMESTAMPTZ,
  
  -- User tracking (if using Supabase Auth)
  user_id UUID REFERENCES auth.users(id),
  
  -- Auto-save data (JSON for temporary storage)
  draft_data JSONB
);

-- Indexes
CREATE INDEX idx_applications_user_id ON applications(user_id);
CREATE INDEX idx_applications_status ON applications(status);
CREATE INDEX idx_applications_created_at ON applications(created_at);
CREATE INDEX idx_applications_ghl_contact ON applications(ghl_contact_id);
CREATE INDEX idx_applications_ghl_opportunity ON applications(ghl_opportunity_id);
CREATE INDEX idx_applications_agent_id ON applications(agent_id);
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
  previous_address TEXT,
  time_at_previous_address_years INTEGER,
  time_at_previous_address_months INTEGER,
  
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

### 8. `magic_links` (Magic Link Tokens)
Stores magic link tokens for secure, passwordless access to applications.

```sql
CREATE TABLE magic_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID REFERENCES applications(id) ON DELETE CASCADE,
  
  token VARCHAR(255) UNIQUE NOT NULL, -- secure random token
  
  -- Status tracking
  is_used BOOLEAN DEFAULT FALSE,
  used_at TIMESTAMPTZ,
  
  -- Expiry
  expires_at TIMESTAMPTZ NOT NULL, -- typically 30 days from creation
  
  -- Access tracking
  first_accessed_at TIMESTAMPTZ,
  last_accessed_at TIMESTAMPTZ,
  access_count INTEGER DEFAULT 0,
  
  -- Metadata
  sent_to_email VARCHAR(255),
  ip_address INET,
  user_agent TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_magic_links_token ON magic_links(token);
CREATE INDEX idx_magic_links_application_id ON magic_links(application_id);
CREATE INDEX idx_magic_links_expires_at ON magic_links(expires_at);

-- Unique constraint: one active token per application
CREATE UNIQUE INDEX idx_one_active_token_per_app ON magic_links(application_id) 
WHERE is_used = FALSE AND expires_at > NOW();
```

---

### 9. `application_documents` (Document Uploads)
Stores uploaded documents for each application.

```sql
CREATE TABLE application_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID REFERENCES applications(id) ON DELETE CASCADE,
  applicant_id UUID REFERENCES applicants(id), -- optional: which applicant this belongs to
  
  -- Document Info
  document_type VARCHAR(100) NOT NULL, 
  -- payslip, tax_return, bank_statement, passport, proof_of_address, 
  -- business_accounts, other
  
  document_category VARCHAR(50), -- employment, identity, financial, property
  
  -- File Info
  file_name VARCHAR(255) NOT NULL,
  file_size_bytes INTEGER,
  file_type VARCHAR(100), -- pdf, jpg, png, etc.
  storage_path TEXT NOT NULL, -- Supabase Storage path
  storage_bucket VARCHAR(100) DEFAULT 'application-documents',
  
  -- Metadata
  description TEXT,
  uploaded_by VARCHAR(50), -- agent, applicant
  
  -- Verification
  is_verified BOOLEAN DEFAULT FALSE,
  verified_by UUID,
  verified_at TIMESTAMPTZ,
  verification_notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_documents_application_id ON application_documents(application_id);
CREATE INDEX idx_documents_applicant_id ON application_documents(applicant_id);
CREATE INDEX idx_documents_type ON application_documents(document_type);
```

---

### 10. `application_activity_log` (Audit Trail)
Tracks all changes to applications for compliance and debugging.

```sql
CREATE TABLE application_activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID REFERENCES applications(id) ON DELETE CASCADE,
  
  -- Activity Details
  activity_type VARCHAR(100) NOT NULL, 
  -- created, updated, status_changed, document_uploaded, 
  -- magic_link_sent, magic_link_accessed, submitted, reviewed
  
  actor_type VARCHAR(50), -- agent, applicant, system
  actor_id UUID, -- user_id or agent_id
  actor_name VARCHAR(255),
  
  -- Change Tracking
  field_changed VARCHAR(255),
  old_value TEXT,
  new_value TEXT,
  
  -- Context
  description TEXT,
  metadata JSONB, -- additional context
  
  ip_address INET,
  user_agent TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_activity_log_application_id ON application_activity_log(application_id);
CREATE INDEX idx_activity_log_created_at ON application_activity_log(created_at);
CREATE INDEX idx_activity_log_activity_type ON application_activity_log(activity_type);
```

---

### 11. `form_progress` (Auto-save Functionality)
Tracks user progress and allows resuming incomplete applications.

```sql
CREATE TABLE form_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID REFERENCES applications(id) ON DELETE CASCADE,
  
  last_completed_step INTEGER,
  last_active_step INTEGER, -- current step they're viewing
  step_data JSONB, -- stores the data for the current step
  
  -- Session info
  last_saved_at TIMESTAMPTZ DEFAULT NOW(),
  session_id VARCHAR(255),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index
CREATE INDEX idx_progress_application_id ON form_progress(application_id);

-- One progress record per application
CREATE UNIQUE INDEX idx_one_progress_per_application ON form_progress(application_id);
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
ALTER TABLE magic_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE application_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE application_activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE form_progress ENABLE ROW LEVEL SECURITY;
```

### Applications Policies
```sql
-- Users can view their own applications
CREATE POLICY "Users can view own applications"
  ON applications FOR SELECT
  USING (auth.uid() = user_id);

-- Agents can view applications they created
CREATE POLICY "Agents can view their applications"
  ON applications FOR SELECT
  USING (auth.uid() = agent_id);

-- Users can insert their own applications
CREATE POLICY "Users can create own applications"
  ON applications FOR INSERT
  WITH CHECK (auth.uid() = user_id OR auth.uid() = agent_id);

-- Users can update their own applications
CREATE POLICY "Users can update own applications"
  ON applications FOR UPDATE
  USING (auth.uid() = user_id);

-- Agents can update applications they created
CREATE POLICY "Agents can update their applications"
  ON applications FOR UPDATE
  USING (auth.uid() = agent_id);
```

### Magic Links Policies
```sql
-- Anyone can validate a magic link token (needed for passwordless access)
CREATE POLICY "Anyone can read valid magic links"
  ON magic_links FOR SELECT
  USING (is_used = FALSE AND expires_at > NOW());

-- Only agents/system can create magic links
CREATE POLICY "Agents can create magic links"
  ON magic_links FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM applications
      WHERE applications.id = magic_links.application_id
      AND applications.agent_id = auth.uid()
    )
  );

-- System can update magic links (mark as used)
CREATE POLICY "System can update magic links"
  ON magic_links FOR UPDATE
  USING (true); -- Or restrict to service role
```

### Application Documents Policies
```sql
-- Users can view documents for their applications
CREATE POLICY "Users can view application documents"
  ON application_documents FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM applications
      WHERE applications.id = application_documents.application_id
      AND (applications.user_id = auth.uid() OR applications.agent_id = auth.uid())
    )
  );

-- Users can upload documents to their applications
CREATE POLICY "Users can upload documents"
  ON application_documents FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM applications
      WHERE applications.id = application_documents.application_id
      AND (applications.user_id = auth.uid() OR applications.agent_id = auth.uid())
    )
  );
```

### Activity Log Policies
```sql
-- Users and agents can view activity for their applications
CREATE POLICY "Users can view application activity"
  ON application_activity_log FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM applications
      WHERE applications.id = application_activity_log.application_id
      AND (applications.user_id = auth.uid() OR applications.agent_id = auth.uid())
    )
  );

-- System can insert activity logs
CREATE POLICY "System can create activity logs"
  ON application_activity_log FOR INSERT
  WITH CHECK (true); -- Typically done by service role
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

## Magic Link Functions

### Generate Magic Link Token
```sql
CREATE OR REPLACE FUNCTION generate_magic_link(p_application_id UUID, p_email VARCHAR)
RETURNS TABLE(token VARCHAR, expires_at TIMESTAMPTZ) AS $$
DECLARE
  v_token VARCHAR;
  v_expires_at TIMESTAMPTZ;
BEGIN
  -- Generate secure random token
  v_token := encode(gen_random_bytes(32), 'base64');
  v_token := replace(replace(replace(v_token, '/', '_'), '+', '-'), '=', '');
  
  -- Set expiry to 30 days from now
  v_expires_at := NOW() + INTERVAL '30 days';
  
  -- Insert magic link
  INSERT INTO magic_links (application_id, token, expires_at, sent_to_email)
  VALUES (p_application_id, v_token, v_expires_at, p_email);
  
  -- Return token and expiry
  RETURN QUERY SELECT v_token, v_expires_at;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### Validate Magic Link Token
```sql
CREATE OR REPLACE FUNCTION validate_magic_link(p_token VARCHAR)
RETURNS TABLE(
  is_valid BOOLEAN,
  application_id UUID,
  message VARCHAR
) AS $$
DECLARE
  v_link RECORD;
BEGIN
  -- Find the magic link
  SELECT * INTO v_link
  FROM magic_links
  WHERE token = p_token;
  
  -- Check if token exists
  IF NOT FOUND THEN
    RETURN QUERY SELECT FALSE, NULL::UUID, 'Invalid token'::VARCHAR;
    RETURN;
  END IF;
  
  -- Check if already used
  IF v_link.is_used THEN
    RETURN QUERY SELECT FALSE, v_link.application_id, 'Token already used'::VARCHAR;
    RETURN;
  END IF;
  
  -- Check if expired
  IF v_link.expires_at < NOW() THEN
    RETURN QUERY SELECT FALSE, v_link.application_id, 'Token expired'::VARCHAR;
    RETURN;
  END IF;
  
  -- Update access tracking
  UPDATE magic_links
  SET 
    access_count = access_count + 1,
    last_accessed_at = NOW(),
    first_accessed_at = COALESCE(first_accessed_at, NOW())
  WHERE id = v_link.id;
  
  -- Update application if first access
  IF v_link.first_accessed_at IS NULL THEN
    UPDATE applications
    SET applicant_started_at = NOW()
    WHERE id = v_link.application_id;
  END IF;
  
  -- Return success
  RETURN QUERY SELECT TRUE, v_link.application_id, 'Valid token'::VARCHAR;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### Mark Magic Link as Used
```sql
CREATE OR REPLACE FUNCTION mark_magic_link_used(p_token VARCHAR)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE magic_links
  SET 
    is_used = TRUE,
    used_at = NOW()
  WHERE token = p_token;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## Activity Logging Functions

### Log Application Activity
```sql
CREATE OR REPLACE FUNCTION log_application_activity(
  p_application_id UUID,
  p_activity_type VARCHAR,
  p_actor_type VARCHAR,
  p_actor_id UUID DEFAULT NULL,
  p_actor_name VARCHAR DEFAULT NULL,
  p_description TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_log_id UUID;
BEGIN
  INSERT INTO application_activity_log (
    application_id,
    activity_type,
    actor_type,
    actor_id,
    actor_name,
    description,
    metadata
  )
  VALUES (
    p_application_id,
    p_activity_type,
    p_actor_type,
    p_actor_id,
    p_actor_name,
    p_description,
    p_metadata
  )
  RETURNING id INTO v_log_id;
  
  RETURN v_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## GHL Webhook Integration

### Webhook Handler Function
```sql
CREATE OR REPLACE FUNCTION handle_ghl_webhook(p_payload JSONB)
RETURNS JSONB AS $$
DECLARE
  v_event_type VARCHAR;
  v_contact_id VARCHAR;
  v_application_id UUID;
BEGIN
  -- Extract event type
  v_event_type := p_payload->>'event_type';
  v_contact_id := p_payload->'contact'->>'id';
  
  -- Handle different webhook events
  CASE v_event_type
    WHEN 'call_completed' THEN
      -- Find or create application for this GHL contact
      SELECT id INTO v_application_id
      FROM applications
      WHERE ghl_contact_id = v_contact_id;
      
      IF v_application_id IS NULL THEN
        -- Create new application
        INSERT INTO applications (
          ghl_contact_id,
          ghl_opportunity_id,
          status,
          call_date,
          agent_notes
        )
        VALUES (
          v_contact_id,
          p_payload->'opportunity'->>'id',
          'agent_initiated',
          NOW(),
          p_payload->>'notes'
        )
        RETURNING id INTO v_application_id;
      END IF;
      
      -- Log activity
      PERFORM log_application_activity(
        v_application_id,
        'call_completed',
        'system',
        NULL,
        'GHL Webhook',
        'Call completed, ready for magic link',
        p_payload
      );
      
    WHEN 'opportunity_status_changed' THEN
      -- Update application status based on GHL pipeline
      UPDATE applications
      SET updated_at = NOW()
      WHERE ghl_opportunity_id = p_payload->'opportunity'->>'id';
      
    ELSE
      -- Unknown event type
      NULL;
  END CASE;
  
  RETURN jsonb_build_object(
    'success', TRUE,
    'application_id', v_application_id,
    'event_type', v_event_type
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
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

### Agent Creates Application (After Call)
```typescript
// 1. Create the main application
const { data: application, error } = await supabase
  .from('applications')
  .insert({
    ghl_contact_id: contactId,
    ghl_opportunity_id: opportunityId,
    status: 'agent_initiated',
    source: 'agent_call',
    agent_id: agentUserId,
    agent_name: 'John Smith',
    call_date: new Date().toISOString(),
    agent_notes: 'Client interested in villa in Marbella...',
    urgency_level: 'high',
    purchase_price: 650000,
    property_type: 'villa'
  })
  .select()
  .single();

// 2. Add primary applicant (from GHL + call)
const { data: primaryApplicant } = await supabase
  .from('applicants')
  .insert({
    application_id: application.id,
    applicant_order: 1,
    first_name: 'John',
    last_name: 'Doe',
    date_of_birth: '1985-05-15',
    nationality: 'UK',
    marital_status: 'married',
    mobile: '+447123456789',
    email: 'john.doe@email.com',
    employment_status: 'employed'
  });

// 3. Generate magic link
const { data: magicLink } = await supabase
  .rpc('generate_magic_link', {
    p_application_id: application.id,
    p_email: 'john.doe@email.com'
  });

// 4. Send email with magic link (via your email service)
const magicLinkUrl = `https://app.yourdomain.com/complete?token=${magicLink.token}`;

// 5. Log activity
await supabase.rpc('log_application_activity', {
  p_application_id: application.id,
  p_activity_type: 'magic_link_sent',
  p_actor_type: 'agent',
  p_actor_id: agentUserId,
  p_actor_name: 'John Smith',
  p_description: 'Magic link sent to applicant',
  p_metadata: { email: 'john.doe@email.com' }
});
```

### Applicant Accesses Magic Link
```typescript
// 1. Validate token
const { data: validation } = await supabase
  .rpc('validate_magic_link', {
    p_token: tokenFromUrl
  });

if (!validation[0].is_valid) {
  // Show error: token invalid/expired
  console.error(validation[0].message);
  return;
}

const applicationId = validation[0].application_id;

// 2. Load application with all related data
const { data: fullApplication } = await supabase
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
    additional_assets (*),
    application_documents (*)
  `)
  .eq('id', applicationId)
  .single();

// 3. Create/authenticate user (if needed)
// ... Supabase Auth logic ...
```

### Applicant Updates Information
```typescript
// Update applicant details
const { data, error } = await supabase
  .from('applicants')
  .update({
    current_address: '123 High Street, London, UK',
    time_at_current_address_years: 5,
    homeowner_or_tenant: 'homeowner',
    monthly_mortgage_or_rent: 1500,
    current_property_value: 450000,
    mortgage_outstanding: 200000
  })
  .eq('id', applicantId);

// Update application progress
await supabase
  .from('applications')
  .update({
    current_step: 5,
    progress_percentage: 45,
    sections_completed: {
      personal_details: true,
      contact_info: true,
      current_residence: true,
      employment: false,
      financial: false
    }
  })
  .eq('id', applicationId);
```

### Upload Document
```typescript
// 1. Upload file to Supabase Storage
const { data: uploadData, error: uploadError } = await supabase
  .storage
  .from('application-documents')
  .upload(`${applicationId}/${fileName}`, file);

// 2. Create document record
const { data: document } = await supabase
  .from('application_documents')
  .insert({
    application_id: applicationId,
    applicant_id: applicantId,
    document_type: 'payslip',
    document_category: 'employment',
    file_name: fileName,
    file_size_bytes: file.size,
    file_type: file.type,
    storage_path: uploadData.path,
    uploaded_by: 'applicant'
  });

// 3. Log activity
await supabase.rpc('log_application_activity', {
  p_application_id: applicationId,
  p_activity_type: 'document_uploaded',
  p_actor_type: 'applicant',
  p_description: `Uploaded ${fileName}`,
  p_metadata: { document_type: 'payslip', file_size: file.size }
});
```

### Submit Application
```typescript
// 1. Mark application as submitted
const { data, error } = await supabase
  .from('applications')
  .update({
    status: 'submitted',
    submitted_at: new Date().toISOString(),
    progress_percentage: 100
  })
  .eq('id', applicationId);

// 2. Mark magic link as used
await supabase.rpc('mark_magic_link_used', {
  p_token: token
});

// 3. Log activity
await supabase.rpc('log_application_activity', {
  p_application_id: applicationId,
  p_activity_type: 'submitted',
  p_actor_type: 'applicant',
  p_description: 'Application submitted for review'
});

// 4. Trigger webhook to update GHL
await fetch('/api/webhooks/update-ghl', {
  method: 'POST',
  body: JSON.stringify({
    opportunity_id: application.ghl_opportunity_id,
    status: 'Application Submitted',
    reference_number: `AIP-${application.id.slice(0, 8)}`
  })
});
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
