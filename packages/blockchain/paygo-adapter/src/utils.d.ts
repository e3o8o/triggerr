/**
 * Utility functions for the PayGo adapter.
 * This file provides helpers for amount conversions, display formatting, and safe API calls.
 */
/**
 * A generic type for the result of a safe PayGo API call.
 */
export type SafePayGoCallResult<T> = {
    success: true;
    data: T;
} | {
    success: false;
    error: string;
};
/**
 * A higher-order function to wrap PayGo client calls in a try/catch block
 * for standardized error handling.
 *
 * @param {() => Promise<T>} call - The async function to execute (e.g., `() => client.getAccount(address)`).
 * @param {string} errorMessage - A descriptive message for the operation being attempted.
 * @returns {Promise<SafePayGoCallResult<T>>} A promise that resolves to either a success or an error object.
 */
export declare function safePayGoCall<T>(call: () => Promise<T>, errorMessage?: string): Promise<SafePayGoCallResult<T>>;
/**
 * Converts a decimal string representation of an amount (e.g., "123.45")
 * into a bigint representing the value in PayGo units (scale: 10,000 units = $1.00).
 *
 * @param {string} decimalAmount - The amount as a decimal string.
 * @returns {bigint} The amount in PayGo units as a bigint.
 */
export declare function convertToPayGoAmount(decimalAmount: string): bigint;
/**
 * Converts a bigint amount from PayGo (scale: 10,000 units = $1.00) back to a
 * human-readable decimal string (e.g., "123.45").
 *
 * @param {bigint} bigIntAmount - The amount in PayGo units as a bigint.
 * @returns {string} The amount as a decimal string, formatted to two decimal places.
 */
export declare function convertFromPayGoAmount(bigIntAmount: bigint): string;
/**
 * Formats a PayGo amount (scale: 10,000 units = $1.00) for display with currency symbol.
 * This function is ideal for UI display of wallet balances and transaction amounts.
 *
 * @param {bigint | string} amount - The amount to format in PayGo units.
 * @param {string} currencySymbol - Optional currency symbol to prepend (default: '$')
 * @returns {string} Formatted currency string with symbol (e.g. "$10.50")
 */
export declare function formatBalanceDisplay(amount: bigint | string, currencySymbol?: string): string;
/**
 * Formats a wallet address for display, shortening it for UI presentation.
 *
 * @param {string} address - The wallet address to format
 * @returns {string} Shortened address (e.g. "0x1a00...842e")
 */
export declare function formatAddressDisplay(address: string): string;
