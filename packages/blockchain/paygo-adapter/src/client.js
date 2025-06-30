"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FaucetRequest = exports.ReleaseEscrow = exports.FulfillEscrow = exports.CreateEscrow = exports.Transfer = exports.PaygoClient = void 0;
const paygo_ts_client_1 = require("@witnessco/paygo-ts-client");
Object.defineProperty(exports, "PaygoClient", { enumerable: true, get: function () { return paygo_ts_client_1.PaygoClient; } });
Object.defineProperty(exports, "Transfer", { enumerable: true, get: function () { return paygo_ts_client_1.Transfer; } });
Object.defineProperty(exports, "CreateEscrow", { enumerable: true, get: function () { return paygo_ts_client_1.CreateEscrow; } });
Object.defineProperty(exports, "FulfillEscrow", { enumerable: true, get: function () { return paygo_ts_client_1.FulfillEscrow; } });
Object.defineProperty(exports, "ReleaseEscrow", { enumerable: true, get: function () { return paygo_ts_client_1.ReleaseEscrow; } });
Object.defineProperty(exports, "FaucetRequest", { enumerable: true, get: function () { return paygo_ts_client_1.FaucetRequest; } });
const accounts_1 = require("viem/accounts");
/**
 * A service to manage the PayGo client instance.
 * This provides a clean interface for interacting with the PayGo network.
 */
class PayGoClientService {
    /**
     * Creates a new instance of the PayGo client service.
     * Optionally initializes with a private key.
     * @param {Hex} [privateKey] - Optional private key to initialize the client with.
     */
    constructor(privateKey) {
        this._privateKey = null;
        this.client = new paygo_ts_client_1.PaygoClient();
        if (privateKey) {
            this.setPk(privateKey).catch(console.error);
        }
    }
    /**
     * Sets the private key for the client instance.
     * @param {Hex} privateKey - The private key to use for signing transactions.
     * @returns {Promise<void>}
     */
    async setPk(privateKey) {
        this._privateKey = privateKey;
        await this.client.setPk(privateKey);
    }
    /**
     * Gets the PayGo client instance.
     * @returns {PaygoClient} The underlying PaygoClient instance.
     */
    getClient() {
        return this.client;
    }
    /**
     * Gets the current private key (if set).
     * @returns {Hex | null} The current private key or null if not set.
     */
    getPrivateKey() {
        return this._privateKey;
    }
    /**
     * Gets account information for a given address.
     * @param {Hex} address - The address to query.
     * @returns {Promise<any>} A promise that resolves with the account information.
     */
    async getAccount(address) {
        return await this.client.getAccount(address);
    }
    /**
     * Gets the address associated with the current private key.
     * @returns {Promise<string>} A promise that resolves with the address.
     */
    async getAddress() {
        return await this.client.address();
    }
    /**
     * Signs and posts a transaction to the PayGo network.
     * @param {any} params - The transaction parameters.
     * @returns {Promise<any>} A promise that resolves with the transaction response.
     */
    async signAndPostTransactionFromParams(params) {
        if (!this._privateKey) {
            throw new Error("Private key not set. Call setPk() first.");
        }
        return await this.client.signAndPostTransactionFromParams(params);
    }
    /**
     * Generates a new PayGo wallet (private key and address).
     * @returns {Promise<{ privateKey: Hex; address: Hex }>} A promise that resolves with the new wallet's private key and address.
     */
    static async generateNewWallet() {
        const privateKey = (0, accounts_1.generatePrivateKey)();
        const account = (0, accounts_1.privateKeyToAccount)(privateKey);
        const address = account.address;
        return { privateKey, address };
    }
    /**
     * Creates a new PayGo client instance with a newly generated wallet.
     * @returns {Promise<{ client: PayGoClientService; privateKey: Hex; address: string }>}
     */
    static async createWithNewWallet() {
        const { privateKey, address } = await PayGoClientService.generateNewWallet();
        const client = new PayGoClientService(privateKey);
        return { client, privateKey, address };
    }
}
exports.default = PayGoClientService;
//# sourceMappingURL=client.js.map