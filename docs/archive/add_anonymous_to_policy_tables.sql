-- =========================================================================
-- MANUAL MIGRATION: Add Anonymous Session Support to Policy Tables
-- =========================================================================
-- This script adds anonymous_session_id support to policy-related tables
-- that were missing this functionality for the anonymous purchase flow
-- =========================================================================

-- Update policy table
ALTER TABLE public.policy
  ADD COLUMN anonymous_session_id TEXT NULL,
  ALTER COLUMN user_id DROP NOT NULL;

-- Add constraint to ensure exactly one of user_id or anonymous_session_id is set
ALTER TABLE public.policy
  ADD CONSTRAINT policy_user_check
    CHECK ((user_id IS NOT NULL) != (anonymous_session_id IS NOT NULL));

-- Add index for anonymous session queries
CREATE INDEX policy_anon_session_idx ON public.policy (anonymous_session_id);

-- Update policy_verification_code table (no user_id to modify, just add column)
ALTER TABLE public.policy_verification_code
  ADD COLUMN anonymous_session_id TEXT NULL;

-- Add index for anonymous session queries on verification codes
CREATE INDEX policy_verification_code_anon_session_idx ON public.policy_verification_code (anonymous_session_id);

-- Update policy_event table (no user_id to modify, just add column for consistency)
ALTER TABLE public.policy_event
  ADD COLUMN anonymous_session_id TEXT NULL;

-- Add index for anonymous session queries on policy events
CREATE INDEX policy_event_anon_session_idx ON public.policy_event (anonymous_session_id);

-- Verify the changes
SELECT
  table_name,
  column_name,
  is_nullable,
  data_type
FROM information_schema.columns
WHERE table_name IN ('policy', 'policy_verification_code', 'policy_event')
  AND (column_name = 'user_id' OR column_name = 'anonymous_session_id')
ORDER BY table_name, column_name;

-- Show the new indexes
SELECT
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename IN ('policy', 'policy_verification_code', 'policy_event')
  AND indexname LIKE '%anon%'
ORDER BY tablename, indexname;
