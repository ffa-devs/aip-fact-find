'use client';

import { useFormStore } from '@/lib/store/form-store';
import { cn } from '@/lib/utils';
import { CheckCircle2, Circle, User, Users } from 'lucide-react';
import { useState } from 'react';

interface Step {
  number: number;
  title: string;
  description: string;
  hasApplicants?: boolean; // Steps 3 & 4 have multi-applicant data
}

const steps: Step[] = [
  { number: 1, title: 'Welcome', description: 'Basic information' },
  { number: 2, title: 'Personal Info', description: 'About you' },
  { number: 3, title: 'Property Info', description: 'Current home', hasApplicants: true },
  { number: 4, title: 'Income', description: 'Employment details', hasApplicants: true },
  { number: 5, title: 'Assets', description: 'Property portfolio' },
  { number: 6, title: 'Government', description: 'Spanish property' },
];

export function StepNavigation() {
  const { currentStep, setCurrentStep, step2, step3, step4 } = useFormStore();
  const [selectedApplicantIndex, setSelectedApplicantIndex] = useState(0);

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

  const getStepStatus = (stepNumber: number) => {
    if (stepNumber < currentStep) return 'completed';
    if (stepNumber === currentStep) return 'current';
    return 'upcoming';
  };

  // Get completion status for applicant-specific steps
  const getApplicantStepCompletion = (stepNumber: number) => {
    if (stepNumber === 3) {
      const statuses = [];
      // Primary applicant
      statuses.push(!!(step3.current_address && step3.move_in_date && step3.homeowner_or_tenant && step3.tax_country));
      // Co-applicants
      if (step2.has_co_applicants && step3.co_applicants) {
        step3.co_applicants.forEach(coApplicant => {
          statuses.push(!!(coApplicant.current_address && coApplicant.move_in_date && coApplicant.homeowner_or_tenant && coApplicant.tax_country));
        });
      }
      return statuses;
    }
    if (stepNumber === 4) {
      const statuses = [];
      // Primary applicant
      statuses.push(!!(step4.employment_status));
      // Co-applicants
      if (step2.has_co_applicants && step4.co_applicants) {
        step4.co_applicants.forEach(coApplicant => {
          statuses.push(!!(coApplicant.employment_status));
        });
      }
      return statuses;
    }
    return [];
  };

  const handleApplicantChange = (index: number) => {
    setSelectedApplicantIndex(index);
    // Trigger a custom event that the multi-applicant components can listen to
    window.dispatchEvent(new CustomEvent('applicantChange', { detail: { index } }));
  };

  const allApplicants = getAllApplicants();
  const showApplicantTabs = step2.has_co_applicants && (currentStep === 3 || currentStep === 4);

  return (
    <div className="w-72 bg-white border-r border-gray-200 min-h-screen p-6">
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          My Loan Application
        </h2>
      </div>

      <nav className="space-y-1">
        {steps.map((step) => {
          const status = getStepStatus(step.number);
          const isClickable = step.number <= currentStep || step.number === currentStep + 1;
          
          return (
            <div key={step.number}>
              <button
                onClick={() => isClickable && setCurrentStep(step.number)}
                disabled={!isClickable}
                className={cn(
                  'w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors',
                  status === 'current' && 'border border-[#234c8a] border-opacity-30 bg-blue-50',
                  status === 'completed' && 'bg-green-50 hover:bg-green-100',
                  status === 'upcoming' && 'hover:bg-gray-50',
                  !isClickable && 'cursor-not-allowed opacity-50'
                )}
                style={status === 'current' ? { backgroundColor: 'rgba(35, 76, 138, 0.05)' } : {}}
              >
                <div className="flex-shrink-0">
                  {status === 'completed' ? (
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                  ) : status === 'current' ? (
                    <div 
                      className="w-5 h-5 rounded-full text-white text-xs flex items-center justify-center font-medium"
                      style={{ backgroundColor: '#234c8a' }}
                    >
                      {step.number}
                    </div>
                  ) : (
                    <Circle className="w-5 h-5 text-gray-400" />
                  )}
                </div>
                
                <div className="min-w-0 flex-1">
                  <p className={cn(
                    'text-sm font-medium',
                    status === 'completed' && 'text-green-900',
                    status === 'upcoming' && 'text-gray-500'
                  )}
                  style={status === 'current' ? { color: '#234c8a' } : {}}>
                    {step.title}
                  </p>
                  <p className={cn(
                    'text-xs',
                    status === 'completed' && 'text-green-700',
                    status === 'upcoming' && 'text-gray-400'
                  )}
                  style={status === 'current' ? { color: '#234c8a', opacity: 0.8 } : {}}>
                    {step.description}
                  </p>
                </div>
              </button>

              {/* Show applicant tabs for steps 3 & 4 when there are co-applicants */}
              {showApplicantTabs && step.number === currentStep && step.hasApplicants && (
                <div className="ml-8 mt-2 space-y-1">
                  {allApplicants.map((applicant, index) => {
                    const completionStatuses = getApplicantStepCompletion(currentStep);
                    const isComplete = completionStatuses[index] || false;
                    const isSelected = selectedApplicantIndex === index;
                    
                    return (
                      <button
                        key={index}
                        onClick={() => handleApplicantChange(index)}
                        className={cn(
                          'w-full flex items-center gap-2 p-2 rounded text-left transition-colors text-sm',
                          isSelected && 'border border-[#234c8a] border-opacity-20',
                          !isSelected && 'hover:bg-gray-50'
                        )}
                        style={isSelected ? { backgroundColor: 'rgba(35, 76, 138, 0.05)' } : {}}
                      >
                        <div className="flex-shrink-0">
                          {applicant.isPrimary ? (
                            <User className="w-4 h-4" style={{ color: '#234c8a' }} />
                          ) : (
                            <Users className="w-4 h-4" style={{ color: '#234c8a' }} />
                          )}
                        </div>
                        <span className={cn(
                          'flex-1 truncate',
                          isSelected ? 'font-medium' : 'text-gray-600'
                        )}
                        style={isSelected ? { color: '#234c8a' } : {}}>
                          {applicant.name}
                        </span>
                        <div className="flex-shrink-0">
                          {isComplete ? (
                            <CheckCircle2 className="w-4 h-4 text-green-600" />
                          ) : (
                            <Circle className="w-4 h-4 text-gray-400" />
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>
    </div>
  );
}