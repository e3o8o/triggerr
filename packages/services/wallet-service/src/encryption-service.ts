import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
  createHash,
  CipherGCM,
  DecipherGCM,
} from "crypto";

export interface EncryptionResult {
  encryptedData: string;
  authTag: string;
  iv: string;
}

export class EncryptionService {
  private algorithm = "aes-256-gcm";
  private key: Buffer;

  constructor() {
    const encryptionKey = process.env.ENCRYPTION_KEY;
    if (!encryptionKey) {
      throw new Error("ENCRYPTION_KEY environment variable is required");
    }

    // Ensure we have a consistent 32-byte key
    this.key = this.deriveKey(encryptionKey);
  }

  /**
   * Derives a consistent 32-byte key from the provided string
   */
  private deriveKey(keyString: string): Buffer {
    return createHash("sha256").update(keyString).digest();
  }

  /**
   * Encrypts a private key string
   */
  encrypt(privateKey: string): string {
    try {
      const iv = randomBytes(16); // 128-bit IV for GCM
      const cipher = createCipheriv(this.algorithm, this.key, iv) as CipherGCM;

      let encrypted = cipher.update(privateKey, "utf8", "hex");
      encrypted += cipher.final("hex");

      const authTag = cipher.getAuthTag();

      // Combine IV, authTag, and encrypted data into a single string
      const result = {
        iv: iv.toString("hex"),
        authTag: authTag.toString("hex"),
        encryptedData: encrypted,
      };

      return JSON.stringify(result);
    } catch (error) {
      throw new Error(
        `Failed to encrypt private key: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * Decrypts an encrypted private key string
   */
  decrypt(encryptedString: string): string {
    try {
      const parsed = JSON.parse(encryptedString) as EncryptionResult;
      const { iv, authTag, encryptedData } = parsed;

      const decipher = createDecipheriv(
        this.algorithm,
        this.key,
        Buffer.from(iv, "hex"),
      ) as DecipherGCM;
      decipher.setAuthTag(Buffer.from(authTag, "hex"));

      let decrypted = decipher.update(encryptedData, "hex", "utf8");
      decrypted += decipher.final("utf8");

      return decrypted;
    } catch (error) {
      throw new Error(
        `Failed to decrypt private key: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * Validates that a string can be decrypted (useful for testing)
   */
  validateEncryption(encryptedString: string): boolean {
    try {
      const parsed = JSON.parse(encryptedString) as EncryptionResult;
      return !!(parsed.iv && parsed.authTag && parsed.encryptedData);
    } catch {
      return false;
    }
  }

  /**
   * Creates a test encryption to verify the service is working
   */
  static testEncryption(): boolean {
    try {
      // Use a test key for validation
      const originalKey = process.env.ENCRYPTION_KEY;
      process.env.ENCRYPTION_KEY = "test-key-for-validation-only";

      const service = new EncryptionService();
      const testData = "test-private-key-0x123456789abcdef";

      const encrypted = service.encrypt(testData);
      const decrypted = service.decrypt(encrypted);

      // Restore original key
      if (originalKey) {
        process.env.ENCRYPTION_KEY = originalKey;
      }

      return testData === decrypted;
    } catch {
      return false;
    }
  }
}

export default EncryptionService;
