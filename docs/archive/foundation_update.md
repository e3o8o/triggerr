# Comprehensive Report: Foundation Updates for Data Independence, Flexibility & Seeding

**Date:** 2025-01-27
**Project:** triggerr
**Goal:** To outline all necessary updates to documentation (PRDs), Drizzle database schema, and conceptual code implementation to establish a **maximally robust foundation** supporting long-term data independence, flexible user input handling for flight searches, cost-effective API usage through data persistence, and comprehensive reference data seeding (including runways, regions, and routes from day one).

---

## I. Executive Summary

This report details the successful completion of the project's foundational data layer enhancements.

**Key Achievements:**

1.  **Comprehensive Reference Data Schema:** The Drizzle schema (`packages/core/database/schema.ts`) for all reference data tables (`countries`, `regions`, `airlines`, `airports`, `runways`, `aircraft_types`, `routes`) has been fully defined and implemented. This includes enhancements like timezone support for airports and robust relation definitions.
2.  **Enhanced Escrow Schema:** The `escrow` table schema was significantly updated (`packages/core/database/schema.ts`) to support both policy-based and user-wallet escrows, incorporating a type discriminator (`escrowType`), a purpose field (`purpose`), and correctly nullable foreign keys (`userId`, `policyId`, `providerId`).
3.  **Comprehensive Seeding Script:** A robust and comprehensive seeding script (`packages/core/database/seed.ts`) has been developed and successfully executed. This script populates all reference data tables using external files, incorporating fixes for parsing, data integrity, dependency issues, and large data insertion batching.
4.  **Successful Data Population:** The database is now successfully populated with a rich set of reference data (~249 Countries, ~3,929 Regions, ~5,731 Airlines, 231 Aircraft Types, ~9,079 Airports, ~10,115 Runways, 64,100 Routes), providing a solid data foundation for MVP development.
5.  **Row Level Security (RLS) Implementation:** Comprehensive RLS policies have been implemented (`packages/core/database/RLS_sql.txt`) supporting an anonymous access model where unauthenticated users can search flights, view reference data, and get quotes, while authentication is required only for policy purchases and user data management. This security model enables public quote generation while maintaining data protection.
6.  **Resolved Implementation Issues:** Key technical challenges encountered during schema implementation and seeding, including parsing errors, large batch insert failures ("bind message" errors), and database function issues (e.g., `generate_ulid`), have been diagnosed and resolved.
7.  **Basic Application Data Seeding:** Initial application setup data (Users, Providers, Provider Products, Flight Data Sources) has also been successfully seeded.

These completed tasks establish a critical data layer and security foundation necessary for building and testing the core MVP features, enabling reduced reliance on external APIs, improved data quality, support for planned functionalities like user-wallet escrows, and a user-friendly anonymous quote generation experience that converts to authenticated purchases.

---

## II.A. Insights from API Test Scripts & Impact on Data Models/Schema

Analysis of the provided `working_tests` scripts (`testAviationstack.js`, `testFlightAware.js`, `testOpensky.js`, `testWeather.js`) and their execution outputs offers crucial, concrete details about the data available from each external API. These insights directly inform and refine our data foundation strategy, particularly concerning data modeling, schema design, and persistence.

**Key Learnings & Implications:**

1.  **Available Data Points & Richness:**
    *   **AviationStack:** Provides core flight details (IATA/ICAO, status, scheduled times, delays, aircraft registration/model), airline info (IATA/ICAO, fleet size), and airport data (name, IATA/ICAO, city, country). *Note: Output indicates some fields can be `N/A`, emphasizing the need for robust `NULL` handling in our schema and normalization logic. Free tier is real-time flights only.*
    *   **FlightAware:** Offers very rich data, including detailed airport information (IATA/ICAO, name, city, state, lat/lon, **timezone**, country code), comprehensive flight event timestamps (scheduled, estimated, actual for gate out/off runway, runway on/in gate), runway usage (`actual_runway_off/on`), and its own `fa_flight_id`. *Note: FlightAware's direct timezone data is highly valuable for airport seeding/enrichment.*
    *   **OpenSky Network:** Delivers live tracking data (ICAO24, callsign, origin country, lat/lon, altitude, velocity, heading). *Note: Historical flight endpoint showed unreliability in tests (500 error), underscoring need for fallback strategies.*
    *   **Google Weather (Example):** Provides detailed daily forecasts including min/max/feels-like temperatures, day/night conditions (description, type, precipitation probability, humidity, wind), and sun/moon events.

2.  **Impact on Canonical Data Models (`PRD-CORE-003`):**
    *   **`CanonicalFlightDataModel`**: Must be comprehensive to accommodate the union of fields from all sources. Specific considerations:
        *   Multiple timestamp fields for various flight events (gate-to-gate, runway-to-runway from sources like FlightAware).
        *   Dedicated fields for `runway_departure_actual` and `runway_arrival_actual`.
        *   Storage for source-specific unique identifiers like `fa_flight_id`.
        *   Aircraft details including registration and model.
        *   Live tracking attributes.
        *   The `sourceContributions` array is vital for tracking data provenance.
    *   **`CanonicalWeatherObservationModel`**: Needs to be flexible. For MVP, it might focus on point-in-time observations relevant to flight times. For long-term storage of richer forecast data (like Google Weather's daily structure), the model or a related entity might need to store daily summarized forecasts (min/max temps, primary conditions for day/night, etc.), or rely on storing the raw JSON from the API.

3.  **Impact on Drizzle Schema (`packages/core/database/schema.ts`):**
    *   **`airports` Table**: Should be enhanced to store all rich data points available from FlightAware (city, state, lat/lon, country code, and especially the direct `timezoneOlson` string).
    *   **`airlines` Table**: Can be enriched with `fleet_size` and `headquarters` (from AviationStack).
    *   **`historical_flight_segments` Table**:
        *   Must include columns for the extensive timestamps provided by FlightAware (e.g., `gate_departure_scheduled_utc`, `runway_takeoff_actual_utc`, etc.).
        *   Should have optional fields for `flight_aware_flight_id` or other source-specific flight instance IDs.
        *   Include `runway_departure_actual` and `runway_arrival_actual` columns.
    *   **`historical_weather_observations` Table**:
        *   The schema needs to decide whether to store point-in-time observations (simpler for MVP) or a more complex structure for daily forecast summaries if that level of detail from sources like Google Weather is to be persistently stored in a structured way. Storing the `rawApiSnapshot` (JSONB) provides flexibility.
    *   **`runways` Table**: Data from FlightAware (`actual_runway_off/on` for operational flights) can enrich live flight data. The full `runways.csv` seeding provides foundational data for potential future risk analysis.

4.  **Data Normalization & Persistence Strategy (`PRD-DATA-001`, `PRD-DATA-004`):**
    *   The variability in data fields (e.g., `N/A` values from AviationStack) means normalization logic in the `FlightDataAggregator` must be robust in handling missing or partial data, mapping it to `NULL` where appropriate in the canonical model and database.
    *   The value of storing `rawApiSnapshot` in `historical_flight_segments` and `historical_weather_observations` (or via `raw_api_call_logs`) is reinforced, allowing for future reprocessing as normalization logic or data needs evolve.

5.  **Seeding Strategy Considerations:**
    *   The `airports` table seeding can be significantly enhanced by using FlightAware's API to fetch details for airports obtained from `airports.csv`/`.dat`, especially for `timezoneOlson` and other specific fields, if API rate limits allow for such an enrichment process during or after the initial bulk seed.

These learnings from the test scripts provide concrete details that refine, rather than radically alter, the previously outlined comprehensive data foundation strategy. They help ensure our schemas and models are practical and can handle real-world API outputs.

---

## II.B. Product Requirements Document (PRD) Updates

The following PRDs require specific updates to align with the new data strategy:

### 1. `PRD-DATA-004: Data Persistence & Caching Strategy` (CRITICAL UPDATE)

*   **File:** `triggerr/docs/PRDs/PRD-DATA-004-Data-Persistence-Caching.md`
*   **Objective:** Shift focus from primarily caching to include robust long-term persistent storage of API data.
*   **Key Updates:**
    *   **Rename/Restructure Section on "L4: Persistent Store (Long-term)" to "Persistent Data Store Strategy (Long-Term API Data)"**:
        *   Clearly differentiate this from short/medium-term caching layers.
        *   Reiterate goals: data independence, historical analysis, ML datasets, cost reduction, compliance.
    *   **NEW Section: "Persistent Data Store Schema Definitions"**:
        *   Detail Drizzle table schemas for:
            *   `historical_flight_segments`: For normalized flight leg data (flight numbers, airports, various timestamps (scheduled, actual, estimated from sources like FlightAware), status history, delays, aircraft details (including registration/model from AviationStack), API source identifiers, source-specific IDs like `fa_flight_id`, fetched timestamps). Include `raw_data_snapshot JSONB` (optional) per source for full fidelity.
            *   `historical_weather_observations`: For normalized weather data (airport IATA, observation time, temperature, wind, precipitation, conditions, API source, fetched timestamp). For daily forecasts (like Google Weather), decide on storing key summary fields or relying on `raw_data_snapshot JSONB`.
            *   `raw_api_call_logs` (Recommended): Table to log outgoing calls to external APIs and their raw responses (request, response, timestamp, status).
        *   Specify primary keys, foreign keys (to `airports`, `airlines`, `countries`), and indexes.
    *   **NEW Section: "Data Ingestion Workflow for Persistent Store"**:
        *   Describe how normalized canonical data from `FlightDataAggregator` and `WeatherAggregator` is ingested into `historical_flight_segments` and `historical_weather_observations`.
        *   Define rules for data updates (e.g., on new status for a flight segment) vs. new record creation.
        *   Specify if/how raw API responses are stored in `raw_api_call_logs`.
    *   **NEW Section: "Data Retention and Archival Policies"**:
        *   Define initial retention periods for historical segments, weather data, and raw API logs.
        *   Note future considerations for archival to colder, cheaper storage.
    *   **Update Section: "Integration Points"**:
        *   Emphasize that services like `QuoteEngine` and the `DataRouter` will prioritize querying this internal persistent store before external API calls.

### 2. `PRD-CORE-003: Shared Types & Validation Schemas`

*   **File:** `triggerr/docs/PRDs/PRD-CORE-003-Shared-Types-Validation.md`
*   **Objective:** Define the canonical data models and types for handling diverse user inputs.
*   **Key Updates:**
    *   **NEW Section (or enhance existing): "Canonical Data Models"**:
        *   **`CanonicalFlightDataModel` (TypeScript Interface):** Define the structure for unified flight data. Fields to include: `flightIdentifier` (e.g., internal ULID), `iataFlightNumber`, `icaoFlightNumber`, `airlineIcaoCode` (FK to `airlines`), `airlineName`, `originAirportIataCode` (FK to `airports`), `originAirportName`, `originCity`, `originRegionCode`, `originCountryIsoCode` (FK to `countries`), `destinationAirportIataCode` (FK to `airports`), `destinationAirportName`, `destinationCity`, `destinationRegionCode`, `destinationCountryIsoCode` (FK to `countries`), comprehensive scheduled/actual/estimated timestamps for gate and runway events (informed by FlightAware), `departureTerminal`, `departureGate`, `arrivalTerminal`, `arrivalGate`, `status` (standardized enum), `departureDelayMinutes`, `arrivalDelayMinutes`, `aircraftIcaoCode` (FK to `aircraft_types`), `aircraftRegistration`, `livePosition` (lat, lon, alt, speed, heading), `runwayDepartureActual`, `runwayArrivalActual`, `flightAwareFlightId` (optional), `routeDetails` (e.g., number of stops, equipment from `routes.dat`), `sourceContributions` (array detailing original API source, timestamp, confidence for key data points).
        *   **`CanonicalWeatherObservationModel` (TypeScript Interface):** Define structure for normalized weather data (airport IATA, observation time, temp, wind, precip, condition code, source API). For daily forecasts, specify if storing summary fields or relying on raw JSON.
    *   **NEW Section: "User Flight Search Input Processing Types"**:
        *   Define types like `FlightSearchInput` to represent the lifecycle of a user's query:
            ```typescript
            interface FlightSearchInput {
              originalQuery: string;
              detectedType: 'FLIGHT_NUMBER' | 'AIRPORT_ROUTE_IATA' | 'CITY_ROUTE_NAME' | 'DESTINATION_SEARCH' | 'AIRPORT_SCHEDULE' | 'UNSPECIFIED' | 'ERROR';
              normalizedParameters?: { // Populated after normalization
                flightNumber?: string;
                originAirportIatas?: string[];
                destinationAirportIatas?: string[];
                date?: string; // YYYY-MM-DD
                dateRange?: { from?: string; to?: string };
                // ... other relevant structured parameters
              };
              errorMessage?: string; // If parsing/normalization fails
            }
            ```

### 3. `PRD-DATA-001: Flight Data Aggregator`

*   **File:** `triggerr/docs/PRDs/PRD-DATA-001-Flight-Data-Aggregator.md`
*   **Objective:** Ensure clear output and data flow to the new persistence layer.
*   **Key Updates:**
    *   **Output Specification**: Explicitly state the aggregator outputs data conforming to `CanonicalFlightDataModel`.
    *   **Normalization Rules**: Provide more examples/details of mapping from various sources (AviationStack, FlightAware, OpenSky) to the `CanonicalFlightDataModel`, including handling of `N/A` or missing fields.
    *   **Data Flow to Persistence**: Mandate that the aggregator sends the canonical data (and optionally raw source data for `raw_api_call_logs`) to the Data Persistence Layer/Service for storage in the historical tables.
    *   **Conflict Resolution & Confidence Scoring**: Elaborate on how conflicting data from sources is resolved and how confidence scores for data points are determined and included in `sourceContributions`.

### 4. `PRD-DATA-003: Data Router & Source Management`

*   **File:** `triggerr/docs/PRDs/PRD-DATA-003-Data-Router-Source-Management.md`
*   **Objective:** Prioritize internal data stores.
*   **Key Updates:**
    *   **Query Prioritization Logic**: Modify the decision flow to explicitly:
        1.  Query Internal Persistent Store (e.g., `historical_flight_segments`, `historical_weather_observations`, `routes`) first.
        2.  If data is insufficient, not found, or real-time is mandated, then proceed to query External APIs (via the Aggregator).
    *   **Cost Optimization Section**: Expand on how this internal-first approach directly leads to reduced external API calls and costs.

### 5. Integration PRDs (`PRD-INTEGRATION-001` to `004`)

*   **Files:** `triggerr/docs/PRDs/PRD-INTEGRATION-001-AviationStack.md`, etc.
*   **Objective:** Ensure comprehensive data capture for long-term storage.
*   **Key Updates:**
    *   **NEW Section: "Data Points for Persistent Storage"**: For each API, list all data fields that should be retrieved by the client and passed to the aggregator. Emphasize capturing all useful data from free tiers to build a rich historical dataset. *Refer to actual API responses from test scripts (e.g., `testAviationstack.js`, `testFlightAware.js`) to ensure all valuable fields like detailed timestamps, runway usage, aircraft registration, fleet size, headquarters, and specific weather forecast structures are considered for capture.*

### 6. `PRD-API-001: Public API Specification`

*   **File:** `triggerr/docs/PRDs/PRD-API-001-Public-API-Specification.md`
*   **Objective:** Detail handling of diverse user search inputs.
*   **Key Updates:**
    *   **Flight Search Endpoint(s) Description**:
        *   Detail how various input strings (flight numbers, "JFK > LHR", "New York to London", "flights to LAX on [date]") are parsed and normalized by the backend (potentially using the new `InputNormalizer` utility).
        *   Mention that this normalization may involve geocoding (for city names) and lookups against internal `airports`, `regions`, and `countries` reference tables.
        *   State that the backend logic will prioritize fetching data from internal historical and route stores before resorting to live external API calls.

### 7. `PRD-CORE-001: Database Schema & Data Models`

*   **File:** `triggerr/docs/PRDs/PRD-CORE-001-Database-Schema-Data-Models.md`
*   **Objective:** Document all new tables for data persistence and full reference data.
*   **Key Updates:**
    *   Add schema definitions and descriptions (or references to `schema.ts`) for:
        *   `historical_flight_segments`
        *   `historical_weather_observations`
        *   `raw_api_call_logs` (if adopted)
        *   `countries`
        *   `regions`
        *   `airlines` (enhanced)
        *   `airports` (enhanced)
        *   `runways`
        *   `aircraft_types`
        *   `routes`
    *   Document the source of seed data for all reference tables and the strategy for combining files (e.g., for airports and countries).

### 8. `PROJECT_CONTEXT.md` (Review and Align)

*   **File:** `triggerr/docs/PROJECT_CONTEXT.md`
*   **Objective:** Ensure overall project context reflects these comprehensive foundational data strategy enhancements.
*   **Key Updates (verify after other PRDs are updated):**
    *   "Database Schema Overview": Reflect all new historical and reference tables.
    *   "Business Logic Flow" / New "Data Management Strategy" Section: Describe the data pipeline: External APIs -> API Clients -> Aggregator (Normalize) -> Persistent Store (Store Long-Term) -> Services (Query Internal First).
    *   "Critical Decisions Made": Add "Strategic decision to build and prioritize a comprehensive internal persistent data store and reference dataset from API data and public sources for long-term independence, advanced analytics, and cost optimization from day one."
    *   "✅ Completed": Once seeding is done, list "Comprehensive Reference Data Seeding (Airports, Airlines, Countries, Regions, Runways, Aircraft Types, Routes)".

---

## III.B. Drizzle Schema Updates (`triggerr/packages/core/database/schema.ts`)

*   **Status:** ✅ Reference Data Schema & Relations Complete. Historical Data Schema Defined.
*   **Objective:** Implement the complete database structure for data persistence and all reference data.
*   **Key Actions:**

    All schema definitions, including tables for reference data (`countries`, `regions`, `airlines`, `airports`, `runways`, `aircraft_types`, `routes`), historical data persistence (`historical_flight_segments`, `historical_weather_observations`, `raw_api_call_logs`), and the core operational tables (users, policies, etc.), are fully implemented in `packages/core/database/schema.ts`.

    Key updates and enhancements completed during this phase include:

    1.  **Comprehensive Reference Data Tables:**
        Schemas for all required reference data tables have been defined with appropriate fields, primary keys, unique constraints, and foreign key relationships. These structures support the data derived from sources like OurAirports and OpenFlights.

    2.  **Enhanced `airport` Table:**
        The `airport` schema was enhanced to include a nullable `timezoneOlson` field and a boolean `scheduledService` field, providing flexibility for the variety of data available in source files.

    3.  **Historical Data Persistence Tables:**
        Schemas for `historical_flight_segments` and `historical_weather_observations` are defined to capture normalized flight and weather data over time. The `raw_api_call_logs` table schema is also defined for storing raw API responses.

    4.  **Enhanced `escrow` Table for Multi-Model & User Escrows:**
        The existing `escrow` table schema was significantly updated to support the planned multi-escrow architecture and user-initiated wallet functions. Key updates include:
        - Addition of a `escrowType` column (`POLICY` | `USER_WALLET`) as a discriminator.
        - Addition of a `purpose` column (using a new `escrowPurposeEnum`) for categorizing user-wallet escrows.
        - Making the `userId`, `policyId`, and `providerId` foreign keys nullable to accommodate different escrow types not tied to all three.
        - Refined Drizzle relations to accurately reflect these new foreign key structures.

    5.  **Defined Drizzle Relations:**
        Comprehensive Drizzle relations (`*_relations`) have been defined across all tables (`users`, `providers`, `policies`, `escrows`, `airports`, `airlines`, etc.) to model the relationships between entities in the database.

    The complete, implemented schema can be found in `packages/core/database/schema.ts`. Migrations reflecting these changes have been generated and applied.
          requestTsIdx: index("log_request_ts_idx").on(table.requestTimestampUTC),
          statusIdx: index("log_status_idx").on(table.isSuccess),
        }));
        ```
    11. **Update `flights` Table (Operational Data):**
        *   Ensure `flights.aircraftType` is changed to `flights.aircraftIcaoCode` (VARCHAR(4)) and references `aircraftTypes.icaoCode`.
    12. **Define Drizzle Relations:** Explicitly define relations between all new and existing tables, ensuring consistency with foreign keys and using `relationName` for clarity where needed. *(This was largely covered in the previous schema update step, but needs final verification against all tables)*.

---

## IV.B. Reference Data Seeding Strategy (`triggerr/packages/core/database/seed.ts`)

*   **Status:** ✅ Comprehensive Seeding Script Developed & Successfully Executed.
*   **Objective:** Successfully populate Drizzle database with comprehensive reference data from day one.
*   **Implementation Summary:**
    The comprehensive seeding script in `packages/core/database/seed.ts` has been fully developed, rigorously debugged, and successfully executed. It now reliably populates all required reference data tables: `countries`, `regions`, `airlines`, `airports`, `runways`, `aircraft_types`, and `routes`.

*   **Key Challenges Overcome:**
    *   **Robust File Parsing:** The custom `.dat` file parser (`parseDatLine`) was enhanced to correctly handle quoted fields and `\\N` null values, resolving data corruption issues seen in tables like `airlines` and `aircraft_types`.
    *   **Relaxed Filtering & Data Integrity:** Filtering logic in `seedAirlinesFromFile` and `seedAirportsFromFiles` was adjusted to include more data (e.g., inactive airlines, airports without timezones) while ensuring data integrity and correct foreign key relationships.
    *   **Large Data Batching:** Implemented batch insertion logic using Drizzle's `db.insert(...).values(...).onConflict...` in chunks (e.g., 500 records) for `airports`, `runways`, and `routes`. This successfully resolved "bind message" errors that occurred when attempting to insert large datasets in a single transaction.
    *   **Database Function Compatibility:** The `generate_ulid()` PL/pgSQL function in the database was corrected to resolve the `set_byte(..., bigint)` error, allowing successful insertion into tables using ULID primary keys (like `routes`).

*   **Seeding Order & Dependencies:** The script correctly seeds tables respecting foreign key dependencies (e.g., `countries` before `regions` and `airlines`, `airports` before `runways`, `airports` and `airlines` before `routes`).
*   **Conflict Handling:** `onConflictDoUpdate` is used across reference tables for idempotent seeding.
*   **Current Data Counts (Example):** As of the last successful run, the database contains approximately:
    *   Countries: ~249
    *   Regions: ~3,929
    *   Airlines: ~5,731
    *   Aircraft Types: 231
    *   Airports: ~9,079
    *   Runways: ~10,115
    *   Routes: ~64,100

The code for the comprehensive seeding script can be found in `packages/core/database/seed.ts`.

---

## V.B. Code Implementation (Key Implemented Components)

*   **Status:** ✅ Seeding Script and Logger Utility Implemented. Other Components Pending.
*   **Overview:** This section highlights key code components developed or enhanced to support the robust data foundation.

1.  **Comprehensive Seeding Script (`packages/core/database/seed.ts`) - IMPLEMENTED**
    *   **Purpose:** Fully populate all reference data tables (`countries`, `regions`, `airlines`, `airports`, `runways`, `aircraft_types`, `routes`) from source files.
    *   **Key Implementation Details:** Includes robust file parsing, data validation, batching for large datasets, and dependency management. Detailed implementation can be found in the source file.

2.  **Logger Utility (`packages/core/logging/logger.ts`) - NEW UTILITY - IMPLEMENTED**
    *   **Purpose:** Provide structured and level-based logging across the application for improved monitoring and debugging, initially integrated into the seeding script.
    *   **Key Features:** Supports INFO, WARN, ERROR, DEBUG levels with timestamps.

3.  **Input Normalizer Utility (`packages/core/utils/input-normalizer.ts`) - NEW UTILITY - PENDING**
    *   **Purpose:** Standardize diverse user flight search queries.
    *   **Implementation Note:** Development of this utility is planned to leverage the seeded reference data (airports, regions, countries) for basic lookups.

4.  **External API Clients & Aggregators (`packages/integrations/`, `packages/aggregators/`) - PENDING**
    *   **Purpose:** Fetch, normalize, and prepare external flight and weather data for persistence and use by business logic.
    *   **Implementation Note:** These components will be developed to output data conforming to Canonical Data Models and feed the historical data persistence tables.

5.  **Data Persistence & Router Services (`packages/services/`) - PENDING**
    *   **Purpose:** Encapsulate database write operations for historical data and implement internal-first query logic leveraging the seeded reference and historical data.

---

## VI.B. Next Steps and Implementation Order

*   **Status:** Updated to reflect completed Data Foundation tasks.
*   **Priority Order:**

1.  **Update All Data-Related PRDs:** (`PRD-CORE-001`, `PRD-CORE-003`, `PRD-DATA-001`, `PRD-DATA-003`, `PRD-DATA-004`, `PRD-INTEGRATION-00X`, `PROJECT_CONTEXT.md`)
    *   Reflect all new schemas (including historical if defined), canonical models, data flows, and strategies established during the Data Foundation phase.
    *   Define Canonical Data Models in `PRD-CORE-003`.
    *   Detail persistence schemas & workflows in `PRD-DATA-004`.

2.  **Define Historical Data Persistence Schemas** (`packages/core/database/schema.ts`)
    *   Ensure schemas for `historical_flight_segments`, `historical_weather_observations`, and `raw_api_call_logs` are fully defined with relations and indexes. (If not completed in the previous phase).

3.  **Better-Auth Integration (Code Implementation)**
    *   Implement Next.js Middleware for route protection.
    *   Update API Routes to use Better-auth sessions.
    *   Update Frontend Auth Components for Better-auth client.

4.  **Develop Input Normalizer Utility (Basic Version):**
    *   Focus on detecting flight numbers, IATA airport routes, leveraging the seeded reference data.

5.  **Implement External API Clients:**
    *   Develop clients for AviationStack, FlightAware, OpenSky, and Weather APIs, ensuring they fetch required data points for persistence.

6.  **Enhance Aggregators:**
    *   Implement normalization to Canonical Models (`CanonicalFlightDataModel`, `CanonicalWeatherObservationModel`).
    *   Develop data flow logic to send normalized data to the persistence layer (historical tables).

7.  **Develop Data Persistence & Router Services:**
    *   Implement the `DataPersistenceService` (if abstracting DB writes) and the `DataRouter`'s internal-first query logic using the seeded historical and reference data.

8.  **Full Implementation of Aggregator Persistence:**
    *   Connect aggregators to the persistence layer to ensure all relevant historical data is captured.

9.  **Implement Blockchain & Escrow Logic:**
    *   Develop the PayGo Adapter and Escrow Manager, utilizing the Escrow ID system and supporting InsureCo's chosen escrow model.

10. **Implement Business Logic Engines:**
    *   Develop the Quote, Policy, and Payout engines, integrating with data sources (Data Router, Aggregators) and the Escrow Manager.

11. **Complete API Layer:**
    *   Finalize all core API endpoints, ensuring they are secure and integrated with the business logic.

12. **Implement Frontend Insurance Flows:**
    *   Build the user interface for quote search, policy purchase, and the user dashboard.

13. **Provider Foundation (InsureCo) & Testing:**
    *   Finalize InsureCo specific configuration and conduct comprehensive E2E testing.

---
This revised and comprehensive approach ensures the triggerr platform is built from day one on an exceptionally robust data foundation, ready for current MVP needs and scalable for future analytical and feature expansions.
