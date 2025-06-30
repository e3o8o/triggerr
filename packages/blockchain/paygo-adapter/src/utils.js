"use strict";
/**
 * Utility functions for the PayGo adapter.
 * This file provides helpers for amount conversions, display formatting, and safe API calls.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatAddressDisplay = exports.formatBalanceDisplay = exports.convertFromPayGoAmount = exports.convertToPayGoAmount = exports.safePayGoCall = void 0;
/**
 * A higher-order function to wrap PayGo client calls in a try/catch block
 * for standardized error handling.
 *
 * @param {() => Promise<T>} call - The async function to execute (e.g., `() => client.getAccount(address)`).
 * @param {string} errorMessage - A descriptive message for the operation being attempted.
 * @returns {Promise<SafePayGoCallResult<T>>} A promise that resolves to either a success or an error object.
 */
async function safePayGoCall(call, errorMessage = "PayGo client call failed") {
    try {
        const data = await call();
        return { success: true, data };
    }
    catch (error) {
        const message = error instanceof Error ? error.message : "An unknown error occurred";
        console.error(`[PayGo Adapter Error] ${errorMessage}: ${message}`, error);
        return { success: false, error: `${errorMessage}: ${message}` };
    }
}
exports.safePayGoCall = safePayGoCall;
/**
 * Converts a decimal string representation of an amount (e.g., "123.45")
 * into a bigint representing the value in PayGo units (scale: 10,000 units = $1.00).
 *
 * @param {string} decimalAmount - The amount as a decimal string.
 * @returns {bigint} The amount in PayGo units as a bigint.
 */
function convertToPayGoAmount(decimalAmount) {
    const num = parseFloat(decimalAmount);
    if (isNaN(num)) {
        return BigInt(0);
    }
    // Multiply by 10,000 to convert to PayGo units and handle potential floating point issues
    const amountInPayGoUnits = num * 10000;
    // Round to the nearest whole unit to avoid precision errors
    return BigInt(Math.round(amountInPayGoUnits));
}
exports.convertToPayGoAmount = convertToPayGoAmount;
/**
 * Converts a bigint amount from PayGo (scale: 10,000 units = $1.00) back to a
 * human-readable decimal string (e.g., "123.45").
 *
 * @param {bigint} bigIntAmount - The amount in PayGo units as a bigint.
 * @returns {string} The amount as a decimal string, formatted to two decimal places.
 */
function convertFromPayGoAmount(bigIntAmount) {
    try {
        // Convert the bigint to a number and divide by 10,000 to get the decimal value
        const decimalValue = Number(bigIntAmount) / 10000;
        // Format to 2 decimal places to ensure consistent currency representation
        return decimalValue.toFixed(2);
    }
    catch (error) {
        console.error(`[PayGo Adapter Error] Failed to convert bigint amount "${bigIntAmount}" to decimal string:`, error);
        // Return "0.00" as a safe default
        return "0.00";
    }
}
exports.convertFromPayGoAmount = convertFromPayGoAmount;
/**
 * Formats a PayGo amount (scale: 10,000 units = $1.00) for display with currency symbol.
 * This function is ideal for UI display of wallet balances and transaction amounts.
 *
 * @param {bigint | string} amount - The amount to format in PayGo units.
 * @param {string} currencySymbol - Optional currency symbol to prepend (default: '$')
 * @returns {string} Formatted currency string with symbol (e.g. "$10.50")
 */
function formatBalanceDisplay(amount, currencySymbol = "$") {
    try {
        // Convert the amount from PayGo units to a decimal string
        const decimalString = convertFromPayGoAmount(typeof amount === "string" ? BigInt(amount) : amount);
        // Return formatted string with currency symbol
        return `${currencySymbol}${decimalString}`;
    }
    catch (error) {
        console.error(`[PayGo Adapter Error] Failed to format amount "${amount}" for display:`, error);
        return `${currencySymbol}0.00`;
    }
}
exports.formatBalanceDisplay = formatBalanceDisplay;
/**
 * Formats a wallet address for display, shortening it for UI presentation.
 *
 * @param {string} address - The wallet address to format
 * @returns {string} Shortened address (e.g. "0x1a00...842e")
 */
function formatAddressDisplay(address) {
    try {
        // Ensure proper 0x prefix
        const formattedAddress = address.toLowerCase().startsWith("0x")
            ? address.toLowerCase()
            : `0x${address.toLowerCase()}`;
        // Show first 6 chars and last 4 chars
        return `${formattedAddress.slice(0, 6)}...${formattedAddress.slice(-4)}`;
    }
    catch (error) {
        console.error(`[PayGo Adapter Error] Failed to format address "${address}" for display:`, error);
        return address;
    }
}
exports.formatAddressDisplay = formatAddressDisplay;
//# sourceMappingURL=utils.js.map