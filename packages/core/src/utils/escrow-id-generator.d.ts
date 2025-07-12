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
  | "DEPOSIT"
  | "WITHDRAW"
  | "STAKE"
  | "BOND"
  | "COLLATERAL"
  | "INVESTMENT"
  | "RESERVE"
  | "POOL"
  | "CUSTOM";
/**
 * Generate escrow ID pair for policy-related escrows
 * Format: TRG-{PROVIDER_SHORT}-{POLICY_SHORT}-{TIMESTAMP}-{RANDOM}-{CHECKSUM}
 *
 * @param providerId - Full provider ID (e.g., "provider_triggerr_co_001")
 * @param policyId - Full policy ID (e.g., "policy_flight_delay_abc123")
 * @returns Object with internal and blockchain IDs
 */
export declare function generatePolicyEscrowId(
  providerId: string,
  policyId: string,
): EscrowIdPair;
/**
 * Generate escrow ID for user-initiated escrows
 * Format: USR-{USER_SHORT}-{PURPOSE}-{TIMESTAMP}-{RANDOM}-{CHECKSUM}
 *
 * @param userId - Full user ID (e.g., "user_abc123def456")
 * @param purpose - Purpose of the escrow (e.g., "DEPOSIT", "STAKE")
 * @returns Internal escrow ID (blockchain ID generated separately)
 */
export declare function generateUserEscrowId(
  userId: string,
  purpose: EscrowPurpose,
): EscrowIdPair;
/**
 * Parse an internal escrow ID to extract information
 *
 * @param internalId - Internal escrow ID to parse
 * @returns Parsed escrow information or null if invalid
 */
export declare function parseEscrowId(internalId: string): EscrowInfo | null;
/**
 * Validate an internal escrow ID
 *
 * @param internalId - Internal escrow ID to validate
 * @returns True if valid, false otherwise
 */
export declare function validateEscrowId(internalId: string): boolean;
/**
 * Get escrow type from internal ID
 *
 * @param internalId - Internal escrow ID
 * @returns 'POLICY', 'USER', or null if invalid
 */
export declare function getEscrowType(
  internalId: string,
): "POLICY" | "USER" | null;
/**
 * Extract timestamp from internal escrow ID
 *
 * @param internalId - Internal escrow ID
 * @returns Timestamp or null if invalid
 */
export declare function getEscrowTimestamp(internalId: string): number | null;
/**
 * Check if escrow ID belongs to a specific provider (for policy escrows)
 *
 * @param internalId - Internal escrow ID
 * @param providerId - Provider ID to check against
 * @returns True if belongs to provider, false otherwise
 */
export declare function isProviderEscrow(
  internalId: string,
  providerId: string,
): boolean;
/**
 * Check if escrow ID belongs to a specific user (for user escrows)
 *
 * @param internalId - Internal escrow ID
 * @param userId - User ID to check against
 * @returns True if belongs to user, false otherwise
 */
export declare function isUserEscrow(
  internalId: string,
  userId: string,
): boolean;
/**
 * Get human-readable description of escrow ID
 *
 * @param internalId - Internal escrow ID
 * @returns Human-readable description
 */
export declare function getEscrowDescription(internalId: string): string;
/**
 * Generate a batch of escrow IDs (useful for testing)
 *
 * @param count - Number of IDs to generate
 * @param type - Type of escrows to generate
 * @returns Array of escrow ID pairs
 */
export declare function generateBatchEscrowIds(
  count: number,
  type: "POLICY" | "USER",
  baseId?: string,
): EscrowIdPair[];
//# sourceMappingURL=escrow-id-generator.d.ts.map
