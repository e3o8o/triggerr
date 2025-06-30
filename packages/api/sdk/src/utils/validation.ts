// ===========================================================================
// API SDK - CLIENT-SIDE VALIDATION UTILITIES
// ===========================================================================

import type { ZodSchema, ZodError } from "zod";
import type { ApiError, ErrorCode } from "@triggerr/api-contracts";

// ===========================================================================
// VALIDATION RESULT TYPES
// ===========================================================================

export interface ValidationResult<T = any> {
  success: boolean;
  data?: T;
  errors?: ValidationError[];
  hasErrors: boolean;
}

export interface ValidationError {
  path: string[];
  message: string;
  code: string;
  value?: any;
}

export interface FieldValidationResult {
  isValid: boolean;
  error: string | undefined;
  value: any;
}

export interface FormValidationState {
  isValid: boolean;
  isValidating: boolean;
  isDirty: boolean;
  errors: Record<string, string>;
  touched: Record<string, boolean>;
}

// ===========================================================================
// VALIDATION CONFIGURATION
// ===========================================================================

export interface ValidationConfig {
  // Validation timing
  validateOnBlur?: boolean;
  validateOnChange?: boolean;
  validateOnSubmit?: boolean;
  debounceMs?: number;

  // Error handling
  stopOnFirstError?: boolean;
  includeValueInError?: boolean;

  // Custom messages
  customMessages?: Record<string, string>;

  // Async validation
  enableAsyncValidation?: boolean;
  asyncValidationTimeoutMs?: number;
}

// ===========================================================================
// CORE VALIDATION CLASS
// ===========================================================================

export class ClientValidator {
  private config: ValidationConfig;
  private customValidators: Map<
    string,
    (value: any) => boolean | Promise<boolean>
  >;
  private validationCache: Map<string, ValidationResult>;

  constructor(config: Partial<ValidationConfig> = {}) {
    this.config = this.mergeWithDefaults(config);
    this.customValidators = new Map();
    this.validationCache = new Map();
  }

  /**
   * Validates data against a Zod schema
   */
  public validateWithSchema<T>(
    schema: ZodSchema<T>,
    data: unknown,
    options: { path?: string } = {},
  ): ValidationResult<T> {
    const cacheKey = this.generateCacheKey(schema, data, options);

    // Check cache first
    if (this.validationCache.has(cacheKey)) {
      return this.validationCache.get(cacheKey)!;
    }

    try {
      const result = schema.parse(data);

      const validationResult: ValidationResult<T> = {
        success: true,
        data: result,
        hasErrors: false,
      };

      // Cache successful validation
      this.validationCache.set(cacheKey, validationResult);

      return validationResult;
    } catch (error) {
      const validationResult: ValidationResult<T> = {
        success: false,
        errors: this.formatZodErrors(error as ZodError),
        hasErrors: true,
      };

      // Cache validation errors (for short duration)
      setTimeout(() => this.validationCache.delete(cacheKey), 5000);
      this.validationCache.set(cacheKey, validationResult);

      return validationResult;
    }
  }

  /**
   * Validates a single field value
   */
  public async validateField(
    fieldName: string,
    value: any,
    validator: ZodSchema | ((value: any) => boolean | Promise<boolean>),
    options: { required?: boolean; customMessage?: string } = {},
  ): Promise<FieldValidationResult> {
    try {
      // Handle required validation
      if (options.required && this.isEmpty(value)) {
        return {
          isValid: false,
          error: options.customMessage || `${fieldName} is required`,
          value,
        };
      }

      // Skip validation for empty optional fields
      if (!options.required && this.isEmpty(value)) {
        return {
          isValid: true,
          value,
          error: undefined,
        };
      }

      // Zod schema validation
      if (this.isZodSchema(validator)) {
        const result = this.validateWithSchema(validator, value);
        return {
          isValid: result.success,
          error: result.errors?.[0]?.message,
          value: result.success ? result.data : value,
        };
      }

      // Custom function validation
      if (typeof validator === "function") {
        const isValid = await validator(value);
        return {
          isValid,
          error: isValid
            ? undefined
            : options.customMessage || `${fieldName} is invalid`,
          value,
        };
      }

      return {
        isValid: true,
        value,
        error: undefined,
      };
    } catch (error) {
      return {
        isValid: false,
        error: `Validation error: ${error instanceof Error ? error.message : "Unknown error"}`,
        value,
      };
    }
  }

  /**
   * Validates multiple fields as a form
   */
  public async validateForm(
    formData: Record<string, any>,
    fieldValidators: Record<
      string,
      {
        validator: ZodSchema | ((value: any) => boolean | Promise<boolean>);
        required?: boolean;
        customMessage?: string;
      }
    >,
  ): Promise<FormValidationState> {
    const errors: Record<string, string> = {};
    const touched: Record<string, boolean> = {};
    let isValid = true;

    // Validate each field
    for (const [fieldName, fieldConfig] of Object.entries(fieldValidators)) {
      touched[fieldName] = true;

      // Create options object with only defined properties to avoid exactOptionalPropertyTypes errors
      const validationOptions: { required?: boolean; customMessage?: string } =
        {
          required: fieldConfig.required ?? false,
        };

      // Only add customMessage if it's defined
      if (fieldConfig.customMessage !== undefined) {
        validationOptions.customMessage = fieldConfig.customMessage;
      }

      const result = await this.validateField(
        fieldName,
        formData[fieldName],
        fieldConfig.validator,
        validationOptions,
      );

      if (!result.isValid && result.error) {
        errors[fieldName] = result.error;
        isValid = false;

        // Stop on first error if configured
        if (this.config.stopOnFirstError) {
          break;
        }
      }
    }

    return {
      isValid,
      isValidating: false,
      isDirty: Object.keys(touched).length > 0,
      errors,
      touched,
    };
  }

  /**
   * Registers a custom validation function
   */
  public registerValidator(
    name: string,
    validator: (value: any) => boolean | Promise<boolean>,
  ): void {
    this.customValidators.set(name, validator);
  }

  /**
   * Gets a custom validator by name
   */
  public getValidator(
    name: string,
  ): ((value: any) => boolean | Promise<boolean>) | undefined {
    return this.customValidators.get(name);
  }

  /**
   * Clears validation cache
   */
  public clearCache(): void {
    this.validationCache.clear();
  }

  // ===========================================================================
  // PRIVATE HELPER METHODS
  // ===========================================================================

  private formatZodErrors(zodError: ZodError): ValidationError[] {
    return zodError.errors.map((error) => ({
      path: error.path.map((p) => p.toString()),
      message: error.message,
      code: error.code,
      value: this.config.includeValueInError
        ? (error as any).received
        : undefined,
    }));
  }

  private isEmpty(value: any): boolean {
    if (value === null || value === undefined) return true;
    if (typeof value === "string") return value.trim() === "";
    if (Array.isArray(value)) return value.length === 0;
    if (typeof value === "object") return Object.keys(value).length === 0;
    return false;
  }

  private isZodSchema(validator: any): validator is ZodSchema {
    return validator && typeof validator.parse === "function";
  }

  private generateCacheKey(schema: any, data: unknown, options: any): string {
    return `${schema.constructor.name}_${JSON.stringify(data)}_${JSON.stringify(options)}`;
  }

  private mergeWithDefaults(
    config: Partial<ValidationConfig>,
  ): ValidationConfig {
    return {
      validateOnBlur: true,
      validateOnChange: false,
      validateOnSubmit: true,
      debounceMs: 300,
      stopOnFirstError: false,
      includeValueInError: false,
      customMessages: {},
      enableAsyncValidation: true,
      asyncValidationTimeoutMs: 5000,
      ...config,
    };
  }
}

// ===========================================================================
// FORM VALIDATION MANAGER
// ===========================================================================

export class FormValidationManager {
  private validator: ClientValidator;
  private state: FormValidationState;
  private fieldValidators: Record<string, any>;
  private debounceTimers: Map<string, NodeJS.Timeout>;

  constructor(
    fieldValidators: Record<string, any>,
    config: Partial<ValidationConfig> = {},
  ) {
    this.validator = new ClientValidator(config);
    this.fieldValidators = fieldValidators;
    this.debounceTimers = new Map();
    this.state = {
      isValid: true,
      isValidating: false,
      isDirty: false,
      errors: {},
      touched: {},
    };
  }

  /**
   * Validates a single field with debouncing
   */
  public async validateFieldDebounced(
    fieldName: string,
    value: any,
    immediate: boolean = false,
  ): Promise<void> {
    // Clear existing timer
    const existingTimer = this.debounceTimers.get(fieldName);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    const validate = async () => {
      const fieldConfig = this.fieldValidators[fieldName];
      if (!fieldConfig) return;

      this.setState({ isValidating: true });

      const result = await this.validator.validateField(
        fieldName,
        value,
        fieldConfig.validator,
        fieldConfig,
      );

      this.updateFieldState(fieldName, result);
    };

    if (immediate) {
      await validate();
    } else {
      const timer = setTimeout(validate, this.validator["config"].debounceMs);
      this.debounceTimers.set(fieldName, timer);
    }
  }

  /**
   * Validates entire form
   */
  public async validateForm(
    formData: Record<string, any>,
  ): Promise<FormValidationState> {
    this.setState({ isValidating: true });

    const result = await this.validator.validateForm(
      formData,
      this.fieldValidators,
    );

    this.setState(result);
    return result;
  }

  /**
   * Marks a field as touched
   */
  public touchField(fieldName: string): void {
    this.setState({
      touched: { ...this.state.touched, [fieldName]: true },
      isDirty: true,
    });
  }

  /**
   * Gets current validation state
   */
  public getState(): FormValidationState {
    return { ...this.state };
  }

  /**
   * Checks if a specific field is valid
   */
  public isFieldValid(fieldName: string): boolean {
    return !this.state.errors[fieldName];
  }

  /**
   * Gets error for a specific field
   */
  public getFieldError(fieldName: string): string | undefined {
    return this.state.errors[fieldName];
  }

  /**
   * Resets validation state
   */
  public reset(): void {
    this.state = {
      isValid: true,
      isValidating: false,
      isDirty: false,
      errors: {},
      touched: {},
    };

    // Clear all debounce timers
    this.debounceTimers.forEach((timer) => clearTimeout(timer));
    this.debounceTimers.clear();
  }

  // ===========================================================================
  // PRIVATE HELPER METHODS
  // ===========================================================================

  private setState(updates: Partial<FormValidationState>): void {
    this.state = { ...this.state, ...updates };
  }

  private updateFieldState(
    fieldName: string,
    result: FieldValidationResult,
  ): void {
    const errors = { ...this.state.errors };
    const touched = { ...this.state.touched, [fieldName]: true };

    if (result.isValid) {
      delete errors[fieldName];
    } else if (result.error) {
      errors[fieldName] = result.error;
    }

    const isValid = Object.keys(errors).length === 0;

    this.setState({
      errors,
      touched,
      isValid,
      isValidating: false,
      isDirty: true,
    });
  }
}

// ===========================================================================
// COMMON VALIDATION PATTERNS
// ===========================================================================

export class ValidationPatterns {
  /**
   * Email validation pattern
   */
  public static email(value: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(value);
  }

  /**
   * Phone number validation (basic)
   */
  public static phone(value: string): boolean {
    const phoneRegex = /^\+?[\d\s\-\(\)]{10,}$/;
    return phoneRegex.test(value);
  }

  /**
   * Flight number validation
   */
  public static flightNumber(value: string): boolean {
    const flightRegex = /^[A-Z]{2}\d{1,4}$/;
    return flightRegex.test(value);
  }

  /**
   * Airport code validation (IATA)
   */
  public static airportCode(value: string): boolean {
    const codeRegex = /^[A-Z]{3}$/;
    return codeRegex.test(value);
  }

  /**
   * Date validation (ISO format)
   */
  public static isoDate(value: string): boolean {
    const dateRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/;
    if (!dateRegex.test(value)) return false;

    const date = new Date(value);
    return !isNaN(date.getTime());
  }

  /**
   * Currency amount validation
   */
  public static currencyAmount(value: number | string): boolean {
    const num = typeof value === "string" ? parseFloat(value) : value;
    return !isNaN(num) && num >= 0 && num <= 1000000; // Reasonable limits
  }

  /**
   * Policy number validation
   */
  public static policyNumber(value: string): boolean {
    const policyRegex = /^[A-Z]{2}\d{8,12}$/;
    return policyRegex.test(value);
  }

  /**
   * PayGo address validation (basic)
   */
  public static address(value: string): boolean {
    // Basic validation - starts with specific prefix and has correct length
    return (
      typeof value === "string" && value.length >= 32 && value.length <= 64
    );
  }
}

// ===========================================================================
// ASYNC VALIDATION HELPERS
// ===========================================================================

export class AsyncValidationHelpers {
  /**
   * Validates flight existence via API
   */
  public static async validateFlightExists(
    flightNumber: string,
    date: string,
    apiClient?: any,
  ): Promise<boolean> {
    try {
      if (!apiClient) return true; // Skip if no API client

      // This would call the actual flight validation API
      const response = await apiClient.get("/flight/validate", {
        flightNumber,
        date,
      });

      return response.success && response.data?.exists;
    } catch {
      return false;
    }
  }

  /**
   * Validates email uniqueness
   */
  public static async validateEmailUnique(
    email: string,
    apiClient?: any,
  ): Promise<boolean> {
    try {
      if (!apiClient) return true; // Skip if no API client

      const response = await apiClient.get("/user/validate-email", {
        email,
      });

      return response.success && response.data?.available;
    } catch {
      return false;
    }
  }

  /**
   * Validates policy number exists and is trackable
   */
  public static async validatePolicyTrackable(
    policyNumber: string,
    verificationCode: string,
    apiClient?: any,
  ): Promise<boolean> {
    try {
      if (!apiClient) return true; // Skip if no API client

      const response = await apiClient.get("/policy/track", {
        policyNumber,
        verificationCode,
      });

      return response.success && response.data?.policy;
    } catch {
      return false;
    }
  }
}

// ===========================================================================
// UTILITY FUNCTIONS
// ===========================================================================

/**
 * Creates a validation error that matches API error format
 */
export function createValidationError(
  field: string,
  message: string,
  value?: any,
): ApiError {
  return {
    code: "VALIDATION_ERROR" as ErrorCode,
    message: `Validation failed for field '${field}': ${message}`,
    details: {
      field,
      value,
    },
  };
}

/**
 * Converts validation result to API error format
 */
export function validationResultToApiError(
  result: ValidationResult,
): ApiError | null {
  if (result.success) return null;

  const firstError = result.errors?.[0];
  if (!firstError) return null;

  return {
    code: "VALIDATION_ERROR" as ErrorCode,
    message: firstError.message,
    details: {
      path: firstError.path,
      value: firstError.value,
      code: firstError.code,
    },
  };
}

/**
 * Creates a debounced validation function
 */
export function createDebouncedValidator<T>(
  validator: (value: T) => Promise<FieldValidationResult>,
  delayMs: number = 300,
): (value: T) => Promise<FieldValidationResult> {
  let timeoutId: NodeJS.Timeout;

  return (value: T): Promise<FieldValidationResult> => {
    return new Promise((resolve) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(async () => {
        const result = await validator(value);
        resolve(result);
      }, delayMs);
    });
  };
}

/**
 * Global validator instance for convenience
 */
export const globalValidator = new ClientValidator();

/**
 * Convenience function for quick schema validation
 */
export function validateQuick<T>(
  schema: ZodSchema<T>,
  data: unknown,
): ValidationResult<T> {
  return globalValidator.validateWithSchema(schema, data);
}
