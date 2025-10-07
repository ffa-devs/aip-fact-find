'use client';

import { Button } from '@/components/ui/button';
import { useFormStore } from '@/lib/store/form-store';
import { ArrowLeft, ArrowRight, Save } from 'lucide-react';

interface FormNavigationProps {
  onBack?: () => void;
  onNext?: () => void;
  onSave?: () => void;
  isNextDisabled?: boolean;
  isLastStep?: boolean;
  nextLabel?: string;
}

export function FormNavigation({
  onBack,
  onNext,
  onSave,
  isNextDisabled = false,
  isLastStep = false,
  nextLabel,
}: FormNavigationProps) {
  const currentStep = useFormStore((state) => state.currentStep);

  return (
    <div className="flex items-center justify-between pt-6 border-t">
      <div>
        {currentStep > 1 && (
          <Button
            type="button"
            variant="outline"
            onClick={onBack}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
        )}
      </div>

      <div className="flex gap-3">
        <Button
          type="button"
          variant="ghost"
          onClick={onSave}
          className="gap-2"
        >
          <Save className="w-4 h-4" />
          Save for Later
        </Button>

        <Button
          type="submit"
          onClick={onNext}
          disabled={isNextDisabled}
          className="gap-2"
        >
          {nextLabel || (isLastStep ? 'Submit Application' : 'Continue')}
          {!isLastStep && <ArrowRight className="w-4 h-4" />}
        </Button>
      </div>
    </div>
  );
}
