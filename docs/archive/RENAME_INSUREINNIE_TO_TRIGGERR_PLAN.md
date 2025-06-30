# Master Plan: Project Rename ("triggerr" to "triggerr")

**Document Version**: 1.0
**Date**: June 25, 2024
**Status**: **CRITICAL MIGRATION PLAN - DO NOT DEVIATE**
**Objective**: To serve as the **single, definitive source of truth** for the complete renaming of the project from "triggerr" to "triggerr". This plan incorporates a comprehensive discovery process and safety measures to mitigate all identified risks.

**Strategy Update**: This plan has been updated to reflect the "Copy & New Repo" strategy. The original `triggerr` project serves as a complete backup, and all operations will be performed within the new `triggerr` repository.

---

## 1. **Executive Summary & Risk Assessment**

A strategic decision has been made to rebrand the project to **"triggerr"**. A deep analysis of the monorepo reveals the original name "triggerr" is profoundly integrated across all layers, including the filesystem, package definitions, dependency graphs, configuration files, source code, and documentation.

A naive "find and replace" approach would be catastrophic. The primary risks of this migration are:
1.  **Breaking Changes for External Consumers (Highest Risk)**: If any `@triggerr/*` packages have been published to a public registry (like npm), a simple rename is not possible. This requires a formal deprecation and parallel publishing strategy.
2.  **Broken Internal Dependencies**: Failure to update package names and `tsconfig.json` path aliases in perfect sync will break the monorepo's build system.
3.  **Loss of Git History**: Improperly renaming the root directory can cause Git to lose track of file histories.
4.  **Configuration and Deployment Failures**: Hardcoded paths or names in `.env` files, CI/CD pipelines, or `Docker` files will cause silent failures in deployment environments.

This document outlines a meticulous, phased plan to execute the migration safely and completely.

---

## 2. **Pre-Phase: Comprehensive Discovery & Safety**

**Objective**: To understand the full scope of the rename and establish safety checkpoints before any changes are made.

*   **Task 0.1: Full Impact Analysis**
    *   **Action**: Perform a comprehensive, case-insensitive search for all variations of the name to create a definitive audit trail.
        ```bash
        # Audit all code, config, and documentation files
        grep -ri "triggerr" . > rename_audit_main.txt
        grep -ri "triggerr" . > rename_audit_unicode.txt
        ```
    *   **Action**: Audit all environment and deployment configuration files for hardcoded references.
        ```bash
        find . -name "*.env*" -o -name "docker*" -o -name "*.yml" -o -name "*.yaml" | xargs grep -li "triggerr"
        ```
    *   **Action**: Audit application package.json dependencies and workspace references.
        ```bash
        find apps -name "package.json" | xargs grep -l "@triggerr"
        find packages -maxdepth 4 -name "package.json" | grep -v node_modules
        ```

*   **Task 0.2: NPM Publication Status Check (CRITICAL)**
    *   **Action**: Determine if any packages have been published to a public npm registry. This is the most critical step and dictates the overall strategy.
        ```bash
        # For each package in the `packages/` directory, run:
        npm view @triggerr/core version
        npm view @triggerr/api-sdk version
        # ... etc.
        ```
    *   **Decision Point**:
        *   **If packages ARE NOT published**: Proceed with the standard plan below.
        *   **If packages ARE published**: This becomes a **BREAKING CHANGE**. We must add a new phase to the plan: **"Phase 7: Public Package Migration,"** which involves publishing new `@triggerr/*` packages and formally deprecating the old `@triggerr/*` packages with clear migration instructions for external users.

*   **Task 0.3: Establish Safety Checkpoints**
    *   **Action**: Ensure the current Git working directory is clean (`git status --porcelain` should be empty).
    *   **Action**: Confirm that all tests are currently passing on the `main` branch (`bun test`).
    *   **Action**: Create a dedicated branch for this entire operation.
        ```bash
        git checkout -b feature/rename-triggerr-to-triggerr
        ```
    *   **Action**: Create a complete backup of the project directory as a final failsafe.
        ```bash
        cp -r . triggerr-backup/
        ```

---

## 3. **The Migration Plan: A Step-by-Step Guide**

*Note: This plan is executed from within the root of the new `triggerr` repository.*

### **Phase 1: Package Definitions & Dependencies**
**Objective**: Redefine all internal packages under the new `@triggerr` scope and update all references.

*   **Action 1.1**: Update the root `package.json`:
    *   Change `"name": "triggerr"` to `"name": "triggerr"`
    *   Update `"repository.url"` from `triggerr.git` to `triggerr.git`
    *   Update `"description"` to reference triggerr branding
*   **Action 1.2**: For each workspace `package.json` file (19 packages total):
    *   Replace `@triggerr/` with `@triggerr/` in name field
    *   Update description fields to reference triggerr if they mention triggerr
    *   This applies to existing packages: core, api-contracts, api-sdk, ui, utils, config, shared, paygo-adapter, stripe-adapter, wallet-service, escrow-engine, payout-engine, service-registry, blockchain-interface, llm-interface, deepseek-adapter, flight-aggregator, weather-aggregator, data-router
*   **Action 1.3**: Update both applications' `package.json` files:
    *   `apps/api/package.json`: Update name and all `@triggerr/*` dependencies to `@triggerr/*`
    *   `apps/web/package.json`: Update name and all `@triggerr/*` dependencies to `@triggerr/*`
*   **Action 1.4**: Commit the changes.
    ```bash
    git add .
    git commit -m "feat(branding): Update all package names and dependencies to @triggerr scope"
    ```

### **Phase 2: Configuration & Environment Updates**
**Objective**: Update all configuration files and environment templates.

*   **Action 2.1**: Update the root `tsconfig.json`.
    *   In the `compilerOptions.paths` object, replace all `@triggerr/` keys with `@triggerr/`
    *   Ensure all existing package path aliases are properly mapped
*   **Action 2.2**: Update environment configuration template.
    *   In `.env.example`, replace:
        *   `triggerr` database names with `triggerr`
        *   `DEBUG="triggerr:*"` with `DEBUG="triggerr:*"`
        *   Any backup database references
*   **Action 2.3**: Update the `turbo.json` file (if it contains triggerr references).
*   **Action 2.4**: Commit the changes.
    ```bash
    git add .
    git commit -m "feat(branding): Update tsconfig, environment templates, and build configs"
    ```

### **Phase 3: Re-linking the Monorepo**
**Objective**: Force the package manager to recognize all the name changes and rebuild the dependency graph.

*   **Action 3.1**: Delete the old lockfile and node_modules directory to ensure a clean slate.
    ```bash
    rm -rf node_modules bun.lockb
    ```
*   **Action 3.2**: Run the installer.
    ```bash
    bun install
    ```

### **Phase 4: Source Code & Documentation Refactoring**
**Objective**: Update all `import` statements, code identifiers, and documentation.

*   **Action 4.1**: For every `.ts` and `.tsx` file in the project, perform a search and replace for `@triggerr/` -> `@triggerr/`.
*   **Action 4.2**: Perform targeted renames for specific identifiers identified in the discovery phase:
    *   `generateInsureinnieWalletId` -> `generateTriggerrWalletId`
    *   `InsureInnieSDK` -> `TriggerrSDK`
    *   Any other branded function or class names
*   **Action 4.3**: Update documentation files:
    *   Replace all `triggerr` with `triggerr` in markdown files
    *   Update project descriptions and branding references
    *   Preserve technical content but update brand identity
*   **Action 4.4**: Commit the changes.
    ```bash
    git add .
    git commit -m "feat(branding): Refactor all imports, identifiers, and documentation to triggerr"
    ```

### **Phase 5: Comprehensive Validation & Cleanup**
**Objective**: Verify the success of the migration and hunt down any remaining artifacts.

*   **Action 5.1**: Run a final, comprehensive, case-insensitive search to catch anything that was missed.
    ```bash
    grep -ri "triggerr" .
    grep -ri "triggerr" .
    ```
    *This command should return zero results.* Manually fix any stragglers found.
*   **Action 5.2**: Run the full validation suite.
    ```bash
    bun run lint
    bun run build
    bun run test
    ```
    *All three commands must pass without any errors.*
*   **Action 5.3**: Commit the final cleanup changes.
    ```bash
    git add .
    git commit -m "chore: Final cleanup and validation post-rename"
    ```

---

## 4. **Post-Migration Checklist**

-   [ ] All automated validations (lint, build, test) are passing.
-   [ ] Final audit shows zero remaining "triggerr" or "triggerr" references.
-   [ ] All environment variables have been verified and updated as needed.
-   [ ] The `feature/rename-triggerr-to-triggerr` branch is ready to be reviewed and merged.
-   [ ] The `triggerr-backup/` directory can be deleted.
-   [ ] (If applicable) A "Public Package Migration" plan is ready to be executed.
-   [ ] All external documentation (wikis, Notion, etc.) has been updated with the new name.
-   [ ] The remote Git repository itself is renamed (on GitHub, GitLab, etc.).
-   [ ] All workspace package dependencies are correctly resolving.
-   [ ] Database connection strings and debug patterns have been updated.

This detailed plan ensures a safe, systematic, and complete migration to the new "triggerr" brand identity.
