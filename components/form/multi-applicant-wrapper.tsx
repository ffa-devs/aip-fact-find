'use client';

import { useState } from 'react';
import { useFormStore } from '@/lib/store/form-store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Circle, User, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface MultiApplicantWrapperProps {
  stepNumber: 3 | 4;
  stepTitle: string;
  stepDescription: string;
  children: (applicantIndex: number, applicant: { id: string; name: string; isPrimary: boolean; index: number; data?: unknown }, isActive: boolean) => React.ReactNode;
  onNext: () => void;
  onValidateApplicant?: (applicantIndex: number) => boolean;
}

export function MultiApplicantWrapper({
  stepNumber,
  stepTitle,
  stepDescription,
  children,
  onNext,
  onValidateApplicant
}: MultiApplicantWrapperProps) {
  const { step2 } = useFormStore();
  const [currentApplicantIndex, setCurrentApplicantIndex] = useState(0);
  const [completedApplicants, setCompletedApplicants] = useState<Set<number>>(new Set());

  // Build applicants list: primary + co-applicants
  const applicants = [
    { 
      id: 'primary', 
      name: 'Primary Applicant', 
      isPrimary: true,
      index: 0
    },
    ...(step2.co_applicants || []).map((coApp, index) => ({
      id: `co-${index}`,
      name: `${coApp.first_name} ${coApp.last_name}`,
      isPrimary: false,
      index: index + 1,
      data: coApp
    }))
  ];

  const markApplicantComplete = (applicantIndex: number) => {
    setCompletedApplicants(prev => new Set([...prev, applicantIndex]));
  };

  const markApplicantIncomplete = (applicantIndex: number) => {
    setCompletedApplicants(prev => {
      const newSet = new Set(prev);
      newSet.delete(applicantIndex);
      return newSet;
    });
  };

  const validateCurrentApplicant = () => {
    if (onValidateApplicant) {
      const isValid = onValidateApplicant(currentApplicantIndex);
      if (isValid) {
        markApplicantComplete(currentApplicantIndex);
        return true;
      } else {
        markApplicantIncomplete(currentApplicantIndex);
        return false;
      }
    }
    return true;
  };

  const handleApplicantSwitch = (newIndex: number) => {
    // Validate current applicant before switching
    validateCurrentApplicant();
    setCurrentApplicantIndex(newIndex);
  };

  const handleNext = () => {
    // Validate current applicant
    if (!validateCurrentApplicant()) {
      toast.error('Please complete all required fields for the current applicant');
      return;
    }

    // Check if all applicants are completed
    const allCompleted = applicants.every((_, index) => 
      completedApplicants.has(index) || index === currentApplicantIndex
    );

    if (!allCompleted) {
      const incompleteApplicants = applicants
        .filter((_, index) => !completedApplicants.has(index) && index !== currentApplicantIndex)
        .map(app => app.name);
      
      toast.error(`Please complete information for: ${incompleteApplicants.join(', ')}`);
      return;
    }

    onNext();
  };

  const getCompletionStatus = (index: number) => {
    if (index === currentApplicantIndex) return 'active';
    if (completedApplicants.has(index)) return 'completed';
    return 'pending';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold">{stepTitle}</h2>
        <p className="text-muted-foreground mt-1">{stepDescription}</p>
      </div>

      {/* Applicant Navigation Tabs */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Users className="w-5 h-5" />
            Applicant Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {applicants.map((applicant, index) => {
              const status = getCompletionStatus(index);
              return (
                <Button
                  key={applicant.id}
                  variant={index === currentApplicantIndex ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleApplicantSwitch(index)}
                  className={cn(
                    "flex items-center gap-2 min-w-[140px]",
                    status === 'completed' && index !== currentApplicantIndex && 
                    "border-green-500 bg-green-50 hover:bg-green-100"
                  )}
                >
                  {applicant.isPrimary ? (
                    <User className="w-4 h-4" />
                  ) : (
                    <Users className="w-4 h-4" />
                  )}
                  <span className="truncate">{applicant.name}</span>
                  {status === 'completed' && index !== currentApplicantIndex && (
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  )}
                  {status === 'pending' && index !== currentApplicantIndex && (
                    <Circle className="w-4 h-4 text-muted-foreground" />
                  )}
                </Button>
              );
            })}
          </div>
          
          {/* Progress indicator */}
          <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
            <span>Progress:</span>
            <Badge variant="outline">
              {completedApplicants.size + (validateCurrentApplicant() ? 1 : 0)} of {applicants.length} completed
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Current Applicant Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {applicants[currentApplicantIndex]?.isPrimary ? (
              <User className="w-5 h-5" />
            ) : (
              <Users className="w-5 h-5" />
            )}
            {applicants[currentApplicantIndex]?.name}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {children(
            currentApplicantIndex, 
            applicants[currentApplicantIndex], 
            true
          )}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between">
        <div className="text-sm text-muted-foreground">
          Step {stepNumber} of 6
        </div>
        <div className="flex gap-2">
          {currentApplicantIndex < applicants.length - 1 && (
            <Button
              variant="outline"
              onClick={() => {
                if (validateCurrentApplicant()) {
                  setCurrentApplicantIndex(prev => prev + 1);
                }
              }}
            >
              Next Applicant
            </Button>
          )}
          <Button onClick={handleNext}>
            Continue to Step {stepNumber + 1}
          </Button>
        </div>
      </div>
    </div>
  );
}