'use client';

import { useState, useEffect } from 'react';
import { useFormStore } from '@/lib/store/form-store';
import { ApplicantSelector } from '@/components/form/applicant-selector';
import { Step4Employment } from './step4-employment';
import { Card, CardContent } from '@/components/ui/card';
import { Step4FormData } from '@/lib/validations/form-schemas';
import { Button } from '@/components/ui/button';
import { CheckCircle2 } from 'lucide-react';

interface Step4MultiApplicantProps {
  onNext: () => void;
}

export function Step4MultiApplicant({ onNext }: Step4MultiApplicantProps) {
  const { step2, step4, updateStep4 } = useFormStore();
  const [selectedApplicantIndex, setSelectedApplicantIndex] = useState(0);

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

  // Get completion status for each applicant
  const getCompletionStatus = () => {
    const statuses = [];
    
    // Primary applicant
    const primaryComplete = !!(
      step4.employment_status
    );
    statuses.push(primaryComplete);
    
    // Co-applicants
    if (step2.has_co_applicants && step4.co_applicants) {
      step4.co_applicants.forEach(coApplicant => {
        const complete = !!(
          coApplicant.employment_status
        );
        statuses.push(complete);
      });
    }
    
    return statuses;
  };

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

  // Check if all applicants are complete
  const allComplete = getCompletionStatus().every(status => status);

  // Handle final next (when all applicants are complete)
  const handleFinalNext = () => {
    if (allComplete) {
      onNext();
    }
  };

  if (!step2.has_co_applicants) {
    // No co-applicants, use original component
    return <Step4Employment onNext={onNext} />;
  }

  return (
    <div className="space-y-6">
      <ApplicantSelector
        currentApplicantIndex={selectedApplicantIndex}
        onApplicantChange={setSelectedApplicantIndex}
        completionStatus={getCompletionStatus()}
        showProgress={true}
      />

      <Step4Employment
        key={selectedApplicantIndex} // Force re-render when applicant changes
        onNext={handleApplicantFormNext}
        applicantIndex={selectedApplicantIndex}
        isMultiApplicant={true}
        hideNavigation={true}
      />

      {/* Final Navigation - only show when all complete */}
      {allComplete && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle2 className="w-5 h-5" />
                <span className="font-medium">All applicants completed!</span>
              </div>
              <Button onClick={handleFinalNext} size="lg">
                Continue to Property Portfolio
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}