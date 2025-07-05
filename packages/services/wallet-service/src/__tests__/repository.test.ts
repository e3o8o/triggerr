import {
  describe,
  it,
  expect,
  beforeEach,
  afterEach,
  mock,
  spyOn,
} from "bun:test";
import { UserWalletRepository, type NewWalletRecord } from "../repository";
import type { Hex } from "viem";

// Mock the external dependencies using Bun's mock system
const mockReturning = mock(() => Promise.resolve([mockCreatedWallet]));
const mockValues = mock(() => ({ returning: mockReturning }));
const mockInsert = mock(() => ({ values: mockValues }));

const mockFindFirst = mock(() => Promise.resolve(mockCreatedWallet));

const mockDb = {
  insert: mockInsert,
  query: {
    userWallets: {
      findFirst: mockFindFirst,
    },
  },
};

const mockEq = mock(() => "eq-condition");
const mockAnd = mock(() => "and-condition");

// Mock the modules
mock.module("@triggerr/core", () => ({
  Database: {
    db: mockDb,
  },
  Schema: {
    userWallets: {
      userId: "userId",
      address: "address",
    },
  },
}));

mock.module("drizzle-orm", () => ({
  eq: mockEq,
  and: mockAnd,
}));

const mockUserId = "user-123";
const mockWalletAddress = "0x1234567890123456789012345678901234567890" as Hex;
const mockEncryptedKey = "encrypted-private-key";
const mockKmsKeyId = "system-managed-encryption";
const mockWalletId = "wallet-internal-123";

const mockNewWalletRecord: NewWalletRecord = {
  userId: mockUserId,
  address: mockWalletAddress,
  encryptedSecret: mockEncryptedKey,
  kmsKeyId: mockKmsKeyId,
  chain: "PAYGO",
  walletType: "CUSTODIAL",
  walletName: "Primary Wallet",
  isPrimary: true,
};

const mockCreatedWallet = {
  id: mockWalletId,
  userId: mockUserId,
  address: mockWalletAddress,
  encryptedSecret: mockEncryptedKey,
  kmsKeyId: mockKmsKeyId,
  chain: "PAYGO",
  walletType: "CUSTODIAL",
  walletName: "Primary Wallet",
  isPrimary: true,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe("UserWalletRepository", () => {
  let repository: UserWalletRepository;

  beforeEach(() => {
    // Clear all mock call history
    mockInsert.mockClear();
    mockValues.mockClear();
    mockReturning.mockClear();
    mockFindFirst.mockClear();
    mockEq.mockClear();
    mockAnd.mockClear();

    repository = new UserWalletRepository();

    // Mock console to reduce noise
    spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    mock.restore();
  });

  describe("create", () => {
    it("should create a new wallet record successfully", async () => {
      mockReturning.mockResolvedValue([mockCreatedWallet]);

      const result = await repository.create(mockNewWalletRecord);

      expect(mockInsert).toHaveBeenCalled();
      expect(mockValues).toHaveBeenCalledWith({
        userId: mockUserId,
        address: mockWalletAddress,
        encryptedSecret: mockEncryptedKey,
        kmsKeyId: mockKmsKeyId,
        chain: "PAYGO",
        walletType: "CUSTODIAL",
        walletName: "Primary Wallet",
        isPrimary: true,
      });
      expect(mockReturning).toHaveBeenCalled();
      expect(result).toEqual(mockCreatedWallet);
    });

    it("should create a wallet with minimal data", async () => {
      const minimalWalletRecord = {
        userId: mockUserId,
        address: mockWalletAddress,
        encryptedSecret: mockEncryptedKey,
        kmsKeyId: mockKmsKeyId,
        chain: "PAYGO",
        walletType: "CUSTODIAL",
      };
      mockReturning.mockResolvedValue([mockCreatedWallet]);

      const result = await repository.create(minimalWalletRecord);

      expect(mockValues).toHaveBeenCalledWith({
        userId: mockUserId,
        address: mockWalletAddress,
        encryptedSecret: mockEncryptedKey,
        kmsKeyId: mockKmsKeyId,
        chain: "PAYGO",
        walletType: "CUSTODIAL",
        walletName: undefined,
        isPrimary: undefined,
      });
      expect(result).toEqual(mockCreatedWallet);
    });

    it("should handle database insertion errors", async () => {
      const error = new Error("Database insertion failed");
      mockReturning.mockRejectedValue(error);

      await expect(repository.create(mockNewWalletRecord)).rejects.toThrow(
        error,
      );
    });
  });

  describe("findByUserIdAndAddress", () => {
    it("should find a wallet successfully", async () => {
      mockFindFirst.mockResolvedValue(mockCreatedWallet);

      const result = await repository.findByUserIdAndAddress(
        mockUserId,
        mockWalletAddress,
      );

      expect(mockFindFirst).toHaveBeenCalledWith({
        where: "and-condition",
      });
      expect(mockEq).toHaveBeenCalledTimes(2);
      expect(mockAnd).toHaveBeenCalled();
      expect(result).toEqual(mockCreatedWallet);
    });

    it("should return null when wallet is not found", async () => {
      mockFindFirst.mockResolvedValue(undefined as any);

      const result = await repository.findByUserIdAndAddress(
        mockUserId,
        mockWalletAddress,
      );

      expect(result).toBeNull();
    });

    it("should handle database query errors", async () => {
      const error = new Error("Database query failed");
      mockFindFirst.mockRejectedValue(error);

      await expect(
        repository.findByUserIdAndAddress(mockUserId, mockWalletAddress),
      ).rejects.toThrow(error);
    });
  });
});
