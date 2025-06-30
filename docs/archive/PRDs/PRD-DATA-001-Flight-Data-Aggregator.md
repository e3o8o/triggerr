# PRD-DATA-001: Flight Data Aggregator

**Version**: 1.0  
**Status**: Draft  
**Author**: Development Team  
**Created**: 2025-01-27  
**Dependencies**: PRD-INTEGRATION-001 (AviationStack), PRD-INTEGRATION-002 (FlightAware), PRD-INTEGRATION-003 (OpenSky), PRD-CORE-001 (Database Schema)  
**Priority**: Critical

## 1. Overview

This PRD defines the Flight Data Aggregator service that intelligently combines multiple flight data sources (AviationStack, FlightAware, OpenSky) into a unified, reliable, and cost-effective flight information system for the triggerr insurance platform. The aggregator serves as the primary interface for all flight data needs while optimizing for cost, reliability, and data quality.

### 1.1 Strategic Goals
- **Unified Data Interface**: Single API for accessing flight data from multiple sources
- **Intelligent Source Selection**: Automatically choose the best data source based on requirements
- **Cost Optimization**: Minimize API costs through smart routing and free-tier prioritization
- **High Availability**: Ensure flight data availability through redundant sources and fallbacks
- **Data Quality**: Provide confidence scores and data validation across sources
- **Performance**: Sub-second response times through intelligent caching and parallel requests

### 1.2 Reference Implementation
This PRD builds upon the integration patterns established in PRD-INTEGRATION-001, 002, and 003.

### 1.3 Technology Stack
- **Package Location**: `packages/aggregators/flight-aggregator`
- **Core Logic**: TypeScript with async/await patterns
- **Data Sources**: AviationStack, FlightAware, OpenSky integrations
- **Caching**: Redis + Database dual-layer caching
- **Load Balancing**: Weighted round-robin with health checks
- **Monitoring**: Comprehensive metrics and alerting
- **Validation**: Cross-source data validation and scoring

## 2. Aggregator Architecture

### 2.1 Service Structure
```
packages/aggregators/flight-aggregator/
├── src/
│   ├── core/
│   │   ├── aggregator.ts           # Main aggregation engine
│   │   ├── source-manager.ts       # Data source management
│   │   ├── request-router.ts       # Intelligent request routing
│   │   └── data-merger.ts          # Multi-source data fusion
│   ├── strategies/
│   │   ├── cost-optimization.ts    # Cost-aware source selection
│   │   ├── quality-scoring.ts      # Data quality assessment
│   │   ├── fallback-handler.ts     # Fallback and retry logic
│   │   └── cache-strategy.ts       # Intelligent caching
│   ├── sources/
│   │   ├── source-interface.ts     # Unified source interface
│   │   ├── aviationstack-source.ts # AviationStack adapter
│   │   ├── flightaware-source.ts   # FlightAware adapter
│   │   └── opensky-source.ts       # OpenSky adapter
│   ├── validation/
│   │   ├── data-validator.ts       # Cross-source validation
│   │   ├── consistency-checker.ts  # Data consistency verification
│   │   └── anomaly-detector.ts     # Anomaly detection
│   ├── cache/
│   │   ├── cache-manager.ts        # Multi-layer caching
│   │   ├── redis-cache.ts          # Redis implementation
│   │   └── database-cache.ts       # Database persistence
│   ├── monitoring/
│   │   ├── metrics-collector.ts    # Performance metrics
│   │   ├── health-checker.ts       # Source health monitoring
│   │   └── cost-tracker.ts         # API cost tracking
│   ├── types.ts                    # TypeScript interfaces
│   ├── errors.ts                   # Error definitions
│   └── index.ts                    # Public exports
├── tests/
│   ├── aggregator.test.ts
│   ├── source-manager.test.ts
│   ├── integration.test.ts
│   └── __fixtures__/
├── package.json
└── README.md
```

### 2.2 Core Aggregator Implementation

```typescript
export class FlightDataAggregator {
  private sourceManager: SourceManager;
  private requestRouter: RequestRouter;
  private dataMerger: DataMerger;
  private cacheManager: CacheManager;
  private validator: DataValidator;
  private costOptimizer: CostOptimizer;

  constructor(config: AggregatorConfig) {
    this.sourceManager = new SourceManager(config.sources);
    this.requestRouter = new RequestRouter(config.routing);
    this.dataMerger = new DataMerger(config.merging);
    this.cacheManager = new CacheManager(config.cache);
    this.validator = new DataValidator(config.validation);
    this.costOptimizer = new CostOptimizer(config.costLimits);
  }

  async getFlightData(request: FlightDataRequest): Promise<AggregatedFlightResponse> {
    const startTime = Date.now();
    
    try {
      // Check cache first
      const cached = await this.cacheManager.get(request);
      if (cached && this.isCacheValid(cached, request)) {
        return this.enrichResponse(cached, { cached: true, source: 'CACHE' });
      }

      // Get available sources for this request
      const availableSources = await this.sourceManager.getAvailableSources(request);
      
      if (availableSources.length === 0) {
        throw new AggregatorError('NO_SOURCES_AVAILABLE', 'No flight data sources available');
      }

      // Select optimal source(s) based on requirements
      const sourceStrategy = await this.requestRouter.selectSources(request, availableSources);
      
      // Execute request strategy
      const response = await this.executeSourceStrategy(request, sourceStrategy);
      
      // Cache the result
      await this.cacheManager.set(request, response);
      
      // Track metrics
      this.trackRequestMetrics(request, response, Date.now() - startTime);
      
      return response;
      
    } catch (error) {
      // Attempt fallback if primary strategy fails
      return this.handleRequestFailure(request, error, startTime);
    }
  }

  private async executeSourceStrategy(
    request: FlightDataRequest, 
    strategy: SourceStrategy
  ): Promise<AggregatedFlightResponse> {
    switch (strategy.type) {
      case 'SINGLE_SOURCE':
        return this.executeSingleSource(request, strategy);
      case 'PARALLEL_FETCH':
        return this.executeParallelFetch(request, strategy);
      case 'CASCADING_FALLBACK':
        return this.executeCascadingFallback(request, strategy);
      case 'BEST_EFFORT':
        return this.executeBestEffort(request, strategy);
      default:
        throw new AggregatorError('UNKNOWN_STRATEGY', `Unknown strategy: ${strategy.type}`);
    }
  }

  private async executeSingleSource(
    request: FlightDataRequest, 
    strategy: SingleSourceStrategy
  ): Promise<AggregatedFlightResponse> {
    const source = strategy.source;
    
    try {
      const result = await source.getFlightData(request);
      const validatedResult = await this.validator.validateSingleSource(result);
      
      return {
        data: validatedResult.data,
        metadata: {
          sources: [source.name],
          strategy: 'SINGLE_SOURCE',
          confidence: validatedResult.confidence,
          cached: false,
          cost: await this.costOptimizer.calculateCost([source], request)
        }
      };
    } catch (error) {
      throw new AggregatorError('SOURCE_FAILED', `Source ${source.name} failed: ${error.message}`);
    }
  }

  private async executeParallelFetch(
    request: FlightDataRequest, 
    strategy: ParallelFetchStrategy
  ): Promise<AggregatedFlightResponse> {
    const sources = strategy.sources;
    
    // Execute requests in parallel
    const results = await Promise.allSettled(
      sources.map(source => 
        source.getFlightData(request).catch(error => ({ error, source: source.name }))
      )
    );
    
    // Filter successful results
    const successfulResults = results
      .filter((result): result is PromiseFulfilledResult<any> => result.status === 'fulfilled')
      .map(result => result.value)
      .filter(result => !result.error);
    
    if (successfulResults.length === 0) {
      throw new AggregatorError('ALL_SOURCES_FAILED', 'All parallel sources failed');
    }
    
    // Merge and validate results
    const mergedData = await this.dataMerger.mergeFlightData(successfulResults);
    const validatedResult = await this.validator.validateMergedData(mergedData, successfulResults);
    
    return {
      data: validatedResult.data,
      metadata: {
        sources: successfulResults.map(r => r.source),
        strategy: 'PARALLEL_FETCH',
        confidence: validatedResult.confidence,
        cached: false,
        cost: await this.costOptimizer.calculateCost(sources, request),
        mergeInfo: {
          totalSources: sources.length,
          successfulSources: successfulResults.length,
          conflicts: validatedResult.conflicts
        }
      }
    };
  }

  private async executeCascadingFallback(
    request: FlightDataRequest, 
    strategy: CascadingFallbackStrategy
  ): Promise<AggregatedFlightResponse> {
    const sources = strategy.orderedSources;
    let lastError: Error | null = null;
    
    for (const source of sources) {
      try {
        const result = await source.getFlightData(request);
        const validatedResult = await this.validator.validateSingleSource(result);
        
        // If data quality is acceptable, return it
        if (validatedResult.confidence >= strategy.minimumConfidence) {
          return {
            data: validatedResult.data,
            metadata: {
              sources: [source.name],
              strategy: 'CASCADING_FALLBACK',
              confidence: validatedResult.confidence,
              cached: false,
              cost: await this.costOptimizer.calculateCost([source], request),
              fallbackLevel: sources.indexOf(source)
            }
          };
        }
      } catch (error) {
        lastError = error;
        continue; // Try next source
      }
    }
    
    throw new AggregatorError(
      'CASCADING_FALLBACK_EXHAUSTED', 
      `All fallback sources failed. Last error: ${lastError?.message}`
    );
  }
}
```

### 2.3 Source Management

```typescript
export class SourceManager {
  private sources: Map<string, FlightDataSource> = new Map();
  private healthChecker: HealthChecker;
  private costTracker: CostTracker;

  constructor(sourceConfigs: SourceConfig[]) {
    this.initializeSources(sourceConfigs);
    this.healthChecker = new HealthChecker(this.sources);
    this.costTracker = new CostTracker();
  }

  async getAvailableSources(request: FlightDataRequest): Promise<FlightDataSource[]> {
    const allSources = Array.from(this.sources.values());
    const availableSources: FlightDataSource[] = [];
    
    for (const source of allSources) {
      // Check if source supports this request type
      if (!this.sourceSupportsRequest(source, request)) {
        continue;
      }
      
      // Check source health
      const health = await this.healthChecker.checkSourceHealth(source);
      if (!health.isHealthy) {
        continue;
      }
      
      // Check rate limits
      const canMakeRequest = await source.canMakeRequest();
      if (!canMakeRequest) {
        continue;
      }
      
      availableSources.push(source);
    }
    
    return this.prioritizeSources(availableSources, request);
  }

  private sourceSupportsRequest(source: FlightDataSource, request: FlightDataRequest): boolean {
    const capabilities = source.getCapabilities();
    
    switch (request.type) {
      case 'FLIGHT_BY_NUMBER':
        return capabilities.supportsFlightLookup;
      case 'FLIGHTS_BY_ROUTE':
        return capabilities.supportsRouteLookup;
      case 'AIRPORT_FLIGHTS':
        return capabilities.supportsAirportFlights;
      case 'REAL_TIME_TRACKING':
        return capabilities.supportsRealTimeTracking;
      case 'HISTORICAL_DATA':
        return capabilities.supportsHistoricalData;
      default:
        return false;
    }
  }

  private prioritizeSources(sources: FlightDataSource[], request: FlightDataRequest): FlightDataSource[] {
    return sources.sort((a, b) => {
      // Priority factors
      const aScore = this.calculateSourceScore(a, request);
      const bScore = this.calculateSourceScore(b, request);
      
      return bScore - aScore; // Higher score first
    });
  }

  private calculateSourceScore(source: FlightDataSource, request: FlightDataRequest): number {
    let score = 0;
    
    // Data quality score (0-100)
    score += source.getQualityScore() * 0.4;
    
    // Cost efficiency (inverted - lower cost = higher score)
    const cost = source.getEstimatedCost(request);
    score += (100 - Math.min(cost * 10, 100)) * 0.3;
    
    // Reliability score (0-100)
    score += source.getReliabilityScore() * 0.2;
    
    // Speed score (inverted response time)
    const avgResponseTime = source.getAverageResponseTime();
    score += Math.max(0, 100 - avgResponseTime / 100) * 0.1;
    
    return score;
  }

  private initializeSources(configs: SourceConfig[]): void {
    configs.forEach(config => {
      switch (config.type) {
        case 'AVIATIONSTACK':
          this.sources.set('aviationstack', new AviationStackSource(config));
          break;
        case 'FLIGHTAWARE':
          this.sources.set('flightaware', new FlightAwareSource(config));
          break;
        case 'OPENSKY':
          this.sources.set('opensky', new OpenSkySource(config));
          break;
      }
    });
  }
}
```

### 2.4 Request Router

```typescript
export class RequestRouter {
  private costOptimizer: CostOptimizer;
  private qualityAnalyzer: QualityAnalyzer;

  constructor(private config: RoutingConfig) {
    this.costOptimizer = new CostOptimizer(config.costLimits);
    this.qualityAnalyzer = new QualityAnalyzer(config.qualityThresholds);
  }

  async selectSources(
    request: FlightDataRequest, 
    availableSources: FlightDataSource[]
  ): Promise<SourceStrategy> {
    // Determine strategy based on request requirements
    const requirements = this.analyzeRequestRequirements(request);
    
    if (requirements.requiresHighAccuracy && availableSources.length >= 2) {
      return this.createParallelFetchStrategy(request, availableSources, requirements);
    }
    
    if (requirements.isCostSensitive) {
      return this.createCostOptimizedStrategy(request, availableSources, requirements);
    }
    
    if (requirements.requiresRealTime) {
      return this.createFastestSourceStrategy(request, availableSources, requirements);
    }
    
    // Default: single best source
    return this.createSingleSourceStrategy(request, availableSources, requirements);
  }

  private analyzeRequestRequirements(request: FlightDataRequest): RequestRequirements {
    return {
      requiresHighAccuracy: request.priority === 'HIGH' || request.purpose === 'POLICY_CREATION',
      isCostSensitive: request.priority === 'LOW' || request.purpose === 'BACKGROUND_UPDATE',
      requiresRealTime: request.maxAge !== undefined && request.maxAge < 300, // 5 minutes
      requiresHistorical: request.timeRange !== undefined,
      maxResponseTime: request.timeout || 10000,
      minConfidence: request.minConfidence || 0.7
    };
  }

  private createParallelFetchStrategy(
    request: FlightDataRequest,
    sources: FlightDataSource[],
    requirements: RequestRequirements
  ): ParallelFetchStrategy {
    // Select top 2-3 sources for parallel fetching
    const selectedSources = this.selectTopSources(sources, Math.min(3, sources.length));
    
    return {
      type: 'PARALLEL_FETCH',
      sources: selectedSources,
      mergeStrategy: 'WEIGHTED_AVERAGE',
      conflictResolution: 'HIGHEST_CONFIDENCE',
      timeout: requirements.maxResponseTime
    };
  }

  private createCostOptimizedStrategy(
    request: FlightDataRequest,
    sources: FlightDataSource[],
    requirements: RequestRequirements
  ): SourceStrategy {
    // Prioritize free sources (OpenSky) first
    const freeSources = sources.filter(s => s.getCostTier() === 'FREE');
    const paidSources = sources.filter(s => s.getCostTier() !== 'FREE').sort((a, b) => 
      a.getEstimatedCost(request) - b.getEstimatedCost(request)
    );
    
    const orderedSources = [...freeSources, ...paidSources];
    
    return {
      type: 'CASCADING_FALLBACK',
      orderedSources,
      minimumConfidence: requirements.minConfidence,
      maxAttempts: Math.min(orderedSources.length, 3)
    };
  }

  private createFastestSourceStrategy(
    request: FlightDataRequest,
    sources: FlightDataSource[],
    requirements: RequestRequirements
  ): SingleSourceStrategy {
    // Select source with best response time
    const fastestSource = sources.reduce((fastest, current) => 
      current.getAverageResponseTime() < fastest.getAverageResponseTime() ? current : fastest
    );
    
    return {
      type: 'SINGLE_SOURCE',
      source: fastestSource,
      timeout: requirements.maxResponseTime
    };
  }

  private selectTopSources(sources: FlightDataSource[], count: number): FlightDataSource[] {
    return sources
      .sort((a, b) => b.getOverallScore() - a.getOverallScore())
      .slice(0, count);
  }
}
```

### 2.5 Data Merger

```typescript
export class DataMerger {
  async mergeFlightData(results: FlightDataResult[]): Promise<MergedFlightData> {
    if (results.length === 0) {
      throw new AggregatorError('NO_DATA_TO_MERGE', 'No flight data results to merge');
    }
    
    if (results.length === 1) {
      return {
        data: results[0].data,
        confidence: results[0].confidence,
        sources: [results[0].source],
        conflicts: []
      };
    }
    
    // Input: An array of FlightDataResult, where each result contains `Partial<CanonicalFlightDataModel>` 
    // contributions from different API clients (already initially transformed by those clients).
    // Each result should also include source identifier and data timestamp.
    // Output: A single, consolidated `CanonicalFlightDataModel`.

    // 1. Pre-processing & Correlation (especially for OpenSky `icao24` data):
    //    - If OpenSky state vectors are part of `results`, correlate them with scheduled flights from other
    //      sources using `icao24` and time proximity. This might involve:
    //      - Looking up `icao24` in contributions from AviationStack/FlightAware (which might have `aircraft.registration` that can be cross-referenced with `icao24`).
    //      - If a match is found, enrich the corresponding flight contribution with OpenSky's `livePosition` data.
    //    - This step ensures that telemetry is associated with the correct scheduled flight instance.

    // 2. Grouping Contributions:
    //    - Group all `Partial<CanonicalFlightDataModel>` contributions by a common flight identifier 
    //      (e.g., a combination of IATA/ICAO flight number, scheduled departure date, origin, and destination).
    //    - An `internalFlightId` (ULID) should be generated or retrieved if this flight segment is already known.
    const flightGroups = this.groupFlightContributionsByIdentifier(results);

    // 3. Merging each group into a single CanonicalFlightDataModel:
    const mergedCanonicalFlights = await Promise.all(
      flightGroups.map(group => this.mergeFlightGroupToCanonical(group.contributions, group.identifier /* includes internalFlightId */))
    );
    
    // For simplicity, assuming this PRD focuses on merging for a single flight request at a time for now.
    // The `getFlightData` method in `FlightDataAggregator` would handle the request for one specific flight.
    if (mergedCanonicalFlights.length === 1) {
      // 4. Forward to Persistence Layer:
      //    The FlightDataAggregator (after this merger completes) will be responsible for sending
      //    the final `CanonicalFlightDataModel` to the Data Persistence Layer/Service for storage
      //    in `historical_flight_segments`.
      //    Example: `await dataPersistenceService.saveFlightSegment(mergedCanonicalFlights[0]);`
      
      return mergedCanonicalFlights[0]; // Or a structure including this and metadata
    } else if (mergedCanonicalFlights.length > 1) {
      // Handle cases where a single request might resolve to multiple distinct flight segments
      // This logic would be more complex and depends on request patterns.
      // For now, returning the array for further processing.
      return mergedCanonicalFlights; // This return type needs to match `getFlightData` in aggregator.
    }
    
    throw new AggregatorError('MERGE_FAILED', 'Failed to merge flight data into canonical model.');
  }

  private async mergeFlightGroupToCanonical(
    contributions: Array<{ source: string; data: Partial<CanonicalFlightDataModel>; timestamp: Date; confidence: number }>,
    flightIdentifier: { internalFlightId: string; /* other identifiers */ }
  ): Promise<CanonicalFlightDataModel> {
    
    const canonicalOutput: Partial<CanonicalFlightDataModel> = { internalFlightId: flightIdentifier.internalFlightId };
    const sourceContributions: Record<string, SourceContribution[]> = {}; // To store provenance

    // Initialize with a base structure if possible (e.g., from the most trusted source or scheduled data)
    // ...

    // Define field-specific merging strategies and priorities:
    // Example for 'status':
    //  - Prefer FlightAware if available and recent.
    //  - Else, use AviationStack.
    //  - Enrich with OpenSky `onGround` and velocity.
    //  - Record chosen value in `canonicalOutput.status`
    //  - Record all contributing sources in `sourceContributions.status`

    // Example for Timestamps (e.g., `actualDepartureTimestampUTC`):
    //  - Iterate through `CanonicalFlightDataModel` timestamp fields (gateDepartureActual, runwayDepartureActual etc.)
    //  - For each, check contributions from FlightAware (often most granular), then others.
    //  - Select the most reliable/recent non-null value.
    //  - Populate `canonicalOutput[timestampField]`
    //  - Populate `sourceContributions[timestampField]`

    // Merge Nested Objects: `airline`, `origin`, `destination`, `aircraft`, `livePosition`
    //  - For `origin` (CanonicalAirportInfo):
    //    - Collect all `origin` contributions.
    //    - Merge: Prefer FlightAware for `timezoneOlson`, `stateOrProvince`.
    //    - Use internal `airports` reference table (via IATA code) to fill missing (name, city, countryIsoCode, lat/lon).
    //    - Populate `canonicalOutput.origin` and `sourceContributions.origin`.
    //  - Similar logic for `destination`, `airline` (using `airlines` reference table), `aircraft` (using `aircraft_types` reference table).

    // `livePosition` from OpenSky (highest priority for this if recent) or FlightAware.

    // This is a placeholder for detailed field-by-field merging logic:
    for (const contrib of contributions) {
      // For each field in CanonicalFlightDataModel...
      // Apply rules from `this.shouldUseSourceField` (now adapted for CanonicalFlightDataModel fields and source priorities)
      // to populate `canonicalOutput`.
      // Populate `sourceContributions` for each field.
      // Example:
      if (contrib.data.status && this.shouldUseSourceField('status', contrib.source, contrib.confidence, canonicalOutput, contrib.data)) {
        canonicalOutput.status = contrib.data.status;
        // Add to sourceContributions.status...
      }
      if (contrib.data.actualDepartureTimestampUTC && this.shouldUseSourceField('actualDepartureTimestampUTC', contrib.source, contrib.confidence, canonicalOutput, contrib.data)) {
        canonicalOutput.actualDepartureTimestampUTC = contrib.data.actualDepartureTimestampUTC;
        // Add to sourceContributions.actualDepartureTimestampUTC...
      }
      // ... and so on for ALL fields in CanonicalFlightDataModel, including nested ones.
    }
    
    canonicalOutput.sourceContributions = sourceContributions;
    canonicalOutput.fetchedAtUTC = new Date().toISOString(); // Final aggregation timestamp

    // Validate against a Zod schema for CanonicalFlightDataModel if available
    // const validation = CanonicalFlightDataModelSchema.safeParse(canonicalOutput);
    // if (!validation.success) { /* handle error */ }

    return canonicalOutput as CanonicalFlightDataModel; // Cast after ensuring all required fields are populated
  }

  private shouldUseSourceField(
    fieldName: keyof CanonicalFlightDataModel,
    sourceApiName: string, // e.g., 'FlightAware', 'AviationStack', 'OpenSky'
    sourceConfidence: number,
    currentCanonicalOutput: Partial<CanonicalFlightDataModel>,
    sourceContributionFieldData: Partial<CanonicalFlightDataModel>
  ): boolean {
    const currentValue = currentCanonicalOutput[fieldName];
    const sourceValue = sourceContributionFieldData[fieldName];

    if (sourceValue === undefined || sourceValue === null) return false; // Source has no data for this field
    if (currentValue === undefined || currentValue === null) return true; // Current output has no data, so use source

    // Add field-specific prioritization logic here:
    // Example: FlightAware is often best for actual timestamps
    if (fieldName.toLowerCase().includes('actual') && fieldName.toLowerCase().includes('timestamp')) {
      if (sourceApiName === 'FlightAware') return true; // Prioritize FlightAware for actual times
      if (currentCanonicalOutput.sourceContributions?.[fieldName]?.some(c => c.sourceApi === 'FlightAware')) return false; // Don't overwrite if already from FA
    }
    
    // Example: OpenSky is best for live position
    if (fieldName === 'livePosition') {
      if (sourceApiName === 'OpenSky') return true;
       if (currentCanonicalOutput.sourceContributions?.[fieldName]?.some(c => c.sourceApi === 'OpenSky')) return false;
    }

    // Generic confidence check (can be more nuanced)
    // This needs a proper confidence model for each source & field
    // For now, a simple override if source confidence is high.
    if (sourceConfidence > (currentCanonicalOutput.sourceContributions?.[fieldName]?.[0]?.confidence || 0.5) ) {
       return true;
    }
    
    // Default to not overwriting if no specific rule applies
    return false;
  }

  private detectConflicts(
    mergedCanonicalFlight: CanonicalFlightDataModel
    // Potentially pass all original contributions if needed for detailed conflict reporting
  ): DataConflict[] {
    const conflicts: DataConflict[] = [];
    const contributions = mergedCanonicalFlight.sourceContributions;

    if (!contributions) return conflicts;

    // Example: Check for status conflicts if multiple sources contributed
    if (contributions.status && contributions.status.length > 1) {
      const uniqueStatuses = [...new Set(contributions.status.map(s => s.value as FlightStatus))];
      if (uniqueStatuses.length > 1) {
        conflicts.push({
          type: 'STATUS_MISMATCH',
          field: 'status',
          values: uniqueStatuses,
          sources: contributions.status.map(s => s.sourceApi),
          severity: 'MEDIUM',
          flightId: mergedCanonicalFlight.internalFlightId
        });
      }
    }

    // Example: Check for significant delay differences
    const departureDelays = contributions.departureDelayMinutes?.map(d => d.value as number).filter(d => d !== null && d !== undefined) || [];
    if (departureDelays.length > 1) {
      const maxDelay = Math.max(...departureDelays);
      const minDelay = Math.min(...departureDelays);
      if (maxDelay - minDelay > 30) { // 30 minute difference
        conflicts.push({
          type: 'DELAY_MISMATCH',
          field: 'departureDelayMinutes',
          values: departureDelays,
          sources: contributions.departureDelayMinutes!.map(s => s.sourceApi),
          severity: 'HIGH',
          flightId: mergedCanonicalFlight.internalFlightId
        });
      }
    }
    // Add more conflict detection rules for other critical fields (timestamps, airports etc.)
    
    return conflicts;
  }

  // Groups incoming Partial<CanonicalFlightDataModel> from various sources
  private groupFlightContributionsByIdentifier(
    results: Array<{ source: string; data: Partial<CanonicalFlightDataModel> & { icao24?: string }; timestamp: Date; confidence: number }>
  ): Array<{ identifier: { internalFlightId: string; /* other keys */ }; contributions: Array<typeof results[0]> }> {
    // This logic needs to be robust.
    // An "identifier" could be a composite key: IATA/ICAO flight number + scheduled departure date + origin IATA + destination IATA.
    // OpenSky data (icao24 + time) needs to be correlated to these scheduled flights first.
    // For MVP, we might assume requests to the aggregator are for ONE specific flight, simplifying grouping.
    // If so, all results are contributions to that single flight.
    // An `internalFlightId` should be generated or retrieved for each distinct flight segment being processed.

    // Simplified example assuming all results are for the same logical flight segment:
    // A more complex implementation would handle multiple flight segments if the initial query was broad.
    const internalFlightId = results[0]?.data?.internalFlightId || `temp_${Date.now()}`; // Placeholder

    return [{
      identifier: { internalFlightId },
      contributions: results
    }];
  }

  // This method is less relevant if individual clients already map to Canonical fields.
  // The core merging happens in mergeFlightGroupToCanonical.
  // private createFlightIdentifier(flight: Partial<CanonicalFlightDataModel>): string { ... }

  private calculateOverallConfidence( // This might apply to the final CanonicalFlightDataModel
    mergedFlight: CanonicalFlightDataModel
  ): number {
    if (results.length === 0) return 0;
    
    // Weighted average based on source reliability
    const totalWeight = results.reduce((sum, result) => sum + result.weight, 0);
    const weightedSum = results.reduce((sum, result) => sum + (result.confidence * result.weight), 0);
    
    return totalWeight > 0 ? weightedSum / totalWeight : 0;
  }

  private findHighestConfidenceSource(flights: Flight[], results: FlightDataResult[]): number {
    let highestConfidence = 0;
    let bestIndex = 0;
    
    flights.forEach((flight, index) => {
      const sourceResult = results.find(r => r.data.includes(flight));
      if (sourceResult && sourceResult.confidence > highestConfidence) {
        highestConfidence = sourceResult.confidence;
        bestIndex = index;
      }
    });
    
    return bestIndex;
  }
}
```

## 3. Caching Strategy

### 3.1 Multi-Layer Cache Implementation

```typescript
export class CacheManager {
  private redisCache: RedisCache;
  private databaseCache: DatabaseCache;
  private memoryCache: MemoryCache;

  constructor(private config: CacheConfig) {
    this.redisCache = new RedisCache(config.redis);
    this.databaseCache = new DatabaseCache(config.database);
    this.memoryCache = new MemoryCache(config.memory);
  }

  async get(request: FlightDataRequest): Promise<AggregatedFlightResponse | null> {
    const cacheKey = this.generateCacheKey(request);
    
    // Check memory cache first (fastest)
    let cached = await this.memoryCache.get(cacheKey);
    if (cached && this.isCacheValid(cached, request)) {
      flightAggregatorMetrics.cacheHits.inc({ layer: 'memory' });
      return cached;
    }
    
    // Check Redis cache (fast)
    cached = await this.redisCache.get(cacheKey);
    if (cached && this.isCacheValid(cached, request)) {
      // Populate memory cache for next time
      await this.memoryCache.set(cacheKey, cached, 300); // 5 minutes
      flightAggregatorMetrics.cacheHits.inc({ layer: 'redis' });
      return cached;
    }
    
    // Check database cache (persistent but slower)
    cached = await this.databaseCache.get(cacheKey);
    if (cached && this.isCacheValid(cached, request)) {
      // Populate upper caches
      await this.redisCache.set(cacheKey, cached, 1800); // 30 minutes
      await this.memoryCache.set(cacheKey, cached, 300); // 5 minutes
      flightAggregatorMetrics.cacheHits.inc({ layer: 'database' });
      return cached;
    }
    
    flightAggregatorMetrics.cacheMisses.inc();
    return null;
  }

  async set(request: FlightDataRequest, response: AggregatedFlightResponse): Promise<void> {
    const cacheKey = this.generateCacheKey(request);
    const ttl = this.calculateTTL(request, response);
    
    // Store in all cache layers
    await Promise.all([
      this.memoryCache.set(cacheKey, response, Math.min(ttl, 300)), // Max 5 minutes in memory
      this.redisCache.set(cacheKey, response, Math.min(ttl, 1800)), // Max 30 minutes in Redis
      this.databaseCache.set(cacheKey, response, ttl) // Full TTL in database
    ]);
  }

  private generateCacheKey(request: FlightDataRequest): string {
    const keyParts = [
      request.type,
      request.flightNumber || 'no-flight',
      request.departureAirport || 'no-dep',
      request.arrivalAirport || 'no-arr',
      request.date ? request.date.toISOString().split('T')[0] : 'no-date'
    ];
    
    return `flight:${keyParts.join(':')}`;
  }

  private calculateTTL(request: FlightDataRequest, response: AggregatedFlightResponse): number {
    // Base TTL on data freshness requirements
    const baseMinutes = request.maxAge || 30;
    
    // Adjust based on flight status
    if (response.data.some(flight => flight.status === 'ACTIVE')) {
      return Math.min(baseMinutes, 5); // Active flights need frequent updates
    }
    
    if (response.data.some(flight => flight.status === 'DELAYED')) {
      return Math.min(baseMinutes, 10); // Delayed flights change frequently
    }
    
    return baseMinutes * 60; // Convert to seconds
  }

  private isCacheValid(cached: CachedResponse, request: FlightDataRequest): boolean {
    const age = Date.now() - cached.timestamp;
    const maxAge = (request.maxAge || 30) * 60 * 1000; // Convert to milliseconds
    return age < maxAge;
  }
}
```

## 4. Health Monitoring & Observability

### 4.1 Source Health Monitoring

```typescript
export class SourceHealthChecker {
  private healthMetrics: Map<string, SourceHealth> = new Map();
  
  async checkSourceHealth(source: FlightDataSource): Promise<SourceHealth> {
    const sourceId = source.getId();
    const cached = this.healthMetrics.get(sourceId);
    
    // Use cached health status if recent
    if (cached && Date.now() - cached.lastChecked < 60000) {
      return cached;
    }
    
    const health = await this.performHealthCheck(source);
    this.healthMetrics.set(sourceId, health);
    
    // Update metrics
    flightAggregatorMetrics.sourceHealth.set(
      { source: sourceId },
      health.isHealthy ? 1 : 0
    );
    
    return health;
  }
  
  private async performHealthCheck(source: FlightDataSource): Promise<SourceHealth> {
    try {
      const start = Date.now();
      await source.healthCheck();
      const responseTime = Date.now() - start;
      
      return {
        isHealthy: true,
        responseTime,
        lastChecked: Date.now(),
        errorCount: 0,
        errorRate: 0
      };
    } catch (error) {
      return {
        isHealthy: false,
        responseTime: -1,
        lastChecked: Date.now(),
        errorCount: this.getErrorCount(source.getId()) + 1,
        errorRate: this.calculateErrorRate(source.getId()),
        lastError: error.message
      };
    }
  }
}
```

### 4.2 Performance Metrics

```typescript
export const flightAggregatorMetrics = {
  // Request metrics
  requestsTotal: new Counter({
    name: 'flight_aggregator_requests_total',
    help: 'Total flight data requests',
    labelNames: ['type', 'status']
  }),
  
  requestDuration: new Histogram({
    name: 'flight_aggregator_request_duration_seconds',
    help: 'Flight data request duration',
    labelNames: ['type', 'strategy'],
    buckets: [0.1, 0.5, 1, 2, 5, 10]
  }),
  
  // Cache metrics
  cacheHits: new Counter({
    name: 'flight_aggregator_cache_hits_total',
    help: 'Cache hits by layer',
    labelNames: ['layer']
  }),
  
  cacheMisses: new Counter({
    name: 'flight_aggregator_cache_misses_total',
    help: 'Cache misses'
  }),
  
  // Source metrics
  sourceRequests: new Counter({
    name: 'flight_aggregator_source_requests_total',
    help: 'Requests to external sources',
    labelNames: ['source', 'status']
  }),
  
  sourceHealth: new Gauge({
    name: 'flight_aggregator_source_health',
    help: 'Source health status (1=healthy, 0=unhealthy)',
    labelNames: ['source']
  }),
  
  // Data quality metrics
  dataConflicts: new Counter({
    name: 'flight_aggregator_data_conflicts_total',
    help: 'Data conflicts detected during merging',
    labelNames: ['field']
  }),
  
  confidenceScore: new Histogram({
    name: 'flight_aggregator_confidence_score',
    help: 'Aggregated data confidence score',
    buckets: [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0]
  })
};
```

## 5. API Specifications

### 5.1 REST Endpoints

#### GET /api/flights/aggregate
Query aggregated flight data with intelligent source selection.

**Request Parameters:**
```typescript
interface FlightDataRequest {
  type: 'FLIGHT_BY_NUMBER' | 'FLIGHTS_BY_ROUTE' | 'AIRPORT_FLIGHTS' | 'REAL_TIME_TRACKING';
  flightNumber?: string;
  date?: string; // ISO 8601 date
  departureAirport?: string; // IATA code
  arrivalAirport?: string; // IATA code
  maxAge?: number; // Minutes, default 30
  strategy?: 'SINGLE_SOURCE' | 'PARALLEL_FETCH' | 'CASCADING_FALLBACK';
  includeMetadata?: boolean; // Include source and confidence info
}
```

**Response:**
```typescript
interface AggregatedFlightResponse {
  data: Flight[];
  metadata: {
    sources: string[];
    confidence: number;
    responseTime: number;
    cacheStatus: 'HIT' | 'MISS';
    conflicts?: DataConflict[];
  };
}
```

#### GET /api/flights/sources/status
Get health status of all configured flight data sources.

**Response:**
```typescript
interface SourceStatusResponse {
  sources: Array<{
    id: string;
    name: string;
    isHealthy: boolean;
    responseTime: number;
    errorRate: number;
    lastChecked: string;
    capabilities: string[];
  }>;
  overallHealth: 'HEALTHY' | 'DEGRADED' | 'UNHEALTHY';
}
```

### 5.2 Error Handling

```typescript
export class AggregatorError extends Error {
  constructor(
    public code: string,
    message: string,
    public details?: any
  ) {
    super(message);
    this.name = 'AggregatorError';
  }
}

// Error codes
export const ERROR_CODES = {
  NO_SOURCES_AVAILABLE: 'NO_SOURCES_AVAILABLE',
  ALL_SOURCES_FAILED: 'ALL_SOURCES_FAILED',
  NO_DATA_TO_MERGE: 'NO_DATA_TO_MERGE',
  INVALID_REQUEST: 'INVALID_REQUEST',
  TIMEOUT_EXCEEDED: 'TIMEOUT_EXCEEDED',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED'
} as const;
```

## 6. Integration Patterns

### 6.1 Source Adapters
Based on working test implementations:

- **AviationStack**: Premium data, rate limited, HTTP API
- **FlightAware**: Real-time tracking, requires API key
- **OpenSky**: Free crowd-sourced data, basic authentication

### 6.2 Configuration
```typescript
export const AGGREGATOR_CONFIG = {
  sources: {
    aviationstack: {
      enabled: true,
      priority: 1,
      costTier: 'PREMIUM',
      rateLimit: { requests: 500, window: 'month' }
    },
    flightaware: {
      enabled: true,
      priority: 2,
      costTier: 'PREMIUM',
      rateLimit: { requests: 1000, window: 'month' }
    },
    opensky: {
      enabled: true,
      priority: 3,
      costTier: 'FREE',
      rateLimit: { requests: 400, window: 'day' }
    }
  },
  caching: {
    memoryTTL: 300, // 5 minutes
    redisTTL: 1800, // 30 minutes
    dbTTL: 86400 // 24 hours
  },
  routing: {
    defaultStrategy: 'SINGLE_SOURCE',
    parallelThreshold: 2,
    timeoutMs: 10000
  }
};
```

## 7. Implementation Timeline

### Phase 1: Foundation (Week 1-2)
- ✅ Core aggregator architecture
- ✅ Source management system
- ✅ Basic caching layer
- ✅ Single source strategy

### Phase 2: Enhancement (Week 3-4)
- Multi-source strategies (parallel, fallback)
- Data merging and conflict resolution
- Health monitoring and metrics
- API endpoints

### Phase 3: Optimization (Week 5-6)
- Advanced caching strategies
- Cost optimization
- Performance tuning
- Documentation and testing

## 8. Success Metrics

### Performance Targets
- **Response Time**: < 2 seconds for 95% of requests
- **Cache Hit Rate**: > 80% for memory/Redis, > 60% for database
- **Source Availability**: > 99% uptime for critical sources
- **Data Freshness**: < 5 minutes for active flights

### Quality Metrics
- **Data Accuracy**: > 95% accuracy compared to official sources
- **Conflict Rate**: < 5% of merged data points
- **Source Coverage**: Support for 3+ data sources
- **Cost Efficiency**: < $0.10 per flight query on average

---

**Dependencies**: PRD-CORE-001 (Database), PRD-INTEGRATION-001/002/003 (Source APIs)
**Related**: PRD-ENGINE-001 (Quote Engine - consumer of this service)
**Status**: Implementation Ready