/**
 * Google Weather API Client Adapter
 *
 * This adapter integrates with the Google Weather API to fetch weather forecast data
 * and transform it into our canonical data format.
 *
 * API Documentation: https://weather.googleapis.com/
 */

import type {
  CanonicalWeatherObservation,
  CanonicalWeatherObservationModel,
  StandardWeatherCondition,
  SourceContributions
} from "@triggerr/shared";

export interface IWeatherApiClient {
  name: string;
  priority: number;
  reliability: number; // 0.0 to 1.0
  fetchWeather(
    coordinates: { latitude: number; longitude: number },
    date?: string,
  ): Promise<CanonicalWeatherObservation | null>;
  fetchWeatherByAirport(
    airportCode: string,
    date?: string,
  ): Promise<CanonicalWeatherObservation | null>;
  isAvailable(): Promise<boolean>;
}

interface GoogleWeatherResponse {
  forecastDays: GoogleForecastDay[];
}

interface GoogleForecastDay {
  displayDate: {
    year: number;
    month: number;
    day: number;
  };
  maxTemperature: {
    degrees: number;
    unit: "CELSIUS" | "FAHRENHEIT";
  };
  minTemperature: {
    degrees: number;
    unit: "CELSIUS" | "FAHRENHEIT";
  };
  feelsLikeMaxTemperature?: {
    degrees: number;
    unit: "CELSIUS" | "FAHRENHEIT";
  };
  feelsLikeMinTemperature?: {
    degrees: number;
    unit: "CELSIUS" | "FAHRENHEIT";
  };
  daytimeForecast?: GooglePeriodForecast;
  nighttimeForecast?: GooglePeriodForecast;
  sunEvents?: {
    sunriseTime: string;
    sunsetTime: string;
  };
  moonEvents?: {
    moonPhase: string;
  };
}

interface GooglePeriodForecast {
  weatherCondition: {
    type: string;
    description: {
      text: string;
    };
  };
  precipitation?: {
    probability: {
      percent: number;
    };
  };
  relativeHumidity?: number;
  wind?: {
    speed: {
      value: number;
      unit: "KILOMETERS_PER_HOUR" | "MILES_PER_HOUR";
    };
    direction: {
      cardinal: string;
      degrees?: number;
    };
  };
}

// Airport coordinates mapping (subset for common airports)
const AIRPORT_COORDINATES: Record<string, { latitude: number; longitude: number }> = {
  'JFK': { latitude: 40.6413, longitude: -73.7781 },
  'LAX': { latitude: 33.9425, longitude: -118.4081 },
  'LHR': { latitude: 51.4700, longitude: -0.4543 },
  'CDG': { latitude: 49.0097, longitude: 2.5479 },
  'NRT': { latitude: 35.7720, longitude: 140.3929 },
  'RIX': { latitude: 56.9236, longitude: 23.9711 },
  'TLL': { latitude: 59.4133, longitude: 24.8328 },
  // Add more as needed
};

export class GoogleWeatherClient implements IWeatherApiClient {
  public readonly name = "GoogleWeather";
  public readonly priority = 90; // High priority
  public readonly reliability = 0.90; // Excellent reliability

  private readonly baseUrl = "https://weather.googleapis.com/v1/forecast/days:lookup";
  private readonly apiKey: string;
  private readonly timeout = 10000; // 10 seconds

  constructor(apiKey: string) {
    if (!apiKey) {
      throw new Error("Google Weather API key is required");
    }
    this.apiKey = apiKey;
  }

  /**
   * Fetch weather data for specific coordinates.
   */
  async fetchWeather(
    coordinates: { latitude: number; longitude: number },
    date?: string,
  ): Promise<CanonicalWeatherObservation | null> {
    console.log(`[GoogleWeather] Fetching weather for coordinates ${coordinates.latitude}, ${coordinates.longitude}`);

    try {
      const url = new URL(this.baseUrl);
      url.searchParams.set("key", this.apiKey);
      url.searchParams.set("location.latitude", coordinates.latitude.toString());
      url.searchParams.set("location.longitude", coordinates.longitude.toString());

      const response = await fetch(url.toString(), {
        method: "GET",
        headers: {
          "Accept": "application/json",
          "User-Agent": "Triggerr-WeatherAggregator/1.0"
        },
        signal: AbortSignal.timeout(this.timeout)
      });

      if (!response.ok) {
        console.error(`[GoogleWeather] API error: ${response.status} ${response.statusText}`);
        return null;
      }

      const data: GoogleWeatherResponse = await response.json();

      if (!data.forecastDays || data.forecastDays.length === 0) {
        console.log(`[GoogleWeather] No weather data found for coordinates`);
        return null;
      }

      // Use today's forecast (first day)
      const todayForecast = data.forecastDays[0];
      const canonicalData = this.transformToCanonical(todayForecast, coordinates);

      console.log(`[GoogleWeather] Successfully fetched weather data`);
      return canonicalData;

    } catch (error) {
      console.error(`[GoogleWeather] Error fetching weather:`, error);
      return null;
    }
  }

  /**
   * Fetch weather data for a specific airport by IATA code.
   */
  async fetchWeatherByAirport(
    airportCode: string,
    date?: string,
  ): Promise<CanonicalWeatherObservation | null> {
    const coordinates = AIRPORT_COORDINATES[airportCode.toUpperCase()];

    if (!coordinates) {
      console.warn(`[GoogleWeather] No coordinates found for airport ${airportCode}`);
      return null;
    }

    console.log(`[GoogleWeather] Fetching weather for airport ${airportCode}`);
    return this.fetchWeather(coordinates, date);
  }

  /**
   * Check if the Google Weather API is available.
   */
  async isAvailable(): Promise<boolean> {
    try {
      // Test with a known location (London)
      const testCoordinates = { latitude: 51.5074, longitude: -0.1278 };

      const url = new URL(this.baseUrl);
      url.searchParams.set("key", this.apiKey);
      url.searchParams.set("location.latitude", testCoordinates.latitude.toString());
      url.searchParams.set("location.longitude", testCoordinates.longitude.toString());

      const response = await fetch(url.toString(), {
        method: "GET",
        headers: {
          "Accept": "application/json",
          "User-Agent": "Triggerr-WeatherAggregator/1.0"
        },
        signal: AbortSignal.timeout(5000) // Shorter timeout for health check
      });

      return response.ok;
    } catch (error) {
      console.warn(`[GoogleWeather] Health check failed:`, error);
      return false;
    }
  }

  /**
   * Transform Google Weather forecast data to canonical format.
   */
  private transformToCanonical(
    forecast: GoogleForecastDay,
    coordinates: { latitude: number; longitude: number },
  ): CanonicalWeatherObservation {
    const now = new Date().toISOString();

    // Get observation timestamp for today
    const observationDate = new Date(
      forecast.displayDate.year,
      forecast.displayDate.month - 1, // Month is 1-based in Google API
      forecast.displayDate.day
    );

    // Use daytime forecast as primary data source, fallback to nighttime
    const primaryForecast = forecast.daytimeForecast || forecast.nighttimeForecast;

    // Map weather condition to standard format
    const weatherCondition = this.mapWeatherCondition(primaryForecast?.weatherCondition?.type);

    // Extract temperature (convert to Celsius if needed)
    const tempCelsius = this.convertToCelsius(
      forecast.maxTemperature.degrees,
      forecast.maxTemperature.unit
    );
    const tempFahrenheit = this.convertToFahrenheit(tempCelsius);

    // Extract wind data
    const windData = this.extractWindData(primaryForecast);

    // Create source contribution record
    const sourceContributions: SourceContributions = [{
      source: "weatherapi", // Google Weather is mapped to weatherapi in SOURCE_RELIABILITY_SCORES
      fields: [
        "temperature", "temperatureFahrenheit", "weatherCondition",
        "humidity", "windSpeed", "windDirection", "precipitation"
      ],
      timestamp: now,
      confidence: this.reliability,
      sourceId: `${coordinates.latitude}-${coordinates.longitude}-${observationDate.toISOString().split('T')[0]}`,
      apiVersion: "v1"
    }];

    // Calculate data quality score
    const qualityScore = this.calculateQualityScore(forecast, primaryForecast);

    const canonicalData: CanonicalWeatherObservation = {
      id: crypto.randomUUID(),
      airportIataCode: "COORD", // Placeholder when using coordinates
      observationTimestampUTC: observationDate.toISOString(),
      temperature: tempCelsius,
      temperatureFahrenheit: tempFahrenheit,
      humidity: primaryForecast?.relativeHumidity || undefined,
      windSpeed: windData.speed,
      windDirection: windData.direction,
      windGust: undefined, // Google doesn't provide gust data in this format
      visibility: undefined, // Not provided in Google Weather API
      pressure: undefined, // Not provided in Google Weather API
      dewPoint: undefined, // Not provided in Google Weather API
      weatherCondition,
      cloudCover: undefined, // Not explicitly provided
      precipitation: primaryForecast?.precipitation?.probability?.percent || undefined,
      precipitationType: this.determinePrecipitationType(weatherCondition),
      uvIndex: undefined, // Not provided in Google Weather API
      sourceContributions,
      dataQualityScore: qualityScore,
      lastUpdatedUTC: now,
      createdAt: now,
      updatedAt: now
    };

    return canonicalData;
  }

  /**
   * Map Google Weather condition types to standard format.
   */
  private mapWeatherCondition(conditionType?: string): StandardWeatherCondition {
    if (!conditionType) return "UNKNOWN";

    const normalizedCondition = conditionType.toLowerCase().trim();

    switch (normalizedCondition) {
      case "clear":
      case "sunny":
        return "CLEAR";
      case "partly_cloudy":
      case "partly cloudy":
        return "PARTLY_CLOUDY";
      case "cloudy":
      case "overcast":
        return "CLOUDY";
      case "light_rain":
      case "light rain":
        return "LIGHT_RAIN";
      case "moderate_rain":
      case "moderate rain":
      case "rain":
        return "MODERATE_RAIN";
      case "heavy_rain":
      case "heavy rain":
        return "HEAVY_RAIN";
      case "thunderstorm":
      case "thunder":
        return "THUNDERSTORM";
      case "snow":
      case "light_snow":
      case "heavy_snow":
        return "SNOW";
      case "fog":
        return "FOG";
      case "mist":
        return "MIST";
      case "wind":
      case "windy":
        return "WIND";
      default:
        console.warn(`[GoogleWeather] Unknown weather condition: ${conditionType}`);
        return "UNKNOWN";
    }
  }

  /**
   * Convert temperature to Celsius.
   */
  private convertToCelsius(degrees: number, unit: "CELSIUS" | "FAHRENHEIT"): number {
    if (unit === "CELSIUS") {
      return degrees;
    }
    // Convert Fahrenheit to Celsius
    return (degrees - 32) * 5 / 9;
  }

  /**
   * Convert Celsius to Fahrenheit.
   */
  private convertToFahrenheit(celsius: number): number {
    return (celsius * 9 / 5) + 32;
  }

  /**
   * Extract wind data from forecast.
   */
  private extractWindData(forecast?: GooglePeriodForecast): {
    speed?: number;
    direction?: number;
  } {
    if (!forecast?.wind) {
      return { speed: undefined, direction: undefined };
    }

    const wind = forecast.wind;
    let speed = wind.speed.value;

    // Convert to km/h if needed
    if (wind.speed.unit === "MILES_PER_HOUR") {
      speed = speed * 1.60934; // Convert mph to km/h
    }

    // Convert cardinal direction to degrees if needed
    let direction = wind.direction.degrees;
    if (!direction && wind.direction.cardinal) {
      direction = this.cardinalTodegrees(wind.direction.cardinal);
    }

    return { speed, direction };
  }

  /**
   * Convert cardinal direction to degrees.
   */
  private cardinalTodegrees(cardinal: string): number {
    const directions: Record<string, number> = {
      'N': 0, 'NNE': 22.5, 'NE': 45, 'ENE': 67.5,
      'E': 90, 'ESE': 112.5, 'SE': 135, 'SSE': 157.5,
      'S': 180, 'SSW': 202.5, 'SW': 225, 'WSW': 247.5,
      'W': 270, 'WNW': 292.5, 'NW': 315, 'NNW': 337.5,
      'NORTH': 0, 'SOUTH': 180, 'EAST': 90, 'WEST': 270,
      'NORTHEAST': 45, 'NORTHWEST': 315, 'SOUTHEAST': 135, 'SOUTHWEST': 225,
      'WEST_NORTHWEST': 292.5, 'WEST_SOUTHWEST': 247.5
    };

    return directions[cardinal.toUpperCase()] || 0;
  }

  /**
   * Determine precipitation type from weather condition.
   */
  private determinePrecipitationType(condition: StandardWeatherCondition): string | undefined {
    switch (condition) {
      case "LIGHT_RAIN":
      case "MODERATE_RAIN":
      case "HEAVY_RAIN":
        return "rain";
      case "SNOW":
        return "snow";
      case "THUNDERSTORM":
        return "thunderstorm";
      default:
        return undefined;
    }
  }

  /**
   * Calculate data quality score based on available fields.
   */
  private calculateQualityScore(
    forecast: GoogleForecastDay,
    primaryForecast?: GooglePeriodForecast,
  ): number {
    let score = 0;
    let maxScore = 0;

    // Required fields (weight: 2)
    const requiredFields = [
      { field: forecast.maxTemperature, weight: 2 },
      { field: forecast.minTemperature, weight: 2 },
      { field: primaryForecast?.weatherCondition, weight: 2 }
    ];

    // Important fields (weight: 1)
    const importantFields = [
      { field: primaryForecast?.relativeHumidity, weight: 1 },
      { field: primaryForecast?.wind, weight: 1 },
      { field: primaryForecast?.precipitation, weight: 1 },
      { field: forecast.sunEvents, weight: 1 }
    ];

    // Calculate score
    [...requiredFields, ...importantFields].forEach(({ field, weight }) => {
      maxScore += weight;
      if (field) score += weight;
    });

    // Add bonus for additional data
    if (forecast.feelsLikeMaxTemperature) score += 0.5;
    if (forecast.moonEvents) score += 0.5;

    maxScore += 1.0; // Account for bonus fields

    return Math.min(1.0, score / maxScore);
  }
}
