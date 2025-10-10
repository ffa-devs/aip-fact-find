'use client'

import { useFormStore } from '@/lib/store/form-store'
import { AppSidebar } from './app-sidebar'
import { Step1LeadCapture } from './steps/step1-lead-capture'
import { Step2AboutYou } from './steps/step2-about-you'
import { Step3MultiApplicant } from './steps/step3-multi-applicant'
import { Step4MultiApplicant } from './steps/step4-multi-applicant'
import { Step5Portfolio } from './steps/step5-portfolio'
import { Step6SpanishProperty } from './steps/step6-spanish-property'
import { useEffect } from 'react'
import { SidebarProvider, SidebarTrigger, SidebarInset } from '@/components/ui/sidebar'
import Image from 'next/image'

export function MultiStepForm() {
  const { 
    currentStep, 
    nextStep, 
    applicationId, 
    loadApplication, 
    saveCurrentProgress,
    lastError,
    clearError 
  } = useFormStore()

  // Initialize application on first load
  useEffect(() => {
    const initializeApplication = async () => {
      // Check if there's an application ID in localStorage to resume
      if (applicationId) {
        try {
          const success = await loadApplication(applicationId)
          if (success) {
            console.log('Loaded existing application:', applicationId)
          } else {
            console.log('Failed to load application, starting fresh')
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
        <header className="flex h-16 shrink-0 items-center border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <div className="mx-auto flex items-center gap-4">
            <Image
              src="/ffa-logo.png"
              alt="FFA Financial"
              width={40}
              height={40}
              className="rounded-lg"
            />
            <div>
              <h1 className="text-lg font-semibold" style={{ color: '#234c8a' }}>
                AIP Fact Find
              </h1>
              <p className="text-sm text-gray-600">
                📧 hello@ffafinancial.com | ☎️ +34 952 806 120
              </p>
            </div>
          </div>
        </header>

        <div className="flex-1 space-y-4 p-6">
          {/* Database Error Banner */}
          {lastError && (
            <div className="mx-auto max-w-2xl">
              <div className="rounded-lg bg-yellow-50 border border-yellow-200 p-4">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-yellow-800">Database Sync Warning</h3>
                    <p className="text-sm text-yellow-700 mt-1">{lastError}</p>
                    <p className="text-xs text-yellow-600 mt-1">Your data is saved locally and will sync when connection is restored.</p>
                  </div>
                  <div className="ml-auto pl-3">
                    <button
                      type="button"
                      className="inline-flex rounded-md bg-yellow-50 p-1.5 text-yellow-500 hover:bg-yellow-100"
                      onClick={clearError}
                    >
                      <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="mx-auto max-w-2xl space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold text-gray-900">{getStepTitle()}</h2>
              <p className="text-gray-600">{getStepSubtitle()}</p>
            </div>
            {renderStep()}
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
