/**
 * @file integrations.ts
 * @description This file contains shared interfaces and types for external API integrations.
 *
 * By centralizing these interfaces here, we decouple our core services (like aggregators)
 * from the concrete implementations of the API clients, preventing circular dependencies.
 */

import type {
  CanonicalFlightData,
  CanonicalWeatherObservation,
} from "../models/canonical-models";

/**
 * Generic interface for all flight data API clients.
 * Every flight adapter (FlightAware, OpenSky, etc.) must implement this interface.
 */
export interface IFlightApiClient {
  /** The unique name of the API provider (e.g., "flightaware"). */
  name: string;
  /** The priority of this client in the source router (higher is better). */
  priority: number;
  /** A score from 0.0 to 1.0 indicating the client's historical reliability. */
  reliability: number;
  /**
   * Fetches flight data and transforms it into our canonical model.
   * @param flightNumber The flight number to look up.
   * @param date The ISO date string for the flight.
   * @returns A promise that resolves to the canonical flight data or null if not found.
   */
  fetchFlight(
    flightNumber: string,
    date?: string,
  ): Promise<CanonicalFlightData | null>;
  /**
   * Checks if the API client is currently available and responsive.
   * @returns A promise that resolves to true if the service is healthy, false otherwise.
   */
  isAvailable(): Promise<boolean>;
}

/**
 * Generic interface for all weather data API clients.
 * Every weather adapter (GoogleWeather, etc.) must implement this interface.
 */
export interface IWeatherApiClient {
  /** The unique name of the API provider (e.g., "google-weather"). */
  name: string;
  /** The priority of this client in the source router (higher is better). */
  priority: number;
  /**
   * Fetches weather data for a specific location.
   * @param lat The latitude of the location.
   * @param lon The longitude of the location.
   * @returns A promise that resolves to the canonical weather data or null if not found.
   */
  fetchWeather(
    lat: number,
    lon: number,
  ): Promise<CanonicalWeatherObservation | null>;
  /**
   * Checks if the API client is currently available and responsive.
   * @returns A promise that resolves to true if the service is healthy, false otherwise.
   */
  isAvailable(): Promise<boolean>;
}
