// ===========================================================================
// API SDK - WALLET SERVICE
// ===========================================================================

import type { ApiClient } from "../client";
import { convertToQueryParams } from "../utils";
import type {
  ApiResponse,
  UserWalletInfoResponse,
  WalletSendRequest,
  WalletSendResponse,
  TransactionHistoryRequest,
  TransactionHistoryResponse,
  FaucetRequest,
  UserFaucetResponse,
} from "@triggerr/api-contracts";

/**
 * Service class for interacting with the User Wallet API endpoints.
 * This includes fetching wallet information, sending funds, viewing transaction history,
 * and requesting funds from a faucet (for test/alpha environments).
 */
export class WalletService {
  private apiClient: ApiClient;
  // Base path for wallet endpoints, typically under a /user/ scope
  private readonly basePath = "/user/wallet";

  constructor(apiClient: ApiClient) {
    this.apiClient = apiClient;
  }

  /**
   * Retrieves detailed information for the authenticated user's primary wallet,
   * including balance and recent activity.
   *
   * @returns A promise that resolves to the API response containing the wallet information.
   * @throws {ApiClientError} If the API request fails.
   */
  public async getWalletInfo(): Promise<ApiResponse<UserWalletInfoResponse>> {
    return this.apiClient.get<UserWalletInfoResponse>(`${this.basePath}/info`);
  }

  /**
   * Initiates a transfer of funds from the authenticated user's PayGo custodial wallet
   * to a specified recipient address.
   *
   * @param request - The wallet send request payload.
   * @returns A promise that resolves to the API response confirming the fund transfer initiation.
   * @throws {ApiClientError} If the API request fails.
   */
  public async sendFunds(
    request: WalletSendRequest,
  ): Promise<ApiResponse<WalletSendResponse>> {
    return this.apiClient.post<WalletSendResponse, WalletSendRequest>(
      `${this.basePath}/send`,
      request,
    );
  }

  /**
   * Retrieves a paginated list of transactions for the authenticated user's wallet.
   *
   * @param params - Optional pagination and filtering parameters for the transaction history.
   * @returns A promise that resolves to the API response containing the transaction history.
   * @throws {ApiClientError} If the API request fails.
   */
  public async getTransactionHistory(
    params?: TransactionHistoryRequest,
  ): Promise<ApiResponse<TransactionHistoryResponse>> {
    return this.apiClient.get<TransactionHistoryResponse>(
      `${this.basePath}/transactions`,
      convertToQueryParams(params),
    );
  }

  /**
   * Allows authenticated users to request test funds for their PayGo custodial wallet.
   * This endpoint is typically available only in development or test environments and is rate-limited.
   *
   * @param request - Optional request payload, e.g., specifying an amount (if supported by faucet).
   * @returns A promise that resolves to the API response confirming the faucet request.
   * @throws {ApiClientError} If the API request fails or faucet is unavailable.
   */
  public async requestFaucetFunds(
    request?: FaucetRequest, // FaucetRequest might be empty or have optional amount
  ): Promise<ApiResponse<UserFaucetResponse>> {
    return this.apiClient.post<UserFaucetResponse, FaucetRequest | undefined>(
      `${this.basePath}/faucet`,
      request, // Body can be undefined if request is optional
    );
  }

  // Additional wallet-related methods can be added here, such as:
  // - getSpecificTransaction(transactionId: string): Promise<ApiResponse<WalletTransactionDto>>
  // - generateReceiveAddress(): Promise<ApiResponse<WalletReceiveResponseDto>> (if applicable)
  // - manageUserEscrows (if user-defined escrows are part of wallet service)
}
