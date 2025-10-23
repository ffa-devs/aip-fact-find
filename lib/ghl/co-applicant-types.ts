/**
 * GHL Co-Applicant Custom Object Types and Field Mappings
 * 
 * Defines TypeScript interfaces for creating co-applicant records in GoHighLevel
 * Custom Object: custom_objects.aip_co_applicants
 */

export interface GHLCoApplicantCustomObject {
  locationId: string;
  owner: string[];
  followers?: string[];
  properties: GHLCoApplicantProperties;
}

export interface GHLCoApplicantProperties {
  // Personal Information
  'custom_objects.aip_co_applicants.first_name': string;
  'custom_objects.aip_co_applicants.last_name': string;
  'custom_objects.aip_co_applicants.email_address': string;
  'custom_objects.aip_co_applicants.mobile': string;
  'custom_objects.aip_co_applicants.date_of_birth': string; // Format: YYYY-MM-DD
  'custom_objects.aip_co_applicants.nationality': string;
  'custom_objects.aip_co_applicants.marital_status': 'single' | 'married' | 'civil_partnership' | 'divorced' | 'widowed';
  'custom_objects.aip_co_applicants.relationship_to_main_applicant': 'spouse' | 'partner' | 'parent' | 'sibling' | 'other';

  // Address & Living Situation
  'custom_objects.aip_co_applicants.same_address_as_primary': string; // "yes" or "no"
  'custom_objects.aip_co_applicants.current_address'?: string;
  'custom_objects.aip_co_applicants.move_in_date'?: string; // Format: YYYY-MM-DD
  'custom_objects.aip_co_applicants.homeowner_or_tenant'?: 'homeowner' | 'tenant';
  'custom_objects.aip_co_applicants.monthly_mortgage_or_rent'?: GHLCurrencyField;
  'custom_objects.aip_co_applicants.monthly_payment_currency'?: string;
  'custom_objects.aip_co_applicants.current_property_value'?: GHLCurrencyField;
  'custom_objects.aip_co_applicants.property_value_currency'?: string;
  'custom_objects.aip_co_applicants.mortgage_outstanding'?: GHLCurrencyField;
  'custom_objects.aip_co_applicants.mortgage_outstanding_currency'?: string;
  'custom_objects.aip_co_applicants.lender_or_landlord_details'?: string;
  'custom_objects.aip_co_applicants.previous_address'?: string;
  'custom_objects.aip_co_applicants.previous_move_in_date'?: string; // Format: YYYY-MM-DD
  'custom_objects.aip_co_applicants.previous_move_out_date'?: string; // Format: YYYY-MM-DD
  'custom_objects.aip_co_applicants.tax_country'?: string;
  'custom_objects.aip_co_applicants.has_children'?: string; // "yes" or "no"
  'custom_objects.aip_co_applicants.children'?: string; // JSON string of children details

  // Employment Details
  'custom_objects.aip_co_applicants.employment_status': 'employed' | 'self_employed' | 'director' | 'retired_pension' | 'home_maker' | 'other';
  'custom_objects.aip_co_applicants.job_title'?: string;
  'custom_objects.aip_co_applicants.employer_name'?: string;
  'custom_objects.aip_co_applicants.employer_address'?: string;
  'custom_objects.aip_co_applicants.gross_annual_salary'?: GHLCurrencyField;
  'custom_objects.aip_co_applicants.net_monthly_income'?: GHLCurrencyField;
  'custom_objects.aip_co_applicants.employment_start_date'?: string; // Format: YYYY-MM-DD
  'custom_objects.aip_co_applicants.previous_employment_details'?: string;
  'custom_objects.aip_co_applicants.business_name'?: string;
  'custom_objects.aip_co_applicants.business_address'?: string;
  'custom_objects.aip_co_applicants.business_website'?: string;
  'custom_objects.aip_co_applicants.company_creation_date'?: string; // Format: YYYY-MM-DD
  'custom_objects.aip_co_aplicants.total_gross_annual_income'?: GHLCurrencyField;
  'custom_objects.aip_co_applicants.net_annual_income'?: GHLCurrencyField;
  'custom_objects.aip_co_applicants.company_stake_percentage'?: number;
  'custom_objects.aip_co_applicants.bonus_overtime_commission_details'?: string;
  'custom_objects.aip_co_applicants.accountant_can_provide_info'?: string; // "yes" or "no"
  'custom_objects.aip_co_applicants.accountant_contact_details'?: string;

  // Financial Information
  'custom_objects.aip_co_applicants.personal_loans'?: GHLCurrencyField;
  'custom_objects.aip_co_applicants.credit_card_debt'?: GHLCurrencyField;
  'custom_objects.aip_co_applicants.car_loans_lease'?: GHLCurrencyField;
  'custom_objects.aip_co_applicants.has_credit_or_legal_issues'?: string; // "yes" or "no"
  'custom_objects.aip_co_applicants.credit_legal_issues_details'?: string;
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
  'first_name': 'custom_objects.aip_co_applicants.first_name',
  'last_name': 'custom_objects.aip_co_applicants.last_name',
  'email': 'custom_objects.aip_co_applicants.email_address',
  'mobile': 'custom_objects.aip_co_applicants.mobile',
  'date_of_birth': 'custom_objects.aip_co_applicants.date_of_birth',
  'nationality': 'custom_objects.aip_co_applicants.nationality',
  'marital_status': 'custom_objects.aip_co_applicants.marital_status',
  'relationship_to_primary': 'custom_objects.aip_co_applicants.relationship_to_main_applicant',

  // Address & Living Situation
  'same_address_as_primary': 'custom_objects.aip_co_applicants.same_address_as_primary',
  'current_address': 'custom_objects.aip_co_applicants.current_address',
  'move_in_date': 'custom_objects.aip_co_applicants.move_in_date',
  'homeowner_or_tenant': 'custom_objects.aip_co_applicants.homeowner_or_tenant',
  'monthly_mortgage_or_rent': 'custom_objects.aip_co_applicants.monthly_mortgage_or_rent',
  'monthly_payment_currency': 'custom_objects.aip_co_applicants.monthly_payment_currency',
  'current_property_value': 'custom_objects.aip_co_applicants.current_property_value',
  'property_value_currency': 'custom_objects.aip_co_applicants.property_value_currency',
  'mortgage_outstanding': 'custom_objects.aip_co_applicants.mortgage_outstanding',
  'mortgage_outstanding_currency': 'custom_objects.aip_co_applicants.mortgage_outstanding_currency',
  'lender_or_landlord_details': 'custom_objects.aip_co_applicants.lender_or_landlord_details',
  'previous_address': 'custom_objects.aip_co_applicants.previous_address',
  'previous_move_in_date': 'custom_objects.aip_co_applicants.previous_move_in_date',
  'previous_move_out_date': 'custom_objects.aip_co_applicants.previous_move_out_date',
  'tax_country': 'custom_objects.aip_co_applicants.tax_country',
  'has_children': 'custom_objects.aip_co_applicants.has_children',
  'children': 'custom_objects.aip_co_applicants.children',

  // Employment Details
  'employment_status': 'custom_objects.aip_co_applicants.employment_status',
  'job_title': 'custom_objects.aip_co_applicants.job_title',
  'employer_name': 'custom_objects.aip_co_applicants.employer_name',
  'employer_address': 'custom_objects.aip_co_applicants.employer_address',
  'gross_annual_salary': 'custom_objects.aip_co_applicants.gross_annual_salary',
  'net_monthly_income': 'custom_objects.aip_co_applicants.net_monthly_income',
  'employment_start_date': 'custom_objects.aip_co_applicants.employment_start_date',
  'previous_employment_details': 'custom_objects.aip_co_applicants.previous_employment_details',
  'business_name': 'custom_objects.aip_co_applicants.business_name',
  'business_address': 'custom_objects.aip_co_applicants.business_address',
  'business_website': 'custom_objects.aip_co_applicants.business_website',
  'company_creation_date': 'custom_objects.aip_co_applicants.company_creation_date',
  'total_gross_annual_income': 'custom_objects.aip_co_aplicants.total_gross_annual_income',
  'net_annual_income': 'custom_objects.aip_co_applicants.net_annual_income',
  'company_stake_percentage': 'custom_objects.aip_co_applicants.company_stake_percentage',
  'bonus_overtime_commission_details': 'custom_objects.aip_co_applicants.bonus_overtime_commission_details',
  'accountant_can_provide_info': 'custom_objects.aip_co_applicants.accountant_can_provide_info',
  'accountant_contact_details': 'custom_objects.aip_co_applicants.accountant_contact_details',

  // Financial Information
  'personal_loans': 'custom_objects.aip_co_applicants.personal_loans',
  'credit_card_debt': 'custom_objects.aip_co_applicants.credit_card_debt',
  'car_loans_lease': 'custom_objects.aip_co_applicants.car_loans_lease',
  'has_credit_or_legal_issues': 'custom_objects.aip_co_applicants.has_credit_or_legal_issues',
  'credit_legal_issues_details': 'custom_objects.aip_co_applicants.credit_legal_issues_details'
};