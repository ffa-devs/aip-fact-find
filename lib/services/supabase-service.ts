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

    // Calculate age from date_of_birth
    const calculateAge = (dateOfBirth: Date): number => {
      const today = new Date();
      const birthDate = new Date(dateOfBirth);
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      
      return age;
    };

    const age = personData.date_of_birth ? calculateAge(personData.date_of_birth) : null;

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
      
      // Update person data if needed (keep most recent info, excluding date_of_birth which is handled in Step 2)
      const updateData: Record<string, string | number | null> = {
        first_name: personData.first_name,
        last_name: personData.last_name,
        telephone: personData.telephone || null,
        mobile: personData.mobile,
        nationality: personData.nationality || null,
        updated_at: new Date().toISOString()
      };

      // Only include date_of_birth if it's provided (for backwards compatibility)
      if (personData.date_of_birth) {
        updateData.date_of_birth = personData.date_of_birth.toISOString().split('T')[0];
        updateData.age = age;
      }

      const { data: updatedPerson, error: updateError } = await supabase
        .from('people')
        .update(updateData)
        .eq('id', existingPerson.id)
        .select()
        .single();

      if (updateError) {
        console.error('Error updating person:', updateError);
        return { success: false, error: 'Failed to update person data' };
      }

      return { success: true, person: updatedPerson };
    }

    // Create new person (date_of_birth is now nullable)
    const { data: newPerson, error: createError } = await supabase
      .from('people')
      .insert({
        email: personData.email.toLowerCase(),
        first_name: personData.first_name,
        last_name: personData.last_name,
        date_of_birth: personData.date_of_birth ? personData.date_of_birth.toISOString().split('T')[0] : null,
        age: age, // Calculate and save age
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
        age: age,
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

    // Update person with date_of_birth, nationality, telephone, and LinkedIn profile
    const { error: personUpdateError } = await supabase
      .from('people')
      .update({
        date_of_birth: step2Data.date_of_birth ? step2Data.date_of_birth.toISOString().split('T')[0] : null,
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
          // Create co-applicant participant (age will be calculated from date_of_birth by findOrCreatePerson)
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
        // Store property-specific date fields in applications table
        move_in_date: (() => {
          const date = step3Data.move_in_date;
          if (!date) return null;
          return date instanceof Date ? date.toISOString().split('T')[0] : new Date(date).toISOString().split('T')[0];
        })(),
        updated_at: new Date().toISOString()
      })
      .eq('id', applicationId);

    if (stepError) {
      console.error('Error updating application step:', stepError);
      return { success: false, error: stepError.message };
    }

    // Update primary applicant participant data (without date fields)
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

        // Insert new employment details with proper date handling
        const employmentData = {
          participant_id: primaryParticipant.id,
          ...step4Data.employment_details,
          employment_start_date: (() => {
            const date = step4Data.employment_details.employment_start_date;
            if (!date) return null;
            return date instanceof Date ? date.toISOString().split('T')[0] : new Date(date).toISOString().split('T')[0];
          })(),
          company_creation_date: (() => {
            const date = step4Data.employment_details.company_creation_date;
            if (!date) return null;
            return date instanceof Date ? date.toISOString().split('T')[0] : new Date(date).toISOString().split('T')[0];
          })()
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

        // Insert new financial commitments
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
              ...coApplicant.employment_details,
              employment_start_date: (() => {
                const date = coApplicant.employment_details.employment_start_date;
                if (!date) return null;
                return date instanceof Date ? date.toISOString().split('T')[0] : new Date(date).toISOString().split('T')[0];
              })(),
              company_creation_date: (() => {
                const date = coApplicant.employment_details.company_creation_date;
                if (!date) return null;
                return date instanceof Date ? date.toISOString().split('T')[0] : new Date(date).toISOString().split('T')[0];
              })()
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

    // Save other_assets to the primary participant record
    const { data: primaryParticipant } = await supabase
      .from('application_participants')
      .select('id')
      .eq('application_id', applicationId)
      .eq('participant_role', 'primary')
      .single();

    if (primaryParticipant) {
      const { error: otherAssetsError } = await supabase
        .from('application_participants')
        .update({ 
          other_assets: step5Data.other_assets || '',
          updated_at: new Date().toISOString()
        })
        .eq('id', primaryParticipant.id);

      if (otherAssetsError) {
        console.error('Error saving other assets:', otherAssetsError);
        return { success: false, error: otherAssetsError.message };
      }
    }

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

/**
 * Transform database data from new schema back to FormState format
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function transformDatabaseToFormStateNew(dbData: any): FormState | null {
  try {
    if (!dbData || !dbData.application_participants) {
      return null;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const primaryParticipant = dbData.application_participants.find((p: any) => p.participant_role === 'primary');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const coParticipants = dbData.application_participants.filter((p: any) => p.participant_role === 'co-applicant');

    if (!primaryParticipant?.people) {
      return null;
    }

    const primaryPerson = primaryParticipant.people;

    const formState: FormState = {
      step1: {
        first_name: primaryPerson.first_name || '',
        last_name: primaryPerson.last_name || '',
        email: primaryPerson.email || '',
        mobile: primaryPerson.mobile || '',
      },
      step2: {
        date_of_birth: primaryPerson.date_of_birth ? new Date(primaryPerson.date_of_birth) : null,
        nationality: primaryPerson.nationality || '',
        marital_status: primaryParticipant.marital_status || '',
        telephone: primaryPerson.telephone || '',
        linkedin_profile_url: primaryPerson.linkedin_profile_url || '',
        has_co_applicants: coParticipants.length > 0,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        co_applicants: coParticipants.map((coParticipant: any) => {
          const coPerson = coParticipant.people;
          return {
            first_name: coPerson.first_name,
            last_name: coPerson.last_name,
            date_of_birth: new Date(coPerson.date_of_birth),
            email: coPerson.email,
            mobile: coPerson.mobile,
            nationality: coPerson.nationality,
            marital_status: coParticipant.marital_status,
            applicant_order: coParticipant.participant_order,
          };
        }),
      },
      step3: {
        same_address_as_primary: false, // Default
        current_address: primaryParticipant.current_address || '',
        move_in_date: null, // Calculate from time_at_current_address if needed
        homeowner_or_tenant: primaryParticipant.homeowner_or_tenant || '',
        monthly_mortgage_or_rent: primaryParticipant.monthly_mortgage_or_rent || 0,
        monthly_payment_currency: 'EUR', // Default
        current_property_value: primaryParticipant.current_property_value || 0,
        property_value_currency: 'EUR', // Default
        mortgage_outstanding: primaryParticipant.mortgage_outstanding || 0,
        mortgage_outstanding_currency: 'EUR', // Default
        lender_or_landlord_details: primaryParticipant.lender_or_landlord_details || '',
        tax_country: primaryParticipant.tax_country || '',
        has_children: (primaryPerson.person_children?.length || 0) > 0,
        children: primaryPerson.person_children || [],
        co_applicants: [], // Would need to populate this for each co-applicant
      },
      step4: {
        employment_status: primaryParticipant.employment_status || '',
        employment_details: primaryParticipant.employment_details?.[0] || {},
        financial_commitments: primaryParticipant.financial_commitments?.[0] || {},
        co_applicants: [], // Would need to populate this for each co-applicant
      },
      step5: {
        has_rental_properties: (dbData.rental_properties?.length || 0) > 0,
        rental_properties: dbData.rental_properties || [],
        other_assets: primaryParticipant.other_assets || '',
      },
      step6: {
        urgency_level: dbData.urgency_level || '',
        purchase_price: dbData.purchase_price || 0,
        deposit_available: dbData.deposit_available || 0,
        property_address: dbData.property_address || '',
        home_status: dbData.home_status || '',
        property_type: dbData.property_type || '',
        real_estate_agent_contact: dbData.real_estate_agent_contact || '',
        lawyer_contact: dbData.lawyer_contact || '',
        additional_information: dbData.additional_notes || '',
        authorization_consent: dbData.status === 'submitted',
      },
      currentStep: dbData.current_step || 1,
      applicationId: dbData.id,
      isCompleted: dbData.status === 'submitted',
      ghlContactId: dbData.ghl_contact_id,
      ghlOpportunityId: dbData.ghl_opportunity_id || null,
    };

    return formState;
  } catch (error) {
    console.error('Error transforming database data to form state:', error);
    return null;
  }
}

/**
 * Save Step 3 data for a specific participant (for backward compatibility with applicant routes)
 */
export async function saveStep3DataForParticipant(
  applicationId: string,
  participantOrder: number,
  step3Data: Record<string, unknown>
): Promise<{ success: boolean; error?: string }> {
  try {
    console.log(`📝 Saving Step 3 data for participant ${participantOrder} in application:`, applicationId);

    // Get the participant
    const { data: participant, error: participantError } = await supabase
      .from('application_participants')
      .select('id, person_id')
      .eq('application_id', applicationId)
      .eq('participant_order', participantOrder)
      .single();

    if (participantError || !participant) {
      console.error('Error finding participant:', participantError);
      return { success: false, error: `Participant with order ${participantOrder} not found` };
    }

    // Calculate time at address in months for storage
    const moveInDate = step3Data.move_in_date ? new Date(step3Data.move_in_date as string) : null;
    const now = new Date();
    let timeAtCurrentYears = 0;
    let timeAtCurrentMonths = 0;

    if (moveInDate) {
      const diffTime = Math.abs(now.getTime() - moveInDate.getTime());
      const diffMonths = Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 30.44)); // Approximate months
      timeAtCurrentYears = Math.floor(diffMonths / 12);
      timeAtCurrentMonths = diffMonths % 12;
    }

    // Update participant with property information
    const { error: updateError } = await supabase
      .from('application_participants')
      .update({
        current_address: step3Data.current_address,
        time_at_current_address_years: timeAtCurrentYears,
        time_at_current_address_months: timeAtCurrentMonths,
        tax_country: step3Data.tax_country,
        homeowner_or_tenant: step3Data.homeowner_or_tenant,
        monthly_mortgage_or_rent: step3Data.monthly_mortgage_or_rent,
        current_property_value: step3Data.current_property_value,
        mortgage_outstanding: step3Data.mortgage_outstanding,
        lender_or_landlord_details: step3Data.lender_or_landlord_details,
      })
      .eq('id', participant.id);

    if (updateError) {
      console.error('Error updating participant property data:', updateError);
      return { success: false, error: 'Failed to update participant property data' };
    }

    // Handle children (stored in person_children table linked to person_id)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (step3Data.has_children && (step3Data.children as any[])?.length > 0) {
      // Delete existing children for this person
      await supabase
        .from('person_children')
        .delete()
        .eq('person_id', participant.person_id);

      // Insert new children
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const childrenData = (step3Data.children as any[]).map((child: Record<string, unknown>) => {
        const birthDate = new Date(child.date_of_birth as string);
        const age = now.getFullYear() - birthDate.getFullYear();
        
        return {
          person_id: participant.person_id,
          age: age,
          date_of_birth: birthDate.toISOString().split('T')[0],
        };
      });

      const { error: childrenError } = await supabase
        .from('person_children')
        .insert(childrenData);

      if (childrenError) {
        console.error('Error inserting children data:', childrenError);
        return { success: false, error: 'Failed to save children data' };
      }
    } else {
      // Remove children if has_children is false
      await supabase
        .from('person_children')
        .delete()
        .eq('person_id', participant.person_id);
    }

    console.log(`✅ Step 3 saved successfully for participant ${participantOrder}`);
    return { success: true };

  } catch (error) {
    console.error('Error in saveStep3DataForParticipant:', error);
    return { success: false, error: 'Internal server error' };
  }
}

/**
 * Save Step 4 data for a specific participant (for backward compatibility with applicant routes)
 */
export async function saveStep4DataForParticipant(
  applicationId: string,
  participantOrder: number,
  step4Data: Record<string, unknown>
): Promise<{ success: boolean; error?: string }> {
  try {
    console.log(`📝 Saving Step 4 data for participant ${participantOrder} in application:`, applicationId);

    // Get the participant
    const { data: participant, error: participantError } = await supabase
      .from('application_participants')
      .select('id')
      .eq('application_id', applicationId)
      .eq('participant_order', participantOrder)
      .single();

    if (participantError || !participant) {
      console.error('Error finding participant:', participantError);
      return { success: false, error: `Participant with order ${participantOrder} not found` };
    }

    // Update participant employment status
    await supabase
      .from('application_participants')
      .update({
        employment_status: step4Data.employment_status,
      })
      .eq('id', participant.id);

    // Handle employment details (upsert)
    const employmentDetails = {
      participant_id: participant.id,
      // Employed fields
      job_title: step4Data.job_title,
      employer_name: step4Data.employer_name,
      employer_address: step4Data.employer_address,
      gross_annual_salary: step4Data.gross_annual_salary,
      net_monthly_income: step4Data.net_monthly_income,
      employment_start_date: (() => {
        const date = step4Data.employment_start_date;
        if (!date) return null;
        
        if (date instanceof Date) {
          return date.toISOString().split('T')[0];
        }
        
        if (typeof date === 'string') {
          const parsedDate = new Date(date);
          return !isNaN(parsedDate.getTime()) ? parsedDate.toISOString().split('T')[0] : null;
        }
        
        return null;
      })(),
      previous_employment_details: step4Data.previous_employment_details,
      // Self-employed/Director fields
      business_name: step4Data.business_name,
      business_address: step4Data.business_address,
      business_website: step4Data.business_website,
      company_creation_date: (() => {
        const date = step4Data.company_creation_date;
        if (!date) return null;
        
        if (date instanceof Date) {
          return date.toISOString().split('T')[0];
        }
        
        if (typeof date === 'string' && date.trim()) {
          const parsedDate = new Date(date);
          return isNaN(parsedDate.getTime()) ? null : parsedDate.toISOString().split('T')[0];
        }
        
        return null;
      })(),
      total_gross_annual_income: step4Data.total_gross_annual_income,
      net_annual_income: step4Data.net_annual_income,
      bonus_overtime_commission_details: step4Data.bonus_overtime_commission_details,
      company_stake_percentage: step4Data.company_stake_percentage,
      accountant_can_provide_info: step4Data.accountant_can_provide_info,
      accountant_contact_details: step4Data.accountant_contact_details,
    };

    // Check if employment details already exist
    const { data: existingEmployment } = await supabase
      .from('employment_details')
      .select('id')
      .eq('participant_id', participant.id)
      .single();

    if (existingEmployment) {
      // Update existing
      await supabase
        .from('employment_details')
        .update(employmentDetails)
        .eq('id', existingEmployment.id);
    } else {
      // Insert new
      await supabase
        .from('employment_details')
        .insert(employmentDetails);
    }

    // Handle financial commitments (upsert)
    const financialCommitments = {
      participant_id: participant.id,
      personal_loans: step4Data.personal_loans || 0,
      credit_card_debt: step4Data.credit_card_debt || 0,
      car_loans_lease: step4Data.car_loans_lease || 0,
      has_credit_or_legal_issues: step4Data.has_credit_or_legal_issues || false,
      credit_legal_issues_details: step4Data.credit_legal_issues_details,
    };

    // Check if financial commitments already exist
    const { data: existingCommitments } = await supabase
      .from('financial_commitments')
      .select('id')
      .eq('participant_id', participant.id)
      .single();

    if (existingCommitments) {
      // Update existing
      await supabase
        .from('financial_commitments')
        .update(financialCommitments)
        .eq('id', existingCommitments.id);
    } else {
      // Insert new
      await supabase
        .from('financial_commitments')
        .insert(financialCommitments);
    }

    console.log(`✅ Step 4 saved successfully for participant ${participantOrder}`);
    return { success: true };

  } catch (error) {
    console.error('Error in saveStep4DataForParticipant:', error);
    return { success: false, error: 'Internal server error' };
  }
}