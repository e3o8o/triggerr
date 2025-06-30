# PRD-DATA-004: Data Persistence & Caching Strategy

**Status**: ✅ FOUNDATION COMPLETE - Enhancement in Progress  
**Priority**: High - Performance & Cost Optimization  
**Dependencies**: PRD-CORE-001 (Database) ✅ Complete, PRD-DATA-001 (Flight Data Aggregator), PRD-DATA-003 (Data Router)  
**Last Updated**: 2025-01-27  

## 1. Overview

### 1.1 Purpose
The Data Persistence & Caching Strategy provides a comprehensive multi-layer caching system built on Drizzle ORM with PostgreSQL and Row Level Security. It reduces external API costs, improves response times, ensures data availability, and supports anonymous quote generation while maintaining data security through RLS policies.

### 1.2 Current Implementation Status
- ✅ **Database Schema**: Complete Drizzle implementation with optimized tables
- ✅ **Reference Data**: Fully seeded with ~249 countries, ~3,929 regions, ~5,731 airlines, ~9,079 airports, 64,100+ routes
- ✅ **Historical Data Tables**: Comprehensive schema for flight segments and weather observations
- ✅ **Cache Infrastructure**: Database-backed cache with `cache_entry` table
- ✅ **RLS Security**: Anonymous access for public data, authenticated access for user data
- 🔄 **Multi-Layer Caching**: Memory + Redis + Database caching (in progress)
- 🔄 **Data Aggregation**: External API integration and intelligent routing (pending)

### 1.3 Architecture Overview
```typescript
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   API Request   │    │  Cache Manager   │    │  Data Sources   │
│  (Anon/Auth)    │────▶│  RLS-Aware       │────▶│  External APIs  │
│                 │    │                  │    │  Drizzle ORM    │
│ Flight Search   │    │ L1: Memory       │    │  Historical DB  │
│ Quote Gen       │    │ L2: Redis        │    │  Reference Data │
│ Weather Data    │    │ L3: Database     │    │  Computed Cache │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

### 1.4 Goals
- **Data Independence**: Comprehensive persistent store for normalized flight, weather, and reference data
- **Cost Reduction**: Minimize external API calls through intelligent caching and historical data
- **Performance**: Sub-50ms response times for cached data, support for anonymous quote generation
- **Security**: RLS-aware caching that respects authentication context
- **Availability**: Multi-layer fallback with historical data as ultimate backup
- **Scalability**: Support high-volume anonymous traffic for flight searches and quotes

## 2. Database-Backed Persistence Strategy

### 2.1 Implemented Data Tables (Drizzle Schema)

```typescript
// Reference Data (✅ Seeded and Operational)
export const countries = pgTable("countries", {
  isoCode: char("iso_code", { length: 2 }).primaryKey(),
  name: text("name").notNull(),
  continent: continentEnum("continent"),
  // ~249 records seeded
});

export const regions = pgTable("regions", {
  code: text("code").primaryKey(),
  name: text("name").notNull(),
  countryIsoCode: char("country_iso_code", { length: 2 }).references(() => countries.isoCode),
  // ~3,929 records seeded
});

export const airport = pgTable("airport", {
  iataCode: char("iata_code", { length: 3 }).primaryKey(),
  icaoCode: char("icao_code", { length: 4 }),
  name: text("name").notNull(),
  latitude: decimal("latitude", { precision: 10, scale: 7 }).notNull(),
  longitude: decimal("longitude", { precision: 10, scale: 7 }).notNull(),
  timezoneOlson: text("timezone_olson"), // Critical for time-aware caching
  countryIsoCode: char("country_iso_code", { length: 2 }).references(() => countries.isoCode),
  // ~9,079 records seeded with timezone support
});

export const routes = pgTable("routes", {
  id: text("id").primaryKey().default(sql`generate_ulid()`),
  airlineIcaoCode: char("airline_icao_code", { length: 3 }).references(() => airline.icaoCode),
  sourceAirportIataCode: char("source_airport_iata_code", { length: 3 }).references(() => airport.iataCode),
  destinationAirportIataCode: char("destination_airport_iata_code", { length: 3 }).references(() => airport.iataCode),
  equipment: text("equipment"),
  // 64,100+ operational routes seeded
});

// Historical Data Storage (✅ Schema Complete)
export const historicalFlightSegments = pgTable("historical_flight_segments", {
  id: text("id").primaryKey().default(sql`generate_ulid()`),
  
  // Flight Identification
  iataFlightNumber: text("iata_flight_number"),
  icaoFlightNumber: text("icao_flight_number"),
  flightAwareFlightId: text("flightaware_flight_id"),
  aircraftRegistration: text("aircraft_registration"),
  
  // Route Information
  airlineIcaoCode: char("airline_icao_code", { length: 3 }).references(() => airline.icaoCode),
  originAirportIataCode: char("origin_airport_iata_code", { length: 3 }).references(() => airport.iataCode),
  destinationAirportIataCode: char("destination_airport_iata_code", { length: 3 }).references(() => airport.iataCode),
  
  // Comprehensive Timing Data
  scheduledDepartureTimestampUTC: timestamp("scheduled_departure_timestamp_utc", { withTimezone: true }).notNull(),
  estimatedDepartureTimestampUTC: timestamp("estimated_departure_timestamp_utc", { withTimezone: true }),
  actualDepartureTimestampUTC: timestamp("actual_departure_timestamp_utc", { withTimezone: true }),
  gateDepartureScheduledTimestampUTC: timestamp("gate_departure_scheduled_utc", { withTimezone: true }),
  gateDepartureActualTimestampUTC: timestamp("gate_departure_actual_utc", { withTimezone: true }),
  runwayDepartureScheduledTimestampUTC: timestamp("runway_departure_scheduled_utc", { withTimezone: true }),
  runwayDepartureActualTimestampUTC: timestamp("runway_departure_actual_utc", { withTimezone: true }),
  
  // Arrival Timing
  scheduledArrivalTimestampUTC: timestamp("scheduled_arrival_timestamp_utc", { withTimezone: true }).notNull(),
  estimatedArrivalTimestampUTC: timestamp("estimated_arrival_timestamp_utc", { withTimezone: true }),
  actualArrivalTimestampUTC: timestamp("actual_arrival_timestamp_utc", { withTimezone: true }),
  gateArrivalScheduledTimestampUTC: timestamp("gate_arrival_scheduled_utc", { withTimezone: true }),
  gateArrivalActualTimestampUTC: timestamp("gate_arrival_actual_utc", { withTimezone: true }),
  runwayArrivalScheduledTimestampUTC: timestamp("runway_arrival_scheduled_utc", { withTimezone: true }),
  runwayArrivalActualTimestampUTC: timestamp("runway_arrival_actual_utc", { withTimezone: true }),
  
  // Operational Data
  departureDelayMinutes: integer("departure_delay_minutes"),
  arrivalDelayMinutes: integer("arrival_delay_minutes"),
  status: text("status").notNull(),
  
  // Data Provenance
  sourceContributions: jsonb("source_contributions"),
  fetchedAt: timestamp("fetched_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("hfs_flight_num_date_idx").on(table.iataFlightNumber, table.scheduledDepartureTimestampUTC),
  index("hfs_orig_dest_date_idx").on(table.originAirportIataCode, table.destinationAirportIataCode, table.scheduledDepartureTimestampUTC),
  index("hfs_fetched_at_idx").on(table.fetchedAt),
]);

export const historicalWeatherObservations = pgTable("historical_weather_observations", {
  id: text("id").primaryKey().default(sql`generate_ulid()`),
  airportIataCode: char("airport_iata_code", { length: 3 }).references(() => airport.iataCode).notNull(),
  observationTimestampUTC: timestamp("observation_timestamp_utc", { withTimezone: true }).notNull(),
  
  // Weather Data
  temperatureCelsius: decimal("temperature_celsius", { precision: 5, scale: 2 }),
  windSpeedKph: decimal("wind_speed_kph", { precision: 5, scale: 2 }),
  precipitationMmLastHour: decimal("precipitation_mm_last_hour", { precision: 5, scale: 2 }),
  visibilityKm: decimal("visibility_km", { precision: 5, scale: 2 }),
  pressureHpa: decimal("pressure_hpa", { precision: 6, scale: 2 }),
  
  // Data Source
  dataSourceApi: text("data_source_api").notNull(),
  fetchedAtUTC: timestamp("fetched_at_utc", { withTimezone: true }).notNull().defaultNow(),
  rawApiSnapshot: jsonb("raw_api_snapshot"),
}, (table) => [
  index("hwo_airport_time_idx").on(table.airportIataCode, table.observationTimestampUTC),
  index("hwo_data_source_idx").on(table.dataSourceApi),
]);
```

### 2.2 Cache Management Infrastructure

```typescript
// Built-in cache table (✅ Implemented)
export const cacheEntry = pgTable("cache_entry", {
  id: text("id").primaryKey().default(sql`generate_ulid()`),
  cacheKey: text("cache_key").notNull(),
  value: jsonb("value").notNull(),
  tags: jsonb("tags").$type<string[]>(),
  expiresAt: timestamp("expires_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  unique("cache_entry_key_unique").on(table.cacheKey),
  index("cache_entry_expires_at_idx").on(table.expiresAt),
]);

// API call logging for cache optimization (✅ Implemented)
export const rawApiCallLogs = pgTable("raw_api_call_logs", {
  id: text("id").primaryKey().default(sql`generate_ulid()`),
  apiSource: text("api_source").notNull(),
  requestTimestampUTC: timestamp("request_timestamp_utc", { withTimezone: true }).notNull().defaultNow(),
  requestUrl: text("request_url").notNull(),
  responseStatusCode: integer("response_status_code"),
  responseBody: jsonb("response_body"),
  isSuccess: boolean("is_success").notNull(),
  durationMs: integer("duration_ms"),
  associatedFlightId: text("associated_flight_id").references(() => flight.id),
  associatedPolicyId: text("associated_policy_id").references(() => policy.id),
}, (table) => [
  index("log_api_source_idx").on(table.apiSource),
  index("log_request_ts_idx").on(table.requestTimestampUTC),
  index("log_status_idx").on(table.isSuccess),
]);
```

## 3. RLS-Aware Caching Strategy

### 3.1 Security Context for Caching

```typescript
export interface CacheSecurityContext {
  role: 'anon' | 'authenticated' | 'service_role';
  userId?: string;
  providerId?: string;
  canCachePublicData: boolean;
  canAccessUserData: boolean;
  cacheTTLMultiplier: number;
}

export class RLSAwareCacheManager {
  constructor(
    private db: DrizzleDatabase,
    private redis: RedisClient,
    private memoryCache: MemoryCache
  ) {}

  async getFlightData(
    query: FlightSearchQuery,
    context: CacheSecurityContext
  ): Promise<FlightSearchResult> {
    const cacheKey = this.generateCacheKey('flight_search', query, context);
    
    // L1: Memory cache (anonymous-safe data only)
    if (context.canCachePublicData) {
      const cached = await this.memoryCache.get(cacheKey);
      if (cached && this.isValid(cached)) {
        return this.addSecurityMetadata(cached, context);
      }
    }
    
    // L2: Redis cache (with role-based TTL)
    const redisCached = await this.redis.get(cacheKey);
    if (redisCached) {
      await this.memoryCache.set(cacheKey, redisCached, this.getMemoryTTL(context));
      return this.addSecurityMetadata(redisCached, context);
    }
    
    // L3: Database cache (respects RLS)
    const dbCached = await this.getCachedFromDatabase(cacheKey, context);
    if (dbCached) {
      await this.populateUpperCaches(cacheKey, dbCached, context);
      return dbCached;
    }
    
    // L4: Historical data (fallback for public data)
    if (context.canCachePublicData) {
      const historical = await this.getHistoricalFallback(query, context);
      if (historical) {
        historical.isHistorical = true;
        return historical;
      }
    }
    
    return null;
  }

  private async getCachedFromDatabase(
    cacheKey: string,
    context: CacheSecurityContext
  ): Promise<any> {
    // Use service role for cache access if user context insufficient
    const dbContext = context.role === 'service_role' ? context : {
      ...context,
      role: 'service_role' as const
    };
    
    return await this.db
      .select()
      .from(cacheEntry)
      .where(
        and(
          eq(cacheEntry.cacheKey, cacheKey),
          or(
            isNull(cacheEntry.expiresAt),
            gt(cacheEntry.expiresAt, new Date())
          )
        )
      )
      .limit(1);
  }
}
```

### 3.2 Anonymous-Friendly Caching

```typescript
export class AnonymousCacheStrategy {
  // Cache public flight search results
  async cacheFlightSearch(
    searchParams: PublicFlightSearchParams,
    results: PublicFlightResult[],
    ttl: number = 300 // 5 minutes
  ): Promise<void> {
    const cacheKey = `flight_search:${this.hashSearchParams(searchParams)}`;
    
    // Only cache publicly accessible data
    const publicData = results.map(flight => ({
      id: flight.id,
      flightNumber: flight.flightNumber,
      airline: flight.airline,
      departure: flight.departure,
      arrival: flight.arrival,
      status: flight.status,
      delayMinutes: flight.delayMinutes,
      // Exclude: user-specific pricing, detailed escrow info
    }));
    
    await Promise.allSettled([
      this.memoryCache.set(cacheKey, publicData, ttl),
      this.redis.setex(cacheKey, ttl, JSON.stringify(publicData)),
      this.db.insert(cacheEntry).values({
        cacheKey,
        value: publicData,
        tags: ['flight_search', 'public'],
        expiresAt: new Date(Date.now() + ttl * 1000),
      }).onConflictDoUpdate({
        target: cacheEntry.cacheKey,
        set: {
          value: publicData,
          expiresAt: new Date(Date.now() + ttl * 1000),
        }
      })
    ]);
  }

  // Cache anonymous quote results
  async cacheAnonymousQuote(
    quoteParams: AnonymousQuoteParams,
    quote: AnonymousQuoteResult,
    ttl: number = 600 // 10 minutes
  ): Promise<void> {
    const cacheKey = `anon_quote:${this.hashQuoteParams(quoteParams)}`;
    
    // Cache only non-sensitive quote data
    const cacheableQuote = {
      premium: quote.premium,
      coverageAmount: quote.coverageAmount,
      riskScore: quote.riskScore,
      validUntil: quote.validUntil,
      escrowModel: quote.escrowModel,
      providerId: quote.providerId,
      // Exclude: user-specific adjustments, detailed escrow IDs
    };
    
    await this.setCacheValue(cacheKey, cacheableQuote, ttl, ['quote', 'anonymous']);
  }
}
```

## 4. Data Persistence Workflows

### 4.1 Flight Data Persistence Pipeline

```typescript
export class FlightDataPersistenceService {
  constructor(
    private db: DrizzleDatabase,
    private cache: RLSAwareCacheManager
  ) {}

  async persistFlightSegment(
    flightData: CanonicalFlightData,
    sources: DataSourceContribution[]
  ): Promise<string> {
    const segmentId = generateULID();
    
    // Store in historical table for long-term persistence
    await this.db.insert(historicalFlightSegments).values({
      id: segmentId,
      iataFlightNumber: flightData.iataFlightNumber,
      icaoFlightNumber: flightData.icaoFlightNumber,
      flightAwareFlightId: flightData.flightAwareFlightId,
      
      // Route information
      airlineIcaoCode: flightData.airline?.icaoCode,
      originAirportIataCode: flightData.origin.iataCode,
      destinationAirportIataCode: flightData.destination.iataCode,
      
      // Timing data (comprehensive)
      scheduledDepartureTimestampUTC: new Date(flightData.scheduledDepartureTimestampUTC),
      estimatedDepartureTimestampUTC: flightData.estimatedDepartureTimestampUTC ? 
        new Date(flightData.estimatedDepartureTimestampUTC) : null,
      actualDepartureTimestampUTC: flightData.actualDepartureTimestampUTC ? 
        new Date(flightData.actualDepartureTimestampUTC) : null,
      
      // ... all other timing fields
      
      // Status and delays
      status: flightData.status,
      departureDelayMinutes: flightData.departureDelayMinutes,
      arrivalDelayMinutes: flightData.arrivalDelayMinutes,
      
      // Data provenance
      sourceContributions: sources,
      fetchedAt: new Date(),
    });

    // Update operational flight table if exists
    await this.updateOperationalFlight(flightData);
    
    // Invalidate related caches
    await this.invalidateFlightCaches(flightData);
    
    return segmentId;
  }

  async getHistoricalFlightPattern(
    route: RouteIdentifier,
    timeRange: DateRange
  ): Promise<FlightPattern> {
    const cacheKey = `flight_pattern:${route.origin}:${route.destination}:${timeRange.from}:${timeRange.to}`;
    
    // Check cache first
    const cached = await this.cache.get(cacheKey);
    if (cached) return cached;
    
    // Query historical data
    const segments = await this.db
      .select()
      .from(historicalFlightSegments)
      .where(
        and(
          eq(historicalFlightSegments.originAirportIataCode, route.origin),
          eq(historicalFlightSegments.destinationAirportIataCode, route.destination),
          between(
            historicalFlightSegments.scheduledDepartureTimestampUTC,
            timeRange.from,
            timeRange.to
          )
        )
      )
      .orderBy(historicalFlightSegments.scheduledDepartureTimestampUTC);

    const pattern = this.analyzeFlightPattern(segments);
    
    // Cache for 1 hour (historical data changes slowly)
    await this.cache.set(cacheKey, pattern, { ttl: 3600 });
    
    return pattern;
  }
}
```

### 4.2 Weather Data Persistence

```typescript
export class WeatherDataPersistenceService {
  async persistWeatherObservation(
    airportCode: string,
    observation: WeatherObservation,
    source: string
  ): Promise<void> {
    await this.db.insert(historicalWeatherObservations).values({
      airportIataCode: airportCode,
      observationTimestampUTC: new Date(observation.timestamp),
      
      // Weather measurements
      temperatureCelsius: observation.temperature,
      windSpeedKph: observation.windSpeed,
      precipitationMmLastHour: observation.precipitation,
      visibilityKm: observation.visibility,
      pressureHpa: observation.pressure,
      
      // Source tracking
      dataSourceApi: source,
      fetchedAtUTC: new Date(),
      rawApiSnapshot: observation.raw,
    });

    // Update cache for current conditions
    await this.updateWeatherCache(airportCode, observation);
  }

  async getHistoricalWeatherPattern(
    airportCode: string,
    dateRange: DateRange
  ): Promise<WeatherPattern> {
    const observations = await this.db
      .select()
      .from(historicalWeatherObservations)
      .where(
        and(
          eq(historicalWeatherObservations.airportIataCode, airportCode),
          between(
            historicalWeatherObservations.observationTimestampUTC,
            dateRange.from,
            dateRange.to
          )
        )
      )
      .orderBy(historicalWeatherObservations.observationTimestampUTC);

    return this.analyzeWeatherPattern(observations);
  }
}
```

## 5. Cache Optimization Strategies

### 5.1 TTL Policies by Data Type

```typescript
export const CACHE_TTL_POLICIES = {
  // Reference data (rarely changes)
  countries: 86400,     // 24 hours
  regions: 86400,       // 24 hours
  airports: 43200,      // 12 hours
  airlines: 21600,      // 6 hours
  routes: 3600,         // 1 hour
  aircraftTypes: 86400, // 24 hours
  
  // Operational data (frequent updates)
  flightStatus: 60,     // 1 minute
  flightSearch: 300,    // 5 minutes
  weatherCurrent: 900,  // 15 minutes
  weatherForecast: 3600, // 1 hour
  
  // Business data (varies by context)
  anonymousQuote: 600,  // 10 minutes
  userQuote: 1800,      // 30 minutes
  riskAssessment: 3600, // 1 hour
  
  // Historical analysis (long-term stable)
  flightPattern: 3600,  // 1 hour
  weatherPattern: 7200, // 2 hours
  routeAnalysis: 86400, // 24 hours
} as const;

export class TTLManager {
  calculateTTL(
    dataType: keyof typeof CACHE_TTL_POLICIES,
    context: CacheSecurityContext,
    freshness?: DataFreshness
  ): number {
    let baseTTL = CACHE_TTL_POLICIES[dataType];
    
    // Adjust for security context
    if (context.role === 'anon') {
      baseTTL *= 1.5; // Anonymous users get longer cache
    } else if (context.role === 'service_role') {
      baseTTL *= 0.5; // Service operations need fresher data
    }
    
    // Adjust for data freshness requirements
    if (freshness === 'realtime') {
      baseTTL = Math.min(baseTTL, 60); // Max 1 minute for real-time
    } else if (freshness === 'eventual') {
      baseTTL *= 2; // Allow staler data for eventual consistency
    }
    
    return Math.max(baseTTL, 30); // Minimum 30 seconds
  }
}
```

### 5.2 Cache Invalidation Strategies

```typescript
export class CacheInvalidationService {
  async invalidateByTags(tags: string[]): Promise<void> {
    // Invalidate database cache entries
    await this.db
      .delete(cacheEntry)
      .where(
        sql`tags::jsonb ?| array[${tags.map(tag => `'${tag}'`).join(',')}]`
      );
    
    // Invalidate Redis cache
    for (const tag of tags) {
      const keys = await this.redis.keys(`*:${tag}:*`);
      if (keys.length > 0) {
        await this.redis.del(...keys);
      }
    }
    
    // Clear memory cache (tag-based)
    this.memoryCache.clearByTags(tags);
  }

  async invalidateFlightData(flightId: string): Promise<void> {
    const tags = [
      `flight:${flightId}`,
      'flight_search',
      'flight_status',
      'quote:flight'
    ];
    
    await this.invalidateByTags(tags);
  }

  async invalidateRouteData(origin: string, destination: string): Promise<void> {
    const tags = [
      `route:${origin}:${destination}`,
      `airport:${origin}`,
      `airport:${destination}`,
      'flight_search'
    ];
    
    await this.invalidateByTags(tags);
  }
}
```

## 6. Performance Monitoring & Optimization

### 6.1 Cache Analytics

```typescript
export interface CacheMetrics {
  hitRate: {
    memory: number;
    redis: number;
    database: number;
    overall: number;
  };
  responseTime: {
    avg: number;
    p95: number;
    p99: number;
  };
  externalApiCalls: {
    saved: number;
    made: number;
    costSavings: number;
  };
  storageUtilization: {
    memory: number;
    redis: number;
    database: number;
  };
}

export class CacheAnalyticsService {
  async getCacheMetrics(timeRange: DateRange): Promise<CacheMetrics> {
    // Query cache hit/miss logs
    const logs = await this.db
      .select()
      .from(rawApiCallLogs)
      .where(
        between(
          rawApiCallLogs.requestTimestampUTC,
          timeRange.from,
          timeRange.to
        )
      );

    return this.calculateMetrics(logs);
  }

  async identifyOptimizationOpportunities(): Promise<OptimizationSuggestion[]> {
    const suggestions: OptimizationSuggestion[] = [];
    
    // Check for frequently missed cache keys
    const frequentMisses = await this.findFrequentCacheMisses();
    if (frequentMisses.length > 0) {
      suggestions.push({
        type: 'increase_ttl',
        keys: frequentMisses,
        impact: 'high',
        reason: 'Frequently accessed data with short TTL'
      });
    }
    
    // Check for oversized cache entries
    const largeCacheEntries = await this.findLargeCacheEntries();
    if (largeCacheEntries.length > 0) {
      suggestions.push({
        type: 'optimize_payload',
        keys: largeCacheEntries,
        impact: 'medium',
        reason: 'Large cache entries affecting memory usage'
      });
    }
    
    return suggestions;
  }
}
```

### 6.2 Automated Cache Warming

```typescript
export class CacheWarmingService {
  constructor(
    private db: DrizzleDatabase,
    private cache: RLSAwareCacheManager,
    private scheduler: TaskScheduler
  ) {}

  async scheduleWarmingTasks(): Promise<void> {
    // Warm popular routes daily
    await this.scheduler.schedule('warm_popular_routes', {
      cronExpression: '0 2 * * *', // 2 AM daily
      task: async () => {
        const popularRoutes = await this.getPopularRoutes();
        for (const route of popularRoutes) {
          await this.warmRouteData(route);
        }
      }
    });

    // Warm reference data weekly
    await this.scheduler.schedule('warm_reference_data', {
      cronExpression: '0 1 * * 0', // 1 AM every Sunday
      task: async () => {
        await this.warmReferenceData();
      }
    });
  }

  private async warmRouteData(route: PopularRoute): Promise<void> {
    // Pre-calculate and cache flight patterns
    const pattern = await this.flightService.getFlightPattern(
      route.origin,
      route.destination,
      { days: 30 }
    );
    
    // Pre-cache weather patterns
    const weatherPattern = await this.weatherService.getWeatherPattern(
      route.origin,
      { days: 30 }
    );
    
    // Pre-generate sample quotes
    const sampleQuotes = await this.quoteService.generateSampleQuotes(route);
    
    // Cache all data with appropriate TTLs
    await Promise.all([
      this.cache.set(`route_pattern:${route.origin}:${route.destination}`, pattern, { ttl: 3600 }),
      this.cache.set(`weather_pattern:${route.origin}`, weatherPattern, { ttl: 7200 }),
      this.cache.set(`sample_quotes:${route.origin}:${route.destination}`, sampleQuotes, { ttl: 1800 })
    ]);
  }
}
```

## 7. Implementation Status

### 7.1 Completed Components (✅)
- **Database Schema**: Complete Drizzle implementation with all persistence tables
- **Reference Data**: Fully seeded and indexed for optimal query performance