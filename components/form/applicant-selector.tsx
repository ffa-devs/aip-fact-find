'use client';


import { useFormStore } from '@/lib/store/form-store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Circle, User, Users, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ApplicantSelectorProps {
  currentApplicantIndex: number;
  onApplicantChange: (index: number) => void;
  completionStatus: boolean[];
  showProgress?: boolean;
}

export function ApplicantSelector({
  currentApplicantIndex,
  onApplicantChange,
  completionStatus,
  showProgress = true
}: ApplicantSelectorProps) {
  const { step2 } = useFormStore();

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

  const completedCount = completionStatus.filter(Boolean).length;
  const totalCount = applicants.length;

  return (
    <Card className="mb-6">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Users className="w-5 h-5" />
            Applicant Information
          </CardTitle>
          {showProgress && (
            <Badge 
              variant={completedCount === totalCount ? "default" : "secondary"}
              className={cn(
                "flex items-center gap-1",
                completedCount === totalCount && "bg-green-100 text-green-800 border-green-200"
              )}
            >
              {completedCount === totalCount ? (
                <CheckCircle2 className="w-3 h-3" />
              ) : (
                <AlertCircle className="w-3 h-3" />
              )}
              {completedCount} of {totalCount} completed
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {/* Applicant Selection Tabs */}
        <div className="flex flex-wrap gap-2 mb-4">
          {applicants.map((applicant, index) => {
            const isActive = index === currentApplicantIndex;
            const isCompleted = completionStatus[index];
            
            return (
              <Button
                key={applicant.id}
                variant={isActive ? "default" : "outline"}
                size="sm"
                onClick={() => onApplicantChange(index)}
                className={cn(
                  "flex items-center gap-2 min-w-[140px] transition-all",
                  isCompleted && !isActive && 
                  "border-green-500 bg-green-50 hover:bg-green-100 text-green-700",
                  !isCompleted && !isActive &&
                  "border-orange-300 bg-orange-50 hover:bg-orange-100 text-orange-700"
                )}
              >
                {applicant.isPrimary ? (
                  <User className="w-4 h-4" />
                ) : (
                  <Users className="w-4 h-4" />
                )}
                <span className="truncate max-w-[100px]">
                  {applicant.name}
                </span>
                {isCompleted && !isActive ? (
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                ) : !isCompleted && !isActive ? (
                  <Circle className="w-4 h-4 text-orange-500" />
                ) : null}
              </Button>
            );
          })}
        </div>

        {/* Current Applicant Context */}
        <div className="bg-muted/50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {applicants[currentApplicantIndex]?.isPrimary ? (
                <User className="w-5 h-5 text-blue-600" />
              ) : (
                <Users className="w-5 h-5 text-blue-600" />
              )}
              <div>
                <p className="font-medium text-sm">
                  Currently filling for:
                </p>
                <p className="text-lg font-semibold">
                  {applicants[currentApplicantIndex]?.name}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">
                Applicant {currentApplicantIndex + 1} of {totalCount}
              </p>
              {completionStatus[currentApplicantIndex] ? (
                <Badge variant="default" className="bg-green-100 text-green-800 border-green-200">
                  <CheckCircle2 className="w-3 h-3 mr-1" />
                  Completed
                </Badge>
              ) : (
                <Badge variant="secondary" className="bg-orange-100 text-orange-800 border-orange-200">
                  <Circle className="w-3 h-3 mr-1" />
                  In Progress
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* Progress Message */}
        {showProgress && completedCount < totalCount && (
          <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-blue-600 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-blue-900">
                  {completedCount === 0 
                    ? "Please complete information for all applicants"
                    : `${totalCount - completedCount} applicant${totalCount - completedCount > 1 ? 's' : ''} still need${totalCount - completedCount === 1 ? 's' : ''} attention`
                  }
                </p>
                <p className="text-blue-700 mt-1">
                  You can switch between applicants at any time and return to complete missing information.
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}