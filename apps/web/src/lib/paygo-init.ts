import { initPayGoClient } from '@triggerr/paygo-adapter';
import type { Hex } from 'viem';

/**
 * Initializes the PayGo client service at application startup.
 * Uses the admin private key from the environment variables (`process.env`).
 *
 * This function is designed to be called once when the application server starts,
 * typically in the root layout or a server-side initialization script.
 * It ensures a single, system-wide PayGo client is available for platform operations.
 *
 * @throws {Error} If the `PAYGO_ADMIN_PK` environment variable is missing,
 * or if the client fails to initialize for any other reason (e.g., network issues).
 */
export async function initializePayGoSystem(): Promise<void> {
  // 1. Validate that the required environment variable is present.
  //    This is a critical configuration check. If it's missing, the application
  //    cannot perform essential blockchain operations.
  if (!process.env.PAYGO_ADMIN_PK) {
    const errorMessage = 'Critical setup error: PAYGO_ADMIN_PK environment variable is not configured.';
    console.error(`[System Init] ${errorMessage}`);
    throw new Error(errorMessage);
  }

  // 2. Attempt to initialize the PayGo client using the provided key.
  //    This logic is wrapped in a try/catch block to handle any potential
  //    errors during the initialization process gracefully.
  try {
    // The private key from `process.env` is a string, but `initPayGoClient`
    // expects a `Hex` type (`0x...`). We cast it here for type compatibility.
    // The global type definition we added earlier ensures TypeScript validates this.
    await initPayGoClient(process.env.PAYGO_ADMIN_PK as Hex);
    console.log('[System Init] PayGo client has been successfully initialized for the platform wallet.');
  } catch (error) {
    // 3. If initialization fails, log the specific error and re-throw.
    //    This "fail-fast" approach is crucial. It stops the application from
    //    continuing in a potentially broken state where PayGo-dependent
    //    features would fail unpredictably.
    const errorMessage = `Failed to initialize PayGo system: ${error instanceof Error ? error.message : 'An unknown error occurred'}`;
    console.error(`[System Init] A critical error occurred during PayGo client initialization:`, error);
    throw new Error(errorMessage);
  }
}
