# PRD-ENGINE-001: Quote Engine

**Status**: Ready for Implementation  
**Priority**: Critical - Core Business Logic  
**Dependencies**: PRD-DATA-001 (Flight Data Aggregator), PRD-CORE-001 (Database)  
**Estimated Timeline**: 2-3 weeks  

## 1. Overview

### 1.1 Purpose
The Quote Engine is the core business logic component that calculates insurance premiums for flight delay coverage. It aggregates risk factors from multiple data sources to generate accurate, competitive quotes.

### 1.2 Architecture
```typescript
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Quote API     │    │   Quote Engine   │    │  Data Sources   │
│                 │────▶│                  │────▶│                 │
│ /api/quotes     │    │ Risk Calculator  │    │ Flight Data     │
│ POST /generate  │    │ Premium Formula  │    │ Weather Data    │
│ GET  /history   │    │ Cache Manager    │    │ Historical Data │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

## 2. Core Components

### 2.1 Quote Engine Implementation

```typescript
export class QuoteEngine {
  private riskCalculator: RiskCalculator;
  private premiumCalculator: PremiumCalculator;
  private cacheManager: QuoteCacheManager;
  private flightAggregator: FlightDataAggregator;

  constructor(config: QuoteEngineConfig) {
    this.riskCalculator = new RiskCalculator(config.riskFactors);
    this.premiumCalculator = new PremiumCalculator(config.premiumRates);
    this.cacheManager = new QuoteCacheManager(config.cache);
    this.flightAggregator = new FlightDataAggregator(config.dataSources);
  }

  async generateQuote(request: QuoteRequest): Promise<Quote> {
    // Check cache first
    const cached = await this.cacheManager.get(request);
    if (cached && this.isCacheValid(cached, request)) {
      return cached;
    }

    // Gather data from multiple sources
    const flightData = await this.gatherFlightData(request);
    const weatherData = await this.gatherWeatherData(request);
    const historicalData = await this.gatherHistoricalData(request);

    // Calculate risk factors
    const riskFactors = await this.riskCalculator.calculateRisk({
      flight: flightData,
      weather: weatherData,
      historical: historicalData,
      route: request.route
    });

    // Generate premium
    const premium = this.premiumCalculator.calculate(
      request.coverageAmount,
      riskFactors,
      request.coverageType
    );

    const quote = {
      id: generateQuoteId(),
      request,
      premium,
      riskFactors,
      validUntil: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      confidence: this.calculateConfidence(riskFactors),
      createdAt: new Date()
    };

    // Cache the quote
    await this.cacheManager.set(request, quote);
    
    return quote;
  }

  private async gatherFlightData(request: QuoteRequest): Promise<FlightRiskData> {
    const flightData = await this.flightAggregator.getFlightData({
      type: 'FLIGHT_BY_NUMBER',
      flightNumber: request.flightNumber,
      date: request.departureDate,
      departureAirport: request.departureAirport,
      arrivalAirport: request.arrivalAirport
    });

    return {
      historicalDelayRate: await this.calculateHistoricalDelayRate(request),
      airlineReliability: await this.getAirlineReliability(request.airline),
      routeComplexity: await this.calculateRouteComplexity(request.route),
      aircraftType: flightData.data[0]?.aircraftType
    };
  }
}
```

### 2.2 Risk Calculator

```typescript
export class RiskCalculator {
  async calculateRisk(data: RiskCalculationData): Promise<RiskFactors> {
    const factors = {
      historical: this.calculateHistoricalRisk(data.historical),
      weather: this.calculateWeatherRisk(data.weather),
      route: this.calculateRouteRisk(data.route),
      airline: this.calculateAirlineRisk(data.flight.airline),
      seasonal: this.calculateSeasonalRisk(data.flight.date),
      timeOfDay: this.calculateTimeRisk(data.flight.departureTime)
    };

    return {
      ...factors,
      composite: this.calculateCompositeRisk(factors)
    };
  }

  private calculateHistoricalRisk(historical: HistoricalData): number {
    const delayRate = historical.delayRate || 0.15; // Default 15%
    const avgDelayMinutes = historical.avgDelayMinutes || 45;
    
    // Higher delay rate and longer delays = higher risk
    return Math.min(delayRate * 2 + (avgDelayMinutes / 120), 2.0);
  }

  private calculateWeatherRisk(weather: WeatherData): number {
    let risk = 1.0;
    
    // Severe weather conditions
    if (weather.conditions?.includes('STORM') || weather.conditions?.includes('FOG')) {
      risk += 0.5;
    }
    
    // High winds
    if (weather.windSpeed > 25) {
      risk += 0.3;
    }
    
    // Low visibility
    if (weather.visibility < 3) {
      risk += 0.4;
    }
    
    return Math.min(risk, 2.0);
  }

  private calculateRouteRisk(route: RouteData): number {
    let risk = 1.0;
    
    // International flights
    if (route.isInternational) {
      risk += 0.2;
    }
    
    // Busy airports
    if (route.departureAirport.delayFactor > 1.2) {
      risk += 0.3;
    }
    
    if (route.arrivalAirport.delayFactor > 1.2) {
      risk += 0.3;
    }
    
    // Long flights (more potential for delays)
    if (route.flightDuration > 6 * 60) { // 6 hours
      risk += 0.1;
    }
    
    return Math.min(risk, 2.0);
  }
}
```

### 2.3 Premium Calculator

```typescript
export class PremiumCalculator {
  private baseRates: Map<CoverageType, number>;
  
  constructor(config: PremiumConfig) {
    this.baseRates = new Map([
      ['ECONOMY', 0.035],      // 3.5%
      ['BUSINESS', 0.045],     // 4.5%
      ['FIRST_CLASS', 0.060]   // 6.0%
    ]);
  }

  calculate(
    coverageAmount: number,
    riskFactors: RiskFactors,
    coverageType: CoverageType
  ): PremiumCalculation {
    const baseRate = this.baseRates.get(coverageType) || 0.035;
    
    // Base premium
    let premium = coverageAmount * baseRate;
    
    // Apply risk multipliers
    premium *= riskFactors.historical;
    premium *= riskFactors.weather;
    premium *= riskFactors.route;
    premium *= riskFactors.airline;
    
    // Seasonal adjustments
    premium *= riskFactors.seasonal;
    
    // Time of day adjustments
    premium *= riskFactors.timeOfDay;
    
    // Apply minimum premium thresholds
    const minimums = {
      'ECONOMY': 15,
      'BUSINESS': 25,
      'FIRST_CLASS': 40
    };
    
    premium = Math.max(premium, minimums[coverageType]);
    
    // Round to nearest cent
    premium = Math.round(premium * 100) / 100;
    
    return {
      amount: premium,
      baseAmount: coverageAmount * baseRate,
      riskMultiplier: premium / (coverageAmount * baseRate),
      breakdown: {
        baseRate,
        historicalMultiplier: riskFactors.historical,
        weatherMultiplier: riskFactors.weather,
        routeMultiplier: riskFactors.route,
        airlineMultiplier: riskFactors.airline
      }
    };
  }
}
```

## 3. Data Types

```typescript
interface QuoteRequest {
  flightNumber: string;
  airline: string;
  departureDate: Date;
  departureAirport: string;
  arrivalAirport: string;
  coverageAmount: number;
  coverageType: 'ECONOMY' | 'BUSINESS' | 'FIRST_CLASS';
  delayThreshold: number; // Minutes
}

interface Quote {
  id: string;
  request: QuoteRequest;
  premium: PremiumCalculation;
  riskFactors: RiskFactors;
  validUntil: Date;
  confidence: number;
  createdAt: Date;
}

interface RiskFactors {
  historical: number;
  weather: number;
  route: number;
  airline: number;
  seasonal: number;
  timeOfDay: number;
  composite: number;
}

interface PremiumCalculation {
  amount: number;
  baseAmount: number;
  riskMultiplier: number;
  breakdown: {
    baseRate: number;
    historicalMultiplier: number;
    weatherMultiplier: number;
    routeMultiplier: number;
    airlineMultiplier: number;
  };
}
```

## 4. API Endpoints

### 4.1 Generate Quote
```
POST /api/quotes/generate
```

**Request:**
```json
{
  "flightNumber": "BT318",
  "airline": "Air Baltic",
  "departureDate": "2025-06-15T10:30:00Z",
  "departureAirport": "RIX",
  "arrivalAirport": "LHR",
  "coverageAmount": 500,
  "coverageType": "ECONOMY",
  "delayThreshold": 60
}
```

**Response:**
```json
{
  "quote": {
    "id": "quote_1234567890",
    "premium": {
      "amount": 42.50,
      "baseAmount": 17.50,
      "riskMultiplier": 2.43,
      "breakdown": {
        "baseRate": 0.035,
        "historicalMultiplier": 1.2,
        "weatherMultiplier": 1.1,
        "routeMultiplier": 1.3,
        "airlineMultiplier": 1.4
      }
    },
    "validUntil": "2025-06-14T10:30:00Z",
    "confidence": 0.87
  }
}
```

### 4.2 Get Quote History
```
GET /api/quotes/history?userId={userId}&limit=10
```

### 4.3 Get Quote Details
```
GET /api/quotes/{quoteId}
```

## 5. Caching Strategy

```typescript
export class QuoteCacheManager {
  async get(request: QuoteRequest): Promise<Quote | null> {
    const key = this.generateCacheKey(request);
    
    // Check memory cache first (5 minute TTL)
    const memoryCache = await this.memory.get(key);
    if (memoryCache) return memoryCache;
    
    // Check Redis cache (30 minute TTL)
    const redisCache = await this.redis.get(key);
    if (redisCache) {
      await this.memory.set(key, redisCache, 300);
      return redisCache;
    }
    
    return null;
  }

  private generateCacheKey(request: QuoteRequest): string {
    return `quote:${request.flightNumber}:${request.departureDate}:${request.coverageAmount}:${request.coverageType}`;
  }
}
```

## 6. Error Handling

```typescript
export class QuoteEngineError extends Error {
  constructor(
    public code: string,
    message: string,
    public details?: any
  ) {
    super(message);
    this.name = 'QuoteEngineError';
  }
}

export const QUOTE_ERROR_CODES = {
  FLIGHT_NOT_FOUND: 'FLIGHT_NOT_FOUND',
  INSUFFICIENT_DATA: 'INSUFFICIENT_DATA',
  RISK_TOO_HIGH: 'RISK_TOO_HIGH',
  INVALID_COVERAGE: 'INVALID_COVERAGE',
  CALCULATION_ERROR: 'CALCULATION_ERROR'
} as const;
```

## 7. Monitoring & Metrics

```typescript
export const quoteEngineMetrics = {
  quotesGenerated: new Counter({
    name: 'quote_engine_quotes_generated_total',
    help: 'Total quotes generated',
    labelNames: ['coverage_type', 'airline']
  }),
  
  quoteGenerationTime: new Histogram({
    name: 'quote_engine_generation_duration_seconds',
    help: 'Quote generation duration',
    buckets: [0.1, 0.5, 1, 2, 5]
  }),
  
  riskScore: new Histogram({
    name: 'quote_engine_risk_score',
    help: 'Risk score distribution',
    buckets: [0.5, 1.0, 1.5, 2.0, 2.5, 3.0]
  }),
  
  premiumAmount: new Histogram({
    name: 'quote_engine_premium_amount',
    help: 'Premium amount distribution',
    buckets: [10, 25, 50, 100, 200, 500]
  })
};
```

## 8. Implementation Timeline

### Week 1: Core Engine
- Risk calculator implementation
- Premium calculation formula
- Basic quote generation flow
- Unit tests

### Week 2: Data Integration
- Flight data aggregator integration
- Weather data integration
- Historical data analysis
- Caching implementation

### Week 3: API & Polish
- REST API endpoints
- Error handling
- Monitoring and metrics
- Performance optimization
- Integration testing

## 9. Success Metrics

### Performance
- Quote generation: < 2 seconds
- Cache hit rate: > 70%
- API availability: > 99.5%

### Business
- Quote accuracy: > 95%
- Conversion rate: > 15%
- Average premium: $25-75

---

**Next**: PRD-ENGINE-002 (Policy Engine)  
**Integration**: Consumes PRD-DATA-001, feeds into PRD-ENGINE-002