import PayGoClientService from "./client";
import type { Hex } from "viem";

// Global singleton instance of the PayGo client service.
// It starts as null and will be initialized on the first use to avoid SSR issues.
let paygoClientService: PayGoClientService | null = null;

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
export async function getPayGoClient(): Promise<PayGoClientService> {
  // If the client is already initialized, return it immediately.
  if (paygoClientService) {
    return paygoClientService;
  }

  console.log(
    "[PayGo Adapter] JIT Initialization: Client not ready, initializing now...",
  );

  // Ensure the admin private key is available in the environment.
  const adminPk = process.env.PAYGO_ADMIN_PK;
  if (!adminPk) {
    throw new Error(
      "[PayGo Adapter] Critical Error: PAYGO_ADMIN_PK environment variable is not set.",
    );
  }

  // Initialize the service, handle potential errors, and assign to the singleton variable.
  try {
    // This instantiation can fail if the WASM bindings do not load correctly.
    paygoClientService = new PayGoClientService(adminPk as Hex);
    console.log(
      "[PayGo Adapter] JIT Initialization: Client service initialized successfully.",
    );
    return paygoClientService;
  } catch (error) {
    console.error(
      "[PayGo Adapter] JIT Initialization: Failed to initialize client service:",
      error,
    );
    throw new Error(
      `Failed to initialize PayGo client: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

/**
 * Explicitly initializes the PayGo client service with a provided private key.
 * This is useful for testing or specific scenarios where lazy initialization is not desired.
 *
 * @param {Hex} privateKey - The private key to use for the PayGo client.
 * @returns {Promise<PayGoClientService>} The initialized PayGo client service.
 * @throws {Error} If the client is already initialized.
 */
export async function initPayGoClient(
  privateKey: Hex,
): Promise<PayGoClientService> {
  if (paygoClientService) {
    throw new Error(
      "PayGo client is already initialized. Use resetPayGoClient() first if this is intentional.",
    );
  }

  try {
    paygoClientService = new PayGoClientService(privateKey);
    console.log(
      "[PayGo Adapter] Explicit Initialization: Client service initialized successfully.",
    );
    return paygoClientService;
  } catch (error) {
    console.error(
      "[PayGo Adapter] Explicit Initialization: Failed to initialize client service:",
      error,
    );
    throw new Error(
      `Failed to explicitly initialize PayGo client: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

/**
 * Initializes the PayGo client service with a newly generated wallet.
 * Primarily intended for testing or initial setup scripts.
 *
 * @returns {Promise<{ client: PayGoClientService; privateKey: Hex; address: `0x${string}` }>}
 * @throws {Error} If the client is already initialized.
 */
export async function initPayGoClientWithNewWallet(): Promise<{
  client: PayGoClientService;
  privateKey: Hex;
  address: `0x${string}`;
}> {
  if (paygoClientService) {
    throw new Error("PayGo client is already initialized.");
  }

  try {
    // First, create an instance of the service.
    const newClient = new PayGoClientService();
    // Then, call the instance method to generate the wallet.
    const newWallet = await newClient.generateNewWallet();

    if (!newWallet.privateKey) {
      throw new Error("Failed to generate private key for new wallet.");
    }

    // Now, set the private key on the instance.
    await newClient.setPk(newWallet.privateKey as Hex);

    // Assign the fully configured client to the singleton.
    paygoClientService = newClient;

    console.log("[PayGo Adapter] Client service initialized with new wallet.");
    return {
      client: paygoClientService,
      privateKey: newWallet.privateKey as Hex,
      address: newWallet.address as `0x${string}`,
    };
  } catch (error) {
    console.error(
      "[PayGo Adapter] Failed to initialize client service with new wallet:",
      error,
    );
    throw new Error(
      `Failed to initialize PayGo client with new wallet: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
  }
}

/**
 * Checks if the PayGo client has been initialized.
 *
 * @returns {boolean} True if the client is initialized, false otherwise.
 */
export function isPayGoClientInitialized(): boolean {
  return paygoClientService !== null;
}

/**
 * Resets the PayGo client service singleton.
 * This is primarily intended for use in testing environments to ensure
 * a clean state between tests.
 */
export function resetPayGoClient(): void {
  paygoClientService = null;
  console.log("[PayGo Adapter] Client service has been reset.");
}
