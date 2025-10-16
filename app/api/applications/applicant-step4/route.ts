import { NextRequest, NextResponse } from 'next/server';
import { saveStep4Data } from '@/lib/services/supabase-service';

export async function POST(request: NextRequest) {
  try {
    const { applicationId, applicantIndex, ...step4Data } = await request.json();

    if (!applicationId || typeof applicantIndex !== 'number') {
      return NextResponse.json(
        { error: 'Application ID and applicant index are required' },
        { status: 400 }
      );
    }

    console.log(`📝 Saving Step 4 data for applicant ${applicantIndex + 1} in application:`, applicationId);

    // applicantIndex is 0-based, but applicant_order is 1-based (1 = primary, 2+ = co-applicants)
    const applicantOrder = applicantIndex + 1;
    const result = await saveStep4Data(applicationId, applicantOrder, step4Data);

    if (!result) {
      return NextResponse.json(
        { error: 'Failed to save applicant Step 4 data' },
        { status: 500 }
      );
    }

    console.log(`✅ Step 4 saved successfully for applicant ${applicantIndex + 1}`);
    return NextResponse.json({ 
      success: true, 
      message: `Step 4 data saved successfully for applicant ${applicantIndex + 1}` 
    });

  } catch (error) {
    console.error('❌ API Error in applicant step4:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}