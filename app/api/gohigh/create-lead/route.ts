/**
 * API Route: Create Lead in GHL
 * POST /api/gohigh/create-lead
 * 
 * Creates a new contact in GoHighLevel when Step 1 is completed
 */

import { NextResponse } from 'next/server';
import { createLeadInGHL } from '@/lib/ghl/service';
import { step1Schema } from '@/lib/validations/form-schemas';

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Validate the request body with step 1 schema
    const validatedData = step1Schema.parse(body);

    // Create contact and opportunity in GHL
    const result = await createLeadInGHL(validatedData);

    if (!result) {
      return NextResponse.json(
        { error: 'Failed to create contact in GHL' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      contactId: result.contactId,
      opportunityId: result.opportunityId,
      message: 'Lead created successfully in GHL',
    });
  } catch (error) {
    console.error('Create lead error:', error);
    
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
