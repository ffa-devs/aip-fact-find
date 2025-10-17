'use client'

import { useFormStore } from '@/lib/store/form-store'
import { AppSidebar } from './app-sidebar'
import { Step1LeadCapture } from './steps/step1-lead-capture'
import { Step2AboutYou } from './steps/step2-about-you'
import { Step3MultiApplicant } from './steps/step3-multi-applicant'
import { Step4MultiApplicant } from './steps/step4-multi-applicant'
import { Step5Portfolio } from './steps/step5-portfolio'
import { Step6SpanishProperty } from './steps/step6-spanish-property'
import { ApplicationThankYou } from './application-thank-you'
import { RetrieveApplicationDialog } from './retrieve-application-dialog'
import { useEffect, useState } from 'react'
import { SidebarProvider, SidebarTrigger, SidebarInset } from '@/components/ui/sidebar'
import { Button } from '@/components/ui/button'
import Image from 'next/image'
import { toast } from 'sonner'
import { Mail } from 'lucide-react'

export function MultiStepForm() {
  const [showRetrieveDialog, setShowRetrieveDialog] = useState(false)
  
  const {
    currentStep,
    nextStep,
    applicationId,
    isCompleted,
    loadApplication,
    saveCurrentProgress,
    lastError,
    clearError,
  } = useFormStore()

  const handleApplicationRetrieved = (applicationId: string) => {
    loadApplication(applicationId)
    setShowRetrieveDialog(false)
    toast.success('Application retrieved successfully!')
  }

  // Show toast for database errors
  useEffect(() => {
    if (lastError) {
      toast.error('Database Sync Warning', {
        description: `${lastError}. Your data is saved locally and will sync when connection is restored.`,
        action: {
          label: 'Dismiss',
          onClick: () => clearError(),
        },
      })
    }
  }, [lastError, clearError])

  // Initialize application on first load
  useEffect(() => {
    const initializeApplication = async () => {
      // Check if there's an application ID in localStorage to resume
      if (applicationId) {
        try {
          const success = await loadApplication(applicationId)
         if (!success) {
            clearError()
          }
        } catch (error) {
          console.error('Error loading application:', error)
          clearError()
        }
      }
    }

    initializeApplication()
  }, [applicationId, loadApplication, clearError])

  // Auto-save functionality
  useEffect(() => {
    const saveInterval = setInterval(async () => {
      if (applicationId) {
        await saveCurrentProgress()
      }
    }, 30000) // Every 30 seconds

    return () => clearInterval(saveInterval)
  }, [applicationId, saveCurrentProgress])

  const handleNext = () => {
    nextStep()
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const getStepTitle = () => {
    switch (currentStep) {
      case 1:
        return 'OK! Now tell us a little bit about yourself.'
      case 2:
        return 'Tell us about yourself and any co-applicants'
      case 3:
        return 'Your current home and financial information'
      case 4:
        return 'Employment and income details'
      case 5:
        return 'Your property portfolio and assets'
      case 6:
        return 'Spanish property purchase information'
      default:
        return 'Complete your application'
    }
  }

  const getStepSubtitle = () => {
    switch (currentStep) {
      case 1:
        return "And for your peace of mind, please know we'll never sell your info to 3rd parties."
      case 2:
        return 'We need some basic information about all applicants'
      case 3:
        return 'Help us understand your current living situation'
      case 4:
        return 'Tell us about your employment and monthly income'
      case 5:
        return 'Any rental properties or other investments'
      case 6:
        return 'Details about the Spanish property you want to purchase'
      default:
        return ''
    }
  }

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <Step1LeadCapture onNext={handleNext} />
      case 2:
        return <Step2AboutYou onNext={handleNext} />
      case 3:
        return <Step3MultiApplicant onNext={handleNext} />
      case 4:
        return <Step4MultiApplicant onNext={handleNext} />
      case 5:
        return <Step5Portfolio onNext={handleNext} />
      case 6:
        return <Step6SpanishProperty onNext={handleNext} />
      default:
        return null
    }
  }

  return (
    <SidebarProvider
      style={
        {
          '--sidebar-width': '280px',
          '--sidebar-width-mobile': '280px',
        } as React.CSSProperties
      }
    >
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-18 shrink-0 items-center border-b p-4 justify-between">
          <div className="flex items-center gap-4">
            <SidebarTrigger className="md:hidden" />
            <Image
              src="/logo-long.jpg"
              alt="FFA Financial"
              width={160}
              height={40}
              className="h-14 w-auto"
            />
          </div>
          
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowRetrieveDialog(true)}
              className="hidden md:flex items-center gap-2"
            >
              <Mail className="h-4 w-4" />
              Retrieve Application
            </Button>
            <div className="hidden md:block text-right text-sm text-gray-600">
              <p className="font-medium">info@fluentfinanceabroad.com</p>
              <p>Tel: +34 952 85 36 47</p>
              <p className="text-xs">UK: +44 (0) 2033939902 | US: 001 2023791946</p>
            </div>
          </div>
        </header>

        <div className="flex-1 space-y-4 p-6">
          <div className="max-w-3xl space-y-6">
            {isCompleted ? (
              <ApplicationThankYou />
            ) : (
              <>
                <div className=" space-y-2">
                  <h2 className="text-2xl font-bold text-gray-900">{getStepTitle()}</h2>
                  <p className="text-gray-600">{getStepSubtitle()}</p>
                </div>
                {renderStep()}
              </>
            )}
          </div>
        </div>
      </SidebarInset>
      
      <RetrieveApplicationDialog
        open={showRetrieveDialog}
        onOpenChange={setShowRetrieveDialog}
        onApplicationRetrieved={handleApplicationRetrieved}
      />
    </SidebarProvider>
  )
}
