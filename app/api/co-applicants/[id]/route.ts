import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { coApplicantSchema } from '@/lib/validations/form-schemas';

// Create Supabase admin client
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

// PUT /api/co-applicants/[id] - Update a co-applicant
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const body = await request.json();
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: 'Co-applicant ID is required' },
        { status: 400 }
      );
    }

    // Validate the co-applicant data
    const validationResult = coApplicantSchema.safeParse(body);
    
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid co-applicant data', details: validationResult.error.issues },
        { status: 400 }
      );
    }

    const validatedData = validationResult.data;

    // Convert Date objects to ISO strings for database storage
    const dbData = {
      first_name: validatedData.first_name,
      last_name: validatedData.last_name,
      date_of_birth: validatedData.date_of_birth.toISOString().split('T')[0], // YYYY-MM-DD
      age: new Date().getFullYear() - validatedData.date_of_birth.getFullYear(),
      email: validatedData.email,
      mobile: validatedData.mobile,
      telephone: validatedData.telephone || null,
      nationality: validatedData.nationality,
      relationship_to_main_applicant: validatedData.relationship_to_main_applicant,
      same_address_as_main: validatedData.same_address_as_main,
      current_address: validatedData.current_address || null,
      time_at_current_address_years: validatedData.time_at_current_address_years || null,
      time_at_current_address_months: validatedData.time_at_current_address_months || null,
      employment_status: validatedData.employment_status,
      annual_income: validatedData.annual_income || null,
      personal_loans: validatedData.personal_loans,
      credit_card_debt: validatedData.credit_card_debt,
      car_loans_lease: validatedData.car_loans_lease,
      total_monthly_commitments: (validatedData.personal_loans + validatedData.credit_card_debt + validatedData.car_loans_lease),
      has_credit_or_legal_issues: validatedData.has_credit_or_legal_issues,
      credit_legal_issues_details: validatedData.credit_legal_issues_details || null,
      updated_at: new Date().toISOString(),
    };

    // Update the co-applicant
    const { data, error } = await supabaseAdmin
      .from('co_applicants')
      .update(dbData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Database error updating co-applicant:', error);
      return NextResponse.json(
        { error: 'Failed to update co-applicant' },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json(
        { error: 'Co-applicant not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: true, co_applicant: data },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error updating co-applicant:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/co-applicants/[id] - Delete a co-applicant
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: 'Co-applicant ID is required' },
        { status: 400 }
      );
    }

    // Delete the co-applicant
    const { error } = await supabaseAdmin
      .from('co_applicants')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Database error deleting co-applicant:', error);
      return NextResponse.json(
        { error: 'Failed to delete co-applicant' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { success: true, message: 'Co-applicant deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting co-applicant:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}