# PRD-INTEGRATION-004: Weather API Integration

**Version**: 1.0  
**Status**: Draft  
**Author**: Development Team  
**Created**: 2025-01-27  
**Dependencies**: PRD-CORE-001 (Database Schema), PRD-CORE-003 (Shared Types)  
**Priority**: Medium (Risk Assessment Enhancement)

## 1. Overview

This PRD defines the Weather API integration module that provides comprehensive weather data for enhanced flight delay risk assessment in the triggerr insurance platform. Weather data significantly impacts flight operations and delay probability, making it a crucial component for accurate risk calculation and premium pricing.

### 1.1 Strategic Goals
- **Risk Enhancement**: Improve flight delay prediction accuracy through weather correlation
- **Real-time Intelligence**: Access current and forecast weather conditions for departure/arrival airports
- **Historical Analysis**: Leverage weather patterns for long-term risk assessment
- **Multi-Source Reliability**: Integrate multiple weather providers for data redundancy
- **Cost Optimization**: Intelligent API usage to minimize weather data costs
- **Location Intelligence**: Airport-specific weather monitoring and alerts

### 1.2 Reference Implementation
This PRD is based on the working test file: `/working_tests/testWeather.js`

### 1.3 Technology Stack
- **Package Location**: `packages/integrations/weather-apis`
- **Primary Provider**: Google Weather API
- **Secondary Provider**: OpenWeatherMap API
- **HTTP Client**: Axios with retry logic and caching
- **Validation**: Zod schemas for weather data
- **Caching**: Database-backed weather caching with TTL
- **Monitoring**: Weather impact tracking and analytics

## 2. API Specification

### 2.1 Google Weather API Details
- **Base URL**: `https://weather.googleapis.com/v1`
- **Authentication**: API key via `key` parameter
- **Rate Limits**: Based on Google Cloud Platform quotas
- **Data Quality**: High accuracy global weather data
- **Update Frequency**: Real-time data with forecasts up to 10 days

### 2.2 Core Endpoints

#### Weather Forecast Endpoint
```typescript
interface WeatherForecastParams {
  key: string;           // API key
  'location.latitude': number;
  'location.longitude': number;
  plannedDepartureTime?: string;  // ISO datetime for specific timing
  units?: 'metric' | 'imperial';
}

interface WeatherForecastResponse {
  forecastDays: ForecastDay[];
  regionCode: string;
  location: {
    latitude: number;
    longitude: number;
  };
}

interface ForecastDay {
  displayDate: {
    year: number;
    month: number;
    day: number;
  };
  maxTemperature: Temperature;
  minTemperature: Temperature;
  feelsLikeMaxTemperature?: Temperature;
  feelsLikeMinTemperature?: Temperature;
  daytimeForecast: PeriodForecast;
  nighttimeForecast: PeriodForecast;
  sunEvents: {
    sunriseTime: string;    // ISO datetime
    sunsetTime: string;     // ISO datetime
  };
  moonEvents: {
    moonPhase: string;      // e.g., "FULL_MOON", "NEW_MOON"
  };
}

interface PeriodForecast {
  weatherCondition: {
    type: string;           // e.g., "CLEAR", "RAIN", "SNOW"
    description: {
      text: string;         // Human-readable description
    };
  };
  precipitation?: {
    probability: {
      percent: number;      // 0-100
    };
    amount?: {
      value: number;
      unit: string;
    };
  };
  wind?: {
    speed: {
      value: number;
      unit: string;         // "KILOMETERS_PER_HOUR" or "MILES_PER_HOUR"
    };
    direction: {
      cardinal: string;     // "N", "NE", "E", etc.
      degrees: number;      // 0-360
    };
  };
  relativeHumidity?: number;  // 0-100
  visibility?: {
    value: number;
    unit: string;
  };
}

interface Temperature {
  degrees: number;
  unit: 'CELSIUS' | 'FAHRENHEIT';
}
```

## 3. Integration Architecture

### 3.1 Service Structure
```
packages/integrations/weather-apis/
├── src/
│   ├── providers/
│   │   ├── google-weather.ts      # Google Weather API client
│   │   ├── openweather.ts         # OpenWeatherMap client
│   │   └── index.ts               # Provider exports
│   ├── client.ts                  # Unified weather client
│   ├── types.ts                   # TypeScript interfaces
│   ├── validators.ts              # Zod validation schemas
│   ├── transformers.ts            # Data transformation logic
│   ├── cache.ts                   # Weather data caching
│   ├── risk-calculator.ts         # Weather risk assessment
│   ├── errors.ts                  # Error handling
│   └── index.ts                   # Public exports
├── tests/
│   ├── google-weather.test.ts
│   ├── integration.test.ts
│   └── __fixtures__/
│       └── weather-responses.json
├── package.json
└── README.md
```

### 3.2 Core Client Implementation

```typescript
// Based on working test patterns from testWeather.js
export class GoogleWeatherClient {
  private readonly baseUrl = 'https://weather.googleapis.com/v1';
  private readonly apiKey: string;
  private readonly httpClient: AxiosInstance;

  constructor(apiKey: string, options?: ClientOptions) {
    this.apiKey = apiKey;
    this.httpClient = axios.create({
      baseURL: this.baseUrl,
      timeout: options?.timeout || 10000,
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'triggerr-weather-client/1.0'
      }
    });

    this.setupInterceptors();
  }

  async getForecast(
    latitude: number, 
    longitude: number, 
    options?: ForecastOptions
  ): Promise<WeatherForecastResponse> {
    const params = {
      key: this.apiKey,
      'location.latitude': latitude,
      'location.longitude': longitude,
      ...options
    };

    try {
      const response = await this.httpClient.get<WeatherForecastResponse>(
        '/forecast/days:lookup',
        { params }
      );

      if (response.status !== 200) {
        throw new WeatherError(
          'API_ERROR',
          `Unexpected status: ${response.status}`,
          response.status
        );
      }

      // Validate response structure
      this.validateForecastResponse(response.data);
      
      await this.trackAPIUsage('forecast', params, response);
      return response.data;

    } catch (error) {
      throw this.handleAPIError(error, 'getForecast');
    }
  }

  async getAirportWeather(airportCode: string): Promise<AirportWeatherData> {
    // Get airport coordinates from our database or external service
    const coordinates = await this.getAirportCoordinates(airportCode);
    
    if (!coordinates) {
      throw new WeatherError(
        'AIRPORT_NOT_FOUND',
        `Airport coordinates not found for ${airportCode}`
      );
    }

    const forecast = await this.getForecast(
      coordinates.latitude,
      coordinates.longitude
    );

    return this.transformToAirportWeather(forecast, airportCode);
  }

  async getFlightRouteWeather(
    departureAirport: string,
    arrivalAirport: string,
    flightTime?: Date
  ): Promise<RouteWeatherData> {
    const [departureWeather, arrivalWeather] = await Promise.all([
      this.getAirportWeather(departureAirport),
      this.getAirportWeather(arrivalAirport)
    ]);

    return {
      departure: departureWeather,
      arrival: arrivalWeather,
      flightTime: flightTime || new Date(),
      riskScore: this.calculateWeatherRisk(departureWeather, arrivalWeather)
    };
  }

  // Connection test based on working test patterns
  async testConnection(): Promise<ConnectionTestResult> {
    try {
      // Test with Tallinn coordinates from the test file
      const result = await this.getForecast(59.4370, 24.7535);
      
      return {
        success: true,
        message: 'Google Weather API connection successful',
        dataAvailable: result.forecastDays.length > 0,
        location: 'Tallinn, Estonia',
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

  private validateForecastResponse(data: WeatherForecastResponse): void {
    // Based on validation logic from test file
    if (!data.forecastDays || !Array.isArray(data.forecastDays) || data.forecastDays.length === 0) {
      throw new WeatherError(
        'INVALID_RESPONSE',
        'forecastDays is missing or empty'
      );
    }

    const todayForecast = data.forecastDays[0];
    const hasDate = todayForecast.displayDate;
    const hasTemperature = todayForecast.maxTemperature || todayForecast.minTemperature;
    const hasDaytimeCondition = todayForecast.daytimeForecast?.weatherCondition;
    const hasNighttimeCondition = todayForecast.nighttimeForecast?.weatherCondition;

    if (!hasDate || !hasTemperature || (!hasDaytimeCondition && !hasNighttimeCondition)) {
      throw new WeatherError(
        'INCOMPLETE_DATA',
        'Missing required weather data fields'
      );
    }
  }

  private async getAirportCoordinates(airportCode: string): Promise<Coordinates | null> {
    // This would integrate with our airport database or external service
    const airportCoordinates = {
      'TLL': { latitude: 59.4370, longitude: 24.7535 }, // Tallinn (from test)
      'LHR': { latitude: 51.4700, longitude: -0.4543 }, // London Heathrow
      'JFK': { latitude: 40.6413, longitude: -73.7781 }, // JFK
      'LAX': { latitude: 33.9425, longitude: -118.4081 }, // LAX
      // Add more airports as needed
    };

    return airportCoordinates[airportCode] || null;
  }
}
```

### 3.3 Weather Risk Assessment

```typescript
export class WeatherRiskCalculator {
  calculateFlightDelayRisk(weatherData: RouteWeatherData): WeatherRisk {
    const departureRisk = this.calculateAirportRisk(weatherData.departure);
    const arrivalRisk = this.calculateAirportRisk(weatherData.arrival);
    
    // Combined risk is weighted average with higher weight on departure
    const combinedRisk = (departureRisk * 0.7) + (arrivalRisk * 0.3);
    
    return {
      overallRisk: combinedRisk,
      departureRisk,
      arrivalRisk,
      riskFactors: this.identifyRiskFactors(weatherData),
      confidence: this.calculateConfidence(weatherData)
    };
  }

  private calculateAirportRisk(airportWeather: AirportWeatherData): number {
    let riskScore = 0.1; // Base risk

    const conditions = airportWeather.currentConditions;
    
    // Precipitation risk
    if (conditions.precipitation?.probability) {
      const precipChance = conditions.precipitation.probability.percent;
      if (precipChance > 70) riskScore += 0.4;
      else if (precipChance > 40) riskScore += 0.2;
      else if (precipChance > 20) riskScore += 0.1;
    }

    // Wind risk
    if (conditions.wind?.speed) {
      const windSpeed = this.convertToKmh(conditions.wind.speed);
      if (windSpeed > 50) riskScore += 0.3;
      else if (windSpeed > 30) riskScore += 0.15;
      else if (windSpeed > 20) riskScore += 0.05;
    }

    // Visibility risk
    if (conditions.visibility) {
      const visibilityKm = this.convertToKm(conditions.visibility);
      if (visibilityKm < 1) riskScore += 0.5;
      else if (visibilityKm < 3) riskScore += 0.3;
      else if (visibilityKm < 8) riskScore += 0.1;
    }

    // Weather type risk
    const weatherType = conditions.weatherCondition.type.toLowerCase();
    const highRiskConditions = ['thunderstorm', 'snow', 'ice', 'fog'];
    const mediumRiskConditions = ['rain', 'drizzle', 'mist'];
    
    if (highRiskConditions.some(condition => weatherType.includes(condition))) {
      riskScore += 0.4;
    } else if (mediumRiskConditions.some(condition => weatherType.includes(condition))) {
      riskScore += 0.2;
    }

    // Temperature extremes
    if (conditions.temperature) {
      const tempC = this.convertToCelsius(conditions.temperature);
      if (tempC < -20 || tempC > 40) riskScore += 0.2;
      else if (tempC < -10 || tempC > 35) riskScore += 0.1;
    }

    return Math.min(riskScore, 1.0); // Cap at 100% risk
  }

  private identifyRiskFactors(weatherData: RouteWeatherData): WeatherRiskFactor[] {
    const factors: WeatherRiskFactor[] = [];

    // Check departure weather
    const depConditions = weatherData.departure.currentConditions;
    if (depConditions.precipitation?.probability?.percent > 50) {
      factors.push({
        type: 'PRECIPITATION',
        severity: depConditions.precipitation.probability.percent > 80 ? 'HIGH' : 'MEDIUM',
        location: 'DEPARTURE',
        description: `${depConditions.precipitation.probability.percent}% chance of precipitation at departure`
      });
    }

    // Check arrival weather
    const arrConditions = weatherData.arrival.currentConditions;
    if (arrConditions.wind?.speed) {
      const windSpeed = this.convertToKmh(arrConditions.wind.speed);
      if (windSpeed > 30) {
        factors.push({
          type: 'WIND',
          severity: windSpeed > 50 ? 'HIGH' : 'MEDIUM',
          location: 'ARRIVAL',
          description: `Strong winds (${windSpeed} km/h) at arrival airport`
        });
      }
    }

    return factors;
  }

  private calculateConfidence(weatherData: RouteWeatherData): number {
    // Weather forecast confidence decreases over time
    const hoursDiff = Math.abs(
      new Date().getTime() - weatherData.flightTime.getTime()
    ) / (1000 * 60 * 60);

    if (hoursDiff <= 6) return 0.95;
    if (hoursDiff <= 24) return 0.85;
    if (hoursDiff <= 72) return 0.75;
    if (hoursDiff <= 168) return 0.65; // 7 days
    return 0.50;
  }
}
```

### 3.4 Data Transformation to Canonical Model

The primary goal of data transformation for the Google Weather API integration is to map the detailed daily forecast structures (including daytime and nighttime periods) into multiple `CanonicalWeatherObservationModel` instances, as defined in `PRD-CORE-003: Shared Types & Validation Schemas`. This normalized data is then provided to the `WeatherAggregator` or directly to the data persistence layer.

```typescript
import type {
  CanonicalWeatherObservationModel,
  // WeatherRiskLevel, // Assuming WeatherRiskLevel is defined elsewhere if needed
} from '@triggerr/types'; // Adjust import path as per your monorepo structure
import type { ForecastDay, PeriodForecast, Temperature, WeatherForecastResponse } from './api_spec_interfaces'; // Assuming API interfaces are in a local file or PRD section

// Helper to convert Google Weather API temperature to Celsius if needed
function getTemperatureCelsius(temp?: Temperature): number | undefined {
  if (!temp) return undefined;
  if (temp.unit === 'CELSIUS') return temp.degrees;
  if (temp.unit === 'FAHRENHEIT') return parseFloat(((temp.degrees - 32) * 5 / 9).toFixed(2));
  return undefined;
}

// Helper to construct a UTC ISO string from date components and a representative hour
// airportTimezoneOlson is crucial for correct conversion from local airport time to UTC.
function createUtcTimestamp(
  displayDate: { year: number; month: number; day: number },
  hourLocal: number, // Representative local hour (e.g., 12 for daytime, 21 for nighttime)
  airportTimezoneOlson: string 
): string {
  // Create a date string in YYYY-MM-DDTHH:mm:ss format for the local timezone
  const localDateTimeStr = `${displayDate.year}-${String(displayDate.month).padStart(2, '0')}-${String(displayDate.day).padStart(2, '0')}T${String(hourLocal).padStart(2, '0')}:00:00`;
  
  // This is a simplified example. In a real scenario, you'd use a robust library 
  // like date-fns-tz or luxon to correctly convert this localDateTimeStr 
  // from airportTimezoneOlson to a UTC ISO 8601 string.
  // For demonstration, assuming a library function like:
  // return convertToUtcIsoString(localDateTimeStr, airportTimezoneOlson);
  // As a placeholder, we'll construct a basic ISO string and append 'Z' - THIS IS NOT ACCURATE WITHOUT A TIMEZONE LIBRARY.
  // THE AGGREGATOR OR PERSISTENCE LAYER MUST ENSURE CORRECT UTC CONVERSION IF NOT DONE HERE.
  // For now, we'll create a naive UTC string based on components.
  const date = new Date(Date.UTC(displayDate.year, displayDate.month - 1, displayDate.day, hourLocal, 0, 0));
  return date.toISOString();
}

// Transforms a single PeriodForecast (daytime or nighttime) from Google Weather
function transformPeriodForecast(
  period: PeriodForecast,
  dailyMinTemp?: Temperature,
  dailyMaxTemp?: Temperature,
  feelsLikeMinTemp?: Temperature,
  feelsLikeMaxTemp?: Temperature,
  sunEvents?: { sunriseTime: string; sunsetTime: string },
  moonPhase?: string
): Partial<CanonicalWeatherObservationModel> {
  return {
    minTemperatureCelsius: getTemperatureCelsius(dailyMinTemp),
    maxTemperatureCelsius: getTemperatureCelsius(dailyMaxTemp),
    feelsLikeCelsius: period === 'daytimeForecast' ? getTemperatureCelsius(feelsLikeMaxTemp) : getTemperatureCelsius(feelsLikeMinTemp), // Approximate based on period
    
    conditionCode: period.weatherCondition?.type || undefined,
    conditionText: period.weatherCondition?.description?.text || undefined,
    conditionType: period.weatherCondition?.type || undefined, // Redundant with conditionCode, but matches canonical model if needed
    
    windSpeedKph: period.wind?.speed?.unit === 'KILOMETERS_PER_HOUR' ? period.wind.speed.value : (period.wind?.speed?.value ? parseFloat((period.wind.speed.value * 1.60934).toFixed(2)) : undefined), // Convert MPH to KPH if necessary
    windDirectionDegrees: period.wind?.direction?.degrees,
    windDirectionCardinal: period.wind?.direction?.cardinal,
    
    precipitationProbabilityPercent: period.precipitation?.probability?.percent,
    // precipitationMmLastHour: // Google Weather gives amount for the period, not last hour for forecast.
    
    visibilityKm: period.visibility?.unit === 'KILOMETERS' ? period.visibility.value : (period.visibility?.value ? parseFloat((period.visibility.value * 1.60934).toFixed(2)) : undefined), // Convert Miles to KM
    humidityPercent: period.relativeHumidity,
    
    sunriseTimestampUTC: sunEvents?.sunriseTime, // Already ISO UTC
    sunsetTimestampUTC: sunEvents?.sunsetTime,   // Already ISO UTC
    moonPhase: moonPhase,
    
    dataSourceApi: 'GoogleWeather',
    rawApiSnapshot: period, // Store the specific period forecast as raw snapshot
  };
}

// Transform Google Weather API response to an array of CanonicalWeatherObservationModel instances
export const transformGoogleWeatherData = (
  response: WeatherForecastResponse, // From Section 2.2 of this PRD
  airportIataCode: string,
  airportTimezoneOlson: string // Crucial for correct timestamp conversion
): CanonicalWeatherObservationModel[] => {
  const observations: CanonicalWeatherObservationModel[] = [];
  const fetchedAtUTC = new Date().toISOString();

  for (const day of response.forecastDays) {
    // Daytime observation
    if (day.daytimeForecast) {
      const daytimeObservationTimestampUTC = createUtcTimestamp(day.displayDate, 12, airportTimezoneOlson); // Noon local, converted to UTC
      observations.push({
        airportIataCode,
        observationTimestampUTC: daytimeObservationTimestampUTC,
        forecastPeriod: 'DAYTIME',
        ...transformPeriodForecast(
          day.daytimeForecast,
          day.minTemperature,
          day.maxTemperature,
          day.feelsLikeMinTemperature,
          day.feelsLikeMaxTemperature,
          day.sunEvents,
          day.moonEvents?.moonPhase
        ),
        fetchedAtUTC,
      } as CanonicalWeatherObservationModel); // Cast needed as transformPeriodForecast returns Partial
    }

    // Nighttime observation
    if (day.nighttimeForecast) {
      const nighttimeObservationTimestampUTC = createUtcTimestamp(day.displayDate, 21, airportTimezoneOlson); // 9 PM local, converted to UTC
      observations.push({
        airportIataCode,
        observationTimestampUTC: nighttimeObservationTimestampUTC,
        forecastPeriod: 'NIGHTTIME',
        ...transformPeriodForecast(
          day.nighttimeForecast,
          day.minTemperature,
          day.maxTemperature,
          day.feelsLikeMinTemperature,
          day.feelsLikeMaxTemperature,
          day.sunEvents,
          day.moonEvents?.moonPhase
        ),
        fetchedAtUTC,
      } as CanonicalWeatherObservationModel); // Cast needed
    }
  }
  return observations;
};

// mapWeatherConditionToRisk can be a separate utility within a risk assessment service
// or the Quote Engine, rather than part of this specific API integration's transformation.
// It would take a CanonicalWeatherObservationModel (or just condition codes/types) as input.
/*
export const mapWeatherConditionToRisk = (conditionType?: string): WeatherRiskLevel => {
  if (!conditionType) return 'MINIMAL';
  const conditionLower = conditionType.toLowerCase();
  // ... (risk mapping logic as before) ...
};
*/

/**
 * Data Points for Persistent Storage (from Google Weather via Canonical Model):
 *
 * The `WeatherAggregator` or persistence service will receive an array of `CanonicalWeatherObservationModel` 
 * instances from this client. Each instance, representing a daytime or nighttime forecast for a given date,
 * is targeted for persistence in the `historical_weather_observations` table.
 *
 * Key fields from `CanonicalWeatherObservationModel` to be stored:
 * - `airportIataCode`
 * - `observationTimestampUTC` (representing the forecast period, e.g., noon for daytime)
 * - `forecastPeriod` ('DAYTIME' or 'NIGHTTIME')
 * - `minTemperatureCelsius`, `maxTemperatureCelsius` (for the whole day)
 * - `feelsLikeCelsius` (approximated for the period)
 * - `conditionCode`, `conditionText`, `conditionType` (for the specific period)
 * - `windSpeedKph`, `windDirectionDegrees`, `windDirectionCardinal` (for the period)
 * - `precipitationProbabilityPercent` (for the period)
 * - `visibilityKm`, `humidityPercent` (for the period)
 * - `sunriseTimestampUTC`, `sunsetTimestampUTC`, `moonPhase` (daily values associated with the period's observation)
 * - `dataSourceApi` (fixed as 'GoogleWeather' for this transformer)
 * - `fetchedAtUTC`
 * - `rawApiSnapshot` (containing the specific `PeriodForecast` object from Google Weather API)
 *
 * This structured storage allows querying historical weather forecasts for airports,
 * crucial for risk assessment and other analytical purposes.
 */
```

### 3.5 Caching Strategy

```typescript
export class WeatherCache {
  constructor(private db: PrismaClient) {}

  async getCachedWeather(
    latitude: number,
    longitude: number,
    maxAgeMinutes: number = 30
  ): Promise<AirportWeatherData | null> {
    const cutoff = new Date(Date.now() - maxAgeMinutes * 60 * 1000);
    
    // Find weather data within reasonable distance (0.1 degree ~ 11km)
    const cached = await this.db.weatherData.findFirst({
      where: {
        latitude: {
          gte: latitude - 0.1,
          lte: latitude + 0.1
        },
        longitude: {
          gte: longitude - 0.1,
          lte: longitude + 0.1
        },
        createdAt: {
          gte: cutoff
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    if (!cached) return null;

    return JSON.parse(cached.data);
  }

  async cacheWeather(weatherData: AirportWeatherData): Promise<void> {
    await this.db.weatherData.create({
      data: {
        latitude: weatherData.location.latitude,
        longitude: weatherData.location.longitude,
        airportCode: weatherData.airportCode,
        data: JSON.stringify(weatherData),
        source: weatherData.dataSource,
        timestamp: weatherData.timestamp
      }
    });

    // Clean up old weather data (older than 24 hours)
    const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    await this.db.weatherData.deleteMany({
      where: {
        createdAt: {
          lt: dayAgo
        }
      }
    });
  }
}
```

## 4. Service Integration

### 4.1 Flight Aggregator Integration

```typescript
// Integration with packages/aggregators/flight-aggregator
export class WeatherEnhancedFlightService {
  constructor(
    private weatherClient: WeatherClient,
    private weatherCache: WeatherCache,
    private riskCalculator: WeatherRiskCalculator
  ) {}

  async enhanceFlightDataWithWeather(flight: Flight): Promise<WeatherEnhancedFlight> {
    try {
      // Get weather for departure and arrival airports
      const routeWeather = await this.weatherClient.getFlightRouteWeather(
        flight.departureIata,
        flight.arrivalIata,
        flight.departureScheduled
      );

      // Calculate weather-based risk
      const weatherRisk = this.riskCalculator.calculateFlightDelayRisk(routeWeather);

      return {
        ...flight,
        weatherData: routeWeather,
        weatherRisk: weatherRisk,
        enhancedAt: new Date()
      };
    } catch (error) {
      console.warn(`Failed to enhance flight ${flight.flightNumber} with weather:`, error);
      
      // Return flight data without weather enhancement
      return {
        ...flight,
        weatherData: null,
        weatherRisk: null,
        enhancedAt: new Date(),
        weatherError: error.message
      };
    }
  }

  async getWeatherImpactForQuote(quote: Quote): Promise<WeatherImpact> {
    const enhancedFlight = await this.enhanceFlightDataWithWeather(quote.flight);
    
    if (!enhancedFlight.weatherRisk) {
      return {
        impactScore: 0,
        riskMultiplier: 1.0,
        factors: [],
        confidence: 0
      };
    }

    const weatherRisk = enhancedFlight.weatherRisk;
    
    return {
      impactScore: weatherRisk.overallRisk,
      riskMultiplier: 1 + (weatherRisk.overallRisk * 0.5), // Up to 50% increase
      factors: weatherRisk.riskFactors,
      confidence: weatherRisk.confidence,
      explanation: this.generateWeatherExplanation(weatherRisk)
    };
  }

  private generateWeatherExplanation(weatherRisk: WeatherRisk): string {
    if (weatherRisk.overallRisk < 0.2) {
      return "Favorable weather conditions with minimal flight delay risk.";
    } else if (weatherRisk.overallRisk < 0.5) {
      return "Moderate weather conditions may cause minor delays.";
    } else if (weatherRisk.overallRisk < 0.8) {
      return "Challenging weather conditions likely to cause delays.";
    } else {
      return "Severe weather conditions with high probability of significant delays.";
    }
  }
}
```

## 5. Error Handling

### 5.1 Weather-Specific Error Handling

```typescript
export class WeatherError extends Error {
  constructor(
    public code: string,
    public message: string,
    public statusCode?: number,
    public originalError?: any
  ) {
    super(message);
    this.name = 'WeatherError';
  }
}

export const handleWeatherAPIError = (error: AxiosError, operation: string): never => {
  const response = error.response;
  
  if (response) {
    switch (response.status) {
      case 400:
        throw new WeatherError(
          'BAD_REQUEST',
          'Bad request. Check your request parameters.',
          400,
          error
        );
      
      case 401:
        throw new WeatherError(
          'INVALID_API_KEY',
          'Invalid API key. Please verify your API_KEY.',
          401,
          error
        );
      
      case 403:
        throw new WeatherError(
          'API_KEY_NOT_AUTHORIZED',
          'API key not authorized. Ensure the key is enabled for the Weather API in Google Cloud Console.',
          403,
          error
        );
      
      case 404:
        throw new WeatherError(
          'INVALID_ENDPOINT',
          'Invalid endpoint. Check the API endpoint URL.',
          404,
          error
        );
      
      case 429:
        throw new WeatherError(
          'RATE_LIMIT_EXCEEDED',
          'Rate limit exceeded. Too many requests.',
          429,
          error
        );
      
      default:
        throw new WeatherError(
          'HTTP_ERROR',
          `HTTP Error: ${response.status} - ${response.data?.error?.message || response.statusText}`,
          response.status,
          error
        );
    }
  } else if (error.request) {
    throw new WeatherError(
      'NETWORK_ERROR',
      'Request timeout or network error',
      undefined,
      error
    );
  } else {
    throw new WeatherError(
      'REQUEST_ERROR',
      `Request error: ${error.message}`,
      undefined,
      error
    );
  }
};
```

## 6. Configuration

### 6.1 Environment Configuration

```typescript
export interface WeatherConfig {
  googleWeatherApiKey: string;
  openWeatherApiKey?: string;
  defaultProvider: 'google' | 'openweather';
  cacheMinutes: number;
  timeout: number;
  retryAttempts: number;
  fallbackEnabled: boolean;
}

export const getWeatherConfig = (): WeatherConfig => ({
  googleWeatherApiKey: process.env.GOOGLE_WEATHER_API_KEY!,
  openWeatherApiKey: process.env.OPENWEATHER_API_KEY,
  defaultProvider: (process.env.WEATHER_DEFAULT_PROVIDER as 'google' | 'openweather') || 'google',
  cacheMinutes: parseInt(process.env.WEATHER_CACHE_MINUTES || '30'),
  timeout: parseInt(process.env.WEATHER_API_TIMEOUT || '10000'),
  retryAttempts: parseInt(process.env.WEATHER_RETRY_ATTEMPTS || '3'),
  fallbackEnabled: process.env.WEATHER_FALLBACK_ENABLED !== 'false'
});
```

## 7. Testing Strategy

### 7.1 Test Implementation

```typescript
// Based on working test patterns
describe('GoogleWeatherClient', () => {
  let client: GoogleWeatherClient;

  beforeEach(() => {
    client = new GoogleWeatherClient(TEST_API_KEY);
  });

  describe('Connection Tests', () => {
    it('should successfully connect to API', async () => {
      const result = await client.testConnection();
      expect(result.success).toBe(true);
      expect(result.dataAvailable).toBe(true);
    });

    it('should handle invalid API key', async () => {
      const invalidClient = new GoogleWeatherClient('invalid_key');
      const result = await invalidClient.testConnection();
      expect(result.success).toBe(false);
    });
  });

  describe('Weather Forecast', () => {
    it('should fetch weather for Tallinn coordinates', async () => {
      const forecast = await client.getForecast(59.4370, 24.7535);
      expect(forecast.forecastDays).toBeInstanceOf(Array);
      expect(forecast.forecastDays.length).toBeGreaterThan(0);
      
      const todayForecast = forecast.forecastDays[0];
      expect(todayForecast.displayDate).toBeDefined();
      expect(todayForecast.maxTemperature || todayForecast.minTemperature).toBeDefined();
    });

    it('should validate response structure', async () => {
      const forecast = await client.getForecast(59.4370, 24.7535);
      const today = forecast.forecastDays[0];
      
      expect(today.daytimeForecast?.weatherCondition || today.nighttimeForecast?.weatherCondition).toBeDefined();
    });
  });

  describe('Airport Weather', () => {
    it('should get weather for known airport', async () => {
      const weather = await client.getAirportWeather('TLL');
      expect(weather.airportCode).toBe('TLL');
      expect(weather.currentConditions).toBeDefined();
    });
  });

  describe('Risk Calculation', () => {
    it('should calculate weather risk for route', async () => {
      const routeWeather = await client.getFlightRouteWeather('TLL', 'LHR');
      const riskCalculator = new WeatherRiskCalculator();
      const risk = riskCalculator.calculateFlightDelayRisk(routeWeather);
      
      expect(risk.overallRisk).toBeGreaterThanOrEqual(0);
      expect(risk.overallRisk).toBeLessThanOrEqual(1);
      expect(risk.confidence).toBeGreaterThan(0);
    });
  });
});
```

## 8. Monitoring & Analytics

### 8.1 Performance Metrics

```typescript
export const weatherMetrics = {
  // API performance
  responseTime: histogram('weather_api_response_time_seconds'),
  requestsTotal: counter('weather_api_requests_total'),
  errorsTotal: counter('weather_api_errors_total'),
  
  // Cache performance
  cacheHits: counter('weather_cache_hits_total'),
  cacheMisses: counter('weather_cache_misses_total'),
  cacheSize: gauge('weather_cache_size_bytes'),
  
  // Risk assessment
  riskCalculations: counter('weather_risk_calculations_total'),
  highRiskFlights: counter('weather_high_risk_flights_total'),
  weatherImpactOnQuotes: histogram('weather_impact_on_quote_multiplier'),
  
  // Data quality
  forecastAccuracy: gauge('weather_forecast_accuracy_percent'),
  dataFreshness: gauge('weather_data_freshness_minutes')
};
```

## 9. Implementation Timeline

### Week 1: Foundation
- [ ] Setup package structure and dependencies
- [ ] Implement Google Weather API client
- [ ] Add error handling and validation
- [ ] Create TypeScript interfaces

### Week 2: Risk Assessment
- [ ] Build weather risk calculator
- [ ] Implement data transformation logic
- [ ] Add airport coordinate mapping
- [ ] Create caching system

### Week 3: Integration
- [ ] Integrate with flight aggregator
- [ ] Add weather impact to quote engine
- [ ] Implement route weather analysis
- [ ] Create monitoring and metrics

### Week 4: Enhancement
- [ ] Add multiple weather provider support
- [ ] Implement fallback strategies
- [ ] Performance optimization
- [ ] Comprehensive testing

## 10. Success Metrics

- **API Response Time**: < 3 seconds p95 for weather data retrieval
- **Cache Hit Rate**: > 85% for repeated airport weather requests
- **Risk Accuracy**: Weather risk correlation with actual delays > 70%
- **Data Freshness**: Weather data < 30 minutes old for active quotes
- **Error Rate**: < 2% of weather API requests fail
- **Coverage**: Weather data available for > 95% of supported airports

## 11. Risk Mitigation

### 11.1 Fallback Strategies
- **API Unavailable**: Use cached weather data with staleness warnings
- **Invalid Coordinates**: Fallback to regional weather stations
- **Rate Limit Exceeded**: Queue requests and implement exponential backoff
- **Data Quality Issues**: Cross-validate with multiple sources when available
- **Network Timeouts**: Retry with increased timeout values

### 11.2 Data Quality Assurance
- **Response Validation**: Validate all weather responses against schemas
- **Anomaly Detection**: Flag unusual weather patterns or data inconsistencies
- **Historical Correlation**: Track weather prediction accuracy over time
- **Source Reliability**: Monitor and score weather data source reliability

## 12. Dependencies

- **Requires**: PRD-CORE-001 (Database Schema) for weather data storage
- **Requires**: PRD-CORE-003 (Shared Types) for TypeScript interfaces
- **Integrates**: PRD-DATA-001 (Flight Aggregator) for enhanced risk assessment
- **Enhances**: PRD-ENGINE-001 (Quote Engine) with weather-based risk factors
- **Supports**: All flight integration PRDs with weather correlation

---

**Status**: Ready for implementation  
**Next PRD**: PRD-DATA-001 (Flight Data Aggregator)