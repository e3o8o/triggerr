import { describe, it, expect, beforeEach, mock } from "bun:test";
import { WalletService } from "../wallet-service";
import { UserWalletRepository } from "../repository";
import { EncryptionService } from "../encryption-service";
import { BlockchainServiceRegistry } from "@triggerr/service-registry";
import type {
  IBlockchainService,
  TransactionResult,
  TransactionStatus,
  BlockchainAccountInfo,
  BlockchainWallet,
  BlockchainProviderName,
  GenericEscrowParams,
} from "@triggerr/blockchain-interface";
import type { Hex } from "viem";

// --- Mocking Dependencies ---

// 1. Mock the IBlockchainService with proper types
const mockBlockchainService: IBlockchainService = {
  generateNewWallet: mock(
    async (): Promise<BlockchainWallet> => ({
      address: "0x1234567890abcdef1234567890abcdef12345678",
      privateKey: "0xprivkey123",
      chain: "PAYGO",
      walletType: "CUSTODIAL",
    }),
  ),
  getAccountInfo: mock(
    async (address: string): Promise<BlockchainAccountInfo> => ({
      balance: 50000n, // Represents 500.00
      nonce: 10,
    }),
  ),
  getTransactionStatus: mock(
    async (hash: string): Promise<TransactionStatus> => "success",
  ),
  createEscrow: mock(
    async (
      params: GenericEscrowParams,
      privateKey: string,
    ): Promise<TransactionResult> => ({
      hash: "0x_mock_hash",
      status: "success",
    }),
  ),
  fulfillEscrow: mock(
    async (
      escrowId: string,
      privateKey: string,
    ): Promise<TransactionResult> => ({
      hash: "0x_mock_hash",
      status: "success",
    }),
  ),
  releaseEscrow: mock(
    async (
      escrowId: string,
      privateKey: string,
    ): Promise<TransactionResult> => ({
      hash: "0x_mock_hash",
      status: "success",
    }),
  ),
  prepareCreateEscrowTransaction: mock(
    async (params: GenericEscrowParams): Promise<any> => ({
      escrowId: "mock-escrow-id",
      amount: params.amount,
    }),
  ),
  submitSignedTransaction: mock(
    async (signedTx: any): Promise<TransactionResult> => ({
      hash: "0x_mock_hash",
      status: "pending",
    }),
  ),
};

// 2. Mock the BlockchainServiceRegistry
const mockBlockchainRegistry = mock(() => ({
  get: mock((providerName: BlockchainProviderName) => mockBlockchainService),
  isSupported: mock((providerName: BlockchainProviderName) => true),
  getSupportedProviders: mock(() => ["PAYGO"]),
}));

// 3. Mock the UserWalletRepository
const mockRepository = mock(() => ({
  create: mock(async (walletData: any, tx?: any) => ({
    id: "wallet-id-123",
    userId: walletData.userId,
    address: walletData.address,
    chain: walletData.chain,
    walletType: walletData.walletType,
    encryptedSecret: walletData.encryptedSecret,
    kmsKeyId: walletData.kmsKeyId,
    isPrimary: walletData.isPrimary,
    createdAt: new Date(),
    updatedAt: new Date(),
  })),
  findByUserIdAndAddress: mock(async (userId: string, address: Hex) => ({
    id: "wallet-id-123",
    userId,
    address,
    chain: "PAYGO",
    walletType: "CUSTODIAL",
    encryptedSecret: "encrypted-secret",
    kmsKeyId: "kms-key-123",
    isPrimary: true,
  })),
}));

// 4. Mock the EncryptionService
const mockEncryptionService = mock(() => ({
  encrypt: mock((data: string) => "encrypted-" + data),
  decrypt: mock((encryptedData: string) =>
    encryptedData.replace("encrypted-", ""),
  ),
}));

// --- Test Suite ---

describe("WalletService", () => {
  let walletService: WalletService;
  let blockchainRegistry: BlockchainServiceRegistry;
  let repository: UserWalletRepository;
  let encryptionService: EncryptionService;

  beforeEach(() => {
    // Reset all mocks
    mock.restore();

    // Create mock instances
    blockchainRegistry = mockBlockchainRegistry() as any;
    repository = mockRepository() as any;
    encryptionService = mockEncryptionService() as any;

    // Create WalletService instance with mocked dependencies
    walletService = new WalletService(
      blockchainRegistry,
      repository,
      encryptionService,
    );
  });

  describe("createCustodialWallet", () => {
    it("should create a new custodial wallet successfully", async () => {
      const userId = "user-123";
      const chain: BlockchainProviderName = "PAYGO";

      const result = await walletService.createWallet(userId, chain);

      expect(result).toMatchObject({
        internalWalletId: "wallet-id-123",
        address: "0x1234567890abcdef1234567890abcdef12345678",
      });

      // Verify that the blockchain service was called
      expect(mockBlockchainService.generateNewWallet).toHaveBeenCalled();

      // Verify that the repository was called with correct data
      expect(repository.create).toHaveBeenCalledWith(
        {
          userId,
          chain,
          walletType: "CUSTODIAL",
          address: "0x1234567890abcdef1234567890abcdef12345678",
          encryptedSecret: "encrypted-0xprivkey123",
          kmsKeyId: "system-managed-encryption",
          isPrimary: true,
        },
        undefined,
      );
    });
  });

  describe("linkExistingWallet", () => {
    it("should link an existing non-custodial wallet", async () => {
      const params = {
        userId: "user-123",
        address: "0xabcdef1234567890abcdef1234567890abcdef12",
        chain: "PAYGO" as BlockchainProviderName,
        publicKey: "0xpubkey123",
      };

      const result = await walletService.linkExistingWallet(params);

      expect(result).toMatchObject({
        id: "wallet-id-123",
        userId: params.userId,
        address: params.address,
        chain: params.chain,
        walletType: "NON_CUSTODIAL",
      });

      expect(repository.create).toHaveBeenCalledWith({
        userId: params.userId,
        address: params.address,
        chain: params.chain,
        walletType: "NON_CUSTODIAL",
        publicKey: params.publicKey,
        encryptedSecret: "",
        kmsKeyId: "",
        isPrimary: false,
      });
    });
  });

  describe("getAccountBalance", () => {
    it("should get account balance for a given address and chain", async () => {
      const mockAddress = "0x1234567890abcdef1234567890abcdef12345678" as Hex;
      const chain: BlockchainProviderName = "PAYGO";

      const result = await walletService.getAccountBalance(mockAddress, chain);

      expect(result).toEqual({
        balance: "50000",
        nonce: "10",
      });

      expect(blockchainRegistry.get).toHaveBeenCalledWith(chain);
      expect(mockBlockchainService.getAccountInfo).toHaveBeenCalledWith(
        mockAddress,
      );
    });
  });

  describe("getDecryptedPrivateKey", () => {
    it("should decrypt and return private key for custodial wallet", async () => {
      const userId = "user-123";
      const walletAddress = "0x1234567890abcdef1234567890abcdef12345678" as Hex;

      const result = await walletService.getDecryptedPrivateKey(
        userId,
        walletAddress,
      );

      expect(result).toBe("secret" as Hex);
      expect(repository.findByUserIdAndAddress).toHaveBeenCalledWith(
        userId,
        walletAddress,
      );
      expect(encryptionService.decrypt).toHaveBeenCalledWith(
        "encrypted-secret",
      );
    });

    it("should throw error if wallet not found", async () => {
      // Mock repository to return null
      (repository.findByUserIdAndAddress as any).mockResolvedValueOnce(null);

      const userId = "user-123";
      const walletAddress = "0x1234567890abcdef1234567890abcdef12345678" as Hex;

      await expect(
        walletService.getDecryptedPrivateKey(userId, walletAddress),
      ).rejects.toThrow("Custodial wallet with address");
    });
  });

  describe("transferFunds", () => {
    it("should transfer funds between wallets", async () => {
      const userId = "user-123";
      const senderAddress = "0x1234567890abcdef1234567890abcdef12345678" as Hex;
      const recipientAddress =
        "0xabcdef1234567890abcdef1234567890abcdef12" as Hex;
      const amount = "10.50";

      const result = await walletService.transferFunds(
        userId,
        senderAddress,
        recipientAddress,
        amount,
      );

      // Since the method currently returns a mock result, we test for that
      expect(result).toEqual({
        hash: "0x_temp_transfer_hash",
        status: "pending",
      });

      expect(repository.findByUserIdAndAddress).toHaveBeenCalledWith(
        userId,
        senderAddress,
      );
      expect(encryptionService.decrypt).toHaveBeenCalled();
    });
  });

  describe("requestFaucetFunds", () => {
    it("should request faucet funds for a wallet", async () => {
      const userId = "user-123";
      const recipientAddress =
        "0x1234567890abcdef1234567890abcdef12345678" as Hex;
      const amount = "100.00";

      const result = await walletService.requestFaucetFunds(
        userId,
        recipientAddress,
        amount,
      );

      // Since the method currently returns a mock result, we test for that
      expect(result).toEqual({
        hash: "0x_temp_faucet_hash",
        status: "pending",
      });

      expect(repository.findByUserIdAndAddress).toHaveBeenCalledWith(
        userId,
        recipientAddress,
      );
      expect(encryptionService.decrypt).toHaveBeenCalled();
    });
  });
});
