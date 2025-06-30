-- =========================================================================
-- ANONYMOUS USER RLS POLICY UPDATES
-- =========================================================================
-- This script updates RLS policies for anonymous users to use the correct
-- app.anonymous_session_id setting instead of JWT claims
-- =========================================================================

-- Update user_wallets anonymous policy
DROP POLICY IF EXISTS "Anonymous users can access their paygo wallets" ON public.user_wallets;
CREATE POLICY "Anonymous users can access their paygo wallets"
  ON public.user_wallets FOR ALL
  USING (anonymous_session_id IS NOT NULL AND
         anonymous_session_id = current_setting('app.anonymous_session_id', true))
  WITH CHECK (anonymous_session_id IS NOT NULL AND
              anonymous_session_id = current_setting('app.anonymous_session_id', true) AND
              user_id IS NULL);

-- Update user_payment_methods anonymous policy
DROP POLICY IF EXISTS "Anonymous users can access their payment methods" ON public.user_payment_methods;
CREATE POLICY "Anonymous users can access their payment methods"
  ON public.user_payment_methods FOR ALL
  USING (anonymous_session_id IS NOT NULL AND
         anonymous_session_id = current_setting('app.anonymous_session_id', true))
  WITH CHECK (anonymous_session_id IS NOT NULL AND
              anonymous_session_id = current_setting('app.anonymous_session_id', true) AND
              user_id IS NULL);

-- Update policy anonymous access policy
DROP POLICY IF EXISTS "Anonymous users can access policies by session ID" ON public.policy;
CREATE POLICY "Anonymous users can access policies by session ID"
  ON public.policy FOR SELECT
  USING (anonymous_session_id IS NOT NULL AND
         anonymous_session_id = current_setting('app.anonymous_session_id', true));

-- Update policy_verification_code anonymous policy
DROP POLICY IF EXISTS "Anonymous users can access verification codes for their policies" ON public.policy_verification_code;
CREATE POLICY "Anonymous users can access verification codes for their policies"
  ON public.policy_verification_code FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM policy p
    WHERE p.id = policy_verification_code.policy_id
    AND p.anonymous_session_id IS NOT NULL
    AND p.anonymous_session_id = current_setting('app.anonymous_session_id', true)
  ));

-- Update policy_event anonymous policy
DROP POLICY IF EXISTS "Anonymous users can view events for their policies" ON public.policy_event;
CREATE POLICY "Anonymous users can view events for their policies"
  ON public.policy_event FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM policy p
    WHERE p.id = policy_event.policy_id
    AND p.anonymous_session_id IS NOT NULL
    AND p.anonymous_session_id = current_setting('app.anonymous_session_id', true)
  ));

-- Update quote_cart_items anonymous policies
DROP POLICY IF EXISTS "Anonymous users can view their quote cart items" ON public.quote_cart_items;
CREATE POLICY "Anonymous users can view their quote cart items"
  ON public.quote_cart_items FOR SELECT
  USING (anonymous_session_id IS NOT NULL AND
         anonymous_session_id = current_setting('app.anonymous_session_id', true));

DROP POLICY IF EXISTS "Anonymous users can manage their quote cart items" ON public.quote_cart_items;
CREATE POLICY "Anonymous users can manage their quote cart items"
  ON public.quote_cart_items FOR ALL
  USING (anonymous_session_id IS NOT NULL AND
         anonymous_session_id = current_setting('app.anonymous_session_id', true))
  WITH CHECK (anonymous_session_id IS NOT NULL AND
              anonymous_session_id = current_setting('app.anonymous_session_id', true) AND
              user_id IS NULL);

-- Update conversations anonymous policy
DROP POLICY IF EXISTS "Anonymous users can access their conversations" ON public.conversations;
CREATE POLICY "Anonymous users can access their conversations"
  ON public.conversations FOR ALL
  USING (anonymous_session_id IS NOT NULL AND
         anonymous_session_id = current_setting('app.anonymous_session_id', true))
  WITH CHECK (anonymous_session_id IS NOT NULL AND
              anonymous_session_id = current_setting('app.anonymous_session_id', true) AND
              user_id IS NULL);

-- Update conversation_messages anonymous policy
DROP POLICY IF EXISTS "Anonymous users can access their conversation messages" ON public.conversation_messages;
CREATE POLICY "Anonymous users can access their conversation messages"
  ON public.conversation_messages FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.conversations c
    WHERE c.id = conversation_messages.conversation_id
    AND c.anonymous_session_id IS NOT NULL
    AND c.anonymous_session_id = current_setting('app.anonymous_session_id', true)
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.conversations c
    WHERE c.id = conversation_messages.conversation_id
    AND c.anonymous_session_id IS NOT NULL
    AND c.anonymous_session_id = current_setting('app.anonymous_session_id', true)
  ));

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
WHERE tablename IN ('user_wallets', 'user_payment_methods', 'policy', 'policy_verification_code', 'policy_event', 'quote_cart_items', 'conversations', 'conversation_messages')
AND policyname LIKE '%nonymous%'
ORDER BY tablename, policyname;
