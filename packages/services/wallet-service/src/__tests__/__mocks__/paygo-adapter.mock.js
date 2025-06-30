import { mock } from "bun:test";
// Create mock PayGo client instance
const mockPayGoClientInstance = {
    getAccount: mock(() => Promise.resolve({
        balance: BigInt(10000),
        nonce: BigInt(5),
    })),
    signAndPostTransactionFromParams: mock(() => Promise.resolve({
        success: true,
        hash: "0xmock_transaction_hash",
    })),
    setPk: mock(() => { }),
};
// Mock static methods
const mockGenerateNewWallet = mock(() => Promise.resolve({
    privateKey: "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890",
    address: "0x1234567890123456789012345678901234567890",
}));
const mockCreateWithNewWallet = mock(() => Promise.resolve({
    client: mockPayGoClientInstance,
    privateKey: "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890",
    address: "0x1234567890123456789012345678901234567890",
}));
// Mock PayGoClientService class with static methods
const MockPayGoClientService = Object.assign(mock().mockImplementation(() => mockPayGoClientInstance), {
    generateNewWallet: mockGenerateNewWallet,
    createWithNewWallet: mockCreateWithNewWallet,
});
// Mock utility functions
const mockConvertToPayGoAmount = mock((amount) => {
    const numericAmount = parseFloat(amount);
    return BigInt(Math.floor(numericAmount * 100)); // Convert to cents-like representation
});
const mockConvertFromPayGoAmount = mock((amount) => {
    return (Number(amount) / 100).toFixed(2); // Convert back to decimal string
});
const mockSafePayGoCall = mock(async (call, errorMessage) => {
    try {
        const data = await call();
        return { success: true, data };
    }
    catch (error) {
        console.error(`[PayGo Adapter Error] ${errorMessage}:`, error);
        return {
            success: false,
            error: error instanceof Error ? error.message : String(error),
        };
    }
});
// Mock transaction classes
const MockTransfer = mock().mockImplementation((recipient, amount) => ({
    recipient,
    amount,
    type: "Transfer",
}));
const MockCreateEscrow = mock().mockImplementation((params) => ({
    ...params,
    type: "CreateEscrow",
}));
const MockFulfillEscrow = mock().mockImplementation((params) => ({
    ...params,
    type: "FulfillEscrow",
}));
const MockReleaseEscrow = mock().mockImplementation((params) => ({
    ...params,
    type: "ReleaseEscrow",
}));
const MockFaucetRequest = mock().mockImplementation((amount) => ({
    amount,
    type: "FaucetRequest",
}));
// Mock PaygoClient class
const MockPaygoClient = {
    Transfer: MockTransfer,
    CreateEscrow: MockCreateEscrow,
    FulfillEscrow: MockFulfillEscrow,
    ReleaseEscrow: MockReleaseEscrow,
    FaucetRequest: MockFaucetRequest,
};
// Mock initialization functions
const mockGetPayGoClient = mock(() => Promise.resolve(mockPayGoClientInstance));
const mockInitPayGoClient = mock((privateKey) => Promise.resolve(mockPayGoClientInstance));
const mockInitPayGoClientWithNewWallet = mock(() => Promise.resolve({
    client: mockPayGoClientInstance,
    privateKey: "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890",
    address: "0x1234567890123456789012345678901234567890",
}));
const mockIsPayGoClientInitialized = mock(() => true);
const mockResetPayGoClient = mock(() => { });
// Export the complete mock module
export const paygoAdapterMock = {
    // Classes
    PayGoClientService: MockPayGoClientService,
    PaygoClient: MockPaygoClient,
    Transfer: MockTransfer,
    CreateEscrow: MockCreateEscrow,
    FulfillEscrow: MockFulfillEscrow,
    ReleaseEscrow: MockReleaseEscrow,
    FaucetRequest: MockFaucetRequest,
    // Utility functions
    safePayGoCall: mockSafePayGoCall,
    convertToPayGoAmount: mockConvertToPayGoAmount,
    convertFromPayGoAmount: mockConvertFromPayGoAmount,
    // Initialization functions
    initPayGoClient: mockInitPayGoClient,
    initPayGoClientWithNewWallet: mockInitPayGoClientWithNewWallet,
    getPayGoClient: mockGetPayGoClient,
    isPayGoClientInitialized: mockIsPayGoClientInitialized,
    resetPayGoClient: mockResetPayGoClient,
    // Internal mocks for test access
    _internal: {
        mockPayGoClientInstance,
        mockConvertToPayGoAmount,
        mockConvertFromPayGoAmount,
        mockSafePayGoCall,
        mockGetPayGoClient,
        mockInitPayGoClient,
        mockInitPayGoClientWithNewWallet,
        mockIsPayGoClientInitialized,
        mockResetPayGoClient,
        mockGenerateNewWallet,
        mockCreateWithNewWallet,
        MockTransfer,
        MockCreateEscrow,
        MockFulfillEscrow,
        MockReleaseEscrow,
        MockFaucetRequest,
    },
};
// Helper function to reset all mocks
export function resetAllPayGoMocks() {
    // Reset instance methods
    mockPayGoClientInstance.getAccount.mockClear();
    mockPayGoClientInstance.signAndPostTransactionFromParams.mockClear();
    mockPayGoClientInstance.setPk.mockClear();
    // Reset static methods
    mockGenerateNewWallet.mockClear();
    mockCreateWithNewWallet.mockClear();
    MockPayGoClientService.mockClear();
    // Reset utility functions
    mockConvertToPayGoAmount.mockClear();
    mockConvertFromPayGoAmount.mockClear();
    mockSafePayGoCall.mockClear();
    // Reset initialization functions
    mockGetPayGoClient.mockClear();
    mockInitPayGoClient.mockClear();
    mockInitPayGoClientWithNewWallet.mockClear();
    mockIsPayGoClientInitialized.mockClear();
    mockResetPayGoClient.mockClear();
    // Reset transaction classes
    MockTransfer.mockClear();
    MockCreateEscrow.mockClear();
    MockFulfillEscrow.mockClear();
    MockReleaseEscrow.mockClear();
    MockFaucetRequest.mockClear();
}
