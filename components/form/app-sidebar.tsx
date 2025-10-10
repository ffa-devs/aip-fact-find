'use client';

import { useFormStore } from '@/lib/store/form-store';
import { cn } from '@/lib/utils';
import { CheckCircle2, Circle, User, Users } from 'lucide-react';
import { useApplicantSelector } from '@/hooks/use-applicant-selector';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from '@/components/ui/sidebar'

interface Step {
  number: number
  title: string
  description: string
  hasApplicants?: boolean // Steps 3 & 4 have multi-applicant data
}

const steps: Step[] = [
  { number: 1, title: 'Welcome', description: 'Basic information' },
  { number: 2, title: 'Personal Info', description: 'About you' },
  { number: 3, title: 'Property Info', description: 'Current home', hasApplicants: true },
  { number: 4, title: 'Income', description: 'Employment details', hasApplicants: true },
  { number: 5, title: 'Assets', description: 'Property portfolio' },
  { number: 6, title: 'Government', description: 'Spanish property' },
]

export function AppSidebar() {
  const { currentStep, setCurrentStep, step2, step3, step4 } = useFormStore()
  const selectedApplicantIndex = useApplicantSelector()

  // Get all applicants (primary + co-applicants)
  const getAllApplicants = () => {
    const applicants = [{ name: 'Primary Applicant', isPrimary: true }]
    if (step2.has_co_applicants && step2.co_applicants) {
      step2.co_applicants.forEach((coApp) => {
        applicants.push({
          name: `${coApp.first_name} ${coApp.last_name}`,
          isPrimary: false,
        })
      })
    }
    return applicants
  }

  const getStepStatus = (stepNumber: number) => {
    if (stepNumber < currentStep) return 'completed'
    if (stepNumber === currentStep) return 'current'
    return 'upcoming'
  }

  // Get completion status for applicant-specific steps
  const getApplicantStepCompletion = (stepNumber: number) => {
    if (stepNumber === 3) {
      const statuses = []
      // Primary applicant - check if essential fields are filled
      const primaryComplete = !!(
        step3.current_address &&
        step3.move_in_date &&
        step3.homeowner_or_tenant &&
        step3.tax_country
      )
      statuses.push(primaryComplete)
      
      // Co-applicants - ensure we match the number of co-applicants from step2
      if (step2.has_co_applicants && step2.co_applicants && step2.co_applicants.length > 0) {
        step2.co_applicants.forEach((_, index) => {
          const coApplicantData = step3.co_applicants?.[index]
          const coApplicantComplete = !!(
            coApplicantData?.current_address &&
            coApplicantData?.move_in_date &&
            coApplicantData?.homeowner_or_tenant &&
            coApplicantData?.tax_country
          )
          statuses.push(coApplicantComplete)
        })
      }
      return statuses
    }
    if (stepNumber === 4) {
      const statuses = []
      // Primary applicant - check if basic employment info is provided
      const primaryComplete = !!(step4.employment_status)
      statuses.push(primaryComplete)
      
      // Co-applicants - ensure we match the number of co-applicants from step2
      if (step2.has_co_applicants && step2.co_applicants && step2.co_applicants.length > 0) {
        step2.co_applicants.forEach((_, index) => {
          const coApplicantData = step4.co_applicants?.[index]
          const coApplicantComplete = !!(coApplicantData?.employment_status)
          statuses.push(coApplicantComplete)
        })
      }
      return statuses
    }
    return []
  }

  const handleApplicantChange = (index: number) => {
    // Trigger a custom event that the multi-applicant components can listen to
    window.dispatchEvent(new CustomEvent('applicantChange', { detail: { index } }))
  }

  const allApplicants = getAllApplicants()
  const showApplicantTabs = step2.has_co_applicants && (currentStep === 3 || currentStep === 4)

  return (
    <Sidebar collapsible="icon">
      {/* <SidebarHeader className="border-b border-sidebar-border">

      </SidebarHeader> */}

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="px-6 pb-4 pt-6 text-sm font-medium text-sidebar-foreground/80">
            Application Steps
          </SidebarGroupLabel>
          <SidebarGroupContent className="px-3">
            <SidebarMenu className="space-y-2">
              {steps.map((step) => {
                const status = getStepStatus(step.number)
                const isClickable = step.number <= currentStep || step.number === currentStep + 1

                return (
                  <SidebarMenuItem key={step.number}>
                    <SidebarMenuButton
                      onClick={() => isClickable && setCurrentStep(step.number)}
                      disabled={!isClickable}
                      isActive={status === 'current'}
                      className={cn(
                        'w-full justify-start h-auto py-4 px-4 rounded-lg',
                        status === 'completed' && 'text-green-700',
                        status === 'current' && 'bg-blue-50 hover:bg-blue-100 border border-blue-200',
                        status === 'upcoming' && !isClickable && 'opacity-50 cursor-not-allowed'
                      )}
                    >
                      <div className="flex items-center gap-4 w-full">
                        <div className="flex-shrink-0">
                          {status === 'completed' ? (
                            <CheckCircle2 className="w-6 h-6 text-green-600" />
                          ) : status === 'current' ? (
                            <div
                              className="w-6 h-6 rounded-full text-white text-sm flex items-center justify-center font-medium"
                              style={{ backgroundColor: '#234c8a' }}
                            >
                              {step.number}
                            </div>
                          ) : (
                            <Circle className="w-6 h-6 text-gray-400" />
                          )}
                        </div>

                        <div className="min-w-0 flex-1 text-left py-1">
                          <p
                            className={cn(
                              'text-base font-semibold mb-1',
                              status === 'completed' && 'text-green-900',
                              status === 'current' && 'text-sidebar-primary',
                              status === 'upcoming' && 'text-sidebar-foreground/60'
                            )}
                          >
                            {step.title}
                          </p>
                          <p
                            className={cn(
                              'text-sm',
                              status === 'completed' && 'text-green-700',
                              status === 'current' && 'text-sidebar-primary/80',
                              status === 'upcoming' && 'text-sidebar-foreground/40'
                            )}
                          >
                            {step.description}
                          </p>
                        </div>
                      </div>
                    </SidebarMenuButton>

                    {/* Show applicant tabs for steps 3 & 4 when there are co-applicants */}
                    {showApplicantTabs && step.number === currentStep && step.hasApplicants && (
                      <SidebarMenuSub className="ml-6 mt-2 space-y-1">
                        {allApplicants.map((applicant, index) => {
                          const completionStatuses = getApplicantStepCompletion(currentStep)
                          const isComplete = completionStatuses[index] || false
                          const isSelected = selectedApplicantIndex === index

                          return (
                            <SidebarMenuSubItem key={index}>
                              <SidebarMenuSubButton
                                onClick={() => handleApplicantChange(index)}
                                isActive={isSelected}
                                className={cn(
                                  "w-full justify-start h-auto py-3 px-3 rounded-md",
                                  isSelected && "bg-blue-50 hover:bg-blue-100 border border-blue-200"
                                )}
                              >
                                <div className="flex items-center gap-3 w-full">
                                  <div className="flex-shrink-0">
                                    {applicant.isPrimary ? (
                                      <User className="w-5 h-5" style={{ color: '#234c8a' }} />
                                    ) : (
                                      <Users className="w-5 h-5" style={{ color: '#234c8a' }} />
                                    )}
                                  </div>
                                  <span className="flex-1 truncate text-sm font-medium">
                                    {applicant.name}
                                  </span>
                                  <div className="flex-shrink-0">
                                    {isComplete ? (
                                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                                    ) : (
                                      <Circle className="w-5 h-5 text-gray-400" />
                                    )}
                                  </div>
                                </div>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          )
                        })}
                      </SidebarMenuSub>
                    )}
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  )
}
