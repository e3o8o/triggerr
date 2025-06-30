import { PaygoClient, Transfer, CreateEscrow, FulfillEscrow, ReleaseEscrow, FaucetRequest } from "@witnessco/paygo-ts-client";
import type { Hex } from "viem";
/**
 * A service to manage the PayGo client instance.
 * This provides a clean interface for interacting with the PayGo network.
 */
declare class PayGoClientService {
    private client;
    private _privateKey;
    /**
     * Creates a new instance of the PayGo client service.
     * Optionally initializes with a private key.
     * @param {Hex} [privateKey] - Optional private key to initialize the client with.
     */
    constructor(privateKey?: Hex);
    /**
     * Sets the private key for the client instance.
     * @param {Hex} privateKey - The private key to use for signing transactions.
     * @returns {Promise<void>}
     */
    setPk(privateKey: Hex): Promise<void>;
    /**
     * Gets the PayGo client instance.
     * @returns {PaygoClient} The underlying PaygoClient instance.
     */
    getClient(): PaygoClient;
    /**
     * Gets the current private key (if set).
     * @returns {Hex | null} The current private key or null if not set.
     */
    getPrivateKey(): Hex | null;
    /**
     * Gets account information for a given address.
     * @param {Hex} address - The address to query.
     * @returns {Promise<any>} A promise that resolves with the account information.
     */
    getAccount(address: Hex): Promise<any>;
    /**
     * Gets the address associated with the current private key.
     * @returns {Promise<string>} A promise that resolves with the address.
     */
    address(): Promise<`0x${string}`>;
    /**
     * Signs and posts a transaction to the PayGo network.
     * @param {any} params - The transaction parameters.
     * @returns {Promise<any>} A promise that resolves with the transaction response.
     */
    signAndPostTransactionFromParams(params: any): Promise<any>;
    /**
     * Generates a new PayGo wallet (private key and address).
     * @returns {Promise<{ privateKey: Hex; address: Hex }>} A promise that resolves with the new wallet's private key and address.
     */
    static generateNewWallet(): Promise<{
        privateKey: Hex;
        address: Hex;
    }>;
    /**
     * Creates a new PayGo client instance with a newly generated wallet.
     * @returns {Promise<{ client: PayGoClientService; privateKey: Hex; address: string }>}
     */
    static createWithNewWallet(): Promise<{
        client: PayGoClientService;
        privateKey: Hex;
        address: string;
    }>;
}
export default PayGoClientService;
export { PaygoClient, Transfer, CreateEscrow, FulfillEscrow, ReleaseEscrow, FaucetRequest, };
