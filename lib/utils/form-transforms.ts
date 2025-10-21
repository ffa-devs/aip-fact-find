import { FormState } from '@/lib/types/application';

/**
 * Transform database data from new schema back to FormState format
 * This is a client-safe transformation utility that doesn't use any server-only dependencies
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
        date_of_birth: primaryPerson.date_of_birth ? new Date(primaryPerson.date_of_birth) : null,
        email: primaryPerson.email || '',
        mobile: primaryPerson.mobile || '',
      },
      step2: {
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
        previous_address: primaryParticipant.previous_address || '',
        previous_move_in_date: null,
        previous_move_out_date: null,
        tax_country: primaryParticipant.tax_country || '',
        has_children: (primaryPerson.person_children?.length || 0) > 0,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        children: (primaryPerson.person_children || []).map((child: any) => ({
          date_of_birth: child.date_of_birth ? new Date(child.date_of_birth) : new Date(),
          same_address_as_primary: child.same_address_as_primary || false,
        })),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        co_applicants: coParticipants.map((coParticipant: any) => ({
          same_address_as_primary: coParticipant.same_address_as_primary || false,
          current_address: coParticipant.current_address || '',
          move_in_date: null,
          homeowner_or_tenant: coParticipant.homeowner_or_tenant || '',
          monthly_mortgage_or_rent: coParticipant.monthly_mortgage_or_rent || 0,
          monthly_payment_currency: 'EUR',
          current_property_value: coParticipant.current_property_value || 0,
          property_value_currency: 'EUR',
          mortgage_outstanding: coParticipant.mortgage_outstanding || 0,
          mortgage_outstanding_currency: 'EUR',
          lender_or_landlord_details: coParticipant.lender_or_landlord_details || '',
          previous_address: coParticipant.previous_address || '',
          previous_move_in_date: null,
          previous_move_out_date: null,
          tax_country: coParticipant.tax_country || '',
          has_children: (coParticipant.person_children?.length || 0) > 0,
          same_children_as_primary: coParticipant.same_children_as_primary || false,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          children: (coParticipant.person_children || []).map((child: any) => ({
            date_of_birth: child.date_of_birth ? new Date(child.date_of_birth) : new Date(),
            same_address_as_primary: child.same_address_as_primary || false,
          })),
        })),
      },
      step4: {
        employment_status: primaryParticipant.employment_status || '',
        employment_details: {
          job_title: '',
          employer_name: '',
          employer_address: '',
          gross_annual_salary: 0,
          net_monthly_income: 0,
          employment_start_date: undefined,
          previous_employment_details: '',
          business_name: '',
          business_address: '',
          business_website: '',
          company_creation_date: undefined,
          total_gross_annual_income: 0,
          net_annual_income: 0,
          bonus_overtime_commission_details: '',
          company_stake_percentage: 0,
          accountant_can_provide_info: false,
          accountant_contact_details: '',
        },
        financial_commitments: {
          personal_loans: 0,
          credit_card_debt: 0,
          car_loans_lease: 0,
          total_monthly_commitments: 0,
          has_credit_or_legal_issues: false,
          credit_legal_issues_details: '',
        },
        co_applicants: [],
      },
      step5: {
        has_rental_properties: false,
        rental_properties: [],
        other_assets: '',
      },
      step6: {
        urgency_level: '',
        purchase_price: 0,
        deposit_available: 0,
        property_address: '',
        home_status: '',
        property_type: '',
        real_estate_agent_contact: '',
        lawyer_contact: '',
        additional_information: '',
        authorization_consent: false,
      },
      currentStep: dbData.current_step || 1,
      applicationId: dbData.id,
      ghlContactId: dbData.ghl_contact_id,
      ghlOpportunityId: dbData.ghl_opportunity_id || null,
      isCompleted: dbData.status === 'completed',
    };

    return formState;
  } catch (error) {
    console.error('Error transforming database data to form state:', error);
    return null;
  }
}