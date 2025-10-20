import { NextRequest, NextResponse } from 'next/server';
import { saveStep3DataForParticipant } from '@/lib/services/supabase-service';

export async function POST(request: NextRequest) {
  try {
    const { applicationId, applicantIndex, ...step3Data } = await request.json();

    if (!applicationId || typeof applicantIndex !== 'number') {
      return NextResponse.json(
        { error: 'Application ID and applicant index are required' },
        { status: 400 }
      );
    }

    console.log(`📝 Saving Step 3 data for applicant ${applicantIndex + 1} in application:`, applicationId);

    // applicantIndex is 0-based, but participant_order is 1-based (1 = primary, 2+ = co-applicants)
    const participantOrder = applicantIndex + 1;
    const result = await saveStep3DataForParticipant(applicationId, participantOrder, step3Data);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to save applicant Step 3 data' },
        { status: 500 }
      );
    }

    console.log(`✅ Step 3 saved successfully for applicant ${applicantIndex + 1}`);
    return NextResponse.json({ 
      success: true, 
      message: `Step 3 data saved successfully for applicant ${applicantIndex + 1}` 
    });

  } catch (error) {
    console.error('❌ API Error in applicant step3:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}