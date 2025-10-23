import { supabaseAdmin as supabase } from '@/lib/supabase/server';
import { FormState } from '@/lib/types/application';

/**
 * NEW SERVICE FUNCTIONS FOR NORMALIZED SCHEMA
 * These functions work with the new people/application_participants structure
 */

export interface Person {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  telephone?: string;
  mobile: string;
  nationality?: string;
  created_at: string;
  updated_at: string;
}

export interface ApplicationParticipant {
  id: string;
  application_id: string;
  person_id: string;
  participant_role: 'primary' | 'co-applicant';
  participant_order: number;
  marital_status?: string;
  current_address?: string;
  time_at_current_address_years?: number;
  time_at_current_address_months?: number;
  tax_country?: string;
  homeowner_or_tenant?: string;
  monthly_mortgage_or_rent?: number;
  current_property_value?: number;
  mortgage_outstanding?: number;
  lender_or_landlord_details?: string;
  employment_status?: string;
  relationship_to_primary?: string;
  same_address_as_primary?: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Find or create a person by email and basic info
 */
export async function findOrCreatePerson(personData: {
  email: string;
  first_name: string;
  last_name: string;
  date_of_birth?: Date | null;
  telephone?: string;
  mobile: string;
  nationality?: string;
}): Promise<{ success: boolean; person?: Person; error?: string }> {
  try {
    console.log('🔍 Finding or creating person with email:', personData.email);

    // First try to find existing person
    const { data: existingPerson, error: findError } = await supabase
      .from('people')
      .select('*')
      .eq('email', personData.email.toLowerCase())
      .single();

    if (findError && findError.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Error finding person:', findError);
      return { success: false, error: 'Database error while finding person' };
    }

    if (existingPerson) {
      console.log('✅ Found existing person:', existingPerson.id);
      
      // Update person data if needed (keep most recent info)
      const { data: updatedPerson, error: updateError } = await supabase
        .from('people')
        .update({
          first_name: personData.first_name,
          last_name: personData.last_name,
          date_of_birth: personData.date_of_birth ? personData.date_of_birth.toISOString().split('T')[0] : null,
          telephone: personData.telephone,
          mobile: personData.mobile,
          nationality: personData.nationality,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingPerson.id)
        .select()
        .single();

      if (updateError) {
        console.error('Error updating person:', updateError);
        return { success: false, error: 'Failed to update person data' };
      }

      return { success: true, person: updatedPerson };
    }

    // Create new person
    const { data: newPerson, error: createError } = await supabase
      .from('people')
      .insert({
        email: personData.email.toLowerCase(),
        first_name: personData.first_name,
        last_name: personData.last_name,
        date_of_birth: personData.date_of_birth ? personData.date_of_birth.toISOString().split('T')[0] : null,
        telephone: personData.telephone,
        mobile: personData.mobile,
        nationality: personData.nationality
      })
      .select()
      .single();

    if (createError) {
      console.error('Error creating person:', createError);
      console.error('Person data being inserted:', {
        email: personData.email.toLowerCase(),
        first_name: personData.first_name,
        last_name: personData.last_name,
        date_of_birth: personData.date_of_birth ? personData.date_of_birth.toISOString().split('T')[0] : null,
        telephone: personData.telephone,
        mobile: personData.mobile,
        nationality: personData.nationality
      });
      return { success: false, error: `Failed to create person: ${createError.message || createError.code}` };
    }

    console.log('✅ Created new person:', newPerson.id);
    return { success: true, person: newPerson };

  } catch (error) {
    console.error('Error in findOrCreatePerson:', error);
    return { success: false, error: 'Unexpected error' };
  }
}

/**
 * Create or update application participant
 */
export async function createOrUpdateParticipant(
  applicationId: string,
  personId: string,
  participantRole: 'primary' | 'co-applicant',
  participantOrder: number,
  participantData: Partial<ApplicationParticipant>
): Promise<{ success: boolean; participant?: ApplicationParticipant; error?: string }> {
  try {
    console.log(`🔍 Creating/updating ${participantRole} participant for application:`, applicationId);

    // Check if participant already exists
    const { data: existing, error: findError } = await supabase
      .from('application_participants')
      .select('*')
      .eq('application_id', applicationId)
      .eq('person_id', personId)
      .single();

    if (findError && findError.code !== 'PGRST116') {
      console.error('Error finding participant:', findError);
      console.error('Query params:', { applicationId, personId });
      return { success: false, error: `Database error while finding participant: ${findError.message || findError.code}` };
    }

    const participantPayload = {
      application_id: applicationId,
      person_id: personId,
      participant_role: participantRole,
      participant_order: participantOrder,
      ...participantData,
      updated_at: new Date().toISOString()
    };

    if (existing) {
      // Update existing participant
      const { data: updated, error: updateError } = await supabase
        .from('application_participants')
        .update(participantPayload)
        .eq('id', existing.id)
        .select()
        .single();

      if (updateError) {
        console.error('Error updating participant:', updateError);
        return { success: false, error: 'Failed to update participant' };
      }

      console.log('✅ Updated existing participant:', updated.id);
      return { success: true, participant: updated };
    } else {
      // Create new participant
      const { data: created, error: createError } = await supabase
        .from('application_participants')
        .insert(participantPayload)
        .select()
        .single();

      if (createError) {
        console.error('Error creating participant:', createError);
        console.error('Participant payload:', participantPayload);
        return { success: false, error: `Failed to create participant: ${createError.message || createError.code}` };
      }

      console.log('✅ Created new participant:', created.id);
      return { success: true, participant: created };
    }

  } catch (error) {
    console.error('Error in createOrUpdateParticipant:', error);
    return { success: false, error: 'Unexpected error' };
  }
}

/**
 * Save Step 1 data using new schema (basic person info only)
 */
export async function saveStep1DataNew(
  applicationId: string, 
  step1Data: FormState['step1']
): Promise<{ success: boolean; error?: string }> {
  try {
    console.log('💾 Saving Step 1 data with new schema for application:', applicationId);

    if (!step1Data.email || !step1Data.first_name || !step1Data.last_name) {
      return { success: false, error: 'Missing required fields' };
    }

    // 1. Find or create person (Step 1 only has basic contact info)
    const personResult = await findOrCreatePerson({
      email: step1Data.email,
      first_name: step1Data.first_name,
      last_name: step1Data.last_name,
      mobile: step1Data.mobile,
    });

    if (!personResult.success || !personResult.person) {
      return { success: false, error: personResult.error || 'Failed to create person' };
    }

    // 2. Create basic application participant (just link person to application)
    const participantResult = await createOrUpdateParticipant(
      applicationId,
      personResult.person.id,
      'primary',
      1,
      {} // No additional data in Step 1
    );

    if (!participantResult.success) {
      return { success: false, error: participantResult.error || 'Failed to create participant' };
    }

    console.log('✅ Successfully saved Step 1 data with new schema');
    return { success: true };

  } catch (error) {
    console.error('Error in saveStep1DataNew:', error);
    return { success: false, error: 'Unexpected error saving Step 1 data' };
  }
}

/**
 * Save Step 2 data using new schema (nationality, marital status, phone, co-applicants)
 */
export async function saveStep2DataNew(
  applicationId: string,
  step2Data: FormState['step2']
): Promise<{ success: boolean; error?: string }> {
  try {
    console.log('💾 Saving Step 2 data with new schema for application:', applicationId);

    // Find the primary participant for this application
    const { data: primaryParticipant, error: findError } = await supabase
      .from('application_participants')
      .select('id, person_id')
      .eq('application_id', applicationId)
      .eq('participant_role', 'primary')
      .eq('participant_order', 1)
      .single();

    if (findError || !primaryParticipant) {
      return { success: false, error: 'Primary participant not found' };
    }

    // Update person with nationality, telephone, and LinkedIn profile
    const { error: personUpdateError } = await supabase
      .from('people')
      .update({
        nationality: step2Data.nationality,
        telephone: step2Data.telephone,
        linkedin_profile_url: step2Data.linkedin_profile_url || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', primaryParticipant.person_id);

    if (personUpdateError) {
      console.error('Error updating person:', personUpdateError);
      return { success: false, error: 'Failed to update person data' };
    }

    // Update participant with marital status
    const { error: participantUpdateError } = await supabase
      .from('application_participants')
      .update({
        marital_status: step2Data.marital_status,
        updated_at: new Date().toISOString()
      })
      .eq('id', primaryParticipant.id);

    if (participantUpdateError) {
      console.error('Error updating participant:', participantUpdateError);
      return { success: false, error: 'Failed to update participant data' };
    }

    // Handle co-applicants if they exist
    if (step2Data.has_co_applicants && step2Data.co_applicants?.length > 0) {
      // Remove existing co-applicants first
      await supabase
        .from('application_participants')
        .delete()
        .eq('application_id', applicationId)
        .eq('participant_role', 'co-applicant');

      // Add new co-applicants
      for (let i = 0; i < step2Data.co_applicants.length; i++) {
        const coApplicant = step2Data.co_applicants[i];
        
        // Find or create person for co-applicant
        const coPersonResult = await findOrCreatePerson({
          email: coApplicant.email,
          first_name: coApplicant.first_name,
          last_name: coApplicant.last_name,
          date_of_birth: coApplicant.date_of_birth,
          mobile: coApplicant.mobile,
          telephone: coApplicant.telephone,
          nationality: coApplicant.nationality
        });

        if (coPersonResult.success && coPersonResult.person) {
          // Create co-applicant participant
          await createOrUpdateParticipant(
            applicationId,
            coPersonResult.person.id,
            'co-applicant',
            i + 2, // Start from 2 (after primary)
            {
              marital_status: coApplicant.marital_status,
              employment_status: coApplicant.employment_status
            }
          );
        }
      }
    } else {
      // Remove co-applicants if has_co_applicants is false
      await supabase
        .from('application_participants')
        .delete()
        .eq('application_id', applicationId)
        .eq('participant_role', 'co-applicant');
    }

    console.log('✅ Successfully saved Step 2 data with new schema');
    return { success: true };

  } catch (error) {
    console.error('Error in saveStep2DataNew:', error);
    return { success: false, error: 'Unexpected error saving Step 2 data' };
  }
}

/**
 * Load application data using new schema
 */
export async function loadApplicationDataNew(applicationId: string): Promise<{
  success: boolean;
  data?: {
    application: Record<string, unknown>;
    participants: ApplicationParticipant[];
    primaryApplicant: Person;
  };
  error?: string;
}> {
  try {
    console.log('📖 Loading application data with new schema:', applicationId);

    // Get application details
    const { data: application, error: appError } = await supabase
      .from('applications')
      .select('*')
      .eq('id', applicationId)
      .single();

    if (appError) {
      console.error('Error loading application:', appError);
      return { success: false, error: 'Application not found' };
    }

    // Get all participants with person data
    const { data: participantsWithPeople, error: participantsError } = await supabase
      .from('application_participants_full')
      .select('*')
      .eq('application_id', applicationId)
      .order('participant_role', { ascending: true })
      .order('participant_order', { ascending: true });

    if (participantsError) {
      console.error('Error loading participants:', participantsError);
      return { success: false, error: 'Failed to load participants' };
    }

    if (!participantsWithPeople || participantsWithPeople.length === 0) {
      return { success: false, error: 'No participants found for application' };
    }

    // Find primary applicant
    const primaryParticipant = participantsWithPeople.find(
      p => p.participant_role === 'primary' && p.participant_order === 1
    );

    if (!primaryParticipant) {
      return { success: false, error: 'Primary applicant not found' };
    }

    const primaryApplicant: Person = {
      id: primaryParticipant.person_id,
      email: primaryParticipant.email,
      first_name: primaryParticipant.first_name,
      last_name: primaryParticipant.last_name,
      date_of_birth: primaryParticipant.date_of_birth,
      telephone: primaryParticipant.telephone,
      mobile: primaryParticipant.mobile,
      nationality: primaryParticipant.nationality,
      created_at: primaryParticipant.person_created_at,
      updated_at: primaryParticipant.person_updated_at
    };

    const participants: ApplicationParticipant[] = participantsWithPeople.map(p => ({
      id: p.participant_id,
      application_id: p.application_id,
      person_id: p.person_id,
      participant_role: p.participant_role as 'primary' | 'co-applicant',
      participant_order: p.participant_order,
      marital_status: p.marital_status,
      age: p.age,
      current_address: p.current_address,
      time_at_current_address_years: p.time_at_current_address_years,
      time_at_current_address_months: p.time_at_current_address_months,
      tax_country: p.tax_country,
      homeowner_or_tenant: p.homeowner_or_tenant,
      monthly_mortgage_or_rent: p.monthly_mortgage_or_rent,
      current_property_value: p.current_property_value,
      mortgage_outstanding: p.mortgage_outstanding,
      lender_or_landlord_details: p.lender_or_landlord_details,
      employment_status: p.employment_status,
      relationship_to_primary: p.relationship_to_primary,
      same_address_as_primary: p.same_address_as_primary,
      created_at: p.participant_created_at,
      updated_at: p.participant_updated_at
    }));

    console.log('✅ Successfully loaded application data with new schema');
    return {
      success: true,
      data: {
        application,
        participants,
        primaryApplicant
      }
    };

  } catch (error) {
    console.error('Error in loadApplicationDataNew:', error);
    return { success: false, error: 'Unexpected error loading application data' };
  }
}

/**
 * Check if email exists for a different application (duplicate check)
 */
export async function checkEmailExistsNew(
  email: string, 
  excludeApplicationId?: string
): Promise<{ exists: boolean; applications: string[] }> {
  try {
    console.log('🔍 Checking if email exists (new schema):', email);

    // Find person by email
    const { data: person, error: personError } = await supabase
      .from('people')
      .select('id')
      .eq('email', email.toLowerCase())
      .single();

    if (personError || !person) {
      return { exists: false, applications: [] };
    }

    // Find all applications for this person
    let query = supabase
      .from('application_participants')
      .select('application_id')
      .eq('person_id', person.id);

    if (excludeApplicationId) {
      query = query.neq('application_id', excludeApplicationId);
    }

    const { data: participants, error: participantsError } = await query;

    if (participantsError) {
      console.error('Error finding participants:', participantsError);
      return { exists: false, applications: [] };
    }

    const applications = participants?.map(p => p.application_id) || [];
    
    console.log(`Email ${email} exists in ${applications.length} applications`);
    return { exists: applications.length > 0, applications };

  } catch (error) {
    console.error('Error in checkEmailExistsNew:', error);
    return { exists: false, applications: [] };
  }
}

/**
 * Save Step 3 data (Your Home) for the new normalized schema
 */
export async function saveStep3DataNew(
  applicationId: string,
  step3Data: FormState['step3']
): Promise<{ success: boolean; error?: string }> {
  try {
    console.log('💾 Saving Step 3 data for application:', applicationId);
    
    // Update current step
    const { error: stepError } = await supabase
      .from('applications')
      .update({ 
        current_step: 3,
        updated_at: new Date().toISOString()
      })
      .eq('id', applicationId);

    if (stepError) {
      console.error('Error updating application step:', stepError);
      return { success: false, error: stepError.message };
    }

    // Update primary applicant participant data
    const { error: primaryError } = await supabase
      .from('application_participants')
      .update({
        current_address: step3Data.current_address,
        homeowner_or_tenant: step3Data.homeowner_or_tenant,
        monthly_mortgage_or_rent: step3Data.monthly_mortgage_or_rent,
        current_property_value: step3Data.current_property_value,
        mortgage_outstanding: step3Data.mortgage_outstanding,
        lender_or_landlord_details: step3Data.lender_or_landlord_details,
        tax_country: step3Data.tax_country,
        updated_at: new Date().toISOString()
      })
      .eq('application_id', applicationId)
      .eq('participant_role', 'primary');

    if (primaryError) {
      console.error('Error updating primary participant:', primaryError);
      return { success: false, error: primaryError.message };
    }

    // Handle children data - children are tied to people, not participants
    if (step3Data.has_children && step3Data.children?.length > 0) {
      // Get primary participant to find the person ID
      const { data: primaryParticipant } = await supabase
        .from('application_participants')
        .select('person_id')
        .eq('application_id', applicationId)
        .eq('participant_role', 'primary')
        .single();

      if (primaryParticipant) {
        // Delete existing children for this person (they get updated with new data)
        await supabase
          .from('person_children')
          .delete()
          .eq('person_id', primaryParticipant.person_id);

        // Insert new children - linked to person, not participant
        const now = new Date();
        const childrenData = step3Data.children.map((child) => {
          const birthDate = new Date(child.date_of_birth);
          const age = now.getFullYear() - birthDate.getFullYear();
          
          // Format date properly - handle both string and Date inputs
          const formattedDate = child.date_of_birth instanceof Date 
            ? child.date_of_birth.toISOString().split('T')[0]
            : new Date(child.date_of_birth).toISOString().split('T')[0];
          
          return {
            person_id: primaryParticipant.person_id,
            date_of_birth: formattedDate,
            age: age,
            same_address_as_primary: child.same_address_as_primary || false,
          };
        });

        const { error: childrenError } = await supabase
          .from('person_children')
          .insert(childrenData);

        if (childrenError) {
          console.error('Error saving children:', childrenError);
          return { success: false, error: `Failed to save children: ${childrenError.message}` };
        }
      }
    }

    // Handle co-applicants
    if (step3Data.co_applicants?.length > 0) {
      for (let i = 0; i < step3Data.co_applicants.length; i++) {
        const coApplicant = step3Data.co_applicants[i];
        
        // Update co-applicant participant data
        const { error: coError } = await supabase
          .from('application_participants')
          .update({
            current_address: coApplicant.current_address,
            homeowner_or_tenant: coApplicant.homeowner_or_tenant,
            monthly_mortgage_or_rent: coApplicant.monthly_mortgage_or_rent,
            current_property_value: coApplicant.current_property_value,
            mortgage_outstanding: coApplicant.mortgage_outstanding,
            lender_or_landlord_details: coApplicant.lender_or_landlord_details,
            tax_country: coApplicant.tax_country,
            same_address_as_primary: coApplicant.same_address_as_primary,
            same_children_as_primary: coApplicant.same_children_as_primary,
            updated_at: new Date().toISOString()
          })
          .eq('application_id', applicationId)
          .eq('participant_role', 'co-applicant')
          .eq('participant_order', i + 2); // Co-applicants start at order 2

        if (coError) {
          console.error(`Error updating co-applicant ${i + 1}:`, coError);
          return { success: false, error: coError.message };
        }

        // Handle co-applicant children - children are tied to people, not participants
        if (coApplicant.has_children && coApplicant.children?.length > 0) {
          const { data: coParticipant } = await supabase
            .from('application_participants')
            .select('person_id')
            .eq('application_id', applicationId)
            .eq('participant_role', 'co-applicant')
            .eq('participant_order', i + 2)
            .single();

          if (coParticipant) {
            // Delete existing children for this co-applicant person
            await supabase
              .from('person_children')
              .delete()
              .eq('person_id', coParticipant.person_id);

            // Insert new children - linked to co-applicant person
            const coChildrenData = coApplicant.children.map((child) => {
              const birthDate = new Date(child.date_of_birth);
              const currentYear = new Date().getFullYear();
              const age = currentYear - birthDate.getFullYear();
              
              // Format date properly - handle both string and Date inputs
              const formattedDate = child.date_of_birth instanceof Date 
                ? child.date_of_birth.toISOString().split('T')[0]
                : new Date(child.date_of_birth).toISOString().split('T')[0];
              
              return {
                person_id: coParticipant.person_id,
                date_of_birth: formattedDate,
                age: age,
                same_address_as_primary: child.same_address_as_primary || false,
              };
            });

            const { error: coChildrenError } = await supabase
              .from('person_children')
              .insert(coChildrenData);

            if (coChildrenError) {
              console.error(`Error saving co-applicant ${i + 1} children:`, coChildrenError);
              return { success: false, error: `Failed to save co-applicant children: ${coChildrenError.message}` };
            }
          }
        }
      }
    }

    console.log('✅ Step 3 data saved successfully');
    return { success: true };

  } catch (error) {
    console.error('Error in saveStep3DataNew:', error);
    return { success: false, error: 'Internal server error' };
  }
}

/**
 * Save Step 4 data (Employment) for the new normalized schema
 */
export async function saveStep4DataNew(
  applicationId: string,
  step4Data: FormState['step4']
): Promise<{ success: boolean; error?: string }> {
  try {
    console.log('💾 Saving Step 4 data for application:', applicationId);
    
    // Update current step
    const { error: stepError } = await supabase
      .from('applications')
      .update({ 
        current_step: 4,
        updated_at: new Date().toISOString()
      })
      .eq('id', applicationId);

    if (stepError) {
      console.error('Error updating application step:', stepError);
      return { success: false, error: stepError.message };
    }

    // Update primary applicant employment status in application_participants
    const { error: primaryStatusError } = await supabase
      .from('application_participants')
      .update({
        employment_status: step4Data.employment_status,
        updated_at: new Date().toISOString()
      })
      .eq('application_id', applicationId)
      .eq('participant_role', 'primary');

    if (primaryStatusError) {
      console.error('Error updating primary employment status:', primaryStatusError);
      return { success: false, error: primaryStatusError.message };
    }

    // Handle primary applicant employment details
    if (step4Data.employment_details) {
      const { data: primaryParticipant } = await supabase
        .from('application_participants')
        .select('id')
        .eq('application_id', applicationId)
        .eq('participant_role', 'primary')
        .single();

      if (primaryParticipant) {
        // Delete existing employment details
        await supabase
          .from('employment_details')
          .delete()
          .eq('participant_id', primaryParticipant.id);

        // Insert new employment details (without employment_status - that's in participants table)
        const employmentData = {
          participant_id: primaryParticipant.id,
          ...step4Data.employment_details
        };

        const { error: empError } = await supabase
          .from('employment_details')
          .insert(employmentData);

        if (empError) {
          console.error('Error saving employment details:', empError);
          return { success: false, error: empError.message };
        }
      }
    }

    // Handle financial commitments
    if (step4Data.financial_commitments) {
      const { data: primaryParticipant } = await supabase
        .from('application_participants')
        .select('id')
        .eq('application_id', applicationId)
        .eq('participant_role', 'primary')
        .single();

      if (primaryParticipant) {
        // Delete existing financial commitments
        await supabase
          .from('financial_commitments')
          .delete()
          .eq('participant_id', primaryParticipant.id);

        // Insert new financial commitments (treating as a single record)
        const financialData = {
          participant_id: primaryParticipant.id,
          ...step4Data.financial_commitments
        };

        const { error: finError } = await supabase
          .from('financial_commitments')
          .insert(financialData);

        if (finError) {
          console.error('Error saving financial commitments:', finError);
          return { success: false, error: finError.message };
        }
      }
    }

    // Handle co-applicants
    if (step4Data.co_applicants?.length > 0) {
      for (let i = 0; i < step4Data.co_applicants.length; i++) {
        const coApplicant = step4Data.co_applicants[i];
        
        const { data: coParticipant } = await supabase
          .from('application_participants')
          .select('id')
          .eq('application_id', applicationId)
          .eq('participant_role', 'co-applicant')
          .eq('participant_order', i + 2)
          .single();

        if (coParticipant) {
          // Update co-applicant employment status in application_participants
          const { error: coStatusError } = await supabase
            .from('application_participants')
            .update({
              employment_status: coApplicant.employment_status,
              updated_at: new Date().toISOString()
            })
            .eq('id', coParticipant.id);

          if (coStatusError) {
            console.error(`Error updating co-applicant ${i + 1} employment status:`, coStatusError);
            return { success: false, error: coStatusError.message };
          }

          // Handle co-applicant employment details
          if (coApplicant.employment_details) {
            await supabase
              .from('employment_details')
              .delete()
              .eq('participant_id', coParticipant.id);

            const coEmploymentData = {
              participant_id: coParticipant.id,
              ...coApplicant.employment_details
            };

            const { error: coEmpError } = await supabase
              .from('employment_details')
              .insert(coEmploymentData);

            if (coEmpError) {
              console.error(`Error saving co-applicant ${i + 1} employment:`, coEmpError);
              return { success: false, error: coEmpError.message };
            }
          }

          // Handle co-applicant financial commitments
          if (coApplicant.financial_commitments) {
            await supabase
              .from('financial_commitments')
              .delete()
              .eq('participant_id', coParticipant.id);

            const coFinancialData = {
              participant_id: coParticipant.id,
              ...coApplicant.financial_commitments
            };

            const { error: coFinError } = await supabase
              .from('financial_commitments')
              .insert(coFinancialData);

            if (coFinError) {
              console.error(`Error saving co-applicant ${i + 1} financial commitments:`, coFinError);
              return { success: false, error: coFinError.message };
            }
          }
        }
      }
    }

    console.log('✅ Step 4 data saved successfully');
    return { success: true };

  } catch (error) {
    console.error('Error in saveStep4DataNew:', error);
    return { success: false, error: 'Internal server error' };
  }
}

/**
 * Save Step 5 data (Financial Commitments) for the new normalized schema
 */
export async function saveStep5DataNew(
  applicationId: string,
  step5Data: FormState['step5']
): Promise<{ success: boolean; error?: string }> {
  try {
    console.log('💾 Saving Step 5 data for application:', applicationId);
    
    // Update current step
    const { error: stepError } = await supabase
      .from('applications')
      .update({ 
        current_step: 5,
        updated_at: new Date().toISOString()
      })
      .eq('id', applicationId);

    if (stepError) {
      console.error('Error updating application step:', stepError);
      return { success: false, error: stepError.message };
    }

    // Handle primary applicant rental properties
    if (step5Data.has_rental_properties && step5Data.rental_properties?.length > 0) {
      const { data: primaryParticipant } = await supabase
        .from('application_participants')
        .select('id')
        .eq('application_id', applicationId)
        .eq('participant_role', 'primary')
        .single();

      if (primaryParticipant) {
        // Delete existing rental properties
        await supabase
          .from('rental_properties')
          .delete()
          .eq('participant_id', primaryParticipant.id);

        // Insert new rental properties
        const rentalData = step5Data.rental_properties.map((rental) => ({
          participant_id: primaryParticipant.id,
          ...rental
        }));

        const { error: rentalError } = await supabase
          .from('rental_properties')
          .insert(rentalData);

        if (rentalError) {
          console.error('Error saving rental properties:', rentalError);
          return { success: false, error: rentalError.message };
        }
      }
    }

    // Handle other assets if there's a separate table for them
    // Note: The FormState has 'other_assets' as a string, but this might need 
    // to be handled differently based on your database schema

    console.log('✅ Step 5 data saved successfully');
    return { success: true };

  } catch (error) {
    console.error('Error in saveStep5DataNew:', error);
    return { success: false, error: 'Internal server error' };
  }
}

/**
 * Save Step 6 data (Additional Assets) for the new normalized schema
 */
export async function saveStep6DataNew(
  applicationId: string,
  step6Data: FormState['step6']
): Promise<{ success: boolean; error?: string }> {
  try {
    console.log('💾 Saving Step 6 data for application:', applicationId);
    
    // Update current step and mark as completed
    const { error: stepError } = await supabase
      .from('applications')
      .update({ 
        current_step: 6,
        status: 'completed', // Mark application as completed
        
        // Store Step 6 data directly on the application since it's property-specific
        purchase_price: step6Data.purchase_price,
        deposit_available: step6Data.deposit_available,
        property_address: step6Data.property_address,
        home_status: step6Data.home_status,
        property_type: step6Data.property_type,
        urgency_level: step6Data.urgency_level,
        real_estate_agent_contact: step6Data.real_estate_agent_contact,
        lawyer_contact: step6Data.lawyer_contact,
        additional_notes: step6Data.additional_information, // Map to existing column
        // Note: authorization_consent is not stored in DB, just used for form validation
        
        updated_at: new Date().toISOString()
      })
      .eq('id', applicationId);

    if (stepError) {
      console.error('Error updating application step:', stepError);
      return { success: false, error: stepError.message };
    }

    console.log('✅ Step 6 data saved successfully - Application completed');
    return { success: true };

  } catch (error) {
    console.error('Error in saveStep6DataNew:', error);
    return { success: false, error: 'Internal server error' };
  }
}