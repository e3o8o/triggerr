// Utils package exports
export * from "./escrow-id-generator";
/**
 * Generate a unique ID with a given prefix
 * @param prefix - The prefix for the ID (e.g., "pol", "quote", "user")
 * @returns A unique ID string
 */
export function generateId(prefix) {
    const timestamp = Date.now().toString();
    const randomSuffix = Math.random().toString(36).substring(2, 8);
    return `${prefix}_${timestamp}_${randomSuffix}`;
}
//# sourceMappingURL=index.js.map