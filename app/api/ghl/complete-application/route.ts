import { NextRequest, NextResponse } from 'next/server';
import { completeApplicationInGHL } from '@/lib/ghl/service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      contactId, 
      opportunityId, 
      completionData 
    } = body;

    if (!contactId || !opportunityId) {
      return NextResponse.json(
        { error: 'Contact ID and Opportunity ID are required' },
        { status: 400 }
      );
    }

    await completeApplicationInGHL(contactId, opportunityId, completionData);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error completing application in GHL:', error);
    return NextResponse.json(
      { error: 'Failed to complete application in GHL' },
      { status: 500 }
    );
  }
}