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
    .refine((val) => !val || isValidPhoneNumber(val), {
      message: 'Invalid phone number',
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
});

// Step 3: Your Home
export const step3Schema = z.object({
  current_address: z.string().min(1, 'Current address is required'),
  time_at_address_years: z.number().min(0),
  time_at_address_months: z.number().min(0).max(11),
  homeowner_or_tenant: z.enum(['homeowner', 'tenant'], {
    message: 'Please select homeowner or tenant',
  }),
  monthly_mortgage_or_rent: z.number().min(0, 'Amount must be positive'),
  current_property_value: z.number().optional(),
  mortgage_outstanding: z.number().optional(),
  lender_or_landlord_details: z.string().optional(),
  lived_less_than_3_years: z.boolean(),
  previous_address: z.string().optional(),
  time_at_previous_years: z.number().optional(),
  time_at_previous_months: z.number().optional(),
  tax_country: z.string().min(1, 'Tax country is required'),
  has_children: z.boolean(),
  children: z.array(
    z.object({
      age: z.number().min(0).max(100),
    })
  ).optional(),
});

// Step 4: Employment
export const step4EmployedSchema = z.object({
  employment_status: z.enum(['employed', 'self_employed', 'director', 'retired', 'unemployed', 'other']),
  job_title: z.string().min(1, 'Job title is required'),
  employer_name: z.string().min(1, 'Employer name is required'),
  employer_address: z.string().min(1, 'Employer address is required'),
  gross_annual_salary: z.number().min(0),
  net_monthly_income: z.number().min(0),
  employment_length_years: z.number().min(0),
  employment_length_months: z.number().min(0).max(11),
  previous_employment_details: z.string().optional(),
  personal_loans: z.number().min(0).default(0),
  credit_card_debt: z.number().min(0).default(0),
  car_loans_lease: z.number().min(0).default(0),
  has_credit_or_legal_issues: z.boolean().default(false),
  credit_legal_issues_details: z.string().optional(),
});

export const step4SelfEmployedSchema = z.object({
  employment_status: z.enum(['employed', 'self_employed', 'director', 'retired', 'unemployed', 'other']),
  business_name: z.string().min(1, 'Business name is required'),
  business_address: z.string().min(1, 'Business address is required'),
  business_website: z.string().optional(),
  company_creation_date: z.date().optional(),
  total_gross_annual_income: z.number().min(0),
  net_annual_income: z.number().min(0),
  bonus_overtime_commission_details: z.string().optional(),
  company_stake_percentage: z.number().min(0).max(100),
  accountant_can_provide_info: z.boolean(),
  accountant_contact_details: z.string().optional(),
  personal_loans: z.number().min(0).default(0),
  credit_card_debt: z.number().min(0).default(0),
  car_loans_lease: z.number().min(0).default(0),
  has_credit_or_legal_issues: z.boolean().default(false),
  credit_legal_issues_details: z.string().optional(),
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
  purchase_price: z.number().min(0, 'Purchase price is required'),
  deposit_available: z.number().min(0, 'Deposit amount is required'),
  property_address: z.string().optional(),
  property_type: z.enum(['villa', 'apartment', 'townhouse', 'land', 'commercial', 'other'], {
    message: 'Please select a property type',
  }),
  home_status: z.enum(['primary_residence', 'second_home', 'investment'], {
    message: 'Please select the home status',
  }),
  urgency_level: z.enum(['low', 'medium', 'high', 'very_high'], {
    message: 'Please select urgency level',
  }),
  real_estate_agent_contact: z.string().optional(),
  lawyer_contact: z.string().optional(),
  additional_notes: z.string().optional(),
});

export type Step1FormData = z.infer<typeof step1Schema>;
export type Step2FormData = z.infer<typeof step2Schema>;
export type Step3FormData = z.infer<typeof step3Schema>;
export type Step4EmployedFormData = z.infer<typeof step4EmployedSchema>;
export type Step4SelfEmployedFormData = z.infer<typeof step4SelfEmployedSchema>;
export type Step5FormData = z.infer<typeof step5Schema>;
export type Step6FormData = z.infer<typeof step6Schema>;
