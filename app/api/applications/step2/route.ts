import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';

// Save Step 2 data (creates/updates co-applicants)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { applicationId, step2Data } = body;

    if (!applicationId || !step2Data) {
      return NextResponse.json(
        { error: 'Application ID and step2Data are required' },
        { status: 400 }
      );
    }

    // Update primary applicant with Step 2 data
    const { data: primaryApplicant, error: primaryError } = await supabaseAdmin
      .from('applicants')
      .update({
        nationality: step2Data.nationality,
        marital_status: step2Data.marital_status,
        telephone: step2Data.telephone,
      })
      .eq('application_id', applicationId)
      .eq('applicant_order', 1)
      .select()
      .single();

    if (primaryError) {
      console.error('Error updating primary applicant:', primaryError);
      return NextResponse.json(
        { error: 'Failed to update primary applicant', details: primaryError.message },
        { status: 500 }
      );
    }

    // Handle co-applicants
    if (step2Data.has_co_applicants && step2Data.co_applicants?.length > 0) {
      // Delete existing co-applicants
      await supabaseAdmin
        .from('applicants')
        .delete()
        .eq('application_id', applicationId)
        .gt('applicant_order', 1);

      // Insert new co-applicants
      const coApplicantsData = step2Data.co_applicants.map((coApp: Record<string, unknown>, index: number) => ({
        application_id: applicationId,
        applicant_order: index + 2,
        first_name: coApp.first_name,
        last_name: coApp.last_name,
        date_of_birth: (coApp.date_of_birth as Date)?.toISOString?.() || coApp.date_of_birth,
        email: coApp.email,
        mobile: coApp.mobile,
        nationality: coApp.nationality,
        marital_status: coApp.marital_status,
      }));

      const { error: coAppError } = await supabaseAdmin
        .from('applicants')
        .insert(coApplicantsData);

      if (coAppError) {
        console.error('Error creating co-applicants:', coAppError);
        return NextResponse.json(
          { error: 'Failed to create co-applicants', details: coAppError.message },
          { status: 500 }
        );
      }
    } else {
      // Remove all co-applicants if has_co_applicants is false
      await supabaseAdmin
        .from('applicants')
        .delete()
        .eq('application_id', applicationId)
        .gt('applicant_order', 1);
    }

    return NextResponse.json({ success: true, primaryApplicant });
  } catch (error) {
    console.error('Unexpected error in POST /api/applications/step2:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}