/**
 * Policy Engine Service Exports
 *
 * This package provides policy creation and management capabilities, including:
 * - Validating quotes for purchase
 * - Creating policy records in the database
 * - Interacting with the EscrowManager to fund policies on-chain
 */

// Main service class
export { PolicyEngine } from './policy-engine';

// Request and Response types
export type {
  PolicyPurchaseRequest,
  PolicyPurchaseResponse,
} from './policy-engine';
