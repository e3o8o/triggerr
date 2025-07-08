/**
 * Test Data Setup Script for Task 2.3
 *
 * This script creates the necessary test data to complete Task 2.3:
 * - Test flights that can be referenced by quotes
 * - Ensures QuoteService can save to database
 * - Sets up end-to-end policy purchase flow
 *
 * Usage: bun run scripts/setup-test-data.ts
 */

import { Database, Schema } from "@triggerr/core";
import { generateId } from "@triggerr/core/utils";

class TestDataSetup {
  private createdFlights: string[] = [];
  private createdUsers: string[] = [];

  async setupTestData(): Promise<void> {
    console.log("🛠️  Setting up Test Data for Task 2.3\n");

    try {
      // Step 1: Create test flights
      console.log("✈️ Creating test flights...");
      await this.createTestFlights();

      // Step 2: Create test user (optional for authenticated testing)
      console.log("\n👤 Creating test user...");
      await this.createTestUser();

      // Step 3: Verify setup
      console.log("\n🔍 Verifying test data setup...");
      await this.verifySetup();

      console.log("\n🎉 Test Data Setup Complete!");
      console.log("\n📋 Summary:");
      console.log(`   ✅ Created ${this.createdFlights.length} test flights`);
      console.log(`   ✅ Created ${this.createdUsers.length} test users`);
      console.log("   ✅ Database ready for Task 2.3 testing");

      console.log("\n🚀 Next Steps:");
      console.log("   1. Run: bun run scripts/test-policy-purchase-flow.ts");
      console.log("   2. Start server: bun dev");
      console.log("   3. Test API endpoints");
    } catch (error) {
      console.error("❌ Test data setup failed:", error);
      await this.cleanup();
      process.exit(1);
    }
  }

  /**
   * Create test flights using existing airlines and airports
   */
  private async createTestFlights(): Promise<void> {
    // Get some airlines and airports to use
    const airlines = await Database.db.query.airline.findMany({
      limit: 3,
      where: (airline, { isNotNull }) => isNotNull(airline.icaoCode),
    });

    const airports = await Database.db.query.airport.findMany({
      limit: 10,
      where: (airport, { isNotNull, and }) =>
        and(isNotNull(airport.iataCode), isNotNull(airport.name)),
    });

    if (airlines.length < 2 || airports.length < 4) {
      throw new Error("Insufficient airlines or airports in database");
    }

    // Create test flights for common scenarios
    const testFlights = [
      {
        id: "flight_AA1234_2025-12-15",
        flightNumber: "AA1234",
        airlineIcaoCode: airlines[0].icaoCode!,
        departureAirportIataCode: airports[0].iataCode!,
        arrivalAirportIataCode: airports[1].iataCode!,
        departureScheduledAt: new Date("2025-12-15T08:00:00Z"),
        arrivalScheduledAt: new Date("2025-12-15T12:00:00Z"),
        aircraftIcaoCode: "B738",
        status: "SCHEDULED" as const,
      },
      {
        id: "flight_DL456_2025-12-20",
        flightNumber: "DL456",
        airlineIcaoCode: airlines[1].icaoCode!,
        departureAirportIataCode: airports[2].iataCode!,
        arrivalAirportIataCode: airports[3].iataCode!,
        departureScheduledAt: new Date("2025-12-20T14:30:00Z"),
        arrivalScheduledAt: new Date("2025-12-20T18:45:00Z"),
        aircraftIcaoCode: "B737",
        status: "SCHEDULED" as const,
      },
      {
        id: "flight_UA999_2025-12-30",
        flightNumber: "UA999",
        airlineIcaoCode: airlines[0].icaoCode!,
        departureAirportIataCode: airports[1].iataCode!,
        arrivalAirportIataCode: airports[2].iataCode!,
        departureScheduledAt: new Date("2025-12-30T10:15:00Z"),
        arrivalScheduledAt: new Date("2025-12-30T13:30:00Z"),
        aircraftIcaoCode: "A320",
        status: "SCHEDULED" as const,
      },
    ];

    for (const flight of testFlights) {
      try {
        // Check if flight already exists
        const existing = await Database.db.query.flight.findFirst({
          where: (f, { eq }) => eq(f.id, flight.id),
        });

        if (!existing) {
          await Database.db.insert(Schema.flight).values(flight);
          this.createdFlights.push(flight.id);
          console.log(
            `   ✅ Created flight: ${flight.flightNumber} (${flight.departureAirportIataCode} → ${flight.arrivalAirportIataCode})`,
          );
        } else {
          console.log(`   ⏭️  Flight already exists: ${flight.flightNumber}`);
        }
      } catch (error) {
        console.log(
          `   ⚠️  Failed to create flight ${flight.flightNumber}: ${error instanceof Error ? error.message : "Unknown error"}`,
        );
      }
    }
  }

  /**
   * Create test user for authenticated policy purchases
   */
  private async createTestUser(): Promise<void> {
    const testUserId = "user_test_task23";
    const testEmail = "test.task23@triggerr.com";

    try {
      // Check if user already exists
      const existing = await Database.db.query.user.findFirst({
        where: (user, { eq }) => eq(user.id, testUserId),
      });

      if (!existing) {
        await Database.db.insert(Schema.user).values({
          id: testUserId,
          name: "Test User Task 2.3",
          email: testEmail,
          emailVerified: true,
          image: null,
          role: "USER",
        });

        this.createdUsers.push(testUserId);
        console.log(`   ✅ Created test user: ${testEmail}`);
      } else {
        console.log(`   ⏭️  Test user already exists: ${testEmail}`);
      }
    } catch (error) {
      console.log(
        `   ⚠️  Failed to create test user: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * Verify that test data is properly set up
   */
  private async verifySetup(): Promise<void> {
    // Check flights
    const flights = await Database.db.query.flight.findMany({
      where: (flight, { inArray }) =>
        inArray(flight.id, [
          "flight_AA1234_2025-12-15",
          "flight_DL456_2025-12-20",
          "flight_UA999_2025-12-30",
        ]),
    });

    console.log(`   📊 Available test flights: ${flights.length}`);
    flights.forEach((flight) => {
      console.log(`      • ${flight.flightNumber} - ${flight.id}`);
    });

    // Check providers
    const providers = await Database.db.query.provider.findMany({
      where: (provider, { eq }) => eq(provider.status, "ACTIVE"),
      limit: 3,
    });

    console.log(`   🏢 Available providers: ${providers.length}`);
    providers.forEach((provider) => {
      console.log(`      • ${provider.name} - ${provider.id}`);
    });

    if (flights.length === 0) {
      throw new Error("No test flights created - setup failed");
    }

    if (providers.length === 0) {
      throw new Error("No active providers found - setup failed");
    }
  }

  /**
   * Clean up created test data (in case of errors)
   */
  private async cleanup(): Promise<void> {
    console.log("\n🧹 Cleaning up test data...");

    try {
      // Clean up flights
      if (this.createdFlights.length > 0) {
        await Database.db
          .delete(Schema.flight)
          .where((flight, { inArray }) =>
            inArray(flight.id, this.createdFlights),
          );
        console.log(
          `   🗑️  Removed ${this.createdFlights.length} test flights`,
        );
      }

      // Clean up users
      if (this.createdUsers.length > 0) {
        await Database.db
          .delete(Schema.user)
          .where((user, { inArray }) => inArray(user.id, this.createdUsers));
        console.log(`   🗑️  Removed ${this.createdUsers.length} test users`);
      }
    } catch (error) {
      console.log(
        `   ⚠️  Cleanup warning: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * Remove test data (for cleanup after testing)
   */
  async cleanupTestData(): Promise<void> {
    console.log("🧹 Removing Test Data...\n");

    try {
      // Remove test flights
      const testFlightIds = [
        "flight_AA1234_2025-12-15",
        "flight_DL456_2025-12-20",
        "flight_UA999_2025-12-30",
      ];

      await Database.db
        .delete(Schema.flight)
        .where((flight, { inArray }) => inArray(flight.id, testFlightIds));

      // Remove test users
      await Database.db
        .delete(Schema.user)
        .where((user, { eq }) => eq(user.id, "user_test_task23"));

      console.log("✅ Test data removed successfully");
    } catch (error) {
      console.error("❌ Failed to remove test data:", error);
    }
  }
}

async function main() {
  const setup = new TestDataSetup();

  const command = process.argv[2];

  if (command === "cleanup") {
    await setup.cleanupTestData();
  } else {
    await setup.setupTestData();
  }
}

if (import.meta.main) {
  main().catch(console.error);
}
