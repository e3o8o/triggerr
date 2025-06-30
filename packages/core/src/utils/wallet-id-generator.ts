import { keccak256, toBytes } from 'viem';

/**
 * Generates a unique triggerr internal wallet ID and a corresponding blockchain-compatible address.
 * The internal ID is prefixed with "INNIE" and includes a timestamp, a user-specific hash, and a random component.
 * The blockchain address is deterministically derived from a combination of the user ID, a timestamp, and a random factor,
 * ensuring its uniqueness for blockchain operations.
 *
 * @param {string} userId - The unique identifier of the user for whom the wallet is being generated.
 * @returns {{ internalWalletId: string, blockchainAddress: `0x${string}` }} An object containing the generated
 *          internal wallet ID and the associated blockchain address.
 */
export function generateTriggerrWalletId(userId: string): { internalWalletId: string, blockchainAddress: `0x${string}` } {
  // Generate a cryptographically secure random component to ensure high uniqueness
  // and prevent predictable address generation even with identical userIds and timestamps.
  const randomBytes = crypto.getRandomValues(new Uint8Array(16)); // 16 bytes = 32 hex characters
  const randomHex = Array.from(randomBytes).map(b => b.toString(16).padStart(2, '0')).join('');

  // Use a timestamp to add time-based uniqueness, making it easier to sort/trace.
  const timestamp = Date.now().toString();

  // Create a unique hash for the internal wallet ID, combining userId, timestamp, and random data.
  // This contributes to the uniqueness and acts as a checksum-like component.
  const internalIdSeed = `${userId}_${timestamp}_${randomHex}`;
  const internalIdHash = keccak256(toBytes(internalIdSeed));

  // Construct the internal wallet ID: INNIE_<timestamp>_<short_hash_of_seed>_<short_random_component>
  // We take a portion of the hash and random hex for brevity.
  const shortInternalIdHash = internalIdHash.substring(2, 10); // e.g., '0x12345678...' -> '12345678'
  const shortRandomHexForId = randomHex.substring(0, 8);

  const internalWalletId = `INNIE_${timestamp}_${shortInternalIdHash}_${shortRandomHexForId}`;

  // For the blockchain address, generate a new deterministic address from the same unique seed data.
  // This ensures that the generated address is unique and derived from our controlled inputs,
  // making it traceable if needed, but not easily guessable from the internal ID alone.
  // We hash the seed to get a 32-byte (64 hex character) value, then take the last 20 bytes (40 hex chars)
  // for the Ethereum-compatible address format (0x + 40 chars).
  const blockchainAddressSeed = `${userId}_${timestamp}_${randomHex}`; // Re-use combined seed
  const fullBlockchainHash = keccak256(toBytes(blockchainAddressSeed));

  // Take the last 40 characters (20 bytes) of the hash and prefix with '0x'.
  const blockchainAddress = `0x${fullBlockchainHash.substring(fullBlockchainHash.length - 40)}` as `0x${string}`;

  return { internalWalletId, blockchainAddress };
}
