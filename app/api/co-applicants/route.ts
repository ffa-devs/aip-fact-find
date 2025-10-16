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

// POST /api/co-applicants - Create a new co-applicant
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { application_id, ...coApplicantData } = body;

    if (!application_id) {
      return NextResponse.json(
        { error: 'Application ID is required' },
        { status: 400 }
      );
    }

    // Validate the co-applicant data
    const validationResult = coApplicantSchema.safeParse(coApplicantData);
    
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid co-applicant data', details: validationResult.error.issues },
        { status: 400 }
      );
    }

    const validatedData = validationResult.data;

    // Convert Date objects to ISO strings for database storage
    const dbData = {
      application_id,
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
    };

    // Insert the co-applicant
    const { data, error } = await supabaseAdmin
      .from('co_applicants')
      .insert(dbData)
      .select()
      .single();

    if (error) {
      console.error('Database error creating co-applicant:', error);
      return NextResponse.json(
        { error: 'Failed to create co-applicant' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { success: true, co_applicant: data },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating co-applicant:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET /api/co-applicants?application_id=xxx - Get all co-applicants for an application
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const application_id = searchParams.get('application_id');

    if (!application_id) {
      return NextResponse.json(
        { error: 'Application ID is required' },
        { status: 400 }
      );
    }

    // Fetch co-applicants for the application
    const { data, error } = await supabaseAdmin
      .from('co_applicants')
      .select('*')
      .eq('application_id', application_id)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Database error fetching co-applicants:', error);
      return NextResponse.json(
        { error: 'Failed to fetch co-applicants' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { success: true, co_applicants: data || [] },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching co-applicants:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}