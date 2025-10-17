'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { CheckCircle, Phone, Mail, FileText, ArrowRight } from 'lucide-react'
import { useFormStore } from '@/lib/store/form-store'

export function ApplicationThankYou() {
  const { resetForm, applicationId } = useFormStore()

  const handleNewApplication = () => {
    resetForm()
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Success Header */}
      <div className="text-center space-y-4">
        <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
          <CheckCircle className="w-8 h-8 text-green-600" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900">
          Thank You for Your Application!
        </h1>
        <p className="text-lg text-gray-600">
          Your AIP (Agreement in Principle) fact-find has been submitted successfully.
        </p>
        {applicationId && (
          <p className="text-sm text-gray-500 font-mono bg-gray-50 p-2 rounded">
            Application ID: {applicationId}
          </p>
        )}
      </div>

      {/* What Happens Next */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ArrowRight className="w-5 h-5 text-blue-600" />
            What Happens Next?
          </CardTitle>
          <CardDescription>
            Here&apos;s what you can expect from our team over the coming days:
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4">
            <div className="flex gap-3">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-semibold text-sm">
                1
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">Review & Analysis</h4>
                <p className="text-gray-600 text-sm">
                  Our team will review your application and conduct initial research on your requirements.
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-semibold text-sm">
                2
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">Personal Consultation</h4>
                <p className="text-gray-600 text-sm">
                  We&apos;ll contact you within 24-48 hours to schedule a detailed discovery call.
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-semibold text-sm">
                3
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">Tailored Proposal</h4>
                <p className="text-gray-600 text-sm">
                  Based on your requirements, we&apos;ll prepare a customized mortgage solution proposal.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contact Information */}
      <Card>
        <CardHeader>
          <CardTitle>Need to Reach Us?</CardTitle>
          <CardDescription>
            Our team is here to help with any questions about your application.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid md:grid-cols-2 gap-4">
          <div className="flex items-center gap-3">
            <Mail className="w-5 h-5 text-blue-600" />
            <div>
              <p className="font-medium">Email</p>
              <p className="text-sm text-gray-600">info@fluentfinanceabroad.com</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Phone className="w-5 h-5 text-blue-600" />
            <div>
              <p className="font-medium">Phone</p>
              <p className="text-sm text-gray-600">Spain: +34 952 85 36 47</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Phone className="w-5 h-5 text-blue-600" />
            <div>
              <p className="font-medium">UK Office</p>
              <p className="text-sm text-gray-600">+44 (0) 2033939902</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Phone className="w-5 h-5 text-blue-600" />
            <div>
              <p className="font-medium">US Office</p>
              <p className="text-sm text-gray-600">001 2023791946</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Important Note */}
      <Card className="border-amber-200 bg-amber-50">
        <CardHeader>
          <CardTitle className="text-amber-800 flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Important Note
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-amber-700">
            Please keep your Application ID safe for reference. You may be asked for it during 
            your consultation call or future correspondence.
          </p>
        </CardContent>
      </Card>

      {/* New Application Button */}
      <div className="text-center pt-8">
        <Button 
          onClick={handleNewApplication}
          variant="outline"
          size="lg"
        >
          Start New Application
        </Button>
      </div>
    </div>
  )
}