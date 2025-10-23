// Type definitions for the AIP application form

export type ApplicationStatus = 'draft' | 'in_review' | 'approved' | 'rejected' | 'incomplete';

export type EmploymentStatus = 'employed' | 'self_employed' | 'director' | 'retired_pension' | 'home_maker' | 'other';

export type MaritalStatus = 'single' | 'married' | 'civil_partnership' | 'divorced' | 'widowed';

export type HomeownerStatus = 'homeowner' | 'tenant';

export type PropertyType = 'urban' | 'rustic' | 'commercial';

export type HomeStatus = 'main_residence' | 'holiday_home' | 'investment' | 'other';

export type UrgencyLevel = 'urgent' | 'pre_approval' | 'general_info' | 'other';

export interface Applicant {
  id?: string;
  application_id?: string;
  applicant_order: number;
  first_name: string;
  last_name: string;
  date_of_birth: Date;
  age?: number;
  nationality?: string;
  marital_status?: MaritalStatus;
  telephone?: string;
  mobile: string;
  email: string;
  current_address?: string;
  time_at_current_address_years?: number;
  time_at_current_address_months?: number;
  tax_country?: string;
  homeowner_or_tenant?: HomeownerStatus;
  monthly_mortgage_or_rent?: number;
  current_property_value?: number;
  mortgage_outstanding?: number;
  lender_or_landlord_details?: string;
  employment_status?: EmploymentStatus;
}

export interface Child {
  id?: string;
  applicant_id?: string;
  date_of_birth: Date;
  same_address_as_primary?: boolean;
}

export interface EmploymentDetails {
  id?: string;
  applicant_id?: string;
  // For Employed
  job_title?: string;
  employer_name?: string;
  employer_address?: string;
  gross_annual_salary?: number;
  net_monthly_income?: number;
  employment_start_date?: Date;
  previous_employment_details?: string;
  // For Self-Employed/Directors
  business_name?: string;
  business_address?: string;
  business_website?: string;
  company_creation_date?: Date;
  total_gross_annual_income?: number;
  net_annual_income?: number;
  bonus_overtime_commission_details?: string;
  company_stake_percentage?: number;
  accountant_can_provide_info?: boolean;
  accountant_contact_details?: string;
}

export interface FinancialCommitments {
  id?: string;
  applicant_id?: string;
  personal_loans?: number;
  credit_card_debt?: number;
  car_loans_lease?: number;
  total_monthly_commitments?: number;
  has_credit_or_legal_issues?: boolean;
  credit_legal_issues_details?: string;
}

export interface RentalProperty {
  id?: string;
  application_id?: string;
  property_address: string;
  current_valuation?: number;
  mortgage_outstanding?: number;
  monthly_mortgage_payment?: number;
  monthly_rent_received?: number;
}

export interface AdditionalAsset {
  id?: string;
  application_id?: string;
  asset_description: string;
  estimated_value?: number;
}

export interface Application {
  id?: string;
  status?: ApplicationStatus;
  current_step?: number;
  progress_percentage?: number;
  urgency_level?: UrgencyLevel;
  purchase_price?: number;
  deposit_available?: number;
  property_address?: string;
  property_type?: PropertyType;
  home_status?: HomeStatus;
  real_estate_agent_contact?: string;
  lawyer_contact?: string;
  additional_notes?: string;
  created_at?: string;
  updated_at?: string;
  submitted_at?: string;
  user_id?: string;
  draft_data?: Record<string, unknown>;
}

export interface FormState {
  // Step 1: Lead Capture
  step1: {
    first_name: string;
    last_name: string;
    email: string;
    mobile: string;
  };
  
  // Step 2: About You
  step2: {
    date_of_birth: Date | null;
    nationality: string;
    marital_status: MaritalStatus | '';
    telephone: string;
    linkedin_profile_url: string;
    has_co_applicants: boolean;
    co_applicants: Applicant[];
  };
  
  // Step 3: Your Home
  step3: {
    same_address_as_primary?: boolean;
    current_address: string;
    move_in_date: Date | null;
    homeowner_or_tenant: HomeownerStatus | '';
    monthly_mortgage_or_rent: number;
    monthly_payment_currency: string;
    current_property_value: number;
    property_value_currency: string;
    mortgage_outstanding: number;
    mortgage_outstanding_currency: string;
    lender_or_landlord_details: string;
    tax_country: string;
    has_children: boolean;
    children: Child[];
    co_applicants: Array<{
      same_address_as_primary?: boolean;
      current_address: string;
      move_in_date: Date | null;
      homeowner_or_tenant: HomeownerStatus | '';
      monthly_mortgage_or_rent: number;
      monthly_payment_currency: string;
      current_property_value: number;
      property_value_currency: string;
      mortgage_outstanding: number;
      mortgage_outstanding_currency: string;
      lender_or_landlord_details: string;
      tax_country: string;
      has_children: boolean;
      same_children_as_primary?: boolean;
      children: Child[];
    }>;
  };
  
  // Step 4: Employment
  step4: {
    employment_status: EmploymentStatus | '';
    employment_details: EmploymentDetails;
    financial_commitments: FinancialCommitments;
    co_applicants: Array<{
      employment_status: EmploymentStatus | '';
      employment_details: EmploymentDetails;
      financial_commitments: FinancialCommitments;
    }>;
  };
  
  // Step 5: Portfolio
  step5: {
    has_rental_properties: boolean;
    rental_properties: RentalProperty[];
    other_assets: string;
  };
  
  // Step 6: Spanish Property
  step6: {
    urgency_level: UrgencyLevel | '';
    purchase_price: number;
    deposit_available: number;
    property_address: string;
    home_status: HomeStatus | '';
    property_type: PropertyType | '';
    real_estate_agent_contact: string;
    lawyer_contact: string;
    additional_information: string;
    authorization_consent: boolean;
  };
  
  // Meta
  currentStep: number;
  applicationId: string | null;
  ghlContactId: string | null; // GoHighLevel contact ID
  ghlOpportunityId: string | null; // GoHighLevel opportunity ID
  isCompleted: boolean; // Track if application has been fully submitted
  lastError?: string | null; // Track database errors
}
