import { supabase } from '@/lib/supabase/client'

export interface ExistingApplicationResult {
  exists: boolean
  applicationId?: string
  contactId?: string
  opportunityId?: string
}

/**
 * Check if there's an existing draft application for the given email
 */
export async function checkExistingApplication(email: string): Promise<ExistingApplicationResult> {
  try {
    console.log('🔍 Checking for existing application with email:', email)
    
    // First, find applications for this email
    const { data: applicants, error: applicantsError } = await supabase
      .from('applicants')
      .select('application_id')
      .eq('email', email.toLowerCase())
      .eq('applicant_order', 1) // Primary applicant only
      
    if (applicantsError) {
      console.error('Error finding applicants:', applicantsError)
      return { exists: false }
    }

    if (!applicants || applicants.length === 0) {
      return { exists: false }
    }

    // Get application details
    const applicationIds = applicants.map(a => a.application_id)
    const { data: applications, error: appsError } = await supabase
      .from('applications')
      .select('id, status, ghl_contact_id, ghl_opportunity_id, current_step')
      .in('id', applicationIds)
      .eq('status', 'draft')
      .not('ghl_contact_id', 'is', null)
      .not('ghl_opportunity_id', 'is', null)
      .order('current_step', { ascending: false })

    if (appsError) {
      console.error('Error finding applications:', appsError)
      return { exists: false }
    }

    if (!applications || applications.length === 0) {
      return { exists: false }
    }

    const latestApplication = applications[0]

    return {
      exists: true,
      applicationId: latestApplication.id,
      contactId: latestApplication.ghl_contact_id!,
      opportunityId: latestApplication.ghl_opportunity_id!
    }
  } catch (error) {
    console.error('Error in checkExistingApplication:', error)
    return { exists: false }
  }
}

/**
 * Send verification message via GHL
 */
export async function sendVerificationMessage(contactId: string): Promise<boolean> {
  try {
    console.log('📧 Sending verification message to contact:', contactId)
    
    const verificationCode = Math.random().toString(36).substring(2, 8).toUpperCase()
    
    const messageData = {
      type: 'Email',
      contactId,
      subject: 'Continue Your AIP Application',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Continue Your Application</h2>
          <p>Hello,</p>
          <p>We found your existing Australian Investment Property application. Use the code below to continue where you left off:</p>
          <div style="background: #f5f5f5; padding: 20px; text-align: center; margin: 20px 0;">
            <h3 style="margin: 0; font-size: 24px; color: #007bff; letter-spacing: 3px;">${verificationCode}</h3>
          </div>
          <p>If you didn't request this, please ignore this email.</p>
          <p>Best regards,<br>AIP Team</p>
        </div>
      `,
      message: `Your verification code to continue your AIP application is: ${verificationCode}`,
      status: 'delivered'
    }

    const response = await fetch('/api/ghl/send-message', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(messageData),
    })

    if (!response.ok) {
      throw new Error(`Failed to send message: ${response.statusText}`)
    }

    const result = await response.json()
    console.log('✅ Verification message sent successfully:', result)
    
    // Store the verification code temporarily (in a real app, you'd store this in the database)
    // For now, we'll just log it
    console.log('🔑 Verification code for testing:', verificationCode)
    
    return true
  } catch (error) {
    console.error('Error sending verification message:', error)
    return false
  }
}