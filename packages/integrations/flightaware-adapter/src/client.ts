/**
 * FlightAware API Client Adapter
 *
 * This adapter integrates with the FlightAware AeroAPI to fetch flight data
 * and transform it into our canonical data format.
 *
 * API Documentation: https://flightaware.com/commercial/aeroapi/
 */

import axios from "axios";
import type {
  CanonicalFlightData,
  StandardFlightStatus,
  SourceContributions,
} from "@triggerr/shared/models/canonical-models";
import type { IFlightApiClient } from "../../../aggregators/flight-aggregator/src/source-router";

interface FlightAwareFlight {
  ident: string;
  ident_icao?: string;
  ident_iata?: string;
  fa_flight_id: string;
  operator?: string;
  operator_icao?: string;
  operator_iata?: string;
  flight_number?: string;
  registration?: string;
  atc_ident?: string;
  inbound_fa_flight_id?: string;
  codeshares?: string[];
  blocked?: boolean;
  diverted?: boolean;
  cancelled?: boolean;
  position_only?: boolean;
  origin?: {
    code: string;
    code_icao?: string;
    code_iata?: string;
    code_lid?: string;
    timezone?: string;
    name?: string;
    city?: string;
    airport_info_url?: string;
  };
  destination?: {
    code: string;
    code_icao?: string;
    code_iata?: string;
    code_lid?: string;
    timezone?: string;
    name?: string;
    city?: string;
    airport_info_url?: string;
  };
  departure_delay?: number;
  arrival_delay?: number;
  filed_ete?: number;
  scheduled_out?: string;
  estimated_out?: string;
  actual_out?: string;
  scheduled_off?: string;
  estimated_off?: string;
  actual_off?: string;
  scheduled_on?: string;
  estimated_on?: string;
  actual_on?: string;
  scheduled_in?: string;
  estimated_in?: string;
  actual_in?: string;
  progress_percent?: number;
  status?: string;
  aircraft_type?: string;
  route_distance?: number;
  filed_airspeed?: number;
  filed_altitude?: number;
  route?: string;
  baggage_claim?: string;
  seats_cabin_business?: number;
  seats_cabin_coach?: number;
  seats_cabin_first?: number;
  gate_origin?: string;
  gate_destination?: string;
  terminal_origin?: string;
  terminal_destination?: string;
  type?: string;
}

interface FlightAwareSearchResponse {
  flights: FlightAwareFlight[];
  links?: {
    next?: string;
  };
  num_pages?: number;
}

interface FlightAwareDeparturesResponse {
  departures: FlightAwareFlight[];
  links?: {
    next?: string;
  };
  num_pages?: number;
}

export class FlightAwareClient implements IFlightApiClient {
  public readonly name = "FlightAware";
  public readonly priority = 95; // Highest priority
  public readonly reliability = 0.95; // Excellent reliability

  private readonly baseUrl = "https://aeroapi.flightaware.com/aeroapi";
  private readonly apiKey: string;
  private readonly timeout = 15000; // 15 seconds

  constructor(apiKey: string) {
    if (!apiKey) {
      throw new Error("FlightAware API key is required");
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
    console.log(`[FlightAware] Fetching flight data for ${flightNumber}`);

    try {
      // Try multiple search strategies
      let flight = await this.searchByFlightIdent(flightNumber);

      if (!flight) {
        flight = await this.searchByQuery(flightNumber);
      }

      if (!flight) {
        console.log(`[FlightAware] No flight data found for ${flightNumber}`);
        return null;
      }

      const canonicalData = this.transformToCanonical(flight);
      console.log(
        `[FlightAware] Successfully fetched data for ${flightNumber}`,
      );
      return canonicalData;
    } catch (error) {
      console.error(
        `[FlightAware] Error fetching flight ${flightNumber}:`,
        error,
      );
      return null;
    }
  }

  /**
   * Search for flight by flight identifier.
   */
  private async searchByFlightIdent(
    flightNumber: string,
  ): Promise<FlightAwareFlight | null> {
    try {
      const url = `${this.baseUrl}/flights/search`;
      const response = await axios.get(url, {
        params: { query: `-ident ${flightNumber}`, max_pages: "1" },
        headers: {
          "x-apikey": this.apiKey,
          Accept: "application/json",
          "User-Agent": "Triggerr-FlightAggregator/1.0",
        },
        timeout: this.timeout,
      });

      if (response.status !== 200) {
        console.warn(
          `[FlightAware] Search by ident failed: ${response.status}`,
        );
        return null;
      }

      const data: FlightAwareSearchResponse = response.data;

      if (!data.flights || data.flights.length === 0) {
        return null;
      }

      // Return the most recent flight
      return data.flights[0];
    } catch (error) {
      console.warn(`[FlightAware] Search by ident error:`, error);
      return null;
    }
  }

  /**
   * Search for flight using general query.
   */
  private async searchByQuery(
    flightNumber: string,
  ): Promise<FlightAwareFlight | null> {
    try {
      const url = `${this.baseUrl}/flights/search`;
      const response = await axios.get(url, {
        params: { query: flightNumber, max_pages: "1" },
        headers: {
          "x-apikey": this.apiKey,
          Accept: "application/json",
          "User-Agent": "Triggerr-FlightAggregator/1.0",
        },
        timeout: this.timeout,
      });

      if (response.status !== 200) {
        console.warn(`[FlightAware] General search failed: ${response.status}`);
        return null;
      }

      const data: FlightAwareSearchResponse = response.data;

      if (!data.flights || data.flights.length === 0) {
        return null;
      }

      // Find best match for the flight number
      const exactMatch = data.flights.find(
        (f) =>
          f.ident === flightNumber ||
          f.ident_iata === flightNumber ||
          f.ident_icao === flightNumber,
      );

      return exactMatch || data.flights[0];
    } catch (error) {
      console.warn(`[FlightAware] General search error:`, error);
      return null;
    }
  }

  /**
   * Check if the FlightAware API is available.
   */
  async isAvailable(): Promise<boolean> {
    try {
      const response = await axios.get(`${this.baseUrl}/flights/search`, {
        params: { query: "*", max_pages: "1" },
        headers: {
          "x-apikey": this.apiKey,
          Accept: "application/json",
          "User-Agent": "Triggerr-FlightAggregator/1.0",
        },
        timeout: 5000,
      });

      return response.status === 200;
    } catch (error) {
      console.warn(`[FlightAware] Health check failed:`, error);
      return false;
    }
  }

  /**
   * Transform FlightAware flight data to canonical format.
   */
  private transformToCanonical(flight: FlightAwareFlight): CanonicalFlightData {
    const now = new Date().toISOString();

    // Determine flight status
    const status = this.mapFlightStatus(flight);

    // Create source contribution record
    const sourceContributions: SourceContributions = [
      {
        source: "flightaware",
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
        sourceId: flight.fa_flight_id,
        apiVersion: "aeroapi-v4",
      },
    ];

    // Add additional fields if available
    if (flight.actual_out)
      sourceContributions[0].fields.push("actualDepartureTimestampUTC");
    if (flight.actual_in)
      sourceContributions[0].fields.push("actualArrivalTimestampUTC");
    if (flight.estimated_out)
      sourceContributions[0].fields.push("estimatedDepartureTimestampUTC");
    if (flight.estimated_in)
      sourceContributions[0].fields.push("estimatedArrivalTimestampUTC");
    if (flight.departure_delay !== undefined)
      sourceContributions[0].fields.push("departureDelayMinutes");
    if (flight.arrival_delay !== undefined)
      sourceContributions[0].fields.push("arrivalDelayMinutes");

    // Calculate data quality score
    const qualityScore = this.calculateQualityScore(flight);

    const canonicalData: CanonicalFlightData = {
      id: crypto.randomUUID(),
      flightNumber: flight.ident_iata || flight.ident_icao || flight.ident,
      airlineIataCode: flight.operator_iata || undefined,
      airlineIcaoCode: flight.operator_icao || undefined,
      originAirportIataCode:
        flight.origin?.code_iata || flight.origin?.code || "UNKNOWN",
      originAirportIcaoCode: flight.origin?.code_icao || undefined,
      destinationAirportIataCode:
        flight.destination?.code_iata || flight.destination?.code || "UNKNOWN",
      destinationAirportIcaoCode: flight.destination?.code_icao || undefined,
      aircraftTypeIcaoCode: flight.aircraft_type || undefined,
      scheduledDepartureTimestampUTC: this.parseTimestamp(flight.scheduled_out),
      scheduledArrivalTimestampUTC:
        this.parseTimestamp(flight.scheduled_in) || undefined,
      actualDepartureTimestampUTC: flight.actual_out
        ? this.parseTimestamp(flight.actual_out)
        : undefined,
      actualArrivalTimestampUTC: flight.actual_in
        ? this.parseTimestamp(flight.actual_in)
        : undefined,
      estimatedDepartureTimestampUTC: flight.estimated_out
        ? this.parseTimestamp(flight.estimated_out)
        : undefined,
      estimatedArrivalTimestampUTC: flight.estimated_in
        ? this.parseTimestamp(flight.estimated_in)
        : undefined,
      flightStatus: status,
      departureDelayMinutes: flight.departure_delay || undefined,
      arrivalDelayMinutes: flight.arrival_delay || undefined,
      cancelledAt: flight.cancelled ? now : undefined,
      divertedTo: flight.diverted ? flight.destination?.code : undefined,
      divertedAt: flight.diverted ? now : undefined,
      gate: flight.gate_origin || flight.gate_destination || undefined,
      terminal:
        flight.terminal_origin || flight.terminal_destination || undefined,
      sourceContributions,
      dataQualityScore: qualityScore,
      lastUpdatedUTC: now,
      createdAt: now,
      updatedAt: now,
    };

    return canonicalData;
  }

  /**
   * Map FlightAware flight status to standard format.
   */
  private mapFlightStatus(flight: FlightAwareFlight): StandardFlightStatus {
    // FlightAware uses multiple fields to determine status
    if (flight.cancelled) return "CANCELLED";
    if (flight.diverted) return "DIVERTED";

    if (flight.actual_in) return "LANDED";
    if (flight.actual_out) return "DEPARTED";

    if (flight.status) {
      const normalizedStatus = flight.status.toLowerCase().trim();
      switch (normalizedStatus) {
        case "scheduled":
          return "SCHEDULED";
        case "filed":
          return "SCHEDULED";
        case "departed":
          return "DEPARTED";
        case "en route":
        case "enroute":
          return "ACTIVE";
        case "arrived":
        case "landed":
          return "LANDED";
        case "cancelled":
          return "CANCELLED";
        case "delayed":
          return "DELAYED";
        default:
          console.warn(`[FlightAware] Unknown flight status: ${flight.status}`);
      }
    }

    // Determine status from progress
    if (flight.progress_percent !== undefined) {
      if (flight.progress_percent >= 100) return "LANDED";
      if (flight.progress_percent > 0) return "ACTIVE";
    }

    // Default to scheduled if we have scheduled times
    if (flight.scheduled_out) return "SCHEDULED";

    return "UNKNOWN";
  }

  /**
   * Parse timestamp string to ISO format.
   */
  private parseTimestamp(timestamp: string | undefined): string {
    if (!timestamp) {
      return new Date().toISOString();
    }

    try {
      const date = new Date(timestamp);
      if (isNaN(date.getTime())) {
        throw new Error("Invalid date");
      }
      return date.toISOString();
    } catch (error) {
      console.warn(`[FlightAware] Failed to parse timestamp: ${timestamp}`);
      return new Date().toISOString();
    }
  }

  /**
   * Calculate data quality score based on available fields.
   */
  private calculateQualityScore(flight: FlightAwareFlight): number {
    let score = 0;
    let maxScore = 0;

    // Required fields (weight: 2)
    const requiredFields = [
      { field: flight.ident || flight.ident_iata, weight: 2 },
      { field: flight.origin?.code, weight: 2 },
      { field: flight.destination?.code, weight: 2 },
      { field: flight.scheduled_out, weight: 2 },
    ];

    // Important fields (weight: 1)
    const importantFields = [
      { field: flight.scheduled_in, weight: 1 },
      { field: flight.operator_iata || flight.operator_icao, weight: 1 },
      { field: flight.actual_out, weight: 1 },
      { field: flight.actual_in, weight: 1 },
      { field: flight.aircraft_type, weight: 1 },
    ];

    // Calculate score
    [...requiredFields, ...importantFields].forEach(({ field, weight }) => {
      maxScore += weight;
      if (field) score += weight;
    });

    // Add bonus for additional data
    if (flight.registration) score += 0.5;
    if (flight.gate_origin || flight.gate_destination) score += 0.5;
    if (flight.terminal_origin || flight.terminal_destination) score += 0.5;
    if (flight.progress_percent !== undefined) score += 0.5;

    maxScore += 2.0; // Account for bonus fields

    return Math.min(1.0, score / maxScore);
  }
}
