import { NextRequest, NextResponse } from 'next/server';
import { completeApplicationInGHL } from '@/lib/ghl/service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { contactId, opportunityId, applicationData } = body;

    if (!contactId || !opportunityId || !applicationData) {
      return NextResponse.json(
        { error: 'Missing required fields: contactId, opportunityId, applicationData' },
        { status: 400 }
      );
    }

    // Validate applicationData has required fields
    const requiredFields = ['purchase_price', 'deposit_available', 'property_type', 'home_status', 'urgency_level'];
    const missingFields = requiredFields.filter(field => !applicationData[field]);
    
    if (missingFields.length > 0) {
      return NextResponse.json(
        { error: `Missing required application data fields: ${missingFields.join(', ')}` },
        { status: 400 }
      );
    }

    // Update GHL opportunity
    await completeApplicationInGHL(contactId, opportunityId, {
      purchase_price: applicationData.purchase_price,
      deposit_available: applicationData.deposit_available,
      property_type: applicationData.property_type,
      home_status: applicationData.home_status,
      urgency_level: applicationData.urgency_level,
    });

    return NextResponse.json({ 
      success: true,
      message: 'Opportunity updated successfully'
    });
    
  } catch (error) {
    console.error('GHL Update Opportunity Error:', error);
    return NextResponse.json(
      { error: 'Failed to update opportunity in GHL' },
      { status: 500 }
    );
  }
}