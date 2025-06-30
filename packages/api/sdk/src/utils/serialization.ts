// ===========================================================================
// API SDK - SERIALIZATION UTILITY
// ===========================================================================

import { SerializationError } from '../types/errors';

// ===========================================================================
// SERIALIZATION TYPES
// ===========================================================================

export type SerializationFormat = 'json' | 'text' | 'binary' | 'form-data';

export interface SerializationOptions {
  /**
   * The format to serialize/deserialize to/from
   * @default 'json'
   */
  format?: SerializationFormat;

  /**
   * Custom content type header value (overrides default for format)
   */
  contentType?: string;

  /**
   * Whether to handle dates specially during JSON serialization
   * If true, Date objects are converted to ISO strings
   * @default true
   */
  handleDates?: boolean;

  /**
   * Whether to include undefined values in serialized output
   * @default false
   */
  includeUndefined?: boolean;

  /**
   * Whether to throw errors on circular references in JSON
   * @default true
   */
  errorOnCircular?: boolean;
}

export interface SerializationResult<T = any> {
  /**
   * The serialized or deserialized data
   */
  data: T;

  /**
   * The content type of the serialized data
   */
  contentType: string;

  /**
   * The format that was used for serialization
   */
  format: SerializationFormat;
}

// ===========================================================================
// SERIALIZATION IMPLEMENTATION
// ===========================================================================

/**
 * Serializer class for handling different data formats
 */
export class Serializer {
  private defaultOptions: SerializationOptions = {
    format: 'json',
    handleDates: true,
    includeUndefined: false,
    errorOnCircular: true,
  };

  /**
   * Serializes data to the specified format
   */
  public serialize<T>(data: T, options?: SerializationOptions): SerializationResult {
    const opts = { ...this.defaultOptions, ...options };
    const format = opts.format || 'json';

    try {
      switch (format) {
        case 'json':
          return this.serializeJson(data, opts);
        case 'text':
          return this.serializeText(data, opts);
        case 'binary':
          return this.serializeBinary(data, opts);
        case 'form-data':
          return this.serializeFormData(data, opts);
        default:
          throw new SerializationError(
            `Unsupported serialization format: ${format}`,
            'serialize',
            typeof data
          );
      }
    } catch (error) {
      if (error instanceof SerializationError) {
        throw error;
      }
      throw new SerializationError(
        `Serialization failed: ${error instanceof Error ? error.message : String(error)}`,
        'serialize',
        typeof data
      );
    }
  }

  /**
   * Deserializes data from the specified format
   */
  public deserialize<T>(
    data: string | ArrayBuffer | FormData | Blob,
    options?: SerializationOptions
  ): SerializationResult<T> {
    const opts = { ...this.defaultOptions, ...options };
    const format = opts.format || 'json';

    try {
      switch (format) {
        case 'json':
          return this.deserializeJson<T>(data as string, opts);
        case 'text':
          return this.deserializeText<T>(data as string, opts);
        case 'binary':
          return this.deserializeBinary<T>(data as ArrayBuffer | Blob, opts);
        case 'form-data':
          return this.deserializeFormData<T>(data as FormData, opts);
        default:
          throw new SerializationError(
            `Unsupported deserialization format: ${format}`,
            'deserialize',
            typeof data
          );
      }
    } catch (error) {
      if (error instanceof SerializationError) {
        throw error;
      }
      throw new SerializationError(
        `Deserialization failed: ${error instanceof Error ? error.message : String(error)}`,
        'deserialize',
        typeof data
      );
    }
  }

  // ===========================================================================
  // PRIVATE SERIALIZATION METHODS
  // ===========================================================================

  /**
   * Serializes data to JSON
   */
  private serializeJson<T>(data: T, options: SerializationOptions): SerializationResult {
    try {
      let serialized: string;

      if (options.handleDates) {
        // Use replacer function to handle dates
        serialized = JSON.stringify(data, (_key, value) => {
          // Skip undefined values if configured
          if (!options.includeUndefined && value === undefined) {
            return undefined;
          }

          // Convert dates to ISO strings
          if (value instanceof Date) {
            return value.toISOString();
          }

          return value;
        });
      } else {
        // Standard JSON serialization
        serialized = JSON.stringify(data);
      }

      return {
        data: serialized,
        contentType: options.contentType || 'application/json',
        format: 'json',
      };
    } catch (error) {
      if (error instanceof Error && error.message.includes('circular')) {
        throw new SerializationError(
          'Circular reference detected during JSON serialization',
          'serialize',
          typeof data
        );
      }
      throw error;
    }
  }

  /**
   * Deserializes JSON data
   */
  private deserializeJson<T>(data: string, options: SerializationOptions): SerializationResult<T> {
    try {
      const parsed = JSON.parse(data);
      return {
        data: parsed as T,
        contentType: options.contentType || 'application/json',
        format: 'json',
      };
    } catch (error) {
      throw new SerializationError(
        `Invalid JSON: ${error instanceof Error ? error.message : String(error)}`,
        'deserialize',
        'string'
      );
    }
  }

  /**
   * Serializes data to plain text
   */
  private serializeText<T>(data: T, options: SerializationOptions): SerializationResult {
    let serialized: string;

    if (typeof data === 'string') {
      serialized = data;
    } else if (data === null || data === undefined) {
      serialized = '';
    } else {
      serialized = String(data);
    }

    return {
      data: serialized,
      contentType: options.contentType || 'text/plain',
      format: 'text',
    };
  }

  /**
   * Deserializes plain text data
   */
  private deserializeText<T>(data: string, options: SerializationOptions): SerializationResult<T> {
    return {
      data: data as unknown as T,
      contentType: options.contentType || 'text/plain',
      format: 'text',
    };
  }

  /**
   * Serializes data to binary format
   */
  private serializeBinary<T>(data: T, options: SerializationOptions): SerializationResult {
    let binary: ArrayBuffer | Blob;

    if (data instanceof ArrayBuffer || data instanceof Blob) {
      binary = data;
    } else if (typeof data === 'string') {
      // Convert string to ArrayBuffer
      const encoder = new TextEncoder();
      binary = encoder.encode(data).buffer as ArrayBuffer;
    } else {
      // Try to convert to JSON first, then to ArrayBuffer
      const jsonString = JSON.stringify(data);
      const encoder = new TextEncoder();
      binary = encoder.encode(jsonString).buffer as ArrayBuffer;
    }

    return {
      data: binary,
      contentType: options.contentType || 'application/octet-stream',
      format: 'binary',
    };
  }

  /**
   * Deserializes binary data
   */
  private deserializeBinary<T>(
    data: ArrayBuffer | Blob,
    options: SerializationOptions
  ): SerializationResult<T> {
    // For binary data, we just pass it through
    // The caller is responsible for handling the specific binary format
    return {
      data: data as unknown as T,
      contentType: options.contentType || 'application/octet-stream',
      format: 'binary',
    };
  }

  /**
   * Serializes data to FormData
   */
  private serializeFormData<T>(data: T, options: SerializationOptions): SerializationResult {
    if (data instanceof FormData) {
      return {
        data,
        contentType: options.contentType || 'multipart/form-data',
        format: 'form-data',
      };
    }

    if (typeof data !== 'object' || data === null) {
      throw new SerializationError(
        'FormData serialization requires an object',
        'serialize',
        typeof data
      );
    }

    const formData = new FormData();

    // Append each property to the FormData
    for (const [key, value] of Object.entries(data)) {
      if (value === undefined && !options.includeUndefined) {
        continue;
      }

      if (value instanceof File || value instanceof Blob) {
        formData.append(key, value);
      } else if (Array.isArray(value)) {
        value.forEach((item, index) => {
          const arrayKey = `${key}[${index}]`;
          if (item instanceof File || item instanceof Blob) {
            formData.append(arrayKey, item);
          } else {
            formData.append(arrayKey, String(item));
          }
        });
      } else if (value instanceof Date) {
        formData.append(key, options.handleDates ? value.toISOString() : value.toString());
      } else if (value === null) {
        formData.append(key, '');
      } else if (typeof value === 'object') {
        formData.append(key, JSON.stringify(value));
      } else {
        formData.append(key, String(value));
      }
    }

    return {
      data: formData,
      contentType: options.contentType || 'multipart/form-data',
      format: 'form-data',
    };
  }

  /**
   * Deserializes FormData
   */
  private deserializeFormData<T>(
    data: FormData,
    options: SerializationOptions
  ): SerializationResult<T> {
    const result: Record<string, any> = {};

    // Safely iterate through FormData entries
    // Using a more compatible approach since FormData.entries() might not be recognized by TypeScript
    const keys = new Set<string>();

    // Get all keys first
    data.forEach((_, key) => {
      keys.add(key);
    });

    // Process each key and its value
    keys.forEach(key => {
      const value = data.get(key);

      if (typeof value === 'string') {
        // Try to parse as JSON if it looks like a JSON object or array
        if ((value.startsWith('{') && value.endsWith('}')) ||
            (value.startsWith('[') && value.endsWith(']'))) {
          try {
            result[key] = JSON.parse(value);
            return; // Skip the rest of processing for this key
          } catch {
            // If parsing fails, treat as a regular string
          }
        }

        // Handle empty strings
        if (value === '') {
          result[key] = null;
          return; // Skip the rest of processing for this key
        }

        // Handle numbers
        if (/^-?\d+(\.\d+)?$/.test(value)) {
          result[key] = Number(value);
          return; // Skip the rest of processing for this key
        }

        // Handle booleans
        if (value === 'true' || value === 'false') {
          result[key] = value === 'true';
          return; // Skip the rest of processing for this key
        }

        // Default to string
        result[key] = value;
      } else {
        // File, Blob, or other non-string value
        result[key] = value;
      }
    });

    return {
      data: result as T,
      contentType: options.contentType || 'multipart/form-data',
      format: 'form-data',
    };
  }
}

// ===========================================================================
// UTILITY FUNCTIONS
// ===========================================================================

/**
 * The default serializer instance
 */
export const serializer = new Serializer();

/**
 * Serializes data to JSON
 */
export function serializeToJson<T>(
  data: T,
  options?: Omit<SerializationOptions, 'format'>
): string {
  const result = serializer.serialize(data, { ...options, format: 'json' });
  return result.data as string;
}

/**
 * Deserializes JSON data
 */
export function deserializeFromJson<T>(
  json: string,
  options?: Omit<SerializationOptions, 'format'>
): T {
  const result = serializer.deserialize<T>(json, { ...options, format: 'json' });
  return result.data;
}

/**
 * Safely parses JSON, returning undefined if parsing fails
 */
export function safeParseJson<T>(json: string): T | undefined {
  try {
    return JSON.parse(json) as T;
  } catch {
    return undefined;
  }
}

/**
 * Converts a JavaScript object to FormData
 */
export function objectToFormData(
  data: Record<string, any>,
  options?: Omit<SerializationOptions, 'format'>
): FormData {
  const result = serializer.serialize(data, { ...options, format: 'form-data' });
  return result.data as FormData;
}

/**
 * Converts FormData to a JavaScript object
 */
export function formDataToObject<T = Record<string, any>>(formData: FormData): T {
  const result = serializer.deserialize<T>(formData, { format: 'form-data' });
  return result.data;
}
