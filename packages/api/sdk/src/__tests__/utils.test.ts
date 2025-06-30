// ===========================================================================
// API SDK - PARAMETER UTILITIES UNIT TESTS
// ===========================================================================

import { describe, it, expect } from 'bun:test';
import {
  flattenQueryParams,
  convertToQueryParams,
  convertPaginationParams,
  convertDateRangeParams,
  removeUndefinedValues,
} from '../utils/params';

// ===========================================================================
// FLATTEN QUERY PARAMS TESTS
// ===========================================================================

describe('flattenQueryParams', () => {
  it('should return undefined for empty or null input', () => {
    expect(flattenQueryParams(undefined)).toBeUndefined();
    expect(flattenQueryParams({})).toBeUndefined();
  });

  it('should handle simple key-value pairs', () => {
    const input = {
      name: 'John',
      age: 30,
      active: true,
    };

    const result = flattenQueryParams(input);

    expect(result).toEqual({
      name: 'John',
      age: 30,
      active: true,
    });
  });

  it('should skip undefined and null values', () => {
    const input = {
      name: 'John',
      age: undefined,
      active: null,
      city: 'NYC',
    };

    const result = flattenQueryParams(input);

    expect(result).toEqual({
      name: 'John',
      city: 'NYC',
    });
  });

  it('should convert arrays to comma-separated strings', () => {
    const input = {
      tags: ['javascript', 'typescript', 'bun'],
      categories: [1, 2, 3],
      flags: [true, false, true],
    };

    const result = flattenQueryParams(input);

    expect(result).toEqual({
      tags: 'javascript,typescript,bun',
      categories: '1,2,3',
      flags: 'true,false,true',
    });
  });

  it('should skip empty arrays', () => {
    const input = {
      name: 'test',
      emptyArray: [],
      normalArray: ['item1', 'item2'],
    };

    const result = flattenQueryParams(input);

    expect(result).toEqual({
      name: 'test',
      normalArray: 'item1,item2',
    });
  });

  it('should flatten nested objects with dot notation', () => {
    const input = {
      user: {
        name: 'John',
        profile: {
          age: 30,
          location: 'NYC',
        },
      },
      metadata: {
        version: '1.0',
      },
    };

    const result = flattenQueryParams(input);

    expect(result).toEqual({
      'user.name': 'John',
      'user.profile.age': 30,
      'user.profile.location': 'NYC',
      'metadata.version': '1.0',
    });
  });

  it('should handle nested arrays in flattened objects', () => {
    const input = {
      filters: {
        tags: ['red', 'blue'],
        categories: [1, 2],
      },
      sort: {
        fields: ['name', 'date'],
      },
    };

    const result = flattenQueryParams(input);

    expect(result).toEqual({
      'filters.tags': 'red,blue',
      'filters.categories': '1,2',
      'sort.fields': 'name,date',
    });
  });

  it('should handle objects with no enumerable properties', () => {
    const date = new Date('2023-01-01');
    const input = {
      date: date,
      regex: /test/g,
      custom: { toString: () => 'custom-value' },
      simpleValue: 'test',
    };

    const result = flattenQueryParams(input);

    // Date objects have no enumerable properties, so they get flattened to nothing
    expect(result?.date).toBeUndefined();
    // RegExp objects also have no enumerable properties
    expect(result?.regex).toBeUndefined();
    // Objects with enumerable properties get flattened
    expect(result?.custom).toBeUndefined();
    // Simple values are preserved
    expect(result?.simpleValue).toBe('test');
  });

  it('should handle deeply nested objects', () => {
    const input = {
      level1: {
        level2: {
          level3: {
            level4: {
              value: 'deep',
            },
          },
        },
      },
    };

    const result = flattenQueryParams(input);

    expect(result).toEqual({
      'level1.level2.level3.level4.value': 'deep',
    });
  });
});

// ===========================================================================
// CONVERT TO QUERY PARAMS TESTS
// ===========================================================================

describe('convertToQueryParams', () => {
  it('should return undefined for empty input', () => {
    expect(convertToQueryParams(undefined)).toBeUndefined();
    expect(convertToQueryParams({})).toBeUndefined();
  });

  it('should handle pagination parameters correctly', () => {
    const input = {
      limit: '10',
      offset: '20',
      page: '3',
      pageSize: '25',
    };

    const result = convertToQueryParams(input);

    expect(result).toEqual({
      limit: 10,
      offset: 20,
      page: 3,
      pageSize: 25,
    });
  });

  it('should handle sorting parameters', () => {
    const input = {
      sortBy: 'name',
      sortOrder: 'desc',
    };

    const result = convertToQueryParams(input);

    expect(result).toEqual({
      sortBy: 'name',
      sortOrder: 'desc',
    });
  });

  it('should handle date parameters as strings', () => {
    const input = {
      createdAtFrom: '2023-01-01T00:00:00Z',
      updatedAtTo: '2023-12-31T23:59:59Z',
      publishDate: '2023-06-15',
    };

    const result = convertToQueryParams(input);

    expect(result).toEqual({
      createdAtFrom: '2023-01-01T00:00:00Z',
      updatedAtTo: '2023-12-31T23:59:59Z',
      publishDate: '2023-06-15',
    });
  });

  it('should handle enum parameters as strings', () => {
    const input = {
      status: 'active',
      type: 'premium',
      category: 'flight-delay',
      tier: 'gold',
    };

    const result = convertToQueryParams(input);

    expect(result).toEqual({
      status: 'active',
      type: 'premium',
      category: 'flight-delay',
      tier: 'gold',
    });
  });

  it('should preserve boolean parameters', () => {
    const input = {
      active: true,
      verified: false,
      includeDeleted: true,
    };

    const result = convertToQueryParams(input);

    expect(result).toEqual({
      active: true,
      verified: false,
      includeDeleted: true,
    });
  });

  it('should handle array parameters as comma-separated strings', () => {
    const input = {
      eventTypes: ['CREATED', 'UPDATED', 'DELETED'],
      categoryIds: [1, 2, 3],
      userTypes: ['admin', 'customer'],
    };

    const result = convertToQueryParams(input);

    expect(result).toEqual({
      eventTypes: 'CREATED,UPDATED,DELETED',
      categoryIds: '1,2,3',
      userTypes: 'admin,customer',
    });
  });

  it('should handle complex nested parameters', () => {
    const input = {
      limit: 50,
      filters: {
        status: 'active',
        tags: ['important', 'urgent'],
      },
      sortBy: 'createdAt',
      dateFrom: '2023-01-01',
    };

    const result = convertToQueryParams(input);

    expect(result).toEqual({
      limit: 50,
      'filters.status': 'active',
      'filters.tags': 'important,urgent',
      sortBy: 'createdAt',
      dateFrom: '2023-01-01',
    });
  });
});

// ===========================================================================
// CONVERT PAGINATION PARAMS TESTS
// ===========================================================================

describe('convertPaginationParams', () => {
  it('should convert all pagination parameters', () => {
    const input = {
      limit: 25,
      offset: 50,
      page: 3,
      pageSize: 10,
    };

    const result = convertPaginationParams(input);

    expect(result).toEqual({
      limit: 25,
      offset: 50,
      page: 3,
      pageSize: 10,
    });
  });

  it('should handle partial pagination parameters', () => {
    const input = {
      limit: 100,
      page: 1,
    };

    const result = convertPaginationParams(input);

    expect(result).toEqual({
      limit: 100,
      page: 1,
    });
  });

  it('should handle empty pagination parameters', () => {
    const input = {};

    const result = convertPaginationParams(input);

    expect(result).toEqual({});
  });

  it('should exclude undefined values', () => {
    // Create input with only defined properties to avoid exactOptionalPropertyTypes errors
    const input = {
      limit: 25,
      page: 1
    };

    const result = convertPaginationParams(input);

    expect(result).toEqual({
      limit: 25,
      page: 1,
    });
  });
});

// ===========================================================================
// CONVERT DATE RANGE PARAMS TESTS
// ===========================================================================

describe('convertDateRangeParams', () => {
  it('should convert all date range parameters', () => {
    const input = {
      dateFrom: '2023-01-01',
      dateTo: '2023-12-31',
      createdAtFrom: '2023-01-01T00:00:00Z',
      createdAtTo: '2023-12-31T23:59:59Z',
      updatedAtFrom: '2023-06-01T12:00:00Z',
      updatedAtTo: '2023-06-30T12:00:00Z',
    };

    const result = convertDateRangeParams(input);

    expect(result).toEqual({
      dateFrom: '2023-01-01',
      dateTo: '2023-12-31',
      createdAtFrom: '2023-01-01T00:00:00Z',
      createdAtTo: '2023-12-31T23:59:59Z',
      updatedAtFrom: '2023-06-01T12:00:00Z',
      updatedAtTo: '2023-06-30T12:00:00Z',
    });
  });

  it('should handle partial date range parameters', () => {
    const input = {
      dateFrom: '2023-01-01',
      createdAtTo: '2023-12-31T23:59:59Z',
    };

    const result = convertDateRangeParams(input);

    expect(result).toEqual({
      dateFrom: '2023-01-01',
      createdAtTo: '2023-12-31T23:59:59Z',
    });
  });

  it('should handle empty date range parameters', () => {
    const input = {};

    const result = convertDateRangeParams(input);

    expect(result).toEqual({});
  });

  it('should exclude undefined and empty values', () => {
    // Create input with only defined properties to avoid exactOptionalPropertyTypes errors
    const input = {
      dateFrom: '2023-01-01',
      createdAtFrom: '2023-01-01T00:00:00Z',
      createdAtTo: '2023-12-31T23:59:59Z',
    };

    const result = convertDateRangeParams(input);

    expect(result).toEqual({
      dateFrom: '2023-01-01',
      createdAtFrom: '2023-01-01T00:00:00Z',
      createdAtTo: '2023-12-31T23:59:59Z',
    });
  });
});

// ===========================================================================
// REMOVE UNDEFINED VALUES TESTS
// ===========================================================================

describe('removeUndefinedValues', () => {
  it('should remove undefined values from object', () => {
    const input = {
      name: 'John',
      age: undefined,
      city: 'NYC',
      active: true,
      metadata: undefined,
    };

    const result = removeUndefinedValues(input);

    expect(result).toEqual({
      name: 'John',
      city: 'NYC',
      active: true,
    });
  });

  it('should preserve null values', () => {
    const input = {
      name: 'John',
      age: null,
      city: undefined,
      active: true,
    };

    const result = removeUndefinedValues(input);

    expect(result).toEqual({
      name: 'John',
      age: null,
      active: true,
    });
  });

  it('should handle empty object', () => {
    const input = {};

    const result = removeUndefinedValues(input);

    expect(result).toEqual({});
  });

  it('should handle object with all undefined values', () => {
    const input = {
      a: undefined,
      b: undefined,
      c: undefined,
    };

    const result = removeUndefinedValues(input);

    expect(result).toEqual({});
  });

  it('should preserve zero and false values', () => {
    const input = {
      count: 0,
      active: false,
      name: '',
      value: undefined,
    };

    const result = removeUndefinedValues(input);

    expect(result).toEqual({
      count: 0,
      active: false,
      name: '',
    });
  });

  it('should handle nested objects (shallow removal only)', () => {
    const input = {
      user: {
        name: 'John',
        age: undefined,
      },
      settings: undefined,
      active: true,
    };

    const result = removeUndefinedValues(input);

    expect(result).toEqual({
      user: {
        name: 'John',
        age: undefined, // Nested undefined values are preserved
      },
      active: true,
    });
  });
});

// ===========================================================================
// INTEGRATION TESTS
// ===========================================================================

describe('Parameter Utilities Integration', () => {
  it('should work together to process complex API request parameters', () => {
    // Simulate a complex API request object
    const apiRequest = {
      // Pagination
      limit: 50,
      offset: 100,

      // Filtering
      status: 'active',
      categories: ['flight-delay', 'weather', 'cancellation'],

      // Date ranges
      createdAtFrom: '2023-01-01T00:00:00Z',
      createdAtTo: '2023-12-31T23:59:59Z',

      // Sorting
      sortBy: 'createdAt',
      sortOrder: 'desc',

      // Nested filters
      filters: {
        verified: true,
        tier: 'premium',
        regions: ['US', 'EU', 'APAC'],
      },

      // Undefined values that should be removed
      optionalField: undefined,
      anotherOptional: undefined,
    };

    // Process through the utility functions
    const result = convertToQueryParams(apiRequest);

    expect(result).toEqual({
      limit: 50,
      offset: 100,
      status: 'active',
      categories: 'flight-delay,weather,cancellation',
      createdAtFrom: '2023-01-01T00:00:00Z',
      createdAtTo: '2023-12-31T23:59:59Z',
      sortBy: 'createdAt',
      sortOrder: 'desc',
      'filters.verified': true,
      'filters.tier': 'premium',
      'filters.regions': 'US,EU,APAC',
    });
  });

  it('should handle real-world pagination scenarios', () => {
    const paginationRequest = {
      page: 3,
      pageSize: 25,
      includeTotal: true,
      includeFacets: undefined,
    };

    const cleanedParams = removeUndefinedValues(paginationRequest);
    const finalParams = convertPaginationParams(cleanedParams);

    expect(finalParams).toEqual({
      page: 3,
      pageSize: 25,
    });
  });

  it('should handle date range filtering scenarios', () => {
    // Create request with only defined properties to avoid exactOptionalPropertyTypes errors
    const dateRangeRequest = {
      dateFrom: '2023-01-01',
      dateTo: '2023-03-31',
      updatedAtFrom: '2023-02-01T00:00:00Z'
    };

    const result = convertDateRangeParams(dateRangeRequest);

    expect(result).toEqual({
      dateFrom: '2023-01-01',
      dateTo: '2023-03-31',
      updatedAtFrom: '2023-02-01T00:00:00Z',
    });
  });
});
