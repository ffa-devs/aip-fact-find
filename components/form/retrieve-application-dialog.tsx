'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Loader2, Mail } from 'lucide-react'
import { toast } from 'sonner'
import { checkExistingApplication, sendVerificationMessage } from '@/lib/services/application-service'

interface RetrieveApplicationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onApplicationRetrieved: (applicationId: string) => void
}

export function RetrieveApplicationDialog({ 
  open, 
  onOpenChange,
  onApplicationRetrieved 
}: RetrieveApplicationDialogProps) {
  const [email, setEmail] = useState('')
  const [verificationCode, setVerificationCode] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [step, setStep] = useState<'email' | 'verification'>('email')
  const [foundApplicationId, setFoundApplicationId] = useState<string | null>(null)

  const handleSubmitEmail = async () => {
    if (!email.trim()) {
      toast.error('Please enter your email address')
      return
    }

    setIsLoading(true)
    try {
      const result = await checkExistingApplication(email)
      
      if (result.exists && result.applicationId) {
        // Send verification message via GHL
        await sendVerificationMessage(result.contactId!)
        setFoundApplicationId(result.applicationId)
        setStep('verification')
        toast.success('Verification email sent!')
      } else {
        toast.error('No existing application found with this email.')
      }
    } catch (error) {
      console.error('Error checking existing application:', error)
      toast.error('Failed to check for existing application.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmitCode = () => {
    if (!verificationCode.trim()) {
      toast.error('Please enter the verification code')
      return
    }

    // In a real implementation, you would verify the code here
    // For now, we'll just proceed if a code is entered
    if (foundApplicationId) {
      onApplicationRetrieved(foundApplicationId)
      handleClose()
    }
  }

  const handleClose = () => {
    setEmail('')
    setVerificationCode('')
    setStep('email')
    setFoundApplicationId(null)
    onOpenChange(false)
  }

  const handleBack = () => {
    setStep('email')
    setVerificationCode('')
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {step === 'email' ? 'Retrieve Application' : 'Enter Verification Code'}
          </DialogTitle>
          <DialogDescription>
            {step === 'email' 
              ? 'Enter your email address to find your existing application'
              : 'Check your email for the verification code and enter it below'
            }
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {step === 'email' ? (
            <>
              <div className="space-y-2">
                <Label htmlFor="retrieve-email">Email Address</Label>
                <Input
                  id="retrieve-email"
                  type="email"
                  placeholder="Enter your email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSubmitEmail()}
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={handleClose} variant="outline" className="flex-1">
                  Cancel
                </Button>
                <Button 
                  onClick={handleSubmitEmail}
                  disabled={isLoading || !email.trim()}
                  className="flex-1"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Checking...
                    </>
                  ) : (
                    <>
                      <Mail className="mr-2 h-4 w-4" />
                      Find Application
                    </>
                  )}
                </Button>
              </div>
            </>
          ) : (
            <>
              <div className="space-y-2">
                <Label htmlFor="verification-code">Verification Code</Label>
                <Input
                  id="verification-code"
                  type="text"
                  placeholder="Enter 6-digit code"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSubmitCode()}
                  maxLength={6}
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={handleBack} variant="outline" className="flex-1">
                  Back
                </Button>
                <Button 
                  onClick={handleSubmitCode}
                  disabled={!verificationCode.trim()}
                  className="flex-1"
                >
                  Retrieve Application
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}