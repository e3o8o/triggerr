/**
 * AviationStack API Client Adapter
 *
 * This adapter integrates with the AviationStack API to fetch flight data
 * and transform it into our canonical data format.
 *
 * API Documentation: https://aviationstack.com/documentation
 */

import axios from "axios";
import type {
  CanonicalFlightData,
  StandardFlightStatus,
  SourceContributions,
} from "@triggerr/shared/models/canonical-models";
import type { IFlightApiClient } from "../../../aggregators/flight-aggregator/src/source-router";

interface AviationStackFlight {
  flight: {
    iata: string;
    icao: string;
    number?: string;
  };
  airline: {
    name: string;
    iata: string;
    icao: string;
  };
  flight_status: string;
  departure: {
    airport: string;
    iata?: string;
    icao?: string;
    scheduled: string;
    estimated?: string;
    actual?: string;
    delay?: number;
    timezone?: string;
    terminal?: string;
    gate?: string;
  };
  arrival: {
    airport: string;
    iata?: string;
    icao?: string;
    scheduled: string;
    estimated?: string;
    actual?: string;
    delay?: number;
    timezone?: string;
    terminal?: string;
    gate?: string;
  };
  aircraft?: {
    registration?: string;
    iata?: string;
    icao?: string;
    model?: string;
  };
  flight_date: string;
}

interface AviationStackResponse {
  data: AviationStackFlight[];
  pagination?: {
    limit: number;
    offset: number;
    count: number;
    total: number;
  };
}

export class AviationStackClient implements IFlightApiClient {
  public readonly name = "AviationStack";
  public readonly priority = 85; // Medium priority
  public readonly reliability = 0.85; // Good reliability

  private readonly baseUrl = "http://api.aviationstack.com/v1";
  private readonly apiKey: string;
  private readonly timeout = 15000; // 15 seconds

  constructor(apiKey: string) {
    if (!apiKey) {
      throw new Error("AviationStack API key is required");
    }
    this.apiKey = apiKey;
  }

  /**
   * Fetch flight data for a specific flight number.
   */
  async fetchFlight(
    flightNumber: string,
    date?: string,
  ): Promise<CanonicalFlightData | null> {
    console.log(`[AviationStack] Fetching flight data for ${flightNumber}`);

    try {
      const params = new URLSearchParams({
        access_key: this.apiKey,
        flight_iata: flightNumber,
      });

      if (date) {
        params.append("flight_date", date);
      }

      const response = await axios.get(`${this.baseUrl}/flights`, {
        params: params,
        timeout: this.timeout,
        headers: {
          Accept: "application/json",
          "User-Agent": "Triggerr-FlightAggregator/1.0",
        },
      });

      if (response.status !== 200) {
        console.error(
          `[AviationStack] API error: ${response.status} ${response.statusText}`,
        );
        return null;
      }

      const data: AviationStackResponse = response.data;

      if (!data.data || data.data.length === 0) {
        console.log(`[AviationStack] No flight data found for ${flightNumber}`);
        return null;
      }

      // Use the first flight result
      const flight = data.data[0];
      const canonicalData = this.transformToCanonical(flight);

      console.log(
        `[AviationStack] Successfully fetched data for ${flightNumber}`,
      );
      return canonicalData;
    } catch (error) {
      console.error(
        `[AviationStack] Error fetching flight ${flightNumber}:`,
        error,
      );
      return null;
    }
  }

  /**
   * Check if the AviationStack API is available.
   */
  async isAvailable(): Promise<boolean> {
    try {
      const response = await axios.get(`${this.baseUrl}/flights`, {
        params: {
          access_key: this.apiKey,
          limit: 1,
        },
        timeout: 5000,
        headers: {
          Accept: "application/json",
          "User-Agent": "Triggerr-FlightAggregator/1.0",
        },
      });

      return response.status === 200;
    } catch (error) {
      console.warn(`[AviationStack] Health check failed:`, error);
      return false;
    }
  }

  /**
   * Transform AviationStack flight data to canonical format.
   */
  private transformToCanonical(
    flight: AviationStackFlight,
  ): CanonicalFlightData {
    const now = new Date().toISOString();

    // Map flight status to standard format
    const status = this.mapFlightStatus(flight.flight_status);

    // Calculate delays
    const departureDelay = flight.departure.delay || null;
    const arrivalDelay = flight.arrival.delay || null;

    // Create source contribution record
    const sourceContributions: SourceContributions = [
      {
        source: "aviationstack",
        fields: [
          "flightNumber",
          "airlineIataCode",
          "airlineIcaoCode",
          "originAirportIataCode",
          "destinationAirportIataCode",
          "scheduledDepartureTimestampUTC",
          "scheduledArrivalTimestampUTC",
          "flightStatus",
        ],
        timestamp: now,
        confidence: this.reliability,
        sourceId: `${flight.flight.iata}-${flight.flight_date}`,
        apiVersion: "v1",
      },
    ];

    // Add actual times if available
    if (flight.departure.actual) {
      sourceContributions[0].fields.push("actualDepartureTimestampUTC");
    }
    if (flight.arrival.actual) {
      sourceContributions[0].fields.push("actualArrivalTimestampUTC");
    }
    if (departureDelay !== null) {
      sourceContributions[0].fields.push("departureDelayMinutes");
    }
    if (arrivalDelay !== null) {
      sourceContributions[0].fields.push("arrivalDelayMinutes");
    }

    // Calculate data quality score
    const qualityScore = this.calculateQualityScore(flight);

    const canonicalData: CanonicalFlightData = {
      id: crypto.randomUUID(),
      flightNumber: flight.flight.iata || flight.flight.icao,
      airlineIataCode: flight.airline.iata || undefined,
      airlineIcaoCode: flight.airline.icao || undefined,
      originAirportIataCode: flight.departure.iata || "UNKNOWN",
      originAirportIcaoCode: flight.departure.icao || undefined,
      destinationAirportIataCode: flight.arrival.iata || "UNKNOWN",
      destinationAirportIcaoCode: flight.arrival.icao || undefined,
      aircraftTypeIcaoCode: flight.aircraft?.icao || undefined,
      scheduledDepartureTimestampUTC: this.parseTimestamp(
        flight.departure.scheduled,
      ),
      scheduledArrivalTimestampUTC:
        this.parseTimestamp(flight.arrival.scheduled) || undefined,
      actualDepartureTimestampUTC: flight.departure.actual
        ? this.parseTimestamp(flight.departure.actual)
        : undefined,
      actualArrivalTimestampUTC: flight.arrival.actual
        ? this.parseTimestamp(flight.arrival.actual)
        : undefined,
      estimatedDepartureTimestampUTC: flight.departure.estimated
        ? this.parseTimestamp(flight.departure.estimated)
        : undefined,
      estimatedArrivalTimestampUTC: flight.arrival.estimated
        ? this.parseTimestamp(flight.arrival.estimated)
        : undefined,
      flightStatus: status,
      departureDelayMinutes: departureDelay || undefined,
      arrivalDelayMinutes: arrivalDelay || undefined,
      gate: flight.departure.gate || flight.arrival.gate || undefined,
      terminal:
        flight.departure.terminal || flight.arrival.terminal || undefined,
      sourceContributions,
      dataQualityScore: qualityScore,
      lastUpdatedUTC: now,
      createdAt: now,
      updatedAt: now,
    };

    return canonicalData;
  }

  /**
   * Map AviationStack flight status to standard format.
   */
  private mapFlightStatus(status: string): StandardFlightStatus {
    const normalizedStatus = status.toLowerCase().trim();

    switch (normalizedStatus) {
      case "scheduled":
        return "SCHEDULED";
      case "active":
      case "en-route":
        return "ACTIVE";
      case "departed":
        return "DEPARTED";
      case "landed":
        return "LANDED";
      case "cancelled":
        return "CANCELLED";
      case "delayed":
        return "DELAYED";
      case "diverted":
        return "DIVERTED";
      default:
        console.warn(`[AviationStack] Unknown flight status: ${status}`);
        return "UNKNOWN";
    }
  }

  /**
   * Parse timestamp string to ISO format.
   */
  private parseTimestamp(timestamp: string): string {
    try {
      const date = new Date(timestamp);
      if (isNaN(date.getTime())) {
        throw new Error("Invalid date");
      }
      return date.toISOString();
    } catch (error) {
      console.warn(`[AviationStack] Failed to parse timestamp: ${timestamp}`);
      return new Date().toISOString();
    }
  }

  /**
   * Calculate data quality score based on available fields.
   */
  private calculateQualityScore(flight: AviationStackFlight): number {
    let score = 0;
    let maxScore = 0;

    // Required fields (weight: 2)
    const requiredFields = [
      { field: flight.flight.iata || flight.flight.icao, weight: 2 },
      { field: flight.departure.iata, weight: 2 },
      { field: flight.arrival.iata, weight: 2 },
      { field: flight.departure.scheduled, weight: 2 },
    ];

    // Important fields (weight: 1)
    const importantFields = [
      { field: flight.arrival.scheduled, weight: 1 },
      { field: flight.airline.iata || flight.airline.icao, weight: 1 },
      { field: flight.flight_status, weight: 1 },
      { field: flight.departure.actual, weight: 1 },
      { field: flight.arrival.actual, weight: 1 },
    ];

    // Calculate score
    [...requiredFields, ...importantFields].forEach(({ field, weight }) => {
      maxScore += weight;
      if (field) score += weight;
    });

    // Add bonus for additional data
    if (flight.aircraft?.registration) score += 0.5;
    if (flight.departure.gate) score += 0.5;
    if (flight.departure.terminal) score += 0.5;

    maxScore += 1.5; // Account for bonus fields

    return Math.min(1.0, score / maxScore);
  }
}
