/**
 * PayoutEngine - Automated Policy Payout Processing
 *
 * This module provides automated payout processing for insurance policies
 * when claim conditions are met. It integrates with the escrow system to
 * release funds to policy holders.
 *
 * @module @triggerr/payout-engine
 */

export {
  PayoutEngine,
  type InternalProcessPayoutsResponse,
} from "./payout-engine";
export { PayoutEngine as default } from "./payout-engine";
