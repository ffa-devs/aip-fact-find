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
        application_participants (
          *,
          people (
            *,
            person_children (*)
          ),
          employment_details (*),
          financial_commitments (*)
        )
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

    // Debug: Log the employment details
    console.log('🔍 Application data loaded:', {
      applicationId,
      participantsCount: data?.application_participants?.length || 0,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      participants: data?.application_participants?.map((p: any) => ({
        role: p.participant_role,
        hasEmploymentDetails: !!p.employment_details,
        employmentDetailsCount: Array.isArray(p.employment_details) ? p.employment_details.length : (p.employment_details ? 1 : 0),
        employmentDetails: p.employment_details
      })) || []
    });

    // Fetch rental properties separately for each participant
    if (data?.application_participants?.length > 0) {
      for (let i = 0; i < data.application_participants.length; i++) {
        const participant = data.application_participants[i];
        
        const { data: rentalProperties, error: rentalError } = await supabaseAdmin
          .from('rental_properties')
          .select('*')
          .eq('participant_id', participant.id);

        if (!rentalError && rentalProperties) {
          data.application_participants[i].rental_properties = rentalProperties;
        } else {
          data.application_participants[i].rental_properties = [];
        }
      }
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