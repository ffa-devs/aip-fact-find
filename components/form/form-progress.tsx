'use client';

import { useFormStore } from '@/lib/store/form-store';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';

const steps = [
  { number: 1, title: 'Get Started', progress: 20 },
  { number: 2, title: 'About You', progress: 40 },
  { number: 3, title: 'Your Home', progress: 60 },
  { number: 4, title: 'Employment', progress: 70 },
  { number: 5, title: 'Portfolio', progress: 85 },
  { number: 6, title: 'Submit', progress: 100 },
];

export function FormProgress() {
  const currentStep = useFormStore((state) => state.currentStep);
  const progress = useFormStore((state) => state.getProgress());

  return (
    <div className="w-full mb-8 space-y-4">
      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>Step {currentStep} of 6</span>
          <span>{progress}% Complete</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Step Indicators - Desktop */}
      <div className="hidden md:flex justify-between items-center">
        {steps.map((step, index) => (
          <div key={step.number} className="flex items-center">
            <div className="flex flex-col items-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-colors ${
                  currentStep === step.number
                    ? 'bg-primary text-primary-foreground'
                    : currentStep > step.number
                    ? 'bg-primary/20 text-primary'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                {currentStep > step.number ? '✓' : step.number}
              </div>
              <span
                className={`mt-2 text-xs font-medium ${
                  currentStep === step.number
                    ? 'text-foreground'
                    : 'text-muted-foreground'
                }`}
              >
                {step.title}
              </span>
            </div>
            {index < steps.length - 1 && (
              <div
                className={`h-0.5 w-12 lg:w-20 mx-2 ${
                  currentStep > step.number ? 'bg-primary' : 'bg-muted'
                }`}
              />
            )}
          </div>
        ))}
      </div>

      {/* Current Step Badge - Mobile */}
      <div className="md:hidden flex justify-center">
        <Badge variant="outline" className="text-sm px-4 py-2">
          {steps[currentStep - 1]?.title}
        </Badge>
      </div>
    </div>
  );
}
