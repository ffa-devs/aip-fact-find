/**
 * API Route: Create Co-Applicant Records
 * POST /api/gohigh/create-co-applicants
 * 
 * Creates co-applicant records in GoHighLevel Custom Objects after form submission
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAllCoApplicantRecords } from '@/lib/ghl/co-applicant-service';
import { getDefaultLocationId } from '@/lib/ghl/oauth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { applicationId, formState, contactId } = body;

    console.log('🔍 Co-applicant API called with:', {
      applicationId,
      contactId,
      coApplicantsCount: formState?.step2?.co_applicants?.length || 0,
      step2HasCoApplicants: !!formState?.step2?.co_applicants,
      step3HasCoApplicants: !!formState?.step3?.co_applicants,
      step4HasCoApplicants: !!formState?.step4?.co_applicants
    });

    if (!applicationId) {
      return NextResponse.json(
        { error: 'Application ID is required' },
        { status: 400 }
      );
    }

    if (!formState) {
      return NextResponse.json(
        { error: 'Form state is required' },
        { status: 400 }
      );
    }

    if (!contactId) {
      return NextResponse.json(
        { error: 'Contact ID is required' },
        { status: 400 }
      );
    }

    // Check if there are co-applicants to process
    if (!formState.step2?.co_applicants || formState.step2.co_applicants.length === 0) {
      return NextResponse.json(
        { 
          success: true, 
          created: 0, 
          message: 'No co-applicants to process' 
        },
        { status: 200 }
      );
    }

    // Get the location ID from stored OAuth tokens
    const locationId = await getDefaultLocationId();
    
    if (!locationId) {
      return NextResponse.json(
        { 
          error: 'No GHL location ID available. Please complete GHL OAuth setup.' 
        },
        { status: 400 }
      );
    }

    console.log(`🔄 Creating ${formState.step2.co_applicants.length} co-applicant records for application ${applicationId}`);

    // Create co-applicant records
    const result = await createAllCoApplicantRecords(
      applicationId,
      formState,
      {
        locationId,
        contactId
      }
    );

    if (result.success) {
      console.log(`✅ Successfully created ${result.created} co-applicant records`);
      return NextResponse.json(
        {
          success: true,
          created: result.created,
          message: `Successfully created ${result.created} co-applicant record(s)`
        },
        { status: 200 }
      );
    } else {
      console.error('❌ Some co-applicant records failed to create:', result.errors);
      return NextResponse.json(
        {
          success: false,
          created: result.created,
          errors: result.errors,
          message: `Created ${result.created} records, but ${result.errors.length} failed`
        },
        { status: 207 } // Multi-status - partial success
      );
    }

  } catch (error) {
    console.error('❌ Co-applicant record creation API error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error creating co-applicant records',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}