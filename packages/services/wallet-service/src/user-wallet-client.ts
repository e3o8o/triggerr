import { PayGoClientService } from '@triggerr/paygo-adapter';
import type { Hex } from 'viem';

/**
 * A request-scoped service to perform operations on behalf of a specific user
 * using their private key.
 *
 * This service is designed to be instantiated for a single API request,
 * perform an action, and then be discarded. It is NOT a singleton. This pattern
 * ensures that user-specific actions (e.g., sending funds) are signed with the
 * correct key without interfering with the system-wide admin client.
 */
export class UserWalletClientService {
  private userClient: PayGoClientService;

  /**
   * Creates an instance of the UserWalletClientService.
   *
   * @param {Hex} userPrivateKey The decrypted private key of the user for whom the operation is being performed.
   */
  constructor(userPrivateKey: Hex) {
    // Each instance gets its own, separate PayGoClientService, configured with the user's key.
    this.userClient = new PayGoClientService(userPrivateKey);
    console.log('[UserWalletClientService] Created a new temporary client for a user operation.');
  }

  /**
   * Gets the underlying PayGoClientService instance configured with the user's key.
   * This allows access to all methods of the core service (e.g., getAccount).
   *
   * @returns {PayGoClientService} The user-specific client service.
   */
  public getClient(): PayGoClientService {
    return this.userClient;
  }

  /**
   * A convenience method to sign and post a transaction using the user's key.
   * This is the primary method that will be used by other services (like the main WalletService)
   * to perform actions such as transferring funds.
   *
   * @param {any} params - The transaction parameters to be signed and posted.
   * @returns {Promise<any>} The result of the transaction from the PayGo network.
   */
  public async signAndPostTransaction(params: any): Promise<any> {
    // The private key is already set in the constructor via the PayGoClientService,
    // so we can call this method directly and securely.
    return await this.userClient.signAndPostTransactionFromParams(params);
  }
}
