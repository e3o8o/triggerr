// ===========================================================================
// API SDK - UTILITIES INDEX
// ===========================================================================

// Query parameter utilities
export * from './params';
// Cache utilities
export * from './cache';
// Serialization utilities
export * from './serialization';
// Logger utilities
export * from './logger';
// Validation utilities
export * from './validation';

// Re-export specific utilities for convenience
export {
  flattenQueryParams,
  convertToQueryParams,
  convertPaginationParams,
  convertDateRangeParams,
  removeUndefinedValues,
} from './params';

// Re-export cache utilities
export {
  createInMemoryCache,
  CacheFactory,
} from './cache';

// Re-export serialization utilities
export {
  serializer,
  serializeToJson,
  deserializeFromJson,
  safeParseJson,
  objectToFormData,
  formDataToObject,
} from './serialization';

// Re-export logger utilities
export {
  createLogger,
  createErrorOnlyLogger,
  createSilentLogger,
} from './logger';

// Re-export validation utilities
export {
  ClientValidator,
  FormValidationManager,
  ValidationPatterns,
  AsyncValidationHelpers,
  createValidationError,
  validationResultToApiError,
  createDebouncedValidator
} from './validation';
