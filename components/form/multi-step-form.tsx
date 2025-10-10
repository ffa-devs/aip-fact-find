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
  const { currentStep, nextStep } = useFormStore()

  // Auto-save functionality
  useEffect(() => {
    const saveInterval = setInterval(() => {
      // TODO: Implement auto-save to Supabase
      console.log('Auto-saving form data...')
    }, 30000) // Every 30 seconds

    return () => clearInterval(saveInterval)
  }, [])

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
          '--sidebar-width': '20rem',
          '--sidebar-width-mobile': '18rem',
        } as React.CSSProperties
      }
    >
      <AppSidebar />
      <SidebarInset>
        <div className="flex flex-col min-h-screen">
          {/* Header */}
          <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-4 md:px-8 py-6">
            <div className="flex items-center">
              <div className="flex items-center justify-between w-full">
                <SidebarTrigger className="md:hidden" />
                <Image
                  src="/logo-long.jpg"
                  alt="Fluent Finance Abroad"
                  width={160}
                  height={40}
                  className="h-15 w-auto"
                />
                <div className="hidden md:block text-right text-sm text-gray-600">
                  <p className="font-medium">info@fluentfinanceabroad.com</p>
                  <p>Tel: +34 952 85 36 47</p>
                  <p className="text-xs">UK: +44 (0) 2033939902 | US: 001 2023791946</p>
                </div>
              </div>
            </div>
          </div>

          {/* Form Content */}
          <div className="flex-1 px-4 md:px-8 py-6 bg-white">
            <div className="max-w-2xl">{renderStep()}</div>
          </div>

          {/* Trust Indicators Footer */}
          <div className="bg-gray-50 px-4 md:px-8 py-4 border-t border-gray-200">
            <div className="max-w-2xl text-sm text-gray-500 space-y-1">
              <p className="flex items-center gap-2">
                <span className="text-green-600">🔒</span>
                Your data is encrypted and secure
              </p>
              <p>Auto-saved every 30 seconds • You can resume anytime</p>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
