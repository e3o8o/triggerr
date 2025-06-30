// ===========================================================================
// API SDK - QUERY PARAMETER UTILITIES
// ===========================================================================

/**
 * Flattens a complex object into query parameters suitable for REST API calls.
 * Handles nested objects, arrays, and various data types.
 */
export function flattenQueryParams(
  params: Record<string, any> | undefined,
): Record<string, string | number | boolean | undefined> | undefined {
  if (!params || Object.keys(params).length === 0) {
    return undefined;
  }

  const result: Record<string, string | number | boolean | undefined> = {};

  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null) {
      continue; // Skip undefined/null values
    }

    if (Array.isArray(value)) {
      // Handle arrays - convert to comma-separated string
      if (value.length > 0) {
        result[key] = value.join(',');
      }
    } else if (typeof value === 'object' && value !== null) {
      // Handle nested objects by flattening with dot notation
      const flattened = flattenNestedObject(value, key);
      Object.assign(result, flattened);
    } else if (
      typeof value === 'string' ||
      typeof value === 'number' ||
      typeof value === 'boolean'
    ) {
      result[key] = value;
    } else {
      // Convert other types to string
      result[key] = String(value);
    }
  }

  return Object.keys(result).length > 0 ? result : undefined;
}

/**
 * Flattens nested objects using dot notation.
 * Example: { user: { name: 'John' } } becomes { 'user.name': 'John' }
 */
function flattenNestedObject(
  obj: Record<string, any>,
  prefix: string,
): Record<string, string | number | boolean> {
  const result: Record<string, string | number | boolean> = {};

  for (const [key, value] of Object.entries(obj)) {
    if (value === undefined || value === null) {
      continue;
    }

    const fullKey = `${prefix}.${key}`;

    if (Array.isArray(value)) {
      if (value.length > 0) {
        result[fullKey] = value.join(',');
      }
    } else if (typeof value === 'object' && value !== null) {
      // Recursively flatten deeper nested objects
      const nested = flattenNestedObject(value, fullKey);
      Object.assign(result, nested);
    } else if (
      typeof value === 'string' ||
      typeof value === 'number' ||
      typeof value === 'boolean'
    ) {
      result[fullKey] = value;
    } else {
      result[fullKey] = String(value);
    }
  }

  return result;
}

/**
 * Converts common API request objects to query parameters.
 * Handles pagination, sorting, filtering patterns commonly used in REST APIs.
 */
export function convertToQueryParams<T extends Record<string, any>>(
  request: T | undefined,
): Record<string, string | number | boolean | undefined> | undefined {
  if (!request) {
    return undefined;
  }

  const flattened = flattenQueryParams(request);

  // Handle common REST API parameter patterns
  if (flattened) {
    // Convert common parameter names to standard REST formats
    const converted: Record<string, string | number | boolean | undefined> = {};

    for (const [key, value] of Object.entries(flattened)) {
      if (value === undefined) continue;

      // Handle pagination parameters
      if (key === 'limit' || key === 'offset' || key === 'page' || key === 'pageSize') {
        converted[key] = Number(value);
      }
      // Handle sorting parameters
      else if (key === 'sortBy' || key === 'sortOrder') {
        converted[key] = String(value);
      }
      // Handle date parameters - ensure they're strings (ISO format)
      else if (key.includes('Date') || key.includes('At') || key.includes('From') || key.includes('To')) {
        converted[key] = String(value);
      }
      // Handle enum parameters
      else if (key === 'status' || key === 'type' || key === 'category' || key === 'tier') {
        converted[key] = String(value);
      }
      // Handle boolean parameters
      else if (typeof value === 'boolean') {
        converted[key] = value;
      }
      // Handle array parameters that were joined as comma-separated strings
      else if (key.includes('Types') || key.includes('Ids') || key.includes('Categories')) {
        converted[key] = String(value); // Already converted to comma-separated
      }
      // Default handling
      else {
        converted[key] = value;
      }
    }

    return Object.keys(converted).length > 0 ? converted : undefined;
  }

  return undefined;
}

/**
 * Type-safe helper for converting pagination requests
 */
export function convertPaginationParams(params: {
  limit?: number;
  offset?: number;
  page?: number;
  pageSize?: number;
}): Record<string, number | undefined> {
  const result: Record<string, number | undefined> = {};

  if (params.limit !== undefined) result.limit = params.limit;
  if (params.offset !== undefined) result.offset = params.offset;
  if (params.page !== undefined) result.page = params.page;
  if (params.pageSize !== undefined) result.pageSize = params.pageSize;

  return result;
}

/**
 * Type-safe helper for converting date range parameters
 */
export function convertDateRangeParams(params: {
  dateFrom?: string;
  dateTo?: string;
  createdAtFrom?: string;
  createdAtTo?: string;
  updatedAtFrom?: string;
  updatedAtTo?: string;
}): Record<string, string | undefined> {
  const result: Record<string, string | undefined> = {};

  if (params.dateFrom) result.dateFrom = params.dateFrom;
  if (params.dateTo) result.dateTo = params.dateTo;
  if (params.createdAtFrom) result.createdAtFrom = params.createdAtFrom;
  if (params.createdAtTo) result.createdAtTo = params.createdAtTo;
  if (params.updatedAtFrom) result.updatedAtFrom = params.updatedAtFrom;
  if (params.updatedAtTo) result.updatedAtTo = params.updatedAtTo;

  return result;
}

/**
 * Utility to remove undefined values from an object
 */
export function removeUndefinedValues<T extends Record<string, any>>(
  obj: T,
): Partial<T> {
  const result: Partial<T> = {};

  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      (result as any)[key] = value;
    }
  }

  return result;
}
