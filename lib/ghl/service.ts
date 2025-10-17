/**
 * GoHighLevel Service
 *
 * Business logic for managing contacts and opportunities in GHL throughout the application flow
 */

import { ghlClient, type GHLContact } from './client'
import type { Step1FormData } from '@/lib/validations/form-schemas'
import { format } from 'date-fns'

import pipeline from '@/ghl_pipeline'

const PIPELINE_ID = pipeline.id

/**
 * Get stage ID by name from pipeline configuration
 */
function getStageIdByName(stageName: string): string | null {
  const stage = pipeline.stages.find(s => s.name === stageName)
  return stage?.id || null
}

/**
 * Create or update contact and opportunity when Step 1 is completed
 * Searches for existing contact by email first, then creates or updates
 */
export async function createLeadInGHL(data: Step1FormData): Promise<{
  contactId: string
  opportunityId: string | null
  isExisting: boolean
  existingData?: {
    first_name: string
    last_name: string
    email: string
    mobile: string
    date_of_birth?: string // yyyy-MM-dd format
  }
} | null> {
  // First, check if contact exists by email
  const searchResult = await ghlClient.searchContactByEmail(data.email)

  let contactId: string | null = null
  let isExisting = false
  let existingData = undefined

  if (searchResult && searchResult.contacts && searchResult.contacts.length > 0) {
    // Contact exists - update it with new data
    const existingContact = searchResult.contacts[0]
    contactId = existingContact.id
    isExisting = true

    console.log('✅ Contact already exists:', contactId)

    // Extract existing data for form prefill (use existing data as fallback)
    existingData = {
      first_name: existingContact.firstName || data.first_name,
      last_name: existingContact.lastName || data.last_name,
      email: existingContact.email || data.email,
      mobile: existingContact.phone || data.mobile,
      date_of_birth: existingContact.dateOfBirth, // Use GHL date if available
    }

    // Update contact with new/merged data
    const updateData: Partial<GHLContact> = {
      firstName: data.first_name, // Always update with form data
      lastName: data.last_name, // Always update with form data
      phone: data.mobile, // Always update with form data
      tags: ['AIP-Application-Started', 'Lead-Source-Website'],
      source: 'AIP Fact Find Form',
    }

    // Only update DOB if provided in form and not already set in GHL
    if (data.date_of_birth && !existingContact.dateOfBirth) {
      updateData.dateOfBirth = format(data.date_of_birth, 'yyyy-MM-dd')
    } else if (data.date_of_birth) {
      // Update DOB if form has different value
      const formDateStr = format(data.date_of_birth, 'yyyy-MM-dd')
      if (formDateStr !== existingContact.dateOfBirth) {
        updateData.dateOfBirth = formDateStr
      }
    }

    await ghlClient.updateContact(contactId, updateData)
  } else {
    // Contact doesn't exist - create new one
    const contact: GHLContact = {
      firstName: data.first_name,
      lastName: data.last_name,
      email: data.email,
      phone: data.mobile,
      dateOfBirth: data.date_of_birth ? format(data.date_of_birth, 'yyyy-MM-dd') : undefined,
      tags: ['AIP-Application-Started', 'Lead-Source-Website'],
      source: 'AIP Fact Find Form',
    }

    const result = await ghlClient.createContact(contact)

    if (result) {
      contactId = result.contact.id
      console.log('✅ New contact created:', contactId)
    }
  }

  if (contactId) {
    let opportunityId: string | null = null

    // Create opportunity in "New Lead" stage
    const newLeadStageId = getStageIdByName('New Lead')

    if (newLeadStageId) {
      const oppResult = await ghlClient.createOpportunity({
        name: `AIP Application - ${data.first_name} ${data.last_name}`,
        pipelineId: PIPELINE_ID,
        pipelineStageId: newLeadStageId,
        status: 'open',
        contactId: contactId,
        source: 'AIP Fact Find Form',
      })

      if (oppResult) {
        opportunityId = oppResult.opportunity.id
      }
    }

    return { contactId, opportunityId, isExisting, existingData }
  }

  return null
}

/**
 * Update contact when Step 2 is completed
 */
export async function updateStep2InGHL(
  contactId: string,
  data: {
    nationality: string
    marital_status: string
    has_co_applicants: boolean
  }
) {
  const tags = ['AIP-Step2-Completed']

  // Add co-applicant tag if they have one
  if (data.has_co_applicants) {
    tags.push('Has-Co-Applicant')
  }

  // TODO: Map custom fields with proper IDs from settings
  // const customFields = [
  //   { id: 'xxx', key: 'nationality', field_value: data.nationality },
  //   { id: 'xxx', key: 'marital_status', field_value: data.marital_status.replace('_', ' ') },
  //   { id: 'xxx', key: 'has_co_applicants', field_value: data.has_co_applicants },
  // ];

  await ghlClient.updateContact(contactId, { tags })
  await ghlClient.removeTags(contactId, ['AIP-Step1-Only'])
}

/**
 * Update contact when Step 3 is completed
 */
export async function updateStep3InGHL(
  contactId: string,
  data: {
    homeowner_or_tenant: string
    tax_country: string
    has_children: boolean
  }
) {
  const tags = ['AIP-Step3-Completed']

  if (data.homeowner_or_tenant === 'homeowner') {
    tags.push('Current-Homeowner')
  } else {
    tags.push('Current-Tenant')
  }

  if (data.has_children) {
    tags.push('Has-Children')
  }

  // TODO: Map custom fields with proper IDs from settings
  // const customFields = [
  //   { id: 'xxx', key: 'homeowner_or_tenant', field_value: data.homeowner_or_tenant },
  //   { id: 'xxx', key: 'tax_country', field_value: data.tax_country },
  //   { id: 'xxx', key: 'has_children', field_value: data.has_children },
  // ];

  await ghlClient.updateContact(contactId, { tags })
}

/**
 * Update contact when Step 4 is completed
 */
export async function updateStep4InGHL(
  contactId: string,
  data: {
    employment_status: string
    annual_income: number
    has_credit_or_legal_issues: boolean
  }
) {
  const tags = ['AIP-Step4-Completed']

  // Employment status tags
  if (data.employment_status === 'employed') {
    tags.push('AIP-Employed')
  } else if (data.employment_status === 'self_employed' || data.employment_status === 'director') {
    tags.push('AIP-Self-Employed')
  }

  // Income bracket tags
  if (data.annual_income >= 100000) {
    tags.push('High-Income')
  } else if (data.annual_income >= 50000) {
    tags.push('Medium-Income')
  }

  if (data.has_credit_or_legal_issues) {
    tags.push('Credit-Issues-Declared')
  }

  // TODO: Map custom fields with proper IDs from settings
  // const customFields = [
  //   { id: 'xxx', key: 'employment_status', field_value: data.employment_status },
  //   { id: 'xxx', key: 'annual_income', field_value: data.annual_income },
  //   { id: 'xxx', key: 'has_credit_issues', field_value: data.has_credit_or_legal_issues },
  // ];

  await ghlClient.updateContact(contactId, { tags })
}

/**
 * Update contact when Step 5 is completed
 */
export async function updateStep5InGHL(
  contactId: string,
  data: {
    has_rental_properties: boolean
    property_count?: number
  }
) {
  const tags = ['AIP-Step5-Completed']

  if (data.has_rental_properties && data.property_count && data.property_count > 0) {
    tags.push('AIP-Portfolio-Owner')

    if (data.property_count >= 3) {
      tags.push('Large-Portfolio')
    }
  }

  // TODO: Map custom fields with proper IDs from settings
  // const customFields = [
  //   { id: 'xxx', key: 'has_rental_properties', field_value: data.has_rental_properties },
  //   { id: 'xxx', key: 'rental_property_count', field_value: data.property_count || 0 },
  // ];

  await ghlClient.updateContact(contactId, { tags })
}

/**
 * Update contact when Step 6 is completed (final submission)
 */
export async function completeApplicationInGHL(
  contactId: string,
  opportunityId: string,
  data: {
    purchase_price: number
    deposit_available: number
    property_type: string
    home_status: string
    urgency_level: string
  }
) {
  const tags = ['AIP-Application-Completed']

  // Remove all abandoned tags
  await ghlClient.removeTags(contactId, [
    'AIP-Step1-Only',
    'AIP-Abandoned-Step2',
    'AIP-Abandoned-Step3',
    'AIP-Abandoned-Step4',
    'AIP-Abandoned-Step5',
    'AIP-Abandoned-Step6',
  ])

  // Add urgency tags
  if (data.urgency_level === 'very_high' || data.urgency_level === 'high') {
    tags.push('High-Priority-Lead')
  }

  // Add property type tag
  tags.push(`Property-Type-${data.property_type}`)

  // Add home status tag
  if (data.home_status === 'primary_residence') {
    tags.push('Primary-Residence')
  } else if (data.home_status === 'second_home') {
    tags.push('Second-Home')
  } else {
    tags.push('Investment-Property')
  }

  // Calculate LTV (Loan to Value) - will be used when custom fields are mapped
  // const ltv = ((data.purchase_price - data.deposit_available) / data.purchase_price) * 100;

  // TODO: Map custom fields with proper IDs from settings
  // const customFields = [
  //   { id: 'xxx', key: 'purchase_price', field_value: data.purchase_price },
  //   { id: 'xxx', key: 'deposit_available', field_value: data.deposit_available },
  //   { id: 'xxx', key: 'loan_amount_needed', field_value: data.purchase_price - data.deposit_available },
  //   { id: 'xxx', key: 'ltv_percentage', field_value: Math.round(ltv) },
  //   { id: 'xxx', key: 'property_type', field_value: data.property_type },
  //   { id: 'xxx', key: 'home_status', field_value: data.home_status },
  //   { id: 'xxx', key: 'urgency_level', field_value: data.urgency_level },
  //   { id: 'xxx', key: 'application_status', field_value: 'Completed' },
  // ];

  await ghlClient.updateContact(contactId, { tags })

  // Move opportunity to "AIP Fact Find Submitted" stage and set monetary value
  const submittedStageId = getStageIdByName('AIP Fact Find Submitted')

  if (submittedStageId && opportunityId) {
    await ghlClient.updateOpportunity(opportunityId, {
      pipelineStageId: submittedStageId,
      monetaryValue: data.deposit_available,
    })
    console.log('✅ Opportunity updated: stage = "AIP Fact Find Submitted", value =', data.deposit_available)
  }
}

/**
 * Mark contact as abandoned at a specific step
 */
export async function markAsAbandoned(contactId: string, step: number) {
  const tag = `AIP-Abandoned-Step${step}`
  await ghlClient.addTags(contactId, [tag])

  console.log(`📊 Contact ${contactId} marked as abandoned at Step ${step}`)
}


