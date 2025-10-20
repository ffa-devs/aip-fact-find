import { NextRequest, NextResponse } from 'next/server';
import { saveStep2DataNew } from '@/lib/services/supabase-service';
import type { FormState } from '@/lib/types/application';

// Save Step 2 data using new normalized schema
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { applicationId, step2Data } = body;

    if (!applicationId || !step2Data) {
      return NextResponse.json(
        { error: 'Application ID and step2Data are required' },
        { status: 400 }
      );
    }

    // Convert date fields in co_applicants to Date objects if they're strings
    const processedStep2Data: FormState['step2'] = {
      ...step2Data,
      co_applicants: step2Data.co_applicants?.map((coApp: Record<string, unknown>) => ({
        ...coApp,
        date_of_birth: coApp.date_of_birth ? new Date(coApp.date_of_birth as string | number | Date) : null
      })) || []
    };

    // Use the new service function
    const result = await saveStep2DataNew(applicationId, processedStep2Data);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to save Step 2 data' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Unexpected error in POST /api/applications/step2:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}