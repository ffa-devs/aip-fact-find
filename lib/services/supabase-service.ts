import { supabase } from '@/lib/supabase/client';
import { FormState } from '@/lib/types/application';

/**
 * Supabase Data Service for AIP Application Form
 * 
 * Handles all database operations for the multi-step application form:
 * - Create/update applications
 * - Manage applicants (primary + co-applicants)
 * - Store employment details and financial commitments
 * - Handle rental properties and additional assets
 * - Track form progress for resume functionality
 */

export interface DatabaseApplication {
  id: string;
  status: string;
  current_step: number;
  progress_percentage: number;
  ghl_contact_id?: string;
  urgency_level?: string;
  purchase_price?: number;
  deposit_available?: number;
  property_address?: string;
  property_type?: string;
  home_status?: string;
  real_estate_agent_contact?: string;
  lawyer_contact?: string;
  additional_notes?: string;
  created_at: string;
  updated_at: string;
  submitted_at?: string;
  draft_data?: Record<string, unknown>;
}

export interface DatabaseApplicant {
  id: string;
  application_id: string;
  applicant_order: number;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  age?: number;
  nationality?: string;
  marital_status?: string;
  telephone?: string;
  mobile: string;
  email: string;
  current_address?: string;
  time_at_current_address_years?: number;
  time_at_current_address_months?: number;
  previous_address?: string;
  time_at_previous_address_years?: number;
  time_at_previous_address_months?: number;
  tax_country?: string;
  homeowner_or_tenant?: string;
  monthly_mortgage_or_rent?: number;
  current_property_value?: number;
  mortgage_outstanding?: number;
  lender_or_landlord_details?: string;
  employment_status?: string;
  created_at: string;
  updated_at: string;
}

/**
 * Create a new application in the database
 */
export async function createApplication(): Promise<DatabaseApplication | null> {
  try {
    const { data, error } = await supabase
      .from('applications')
      .insert({
        status: 'draft',
        current_step: 1,
        progress_percentage: 0,
      })
      .select('id')
      .single();

    if (error) {
      console.error('Error creating application:', error);
      return null;
    }

    return data.id;
  } catch (error) {
    console.error('Error in createApplication:', error);
    return null;
  }
}

/**
 * Update application progress and metadata
 */
export async function updateApplication(
  applicationId: string, 
  updates: Partial<DatabaseApplication>
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('applications')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', applicationId);

    if (error) {
      console.error('Error updating application:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in updateApplication:', error);
    return false;
  }
}

/**
 * Save Step 1 data (Lead Capture) - Creates or updates primary applicant
 */
export async function saveStep1Data(
  applicationId: string,
  step1Data: FormState['step1']
): Promise<boolean> {
  try {
    // First check if primary applicant exists
    const { data: existingApplicant } = await supabase
      .from('applicants')
      .select('id')
      .eq('application_id', applicationId)
      .eq('applicant_order', 1)
      .single();

    const applicantData = {
      application_id: applicationId,
      applicant_order: 1,
      first_name: step1Data.first_name,
      last_name: step1Data.last_name,
      date_of_birth: step1Data.date_of_birth?.toISOString().split('T')[0],
      mobile: step1Data.mobile,
      email: step1Data.email,
    };

    if (existingApplicant) {
      // Update existing primary applicant
      const { error } = await supabase
        .from('applicants')
        .update(applicantData)
        .eq('id', existingApplicant.id);

      if (error) {
        console.error('Error updating Step 1 data:', error);
        return false;
      }
    } else {
      // Create new primary applicant
      const { error } = await supabase
        .from('applicants')
        .insert(applicantData);

      if (error) {
        console.error('Error inserting Step 1 data:', error);
        return false;
      }
    }

    // Update application progress
    await updateApplication(applicationId, {
      current_step: Math.max(2, 1), // Ensure we don't go backwards
      progress_percentage: Math.max(20, 0),
    });

    return true;
  } catch (error) {
    console.error('Error in saveStep1Data:', error);
    return false;
  }
}

/**
 * Save Step 2 data (Personal Info) - Updates primary applicant + manages co-applicants
 */
export async function saveStep2Data(
  applicationId: string,
  step2Data: FormState['step2']
): Promise<boolean> {
  try {
    // Update primary applicant with additional info
    const { data: primaryApplicant } = await supabase
      .from('applicants')
      .select('id')
      .eq('application_id', applicationId)
      .eq('applicant_order', 1)
      .single();

    if (primaryApplicant) {
      await supabase
        .from('applicants')
        .update({
          nationality: step2Data.nationality,
          marital_status: step2Data.marital_status,
          telephone: step2Data.telephone,
        })
        .eq('id', primaryApplicant.id);
    }

    // Handle co-applicants
    if (step2Data.has_co_applicants && step2Data.co_applicants.length > 0) {
      // Delete existing co-applicants first
      await supabase
        .from('applicants')
        .delete()
        .eq('application_id', applicationId)
        .gt('applicant_order', 1);

      // Insert new co-applicants
      const coApplicantData = step2Data.co_applicants.map((coApp, index) => ({
        application_id: applicationId,
        applicant_order: index + 2, // Start from 2 (primary is 1)
        first_name: coApp.first_name,
        last_name: coApp.last_name,
        date_of_birth: coApp.date_of_birth?.toISOString().split('T')[0],
        mobile: coApp.mobile,
        email: coApp.email,
        nationality: coApp.nationality,
        marital_status: coApp.marital_status,
      }));

      const { error } = await supabase
        .from('applicants')
        .insert(coApplicantData);

      if (error) {
        console.error('Error inserting co-applicants:', error);
        return false;
      }
    } else {
      // Remove co-applicants if has_co_applicants is false
      await supabase
        .from('applicants')
        .delete()
        .eq('application_id', applicationId)
        .gt('applicant_order', 1);
    }

    // Update application progress
    await updateApplication(applicationId, {
      current_step: Math.max(3, 2),
      progress_percentage: Math.max(40, 20),
    });

    return true;
  } catch (error) {
    console.error('Error in saveStep2Data:', error);
    return false;
  }
}

/**
 * Save Step 3 data (Property Info) - Updates specific applicant's property details
 */
export async function saveStep3Data(
  applicationId: string,
  applicantOrder: number,
  step3Data: Record<string, unknown> // Property data for specific applicant
): Promise<boolean> {
  try {
    // Get the applicant ID
    const { data: applicant } = await supabase
      .from('applicants')
      .select('id')
      .eq('application_id', applicationId)
      .eq('applicant_order', applicantOrder)
      .single();

    if (!applicant) {
      console.error(`Applicant with order ${applicantOrder} not found`);
      return false;
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

    // Update applicant with property information
    const { error: applicantError } = await supabase
      .from('applicants')
      .update({
        current_address: step3Data.current_address,
        time_at_current_address_years: timeAtCurrentYears,
        time_at_current_address_months: timeAtCurrentMonths,
        previous_address: step3Data.previous_address,
        tax_country: step3Data.tax_country,
        homeowner_or_tenant: step3Data.homeowner_or_tenant,
        monthly_mortgage_or_rent: step3Data.monthly_mortgage_or_rent,
        current_property_value: step3Data.current_property_value,
        mortgage_outstanding: step3Data.mortgage_outstanding,
        lender_or_landlord_details: step3Data.lender_or_landlord_details,
      })
      .eq('id', applicant.id);

    if (applicantError) {
      console.error('Error updating applicant property data:', applicantError);
      return false;
    }

    // Handle children
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (step3Data.has_children && (step3Data.children as any[])?.length > 0) {
      // Delete existing children for this applicant
      await supabase
        .from('applicant_children')
        .delete()
        .eq('applicant_id', applicant.id);

      // Insert new children
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const childrenData = (step3Data.children as any[]).map((child: Record<string, unknown>) => {
        const birthDate = new Date(child.date_of_birth as string);
        const age = now.getFullYear() - birthDate.getFullYear();
        
        return {
          applicant_id: applicant.id,
          age: age,
        };
      });

      const { error: childrenError } = await supabase
        .from('applicant_children')
        .insert(childrenData);

      if (childrenError) {
        console.error('Error inserting children data:', childrenError);
        return false;
      }
    } else {
      // Remove children if has_children is false
      await supabase
        .from('applicant_children')
        .delete()
        .eq('applicant_id', applicant.id);
    }

    // Check if this was the last applicant to complete Step 3
    const { data: allApplicants } = await supabase
      .from('applicants')
      .select('id, applicant_order, current_address')
      .eq('application_id', applicationId)
      .order('applicant_order');

    const allCompleted = allApplicants?.every(app => app.current_address) || false;

    if (allCompleted) {
      // Update application progress only when all applicants have completed Step 3
      await updateApplication(applicationId, {
        current_step: Math.max(4, 3),
        progress_percentage: Math.max(60, 40),
      });
    }

    return true;
  } catch (error) {
    console.error('Error in saveStep3Data:', error);
    return false;
  }
}

/**
 * Save Step 4 data (Employment) - Updates employment and financial data for specific applicant
 */
export async function saveStep4Data(
  applicationId: string,
  applicantOrder: number,
  step4Data: Record<string, unknown> // Employment data for specific applicant
): Promise<boolean> {
  try {
    // Get the applicant ID
    const { data: applicant } = await supabase
      .from('applicants')
      .select('id')
      .eq('application_id', applicationId)
      .eq('applicant_order', applicantOrder)
      .single();

    if (!applicant) {
      console.error(`Applicant with order ${applicantOrder} not found`);
      return false;
    }

    // Update applicant employment status
    await supabase
      .from('applicants')
      .update({
        employment_status: step4Data.employment_status,
      })
      .eq('id', applicant.id);

    // Handle employment details (upsert)
    const employmentDetails = {
      applicant_id: applicant.id,
      // Employed fields
      job_title: step4Data.job_title,
      employer_name: step4Data.employer_name,
      employer_address: step4Data.employer_address,
      gross_annual_salary: step4Data.gross_annual_salary,
      net_monthly_income: step4Data.net_monthly_income,
      employment_start_date: (step4Data.employment_start_date as Date)?.toISOString().split('T')[0],
      previous_employment_details: step4Data.previous_employment_details,
      // Self-employed/Director fields
      business_name: step4Data.business_name,
      business_address: step4Data.business_address,
      business_website: step4Data.business_website,
      company_creation_date: (step4Data.company_creation_date as Date)?.toISOString().split('T')[0],
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
      .eq('applicant_id', applicant.id)
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
      applicant_id: applicant.id,
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
      .eq('applicant_id', applicant.id)
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

    // Check if this was the last applicant to complete Step 4
    const { data: allApplicants } = await supabase
      .from('applicants')
      .select('id, applicant_order, employment_status')
      .eq('application_id', applicationId)
      .order('applicant_order');

    const allCompleted = allApplicants?.every(app => app.employment_status) || false;

    if (allCompleted) {
      // Update application progress only when all applicants have completed Step 4
      await updateApplication(applicationId, {
        current_step: Math.max(5, 4),
        progress_percentage: Math.max(80, 60),
      });
    }

    return true;
  } catch (error) {
    console.error('Error in saveStep4Data:', error);
    return false;
  }
}

/**
 * Save Step 5 data (Portfolio) - Application-wide rental properties and assets
 */
export async function saveStep5Data(
  applicationId: string,
  step5Data: FormState['step5']
): Promise<boolean> {
  try {
    // Handle rental properties
    if (step5Data.has_rental_properties && step5Data.rental_properties.length > 0) {
      // Delete existing rental properties for this application
      await supabase
        .from('rental_properties')
        .delete()
        .eq('application_id', applicationId);

      // Insert new rental properties
      const rentalData = step5Data.rental_properties.map(property => ({
        application_id: applicationId,
        property_address: property.property_address,
        current_valuation: property.current_valuation,
        mortgage_outstanding: property.mortgage_outstanding,
        monthly_mortgage_payment: property.monthly_mortgage_payment,
        monthly_rent_received: property.monthly_rent_received,
      }));

      const { error } = await supabase
        .from('rental_properties')
        .insert(rentalData);

      if (error) {
        console.error('Error inserting rental properties:', error);
        return false;
      }
    } else {
      // Remove all rental properties if has_rental_properties is false
      await supabase
        .from('rental_properties')
        .delete()
        .eq('application_id', applicationId);
    }

    // Handle other assets
    if (step5Data.other_assets?.trim()) {
      // Check if additional assets record exists
      const { data: existingAssets } = await supabase
        .from('additional_assets')
        .select('id')
        .eq('application_id', applicationId)
        .single();

      const assetData = {
        application_id: applicationId,
        asset_description: step5Data.other_assets,
      };

      if (existingAssets) {
        await supabase
          .from('additional_assets')
          .update(assetData)
          .eq('id', existingAssets.id);
      } else {
        await supabase
          .from('additional_assets')
          .insert(assetData);
      }
    } else {
      // Remove assets if empty
      await supabase
        .from('additional_assets')
        .delete()
        .eq('application_id', applicationId);
    }

    // Update application progress
    await updateApplication(applicationId, {
      current_step: Math.max(6, 5),
      progress_percentage: Math.max(90, 80),
    });

    return true;
  } catch (error) {
    console.error('Error in saveStep5Data:', error);
    return false;
  }
}

/**
 * Save Step 6 data (Spanish Property) - Final step and submission
 */
export async function saveStep6Data(
  applicationId: string,
  step6Data: FormState['step6']
): Promise<boolean> {
  try {
    // Update application with final data and mark as submitted
    const updates = {
      urgency_level: step6Data.urgency_level,
      purchase_price: step6Data.purchase_price,
      deposit_available: step6Data.deposit_available,
      property_address: step6Data.property_address,
      home_status: step6Data.home_status,
      property_type: step6Data.property_type,
      real_estate_agent_contact: step6Data.real_estate_agent_contact,
      lawyer_contact: step6Data.lawyer_contact,
      additional_notes: step6Data.additional_information,
      current_step: 6,
      progress_percentage: 100,
      status: step6Data.authorization_consent ? 'submitted' : 'draft',
      submitted_at: step6Data.authorization_consent ? new Date().toISOString() : undefined,
    };

    const success = await updateApplication(applicationId, updates);

    if (success && step6Data.authorization_consent) {
      // Save form progress to mark completion
      await saveFormProgress(applicationId, 6, { completed: true });
    }

    return success;
  } catch (error) {
    console.error('Error in saveStep6Data:', error);
    return false;
  }
}

/**
 * Save form progress for resume functionality
 */
export async function saveFormProgress(
  applicationId: string,
  currentStep: number,
  stepData: Record<string, unknown>
): Promise<boolean> {
  try {
    const progressData = {
      application_id: applicationId,
      last_completed_step: currentStep,
      step_data: stepData,
    };

    // Check if progress record exists
    const { data: existingProgress } = await supabase
      .from('form_progress')
      .select('id')
      .eq('application_id', applicationId)
      .single();

    if (existingProgress) {
      const { error } = await supabase
        .from('form_progress')
        .update(progressData)
        .eq('id', existingProgress.id);

      if (error) {
        console.error('Error updating form progress:', error);
        return false;
      }
    } else {
      const { error } = await supabase
        .from('form_progress')
        .insert(progressData);

      if (error) {
        console.error('Error inserting form progress:', error);
        return false;
      }
    }

    return true;
  } catch (error) {
    console.error('Error in saveFormProgress:', error);
    return false;
  }
}

/**
 * Load complete application data from database
 */
export async function loadApplicationData(applicationId: string): Promise<DatabaseApplication | null> {
  try {
    const { data, error } = await supabase
      .from('applications')
      .select(`
        *,
        applicants (
          *,
          applicant_children (*),
          employment_details (*),
          financial_commitments (*)
        ),
        rental_properties (*),
        additional_assets (*),
        form_progress (*)
      `)
      .eq('id', applicationId)
      .single();

    if (error) {
      console.error('Error loading application data:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error in loadApplicationData:', error);
    return null;
  }
}

/**
 * Get all applications for admin/dashboard (if needed)
 */
export async function getApplications(
  limit: number = 50,
  offset: number = 0
): Promise<DatabaseApplication[] | null> {
  try {
    const { data, error } = await supabase
      .from('applications')
      .select('*')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Error fetching applications:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error in getApplications:', error);
    return null;
  }
}

/**
 * Delete application and all related data
 */
export async function deleteApplication(applicationId: string): Promise<boolean> {
  try {
    // Due to CASCADE DELETE constraints, deleting the application will remove all related data
    const { error } = await supabase
      .from('applications')
      .delete()
      .eq('id', applicationId);

    if (error) {
      console.error('Error deleting application:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in deleteApplication:', error);
    return false;
  }
}

/**
 * Transform Supabase application data back to FormState format
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function transformDatabaseToFormState(dbData: any): FormState | null {
  try {
    if (!dbData || !dbData.applicants) {
      return null;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const primaryApplicant = dbData.applicants.find((app: any) => app.applicant_order === 1);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const coApplicants = dbData.applicants.filter((app: any) => app.applicant_order > 1);

    const formState: FormState = {
      step1: {
        first_name: primaryApplicant?.first_name || '',
        last_name: primaryApplicant?.last_name || '',
        date_of_birth: primaryApplicant?.date_of_birth ? new Date(primaryApplicant.date_of_birth) : null,
        email: primaryApplicant?.email || '',
        mobile: primaryApplicant?.mobile || '',
      },
      step2: {
        nationality: primaryApplicant?.nationality || '',
        marital_status: primaryApplicant?.marital_status || '',
        telephone: primaryApplicant?.telephone || '',
        has_co_applicants: coApplicants.length > 0,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        co_applicants: coApplicants.map((coApp: any) => ({
          first_name: coApp.first_name,
          last_name: coApp.last_name,
          date_of_birth: new Date(coApp.date_of_birth),
          email: coApp.email,
          mobile: coApp.mobile,
          nationality: coApp.nationality,
          marital_status: coApp.marital_status,
          applicant_order: coApp.applicant_order,
        })),
      },
      step3: {
        current_address: primaryApplicant?.current_address || '',
        move_in_date: null, // Calculate from time_at_current_address if needed
        homeowner_or_tenant: primaryApplicant?.homeowner_or_tenant || '',
        monthly_mortgage_or_rent: primaryApplicant?.monthly_mortgage_or_rent || 0,
        monthly_payment_currency: 'EUR', // Default
        current_property_value: primaryApplicant?.current_property_value || 0,
        property_value_currency: 'EUR', // Default
        mortgage_outstanding: primaryApplicant?.mortgage_outstanding || 0,
        mortgage_outstanding_currency: 'EUR', // Default
        lender_or_landlord_details: primaryApplicant?.lender_or_landlord_details || '',
        previous_address: primaryApplicant?.previous_address || '',
        previous_move_in_date: null,
        previous_move_out_date: null,
        tax_country: primaryApplicant?.tax_country || '',
        has_children: (primaryApplicant?.applicant_children?.length || 0) > 0,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars
        children: primaryApplicant?.applicant_children?.map((child: any) => ({
          date_of_birth: new Date(), // Calculate from age
        })) || [],
        co_applicants: [], // Would need to populate this for each co-applicant
      },
      step4: {
        employment_status: primaryApplicant?.employment_status || '',
        employment_details: primaryApplicant?.employment_details?.[0] || {},
        financial_commitments: primaryApplicant?.financial_commitments?.[0] || {},
        co_applicants: [], // Would need to populate this for each co-applicant
      },
      step5: {
        has_rental_properties: (dbData.rental_properties?.length || 0) > 0,
        rental_properties: dbData.rental_properties || [],
        other_assets: dbData.additional_assets?.[0]?.asset_description || '',
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
      ghlContactId: dbData.ghl_contact_id,
      ghlOpportunityId: null, // Not implemented yet
    };

    return formState;
  } catch (error) {
    console.error('Error transforming database data to form state:', error);
    return null;
  }
}