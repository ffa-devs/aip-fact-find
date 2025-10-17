import { NextRequest, NextResponse } from 'next/server';
import { saveStep4DataNew } from '@/lib/services/supabase-service-new';

export async function POST(request: NextRequest) {
  try {
    const { applicationId, ...step4Data } = await request.json();

    if (!applicationId) {
      return NextResponse.json(
        { error: 'Application ID is required' },
        { status: 400 }
      );
    }

    console.log('📝 Saving Step 4 data for application:', applicationId);
    console.log('Step 4 data:', step4Data);

    const result = await saveStep4DataNew(applicationId, step4Data);

    if (result.error) {
      console.error('❌ Error saving Step 4:', result.error);
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      );
    }

    console.log('✅ Step 4 saved successfully');
    return NextResponse.json({ 
      success: true, 
      message: 'Step 4 data saved successfully' 
    });

  } catch (error) {
    console.error('❌ API Error in step4:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}