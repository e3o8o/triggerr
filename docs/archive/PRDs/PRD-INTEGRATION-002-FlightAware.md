# PRD-INTEGRATION-002: FlightAware API Integration

**Version**: 1.0  
**Status**: Draft  
**Author**: Development Team  
**Created**: 2025-01-27  
**Dependencies**: PRD-CORE-001 (Database Schema), PRD-CORE-003 (Shared Types)  
**Priority**: Medium (Secondary Flight Data Source)

## 1. Overview

This PRD defines the FlightAware AeroAPI integration module that provides premium real-time flight tracking and comprehensive flight data for the triggerr insurance platform. FlightAware serves as a high-quality secondary data source with enhanced tracking capabilities and global coverage.

### 1.1 Strategic Goals
- **Premium Data Source**: Provide high-quality flight data with enhanced tracking capabilities
- **Real-time Tracking**: Access to live flight positions and status updates
- **Data Redundancy**: Serve as backup/validation source for AviationStack data
- **Enhanced Coverage**: Access to comprehensive operator and airport information
- **Risk Assessment**: Detailed flight progress and delay prediction data
- **Global Reach**: Worldwide flight tracking capabilities

### 1.2 Reference Implementation
This PRD is based on the working test file: `/working_tests/testFlightAware.js`

### 1.3 Technology Stack
- **Package Location**: `packages/integrations/flightaware`
- **HTTP Client**: Axios with retry logic and rate limiting
- **Authentication**: API key-based authentication via x-apikey header
- **Validation**: Zod schemas for API responses
- **Caching**: Database-backed caching with intelligent TTL
- **Monitoring**: Comprehensive API usage and performance tracking

## 2. API Specification

### 2.1 FlightAware AeroAPI Details
- **Base URL**: `https://aeroapi.flightaware.com/aeroapi`
- **Authentication**: API key via `x-apikey` header
- **Rate Limits**: Varies by plan (typically 100-10,000 requests/day)
- **Data Quality**: Premium real-time data with high accuracy
- **Global Coverage**: Worldwide flight tracking capabilities

### 2.2 Core Endpoints

#### Airport Information Endpoint
```typescript
interface AirportInfoParams {
  airportCode: string; // IATA or ICAO code
}

interface AirportInfoResponse {
  airport_code: string;
  name: string;
  city: string;
  state?: string;
  country: string;
  latitude: number;
  longitude: number;
  elevation: number;
  timezone: string;
  country_code: string;
  wiki_url?: string;
  alternatives?: Array<{
    airport_code: string;
    name: string;
  }>;
}
```

#### Airport Flights Endpoint
```typescript
interface AirportFlightsParams {
  airportCode: string;
  type: 'departures' | 'arrivals';
  start?: string; // ISO datetime
  end?: string;   // ISO datetime
  max_pages?: number;
  cursor?: string;
}

interface AirportFlightsResponse {
  links?: {
    next?: string;
  };
  num_pages: number;
  flights: FlightAwareFlightData[];
}
```

#### Flight Search Endpoint
```typescript
interface FlightSearchParams {
  query: string;        // FlightAware query syntax
  start?: string;       // ISO datetime
  end?: string;         // ISO datetime
  max_pages?: number;
  cursor?: string;
}

interface FlightSearchResponse {
  links?: {
    next?: string;
  };
  num_pages: number;
  flights: FlightAwareFlightData[];
}
```

#### Core Flight Data Structure
```typescript
interface FlightAwareFlightData {
  ident: string;           // Flight identifier
  ident_icao?: string;     // ICAO flight identifier
  ident_iata?: string;     // IATA flight identifier
  fa_flight_id: string;    // FlightAware unique ID
  
  operator?: string;       // Airline name
  operator_icao?: string;  // Airline ICAO code
  operator_iata?: string;  // Airline IATA code
  
  flight_number?: string;  // Flight number
  registration?: string;   // Aircraft registration
  aircraft_type?: string;  // Aircraft type code
  
  origin?: {
    code: string;          // Airport code
    code_icao?: string;    // ICAO code
    code_iata?: string;    // IATA code
    code_lid?: string;     // Local identifier
    name?: string;         // Airport name
    city?: string;         // City name
    airport_info_url?: string;
  };
  
  destination?: {
    code: string;
    code_icao?: string;
    code_iata?: string;
    code_lid?: string;
    name?: string;
    city?: string;
    airport_info_url?: string;
  };
  
  departure_delay?: number;  // Departure delay in minutes
  arrival_delay?: number;    // Arrival delay in minutes
  
  filed_ete?: number;        // Filed estimated time en route
  progress_percent?: number; // Flight progress percentage
  status?: string;           // Flight status
  
  scheduled_out?: string;    // Scheduled departure (ISO)
  estimated_out?: string;    // Estimated departure (ISO)
  actual_out?: string;       // Actual departure (ISO)
  
  scheduled_off?: string;    // Scheduled takeoff (ISO)
  estimated_off?: string;    // Estimated takeoff (ISO)
  actual_off?: string;       // Actual takeoff (ISO)
  
  scheduled_on?: string;     // Scheduled landing (ISO)
  estimated_on?: string;     // Estimated landing (ISO)
  actual_on?: string;        // Actual landing (ISO)
  
  scheduled_in?: string;     // Scheduled arrival at gate (ISO)
  estimated_in?: string;     // Estimated arrival at gate (ISO)
  actual_in?: string;        // Actual arrival at gate (ISO)
  
  diverted?: boolean;        // Whether flight was diverted
  cancelled?: boolean;       // Whether flight was cancelled
  
  position_only?: boolean;   // Position-only flight
  
  waypoints?: Array<{
    latitude: number;
    longitude: number;
    altitude?: number;
    timestamp?: string;
  }>;
}
```

## 3. Integration Architecture

### 3.1 Service Structure
```
packages/integrations/flightaware/
├── src/
│   ├── client.ts              # AeroAPI client implementation
│   ├── types.ts               # TypeScript interfaces
│   ├── validators.ts          # Zod validation schemas
│   ├── transformers.ts        # Data transformation logic
│   ├── cache.ts               # Caching layer
│   ├── errors.ts              # Error handling
│   ├── rate-limiter.ts        # Rate limiting implementation
│   └── index.ts               # Public exports
├── tests/
│   ├── client.test.ts
│   ├── integration.test.ts
│   └── __fixtures__/
│       └── responses.json
├── package.json
└── README.md
```

### 3.2 Core Client Implementation

```typescript
// Based on working test patterns from testFlightAware.js
export class FlightAwareClient {
  private readonly baseUrl = 'https://aeroapi.flightaware.com/aeroapi';
  private readonly apiKey: string;
  private readonly httpClient: AxiosInstance;
  private rateLimiter: FlightAwareRateLimiter;

  constructor(apiKey: string, options?: ClientOptions) {
    this.apiKey = apiKey;
    this.httpClient = axios.create({
      baseURL: this.baseUrl,
      timeout: options?.timeout || 15000,
      headers: {
        'x-apikey': this.apiKey,
        'Accept': 'application/json'
      }
    });

    this.rateLimiter = new FlightAwareRateLimiter(options?.rateLimitConfig);
    this.setupInterceptors();
  }

  async getAirportInfo(airportCode: string): Promise<AirportInfoResponse> {
    await this.rateLimiter.checkLimit();
    
    try {
      const response = await this.httpClient.get<AirportInfoResponse>(
        `/airports/${airportCode}`
      );
      
      await this.trackAPIUsage('airports', { airportCode }, response);
      return response.data;
    } catch (error) {
      throw this.handleAPIError(error, 'getAirportInfo');
    }
  }

  async getAirportFlights(
    airportCode: string, 
    type: 'departures' | 'arrivals',
    options?: AirportFlightsParams
  ): Promise<AirportFlightsResponse> {
    await this.rateLimiter.checkLimit();
    
    const params = {
      max_pages: options?.max_pages || 1,
      ...options
    };

    try {
      const response = await this.httpClient.get<AirportFlightsResponse>(
        `/airports/${airportCode}/flights/${type}`,
        { params }
      );
      
      await this.trackAPIUsage('airport_flights', { airportCode, type }, response);
      return response.data;
    } catch (error) {
      throw this.handleAPIError(error, 'getAirportFlights');
    }
  }

  async searchFlights(query: string, options?: FlightSearchParams): Promise<FlightSearchResponse> {
    await this.rateLimiter.checkLimit();
    
    const params = {
      query,
      max_pages: options?.max_pages || 1,
      ...options
    };

    try {
      const response = await this.httpClient.get<FlightSearchResponse>(
        '/flights/search',
        { params }
      );
      
      await this.trackAPIUsage('flight_search', { query }, response);
      return response.data;
    } catch (error) {
      throw this.handleAPIError(error, 'searchFlights');
    }
  }

  async getFlightsByRoute(origin: string, destination: string): Promise<FlightAwareFlightData[]> {
    const query = `-destination ${destination} -origin ${origin}`;
    const response = await this.searchFlights(query);
    return response.flights;
  }

  async getFlightByIdentifier(flightIdent: string): Promise<FlightAwareFlightData[]> {
    const query = `${flightIdent}`;
    const response = await this.searchFlights(query);
    return response.flights;
  }

  async getLiveFlights(limit: number = 10): Promise<FlightAwareFlightData[]> {
    const query = '-type airline';
    const response = await this.searchFlights(query, { max_pages: 1 });
    return response.flights.slice(0, limit);
  }

  // Connection test based on working test patterns
  async testConnection(): Promise<ConnectionTestResult> {
    try {
      await this.getLiveFlights(1);
      return {
        success: true,
        message: 'FlightAware API connection successful',
        timestamp: new Date()
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        timestamp: new Date()
      };
    }
  }

  private setupInterceptors(): void {
    // Add delay between requests as shown in test
    this.httpClient.interceptors.response.use(
      response => {
        // Add 1 second delay between requests to be respectful to API
        setTimeout(() => {}, 1000);
        return response;
      },
      error => Promise.reject(error)
    );
  }
}
```

### 3.3 Error Handling Patterns

```typescript
// Based on error patterns observed in test file
export class FlightAwareError extends Error {
  constructor(
    public code: string,
    public message: string,
    public statusCode?: number,
    public originalError?: any
  ) {
    super(message);
    this.name = 'FlightAwareError';
  }
}

export const handleFlightAwareError = (error: AxiosError, operation: string): never => {
  const response = error.response;
  
  if (response) {
    switch (response.status) {
      case 401:
        throw new FlightAwareError(
          'AUTHENTICATION_FAILED',
          'Authentication failed. Check your API key.',
          401,
          error
        );
      
      case 403:
        throw new FlightAwareError(
          'ACCESS_FORBIDDEN',
          'Access forbidden. Your API key may not have permission for this endpoint.',
          403,
          error
        );
      
      case 404:
        throw new FlightAwareError(
          'ENDPOINT_NOT_FOUND',
          'Endpoint not found. This endpoint may not exist or be available.',
          404,
          error
        );
      
      case 429:
        throw new FlightAwareError(
          'RATE_LIMIT_EXCEEDED',
          'Rate limit exceeded. Too many requests.',
          429,
          error
        );
      
      case 500:
        throw new FlightAwareError(
          'SERVER_ERROR',
          'Server error. FlightAware API may be experiencing issues.',
          500,
          error
        );
      
      default:
        throw new FlightAwareError(
          'HTTP_ERROR',
          `HTTP Error: ${response.status} - ${response.statusText}`,
          response.status,
          error
        );
    }
  } else if (error.request) {
    throw new FlightAwareError(
      'NETWORK_ERROR',
      'No response received (timeout or network error)',
      undefined,
      error
    );
  } else {
    throw new FlightAwareError(
      'REQUEST_ERROR',
      `Request error: ${error.message}`,
      undefined,
      error
    );
  }
};
```

### 3.4 Rate Limiting Implementation

```typescript
export class FlightAwareRateLimiter {
  private requestCount = 0;
  private dailyLimit: number;
  private requestLog: Date[] = [];
  private lastRequestTime = 0;
  private minRequestInterval = 1000; // 1 second between requests

  constructor(config?: RateLimitConfig) {
    this.dailyLimit = config?.dailyLimit || 1000;
    this.minRequestInterval = config?.minInterval || 1000;
  }

  async checkLimit(): Promise<void> {
    // Check daily limit
    const now = new Date();
    const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    // Clean old requests
    this.requestLog = this.requestLog.filter(time => time >= dayStart);
    
    if (this.requestLog.length >= this.dailyLimit) {
      throw new FlightAwareError(
        'DAILY_LIMIT_EXCEEDED',
        'Daily API request limit exceeded'
      );
    }

    // Check minimum interval between requests
    const timeSinceLastRequest = Date.now() - this.lastRequestTime;
    if (timeSinceLastRequest < this.minRequestInterval) {
      const waitTime = this.minRequestInterval - timeSinceLastRequest;
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }

    this.requestLog.push(now);
    this.lastRequestTime = Date.now();
  }

  getUsageStats(): RateLimitStats {
    const now = new Date();
    const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayRequests = this.requestLog.filter(time => time >= dayStart).length;

    return {
      requestsToday: todayRequests,
      dailyLimit: this.dailyLimit,
      remainingRequests: this.dailyLimit - todayRequests,
      resetTime: new Date(dayStart.getTime() + 24 * 60 * 60 * 1000)
    };
  }
}
```

### 3.5 Data Transformation to Canonical Models

The primary goal of data transformation for the FlightAware AeroAPI integration is to map the raw API response fields into our standardized `CanonicalFlightDataModel` and its associated sub-types (`CanonicalAirlineInfo`, `CanonicalAirportInfo`, `CanonicalAircraftTypeInfo`, `CanonicalAircraftInstanceInfo`), as defined in `PRD-CORE-003: Shared Types & Validation Schemas`. FlightAware also provides rich airport data, which will be mapped to `CanonicalAirportInfo` for reference data enrichment. This normalized data is then provided to the `FlightDataAggregator`.

```typescript
import type {
  CanonicalFlightDataModel,
  CanonicalAirlineInfo,
  CanonicalAirportInfo,
  CanonicalAircraftTypeInfo,
  CanonicalAircraftInstanceInfo,
  FlightStatus, // Assuming this enum is defined in PRD-CORE-003
  SourceContribution,
} from '@triggerr/types'; // Adjust import path as per your monorepo structure

// Helper to convert FlightAware date strings (which are already ISO 8601 UTC)
function toUtcISOString(dateString?: string | null): string | undefined {
  if (!dateString) return undefined;
  // FlightAware timestamps are typically already in UTC ISO 8601 format
  // e.g., "2025-06-15T10:30:00Z"
  return dateString;
}

// Transform FlightAware flight data (from /flights/{ident} or /flights/search)
export const transformFlightAwareFlightData = (
  flightAwareFlight: FlightAwareFlightData, // From Section 2.2, Core Flight Data Structure
  internalFlightId: string // Generated by our system
): Partial<CanonicalFlightDataModel> => {
  const airlineInfo: Partial<CanonicalAirlineInfo> = {
    name: flightAwareFlight.operator || undefined,
    iataCode: flightAwareFlight.operator_iata || undefined,
    icaoCode: flightAwareFlight.operator_icao || undefined,
    // Callsign might be part of 'ident_icao' or a separate field if available
  };

  const departureAirportInfo: Partial<CanonicalAirportInfo> = {
    iataCode: flightAwareFlight.origin?.code_iata!, // Assuming this is mandatory if origin exists
    icaoCode: flightAwareFlight.origin?.code_icao || undefined,
    name: flightAwareFlight.origin?.name || 'Unknown Airport',
    city: flightAwareFlight.origin?.city || undefined,
    // countryIsoCode and timezoneOlson will be enriched from our airport reference table
    // or from a direct call to FlightAware /airports/{id} if needed
  };

  const arrivalAirportInfo: Partial<CanonicalAirportInfo> = {
    iataCode: flightAwareFlight.destination?.code_iata!, // Assuming this is mandatory
    icaoCode: flightAwareFlight.destination?.code_icao || undefined,
    name: flightAwareFlight.destination?.name || 'Unknown Airport',
    city: flightAwareFlight.destination?.city || undefined,
  };

  const aircraftInstance: Partial<CanonicalAircraftInstanceInfo> = {
    type: flightAwareFlight.aircraft_type ? { icaoCode: flightAwareFlight.aircraft_type, name: flightAwareFlight.aircraft_type } : undefined, // FlightAware often gives ICAO type
    registration: flightAwareFlight.registration || undefined,
  };

  const transformed: Partial<CanonicalFlightDataModel> = {
    internalFlightId,
    iataFlightNumber: flightAwareFlight.ident_iata || flightAwareFlight.ident, // ident can be IATA or ICAO
    icaoFlightNumber: flightAwareFlight.ident_icao || undefined,
    flightAwareFlightId: flightAwareFlight.fa_flight_id || undefined,

    airline: Object.keys(airlineInfo).length > 0 ? (airlineInfo as CanonicalAirlineInfo) : undefined,
    origin: departureAirportInfo as CanonicalAirportInfo,
    destination: arrivalAirportInfo as CanonicalAirportInfo,

    // Gate times
    gateDepartureScheduledTimestampUTC: toUtcISOString(flightAwareFlight.scheduled_out),
    gateDepartureActualTimestampUTC: toUtcISOString(flightAwareFlight.actual_out),
    estimatedDepartureTimestampUTC: toUtcISOString(flightAwareFlight.estimated_out), // FlightAware uses 'estimated_out' for overall departure

    gateArrivalScheduledTimestampUTC: toUtcISOString(flightAwareFlight.scheduled_in),
    gateArrivalActualTimestampUTC: toUtcISOString(flightAwareFlight.actual_in),
    estimatedArrivalTimestampUTC: toUtcISOString(flightAwareFlight.estimated_in), // FlightAware uses 'estimated_in' for overall arrival

    // Runway times
    runwayDepartureScheduledTimestampUTC: toUtcISOString(flightAwareFlight.scheduled_off),
    runwayDepartureActualTimestampUTC: toUtcISOString(flightAwareFlight.actual_off),
    
    runwayArrivalScheduledTimestampUTC: toUtcISOString(flightAwareFlight.scheduled_on),
    runwayArrivalActualTimestampUTC: toUtcISOString(flightAwareFlight.actual_on),

    // Terminals & Gates (FlightAware structure might vary, check specific ident response)
    departureTerminal: flightAwareFlight.origin?.terminal || undefined,
    departureGate: flightAwareFlight.origin?.gate || undefined,
    arrivalTerminal: flightAwareFlight.destination?.terminal || undefined,
    arrivalGate: flightAwareFlight.destination?.gate || undefined,

    // Runways
    runwayDepartureActual: flightAwareFlight.actual_runway_off || undefined,
    runwayArrivalActual: flightAwareFlight.actual_runway_on || undefined,

    status: mapFlightAwareStatus(flightAwareFlight),
    departureDelayMinutes: flightAwareFlight.departure_delay !== undefined ? flightAwareFlight.departure_delay : undefined,
    arrivalDelayMinutes: flightAwareFlight.arrival_delay !== undefined ? flightAwareFlight.arrival_delay : undefined,
    
    aircraft: Object.keys(aircraftInstance).some(key => aircraftInstance[key] !== undefined) ? aircraftInstance as CanonicalAircraftInstanceInfo : undefined,
    
    // Live Position (FlightAware might provide this in some contexts or flight track endpoints)
    livePosition: (flightAwareFlight.latitude && flightAwareFlight.longitude) ? {
      latitude: flightAwareFlight.latitude,
      longitude: flightAwareFlight.longitude,
      altitudeFt: flightAwareFlight.altitude ? flightAwareFlight.altitude * 100 : undefined, // altitude is in 100s of feet
      groundSpeedKph: flightAwareFlight.groundspeed ? flightAwareFlight.groundspeed * 1.852 : undefined, // groundspeed is in knots
      headingDegrees: flightAwareFlight.heading || undefined,
      timestampUTC: flightAwareFlight.last_position_time ? toUtcISOString(flightAwareFlight.last_position_time) : undefined,
    } : undefined,

    fetchedAtUTC: new Date().toISOString(),
    // sourceContributions would be added by the aggregator
  };
  return transformed;
};

// Transform FlightAware airport data (from /airports/{id} endpoint)
export const transformFlightAwareAirportData = (
  flightAwareAirport: AirportInfoResponse // From Section 2.2 of this PRD
): Partial<CanonicalAirportInfo> => {
  if (!flightAwareAirport.code_iata) {
    // IATA code is crucial for our system's airport PK
    console.warn(`FlightAware airport data missing IATA code: ${flightAwareAirport.name}`);
    return {}; 
  }
  return {
    iataCode: flightAwareAirport.code_iata,
    icaoCode: flightAwareAirport.code_icao || undefined,
    name: flightAwareAirport.name || 'Unknown Airport',
    city: flightAwareAirport.city || undefined,
    stateOrProvince: flightAwareAirport.state || undefined,
    countryIsoCode: flightAwareAirport.country_code, // FlightAware provides 2-letter ISO code
    latitude: flightAwareAirport.latitude,
    longitude: flightAwareAirport.longitude,
    altitudeFt: flightAwareAirport.elevation ? flightAwareAirport.elevation : undefined, // elevation is in feet
    timezoneOlson: flightAwareAirport.timezone, // e.g., "America/New_York"
    airportType: flightAwareAirport.type || undefined,
    // scheduledService: // FlightAware airport info doesn't directly state this, assume true if it's in their system
  };
};

const mapFlightAwareStatus = (flight: FlightAwareFlightData): FlightStatus => {
  // FlightAware provides a 'status' field and boolean flags like 'cancelled', 'diverted'.
  // Example statuses: "Scheduled", "Enroute", "Arrived", "Cancelled", "Diverted", "Delayed"
  // The 'status' field itself is often descriptive enough.

  if (flight.cancelled) return 'CANCELLED';
  if (flight.diverted) return 'DIVERTED';

  const faStatus = flight.status?.toLowerCase();

  if (faStatus?.includes('landed') || faStatus?.includes('arrived') || (flight.progress_percent !== undefined && flight.progress_percent >= 100) || flight.actual_in) {
    return 'LANDED';
  }
  if (faStatus?.includes('enroute') || faStatus?.includes('airborne') || (flight.progress_percent !== undefined && flight.progress_percent > 0 && flight.progress_percent < 100) || flight.actual_off) {
    return 'ACTIVE'; // In-flight
  }
  if (faStatus?.includes('delayed') || (flight.departure_delay && flight.departure_delay > 0) || (flight.arrival_delay && flight.arrival_delay > 0)) {
    return 'DELAYED';
  }
  if (faStatus?.includes('scheduled') || faStatus?.includes('filed')) {
    return 'SCHEDULED';
  }
  
  return 'UNKNOWN';
};

/**
 * Data Points for Persistent Storage (from FlightAware via Canonical Model):
 * 
 * The `FlightDataAggregator` will receive the `CanonicalFlightDataModel` (partially filled by this client).
 * The following fields, once normalized, are targeted for persistence:
 * 
 * From `CanonicalFlightDataModel` (for `historical_flight_segments` table):
 * - `internalFlightId`, `iataFlightNumber`, `icaoFlightNumber`, `flightAwareFlightId`
 * - `airline` (all fields from `CanonicalAirlineInfo` if available from FlightAware, otherwise enriched by aggregator)
 * - `origin` & `destination` (all fields from `CanonicalAirportInfo`, enriched by airport reference data)
 * - All UTC timestamps: `gateDepartureScheduledTimestampUTC`, `gateDepartureActualTimestampUTC`, `estimatedDepartureTimestampUTC`,
 *   `runwayDepartureScheduledTimestampUTC`, `runwayDepartureActualTimestampUTC`, 
 *   `gateArrivalScheduledTimestampUTC`, `gateArrivalActualTimestampUTC`, `estimatedArrivalTimestampUTC`,
 *   `runwayArrivalScheduledTimestampUTC`, `runwayArrivalActualTimestampUTC`.
 * - `departureTerminal`, `departureGate`, `arrivalTerminal`, `arrivalGate`.
 * - `runwayDepartureActual`, `runwayArrivalActual`.
 * - `status` (mapped canonical status).
 * - `departureDelayMinutes`, `arrivalDelayMinutes`.
 * - `aircraft` (all fields from `CanonicalAircraftInstanceInfo`, including `type`).
 * - `livePosition` (if available).
 * - `fetchedAtUTC`.
 * - `sourceContributions` (managed by aggregator).
 * 
 * From `transformFlightAwareAirportData` (for enriching/populating `airports` reference table):
 * - All fields of `CanonicalAirportInfo`: `iataCode`, `icaoCode`, `name`, `city`, `stateOrProvince`, 
 *   `countryIsoCode`, `latitude`, `longitude`, `altitudeFt`, `timezoneOlson`, `airportType`.
 * 
 * Raw API responses can be stored in `raw_api_call_logs` or a `rawApiSnapshot` field if configured.
 */
```

## 4. Service Integration

### 4.1 Flight Aggregator Integration

```typescript
// Integration with packages/aggregators/flight-aggregator
export class FlightAwareService implements FlightDataProvider {
  constructor(
    private client: FlightAwareClient,
    private cache: FlightAwareCache,
    private rateLimiter: FlightAwareRateLimiter
  ) {}

  async getFlightData(request: FlightDataRequest): Promise<FlightDataResponse> {
    // Check cache first
    const cached = await this.cache.getCachedFlight(
      request.flightNumber, 
      request.date
    );

    if (cached && this.isCacheValid(cached)) {
      return {
        source: 'FLIGHTAWARE',
        cached: true,
        data: cached,
        fetchedAt: cached.lastUpdated,
        confidence: 'HIGH' // FlightAware provides high-quality data
      };
    }

    // Check rate limits
    const usage = this.rateLimiter.getUsageStats();
    if (usage.remainingRequests <= 0) {
      throw new FlightAwareError(
        'RATE_LIMIT_EXCEEDED',
        'Daily rate limit exceeded for FlightAware API'
      );
    }

    // Fetch fresh data
    const flights = await this.client.getFlightByIdentifier(request.flightNumber);
    
    if (flights.length === 0) {
      throw new FlightAwareError(
        'FLIGHT_NOT_FOUND',
        `Flight ${request.flightNumber} not found`
      );
    }

    // Filter flights by date if provided
    const relevantFlights = this.filterFlightsByDate(flights, request.date);
    
    // Cache the results
    for (const flight of relevantFlights) {
      await this.cache.cacheFlight(flight);
    }

    return {
      source: 'FLIGHTAWARE',
      cached: false,
      data: relevantFlights.map(transformFlightAwareData),
      fetchedAt: new Date(),
      confidence: 'HIGH'
    };
  }

  async getAirportFlights(
    airportCode: string, 
    type: 'departures' | 'arrivals'
  ): Promise<FlightAwareFlightData[]> {
    const response = await this.client.getAirportFlights(airportCode, type);
    return response.flights;
  }

  async getFlightProgress(flightId: string): Promise<FlightProgress | null> {
    const flights = await this.client.getFlightByIdentifier(flightId);
    
    if (flights.length === 0) return null;
    
    const flight = flights[0];
    return {
      progressPercent: flight.progress_percent || 0,
      estimatedArrival: flight.estimated_in ? new Date(flight.estimated_in) : null,
      position: flight.waypoints && flight.waypoints.length > 0 
        ? flight.waypoints[flight.waypoints.length - 1] 
        : null
    };
  }

  private filterFlightsByDate(flights: FlightAwareFlightData[], date?: Date): FlightAwareFlightData[] {
    if (!date) return flights;
    
    const targetDate = new Date(date);
    const startOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());
    const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);
    
    return flights.filter(flight => {
      const flightDate = flight.scheduled_out ? new Date(flight.scheduled_out) : null;
      return flightDate && flightDate >= startOfDay && flightDate < endOfDay;
    });
  }

  private isCacheValid(flight: Flight): boolean {
    const age = Date.now() - flight.lastUpdated.getTime();
    const maxAge = 10 * 60 * 1000; // 10 minutes for premium data
    return age < maxAge;
  }
}
```

## 5. Configuration

### 5.1 Environment Configuration

```typescript
export interface FlightAwareConfig {
  apiKey: string;
  baseUrl?: string;
  timeout?: number;
  dailyLimit?: number;
  minRequestInterval?: number;
  cacheTTL?: number;
  retryAttempts?: number;
}

export const getFlightAwareConfig = (): FlightAwareConfig => ({
  apiKey: process.env.FLIGHTAWARE_API_KEY!,
  baseUrl: process.env.FLIGHTAWARE_BASE_URL || 'https://aeroapi.flightaware.com/aeroapi',
  timeout: parseInt(process.env.FLIGHTAWARE_TIMEOUT || '15000'),
  dailyLimit: parseInt(process.env.FLIGHTAWARE_DAILY_LIMIT || '1000'),
  minRequestInterval: parseInt(process.env.FLIGHTAWARE_MIN_INTERVAL || '1000'),
  cacheTTL: parseInt(process.env.FLIGHTAWARE_CACHE_TTL || '10'),
  retryAttempts: parseInt(process.env.FLIGHTAWARE_RETRY_ATTEMPTS || '3')
});
```

## 6. Testing Strategy

### 6.1 Test Implementation

```typescript
// Based on working test patterns
describe('FlightAwareClient', () => {
  let client: FlightAwareClient;

  beforeEach(() => {
    client = new FlightAwareClient(TEST_API_KEY);
  });

  describe('Connection Tests', () => {
    it('should successfully connect to API', async () => {
      const result = await client.testConnection();
      expect(result.success).toBe(true);
    });

    it('should handle authentication errors', async () => {
      const invalidClient = new FlightAwareClient('invalid_key');
      const result = await invalidClient.testConnection();
      expect(result.success).toBe(false);
    });
  });

  describe('Airport Information', () => {
    it('should fetch airport info for JFK', async () => {
      const airport = await client.getAirportInfo('JFK');
      expect(airport.airport_code).toBe('JFK');
      expect(airport.name).toContain('Kennedy');
    });

    it('should get departing flights', async () => {
      const response = await client.getAirportFlights('JFK', 'departures');
      expect(response.flights).toBeInstanceOf(Array);
    });
  });

  describe('Flight Search', () => {
    it('should search for flights', async () => {
      const response = await client.searchFlights('-destination JFK');
      expect(response.flights).toBeInstanceOf(Array);
    });

    it('should get live flights', async () => {
      const flights = await client.getLiveFlights(5);
      expect(flights.length).toBeLessThanOrEqual(5);
    });
  });

  describe('Rate Limiting', () => {
    it('should respect rate limits', async () => {
      const start = Date.now();
      await client.getLiveFlights(1);
      await client.getLiveFlights(1);
      const elapsed = Date.now() - start;
      expect(elapsed).toBeGreaterThan(1000); // Should include 1 second delay
    });
  });
});
```

## 7. Monitoring & Analytics

### 7.1 Performance Metrics

```typescript
export const flightAwareMetrics = {
  // API performance
  responseTime: histogram('flightaware_response_time_seconds'),
  requestsTotal: counter('flightaware_requests_total'),
  errorsTotal: counter('flightaware_errors_total'),
  
  // Rate limiting
  dailyUsage: gauge('flightaware_daily_usage'),
  remainingQuota: gauge('flightaware_remaining_quota'),
  
  // Data quality
  flightsFound: counter('flightaware_flights_found_total'),
  progressDataAvailable: counter('flightaware_progress_data_total'),
  positionDataAvailable: counter('flightaware_position_data_total'),
  
  // Cache performance
  cacheHits: counter('flightaware_cache_hits_total'),
  cacheMisses: counter('flightaware_cache_misses_total')
};
```

## 8. Implementation Timeline

### Week 1: Foundation
- [ ] Setup package structure and dependencies
- [ ] Implement basic API client with authentication
- [ ] Add core endpoint methods (airports, flights)
- [ ] Create TypeScript interfaces

### Week 2: Core Features
- [ ] Implement rate limiting with daily quotas
- [ ] Add comprehensive error handling
- [ ] Create data transformation layer
- [ ] Implement caching strategy

### Week 3: Integration
- [ ] Integrate with flight aggregator
- [ ] Add flight progress tracking
- [ ] Implement airport flight queries
- [ ] Create monitoring and metrics

### Week 4: Enhancement
- [ ] Advanced search capabilities
- [ ] Performance optimization
- [ ] Comprehensive testing
- [ ] Documentation and examples

## 9. Success Metrics

- **API Response Time**: < 3 seconds p95 (accounting for 1-second delay)
- **Data Quality**: > 95% successful data transformation
- **Rate Limit Efficiency**: Use < 90% of daily quota
- **Cache Hit Rate**: > 75% for repeated requests
- **Error Rate**: < 2% of requests
- **Position Data Availability**: > 80% of active flights have position data

## 10. Risk Mitigation

### 10.1 Fallback Strategies
- **API Unavailable**: Fall back to cached data with staleness warnings
- **Rate Limit Exceeded**: Queue requests for next day or use alternative sources
- **Invalid Data**: Validate responses and log anomalies
- **Cost Overrun**: Implement circuit breakers and daily spending limits

### 10.2 Data Quality Assurance
- **Response Validation**: Validate all API responses against schemas
- **Data Consistency**: Cross-validate with other flight data sources
- **Anomaly Detection**: Flag unusual delays or status changes
- **Audit Trail**: Log all data transformations and decisions

## 11. Dependencies

- **Requires**: PRD-CORE-001 (Database Schema) for data models
- **Requires**: PRD-CORE-003 (Shared Types) for TypeScript interfaces
- **Integrates**: PRD-DATA-001 (Flight Aggregator) as secondary data source
- **Complements**: PRD-INTEGRATION-001 (AviationStack) as validation source
- **Enables**: PRD-ENGINE-001 (Quote Engine) enhanced risk calculation

---

**Status**: Ready for implementation  
**Next PRD**: PRD-INTEGRATION-003 (OpenSky Integration)