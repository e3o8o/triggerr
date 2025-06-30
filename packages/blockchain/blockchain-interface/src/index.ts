/**
 * @file Main entry point for the @triggerr/blockchain-interface package.
 *
 * This file serves as the public API for the blockchain abstraction layer.
 * It exports all the necessary generic models and the central IBlockchainService
 * interface, providing a single, consistent import source for the rest of the
 * application.
 *
 * By importing from this package, services like WalletService and EscrowEngine
 * remain completely decoupled from any specific blockchain implementation.
 */

// Export all the generic data models.
export * from './models';

// Export the master service interface.
export * from './service';
