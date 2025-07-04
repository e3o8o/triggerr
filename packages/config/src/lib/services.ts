// ============================================================================
// EXTERNAL SERVICES CONFIGURATION MODULE
// ============================================================================

/**
 * External services configuration for the triggerr platform.
 * This module provides configuration for all external APIs and services
 * including flight data providers, weather services, payment processors,
 * and LLM integrations.
 */

import {
  getCurrentEnvironment,
  isDevelopment,
  isProduction,
} from "./environment";

// ============================================================================
// SERVICE CONFIGURATION TYPES
// ============================================================================

export interface ServiceConfig {
  name: string;
  baseUrl: string;
  timeout: number;
  retries: number;
  healthCheckPath?: string;
  authentication?: {
    type: "api_key" | "bearer" | "basic" | "oauth2";
    headerName?: string;
    envVarName?: string;
  };
  rateLimit?: {
    requestsPerMinute: number;
    requestsPerHour?: number;
    requestsPerDay?: number;
  };
  features?: {
    enabled: boolean;
    testMode?: boolean;
    fallbackEnabled?: boolean;
  };
}

export interface FlightDataServiceConfig extends ServiceConfig {
  endpoints: {
    flights: string;
    schedules: string;
    airports: string;
    airlines: string;
    routes?: string;
  };
  supportedOperations: string[];
  dataFormat: "json" | "xml";
  realTimeSupport: boolean;
}

export interface WeatherServiceConfig extends ServiceConfig {
  endpoints: {
    current: string;
    forecast: string;
    historical?: string;
    alerts?: string;
  };
  supportedParameters: string[];
  dataFormat: "json" | "xml";
  units: "metric" | "imperial" | "kelvin";
}

export interface PaymentServiceConfig extends ServiceConfig {
  endpoints: {
    payments: string;
    refunds: string;
    webhooks: string;
    customers?: string;
  };
  supportedCurrencies: string[];
  webhookSigningSecret?: string | undefined;
  testMode: boolean;
}

export interface LLMServiceConfig extends ServiceConfig {
  endpoints: {
    chat: string;
    completions: string;
    embeddings?: string;
  };
  models: {
    chat: string;
    completion: string;
    embedding?: string;
  };
  maxTokens: number;
  temperature: number;
}

// ============================================================================
// FLIGHT DATA SERVICES
// ============================================================================

/**
 * AviationStack API configuration
 */
export const aviationStackConfig: FlightDataServiceConfig = {
  name: "AviationStack",
  baseUrl: "http://api.aviationstack.com/v1",
  timeout: 10000,
  retries: 2,
  healthCheckPath: "/flights",
  authentication: {
    type: "api_key",
    headerName: "access_key",
    envVarName: "AVIATIONSTACK_API_KEY",
  },
  rateLimit: {
    requestsPerMinute: 60,
    requestsPerHour: 1000,
    requestsPerDay: 10000,
  },
  features: {
    enabled: true,
    testMode: !isProduction(),
    fallbackEnabled: true,
  },
  endpoints: {
    flights: "/flights",
    schedules: "/flights",
    airports: "/airports",
    airlines: "/airlines",
    routes: "/routes",
  },
  supportedOperations: ["real-time", "historical", "schedules"],
  dataFormat: "json",
  realTimeSupport: true,
};

/**
 * FlightAware API configuration
 */
export const flightAwareConfig: FlightDataServiceConfig = {
  name: "FlightAware",
  baseUrl: "https://aeroapi.flightaware.com/aeroapi",
  timeout: 10000,
  retries: 2,
  healthCheckPath: "/flights",
  authentication: {
    type: "api_key",
    headerName: "x-apikey",
    envVarName: "FLIGHTAWARE_API_KEY",
  },
  rateLimit: {
    requestsPerMinute: 60,
    requestsPerHour: 2000,
    requestsPerDay: 10000,
  },
  features: {
    enabled: true,
    testMode: !isProduction(),
    fallbackEnabled: true,
  },
  endpoints: {
    flights: "/flights",
    schedules: "/schedules",
    airports: "/airports",
    airlines: "/operators",
  },
  supportedOperations: ["real-time", "historical", "schedules", "predictions"],
  dataFormat: "json",
  realTimeSupport: true,
};

/**
 * OpenSky Network API configuration
 */
export const openSkyConfig: FlightDataServiceConfig = {
  name: "OpenSky",
  baseUrl: "https://opensky-network.org/api",
  timeout: 15000,
  retries: 1,
  healthCheckPath: "/states/all",
  authentication: {
    type: "basic",
    envVarName: "OPENSKY_CREDENTIALS",
  },
  rateLimit: {
    requestsPerMinute: 10,
    requestsPerHour: 400,
  },
  features: {
    enabled: true,
    testMode: false,
    fallbackEnabled: false,
  },
  endpoints: {
    flights: "/states/all",
    schedules: "/flights/all",
    airports: "/airports",
    airlines: "/operators",
  },
  supportedOperations: ["real-time", "historical"],
  dataFormat: "json",
  realTimeSupport: true,
};

// ============================================================================
// WEATHER SERVICES
// ============================================================================

/**
 * OpenWeatherMap API configuration
 */
export const openWeatherConfig: WeatherServiceConfig = {
  name: "OpenWeather",
  baseUrl: "https://api.openweathermap.org/data/2.5",
  timeout: 5000,
  retries: 2,
  healthCheckPath: "/weather",
  authentication: {
    type: "api_key",
    headerName: "appid",
    envVarName: "OPENWEATHER_API_KEY",
  },
  rateLimit: {
    requestsPerMinute: 60,
    requestsPerHour: 1000,
    requestsPerDay: 1000000,
  },
  features: {
    enabled: true,
    testMode: false,
    fallbackEnabled: true,
  },
  endpoints: {
    current: "/weather",
    forecast: "/forecast",
    historical: "/onecall/timemachine",
    alerts: "/alerts",
  },
  supportedParameters: ["lat", "lon", "q", "id", "zip", "units", "lang"],
  dataFormat: "json",
  units: "metric",
};

/**
 * Google Weather API configuration
 */
export const googleWeatherConfig: WeatherServiceConfig = {
  name: "GoogleWeather",
  baseUrl: "https://api.weather.gov",
  timeout: 8000,
  retries: 2,
  healthCheckPath: "/",
  authentication: {
    type: "api_key",
    headerName: "x-api-key",
    envVarName: "GOOGLE_WEATHER_API_KEY",
  },
  rateLimit: {
    requestsPerMinute: 100,
    requestsPerHour: 2000,
  },
  features: {
    enabled: false, // Disabled by default
    testMode: !isProduction(),
    fallbackEnabled: true,
  },
  endpoints: {
    current: "/current",
    forecast: "/forecast",
    historical: "/historical",
  },
  supportedParameters: ["location", "units", "lang"],
  dataFormat: "json",
  units: "metric",
};

// ============================================================================
// PAYMENT SERVICES
// ============================================================================

/**
 * Stripe API configuration
 */
export const stripeServiceConfig: PaymentServiceConfig = {
  name: "Stripe",
  baseUrl: "https://api.stripe.com/v1",
  timeout: 30000,
  retries: 3,
  healthCheckPath: "/charges",
  authentication: {
    type: "bearer",
    envVarName: "STRIPE_SECRET_KEY",
  },
  rateLimit: {
    requestsPerMinute: 100,
    requestsPerHour: 1000,
  },
  features: {
    enabled: true,
    testMode: !isProduction(),
    fallbackEnabled: false,
  },
  endpoints: {
    payments: "/payment_intents",
    refunds: "/refunds",
    webhooks: "/webhook_endpoints",
    customers: "/customers",
  },
  supportedCurrencies: ["USD", "EUR", "GBP", "CAD"],
  webhookSigningSecret: process.env.STRIPE_WEBHOOK_SECRET || undefined,
  testMode: !isProduction(),
};

/**
 * PayGo service configuration
 */
export const paygoServiceConfig: PaymentServiceConfig = {
  name: "PayGo",
  baseUrl: "https://api.paygo.com/v1",
  timeout: 30000,
  retries: 3,
  healthCheckPath: "/health",
  authentication: {
    type: "api_key",
    headerName: "x-api-key",
    envVarName: "PAYGO_API_KEY",
  },
  rateLimit: {
    requestsPerMinute: 60,
    requestsPerHour: 1000,
  },
  features: {
    enabled: true,
    testMode: !isProduction(),
    fallbackEnabled: false,
  },
  endpoints: {
    payments: "/payments",
    refunds: "/refunds",
    webhooks: "/webhooks",
  },
  supportedCurrencies: ["USD"],
  webhookSigningSecret: process.env.PAYGO_WEBHOOK_SECRET || undefined,
  testMode: !isProduction(),
};

// ============================================================================
// LLM SERVICES
// ============================================================================

/**
 * DeepSeek API configuration
 */
export const deepSeekConfig: LLMServiceConfig = {
  name: "DeepSeek",
  baseUrl: "https://api.deepseek.com/v1",
  timeout: 30000,
  retries: 1,
  healthCheckPath: "/models",
  authentication: {
    type: "bearer",
    envVarName: "DEEPSEEK_API_KEY",
  },
  rateLimit: {
    requestsPerMinute: 20,
    requestsPerHour: 500,
  },
  features: {
    enabled: true,
    testMode: false,
    fallbackEnabled: true,
  },
  endpoints: {
    chat: "/chat/completions",
    completions: "/completions",
    embeddings: "/embeddings",
  },
  models: {
    chat: process.env.DEEPSEEK_CHAT_MODEL || "deepseek-chat",
    completion: process.env.DEEPSEEK_COMPLETION_MODEL || "deepseek-coder",
    embedding: process.env.DEEPSEEK_EMBEDDING_MODEL || "deepseek-embedding",
  },
  maxTokens: parseInt(process.env.DEEPSEEK_MAX_TOKENS || "4096"),
  temperature: parseFloat(process.env.DEEPSEEK_TEMPERATURE || "0.7"),
};

/**
 * OpenAI API configuration (backup/alternative)
 */
export const openAIConfig: LLMServiceConfig = {
  name: "OpenAI",
  baseUrl: "https://api.openai.com/v1",
  timeout: 30000,
  retries: 1,
  healthCheckPath: "/models",
  authentication: {
    type: "bearer",
    envVarName: "OPENAI_API_KEY",
  },
  rateLimit: {
    requestsPerMinute: 60,
    requestsPerHour: 1000,
  },
  features: {
    enabled: false, // Disabled by default, DeepSeek is primary
    testMode: false,
    fallbackEnabled: true,
  },
  endpoints: {
    chat: "/chat/completions",
    completions: "/completions",
    embeddings: "/embeddings",
  },
  models: {
    chat: process.env.OPENAI_CHAT_MODEL || "gpt-3.5-turbo",
    completion: process.env.OPENAI_COMPLETION_MODEL || "gpt-3.5-turbo-instruct",
    embedding: process.env.OPENAI_EMBEDDING_MODEL || "text-embedding-ada-002",
  },
  maxTokens: parseInt(process.env.OPENAI_MAX_TOKENS || "4096"),
  temperature: parseFloat(process.env.OPENAI_TEMPERATURE || "0.7"),
};

// ============================================================================
// SERVICE COLLECTIONS
// ============================================================================

/**
 * All flight data services
 */
export const flightDataServices = {
  aviationStack: aviationStackConfig,
  flightAware: flightAwareConfig,
  openSky: openSkyConfig,
} as const;

/**
 * All weather services
 */
export const weatherServices = {
  openWeather: openWeatherConfig,
  googleWeather: googleWeatherConfig,
} as const;

/**
 * All payment services
 */
export const paymentServices = {
  stripe: stripeServiceConfig,
  paygo: paygoServiceConfig,
} as const;

/**
 * All LLM services
 */
export const llmServices = {
  deepSeek: deepSeekConfig,
  openAI: openAIConfig,
} as const;

/**
 * All external services
 */
export const externalServices = {
  flightData: flightDataServices,
  weather: weatherServices,
  payment: paymentServices,
  llm: llmServices,
} as const;

// ============================================================================
// SERVICE UTILITIES
// ============================================================================

/**
 * Gets enabled flight data services
 */
export function getEnabledFlightDataServices(): FlightDataServiceConfig[] {
  return Object.values(flightDataServices).filter(
    (service) => service.features?.enabled,
  );
}

/**
 * Gets enabled weather services
 */
export function getEnabledWeatherServices(): WeatherServiceConfig[] {
  return Object.values(weatherServices).filter(
    (service) => service.features?.enabled,
  );
}

/**
 * Gets enabled payment services
 */
export function getEnabledPaymentServices(): PaymentServiceConfig[] {
  return Object.values(paymentServices).filter(
    (service) => service.features?.enabled,
  );
}

/**
 * Gets enabled LLM services
 */
export function getEnabledLLMServices(): LLMServiceConfig[] {
  return Object.values(llmServices).filter(
    (service) => service.features?.enabled,
  );
}

/**
 * Gets primary service for a given category
 */
export function getPrimaryService<T extends ServiceConfig>(
  services: Record<string, T>,
): T | null {
  const enabledServices = Object.values(services).filter(
    (service) => service.features?.enabled,
  );
  return enabledServices.length > 0 ? enabledServices[0] || null : null;
}

/**
 * Validates service configuration
 */
export function validateServiceConfig(config: ServiceConfig): {
  valid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Validate required fields
  if (!config.name) errors.push("Service name is required");
  if (!config.baseUrl) errors.push("Service base URL is required");
  if (config.timeout < 1000)
    warnings.push("Service timeout is very short (< 1s)");
  if (config.retries < 0) errors.push("Service retries cannot be negative");

  // Validate authentication
  if (
    config.authentication?.envVarName &&
    !process.env[config.authentication.envVarName]
  ) {
    if (isProduction()) {
      errors.push(
        `Missing required environment variable: ${config.authentication.envVarName}`,
      );
    } else {
      warnings.push(
        `Missing environment variable: ${config.authentication.envVarName}`,
      );
    }
  }

  // Validate rate limits
  if (config.rateLimit) {
    if (config.rateLimit.requestsPerMinute <= 0) {
      errors.push("Rate limit requests per minute must be positive");
    }
    if (
      config.rateLimit.requestsPerHour &&
      config.rateLimit.requestsPerHour <= 0
    ) {
      errors.push("Rate limit requests per hour must be positive");
    }
  }

  return { valid: errors.length === 0, errors, warnings };
}

/**
 * Validates all service configurations
 */
export function validateAllServiceConfigs(): {
  valid: boolean;
  errors: string[];
  warnings: string[];
} {
  const allErrors: string[] = [];
  const allWarnings: string[] = [];

  // Validate all services
  const allConfigs = [
    ...Object.values(flightDataServices),
    ...Object.values(weatherServices),
    ...Object.values(paymentServices),
    ...Object.values(llmServices),
  ];

  for (const config of allConfigs) {
    const validation = validateServiceConfig(config);
    allErrors.push(
      ...validation.errors.map((error) => `${config.name}: ${error}`),
    );
    allWarnings.push(
      ...validation.warnings.map((warning) => `${config.name}: ${warning}`),
    );
  }

  return {
    valid: allErrors.length === 0,
    errors: allErrors,
    warnings: allWarnings,
  };
}

// ============================================================================
// SERVICE HEALTH CHECKS
// ============================================================================

/**
 * Service health check configuration
 */
export const serviceHealthCheckConfig = {
  enabled: true,
  interval: 300000, // 5 minutes
  timeout: 10000, // 10 seconds
  retries: 2,
  unhealthyThreshold: 3,
  healthyThreshold: 2,
} as const;

/**
 * Gets health check URL for a service
 */
export function getServiceHealthCheckUrl(config: ServiceConfig): string {
  return `${config.baseUrl}${config.healthCheckPath || "/health"}`;
}

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * Service validation results
 */
export const SERVICE_VALIDATION = validateAllServiceConfigs();

/**
 * Service categories
 */
export const SERVICE_CATEGORIES = [
  "flightData",
  "weather",
  "payment",
  "llm",
] as const;

/**
 * Service types
 */
export const SERVICE_TYPES = {
  FLIGHT_DATA: "flightData",
  WEATHER: "weather",
  PAYMENT: "payment",
  LLM: "llm",
} as const;

// ============================================================================
// LEGACY EXPORTS (for backward compatibility)
// ============================================================================

export {
  externalServices as services,
  flightDataServices as flightServices,
  weatherServices as weather,
  paymentServices as payments,
  llmServices as llm,
};
