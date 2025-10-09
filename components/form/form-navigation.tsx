'use client';

import { Button } from '@/components/ui/button';
import { useFormStore } from '@/lib/store/form-store';
import { Loader2, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

interface FormNavigationProps {
  onNext?: () => void;
  isSubmitting?: boolean;
  showSaveForLater?: boolean;
  showBack?: boolean;
}

export function FormNavigation({
  onNext,
  isSubmitting = false,
  showSaveForLater = true,
  showBack = true,
}: FormNavigationProps) {
  const { currentStep, previousStep } = useFormStore();

  const handleBack = () => {
    previousStep();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSaveForLater = () => {
    // Data is already saved in Zustand store automatically
    toast.success('Progress saved!', {
      description: 'You can continue your application later',
    });
    // Optional: redirect or close
    setTimeout(() => {
      window.location.href = '/';
    }, 1000);
  };

  return (
    <div className="flex justify-between items-center pt-4 border-t">
      <div className="flex gap-3">
        {showBack && currentStep > 1 && (
          <Button
            type="button"
            variant="outline"
            onClick={handleBack}
            disabled={isSubmitting}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        )}
      </div>

      <div className="flex gap-3">
        {showSaveForLater && (
          <Button
            type="button"
            variant="ghost"
            onClick={handleSaveForLater}
            disabled={isSubmitting}
          >
            Save for Later
          </Button>
        )}
        
        <Button 
          type="submit" 
          size="lg" 
          disabled={isSubmitting}
          onClick={onNext}
        >
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isSubmitting ? 'Saving...' : currentStep === 6 ? 'Submit Application' : 'Continue'}
        </Button>
      </div>
    </div>
  );
}
