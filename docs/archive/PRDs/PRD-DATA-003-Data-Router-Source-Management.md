# PRD-DATA-003: Data Router & Source Management

**Status**: Ready for Implementation  
**Priority**: High - Cost Optimization & Reliability  
**Dependencies**: PRD-DATA-001 (Flight Data Aggregator), PRD-INTEGRATION-001/002/003/004 (Data Sources)  
**Estimated Timeline**: 2-3 weeks  

## 1. Overview

### 1.1 Purpose
The Data Router & Source Management system provides intelligent routing of data requests across multiple external APIs to optimize cost, performance, and reliability. It manages API quotas, implements fallback strategies, and ensures optimal data source selection based on real-time conditions.

### 1.2 Strategic Goals
- **Cost Optimization**: Minimize external API costs through intelligent source selection
- **Reliability**: Ensure data availability through multi-source fallback strategies
- **Performance**: Route requests to fastest available sources
- **Quality**: Maintain data quality while optimizing costs
- **Scalability**: Handle increasing request volumes efficiently

### 1.3 Architecture
```typescript
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Data Request  │    │   Data Router    │    │  Source Pool    │
│                 │────▶│                  │────▶│                 │
│ Flight Data     │    │ Route Selection  │    │ AviationStack   │
│ Weather Data    │    │ Load Balancing   │    │ FlightAware     │
│ Historical Data │    │ Fallback Logic   │    │ OpenSky         │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                │
                                ▼
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│ Cost Optimizer  │    │ Source Monitor   │    │ Quality Tracker │
│                 │────▶│                  │────▶│                 │
│ Budget Tracking │    │ Health Checks    │    │ Data Validation │
│ Usage Analytics │    │ Rate Limiting    │    │ Confidence Score│
│ Source Ranking  │    │ Performance      │    │ Accuracy Metrics│
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

## 2. Core Components

### 2.1 Data Router Implementation

```typescript
export class DataRouter {
  private sourceManager: DataSourceManager;
  private costOptimizer: CostOptimizer;
  private routingEngine: RoutingEngine;
  private qualityTracker: DataQualityTracker;

  constructor(config: DataRouterConfig) {
    this.sourceManager = new DataSourceManager(config.sources);
    this.costOptimizer = new CostOptimizer(config.costLimits);
    this.routingEngine = new RoutingEngine(config.routing);
    this.qualityTracker = new DataQualityTracker(config.quality);
  }

  async routeRequest(request: DataRequest): Promise<RoutedDataResponse> {
    const startTime = Date.now();
    
    try {
      // Analyze request requirements
      const requirements = await this.analyzeRequest(request);
      
      // Get available sources
      const availableSources = await this.sourceManager.getAvailableSources(
        request.type,
        requirements
      );
      
      if (availableSources.length === 0) {
        throw new DataRouterError('NO_SOURCES_AVAILABLE', 'No data sources available for request');
      }
      
      // Select optimal routing strategy
      const strategy = await this.routingEngine.selectStrategy(
        request,
        availableSources,
        requirements
      );
      
      // Execute request with selected strategy
      const result = await this.executeStrategy(strategy, request);
      
      // Track metrics
      dataRouterMetrics.requestsRouted.inc({
        strategy: strategy.type,
        primary_source: strategy.primarySource.name
      });
      
      dataRouterMetrics.requestDuration.observe(
        { strategy: strategy.type },
        (Date.now() - startTime) / 1000
      );
      
      return result;
      
    } catch (error) {
      dataRouterMetrics.routingErrors.inc({
        error: error.constructor.name,
        request_type: request.type
      });
      
      throw error;
    }
  }

  private async analyzeRequest(request: DataRequest): Promise<RequestRequirements> {
    return {
      urgency: this.calculateUrgency(request),
      qualityNeeds: this.assessQualityNeeds(request),
      costSensitivity: this.getCostSensitivity(request),
      dataFreshness: request.maxAge || 300, // 5 minutes default
      fallbackAcceptable: request.allowFallback !== false
    };
  }

  private async executeStrategy(
    strategy: RoutingStrategy,
    request: DataRequest
  ): Promise<RoutedDataResponse> {
    switch (strategy.type) {
      case 'SINGLE_SOURCE':
        return this.executeSingleSource(strategy, request);
      case 'PARALLEL_SOURCES':
        return this.executeParallelSources(strategy, request);
      case 'CASCADING_FALLBACK':
        return this.executeCascadingFallback(strategy, request);
      case 'COST_OPTIMIZED':
        return this.executeCostOptimized(strategy, request);
      default:
        throw new DataRouterError('UNKNOWN_STRATEGY', `Unknown routing strategy: ${strategy.type}`);
    }
  }

  private async executeSingleSource(
    strategy: SingleSourceStrategy,
    request: DataRequest
  ): Promise<RoutedDataResponse> {
    const source = strategy.primarySource;
    
    try {
      const response = await source.fetchData(request);
      
      // Track usage and costs
      await this.costOptimizer.recordUsage(source.name, request, response.cost);
      await this.qualityTracker.recordResponse(source.name, response);
      
      return {
        data: response.data,
        source: source.name,
        strategy: 'SINGLE_SOURCE',
        cost: response.cost,
        confidence: response.confidence,
        metadata: {
          responseTime: response.responseTime,
          cacheStatus: response.cacheStatus
        }
      };
      
    } catch (error) {
      // Record failure
      await this.sourceManager.recordFailure(source.name, error);
      throw error;
    }
  }

  private async executeParallelSources(
    strategy: ParallelSourcesStrategy,
    request: DataRequest
  ): Promise<RoutedDataResponse> {
    const promises = strategy.sources.map(async (source) => {
      try {
        const response = await source.fetchData(request);
        return { source: source.name, response, error: null };
      } catch (error) {
        return { source: source.name, response: null, error };
      }
    });

    const results = await Promise.allSettled(promises);
    const successful = results
      .filter(result => result.status === 'fulfilled' && result.value.response)
      .map(result => (result as PromiseFulfilledResult<any>).value);

    if (successful.length === 0) {
      throw new DataRouterError('ALL_SOURCES_FAILED', 'All parallel sources failed');
    }

    // Merge responses based on strategy
    const mergedData = await this.mergeResponses(successful, strategy.mergeMethod);
    
    // Calculate combined metrics
    const totalCost = successful.reduce((sum, result) => sum + (result.response.cost || 0), 0);
    const avgConfidence = successful.reduce((sum, result) => sum + result.response.confidence, 0) / successful.length;

    return {
      data: mergedData,
      source: successful.map(r => r.source).join(','),
      strategy: 'PARALLEL_SOURCES',
      cost: totalCost,
      confidence: avgConfidence,
      metadata: {
        sourcesUsed: successful.length,
        sourcesFailed: strategy.sources.length - successful.length
      }
    };
  }

  private async executeCascadingFallback(
    strategy: CascadingFallbackStrategy,
    request: DataRequest
  ): Promise<RoutedDataResponse> {
    let lastError: Error | null = null;

    for (const source of strategy.sources) {
      try {
        const response = await source.fetchData(request);
        
        // Record successful usage
        await this.costOptimizer.recordUsage(source.name, request, response.cost);
        await this.qualityTracker.recordResponse(source.name, response);
        
        return {
          data: response.data,
          source: source.name,
          strategy: 'CASCADING_FALLBACK',
          cost: response.cost,
          confidence: response.confidence,
          metadata: {
            fallbackLevel: strategy.sources.indexOf(source),
            originalError: lastError?.message
          }
        };
        
      } catch (error) {
        lastError = error;
        await this.sourceManager.recordFailure(source.name, error);
        
        // Continue to next source
        dataRouterMetrics.fallbackAttempts.inc({
          source: source.name,
          request_type: request.type
        });
      }
    }

    throw new DataRouterError('ALL_FALLBACKS_FAILED', `All fallback sources failed. Last error: ${lastError?.message}`);
  }
}
```

### 2.2 Source Manager

```typescript
export class DataSourceManager {
  private sources: Map<string, DataSource> = new Map();
  private healthMonitor: SourceHealthMonitor;
  private rateLimiter: RateLimiter;

  constructor(config: SourceManagerConfig) {
    this.healthMonitor = new SourceHealthMonitor(config.health);
    this.rateLimiter = new RateLimiter(config.rateLimits);
    this.initializeSources(config.sources);
  }

  async getAvailableSources(
    dataType: DataType,
    requirements: RequestRequirements
  ): Promise<DataSource[]> {
    const allSources = Array.from(this.sources.values());
    const available: DataSource[] = [];

    for (const source of allSources) {
      // Check if source supports this data type
      if (!source.supportsDataType(dataType)) {
        continue;
      }

      // Check health status
      const health = await this.healthMonitor.getSourceHealth(source.name);
      if (!health.isHealthy) {
        continue;
      }

      // Check rate limits
      const canMakeRequest = await this.rateLimiter.canMakeRequest(source.name);
      if (!canMakeRequest) {
        continue;
      }

      // Check if source meets quality requirements
      if (requirements.qualityNeeds === 'HIGH' && source.qualityTier !== 'PREMIUM') {
        continue;
      }

      available.push(source);
    }

    // Sort by priority and performance
    return this.prioritizeSources(available, requirements);
  }

  private prioritizeSources(
    sources: DataSource[],
    requirements: RequestRequirements
  ): DataSource[] {
    return sources.sort((a, b) => {
      const scoreA = this.calculateSourceScore(a, requirements);
      const scoreB = this.calculateSourceScore(b, requirements);
      return scoreB - scoreA; // Higher score first
    });
  }

  private calculateSourceScore(
    source: DataSource,
    requirements: RequestRequirements
  ): number {
    let score = 0;

    // Base quality score (0-100)
    score += source.qualityScore * 0.3;

    // Cost efficiency (lower cost = higher score)
    const costScore = Math.max(0, 100 - (source.costPerRequest * 100));
    score += costScore * (requirements.costSensitivity === 'HIGH' ? 0.4 : 0.2);

    // Performance score (faster = higher score)
    const perfScore = Math.max(0, 100 - source.avgResponseTime / 10);
    score += perfScore * (requirements.urgency === 'HIGH' ? 0.4 : 0.2);

    // Reliability score
    score += source.reliabilityScore * 0.2;

    // Recent performance bonus/penalty
    const recentHealth = this.healthMonitor.getRecentHealth(source.name);
    if (recentHealth) {
      score += (recentHealth.successRate - 0.5) * 20; // -10 to +10 adjustment
    }

    return score;
  }

  async recordFailure(sourceName: string, error: Error): Promise<void> {
    await this.healthMonitor.recordFailure(sourceName, error);
    
    dataRouterMetrics.sourceFailures.inc({
      source: sourceName,
      error: error.constructor.name
    });
  }

  async recordSuccess(sourceName: string, responseTime: number): Promise<void> {
    await this.healthMonitor.recordSuccess(sourceName, responseTime);
    
    dataRouterMetrics.sourceSuccesses.inc({
      source: sourceName
    });
  }
}
```

### 2.3 Cost Optimizer

```typescript
export class CostOptimizer {
  private usageTracker: UsageTracker;
  private budgetManager: BudgetManager;
  private costPredictor: CostPredictor;

  constructor(config: CostOptimizerConfig) {
    this.usageTracker = new UsageTracker();
    this.budgetManager = new BudgetManager(config.budgets);
    this.costPredictor = new CostPredictor();
  }

  async selectCostOptimalSource(
    availableSources: DataSource[],
    request: DataRequest
  ): Promise<DataSource> {
    const costAnalysis = await Promise.all(
      availableSources.map(async (source) => {
        const estimatedCost = await this.estimateRequestCost(source, request);
        const remainingBudget = await this.budgetManager.getRemainingBudget(source.name);
        const qualityValue = this.calculateQualityValue(source, request);
        
        return {
          source,
          estimatedCost,
          remainingBudget,
          qualityValue,
          costEfficiency: qualityValue / estimatedCost
        };
      })
    );

    // Filter sources that are within budget
    const affordableSources = costAnalysis.filter(
      analysis => analysis.estimatedCost <= analysis.remainingBudget
    );

    if (affordableSources.length === 0) {
      // Fallback to free sources or throw error
      const freeSources = costAnalysis.filter(analysis => analysis.estimatedCost === 0);
      if (freeSources.length === 0) {
        throw new DataRouterError('BUDGET_EXCEEDED', 'No affordable sources available');
      }
      return freeSources[0].source;
    }

    // Select source with best cost efficiency
    const bestSource = affordableSources.reduce((best, current) =>
      current.costEfficiency > best.costEfficiency ? current : best
    );

    return bestSource.source;
  }

  async recordUsage(
    sourceName: string,
    request: DataRequest,
    actualCost: number
  ): Promise<void> {
    await this.usageTracker.recordUsage(sourceName, {
      requestType: request.type,
      cost: actualCost,
      timestamp: new Date()
    });

    await this.budgetManager.deductFromBudget(sourceName, actualCost);
    
    dataRouterMetrics.costSpent.inc({
      source: sourceName,
      request_type: request.type
    }, actualCost);
  }

  private async estimateRequestCost(
    source: DataSource,
    request: DataRequest
  ): Promise<number> {
    // Use historical data to estimate cost
    const historicalAvg = await this.usageTracker.getAverageCost(
      source.name,
      request.type
    );
    
    if (historicalAvg !== null) {
      return historicalAvg;
    }
    
    // Fallback to source's default cost estimate
    return source.estimateRequestCost(request);
  }

  private calculateQualityValue(source: DataSource, request: DataRequest): number {
    // Quality value based on source capabilities and request needs
    let value = source.qualityScore;
    
    // Bonus for real-time data if needed
    if (request.requiresRealTime && source.providesRealTime) {
      value += 20;
    }
    
    // Bonus for historical data if needed
    if (request.requiresHistorical && source.providesHistorical) {
      value += 15;
    }
    
    return value;
  }
}
```

### 2.4 Routing Engine

```typescript
export class RoutingEngine {
  private strategySelector: StrategySelector;
  private performanceAnalyzer: PerformanceAnalyzer;

  async selectStrategy(
    request: DataRequest,
    availableSources: DataSource[],
    requirements: RequestRequirements
  ): Promise<RoutingStrategy> {
    
    // High urgency + multiple quality sources = parallel
    if (requirements.urgency === 'HIGH' && 
        availableSources.filter(s => s.qualityTier === 'PREMIUM').length >= 2) {
      return this.createParallelStrategy(availableSources, requirements);
    }

    // Cost sensitive = cost optimized with fallbacks
    if (requirements.costSensitivity === 'HIGH') {
      return this.createCostOptimizedStrategy(availableSources, requirements);
    }

    // High quality needs = best source with fallbacks
    if (requirements.qualityNeeds === 'HIGH') {
      return this.createQualityOptimizedStrategy(availableSources, requirements);
    }

    // Default: single best source
    return this.createSingleSourceStrategy(availableSources, requirements);
  }

  private createParallelStrategy(
    sources: DataSource[],
    requirements: RequestRequirements
  ): ParallelSourcesStrategy {
    // Select top 2-3 sources for parallel execution
    const selectedSources = sources
      .filter(s => s.qualityTier === 'PREMIUM')
      .slice(0, 3);

    return {
      type: 'PARALLEL_SOURCES',
      sources: selectedSources,
      mergeMethod: 'WEIGHTED_AVERAGE',
      timeout: requirements.urgency === 'HIGH' ? 5000 : 10000
    };
  }

  private createCostOptimizedStrategy(
    sources: DataSource[],
    requirements: RequestRequirements
  ): CascadingFallbackStrategy {
    // Prioritize free sources, then cheapest paid sources
    const freeSources = sources.filter(s => s.costPerRequest === 0);
    const paidSources = sources
      .filter(s => s.costPerRequest > 0)
      .sort((a, b) => a.costPerRequest - b.costPerRequest);

    return {
      type: 'CASCADING_FALLBACK',
      sources: [...freeSources, ...paidSources],
      maxAttempts: Math.min(sources.length, 3)
    };
  }

  private createQualityOptimizedStrategy(
    sources: DataSource[],
    requirements: RequestRequirements
  ): SingleSourceStrategy | CascadingFallbackStrategy {
    const premiumSources = sources
      .filter(s => s.qualityTier === 'PREMIUM')
      .sort((a, b) => b.qualityScore - a.qualityScore);

    if (premiumSources.length === 0) {
      // Fallback to best available sources
      const sortedSources = sources.sort((a, b) => b.qualityScore - a.qualityScore);
      return {
        type: 'CASCADING_FALLBACK',
        sources: sortedSources.slice(0, 3),
        maxAttempts: 3
      };
    }

    // Use best premium source with fallbacks
    return {
      type: 'CASCADING_FALLBACK',
      sources: premiumSources.slice(0, 2),
      maxAttempts: 2
    };
  }
}
```

## 3. Data Types

```typescript
interface DataRequest {
  type: DataType;
  parameters: RequestParameters;
  requiresRealTime?: boolean;
  requiresHistorical?: boolean;
  maxAge?: number; // seconds
  allowFallback?: boolean;
  priority?: 'LOW' | 'MEDIUM' | 'HIGH';
  costLimit?: number;
}

interface RoutedDataResponse {
  data: any;
  source: string;
  strategy: RoutingStrategyType;
  cost: number;
  confidence: number;
  metadata: {
    responseTime?: number;
    cacheStatus?: string;
    sourcesUsed?: number;
    sourcesFailed?: number;
    fallbackLevel?: number;
    originalError?: string;
  };
}

interface RequestRequirements {
  urgency: 'LOW' | 'MEDIUM' | 'HIGH';
  qualityNeeds: 'LOW' | 'MEDIUM' | 'HIGH';
  costSensitivity: 'LOW' | 'MEDIUM' | 'HIGH';
  dataFreshness: number; // seconds
  fallbackAcceptable: boolean;
}

type RoutingStrategyType = 
  | 'SINGLE_SOURCE'
  | 'PARALLEL_SOURCES'
  | 'CASCADING_FALLBACK'
  | 'COST_OPTIMIZED';

interface RoutingStrategy {
  type: RoutingStrategyType;
  timeout?: number;
  maxAttempts?: number;
}

interface SingleSourceStrategy extends RoutingStrategy {
  type: 'SINGLE_SOURCE';
  primarySource: DataSource;
}

interface ParallelSourcesStrategy extends RoutingStrategy {
  type: 'PARALLEL_SOURCES';
  sources: DataSource[];
  mergeMethod: 'FIRST_RESPONSE' | 'WEIGHTED_AVERAGE' | 'HIGHEST_CONFIDENCE';
}

interface CascadingFallbackStrategy extends RoutingStrategy {
  type: 'CASCADING_FALLBACK';
  sources: DataSource[];
  maxAttempts: number;
}

interface DataSource {
  name: string;
  qualityTier: 'FREE' | 'STANDARD' | 'PREMIUM';
  qualityScore: number; // 0-100
  costPerRequest: number;
  avgResponseTime: number; // milliseconds
  reliabilityScore: number; // 0-100
  providesRealTime: boolean;
  providesHistorical: boolean;
  
  supportsDataType(type: DataType): boolean;
  estimateRequestCost(request: DataRequest): number;
  fetchData(request: DataRequest): Promise<DataResponse>;
}
```

## 4. Configuration

```typescript
export interface DataRouterConfig {
  sources: SourceConfig[];
  routing: RoutingConfig;
  costLimits: CostLimitsConfig;
  quality: QualityConfig;
}

interface SourceConfig {
  name: string;
  type: 'AVIATIONSTACK' | 'FLIGHTAWARE' | 'OPENSKY' | 'WEATHER';
  tier: 'FREE' | 'STANDARD' | 'PREMIUM';
  costPerRequest: number;
  rateLimit: {
    requests: number;
    window: string; // 'minute' | 'hour' | 'day'
  };
  priority: number;
}

interface CostLimitsConfig {
  daily: { [sourceName: string]: number };
  monthly: { [sourceName: string]: number };
  alertThresholds: { [sourceName: string]: number };
}

// Example configuration
const routerConfig: DataRouterConfig = {
  sources: [
    {
      name: 'aviationstack',
      type: 'AVIATIONSTACK',
      tier: 'PREMIUM',
      costPerRequest: 0.01,
      rateLimit: { requests: 500, window: 'month' },
      priority: 1
    },
    {
      name: 'opensky',
      type: 'OPENSKY',
      tier: 'FREE',
      costPerRequest: 0,
      rateLimit: { requests: 400, window: 'day' },
      priority: 3
    }
  ],
  costLimits: {
    daily: { aviationstack: 5.00, flightaware: 10.00 },
    monthly: { aviationstack: 100.00, flightaware: 200.00 },
    alertThresholds: { aviationstack: 0.8, flightaware: 0.8 }
  },
  routing: {
    defaultStrategy: 'COST_OPTIMIZED',
    maxParallelSources: 3,
    fallbackTimeout: 5000
  },
  quality: {
    minAcceptableScore: 70,
    preferPremiumSources: true
  }
};
```

## 5. Monitoring & Metrics

```typescript
export const dataRouterMetrics = {
  requestsRouted: new Counter({
    name: 'data_router_requests_routed_total',
    help: 'Total requests routed',
    labelNames: ['strategy', 'primary_source']
  }),
  
  requestDuration: new Histogram({
    name: 'data_router_request_duration_seconds',
    help: 'Request routing duration',
    labelNames: ['strategy'],
    buckets: [0.1, 0.5, 1, 2, 5, 10]
  }),
  
  sourceSuccesses: new Counter({
    name: 'data_router_source_successes_total',
    help: 'Successful source requests',
    labelNames: ['source']
  }),
  
  sourceFailures: new Counter({
    name: 'data_router_source_failures_total',
    help: 'Failed source requests',
    labelNames: ['source', 'error']
  }),
  
  costSpent: new Counter({
    name: 'data_router_cost_spent_total',
    help: 'Total cost spent on data sources',
    labelNames: ['source', 'request_type']
  }),
  
  fallbackAttempts: new Counter({
    name: 'data_router_fallback_attempts_total',
    help: 'Fallback attempts to secondary sources',
    labelNames: ['source', 'request_type']
  })
};
```

## 6. Error Handling

```typescript
export class DataRouterError extends Error {
  constructor(
    public code: string,
    message: string,
    public details?: any
  ) {
    super(message);
    this.name = 'DataRouterError';
  }
}

export const DATA_ROUTER_ERROR_CODES = {
  NO_SOURCES_AVAILABLE: 'NO_SOURCES_AVAILABLE',
  ALL_SOURCES_FAILED: 'ALL_SOURCES_FAILED',
  ALL_FALLBACKS_FAILED: 'ALL_FALLBACKS_FAILED',
  BUDGET_EXCEEDED: 'BUDGET_EXCEEDED',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  UNKNOWN_STRATEGY: 'UNKNOWN_STRATEGY',
  CONFIGURATION_ERROR: 'CONFIGURATION_ERROR'
} as const;
```

## 7. Implementation Timeline

### Week 1: Core Routing
- Implement DataRouter and RoutingEngine
- Basic strategy selection logic
- Source management framework
- Error handling and logging

### Week 2: Optimization Features
- Cost optimization algorithms
- Performance monitoring
- Health checking system
- Rate limiting implementation

### Week 3: Integration & Testing
- Integration with Flight Data Aggregator
- Comprehensive testing
- Performance optimization
- Monitoring and alerting setup

## 8. Success Metrics

### Cost Optimization
- **Cost Reduction**: 30-50% reduction in external API costs
- **Budget Adherence**: 100% compliance with daily/monthly budgets
- **Free Source Utilization**: >60% of requests served by free sources

### Performance
- **Routing Overhead**: <50ms additional latency
- **Success Rate**: >99% request success rate through fallbacks
- **Response Time**: <2 seconds for 95% of routed requests

### Reliability
- **Source Availability**: Handle 2+ source failures gracefully
- **Fallback Success**: >95% success rate for fallback strategies
- **Quality Maintenance**: Maintain >85% data quality score

---

**Dependencies**: PRD-DATA-001 (Flight Data Aggregator), All Integration PRDs  
**Integration**: Optimizes data source usage across the entire platform  
**Status**: Implementation Ready for Phase 3