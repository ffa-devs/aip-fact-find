/**
 * GHL OAuth Callback Handler
 * 
 * Handles the OAuth authorization response from GoHighLevel,
 * exchanges the authorization code for access and refresh tokens,
 * and stores them in Supabase for long-term use.
 */

import { NextRequest, NextResponse } from 'next/server';
import { saveTokens } from '@/lib/ghl/oauth';

const GHL_TOKEN_URL = 'https://services.leadconnectorhq.com/oauth/token';

interface GHLTokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
  scope: string;
  userType: string;
  locationId: string;
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const error = searchParams.get('error');
  const errorDescription = searchParams.get('error_description');

  // Handle OAuth errors
  if (error) {
    console.error('OAuth Error:', error, errorDescription);
    return NextResponse.redirect(
      new URL(`/setup/error?message=${encodeURIComponent(errorDescription || error)}`, request.url)
    );
  }

  // Validate authorization code
  if (!code) {
    return NextResponse.redirect(
      new URL('/setup/error?message=No authorization code received', request.url)
    );
  }

  try {
    // Exchange authorization code for tokens
    const tokenResponse = await fetch(GHL_TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: process.env.GHL_CLIENT_ID!,
        client_secret: process.env.GHL_CLIENT_SECRET!,
        grant_type: 'authorization_code',
        code,
        redirect_uri: process.env.GHL_REDIRECT_URI!,
      }),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error('Token Exchange Error:', errorText);
      throw new Error(`Token exchange failed: ${tokenResponse.status}`);
    }

    const tokens: GHLTokenResponse = await tokenResponse.json();

    // Extract location ID from response
    const locationId = tokens.locationId;

    if (!locationId) {
      throw new Error('No location ID in token response');
    }

    // Save tokens to Supabase
    await saveTokens(
      locationId,
      tokens.access_token,
      tokens.refresh_token,
      tokens.expires_in
    );

    console.log('✅ OAuth tokens saved for location:', locationId);

    // Redirect to success page
    return NextResponse.redirect(
      new URL(`/setup/success?locationId=${locationId}`, request.url)
    );
  } catch (error) {
    console.error('OAuth Callback Error:', error);
    return NextResponse.redirect(
      new URL(
        `/setup/error?message=${encodeURIComponent(
          error instanceof Error ? error.message : 'Failed to complete OAuth flow'
        )}`,
        request.url
      )
    );
  }
}
