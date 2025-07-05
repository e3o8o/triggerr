#!/usr/bin/env bun

/**
 * Phase 4 Deep Import Audit Script
 *
 * This script audits Phase 4 packages for deep import violations and tracks progress
 * toward achieving zero deep imports in the services, integrations, aggregators,
 * and blockchain layers.
 *
 * Target Packages:
 * - @triggerr/services/* (5 packages)
 * - @triggerr/integrations/* (5 packages)
 * - @triggerr/aggregators/* (3 packages)
 * - @triggerr/blockchain/* (3 packages)
 *
 * Usage: bun run scripts/audit-phase4-deep-imports.ts
 */

import { promises as fs } from 'fs';
import { glob } from 'glob';
import path from 'path';

// Deep import patterns to detect
const DEEP_IMPORT_PATTERNS = [
  // Core package deep imports
  {
    pattern: /@triggerr\/core\/database(?!$)/,
    description: '@triggerr/core/database (should use @triggerr/core)',
    severity: 'critical' as const
  },
  {
    pattern: /@triggerr\/core\/database\/schema/,
    description: '@triggerr/core/database/schema (should use @triggerr/core)',
    severity: 'critical' as const
  },
  {
    pattern: /@triggerr\/core\/auth/,
    description: '@triggerr/core/auth (should use @triggerr/core)',
    severity: 'critical' as const
  },
  {
    pattern: /@triggerr\/core\/utils\/[^'"]+/,
    description: '@triggerr/core/utils/* (should use @triggerr/core)',
    severity: 'critical' as const
  },

  // API contracts deep imports
  {
    pattern: /@triggerr\/api-contracts\/dtos\/[^'"]+/,
    description: '@triggerr/api-contracts/dtos/* (should use @triggerr/api-contracts)',
    severity: 'critical' as const
  },
  {
    pattern: /@triggerr\/api-contracts\/validators\/[^'"]+/,
    description: '@triggerr/api-contracts/validators/* (should use @triggerr/api-contracts)',
    severity: 'critical' as const
  },

  // Blockchain adapter deep imports
  {
    pattern: /@triggerr\/paygo-adapter\/src\/[^'"]+/,
    description: '@triggerr/paygo-adapter/src/* (should use @triggerr/paygo-adapter)',
    severity: 'high' as const
  },

  // Config deep imports
  {
    pattern: /@triggerr\/config\/[^'"]+/,
    description: '@triggerr/config/* (should use @triggerr/config)',
    severity: 'medium' as const
  },

  // Cross-package deep imports
  {
    pattern: /@triggerr\/[^'"]+\/src\/[^'"]+/,
    description: 'Generic deep import (should use package root)',
    severity: 'high' as const
  }
];

// Phase 4 target directories
const PHASE4_DIRECTORIES = [
  'packages/services',
  'packages/integrations',
  'packages/aggregators',
  'packages/blockchain'
];

interface DeepImportViolation {
  file: string;
  line: number;
  content: string;
  pattern: string;
  description: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  packageCategory: 'services' | 'integrations' | 'aggregators' | 'blockchain';
  packageName: string;
}

interface AuditResults {
  totalViolations: number;
  violationsByCategory: Record<string, number>;
  violationsBySeverity: Record<string, number>;
  violationsByPackage: Record<string, number>;
  violations: DeepImportViolation[];
  auditDate: string;
  phase4Packages: {
    services: string[];
    integrations: string[];
    aggregators: string[];
    blockchain: string[];
  };
}

/**
 * Determines package category from file path
 */
function getPackageCategory(filePath: string): 'services' | 'integrations' | 'aggregators' | 'blockchain' {
  if (filePath.includes('packages/services/')) return 'services';
  if (filePath.includes('packages/integrations/')) return 'integrations';
  if (filePath.includes('packages/aggregators/')) return 'aggregators';
  if (filePath.includes('packages/blockchain/')) return 'blockchain';
  throw new Error(`Unknown package category for ${filePath}`);
}

/**
 * Extracts package name from file path
 */
function getPackageName(filePath: string): string {
  const match = filePath.match(/packages\/[^\/]+\/([^\/]+)/);
  return match ? match[1] : 'unknown';
}

/**
 * Scans a file for deep import violations
 */
async function scanFileForViolations(filePath: string): Promise<DeepImportViolation[]> {
  const violations: DeepImportViolation[] = [];

  try {
    const content = await fs.readFile(filePath, 'utf-8');
    const lines = content.split('\n');

    lines.forEach((line, index) => {
      for (const { pattern, description, severity } of DEEP_IMPORT_PATTERNS) {
        if (pattern.test(line)) {
          violations.push({
            file: filePath,
            line: index + 1,
            content: line.trim(),
            pattern: pattern.source,
            description,
            severity,
            packageCategory: getPackageCategory(filePath),
            packageName: getPackageName(filePath)
          });
        }
      }
    });
  } catch (error) {
    console.warn(`Warning: Could not read file ${filePath}:`, error);
  }

  return violations;
}

/**
 * Discovers all Phase 4 packages
 */
async function discoverPhase4Packages() {
  const packages = {
    services: [] as string[],
    integrations: [] as string[],
    aggregators: [] as string[],
    blockchain: [] as string[]
  };

  for (const dir of PHASE4_DIRECTORIES) {
    try {
      const entries = await fs.readdir(dir);
      const category = path.basename(dir) as keyof typeof packages;

      for (const entry of entries) {
        const entryPath = path.join(dir, entry);
        const stat = await fs.stat(entryPath);
        if (stat.isDirectory()) {
          packages[category].push(entry);
        }
      }
    } catch (error) {
      console.warn(`Warning: Could not read directory ${dir}:`, error);
    }
  }

  return packages;
}

/**
 * Main audit function
 */
async function auditPhase4DeepImports(): Promise<AuditResults> {
  console.log('🔍 Starting Phase 4 Deep Import Audit...\n');

  // Discover all Phase 4 packages
  const phase4Packages = await discoverPhase4Packages();

  console.log('📦 Phase 4 Packages Discovered:');
  console.log(`   Services (${phase4Packages.services.length}): ${phase4Packages.services.join(', ')}`);
  console.log(`   Integrations (${phase4Packages.integrations.length}): ${phase4Packages.integrations.join(', ')}`);
  console.log(`   Aggregators (${phase4Packages.aggregators.length}): ${phase4Packages.aggregators.join(', ')}`);
  console.log(`   Blockchain (${phase4Packages.blockchain.length}): ${phase4Packages.blockchain.join(', ')}`);
  console.log('');

  // Find all TypeScript files in Phase 4 directories
  const allViolations: DeepImportViolation[] = [];

  for (const dir of PHASE4_DIRECTORIES) {
    try {
      const pattern = `${dir}/**/*.{ts,tsx}`;
      const files = await glob(pattern, {
        ignore: [
          '**/node_modules/**',
          '**/dist/**',
          '**/.turbo/**',
          '**/coverage/**',
          '**/*.d.ts'
        ]
      });

      console.log(`📁 Scanning ${files.length} files in ${dir}...`);

      for (const file of files) {
        const violations = await scanFileForViolations(file);
        allViolations.push(...violations);
      }
    } catch (error) {
      console.warn(`Warning: Could not scan directory ${dir}:`, error);
    }
  }

  // Aggregate results
  const violationsByCategory: Record<string, number> = {
    services: 0,
    integrations: 0,
    aggregators: 0,
    blockchain: 0
  };

  const violationsBySeverity: Record<string, number> = {
    critical: 0,
    high: 0,
    medium: 0,
    low: 0
  };

  const violationsByPackage: Record<string, number> = {};

  allViolations.forEach(violation => {
    violationsByCategory[violation.packageCategory]++;
    violationsBySeverity[violation.severity]++;
    violationsByPackage[violation.packageName] = (violationsByPackage[violation.packageName] || 0) + 1;
  });

  return {
    totalViolations: allViolations.length,
    violationsByCategory,
    violationsBySeverity,
    violationsByPackage,
    violations: allViolations,
    auditDate: new Date().toISOString(),
    phase4Packages
  };
}

/**
 * Formats and displays audit results
 */
function displayResults(results: AuditResults): void {
  console.log('');
  console.log('=' .repeat(80));
  console.log('📊 PHASE 4 DEEP IMPORT AUDIT RESULTS');
  console.log('=' .repeat(80));
  console.log('');

  // Overall summary
  console.log('🎯 **OVERALL SUMMARY**');
  console.log(`   Total Violations: ${results.totalViolations}`);
  console.log(`   Audit Date: ${new Date(results.auditDate).toLocaleString()}`);
  console.log('');

  // Status indicator
  if (results.totalViolations === 0) {
    console.log('🎉 SUCCESS: Phase 4 has zero deep imports! ✅');
    console.log('   Ready to proceed to Phase 5 (Applications)');
  } else {
    console.log('⚠️  WORK NEEDED: Deep imports found in Phase 4 packages');
    console.log('   Continue with Phase 4 implementation');
  }
  console.log('');

  // Violations by category
  console.log('📦 **VIOLATIONS BY PACKAGE CATEGORY**');
  const categories = Object.entries(results.violationsByCategory);
  categories.forEach(([category, count]) => {
    const status = count === 0 ? '✅' : '❌';
    console.log(`   ${status} ${category.padEnd(12)} : ${count} violations`);
  });
  console.log('');

  // Violations by severity
  console.log('🚨 **VIOLATIONS BY SEVERITY**');
  const severities = Object.entries(results.violationsBySeverity);
  severities.forEach(([severity, count]) => {
    if (count > 0) {
      const emoji = severity === 'critical' ? '🔴' : severity === 'high' ? '🟡' : '🟢';
      console.log(`   ${emoji} ${severity.padEnd(8)} : ${count} violations`);
    }
  });
  console.log('');

  // Violations by package
  if (Object.keys(results.violationsByPackage).length > 0) {
    console.log('📁 **VIOLATIONS BY PACKAGE**');
    const packages = Object.entries(results.violationsByPackage)
      .sort(([,a], [,b]) => b - a); // Sort by violation count desc

    packages.forEach(([packageName, count]) => {
      console.log(`   ❌ ${packageName.padEnd(25)} : ${count} violations`);
    });
    console.log('');
  }

  // Detailed violations (if any)
  if (results.violations.length > 0) {
    console.log('🔍 **DETAILED VIOLATIONS**');
    console.log('');

    const groupedViolations = results.violations.reduce((acc, violation) => {
      const key = violation.packageName;
      if (!acc[key]) acc[key] = [];
      acc[key].push(violation);
      return acc;
    }, {} as Record<string, DeepImportViolation[]>);

    Object.entries(groupedViolations).forEach(([packageName, violations]) => {
      console.log(`📦 **${packageName}** (${violations.length} violations):`);
      violations.forEach(violation => {
        const severityEmoji = violation.severity === 'critical' ? '🔴' :
                              violation.severity === 'high' ? '🟡' : '🟢';
        console.log(`   ${severityEmoji} ${path.relative(process.cwd(), violation.file)}:${violation.line}`);
        console.log(`      Pattern: ${violation.description}`);
        console.log(`      Code: ${violation.content}`);
        console.log('');
      });
    });
  }

  // Next steps
  console.log('🎯 **NEXT STEPS**');
  if (results.totalViolations === 0) {
    console.log('   ✅ Phase 4 Complete! Ready for Phase 5 (Applications)');
    console.log('   ✅ All services, integrations, aggregators, and blockchain packages clean');
    console.log('   ✅ Enterprise-ready architecture achieved');
  } else {
    console.log('   🔧 Fix deep imports in the packages listed above');
    console.log('   🔧 Apply the Phase 4 refactoring pattern:');
    console.log('      1. Update core package exports if needed');
    console.log('      2. Replace deep imports with barrel imports');
    console.log('      3. Test builds after each package');
    console.log('   🔧 Re-run this audit script to track progress');
  }
  console.log('');

  console.log('=' .repeat(80));
}

/**
 * Saves audit results to JSON for tracking
 */
async function saveAuditResults(results: AuditResults): Promise<void> {
  const resultsDir = 'docs/03_development/audit-results';
  const fileName = `phase4-audit-${new Date().toISOString().split('T')[0]}.json`;
  const filePath = path.join(resultsDir, fileName);

  try {
    await fs.mkdir(resultsDir, { recursive: true });
    await fs.writeFile(filePath, JSON.stringify(results, null, 2));
    console.log(`📁 Audit results saved to: ${filePath}`);
  } catch (error) {
    console.warn('Warning: Could not save audit results:', error);
  }
}

/**
 * Main execution
 */
async function main(): void {
  try {
    const results = await auditPhase4DeepImports();
    displayResults(results);
    await saveAuditResults(results);

    // Exit with error code if violations found
    process.exit(results.totalViolations > 0 ? 1 : 0);
  } catch (error) {
    console.error('Error during Phase 4 audit:', error);
    process.exit(1);
  }
}

// Run the audit
main().catch(console.error);
