import { hashMessage } from "viem";

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface EscrowIdPair {
  internalId: string;
  blockchainId: string;
}

export interface PolicyEscrowInfo {
  type: "POLICY";
  providerId: string;
  policyId: string;
  timestamp: number;
  randomSuffix: string;
  checksum: string;
}

export interface UserEscrowInfo {
  type: "USER";
  userId: string;
  purpose: string;
  timestamp: number;
  randomSuffix: string;
  checksum: string;
}

export type EscrowInfo = PolicyEscrowInfo | UserEscrowInfo;

export type EscrowPurpose =
  | "DEPOSIT" // User depositing funds
  | "WITHDRAW" // User withdrawing funds
  | "STAKE" // User staking in pools
  | "BOND" // User providing bonds
  | "COLLATERAL" // User providing collateral
  | "INVESTMENT" // User investing in P2P pools
  | "RESERVE" // Provider reserve management
  | "POOL" // Pool-related operations
  | "CUSTOM"; // Custom purpose

// ============================================================================
// CONSTANTS & CONFIGURATION
// ============================================================================

const ESCROW_ID_CONFIG = {
  POLICY_PREFIX: "INS",
  USER_PREFIX: "USR",
  SEPARATOR: "-",
  PROVIDER_SHORT_LENGTH: 8,
  USER_SHORT_LENGTH: 8,
  POLICY_SHORT_LENGTH: 12,
  RANDOM_LENGTH: 6,
  CHECKSUM_LENGTH: 4,
  MAX_PURPOSE_LENGTH: 12,
} as const;

const CHECKSUM_SALT = "triggerr_escrow_v1";

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Generate a short, uppercase identifier from a longer ID
 */
function generateShortId(fullId: string, maxLength: number): string {
  // Remove common prefixes and clean the ID
  const cleaned = fullId
    .replace(/^(provider_|user_|policy_)/, "")
    .replace(/[^A-Za-z0-9]/g, "")
    .toUpperCase();

  if (cleaned.length <= maxLength) {
    return cleaned.padEnd(maxLength, "0");
  }

  // For longer IDs, take first part + hash-based suffix
  const firstPart = cleaned.substring(0, maxLength - 2);
  const hashSuffix = hashMessage(cleaned).slice(2, 4).toUpperCase();

  return firstPart + hashSuffix;
}

/**
 * Generate a cryptographically secure random suffix
 */
function generateRandomSuffix(length: number): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "";

  // Use crypto.getRandomValues for better randomness
  const randomArray = new Uint8Array(length);
  crypto.getRandomValues(randomArray);

  for (let i = 0; i < length; i++) {
    result += chars[randomArray[i]! % chars.length];
  }

  return result;
}

/**
 * Generate a checksum for validation
 */
function generateChecksum(components: string[]): string {
  const combined = components.join("") + CHECKSUM_SALT;
  const hash = hashMessage(combined);
  return hash.slice(2, 2 + ESCROW_ID_CONFIG.CHECKSUM_LENGTH).toUpperCase();
}

/**
 * Validate checksum
 */
function validateChecksum(components: string[], checksum: string): boolean {
  return generateChecksum(components) === checksum.toUpperCase();
}

/**
 * Get current timestamp in a consistent format
 */
function getTimestamp(): number {
  return Date.now();
}

/**
 * Format timestamp for display
 */
function formatTimestamp(timestamp: number): string {
  return new Date(timestamp).toISOString();
}

// ============================================================================
// POLICY ESCROW ID GENERATION
// ============================================================================

/**
 * Generate escrow ID pair for policy-related escrows
 * Format: INS-{PROVIDER_SHORT}-{POLICY_SHORT}-{TIMESTAMP}-{RANDOM}-{CHECKSUM}
 *
 * @param providerId - Full provider ID (e.g., "provider_triggerr_co_001")
 * @param policyId - Full policy ID (e.g., "policy_flight_delay_abc123")
 * @returns Object with internal and blockchain IDs
 */
export function generatePolicyEscrowId(
  providerId: string,
  policyId: string,
): EscrowIdPair {
  if (!providerId || !policyId) {
    throw new Error(
      "Provider ID and Policy ID are required for policy escrow generation",
    );
  }

  const providerShort = generateShortId(
    providerId,
    ESCROW_ID_CONFIG.PROVIDER_SHORT_LENGTH,
  );
  const policyShort = generateShortId(
    policyId,
    ESCROW_ID_CONFIG.POLICY_SHORT_LENGTH,
  );
  const timestamp = getTimestamp();
  const randomSuffix = generateRandomSuffix(ESCROW_ID_CONFIG.RANDOM_LENGTH);

  // Generate checksum from all components except checksum itself
  const components = [
    ESCROW_ID_CONFIG.POLICY_PREFIX,
    providerShort,
    policyShort,
    timestamp.toString(),
    randomSuffix,
  ];

  const checksum = generateChecksum(components);

  // Construct internal ID
  const internalId = [
    ESCROW_ID_CONFIG.POLICY_PREFIX,
    providerShort,
    policyShort,
    timestamp.toString(),
    randomSuffix,
    checksum,
  ].join(ESCROW_ID_CONFIG.SEPARATOR);

  // Generate blockchain ID (hashed for privacy)
  const blockchainId = hashMessage(internalId);

  return {
    internalId,
    blockchainId,
  };
}

// ============================================================================
// USER ESCROW ID GENERATION
// ============================================================================

/**
 * Generate escrow ID for user-initiated escrows
 * Format: USR-{USER_SHORT}-{PURPOSE}-{TIMESTAMP}-{RANDOM}-{CHECKSUM}
 *
 * @param userId - Full user ID (e.g., "user_abc123def456")
 * @param purpose - Purpose of the escrow (e.g., "DEPOSIT", "STAKE")
 * @returns Internal escrow ID (blockchain ID generated separately)
 */
export function generateUserEscrowId(
  userId: string,
  purpose: EscrowPurpose,
): EscrowIdPair {
  if (!userId || !purpose) {
    throw new Error(
      "User ID and purpose are required for user escrow generation",
    );
  }

  if (purpose.length > ESCROW_ID_CONFIG.MAX_PURPOSE_LENGTH) {
    throw new Error(
      `Purpose must be ${ESCROW_ID_CONFIG.MAX_PURPOSE_LENGTH} characters or less`,
    );
  }

  const userShort = generateShortId(userId, ESCROW_ID_CONFIG.USER_SHORT_LENGTH);
  const timestamp = getTimestamp();
  const randomSuffix = generateRandomSuffix(ESCROW_ID_CONFIG.RANDOM_LENGTH);

  // Generate checksum from all components
  const components = [
    ESCROW_ID_CONFIG.USER_PREFIX,
    userShort,
    purpose,
    timestamp.toString(),
    randomSuffix,
  ];

  const checksum = generateChecksum(components);

  // Construct internal ID
  const internalId = [
    ESCROW_ID_CONFIG.USER_PREFIX,
    userShort,
    purpose,
    timestamp.toString(),
    randomSuffix,
    checksum,
  ].join(ESCROW_ID_CONFIG.SEPARATOR);

  // Generate blockchain ID (hashed for privacy)
  const blockchainId = hashMessage(internalId);

  return {
    internalId,
    blockchainId,
  };
}

// ============================================================================
// ID PARSING & VALIDATION
// ============================================================================

/**
 * Parse an internal escrow ID to extract information
 *
 * @param internalId - Internal escrow ID to parse
 * @returns Parsed escrow information or null if invalid
 */
export function parseEscrowId(internalId: string): EscrowInfo | null {
  if (!internalId || typeof internalId !== "string") {
    return null;
  }

  const parts = internalId.split(ESCROW_ID_CONFIG.SEPARATOR);

  if (parts.length !== 6) {
    return null;
  }

  const [
    prefix,
    shortId,
    purposeOrPolicy,
    timestampStr,
    randomSuffix,
    checksum,
  ] = parts;

  // Validate checksum
  const componentsForChecksum = [
    prefix,
    shortId,
    purposeOrPolicy,
    timestampStr,
    randomSuffix,
  ];
  const validComponents = componentsForChecksum.filter(
    (c): c is string => c !== undefined,
  );
  if (!checksum || !validateChecksum(validComponents, checksum)) {
    return null;
  }

  if (!timestampStr) {
    throw new Error("Invalid escrow ID: missing timestamp");
  }
  const timestamp = parseInt(timestampStr, 10);
  if (isNaN(timestamp)) {
    return null;
  }

  if (prefix === ESCROW_ID_CONFIG.POLICY_PREFIX) {
    // Policy escrow
    return {
      type: "POLICY",
      providerId: `provider_${shortId?.toLowerCase() || "unknown"}`, // This is approximate - exact mapping would need DB lookup
      policyId: `policy_${purposeOrPolicy?.toLowerCase() || "unknown"}`, // This is approximate
      timestamp,
      randomSuffix: randomSuffix || "",
      checksum: checksum || "",
    };
  } else if (prefix === ESCROW_ID_CONFIG.USER_PREFIX) {
    // User escrow
    return {
      type: "USER",
      userId: `user_${shortId?.toLowerCase() || "unknown"}`, // This is approximate
      purpose: purposeOrPolicy as EscrowPurpose,
      timestamp,
      randomSuffix: randomSuffix || "",
      checksum: checksum || "",
    };
  }

  return null;
}

/**
 * Validate an internal escrow ID
 *
 * @param internalId - Internal escrow ID to validate
 * @returns True if valid, false otherwise
 */
export function validateEscrowId(internalId: string): boolean {
  return parseEscrowId(internalId) !== null;
}

/**
 * Get escrow type from internal ID
 *
 * @param internalId - Internal escrow ID
 * @returns 'POLICY', 'USER', or null if invalid
 */
export function getEscrowType(internalId: string): "POLICY" | "USER" | null {
  const info = parseEscrowId(internalId);
  return info?.type || null;
}

/**
 * Extract timestamp from internal escrow ID
 *
 * @param internalId - Internal escrow ID
 * @returns Timestamp or null if invalid
 */
export function getEscrowTimestamp(internalId: string): number | null {
  const info = parseEscrowId(internalId);
  return info?.timestamp || null;
}

/**
 * Check if escrow ID belongs to a specific provider (for policy escrows)
 *
 * @param internalId - Internal escrow ID
 * @param providerId - Provider ID to check against
 * @returns True if belongs to provider, false otherwise
 */
export function isProviderEscrow(
  internalId: string,
  providerId: string,
): boolean {
  const info = parseEscrowId(internalId);
  if (!info || info.type !== "POLICY") {
    return false;
  }

  const providerShort = generateShortId(
    providerId,
    ESCROW_ID_CONFIG.PROVIDER_SHORT_LENGTH,
  );
  return internalId.includes(`-${providerShort}-`);
}

/**
 * Check if escrow ID belongs to a specific user (for user escrows)
 *
 * @param internalId - Internal escrow ID
 * @param userId - User ID to check against
 * @returns True if belongs to user, false otherwise
 */
export function isUserEscrow(internalId: string, userId: string): boolean {
  const info = parseEscrowId(internalId);
  if (!info || info.type !== "USER") {
    return false;
  }

  const userShort = generateShortId(userId, ESCROW_ID_CONFIG.USER_SHORT_LENGTH);
  return internalId.includes(`-${userShort}-`);
}

// ============================================================================
// UTILITY & DISPLAY FUNCTIONS
// ============================================================================

/**
 * Get human-readable description of escrow ID
 *
 * @param internalId - Internal escrow ID
 * @returns Human-readable description
 */
export function getEscrowDescription(internalId: string): string {
  const info = parseEscrowId(internalId);

  if (!info) {
    return "Invalid escrow ID";
  }

  const createdAt = formatTimestamp(info.timestamp);

  if (info.type === "POLICY") {
    return `Policy escrow created at ${createdAt}`;
  } else {
    return `User escrow (${info.purpose}) created at ${createdAt}`;
  }
}

/**
 * Generate a batch of escrow IDs (useful for testing)
 *
 * @param count - Number of IDs to generate
 * @param type - Type of escrows to generate
 * @returns Array of escrow ID pairs
 */
export function generateBatchEscrowIds(
  count: number,
  type: "POLICY" | "USER",
  baseId?: string,
): EscrowIdPair[] {
  const results: EscrowIdPair[] = [];

  for (let i = 0; i < count; i++) {
    if (type === "POLICY") {
      const providerId = baseId || `provider_test_${i}`;
      const policyId = `policy_test_${i}`;
      results.push(generatePolicyEscrowId(providerId, policyId));
    } else {
      const userId = baseId || `user_test_${i}`;
      results.push(generateUserEscrowId(userId, "DEPOSIT"));
    }
  }

  return results;
}

// ============================================================================
// USAGE EXAMPLES
// ============================================================================

/*
// Policy Escrow Example:
const policyEscrow = generatePolicyEscrowId('provider_triggerr_co_001', 'policy_flight_delay_abc123');
console.log(policyEscrow.internalId);  // "INS-INSUREIN-FLIGHTDELAY-1706288400000-XYZ789-AB12"
console.log(policyEscrow.blockchainId); // "0x123...abc" (hashed)

// User Escrow Example:
const userEscrow = generateUserEscrowId('user_john_doe_123', 'DEPOSIT');
console.log(userEscrow.internalId);     // "USR-JOHNDOE1-DEPOSIT-1706288400000-ABC123-CD34"
console.log(userEscrow.blockchainId);   // "0x456...def" (hashed)

// Parsing Example:
const info = parseEscrowId('INS-INSUREIN-FLIGHTDELAY-1706288400000-XYZ789-AB12');
console.log(info.type);                 // "POLICY"
console.log(info.timestamp);            // 1706288400000

// Validation Example:
const isValid = validateEscrowId('INS-INSUREIN-FLIGHTDELAY-1706288400000-XYZ789-AB12');
console.log(isValid);                   // true

// Provider Check Example:
const belongsToProvider = isProviderEscrow('INS-INSUREIN-...', 'provider_triggerr_co_001');
console.log(belongsToProvider);         // true
*/
