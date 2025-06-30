-- =========================================================================
-- CORRECTED RLS POLICIES FOR POLICY TABLES WITH ANONYMOUS SUPPORT
-- =========================================================================
-- This script updates RLS policies for policy-related tables to support
-- anonymous users using the app.anonymous_session_id setting
-- =========================================================================

-- Update policy table RLS policies
DROP POLICY IF EXISTS "Anonymous users can access policies by session ID" ON public.policy;
CREATE POLICY "Anonymous users can access policies by session ID"
  ON public.policy FOR SELECT
  USING (anonymous_session_id IS NOT NULL AND
         anonymous_session_id = current_setting('app.anonymous_session_id', true));

-- Users can still manage their own policies
DROP POLICY IF EXISTS "Users can manage their own policies" ON public.policy;
CREATE POLICY "Users can manage their own policies"
  ON public.policy FOR ALL
  USING (auth.uid() = user_id::uuid)
  WITH CHECK (auth.uid() = user_id::uuid);

-- Service role has full access
DROP POLICY IF EXISTS "Service can manage all policies" ON public.policy;
CREATE POLICY "Service can manage all policies"
  ON public.policy FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Update policy_verification_code table RLS policies
DROP POLICY IF EXISTS "Anonymous users can access verification codes for their policie" ON public.policy_verification_code;
CREATE POLICY "Anonymous users can access verification codes for their policies"
  ON public.policy_verification_code FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM policy p
    WHERE p.id = policy_verification_code.policy_id
    AND p.anonymous_session_id IS NOT NULL
    AND p.anonymous_session_id = current_setting('app.anonymous_session_id', true)
  ));

-- Users can access verification codes for their policies
DROP POLICY IF EXISTS "Users can access verification codes for their policies" ON public.policy_verification_code;
CREATE POLICY "Users can access verification codes for their policies"
  ON public.policy_verification_code FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM policy p
    WHERE p.id = policy_verification_code.policy_id AND p.user_id::uuid = auth.uid()
  ));

-- Service role has full access to verification codes
DROP POLICY IF EXISTS "Service can manage policy verification codes" ON public.policy_verification_code;
CREATE POLICY "Service can manage policy verification codes"
  ON public.policy_verification_code FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Update policy_event table RLS policies
DROP POLICY IF EXISTS "Anonymous users can view events for their policies" ON public.policy_event;
CREATE POLICY "Anonymous users can view events for their policies"
  ON public.policy_event FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM policy p
    WHERE p.id = policy_event.policy_id
    AND p.anonymous_session_id IS NOT NULL
    AND p.anonymous_session_id = current_setting('app.anonymous_session_id', true)
  ));

-- Users can view events for their policies
DROP POLICY IF EXISTS "Users can view events for their policies" ON public.policy_event;
CREATE POLICY "Users can view events for their policies"
  ON public.policy_event FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM policy p
    WHERE p.id = policy_event.policy_id AND p.user_id::uuid = auth.uid()
  ));

-- Service role has full access to policy events
DROP POLICY IF EXISTS "Service can manage policy events" ON public.policy_event;
CREATE POLICY "Service can manage policy events"
  ON public.policy_event FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Verify the policies were created
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename IN ('policy', 'policy_verification_code', 'policy_event')
AND policyname LIKE '%nonymous%'
ORDER BY tablename, policyname;
