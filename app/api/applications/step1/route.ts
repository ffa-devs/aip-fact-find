import { NextRequest, NextResponse } from 'next/server';
import { saveStep1DataNew } from '@/lib/services/supabase-service-new';
import type { FormState } from '@/lib/types/application';

// Save Step 1 data (creates applicant if doesn't exist)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { applicationId, step1Data } = body;

    if (!applicationId || !step1Data) {
      return NextResponse.json(
        { error: 'Application ID and step1Data are required' },
        { status: 400 }
      );
    }

    // Convert date_of_birth to Date object if it's a string
    const processedStep1Data: FormState['step1'] = {
      ...step1Data,
      date_of_birth: step1Data.date_of_birth 
        ? new Date(step1Data.date_of_birth) 
        : null
    };

    // Use the new Supabase service function
    const result = await saveStep1DataNew(applicationId, processedStep1Data);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to save Step 1 data' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Unexpected error in POST /api/applications/step1:', error);
    
    // Handle duplicate email error specifically
    if (error instanceof Error && error.message.includes('email address is already associated')) {
      return NextResponse.json(
        { error: error.message },
        { status: 409 } // Conflict status for duplicates
      );
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}