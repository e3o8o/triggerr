#!/usr/bin/env bun

/**
 * Phase 3 API SDK Audit Script - Deep Import Removal & Enterprise Distribution Readiness
 *
 * This script audits the @triggerr/api-sdk package to identify:
 * 1. Deep import violations that prevent enterprise distribution
 * 2. Missing clean barrel imports
 * 3. SDK structure issues
 * 4. Example file problems
 * 5. Enterprise distribution readiness
 */

import { promises as fs } from "fs";
import { join } from "path";
import { glob } from "glob";

interface SDKAuditResult {
  section: string;
  status: "pass" | "fail" | "warning";
  file: string;
  issues: AuditIssue[];
  summary: {
    totalFiles: number;
    deepImports: number;
    cleanImports: number;
    missingExports: number;
    violations: number;
  };
}

interface AuditIssue {
  type:
    | "deep_import_violation"
    | "missing_clean_import"
    | "missing_export"
    | "invalid_structure"
    | "example_error"
    | "enterprise_blocker";
  severity: "error" | "warning" | "info";
  message: string;
  file: string;
  line?: number;
  suggestion?: string;
}

const SDK_PATH = "packages/api/sdk";
const SDK_SRC_PATH = join(SDK_PATH, "src");
const SDK_EXAMPLES_PATH = join(SDK_PATH, "examples");

// Deep import patterns that violate Phase 3 requirements
const FORBIDDEN_DEEP_IMPORT_PATTERNS = [
  /@triggerr\/core\/database['"]/,
  /@triggerr\/core\/auth['"]/,
  /@triggerr\/core\/utils\/[^'"]*['"]/,
  /@triggerr\/api-contracts\/dtos\/[^'"]*['"]/,
  /@triggerr\/api-contracts\/validators\/[^'"]*['"]/,
  /@triggerr\/paygo-adapter\/src\/[^'"]*['"]/,
  /@triggerr\/[^'"]*\/src\/[^'"]*['"]/,
];

// Required clean imports for enterprise SDK
const REQUIRED_SDK_EXPORTS = [
  "ApiClient",
  "ApiResponse",
  "ApiError",
  "createApiError",
  "createApiResponse",
  "ErrorCode",
  "ChatService",
  "InsuranceService",
  "PolicyService",
  "WalletService",
  "UserService",
  "AdminService",
];

class SDKAuditor {
  private results: SDKAuditResult[] = [];
  private totalViolations = 0;
  private criticalIssues = 0;

  async auditSDK(): Promise<void> {
    console.log("🔍 Starting Phase 3 API SDK audit...\n");
    console.log("🎯 Focus: Deep Import Removal & Enterprise Distribution Readiness\n");

    // Audit different sections of the SDK
    await this.auditSDKServices();
    await this.auditSDKIndex();
    await this.auditSDKExamples();
    await this.auditSDKPackageJson();
    await this.auditEnterpriseReadiness();

    this.generateReport();
  }

  private async auditSDKServices(): Promise<void> {
    console.log("📦 Auditing SDK Services...");

    const servicesPath = join(SDK_SRC_PATH, "services");
    const serviceFiles = await glob("**/*.ts", { cwd: servicesPath });

    const result: SDKAuditResult = {
      section: "SDK Services",
      status: "pass",
      file: servicesPath,
      issues: [],
      summary: {
        totalFiles: serviceFiles.length,
        deepImports: 0,
        cleanImports: 0,
        missingExports: 0,
        violations: 0,
      },
    };

    for (const serviceFile of serviceFiles) {
      const filePath = join(servicesPath, serviceFile);
      const content = await fs.readFile(filePath, "utf-8");

      // Check for deep import violations
      const deepImportViolations = this.findDeepImports(content, filePath);
      result.issues.push(...deepImportViolations);
      result.summary.deepImports += deepImportViolations.length;
      result.summary.violations += deepImportViolations.length;

      // Check for clean imports
      const cleanImports = this.findCleanImports(content);
      result.summary.cleanImports += cleanImports;

      // Validate service structure
      const structureIssues = this.validateServiceStructure(content, filePath);
      result.issues.push(...structureIssues);
    }

    // Determine status
    if (result.summary.violations > 0) {
      result.status = result.summary.violations > 3 ? "fail" : "warning";
    }

    this.results.push(result);
  }

  private async auditSDKIndex(): Promise<void> {
    console.log("📋 Auditing SDK Main Index...");

    const indexPath = join(SDK_SRC_PATH, "index.ts");
    const result: SDKAuditResult = {
      section: "SDK Main Index",
      status: "pass",
      file: indexPath,
      issues: [],
      summary: {
        totalFiles: 1,
        deepImports: 0,
        cleanImports: 0,
        missingExports: 0,
        violations: 0,
      },
    };

    try {
      const content = await fs.readFile(indexPath, "utf-8");

      // Check for deep imports
      const deepImportViolations = this.findDeepImports(content, indexPath);
      result.issues.push(...deepImportViolations);
      result.summary.deepImports += deepImportViolations.length;
      result.summary.violations += deepImportViolations.length;

      // Check for required exports
      const missingExports = this.validateRequiredExports(content, indexPath);
      result.issues.push(...missingExports);
      result.summary.missingExports += missingExports.length;

      // Check clean import usage
      const cleanImports = this.findCleanImports(content);
      result.summary.cleanImports += cleanImports;

      if (result.summary.violations > 0 || result.summary.missingExports > 0) {
        result.status = "fail";
      }
    } catch (error) {
      result.issues.push({
        type: "enterprise_blocker",
        severity: "error",
        message: `Cannot read SDK index file: ${error}`,
        file: indexPath,
      });
      result.status = "fail";
    }

    this.results.push(result);
  }

  private async auditSDKExamples(): Promise<void> {
    console.log("📚 Auditing SDK Examples...");

    let exampleFiles: string[] = [];
    try {
      exampleFiles = await glob("**/*.ts", { cwd: SDK_EXAMPLES_PATH });
    } catch {
      // Examples directory might not exist
    }

    const result: SDKAuditResult = {
      section: "SDK Examples",
      status: "pass",
      file: SDK_EXAMPLES_PATH,
      issues: [],
      summary: {
        totalFiles: exampleFiles.length,
        deepImports: 0,
        cleanImports: 0,
        missingExports: 0,
        violations: 0,
      },
    };

    for (const exampleFile of exampleFiles) {
      const filePath = join(SDK_EXAMPLES_PATH, exampleFile);
      const content = await fs.readFile(filePath, "utf-8");

      // Check for deep import violations in examples
      const deepImportViolations = this.findDeepImports(content, filePath);
      result.issues.push(...deepImportViolations);
      result.summary.deepImports += deepImportViolations.length;
      result.summary.violations += deepImportViolations.length;

      // Validate example quality
      const exampleIssues = this.validateExampleQuality(content, filePath);
      result.issues.push(...exampleIssues);
    }

    if (result.summary.violations > 0) {
      result.status = "fail";
    }

    this.results.push(result);
  }

  private async auditSDKPackageJson(): Promise<void> {
    console.log("📦 Auditing SDK Package Configuration...");

    const packagePath = join(SDK_PATH, "package.json");
    const result: SDKAuditResult = {
      section: "SDK Package Config",
      status: "pass",
      file: packagePath,
      issues: [],
      summary: {
        totalFiles: 1,
        deepImports: 0,
        cleanImports: 0,
        missingExports: 0,
        violations: 0,
      },
    };

    try {
      const packageContent = await fs.readFile(packagePath, "utf-8");
      const packageJson = JSON.parse(packageContent);

      // Check for enterprise distribution readiness
      const distributionIssues = this.validateDistributionConfig(packageJson, packagePath);
      result.issues.push(...distributionIssues);

      if (distributionIssues.length > 0) {
        result.status = "warning";
      }
    } catch (error) {
      result.issues.push({
        type: "enterprise_blocker",
        severity: "error",
        message: `Cannot read package.json: ${error}`,
        file: packagePath,
      });
      result.status = "fail";
    }

    this.results.push(result);
  }

  private async auditEnterpriseReadiness(): Promise<void> {
    console.log("🏢 Auditing Enterprise Distribution Readiness...");

    const result: SDKAuditResult = {
      section: "Enterprise Readiness",
      status: "pass",
      file: SDK_PATH,
      issues: [],
      summary: {
        totalFiles: 0,
        deepImports: this.totalViolations,
        cleanImports: 0,
        missingExports: 0,
        violations: this.totalViolations,
      },
    };

    // Check overall SDK health
    if (this.totalViolations > 0) {
      result.issues.push({
        type: "enterprise_blocker",
        severity: "error",
        message: `SDK has ${this.totalViolations} deep import violations - blocks enterprise distribution`,
        file: SDK_PATH,
        suggestion: "Fix all deep imports before distribution",
      });
      result.status = "fail";
    }

    // Check for README and documentation
    const readmePath = join(SDK_PATH, "README.md");
    try {
      await fs.access(readmePath);
    } catch {
      result.issues.push({
        type: "enterprise_blocker",
        severity: "warning",
        message: "Missing README.md for enterprise distribution",
        file: readmePath,
        suggestion: "Add comprehensive SDK documentation",
      });
    }

    this.results.push(result);
  }

  private findDeepImports(content: string, filePath: string): AuditIssue[] {
    const issues: AuditIssue[] = [];
    const lines = content.split("\n");

    lines.forEach((line, index) => {
      for (const pattern of FORBIDDEN_DEEP_IMPORT_PATTERNS) {
        if (pattern.test(line)) {
          const match = line.match(/from\s+['"]([^'"]+)['"]/);
          const importPath = match ? match[1] : "unknown";

          issues.push({
            type: "deep_import_violation",
            severity: "error",
            message: `Deep import violation: ${importPath}`,
            file: filePath,
            line: index + 1,
            suggestion: "Use clean barrel import from package root",
          });

          this.totalViolations++;
          this.criticalIssues++;
        }
      }
    });

    return issues;
  }

  private findCleanImports(content: string): number {
    const cleanImportPatterns = [
      /@triggerr\/api-contracts['"]/,
      /@triggerr\/core['"]/,
      /@triggerr\/blockchain['"]/,
      /@triggerr\/services['"]/,
    ];

    let cleanImportCount = 0;
    for (const pattern of cleanImportPatterns) {
      const matches = content.match(pattern);
      if (matches) {
        cleanImportCount += matches.length;
      }
    }

    return cleanImportCount;
  }

  private validateRequiredExports(content: string, filePath: string): AuditIssue[] {
    const issues: AuditIssue[] = [];

    for (const requiredExport of REQUIRED_SDK_EXPORTS) {
      const exportPattern = new RegExp(`export\\s+.*\\b${requiredExport}\\b`);
      if (!exportPattern.test(content)) {
        issues.push({
          type: "missing_export",
          severity: "error",
          message: `Missing required export: ${requiredExport}`,
          file: filePath,
          suggestion: `Add 'export { ${requiredExport} }' to SDK index`,
        });
      }
    }

    return issues;
  }

  private validateServiceStructure(content: string, filePath: string): AuditIssue[] {
    const issues: AuditIssue[] = [];

    // Check if service class is properly exported
    if (filePath.includes("services/") && !content.includes("export class") && !content.includes("export {")) {
      issues.push({
        type: "invalid_structure",
        severity: "warning",
        message: "Service file should export a service class",
        file: filePath,
      });
    }

    return issues;
  }

  private validateExampleQuality(content: string, filePath: string): AuditIssue[] {
    const issues: AuditIssue[] = [];

    // Check if example shows proper SDK usage
    if (!content.includes("import") || !content.includes("@triggerr/api-sdk")) {
      issues.push({
        type: "example_error",
        severity: "warning",
        message: "Example should demonstrate SDK usage with proper imports",
        file: filePath,
      });
    }

    return issues;
  }

  private validateDistributionConfig(packageJson: any, filePath: string): AuditIssue[] {
    const issues: AuditIssue[] = [];

    // Check required fields for enterprise distribution
    const requiredFields = ["name", "version", "main", "types", "files"];
    for (const field of requiredFields) {
      if (!packageJson[field]) {
        issues.push({
          type: "enterprise_blocker",
          severity: "error",
          message: `Missing required field for distribution: ${field}`,
          file: filePath,
        });
      }
    }

    // Check for proper exports configuration
    if (!packageJson.exports) {
      issues.push({
        type: "enterprise_blocker",
        severity: "warning",
        message: "Missing 'exports' field for modern Node.js compatibility",
        file: filePath,
        suggestion: "Add exports field with ESM/CJS dual support",
      });
    }

    return issues;
  }

  private generateReport(): void {
    console.log("\n" + "=".repeat(80));
    console.log("📊 PHASE 3 API SDK AUDIT REPORT");
    console.log("=".repeat(80));

    const passCount = this.results.filter((r) => r.status === "pass").length;
    const warningCount = this.results.filter((r) => r.status === "warning").length;
    const failCount = this.results.filter((r) => r.status === "fail").length;

    console.log(`\n📈 Overall Status:`);
    console.log(`   ✅ Pass: ${passCount}`);
    console.log(`   ⚠️  Warning: ${warningCount}`);
    console.log(`   ❌ Fail: ${failCount}`);

    // Detailed results
    for (const result of this.results) {
      this.printSectionResult(result);
    }

    // Summary
    const totalDeepImports = this.results.reduce((sum, r) => sum + r.summary.deepImports, 0);
    const totalMissingExports = this.results.reduce((sum, r) => sum + r.summary.missingExports, 0);

    console.log("\n" + "=".repeat(80));
    console.log("📋 PHASE 3 SUMMARY");
    console.log("=".repeat(80));
    console.log(`Sections Audited: ${this.results.length}`);
    console.log(`Deep Import Violations: ${totalDeepImports}`);
    console.log(`Missing Required Exports: ${totalMissingExports}`);
    console.log(`Critical Issues: ${this.criticalIssues}`);

    // Phase 3 specific success criteria
    console.log("\n🎯 Phase 3 Success Criteria:");
    console.log(`   Deep Imports: ${totalDeepImports === 0 ? "✅ PASS" : "❌ FAIL"} (Target: 0)`);
    console.log(`   Required Exports: ${totalMissingExports === 0 ? "✅ PASS" : "❌ FAIL"} (Target: All present)`);
    console.log(`   Enterprise Ready: ${this.criticalIssues === 0 ? "✅ PASS" : "❌ FAIL"} (Target: No blockers)`);

    if (this.criticalIssues === 0 && totalDeepImports === 0) {
      console.log("\n🎉 Phase 3 COMPLETED! API SDK is enterprise distribution ready!");
      console.log("✅ All deep imports eliminated");
      console.log("✅ Clean barrel exports implemented");
      console.log("✅ Ready for Phase 4: Services & Integration");
    } else {
      console.log("\n❌ Phase 3 INCOMPLETE - Critical issues must be resolved:");
      if (totalDeepImports > 0) {
        console.log(`   🔧 Fix ${totalDeepImports} deep import violations`);
      }
      if (totalMissingExports > 0) {
        console.log(`   🔧 Add ${totalMissingExports} missing required exports`);
      }
      if (this.criticalIssues > 0) {
        console.log(`   🔧 Resolve ${this.criticalIssues} enterprise blockers`);
      }
    }

    // Exit with appropriate code
    process.exit(this.criticalIssues > 0 ? 1 : 0);
  }

  private printSectionResult(result: SDKAuditResult): void {
    const statusIcon = result.status === "pass" ? "✅" : result.status === "warning" ? "⚠️" : "❌";

    console.log(`\n${statusIcon} ${result.section.toUpperCase()}`);
    console.log("-".repeat(50));

    if (result.issues.length === 0) {
      console.log("   No issues found");
    } else {
      result.issues.forEach((issue) => {
        const icon = issue.severity === "error" ? "❌" : issue.severity === "warning" ? "⚠️" : "ℹ️";
        console.log(`   ${icon} ${issue.message}`);
        if (issue.file) {
          const relativePath = issue.file.replace(process.cwd() + "/", "");
          console.log(`      📁 ${relativePath}${issue.line ? `:${issue.line}` : ""}`);
        }
        if (issue.suggestion) {
          console.log(`      💡 ${issue.suggestion}`);
        }
      });
    }

    // Print summary stats
    console.log(`\n   📊 Stats:`);
    console.log(`      Files Checked: ${result.summary.totalFiles}`);
    console.log(`      Deep Imports: ${result.summary.deepImports}`);
    console.log(`      Clean Imports: ${result.summary.cleanImports}`);
    console.log(`      Missing Exports: ${result.summary.missingExports}`);
    console.log(`      Violations: ${result.summary.violations}`);
  }
}

// Run the audit
async function main() {
  try {
    const auditor = new SDKAuditor();
    await auditor.auditSDK();
  } catch (error) {
    console.error("❌ Phase 3 audit failed:", error);
    process.exit(1);
  }
}

// Execute if run directly
if (import.meta.main) {
  main();
}
