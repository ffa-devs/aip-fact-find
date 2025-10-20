import { NextRequest, NextResponse } from 'next/server';
import { saveStep6DataNew } from '@/lib/services/supabase-service';

export async function POST(request: NextRequest) {
  try {
    const { applicationId, ...step6Data } = await request.json();

    if (!applicationId) {
      return NextResponse.json(
        { error: 'Application ID is required' },
        { status: 400 }
      );
    }

    console.log('📝 Saving Step 6 data for application:', applicationId);
    console.log('Step 6 data:', step6Data);

    const result = await saveStep6DataNew(applicationId, step6Data);

    if (result.error) {
      console.error('❌ Error saving Step 6:', result.error);
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      );
    }

    console.log('✅ Step 6 saved successfully');
    return NextResponse.json({ 
      success: true, 
      message: 'Step 6 data saved successfully' 
    });

  } catch (error) {
    console.error('❌ API Error in step6:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}