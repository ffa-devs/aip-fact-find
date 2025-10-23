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

    // Get the first employment details record (Supabase returns arrays for nested relations)
    const primaryEmploymentDetails = Array.isArray(primaryParticipant.employment_details) 
      ? primaryParticipant.employment_details[0] 
      : primaryParticipant.employment_details;

    const primaryFinancialCommitments = Array.isArray(primaryParticipant.financial_commitments) 
      ? primaryParticipant.financial_commitments[0] 
      : primaryParticipant.financial_commitments;

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
        move_in_date: dbData.move_in_date ? new Date(dbData.move_in_date) : null,
        homeowner_or_tenant: primaryParticipant.homeowner_or_tenant || '',
        monthly_mortgage_or_rent: primaryParticipant.monthly_mortgage_or_rent || 0,
        monthly_payment_currency: primaryParticipant.monthly_payment_currency || 'EUR',
        current_property_value: primaryParticipant.current_property_value || 0,
        property_value_currency: primaryParticipant.property_value_currency || 'EUR',
        mortgage_outstanding: primaryParticipant.mortgage_outstanding || 0,
        mortgage_outstanding_currency: primaryParticipant.mortgage_outstanding_currency || 'EUR',
        lender_or_landlord_details: primaryParticipant.lender_or_landlord_details || '',
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
          move_in_date: coParticipant.move_in_date ? new Date(coParticipant.move_in_date) : null,
          homeowner_or_tenant: coParticipant.homeowner_or_tenant || '',
          monthly_mortgage_or_rent: coParticipant.monthly_mortgage_or_rent || 0,
          monthly_payment_currency: coParticipant.monthly_payment_currency || 'EUR',
          current_property_value: coParticipant.current_property_value || 0,
          property_value_currency: coParticipant.property_value_currency || 'EUR',
          mortgage_outstanding: coParticipant.mortgage_outstanding || 0,
          mortgage_outstanding_currency: coParticipant.mortgage_outstanding_currency || 'EUR',
          lender_or_landlord_details: coParticipant.lender_or_landlord_details || '',
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
        employment_details: primaryEmploymentDetails ? {
          job_title: primaryEmploymentDetails.job_title || '',
          employer_name: primaryEmploymentDetails.employer_name || '',
          employer_address: primaryEmploymentDetails.employer_address || '',
          gross_annual_salary: primaryEmploymentDetails.gross_annual_salary || 0,
          net_monthly_income: primaryEmploymentDetails.net_monthly_income || 0,
          employment_start_date: primaryEmploymentDetails.employment_start_date 
            ? new Date(primaryEmploymentDetails.employment_start_date) 
            : undefined,
          previous_employment_details: primaryEmploymentDetails.previous_employment_details || '',
          business_name: primaryEmploymentDetails.business_name || '',
          business_address: primaryEmploymentDetails.business_address || '',
          business_website: primaryEmploymentDetails.business_website || '',
          company_creation_date: primaryEmploymentDetails.company_creation_date 
            ? new Date(primaryEmploymentDetails.company_creation_date) 
            : undefined,
          total_gross_annual_income: primaryEmploymentDetails.total_gross_annual_income || 0,
          net_annual_income: primaryEmploymentDetails.net_annual_income || 0,
          bonus_overtime_commission_details: primaryEmploymentDetails.bonus_overtime_commission_details || '',
          company_stake_percentage: primaryEmploymentDetails.company_stake_percentage || 0,
          accountant_can_provide_info: primaryEmploymentDetails.accountant_can_provide_info || false,
          accountant_contact_details: primaryEmploymentDetails.accountant_contact_details || '',
        } : {
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
        financial_commitments: primaryFinancialCommitments ? {
          personal_loans: primaryFinancialCommitments.personal_loans || 0,
          credit_card_debt: primaryFinancialCommitments.credit_card_debt || 0,
          car_loans_lease: primaryFinancialCommitments.car_loans_lease || 0,
          total_monthly_commitments: primaryFinancialCommitments.total_monthly_commitments || 0,
          has_credit_or_legal_issues: primaryFinancialCommitments.has_credit_or_legal_issues || false,
          credit_legal_issues_details: primaryFinancialCommitments.credit_legal_issues_details || '',
        } : {
          personal_loans: 0,
          credit_card_debt: 0,
          car_loans_lease: 0,
          total_monthly_commitments: 0,
          has_credit_or_legal_issues: false,
          credit_legal_issues_details: '',
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        co_applicants: coParticipants.map((coParticipant: any) => {
          const coEmploymentDetails = Array.isArray(coParticipant.employment_details) 
            ? coParticipant.employment_details[0] 
            : coParticipant.employment_details;
          
          const coFinancialCommitments = Array.isArray(coParticipant.financial_commitments) 
            ? coParticipant.financial_commitments[0] 
            : coParticipant.financial_commitments;

          return {
            employment_status: coParticipant.employment_status || '',
            employment_details: coEmploymentDetails ? {
              job_title: coEmploymentDetails.job_title || '',
              employer_name: coEmploymentDetails.employer_name || '',
              employer_address: coEmploymentDetails.employer_address || '',
              gross_annual_salary: coEmploymentDetails.gross_annual_salary || 0,
              net_monthly_income: coEmploymentDetails.net_monthly_income || 0,
              employment_start_date: coEmploymentDetails.employment_start_date 
                ? new Date(coEmploymentDetails.employment_start_date) 
                : undefined,
              previous_employment_details: coEmploymentDetails.previous_employment_details || '',
              business_name: coEmploymentDetails.business_name || '',
              business_address: coEmploymentDetails.business_address || '',
              business_website: coEmploymentDetails.business_website || '',
              company_creation_date: coEmploymentDetails.company_creation_date 
                ? new Date(coEmploymentDetails.company_creation_date) 
                : undefined,
              total_gross_annual_income: coEmploymentDetails.total_gross_annual_income || 0,
              net_annual_income: coEmploymentDetails.net_annual_income || 0,
              bonus_overtime_commission_details: coEmploymentDetails.bonus_overtime_commission_details || '',
              company_stake_percentage: coEmploymentDetails.company_stake_percentage || 0,
              accountant_can_provide_info: coEmploymentDetails.accountant_can_provide_info || false,
              accountant_contact_details: coEmploymentDetails.accountant_contact_details || '',
            } : {},
            financial_commitments: coFinancialCommitments ? {
              personal_loans: coFinancialCommitments.personal_loans || 0,
              credit_card_debt: coFinancialCommitments.credit_card_debt || 0,
              car_loans_lease: coFinancialCommitments.car_loans_lease || 0,
              total_monthly_commitments: coFinancialCommitments.total_monthly_commitments || 0,
              has_credit_or_legal_issues: coFinancialCommitments.has_credit_or_legal_issues || false,
              credit_legal_issues_details: coFinancialCommitments.credit_legal_issues_details || '',
            } : {},
          };
        }),
      },
      step5: {
        has_rental_properties: (primaryParticipant.rental_properties?.length || 0) > 0,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        rental_properties: (primaryParticipant.rental_properties || []).map((property: any) => ({
          property_address: property.property_address || '',
          current_valuation: property.current_valuation || 0,
          mortgage_outstanding: property.mortgage_outstanding || 0,
          monthly_mortgage_payment: property.monthly_mortgage_payment || 0,
          monthly_rent_received: property.monthly_rent_received || 0,
          purchase_date: property.purchase_date ? new Date(property.purchase_date) : undefined,
        })),
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
        authorization_consent: dbData.authorization_consent || false,
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