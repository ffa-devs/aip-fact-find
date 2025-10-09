'use client';

import { useState, useEffect } from 'react';
import { useFormStore } from '@/lib/store/form-store';
import { ApplicantSelector } from '@/components/form/applicant-selector';
import { Step3HomeFinancial } from './step3-home-financial';
import { Card, CardContent } from '@/components/ui/card';
import { Step3FormData } from '@/lib/validations/form-schemas';
import { Button } from '@/components/ui/button';
import { CheckCircle2 } from 'lucide-react';

interface Step3MultiApplicantProps {
  onNext: () => void;
}

export function Step3MultiApplicant({ onNext }: Step3MultiApplicantProps) {
  const { step2, step3, updateStep3 } = useFormStore();
  const [selectedApplicantIndex, setSelectedApplicantIndex] = useState(0);

  // Ensure co_applicants array has the right length
  useEffect(() => {
    if (step2.has_co_applicants && step2.co_applicants.length > 0) {
      const currentCoApplicants = step3.co_applicants || [];
      const requiredLength = step2.co_applicants.length;
      
      if (currentCoApplicants.length !== requiredLength) {
        const newCoApplicants = Array.from({ length: requiredLength }, (_, i) => {
          return currentCoApplicants[i] || {
            current_address: '',
            move_in_date: null,
            homeowner_or_tenant: '',
            monthly_mortgage_or_rent: 0,
            monthly_payment_currency: 'EUR',
            current_property_value: 0,
            property_value_currency: 'EUR',
            mortgage_outstanding: 0,
            mortgage_outstanding_currency: 'EUR',
            lender_or_landlord_details: '',
            previous_address: '',
            previous_move_in_date: null,
            previous_move_out_date: null,
            tax_country: '',
            has_children: false,
            children: [],
          };
        });
        
        updateStep3({ co_applicants: newCoApplicants });
      }
    }
  }, [step2.co_applicants.length, step2.has_co_applicants, step3.co_applicants, updateStep3]);

  // Get completion status for each applicant
  const getCompletionStatus = () => {
    const statuses = [];
    
    // Primary applicant
    const primaryComplete = !!(
      step3.current_address &&
      step3.move_in_date &&
      step3.homeowner_or_tenant &&
      step3.tax_country
    );
    statuses.push(primaryComplete);
    
    // Co-applicants
    if (step2.has_co_applicants && step3.co_applicants) {
      step3.co_applicants.forEach(coApplicant => {
        const complete = !!(
          coApplicant.current_address &&
          coApplicant.move_in_date &&
          coApplicant.homeowner_or_tenant &&
          coApplicant.tax_country
        );
        statuses.push(complete);
      });
    }
    
    return statuses;
  };

  // Handle form completion for current applicant
  const handleApplicantFormNext = (formData?: Step3FormData) => {
    if (!formData) return;
    if (selectedApplicantIndex === 0) {
      // Primary applicant
      updateStep3(formData);
    } else {
      // Co-applicant - map Step3FormData to co-applicant format
      const coApplicantIndex = selectedApplicantIndex - 1;
      const currentCoApplicants = [...(step3.co_applicants || [])];
      currentCoApplicants[coApplicantIndex] = {
        current_address: formData.current_address,
        move_in_date: formData.move_in_date,
        homeowner_or_tenant: formData.homeowner_or_tenant,
        monthly_mortgage_or_rent: formData.monthly_mortgage_or_rent,
        monthly_payment_currency: formData.monthly_payment_currency,
        current_property_value: formData.current_property_value || 0,
        property_value_currency: formData.property_value_currency || 'EUR',
        mortgage_outstanding: formData.mortgage_outstanding || 0,
        mortgage_outstanding_currency: formData.mortgage_outstanding_currency || 'EUR',
        lender_or_landlord_details: formData.lender_or_landlord_details || '',
        previous_address: formData.previous_address || '',
        previous_move_in_date: formData.previous_move_in_date || null,
        previous_move_out_date: formData.previous_move_out_date || null,
        tax_country: formData.tax_country,
        has_children: formData.has_children,
        children: formData.children || [],
      };
      updateStep3({ co_applicants: currentCoApplicants });
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
    return <Step3HomeFinancial onNext={onNext} />;
  }

  return (
    <div className="space-y-6">
      <ApplicantSelector
        currentApplicantIndex={selectedApplicantIndex}
        onApplicantChange={setSelectedApplicantIndex}
        completionStatus={getCompletionStatus()}
        showProgress={true}
      />

      <Step3HomeFinancial
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
                Continue to Employment Information
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}