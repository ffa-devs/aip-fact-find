import { NextRequest, NextResponse } from 'next/server';
import { saveStep5DataNew } from '@/lib/services/supabase-service';

export async function POST(request: NextRequest) {
  try {
    const { applicationId, ...step5Data } = await request.json();

    if (!applicationId) {
      return NextResponse.json(
        { error: 'Application ID is required' },
        { status: 400 }
      );
    }

    console.log('📝 Saving Step 5 data for application:', applicationId);

    const result = await saveStep5DataNew(applicationId, step5Data);

    if (result.error) {
      console.error('❌ Error saving Step 5:', result.error);
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      );
    }

    console.log('✅ Step 5 saved successfully');
    return NextResponse.json({ 
      success: true, 
      message: 'Step 5 data saved successfully' 
    });

  } catch (error) {
    console.error('❌ API Error in step5:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}