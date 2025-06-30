export interface CanonicalFlightDataModel {
    id?: string;
    flightNumber: string;
    airlineIcaoCode?: string;
    airlineIataCode?: string;
    originAirportIataCode: string;
    originAirportIcaoCode?: string;
    destinationAirportIataCode: string;
    destinationAirportIcaoCode?: string;
    aircraftTypeIcaoCode?: string;
    scheduledDepartureTimestampUTC: string;
    scheduledArrivalTimestampUTC?: string;
    actualDepartureTimestampUTC?: string;
    actualArrivalTimestampUTC?: string;
    estimatedDepartureTimestampUTC?: string;
    estimatedArrivalTimestampUTC?: string;
    flightStatus: StandardFlightStatus;
    departureDelayMinutes?: number;
    arrivalDelayMinutes?: number;
    cancelledAt?: string;
    cancellationReason?: string;
    divertedTo?: string;
    divertedAt?: string;
    gate?: string;
    terminal?: string;
    sourceContributions: SourceContributions;
    dataQualityScore: number;
    lastUpdatedUTC: string;
    createdAt?: string;
    updatedAt?: string;
}
export interface CanonicalFlightData extends CanonicalFlightDataModel {
    id: string;
    createdAt: string;
    updatedAt: string;
}
export interface CanonicalWeatherObservationModel {
    id?: string;
    airportIataCode: string;
    observationTimestampUTC: string;
    temperature?: number;
    temperatureFahrenheit?: number;
    humidity?: number;
    windSpeed?: number;
    windDirection?: number;
    windGust?: number;
    visibility?: number;
    pressure?: number;
    dewPoint?: number;
    weatherCondition: StandardWeatherCondition;
    cloudCover?: string;
    precipitation?: number;
    precipitationType?: string;
    uvIndex?: number;
    sourceContributions: SourceContributions;
    dataQualityScore: number;
    lastUpdatedUTC: string;
    createdAt?: string;
    updatedAt?: string;
}
export interface CanonicalWeatherObservation extends CanonicalWeatherObservationModel {
    id: string;
    createdAt: string;
    updatedAt: string;
}
export interface SourceContribution {
    source: 'aviationstack' | 'flightaware' | 'opensky' | 'weatherapi' | 'openweather';
    fields: string[];
    timestamp: string;
    confidence: number;
    sourceId?: string;
    apiVersion?: string;
    responseTime?: number;
    cost?: number;
}
export type SourceContributions = SourceContribution[];
export interface FlightDataWithReferences extends CanonicalFlightData {
    airline?: {
        name: string;
        icaoCode: string;
        iataCode: string;
        country: string;
    };
    originAirport?: {
        name: string;
        iataCode: string;
        icaoCode: string;
        timezone: string;
        city: string;
        country: string;
        coordinates?: {
            latitude: number;
            longitude: number;
        };
    };
    destinationAirport?: {
        name: string;
        iataCode: string;
        icaoCode: string;
        timezone: string;
        city: string;
        country: string;
        coordinates?: {
            latitude: number;
            longitude: number;
        };
    };
    aircraftType?: {
        manufacturer: string;
        model: string;
        icaoCode: string;
        iataCode?: string;
    };
}
export interface WeatherDataWithReferences extends CanonicalWeatherObservation {
    airport?: {
        name: string;
        iataCode: string;
        city: string;
        country: string;
        timezone: string;
        coordinates: {
            latitude: number;
            longitude: number;
        };
    };
}
export type StandardFlightStatus = 'SCHEDULED' | 'ACTIVE' | 'DEPARTED' | 'LANDED' | 'CANCELLED' | 'DELAYED' | 'DIVERTED' | 'UNKNOWN';
export type StandardWeatherCondition = 'CLEAR' | 'PARTLY_CLOUDY' | 'CLOUDY' | 'OVERCAST' | 'LIGHT_RAIN' | 'MODERATE_RAIN' | 'HEAVY_RAIN' | 'THUNDERSTORM' | 'SNOW' | 'FOG' | 'MIST' | 'WIND' | 'UNKNOWN';
export interface DataQualityMetrics {
    completeness: number;
    accuracy: number;
    timeliness: number;
    consistency: number;
    overall: number;
}
export interface CanonicalFlightDataWithQuality extends CanonicalFlightData {
    quality: DataQualityMetrics;
    sourceContributions: SourceContributions;
}
export interface CanonicalWeatherDataWithQuality extends CanonicalWeatherObservation {
    quality: DataQualityMetrics;
    sourceContributions: SourceContributions;
}
export interface FlightPerformanceStats {
    flightNumber: string;
    route: {
        origin: string;
        destination: string;
    };
    period: {
        start: string;
        end: string;
    };
    statistics: {
        totalFlights: number;
        onTimePercentage: number;
        averageDelayMinutes: number;
        cancellationRate: number;
        diversionRate: number;
    };
}
export interface WeatherImpactAnalysis {
    airport: string;
    period: {
        start: string;
        end: string;
    };
    conditions: {
        condition: StandardWeatherCondition;
        frequency: number;
        averageFlightDelays: number;
        cancellationRate: number;
    }[];
}
export interface FlightDataTransformation {
    source: string;
    rawData: Record<string, any>;
    transformedData: Partial<CanonicalFlightDataModel>;
    transformationRules: string[];
    confidence: number;
    warnings: string[];
    errors: string[];
}
export interface WeatherDataTransformation {
    source: string;
    rawData: Record<string, any>;
    transformedData: Partial<CanonicalWeatherObservationModel>;
    transformationRules: string[];
    confidence: number;
    warnings: string[];
    errors: string[];
}
export declare function isCanonicalFlightData(data: any): data is CanonicalFlightData;
export declare function isCanonicalWeatherData(data: any): data is CanonicalWeatherObservation;
export declare function validateFlightData(data: Partial<CanonicalFlightDataModel>): {
    valid: boolean;
    errors: string[];
    warnings: string[];
};
export declare function validateWeatherData(data: Partial<CanonicalWeatherObservationModel>): {
    valid: boolean;
    errors: string[];
    warnings: string[];
};
export type PartialCanonicalFlightData = Partial<CanonicalFlightDataModel>;
export type PartialCanonicalWeatherData = Partial<CanonicalWeatherObservationModel>;
export interface DataMergeResult<T> {
    merged: T;
    conflicts: Array<{
        field: string;
        values: Array<{
            source: string;
            value: any;
            confidence: number;
        }>;
        resolution: 'highest_confidence' | 'most_recent' | 'manual_review';
        chosenValue: any;
    }>;
    qualityScore: number;
}
export declare const DATA_QUALITY_THRESHOLDS: {
    readonly EXCELLENT: 0.9;
    readonly GOOD: 0.75;
    readonly FAIR: 0.6;
    readonly POOR: 0.4;
    readonly MINIMUM_ACCEPTABLE: 0.3;
};
export declare const SOURCE_RELIABILITY_SCORES: {
    readonly flightaware: 0.95;
    readonly aviationstack: 0.85;
    readonly opensky: 0.75;
    readonly weatherapi: 0.9;
    readonly openweather: 0.8;
};
//# sourceMappingURL=canonical-models.d.ts.map