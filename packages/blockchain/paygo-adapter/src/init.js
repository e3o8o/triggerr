"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.resetPayGoClient = exports.isPayGoClientInitialized = exports.initPayGoClientWithNewWallet = exports.initPayGoClient = exports.getPayGoClient = void 0;
const client_1 = __importDefault(require("./client"));
// Global singleton instance of the PayGo client service.
// It starts as null and will be initialized on the first use to avoid SSR issues.
let paygoClientService = null;
/**
 * Lazily gets the initialized PayGo client service instance.
 *
 * On the first call, it initializes the client using the PAYGO_ADMIN_PK
 * from the environment variables. On subsequent calls, it returns the
 * existing singleton instance. This "just-in-time" initialization avoids
 * server-side rendering (SSR) issues with WebAssembly (WASM) modules.
 *
 * @returns {Promise<PayGoClientService>} A promise that resolves to the initialized PayGo client service.
 * @throws {Error} If the PAYGO_ADMIN_PK environment variable is not set or if initialization fails.
 */
async function getPayGoClient() {
    // If the client is already initialized, return it immediately.
    if (paygoClientService) {
        return paygoClientService;
    }
    console.log('[PayGo Adapter] JIT Initialization: Client not ready, initializing now...');
    // Ensure the admin private key is available in the environment.
    const adminPk = process.env.PAYGO_ADMIN_PK;
    if (!adminPk) {
        throw new Error('[PayGo Adapter] Critical Error: PAYGO_ADMIN_PK environment variable is not set.');
    }
    // Initialize the service, handle potential errors, and assign to the singleton variable.
    try {
        // This instantiation can fail if the WASM bindings do not load correctly.
        paygoClientService = new client_1.default(adminPk);
        console.log('[PayGo Adapter] JIT Initialization: Client service initialized successfully.');
        return paygoClientService;
    }
    catch (error) {
        console.error('[PayGo Adapter] JIT Initialization: Failed to initialize client service:', error);
        throw new Error(`Failed to initialize PayGo client: ${error instanceof Error ? error.message : String(error)}`);
    }
}
exports.getPayGoClient = getPayGoClient;
/**
 * Explicitly initializes the PayGo client service with a provided private key.
 * This is useful for testing or specific scenarios where lazy initialization is not desired.
 *
 * @param {Hex} privateKey - The private key to use for the PayGo client.
 * @returns {Promise<PayGoClientService>} The initialized PayGo client service.
 * @throws {Error} If the client is already initialized.
 */
async function initPayGoClient(privateKey) {
    if (paygoClientService) {
        throw new Error('PayGo client is already initialized. Use resetPayGoClient() first if this is intentional.');
    }
    try {
        paygoClientService = new client_1.default(privateKey);
        console.log('[PayGo Adapter] Explicit Initialization: Client service initialized successfully.');
        return paygoClientService;
    }
    catch (error) {
        console.error('[PayGo Adapter] Explicit Initialization: Failed to initialize client service:', error);
        throw new Error(`Failed to explicitly initialize PayGo client: ${error instanceof Error ? error.message : String(error)}`);
    }
}
exports.initPayGoClient = initPayGoClient;
/**
 * Initializes the PayGo client service with a newly generated wallet.
 * Primarily intended for testing or initial setup scripts.
 *
 * @returns {Promise<{ client: PayGoClientService; privateKey: Hex; address: string }>}
 * @throws {Error} If the client is already initialized.
 */
async function initPayGoClientWithNewWallet() {
    if (paygoClientService) {
        throw new Error('PayGo client is already initialized.');
    }
    try {
        const { client, privateKey, address } = await client_1.default.createWithNewWallet();
        paygoClientService = client;
        console.log('[PayGo Adapter] Client service initialized with new wallet.');
        return { client, privateKey, address };
    }
    catch (error) {
        console.error('[PayGo Adapter] Failed to initialize client service with new wallet:', error);
        throw new Error(`Failed to initialize PayGo client with new wallet: ${error instanceof Error ? error.message : String(error)}`);
    }
}
exports.initPayGoClientWithNewWallet = initPayGoClientWithNewWallet;
/**
 * Checks if the PayGo client has been initialized.
 *
 * @returns {boolean} True if the client is initialized, false otherwise.
 */
function isPayGoClientInitialized() {
    return paygoClientService !== null;
}
exports.isPayGoClientInitialized = isPayGoClientInitialized;
/**
 * Resets the PayGo client service singleton.
 * This is primarily intended for use in testing environments to ensure
 * a clean state between tests.
 */
function resetPayGoClient() {
    paygoClientService = null;
    console.log('[PayGo Adapter] Client service has been reset.');
}
exports.resetPayGoClient = resetPayGoClient;
//# sourceMappingURL=init.js.map