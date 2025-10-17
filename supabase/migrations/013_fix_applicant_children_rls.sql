-- Migration 013: Restructure children to be tied to people, not participants
-- Children are part of a person's core identity and shouldn't change between applications

-- =====================================================
-- 1. RENAME TABLE AND RESTRUCTURE
-- =====================================================

-- Rename applicant_children to person_children (better naming)
DO $$
BEGIN
  -- Check if we need to rename the table
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'applicant_children')
     AND NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'person_children') THEN
    
    -- Drop any existing constraints first
    ALTER TABLE applicant_children DROP CONSTRAINT IF EXISTS applicant_children_applicant_id_fkey;
    ALTER TABLE applicant_children DROP CONSTRAINT IF EXISTS fk_children_participant_id;
    
    -- Rename the table
    ALTER TABLE applicant_children RENAME TO person_children;
    RAISE NOTICE 'Renamed applicant_children to person_children';
    
    -- Remove old columns if they exist
    ALTER TABLE person_children DROP COLUMN IF EXISTS applicant_id;
    ALTER TABLE person_children DROP COLUMN IF EXISTS participant_id;
    
    -- Add person_id column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'person_children' AND column_name = 'person_id') THEN
      ALTER TABLE person_children ADD COLUMN person_id UUID NOT NULL;
    END IF;
    
    -- Add date_of_birth column for proper child tracking
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'person_children' AND column_name = 'date_of_birth') THEN
      ALTER TABLE person_children ADD COLUMN date_of_birth DATE;
    END IF;
    
    -- Add foreign key constraint
    ALTER TABLE person_children 
    ADD CONSTRAINT fk_person_children_person_id 
    FOREIGN KEY (person_id) REFERENCES people(id) ON DELETE CASCADE;
    
    RAISE NOTICE 'Restructured person_children table with person_id foreign key';
  END IF;
END $$;

-- =====================================================
-- 2. CREATE NEW PERSON_CHILDREN TABLE IF NEEDED
-- =====================================================

-- Create person_children table if it doesn't exist at all
CREATE TABLE IF NOT EXISTS person_children (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  person_id UUID NOT NULL REFERENCES people(id) ON DELETE CASCADE,
  
  -- Child details
  date_of_birth DATE,
  age INTEGER, -- Can be calculated from date_of_birth but kept for compatibility
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 3. ADD INDEXES AND RLS POLICIES
-- =====================================================

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_person_children_person_id ON person_children(person_id);
CREATE INDEX IF NOT EXISTS idx_person_children_age ON person_children(age);

-- Enable RLS
ALTER TABLE person_children ENABLE ROW LEVEL SECURITY;

-- Drop any existing policies
DROP POLICY IF EXISTS "Service role full access on children" ON person_children;
DROP POLICY IF EXISTS "Service role full access on applicant_children" ON person_children;

-- Create service role policy
CREATE POLICY "Service role full access on person_children"
ON person_children FOR ALL TO service_role
USING (true) WITH CHECK (true);

-- =====================================================
-- 4. GRANT PERMISSIONS AND COMMENTS
-- =====================================================

-- Grant permissions
GRANT ALL ON person_children TO service_role;

-- Add comments
COMMENT ON TABLE person_children IS 'Children information tied to people (core identity data)';
COMMENT ON COLUMN person_children.person_id IS 'Foreign key to people table';
COMMENT ON COLUMN person_children.age IS 'Child age (can be calculated from date_of_birth)';