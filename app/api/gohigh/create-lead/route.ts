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
    console.log('GHL API received body:', body);
    console.log('date_of_birth type:', typeof body.date_of_birth);

    // Transform date_of_birth string to Date object if needed
    if (body.date_of_birth) {
      if (typeof body.date_of_birth === 'string') {
        const dateValue = new Date(body.date_of_birth);
        if (isNaN(dateValue.getTime())) {
          console.error('Invalid date string:', body.date_of_birth);
          return NextResponse.json(
            { error: 'Invalid date format for date_of_birth' },
            { status: 400 }
          );
        }
        body.date_of_birth = dateValue;
        console.log('Transformed date_of_birth to:', body.date_of_birth);
      } else if (!(body.date_of_birth instanceof Date)) {
        console.error('date_of_birth is not a string or Date:', body.date_of_birth);
        return NextResponse.json(
          { error: 'date_of_birth must be a valid date' },
          { status: 400 }
        );
      }
    } else {
      console.error('date_of_birth is missing or null');
      return NextResponse.json(
        { error: 'date_of_birth is required' },
        { status: 400 }
      );
    }

    // Validate the request body with step 1 schema
    const validatedData = step1Schema.parse(body);

    // Create contact and opportunity in GHL (or get existing contact)
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
      isExisting: result.isExisting,
      existingData: result.existingData || null,
      message: result.isExisting 
        ? 'Existing contact found and updated' 
        : 'Lead created successfully in GHL',
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
