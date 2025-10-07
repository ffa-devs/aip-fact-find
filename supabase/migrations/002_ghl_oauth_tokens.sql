-- GHL OAuth Tokens Table
-- Stores access tokens and refresh tokens from GHL OAuth flow

CREATE TABLE ghl_oauth_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id TEXT NOT NULL UNIQUE,
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  token_type TEXT DEFAULT 'Bearer',
  scope TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster lookups
CREATE INDEX idx_ghl_oauth_location_id ON ghl_oauth_tokens(location_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_ghl_oauth_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
CREATE TRIGGER ghl_oauth_tokens_updated_at
  BEFORE UPDATE ON ghl_oauth_tokens
  FOR EACH ROW
  EXECUTE FUNCTION update_ghl_oauth_updated_at();

-- Enable Row Level Security
ALTER TABLE ghl_oauth_tokens ENABLE ROW LEVEL SECURITY;

-- Policy: Service role can do everything (for server-side operations)
CREATE POLICY "Service role can manage tokens"
  ON ghl_oauth_tokens
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Comments
COMMENT ON TABLE ghl_oauth_tokens IS 'Stores GoHighLevel OAuth tokens for API access';
COMMENT ON COLUMN ghl_oauth_tokens.location_id IS 'GHL Location/Sub-account ID';
COMMENT ON COLUMN ghl_oauth_tokens.access_token IS 'Short-lived access token (1 day)';
COMMENT ON COLUMN ghl_oauth_tokens.refresh_token IS 'Long-lived refresh token (used to get new access tokens)';
COMMENT ON COLUMN ghl_oauth_tokens.expires_at IS 'When the access token expires';
