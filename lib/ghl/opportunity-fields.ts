/**
 * GHL Opportunity Custom Field Mappings
 * 
 * Maps form fields to GHL opportunity custom field IDs for proper data sync
 */

/**
 * Format children details array into a readable multi-line string
 */
function formatChildrenDetails(children: Array<{
  date_of_birth?: Date | string;
  same_address_as_primary?: boolean;
}>): string {
  if (!children || children.length === 0) {
    return 'No children';
  }

  return children.map((child, index) => {
    const dob = child.date_of_birth ? new Date(child.date_of_birth) : null;
    const age = dob ? Math.floor((Date.now() - dob.getTime()) / (365.25 * 24 * 60 * 60 * 1000)) : 'Unknown';
    
    return `Child ${index + 1}:
  Date of Birth: ${dob ? dob.toLocaleDateString() : 'Not provided'}
  Age: ${age}`;
  }).join('\n\n');
}

/**
 * Format rental properties array into a readable multi-line string
 */
function formatRentalPropertiesDetails(properties: Array<{
  property_address?: string;
  current_valuation?: number;
  mortgage_outstanding?: number;
  monthly_mortgage_payment?: number;
  monthly_rent_received?: number;
}>): string {
  if (!properties || properties.length === 0) {
    return 'No rental properties';
  }

  return properties.map((property, index) => {
    const valuation = property.current_valuation ? `€${property.current_valuation.toLocaleString()}` : 'Not provided';
    const mortgage = property.mortgage_outstanding ? `€${property.mortgage_outstanding.toLocaleString()}` : 'Not provided';
    const monthlyPayment = property.monthly_mortgage_payment ? `€${property.monthly_mortgage_payment.toLocaleString()}` : 'Not provided';
    const monthlyRent = property.monthly_rent_received ? `€${property.monthly_rent_received.toLocaleString()}` : 'Not provided';
    
    return `Property ${index + 1}:
  Address: ${property.property_address || 'Not provided'}
  Current Valuation: ${valuation}
  Mortgage Outstanding: ${mortgage}
  Monthly Mortgage Payment: ${monthlyPayment}
  Monthly Rent Received: ${monthlyRent}`;
  }).join('\n\n');
}

export interface GHLFieldOption {
  key: string;
  label: string;
}

export interface GHLCustomField {
  name: string;
  dataType: 'TEXT' | 'SINGLE_OPTIONS' | 'RADIO' | 'DATE' | 'MONETORY' | 'NUMERICAL' | 'LARGE_TEXT';
  fieldKey: string;
  id: string;
  options?: GHLFieldOption[];
}

export const opportunityFields: GHLCustomField[] = [
  {
    name: 'LinkedIn Profile URL',
    dataType: 'TEXT',
    fieldKey: 'linkedin_profile_url',
    id: 'NObucUgOYPM5osXzBYya'
  },
  {
    name: 'Marital Status',
    dataType: 'SINGLE_OPTIONS',
    fieldKey: 'marital_status',
    id: '1zSwAHTGtruVAIw1pfBf',
    options: [
      { key: 'single', label: 'Single' },
      { key: 'married', label: 'Married' },
      { key: 'civil_partnership', label: 'Civil Partnership' },
      { key: 'divorced', label: 'Divorced' },
      { key: 'widowed', label: 'Widowed' },
    ],
  },
  {
    name: 'Has Co-Applicants',
    dataType: 'RADIO',
    fieldKey: 'has_co_applicants',
    id: 'qJiZurypTfmX1zN4US74',
  },

  // Address & Living Situation Fields (from Step 3 schema)
  {
    name: 'Current Address',
    dataType: 'TEXT',
    fieldKey: 'current_address',
    id: 'kOKLa2e44k5kzdNDIpE0'
  },
  {
    name: 'Move In Date',
    dataType: 'DATE',
    fieldKey: 'move_in_date',
    id: '3uhHpQj9fE7nbhcQhjCC'
  },
  {
    name: 'Homeowner or Tenant',
    dataType: 'SINGLE_OPTIONS',
    fieldKey: 'homeowner_or_tenant',
    id: 'TSxQ6lMr9qsUf9QvPcCo',
    options: [
      { key: 'homeowner', label: 'Homeowner' },
      { key: 'tenant', label: 'Tenant' },
    ],
  },
  {
    name: 'Monthly Mortgage or Rent',
    dataType: 'MONETORY',
    fieldKey: 'monthly_mortgage_or_rent',
    id: 'd4qdvckB9WARtyFVIz3f'
  },
  {
    name: 'Current Property Value',
    dataType: 'MONETORY',
    fieldKey: 'current_property_value',
    id: 'e3FIszY0wREPVfkeRoYC'
  },
  {
    name: 'Mortgage Outstanding',
    dataType: 'MONETORY',
    fieldKey: 'mortgage_outstanding',
    id: 'I7VNwpKlKvpwaFtA53Ar'
  },
  {
    name: 'Lender or Landlord Details',
    dataType: 'LARGE_TEXT',
    fieldKey: 'lender_or_landlord_details',
    id: 'HmHv5JnpHzIODBT2qEEh'
  },
  {
    name: 'Tax Country',
    dataType: 'TEXT',
    fieldKey: 'tax_country',
    id: 'X1QXjxeN1CqIWOhzGYjZ'
  },
  {
    name: 'Has Children',
    dataType: 'RADIO',
    fieldKey: 'has_children',
    id: 'UEK8S1mlijCMyopqJSuh'
  },
  {
    name: 'Children Details',
    dataType: 'LARGE_TEXT',
    fieldKey: 'children',
    id: 'bHYLiQmgofUAl5uZKscv'
  },

  // Employment Details Fields (from Step 4 schema)
  {
    name: 'Employment Status',
    dataType: 'SINGLE_OPTIONS',
    fieldKey: 'aip_employment_status',
    id: 'AsVjF2Mdqo14bYL2ZFzv',
    options: [
      { key: 'employed', label: 'Employed' },
      { key: 'self_employed', label: 'Self Employed' },
      { key: 'director', label: 'Employed Company Director' },
      { key: 'retired_pension', label: 'Retired Pension' },
      { key: 'home_maker', label: 'Home Maker' },
      { key: 'other', label: 'Other' },
    ],
  },
  {
    name: 'Job Title',
    dataType: 'TEXT',
    fieldKey: 'job_title',
    id: 'CY95ZGTgPR5JVpiKDjz5'
  },
  {
    name: 'Employer Name',
    dataType: 'TEXT',
    fieldKey: 'employer_name',
    id: 'jizzoVPyAu2AXC8fHdTV'
  },
  {
    name: 'Employer Address',
    dataType: 'TEXT',
    fieldKey: 'employer_address',
    id: 'vJg3YJKvWuFZyGxzu3aQ'
  },
  {
    name: 'Gross Annual Salary',
    dataType: 'MONETORY',
    fieldKey: 'gross_annual_salary',
    id: 'nEAl2uLbdN5kWB4Kfdwh'
  },
  {
    name: 'Net Monthly Income',
    dataType: 'MONETORY',
    fieldKey: 'net_monthly_income',
    id: 'MviDCO3YCXOFlwMLUUbD'
  },
  {
    name: 'Employment Start Date',
    dataType: 'DATE',
    fieldKey: 'employment_start_date',
    id: 'iT0rcWWRccbsCMLA8umr'
  },
  {
    name: 'Previous Employment Details',
    dataType: 'LARGE_TEXT',
    fieldKey: 'previous_employment_details',
    id: 'dvmsakMCgiPgGDbQm13T'
  },
  {
    name: 'Business Name',
    dataType: 'TEXT',
    fieldKey: 'business_name',
    id: '4UVkzV78KzEbvZy9e93V'
  },
  {
    name: 'Business Address',
    dataType: 'TEXT',
    fieldKey: 'business_address',
    id: 'tpwKcZZdJlfIf2E6ddD6'
  },
  {
    name: 'Business Website',
    dataType: 'TEXT',
    fieldKey: 'business_website',
    id: 'q1jnMU2Z3pyScgrIWOwG'
  },
  {
    name: 'Company Creation Date',
    dataType: 'DATE',
    fieldKey: 'company_creation_date',
    id: 'UqgRl71hxbuYMwNE2mCc'
  },
  {
    name: 'Total Gross Annual Income',
    dataType: 'MONETORY',
    fieldKey: 'total_gross_annual_income',
    id: 'CkCucbSZtAcolp4artfa'
  },
  {
    name: 'Net Annual Income',
    dataType: 'MONETORY',
    fieldKey: 'net_annual_income',
    id: 'EvG0H5oe0G97amJrO6gI'
  },
  {
    name: 'Company Stake Percentage',
    dataType: 'NUMERICAL',
    fieldKey: 'company_stake_percentage',
    id: '4Xk8MrafjdHzOM6diFxK'
  },
  {
    name: 'Bonus Overtime Commission Details',
    dataType: 'LARGE_TEXT',
    fieldKey: 'bonus_overtime_commission_details',
    id: 'KiAQxdxpu4xLvuh1ETAY'
  },
  {
    name: 'Accountant Can Provide Info',
    dataType: 'TEXT',
    fieldKey: 'accountant_can_provide_info',
    id: 'si2FjzxcglQAbsZHhIbF'
  },
  {
    name: 'Accountant Contact Details',
    dataType: 'LARGE_TEXT',
    fieldKey: 'accountant_contact_details',
    id: 'JfEbanlDeGw6Phf1tbq0'
  },

  // Financial Information Fields (from Step 4 financial commitments)
  {
    name: 'Personal Loans',
    dataType: 'MONETORY',
    fieldKey: 'personal_loans',
    id: 'WqJfoUBPRtBmH8R5KmMI'
  },
  {
    name: 'Credit Card Debt',
    dataType: 'MONETORY',
    fieldKey: 'credit_card_debt',
    id: 'acLdAprfOdbYWgyJV00G'
  },
  {
    name: 'Car Loans Lease',
    dataType: 'MONETORY',
    fieldKey: 'car_loans_lease',
    id: 'Ud3ROaBgGKPSlteJmoVA'
  },
  {
    name: 'Has Credit or Legal Issues',
    dataType: 'RADIO',
    fieldKey: 'has_credit_or_legal_issues',
    id: '1Ok2FAWzfzmaqgBGMwVu'
  },
  {
    name: 'Credit Legal Issues Details',
    dataType: 'LARGE_TEXT',
    fieldKey: 'credit_legal_issues_details',
    id: 'GyqDBErV6zCoBvV0jPJS'
  },

  // Portfolio & Investment Fields (from Step 5 schema)
  {
    name: 'Has Rental Properties',
    dataType: 'RADIO',
    fieldKey: 'has_rental_properties',
    id: 'coSrO4lEWvILADt0PAFI'
  },
  {
    name: 'Rental Properties',
    dataType: 'LARGE_TEXT',
    fieldKey: 'rental_properties',
    id: 'oKhjaltmj1Xs2WM14Gpl'
  },
  {
    name: 'Other Assets',
    dataType: 'LARGE_TEXT',
    fieldKey: 'other_assets',
    id: 'AHNPu1tcPbpqZRLfeWon'
  },

  // Spanish Property Fields (from Step 6 schema)
  {
    name: 'Urgency Level',
    dataType: 'SINGLE_OPTIONS',
    fieldKey: 'urgency_level',
    id: 'xVtecprExqen3HcutzLY',
    options: [
      { key: 'urgent', label: 'Urgent (found a property)' },
      { key: 'pre_approval', label: 'Pre Approval wanted (still looking)' },
      { key: 'general_info', label: 'General Information needed' },
      { key: 'other', label: 'Other' },
    ],
  },
  {
    name: 'Purchase Price',
    dataType: 'MONETORY',
    fieldKey: 'aip_purchase_price',
    id: 'xqZzPdoZDM4MRkL5AWfw'
  },
  {
    name: 'Deposit Available',
    dataType: 'MONETORY',
    fieldKey: 'deposit_available',
    id: 'thaQWEGbR9xg9bzw6Tci'
  },
  {
    name: 'Property Address',
    dataType: 'TEXT',
    fieldKey: 'property_address',
    id: 'TKGkjvLkETlDfb5U6RiH'
  },
  {
    name: 'Home Status',
    dataType: 'SINGLE_OPTIONS',
    fieldKey: 'aip_home_status',
    id: 'QFRCpj6xvfJoqcUCOfeB',
    options: [
      { key: 'main_residence', label: 'Main Residence' },
      { key: 'holiday_home', label: 'Holiday Home/Lifestyle' },
      { key: 'investment', label: 'Investment' },
      { key: 'other', label: 'Other' },
    ],
  },
  {
    name: 'Property Type',
    dataType: 'SINGLE_OPTIONS',
    fieldKey: 'aip_property_type',
    id: 'iVEXA1BJndwAs5PZDGzQ',
    options: [
      { key: 'urban', label: 'Urban' },
      { key: 'rustic', label: 'Rustic' },
      { key: 'commercial', label: 'Commercial' },
    ],
  },
  {
    name: 'Real Estate Agent Contact',
    dataType: 'LARGE_TEXT',
    fieldKey: 'real_estate_agent_contact',
    id: 'E8z4EqmVDVaNGPQg2B4G'
  },
  {
    name: 'Lawyer Contact',
    dataType: 'LARGE_TEXT',
    fieldKey: 'lawyer_contact',
    id: '9fBuoxcYnsrWaerWEmqL'
  },
  {
    name: 'Additional Information',
    dataType: 'LARGE_TEXT',
    fieldKey: 'additional_information',
    id: 'EqWmlrtNnIotrLI2XBwE'
  },
];

/**
 * Get custom field mapping by field key
 */
export function getFieldMapping(fieldKey: string): GHLCustomField | undefined {
  return opportunityFields.find(field => field.fieldKey === fieldKey);
}

/**
 * Get custom field ID by field key
 */
export function getFieldId(fieldKey: string): string | undefined {
  const field = getFieldMapping(fieldKey);
  return field?.id;
}

/**
 * Convert form data to GHL custom field format
 */
export function mapFormDataToCustomFields(data: Record<string, unknown>): Array<{ id: string; field_value: string | number | boolean }> {
  const customFields: Array<{ id: string; field_value: string | number | boolean }> = [];

  for (const [key, value] of Object.entries(data)) {
    const fieldMapping = getFieldMapping(key);
    
    if (fieldMapping && value !== undefined && value !== null && value !== '') {
      let fieldValue: string | number | boolean = String(value);

      // Handle different data types
      switch (fieldMapping.dataType) {
        case 'DATE':
          // Convert Date objects to YYYY-MM-DD format
          if (value instanceof Date) {
            fieldValue = value.toISOString().split('T')[0];
          } else if (typeof value === 'string') {
            // Validate and format date strings
            const date = new Date(value);
            if (!isNaN(date.getTime())) {
              fieldValue = date.toISOString().split('T')[0];
            }
          }
          break;
          
        case 'RADIO':
        case 'SINGLE_OPTIONS':
          // Special handling for boolean "Has" fields that need Yes/No values
          if (typeof value === 'boolean' && (key === 'has_children' || key === 'has_co_applicants' || key === 'has_rental_properties' || key === 'has_credit_or_legal_issues')) {
            fieldValue = value ? 'Yes' : 'No';
          } else if (typeof value === 'boolean') {
            fieldValue = value.toString();
          }
          break;
          
        case 'MONETORY':
          // Ensure numeric values for monetary fields
          if (typeof value === 'string') {
            const numValue = parseFloat(value);
            if (!isNaN(numValue)) {
              fieldValue = numValue;
            }
          }
          break;
          
        case 'NUMERICAL':
          // Ensure numeric values
          if (typeof value === 'string') {
            const numValue = parseFloat(value);
            if (!isNaN(numValue)) {
              fieldValue = numValue;
            }
          }
          break;
          
        default:
          // TEXT and LARGE_TEXT - keep as string
          // Special handling for children and rental properties fields
          if (key === 'children' && Array.isArray(value)) {
            fieldValue = formatChildrenDetails(value);
          } else if (key === 'rental_properties' && Array.isArray(value)) {
            fieldValue = formatRentalPropertiesDetails(value);
          } else {
            fieldValue = String(value);
          }
      }

      customFields.push({
        id: fieldMapping.id,
        field_value: fieldValue
      });
    }
  }

  return customFields;
}