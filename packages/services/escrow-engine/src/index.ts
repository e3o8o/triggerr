/**
 * Escrow Engine - Smart Contract Escrow Management
 *
 * This module provides comprehensive escrow management functionality
 * for the triggerr platform, supporting both policy-based and
 * user-initiated escrow operations.
 *
 * @module @triggerr/escrow-engine
 */

export {
  // Main escrow manager
  EscrowManager,

  // Escrow engines
  SingleSidedEscrowEngine,
  UserInitiatedEscrowEngine,
  EscrowEngineFactory,

  // Types and interfaces
  type EscrowModelType,
  type PremiumReturnPolicy,
  type EscrowCreateParams,
  type EscrowResult,
  type EscrowStatus,
  type EscrowConfiguration,
  type IEscrowEngine,
} from "./escrow-engine";

// Default export
export { EscrowManager as default } from "./escrow-engine";
