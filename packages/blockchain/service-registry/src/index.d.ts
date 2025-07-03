/**
 * @file Implements the BlockchainServiceRegistry for managing multiple blockchain adapters.
 *
 * This file contains the core logic for our multi-chain architecture. The registry
 * is instantiated once at application startup. It creates and holds an instance of
 * every available blockchain client, making them accessible to the rest of the
 * application through a generic interface.
 */
import { IBlockchainService, BlockchainProviderName } from "@triggerr/blockchain-interface";
/**
 * A runtime registry for managing and providing access to multiple,
 * concurrent blockchain service adapters.
 */
export declare class BlockchainServiceRegistry {
    private services;
    /**
     * Initializes the registry and instantiates all available blockchain clients.
     * This should be created as a singleton instance when the application starts.
     */
    constructor();
    /**
     * Gets a specific, initialized blockchain service by its provider name.
     * This is the primary method that our business logic services will use.
     *
     * @param providerName The name of the blockchain provider to retrieve.
     * @returns The service instance that implements IBlockchainService.
     * @throws If no service is registered for the given provider name.
     */
    get(providerName: BlockchainProviderName): IBlockchainService;
    /**
     * Checks if a service for a given provider is available in the registry.
     * @param providerName The name of the blockchain provider to check.
     * @returns True if the service is available, false otherwise.
     */
    isSupported(providerName: BlockchainProviderName): boolean;
    /**
     * Returns a list of all supported blockchain provider names.
     * @returns An array of available provider names.
     */
    getSupportedProviders(): BlockchainProviderName[];
}
//# sourceMappingURL=index.d.ts.map