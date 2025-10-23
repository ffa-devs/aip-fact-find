/**
 * GHL Co-Applicant Custom Object Service
 * 
 * Handles creation and management of co-applicant records in GoHighLevel
 */

import { supabaseAdmin as supabase } from '@/lib/supabase/server';
import { 
  GHLCoApplicantCustomObject, 
  GHLCoApplicantProperties, 
  GHLCoApplicantResponse,
  GHLCurrencyField
} from './co-applicant-types';
import type { FormState } from '@/lib/types/application';

/**
 * Format children details array into a readable multi-line string for co-applicants
 */
function formatCoApplicantChildrenDetails(children: Array<{
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
 * Interface for co-applicant data collected from all form steps
 */
export interface CoApplicantData {
  // From Step 2
  personalInfo: FormState['step2']['co_applicants'][0];
  // From Step 3
  addressInfo?: FormState['step3']['co_applicants'][0];
  // From Step 4
  employmentInfo?: FormState['step4']['co_applicants'][0];
}

/**
 * Create a co-applicant record in GHL Custom Objects
 */
export async function createCoApplicantRecord(
  coApplicantData: CoApplicantData,
  applicationData: {
    locationId: string;
    contactId: string; // Owner ID for the custom object
    applicationId: string;
    participantId: string; // Database participant ID for storing the record ID
  }
): Promise<{ success: boolean; recordId?: string; error?: string }> {
  try {
    console.log('🔄 Creating GHL co-applicant record for participant:', applicationData.participantId);

    // Get OAuth token
    const { data: tokenData, error: tokenError } = await supabase
      .from('ghl_oauth_tokens')
      .select('access_token')
      .eq('location_id', applicationData.locationId)
      .single();

    if (tokenError || !tokenData) {
      return { success: false, error: 'No valid GHL token found' };
    }

    // Transform form data to GHL co-applicant properties
    const properties = transformCoApplicantDataToGHL(coApplicantData);

    // Create the custom object payload
    const customObjectPayload: GHLCoApplicantCustomObject = {
      locationId: applicationData.locationId,
      owner: [applicationData.contactId],
      followers: [applicationData.contactId],
      properties
    };

    console.log('🔄 Sending co-applicant data to GHL:', {
      objectKey: 'aip_co_applicants',
      owner: customObjectPayload.owner,
      propertiesCount: Object.keys(properties).length,
      properties
    });

    // Make API call to create custom object record
    const response = await fetch('https://services.leadconnectorhq.com/objects/aip_co_applicants/records', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`,
        'Content-Type': 'application/json',
        'Version': '2021-07-28'
      },
      body: JSON.stringify(customObjectPayload)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ GHL co-applicant record creation failed:', {
        status: response.status,
        statusText: response.statusText,
        error: errorText
      });
      return { 
        success: false, 
        error: `GHL API error: ${response.status} ${response.statusText} - ${errorText}` 
      };
    }

    const recordResponse: GHLCoApplicantResponse = await response.json();
    
    console.log('✅ Co-applicant record created successfully:', {
      recordId: recordResponse.id,
      participantId: applicationData.participantId
    });

    // Save the record ID to the database
    const { error: updateError } = await supabase
      .from('application_participants')
      .update({ 
        ghl_co_applicant_record_id: recordResponse.id,
        updated_at: new Date().toISOString()
      })
      .eq('id', applicationData.participantId);

    if (updateError) {
      console.error('❌ Failed to save co-applicant record ID to database:', updateError);
      // Don't fail the whole operation, just log the error
    } else {
      console.log('✅ Co-applicant record ID saved to database');
    }

    return { 
      success: true, 
      recordId: recordResponse.id 
    };

  } catch (error) {
    console.error('❌ Error creating co-applicant record:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    };
  }
}

/**
 * Transform form co-applicant data to GHL custom object properties
 */
function transformCoApplicantDataToGHL(
  coApplicantData: CoApplicantData
): GHLCoApplicantProperties {
  const properties: Partial<GHLCoApplicantProperties> = {};
  
  // Extract data from different steps
  const { personalInfo, addressInfo, employmentInfo } = coApplicantData;

  // Helper function to format dates
  const formatDate = (date: Date | string | null | undefined): string | undefined => {
    if (!date) return undefined;
    const dateObj = date instanceof Date ? date : new Date(date);
    return dateObj.toISOString().split('T')[0]; // YYYY-MM-DD format
  };

  // Helper function to format currency
  const formatCurrency = (value: number | undefined): GHLCurrencyField | undefined => {
    return value !== undefined ? { currency: 'default', value } : undefined;
  };

  // Helper function to format boolean as string
  const formatBoolean = (value: boolean | undefined): string | undefined => {
    return value !== undefined ? (value ? 'Yes' : 'No') : undefined;
  };

  // Personal Information (from step 2)
  if (personalInfo.first_name) {
    properties['custom_objects.aip_co_applicants.first_name'] = personalInfo.first_name;
  }
  if (personalInfo.last_name) {
    properties['custom_objects.aip_co_applicants.last_name'] = personalInfo.last_name;
  }
  if (personalInfo.email) {
    properties['custom_objects.aip_co_applicants.email_address'] = personalInfo.email;
  }
  if (personalInfo.mobile) {
    properties['custom_objects.aip_co_applicants.mobile'] = personalInfo.mobile;
  }
  if (personalInfo.date_of_birth) {
    properties['custom_objects.aip_co_applicants.date_of_birth'] = formatDate(personalInfo.date_of_birth);
  }
  if (personalInfo.nationality) {
    properties['custom_objects.aip_co_applicants.nationality'] = personalInfo.nationality;
  }
  if (personalInfo.marital_status) {
    properties['custom_objects.aip_co_applicants.marital_status'] = personalInfo.marital_status;
  }
  // TODO: Add relationship_to_primary when it's available in the form
  // if (personalInfo.relationship_to_primary) {
  //   properties['custom_objects.aip_co_applicants.relationship_to_main_applicant'] = personalInfo.relationship_to_primary;
  // }

  // Address & Living Situation (from step 3)
  if (addressInfo?.same_address_as_primary !== undefined) {
    properties['custom_objects.aip_co_applicants.same_address_as_primary'] = formatBoolean(addressInfo.same_address_as_primary);
  }
  if (addressInfo?.current_address) {
    properties['custom_objects.aip_co_applicants.current_address'] = addressInfo.current_address;
  }
  if (addressInfo?.move_in_date) {
    properties['custom_objects.aip_co_applicants.move_in_date'] = formatDate(addressInfo.move_in_date);
  }
  if (addressInfo?.homeowner_or_tenant) {
    properties['custom_objects.aip_co_applicants.homeowner_or_tenant'] = addressInfo.homeowner_or_tenant;
  }
  if (addressInfo?.monthly_mortgage_or_rent !== undefined) {
    properties['custom_objects.aip_co_applicants.monthly_mortgage_or_rent'] = formatCurrency(addressInfo.monthly_mortgage_or_rent);
  }
  if (addressInfo?.current_property_value !== undefined) {
    properties['custom_objects.aip_co_applicants.current_property_value'] = formatCurrency(addressInfo.current_property_value);
  }
  if (addressInfo?.mortgage_outstanding !== undefined) {
    properties['custom_objects.aip_co_applicants.mortgage_outstanding'] = formatCurrency(addressInfo.mortgage_outstanding);
  }
  if (addressInfo?.lender_or_landlord_details) {
    properties['custom_objects.aip_co_applicants.lender_or_landlord_details'] = addressInfo.lender_or_landlord_details;
  }
  if (addressInfo?.tax_country) {
    properties['custom_objects.aip_co_applicants.tax_country'] = addressInfo.tax_country;
  }
  if (addressInfo?.has_children !== undefined) {
    properties['custom_objects.aip_co_applicants.has_children'] = formatBoolean(addressInfo.has_children);
  }
  if (addressInfo?.children && addressInfo.children.length > 0) {
    properties['custom_objects.aip_co_applicants.children'] = formatCoApplicantChildrenDetails(addressInfo.children);
  }

  // Employment Details (from step 4)
  if (employmentInfo?.employment_status) {
    properties['custom_objects.aip_co_applicants.employment_status'] = employmentInfo.employment_status;
  }
  if (employmentInfo?.employment_details?.job_title) {
    properties['custom_objects.aip_co_applicants.job_title'] = employmentInfo.employment_details.job_title;
  }
  if (employmentInfo?.employment_details?.employer_name) {
    properties['custom_objects.aip_co_applicants.employer_name'] = employmentInfo.employment_details.employer_name;
  }
  if (employmentInfo?.employment_details?.employer_address) {
    properties['custom_objects.aip_co_applicants.employer_address'] = employmentInfo.employment_details.employer_address;
  }
  if (employmentInfo?.employment_details?.gross_annual_salary !== undefined) {
    properties['custom_objects.aip_co_applicants.gross_annual_salary'] = formatCurrency(employmentInfo.employment_details.gross_annual_salary);
  }
  if (employmentInfo?.employment_details?.net_monthly_income !== undefined) {
    properties['custom_objects.aip_co_applicants.net_monthly_income'] = formatCurrency(employmentInfo.employment_details.net_monthly_income);
  }
  if (employmentInfo?.employment_details?.employment_start_date) {
    properties['custom_objects.aip_co_applicants.employment_start_date'] = formatDate(employmentInfo.employment_details.employment_start_date);
  }
  if (employmentInfo?.employment_details?.previous_employment_details) {
    properties['custom_objects.aip_co_applicants.previous_employment_details'] = employmentInfo.employment_details.previous_employment_details;
  }
  if (employmentInfo?.employment_details?.business_name) {
    properties['custom_objects.aip_co_applicants.business_name'] = employmentInfo.employment_details.business_name;
  }
  if (employmentInfo?.employment_details?.business_address) {
    properties['custom_objects.aip_co_applicants.business_address'] = employmentInfo.employment_details.business_address;
  }
  if (employmentInfo?.employment_details?.business_website) {
    properties['custom_objects.aip_co_applicants.business_website'] = employmentInfo.employment_details.business_website;
  }
  if (employmentInfo?.employment_details?.company_creation_date) {
    properties['custom_objects.aip_co_applicants.company_creation_date'] = formatDate(employmentInfo.employment_details.company_creation_date);
  }
  if (employmentInfo?.employment_details?.total_gross_annual_income !== undefined) {
    properties['custom_objects.aip_co_aplicants.total_gross_annual_income'] = formatCurrency(employmentInfo.employment_details.total_gross_annual_income);
  }
  if (employmentInfo?.employment_details?.net_annual_income !== undefined) {
    properties['custom_objects.aip_co_applicants.net_annual_income'] = formatCurrency(employmentInfo.employment_details.net_annual_income);
  }
  if (employmentInfo?.employment_details?.company_stake_percentage !== undefined) {
    properties['custom_objects.aip_co_applicants.company_stake_percentage'] = employmentInfo.employment_details.company_stake_percentage;
  }
  if (employmentInfo?.employment_details?.bonus_overtime_commission_details) {
    properties['custom_objects.aip_co_applicants.bonus_overtime_commission_details'] = employmentInfo.employment_details.bonus_overtime_commission_details;
  }
  if (employmentInfo?.employment_details?.accountant_can_provide_info !== undefined) {
    properties['custom_objects.aip_co_applicants.accountant_can_provide_info'] = formatBoolean(employmentInfo.employment_details.accountant_can_provide_info);
  }
  if (employmentInfo?.employment_details?.accountant_contact_details) {
    properties['custom_objects.aip_co_applicants.accountant_contact_details'] = employmentInfo.employment_details.accountant_contact_details;
  }

  // Financial Information (from step 4 financial commitments)
  if (employmentInfo?.financial_commitments?.personal_loans !== undefined) {
    properties['custom_objects.aip_co_applicants.personal_loans'] = formatCurrency(employmentInfo.financial_commitments.personal_loans);
  }
  if (employmentInfo?.financial_commitments?.credit_card_debt !== undefined) {
    properties['custom_objects.aip_co_applicants.credit_card_debt'] = formatCurrency(employmentInfo.financial_commitments.credit_card_debt);
  }
  if (employmentInfo?.financial_commitments?.car_loans_lease !== undefined) {
    properties['custom_objects.aip_co_applicants.car_loans_lease'] = formatCurrency(employmentInfo.financial_commitments.car_loans_lease);
  }
  if (employmentInfo?.financial_commitments?.has_credit_or_legal_issues !== undefined) {
    properties['custom_objects.aip_co_applicants.has_credit_or_legal_issues'] = formatBoolean(employmentInfo.financial_commitments.has_credit_or_legal_issues);
  }
  if (employmentInfo?.financial_commitments?.credit_legal_issues_details) {
    properties['custom_objects.aip_co_applicants.credit_legal_issues_details'] = employmentInfo.financial_commitments.credit_legal_issues_details;
  }

  return properties as GHLCoApplicantProperties;
}

/**
 * Create co-applicant records for all co-applicants in an application
 */
export async function createAllCoApplicantRecords(
  applicationId: string,
  formState: FormState,
  applicationData: {
    locationId: string;
    contactId: string;
  }
): Promise<{ success: boolean; created: number; errors: string[] }> {
  const results = {
    success: true,
    created: 0,
    errors: [] as string[]
  };

  const coApplicants = formState.step2.co_applicants;
  if (!coApplicants || coApplicants.length === 0) {
    return results; // No co-applicants to process
  }

  console.log(`🔄 Creating ${coApplicants.length} co-applicant records for application ${applicationId}`);

  // First, let's debug by checking ALL participants for this application
  const { data: allParticipants, error: allError } = await supabase
    .from('application_participants')
    .select('*')
    .eq('application_id', applicationId);

  console.log('🔍 ALL participants for application:', {
    applicationId,
    allError,
    allParticipants: allParticipants
  });

  // Also check if this application exists at all
  const { data: applicationExists, error: appError } = await supabase
    .from('applications')
    .select('id, status, current_step')
    .eq('id', applicationId)
    .single();

  console.log('🔍 Application existence check:', {
    applicationId,
    applicationExists,
    appError
  });

  // Check if there are ANY participants for this app (maybe wrong role?)
  const { data: allRoles, error: allRolesError } = await supabase
    .from('application_participants')
    .select('participant_role, participant_order, id')
    .eq('application_id', applicationId);

  console.log('🔍 All participant roles for application:', {
    applicationId,
    allRoles,
    allRolesError
  });

  // Get all co-applicant participants from the database
  const { data: participants, error: participantsError } = await supabase
    .from('application_participants')
    .select('id, participant_order')
    .eq('application_id', applicationId)
    .eq('participant_role', 'co-applicant')
    .order('participant_order');

  console.log('🔍 Database participant lookup result:', {
    participantsError,
    participantsCount: participants?.length || 0,
    participants: participants
  });

  if (participantsError || !participants) {
    results.success = false;
    results.errors.push('Failed to fetch co-applicant participants from database');
    console.error('❌ Database participant lookup failed:', participantsError);
    return results;
  }

  if (participants.length === 0) {
    results.success = false;
    results.errors.push('No co-applicant participants found in database - they may not have been saved yet');
    console.error('❌ No co-applicant participants found in database for application:', applicationId);
    return results;
  }

  // Create records for each co-applicant
  for (let i = 0; i < coApplicants.length; i++) {
    const personalInfo = coApplicants[i];
    const addressInfo = formState.step3.co_applicants?.[i]; // May not exist if same address
    const employmentInfo = formState.step4.co_applicants?.[i]; // May not exist if no employment info
    
    console.log(`🔍 Processing co-applicant ${i + 1}:`, {
      name: `${personalInfo.first_name} ${personalInfo.last_name}`,
      expectedParticipantOrder: i + 2,
      hasAddressInfo: !!addressInfo,
      hasEmploymentInfo: !!employmentInfo
    });
    
    const participant = participants.find(p => p.participant_order === i + 2); // Co-applicants start at order 2

    console.log(`🔍 Participant lookup for co-applicant ${i + 1}:`, {
      expectedOrder: i + 2,
      foundParticipant: participant,
      allParticipantOrders: participants.map(p => p.participant_order)
    });

    if (!participant) {
      const errorMsg = `No database participant found for co-applicant ${i + 1} (expected order ${i + 2})`;
      console.error('❌', errorMsg);
      results.errors.push(errorMsg);
      continue;
    }

    try {
      // Aggregate co-applicant data from all steps
      const coApplicantData: CoApplicantData = {
        personalInfo,
        addressInfo,
        employmentInfo
      };

      const result = await createCoApplicantRecord(coApplicantData, {
        locationId: applicationData.locationId,
        contactId: applicationData.contactId,
        applicationId,
        participantId: participant.id
      });

      if (result.success) {
        results.created++;
        console.log(`✅ Co-applicant ${i + 1} record created successfully`);
      } else {
        results.errors.push(`Co-applicant ${i + 1}: ${result.error}`);
        results.success = false;
      }
    } catch (error) {
      const errorMsg = `Co-applicant ${i + 1}: ${error instanceof Error ? error.message : 'Unknown error'}`;
      results.errors.push(errorMsg);
      results.success = false;
    }
  }

  console.log(`✅ Co-applicant record creation completed: ${results.created}/${coApplicants.length} created`);
  return results;
}