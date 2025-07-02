/**
 * OpenSky API Client Adapter
 *
 * This adapter integrates with the OpenSky Network API to fetch aircraft state data
 * and transform it into our canonical data format. OpenSky provides real-time aircraft
 * tracking data but has limited scheduled flight information.
 *
 * API Documentation: https://opensky-network.org/apidoc/
 */

import type {
  CanonicalFlightData,
  StandardFlightStatus,
  SourceContributions,
} from "@triggerr/shared/models/canonical-models";
import type { IFlightApiClient } from "@triggerr/shared/types/integrations";

interface OpenSkyState {
  time: number;
  states: Array<
    [
      string, // 0: icao24
      string, // 1: callsign
      string, // 2: origin_country
      number, // 3: time_position
      number, // 4: last_contact
      number, // 5: longitude
      number, // 6: latitude
      number, // 7: baro_altitude
      boolean, // 8: on_ground
      number, // 9: velocity
      number, // 10: true_track
      number, // 11: vertical_rate
      number[], // 12: sensors
      number, // 13: geo_altitude
      string, // 14: squawk
      boolean, // 15: spi
      number, // 16: position_source
    ]
  >;
}

interface OpenSkyFlightInfo {
  icao24: string;
  firstSeen: number;
  estDepartureAirport: string;
  lastSeen: number;
  estArrivalAirport: string;
  callsign: string;
  estDepartureAirportHorizDistance: number;
  estDepartureAirportVertDistance: number;
  estArrivalAirportHorizDistance: number;
  estArrivalAirportVertDistance: number;
  departureAirportCandidatesCount: number;
  arrivalAirportCandidatesCount: number;
}

export class OpenSkyClient implements IFlightApiClient {
  public readonly name = "OpenSky";
  public readonly priority = 75; // Lower priority - limited flight schedule data
  public readonly reliability = 0.75; // Good for real-time data, limited for schedules

  private readonly baseUrl = "https://opensky-network.org/api";
  private readonly username?: string;
  private readonly password?: string;
  private readonly timeout = 20000; // 20 seconds (OpenSky can be slower)

  constructor(username?: string, password?: string) {
    this.username = username;
    this.password = password;

    if (username && password) {
      console.log(
        `[OpenSky] Initialized with authentication for user: ${username}`,
      );
    } else {
      console.log(`[OpenSky] Initialized in anonymous mode (limited requests)`);
    }
  }

  /**
   * Fetch flight data for a specific flight number.
   * Note: OpenSky is primarily for real-time tracking, so flight schedule data is limited.
   */
  async fetchFlight(
    flightNumber: string,
    date?: string,
  ): Promise<CanonicalFlightData | null> {
    console.log(`[OpenSky] Fetching flight data for ${flightNumber}`);

    try {
      // Try to find aircraft by callsign first
      const aircraft = await this.findAircraftByCallsign(flightNumber);

      if (!aircraft) {
        // Try to find recent flight information
        const flightInfo = await this.searchFlightHistory(flightNumber);
        if (flightInfo) {
          return this.transformFlightInfoToCanonical(flightInfo, flightNumber);
        }

        console.log(`[OpenSky] No flight data found for ${flightNumber}`);
        return null;
      }

      const canonicalData = this.transformStateToCanonical(
        aircraft,
        flightNumber,
      );
      console.log(`[OpenSky] Successfully fetched data for ${flightNumber}`);
      return canonicalData;
    } catch (error) {
      console.error(`[OpenSky] Error fetching flight ${flightNumber}:`, error);
      return null;
    }
  }

  /**
   * Find aircraft by callsign in current states.
   */
  private async findAircraftByCallsign(
    callsign: string,
  ): Promise<any[] | null> {
    try {
      const url = new URL(`${this.baseUrl}/states/all`);

      // Add authentication if available
      if (this.username && this.password) {
        url.searchParams.set("username", this.username);
        url.searchParams.set("password", this.password);
      }

      const response = await fetch(url.toString(), {
        method: "GET",
        headers: {
          Accept: "application/json",
          "User-Agent": "Triggerr-FlightAggregator/1.0",
        },
        signal: AbortSignal.timeout(this.timeout),
      });

      if (!response.ok) {
        console.warn(`[OpenSky] States API error: ${response.status}`);
        return null;
      }

      const data: OpenSkyState = await response.json();

      if (!data.states || data.states.length === 0) {
        return null;
      }

      // Find aircraft with matching callsign
      const normalizedCallsign = callsign.toUpperCase().trim();
      const matchingAircraft = data.states.find((state) => {
        const aircraftCallsign = state[1]?.trim().toUpperCase();
        return aircraftCallsign === normalizedCallsign;
      });

      return matchingAircraft || null;
    } catch (error) {
      console.warn(`[OpenSky] Error searching by callsign:`, error);
      return null;
    }
  }

  /**
   * Search for flight history information.
   */
  private async searchFlightHistory(
    flightNumber: string,
  ): Promise<OpenSkyFlightInfo | null> {
    // OpenSky's flight history requires authentication and specific aircraft ICAO24
    // For MVP, we'll skip this complex lookup
    console.log(
      `[OpenSky] Flight history search not implemented for ${flightNumber}`,
    );
    return null;
  }

  /**
   * Check if the OpenSky API is available.
   */
  async isAvailable(): Promise<boolean> {
    try {
      const url = new URL(`${this.baseUrl}/states/all`);

      // Add authentication if available
      if (this.username && this.password) {
        url.searchParams.set("username", this.username);
        url.searchParams.set("password", this.password);
      }

      // Limit request to reduce load
      url.searchParams.set("lamin", "45");
      url.searchParams.set("lomin", "5");
      url.searchParams.set("lamax", "47");
      url.searchParams.set("lomax", "10");

      const response = await fetch(url.toString(), {
        method: "GET",
        headers: {
          Accept: "application/json",
          "User-Agent": "Triggerr-FlightAggregator/1.0",
        },
        signal: AbortSignal.timeout(5000),
      });

      return response.ok;
    } catch (error) {
      console.warn(`[OpenSky] Health check failed:`, error);
      return false;
    }
  }

  /**
   * Transform OpenSky aircraft state to canonical format.
   */
  private transformStateToCanonical(
    state: any[],
    flightNumber: string,
  ): CanonicalFlightData {
    const now = new Date().toISOString();

    // Extract data from state array
    const icao24 = state[0];
    const callsign = state[1]?.trim() || flightNumber;
    const originCountry = state[2];
    const longitude = state[5];
    const latitude = state[6];
    const altitude = state[7]; // meters
    const onGround = state[8];
    const velocity = state[9]; // m/s
    const trueTrack = state[10]; // degrees

    // Determine flight status from state
    const status = this.determineFlightStatus(onGround, velocity);

    // Create source contribution record
    const sourceContributions: SourceContributions = [
      {
        source: "opensky",
        fields: ["flightNumber", "flightStatus"],
        timestamp: now,
        confidence: this.reliability,
        sourceId: icao24,
        apiVersion: "v1",
      },
    ];

    // Calculate data quality score (will be lower due to limited schedule data)
    const qualityScore = this.calculateQualityScore(state);

    const canonicalData: CanonicalFlightData = {
      id: crypto.randomUUID(),
      flightNumber: callsign,
      // OpenSky doesn't provide airline codes directly
      airlineIataCode: undefined,
      airlineIcaoCode: undefined,
      // OpenSky doesn't provide airport codes in state data
      originAirportIataCode: "UNKNOWN",
      originAirportIcaoCode: undefined,
      destinationAirportIataCode: "UNKNOWN",
      destinationAirportIcaoCode: undefined,
      aircraftTypeIcaoCode: undefined,
      // OpenSky doesn't provide scheduled times in state data
      scheduledDepartureTimestampUTC: now, // Fallback to current time
      scheduledArrivalTimestampUTC: undefined,
      actualDepartureTimestampUTC: undefined,
      actualArrivalTimestampUTC: undefined,
      estimatedDepartureTimestampUTC: undefined,
      estimatedArrivalTimestampUTC: undefined,
      flightStatus: status,
      departureDelayMinutes: undefined,
      arrivalDelayMinutes: undefined,
      sourceContributions,
      dataQualityScore: qualityScore,
      lastUpdatedUTC: now,
      createdAt: now,
      updatedAt: now,
    };

    return canonicalData;
  }

  /**
   * Transform OpenSky flight info to canonical format.
   */
  private transformFlightInfoToCanonical(
    flightInfo: OpenSkyFlightInfo,
    flightNumber: string,
  ): CanonicalFlightData {
    const now = new Date().toISOString();

    // Create source contribution record
    const sourceContributions: SourceContributions = [
      {
        source: "opensky",
        fields: [
          "flightNumber",
          "originAirportIataCode",
          "destinationAirportIataCode",
          "scheduledDepartureTimestampUTC",
          "flightStatus",
        ],
        timestamp: now,
        confidence: this.reliability,
        sourceId: flightInfo.icao24,
        apiVersion: "v1",
      },
    ];

    const canonicalData: CanonicalFlightData = {
      id: crypto.randomUUID(),
      flightNumber: flightInfo.callsign || flightNumber,
      airlineIataCode: undefined,
      airlineIcaoCode: undefined,
      originAirportIataCode: flightInfo.estDepartureAirport || "UNKNOWN",
      originAirportIcaoCode: undefined,
      destinationAirportIataCode: flightInfo.estArrivalAirport || "UNKNOWN",
      destinationAirportIcaoCode: undefined,
      aircraftTypeIcaoCode: undefined,
      scheduledDepartureTimestampUTC: new Date(
        flightInfo.firstSeen * 1000,
      ).toISOString(),
      scheduledArrivalTimestampUTC: new Date(
        flightInfo.lastSeen * 1000,
      ).toISOString(),
      actualDepartureTimestampUTC: undefined,
      actualArrivalTimestampUTC: undefined,
      estimatedDepartureTimestampUTC: undefined,
      estimatedArrivalTimestampUTC: undefined,
      flightStatus: "UNKNOWN", // Can't determine from historical data
      departureDelayMinutes: undefined,
      arrivalDelayMinutes: undefined,
      sourceContributions,
      dataQualityScore: 0.4, // Lower quality due to limited data
      lastUpdatedUTC: now,
      createdAt: now,
      updatedAt: now,
    };

    return canonicalData;
  }

  /**
   * Determine flight status from aircraft state.
   */
  private determineFlightStatus(
    onGround: boolean,
    velocity: number,
  ): StandardFlightStatus {
    if (onGround) {
      if (velocity > 5) {
        return "DEPARTED"; // Taxiing or taking off
      }
      return "SCHEDULED"; // On ground, stationary
    } else {
      if (velocity > 50) {
        return "ACTIVE"; // Flying
      }
      return "UNKNOWN"; // Airborne but slow/stationary
    }
  }

  /**
   * Calculate data quality score based on available fields.
   * OpenSky will have lower scores due to limited schedule information.
   */
  private calculateQualityScore(state: any[]): number {
    let score = 0;
    let maxScore = 10; // Lower max score for OpenSky

    // Basic fields available
    if (state[0]) score += 1; // ICAO24
    if (state[1]?.trim()) score += 2; // Callsign (most important for us)
    if (state[5] !== null && state[6] !== null) score += 1; // Position
    if (state[7] !== null) score += 1; // Altitude
    if (state[9] !== null) score += 1; // Velocity
    if (state[8] !== null) score += 1; // On ground status

    // OpenSky provides real-time data bonus
    score += 3; // Real-time bonus

    return Math.min(1.0, score / maxScore);
  }
}
