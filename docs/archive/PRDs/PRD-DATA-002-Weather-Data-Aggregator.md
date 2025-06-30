# PRD-DATA-002: Weather Data Aggregator

**Status**: Ready for Implementation  
**Priority**: Medium - Enhances Risk Assessment  
**Dependencies**: PRD-CORE-001 (Database), PRD-INTEGRATION-004 (Weather APIs), PRD-DATA-003 (Data Router)  
**Estimated Timeline**: 2-3 weeks  

## 1. Overview

### 1.1 Purpose
The Weather Data Aggregator provides unified access to multiple weather data sources for flight delay risk assessment. It aggregates weather conditions, forecasts, and historical data to enhance insurance quote accuracy and payout trigger evaluation.

### 1.2 Strategic Goals
- **Risk Enhancement**: Improve quote accuracy with weather factors
- **Multi-Source Resilience**: Aggregate multiple weather providers for reliability
- **Cost Optimization**: Intelligent routing between free and premium weather sources
- **Real-Time Assessment**: Current conditions for active policy monitoring
- **Historical Analysis**: Weather pattern analysis for risk modeling

### 1.3 Architecture
```typescript
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│ Weather Request │    │ Weather Aggregator│    │ Weather Sources │
│                 │────▶│                  │────▶│                 │
│ Location-based  │    │ Source Router    │    │ Google Weather  │
│ Time-based      │    │ Data Merger      │    │ OpenWeather     │
│ Risk Assessment │    │ Cache Manager    │    │ WeatherAPI      │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                │
                                ▼
                       ┌──────────────────┐
                       │ Weather Database │
                       │                  │
                       │ Historical Data  │
                       │ Cached Forecasts │
                       │ Risk Calculations│
                       └──────────────────┘
```

## 2. Core Components

### 2.1 Weather Aggregator Implementation

```typescript
export class WeatherDataAggregator {
  private sourceManager: WeatherSourceManager;
  private dataProcessor: WeatherDataProcessor;
  private riskCalculator: WeatherRiskCalculator;
  private cacheManager: WeatherCacheManager;

  constructor(config: WeatherAggregatorConfig) {
    this.sourceManager = new WeatherSourceManager(config.sources);
    this.dataProcessor = new WeatherDataProcessor(config.processing);
    this.riskCalculator = new WeatherRiskCalculator(config.risk);
    this.cacheManager = new WeatherCacheManager(config.cache);
  }

  async getWeatherData(request: WeatherDataRequest): Promise<AggregatedWeatherResponse> {
    const startTime = Date.now();
    
    try {
      // Check cache first
      const cached = await this.cacheManager.get(request);
      if (cached && this.isCacheValid(cached, request)) {
        weatherAggregatorMetrics.cacheHits.inc({ type: 'weather' });
        return cached;
      }

      // Get available sources for this request
      const availableSources = await this.sourceManager.getAvailableSources(request);
      
      if (availableSources.length === 0) {
        throw new WeatherAggregatorError('NO_SOURCES_AVAILABLE', 'No weather sources available');
      }

      // Execute weather data strategy
      const strategy = this.determineStrategy(request, availableSources);
      const weatherData = await this.executeStrategy(strategy, request);

      // Process and enhance data
      const processedData = await this.dataProcessor.processWeatherData(weatherData);

      // Calculate weather risk factors
      const riskFactors = await this.riskCalculator.calculateWeatherRisk(processedData, request);

      const response: AggregatedWeatherResponse = {
        data: processedData,
        riskFactors,
        metadata: {
          sources: weatherData.map(d => d.source),
          confidence: this.calculateConfidence(weatherData),
          responseTime: Date.now() - startTime,
          cacheStatus: 'MISS'
        }
      };

      // Cache the response
      await this.cacheManager.set(request, response);

      weatherAggregatorMetrics.requestsTotal.inc({ 
        type: request.type,
        status: 'success' 
      });

      return response;

    } catch (error) {
      weatherAggregatorMetrics.requestsTotal.inc({ 
        type: request.type,
        status: 'error' 
      });
      throw error;
    }
  }

  async getWeatherRiskForFlight(
    departureAirport: string,
    arrivalAirport: string,
    flightDate: Date
  ): Promise<WeatherRiskAssessment> {
    try {
      // Get weather for both airports
      const [departureWeather, arrivalWeather] = await Promise.all([
        this.getWeatherData({
          type: 'CURRENT_AND_FORECAST',
          location: { iata: departureAirport },
          date: flightDate,
          includeRisk: true
        }),
        this.getWeatherData({
          type: 'CURRENT_AND_FORECAST',
          location: { iata: arrivalAirport },
          date: flightDate,
          includeRisk: true
        })
      ]);

      // Calculate combined risk assessment
      const riskAssessment = await this.riskCalculator.calculateFlightWeatherRisk({
        departure: departureWeather,
        arrival: arrivalWeather,
        flightDate
      });

      return riskAssessment;

    } catch (error) {
      weatherAggregatorMetrics.riskCalculationErrors.inc({ 
        error: error.constructor.name 
      });
      throw new WeatherAggregatorError('RISK_CALCULATION_FAILED', error.message);
    }
  }

  private determineStrategy(
    request: WeatherDataRequest,
    sources: WeatherDataSource[]
  ): WeatherStrategy {
    // For current weather, use fastest/most reliable source
    if (request.type === 'CURRENT') {
      return {
        type: 'SINGLE_SOURCE',
        source: sources[0], // Highest priority source
        timeout: 5000
      };
    }

    // For forecasts, use multiple sources if available
    if (request.type === 'FORECAST' && sources.length > 1) {
      return {
        type: 'PARALLEL_VALIDATION',
        sources: sources.slice(0, 2), // Use top 2 sources
        timeout: 10000
      };
    }

    // Default to single source
    return {
      type: 'SINGLE_SOURCE',
      source: sources[0],
      timeout: 8000
    };
  }
}
```

### 2.2 Weather Source Manager

```typescript
export class WeatherSourceManager {
  private sources: Map<string, WeatherDataSource> = new Map();
  private healthChecker: SourceHealthChecker;

  constructor(configs: WeatherSourceConfig[]) {
    this.initializeSources(configs);
    this.healthChecker = new SourceHealthChecker();
  }

  async getAvailableSources(request: WeatherDataRequest): Promise<WeatherDataSource[]> {
    const allSources = Array.from(this.sources.values());
    const availableSources: WeatherDataSource[] = [];

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
      if (!(await source.canMakeRequest())) {
        continue;
      }

      availableSources.push(source);
    }

    return this.prioritizeSources(availableSources, request);
  }

  private sourceSupportsRequest(source: WeatherDataSource, request: WeatherDataRequest): boolean {
    const capabilities = source.getCapabilities();

    switch (request.type) {
      case 'CURRENT':
        return capabilities.supportsCurrent;
      case 'FORECAST':
        return capabilities.supportsForecast;
      case 'HISTORICAL':
        return capabilities.supportsHistorical;
      case 'CURRENT_AND_FORECAST':
        return capabilities.supportsCurrent && capabilities.supportsForecast;
      default:
        return false;
    }
  }

  private prioritizeSources(sources: WeatherDataSource[], request: WeatherDataRequest): WeatherDataSource[] {
    return sources.sort((a, b) => {
      // Priority factors: accuracy, cost, speed
      const aScore = this.calculateSourceScore(a, request);
      const bScore = this.calculateSourceScore(b, request);
      return bScore - aScore; // Higher score first
    });
  }
}
```

### 2.3 Weather Data Processor

```typescript
export class WeatherDataProcessor {
  async processWeatherData(rawData: WeatherSourceResponse[]): Promise<ProcessedWeatherData> {
    if (rawData.length === 0) {
      throw new WeatherAggregatorError('NO_DATA_TO_PROCESS', 'No weather data to process');
    }

    if (rawData.length === 1) {
      return this.processSignleSource(rawData[0]);
    }

    // Merge multiple sources
    return this.mergeWeatherSources(rawData);
  }

  private async processSignleSource(sourceData: WeatherSourceResponse): Promise<ProcessedWeatherData> {
    const data = sourceData.data;
    
    return {
      location: this.normalizeLocation(data.location),
      current: data.current ? this.normalizeCurrentWeather(data.current) : undefined,
      forecast: data.forecast ? this.normalizeForecast(data.forecast) : undefined,
      historical: data.historical ? this.normalizeHistorical(data.historical) : undefined,
      source: sourceData.source,
      timestamp: new Date(),
      confidence: sourceData.confidence
    };
  }

  private normalizeCurrentWeather(current: any): CurrentWeather {
    return {
      temperature: {
        celsius: this.convertToCelsius(current.temperature, current.temperatureUnit),
        fahrenheit: this.convertToFahrenheit(current.temperature, current.temperatureUnit)
      },
      condition: this.normalizeCondition(current.condition),
      humidity: current.humidity,
      pressure: current.pressure,
      visibility: this.normalizeVisibility(current.visibility),
      wind: {
        speed: this.normalizeWindSpeed(current.wind?.speed),
        direction: current.wind?.direction,
        gusts: this.normalizeWindSpeed(current.wind?.gusts)
      },
      precipitation: {
        probability: current.precipitation?.probability || 0,
        amount: current.precipitation?.amount || 0
      },
      uvIndex: current.uvIndex,
      dewPoint: current.dewPoint,
      feelsLike: {
        celsius: this.convertToCelsius(current.feelsLike, current.temperatureUnit),
        fahrenheit: this.convertToFahrenheit(current.feelsLike, current.temperatureUnit)
      }
    };
  }

  private normalizeCondition(condition: any): WeatherCondition {
    const conditionText = condition.description?.text || condition.text || '';
    const conditionType = this.mapConditionType(conditionText, condition.type);

    return {
      type: conditionType,
      description: conditionText,
      severity: this.calculateConditionSeverity(conditionType, condition),
      icon: condition.icon
    };
  }

  private mapConditionType(description: string, sourceType?: string): WeatherConditionType {
    const desc = description.toLowerCase();
    
    if (desc.includes('storm') || desc.includes('thunder')) return 'THUNDERSTORM';
    if (desc.includes('snow') || desc.includes('blizzard')) return 'SNOW';
    if (desc.includes('rain') || desc.includes('shower')) return 'RAIN';
    if (desc.includes('fog') || desc.includes('mist')) return 'FOG';
    if (desc.includes('cloud')) return 'CLOUDY';
    if (desc.includes('clear') || desc.includes('sunny')) return 'CLEAR';
    if (desc.includes('wind')) return 'WINDY';
    
    return 'UNKNOWN';
  }
}
```

### 2.4 Weather Risk Calculator

```typescript
export class WeatherRiskCalculator {
  async calculateWeatherRisk(
    weatherData: ProcessedWeatherData,
    request: WeatherDataRequest
  ): Promise<WeatherRiskFactors> {
    const riskFactors: WeatherRiskFactors = {
      overall: 1.0,
      temperature: 1.0,
      precipitation: 1.0,
      wind: 1.0,
      visibility: 1.0,
      severe: 1.0
    };

    if (weatherData.current) {
      riskFactors.temperature = this.calculateTemperatureRisk(weatherData.current);
      riskFactors.precipitation = this.calculatePrecipitationRisk(weatherData.current);
      riskFactors.wind = this.calculateWindRisk(weatherData.current);
      riskFactors.visibility = this.calculateVisibilityRisk(weatherData.current);
      riskFactors.severe = this.calculateSevereWeatherRisk(weatherData.current);
    }

    // Calculate overall risk (weighted average)
    riskFactors.overall = this.calculateOverallRisk(riskFactors);

    return riskFactors;
  }

  private calculateTemperatureRisk(current: CurrentWeather): number {
    const tempC = current.temperature.celsius;
    
    // Extreme temperatures increase delay risk
    if (tempC < -20 || tempC > 40) return 1.5; // 50% increase
    if (tempC < -10 || tempC > 35) return 1.3; // 30% increase
    if (tempC < 0 || tempC > 30) return 1.1;   // 10% increase
    
    return 1.0; // No impact
  }

  private calculatePrecipitationRisk(current: CurrentWeather): number {
    const precipProb = current.precipitation.probability;
    const precipAmount = current.precipitation.amount;
    
    let risk = 1.0;
    
    // Rain probability impact
    if (precipProb > 80) risk += 0.4;
    else if (precipProb > 60) risk += 0.3;
    else if (precipProb > 40) risk += 0.2;
    else if (precipProb > 20) risk += 0.1;
    
    // Rain amount impact
    if (precipAmount > 25) risk += 0.3; // Heavy rain
    else if (precipAmount > 10) risk += 0.2; // Moderate rain
    else if (precipAmount > 2.5) risk += 0.1; // Light rain
    
    return Math.min(risk, 2.0); // Cap at 100% increase
  }

  private calculateWindRisk(current: CurrentWeather): number {
    const windSpeed = current.wind.speed || 0;
    const gusts = current.wind.gusts || 0;
    
    // Wind speed in km/h
    if (windSpeed > 60 || gusts > 80) return 1.8; // Very high wind
    if (windSpeed > 40 || gusts > 60) return 1.5; // High wind
    if (windSpeed > 25 || gusts > 40) return 1.3; // Moderate wind
    if (windSpeed > 15 || gusts > 25) return 1.1; // Light wind impact
    
    return 1.0; // No impact
  }

  private calculateVisibilityRisk(current: CurrentWeather): number {
    const visibility = current.visibility || 10; // km
    
    if (visibility < 1) return 1.6;   // Very poor visibility
    if (visibility < 3) return 1.4;   // Poor visibility
    if (visibility < 5) return 1.2;   // Reduced visibility
    if (visibility < 8) return 1.1;   // Slightly reduced
    
    return 1.0; // Good visibility
  }

  private calculateSevereWeatherRisk(current: CurrentWeather): number {
    const condition = current.condition;
    
    switch (condition.type) {
      case 'THUNDERSTORM':
        return condition.severity === 'SEVERE' ? 2.0 : 1.7;
      case 'SNOW':
        return condition.severity === 'SEVERE' ? 1.8 : 1.4;
      case 'FOG':
        return condition.severity === 'SEVERE' ? 1.6 : 1.3;
      case 'RAIN':
        return condition.severity === 'SEVERE' ? 1.5 : 1.2;
      default:
        return 1.0;
    }
  }

  async calculateFlightWeatherRisk(flightWeather: FlightWeatherData): Promise<WeatherRiskAssessment> {
    const departureRisk = await this.calculateWeatherRisk(flightWeather.departure.data, {
      type: 'CURRENT_AND_FORECAST',
      location: { iata: 'DEP' },
      date: flightWeather.flightDate
    });

    const arrivalRisk = await this.calculateWeatherRisk(flightWeather.arrival.data, {
      type: 'CURRENT_AND_FORECAST', 
      location: { iata: 'ARR' },
      date: flightWeather.flightDate
    });

    // Combined risk is the higher of the two, with some weighting
    const combinedRisk = Math.max(
      departureRisk.overall * 0.7, // Departure has slightly less impact
      arrivalRisk.overall * 1.0     // Arrival weather more critical
    );

    return {
      departureRisk,
      arrivalRisk,
      combinedRisk,
      riskLevel: this.categorizeRisk(combinedRisk),
      recommendations: this.generateRecommendations(departureRisk, arrivalRisk)
    };
  }
}
```

## 3. Data Types

```typescript
interface WeatherDataRequest {
  type: WeatherRequestType;
  location: WeatherLocation;
  date?: Date;
  includeRisk?: boolean;
  maxAge?: number; // Minutes
}

type WeatherRequestType = 
  | 'CURRENT'
  | 'FORECAST'
  | 'HISTORICAL'
  | 'CURRENT_AND_FORECAST';

interface WeatherLocation {
  iata?: string;        // Airport code
  latitude?: number;
  longitude?: number;
  city?: string;
  country?: string;
}

interface ProcessedWeatherData {
  location: NormalizedLocation;
  current?: CurrentWeather;
  forecast?: WeatherForecast[];
  historical?: HistoricalWeather[];
  source: string;
  timestamp: Date;
  confidence: number;
}

interface CurrentWeather {
  temperature: Temperature;
  condition: WeatherCondition;
  humidity: number;        // Percentage
  pressure: number;        // hPa
  visibility: number;      // km
  wind: WindData;
  precipitation: PrecipitationData;
  uvIndex?: number;
  dewPoint?: number;
  feelsLike: Temperature;
}

interface WeatherCondition {
  type: WeatherConditionType;
  description: string;
  severity: 'LIGHT' | 'MODERATE' | 'SEVERE';
  icon?: string;
}

type WeatherConditionType = 
  | 'CLEAR'
  | 'CLOUDY'
  | 'RAIN'
  | 'SNOW'
  | 'THUNDERSTORM'
  | 'FOG'
  | 'WINDY'
  | 'UNKNOWN';

interface WeatherRiskFactors {
  overall: number;
  temperature: number;
  precipitation: number;
  wind: number;
  visibility: number;
  severe: number;
}

interface WeatherRiskAssessment {
  departureRisk: WeatherRiskFactors;
  arrivalRisk: WeatherRiskFactors;
  combinedRisk: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'EXTREME';
  recommendations: string[];
}
```

## 4. API Endpoints

### 4.1 Current Weather
```
GET /api/weather/current?iata=JFK
```

**Response:**
```json
{
  "data": {
    "location": {
      "iata": "JFK",
      "name": "John F. Kennedy International Airport",
      "city": "New York",
      "country": "US"
    },
    "current": {
      "temperature": {
        "celsius": 22,
        "fahrenheit": 72
      },
      "condition": {
        "type": "CLOUDY",
        "description": "Partly cloudy",
        "severity": "LIGHT"
      },
      "wind": {
        "speed": 15,
        "direction": "NW",
        "gusts": 20
      },
      "visibility": 10,
      "precipitation": {
        "probability": 20,
        "amount": 0
      }
    }
  },
  "riskFactors": {
    "overall": 1.1,
    "wind": 1.1,
    "temperature": 1.0,
    "precipitation": 1.0,
    "visibility": 1.0,
    "severe": 1.0
  }
}
```

### 4.2 Flight Weather Risk
```
POST /api/weather/flight-risk
```

**Request:**
```json
{
  "departureAirport": "JFK",
  "arrivalAirport": "LHR", 
  "flightDate": "2025-06-15T10:30:00Z"
}
```

### 4.3 Weather Forecast
```
GET /api/weather/forecast?iata=LHR&days=3
```

## 5. Integration with Google Weather API

Based on working test implementation from `testWeather.js`:

```typescript
export class GoogleWeatherSource implements WeatherDataSource {
  private apiKey: string;
  private baseUrl = 'https://weather.googleapis.com/v1';

  async getCurrentWeather(location: WeatherLocation): Promise<WeatherSourceResponse> {
    const { latitude, longitude } = await this.resolveLocation(location);
    
    const url = `${this.baseUrl}/forecast/days:lookup?key=${this.apiKey}&location.latitude=${latitude}&location.longitude=${longitude}`;
    
    const response = await axios.get(url, { timeout: 10000 });
    
    if (response.status !== 200) {
      throw new WeatherSourceError('API_REQUEST_FAILED', `Status ${response.status}`);
    }

    const data = response.data;
    
    // Process Google Weather API response structure
    const todayForecast = data.forecastDays[0];
    
    return {
      source: 'GOOGLE_WEATHER',
      data: this.transformGoogleResponse(todayForecast),
      confidence: 0.9,
      timestamp: new Date()
    };
  }

  private transformGoogleResponse(forecast: any): any {
    return {
      location: {
        latitude: forecast.location?.latitude,
        longitude: forecast.location?.longitude
      },
      current: {
        temperature: forecast.maxTemperature?.degrees,
        temperatureUnit: forecast.maxTemperature?.unit,
        condition: {
          description: forecast.daytimeForecast?.weatherCondition?.description,
          type: forecast.daytimeForecast?.weatherCondition?.type
        },
        humidity: forecast.daytimeForecast?.relativeHumidity,
        wind: {
          speed: forecast.daytimeForecast?.wind?.speed?.value,
          direction: forecast.daytimeForecast?.wind?.direction?.cardinal
        },
        precipitation: {
          probability: forecast.daytimeForecast?.precipitation?.probability?.percent
        }
      }
    };
  }
}
```

## 6. Caching Strategy

```typescript
export class WeatherCacheManager {
  private memoryCache: Map<string, CachedWeatherData> = new Map();
  private redisCache: RedisClient;
  private databaseCache: DatabaseClient;

  async get(request: WeatherDataRequest): Promise<AggregatedWeatherResponse | null> {
    const cacheKey = this.generateCacheKey(request);
    
    // Check memory cache first (5 minute TTL)
    const memoryData = this.memoryCache.get(cacheKey);
    if (memoryData && this.isCacheValid(memoryData, 300)) {
      return memoryData.data;
    }
    
    // Check Redis cache (30 minute TTL)
    const redisData = await this.redisCache.get(cacheKey);
    if (redisData && this.isCacheValid(redisData, 1800)) {
      // Populate memory cache
      this.memoryCache.set(cacheKey, redisData);
      return redisData.data;
    }
    
    return null;
  }

  private generateCacheKey(request: WeatherDataRequest): string {
    const location = request.location.iata || 
                    `${request.location.latitude},${request.location.longitude}`;
    const dateKey = request.date ? request.date.toISOString().split('T')[0] : 'current';
    
    return `weather:${request.type}:${location}:${dateKey}`;
  }
}
```

## 7. Error Handling

```typescript
export class WeatherAggregatorError extends Error {
  constructor(
    public code: string,
    message: string,
    public details?: any
  ) {
    super(message);
    this.name = 'WeatherAggregatorError';
  }
}

export const WEATHER_ERROR_CODES = {
  NO_SOURCES_AVAILABLE: 'NO_SOURCES_AVAILABLE',
  LOCATION_NOT_FOUND: 'LOCATION_NOT_FOUND',
  API_RATE_LIMIT: 'API_RATE_LIMIT',
  INVALID_LOCATION: 'INVALID_LOCATION',
  DATA_PROCESSING_ERROR: 'DATA_PROCESSING_ERROR',
  RISK_CALCULATION_FAILED: 'RISK_CALCULATION_FAILED'
} as const;
```

## 8. Monitoring & Metrics

```typescript
export const weatherAggregatorMetrics = {
  requestsTotal: new Counter({
    name: 'weather_aggregator_requests_total',
    help: 'Total weather requests',
    labelNames: ['type', 'status']
  }),
  
  cacheHits: new Counter({
    name: 'weather_aggregator_cache_hits_total',
    help: 'Weather cache hits',
    labelNames: ['type', 'layer']
  }),
  
  riskCalculations: new Counter({
    name: 'weather_aggregator_risk_calculations_total',
    help: 'Weather risk calculations',
    labelNames: ['risk_level']
  }),
  
  responseTime: new Histogram({
    name: 'weather_aggregator_response_time_seconds',
    help: 'Weather API response time',
    buckets: [0.1, 0.5, 1, 2, 5, 10]
  })
};
```

## 9. Implementation Timeline

### Week 1: Core Weather Service
- Weather aggregator framework
- Google Weather API integration
- Basic data processing and normalization
- Caching implementation

### Week 2: Risk Calculation
- Weather risk calculation engine
- Flight weather risk assessment
- Integration with quote engine
- Multi-source data merging

### Week 3: Enhancement & Testing
- Additional weather sources (OpenWeather, WeatherAPI)
- Performance optimization
- Comprehensive testing
- API endpoints and documentation

## 10. Success Metrics

### Performance
- Weather data retrieval: < 3 seconds
- Risk calculation: < 1 second  
- Cache hit rate: > 80%
- API availability: > 99.5%

### Accuracy
- Weather risk correlation: > 85% accuracy
- Quote improvement: 10-15% better risk assessment
- Payout precision: Reduced false positives by 5%

---

**Dependencies**: PRD-CORE-001 (Database), PRD-INTEGRATION-004 (Weather APIs)  
**Integration**: Enhances quote engine risk calculations  
**Status**: Implementation Ready for Phase 4