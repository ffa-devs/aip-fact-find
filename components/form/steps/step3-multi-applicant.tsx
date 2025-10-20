'use client';

import { useEffect } from 'react';
import { useFormStore } from '@/lib/store/form-store';
import { Step3HomeFinancial } from './step3-home-financial';
import { Step3FormData } from '@/lib/validations/form-schemas';
import { Button } from '@/components/ui/button';
import { User, Users } from 'lucide-react';
import { useApplicantSelector } from '@/hooks/use-applicant-selector';
import { useRef } from 'react';

interface Step3MultiApplicantProps {
  onNext: () => void;
}

export function Step3MultiApplicant({ onNext }: Step3MultiApplicantProps) {
  const { step2, step3, updateStep3, updateStep3ForApplicant, previousStep } = useFormStore();
  const selectedApplicantIndex = useApplicantSelector();
  const hasResetRef = useRef(false);

  // Reset to primary applicant when Step 3 first loads
  if (!hasResetRef.current) {
    hasResetRef.current = true;
    if (selectedApplicantIndex !== 0) {
      window.dispatchEvent(new CustomEvent('applicantChange', { 
        detail: { index: 0 } 
      }));
    }
  }  // Get all applicants (primary + co-applicants)
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
      const currentCoApplicants = step3.co_applicants || [];
      const requiredLength = step2.co_applicants.length;
      
      if (currentCoApplicants.length !== requiredLength) {
        const newCoApplicants = Array.from({ length: requiredLength }, (_, i) => {
          return currentCoApplicants[i] || {
            current_address: '',
            move_in_date: null,
            homeowner_or_tenant: '',
            monthly_mortgage_or_rent: 0,
            monthly_payment_currency: 'USD',
            current_property_value: 0,
            property_value_currency: 'USD',
            mortgage_outstanding: 0,
            mortgage_outstanding_currency: 'USD',
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



  // Handle form completion for current applicant
  const handleApplicantFormNext = async (formData?: Step3FormData) => {
    if (!formData) return;
    
    try {
      if (selectedApplicantIndex === 0) {
        // Primary applicant - update local state and sync to database
        await updateStep3(formData);
        await updateStep3ForApplicant(selectedApplicantIndex, formData);
      } else {
        // Co-applicant - save to database and update local state
        await updateStep3ForApplicant(selectedApplicantIndex, formData);
        
        // Also update local state for co-applicant
        const coApplicantIndex = selectedApplicantIndex - 1;
        const currentCoApplicants = [...(step3.co_applicants || [])];
        currentCoApplicants[coApplicantIndex] = {
          current_address: formData.current_address,
          move_in_date: formData.move_in_date,
          homeowner_or_tenant: formData.homeowner_or_tenant,
          monthly_mortgage_or_rent: formData.monthly_mortgage_or_rent,
          monthly_payment_currency: formData.monthly_payment_currency,
          current_property_value: formData.current_property_value || 0,
          property_value_currency: formData.property_value_currency || 'USD',
          mortgage_outstanding: formData.mortgage_outstanding || 0,
          mortgage_outstanding_currency: formData.mortgage_outstanding_currency || 'USD',
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
    } catch (error) {
      console.error('Error saving Step 3 data:', error);
      // Continue with the flow even if database sync fails
    }
  };



  const handleContinue = () => {
    const allApplicants = getAllApplicants();
    
    if (selectedApplicantIndex < allApplicants.length - 1) {
      // Go to next applicant
      setSelectedApplicantIndex(selectedApplicantIndex + 1);
      window.dispatchEvent(new CustomEvent('applicantChange', { 
        detail: { index: selectedApplicantIndex + 1 } 
      }));
    } else {
      // Last applicant, go to next step
      // Reset to first applicant for next step
      setSelectedApplicantIndex(0);
      window.dispatchEvent(new CustomEvent('applicantChange', { 
        detail: { index: 0 } 
      }));
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
    return <Step3HomeFinancial onNext={onNext} />;
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
      <Step3HomeFinancial
        key={`step3-${selectedApplicantIndex}`}
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
          {/* <Button
            type="button"
            variant="outline"
            className="px-8 py-3"
          >
            Save for Later
          </Button>
           */}
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