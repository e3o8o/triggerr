// ============================================================================
// BUSINESS DOMAIN TYPES
// ============================================================================
// Type guards for business entities
export function isInsuranceProvider(obj) {
    return obj && typeof obj.id === 'string' && obj.category && obj.businessInfo;
}
export function isInsurancePolicy(obj) {
    return obj && typeof obj.id === 'string' && obj.policyNumber && obj.policyholder;
}
export function isEscrowAccount(obj) {
    return obj && typeof obj.id === 'string' && obj.contractAddress && obj.totalAmount;
}
//# sourceMappingURL=business-types.js.map