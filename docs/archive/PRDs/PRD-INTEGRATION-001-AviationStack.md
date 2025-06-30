# PRD-INTEGRATION-001: AviationStack API Integration

**Version**: 1.0  
**Status**: Draft  
**Author**: Development Team  
**Created**: 2025-01-27  
**Dependencies**: PRD-CORE-001 (Database Schema), PRD-CORE-003 (Shared Types)  
**Priority**: Critical

## 1. Overview

This PRD defines the AviationStack API integration module that provides real-time and historical flight data for the triggerr insurance platform. The integration is based on proven patterns from the working test suite and designed for production-scale reliability.

### 1.1 Strategic Goals
- **Primary Flight Data Source**: Serve as the main provider for real-time flight information
- **Data Persistence**: Reduce external API dependency through intelligent caching
- **Cost Optimization**: Implement smart rate limiting and quota management
- **High Availability**: Provide robust error handling and fallback mechanisms
- **Data Quality**: Ensure consistent, validated flight data for risk calculations

### 1.2 Reference Implementation
This PRD is based on the working test file: `/working_tests/testAviationstack.js`

### 1.3 Technology Stack
- **Package Location**: `packages/integrations/aviationstack`
- **HTTP Client**: Axios with retry logic
- **Validation**: Zod schemas for API responses
- **Caching**: Database-backed caching with TTL
- **Monitoring**: API usage tracking and performance metrics

## 2. API Specification

### 2.1 AviationStack API Details
- **Base URL**: `http://api.aviationstack.com/v1` (HTTP for free plan)
- **Authentication**: API key via `access_key` parameter
- **Rate Limits**: 500 calls/month (free tier), 10,000+ (paid tiers)
- **Data Freshness**: Real-time data, limited historical on free tier

### 2.2 Core Endpoints

#### Flight Data Endpoint
```typescript
interface FlightParams {
  access_key: string;
  flight_iata?: string;    // e.g., "BT318"
  airline_name?: string;   // e.g., "Air Baltic"
  flight_status?: string;  // "scheduled", "active", "landed", "cancelled", "incident", "diverted"
  dep_iata?: string;       // Departure airport IATA
  arr_iata?: string;       // Arrival airport IATA
  limit?: number;          // Max 100
  offset?: number;
}

interface FlightResponse {
  pagination: {
    limit: number;
    offset: number;
    count: number;
    total: number;
  };
  data: FlightData[];
}

interface FlightData {
  flight_date: string;
  flight_status: string;
  departure: {
    airport: string;
    timezone: string;
    iata: string;
    icao: string;
    terminal: string | null;
    gate: string | null;
    delay: number | null;
    scheduled: string;
    estimated: string;
    actual: string | null;
    estimated_runway: string | null;
    actual_runway: string | null;
  };
  arrival: {
    airport: string;
    timezone: string;
    iata: string;
    icao: string;
    terminal: string | null;
    gate: string | null;
    baggage: string | null;
    delay: number | null;
    scheduled: string;
    estimated: string;
    actual: string | null;
    estimated_runway: string | null;
    actual_runway: string | null;
  };
  airline: {
    name: string;
    iata: string;
    icao: string;
  };
  flight: {
    number: string;
    iata: string;
    icao: string;
    codeshared: any | null;
  };
  aircraft: {
    registration: string;
    iata: string;
    icao: string;
    icao24: string;
  } | null;
  live: any | null;
}
```

## 3. Integration Architecture

### 3.1 Service Structure
```
packages/integrations/aviationstack/
├── src/
│   ├── client.ts              # API client implementation
│   ├── types.ts               # TypeScript interfaces
│   ├── validators.ts          # Zod validation schemas
│   ├── transformers.ts        # Data transformation logic
│   ├── cache.ts               # Caching layer
│   ├── errors.ts              # Error handling
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
// Based on working test patterns from testAviationstack.js
export class AviationStackClient {
  private readonly baseUrl = 'http://api.aviationstack.com/v1';
  private readonly apiKey: string;
  private readonly httpClient: AxiosInstance;

  constructor(apiKey: string, options?: ClientOptions) {
    this.apiKey = apiKey;
    this.httpClient = axios.create({
      baseURL: this.baseUrl,
      timeout: options?.timeout || 10000,
      retries: options?.retries || 3
    });

    this.setupInterceptors();
  }

  async getFlightByNumber(
    flightNumber: string, 
    options?: FlightQueryOptions
  ): Promise<FlightData[]> {
    const params = {
      access_key: this.apiKey,
      flight_iata: flightNumber,
      limit: options?.limit || 10,
      ...options?.additionalParams
    };

    const response = await this.httpClient.get<FlightResponse>('/flights', { params });
    
    // Track API usage (based on test patterns)
    await this.trackAPIUsage('flights', params, response);
    
    return this.validateAndTransform(response.data.data);
  }

  async getAirlineInfo(airlineName: string): Promise<AirlineData[]> {
    const params = {
      access_key: this.apiKey,
      airline_name: airlineName,
      limit: 5
    };

    const response = await this.httpClient.get<AirlineResponse>('/airlines', { params });
    await this.trackAPIUsage('airlines', params, response);
    
    return response.data.data;
  }

  async getAirportInfo(iataCode: string): Promise<AirportData[]> {
    const params = {
      access_key: this.apiKey,
      iata_code: iataCode
    };

    const response = await this.httpClient.get<AirportResponse>('/airports', { params });
    await this.trackAPIUsage('airports', params, response);
    
    return response.data.data;
  }

  // Connection test based on testAPIConnection()
  async testConnection(): Promise<ConnectionTestResult> {
    try {
      const response = await this.httpClient.get('/flights', {
        params: { access_key: this.apiKey, limit: 1 }
      });

      return {
        success: true,
        statusCode: response.status,
        rateLimitRemaining: this.extractRateLimit(response.headers),
        message: 'API connection successful'
      };
    } catch (error) {
      return this.handleConnectionError(error);
    }
  }
}
```

### 3.3 Error Handling Patterns

```typescript
// Based on error patterns observed in test file
export class AviationStackError extends Error {
  constructor(
    public code: string,
    public message: string,
    public statusCode?: number,
    public originalError?: any
  ) {
    super(message);
    this.name = 'AviationStackError';
  }
}

export const handleAPIError = (error: AxiosError): never => {
  const response = error.response;
  
  if (response?.data?.error) {
    const apiError = response.data.error;
    
    switch (apiError.code) {
      case 'invalid_access_key':
        throw new AviationStackError(
          'INVALID_API_KEY',
          'Invalid API key. Please verify your credentials.',
          401,
          error
        );
      
      case 'usage_limit_reached':
        throw new AviationStackError(
          'USAGE_LIMIT_EXCEEDED',
          'Monthly request limit reached. Upgrade to a paid plan.',
          429,
          error
        );
      
      case 'access_restricted':
        throw new AviationStackError(
          'ACCESS_RESTRICTED',
          'Access restricted. Check your plan permissions.',
          403,
          error
        );
      
      default:
        throw new AviationStackError(
          'API_ERROR',
          apiError.message || 'Unknown API error',
          response.status,
          error
        );
    }
  }
  
  throw new AviationStackError(
    'NETWORK_ERROR',
    'Network error occurred',
    response?.status,
    error
  );
};
```

### 3.4 Data Transformation to Canonical Models

The primary goal of data transformation for the AviationStack integration is to map the raw API response fields into our standardized `CanonicalFlightDataModel` and its associated sub-types (`CanonicalAirlineInfo`, `CanonicalAirportInfo`, `CanonicalAircraftTypeInfo`, `CanonicalAircraftInstanceInfo`), as defined in `PRD-CORE-003: Shared Types & Validation Schemas`. This normalized data is then provided to the `FlightDataAggregator`.

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

// Helper to convert AviationStack date strings to UTC ISO 8601 strings
function toUtcISOString(dateString?: string | null): string | undefined {
  if (!dateString) return undefined;
  return new Date(dateString).toISOString();
}

// Transform AviationStack data to our CanonicalFlightDataModel
export const transformAviationStackFlightData = (
  aviationStackFlight: FlightData, // From Section 2.2 of this PRD
  internalFlightId: string // Generated by our system
): Partial<CanonicalFlightDataModel> => {
  const airlineInfo: Partial<CanonicalAirlineInfo> = {
    name: aviationStackFlight.airline?.name || undefined,
    iataCode: aviationStackFlight.airline?.iata || undefined,
    icaoCode: aviationStackFlight.airline?.icao || undefined,
    // Note: AviationStack /airlines endpoint provides fleet_size, headquarters
  };

  const departureAirportInfo: Partial<CanonicalAirportInfo> = {
    iataCode: aviationStackFlight.departure.iata,
    icaoCode: aviationStackFlight.departure.icao || undefined,
    name: aviationStackFlight.departure.airport || 'Unknown Airport', // Default if name is null
    city: aviationStackFlight.departure.city || undefined, // Assuming city is part of departure object in FlightData
    // countryIsoCode will be enriched by aggregator using airport reference data
    timezoneOlson: aviationStackFlight.departure.timezone || 'UTC', // Default to UTC if not provided
    // lat/lon might come from /airports endpoint or be enriched
  };

  const arrivalAirportInfo: Partial<CanonicalAirportInfo> = {
    iataCode: aviationStackFlight.arrival.iata,
    icaoCode: aviationStackFlight.arrival.icao || undefined,
    name: aviationStackFlight.arrival.airport || 'Unknown Airport',
    city: aviationStackFlight.arrival.city || undefined, // Assuming city is part of arrival object
    timezoneOlson: aviationStackFlight.arrival.timezone || 'UTC',
  };
  
  const aircraftType: Partial<CanonicalAircraftTypeInfo> = {
    icaoCode: aviationStackFlight.aircraft?.icao || undefined, // Prefer ICAO for type
    iataCode: aviationStackFlight.aircraft?.iata || undefined,
    name: aviationStackFlight.aircraft?.model || undefined, // AviationStack seems to use 'model' for type name
  };

  const aircraftInstance: Partial<CanonicalAircraftInstanceInfo> = {
    registration: aviationStackFlight.aircraft?.registration || undefined,
    type: Object.keys(aircraftType).length > 0 ? (aircraftType as CanonicalAircraftTypeInfo) : undefined,
  };

  const transformed: Partial<CanonicalFlightDataModel> = {
    internalFlightId,
    iataFlightNumber: aviationStackFlight.flight.iata,
    icaoFlightNumber: aviationStackFlight.flight.icao || undefined,
    
    airline: Object.keys(airlineInfo).length > 0 ? (airlineInfo as CanonicalAirlineInfo) : undefined,
    origin: departureAirportInfo as CanonicalAirportInfo, // Cast as some fields might be missing until enrichment
    destination: arrivalAirportInfo as CanonicalAirportInfo,

    scheduledDepartureTimestampUTC: toUtcISOString(aviationStackFlight.departure.scheduled)!, // Should always exist
    actualDepartureTimestampUTC: toUtcISOString(aviationStackFlight.departure.actual),
    estimatedDepartureTimestampUTC: toUtcISOString(aviationStackFlight.departure.estimated), // if available
    departureTerminal: aviationStackFlight.departure.terminal || undefined,
    departureGate: aviationStackFlight.departure.gate || undefined,

    scheduledArrivalTimestampUTC: toUtcISOString(aviationStackFlight.arrival.scheduled)!, // Should always exist
    actualArrivalTimestampUTC: toUtcISOString(aviationStackFlight.arrival.actual),
    estimatedArrivalTimestampUTC: toUtcISOString(aviationStackFlight.arrival.estimated), // if available
    arrivalTerminal: aviationStackFlight.arrival.terminal || undefined,
    arrivalGate: aviationStackFlight.arrival.gate || undefined,

    status: mapAviationStackFlightStatus(aviationStackFlight.flight_status),
    departureDelayMinutes: aviationStackFlight.departure.delay || undefined,
    arrivalDelayMinutes: aviationStackFlight.arrival.delay || undefined,
    
    aircraft: Object.keys(aircraftInstance).some(key => aircraftInstance[key] !== undefined) ? aircraftInstance as CanonicalAircraftInstanceInfo : undefined,

    // Live position data is typically not rich from AviationStack's basic /flights endpoint
    // livePosition: { ... } 

    // Source Contributions will be managed by the Aggregator, but this client provides the raw data
    // For example, the aggregator would create:
    // sourceContributions: {
    //   status: [{ sourceApi: 'AviationStack', timestampUTC: new Date().toISOString(), value: aviationStackFlight.flight_status }]
    // }
    fetchedAtUTC: new Date().toISOString(),
  };

  return transformed;
};

const mapAviationStackFlightStatus = (status?: string | null): FlightStatus => {
  if (!status) return 'UNKNOWN';
  const statusMap: Record<string, FlightStatus> = {
    'scheduled': 'SCHEDULED',
    'active': 'ACTIVE',       // "en-route" or "started"
    'landed': 'LANDED',
    'cancelled': 'CANCELLED',
    'incident': 'DELAYED',    // AviationStack might use "incident" for significant issues/delays
    'diverted': 'DIVERTED',
    // AviationStack specific statuses if any, mapped to our canonical ones
    // e.g. 'delayed' -> 'DELAYED'
  };
  return statusMap[status.toLowerCase()] || 'UNKNOWN';
};

// calculateDelayMinutes can be a utility in a shared package or aggregator,
// as it might need data from multiple timestamps (scheduled vs. actual).
// For this specific transformation, we are taking delays directly if API provides them.

/**
 * Data Points for Persistent Storage (from AviationStack via Canonical Model):
 * 
 * The `FlightDataAggregator` will receive the `CanonicalFlightDataModel` (partially filled by this client).
 * The following fields, once normalized into the canonical model, are targeted for persistence
 * in the `historical_flight_segments` table:
 * 
 * - `iataFlightNumber`, `icaoFlightNumber`
 * - `airline.name`, `airline.iataCode`, `airline.icaoCode` (and potentially `fleetSize`, `headquarters` if fetched from /airlines endpoint)
 * - `origin.iataCode`, `origin.icaoCode`, `origin.name`, `origin.city`, `origin.timezoneOlson`
 * - `destination.iataCode`, `destination.icaoCode`, `destination.name`, `destination.city`, `destination.timezoneOlson`
 * - All UTC timestamps: `scheduledDepartureTimestampUTC`, `actualDepartureTimestampUTC`, `estimatedDepartureTimestampUTC`, 
 *   `scheduledArrivalTimestampUTC`, `actualArrivalTimestampUTC`, `estimatedArrivalTimestampUTC`.
 * - `departureTerminal`, `departureGate`, `arrivalTerminal`, `arrivalGate`.
 * - `status` (mapped canonical status).
 * - `departureDelayMinutes`, `arrivalDelayMinutes`.
 * - `aircraft.type.icaoCode`, `aircraft.type.name`, `aircraft.type.iataCode`.
 * - `aircraft.registration`.
 * - `fetchedAtUTC`.
 * - `sourceContributions` (managed by aggregator, indicating these fields came from AviationStack).
 * 
 * Airport and Airline details will also update/populate the `airports` and `airlines` reference tables.
 * Raw API responses can be stored in `raw_api_call_logs` or a `rawApiSnapshot` field if configured.
 */
```

## 4. Caching Strategy

### 4.1 Database-Backed Caching

```typescript
export class AviationStackCache {
  constructor(private db: PrismaClient) {}

  async getCachedFlight(
    flightNumber: string, 
    departureDate: Date
  ): Promise<Flight | null> {
    const cacheKey = `${flightNumber}-${departureDate.toISOString().split('T')[0]}`;
    
    const cached = await this.db.flight.findFirst({
      where: {
        flightNumber,
        departureScheduled: {
          gte: startOfDay(departureDate),
          lt: endOfDay(departureDate)
        },
        lastUpdated: {
          gte: subMinutes(new Date(), 5) // 5-minute TTL for real-time data
        }
      },
      include: {
        flightDataSources: {
          where: { source: 'AVIATIONSTACK' },
          orderBy: { fetchedAt: 'desc' },
          take: 1
        }
      }
    });

    return cached;
  }

  async cacheFlight(flightData: FlightData): Promise<void> {
    const transformedFlight = transformFlightData(flightData);
    
    await this.db.$transaction(async (tx) => {
      // Upsert flight record
      const flight = await tx.flight.upsert({
        where: {
          flightNumber_departureScheduled_departureIata_arrivalIata: {
            flightNumber: transformedFlight.flightNumber!,
            departureScheduled: transformedFlight.departureScheduled!,
            departureIata: transformedFlight.departureIata!,
            arrivalIata: transformedFlight.arrivalIata!
          }
        },
        update: {
          ...transformedFlight,
          lastUpdated: new Date()
        },
        create: transformedFlight as any
      });

      // Store raw API response for debugging
      await tx.flightDataRecord.create({
        data: {
          flightId: flight.id,
          source: 'AVIATIONSTACK',
          rawData: flightData,
          status: flight.status,
          delayMinutes: flight.delayMinutes,
          departureActual: flight.departureActual,
          arrivalActual: flight.arrivalActual,
          fetchedAt: new Date()
        }
      });
    });
  }
}
```

## 5. Rate Limiting & Cost Management

### 5.1 Smart Request Management

```typescript
export class AviationStackRateLimiter {
  private requestCount = 0;
  private readonly monthlyLimit: number;
  private resetDate: Date;

  constructor(planType: 'free' | 'standard' | 'professional' = 'free') {
    this.monthlyLimit = this.getPlanLimit(planType);
    this.resetDate = this.getNextResetDate();
  }

  async canMakeRequest(): Promise<boolean> {
    // Check current usage from database
    const currentMonth = startOfMonth(new Date());
    const usage = await this.db.apiUsage.count({
      where: {
        provider: 'aviationstack',
        timestamp: { gte: currentMonth }
      }
    });

    return usage < this.monthlyLimit;
  }

  private getPlanLimit(planType: string): number {
    const limits = {
      free: 500,
      standard: 10000,
      professional: 100000
    };
    return limits[planType] || 500;
  }

  async trackRequest(endpoint: string, cost: number = 1): Promise<void> {
    await this.db.apiUsage.create({
      data: {
        provider: 'aviationstack',
        endpoint,
        cost,
        timestamp: new Date()
      }
    });
  }
}
```

## 6. Service Integration

### 6.1 Flight Aggregator Integration

```typescript
// Integration with packages/aggregators/flight-aggregator
export class AviationStackService implements FlightDataProvider {
  constructor(
    private client: AviationStackClient,
    private cache: AviationStackCache,
    private rateLimiter: AviationStackRateLimiter
  ) {}

  async getFlightData(request: FlightDataRequest): Promise<FlightDataResponse> {
    // Check cache first
    const cached = await this.cache.getCachedFlight(
      request.flightNumber, 
      request.date
    );

    if (cached && this.isCacheValid(cached)) {
      return {
        source: 'AVIATIONSTACK',
        cached: true,
        data: cached,
        fetchedAt: cached.lastUpdated
      };
    }

    // Check rate limits
    if (!(await this.rateLimiter.canMakeRequest())) {
      throw new AviationStackError(
        'RATE_LIMIT_EXCEEDED',
        'Rate limit exceeded for AviationStack API'
      );
    }

    // Fetch fresh data
    const flights = await this.client.getFlightByNumber(request.flightNumber);
    
    if (flights.length === 0) {
      throw new AviationStackError(
        'FLIGHT_NOT_FOUND',
        `Flight ${request.flightNumber} not found`
      );
    }

    // Cache the results
    for (const flight of flights) {
      await this.cache.cacheFlight(flight);
    }

    await this.rateLimiter.trackRequest('flights');

    return {
      source: 'AVIATIONSTACK',
      cached: false,
      data: flights.map(transformFlightData),
      fetchedAt: new Date()
    };
  }

  private isCacheValid(flight: Flight): boolean {
    const age = Date.now() - flight.lastUpdated.getTime();
    const maxAge = 5 * 60 * 1000; // 5 minutes for real-time data
    return age < maxAge;
  }
}
```

## 7. Configuration

### 7.1 Environment Configuration

```typescript
export interface AviationStackConfig {
  apiKey: string;
  baseUrl?: string;
  timeout?: number;
  retries?: number;
  rateLimitBuffer?: number; // Percentage of limit to reserve
  cacheTTL?: number;        // Cache TTL in minutes
  planType?: 'free' | 'standard' | 'professional';
}

export const getAviationStackConfig = (): AviationStackConfig => ({
  apiKey: process.env.AVIATIONSTACK_API_KEY!,
  baseUrl: process.env.AVIATIONSTACK_BASE_URL || 'http://api.aviationstack.com/v1',
  timeout: parseInt(process.env.AVIATIONSTACK_TIMEOUT || '10000'),
  retries: parseInt(process.env.AVIATIONSTACK_RETRIES || '3'),
  rateLimitBuffer: parseFloat(process.env.AVIATIONSTACK_RATE_BUFFER || '0.1'),
  cacheTTL: parseInt(process.env.AVIATIONSTACK_CACHE_TTL || '5'),
  planType: (process.env.AVIATIONSTACK_PLAN_TYPE as any) || 'free'
});
```

## 8. Testing Strategy

### 8.1 Test Implementation

```typescript
// Based on working test patterns
describe('AviationStackClient', () => {
  let client: AviationStackClient;

  beforeEach(() => {
    client = new AviationStackClient(TEST_API_KEY);
  });

  describe('Connection Tests', () => {
    it('should successfully connect to API', async () => {
      const result = await client.testConnection();
      expect(result.success).toBe(true);
      expect(result.statusCode).toBe(200);
    });

    it('should handle invalid API key', async () => {
      const invalidClient = new AviationStackClient('invalid_key');
      const result = await invalidClient.testConnection();
      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('INVALID_API_KEY');
    });
  });

  describe('Flight Lookup', () => {
    it('should fetch flight data for BT318', async () => {
      const flights = await client.getFlightByNumber('BT318');
      expect(flights).toBeInstanceOf(Array);
      if (flights.length > 0) {
        expect(flights[0].flight.iata).toBe('BT318');
        expect(flights[0].airline.name).toContain('Baltic');
      }
    });

    it('should handle non-existent flights', async () => {
      await expect(
        client.getFlightByNumber('XX9999')
      ).rejects.toThrow('FLIGHT_NOT_FOUND');
    });
  });

  describe('Data Transformation', () => {
    it('should correctly transform flight data', () => {
      const mockFlightData = require('./__fixtures__/aviationstack-flight.json');
      const transformed = transformFlightData(mockFlightData);
      
      expect(transformed.flightNumber).toBe(mockFlightData.flight.iata);
      expect(transformed.primarySource).toBe('AVIATIONSTACK');
      expect(transformed.departureScheduled).toBeInstanceOf(Date);
    });
  });
});
```

## 9. Monitoring & Analytics

### 9.1 Performance Metrics

```typescript
export const aviationStackMetrics = {
  // API performance
  responseTime: histogram('aviationstack_response_time_seconds'),
  requestsTotal: counter('aviationstack_requests_total'),
  errorsTotal: counter('aviationstack_errors_total'),
  
  // Rate limiting
  rateLimitUsage: gauge('aviationstack_rate_limit_usage'),
  rateLimitRemaining: gauge('aviationstack_rate_limit_remaining'),
  
  // Cache performance
  cacheHits: counter('aviationstack_cache_hits_total'),
  cacheMisses: counter('aviationstack_cache_misses_total'),
  
  // Data quality
  flightsFound: counter('aviationstack_flights_found_total'),
  flightsNotFound: counter('aviationstack_flights_not_found_total')
};
```

## 10. Implementation Timeline

### Week 1: Foundation
- [ ] Setup package structure
- [ ] Implement basic API client
- [ ] Add error handling patterns
- [ ] Create TypeScript interfaces

### Week 2: Core Features
- [ ] Implement caching layer
- [ ] Add rate limiting
- [ ] Create data transformers
- [ ] Write comprehensive tests

### Week 3: Integration
- [ ] Integrate with flight aggregator
- [ ] Add monitoring and metrics
- [ ] Implement connection health checks
- [ ] Create documentation

### Week 4: Optimization
- [ ] Performance tuning
- [ ] Advanced caching strategies
- [ ] Cost optimization
- [ ] Production readiness

## 11. Success Metrics

- **API Response Time**: < 2 seconds p95
- **Cache Hit Rate**: > 80% for repeated requests
- **Error Rate**: < 1% of requests
- **Rate Limit Efficiency**: Use < 90% of monthly quota
- **Data Freshness**: Real-time data < 5 minutes old

## 12. Risk Mitigation

### 12.1 Fallback Strategies
- **API Unavailable**: Fall back to cached data with staleness warnings
- **Rate Limit Exceeded**: Queue requests and implement exponential backoff
- **Invalid Data**: Log anomalies and use data validation
- **Cost Overrun**: Implement circuit breakers and alerts

## 13. Dependencies

- **Requires**: PRD-CORE-001 (Database Schema) for data models
- **Requires**: PRD-CORE-003 (Shared Types) for TypeScript interfaces
- **Enables**: PRD-DATA-001 (Flight Aggregator) flight data collection
- **Enables**: PRD-ENGINE-001 (Quote Engine) risk calculation

---

**Status**: Ready for implementation  
**Next PRD**: PRD-INTEGRATION-002 (FlightAware Integration)