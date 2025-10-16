import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';

// Create new application
export async function POST() {
  try {
    const { data, error } = await supabaseAdmin
      .from('applications')
      .insert({
        status: 'draft',
        current_step: 1,
        progress_percentage: 0,
      })
      .select('*')
      .single();

    if (error) {
      console.error('Supabase error creating application:', error);
      return NextResponse.json(
        { error: 'Failed to create application', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Unexpected error in POST /api/applications:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Get application by ID
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const applicationId = searchParams.get('id');

    if (!applicationId) {
      return NextResponse.json(
        { error: 'Application ID is required' },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from('applications')
      .select(`
        *,
        applicants (
          *,
          applicant_children (*),
          employment_details (*),
          financial_commitments (*)
        ),
        rental_properties (*),
        additional_assets (*),
        form_progress (*)
      `)
      .eq('id', applicationId)
      .single();

    if (error) {
      console.error('Error loading application:', error);
      return NextResponse.json(
        { error: 'Failed to load application', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Unexpected error in GET /api/applications:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Update application
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { applicationId, updates } = body;

    if (!applicationId) {
      return NextResponse.json(
        { error: 'Application ID is required' },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from('applications')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', applicationId)
      .select()
      .single();

    if (error) {
      console.error('Error updating application:', error);
      return NextResponse.json(
        { error: 'Failed to update application', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Unexpected error in PATCH /api/applications:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}