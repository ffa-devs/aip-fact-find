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
 * Send verification message via GHL and store code in database
 */
export async function sendVerificationMessage(contactId: string, email: string, applicationId: string): Promise<boolean> {
  try {
    console.log('📧 Sending verification message to contact:', contactId)
    
    const verificationCode = Math.random().toString(36).substring(2, 8).toUpperCase()
    
    // Store verification code in database first
    const { error: insertError } = await supabase
      .from('verification_codes')
      .insert({
        email: email.toLowerCase(),
        code: verificationCode,
        contact_id: contactId,
        application_id: applicationId,
        expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString() // 15 minutes from now
      })

    if (insertError) {
      console.error('❌ Failed to store verification code:', insertError)
      throw new Error('Failed to store verification code')
    }

    const messageData = {
      type: 'Email',
      contactId,
      subject: 'Continue Your AIP Application - Fluent Finance Abroad',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Continue Your AIP Application</h2>
          <p>Hello,</p>
          <p>We found your existing Agreement in Principle (AIP) application with Fluent Finance Abroad. Use the code below to continue where you left off:</p>
          <div style="background: #f5f5f5; padding: 20px; text-align: center; margin: 20px 0;">
            <h3 style="margin: 0; font-size: 24px; color: #007bff; letter-spacing: 3px;">${verificationCode}</h3>
          </div>
          <p><strong>This code expires in 15 minutes.</strong></p>
          <p>If you didn't request this, please ignore this email.</p>
          <p>Best regards,<br>Fluent Finance Abroad Team</p>
          <p style="font-size: 12px; color: #666; margin-top: 20px;">
            Fluent Finance Abroad S.L. | Bank of Spain Licence D305<br>
            Av. Marques del Duero 76, 3º C, San Pedro Alcantara, 29670 Marbella, Spain
          </p>
        </div>
      `,
      message: `Your verification code to continue your Fluent Finance Abroad AIP application is: ${verificationCode}. This code expires in 15 minutes.`,
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
    console.log('🔑 Verification code stored for email:', email)
    
    return true
  } catch (error) {
    console.error('Error sending verification message:', error)
    return false
  }
}

/**
 * Validate verification code
 */
export async function validateVerificationCode(email: string, code: string): Promise<{ valid: boolean; applicationId?: string; error?: string }> {
  try {
    console.log('🔍 Validating verification code for email:', email)
    
    // Find the verification code
    const { data: verificationData, error: fetchError } = await supabase
      .from('verification_codes')
      .select('id, application_id, expires_at, used')
      .eq('email', email.toLowerCase())
      .eq('code', code.toUpperCase())
      .eq('used', false)
      .order('created_at', { ascending: false })
      .limit(1)

    if (fetchError) {
      console.error('❌ Error fetching verification code:', fetchError)
      return { valid: false, error: 'Database error while validating code' }
    }

    if (!verificationData || verificationData.length === 0) {
      console.log('❌ Invalid verification code')
      return { valid: false, error: 'Invalid verification code' }
    }

    const verification = verificationData[0]

    // Check if code has expired
    if (new Date(verification.expires_at) < new Date()) {
      console.log('❌ Verification code has expired')
      return { valid: false, error: 'Verification code has expired. Please request a new one.' }
    }

    // Mark code as used
    const { error: updateError } = await supabase
      .from('verification_codes')
      .update({ 
        used: true, 
        used_at: new Date().toISOString() 
      })
      .eq('id', verification.id)

    if (updateError) {
      console.error('❌ Error marking code as used:', updateError)
      return { valid: false, error: 'Failed to process verification code' }
    }

    console.log('✅ Verification code validated successfully')
    return { 
      valid: true, 
      applicationId: verification.application_id 
    }

  } catch (error) {
    console.error('❌ Error validating verification code:', error)
    return { valid: false, error: 'An unexpected error occurred' }
  }
}