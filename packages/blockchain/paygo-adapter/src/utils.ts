/**
 * Utility functions for the PayGo adapter.
 * This file provides helpers for amount conversions, display formatting, and safe API calls.
 */

/**
 * A generic type for the result of a safe PayGo API call.
 */
export type SafePayGoCallResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

/**
 * A higher-order function to wrap PayGo client calls in a try/catch block
 * for standardized error handling.
 *
 * @param {() => Promise<T>} call - The async function to execute (e.g., `() => client.getAccount(address)`).
 * @param {string} errorMessage - A descriptive message for the operation being attempted.
 * @returns {Promise<SafePayGoCallResult<T>>} A promise that resolves to either a success or an error object.
 */
export async function safePayGoCall<T>(
  call: () => Promise<T>,
  errorMessage: string = "PayGo client call failed",
): Promise<SafePayGoCallResult<T>> {
  try {
    const data = await call();
    return { success: true, data };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "An unknown error occurred";
    console.error(`[PayGo Adapter Error] ${errorMessage}: ${message}`, error);
    return { success: false, error: `${errorMessage}: ${message}` };
  }
}

/**
 * Converts a decimal string representation of an amount (e.g., "123.45")
 * into a bigint representing the value in PayGo units (scale: 100 units = $1.00).
 *
 * @param {string} decimalAmount - The amount as a decimal string.
 * @returns {bigint} The amount in PayGo units as a bigint.
 */
export function convertToPayGoAmount(decimalAmount: string): bigint {
  const num = parseFloat(decimalAmount);
  if (isNaN(num)) {
    return BigInt(0);
  }
  // Multiply by 100 to convert to PayGo units and handle potential floating point issues
  const amountInPayGoUnits = num * 100;
  // Round to the nearest whole unit to avoid precision errors
  return BigInt(Math.round(amountInPayGoUnits));
}

/**
 * Converts a bigint amount from PayGo (scale: 100 units = $1.00) back to a
 * human-readable decimal string (e.g., "123.45").
 *
 * @param {bigint} bigIntAmount - The amount in PayGo units as a bigint.
 * @returns {string} The amount as a decimal string, formatted to two decimal places.
 */
export function convertFromPayGoAmount(bigIntAmount: bigint): string {
  try {
    const dollars = bigIntAmount / 100n;
    const cents = bigIntAmount % 100n;
    // Pad the cents with a leading zero if it's a single digit
    const centsPadded = cents.toString().padStart(2, "0");
    return `${dollars}.${centsPadded}`;
  } catch (error) {
    console.error(
      `[PayGo Adapter Error] Failed to convert bigint amount "${bigIntAmount}" to decimal string:`,
      error,
    );
    // Return "0.00" as a safe default
    return "0.00";
  }
}

/**
 * Formats a PayGo amount (scale: 100 units = $1.00) for display with currency symbol.
 * This function is ideal for UI display of wallet balances and transaction amounts.
 *
 * @param {bigint | string} amount - The amount to format in PayGo units.
 * @param {string} currencySymbol - Optional currency symbol to prepend (default: '$')
 * @returns {string} Formatted currency string with symbol (e.g. "$10.50")
 */
export function formatBalanceDisplay(
  amount: bigint | string,
  currencySymbol: string = "$",
): string {
  try {
    // Convert the amount from PayGo units to a decimal string
    const decimalString = convertFromPayGoAmount(
      typeof amount === "string" ? BigInt(amount) : amount,
    );

    // Return formatted string with currency symbol
    return `${currencySymbol}${decimalString}`;
  } catch (error) {
    console.error(
      `[PayGo Adapter Error] Failed to format amount "${amount}" for display:`,
      error,
    );
    return `${currencySymbol}0.00`;
  }
}

/**
 * Formats a wallet address for display, shortening it for UI presentation.
 *
 * @param {string} address - The wallet address to format
 * @returns {string} Shortened address (e.g. "0x1a00...842e")
 */
export function formatAddressDisplay(address: string): string {
  try {
    // Ensure proper 0x prefix
    const formattedAddress = address.toLowerCase().startsWith("0x")
      ? address.toLowerCase()
      : `0x${address.toLowerCase()}`;

    // Show first 6 chars and last 4 chars
    return `${formattedAddress.slice(0, 6)}...${formattedAddress.slice(-4)}`;
  } catch (error) {
    console.error(
      `[PayGo Adapter Error] Failed to format address "${address}" for display:`,
      error,
    );
    return address;
  }
}
