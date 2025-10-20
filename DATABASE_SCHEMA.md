# 🗄️ AIP Fact Find Database Schema (Current)

**Last Updated:** October 17, 2025  
**Schema Version:** Migration 013 (Latest)

## 📋 Overview

The database follows a **normalized schema** supporting **one person, multiple applications**. This allows returning customers to apply for multiple properties over time while maintaining their contact information.

---

## 🏗️ Core Tables

### 1. `applications`
**Main application records**

```sql
CREATE TABLE applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Application Status
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'in_review', 'approved', 'rejected')),
  current_step INTEGER DEFAULT 1,
  progress_percentage INTEGER DEFAULT 0,
  
  -- GHL Integration
  ghl_contact_id VARCHAR(255),
  ghl_opportunity_id VARCHAR(255),
  
  -- Step 6 - Spanish Property Details
  urgency_level VARCHAR(20),
  purchase_price DECIMAL(12, 2),
  deposit_available DECIMAL(12, 2),
  property_address TEXT,
  property_type VARCHAR(50),
  home_status VARCHAR(50),
  real_estate_agent_contact TEXT,
  lawyer_contact TEXT,
  additional_notes TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  submitted_at TIMESTAMPTZ
);
```

### 2. `people`
**Core person identity data (never duplicated)**

```sql
CREATE TABLE people (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Core Identity (immutable)
  email VARCHAR(255) UNIQUE NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  date_of_birth DATE NOT NULL,
  
  -- Contact Information (updatable)
  telephone VARCHAR(20),
  mobile VARCHAR(20) NOT NULL,
  nationality VARCHAR(100),
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 3. `application_participants`
**Junction table linking people to applications**

```sql
CREATE TABLE application_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Foreign Keys
  application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  person_id UUID NOT NULL REFERENCES people(id) ON DELETE CASCADE,
  
  -- Participant Role
  participant_role VARCHAR(20) NOT NULL CHECK (participant_role IN ('primary', 'co-applicant')),
  participant_order INTEGER NOT NULL,
  
  -- Application-specific data
  marital_status VARCHAR(50),
  age INTEGER,
  
  -- Current Residence (per application)
  current_address TEXT,
  time_at_current_address_years INTEGER,
  time_at_current_address_months INTEGER,
  previous_address TEXT,
  time_at_previous_address_years INTEGER,
  time_at_previous_address_months INTEGER,
  
  -- Tax & Property (per application)
  tax_country VARCHAR(100),
  homeowner_or_tenant VARCHAR(20),
  monthly_mortgage_or_rent DECIMAL(10, 2),
  current_property_value DECIMAL(12, 2),
  mortgage_outstanding DECIMAL(12, 2),
  lender_or_landlord_details TEXT,
  
  -- Employment (per application)
  employment_status VARCHAR(50),
  
  -- Co-applicant specific
  relationship_to_primary VARCHAR(50),
  same_address_as_primary BOOLEAN DEFAULT TRUE,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(application_id, person_id),
  UNIQUE(application_id, participant_role, participant_order)
);
```

---

## 👨‍👩‍👧‍👦 Child & Family Tables

### 4. `person_children`
**Children data tied to people (not applications)**

```sql
CREATE TABLE person_children (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  person_id UUID NOT NULL REFERENCES people(id) ON DELETE CASCADE,
  
  -- Child details
  date_of_birth DATE,
  age INTEGER, -- Can be calculated from date_of_birth
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 💼 Employment & Financial Tables

### 5. `employment_details`
**Employment information per participant**

```sql
CREATE TABLE employment_details (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_id UUID NOT NULL REFERENCES application_participants(id) ON DELETE CASCADE,
  
  -- Employed fields
  job_title VARCHAR(255),
  employer_name VARCHAR(255),
  employer_address TEXT,
  gross_annual_salary DECIMAL(12, 2),
  net_monthly_income DECIMAL(12, 2),
  employment_start_date DATE,
  previous_employment_details TEXT,
  
  -- Self-employed/Director fields
  business_name VARCHAR(255),
  business_address TEXT,
  business_website VARCHAR(255),
  company_creation_date DATE,
  total_gross_annual_income DECIMAL(12, 2),
  net_annual_income DECIMAL(12, 2),
  bonus_overtime_commission_details TEXT,
  company_stake_percentage DECIMAL(5, 2),
  accountant_can_provide_info BOOLEAN DEFAULT FALSE,
  accountant_contact_details TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 6. `financial_commitments`
**Financial obligations per participant**

```sql
CREATE TABLE financial_commitments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_id UUID NOT NULL REFERENCES application_participants(id) ON DELETE CASCADE,
  
  -- Debt information
  personal_loans DECIMAL(12, 2) DEFAULT 0,
  credit_card_debt DECIMAL(12, 2) DEFAULT 0,
  car_loans_lease DECIMAL(12, 2) DEFAULT 0,
  
  -- Legal/Credit issues
  has_credit_or_legal_issues BOOLEAN DEFAULT FALSE,
  credit_legal_issues_details TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 🏘️ Property & Asset Tables

### 7. `rental_properties`
**Rental property portfolio per application**

```sql
CREATE TABLE rental_properties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  
  -- Property details
  property_address TEXT NOT NULL,
  current_valuation DECIMAL(12, 2),
  mortgage_outstanding DECIMAL(12, 2),
  monthly_mortgage_payment DECIMAL(10, 2),
  monthly_rent_received DECIMAL(10, 2),
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 8. `additional_assets`
**Other assets per application**

```sql
CREATE TABLE additional_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  
  -- Asset description
  asset_description TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 🔐 Authentication & Utility Tables

### 9. `form_progress`
**Save form progress for resumption**

```sql
CREATE TABLE form_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  
  -- Progress tracking
  last_completed_step INTEGER,
  step_data JSONB,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 10. `verification_codes`
**Email verification for application access**

```sql
CREATE TABLE verification_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  
  -- Verification details
  email VARCHAR(255) NOT NULL,
  code VARCHAR(6) NOT NULL,
  
  -- Security
  expires_at TIMESTAMPTZ NOT NULL,
  verified_at TIMESTAMPTZ,
  attempts INTEGER DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 11. `ghl_oauth_tokens`
**GoHighLevel API integration**

```sql
CREATE TABLE ghl_oauth_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- OAuth tokens
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  token_type VARCHAR(50) DEFAULT 'Bearer',
  expires_in INTEGER,
  expires_at TIMESTAMPTZ,
  scope TEXT,
  location_id VARCHAR(255),
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 🔗 Data Relationships

```
┌─────────────┐    ┌──────────────────────────┐    ┌──────────────┐
│   people    │────│ application_participants │────│ applications │
│             │    │                          │    │              │
│ • email     │    │ • participant_role       │    │ • status     │
│ • name      │    │ • participant_order      │    │ • step6_data │
│ • contact   │    │ • address_data          │    │ • ghl_ids    │
└─────────────┘    └──────────────────────────┘    └──────────────┘
       │                       │
       │                       ├─── employment_details
       │                       ├─── financial_commitments
       │                       
       └─── person_children
```

---

## 🎯 Key Features

### ✅ **One Person, Multiple Applications**
- Person identity stored once in `people` table
- Each application links via `application_participants`
- No duplicate contact information

### ✅ **Proper Co-Applicant Support** 
- Co-applicants are separate `people` records
- Linked to applications via `application_participants`
- Can have different addresses, employment, etc.

### ✅ **Children Tied to People**
- `person_children` table links to `people` (not applications)
- Children are part of core identity, not application-specific

### ✅ **Application-Specific Data**
- Address, employment, financial data in `application_participants`
- Property portfolio in `rental_properties` per application
- Form progress tracking for resumption

### ✅ **GHL Integration Ready**
- `ghl_contact_id` and `ghl_opportunity_id` in applications
- OAuth token storage for API access
- Pipeline stage tracking capabilities

---

## 📊 Indexes & Performance

**Key Indexes:**
- `people(email)` - Fast email lookups
- `application_participants(application_id, person_id)` - Join optimization
- `application_participants(participant_role, participant_order)` - Ordering
- All foreign key columns indexed automatically

**RLS Policies:**
- Service role full access on all tables
- Ready for user-level policies if needed

---

## 🚀 Migration Status

**Latest Migration:** `013_fix_applicant_children_rls.sql`
- ✅ Schema fully normalized
- ✅ Children properly tied to people
- ✅ All foreign keys and constraints in place
- ✅ RLS policies configured
- ✅ Performance indexes created

**Ready for production use!** 🎉