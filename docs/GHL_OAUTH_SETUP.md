# GoHighLevel OAuth Setup Guide

## Overview

This application uses OAuth 2.0 to integrate with GoHighLevel (GHL), avoiding per-request API charges by using refresh tokens for long-term access.

## Architecture

```
User → /setup → /api/gohigh/authorize → GHL OAuth → /api/gohigh/callback → Supabase → Success
```

### Components

1. **OAuth Token Manager** (`/lib/ghl/oauth.ts`)
   - Manages access and refresh tokens
   - Auto-refreshes tokens before expiration (5-minute buffer)
   - Stores tokens in Supabase with encryption

2. **GHL Client** (`/lib/ghl/client.ts`)
   - Uses OAuth tokens instead of API keys
   - Automatically retrieves valid tokens before each API call
   - Handles token refresh failures gracefully

3. **OAuth Routes**
   - `/api/gohigh/authorize` - Initiates OAuth flow
   - `/api/gohigh/callback` - Handles OAuth response

4. **Setup Pages**
   - `/setup` - One-time setup UI
   - `/setup/success` - Success confirmation
   - `/setup/error` - Error handling

## Initial Setup

### 1. Create GHL OAuth App

1. Go to [GHL Marketplace](https://marketplace.leadconnectorhq.com/)
2. Navigate to "My Apps" → "Create App"
3. Fill in app details:
   - **App Name**: AIP Fact Find
   - **App Description**: Spanish property mortgage application form
   - **Scopes**: 
     - `contacts.write` (required)
     - `contacts.readonly` (required)
4. Set Redirect URI:
   - Development: `http://localhost:3000/api/gohigh/callback`
   - Production: `https://yourdomain.com/api/gohigh/callback`
5. Save and note down:
   - **Client ID**
   - **Client Secret**

### 2. Configure Environment Variables

Copy `.env.local.example` to `.env.local` and fill in:

```env
# GoHighLevel OAuth Configuration
GHL_CLIENT_ID=your_client_id_from_ghl
GHL_CLIENT_SECRET=your_client_secret_from_ghl
GHL_REDIRECT_URI=http://localhost:3000/api/gohigh/callback

# NextAuth Configuration (for state/CSRF protection)
NEXTAUTH_SECRET=generate_random_32_char_string
NEXTAUTH_URL=http://localhost:3000

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

**To get Supabase Service Role Key:**
1. Go to your Supabase project dashboard
2. Navigate to Settings → API
3. Copy the `service_role` key (keep this secret!)

**To generate NEXTAUTH_SECRET:**
```bash
openssl rand -base64 32
```

### 3. Run Supabase Migration

Apply the OAuth tokens migration:

```bash
# If using Supabase CLI
supabase migration up

# Or manually run the SQL in Supabase dashboard:
# /supabase/migrations/002_ghl_oauth_tokens.sql
```

This creates the `ghl_oauth_tokens` table with:
- `location_id` (unique) - GHL location identifier
- `access_token` - Current access token (encrypted)
- `refresh_token` - Refresh token for renewals
- `expires_at` - Token expiration timestamp
- Auto-refresh trigger and RLS policies

### 4. Complete OAuth Authorization

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Navigate to: `http://localhost:3000/setup`

3. Click "Connect to GoHighLevel"

4. You'll be redirected to GHL to:
   - Choose a location
   - Authorize contact access
   - Grant permissions

5. After authorization, you'll be redirected back to `/setup/success`

6. Tokens are now stored in Supabase and will auto-refresh!

## How It Works

### Token Flow

```
1. User visits /setup
2. Clicks "Connect to GoHighLevel"
3. GET /api/gohigh/authorize
   └─> Redirects to GHL OAuth consent screen
4. User authorizes in GHL
5. GHL redirects to /api/gohigh/callback?code=...
6. Callback exchanges code for tokens:
   {
     access_token: "...",
     refresh_token: "...",
     expires_in: 86400,
     locationId: "..."
   }
7. Tokens saved to Supabase
8. Redirect to /setup/success
```

### Token Refresh

The `getValidAccessToken()` function automatically:

1. Retrieves token from Supabase
2. Checks expiration with 5-minute buffer
3. If expired or expiring soon:
   - Calls GHL refresh endpoint
   - Gets new access token
   - Updates Supabase
4. Returns valid access token

### API Call Flow

```typescript
// In any GHL API method:
async createContact(data: GHLContact) {
  // 1. Get valid token (auto-refreshes if needed)
  const headers = await this.getAuthHeaders();
  
  // 2. Make API call with fresh token
  const response = await fetch(GHL_API_BASE + '/contacts', {
    method: 'POST',
    headers, // Includes: Authorization: Bearer <fresh_token>
    body: JSON.stringify(data)
  });
  
  // 3. Handle response
  return response.json();
}
```

## Security

### Token Storage

- Tokens stored in Supabase with Row Level Security (RLS)
- Service role key used for server-side access only
- Never exposed to client-side code

### Environment Variables

- All OAuth credentials server-side only
- Never bundled in client JavaScript
- Use `NEXT_PUBLIC_` prefix only for non-sensitive values

### CSRF Protection

- State parameter generated in `/api/gohigh/authorize`
- Can be validated in callback (currently simplified)

## Troubleshooting

### "No GHL location ID available"

**Cause**: No tokens in Supabase
**Solution**: Complete OAuth setup at `/setup`

### "Token refresh failed"

**Cause**: Refresh token expired or invalid
**Solution**: Re-authorize at `/setup` (tokens last ~30 days)

### "Failed to exchange authorization code"

**Cause**: Invalid client credentials or redirect URI mismatch
**Solution**: 
1. Check `GHL_CLIENT_ID` and `GHL_CLIENT_SECRET`
2. Verify redirect URI matches exactly in GHL app settings

### Tokens not refreshing automatically

**Cause**: Missing `SUPABASE_SERVICE_ROLE_KEY`
**Solution**: Add service role key to `.env.local`

## Production Deployment

### 1. Update GHL App Settings

Add production redirect URI:
```
https://yourdomain.com/api/gohigh/callback
```

### 2. Set Environment Variables

In your hosting platform (Vercel, Netlify, etc.):
- `GHL_CLIENT_ID`
- `GHL_CLIENT_SECRET`
- `GHL_REDIRECT_URI` (production URL)
- `NEXTAUTH_SECRET`
- `NEXTAUTH_URL` (production URL)
- `SUPABASE_SERVICE_ROLE_KEY`

### 3. Run Production OAuth

1. Deploy application
2. Navigate to `https://yourdomain.com/setup`
3. Complete OAuth authorization
4. Tokens stored in production Supabase

### 4. Monitor Token Health

Check Supabase `ghl_oauth_tokens` table:
```sql
SELECT 
  location_id,
  expires_at,
  CASE 
    WHEN expires_at < NOW() THEN 'EXPIRED'
    WHEN expires_at < NOW() + INTERVAL '5 minutes' THEN 'EXPIRING SOON'
    ELSE 'VALID'
  END as status,
  updated_at
FROM ghl_oauth_tokens;
```

## API Reference

### OAuth Token Manager

```typescript
// Get valid access token (auto-refreshes)
const token = await getValidAccessToken(locationId);

// Manually refresh tokens
await refreshAccessToken(locationId, refreshToken);

// Save new tokens
await saveTokens(locationId, accessToken, refreshToken, expiresIn);

// Get default location ID
const locationId = await getDefaultLocationId();
```

### GHL Client

```typescript
// Create contact (OAuth auto-handled)
const result = await ghlClient.createContact({
  firstName: 'John',
  lastName: 'Doe',
  email: 'john@example.com',
  phone: '+34600123456'
});

// Update contact
await ghlClient.updateContact(contactId, {
  tags: ['AIP-Step2-Completed'],
  customFields: { employment_type: 'Employed' }
});

// Add tags
await ghlClient.addTags(contactId, ['High-Priority']);

// Remove tags
await ghlClient.removeTags(contactId, ['Lead']);
```

## Testing

### Manual Testing

1. Complete OAuth setup in dev environment
2. Submit Step 1 of AIP form
3. Check Supabase `ghl_oauth_tokens` for token entry
4. Check GHL for new contact creation
5. Complete Step 2 to verify updates work

### Token Expiration Testing

```typescript
// Force token expiration in Supabase
UPDATE ghl_oauth_tokens 
SET expires_at = NOW() - INTERVAL '1 hour'
WHERE location_id = 'your_location_id';

// Next API call should auto-refresh
```

### Error Testing

- Invalid client credentials → Setup error page
- Denied authorization → OAuth error page
- Network failures → Graceful fallback

## Maintenance

### Token Rotation

Tokens auto-refresh, but if issues arise:

1. Visit `/setup` to re-authorize
2. Old tokens overwritten with new ones
3. No data loss - location ID remains same

### Monitoring

Check application logs for:
- `✅ OAuth tokens saved for location: xxx`
- `🔄 Refreshing GHL access token for location: xxx`
- `❌ Failed to refresh access token` (requires re-auth)

## Cost Comparison

### Before (API Key Approach)
- ❌ $X per 1,000 API calls
- ❌ Charges accumulate with usage
- ❌ No long-term solution

### After (OAuth App Approach)
- ✅ Free API access
- ✅ One-time authorization
- ✅ Auto-refresh indefinitely
- ✅ No per-request charges

## Next Steps

1. ✅ Complete OAuth setup
2. ⏳ Test contact creation flow
3. ⏳ Implement remaining form steps (3-6)
4. ⏳ Add Supabase CRUD operations
5. ⏳ Deploy to production
