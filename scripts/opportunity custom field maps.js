const parentId = 'AIP Form Contact Data'

return [
  {
    name: 'LinkedIn Profile URL',
    dataType: 'TEXT',
    fieldKey: `opportunity.linkedin_profile_url`,
    id: 'NObucUgOYPM5osXzBYya'
  },
  {
    name: 'Marital Status',
    dataType: 'SINGLE_OPTIONS',
    fieldKey: `opportunity.marital_status`,
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
    fieldKey: `opportunity.has_co_applicants`,
    id: 'qJiZurypTfmX1zN4US74',
  },

  // Address & Living Situation Fields (from Step 3 schema)
  {
    name: 'Current Address',
    dataType: 'TEXT',
    fieldKey: `opportunity.current_address`,
    id: 'kOKLa2e44k5kzdNDIpE0'
  },
  {
    name: 'Move In Date',
    dataType: 'DATE',
    fieldKey: `opportunity.move_in_date`,
    id: '3uhHpQj9fE7nbhcQhjCC'
  },
  {
    name: 'Homeowner or Tenant',
    dataType: 'SINGLE_OPTIONS',
    fieldKey: `opportunity.homeowner_or_tenant`,
    id: 'TSxQ6lMr9qsUf9QvPcCo',
    options: [
      { key: 'homeowner', label: 'Homeowner' },
      { key: 'tenant', label: 'Tenant' },
    ],
  },
  {
    name: 'Monthly Mortgage or Rent',
    dataType: 'MONETORY',
    fieldKey: `opportunity.monthly_mortgage_or_rent`,
    id:'d4qdvckB9WARtyFVIz3f'
  },
  {
    name: 'Current Property Value',
    dataType: 'MONETORY',
    fieldKey: `opportunity.current_property_value`,
    id: 'e3FIszY0wREPVfkeRoYC'
  },
  {
    name: 'Mortgage Outstanding',
    dataType: 'MONETORY',
    fieldKey: `opportunity.mortgage_outstanding`,
    id: 'I7VNwpKlKvpwaFtA53Ar'
  },
  {
    name: 'Lender or Landlord Details',
    dataType: 'LARGE_TEXT',
    fieldKey: `opportunity.lender_or_landlord_details`,
    id: 'HmHv5JnpHzIODBT2qEEh'
  },
  {
    name: 'Previous Address',
    dataType: 'TEXT',
    fieldKey: `opportunity.previous_address`,
    id:'dywIoEUlyE2ZGmysXEfE'
  },
  {
    name: 'Previous Move In Date',
    dataType: 'DATE',
    fieldKey: `opportunity.previous_move_in_date`,
    id: '7n2xue7WTQClkZhf8jG3'
  },
  {
    name: 'Previous Move Out Date',
    dataType: 'DATE',
    fieldKey: `opportunity.previous_move_out_date`,
    id:'xulQheCKPk5o9IJMK22K'
  },
  {
    name: 'Tax Country',
    dataType: 'TEXT',
    fieldKey: `opportunity.tax_country`,
    id:'X1QXjxeN1CqIWOhzGYjZ'
  },
  {
    name: 'Has Children',
    dataType: 'RADIO',
    fieldKey: `opportunity.has_children`,
    id:'UEK8S1mlijCMyopqJSuh'
  },
  {
    name: 'Children Details',
    dataType: 'LARGE_TEXT',
    fieldKey: `opportunity.children`,
    id:'bHYLiQmgofUAl5uZKscv'
  },

  // Employment Details Fields (from Step 4 schema)
  {
    name: 'Employment Status',
    dataType: 'SINGLE_OPTIONS',
    fieldKey: `opportunity.aip_employment_status`,
    id:'AsVjF2Mdqo14bYL2ZFzv',
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
    fieldKey: `opportunity.job_title`,
    id:'CY95ZGTgPR5JVpiKDjz5'
  },
  {
    name: 'Employer Name',
    dataType: 'TEXT',
    fieldKey: `opportunity.employer_name`,
    id:'jizzoVPyAu2AXC8fHdTV'
  },
  {
    name: 'Employer Address',
    dataType: 'TEXT',
    fieldKey: `opportunity.employer_address`,
    id:'vJg3YJKvWuFZyGxzu3aQ'
  },
  {
    name: 'Gross Annual Salary',
    dataType: 'MONETORY',
    fieldKey: `opportunity.gross_annual_salary`,
    id:'nEAl2uLbdN5kWB4Kfdwh'
  },
  {
    name: 'Net Monthly Income',
    dataType: 'MONETORY',
    fieldKey: `opportunity.net_monthly_income`,
    id:'MviDCO3YCXOFlwMLUUbD'
  },
  {
    name: 'Employment Start Date',
    dataType: 'DATE',
    fieldKey: `opportunity.employment_start_date`,
    id:'iT0rcWWRccbsCMLA8umr'
  },
  {
    name: 'Previous Employment Details',
    dataType: 'LARGE_TEXT',
    fieldKey: `opportunity.previous_employment_details`,
    id:'dvmsakMCgiPgGDbQm13T'
  },
  {
    name: 'Business Name',
    dataType: 'TEXT',
    fieldKey: `opportunity.business_name`,
    id:'4UVkzV78KzEbvZy9e93V'
  },
  {
    name: 'Business Address',
    dataType: 'TEXT',
    fieldKey: `opportunity.business_address`,
    id:'tpwKcZZdJlfIf2E6ddD6'
  },
  {
    name: 'Business Website',
    dataType: 'TEXT',
    fieldKey: `opportunity.business_website`,
    id:'q1jnMU2Z3pyScgrIWOwG'
  },
  {
    name: 'Company Creation Date',
    dataType: 'DATE',
    fieldKey: `opportunity.company_creation_date`,
    id:'UqgRl71hxbuYMwNE2mCc'
  },
  {
    name: 'Total Gross Annual Income',
    dataType: 'MONETORY',
    fieldKey: `opportunity.total_gross_annual_income`,
    id:'CkCucbSZtAcolp4artfa'
  },
  {
    name: 'Net Annual Income',
    dataType: 'MONETORY',
    fieldKey: `opportunity.net_annual_income`,
    id:'EvG0H5oe0G97amJrO6gI'
  },
  {
    name: 'Company Stake Percentage',
    dataType: 'NUMERICAL',
    fieldKey: `opportunity.company_stake_percentage`,
    id:'4Xk8MrafjdHzOM6diFxK'
  },
  {
    name: 'Bonus Overtime Commission Details',
    dataType: 'LARGE_TEXT',
    fieldKey: `opportunity.bonus_overtime_commission_details`,
    id:'KiAQxdxpu4xLvuh1ETAY'
  },
  {
    name: 'Accountant Can Provide Info',
    dataType: 'TEXT',
    fieldKey: `opportunity.accountant_can_provide_info`,
    id:'si2FjzxcglQAbsZHhIbF'
  },
  {
    name: 'Accountant Contact Details',
    dataType: 'LARGE_TEXT',
    fieldKey: `opportunity.accountant_contact_details`,
    id:'JfEbanlDeGw6Phf1tbq0'
  },

  // Financial Information Fields (from Step 4 financial commitments)
  {
    name: 'Personal Loans',
    dataType: 'MONETORY',
    fieldKey: `opportunity.personal_loans`,
    id:'WqJfoUBPRtBmH8R5KmMI'
  },
  {
    name: 'Credit Card Debt',
    dataType: 'MONETORY',
    fieldKey: `opportunity.credit_card_debt`,
    id:'acLdAprfOdbYWgyJV00G'
  },
  {
    name: 'Car Loans Lease',
    dataType: 'MONETORY',
    fieldKey: `opportunity.car_loans_lease`,
    id:'Ud3ROaBgGKPSlteJmoVA'
  },
  {
    name: 'Has Credit or Legal Issues',
    dataType: 'RADIO',
    fieldKey: `opportunity.has_credit_or_legal_issues`,
    id:'1Ok2FAWzfzmaqgBGMwVu'
  },
  {
    name: 'Credit Legal Issues Details',
    dataType: 'LARGE_TEXT',
    fieldKey: `opportunity.credit_legal_issues_details`,
    id:'GyqDBErV6zCoBvV0jPJS'
  },

  // Portfolio & Investment Fields (from Step 5 schema)
  {
    name: 'Has Rental Properties',
    dataType: 'RADIO',
    fieldKey: `opportunity.has_rental_properties`,
    id:'coSrO4lEWvILADt0PAFI'
  },
  {
    name: 'Rental Properties',
    dataType: 'LARGE_TEXT',
    fieldKey: `opportunity.rental_properties`,
    id:'oKhjaltmj1Xs2WM14Gpl'
  },
  {
    name: 'Other Assets',
    dataType: 'LARGE_TEXT',
    fieldKey: `opportunity.other_assets`,
    id:'AHNPu1tcPbpqZRLfeWon'
  },

  // Spanish Property Fields (from Step 6 schema)
  {
    name: 'Urgency Level',
    dataType: 'SINGLE_OPTIONS',
    fieldKey: `opportunity.urgency_level`,
    id:'xVtecprExqen3HcutzLY',
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
    fieldKey: `opportunity.aip_purchase_price`,
    id:'xqZzPdoZDM4MRkL5AWfw'
  },
  {
    name: 'Deposit Available',
    dataType: 'MONETORY',
    fieldKey: `opportunity.deposit_available`,
    id:'thaQWEGbR9xg9bzw6Tci'
  },
  {
    name: 'Property Address',
    dataType: 'TEXT',
    fieldKey: `opportunity.property_address`,
    id:'TKGkjvLkETlDfb5U6RiH'
  },
  {
    name: 'Home Status',
    dataType: 'SINGLE_OPTIONS',
    fieldKey: `opportunity.aip_home_status`,
    id:'QFRCpj6xvfJoqcUCOfeB',
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
    fieldKey: `opportunity.aip_property_type`,
    id:'iVEXA1BJndwAs5PZDGzQ',
    options: [
      { key: 'urban', label: 'Urban' },
      { key: 'rustic', label: 'Rustic' },
      { key: 'commercial', label: 'Commercial' },
    ],
  },
  {
    name: 'Real Estate Agent Contact',
    dataType: 'LARGE_TEXT',
    fieldKey: `opportunity.real_estate_agent_contact`,
    id:'E8z4EqmVDVaNGPQg2B4G'
  },
  {
    name: 'Lawyer Contact',
    dataType: 'LARGE_TEXT',
    fieldKey: `opportunity.lawyer_contact`,
    id:'9fBuoxcYnsrWaerWEmqL'
  },
  {
    name: 'Additional Information',
    dataType: 'LARGE_TEXT',
    fieldKey: `opportunity.additional_information`,
    id:'EqWmlrtNnIotrLI2XBwE'
  },
]
