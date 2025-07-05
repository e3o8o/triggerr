#!/usr/bin/env bun

/**
 * Phase 3 Audit Script: API SDK Deep Import Removal
 *
 * This script audits the @triggerr/api-sdk package to track progress
 * on removing deep imports and ensuring clean barrel exports for
 * enterprise distribution readiness.
 */

import { promises as fs } from "fs";
import { glob } from "glob";
import path from "path";

interface AuditResult {
  file: string;
  violations: DeepImportViolation[];
  status: "pass" | "fail";
}

interface DeepImportViolation {
  line: number;
  content: string;
  type: "dto_import" | "validator_import";
  suggested_fix: string;
}

interface PhaseProgress {
  totalFiles: number;
  filesWithViolations: number;
  totalViolations: number;
  passedFiles: string[];
  failedFiles: string[];
  auditResults: AuditResult[];
}

// Deep import patterns we're looking for
const DEEP_IMPORT_PATTERNS = {
  dto_import: /@triggerr\/api-contracts\/dtos\/[^'"]+/g,
  validator_import: /@triggerr\/api-contracts\/validators\/[^'"]+/g,
};

// Files to audit in the API SDK
const SDK_FILES_TO_AUDIT = [
  "packages/api/sdk/src/services/policy.ts",
  "packages/api/sdk/src/services/types.ts",
  "packages/api/sdk/src/services/user.ts",
  "packages/api/sdk/src/services/wallet.ts",
  "packages/api/sdk/examples/anonymous-user.ts",
  "packages/api/sdk/examples/authenticated-user.ts",
  "packages/api/sdk/examples/basic-usage.ts",
];

// Expected clean import pattern
const CLEAN_IMPORT_SUGGESTION = `import type {
  // All required types
} from "@triggerr/api-contracts"`;

/**
 * Check if file exists
 */
async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

/**
 * Analyze a single file for deep import violations
 */
async function auditFile(filePath: string): Promise<AuditResult> {
  const violations: DeepImportViolation[] = [];

  try {
    if (!(await fileExists(filePath))) {
      console.warn(`⚠️  File not found: ${filePath}`);
      return {
        file: filePath,
        violations: [],
        status: "pass", // File doesn't exist, no violations
      };
    }

    const content = await fs.readFile(filePath, "utf-8");
    const lines = content.split("\n");

    lines.forEach((line, index) => {
      // Check for DTO deep imports
      const dtoMatches = line.match(DEEP_IMPORT_PATTERNS.dto_import);
      if (dtoMatches) {
        violations.push({
          line: index + 1,
          content: line.trim(),
          type: "dto_import",
          suggested_fix: CLEAN_IMPORT_SUGGESTION,
        });
      }

      // Check for validator deep imports
      const validatorMatches = line.match(
        DEEP_IMPORT_PATTERNS.validator_import,
      );
      if (validatorMatches) {
        violations.push({
          line: index + 1,
          content: line.trim(),
          type: "validator_import",
          suggested_fix: CLEAN_IMPORT_SUGGESTION,
        });
      }
    });

    return {
      file: filePath,
      violations,
      status: violations.length === 0 ? "pass" : "fail",
    };
  } catch (error) {
    console.error(`❌ Error reading file ${filePath}:`, error);
    return {
      file: filePath,
      violations: [],
      status: "fail",
    };
  }
}

/**
 * Check if the API SDK builds successfully
 */
async function checkSDKBuild(): Promise<boolean> {
  try {
    console.log("🔨 Checking API SDK build...");
    const { spawn } = await import("child_process");

    return new Promise((resolve) => {
      const buildProcess = spawn("bun", ["run", "build"], {
        cwd: path.join(process.cwd(), "packages/api/sdk"),
        stdio: "pipe",
      });

      let output = "";
      let errorOutput = "";

      buildProcess.stdout?.on("data", (data) => {
        output += data.toString();
      });

      buildProcess.stderr?.on("data", (data) => {
        errorOutput += data.toString();
      });

      buildProcess.on("close", (code) => {
        if (code === 0) {
          console.log("✅ API SDK builds successfully");
          resolve(true);
        } else {
          console.log("❌ API SDK build failed");
          if (errorOutput) {
            console.log("Build errors:", errorOutput);
          }
          resolve(false);
        }
      });
    });
  } catch (error) {
    console.error("❌ Error checking SDK build:", error);
    return false;
  }
}

/**
 * Check if API contracts build successfully
 */
async function checkAPIContractsBuild(): Promise<boolean> {
  try {
    console.log("🔨 Checking API Contracts build...");
    const { spawn } = await import("child_process");

    return new Promise((resolve) => {
      const buildProcess = spawn("bun", ["run", "build"], {
        cwd: path.join(process.cwd(), "packages/api/contracts"),
        stdio: "pipe",
      });

      let output = "";
      let errorOutput = "";

      buildProcess.stdout?.on("data", (data) => {
        output += data.toString();
      });

      buildProcess.stderr?.on("data", (data) => {
        errorOutput += data.toString();
      });

      buildProcess.on("close", (code) => {
        if (code === 0) {
          console.log("✅ API Contracts builds successfully");
          resolve(true);
        } else {
          console.log("❌ API Contracts build failed");
          if (errorOutput) {
            console.log("Build errors:", errorOutput);
          }
          resolve(false);
        }
      });
    });
  } catch (error) {
    console.error("❌ Error checking API contracts build:", error);
    return false;
  }
}

/**
 * Generate progress report
 */
function generateProgressReport(progress: PhaseProgress): void {
  console.log("\n📊 PHASE 3 PROGRESS REPORT: API SDK Deep Import Removal");
  console.log("=".repeat(70));

  console.log(`\n📈 Overall Progress:`);
  console.log(`   • Total files audited: ${progress.totalFiles}`);
  console.log(`   • Files with violations: ${progress.filesWithViolations}`);
  console.log(`   • Total violations: ${progress.totalViolations}`);
  console.log(`   • Clean files: ${progress.passedFiles.length}`);
  console.log(
    `   • Success rate: ${Math.round((progress.passedFiles.length / progress.totalFiles) * 100)}%`,
  );

  if (progress.passedFiles.length > 0) {
    console.log(`\n✅ Clean Files (${progress.passedFiles.length}):`);
    progress.passedFiles.forEach((file) => {
      const relativeFile = file.replace("packages/api/sdk/", "");
      console.log(`   ✓ ${relativeFile}`);
    });
  }

  if (progress.failedFiles.length > 0) {
    console.log(`\n❌ Files with violations (${progress.failedFiles.length}):`);
    progress.failedFiles.forEach((file) => {
      const result = progress.auditResults.find((r) => r.file === file);
      const relativeFile = file.replace("packages/api/sdk/", "");
      console.log(
        `   ✗ ${relativeFile} (${result?.violations.length || 0} violations)`,
      );
    });
  }

  // Detailed violation breakdown
  if (progress.totalViolations > 0) {
    console.log(`\n🔍 Detailed Violation Breakdown:`);
    console.log("-".repeat(50));

    progress.auditResults.forEach((result) => {
      if (result.violations.length > 0) {
        const relativeFile = result.file.replace("packages/api/sdk/", "");
        console.log(`\n📄 ${relativeFile}:`);

        result.violations.forEach((violation) => {
          const typeLabel =
            violation.type === "dto_import"
              ? "DTO Deep Import"
              : "Validator Deep Import";
          console.log(`   Line ${violation.line}: ${typeLabel}`);
          console.log(`   Code: ${violation.content}`);
          console.log(
            `   Fix: Use barrel import from "@triggerr/api-contracts"`,
          );
        });
      }
    });
  }

  // Phase completion status
  console.log("\n🎯 Phase 3 Completion Status:");
  console.log("-".repeat(40));

  if (progress.totalViolations === 0) {
    console.log("🎉 PHASE 3 COMPLETE! ✅");
    console.log("   • All deep imports removed from API SDK");
    console.log("   • Enterprise distribution ready");
    console.log("   • Ready to proceed to Phase 4");
  } else {
    console.log("🚧 PHASE 3 IN PROGRESS");
    console.log(`   • ${progress.totalViolations} violations remaining`);
    console.log(`   • ${progress.filesWithViolations} files need fixing`);
    console.log("   • Continue with deep import removal");
  }

  console.log("\n📋 Next Steps:");
  if (progress.totalViolations > 0) {
    console.log(
      "   1. Add missing exports to @triggerr/api-contracts/src/index.ts",
    );
    console.log("   2. Replace deep imports with barrel imports in each file");
    console.log("   3. Remove type aliasing (as TypeDto)");
    console.log("   4. Test SDK builds successfully");
    console.log("   5. Run this audit script again to verify progress");
  } else {
    console.log("   1. ✅ Verify all SDK examples work with clean imports");
    console.log("   2. ✅ Run enterprise SDK validation");
    console.log("   3. ✅ Update documentation with new import patterns");
    console.log("   4. ✅ Proceed to Phase 4: Services & Integration");
  }
}

/**
 * Main audit function
 */
async function runPhase3Audit(): Promise<void> {
  console.log("🔍 Starting Phase 3 Audit: API SDK Deep Import Removal");
  console.log("=".repeat(60));

  // Check prerequisite builds
  const contractsBuildOk = await checkAPIContractsBuild();
  if (!contractsBuildOk) {
    console.log(
      "❌ API Contracts build failed. Fix contracts first before proceeding.",
    );
    process.exit(1);
  }

  const progress: PhaseProgress = {
    totalFiles: 0,
    filesWithViolations: 0,
    totalViolations: 0,
    passedFiles: [],
    failedFiles: [],
    auditResults: [],
  };

  // Audit each SDK file
  for (const file of SDK_FILES_TO_AUDIT) {
    console.log(`🔍 Auditing: ${file.replace("packages/api/sdk/", "")}`);
    const result = await auditFile(file);

    progress.auditResults.push(result);
    progress.totalFiles++;
    progress.totalViolations += result.violations.length;

    if (result.status === "pass") {
      progress.passedFiles.push(file);
    } else {
      progress.failedFiles.push(file);
      progress.filesWithViolations++;
    }
  }

  // Check SDK build status
  const sdkBuildOk = await checkSDKBuild();

  // Generate and display report
  generateProgressReport(progress);

  console.log("\n🔨 Build Status:");
  console.log(
    `   • API Contracts: ${contractsBuildOk ? "✅ Pass" : "❌ Fail"}`,
  );
  console.log(`   • API SDK: ${sdkBuildOk ? "✅ Pass" : "❌ Fail"}`);

  // Exit with appropriate code
  if (progress.totalViolations === 0 && sdkBuildOk) {
    console.log("\n🎉 PHASE 3 AUDIT COMPLETE: All checks passed! ✅");
    process.exit(0);
  } else {
    console.log(
      "\n🚧 PHASE 3 AUDIT: Issues found, continue fixing violations.",
    );
    process.exit(1);
  }
}

// Run the audit
runPhase3Audit().catch((error) => {
  console.error("❌ Audit script failed:", error);
  process.exit(1);
});
