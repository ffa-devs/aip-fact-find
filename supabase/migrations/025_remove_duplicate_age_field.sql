-- Remove duplicate age field from application_participants table
-- Age is already handled in people table with automatic calculation via trigger

BEGIN;

-- Remove the age column from application_participants table
ALTER TABLE application_participants DROP COLUMN IF EXISTS age;

COMMIT;