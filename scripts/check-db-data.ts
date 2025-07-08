/**
 * Database Data Check Script
 *
 * This script checks what providers, flights, and other data
 * are available in the database to help fix foreign key issues
 *
 * Usage: bun run scripts/check-db-data.ts
 */

import { Database, Schema } from "@triggerr/core";

class DatabaseDataChecker {
  async runCheck(): Promise<void> {
    console.log("🔍 Checking Database Data for Task 2.3\n");

    try {
      // Check providers
      console.log("🏢 Available Providers:");
      const providers = await Database.db.query.provider.findMany({
        limit: 10
      });

      if (providers.length === 0) {
        console.log("   ❌ No providers found - need to create test providers");
      } else {
        providers.forEach(provider => {
          console.log(`   ✅ ${provider.id} - ${provider.name} (${provider.status})`);
        });
      }

      // Check flights
      console.log("\n✈️ Available Flights:");
      const flights = await Database.db.query.flight.findMany({
        limit: 10
      });

      if (flights.length === 0) {
        console.log("   ❌ No flights found - need to create test flights");
      } else {
        flights.forEach(flight => {
          console.log(`   ✅ ${flight.id} - ${flight.flightNumber} (${flight.departureAirportIataCode} → ${flight.arrivalAirportIataCode})`);
        });
      }

      // Check airlines
      console.log("\n🛩️ Available Airlines:");
      const airlines = await Database.db.query.airline.findMany({
        limit: 10
      });

      if (airlines.length === 0) {
        console.log("   ❌ No airlines found");
      } else {
        airlines.forEach(airline => {
          console.log(`   ✅ ${airline.icaoCode} - ${airline.name}`);
        });
      }

      // Check airports
      console.log("\n🏛️ Available Airports:");
      const airports = await Database.db.query.airport.findMany({
        limit: 5
      });

      if (airports.length === 0) {
        console.log("   ❌ No airports found");
      } else {
        airports.forEach(airport => {
          console.log(`   ✅ ${airport.iataCode} - ${airport.name} (${airport.cityName})`);
        });
      }

      // Check existing quotes
      console.log("\n📋 Existing Quotes:");
      const quotes = await Database.db.query.quote.findMany({
        limit: 5
      });

      if (quotes.length === 0) {
        console.log("   ✅ No existing quotes (clean slate)");
      } else {
        quotes.forEach(quote => {
          console.log(`   • ${quote.id} - ${quote.coverageType} $${quote.coverageAmount} (${quote.status})`);
        });
      }

      // Check existing policies
      console.log("\n🏛️ Existing Policies:");
      const policies = await Database.db.query.policy.findMany({
        limit: 5
      });

      if (policies.length === 0) {
        console.log("   ✅ No existing policies (clean slate)");
      } else {
        policies.forEach(policy => {
          console.log(`   • ${policy.id} - ${policy.policyNumber} (${policy.status})`);
        });
      }

      console.log("\n" + "=".repeat(60));
      console.log("📊 Summary for Task 2.3 Fix:");
      console.log("=".repeat(60));

      if (providers.length > 0) {
        console.log(`✅ Use Provider ID: "${providers[0].id}" for quotes`);
      } else {
        console.log("❌ Need to create test provider first");
      }

      if (flights.length > 0) {
        console.log(`✅ Use Flight ID: "${flights[0].id}" for quotes`);
      } else {
        console.log("❌ Need to create test flight first");
      }

      if (airlines.length > 0 && airports.length > 0) {
        console.log("✅ Airlines and airports available for flight creation");
      } else {
        console.log("❌ Need reference data (airlines/airports) for flight creation");
      }

    } catch (error) {
      console.error("❌ Database check failed:", error);
      process.exit(1);
    }
  }
}

async function main() {
  const checker = new DatabaseDataChecker();
  await checker.runCheck();
}

if (import.meta.main) {
  main().catch(console.error);
}
