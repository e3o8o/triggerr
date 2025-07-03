/**
 * @file Implements the BlockchainServiceRegistry for managing multiple blockchain adapters.
 *
 * This file contains the core logic for our multi-chain architecture. The registry
 * is instantiated once at application startup. It creates and holds an instance of
 * every available blockchain client, making them accessible to the rest of the
 * application through a generic interface.
 */
import { PayGoClientService } from "@triggerr/paygo-adapter";
// Note: When we create a Solana adapter, we will import it here.
// import { SolanaClientService } from "@triggerr/solana-adapter";
/**
 * A runtime registry for managing and providing access to multiple,
 * concurrent blockchain service adapters.
 */
export class BlockchainServiceRegistry {
    services;
    /**
     * Initializes the registry and instantiates all available blockchain clients.
     * This should be created as a singleton instance when the application starts.
     */
    constructor() {
        this.services = new Map();
        // Instantiate all available blockchain clients at startup.
        // Each concrete service must implement the IBlockchainService interface.
        this.services.set("PAYGO", new PayGoClientService());
        // this.services.set('SOLANA', new SolanaClientService());
        // this.services.set('ETHEREUM', new EthereumClientService());
        console.log(`✅ Blockchain Service Registry initialized with providers: [${Array.from(this.services.keys()).join(", ")}]`);
    }
    /**
     * Gets a specific, initialized blockchain service by its provider name.
     * This is the primary method that our business logic services will use.
     *
     * @param providerName The name of the blockchain provider to retrieve.
     * @returns The service instance that implements IBlockchainService.
     * @throws If no service is registered for the given provider name.
     */
    get(providerName) {
        const service = this.services.get(providerName);
        if (!service) {
            console.error(`❌ No blockchain service registered for provider: ${providerName}`);
            throw new Error(`Unsupported blockchain provider: ${providerName}. Ensure it is registered in the BlockchainServiceRegistry.`);
        }
        return service;
    }
    /**
     * Checks if a service for a given provider is available in the registry.
     * @param providerName The name of the blockchain provider to check.
     * @returns True if the service is available, false otherwise.
     */
    isSupported(providerName) {
        return this.services.has(providerName);
    }
    /**
     * Returns a list of all supported blockchain provider names.
     * @returns An array of available provider names.
     */
    getSupportedProviders() {
        return Array.from(this.services.keys());
    }
}
//# sourceMappingURL=index.js.map