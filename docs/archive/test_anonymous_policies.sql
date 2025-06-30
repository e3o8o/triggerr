-- Test script for anonymous policy purchase RLS policies
-- This script tests the anonymous purchase flow by simulating anonymous user actions

-- 1. First, let's create a test anonymous session
SET app.anonymous_session_id TO 'test-anon-session-123';

-- 2. Test creating a quote cart item as an anonymous user
-- This should succeed if the RLS policies are correctly set up
INSERT INTO quote_cart_items (
  anonymous_session_id,
  insurance_product_id,
  flight_context_snapshot,
  quoted_premium_cents,
  quoted_coverage_cents,
  quote_details
) VALUES (
  'test-anon-session-123',
  'flight-delay-basic',
  '{"flight_number":"AA123","departure_airport":"JFK","arrival_airport":"LAX"}'::jsonb,
  1999,
  10000,
  '{"coverage_type":"basic","delay_threshold_mins":60}'::jsonb
) RETURNING *;

-- 3. Test creating a policy as an anonymous user
-- This should create a policy linked to the anonymous session
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
    'POL-ANON-123',
    'test-anon-session-123',
    (SELECT id FROM provider WHERE name = 'triggerr Direct' LIMIT 1),
    (SELECT id FROM flight LIMIT 1),
    'DELAY_60',
    100.00,
    19.99,
    100.00,
    'ACTIVE',
    NOW() + INTERVAL '1 year',
    '{"flight_number":"AA123","coverage_type":"basic"}'::jsonb
  ) RETURNING *
)
INSERT INTO policy_verification_code (
  policy_id,
  code,
  expires_at
) VALUES (
  (SELECT id FROM new_policy LIMIT 1),
  'TEST123',
  NOW() + INTERVAL '7 days'
) RETURNING *;

-- 4. Test retrieving the policy as an anonymous user using the verification code
-- This should return the policy if the RLS policies are correct
SELECT p.*
FROM policy p
JOIN policy_verification_code pvc ON p.id = pvc.policy_id
WHERE pvc.code = 'TEST123';

-- 5. Test creating a wallet for the anonymous user
-- This should create a wallet linked to the anonymous session
INSERT INTO user_wallets (
  anonymous_session_id,
  paygo_address,
  encrypted_private_key,
  kms_key_id,
  created_at
) VALUES (
  'test-anon-session-123',
  'paygo_1234567890',
  'encrypted_private_key_here',
  'test-kms-key-id',
  NOW()
) RETURNING *;

-- 6. Test retrieving the wallet as an anonymous user
-- This should return the wallet if the RLS policies are correct
SELECT * FROM user_wallets
WHERE anonymous_session_id = 'test-anon-session-123';

-- 7. Test creating a payment method for the anonymous user
-- This should create a payment method linked to the anonymous session
INSERT INTO user_payment_methods (
  anonymous_session_id,
  payment_provider,
  provider_customer_id,
  provider_method_id,
  method_type,
  details,
  is_default
) VALUES (
  'test-anon-session-123',
  'STRIPE',
  'cus_test123',
  'pm_test123',
  'card',
  '{"last4":"4242","brand":"visa"}'::jsonb,
  true
) RETURNING *;

-- 8. Test retrieving the payment method as an anonymous user
-- This should return the payment method if the RLS policies are correct
SELECT * FROM user_payment_methods
WHERE anonymous_session_id = 'test-anon-session-123';

-- 9. Clean up test data (run this after testing is complete)
-- DELETE FROM policy_verification_code WHERE code = 'TEST123';
-- DELETE FROM policy WHERE anonymous_session_id = 'test-anon-session-123';
-- DELETE FROM quote_cart_items WHERE anonymous_session_id = 'test-anon-session-123';
-- DELETE FROM user_wallets WHERE anonymous_session_id = 'test-anon-session-123';
-- DELETE FROM user_payment_methods WHERE anonymous_session_id = 'test-anon-session-123';
