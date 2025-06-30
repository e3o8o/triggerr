import { describe, it, expect, beforeEach, afterEach, mock } from "bun:test";
import PayGoClientService from "../client";
import {
  convertToPayGoAmount,
  convertFromPayGoAmount,
  safePayGoCall,
} from "../utils";
import type { Hex } from "viem";

// Import centralized PayGo adapter mock
import {
  paygoAdapterMock,
  resetAllPayGoMocks,
} from "./__mocks__/paygo-adapter.mock";

// Mock the PayGo adapter module
mock.module("@triggerr/paygo-adapter", () => paygoAdapterMock);

// Mock the PayGo client module
mock.module("@witnessco/paygo-ts-client", () => ({
  PaygoClient: mock(() => paygoAdapterMock._internal.mockPayGoClientInstance),
}));

mock.module("viem/accounts", () => ({
  generatePrivateKey: mock(
    () => "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
  ),
  privateKeyToAccount: mock(() => ({
    address: "0x9876543210fedcba9876543210fedcba98765432" as Hex,
  })),
}));

describe("PayGoClientService", () => {
  beforeEach(() => {
    // Clear singleton instance before each test
    (PayGoClientService as any).instance = null;

    // Reset all PayGo mocks
    resetAllPayGoMocks();
  });

  afterEach(() => {
    mock.restore();
  });

  describe("Client Operations", () => {
    let clientService: PayGoClientService;

    beforeEach(async () => {
      clientService = new PayGoClientService();
    });

    it("should get account information", async () => {
      const address = "0x1234567890abcdef1234567890abcdef12345678" as Hex;

      const result = await clientService.getAccount(address);

      expect(
        paygoAdapterMock._internal.mockPayGoClientInstance.getAccount,
      ).toHaveBeenCalledWith(address);
      expect(result).toEqual({
        balance: BigInt(10000),
        nonce: BigInt(5),
      });
    });

    it("should set private key", async () => {
      const privateKey =
        "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef";

      await clientService.setPk(privateKey);

      expect(
        paygoAdapterMock._internal.mockPayGoClientInstance.setPk,
      ).toHaveBeenCalledWith(privateKey);
    });

    it("should sign and post transaction", async () => {
      const params = { to: "0x123", amount: BigInt(1000) };

      // Set a private key first
      await clientService.setPk(
        "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
      );
      const result =
        await clientService.signAndPostTransactionFromParams(params);

      expect(
        paygoAdapterMock._internal.mockPayGoClientInstance
          .signAndPostTransactionFromParams,
      ).toHaveBeenCalledWith(params);
      expect(result).toEqual({
        success: true,
        hash: "0xmock_transaction_hash",
      });
    });
  });

  describe("Wallet Generation", () => {
    it("should generate a new wallet", async () => {
      const clientService = new PayGoClientService();
      const result = await clientService.generateNewWallet();

      // Check the structure of the returned wallet object
      expect(result).toHaveProperty("privateKey");
      expect(result).toHaveProperty("address");
      expect(result).toHaveProperty("chain", "PAYGO");
      expect(result).toHaveProperty("walletType", "CUSTODIAL");

      // Check the format of the credentials
      expect(result.privateKey).toMatch(/^0x[a-f0-9]{64}$/);
      expect(result.address).toMatch(/^0x[a-fA-F0-9]{40}$/);
    });
  });
});

describe("Utility Functions", () => {
  describe("convertToPayGoAmount", () => {
    it("should convert decimal string to PayGo bigint format", () => {
      expect(convertToPayGoAmount("1.00")).toBe(BigInt(100));
      expect(convertToPayGoAmount("10.50")).toBe(BigInt(1050));
      expect(convertToPayGoAmount("0.01")).toBe(BigInt(1));
      expect(convertToPayGoAmount("100")).toBe(BigInt(10000));
    });

    it("should handle zero amount", () => {
      expect(convertToPayGoAmount("0")).toBe(BigInt(0));
      expect(convertToPayGoAmount("0.00")).toBe(BigInt(0));
    });

    it("should handle large amounts", () => {
      expect(convertToPayGoAmount("1000000.99")).toBe(BigInt(100000099));
    });

    it("should return 0n for invalid or empty input and not throw for negative input", () => {
      expect(convertToPayGoAmount("invalid")).toBe(BigInt(0));
      expect(convertToPayGoAmount("")).toBe(BigInt(0));
      expect(convertToPayGoAmount("-10.00")).toBe(BigInt(-1000));
    });
  });

  describe("convertFromPayGoAmount", () => {
    it("should convert PayGo bigint to decimal string", () => {
      expect(convertFromPayGoAmount(BigInt(100))).toBe("1.00");
      expect(convertFromPayGoAmount(BigInt(1050))).toBe("10.50");
      expect(convertFromPayGoAmount(BigInt(1))).toBe("0.01");
      expect(convertFromPayGoAmount(BigInt(10000))).toBe("100.00");
    });

    it("should handle zero amount", () => {
      expect(convertFromPayGoAmount(BigInt(0))).toBe("0.00");
    });

    it("should handle large amounts", () => {
      expect(convertFromPayGoAmount(BigInt(100000099))).toBe("1000000.99");
    });

    it("should handle amounts less than 1 cent", () => {
      expect(convertFromPayGoAmount(BigInt(1))).toBe("0.01");
      expect(convertFromPayGoAmount(BigInt(0))).toBe("0.00");
    });
  });

  describe("safePayGoCall", () => {
    it("should return success result for successful calls", async () => {
      const successfulCall = () => Promise.resolve("success data");

      const result = await safePayGoCall(successfulCall, "Test operation");

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe("success data");
      }
    });

    it("should return error result for failed calls", async () => {
      const failedCall = () => Promise.reject(new Error("Test error"));

      const result = await safePayGoCall(failedCall, "Test operation");

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("Test error");
      }
    });

    it("should include custom error message", async () => {
      const failedCall = () => Promise.reject(new Error("Network timeout"));

      const result = await safePayGoCall(
        failedCall,
        "Fetching account balance",
      );

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("Fetching account balance");
        expect(result.error).toContain("Network timeout");
      }
    });

    it("should handle non-Error rejections", async () => {
      const failedCall = () => Promise.reject("String error");

      const result = await safePayGoCall(failedCall, "Test operation");

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Test operation: An unknown error occurred");
      }
    });

    it("should handle synchronous throws", async () => {
      const failedCall = () => {
        throw new Error("Sync error");
      };

      const result = await safePayGoCall(failedCall, "Test operation");

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("Sync error");
      }
    });
  });
});

describe("Amount Conversion Edge Cases", () => {
  it("should handle precision correctly", () => {
    // Test floating point precision issues
    const amount = "0.1";
    const paygoAmount = convertToPayGoAmount(amount);
    const backToDecimal = convertFromPayGoAmount(paygoAmount);

    expect(backToDecimal).toBe("0.10");
  });

  it("should handle maximum safe integer", () => {
    const maxSafeAmount = (Number.MAX_SAFE_INTEGER / 100).toString();
    const paygoAmount = convertToPayGoAmount(maxSafeAmount);
    const backToDecimal = convertFromPayGoAmount(paygoAmount);

    expect(parseFloat(backToDecimal)).toBeCloseTo(parseFloat(maxSafeAmount), 2);
  });

  it("should be consistent with round-trip conversions", () => {
    const testAmounts = ["0.01", "1.00", "10.50", "100.99", "1000.00"];

    for (const amount of testAmounts) {
      const paygoAmount = convertToPayGoAmount(amount);
      const backToDecimal = convertFromPayGoAmount(paygoAmount);

      expect(parseFloat(backToDecimal)).toBeCloseTo(parseFloat(amount), 2);
    }
  });
});

describe("Error Handling Integration", () => {
  let originalGetAccount: any;
  let originalSignAndPost: any;

  beforeEach(() => {
    // Store original implementations
    originalGetAccount =
      paygoAdapterMock._internal.mockPayGoClientInstance.getAccount;
    originalSignAndPost =
      paygoAdapterMock._internal.mockPayGoClientInstance
        .signAndPostTransactionFromParams;
  });

  afterEach(() => {
    // Restore original implementations after each test
    paygoAdapterMock._internal.mockPayGoClientInstance.getAccount =
      originalGetAccount;
    paygoAdapterMock._internal.mockPayGoClientInstance.signAndPostTransactionFromParams =
      originalSignAndPost;
  });

  it("should handle account fetch errors gracefully", async () => {
    paygoAdapterMock._internal.mockPayGoClientInstance.getAccount.mockImplementation(
      () => Promise.reject(new Error("Account not found")),
    );

    const clientService = new PayGoClientService();

    await expect(clientService.getAccount("0xinvalid" as Hex)).rejects.toThrow(
      "Account not found",
    );
  });

  it("should handle transaction errors gracefully", async () => {
    paygoAdapterMock._internal.mockPayGoClientInstance.signAndPostTransactionFromParams.mockImplementation(
      () => Promise.reject(new Error("Insufficient funds")),
    );

    const clientService = new PayGoClientService();
    // Set a private key first
    await clientService.setPk(
      "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
    );

    await expect(
      clientService.signAndPostTransactionFromParams({
        to: "0x123",
        amount: BigInt(1000),
      }),
    ).rejects.toThrow("Insufficient funds");
  });
});
