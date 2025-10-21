import { z } from 'zod';
import { isValidPhoneNumber } from 'libphonenumber-js';

// Step 1: Lead Capture
export const step1Schema = z.object({
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().min(1, 'Last name is required'),
  date_of_birth: z.date({ message: 'Date of birth is required' }),
  email: z.string().email('Invalid email address'),
  mobile: z
    .string()
    .min(1, 'Mobile number is required')
    .refine((val) => isValidPhoneNumber(val), {
      message: 'Invalid phone number',
    }),
});

// Step 2: About You
export const step2Schema = z.object({
  nationality: z.string().min(1, 'Nationality is required'),
  marital_status: z.enum(['single', 'married', 'civil_partnership', 'divorced', 'widowed'], {
    message: 'Please select your marital status',
  }),
  telephone: z
    .string()
    .optional()
    .or(z.literal(''))
    .refine((val) => !val || val === '' || isValidPhoneNumber(val), {
      message: 'Invalid phone number',
    }),
  linkedin_profile_url: z
    .string()
    .optional()
    .or(z.literal(''))
    .refine((val) => {
      if (!val || val === '') return true;
      try {
        const url = new URL(val);
        return url.hostname === 'www.linkedin.com' || url.hostname === 'linkedin.com';
      } catch {
        return false;
      }
    }, {
      message: 'Please enter a valid LinkedIn profile URL',
    }),
  has_co_applicants: z.boolean(),
  co_applicants: z.array(
    z.object({
      first_name: z.string().min(1, 'First name is required'),
      last_name: z.string().min(1, 'Last name is required'),
      email: z.string().email('Invalid email address'),
      mobile: z
        .string()
        .min(1, 'Mobile number is required')
        .refine((val) => isValidPhoneNumber(val), {
          message: 'Invalid phone number',
        }),
      date_of_birth: z.date({
        message: 'Date of birth is required',
      }),
      nationality: z.string().min(1, 'Nationality is required'),
      marital_status: z.enum(['single', 'married', 'civil_partnership', 'divorced', 'widowed']),
    })
  ).optional(),
}).refine((data) => {
  // If has_co_applicants is true, require at least one co-applicant
  if (data.has_co_applicants) {
    return data.co_applicants && data.co_applicants.length > 0;
  }
  return true;
}, {
  message: "Please add at least one co-applicant or select 'No, just me'",
  path: ["co_applicants"], // This will show error on co_applicants field
});

// Step 3: Your Home
export const step3Schema = z.object({
  same_address_as_primary: z.boolean().default(false),
  current_address: z.string().min(1, 'Current address is required'),
  move_in_date: z.date({ message: 'Move-in date is required' }),
  homeowner_or_tenant: z.enum(['homeowner', 'tenant'], {
    message: 'Please select homeowner or tenant',
  }),
  monthly_mortgage_or_rent: z.number().min(0, 'Amount must be positive'),
  monthly_payment_currency: z.string().default('USD'),
  current_property_value: z.number().optional(),
  property_value_currency: z.string().default('USD'),
  mortgage_outstanding: z.number().optional(),
  mortgage_outstanding_currency: z.string().default('USD'),
  lender_or_landlord_details: z.string().optional(),
  previous_address: z.string().optional(),
  previous_move_in_date: z.date().optional(),
  previous_move_out_date: z.date().optional(),
  tax_country: z.string().min(1, 'Tax country is required'),
  has_children: z.boolean(),
  same_children_as_primary: z.boolean().default(false),
  children: z.array(
    z.object({
      date_of_birth: z.date({ message: 'Child date of birth is required' }),
      same_address_as_primary: z.boolean().default(false),
    })
  ).optional(),
}).refine((data) => {
  // If has_children is true, children array must have at least one item
  if (data.has_children && (!data.children || data.children.length === 0)) {
    return false;
  }
  return true;
}, {
  message: "Please add at least one child",
  path: ["children"], // This will highlight the children field
}).refine((data) => {
  // If has_children is true, all children must have valid dates
  if (data.has_children && data.children) {
    return data.children.every(child => 
      child.date_of_birth && 
      child.date_of_birth instanceof Date && 
      !isNaN(child.date_of_birth.getTime()) &&
      (child.same_address_as_primary === undefined || typeof child.same_address_as_primary === 'boolean')
    );
  }
  return true;
}, {
  message: "Please select a date of birth for all children",
  path: ["children"],
});

// Step 4: Employment - Unified schema with conditional validation
export const step4Schema = z.object({
  employment_status: z.enum(['employed', 'self_employed', 'director', 'retired_pension', 'home_maker', 'other']),
  
  // Employed fields
  job_title: z.string().optional(),
  employer_name: z.string().optional(),
  employer_address: z.string().optional(),
  gross_annual_salary: z.number().min(0).optional(),
  net_monthly_income: z.number().min(0).optional(),
  employment_start_date: z.date().optional(),
  previous_employment_details: z.string().optional(),
  
  // Self-Employed/Director fields
  business_name: z.string().optional(),
  business_address: z.string().optional(),
  business_website: z.string().optional(),
  company_creation_date: z.date().optional(),
  total_gross_annual_income: z.number().min(0).optional(),
  net_annual_income: z.number().min(0).optional(),
  company_stake_percentage: z.number().min(0).max(100).optional(),
  bonus_overtime_commission_details: z.string().optional(),
  accountant_can_provide_info: z.boolean().optional(),
  accountant_contact_details: z.string().optional(),
  
  // Financial Commitments (common to all)
  personal_loans: z.number().min(0),
  credit_card_debt: z.number().min(0),
  car_loans_lease: z.number().min(0),
  has_credit_or_legal_issues: z.boolean(),
  credit_legal_issues_details: z.string().optional(),
}).refine((data) => {
  // Conditional validation based on employment status
  if (data.employment_status === 'employed') {
    return data.job_title && data.employer_name && data.employer_address && data.employment_start_date;
  }
  if (data.employment_status === 'self_employed') {
    return data.business_name && data.business_address && data.company_creation_date && 
           typeof data.accountant_can_provide_info === 'boolean';
  }
  if (data.employment_status === 'director') {
    return data.business_name && data.business_address && data.company_creation_date && 
           typeof data.accountant_can_provide_info === 'boolean' && 
           typeof data.company_stake_percentage === 'number';
  }
  return true; // No validation for other statuses
}, {
  message: "Please fill in all required fields for your employment type",
  path: ["employment_status"] // This will show error on employment status field
});

// Step 5: Portfolio
export const step5Schema = z.object({
  has_rental_properties: z.boolean(),
  rental_properties: z.array(
    z.object({
      property_address: z.string().min(1, 'Property address is required'),
      current_valuation: z.number().min(0).optional(),
      mortgage_outstanding: z.number().min(0).optional(),
      monthly_mortgage_payment: z.number().min(0).optional(),
      monthly_rent_received: z.number().min(0).optional(),
    })
  ).optional(),
  other_assets: z.string().optional(),
});

// Step 6: Spanish Property
export const step6Schema = z.object({
  urgency_level: z.enum(['urgent', 'pre_approval', 'general_info', 'other'], {
    message: 'Please select urgency level',
  }),
  purchase_price: z.number().min(1, 'Purchase price is required'),
  deposit_available: z.number().min(1, 'Deposit amount is required'),
  property_address: z.string().min(1, 'Property address is required'),
  home_status: z.enum(['main_residence', 'holiday_home', 'investment', 'other'], {
    message: 'Please select the home status',
  }),
  property_type: z.enum(['urban', 'rustic', 'commercial'], {
    message: 'Please select a property type',
  }),
  real_estate_agent_contact: z.string().optional(),
  lawyer_contact: z.string().optional(),
  additional_information: z.string().optional(),
  authorization_consent: z.boolean().refine((val) => val === true, {
    message: 'You must provide authorization consent',
  }),
});

// Co-Applicant Schema (separate from main applicant)
export const coApplicantSchema = z.object({
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().min(1, 'Last name is required'),
  date_of_birth: z.date({ message: 'Date of birth is required' }),
  email: z.string().email('Invalid email address'),
  mobile: z
    .string()
    .min(1, 'Mobile number is required')
    .refine((val) => isValidPhoneNumber(val), {
      message: 'Invalid phone number',
    }),
  telephone: z
    .string()
    .optional()
    .or(z.literal(''))
    .refine((val) => !val || val === '' || isValidPhoneNumber(val), {
      message: 'Invalid phone number',
    }),
  nationality: z.string().min(1, 'Nationality is required'),
  relationship_to_main_applicant: z.enum([
    'spouse', 
    'partner', 
    'family_member', 
    'business_partner', 
    'other'
  ], {
    message: 'Please select the relationship to main applicant',
  }),
  same_address_as_main: z.boolean().default(true),
  
  // Address fields (only if same_address_as_main is false)
  current_address: z.string().optional(),
  time_at_current_address_years: z.number().min(0).optional(),
  time_at_current_address_months: z.number().min(0).max(11).optional(),
  
  // Employment and income
  employment_status: z.enum(['employed', 'self_employed', 'unemployed', 'retired', 'student']),
  annual_income: z.number().min(0).optional(),
  
  // Financial commitments
  personal_loans: z.number().min(0).default(0),
  credit_card_debt: z.number().min(0).default(0),
  car_loans_lease: z.number().min(0).default(0),
  has_credit_or_legal_issues: z.boolean().default(false),
  credit_legal_issues_details: z.string().optional(),
});

export type Step1FormData = z.infer<typeof step1Schema>;
export type Step2FormData = z.infer<typeof step2Schema>;
export type Step3FormData = z.infer<typeof step3Schema>;
export type Step4FormData = z.infer<typeof step4Schema>;
export type Step5FormData = z.infer<typeof step5Schema>;
export type Step6FormData = z.infer<typeof step6Schema>;
export type CoApplicantFormData = z.infer<typeof coApplicantSchema>;
