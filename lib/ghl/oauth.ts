/**
 * GoHighLevel OAuth Token Manager
 * 
 * Handles OAuth token storage, retrieval, and refresh using Supabase
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // Use service role for server-side
);

export interface GHLTokens {
  access_token: string;
  refresh_token: string;
  expires_at: string;
  location_id: string;
}

/**
 * Get valid access token (refreshes if expired)
 */
export async function getValidAccessToken(locationId: string): Promise<string | null> {
  try {
    // Get tokens from Supabase
    const { data, error } = await supabase
      .from('ghl_oauth_tokens')
      .select('*')
      .eq('location_id', locationId)
      .single();

    if (error || !data) {
      console.error('No tokens found for location:', locationId);
      return null;
    }

    // Check if token is expired (with 5-minute buffer)
    const expiresAt = new Date(data.expires_at);
    const now = new Date();
    const bufferMs = 5 * 60 * 1000; // 5 minutes

    if (expiresAt.getTime() - now.getTime() < bufferMs) {
      console.log('Token expired, refreshing...');
      return await refreshAccessToken(locationId, data.refresh_token);
    }

    return data.access_token;
  } catch (error) {
    console.error('Error getting access token:', error);
    return null;
  }
}

/**
 * Refresh access token using refresh token
 */
export async function refreshAccessToken(
  locationId: string,
  refreshToken: string
): Promise<string | null> {
  try {
    const response = await fetch('https://services.leadconnectorhq.com/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: process.env.GHL_CLIENT_ID!,
        client_secret: process.env.GHL_CLIENT_SECRET!,
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
      }),
    });

    if (!response.ok) {
      console.error('Failed to refresh token:', await response.text());
      return null;
    }

    const tokens = await response.json();

    // Calculate expiration time (GHL tokens expire in 1 day)
    const expiresAt = new Date();
    expiresAt.setSeconds(expiresAt.getSeconds() + (tokens.expires_in || 86400));

    // Update tokens in Supabase
    const { error } = await supabase
      .from('ghl_oauth_tokens')
      .update({
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token || refreshToken, // Use new refresh token if provided
        expires_at: expiresAt.toISOString(),
      })
      .eq('location_id', locationId);

    if (error) {
      console.error('Failed to update tokens:', error);
      return null;
    }

    console.log('✅ Token refreshed successfully');
    return tokens.access_token;
  } catch (error) {
    console.error('Error refreshing token:', error);
    return null;
  }
}

/**
 * Save OAuth tokens from initial authorization
 */
export async function saveTokens(
  locationId: string,
  accessToken: string,
  refreshToken: string,
  expiresIn: number
): Promise<boolean> {
  try {
    const expiresAt = new Date();
    expiresAt.setSeconds(expiresAt.getSeconds() + expiresIn);

    const { error } = await supabase
      .from('ghl_oauth_tokens')
      .upsert({
        location_id: locationId,
        access_token: accessToken,
        refresh_token: refreshToken,
        expires_at: expiresAt.toISOString(),
      });

    if (error) {
      console.error('Failed to save tokens:', error);
      return false;
    }

    console.log('✅ Tokens saved successfully');
    return true;
  } catch (error) {
    console.error('Error saving tokens:', error);
    return false;
  }
}

/**
 * Get location ID from stored tokens (first available)
 */
export async function getDefaultLocationId(): Promise<string | null> {
  try {
    const { data, error } = await supabase
      .from('ghl_oauth_tokens')
      .select('location_id')
      .limit(1)
      .single();

    if (error || !data) {
      return null;
    }

    return data.location_id;
  } catch (error) {
    console.error('Error getting location ID:', error);
    return null;
  }
}
