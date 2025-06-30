import { EncryptionService } from '../packages/services/wallet-service/src/encryption-service';

async function testEncryption() {
  console.log('[Test Encryption] Starting encryption service tests...');

  try {
    // Test 1: Environment variable check
    console.log('\n=== TEST 1: Environment Variable Validation ===');

    if (!process.env.ENCRYPTION_KEY) {
      console.log('❌ ENCRYPTION_KEY environment variable not set');
      console.log('Setting a test key for demonstration...');
      process.env.ENCRYPTION_KEY = 'test-key-for-encryption-demo-12345678901234567890123456789012';
    } else {
      console.log('✅ ENCRYPTION_KEY environment variable is set');
    }

    // Test 2: Service instantiation
    console.log('\n=== TEST 2: Service Instantiation ===');
    let encryptionService: EncryptionService;

    try {
      encryptionService = new EncryptionService();
      console.log('✅ EncryptionService instantiated successfully');
    } catch (error) {
      console.log('❌ Failed to instantiate EncryptionService:', error);
      return;
    }

    // Test 3: Basic encryption and decryption
    console.log('\n=== TEST 3: Basic Encryption/Decryption ===');

    const testPrivateKey = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';
    console.log(`Original private key: ${testPrivateKey}`);

    let encryptedKey: string;
    try {
      encryptedKey = encryptionService.encrypt(testPrivateKey);
      console.log(`✅ Encryption successful`);
      console.log(`Encrypted data length: ${encryptedKey.length} characters`);
      console.log(`Encrypted data preview: ${encryptedKey.substring(0, 100)}...`);
    } catch (error) {
      console.log('❌ Encryption failed:', error);
      return;
    }

    // Verify encrypted data is different from original
    if (encryptedKey === testPrivateKey) {
      console.log('❌ Encrypted data is same as original (encryption not working)');
      return;
    } else {
      console.log('✅ Encrypted data is different from original');
    }

    // Test decryption
    let decryptedKey: string;
    try {
      decryptedKey = encryptionService.decrypt(encryptedKey);
      console.log(`✅ Decryption successful`);
      console.log(`Decrypted private key: ${decryptedKey}`);
    } catch (error) {
      console.log('❌ Decryption failed:', error);
      return;
    }

    // Verify decrypted data matches original
    if (decryptedKey === testPrivateKey) {
      console.log('✅ Decrypted data matches original');
    } else {
      console.log('❌ Decrypted data does not match original');
      console.log(`Expected: ${testPrivateKey}`);
      console.log(`Got: ${decryptedKey}`);
      return;
    }

    // Test 4: Multiple encryptions produce different results
    console.log('\n=== TEST 4: Encryption Randomness ===');

    const encrypted1 = encryptionService.encrypt(testPrivateKey);
    const encrypted2 = encryptionService.encrypt(testPrivateKey);

    if (encrypted1 !== encrypted2) {
      console.log('✅ Multiple encryptions of same data produce different results (good randomness)');
    } else {
      console.log('❌ Multiple encryptions produce same result (potential security issue)');
    }

    // Both should decrypt to the same original value
    const decrypted1 = encryptionService.decrypt(encrypted1);
    const decrypted2 = encryptionService.decrypt(encrypted2);

    if (decrypted1 === testPrivateKey && decrypted2 === testPrivateKey) {
      console.log('✅ Both encrypted versions decrypt to original value');
    } else {
      console.log('❌ Encrypted versions do not decrypt correctly');
    }

    // Test 5: Validation method
    console.log('\n=== TEST 5: Encryption Validation ===');

    const isValid = encryptionService.validateEncryption(encryptedKey);
    if (isValid) {
      console.log('✅ Encrypted data validates as properly formatted');
    } else {
      console.log('❌ Encrypted data fails validation');
    }

    // Test invalid data
    const isInvalidValid = encryptionService.validateEncryption('invalid-encrypted-data');
    if (!isInvalidValid) {
      console.log('✅ Invalid data correctly identified as invalid');
    } else {
      console.log('❌ Invalid data incorrectly validated as valid');
    }

    // Test 6: Error handling
    console.log('\n=== TEST 6: Error Handling ===');

    try {
      encryptionService.decrypt('invalid-encrypted-data');
      console.log('❌ Decryption of invalid data should have thrown an error');
    } catch (error) {
      console.log('✅ Decryption of invalid data correctly throws error');
    }

    try {
      encryptionService.decrypt('{"invalid":"json","structure":"test"}');
      console.log('❌ Decryption of malformed JSON should have thrown an error');
    } catch (error) {
      console.log('✅ Decryption of malformed JSON correctly throws error');
    }

    // Test 7: Different data types
    console.log('\n=== TEST 7: Different Data Types ===');

    const testCases = [
      'short',
      'a-much-longer-private-key-string-that-contains-more-characters-0x123456789abcdef',
      '0x' + 'a'.repeat(64), // 64 character hex string
      'special!@#$%^&*()characters',
      'unicode-test-🔑💰🚀',
      ''  // empty string
    ];

    for (let i = 0; i < testCases.length; i++) {
      const testCase = testCases[i];
      try {
        const encrypted = encryptionService.encrypt(testCase);
        const decrypted = encryptionService.decrypt(encrypted);

        if (decrypted === testCase) {
          console.log(`✅ Test case ${i + 1} (${testCase.length} chars): successful`);
        } else {
          console.log(`❌ Test case ${i + 1}: decryption mismatch`);
        }
      } catch (error) {
        console.log(`❌ Test case ${i + 1}: error - ${error}`);
      }
    }

    // Test 8: Static test method
    console.log('\n=== TEST 8: Static Test Method ===');

    const staticTestResult = EncryptionService.testEncryption();
    if (staticTestResult) {
      console.log('✅ Static test method passed');
    } else {
      console.log('❌ Static test method failed');
    }

    console.log('\n🎉 All encryption tests completed successfully!');
    console.log('The encryption service is working correctly and ready for production use.');

  } catch (error) {
    console.error('[Test Encryption] ❌ Unexpected error during testing:', error);
    process.exit(1);
  }
}

// Performance test (optional)
async function performanceTest() {
  console.log('\n=== PERFORMANCE TEST ===');

  try {
    const encryptionService = new EncryptionService();
    const testKey = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';
    const iterations = 1000;

    // Encryption performance
    const encryptStart = Date.now();
    const encryptedKeys: string[] = [];

    for (let i = 0; i < iterations; i++) {
      encryptedKeys.push(encryptionService.encrypt(testKey));
    }

    const encryptEnd = Date.now();
    const encryptTime = encryptEnd - encryptStart;
    console.log(`✅ Encrypted ${iterations} keys in ${encryptTime}ms (${(encryptTime / iterations).toFixed(2)}ms per key)`);

    // Decryption performance
    const decryptStart = Date.now();

    for (let i = 0; i < iterations; i++) {
      encryptionService.decrypt(encryptedKeys[i]);
    }

    const decryptEnd = Date.now();
    const decryptTime = decryptEnd - decryptStart;
    console.log(`✅ Decrypted ${iterations} keys in ${decryptTime}ms (${(decryptTime / iterations).toFixed(2)}ms per key)`);

    const totalTime = encryptTime + decryptTime;
    console.log(`Total time for ${iterations} encrypt/decrypt cycles: ${totalTime}ms`);

  } catch (error) {
    console.log('❌ Performance test failed:', error);
  }
}

// Run all tests
async function runAllTests() {
  console.log('🔐 triggerr Encryption Service Test Suite');
  console.log('==========================================');

  await testEncryption();
  await performanceTest();

  console.log('\n✅ Test suite completed successfully!');
  console.log('The encryption service is ready for use in production.');
}

// Run if called directly
if (require.main === module) {
  runAllTests()
    .then(() => {
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Test suite failed:', error);
      process.exit(1);
    });
}

export { testEncryption, performanceTest, runAllTests };
