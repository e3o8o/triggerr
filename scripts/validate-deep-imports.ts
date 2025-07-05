#!/usr/bin/env bun

/**
 * Deep Import Validation Script
 *
 * Validates that no deep imports are used in the triggerr codebase.
 * This ensures clean barrel exports and enterprise-ready SDK distribution.
 *
 * Usage: bun run scripts/validate-deep-imports.ts
 */

import { promises as fs } from 'fs';
import { glob } from 'glob';
import * as path from 'path';

// Deep import patterns that are forbidden
const FORBIDDEN_DEEP_IMPORT_PATTERNS = [
  // Core package deep imports
  /@triggerr\/core\/database(?!$)/,
  /@triggerr\/core\/auth(?!$)/,
  /@triggerr\/core\/utils\/[^'"]*['"`]/,
  /@triggerr\/core\/types\/[^'"]*['"`]/,
  /@triggerr\/core\/logging\/[^'"]*['"`]/,

  // API contracts deep imports
  /@triggerr\/api-contracts\/dtos\/[^'"]*['"`]/,
  /@triggerr\/api-contracts\/validators\/[^'"]*['"`]/,
  /@triggerr\/api-contracts\/schemas\/[^'"]*['"`]/,

  // Blockchain package deep imports
  /@triggerr\/paygo-adapter\/src\/[^'"]*['"`]/,
  /@triggerr\/blockchain-interface\/src\/[^'"]*['"`]/,
  /@triggerr\/service-registry\/src\/[^'"]*['"`]/,

  // Services deep imports
  /@triggerr\/wallet-service\/src\/[^'"]*['"`]/,
  /@triggerr\/escrow-engine\/src\/[^'"]*['"`]/,
  /@triggerr\/quote-engine\/src\/[^'"]*['"`]/,
  /@triggerr\/policy-engine\/src\/[^'"]*['"`]/,
  /@triggerr\/payout-engine\/src\/[^'"]*['"`]/,

  // Integration package deep imports
  /@triggerr\/stripe-adapter\/src\/[^'"]*['"`]/,
  /@triggerr\/flightaware-adapter\/src\/[^'"]*['"`]/,
  /@triggerr\/aviationstack-adapter\/src\/[^'"]*['"`]/,
  /@triggerr\/opensky-adapter\/src\/[^'"]*['"`]/,
  /@triggerr\/google-weather-adapter\/src\/[^'"]*['"`]/,

  // Aggregator deep imports
  /@triggerr\/flight-aggregator\/src\/[^'"]*['"`]/,
  /@triggerr\/weather-aggregator\/src\/[^'"]*['"`]/,
  /@triggerr\/data-router\/src\/[^'"]*['"`]/,

  // LLM package deep imports
  /@triggerr\/llm-interface\/src\/[^'"]*['"`]/,
  /@triggerr\/deepseek-adapter\/src\/[^'"]*['"`]/,

  // Shared package deep imports (should use barrel exports)
  /@triggerr\/shared\/src\/[^'"]*['"`]/,
  /@triggerr\/utils\/src\/[^'"]*['"`]/,
  /@triggerr\/config\/src\/[^'"]*['"`]/,
  /@triggerr\/ui\/src\/[^'"]*['"`]/,
];

// Critical patterns for enterprise SDK (highest priority)
const ENTERPRISE_SDK_CRITICAL_PATTERNS = [
  /@triggerr\/core\/database/,
  /@triggerr\/core\/auth/,
  /@triggerr\/api-contracts\/dtos/,
  /@triggerr\/api-contracts\/validators/,
];

// Directories to exclude from validation
const EXCLUDED_DIRECTORIES = [
  'node_modules',
  'dist',
  'build',
  'coverage',
  '.turbo',
  '.next',
  '__tests__',
  '__mocks__',
  'test',
  'tests',
  'examples',
  '.git',
];

// File extensions to check
const INCLUDED_EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx'];

interface ValidationResult {
  filePath: string;
  line: number;
  column: number;
  violation: string;
  pattern: RegExp;
  severity: 'critical' | 'high' | 'medium';
  suggestion?: string;
}

interface ValidationSummary {
  totalFiles: number;
  violationsCount: number;
  criticalViolations: number;
  highViolations: number;
  mediumViolations: number;
  cleanFiles: number;
  violations: ValidationResult[];
}

/**
 * Check if a file should be excluded from validation
 */
function shouldExcludeFile(filePath: string): boolean {
  const normalizedPath = path.normalize(filePath);

  return EXCLUDED_DIRECTORIES.some(excludedDir =>
    normalizedPath.includes(`/${excludedDir}/`) ||
    normalizedPath.includes(`\\${excludedDir}\\`) ||
    normalizedPath.startsWith(`${excludedDir}/`) ||
    normalizedPath.startsWith(`${excludedDir}\\`)
  );
}

/**
 * Check if file extension should be included
 */
function shouldIncludeFile(filePath: string): boolean {
  const ext = path.extname(filePath);
  return INCLUDED_EXTENSIONS.includes(ext);
}

/**
 * Get severity level for a pattern
 */
function getSeverity(pattern: RegExp): 'critical' | 'high' | 'medium' {
  if (ENTERPRISE_SDK_CRITICAL_PATTERNS.some(criticalPattern =>
    criticalPattern.source === pattern.source)) {
    return 'critical';
  }

  // Core and API contracts are high priority
  if (pattern.source.includes('core') || pattern.source.includes('api-contracts')) {
    return 'high';
  }

  return 'medium';
}

/**
 * Generate suggestions for fixing violations
 */
function generateSuggestion(violation: string, pattern: RegExp): string {
  if (pattern.source.includes('core/database')) {
    return 'Use: import { Database } from "@triggerr/core";';
  }

  if (pattern.source.includes('core/auth')) {
    return 'Use: import { Auth } from "@triggerr/core";';
  }

  if (pattern.source.includes('api-contracts/dtos')) {
    return 'Use domain-specific imports: import { Insurance, Policy, Wallet } from "@triggerr/api-contracts";';
  }

  if (pattern.source.includes('api-contracts/validators')) {
    return 'Use domain validators: import { Insurance } from "@triggerr/api-contracts"; then Insurance.validators.quoteRequest';
  }

  if (pattern.source.includes('paygo-adapter/src')) {
    return 'Use: import { formatBalanceDisplay, formatAddressDisplay } from "@triggerr/blockchain";';
  }

  return 'Use barrel imports from the package root.';
}

/**
 * Validate a single file for deep import violations
 */
async function validateFile(filePath: string): Promise<ValidationResult[]> {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    const lines = content.split('\n');
    const violations: ValidationResult[] = [];

    for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
      const line = lines[lineIndex];

      // Skip comments and non-import lines for performance
      if (!line.includes('import') && !line.includes('require')) {
        continue;
      }

      for (const pattern of FORBIDDEN_DEEP_IMPORT_PATTERNS) {
        const match = pattern.exec(line);
        if (match) {
          const violation = match[0];
          const column = match.index || 0;
          const severity = getSeverity(pattern);
          const suggestion = generateSuggestion(violation, pattern);

          violations.push({
            filePath,
            line: lineIndex + 1,
            column: column + 1,
            violation,
            pattern,
            severity,
            suggestion,
          });
        }
      }
    }

    return violations;
  } catch (error) {
    console.warn(`Warning: Could not read file ${filePath}:`, error.message);
    return [];
  }
}

/**
 * Get all TypeScript/JavaScript files to validate
 */
async function getFilesToValidate(): Promise<string[]> {
  const patterns = [
    'apps/**/*.{ts,tsx,js,jsx}',
    'packages/**/*.{ts,tsx,js,jsx}',
    'scripts/**/*.{ts,tsx,js,jsx}',
  ];

  let allFiles: string[] = [];

  for (const pattern of patterns) {
    try {
      const files = await glob(pattern, {
        ignore: EXCLUDED_DIRECTORIES.map(dir => `**/${dir}/**`),
        absolute: false,
      });
      allFiles = allFiles.concat(files);
    } catch (error) {
      console.warn(`Warning: Could not glob pattern ${pattern}:`, error.message);
    }
  }

  // Filter files
  const filteredFiles = allFiles.filter(file =>
    shouldIncludeFile(file) && !shouldExcludeFile(file)
  );

  // Remove duplicates
  return Array.from(new Set(filteredFiles));
}

/**
 * Validate all files and generate summary
 */
async function validateDeepImports(): Promise<ValidationSummary> {
  console.log('🔍 Scanning for deep import violations...\n');

  const files = await getFilesToValidate();
  console.log(`📁 Found ${files.length} files to validate\n`);

  const allViolations: ValidationResult[] = [];
  let processedFiles = 0;

  // Process files in batches for better performance
  const batchSize = 50;
  for (let i = 0; i < files.length; i += batchSize) {
    const batch = files.slice(i, i + batchSize);
    const batchPromises = batch.map(async (file) => {
      const violations = await validateFile(file);
      processedFiles++;

      if (processedFiles % 100 === 0) {
        console.log(`⏳ Processed ${processedFiles}/${files.length} files...`);
      }

      return violations;
    });

    const batchResults = await Promise.all(batchPromises);
    batchResults.forEach(violations => allViolations.push(...violations));
  }

  // Calculate summary statistics
  const criticalViolations = allViolations.filter(v => v.severity === 'critical').length;
  const highViolations = allViolations.filter(v => v.severity === 'high').length;
  const mediumViolations = allViolations.filter(v => v.severity === 'medium').length;

  const filesWithViolations = new Set(allViolations.map(v => v.filePath)).size;
  const cleanFiles = files.length - filesWithViolations;

  return {
    totalFiles: files.length,
    violationsCount: allViolations.length,
    criticalViolations,
    highViolations,
    mediumViolations,
    cleanFiles,
    violations: allViolations,
  };
}

/**
 * Print validation results
 */
function printResults(summary: ValidationSummary): void {
  console.log('\n' + '='.repeat(80));
  console.log('📊 DEEP IMPORT VALIDATION RESULTS');
  console.log('='.repeat(80));

  // Summary statistics
  console.log('\n📈 Summary:');
  console.log(`   Total files scanned: ${summary.totalFiles}`);
  console.log(`   Clean files: ${summary.cleanFiles} ✅`);
  console.log(`   Files with violations: ${summary.totalFiles - summary.cleanFiles}`);
  console.log(`   Total violations: ${summary.violationsCount}`);

  if (summary.violationsCount === 0) {
    console.log('\n🎉 VALIDATION PASSED! No deep import violations found.');
    console.log('✅ Your codebase is ready for enterprise SDK distribution.');
    return;
  }

  // Violation breakdown
  console.log('\n🚨 Violation Breakdown:');
  console.log(`   Critical: ${summary.criticalViolations} 🔴`);
  console.log(`   High: ${summary.highViolations} 🟡`);
  console.log(`   Medium: ${summary.mediumViolations} 🟢`);

  // Group violations by file
  const violationsByFile = new Map<string, ValidationResult[]>();
  summary.violations.forEach(violation => {
    if (!violationsByFile.has(violation.filePath)) {
      violationsByFile.set(violation.filePath, []);
    }
    violationsByFile.get(violation.filePath)!.push(violation);
  });

  console.log('\n📄 Detailed Violations:');
  console.log('-'.repeat(80));

  // Sort files by severity (critical first)
  const sortedFiles = Array.from(violationsByFile.entries()).sort((a, b) => {
    const aMaxSeverity = Math.max(...a[1].map(v =>
      v.severity === 'critical' ? 3 : v.severity === 'high' ? 2 : 1
    ));
    const bMaxSeverity = Math.max(...b[1].map(v =>
      v.severity === 'critical' ? 3 : v.severity === 'high' ? 2 : 1
    ));
    return bMaxSeverity - aMaxSeverity;
  });

  for (const [filePath, violations] of sortedFiles.slice(0, 20)) { // Show first 20 files
    console.log(`\n📁 ${filePath}`);

    for (const violation of violations.slice(0, 5)) { // Show first 5 violations per file
      const severityIcon = violation.severity === 'critical' ? '🔴' :
                          violation.severity === 'high' ? '🟡' : '🟢';
      console.log(`   ${severityIcon} Line ${violation.line}:${violation.column} - ${violation.violation}`);
      if (violation.suggestion) {
        console.log(`      💡 ${violation.suggestion}`);
      }
    }

    if (violations.length > 5) {
      console.log(`      ... and ${violations.length - 5} more violations`);
    }
  }

  if (sortedFiles.length > 20) {
    console.log(`\n... and ${sortedFiles.length - 20} more files with violations`);
  }

  // Enterprise SDK specific warnings
  if (summary.criticalViolations > 0) {
    console.log('\n🚨 CRITICAL: Enterprise SDK Distribution Blocked!');
    console.log('   Critical violations must be fixed before SDK can be distributed.');
    console.log('   These violations affect the public API surface.');
  }

  // Next steps
  console.log('\n🔧 Next Steps:');
  console.log('   1. Fix critical violations first (🔴)');
  console.log('   2. Update imports to use barrel exports');
  console.log('   3. Re-run validation: bun run scripts/validate-deep-imports.ts');
  console.log('   4. See DEEP_IMPORT_REMOVAL_PLAN.md for detailed guidance');
}

/**
 * Main execution function
 */
async function main(): Promise<void> {
  try {
    const startTime = Date.now();

    console.log('🚀 Starting Deep Import Validation...');
    console.log('📋 Checking for enterprise SDK distribution readiness\n');

    const summary = await validateDeepImports();
    const endTime = Date.now();

    printResults(summary);

    console.log(`\n⏱️  Validation completed in ${(endTime - startTime) / 1000}s`);

    // Exit with appropriate code
    if (summary.violationsCount > 0) {
      console.log('\n❌ Validation failed. Fix violations before proceeding.');
      process.exit(1);
    } else {
      console.log('\n✅ Validation passed. Codebase is clean!');
      process.exit(0);
    }

  } catch (error) {
    console.error('💥 Validation failed with error:', error);
    process.exit(1);
  }
}

// Handle script execution
if (import.meta.main) {
  main().catch(console.error);
}

export { validateDeepImports, ValidationResult, ValidationSummary };
