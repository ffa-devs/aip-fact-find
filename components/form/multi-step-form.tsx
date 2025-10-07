'use client';

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { useFormStore } from '@/lib/store/form-store';
import { FormProgress } from './form-progress';
import { FormNavigation } from './form-navigation';
import { Step1LeadCapture } from './steps/step1-lead-capture';
import { Step2AboutYou } from './steps/step2-about-you';
import { toast } from 'sonner';
import { useEffect } from 'react';

export function MultiStepForm() {
  const { currentStep, nextStep, previousStep } = useFormStore();

  // Auto-save functionality
  useEffect(() => {
    const saveInterval = setInterval(() => {
      // TODO: Implement auto-save to Supabase
      console.log('Auto-saving form data...');
    }, 30000); // Every 30 seconds

    return () => clearInterval(saveInterval);
  }, []);

  const handleNext = () => {
    nextStep();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBack = () => {
    previousStep();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSaveForLater = () => {
    // TODO: Implement save for later functionality
    toast.success('Progress Saved', {
      description: 'Your application has been saved. You can continue later.',
    });
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <Step1LeadCapture onNext={handleNext} />;
      case 2:
        return <Step2AboutYou onNext={handleNext} />;
      case 3:
        return (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold">Your Home & Financial Position</h2>
            <p className="text-muted-foreground">Step 3 - Coming soon</p>
          </div>
        );
      case 4:
        return (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold">Employment & Income</h2>
            <p className="text-muted-foreground">Step 4 - Coming soon</p>
          </div>
        );
      case 5:
        return (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold">Property Portfolio & Assets</h2>
            <p className="text-muted-foreground">Step 5 - Coming soon</p>
          </div>
        );
      case 6:
        return (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold">Spanish Property & Submission</h2>
            <p className="text-muted-foreground">Step 6 - Coming soon</p>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 py-8 px-4">
      <div className="container max-w-4xl mx-auto">
        <div className="mb-8 text-center">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">
            Spanish Property Mortgage Application
          </h1>
          <p className="text-muted-foreground">
            Most applicants complete this in 15-20 minutes
          </p>
        </div>

        <Card className="shadow-lg">
          <CardHeader>
            <FormProgress />
          </CardHeader>
          <CardContent className="space-y-6">
            {renderStep()}
            
            <FormNavigation
              onBack={handleBack}
              onNext={currentStep > 2 ? handleNext : undefined}
              onSave={handleSaveForLater}
              isLastStep={currentStep === 6}
            />
          </CardContent>
        </Card>

        {/* Trust Indicators */}
        <div className="mt-8 text-center space-y-2">
          <p className="text-sm text-muted-foreground flex items-center justify-center gap-2">
            <span className="text-green-600">🔒</span>
            Your data is encrypted and secure
          </p>
          <p className="text-sm text-muted-foreground">
            Auto-saved every 30 seconds • You can resume anytime
          </p>
        </div>
      </div>
    </div>
  );
}
