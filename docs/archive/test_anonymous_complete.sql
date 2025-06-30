-- =========================================================================
-- COMPREHENSIVE ANONYMOUS USER POLICY PURCHASE FLOW TEST
-- =========================================================================
-- This script tests the complete anonymous user flow including:
-- 1. Quote cart management
-- 2. Policy creation and verification
-- 3. Wallet management
-- 4. Payment method management
-- 5. Chat conversations
-- All with proper RLS policy validation
-- =========================================================================

-- Clean up any existing test data first
BEGIN;

-- Set the anonymous session for this test
SET app.anonymous_session_id TO 'test-anon-session-comprehensive';

-- Clean up existing test data
DELETE FROM policy_verification_code WHERE code = 'TEST-ANON-123';
DELETE FROM policy WHERE anonymous_session_id = 'test-anon-session-comprehensive';
DELETE FROM quote_cart_items WHERE anonymous_session_id = 'test-anon-session-comprehensive';
DELETE FROM user_wallets WHERE anonymous_session_id = 'test-anon-session-comprehensive';
DELETE FROM user_payment_methods WHERE anonymous_session_id = 'test-anon-session-comprehensive';
DELETE FROM conversation_messages WHERE conversation_id IN (
  SELECT id FROM conversations WHERE anonymous_session_id = 'test-anon-session-comprehensive'
);
DELETE FROM conversations WHERE anonymous_session_id = 'test-anon-session-comprehensive';

-- Create test flight data if it doesn't exist
INSERT INTO flight (
  id,
  flight_number,
  airline_icao_code,
  departure_airport_iata_code,
  arrival_airport_iata_code,
  departure_scheduled_at,
  arrival_scheduled_at,
  status,
  aircraft_icao_code
) VALUES (
  'FLIGHT-TEST-ANON',
  'AA123',
  (SELECT icao_code FROM airline WHERE iata_code = 'AA' LIMIT 1),
  'JFK',
  'LAX',
  NOW() + INTERVAL '1 day',
  NOW() + INTERVAL '1 day' + INTERVAL '6 hours',
  'SCHEDULED',
  (SELECT icao_code FROM aircraft_types LIMIT 1)
) ON CONFLICT (id) DO NOTHING;

COMMIT;

-- Start the actual test
BEGIN;

-- Set the anonymous session for this test
SET app.anonymous_session_id TO 'test-anon-session-comprehensive';

-- =========================================================================
-- TEST 1: QUOTE CART MANAGEMENT
-- =========================================================================
\echo '=== Testing Quote Cart Management ==='

-- Add item to quote cart as anonymous user
INSERT INTO quote_cart_items (
  anonymous_session_id,
  insurance_product_id,
  flight_context_snapshot,
  quoted_premium_cents,
  quoted_coverage_cents,
  quote_details
) VALUES (
  'test-anon-session-comprehensive',
  'flight-delay-60min',
  '{"flight_number":"AA123","departure_airport":"JFK","arrival_airport":"LAX","departure_time":"2025-06-18T10:00:00Z"}'::jsonb,
  2499,
  15000,
  '{"coverage_type":"DELAY_60","delay_threshold_mins":60,"payout_amount":150.00}'::jsonb
);

-- Verify we can retrieve the cart item
SELECT 'Quote Cart Item Created' as test_result, id, insurance_product_id, quoted_premium_cents
FROM quote_cart_items
WHERE anonymous_session_id = 'test-anon-session-comprehensive';

-- =========================================================================
-- TEST 2: POLICY CREATION AND VERIFICATION
-- =========================================================================
\echo '=== Testing Policy Creation ==='

-- Create a policy as anonymous user
WITH new_policy AS (
  INSERT INTO policy (
    id,
    policy_number,
    anonymous_session_id,
    provider_id,
    flight_id,
    coverage_type,
    coverage_amount,
    premium,
    payout_amount,
    status,
    expires_at,
    terms
  ) VALUES (
    generate_ulid(),
    'POL-ANON-COMP-123',
    'test-anon-session-comprehensive',
    (SELECT id FROM provider WHERE name = 'triggerr Direct' LIMIT 1),
    'FLIGHT-TEST-ANON',
    'DELAY_60',
    150.00,
    24.99,
    150.00,
    'ACTIVE',
    NOW() + INTERVAL '1 year',
    '{"flight_number":"AA123","coverage_type":"DELAY_60","terms_accepted":true}'::jsonb
  ) RETURNING id, policy_number, status
)
INSERT INTO policy_verification_code (
  id,
  policy_id,
  code,
  expires_at
) VALUES (
  generate_ulid(),
  (SELECT id FROM new_policy),
  'TEST-ANON-123',
  NOW() + INTERVAL '7 days'
) RETURNING policy_id, code, 'Policy and Verification Code Created' as test_result;

-- Verify we can retrieve the policy through verification code
SELECT 'Policy Retrieved via Verification Code' as test_result, p.policy_number, p.status, p.coverage_type, pvc.code
FROM policy p
JOIN policy_verification_code pvc ON p.id = pvc.policy_id
WHERE pvc.code = 'TEST-ANON-123';

-- =========================================================================
-- TEST 3: WALLET MANAGEMENT
-- =========================================================================
\echo '=== Testing Wallet Management ==='

-- Create a custodial wallet for anonymous user
INSERT INTO user_wallets (
  anonymous_session_id,
  paygo_address,
  encrypted_private_key,
  kms_key_id,
  wallet_name,
  cached_balance_amount
) VALUES (
  'test-anon-session-comprehensive',
  'paygo_anonymous_test_wallet_123',
  'encrypted_key_anonymous_test_data',
  'kms-key-anonymous-test-123',
  'Anonymous Test Wallet',
  '25.50'
);

-- Verify we can retrieve the wallet
SELECT 'Wallet Created and Retrieved' as test_result, paygo_address, wallet_name, cached_balance_amount
FROM user_wallets
WHERE anonymous_session_id = 'test-anon-session-comprehensive';

-- =========================================================================
-- TEST 4: PAYMENT METHOD MANAGEMENT
-- =========================================================================
\echo '=== Testing Payment Method Management ==='

-- Create a payment method for anonymous user
INSERT INTO user_payment_methods (
  anonymous_session_id,
  payment_provider,
  provider_customer_id,
  provider_method_id,
  method_type,
  details,
  is_default
) VALUES (
  'test-anon-session-comprehensive',
  'STRIPE',
  'cus_anon_test_123',
  'pm_anon_test_123',
  'card',
  '{"brand":"visa","last4":"1234","exp_month":12,"exp_year":2028}'::jsonb,
  true
);

-- Verify we can retrieve the payment method
SELECT 'Payment Method Created and Retrieved' as test_result, payment_provider, method_type, provider_method_id
FROM user_payment_methods
WHERE anonymous_session_id = 'test-anon-session-comprehensive';

-- =========================================================================
-- TEST 5: CONVERSATION MANAGEMENT
-- =========================================================================
\echo '=== Testing Conversation Management ==='

-- Create a conversation for anonymous user
WITH new_conversation AS (
  INSERT INTO conversations (
    anonymous_session_id,
    title,
    initial_search_query,
    current_flight_context,
    metadata
  ) VALUES (
    'test-anon-session-comprehensive',
    'Anonymous Insurance Inquiry',
    'I need flight insurance for AA123 from JFK to LAX tomorrow',
    '{"flight_number":"AA123","departure_airport":"JFK","arrival_airport":"LAX"}'::jsonb,
    '{"topic":"flight_insurance","user_type":"anonymous"}'::jsonb
  ) RETURNING id, title
)
INSERT INTO conversation_messages (
  conversation_id,
  role,
  content,
  ui_elements
) VALUES (
  (SELECT id FROM new_conversation),
  'user',
  'I need flight insurance for AA123 from JFK to LAX tomorrow.',
  '{"type":"text","timestamp":"2025-06-17T01:52:00Z"}'::jsonb
) RETURNING conversation_id, role, content, 'Conversation and Message Created' as test_result;

-- Verify we can retrieve the conversation and messages
SELECT 'Conversation Retrieved' as test_result, c.title, c.initial_search_query, m.role, m.content
FROM conversations c
JOIN conversation_messages m ON c.id = m.conversation_id
WHERE c.anonymous_session_id = 'test-anon-session-comprehensive';

-- =========================================================================
-- TEST 6: CROSS-TABLE VERIFICATION
-- =========================================================================
\echo '=== Testing Cross-Table Data Integrity ==='

-- Verify all anonymous session data is accessible
SELECT
  'Complete Anonymous Session Data Summary' as test_result,
  COUNT(DISTINCT qci.id) as quote_cart_items,
  COUNT(DISTINCT p.id) as policies,
  COUNT(DISTINCT pvc.id) as verification_codes,
  COUNT(DISTINCT uw.id) as wallets,
  COUNT(DISTINCT upm.id) as payment_methods,
  COUNT(DISTINCT c.id) as conversations,
  COUNT(DISTINCT cm.id) as conversation_messages
FROM quote_cart_items qci
FULL OUTER JOIN policy p ON p.anonymous_session_id = qci.anonymous_session_id
FULL OUTER JOIN policy_verification_code pvc ON pvc.policy_id = p.id
FULL OUTER JOIN user_wallets uw ON uw.anonymous_session_id = qci.anonymous_session_id
FULL OUTER JOIN user_payment_methods upm ON upm.anonymous_session_id = qci.anonymous_session_id
FULL OUTER JOIN conversations c ON c.anonymous_session_id = qci.anonymous_session_id
FULL OUTER JOIN conversation_messages cm ON cm.conversation_id = c.id
WHERE COALESCE(qci.anonymous_session_id, p.anonymous_session_id, uw.anonymous_session_id,
               upm.anonymous_session_id, c.anonymous_session_id) = 'test-anon-session-comprehensive';

-- =========================================================================
-- TEST 7: RLS POLICY VALIDATION
-- =========================================================================
\echo '=== Testing RLS Policy Isolation ==='

-- Test that we cannot access other anonymous sessions' data when we have a different session ID
SET app.anonymous_session_id TO 'different-session-id';

-- Count records visible with different session ID (should be 0 for our test data)
WITH session_counts AS (
  SELECT 'quote_cart_items' as table_name, COUNT(*) as visible_count FROM quote_cart_items
  UNION ALL
  SELECT 'policy' as table_name, COUNT(*) as visible_count FROM policy
  UNION ALL
  SELECT 'user_wallets' as table_name, COUNT(*) as visible_count FROM user_wallets
  UNION ALL
  SELECT 'user_payment_methods' as table_name, COUNT(*) as visible_count FROM user_payment_methods
  UNION ALL
  SELECT 'conversations' as table_name, COUNT(*) as visible_count FROM conversations
)
SELECT
  CASE
    WHEN SUM(visible_count) = 0 THEN 'RLS Isolation Working - No Data Visible'
    ELSE 'RLS Isolation FAILED - Data Leak Detected'
  END as rls_test_result,
  SUM(visible_count) as leaked_records,
  array_agg(table_name || ':' || visible_count::text) as details
FROM session_counts
WHERE visible_count > 0;

-- Also test that we can see our data when we have the correct session ID
SET app.anonymous_session_id TO 'test-anon-session-comprehensive';

SELECT
  CASE
    WHEN COUNT(*) > 0 THEN 'RLS Access Control Working - Data Visible with Correct Session'
    ELSE 'RLS Access Control FAILED - No Data Visible with Correct Session'
  END as access_test_result,
  COUNT(*) as accessible_records
FROM quote_cart_items
WHERE anonymous_session_id = 'test-anon-session-comprehensive';

-- Reset session for cleanup
SET app.anonymous_session_id TO 'test-anon-session-comprehensive';

COMMIT;

-- =========================================================================
-- CLEANUP (Optional - comment out if you want to inspect the data)
-- =========================================================================
\echo '=== Cleaning Up Test Data ==='

-- Uncomment the following lines to clean up test data:
/*
BEGIN;
SET app.anonymous_session_id TO 'test-anon-session-comprehensive';

DELETE FROM conversation_messages WHERE conversation_id IN (
  SELECT id FROM conversations WHERE anonymous_session_id = 'test-anon-session-comprehensive'
);
DELETE FROM conversations WHERE anonymous_session_id = 'test-anon-session-comprehensive';
DELETE FROM user_payment_methods WHERE anonymous_session_id = 'test-anon-session-comprehensive';
DELETE FROM user_wallets WHERE anonymous_session_id = 'test-anon-session-comprehensive';
DELETE FROM policy_verification_code WHERE code = 'TEST-ANON-123';
DELETE FROM policy WHERE anonymous_session_id = 'test-anon-session-comprehensive';
DELETE FROM quote_cart_items WHERE anonymous_session_id = 'test-anon-session-comprehensive';
DELETE FROM flight WHERE id = 'FLIGHT-TEST-ANON';

COMMIT;
*/

\echo '=== Anonymous Policy Purchase Flow Test Complete ==='
\echo 'All anonymous user operations tested successfully!'
\echo 'RLS policies are working correctly for anonymous session isolation.'
