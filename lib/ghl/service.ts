/**
 * GoHighLevel Service
 * 
 * Business logic for managing contacts and opportunities in GHL throughout the application flow
 */

import { ghlClient, type GHLContact } from './client';
import type { Step1FormData } from '@/lib/validations/form-schemas';
import { format } from 'date-fns';

const PIPELINE_ID = process.env.GHL_PIPELINE_ID || 'ZnZrgR1xfUXiw1K7GaJw';

// Cache for pipeline stages (loaded once)
let pipelineStages: { id: string; name: string }[] = [];

/**
 * Load pipeline stages from GHL
 */
async function loadPipelineStages() {
  if (pipelineStages.length === 0) {
    const stages = await ghlClient.getPipelineStages(PIPELINE_ID);
    pipelineStages = stages.map(s => ({ id: s.id, name: s.name }));
    console.log('📊 Loaded pipeline stages:', pipelineStages);
  }
  return pipelineStages;
}

/**
 * Get stage ID by name
 */
async function getStageIdByName(stageName: string): Promise<string | null> {
  await loadPipelineStages();
  const stage = pipelineStages.find(s => s.name === stageName);
  return stage?.id || null;
}

/**
 * Create initial contact and opportunity when Step 1 is completed
 */
export async function createLeadInGHL(data: Step1FormData): Promise<{ contactId: string; opportunityId: string | null } | null> {
  const contact: GHLContact = {
    firstName: data.first_name,
    lastName: data.last_name,
    email: data.email,
    phone: data.mobile,
    dateOfBirth: data.date_of_birth ? format(data.date_of_birth, 'yyyy-MM-dd') : undefined,
    tags: ['AIP-Application-Started', 'Lead-Source-Website'],
    source: 'AIP Fact Find Form',
  };

  const result = await ghlClient.createContact(contact);
  
  if (result) {
    const contactId = result.contact.id;
    let opportunityId: string | null = null;

    // Create opportunity in "New Lead" stage
    const newLeadStageId = await getStageIdByName('New Lead');
    
    if (newLeadStageId) {
      const oppResult = await ghlClient.createOpportunity({
        name: `AIP Application - ${data.first_name} ${data.last_name}`,
        pipelineId: PIPELINE_ID,
        pipelineStageId: newLeadStageId,
        status: 'open',
        contactId: contactId,
        source: 'AIP Fact Find Form',
      });

      if (oppResult) {
        opportunityId = oppResult.opportunity.id;
      }
    }

    return { contactId, opportunityId };
  }
  
  return null;
}

/**
 * Update contact when Step 2 is completed
 */
export async function updateStep2InGHL(
  contactId: string,
  data: {
    nationality: string;
    marital_status: string;
    has_co_applicants: boolean;
  }
) {
  const tags = ['AIP-Step2-Completed'];
  
  // Add co-applicant tag if they have one
  if (data.has_co_applicants) {
    tags.push('Has-Co-Applicant');
  }

  const customFields = {
    nationality: data.nationality,
    marital_status: data.marital_status.replace('_', ' '),
    has_co_applicants: data.has_co_applicants,
  };

  await ghlClient.updateContact(contactId, { tags, customFields });
  await ghlClient.removeTags(contactId, ['AIP-Step1-Only']);
}

/**
 * Update contact when Step 3 is completed
 */
export async function updateStep3InGHL(
  contactId: string,
  data: {
    homeowner_or_tenant: string;
    tax_country: string;
    has_children: boolean;
  }
) {
  const tags = ['AIP-Step3-Completed'];

  if (data.homeowner_or_tenant === 'homeowner') {
    tags.push('Current-Homeowner');
  } else {
    tags.push('Current-Tenant');
  }

  if (data.has_children) {
    tags.push('Has-Children');
  }

  const customFields = {
    homeowner_or_tenant: data.homeowner_or_tenant,
    tax_country: data.tax_country,
    has_children: data.has_children,
  };

  await ghlClient.updateContact(contactId, { tags, customFields });
}

/**
 * Update contact when Step 4 is completed
 */
export async function updateStep4InGHL(
  contactId: string,
  data: {
    employment_status: string;
    annual_income: number;
    has_credit_or_legal_issues: boolean;
  }
) {
  const tags = ['AIP-Step4-Completed'];

  // Employment status tags
  if (data.employment_status === 'employed') {
    tags.push('AIP-Employed');
  } else if (data.employment_status === 'self_employed' || data.employment_status === 'director') {
    tags.push('AIP-Self-Employed');
  }

  // Income bracket tags
  if (data.annual_income >= 100000) {
    tags.push('High-Income');
  } else if (data.annual_income >= 50000) {
    tags.push('Medium-Income');
  }

  if (data.has_credit_or_legal_issues) {
    tags.push('Credit-Issues-Declared');
  }

  const customFields = {
    employment_status: data.employment_status,
    annual_income: data.annual_income,
    has_credit_issues: data.has_credit_or_legal_issues,
  };

  await ghlClient.updateContact(contactId, { tags, customFields });
}

/**
 * Update contact when Step 5 is completed
 */
export async function updateStep5InGHL(
  contactId: string,
  data: {
    has_rental_properties: boolean;
    property_count?: number;
  }
) {
  const tags = ['AIP-Step5-Completed'];

  if (data.has_rental_properties && data.property_count && data.property_count > 0) {
    tags.push('AIP-Portfolio-Owner');
    
    if (data.property_count >= 3) {
      tags.push('Large-Portfolio');
    }
  }

  const customFields = {
    has_rental_properties: data.has_rental_properties,
    rental_property_count: data.property_count || 0,
  };

  await ghlClient.updateContact(contactId, { tags, customFields });
}

/**
 * Update contact when Step 6 is completed (final submission)
 */
export async function completeApplicationInGHL(
  contactId: string,
  opportunityId: string,
  data: {
    purchase_price: number;
    deposit_available: number;
    property_type: string;
    home_status: string;
    urgency_level: string;
  }
) {
  const tags = ['AIP-Application-Completed'];

  // Remove all abandoned tags
  await ghlClient.removeTags(contactId, [
    'AIP-Step1-Only',
    'AIP-Abandoned-Step2',
    'AIP-Abandoned-Step3',
    'AIP-Abandoned-Step4',
    'AIP-Abandoned-Step5',
    'AIP-Abandoned-Step6',
  ]);

  // Add urgency tags
  if (data.urgency_level === 'very_high' || data.urgency_level === 'high') {
    tags.push('High-Priority-Lead');
  }

  // Add property type tag
  tags.push(`Property-Type-${data.property_type}`);

  // Add home status tag
  if (data.home_status === 'primary_residence') {
    tags.push('Primary-Residence');
  } else if (data.home_status === 'second_home') {
    tags.push('Second-Home');
  } else {
    tags.push('Investment-Property');
  }

  // Calculate LTV (Loan to Value)
  const ltv = ((data.purchase_price - data.deposit_available) / data.purchase_price) * 100;

  const customFields = {
    purchase_price: data.purchase_price,
    deposit_available: data.deposit_available,
    loan_amount_needed: data.purchase_price - data.deposit_available,
    ltv_percentage: Math.round(ltv),
    property_type: data.property_type,
    home_status: data.home_status,
    urgency_level: data.urgency_level,
    application_status: 'Completed',
  };

  await ghlClient.updateContact(contactId, { tags, customFields });

  // Move opportunity to "AIP Fact Find Submitted" stage
  const submittedStageId = await getStageIdByName('AIP Fact Find Submitted');
  
  if (submittedStageId && opportunityId) {
    await ghlClient.updateOpportunityStage(opportunityId, submittedStageId);
    console.log('✅ Opportunity moved to "AIP Fact Find Submitted" stage');
  }
}

/**
 * Mark contact as abandoned at a specific step
 */
export async function markAsAbandoned(contactId: string, step: number) {
  const tag = `AIP-Abandoned-Step${step}`;
  await ghlClient.addTags(contactId, [tag]);
  
  console.log(`📊 Contact ${contactId} marked as abandoned at Step ${step}`);
}
