import { Database, Schema } from "@triggerr/core";
import { eq, and } from "drizzle-orm";
import type { Hex } from "viem";

// By defining this type, we can pass either the main `db` object or a transaction `tx`
// to our repository methods, making them flexible and transaction-safe.
type DatabaseType = typeof Database.db;
type Transaction = Parameters<Parameters<typeof Database.db.transaction>[0]>[0];

/**
 * The data required to create a new wallet entry in the database.
 * This aligns with the `userWallets` schema.
 */
export interface NewWalletRecord {
  userId: string;
  address: Hex;
  encryptedSecret: string; // This should be the *encrypted* key
  kmsKeyId: string; // The ID of the key used for encryption in the KMS
  chain: string;
  walletType: string;
  publicKey?: string; // Optional public key for non-custodial wallets
  walletName?: string;
  isPrimary?: boolean;
}

/**
 * UserWalletRepository
 *
 * This class encapsulates all database access logic for the `userWallets` table.
 * By abstracting these operations, we create a clear separation of concerns, making
 * the `WalletService` cleaner and our data access layer more maintainable and testable.
 */
export class UserWalletRepository {
  /**
   * Creates a new user wallet record in the database.
   * This method is designed to be "transaction-aware." If a Drizzle transaction
   * object is passed as the `dbInstance`, this operation will be part of that
   * transaction. Otherwise, it runs as a standalone operation.
   *
   * @param {NewWalletRecord} data - The wallet data to persist.
   * @param {Transaction | Database} [dbInstance=db] - The database instance or transaction to use for the query.
   * @returns {Promise<any>} A promise that resolves with the newly created wallet record.
   */
  public async create(
    data: NewWalletRecord,
    dbInstance: Transaction | DatabaseType = Database.db,
  ): Promise<any> {
    console.log(
      `[UserWalletRepository] Inserting new wallet into DB for user: ${data.userId}`,
    );

    const [newWalletRecord] = await dbInstance
      .insert(Schema.userWallets)
      .values({
        userId: data.userId,
        address: data.address,
        encryptedSecret: data.encryptedSecret,
        kmsKeyId: data.kmsKeyId,
        chain: data.chain,
        walletType: data.walletType,
        publicKey: data.publicKey,
        walletName: data.walletName, // Will use the schema's default if not provided
        isPrimary: data.isPrimary, // Will use the schema's default if not provided
      })
      .returning();

    if (!newWalletRecord) {
      throw new Error("[UserWalletRepository] Failed to create wallet record");
    }

    console.log(
      `[UserWalletRepository] Wallet record created with ID: ${newWalletRecord.id}`,
    );
    return newWalletRecord;
  }

  /**
   * Finds a wallet by user ID and wallet address.
   * This method is used to locate a specific wallet for a user, typically
   * when we need to retrieve the encrypted private key for transactions.
   *
   * @param {string} userId - The ID of the user who owns the wallet.
   * @param {Hex} walletAddress - The PayGo address of the wallet to find.
   * @param {Transaction | Database} [dbInstance=db] - The database instance or transaction to use for the query.
   * @returns {Promise<any | null>} A promise that resolves with the wallet record or null if not found.
   */
  public async findByUserIdAndAddress(
    userId: string,
    walletAddress: Hex,
    dbInstance: Transaction | DatabaseType = Database.db,
  ): Promise<any | null> {
    console.log(
      `[UserWalletRepository] Finding wallet for user ${userId} with address ${walletAddress}`,
    );

    const wallet = await dbInstance.query.userWallets.findFirst({
      where: and(
        eq(Schema.userWallets.userId, userId),
        eq(Schema.userWallets.address, walletAddress),
      ),
    });

    if (wallet) {
      console.log(`[UserWalletRepository] Found wallet with ID: ${wallet.id}`);
    } else {
      console.log(
        `[UserWalletRepository] No wallet found for user ${userId} with address ${walletAddress}`,
      );
    }

    return wallet || null;
  }

  // In the future, other methods would be added here, for example:
  // public async findByUserId(userId: string): Promise<any> { ... }
  // public async setPrimaryWallet(userId: string, walletId: string): Promise<void> { ... }
}
