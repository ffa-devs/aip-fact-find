/**
 * API Route: Update GHL Contact
 * PUT /api/gohigh/update-contact
 * 
 * Updates an existing contact in GoHighLevel when steps are completed
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  updateStep2InGHL,
  updateStep3InGHL,
  updateStep4InGHL,
  updateStep5InGHL,
  completeApplicationInGHL,
} from '@/lib/ghl/service';

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { contactId, opportunityId, step, data } = body;

    if (!contactId) {
      return NextResponse.json(
        { error: 'Contact ID is required' },
        { status: 400 }
      );
    }

    if (!step || !data) {
      return NextResponse.json(
        { error: 'Step and data are required' },
        { status: 400 }
      );
    }

    // Route to appropriate update function based on step
    switch (step) {
      case 2:
        await updateStep2InGHL(contactId, data);
        break;
      case 3:
        await updateStep3InGHL(contactId, data);
        break;
      case 4:
        await updateStep4InGHL(contactId, data);
        break;
      case 5:
        await updateStep5InGHL(contactId, data);
        break;
      case 6:
        await completeApplicationInGHL(contactId, opportunityId || '', data);
        break;
      default:
        return NextResponse.json(
          { error: 'Invalid step number' },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      message: `Contact updated for Step ${step}`,
    });
  } catch (error) {
    console.error('Update contact error:', error);
    
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
