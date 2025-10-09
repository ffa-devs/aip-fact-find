'use client';

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { useFormStore } from '@/lib/store/form-store';
import { FormProgress } from './form-progress';
import { FormNavigation } from './form-navigation';
import { Step1LeadCapture } from './steps/step1-lead-capture';
import { Step2AboutYou } from './steps/step2-about-you';
import { Step3HomeFinancial } from './steps/step3-home-financial';
import { Step4Employment } from './steps/step4-employment';
import { Step5Portfolio } from './steps/step5-portfolio';
import { Step6SpanishProperty } from './steps/step6-spanish-property';
import { useEffect } from 'react';

export function MultiStepForm() {
  const { currentStep, nextStep } = useFormStore();

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

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <Step1LeadCapture onNext={handleNext} />;
      case 2:
        return <Step2AboutYou onNext={handleNext} />;
      case 3:
        return <Step3HomeFinancial onNext={handleNext} />;
      case 4:
        return <Step4Employment onNext={handleNext} />;
      case 5:
        return <Step5Portfolio onNext={handleNext} />;
      case 6:
        return <Step6SpanishProperty onNext={handleNext} />;
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
            
            {/* FormNavigation is now inside each step component (Step1, Step2, Step3, Step4, Step5, Step6, etc.) */}
            {/* For placeholder steps 7+, show basic navigation */}
            {currentStep > 6 && (
              <FormNavigation showSaveForLater={true} />
            )}
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
