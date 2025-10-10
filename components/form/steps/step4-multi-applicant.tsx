'use client';

import { useEffect, useRef } from 'react';
import { useFormStore } from '@/lib/store/form-store';
import { Step4Employment } from './step4-employment';
import { Step4FormData } from '@/lib/validations/form-schemas';
import { Button } from '@/components/ui/button';
import { User, Users } from 'lucide-react';
import { useApplicantSelector } from '@/hooks/use-applicant-selector';

interface Step4MultiApplicantProps {
  onNext: () => void;
}

export function Step4MultiApplicant({ onNext }: Step4MultiApplicantProps) {
  const { step2, step4, updateStep4, previousStep } = useFormStore();
  const selectedApplicantIndex = useApplicantSelector();
  const hasResetRef = useRef(false);

  // Reset to primary applicant when Step 4 first loads
  if (!hasResetRef.current) {
    hasResetRef.current = true;
    if (selectedApplicantIndex !== 0) {
      window.dispatchEvent(new CustomEvent('applicantChange', { 
        detail: { index: 0 } 
      }));
    }
  }

  // Get all applicants (primary + co-applicants)
  const getAllApplicants = () => {
    const applicants = [{ name: 'Primary Applicant', isPrimary: true }];
    if (step2.has_co_applicants && step2.co_applicants) {
      step2.co_applicants.forEach((coApp) => {
        applicants.push({
          name: `${coApp.first_name} ${coApp.last_name}`,
          isPrimary: false
        });
      });
    }
    return applicants;
  };

  // Function to trigger applicant change
  const setSelectedApplicantIndex = (index: number) => {
    window.dispatchEvent(new CustomEvent('applicantChange', { 
      detail: { index } 
    }));
  };

  // Ensure co_applicants array has the right length
  useEffect(() => {
    if (step2.has_co_applicants && step2.co_applicants.length > 0) {
      const currentCoApplicants = step4.co_applicants || [];
      const requiredLength = step2.co_applicants.length;
      
      if (currentCoApplicants.length !== requiredLength) {
        const newCoApplicants = Array.from({ length: requiredLength }, (_, i) => {
          return currentCoApplicants[i] || {
            employment_status: '',
            employment_details: {},
            financial_commitments: {},
          };
        });
        
        updateStep4({ co_applicants: newCoApplicants });
      }
    }
  }, [step2.co_applicants.length, step2.has_co_applicants, step4.co_applicants, updateStep4]);



  // Handle form completion for current applicant
  const handleApplicantFormNext = (formData?: Step4FormData) => {
    if (!formData) return;
    
    if (selectedApplicantIndex === 0) {
      // Primary applicant - transform to store format
      const storeData = {
        employment_status: formData.employment_status,
        employment_details: {
          job_title: formData.job_title,
          employer_name: formData.employer_name,
          employer_address: formData.employer_address,
          gross_annual_salary: formData.gross_annual_salary,
          net_monthly_income: formData.net_monthly_income,
          employment_start_date: formData.employment_start_date,
          previous_employment_details: formData.previous_employment_details,
          business_name: formData.business_name,
          business_address: formData.business_address,
          business_website: formData.business_website,
          company_creation_date: formData.company_creation_date,
          total_gross_annual_income: formData.total_gross_annual_income,
          net_annual_income: formData.net_annual_income,
          bonus_overtime_commission_details: formData.bonus_overtime_commission_details,
          company_stake_percentage: formData.company_stake_percentage,
          accountant_can_provide_info: formData.accountant_can_provide_info,
          accountant_contact_details: formData.accountant_contact_details,
        },
        financial_commitments: {
          personal_loans: formData.personal_loans,
          credit_card_debt: formData.credit_card_debt,
          car_loans_lease: formData.car_loans_lease,
          has_credit_or_legal_issues: formData.has_credit_or_legal_issues,
          credit_legal_issues_details: formData.credit_legal_issues_details,
        },
      };
      updateStep4(storeData);
    } else {
      // Co-applicant
      const coApplicantIndex = selectedApplicantIndex - 1;
      const currentCoApplicants = [...(step4.co_applicants || [])];
      currentCoApplicants[coApplicantIndex] = {
        employment_status: formData.employment_status,
        employment_details: {
          job_title: formData.job_title,
          employer_name: formData.employer_name,
          employer_address: formData.employer_address,
          gross_annual_salary: formData.gross_annual_salary,
          net_monthly_income: formData.net_monthly_income,
          employment_start_date: formData.employment_start_date,
          previous_employment_details: formData.previous_employment_details,
          business_name: formData.business_name,
          business_address: formData.business_address,
          business_website: formData.business_website,
          company_creation_date: formData.company_creation_date,
          total_gross_annual_income: formData.total_gross_annual_income,
          net_annual_income: formData.net_annual_income,
          bonus_overtime_commission_details: formData.bonus_overtime_commission_details,
          company_stake_percentage: formData.company_stake_percentage,
          accountant_can_provide_info: formData.accountant_can_provide_info,
          accountant_contact_details: formData.accountant_contact_details,
        },
        financial_commitments: {
          personal_loans: formData.personal_loans,
          credit_card_debt: formData.credit_card_debt,
          car_loans_lease: formData.car_loans_lease,
          has_credit_or_legal_issues: formData.has_credit_or_legal_issues,
          credit_legal_issues_details: formData.credit_legal_issues_details,
        },
      };
      updateStep4({ co_applicants: currentCoApplicants });
    }
  };

  const handleContinue = () => {
    const allApplicants = getAllApplicants();
    
    if (selectedApplicantIndex < allApplicants.length - 1) {
      // Go to next applicant
      setSelectedApplicantIndex(selectedApplicantIndex + 1);
    } else {
      // Last applicant, go to next step
      onNext();
    }
  };

  const handleBack = () => {
    if (selectedApplicantIndex > 0) {
      // Go to previous applicant
      setSelectedApplicantIndex(selectedApplicantIndex - 1);
      window.dispatchEvent(new CustomEvent('applicantChange', { 
        detail: { index: selectedApplicantIndex - 1 } 
      }));
    } else {
      // First applicant, go to previous step
      previousStep();
    }
  };

  if (!step2.has_co_applicants) {
    // No co-applicants, use original component
    return <Step4Employment onNext={onNext} />;
  }

  const allApplicants = getAllApplicants();
  const currentApplicant = allApplicants[selectedApplicantIndex];
  const isLastApplicant = selectedApplicantIndex === allApplicants.length - 1;

  return (
    <div className="space-y-8">
      {/* Current Applicant Header */}
      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              {currentApplicant.isPrimary ? (
                <User className="w-5 h-5" style={{ color: '#234c8a' }} />
              ) : (
                <Users className="w-5 h-5" style={{ color: '#234c8a' }} />
              )}
              <span className="font-semibold text-lg">
                {currentApplicant.name}
              </span>
            </div>
          </div>
          <div className="text-sm text-gray-500">
            {selectedApplicantIndex + 1} of {allApplicants.length}
          </div>
        </div>
      </div>

      {/* Current Applicant Form */}
      <Step4Employment
        key={`step4-${selectedApplicantIndex}`}
        onNext={handleApplicantFormNext}
        applicantIndex={selectedApplicantIndex}
        isMultiApplicant={true}
        hideNavigation={true}
      />

      {/* Navigation */}
      <div className="flex justify-between pt-6">
        <Button
          type="button"
          variant="outline"
          onClick={handleBack}
          className="px-8 py-3"
        >
          Back
        </Button>
        
        <div className="flex gap-4">
          <Button
            type="button"
            variant="outline"
            className="px-8 py-3"
          >
            Save for Later
          </Button>
          
          <Button
            onClick={handleContinue}
            className="px-8 py-3 text-white"
            style={{ backgroundColor: '#234c8a' }}
          >
            {isLastApplicant ? 'Next Step' : 'Continue'}
          </Button>
        </div>
      </div>
    </div>
  );
}