/**
 * GHL OAuth Authorization Initiator
 * 
 * Redirects the user to GoHighLevel's OAuth consent screen
 * to authorize the application to access their account.
 */

import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const installUrl = process.env.GHL_INSTALL_URL;

    if (!installUrl) {
      throw new Error('GHL_INSTALL_URL not configured');
    }

    console.log('🔐 Initiating OAuth flow...');

    // Redirect to GHL OAuth consent screen using pre-built install URL
    return NextResponse.redirect(installUrl);
  } catch (error) {
    console.error('OAuth Authorization Error:', error);
    return NextResponse.json(
      { error: 'Failed to initiate OAuth flow' },
      { status: 500 }
    );
  }
}
