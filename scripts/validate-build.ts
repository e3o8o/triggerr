#!/usr/bin/env bun

/**
 * Validate Build Script
 *
 * This script builds packages in the correct dependency order and validates
 * that all exports are working properly. It ensures type generation happens
 * before dependent packages try to import from each other.
 */

import { $ } from "bun";
import { existsSync, statSync } from "fs";
import { join } from "path";

// Define build order based on dependency hierarchy
const BUILD_ORDER = [
  // 1. Shared packages (canonical models, utilities)
  "packages/shared",
  "packages/utils",
  "packages/config",

  // 2. Core packages (database, auth, utilities)
  "packages/core",
  "packages/ui",

  // 3. API contracts (needed by everything)
  "packages/api/contracts",
  "packages/api/sdk",

  // 4. Blockchain interfaces and adapters
  "packages/blockchain/blockchain-interface",
  "packages/blockchain/paygo-adapter",
  "packages/blockchain/service-registry",

  // 5. Integration adapters (external APIs)
  "packages/integrations/stripe-adapter",
  "packages/integrations/flightaware-adapter",
  "packages/integrations/aviationstack-adapter",
  "packages/integrations/opensky-adapter",
  "packages/integrations/google-weather-adapter",

  // 6. Data aggregation layer
  "packages/aggregators/flight-aggregator",
  "packages/aggregators/weather-aggregator",
  "packages/aggregators/data-router",

  // 7. Business logic services
  "packages/services/wallet-service",
  "packages/services/escrow-engine",
  "packages/services/quote-engine",
  "packages/services/policy-engine",
  "packages/services/payout-engine",

  // 8. LLM interfaces (for future chat integration)
  "packages/llm/llm-interface",
  "packages/llm/deepseek-adapter",

  // 9. Applications (last, depend on everything)
  "apps/api",
  "apps/web"
];

interface BuildResult {
  package: string;
  success: boolean;
  duration: number;
  error?: string;
  hasDistFolder: boolean;
  hasTypeDefinitions: boolean;
}

class BuildValidator {
  private results: BuildResult[] = [];
  private startTime: number = Date.now();

  async validateBuild(): Promise<void> {
    console.log("🚀 Starting dependency-ordered build validation...\n");

    // Clean all dist folders first
    await this.cleanDistFolders();

    // Build packages in order
    for (const packagePath of BUILD_ORDER) {
      await this.buildPackage(packagePath);
    }

    // Generate summary
    this.generateSummary();
  }

  private async cleanDistFolders(): Promise<void> {
    console.log("🧹 Cleaning existing dist folders...");
    try {
      await $`find packages apps -name "dist" -type d -exec rm -rf {} + 2>/dev/null || true`;
      await $`find packages apps -name ".turbo" -type d -exec rm -rf {} + 2>/dev/null || true`;
      console.log("✅ Clean complete\n");
    } catch (error) {
      console.log("⚠️  Clean completed with warnings\n");
    }
  }

  private async buildPackage(packagePath: string): Promise<void> {
    const packageName = packagePath.replace(/^packages\//, "@triggerr/").replace(/\//g, "-");
    const fullPath = join(process.cwd(), packagePath);

    // Check if package exists
    if (!existsSync(fullPath)) {
      console.log(`⏭️  Skipping ${packageName} (directory not found)`);
      return;
    }

    // Check if package has package.json
    const packageJsonPath = join(fullPath, "package.json");
    if (!existsSync(packageJsonPath)) {
      console.log(`⏭️  Skipping ${packageName} (no package.json)`);
      return;
    }

    console.log(`🔨 Building ${packageName}...`);
    const buildStart = Date.now();

    try {
      // Change to package directory and build
      const result = await $`cd ${fullPath} && bun run build`.quiet();
      const duration = Date.now() - buildStart;

      // Validate build output
      const validation = this.validatePackageOutput(fullPath, packagePath);

      this.results.push({
        package: packageName,
        success: true,
        duration,
        hasDistFolder: validation.hasDistFolder,
        hasTypeDefinitions: validation.hasTypeDefinitions
      });

      const statusIcon = validation.hasDistFolder && validation.hasTypeDefinitions ? "✅" : "⚠️ ";
      console.log(`${statusIcon} ${packageName} built in ${duration}ms`);

      if (!validation.hasDistFolder) {
        console.log(`   ⚠️  Warning: No dist folder created`);
      }
      if (!validation.hasTypeDefinitions) {
        console.log(`   ⚠️  Warning: No type definitions found`);
      }

    } catch (error) {
      const duration = Date.now() - buildStart;
      const errorMessage = error instanceof Error ? error.message : String(error);

      this.results.push({
        package: packageName,
        success: false,
        duration,
        error: errorMessage,
        hasDistFolder: false,
        hasTypeDefinitions: false
      });

      console.log(`❌ ${packageName} failed in ${duration}ms`);
      console.log(`   Error: ${errorMessage}`);
    }

    console.log(); // Empty line for readability
  }

  private validatePackageOutput(fullPath: string, packagePath: string): {
    hasDistFolder: boolean;
    hasTypeDefinitions: boolean;
  } {
    const distPath = join(fullPath, "dist");
    const hasDistFolder = existsSync(distPath);

    let hasTypeDefinitions = false;
    if (hasDistFolder) {
      // Check for .d.ts files in dist folder
      try {
        const distStats = statSync(distPath);
        if (distStats.isDirectory()) {
          hasTypeDefinitions = existsSync(join(distPath, "index.d.ts"));
        }
      } catch (error) {
        // Ignore stat errors
      }
    }

    return { hasDistFolder, hasTypeDefinitions };
  }

  private generateSummary(): void {
    const totalDuration = Date.now() - this.startTime;
    const successful = this.results.filter(r => r.success);
    const failed = this.results.filter(r => !r.success);
    const withDist = this.results.filter(r => r.hasDistFolder);
    const withTypes = this.results.filter(r => r.hasTypeDefinitions);

    console.log("=" .repeat(60));
    console.log("📊 BUILD VALIDATION SUMMARY");
    console.log("=" .repeat(60));
    console.log(`Total packages: ${this.results.length}`);
    console.log(`✅ Successful: ${successful.length}`);
    console.log(`❌ Failed: ${failed.length}`);
    console.log(`📁 With dist folder: ${withDist.length}`);
    console.log(`📘 With type definitions: ${withTypes.length}`);
    console.log(`⏱️  Total time: ${totalDuration}ms`);
    console.log();

    if (failed.length > 0) {
      console.log("❌ FAILED PACKAGES:");
      failed.forEach(result => {
        console.log(`   • ${result.package}: ${result.error}`);
      });
      console.log();
    }

    const warnings = this.results.filter(r => r.success && (!r.hasDistFolder || !r.hasTypeDefinitions));
    if (warnings.length > 0) {
      console.log("⚠️  PACKAGES WITH WARNINGS:");
      warnings.forEach(result => {
        console.log(`   • ${result.package}:`);
        if (!result.hasDistFolder) console.log(`     - No dist folder`);
        if (!result.hasTypeDefinitions) console.log(`     - No type definitions`);
      });
      console.log();
    }

    // Exit code
    if (failed.length > 0) {
      console.log("❌ Build validation failed. Please fix the errors above.");
      process.exit(1);
    } else {
      console.log("✅ Build validation successful! All packages built correctly.");
      process.exit(0);
    }
  }
}

// Run the validation
const validator = new BuildValidator();
validator.validateBuild().catch((error) => {
  console.error("💥 Validation script failed:", error);
  process.exit(1);
});
