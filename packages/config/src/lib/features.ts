// ============================================================================
// FEATURES CONFIGURATION MODULE
// ============================================================================

/**
 * Feature flags and feature configuration for the triggerr platform.
 * This module provides feature toggle management, A/B testing configuration,
 * and feature rollout controls across all environments and business phases.
 */

import {
  getCurrentEnvironment,
  isDevelopment,
  isProduction,
  isStaging,
} from "./environment";

// ============================================================================
// FEATURE FLAG TYPES
// ============================================================================

export interface FeatureFlag {
  name: string;
  enabled: boolean;
  description: string;
  rolloutPercentage?: number;
  userSegments?: string[];
  environmentOverrides?: Partial<Record<Environment, boolean>>;
  dependencies?: string[];
  expiresAt?: string; // ISO date string
  metadata?: Record<string, any>;
}

export interface FeatureRollout {
  strategy: "percentage" | "user_segments" | "gradual" | "all_or_nothing";
  percentage?: number;
  userSegments?: string[];
  gradualRollout?: {
    startDate: string;
    endDate: string;
    initialPercentage: number;
    finalPercentage: number;
  };
}

export interface ABTestConfig {
  name: string;
  enabled: boolean;
  variants: {
    name: string;
    weight: number;
    features: Record<string, boolean>;
  }[];
  trafficAllocation: number;
  startDate?: string;
  endDate?: string;
}

export interface FeatureDependency {
  feature: string;
  dependsOn: string[];
  conflictsWith?: string[];
}

export type Environment = "development" | "staging" | "production" | "test";

// ============================================================================
// CORE PLATFORM FEATURES
// ============================================================================

/**
 * Phase 1: Insurance Platform Launch Features
 */
export const phase1Features: Record<string, FeatureFlag> = {
  // Core Insurance Features
  insuranceQuoting: {
    name: "insurance_quoting",
    enabled: true,
    description: "Enable insurance quote generation",
    rolloutPercentage: 100,
  },

  policyPurchase: {
    name: "policy_purchase",
    enabled: true,
    description: "Enable policy purchase functionality",
    rolloutPercentage: 100,
  },

  flightDelayInsurance: {
    name: "flight_delay_insurance",
    enabled: true,
    description: "Enable flight delay insurance products",
    rolloutPercentage: 100,
  },

  // Payment Features
  stripePayments: {
    name: "stripe_payments",
    enabled: true,
    description: "Enable Stripe payment processing",
    rolloutPercentage: 100,
  },

  paygoPayments: {
    name: "paygo_payments",
    enabled: true,
    description: "Enable PayGo blockchain payments",
    rolloutPercentage: isProduction() ? 80 : 100,
    environmentOverrides: {
      development: true,
      staging: true,
      production: true,
    },
  },

  // Wallet Features (Phase 1 - Custodial)
  custodialWallets: {
    name: "custodial_wallets",
    enabled: true,
    description: "Enable custodial wallet management",
    rolloutPercentage: 100,
  },

  walletFaucet: {
    name: "wallet_faucet",
    enabled: !isProduction(),
    description: "Enable wallet faucet for testnet",
    environmentOverrides: {
      development: true,
      staging: true,
      production: false,
      test: true,
    },
  },

  // Chat Features
  aiChatSupport: {
    name: "ai_chat_support",
    enabled: true,
    description: "Enable AI-powered chat support",
    rolloutPercentage: 100,
  },

  conversationHistory: {
    name: "conversation_history",
    enabled: true,
    description: "Enable conversation history tracking",
    rolloutPercentage: 100,
  },

  // Data Integration Features
  flightDataIntegration: {
    name: "flight_data_integration",
    enabled: true,
    description: "Enable flight data API integration",
    rolloutPercentage: 100,
  },

  weatherDataIntegration: {
    name: "weather_data_integration",
    enabled: true,
    description: "Enable weather data API integration",
    rolloutPercentage: 100,
  },
};

/**
 * Phase 2: Enhanced Features & Wallet Evolution
 */
export const phase2Features: Record<string, FeatureFlag> = {
  // Enhanced Wallet Features
  selfCustodyWallets: {
    name: "self_custody_wallets",
    enabled: false,
    description: "Enable self-custody wallet features",
    rolloutPercentage: 0,
    dependencies: ["custodial_wallets"],
  },

  walletKeyExport: {
    name: "wallet_key_export",
    enabled: false,
    description: "Enable private key export for users",
    rolloutPercentage: 0,
    dependencies: ["self_custody_wallets"],
    environmentOverrides: {
      production: false, // Disabled in production initially
    },
  },

  externalWalletLinking: {
    name: "external_wallet_linking",
    enabled: false,
    description: "Enable linking external wallets",
    rolloutPercentage: 0,
    dependencies: ["self_custody_wallets"],
  },

  // Enhanced Insurance Features
  multiRiskInsurance: {
    name: "multi_risk_insurance",
    enabled: false,
    description: "Enable multi-risk insurance products",
    rolloutPercentage: 0,
    dependencies: ["flight_delay_insurance"],
  },

  customInsuranceProducts: {
    name: "custom_insurance_products",
    enabled: false,
    description: "Enable custom insurance product creation",
    rolloutPercentage: 0,
    dependencies: ["multi_risk_insurance"],
  },

  // Advanced Analytics
  userAnalytics: {
    name: "user_analytics",
    enabled: false,
    description: "Enable advanced user analytics",
    rolloutPercentage: 0,
  },

  policyAnalytics: {
    name: "policy_analytics",
    enabled: false,
    description: "Enable policy performance analytics",
    rolloutPercentage: 0,
  },
};

/**
 * Phase 3: OTA Integration Features
 */
export const phase3Features: Record<string, FeatureFlag> = {
  // FlightHub Connect Features
  flightHubConnect: {
    name: "flighthub_connect",
    enabled: false,
    description: "Enable FlightHub Connect OTA integration",
    rolloutPercentage: 0,
    dependencies: ["flight_data_integration"],
  },

  flightBooking: {
    name: "flight_booking",
    enabled: false,
    description: "Enable flight booking functionality",
    rolloutPercentage: 0,
    dependencies: ["flighthub_connect"],
  },

  bundledInsurance: {
    name: "bundled_insurance",
    enabled: false,
    description: "Enable bundled insurance with flight bookings",
    rolloutPercentage: 0,
    dependencies: ["flight_booking", "policy_purchase"],
  },

  // Advanced OTA Features
  hotelBooking: {
    name: "hotel_booking",
    enabled: false,
    description: "Enable hotel booking functionality",
    rolloutPercentage: 0,
    dependencies: ["flighthub_connect"],
  },

  carRentalBooking: {
    name: "car_rental_booking",
    enabled: false,
    description: "Enable car rental booking functionality",
    rolloutPercentage: 0,
    dependencies: ["flighthub_connect"],
  },

  travelPackages: {
    name: "travel_packages",
    enabled: false,
    description: "Enable complete travel package booking",
    rolloutPercentage: 0,
    dependencies: ["flight_booking", "hotel_booking"],
  },
};

/**
 * Experimental and Debug Features
 */
export const experimentalFeatures: Record<string, FeatureFlag> = {
  // Development Features
  debugMode: {
    name: "debug_mode",
    enabled: isDevelopment(),
    description: "Enable debug mode and additional logging",
    rolloutPercentage: 100,
    environmentOverrides: {
      development: true,
      staging: true,
      production: false,
      test: true,
    },
  },

  apiMocking: {
    name: "api_mocking",
    enabled: isDevelopment(),
    description: "Enable API mocking for development",
    rolloutPercentage: 100,
    environmentOverrides: {
      development: true,
      staging: false,
      production: false,
      test: true,
    },
  },

  // Performance Features
  cacheOptimization: {
    name: "cache_optimization",
    enabled: false,
    description: "Enable advanced caching optimizations",
    rolloutPercentage: 0,
  },

  performanceMonitoring: {
    name: "performance_monitoring",
    enabled: isProduction(),
    description: "Enable performance monitoring",
    rolloutPercentage: 100,
    environmentOverrides: {
      development: false,
      staging: true,
      production: true,
      test: false,
    },
  },

  // Security Features
  advancedSecurity: {
    name: "advanced_security",
    enabled: isProduction(),
    description: "Enable advanced security features",
    rolloutPercentage: 100,
  },

  // New Architecture Features
  newPaymentFlow: {
    name: "new_payment_flow",
    enabled: false,
    description: "Enable new payment processing flow",
    rolloutPercentage: 0,
    expiresAt: "2024-12-31T23:59:59Z",
  },
};

// ============================================================================
// FEATURE COLLECTIONS
// ============================================================================

/**
 * All feature flags organized by phase
 */
export const allFeatures = {
  phase1: phase1Features,
  phase2: phase2Features,
  phase3: phase3Features,
  experimental: experimentalFeatures,
} as const;

/**
 * Flattened feature flags for easy access
 */
export const features: Record<string, FeatureFlag> = {
  ...phase1Features,
  ...phase2Features,
  ...phase3Features,
  ...experimentalFeatures,
};

// ============================================================================
// A/B TESTING CONFIGURATION
// ============================================================================

/**
 * A/B test configurations
 */
export const abTests: Record<string, ABTestConfig> = {
  paymentMethodSelection: {
    name: "payment_method_selection",
    enabled: isProduction(),
    trafficAllocation: 50,
    variants: [
      {
        name: "stripe_first",
        weight: 50,
        features: {
          stripe_payments: true,
          paygo_payments: true,
        },
      },
      {
        name: "paygo_first",
        weight: 50,
        features: {
          paygo_payments: true,
          stripe_payments: true,
        },
      },
    ],
    startDate: "2024-01-01T00:00:00Z",
    endDate: "2024-03-31T23:59:59Z",
  },

  chatInterfaceDesign: {
    name: "chat_interface_design",
    enabled: !isProduction(),
    trafficAllocation: 25,
    variants: [
      {
        name: "classic",
        weight: 50,
        features: {
          ai_chat_support: true,
          conversation_history: true,
        },
      },
      {
        name: "modern",
        weight: 50,
        features: {
          ai_chat_support: true,
          conversation_history: true,
        },
      },
    ],
  },
};

// ============================================================================
// FEATURE DEPENDENCIES
// ============================================================================

/**
 * Feature dependency configuration
 */
export const featureDependencies: FeatureDependency[] = [
  {
    feature: "self_custody_wallets",
    dependsOn: ["custodial_wallets"],
  },
  {
    feature: "wallet_key_export",
    dependsOn: ["self_custody_wallets"],
  },
  {
    feature: "external_wallet_linking",
    dependsOn: ["self_custody_wallets"],
  },
  {
    feature: "multi_risk_insurance",
    dependsOn: ["flight_delay_insurance"],
  },
  {
    feature: "custom_insurance_products",
    dependsOn: ["multi_risk_insurance"],
  },
  {
    feature: "flighthub_connect",
    dependsOn: ["flight_data_integration"],
  },
  {
    feature: "flight_booking",
    dependsOn: ["flighthub_connect"],
  },
  {
    feature: "bundled_insurance",
    dependsOn: ["flight_booking", "policy_purchase"],
  },
  {
    feature: "hotel_booking",
    dependsOn: ["flighthub_connect"],
  },
  {
    feature: "car_rental_booking",
    dependsOn: ["flighthub_connect"],
  },
  {
    feature: "travel_packages",
    dependsOn: ["flight_booking", "hotel_booking"],
  },
];

// ============================================================================
// FEATURE UTILITIES
// ============================================================================

/**
 * Checks if a feature is enabled for the current environment
 */
export function isFeatureEnabled(
  featureName: string,
  userId?: string,
): boolean {
  const feature = features[featureName];
  if (!feature) return false;

  // Check environment overrides first
  const currentEnv = getCurrentEnvironment();
  if (
    feature.environmentOverrides &&
    feature.environmentOverrides[currentEnv] !== undefined
  ) {
    return feature.environmentOverrides[currentEnv]!;
  }

  // Check if feature is globally enabled
  if (!feature.enabled) return false;

  // Check rollout percentage
  if (
    feature.rolloutPercentage !== undefined &&
    feature.rolloutPercentage < 100
  ) {
    if (userId) {
      // Use user ID for consistent rollout
      const hash = simpleHash(userId + featureName);
      return hash % 100 < feature.rolloutPercentage;
    }
    // Random rollout for anonymous users
    return Math.random() * 100 < feature.rolloutPercentage;
  }

  // Check expiration
  if (feature.expiresAt && new Date() > new Date(feature.expiresAt)) {
    return false;
  }

  return true;
}

/**
 * Checks if feature dependencies are satisfied
 */
export function areFeatureDependenciesSatisfied(
  featureName: string,
  userId?: string,
): boolean {
  const dependency = featureDependencies.find(
    (dep) => dep.feature === featureName,
  );
  if (!dependency) return true;

  // Check all dependencies are enabled
  const dependenciesSatisfied = dependency.dependsOn.every((dep) =>
    isFeatureEnabled(dep, userId),
  );

  // Check no conflicts exist
  const noConflicts =
    !dependency.conflictsWith ||
    dependency.conflictsWith.every(
      (conflict) => !isFeatureEnabled(conflict, userId),
    );

  return dependenciesSatisfied && noConflicts;
}

/**
 * Gets all enabled features for a user
 */
export function getEnabledFeatures(userId?: string): string[] {
  return Object.keys(features).filter(
    (featureName) =>
      isFeatureEnabled(featureName, userId) &&
      areFeatureDependenciesSatisfied(featureName, userId),
  );
}

/**
 * Gets features by phase
 */
export function getFeaturesByPhase(
  phase: "phase1" | "phase2" | "phase3" | "experimental",
): Record<string, FeatureFlag> {
  return allFeatures[phase];
}

/**
 * Gets enabled features by phase
 */
export function getEnabledFeaturesByPhase(
  phase: "phase1" | "phase2" | "phase3" | "experimental",
  userId?: string,
): string[] {
  const phaseFeatures = getFeaturesByPhase(phase);
  return Object.keys(phaseFeatures).filter(
    (featureName) =>
      isFeatureEnabled(featureName, userId) &&
      areFeatureDependenciesSatisfied(featureName, userId),
  );
}

/**
 * Gets A/B test variant for a user
 */
export function getABTestVariant(
  testName: string,
  userId: string,
): string | null {
  const test = abTests[testName];
  if (!test || !test.enabled) return null;

  // Check if user is in traffic allocation
  const trafficHash = simpleHash(userId + testName + "traffic");
  if (trafficHash % 100 >= test.trafficAllocation) return null;

  // Determine variant based on weights
  const variantHash = simpleHash(userId + testName + "variant");
  const variantPercent = variantHash % 100;

  let cumulativeWeight = 0;
  for (const variant of test.variants) {
    cumulativeWeight += variant.weight;
    if (variantPercent < cumulativeWeight) {
      return variant.name;
    }
  }

  return test.variants[0]?.name || null;
}

/**
 * Gets feature configuration for A/B test variant
 */
export function getABTestFeatures(
  testName: string,
  userId: string,
): Record<string, boolean> {
  const variant = getABTestVariant(testName, userId);
  if (!variant) return {};

  const test = abTests[testName];
  if (!test) return {};

  const variantConfig = test.variants.find((v) => v.name === variant);
  return variantConfig?.features || {};
}

/**
 * Validates feature configuration
 */
export function validateFeatureConfig(): {
  valid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check for circular dependencies
  const visited = new Set<string>();
  const recursionStack = new Set<string>();

  function hasCycle(feature: string): boolean {
    if (recursionStack.has(feature)) return true;
    if (visited.has(feature)) return false;

    visited.add(feature);
    recursionStack.add(feature);

    const dependency = featureDependencies.find(
      (dep) => dep.feature === feature,
    );
    if (dependency) {
      for (const dep of dependency.dependsOn) {
        if (hasCycle(dep)) return true;
      }
    }

    recursionStack.delete(feature);
    return false;
  }

  for (const feature of Object.keys(features)) {
    if (hasCycle(feature)) {
      errors.push(`Circular dependency detected for feature: ${feature}`);
    }
  }

  // Check for invalid dependencies
  for (const dependency of featureDependencies) {
    if (!features[dependency.feature]) {
      errors.push(`Invalid feature in dependency: ${dependency.feature}`);
    }

    for (const dep of dependency.dependsOn) {
      if (!features[dep]) {
        errors.push(
          `Invalid dependency: ${dep} for feature ${dependency.feature}`,
        );
      }
    }
  }

  // Check for expired features that are still enabled
  for (const [name, feature] of Object.entries(features)) {
    if (
      feature.expiresAt &&
      new Date() > new Date(feature.expiresAt) &&
      feature.enabled
    ) {
      warnings.push(`Feature ${name} is expired but still enabled`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Simple hash function for consistent user-based rollouts
 */
function simpleHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}

/**
 * Gets current phase based on enabled features
 */
export function getCurrentPhase(): "phase1" | "phase2" | "phase3" {
  if (isFeatureEnabled("flighthub_connect")) return "phase3";
  if (isFeatureEnabled("self_custody_wallets")) return "phase2";
  return "phase1";
}

/**
 * Gets feature flag summary for debugging
 */
export function getFeatureFlagSummary(userId?: string): {
  phase: string;
  enabled: string[];
  disabled: string[];
  abTests: Record<string, string>;
} {
  const enabled = getEnabledFeatures(userId);
  const disabled = Object.keys(features).filter((f) => !enabled.includes(f));

  const abTestResults: Record<string, string> = {};
  if (userId) {
    for (const testName of Object.keys(abTests)) {
      const variant = getABTestVariant(testName, userId);
      if (variant) {
        abTestResults[testName] = variant;
      }
    }
  }

  return {
    phase: getCurrentPhase(),
    enabled,
    disabled,
    abTests: abTestResults,
  };
}

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * Feature validation results
 */
export const FEATURE_VALIDATION = validateFeatureConfig();

/**
 * Current phase
 */
export const CURRENT_PHASE = getCurrentPhase();

/**
 * Feature categories
 */
export const FEATURE_CATEGORIES = {
  INSURANCE: "insurance",
  PAYMENT: "payment",
  WALLET: "wallet",
  CHAT: "chat",
  DATA: "data",
  OTA: "ota",
  ANALYTICS: "analytics",
  SECURITY: "security",
  EXPERIMENTAL: "experimental",
} as const;

// ============================================================================
// LEGACY EXPORTS (for backward compatibility)
// ============================================================================

export {
  features as featureFlags,
  isFeatureEnabled as isEnabled,
  getEnabledFeatures as getEnabled,
  getCurrentPhase as getPhase,
};
