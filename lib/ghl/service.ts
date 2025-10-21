/**
 * GoHighLevel Service
 *
 * Business logic for managing contacts and opportunities in GHL throughout the application flow
 */

import { ghlClient, type GHLContact } from './client'
import type { Step1FormData } from '@/lib/validations/form-schemas'
import { format } from 'date-fns'
import { supabaseAdmin } from '@/lib/supabase/server'
import { mapFormDataToCustomFields } from './opportunity-fields'

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
 * Checks for existing opportunity in the application before creating a new one
 */
export async function createLeadInGHL(data: Step1FormData, applicationId: string): Promise<{
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

    // Check if an opportunity already exists for this application
    const { data: existingApp } = await supabaseAdmin
      .from('applications')
      .select('ghl_opportunity_id')
      .eq('id', applicationId)
      .single()

    if (existingApp?.ghl_opportunity_id) {
      // Opportunity already exists, use it
      opportunityId = existingApp.ghl_opportunity_id
      console.log('✅ Using existing opportunity:', opportunityId)
    } else {
      // Create new opportunity in "New Lead" stage
      const newLeadStageId = getStageIdByName('New Lead')

      console.log('New Lead Stage ID:', newLeadStageId)

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
          console.log('✅ New opportunity created:', opportunityId)
        }
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
  opportunityId: string | null,
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

  // Update contact tags
  await ghlClient.updateContact(contactId, { tags })
  await ghlClient.removeTags(contactId, ['AIP-Step1-Only'])

  // Update opportunity custom fields if opportunity exists
  if (opportunityId) {
    await updateOpportunityFields(opportunityId, data);
  }
}

/**
 * Update contact when Step 3 is completed
 */
export async function updateStep3InGHL(
  contactId: string,
  opportunityId: string | null,
  data: Record<string, unknown>
) {
  const tags = ['AIP-Step3-Completed']

  // Extract specific fields for tagging
  const homeownerOrTenant = data.homeowner_or_tenant as string;
  const hasChildren = data.has_children as boolean;

  if (homeownerOrTenant === 'homeowner') {
    tags.push('Current-Homeowner')
  } else if (homeownerOrTenant === 'tenant') {
    tags.push('Current-Tenant')
  }

  if (hasChildren) {
    tags.push('Has-Children')
  }

  // Update contact tags
  await ghlClient.updateContact(contactId, { tags })

  // Update opportunity custom fields with all step 3 data
  if (opportunityId) {
    await updateOpportunityFields(opportunityId, data);
  }
}

/**
 * Update contact when Step 4 is completed
 */
export async function updateStep4InGHL(
  contactId: string,
  opportunityId: string | null,
  data: Record<string, unknown>
) {
  const tags = ['AIP-Step4-Completed']

  // Extract specific fields for tagging
  const employmentStatus = data.aip_employment_status as string;
  const annualIncome = (data.total_gross_annual_income || data.gross_annual_salary) as number;
  const hasCreditIssues = data.has_credit_or_legal_issues as boolean;

  // Employment status tags
  if (employmentStatus === 'employed') {
    tags.push('AIP-Employed')
  } else if (employmentStatus === 'self_employed' || employmentStatus === 'director') {
    tags.push('AIP-Self-Employed')
  }

  // Income bracket tags
  if (annualIncome >= 100000) {
    tags.push('High-Income')
  } else if (annualIncome >= 50000) {
    tags.push('Medium-Income')
  }

  if (hasCreditIssues) {
    tags.push('Credit-Issues-Declared')
  }

  // Update contact tags
  await ghlClient.updateContact(contactId, { tags })

  // Update opportunity custom fields with all step 4 data
  if (opportunityId) {
    await updateOpportunityFields(opportunityId, data);
  }
}

/**
 * Update contact when Step 5 is completed
 */
export async function updateStep5InGHL(
  contactId: string,
  opportunityId: string | null,
  data: Record<string, unknown>
) {
  const tags = ['AIP-Step5-Completed']

  // Extract specific fields for tagging
  const hasRentalProperties = data.has_rental_properties as boolean;
  const propertyCount = data.property_count as number;

  if (hasRentalProperties && propertyCount && propertyCount > 0) {
    tags.push('AIP-Portfolio-Owner')

    if (propertyCount >= 3) {
      tags.push('Large-Portfolio')
    }
  }

  // Update contact tags
  await ghlClient.updateContact(contactId, { tags })

  // Update opportunity custom fields with all step 5 data
  if (opportunityId) {
    await updateOpportunityFields(opportunityId, data);
  }
}

/**
 * Update contact when Step 6 is completed (final submission)
 */
export async function completeApplicationInGHL(
  contactId: string,
  opportunityId: string,
  data: Record<string, unknown>
) {
  const tags = ['AIP-Application-Completed']

  // Extract specific fields for processing
  const urgencyLevel = data.urgency_level as string;
  const propertyType = data.aip_property_type as string;
  const homeStatus = data.aip_home_status as string;
  const depositAvailable = data.deposit_available as number;

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
  if (urgencyLevel === 'urgent') {
    tags.push('High-Priority-Lead')
  }

  // Add property type tag
  if (propertyType) {
    tags.push(`Property-Type-${propertyType}`)
  }

  // Add home status tag
  if (homeStatus === 'main_residence') {
    tags.push('Primary-Residence')
  } else if (homeStatus === 'holiday_home') {
    tags.push('Second-Home')
  } else if (homeStatus === 'investment') {
    tags.push('Investment-Property')
  }

  // Update contact tags
  await ghlClient.updateContact(contactId, { tags })

  // Update opportunity custom fields with all step 6 data
  await updateOpportunityFields(opportunityId, data);

  // Move opportunity to "AIP Fact Find Submitted" stage and set monetary value
  const submittedStageId = getStageIdByName('AIP Fact Find Submitted')

  if (submittedStageId && opportunityId) {
    await ghlClient.updateOpportunity(opportunityId, {
      pipelineStageId: submittedStageId,
      monetaryValue: depositAvailable || 0,
    })
    console.log('✅ Opportunity updated: stage = "AIP Fact Find Submitted", value =', depositAvailable)
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

/**
 * Update opportunity custom fields with form data
 * This function maps form data to GHL custom fields and syncs them
 */
export async function updateOpportunityFields(
  opportunityId: string,
  data: Record<string, unknown>
): Promise<boolean> {
  try {
    // Convert form data to GHL custom field format
    const customFields = mapFormDataToCustomFields(data);
    
    if (customFields.length === 0) {
      console.log('No custom fields to update for opportunity:', opportunityId);
      return true;
    }

    // Update opportunity with custom fields
    const success = await ghlClient.updateOpportunityCustomFields(opportunityId, customFields);
    
    if (success) {
      console.log(`✅ Updated ${customFields.length} custom fields for opportunity:`, opportunityId);
    } else {
      console.error('❌ Failed to update opportunity custom fields:', opportunityId);
    }
    
    return success;
  } catch (error) {
    console.error('Error updating opportunity custom fields:', error);
    return false;
  }
}


