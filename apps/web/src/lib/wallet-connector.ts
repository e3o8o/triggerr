/**
 * @file WalletConnector - A unified service for interacting with browser wallet extensions.
 *
 * This module is the frontend counterpart to our backend's multi-chain architecture.
 * Its primary responsibility is to abstract away the specific details of different
 * wallet extensions (like Phantom for Solana or MetaMask for EVM chains) and provide
 * a single, consistent API for our UI components to use.
 *
 * This decouples our React components from any specific wallet library, allowing us
 * to easily add support for new wallets or chains in the future by only modifying this file.
 */

import {
  BlockchainProviderName,
  BlockchainWallet,
} from "@triggerr/blockchain-interface";

// A generic type for the event listener that will be called on successful connection.
type ConnectionListener = (wallet: BlockchainWallet) => void;

/**
 * The WalletConnector class provides a standardized way to connect to,
 * disconnect from, and request signatures from various browser wallets.
 */
export class WalletConnector {
  private static instance: WalletConnector;
  private connectionListener: ConnectionListener | null = null;

  // Private constructor to enforce singleton pattern
  private constructor() {
    console.log("WalletConnector initialized.");
  }

  /**
   * Gets the singleton instance of the WalletConnector.
   */
  public static getInstance(): WalletConnector {
    if (!WalletConnector.instance) {
      WalletConnector.instance = new WalletConnector();
    }
    return WalletConnector.instance;
  }

  /**
   * Registers a callback function to be executed when a wallet successfully connects.
   * @param {ConnectionListener} listener - The function to call with the connected wallet details.
   */
  public onConnect(listener: ConnectionListener): void {
    this.connectionListener = listener;
  }

  /**
   * Triggers the connection process for a specified blockchain's wallet extension.
   * @param {BlockchainProviderName} chain - The blockchain to connect to (e.g., 'SOLANA', 'ETHEREUM').
   */
  public async connect(chain: BlockchainProviderName): Promise<void> {
    console.log(`Attempting to connect to a ${chain} wallet...`);

    // In a real implementation, this is where we would use the specific library
    // for the chosen chain (e.g., @solana/wallet-adapter or wagmi).
    // For now, we will simulate a successful connection after a short delay.

    // TODO: Implement actual connection logic using appropriate libraries.
    // Example for Solana:
    // const { wallet, connect } = useWallet();
    // await connect(walletName);
    // const address = publicKey?.toBase58();

    // --- Placeholder Logic ---
    await new Promise((resolve) => setTimeout(resolve, 500)); // Simulate async operation

    // Simulate a successful connection with mock data
    const mockWallet: BlockchainWallet = {
      address:
        chain === "SOLANA"
          ? "So11111111111111111111111111111111111111112"
          : "0xAbC123...",
      chain: chain,
      walletType: "NON_CUSTODIAL",
      provider: chain === "SOLANA" ? "Phantom" : "MetaMask",
    };

    console.log("✅ Wallet connected successfully (simulated):", mockWallet);

    // If a listener is registered, call it with the wallet details.
    if (this.connectionListener) {
      this.connectionListener(mockWallet);
    }
    // --- End Placeholder Logic ---
  }

  /**
   * Disconnects from the currently connected wallet.
   */
  public async disconnect(): Promise<void> {
    console.log("Disconnecting wallet...");
    // TODO: Implement actual disconnection logic.
    await new Promise((resolve) => setTimeout(resolve, 200));
    console.log("✅ Wallet disconnected (simulated).");
  }

  /**
   * Requests a signature for a given transaction from the connected user wallet.
   * @param {any} transaction - The unsigned transaction object provided by our backend.
   * @returns {Promise<any>} A promise that resolves to the signed transaction object.
   */
  public async signTransaction(transaction: any): Promise<any> {
    console.log("Requesting user signature for transaction:", transaction);
    // TODO: Implement actual signing logic. This will involve passing the
    // transaction to the connected wallet adapter (e.g., wallet.signTransaction(...)).

    // --- Placeholder Logic ---
    await new Promise((resolve) => setTimeout(resolve, 1000)); // Simulate user taking time to sign
    const mockSignedTransaction = {
      ...transaction,
      signature: `0x_mock_signature_${crypto.randomUUID()}`,
    };
    console.log(
      "✅ Transaction signed successfully (simulated):",
      mockSignedTransaction,
    );
    return mockSignedTransaction;
    // --- End Placeholder Logic ---
  }
}

// Export a singleton instance for easy use across the frontend application.
export const walletConnector = WalletConnector.getInstance();
