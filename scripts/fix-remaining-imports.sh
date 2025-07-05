#!/bin/bash

# Fix Remaining Deep Imports - Phase 5 Applications
# This script fixes the remaining deep import violations in apps/api

echo "🚀 Fixing remaining deep imports in apps/api..."

# Find all TypeScript files in apps/api
FILES=$(find apps/api -name "*.ts" -type f)

for file in $FILES; do
    echo "📄 Processing $file..."

    # Create a backup
    cp "$file" "$file.bak"

    # Fix @triggerr/core/auth imports
    sed -i.tmp 's|import { \([^}]*\) } from "@triggerr/core/auth";|import { Auth } from "@triggerr/core";|g' "$file"

    # Fix @triggerr/core/database imports
    sed -i.tmp 's|import { \([^}]*\) } from "@triggerr/core/database";|import { Database } from "@triggerr/core";|g' "$file"

    # Fix @triggerr/core/database/schema imports
    sed -i.tmp 's|import { \([^}]*\) } from "@triggerr/core/database/schema";|import { Schema } from "@triggerr/core";|g' "$file"

    # Fix @triggerr/core/utils/* imports
    sed -i.tmp 's|import { \([^}]*\) } from "@triggerr/core/utils/[^"]*";|import { Utils } from "@triggerr/core";|g' "$file"

    # Fix @triggerr/api-contracts/validators/wallet imports
    sed -i.tmp 's|import { \([^}]*\) } from "@triggerr/api-contracts/validators/wallet";|import { Wallet } from "@triggerr/api-contracts";|g' "$file"

    # Fix @triggerr/api-contracts/dtos/wallet imports
    sed -i.tmp 's|import { \([^}]*\) } from "@triggerr/api-contracts/dtos/wallet";|import { Wallet } from "@triggerr/api-contracts";|g' "$file"

    # Fix @triggerr/paygo-adapter/src/utils imports
    sed -i.tmp 's|import { \([^}]*\) } from "@triggerr/paygo-adapter/src/utils";|import { formatBalanceDisplay, formatAddressDisplay } from "@triggerr/blockchain";|g' "$file"

    # Fix usage patterns
    sed -i.tmp 's|\bgetAuthContext\b|Auth.getAuthContext|g' "$file"
    sed -i.tmp 's|\bsetRLSContext\b|Auth.setRLSContext|g' "$file"
    sed -i.tmp 's|\bgetAnonymousSessionId\b|Auth.getAnonymousSessionId|g' "$file"
    sed -i.tmp 's|\bdb\b\.|Database.db.|g' "$file"
    sed -i.tmp 's|\buserWallets\b\.|Schema.userWalletsSchema.|g' "$file"
    sed -i.tmp 's|\bescrow\b\.|Schema.escrowSchema.|g' "$file"
    sed -i.tmp 's|\buser\b\.|Schema.userSchema.|g' "$file"
    sed -i.tmp 's|\bgenerateUserEscrowId\b|Utils.generateUserEscrowId|g' "$file"

    # Fix validator usage patterns
    sed -i.tmp 's|\bwalletSendRequestSchema\b|Wallet.validators.sendRequest|g' "$file"
    sed -i.tmp 's|\bfaucetRequestSchema\b|Wallet.validators.faucetRequest|g' "$file"
    sed -i.tmp 's|\bescrowCreateRequestSchema\b|Wallet.validators.escrowCreateRequest|g' "$file"
    sed -i.tmp 's|\blinkExistingWalletRequestSchema\b|Wallet.validators.linkExistingWalletRequest|g' "$file"
    sed -i.tmp 's|\bgenerateAnonymousWalletRequestSchema\b|Wallet.validators.generateAnonymousWalletRequest|g' "$file"

    # Fix type usage patterns
    sed -i.tmp 's|\bWalletSendRequest\b|Wallet.SendRequest|g' "$file"
    sed -i.tmp 's|\bWalletSendResponse\b|Wallet.SendResponse|g' "$file"
    sed -i.tmp 's|\bFaucetRequest\b|Wallet.FaucetRequest|g' "$file"
    sed -i.tmp 's|\bUserFaucetResponse\b|Wallet.UserFaucetResponse|g' "$file"

    # Clean up temporary files
    rm -f "$file.tmp"

    # Check if file was actually changed
    if ! diff -q "$file" "$file.bak" > /dev/null; then
        echo "  ✅ Fixed imports and usage"
    else
        echo "  ⏭️  No changes needed"
        rm -f "$file.bak"
    fi
done

echo ""
echo "🔧 Merging duplicate imports..."

# Second pass to merge duplicate imports from same packages
for file in $FILES; do
    if [[ -f "$file.bak" ]]; then
        echo "📄 Merging imports in $file..."

        # Create a simple script to merge duplicate imports
        python3 << 'EOF'
import sys
import re

def merge_imports(file_path):
    with open(file_path, 'r') as f:
        content = f.read()

    lines = content.split('\n')
    import_groups = {}
    other_lines = []

    for line in lines:
        import_match = re.match(r'import\s*{\s*([^}]+)\s*}\s*from\s*["\']([^"\']+)["\'];?', line)
        if import_match:
            imports, package = import_match.groups()
            if package not in import_groups:
                import_groups[package] = set()
            for imp in imports.split(','):
                import_groups[package].add(imp.strip())
        else:
            other_lines.append(line)

    # Rebuild file
    new_lines = []

    # Add merged imports
    for package, imports in sorted(import_groups.items()):
        import_list = ', '.join(sorted(imports))
        new_lines.append(f'import {{ {import_list} }} from "{package}";')

    # Add empty line if there were imports
    if import_groups:
        new_lines.append('')

    # Add other content
    new_lines.extend(other_lines)

    # Write back
    with open(file_path, 'w') as f:
        f.write('\n'.join(new_lines))

if __name__ == "__main__":
    merge_imports(sys.argv[1])
EOF

        python3 - "$file"
        rm -f "$file.bak"
    fi
done

echo ""
echo "✅ Phase 5 deep import fixes completed!"
echo ""
echo "🔍 Running validation..."
bun run scripts/audit-phase5-deep-imports.ts
