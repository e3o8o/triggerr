// ===========================================================================
// API SDK - API CLIENT
// ===========================================================================

// Proper module resolution to api-contracts package
import type { AuthHeaderProvider } from "../auth/types";
import type {
  ApiResponse,
  ApiError,
  ErrorCode,
} from "@triggerr/api-contracts";
import { errorHandler } from "./error-handler";

// ===========================================================================
// CONFIGURATION & ERROR TYPES
// ===========================================================================

export interface ApiClientConfig {
  baseURL: string;
  authHeaderProvider?: AuthHeaderProvider;
  fetchImpl?: (
    input: RequestInfo | URL,
    init?: RequestInit,
  ) => Promise<Response>;
  timeout?: number;
  defaultHeaders?: Record<string, string>;
  logger?: (
    level: "info" | "error" | "warn" | "debug",
    message: string,
    context?: any,
  ) => void;
}

export class ApiClientError extends Error {
  public status?: number;
  public apiError?: ApiError;
  public responseData?: any;

  constructor(
    message: string,
    status?: number,
    apiError?: ApiError,
    responseData?: any,
  ) {
    super(message);
    this.name = "ApiClientError";

    // Only assign properties if they have defined values (exactOptionalPropertyTypes)
    if (status !== undefined) {
      this.status = status;
    }
    if (apiError !== undefined) {
      this.apiError = apiError;
    }
    if (responseData !== undefined) {
      this.responseData = responseData;
    }

    Object.setPrototypeOf(this, ApiClientError.prototype);
  }
}

// ===========================================================================
// API CLIENT IMPLEMENTATION
// ===========================================================================

export class ApiClient {
  private config: {
    baseURL: string;
    authHeaderProvider?: AuthHeaderProvider;
    fetchImpl?: (
      input: RequestInfo | URL,
      init?: RequestInit,
    ) => Promise<Response>;
    timeout: number; // Ensure this is strictly number after initialization
    defaultHeaders: Record<string, string>;
    logger?: (
      level: "info" | "error" | "warn" | "debug",
      message: string,
      context?: any,
    ) => void;
  };
  private fetchFn: (
    input: RequestInfo | URL,
    init?: RequestInit,
  ) => Promise<Response>;
  private readonly DEFAULT_TIMEOUT = 30000; // 30 seconds

  constructor(config: ApiClientConfig) {
    if (!config.baseURL) {
      throw new Error("ApiClient: baseURL is required in configuration.");
    }

    // Explicitly construct this.config to satisfy exactOptionalPropertyTypes
    const newConfigBase = {
      baseURL: config.baseURL.endsWith("/")
        ? config.baseURL.slice(0, -1)
        : config.baseURL,
      timeout: config.timeout ?? this.DEFAULT_TIMEOUT, // Ensures timeout is number
      defaultHeaders: {
        "Content-Type": "application/json",
        Accept: "application/json",
        ...(config.defaultHeaders || {}),
      },
    };

    // Add optional properties only if they exist on the input config
    const optionalConfig: Partial<
      Pick<ApiClientConfig, "authHeaderProvider" | "fetchImpl" | "logger">
    > = {};
    if (config.authHeaderProvider) {
      optionalConfig.authHeaderProvider = config.authHeaderProvider;
    }
    if (config.fetchImpl) {
      optionalConfig.fetchImpl = config.fetchImpl;
    }
    if (config.logger) {
      optionalConfig.logger = config.logger;
    }

    this.config = { ...newConfigBase, ...optionalConfig } as typeof this.config;

    this.fetchFn = this.config.fetchImpl || fetch.bind(globalThis);
    if (!this.fetchFn) {
      this.log(
        "error",
        "ApiClient: Fetch implementation not found. Please provide one in config or ensure global fetch is available.",
      );
      throw new Error("ApiClient: Fetch implementation not found.");
    }
    this.log("debug", "ApiClient initialized", {
      baseURL: this.config.baseURL,
    });
  }

  private log(
    level: "info" | "error" | "warn" | "debug",
    message: string,
    context?: any,
  ): void {
    this.config.logger?.(level, `[ApiClient] ${message}`, context);
  }

  private async getRequestHeaders(
    customHeaders?: Record<string, string>,
  ): Promise<Headers> {
    const headers = new Headers(this.config.defaultHeaders);

    if (this.config.authHeaderProvider) {
      try {
        const authHeadersFromProvider =
          await this.config.authHeaderProvider.getAuthHeaders();
        if (authHeadersFromProvider) {
          for (const [key, value] of Object.entries(authHeadersFromProvider)) {
            if (value !== undefined) {
              headers.set(key, value);
            }
          }
        }
      } catch (error) {
        this.log("error", "AuthHeaderProvider failed to get headers", {
          error,
        });
      }
    }

    if (customHeaders) {
      for (const [key, value] of Object.entries(customHeaders)) {
        if (value !== undefined) {
          headers.set(key, value);
        }
      }
    }
    return headers;
  }

  public async request<TResponse, TRequest = undefined>(
    method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE",
    path: string,
    payloadOptions?: {
      body?: TRequest;
      queryParams?: Record<string, string | number | boolean | undefined>;
      headers?: Record<string, string>;
    },
  ): Promise<ApiResponse<TResponse>> {
    let fullUrl = `${this.config.baseURL}${path.startsWith("/") ? path : `/${path}`}`;

    if (payloadOptions?.queryParams) {
      const params = new URLSearchParams();
      for (const [key, value] of Object.entries(payloadOptions.queryParams)) {
        if (value !== undefined) {
          params.append(key, String(value));
        }
      }
      if (params.toString()) {
        fullUrl += `?${params.toString()}`;
      }
    }

    const requestHeaders = await this.getRequestHeaders(
      payloadOptions?.headers,
    );
    const requestInit: RequestInit = {
      method,
      headers: requestHeaders,
    };

    if (
      payloadOptions?.body !== undefined &&
      method !== "GET" &&
      method !== "DELETE"
    ) {
      try {
        if (payloadOptions.body instanceof FormData) {
          requestInit.body = payloadOptions.body;
          requestHeaders.delete("Content-Type"); // Fetch will set it with boundary
        } else if (
          requestHeaders.get("Content-Type")?.includes("application/json")
        ) {
          requestInit.body = JSON.stringify(payloadOptions.body);
        } else {
          requestInit.body = payloadOptions.body as BodyInit; // For other content types
        }
      } catch (error) {
        this.log("error", "Failed to process request body", { path, error });
        throw new ApiClientError("Failed to process request body.", undefined, {
          code: "LOCAL_SERIALIZATION_ERROR" as ErrorCode,
          message: "Request body could not be processed.",
        });
      }
    }

    // Remove Content-Type if it was application/json but no body is present
    if (
      !requestInit.body &&
      requestHeaders.get("Content-Type")?.includes("application/json")
    ) {
      requestHeaders.delete("Content-Type");
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);
    requestInit.signal = controller.signal;

    const headersForLogging: Record<string, string> = {};
    requestHeaders.forEach((value, key) => {
      // Using forEach for Headers iteration
      headersForLogging[key] = value;
    });

    this.log("debug", `Making API request: ${method} ${fullUrl}`, {
      headers: headersForLogging,
      body:
        payloadOptions?.body instanceof FormData
          ? "[FormData]"
          : payloadOptions?.body,
    });

    try {
      const response = await this.fetchFn(fullUrl, requestInit);
      clearTimeout(timeoutId);

      if (!response.ok) {
        let errorData: ApiError | undefined;
        let responseText: string | undefined;

        // Clone the response to allow reading the body twice if needed
        const errorResponse = response.clone();

        try {
          const errorJson = await errorResponse.json();
          if (errorJson && typeof errorJson === "object") {
            const errorField = (errorJson as any).error;
            if (
              errorField &&
              typeof errorField === "object" &&
              "code" in errorField &&
              "message" in errorField
            ) {
              errorData = errorField as ApiError;
            } else if ("code" in errorJson && "message" in errorJson) {
              errorData = errorJson as ApiError;
            } else {
              responseText = JSON.stringify(errorJson);
            }
          } else {
            // Handle cases where response is not JSON but might be parsed as such
            responseText = await response.text();
          }
        } catch (e) {
          try {
            // This will now read from the original response if .json() failed on the clone
            responseText = await response.text();
          } catch (textError) {
            // This path is highly unlikely now but kept as a safeguard
            responseText = "Failed to read error response body.";
          }
        }

        this.log("error", `API request failed: ${method} ${fullUrl}`, {
          status: response.status,
          statusText: response.statusText,
          errorData,
          responseText,
        });

        if (
          response.status === 401 &&
          this.config.authHeaderProvider?.onAuthFailure
        ) {
          try {
            await this.config.authHeaderProvider.onAuthFailure(
              { status: response.status, errorData, responseText },
              { method, path, payload: payloadOptions },
            );
          } catch (authHandlerError) {
            this.log("error", "onAuthFailure handler threw an error", {
              authHandlerError,
            });
          }
        }

        const clientError = new ApiClientError(
          errorData?.message ||
            responseText ||
            `API request failed with status ${response.status}`,
          response.status,
          errorData,
          responseText && !errorData ? responseText : undefined,
        );

        // Enhance the error with additional context using the error handler
        const enhancedError = errorHandler.classifyError(clientError);
        this.log("debug", "Enhanced error details", { enhancedError });

        throw clientError;
      }

      if (response.status === 204) {
        this.log(
          "debug",
          `API request successful (204 No Content): ${method} ${fullUrl}`,
        );
        return {
          success: true,
          data: undefined as any,
          timestamp: new Date().toISOString(),
          requestId:
            response.headers.get("x-request-id") || "unknown-request-id-204",
          version:
            response.headers.get("x-api-version-served") ||
            "unknown-api-version",
        } as ApiResponse<TResponse>;
      }

      const responseData: ApiResponse<TResponse> = await response.json();
      this.log("debug", `API request successful: ${method} ${fullUrl}`, {
        status: response.status,
        // responseData, // Avoid logging potentially large/sensitive response data by default
      });
      return responseData;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof ApiClientError) {
        throw error;
      }
      if (error instanceof Error && error.name === "AbortError") {
        this.log("error", `API request timed out: ${method} ${fullUrl}`);
        const timeoutError = new ApiClientError(
          `Request timed out after ${this.config.timeout}ms.`,
          408, // Request Timeout
          {
            code: "REQUEST_TIMEOUT" as ErrorCode,
            message: `Request timed out after ${this.config.timeout}ms.`,
          },
        );
        errorHandler.classifyError(timeoutError); // Enhance for consistency
        throw timeoutError;
      }

      // Handle other unexpected errors (e.g., network failures)
      this.log(
        "error",
        `API request threw an unexpected error: ${method} ${fullUrl}`,
        { error },
      );
      const inferredError =
        error instanceof Error ? error : new Error(String(error));

      const networkError = new ApiClientError(
        inferredError.message,
        undefined, // No status code for network errors
        {
          code: "NETWORK_ERROR" as ErrorCode,
          message: "A network error occurred.",
        },
      );

      errorHandler.classifyError(networkError); // Enhance for consistency
      throw networkError;
    }
  }

  // Convenience methods for HTTP verbs
  public get<TResponse>(
    path: string,
    queryParams?: Record<string, string | number | boolean | undefined>,
    headers?: Record<string, string>,
  ): Promise<ApiResponse<TResponse>> {
    const options: {
      queryParams?: Record<string, string | number | boolean | undefined>;
      headers?: Record<string, string>;
    } = {};
    if (queryParams) options.queryParams = queryParams;
    if (headers) options.headers = headers;
    return this.request<TResponse>(
      "GET",
      path,
      Object.keys(options).length > 0 ? options : undefined,
    );
  }

  public post<TResponse, TRequest>(
    path: string,
    body: TRequest,
    queryParams?: Record<string, string | number | boolean | undefined>,
    headers?: Record<string, string>,
  ): Promise<ApiResponse<TResponse>> {
    const options: {
      body: TRequest;
      queryParams?: Record<string, string | number | boolean | undefined>;
      headers?: Record<string, string>;
    } = { body };
    if (queryParams) options.queryParams = queryParams;
    if (headers) options.headers = headers;
    return this.request<TResponse, TRequest>("POST", path, options);
  }

  public put<TResponse, TRequest>(
    path: string,
    body: TRequest,
    queryParams?: Record<string, string | number | boolean | undefined>,
    headers?: Record<string, string>,
  ): Promise<ApiResponse<TResponse>> {
    const options: {
      body: TRequest;
      queryParams?: Record<string, string | number | boolean | undefined>;
      headers?: Record<string, string>;
    } = { body };
    if (queryParams) options.queryParams = queryParams;
    if (headers) options.headers = headers;
    return this.request<TResponse, TRequest>("PUT", path, options);
  }

  public patch<TResponse, TRequest>(
    path: string,
    body: TRequest,
    queryParams?: Record<string, string | number | boolean | undefined>,
    headers?: Record<string, string>,
  ): Promise<ApiResponse<TResponse>> {
    const options: {
      body: TRequest;
      queryParams?: Record<string, string | number | boolean | undefined>;
      headers?: Record<string, string>;
    } = { body };
    if (queryParams) options.queryParams = queryParams;
    if (headers) options.headers = headers;
    return this.request<TResponse, TRequest>("PATCH", path, options);
  }

  public delete<TResponse>(
    path: string,
    queryParams?: Record<string, string | number | boolean | undefined>,
    headers?: Record<string, string>,
    // body?: TRequest, // DELETE with body is less common but possible
  ): Promise<ApiResponse<TResponse>> {
    const options: {
      queryParams?: Record<string, string | number | boolean | undefined>;
      headers?: Record<string, string>;
    } = {};
    if (queryParams) options.queryParams = queryParams;
    if (headers) options.headers = headers;
    // if (body) (options as any).body = body; // If supporting body for DELETE
    return this.request<TResponse>(
      "DELETE",
      path,
      Object.keys(options).length > 0 ? options : undefined,
    );
  }
}
