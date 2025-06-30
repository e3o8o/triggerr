import {
  describe,
  it,
  expect,
  beforeEach,
  afterEach,
  spyOn,
  mock,
} from "bun:test";

// Set up required environment variables for testing
process.env.ENCRYPTION_KEY =
  "c369963f5443598e3e7c5fe613c608167e3b4b931840b3ad452bc39f780e56a7";

// Import centralized PayGo adapter mock
import {
  paygoAdapterMock,
  resetAllPayGoMocks,
} from "./__mocks__/paygo-adapter.mock";

// Mock the PayGo adapter module
mock.module("@triggerr/paygo-adapter", () => paygoAdapterMock);

// Import services after mocking
import { WalletService } from "../wallet-service";

// Simple test without complex mocking
describe("WalletService - Basic Tests", () => {
  let walletService: WalletService;

  beforeEach(() => {
    // Reset all PayGo mocks
    resetAllPayGoMocks();

    // Mock console to reduce noise
    spyOn(console, "log").mockImplementation(() => {});

    // Set up default mock behavior for basic tests
    paygoAdapterMock._internal.mockPayGoClientInstance.getAccount.mockResolvedValue(
      {
        balance: BigInt(1000),
        nonce: BigInt(1),
      },
    );

    paygoAdapterMock._internal.mockPayGoClientInstance.signAndPostTransactionFromParams.mockResolvedValue(
      {
        success: true,
        hash: "0xmock_transaction_hash",
      },
    );
  });

  afterEach(() => {
    // Clean up is handled by resetAllPayGoMocks in beforeEach
  });

  describe("constructor", () => {
    it("should create a WalletService instance", () => {
      walletService = new WalletService();
      expect(walletService).toBeDefined();
      expect(walletService instanceof WalletService).toBe(true);
    });

    it("should create service with default dependencies when none provided", () => {
      const service = new WalletService();
      expect(service).toBeDefined();
    });
  });

  describe("basic functionality", () => {
    beforeEach(() => {
      walletService = new WalletService();
    });

    it("should have createWallet method", () => {
      expect(typeof walletService.createWallet).toBe("function");
    });

    it("should have getAccountBalance method", () => {
      expect(typeof walletService.getAccountBalance).toBe("function");
    });

    it("should have getDecryptedPrivateKey method", () => {
      expect(typeof walletService.getDecryptedPrivateKey).toBe("function");
    });

    it("should have transferFunds method", () => {
      expect(typeof walletService.transferFunds).toBe("function");
    });

    it("should have requestFaucetFunds method", () => {
      expect(typeof walletService.requestFaucetFunds).toBe("function");
    });
  });

  describe("service instantiation", () => {
    it("should instantiate without throwing errors", () => {
      expect(() => {
        const service = new WalletService();
        expect(service).toBeDefined();
      }).not.toThrow();
    });

    it("should have all required methods available", () => {
      const service = new WalletService();
      const methods = [
        "createWallet",
        "getAccountBalance",
        "getDecryptedPrivateKey",
        "transferFunds",
        "requestFaucetFunds",
      ];

      methods.forEach((method) => {
        expect(typeof service[method as keyof WalletService]).toBe("function");
      });
    });
  });

  describe("error handling", () => {
    beforeEach(() => {
      walletService = new WalletService();
    });

    it("should handle invalid wallet address in getDecryptedPrivateKey", async () => {
      const invalidAddress = "invalid_address";
      const userId = "test-user";

      await expect(
        walletService.getDecryptedPrivateKey(userId, invalidAddress as any),
      ).rejects.toThrow();
    });

    it("should handle service method calls without crashing", async () => {
      const mockAddress = "0x1234567890123456789012345678901234567890";

      // This should not crash, even if it throws an error
      try {
        await walletService.getAccountBalance(mockAddress as any, "PAYGO");
      } catch (error) {
        // Expected to potentially throw, but shouldn't crash the test runner
        expect(error).toBeDefined();
      }
    });
  });

  describe("mock integration", () => {
    beforeEach(() => {
      walletService = new WalletService();
    });

    it("should use mocked PayGo adapter functions", () => {
      // Verify that our mocks are properly set up
      expect(paygoAdapterMock._internal.mockPayGoClientInstance).toBeDefined();
      expect(paygoAdapterMock._internal.mockConvertToPayGoAmount).toBeDefined();
      expect(
        paygoAdapterMock._internal.mockConvertFromPayGoAmount,
      ).toBeDefined();
    });

    it("should have access to internal mocks for testing", () => {
      // Verify we can access internal mock utilities
      expect(paygoAdapterMock._internal.mockGenerateNewWallet).toBeDefined();
      expect(paygoAdapterMock._internal.MockTransfer).toBeDefined();
      expect(paygoAdapterMock._internal.MockCreateEscrow).toBeDefined();
    });
  });
});
