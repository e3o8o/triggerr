# PRD-INTEGRATION-003: OpenSky Network API Integration

**Version**: 1.0  
**Status**: Draft  
**Author**: Development Team  
**Created**: 2025-01-27  
**Dependencies**: PRD-CORE-001 (Database Schema), PRD-CORE-003 (Shared Types)  
**Priority**: Medium (Cost-Effective Backup Data Source)

## 1. Overview

This PRD defines the OpenSky Network API integration module that provides free, crowd-sourced flight tracking data for the triggerr insurance platform. OpenSky serves as a cost-effective backup data source with global coverage and real-time aircraft position tracking capabilities.

### 1.1 Strategic Goals
- **Cost-Effective Data Source**: Provide free flight tracking data to reduce API costs
- **Real-time Tracking**: Access live aircraft positions and states
- **Data Redundancy**: Serve as backup source when primary APIs are unavailable
- **Historical Analysis**: Access historical flight data for risk assessment
- **Global Coverage**: Worldwide flight tracking through crowd-sourced data
- **Position Intelligence**: Detailed aircraft position and movement data

### 1.2 Reference Implementation
This PRD is based on the working test file: `/working_tests/testOpensky.js`

### 1.3 Technology Stack
- **Package Location**: `packages/integrations/opensky`
- **HTTP Client**: Axios with authentication and rate limiting
- **Authentication**: Username/password via query parameters
- **Validation**: Zod schemas for API responses
- **Caching**: Aggressive caching due to strict rate limits
- **Monitoring**: Request tracking and quota management

## 2. API Specification

### 2.1 OpenSky Network API Details
- **Base URL**: `https://opensky-network.org/api`
- **Authentication**: Username/password in query parameters
- **Rate Limits**: 
  - Anonymous: 400 requests/day
  - Registered: 4,000 requests/day
  - Rate limit: 10 requests/minute
- **Data Updates**: Real-time data every 10-15 seconds
- **Cost**: Free with registration

### 2.2 Core Endpoints

#### Aircraft States Endpoint
```typescript
interface StatesParams {
  time?: number;        // Unix timestamp for historical data
  icao24?: string;      // Specific aircraft ICAO24 transponder address
  lamin?: number;       // Bounding box minimum latitude
  lomin?: number;       // Bounding box minimum longitude  
  lamax?: number;       // Bounding box maximum latitude
  lomax?: number;       // Bounding box maximum longitude
  username?: string;    // Authentication username
  password?: string;    // Authentication password
}

interface StatesResponse {
  time: number;         // Unix timestamp of data
  states: Array<[
    string,             // [0] ICAO24 transponder address
    string | null,      // [1] Callsign
    string,             // [2] Country of registration
    number | null,      // [3] Time position
    number | null,      // [4] Last contact
    number | null,      // [5] Longitude
    number | null,      // [6] Latitude
    number | null,      // [7] Barometric altitude (meters)
    boolean,            // [8] On ground
    number | null,      // [9] Velocity (m/s)
    number | null,      // [10] True track (degrees)
    number | null,      // [11] Vertical rate (m/s)
    number[] | null,    // [12] Sensors
    number | null,      // [13] Geometric altitude (meters)
    string | null,      // [14] Squawk code
    boolean,            // [15] Special purpose indicator
    number              // [16] Position source
  ]>;
}
```

#### Flights by Aircraft Endpoint
```typescript
interface FlightsByAircraftParams {
  icao24: string;       // Aircraft ICAO24 address
  begin: number;        // Start time (Unix timestamp)
  end: number;          // End time (Unix timestamp)
  username: string;     // Authentication username
  password: string;     // Authentication password
}

interface FlightData {
  icao24: string;       // Aircraft ICAO24
  firstSeen: number;    // First seen timestamp
  estDepartureAirport: string | null;  // Estimated departure airport
  lastSeen: number;     // Last seen timestamp
  estArrivalAirport: string | null;    // Estimated arrival airport
  callsign: string | null;             // Flight callsign
  estDepartureAirportHorizDistance: number | null;
  estDepartureAirportVertDistance: number | null;
  estArrivalAirportHorizDistance: number | null;
  estArrivalAirportVertDistance: number | null;
  departureAirportCandidatesCount: number;
  arrivalAirportCandidatesCount: number;
}

type FlightsByAircraftResponse = FlightData[];
```

## 3. Integration Architecture

### 3.1 Service Structure
```
packages/integrations/opensky/
├── src/
│   ├── client.ts              # OpenSky API client implementation
│   ├── types.ts               # TypeScript interfaces
│   ├── validators.ts          # Zod validation schemas
│   ├── transformers.ts        # Data transformation logic
│   ├── cache.ts               # Aggressive caching layer
│   ├── errors.ts              # Error handling
│   ├── rate-limiter.ts        # Rate limiting implementation
│   ├── auth.ts                # Authentication handling
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
// Based on working test patterns from testOpensky.js
export class OpenSkyClient {
  private readonly baseUrl = 'https://opensky-network.org/api';
  private readonly username: string;
  private readonly password: string;
  private readonly httpClient: AxiosInstance;
  private rateLimiter: OpenSkyRateLimiter;

  constructor(username: string, password: string, options?: ClientOptions) {
    this.username = username;
    this.password = password;
    this.httpClient = axios.create({
      baseURL: this.baseUrl,
      timeout: options?.timeout || 20000,
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'triggerr-flight-tracker/1.0'
      },
      validateStatus: (status) => status < 500
    });

    this.rateLimiter = new OpenSkyRateLimiter(options?.rateLimitConfig);
    this.setupInterceptors();
  }

  async getAllStates(params?: Partial<StatesParams>): Promise<StatesResponse> {
    await this.rateLimiter.checkLimit();
    
    const requestParams = {
      username: this.username,
      password: this.password,
      ...params
    };

    try {
      const response = await this.httpClient.get<StatesResponse>('/states/all', {
        params: requestParams
      });
      
      if (response.status !== 200) {
        throw new OpenSkyError(
          'API_ERROR',
          `Unexpected status: ${response.status}`,
          response.status
        );
      }

      await this.trackAPIUsage('states_all', requestParams, response);
      return response.data;
    } catch (error) {
      throw this.handleAPIError(error, 'getAllStates');
    }
  }

  async getStatesByBoundingBox(boundingBox: BoundingBox): Promise<StatesResponse> {
    return this.getAllStates({
      lamin: boundingBox.lamin,
      lomin: boundingBox.lomin,
      lamax: boundingBox.lamax,
      lomax: boundingBox.lomax
    });
  }

  async getOwnStates(): Promise<StatesResponse> {
    await this.rateLimiter.checkLimit();
    
    const params = {
      username: this.username,
      password: this.password
    };

    try {
      const response = await this.httpClient.get<StatesResponse>('/states/own', {
        params
      });
      
      // 403 is acceptable for users with no owned aircraft
      if (response.status === 403) {
        return { time: Date.now() / 1000, states: [] };
      }
      
      if (response.status !== 200) {
        throw new OpenSkyError(
          'API_ERROR',
          `Unexpected status: ${response.status}`,
          response.status
        );
      }

      await this.trackAPIUsage('states_own', params, response);
      return response.data;
    } catch (error) {
      throw this.handleAPIError(error, 'getOwnStates');
    }
  }

  async getFlightsByAircraft(
    icao24: string, 
    timeRange: { begin: number; end: number }
  ): Promise<FlightsByAircraftResponse> {
    await this.rateLimiter.checkLimit();
    
    const params = {
      icao24,
      begin: timeRange.begin,
      end: timeRange.end,
      username: this.username,
      password: this.password
    };

    try {
      const response = await this.httpClient.get<FlightsByAircraftResponse>('/flights/aircraft', {
        params
      });
      
      // 404 is acceptable when no flights found
      if (response.status === 404) {
        return [];
      }
      
      if (response.status !== 200) {
        throw new OpenSkyError(
          'API_ERROR',
          `Unexpected status: ${response.status}`,
          response.status
        );
      }

      await this.trackAPIUsage('flights_aircraft', params, response);
      return response.data || [];
    } catch (error) {
      throw this.handleAPIError(error, 'getFlightsByAircraft');
    }
  }

  async getFlightsByCallsign(callsign: string): Promise<AircraftState[]> {
    const states = await this.getAllStates();
    
    return states.states
      .filter(state => state[1]?.trim().toLowerCase() === callsign.toLowerCase())
      .map(this.transformStateToAircraft);
  }

  async getFlightsByRoute(origin: string, destination: string): Promise<AircraftState[]> {
    // OpenSky doesn't have direct route search, so we'll need to use position data
    // and correlate with airport positions
    const states = await this.getAllStates();
    
    // This would require airport coordinate lookup and proximity calculation
    // For now, return empty array as this requires additional airport data
    return [];
  }

  // Connection test based on working test patterns
  async testConnection(): Promise<ConnectionTestResult> {
    try {
      const response = await this.getAllStates();
      return {
        success: true,
        message: 'OpenSky API connection successful',
        aircraftCount: response.states.length,
        dataTimestamp: new Date(response.time * 1000),
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

  private transformStateToAircraft(state: StatesResponse['states'][0]): AircraftState {
    return {
      icao24: state[0],
      callsign: state[1]?.trim() || null,
      country: state[2],
      timePosition: state[3],
      lastContact: state[4],
      longitude: state[5],
      latitude: state[6],
      baroAltitude: state[7],
      onGround: state[8],
      velocity: state[9],
      trueTrack: state[10],
      verticalRate: state[11],
      sensors: state[12],
      geoAltitude: state[13],
      squawk: state[14],
      spi: state[15],
      positionSource: state[16]
    };
  }

  private setupInterceptors(): void {
    // Add delay between requests to respect rate limits
    this.httpClient.interceptors.response.use(
      response => {
        // Add 2 second delay between requests as shown in test
        setTimeout(() => {}, 2000);
        return response;
      },
      error => Promise.reject(error)
    );
  }
}
```

### 3.3 Rate Limiting Implementation

```typescript
export class OpenSkyRateLimiter {
  private requestCount = 0;
  private dailyLimit: number;
  private minuteLimit = 10;
  private requestLog: Date[] = [];
  private minuteRequestLog: Date[] = [];
  private lastRequestTime = 0;
  private minRequestInterval = 2000; // 2 seconds between requests

  constructor(config?: RateLimitConfig) {
    // Registered users get 4000/day, anonymous get 400/day
    this.dailyLimit = config?.dailyLimit || 4000;
    this.minRequestInterval = config?.minInterval || 2000;
  }

  async checkLimit(): Promise<void> {
    const now = new Date();
    
    // Check daily limit
    const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    this.requestLog = this.requestLog.filter(time => time >= dayStart);
    
    if (this.requestLog.length >= this.dailyLimit) {
      throw new OpenSkyError(
        'DAILY_LIMIT_EXCEEDED',
        'Daily API request limit exceeded'
      );
    }

    // Check minute limit (10 requests per minute)
    const minuteStart = new Date(now.getTime() - 60 * 1000);
    this.minuteRequestLog = this.minuteRequestLog.filter(time => time >= minuteStart);
    
    if (this.minuteRequestLog.length >= this.minuteLimit) {
      const waitTime = 60000 - (now.getTime() - this.minuteRequestLog[0].getTime());
      throw new OpenSkyError(
        'MINUTE_LIMIT_EXCEEDED',
        `Minute rate limit exceeded. Wait ${Math.ceil(waitTime / 1000)} seconds.`
      );
    }

    // Check minimum interval between requests
    const timeSinceLastRequest = Date.now() - this.lastRequestTime;
    if (timeSinceLastRequest < this.minRequestInterval) {
      const waitTime = this.minRequestInterval - timeSinceLastRequest;
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }

    // Log the request
    this.requestLog.push(now);
    this.minuteRequestLog.push(now);
    this.lastRequestTime = Date.now();
  }

  getUsageStats(): RateLimitStats {
    const now = new Date();
    const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const minuteStart = new Date(now.getTime() - 60 * 1000);
    
    const todayRequests = this.requestLog.filter(time => time >= dayStart).length;
    const thisMinuteRequests = this.minuteRequestLog.filter(time => time >= minuteStart).length;

    return {
      requestsToday: todayRequests,
      dailyLimit: this.dailyLimit,
      remainingDaily: this.dailyLimit - todayRequests,
      requestsThisMinute: thisMinuteRequests,
      minuteLimit: this.minuteLimit,
      remainingMinute: this.minuteLimit - thisMinuteRequests,
      resetTime: new Date(dayStart.getTime() + 24 * 60 * 60 * 1000)
    };
  }
}
```

### 3.4 Data Transformation to Positional Updates for Canonical Models

The OpenSky Network's `/states/all` endpoint provides live state vectors as arrays. Each state vector represents a snapshot of an aircraft's telemetry. This transformation focuses on extracting this positional and identifier data to contribute to the `CanonicalFlightDataModel`, primarily by populating its `livePosition` and aircraft identification fields.

The `FlightDataAggregator` will then be responsible for correlating this `icao24`-based update with a specific scheduled flight (from other API sources or internal data) to enrich a full `CanonicalFlightDataModel` instance.

```typescript
import type {
  CanonicalFlightDataModel,
  FlightStatus, // Assuming this enum is defined in PRD-CORE-003
  // SourceContribution, // Aggregator will handle SourceContribution array
} from '@triggerr/types'; // Adjust import path

// Corresponds to one inner array from OpenSky's `states` array in StatesResponse
type OpenSkyStateVector = [
  string, // icao24
  string | null, // callsign
  string, // origin_country
  number | null, // time_position
  number | null, // last_contact
  number | null, // longitude
  number | null, // latitude
  number | null, // baro_altitude (meters)
  boolean, // on_ground
  number | null, // velocity (m/s)
  number | null, // true_track (degrees)
  number | null, // vertical_rate (m/s)
  number[] | null, // sensors (int array)
  number | null, // geo_altitude (meters)
  string | null, // squawk
  boolean, // spi
  number // position_source (0=ADS-B, 1=ASTERIX, 2=MLAT, 3=FLARM)
];

// Helper to convert OpenSky date epoch seconds to UTC ISO 8601 strings
function epochToUtcISOString(epochSeconds?: number | null): string | undefined {
  if (epochSeconds === null || epochSeconds === undefined) return undefined;
  return new Date(epochSeconds * 1000).toISOString();
}

// Transforms a single OpenSky state vector into a partial CanonicalFlightDataModel
// focusing on live positional data and identifiers.
export const transformOpenSkyStateVector = (
  stateVector: OpenSkyStateVector
): Partial<CanonicalFlightDataModel> & { icao24: string } => { // Ensure icao24 is always returned for correlation
  const icao24Hex = stateVector[0];
  const callsign = stateVector[1]?.trim() || undefined;
  // const originCountry = stateVector[2]; // Can be used by aggregator for enrichment
  const timePosition = stateVector[3] as number | null; // Timestamp for position
  const lastContact = stateVector[4] as number | null; // Timestamp for last update
  const longitude = stateVector[5] as number | null;
  const latitude = stateVector[6] as number | null;
  const baroAltitudeMeters = stateVector[7] as number | null;
  const onGround = stateVector[8] as boolean;
  const velocityMs = stateVector[9] as number | null; // meters/second
  const trueTrackDegrees = stateVector[10] as number | null; // heading
  // const verticalRateMs = stateVector[11] as number | null;
  const geoAltitudeMeters = stateVector[13] as number | null;
  // const positionSource = stateVector[15];

  const altitudeFt = geoAltitudeMeters !== null ? geoAltitudeMeters * 3.28084 : (baroAltitudeMeters !== null ? baroAltitudeMeters * 3.28084 : undefined);
  const groundSpeedKph = velocityMs !== null ? velocityMs * 3.6 : undefined;

  // The aggregator will use icao24Hex to find/update a CanonicalFlightDataModel
  // This function primarily provides the live data that OpenSky is strong in.
  const partialCanonical: Partial<CanonicalFlightDataModel> & { icao24: string } = {
    icao24: icao24Hex, // Return icao24 for aggregator correlation
    // The aggregator will try to map icao24 to an aircraft registration
    // and then to CanonicalAircraftInstanceInfo. For now, we can put icao24
    // in a placeholder if our canonical model expects a registration string.
    aircraft: {
      registration: `HEX:${icao24Hex}`, // Placeholder until mapped to actual registration
    },
    // If callsign can be parsed as a flight number (e.g., "UAL123")
    // icaoFlightNumber might be set here, or by aggregator.
    // airline ICAO might be derivable from first 3 chars of callsign (heuristic)
    
    livePosition: (latitude !== null && longitude !== null) ? {
      latitude: latitude,
      longitude: longitude,
      altitudeFt: altitudeFt,
      groundSpeedKph: groundSpeedKph,
      headingDegrees: trueTrackDegrees || undefined,
      timestampUTC: epochToUtcISOString(timePosition || lastContact),
    } : undefined,
    status: determineOpenSkyFlightStatus(onGround, velocityMs),
    fetchedAtUTC: epochToUtcISOString(lastContact) || new Date().toISOString(), // Use lastContact as fetched time
  };

  // Clean up undefined fields in sub-objects
  if (partialCanonical.livePosition && Object.values(partialCanonical.livePosition).every(v => v === undefined)) {
    delete partialCanonical.livePosition;
  }
  if (partialCanonical.aircraft && !partialCanonical.aircraft.registration) {
    delete partialCanonical.aircraft;
  }

  return partialCanonical;
};

const determineOpenSkyFlightStatus = (onGround: boolean, velocityMs?: number | null): FlightStatus => {
  if (onGround) {
    // If velocity is very low or null while on ground, it could be LANDED or SCHEDULED (at gate).
    // More context is needed by the aggregator to differentiate.
    // For this isolated transformation, we'll assume LANDED if on ground.
    return 'LANDED'; 
  }
  // If not on ground and has a significant velocity, it's ACTIVE.
  if (velocityMs !== null && velocityMs > 5) { // 5 m/s is approx 18 km/h or 10 knots
    return 'ACTIVE';
  }
  // If not on ground but velocity is very low/zero, status is uncertain without more context.
  return 'UNKNOWN'; 
};

/**
 * Data Points for Persistent Storage (from OpenSky via Canonical Model):
 * 
 * The `FlightDataAggregator` will receive partial `CanonicalFlightDataModel` updates from this client,
 * primarily focused on aircraft identifiers and live positional data. After correlation by the 
 * aggregator with a specific flight schedule, the following OpenSky-originated data points are 
 * targeted for persistence within a `historical_flight_segments` record:
 * 
 * - `aircraft.registration` (derived from `icao24` if direct registration not available, or `icao24` itself)
 * - `livePosition.latitude`
 * - `livePosition.longitude`
 * - `livePosition.altitudeFt`
 * - `livePosition.groundSpeedKph`
 * - `livePosition.headingDegrees`
 * - `livePosition.timestampUTC` (most recent position update time)
 * - `status` (derived from `onGround` and `velocity`, subject to refinement by aggregator)
 * - `fetchedAtUTC` (reflecting `last_contact` time from OpenSky)
 * 
 * The `FlightDataAggregator` is responsible for merging this live tracking snapshot with other 
 * flight details (origin, destination, scheduled times, airline, etc.) from other sources or 
 * existing records to create or update a comprehensive `historical_flight_segments` entry.
 * 
 * Raw OpenSky state vectors might be stored in `raw_api_call_logs` if configured.
 */
```

### 3.5 Position Tracking Service

```typescript
export class OpenSkyPositionService {
  constructor(private client: OpenSkyClient, private cache: OpenSkyCache) {}

  async trackFlightByCallsign(callsign: string): Promise<FlightPosition | null> {
    const aircraft = await this.client.getFlightsByCallsign(callsign);
    
    if (aircraft.length === 0) return null;
    
    const state = aircraft[0];
    return {
      icao24: state.icao24,
      callsign: state.callsign,
      latitude: state.latitude,
      longitude: state.longitude,
      altitude: state.baroAltitude || state.geoAltitude,
      velocity: state.velocity,
      heading: state.trueTrack,
      verticalRate: state.verticalRate,
      onGround: state.onGround,
      timestamp: new Date(state.lastContact * 1000)
    };
  }

  async getAircraftInArea(boundingBox: BoundingBox): Promise<FlightPosition[]> {
    const states = await this.client.getStatesByBoundingBox(boundingBox);
    
    return states.states
      .filter(state => state[5] !== null && state[6] !== null) // Has position
      .map(state => ({
        icao24: state[0],
        callsign: state[1]?.trim() || null,
        latitude: state[6]!,
        longitude: state[5]!,
        altitude: state[7] || state[13],
        velocity: state[9],
        heading: state[10],
        verticalRate: state[11],
        onGround: state[8],
        timestamp: new Date(state[4] * 1000)
      }));
  }

  async getFlightHistory(icao24: string, days: number = 1): Promise<FlightData[]> {
    const endTime = Math.floor(Date.now() / 1000);
    const startTime = endTime - (days * 24 * 60 * 60);
    
    return this.client.getFlightsByAircraft(icao24, {
      begin: startTime,
      end: endTime
    });
  }
}
```

## 4. Service Integration

### 4.1 Flight Aggregator Integration

```typescript
// Integration with packages/aggregators/flight-aggregator
export class OpenSkyService implements FlightDataProvider {
  constructor(
    private client: OpenSkyClient,
    private cache: OpenSkyCache,
    private rateLimiter: OpenSkyRateLimiter,
    private positionService: OpenSkyPositionService
  ) {}

  async getFlightData(request: FlightDataRequest): Promise<FlightDataResponse> {
    // Check cache first (aggressive caching due to rate limits)
    const cached = await this.cache.getCachedFlight(
      request.flightNumber,
      request.date
    );

    if (cached && this.isCacheValid(cached)) {
      return {
        source: 'OPENSKY',
        cached: true,
        data: cached,
        fetchedAt: cached.lastUpdated,
        confidence: 'MEDIUM' // Free data, medium confidence
      };
    }

    // Check rate limits before making request
    const usage = this.rateLimiter.getUsageStats();
    if (usage.remainingDaily <= 10 || usage.remainingMinute <= 1) {
      // Use cached data if available, even if stale
      if (cached) {
        return {
          source: 'OPENSKY',
          cached: true,
          data: cached,
          fetchedAt: cached.lastUpdated,
          confidence: 'LOW', // Stale data
          warning: 'Using stale data due to rate limits'
        };
      }
      
      throw new OpenSkyError(
        'RATE_LIMIT_EXCEEDED',
        'Rate limit exceeded and no cached data available'
      );
    }

    // Fetch fresh data
    const aircraft = await this.client.getFlightsByCallsign(request.flightNumber);
    
    if (aircraft.length === 0) {
      throw new OpenSkyError(
        'FLIGHT_NOT_FOUND',
        `Flight ${request.flightNumber} not found in OpenSky data`
      );
    }

    // Get historical data if available
    let flightHistory: FlightData[] = [];
    try {
      flightHistory = await this.client.getFlightsByAircraft(
        aircraft[0].icao24,
        {
          begin: Math.floor(Date.now() / 1000) - 24 * 60 * 60, // Last 24 hours
          end: Math.floor(Date.now() / 1000)
        }
      );
    } catch (error) {
      // Historical data might not be available
      console.warn('Could not fetch historical data:', error.message);
    }

    // Transform and cache results
    const transformedData = aircraft.map(state => 
      transformOpenSkyData(state, flightHistory[0])
    );

    for (const flight of transformedData) {
      await this.cache.cacheFlight(flight, 300); // Cache for 5 minutes due to real-time nature
    }

    return {
      source: 'OPENSKY',
      cached: false,
      data: transformedData,
      fetchedAt: new Date(),
      confidence: 'MEDIUM',
      metadata: {
        aircraftCount: aircraft.length,
        hasHistoricalData: flightHistory.length > 0,
        dataTimestamp: new Date(aircraft[0].lastContact * 1000)
      }
    };
  }

  async getPositionData(callsign: string): Promise<FlightPosition | null> {
    return this.positionService.trackFlightByCallsign(callsign);
  }

  async getAreaFlights(boundingBox: BoundingBox): Promise<FlightPosition[]> {
    return this.positionService.getAircraftInArea(boundingBox);
  }

  private isCacheValid(flight: Flight): boolean {
    const age = Date.now() - flight.lastUpdated.getTime();
    const maxAge = 5 * 60 * 1000; // 5 minutes for real-time data
    return age < maxAge;
  }
}
```

## 5. Configuration

### 5.1 Environment Configuration

```typescript
export interface OpenSkyConfig {
  username: string;
  password: string;
  baseUrl?: string;
  timeout?: number;
  dailyLimit?: number;
  minuteLimit?: number;
  minRequestInterval?: number;
  cacheTTL?: number;
  retryAttempts?: number;
}

export const getOpenSkyConfig = (): OpenSkyConfig => ({
  username: process.env.OPENSKY_USERNAME!,
  password: process.env.OPENSKY_PASSWORD!,
  baseUrl: process.env.OPENSKY_BASE_URL || 'https://opensky-network.org/api',
  timeout: parseInt(process.env.OPENSKY_TIMEOUT || '20000'),
  dailyLimit: parseInt(process.env.OPENSKY_DAILY_LIMIT || '4000'),
  minuteLimit: parseInt(process.env.OPENSKY_MINUTE_LIMIT || '10'),
  minRequestInterval: parseInt(process.env.OPENSKY_MIN_INTERVAL || '2000'),
  cacheTTL: parseInt(process.env.OPENSKY_CACHE_TTL || '5'),
  retryAttempts: parseInt(process.env.OPENSKY_RETRY_ATTEMPTS || '2')
});
```

## 6. Testing Strategy

### 6.1 Test Implementation

```typescript
// Based on working test patterns
describe('OpenSkyClient', () => {
  let client: OpenSkyClient;

  beforeEach(() => {
    client = new OpenSkyClient(TEST_USERNAME, TEST_PASSWORD);
  });

  describe('Connection Tests', () => {
    it('should successfully connect to API', async () => {
      const result = await client.testConnection();
      expect(result.success).toBe(true);
      expect(result.aircraftCount).toBeGreaterThanOrEqual(0);
    });

    it('should handle authentication errors', async () => {
      const invalidClient = new OpenSkyClient('invalid', 'credentials');
      await expect(invalidClient.getAllStates()).rejects.toThrow();
    });
  });

  describe('Aircraft States', () => {
    it('should fetch all aircraft states', async () => {
      const states = await client.getAllStates();
      expect(states.time).toBeGreaterThan(0);
      expect(states.states).toBeInstanceOf(Array);
    });

    it('should fetch states by bounding box', async () => {
      const boundingBox = {
        lamin: 45.8389,
        lomin: 5.9962,
        lamax: 47.8229,
        lomax: 10.5226
      };
      
      const states = await client.getStatesByBoundingBox(boundingBox);
      expect(states.states).toBeInstanceOf(Array);
    });

    it('should handle own states request', async () => {
      // Should not throw error even if user has no aircraft
      const states = await client.getOwnStates();
      expect(states.states).toBeInstanceOf(Array);
    });
  });

  describe('Flight History', () => {
    it('should fetch flights by aircraft', async () => {
      const flights = await client.getFlightsByAircraft('a808c1', {
        begin: Math.floor(Date.now() / 1000) - 86400,
        end: Math.floor(Date.now() / 1000)
      });
      
      expect(flights).toBeInstanceOf(Array);
      // Empty array is acceptable if no flights found
    });
  });

  describe('Rate Limiting', () => {
    it('should respect rate limits', async () => {
      const start = Date.now();
      await client.getAllStates();
      await client.getAllStates();
      const elapsed = Date.now() - start;
      expect(elapsed).toBeGreaterThan(2000); // Should include 2 second delay
    });
  });
});
```

## 7. Monitoring & Analytics

### 7.1 Performance Metrics

```typescript
export const openSkyMetrics = {
  // API performance
  responseTime: histogram('opensky_response_time_seconds'),
  requestsTotal: counter('opensky_requests_total'),
  errorsTotal: counter('opensky_errors_total'),
  
  // Rate limiting
  dailyUsage: gauge('opensky_daily_usage'),
  minuteUsage: gauge('opensky_minute_usage'),
  remainingQuota: gauge('opensky_remaining_quota'),
  
  // Data quality
  aircraftTracked: gauge('opensky_aircraft_tracked_total'),
  positionDataAvailable: counter('opensky_position_data_total'),
  flightsFound: counter('opensky_flights_found_total'),
  historicalDataAvailable: counter('opensky_historical_data_total'),
  
  // Cache performance
  cacheHits: counter('opensky_cache_hits_total'),
  cacheMisses: counter('opensky_cache_misses_total'),
  staleCacheUse: counter('opensky_stale_cache_use_total')
};
```

## 8. Implementation Timeline

### Week 1: Foundation
- [ ] Setup package structure and dependencies
- [ ] Implement basic API client with authentication
- [ ] Add rate limiting with minute and daily quotas
- [ ] Create TypeScript interfaces

### Week 2: Core Features
- [ ] Implement aircraft states endpoints
- [ ] Add flight history functionality
- [ ] Create position tracking service
- [ ] Implement aggressive caching strategy

### Week 3: Integration
- [ ] Integrate with flight aggregator
- [ ] Add bounding box searches
- [ ] Implement data transformation layer
- [ ] Create monitoring and metrics

### Week 4: Enhancement
- [ ] Advanced position tracking
- [ ] Historical data analysis
- [ ] Performance optimization
- [ ] Comprehensive testing

## 9. Success Metrics

- **API Response Time**: < 5 seconds p95 (accounting for delays)
- **Data Availability**: > 70% of requested flights have position data
- **Rate Limit Efficiency**: Use < 80% of daily quota
- **Cache Hit Rate**: > 85% for repeated requests
- **Error Rate**: < 5% of requests (due to free service limitations)
- **Position Accuracy**: Real-time position data < 15 seconds old

## 10. Risk Mitigation

### 10.1 Fallback Strategies
- **Rate Limit Exceeded**: Use stale cached data with warnings
- **API Unavailable**: Graceful degradation to other sources
- **Authentication Issues**: Clear error messages and fallback to anonymous access
- **Data Quality Issues**: Validate responses and flag anomalies
- **Network Timeouts**: Retry with exponential backoff

### 10.2 Data Quality Assurance
- **Position Validation**: Verify coordinates are within reasonable bounds
- **Timestamp Checks**: Ensure data freshness and detect stale data
- **Aircraft Correlation**: Cross-reference with other flight data sources
- **Anomaly Detection**: Flag unusual aircraft behavior or data inconsistencies

## 11. Dependencies

- **Requires**: PRD-CORE-001 (Database Schema) for data models
- **Requires**: PRD-CORE-003 (Shared Types) for TypeScript interfaces
- **Integrates**: PRD-DATA-001 (Flight Aggregator) as backup data source
- **Complements**: PRD-INTEGRATION-001 (AviationStack) and PRD-INTEGRATION-002 (FlightAware)
- **Enables**: PRD-ENGINE-001 (Quote Engine) position-based risk assessment

---

**Status**: Ready for implementation  
**Next PRD**: PRD-INTEGRATION-004 (Weather API Integration)