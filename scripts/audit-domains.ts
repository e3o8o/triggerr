#!/usr/bin/env bun

/**
 * Domain Audit Script - Comprehensive Analysis
 *
 * This script audits all domain barrel files against their corresponding
 * DTO and validator files to identify mismatches, missing imports, and
 * inconsistencies that need to be fixed for the deep import removal plan.
 */

import { promises as fs } from "fs";
import { join } from "path";

interface DomainAuditResult {
  domain: string;
  status: "pass" | "fail" | "warning";
  dtoFile: string;
  validatorFile: string;
  domainFile: string;
  issues: AuditIssue[];
  summary: {
    totalDtoTypes: number;
    totalValidatorSchemas: number;
    missingDtoImports: number;
    missingValidatorImports: number;
    extraImports: number;
  };
}

interface AuditIssue {
  type:
    | "missing_dto_import"
    | "missing_validator_import"
    | "extra_import"
    | "missing_export"
    | "type_mismatch"
    | "file_not_found";
  severity: "error" | "warning" | "info";
  message: string;
  item?: string;
}

const CONTRACTS_PATH = "packages/api/contracts/src";
const DOMAINS_PATH = join(CONTRACTS_PATH, "domains");
const DTOS_PATH = join(CONTRACTS_PATH, "dtos");
const VALIDATORS_PATH = join(CONTRACTS_PATH, "validators");

class DomainAuditor {
  private results: DomainAuditResult[] = [];

  async auditAllDomains(): Promise<void> {
    console.log("🔍 Starting comprehensive domain audit...\n");

    // Get all domain files
    const domainFiles = await this.getDomainFiles();

    for (const domainFile of domainFiles) {
      const domain = domainFile.replace(".ts", "");
      console.log(`📋 Auditing ${domain} domain...`);

      const result = await this.auditDomain(domain);
      this.results.push(result);
    }

    this.generateReport();
  }

  private async getDomainFiles(): Promise<string[]> {
    try {
      const files = await fs.readdir(DOMAINS_PATH);
      return files.filter((f) => f.endsWith(".ts") && !f.includes(".d.ts"));
    } catch (error) {
      console.error("❌ Could not read domains directory:", error);
      return [];
    }
  }

  private async auditDomain(domain: string): Promise<DomainAuditResult> {
    const result: DomainAuditResult = {
      domain,
      status: "pass",
      dtoFile: join(DTOS_PATH, `${domain}.ts`),
      validatorFile: join(VALIDATORS_PATH, `${domain}.ts`),
      domainFile: join(DOMAINS_PATH, `${domain}.ts`),
      issues: [],
      summary: {
        totalDtoTypes: 0,
        totalValidatorSchemas: 0,
        missingDtoImports: 0,
        missingValidatorImports: 0,
        extraImports: 0,
      },
    };

    try {
      // Read all files
      const [dtoContent, validatorContent, domainContent] = await Promise.all([
        this.readFileIfExists(result.dtoFile),
        this.readFileIfExists(result.validatorFile),
        this.readFileIfExists(result.domainFile),
      ]);

      if (!domainContent) {
        result.issues.push({
          type: "file_not_found",
          severity: "error",
          message: `Domain file not found: ${result.domainFile}`,
        });
        result.status = "fail";
        return result;
      }

      // Extract exports from DTO and validator files
      const dtoExports = dtoContent ? this.extractDtoExports(dtoContent) : [];
      const validatorExports = validatorContent
        ? this.extractValidatorExports(validatorContent)
        : [];

      // Extract imports from domain file
      const domainImports = this.extractDomainImports(domainContent);

      // Update summary
      result.summary.totalDtoTypes = dtoExports.length;
      result.summary.totalValidatorSchemas = validatorExports.length;

      // Check for missing DTO imports
      const missingDtoImports = dtoExports.filter(
        (exp) =>
          !domainImports.dtoImports.includes(exp) && !this.isCommonType(exp),
      );

      // Check for missing validator imports
      const missingValidatorImports = validatorExports.filter(
        (exp) =>
          !domainImports.validatorImports.includes(exp) &&
          !this.isCommonSchema(exp),
      );

      // Check for extra imports (imports that don't exist in source files)
      const extraDtoImports = domainImports.dtoImports.filter(
        (imp) => !dtoExports.includes(imp) && !this.isCommonType(imp),
      );

      const extraValidatorImports = domainImports.validatorImports.filter(
        (imp) => !validatorExports.includes(imp) && !this.isCommonSchema(imp),
      );

      // Add issues
      missingDtoImports.forEach((item) => {
        result.issues.push({
          type: "missing_dto_import",
          severity: "warning",
          message: `DTO type '${item}' exists but not imported in domain`,
          item,
        });
      });

      missingValidatorImports.forEach((item) => {
        result.issues.push({
          type: "missing_validator_import",
          severity: "warning",
          message: `Validator schema '${item}' exists but not imported in domain`,
          item,
        });
      });

      extraDtoImports.forEach((item) => {
        result.issues.push({
          type: "extra_import",
          severity: "error",
          message: `DTO type '${item}' imported but doesn't exist in DTO file`,
          item,
        });
      });

      extraValidatorImports.forEach((item) => {
        result.issues.push({
          type: "extra_import",
          severity: "error",
          message: `Validator schema '${item}' imported but doesn't exist in validator file`,
          item,
        });
      });

      // Update summary
      result.summary.missingDtoImports = missingDtoImports.length;
      result.summary.missingValidatorImports = missingValidatorImports.length;
      result.summary.extraImports =
        extraDtoImports.length + extraValidatorImports.length;

      // Determine status
      const errorCount = result.issues.filter(
        (i) => i.severity === "error",
      ).length;
      const warningCount = result.issues.filter(
        (i) => i.severity === "warning",
      ).length;

      if (errorCount > 0) {
        result.status = "fail";
      } else if (warningCount > 0) {
        result.status = "warning";
      }
    } catch (error) {
      result.issues.push({
        type: "file_not_found",
        severity: "error",
        message: `Error auditing domain: ${error}`,
      });
      result.status = "fail";
    }

    return result;
  }

  private async readFileIfExists(filePath: string): Promise<string | null> {
    try {
      return await fs.readFile(filePath, "utf-8");
    } catch {
      return null;
    }
  }

  private extractDtoExports(content: string): string[] {
    const exports: string[] = [];

    // Extract interface exports
    const interfaceMatches = content.matchAll(/^export\s+interface\s+(\w+)/gm);
    for (const match of interfaceMatches) {
      exports.push(match[1]);
    }

    // Extract type exports
    const typeMatches = content.matchAll(/^export\s+type\s+(\w+)/gm);
    for (const match of typeMatches) {
      exports.push(match[1]);
    }

    return exports.sort();
  }

  private extractValidatorExports(content: string): string[] {
    const exports: string[] = [];

    // Extract schema (const) and function exports
    // This pattern captures 'export const NAME = ...' and 'export function NAME(...)'
    const matches = content.matchAll(/^export\s+(?:const|function)\s+(\w+)/gm);
    for (const match of matches) {
      // Add the captured name to the exports list
      // Basic filtering to avoid internal Zod variables if present, though typically not exported
      if (!match[1].startsWith("z")) {
        exports.push(match[1]);
      }
    }

    return exports.sort();
  }

  private extractDomainImports(content: string): {
    dtoImports: string[];
    validatorImports: string[];
  } {
    const dtoImports: string[] = [];
    const validatorImports: string[] = [];

    // Extract DTO imports (from "../dtos/...")
    const dtoImportMatch = content.match(
      /import\s+type\s*\{([^}]+)\}\s*from\s*['""]\.\.\/dtos\/\w+['""];?/s,
    );
    if (dtoImportMatch) {
      const imports = this.parseImportList(dtoImportMatch[1]);
      dtoImports.push(...imports);
    }

    // Extract validator imports (from "../validators/...")
    const validatorImportMatch = content.match(
      /import\s*\{([^}]+)\}\s*from\s*['""]\.\.\/validators\/\w+['""];?/s,
    );
    if (validatorImportMatch) {
      const imports = this.parseImportList(validatorImportMatch[1]);
      validatorImports.push(...imports);
    }

    return {
      dtoImports: dtoImports.sort(),
      validatorImports: validatorImports.sort(),
    };
  }

  private parseImportList(importText: string): string[] {
    // Split by lines first to handle comment lines properly
    const lines = importText.split("\n");
    const cleanedLines: string[] = [];

    for (const line of lines) {
      // Remove inline comments and trim
      const cleaned = line.replace(/\/\/.*$/, "").trim();
      if (cleaned && !cleaned.startsWith("//")) {
        cleanedLines.push(cleaned);
      }
    }

    // Join back and split by commas
    const rejoined = cleanedLines.join(" ");
    return rejoined
      .split(",")
      .map((s) => {
        // Clean up and remove 'as' aliases
        const cleaned = s
          .trim()
          .replace(/\s+as\s+\w+/, "")
          .trim();
        return cleaned;
      })
      .filter((s) => s && s.length > 0 && !s.startsWith("//"));
  }

  private isCommonType(type: string): boolean {
    const commonTypes = [
      "MoneyAmount",
      "Address",
      "PaginationRequest",
      "PaginationResponse",
      "ApiResponse",
      "ApiError",
    ];
    return commonTypes.includes(type);
  }

  private isCommonSchema(schema: string): boolean {
    const commonSchemas = [
      "moneyAmountSchema",
      "addressSchema",
      "paginationRequestSchema",
      "paginationResponseSchema",
    ];
    return commonSchemas.includes(schema);
  }

  private generateReport(): void {
    console.log("\n" + "=".repeat(80));
    console.log("📊 DOMAIN AUDIT REPORT");
    console.log("=".repeat(80));

    const passCount = this.results.filter((r) => r.status === "pass").length;
    const warningCount = this.results.filter(
      (r) => r.status === "warning",
    ).length;
    const failCount = this.results.filter((r) => r.status === "fail").length;

    console.log(`\n📈 Overall Status:`);
    console.log(`   ✅ Pass: ${passCount}`);
    console.log(`   ⚠️  Warning: ${warningCount}`);
    console.log(`   ❌ Fail: ${failCount}`);

    // Detailed results
    for (const result of this.results) {
      this.printDomainResult(result);
    }

    // Summary
    const totalIssues = this.results.reduce(
      (sum, r) => sum + r.issues.length,
      0,
    );
    const criticalIssues = this.results.reduce(
      (sum, r) => sum + r.issues.filter((i) => i.severity === "error").length,
      0,
    );

    console.log("\n" + "=".repeat(80));
    console.log("📋 SUMMARY");
    console.log("=".repeat(80));
    console.log(`Total Domains Audited: ${this.results.length}`);
    console.log(`Total Issues Found: ${totalIssues}`);
    console.log(`Critical Issues: ${criticalIssues}`);

    if (criticalIssues === 0 && warningCount === 0) {
      console.log("\n🎉 All domains are properly configured!");
      console.log("✅ Ready to proceed with deep import removal.");
    } else if (criticalIssues === 0) {
      console.log("\n⚠️  Some domains have warnings but no critical errors.");
      console.log("✅ You can proceed but should address warnings.");
    } else {
      console.log(
        "\n❌ Critical issues found that must be fixed before proceeding.",
      );
      console.log("🔧 Please address all error-level issues first.");
    }

    // Exit with appropriate code
    process.exit(criticalIssues > 0 ? 1 : 0);
  }

  private printDomainResult(result: DomainAuditResult): void {
    const statusIcon =
      result.status === "pass"
        ? "✅"
        : result.status === "warning"
          ? "⚠️"
          : "❌";

    console.log(`\n${statusIcon} ${result.domain.toUpperCase()} DOMAIN`);
    console.log("-".repeat(50));

    if (result.issues.length === 0) {
      console.log("   No issues found");
    } else {
      result.issues.forEach((issue) => {
        const icon =
          issue.severity === "error"
            ? "❌"
            : issue.severity === "warning"
              ? "⚠️"
              : "ℹ️";
        console.log(`   ${icon} ${issue.message}`);
        if (issue.item) {
          console.log(`      → ${issue.item}`);
        }
      });
    }

    // Print summary stats
    console.log(`\n   📊 Stats:`);
    console.log(`      DTO Types: ${result.summary.totalDtoTypes}`);
    console.log(
      `      Validator Schemas: ${result.summary.totalValidatorSchemas}`,
    );
    console.log(
      `      Missing DTO Imports: ${result.summary.missingDtoImports}`,
    );
    console.log(
      `      Missing Validator Imports: ${result.summary.missingValidatorImports}`,
    );
    console.log(`      Extra Imports: ${result.summary.extraImports}`);
  }
}

// Run the audit
async function main() {
  try {
    const auditor = new DomainAuditor();
    await auditor.auditAllDomains();
  } catch (error) {
    console.error("❌ Audit failed:", error);
    process.exit(1);
  }
}

// Execute if run directly
if (import.meta.main) {
  main();
}
