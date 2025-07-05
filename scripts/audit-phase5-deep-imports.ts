#!/usr/bin/env bun

/**
 * PHASE 5 AUDIT: Deep Import Detection for Applications
 *
 * This script audits Phase 5 packages (apps/*) for deep import violations
 * that prevent clean barrel exports and enterprise SDK distribution.
 *
 * Focus: Applications layer (apps/api, apps/web, apps/admin)
 */

import { promises as fs } from 'fs';
import { glob } from 'glob';
import path from 'path';

// Define the deep import patterns we're looking for
const DEEP_IMPORT_PATTERNS = [
  {
    pattern: /@triggerr\/core\/database(?![\w])/g,
    violation: '@triggerr/core/database',
    fix: '@triggerr/core (use Database namespace)',
    severity: 'HIGH'
  },
  {
    pattern: /@triggerr\/core\/database\/schema/g,
    violation: '@triggerr/core/database/schema',
    fix: '@triggerr/core (use Schema namespace)',
    severity: 'HIGH'
  },
  {
    pattern: /@triggerr\/core\/auth/g,
    violation: '@triggerr/core/auth',
    fix: '@triggerr/core (use Auth namespace)',
    severity: 'HIGH'
  },
  {
    pattern: /@triggerr\/core\/utils\/[\w-]+/g,
    violation: '@triggerr/core/utils/*',
    fix: '@triggerr/core (use Utils namespace)',
    severity: 'MEDIUM'
  },
  {
    pattern: /@triggerr\/api-contracts\/dtos\/[\w-]+/g,
    violation: '@triggerr/api-contracts/dtos/*',
    fix: '@triggerr/api-contracts (use domain exports)',
    severity: 'HIGH'
  },
  {
    pattern: /@triggerr\/api-contracts\/validators\/[\w-]+/g,
    violation: '@triggerr/api-contracts/validators/*',
    fix: '@triggerr/api-contracts (use domain validators)',
    severity: 'HIGH'
  },
  {
    pattern: /@triggerr\/paygo-adapter\/src\/utils/g,
    violation: '@triggerr/paygo-adapter/src/utils',
    fix: '@triggerr/blockchain (use PayGo utils)',
    severity: 'MEDIUM'
  },
  {
    pattern: /@triggerr\/blockchain\/paygo-adapter\/src\/[\w-]+/g,
    violation: '@triggerr/blockchain/paygo-adapter/src/*',
    fix: '@triggerr/blockchain (use clean exports)',
    severity: 'MEDIUM'
  }
];

// Phase 5 target directories
const PHASE5_DIRECTORIES = [
  'apps/api',
  'apps/web',
  'apps/admin'
];

interface DeepImportViolation {
  file: string;
  line: number;
  content: string;
  violation: string;
  fix: string;
  severity: string;
}

interface AuditResult {
  directory: string;
  violations: DeepImportViolation[];
  totalFiles: number;
  violationCount: number;
}

/**
 * Scans a single file for deep import violations
 */
async function scanFileForViolations(filePath: string): Promise<DeepImportViolation[]> {
  const violations: DeepImportViolation[] = [];

  try {
    const content = await fs.readFile(filePath, 'utf-8');
    const lines = content.split('\n');

    lines.forEach((line, index) => {
      DEEP_IMPORT_PATTERNS.forEach(({ pattern, violation, fix, severity }) => {
        const matches = line.match(pattern);
        if (matches) {
          matches.forEach(() => {
            violations.push({
              file: filePath,
              line: index + 1,
              content: line.trim(),
              violation,
              fix,
              severity
            });
          });
        }
      });
    });
  } catch (error) {
    console.warn(`Warning: Could not read file ${filePath}:`, error);
  }

  return violations;
}

/**
 * Audits a single directory for deep import violations
 */
async function auditDirectory(directory: string): Promise<AuditResult> {
  console.log(`🔍 Auditing ${directory}...`);

  const pattern = `${directory}/**/*.{ts,tsx,js,jsx}`;
  const files = await glob(pattern, {
    ignore: [
      '**/node_modules/**',
      '**/dist/**',
      '**/.next/**',
      '**/build/**',
      '**/*.d.ts',
      '**/*.test.ts',
      '**/*.spec.ts'
    ]
  });

  const allViolations: DeepImportViolation[] = [];

  for (const file of files) {
    const violations = await scanFileForViolations(file);
    allViolations.push(...violations);
  }

  return {
    directory,
    violations: allViolations,
    totalFiles: files.length,
    violationCount: allViolations.length
  };
}

/**
 * Generates a summary report of all violations
 */
function generateSummaryReport(results: AuditResult[]): void {
  console.log('\n' + '='.repeat(80));
  console.log('📊 PHASE 5 DEEP IMPORT AUDIT SUMMARY');
  console.log('='.repeat(80));

  let totalViolations = 0;
  let totalFiles = 0;

  results.forEach(result => {
    totalViolations += result.violationCount;
    totalFiles += result.totalFiles;

    console.log(`\n📁 ${result.directory}`);
    console.log(`   Files scanned: ${result.totalFiles}`);
    console.log(`   Violations: ${result.violationCount}`);

    if (result.violationCount > 0) {
      console.log(`   Status: ❌ NEEDS FIXING`);
    } else {
      console.log(`   Status: ✅ CLEAN`);
    }
  });

  console.log('\n' + '-'.repeat(80));
  console.log(`📊 TOTALS:`);
  console.log(`   Total files scanned: ${totalFiles}`);
  console.log(`   Total violations: ${totalViolations}`);

  if (totalViolations === 0) {
    console.log(`   🎉 Phase 5 Status: ✅ ALL CLEAN - READY FOR PRODUCTION!`);
  } else {
    console.log(`   ⚠️  Phase 5 Status: ❌ ${totalViolations} violations need fixing`);
  }
}

/**
 * Generates detailed violation reports by directory
 */
function generateDetailedReports(results: AuditResult[]): void {
  results.forEach(result => {
    if (result.violationCount === 0) return;

    console.log('\n' + '='.repeat(80));
    console.log(`📁 DETAILED REPORT: ${result.directory}`);
    console.log('='.repeat(80));

    // Group violations by file
    const violationsByFile = result.violations.reduce((acc, violation) => {
      if (!acc[violation.file]) {
        acc[violation.file] = [];
      }
      acc[violation.file].push(violation);
      return acc;
    }, {} as Record<string, DeepImportViolation[]>);

    Object.entries(violationsByFile).forEach(([file, violations]) => {
      console.log(`\n📄 ${file}`);
      violations.forEach(v => {
        console.log(`   Line ${v.line}: ${v.severity} - ${v.violation}`);
        console.log(`   Code: ${v.content}`);
        console.log(`   Fix:  ${v.fix}`);
        console.log('');
      });
    });
  });
}

/**
 * Generates actionable fix commands
 */
function generateFixCommands(results: AuditResult[]): void {
  console.log('\n' + '='.repeat(80));
  console.log('🔧 SUGGESTED FIX COMMANDS');
  console.log('='.repeat(80));

  const violationsWithFiles = results.flatMap(result =>
    result.violations.map(v => ({ ...v, directory: result.directory }))
  );

  if (violationsWithFiles.length === 0) {
    console.log('✅ No fixes needed - all applications are clean!');
    return;
  }

  // Group by violation type for easier batch processing
  const violationsByType = violationsWithFiles.reduce((acc, violation) => {
    if (!acc[violation.violation]) {
      acc[violation.violation] = [];
    }
    acc[violation.violation].push(violation);
    return acc;
  }, {} as Record<string, DeepImportViolation[]>);

  console.log('\n📋 Fix Pattern by Violation Type:');
  Object.entries(violationsByType).forEach(([violationType, violations]) => {
    console.log(`\n🔸 ${violationType} (${violations.length} occurrences)`);
    console.log(`   Recommended fix: ${violations[0].fix}`);

    // Show unique files affected
    const uniqueFiles = [...new Set(violations.map(v => v.file))];
    console.log(`   Files affected: ${uniqueFiles.length}`);
    uniqueFiles.slice(0, 5).forEach(file => {
      console.log(`     - ${file}`);
    });
    if (uniqueFiles.length > 5) {
      console.log(`     ... and ${uniqueFiles.length - 5} more files`);
    }
  });

  console.log('\n📋 Recommended Execution Order:');
  console.log('1. Start with apps/api (most critical for enterprise SDK)');
  console.log('2. Fix one file completely and test');
  console.log('3. Apply pattern to remaining files in apps/api');
  console.log('4. Move to apps/web and apps/admin');
  console.log('5. Run final validation with: bun run scripts/validate-imports.ts');
}

/**
 * Main audit execution
 */
async function main(): Promise<void> {
  console.log('🚀 Starting Phase 5 Deep Import Audit...');
  console.log(`📂 Target directories: ${PHASE5_DIRECTORIES.join(', ')}`);

  const results: AuditResult[] = [];

  // Audit each directory
  for (const directory of PHASE5_DIRECTORIES) {
    try {
      const result = await auditDirectory(directory);
      results.push(result);
    } catch (error) {
      console.error(`❌ Failed to audit ${directory}:`, error);
    }
  }

  // Generate reports
  generateSummaryReport(results);
  generateDetailedReports(results);
  generateFixCommands(results);

  // Exit with appropriate code
  const totalViolations = results.reduce((sum, r) => sum + r.violationCount, 0);
  if (totalViolations > 0) {
    console.log(`\n❌ Audit completed with ${totalViolations} violations to fix.`);
    process.exit(1);
  } else {
    console.log(`\n✅ Audit completed successfully - Phase 5 is clean!`);
    process.exit(0);
  }
}

// Execute the audit
main().catch(error => {
  console.error('💥 Audit script failed:', error);
  process.exit(1);
});
