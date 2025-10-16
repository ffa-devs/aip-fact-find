-- Migration 010: Add RLS Policies for New Normalized Tables
-- This migration adds Row Level Security policies to the new normalized schema

-- =====================================================
-- 1. ENABLE RLS ON NEW TABLES
-- =====================================================

-- Enable RLS on people table
ALTER TABLE people ENABLE ROW LEVEL SECURITY;

-- Enable RLS on application_participants table  
ALTER TABLE application_participants ENABLE ROW LEVEL SECURITY;

-- Enable RLS on verification_codes table
ALTER TABLE verification_codes ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 2. CREATE RLS POLICIES
-- =====================================================

-- People table policies
CREATE POLICY "Service role full access on people"
ON people FOR ALL TO service_role
USING (true) WITH CHECK (true);

-- Application participants table policies  
CREATE POLICY "Service role full access on application_participants"
ON application_participants FOR ALL TO service_role
USING (true) WITH CHECK (true);

-- Verification codes table policies
CREATE POLICY "Service role full access on verification_codes"
ON verification_codes FOR ALL TO service_role
USING (true) WITH CHECK (true);

-- =====================================================
-- 3. ADDITIONAL SECURITY CONSIDERATIONS
-- =====================================================

-- Create indexes for better performance on common queries
CREATE INDEX IF NOT EXISTS idx_people_email ON people(email);
CREATE INDEX IF NOT EXISTS idx_application_participants_person_id ON application_participants(person_id);
CREATE INDEX IF NOT EXISTS idx_application_participants_application_id ON application_participants(application_id);
CREATE INDEX IF NOT EXISTS idx_verification_codes_email ON verification_codes(email);
CREATE INDEX IF NOT EXISTS idx_verification_codes_code ON verification_codes(code);
CREATE INDEX IF NOT EXISTS idx_verification_codes_expires_at ON verification_codes(expires_at);

-- Add comments for documentation
COMMENT ON TABLE people IS 'Normalized person data - one record per unique individual';
COMMENT ON TABLE application_participants IS 'Junction table linking people to applications with role-specific data';
COMMENT ON TABLE verification_codes IS 'Temporary codes for email verification and application retrieval';

-- =====================================================
-- 4. GRANT NECESSARY PERMISSIONS
-- =====================================================

-- Ensure service role has all necessary permissions
GRANT ALL ON people TO service_role;
GRANT ALL ON application_participants TO service_role;  
GRANT ALL ON verification_codes TO service_role;

-- Grant usage on sequences
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO service_role;