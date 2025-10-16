import { NextRequest, NextResponse } from 'next/server';
import { updateApplicationStep3 } from '@/lib/services/supabase-service';

export async function POST(request: NextRequest) {
  try {
    const { applicationId, ...step3Data } = await request.json();

    if (!applicationId) {
      return NextResponse.json(
        { error: 'Application ID is required' },
        { status: 400 }
      );
    }

    console.log('📝 Saving Step 3 data for application:', applicationId);
    console.log('Step 3 data:', step3Data);

    const result = await updateApplicationStep3(applicationId, step3Data);

    if (result.error) {
      console.error('❌ Error saving Step 3:', result.error);
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      );
    }

    console.log('✅ Step 3 saved successfully');
    return NextResponse.json({ 
      success: true, 
      message: 'Step 3 data saved successfully' 
    });

  } catch (error) {
    console.error('❌ API Error in step3:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}