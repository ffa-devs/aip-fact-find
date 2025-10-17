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

  // TODO: Implement proper "Save for Later" functionality
  // This should:
  // 1. Generate a magic link/token for resuming the application
  // 2. Save current form data to database (not just browser storage)
  // 3. Send email with magic link to continue later
  // 4. Create resume route (/resume/[token]) to load saved state
  // 5. Add GHL integration: tag as "AIP-Application-Incomplete-StepX"
  // 6. Trigger follow-up automation (24h, 72h, 7d reminders)
  const handleSaveForLater = () => {
    // TEMP: Currently just shows message and redirects - not actually saving properly
    toast.info('Save for Later feature coming soon!', {
      description: 'Your progress is auto-saved in this browser session',
    });
    // Don't redirect for now since it's misleading
    // setTimeout(() => {
    //   window.location.href = '/';
    // }, 1000);
  };

  return (
    <div className="flex justify-between items-center pt-6 mt-8 border-t border-gray-200">
      <div className="flex gap-3">
        {showBack && currentStep > 1 && (
          <Button
            type="button"
            variant="outline"
            onClick={handleBack}
            disabled={isSubmitting}
            className="border-gray-300 text-gray-700 hover:bg-gray-50 px-6 py-3 rounded-lg font-medium transition-colors"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        )}
      </div>

      <div className="flex gap-3">
        {/* {showSaveForLater && (
          <Button
            type="button"
            variant="ghost"
            onClick={handleSaveForLater}
            disabled={isSubmitting}
            className="text-gray-400 hover:text-gray-500 hover:bg-gray-50 cursor-not-allowed opacity-60"
            title="Save for Later feature coming soon"
          >
            Save for Later
          </Button>
        )}
         */}
        <Button 
          type="button" 
          size="lg" 
          disabled={isSubmitting}
          onClick={onNext}
          className="bg-[#234c8a] text-white hover:bg-[#1e3f73] px-8 py-3 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isSubmitting ? 'Saving...' : currentStep === 6 ? 'Submit Application' : 'Continue'}
        </Button>
      </div>
    </div>
  );
}
