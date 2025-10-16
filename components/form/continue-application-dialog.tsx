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
  DialogTrigger,
} from '@/components/ui/dialog'
import { Loader2, Mail, RotateCcw } from 'lucide-react'
import { toast } from 'sonner'
import { checkExistingApplication, sendVerificationMessage, validateVerificationCode } from '@/lib/services/application-service'
import { useFormStore } from '@/lib/store/form-store'

export function ContinueApplicationDialog() {
  const [isOpen, setIsOpen] = useState(false)
  const [email, setEmail] = useState('')
  const [verificationCode, setVerificationCode] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [emailSent, setEmailSent] = useState(false)
  
  const { setApplicationId, loadApplication } = useFormStore()

  const handleEmailSubmit = async () => {
    if (!email.trim()) {
      toast.error('Please enter your email address')
      return
    }

    setIsLoading(true)
    try {
      const result = await checkExistingApplication(email)
      
      // Always show the email sent message for security
      setEmailSent(true)
      
      if (result.exists && result.applicationId) {
        // Send verification message via GHL
        await sendVerificationMessage(result.contactId!, email, result.applicationId)
      }
      
    } catch (error) {
      console.error('Error checking existing application:', error)
      setEmailSent(true) // Still show email sent message for security
    } finally {
      setIsLoading(false)
    }
  }

  const handleCodeSubmit = async () => {
    if (!verificationCode.trim()) {
      toast.error('Please enter the verification code')
      return
    }

    setIsLoading(true)
    try {
      const result = await validateVerificationCode(email, verificationCode)
      
      if (result.valid && result.applicationId) {
        // Load the existing application
        setApplicationId(result.applicationId)
        const success = await loadApplication(result.applicationId)
        
        if (success) {
          toast.success('Application loaded successfully!')
          setIsOpen(false)
          handleReset()
        } else {
          toast.error('Failed to load application. Please try again.')
        }
      } else {
        toast.error(result.error || 'Invalid verification code')
      }
    } catch (error) {
      console.error('Error validating verification code:', error)
      toast.error('Failed to validate code. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleReset = () => {
    setEmail('')
    setVerificationCode('')
    setEmailSent(false)
  }

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open)
    if (!open) {
      handleReset()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <RotateCcw className="mr-2 h-4 w-4" />
          Continue Application
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Continue Existing Application</DialogTitle>
          <DialogDescription>
            {!emailSent 
              ? "Enter your email address to retrieve your application"
              : "Check your email for a verification code"
            }
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {!emailSent ? (
            <>
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleEmailSubmit()}
                />
              </div>
              <Button
                onClick={handleEmailSubmit}
                className="w-full"
                disabled={isLoading || !email.trim()}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Checking...
                  </>
                ) : (
                  'Send Verification Code'
                )}
              </Button>
            </>
          ) : (
            <>
              <div className="text-center space-y-3">
                <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <Mail className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <h4 className="font-medium">Check Your Email</h4>
                  <p className="text-sm text-muted-foreground">
                    If an application exists with this email, we&apos;ve sent you a verification code.
                  </p>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="code">Verification Code</Label>
                <Input
                  id="code"
                  placeholder="Enter 6-digit code"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.toUpperCase())}
                  onKeyDown={(e) => e.key === 'Enter' && handleCodeSubmit()}
                  maxLength={6}
                />
              </div>
              
              <div className="flex space-x-2">
                <Button
                  onClick={handleCodeSubmit}
                  className="flex-1"
                  disabled={isLoading || !verificationCode.trim()}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    'Continue Application'
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={handleReset}
                  disabled={isLoading}
                >
                  Back
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}