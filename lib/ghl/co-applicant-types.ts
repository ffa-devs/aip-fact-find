/**
 * GHL Co-Applicant Custom Object Types and Field Mappings
 * 
 * Defines TypeScript interfaces for creating co-applicant records in GoHighLevel
 * Custom Object: custom_objects.aip_co_applicants
 */

export interface GHLCoApplicantCustomObject {
  locationId: string;
  properties: GHLCoApplicantProperties;
}

export interface GHLCoApplicantProperties {
  // Personal Information
  'first_name': string;
  'last_name': string;
  'email_address': string;
  'mobile': string;
  'date_of_birth': string; // Format: YYYY-MM-DD
  'nationality': string;
  'marital_status': 'single' | 'married' | 'civil_partnership' | 'divorced' | 'widowed';
  'relationship_to_main_applicant': 'spouse' | 'partner' | 'parent' | 'sibling' | 'other';

  // Address & Living Situation
  'same_address_as_primary': string; // "yes" or "no"
  'current_address'?: string;
  'move_in_date'?: string; // Format: YYYY-MM-DD
  'homeowner_or_tenant'?: 'homeowner' | 'tenant';
  'monthly_mortgage_or_rent'?: GHLCurrencyField;
  'monthly_payment_currency'?: string;
  'current_property_value'?: GHLCurrencyField;
  'property_value_currency'?: string;
  'mortgage_outstanding'?: GHLCurrencyField;
  'mortgage_outstanding_currency'?: string;
  'lender_or_landlord_details'?: string;
  'tax_country'?: string;
  'has_children'?: string; // "yes" or "no"
  'children'?: string; // JSON string of children details

  // Employment Details
  'employment_status': 'employed' | 'self_employed' | 'director' | 'retired_pension' | 'home_maker' | 'other';
  'job_title'?: string;
  'employer_name'?: string;
  'employer_address'?: string;
  'gross_annual_salary'?: GHLCurrencyField;
  'net_monthly_income'?: GHLCurrencyField;
  'employment_start_date'?: string; // Format: YYYY-MM-DD
  'previous_employment_details'?: string;
  'business_name'?: string;
  'business_address'?: string;
  'business_website'?: string;
  'company_creation_date'?: string; // Format: YYYY-MM-DD
  'total_gross_annual_income'?: GHLCurrencyField;
  'net_annual_income'?: GHLCurrencyField;
  'company_stake_percentage'?: number;
  'bonus_overtime_commission_details'?: string;
  'accountant_can_provide_info'?: string; // "yes" or "no"
  'accountant_contact_details'?: string;

  // Financial Information
  'personal_loans'?: GHLCurrencyField;
  'credit_card_debt'?: GHLCurrencyField;
  'car_loans_lease'?: GHLCurrencyField;
  'has_credit_or_legal_issues'?: string; // "yes" or "no"
  'credit_legal_issues_details'?: string;
}

export interface GHLCurrencyField {
  currency: 'default'; // Only "default" supported (Location's currency)
  value: number;
}

export interface GHLCoApplicantResponse {
  id: string;
  locationId: string;
  objectKey: string;
  owner: string[];
  followers: string[];
  properties: GHLCoApplicantProperties;
  createdAt: string;
  updatedAt: string;
}

/**
 * Field mapping from form data to GHL Co-Applicant Custom Object
 */
export const coApplicantFieldMap: Record<string, string> = {
  // Personal Information
  'first_name': 'first_name',
  'last_name': 'last_name',
  'email': 'email_address',
  'mobile': 'mobile',
  'date_of_birth': 'date_of_birth',
  'nationality': 'nationality',
  'marital_status': 'marital_status',
  'relationship_to_primary': 'relationship_to_main_applicant',

  // Address & Living Situation
  'same_address_as_primary': 'same_address_as_primary',
  'current_address': 'current_address',
  'move_in_date': 'move_in_date',
  'homeowner_or_tenant': 'homeowner_or_tenant',
  'monthly_mortgage_or_rent': 'monthly_mortgage_or_rent',
  'monthly_payment_currency': 'monthly_payment_currency',
  'current_property_value': 'current_property_value',
  'property_value_currency': 'property_value_currency',
  'mortgage_outstanding': 'mortgage_outstanding',
  'mortgage_outstanding_currency': 'mortgage_outstanding_currency',
  'lender_or_landlord_details': 'lender_or_landlord_details',
  'tax_country': 'tax_country',
  'has_children': 'has_children',
  'children': 'children',

  // Employment Details
  'employment_status': 'employment_status',
  'job_title': 'job_title',
  'employer_name': 'employer_name',
  'employer_address': 'employer_address',
  'gross_annual_salary': 'gross_annual_salary',
  'net_monthly_income': 'net_monthly_income',
  'employment_start_date': 'employment_start_date',
  'previous_employment_details': 'previous_employment_details',
  'business_name': 'business_name',
  'business_address': 'business_address',
  'business_website': 'business_website',
  'company_creation_date': 'company_creation_date',
  'total_gross_annual_income': 'total_gross_annual_income',
  'net_annual_income': 'net_annual_income',
  'company_stake_percentage': 'company_stake_percentage',
  'bonus_overtime_commission_details': 'bonus_overtime_commission_details',
  'accountant_can_provide_info': 'accountant_can_provide_info',
  'accountant_contact_details': 'accountant_contact_details',

  // Financial Information
  'personal_loans': 'personal_loans',
  'credit_card_debt': 'credit_card_debt',
  'car_loans_lease': 'car_loans_lease',
  'has_credit_or_legal_issues': 'has_credit_or_legal_issues',
  'credit_legal_issues_details': 'credit_legal_issues_details'
};