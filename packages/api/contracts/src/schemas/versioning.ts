// ===========================================================================
// API VERSIONING STRATEGY & TYPES
// ===========================================================================

/**
 * Represents information about a specific API version.
 */
export interface ApiVersionInfo {
  /**
   * The version string (e.g., "1.0.0", "2.1.3").
   * Follows Semantic Versioning (SemVer).
   */
  version: string;

  /** Major version number. Incremented for incompatible API changes. */
  major: number;

  /** Minor version number. Incremented for adding functionality in a backwards-compatible manner. */
  minor: number;

  /** Patch version number. Incremented for backwards-compatible bug fixes. */
  patch: number;

  /**
   * The base path for this API version (e.g., "/api/v1", "/api/v2").
   */
  basePath: string;

  /**
   * The status of this API version.
   * - `CURRENT`: The latest, recommended version.
   * - `SUPPORTED`: An older version that is still supported but may not receive new features.
   * - `DEPRECATED`: An older version that is still operational but will be removed in the future.
   *                 Users should migrate away from this version.
   * - `EXPERIMENTAL`: A new version that is under development and may change without notice.
   *                   Not recommended for production use.
   * - `RETIRED`: An old version that is no longer operational.
   */
  status: 'CURRENT' | 'SUPPORTED' | 'DEPRECATED' | 'EXPERIMENTAL' | 'RETIRED';

  /**
   * The date (ISO 8601) when this version was released or became current.
   */
  releaseDate: string;

  /**
   * The date (ISO 8601) when this version is planned to be deprecated.
   * Only applicable if `status` is `DEPRECATED` or will become `DEPRECATED`.
   */
  deprecationDate?: string;

  /**
   * The date (ISO 8601) when this version is planned to be retired (no longer operational).
   * Only applicable if `status` is `DEPRECATED` or `RETIRED`.
   */
  sunsetDate?: string;

  /**
   * A brief description of what's new or changed in this version.
   * Can include a link to more detailed release notes.
   */
  changelogSummary?: string;

  /**
   * Link to the detailed documentation for this specific API version.
   */
  documentationUrl?: string;
}

// ===========================================================================
// CURRENT & SUPPORTED API VERSIONS
// ===========================================================================

export const API_V1: ApiVersionInfo = {
  version: '1.0.0',
  major: 1,
  minor: 0,
  patch: 0,
  basePath: '/api/v1',
  status: 'CURRENT',
  releaseDate: '2025-07-01T00:00:00Z', // Example release date
  changelogSummary: 'Initial public release of the triggerr API. Includes core parametric insurance, chat, user, and wallet functionalities.',
  documentationUrl: 'https://docs.triggerr.com/api/v1',
};

// Example of a future V2 (EXPERIMENTAL or SUPPORTED)
/*
export const API_V2_EXPERIMENTAL: ApiVersionInfo = {
  version: '2.0.0-alpha.1',
  major: 2,
  minor: 0,
  patch: 0,
  basePath: '/api/v2',
  status: 'EXPERIMENTAL',
  releaseDate: '2026-01-15T00:00:00Z',
  changelogSummary: 'Experimental V2: Introduction of third-party provider marketplace and advanced escrow models.',
  documentationUrl: 'https://docs.triggerr.com/api/v2-experimental',
};
*/

// ===========================================================================
// VERSIONING CONFIGURATION
// ===========================================================================

/**
 * List of all defined API versions.
 * The first element is considered the default/latest stable if `currentVersion` is not explicitly set.
 */
export const SUPPORTED_API_VERSIONS: ApiVersionInfo[] = [
  API_V1,
  // API_V2_EXPERIMENTAL, // Add when V2 becomes available
];

/**
 * The currently recommended API version for new integrations.
 */
export const CURRENT_API_VERSION: ApiVersionInfo = API_V1;

/**
 * Default API version to use if no version is specified by the client.
 * Typically, this should be the latest stable (CURRENT) version.
 */
export const DEFAULT_API_VERSION_INFO: ApiVersionInfo = API_V1;

// ===========================================================================
// UTILITY FUNCTIONS
// ===========================================================================

/**
 * Retrieves information for a specific API version string.
 * @param versionString - The version string (e.g., "v1", "1.0.0").
 *                        If "vX" format is used, it matches the major version.
 * @returns The ApiVersionInfo object or undefined if not found.
 */
export function getApiVersionInfo(versionString: string): ApiVersionInfo | undefined {
  const normalizedVersion = versionString.toLowerCase().startsWith('v')
    ? versionString.toLowerCase().substring(1)
    : versionString.toLowerCase();

  return SUPPORTED_API_VERSIONS.find(v => {
    if (normalizedVersion === String(v.major)) {
      return true; // Match "v1" to major version 1
    }
    return v.version.startsWith(normalizedVersion);
  });
}

/**
 * Checks if an API version is still actively supported (not DEPRECATED or RETIRED).
 * @param versionInfo - The ApiVersionInfo object.
 * @returns True if the version is supported, false otherwise.
 */
export function isApiVersionSupported(versionInfo: ApiVersionInfo): boolean {
  return versionInfo.status === 'CURRENT' || versionInfo.status === 'SUPPORTED' || versionInfo.status === 'EXPERIMENTAL';
}

/**
 * Returns the base path for a given API version string.
 * @param versionString - The version string (e.g., "v1", "1.0.0").
 * @returns The base path or the default API version's base path if not found.
 */
export function getBasePathForVersion(versionString?: string): string {
  if (!versionString) {
    return DEFAULT_API_VERSION_INFO.basePath;
  }
  const versionInfo = getApiVersionInfo(versionString);
  return versionInfo ? versionInfo.basePath : DEFAULT_API_VERSION_INFO.basePath;
}

// ===========================================================================
// HTTP HEADER CONSTANTS FOR VERSIONING
// ===========================================================================

/**
 * Custom HTTP header that clients can use to specify the desired API version.
 * Example: `X-API-Version: 1` or `X-API-Version: 1.0.0`
 */
export const API_VERSION_HEADER = 'X-API-Version';

/**
 * Custom HTTP header that the server can use to indicate the API version
 * that processed the request.
 */
export const API_VERSION_SERVED_HEADER = 'X-API-Version-Served';

/**
 * HTTP Link header relation type for API versioning, allowing clients
 * to discover different versions of a resource.
 * Example: Link: </api/v2/resource>; rel="alternate version"; type="application/json"
 */
export const LINK_HEADER_VERSION_REL = 'alternate version';

// ===========================================================================
// Versioning Strategy Notes:
// ===========================================================================
//
// 1. URL Path Versioning:
//    - Primary method: `/api/v1/resource`, `/api/v2/resource`
//    - Clear, explicit, and cache-friendly.
//
// 2. Custom Request Header (X-API-Version):
//    - Secondary method for clients who prefer not to use URL path versioning
//      or for specific use cases (e.g., internal services).
//    - If present, this header can override the URL path version if the server
//      is configured to allow it. For triggerr, URL path is preferred.
//
// 3. Accept Header (Content Negotiation):
//    - Can be used for versioning representations of a resource,
//      e.g., `Accept: application/vnd.triggerr.v1+json`.
//    - Less common for full API versioning but useful for media type versioning.
//      For triggerr, this is secondary to URL path versioning.
//
// Backward Compatibility:
//    - Minor and patch versions MUST be backward compatible.
//    - Major versions MAY introduce breaking changes.
//
// Deprecation Policy:
//    - Deprecated API versions will be announced with a clear timeline.
//    - `deprecationDate` and `sunsetDate` will be communicated.
//    - API responses for deprecated versions might include a `Warning` header.
//
// Client Best Practices:
//    - Clients should ideally be resilient to additive changes (new fields in responses).
//    - Check the `X-API-Version-Served` header to confirm which version processed the request.
//    - Monitor API documentation and communications for version updates and deprecation notices.
//
// Server Implementation:
//    - The API gateway or main router will handle routing requests to the
//      correct versioned backend service or controller.
//    - Middleware can inspect `X-API-Version` or `Accept` headers if those
//      strategies are supported alongside URL path versioning.
//
// Default Version:
//    - If a client makes a request to an unversioned base path (e.g., `/api/resource`),
//      it should ideally be routed to the `DEFAULT_API_VERSION_INFO` (latest stable).
//      However, explicit versioning in the URL (`/api/v1/...`) is strongly encouraged.
//
// ===========================================================================
