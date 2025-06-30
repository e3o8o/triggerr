import PayGoClientService from './client';
import type { Hex } from 'viem';
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
export declare function getPayGoClient(): Promise<PayGoClientService>;
/**
 * Explicitly initializes the PayGo client service with a provided private key.
 * This is useful for testing or specific scenarios where lazy initialization is not desired.
 *
 * @param {Hex} privateKey - The private key to use for the PayGo client.
 * @returns {Promise<PayGoClientService>} The initialized PayGo client service.
 * @throws {Error} If the client is already initialized.
 */
export declare function initPayGoClient(privateKey: Hex): Promise<PayGoClientService>;
/**
 * Initializes the PayGo client service with a newly generated wallet.
 * Primarily intended for testing or initial setup scripts.
 *
 * @returns {Promise<{ client: PayGoClientService; privateKey: Hex; address: string }>}
 * @throws {Error} If the client is already initialized.
 */
export declare function initPayGoClientWithNewWallet(): Promise<{
    client: PayGoClientService;
    privateKey: `0x${string}`;
    address: string;
}>;
/**
 * Checks if the PayGo client has been initialized.
 *
 * @returns {boolean} True if the client is initialized, false otherwise.
 */
export declare function isPayGoClientInitialized(): boolean;
/**
 * Resets the PayGo client service singleton.
 * This is primarily intended for use in testing environments to ensure
 * a clean state between tests.
 */
export declare function resetPayGoClient(): void;
