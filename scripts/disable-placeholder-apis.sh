#!/bin/bash

# Script to disable placeholder API routes by renaming them with .disabled.ts extension
# and documenting them in the docs/api-development/placeholders directory

# Configuration
API_DIR="/Users/elemoghenekaro/Desktop/insureinnie/apps/web/src/app/api"
DOCS_DIR="/Users/elemoghenekaro/Desktop/insureinnie/docs/api-development/placeholders"
TEMPLATE_FILE="$DOCS_DIR/template.md"

# Essential APIs to keep active (don't disable these)
ESSENTIAL_APIS=(
  "v1/webhooks/stripe/route.ts"  # Stripe webhook is essential for payment processing
  "v1/chat/quote/route.ts"      # Already simplified, don't disable again
  "auth/[...all]/route.ts"      # Authentication API - working well
  "test-auth/route.ts"          # Test authentication API - working well
  "v1/user/auth/"               # User authentication APIs - working well
)

# Create documentation directory if it doesn't exist
mkdir -p "$DOCS_DIR"

# Function to check if an API is essential
is_essential() {
  local api_path="$1"
  for essential in "${ESSENTIAL_APIS[@]}"; do
    if [[ "$api_path" == *"$essential"* ]]; then
      return 0 # True, it's essential
    fi
  done
  return 1 # False, not essential
}

# Function to create documentation for a disabled API
document_api() {
  local api_path="$1"
  local relative_path="${api_path#$API_DIR}"
  local doc_name=$(echo "$relative_path" | sed 's/\//_/g' | sed 's/^_//' | sed 's/route.ts$/md/')
  local doc_file="$DOCS_DIR/$doc_name"
  
  # Create documentation file based on template
  cp "$TEMPLATE_FILE" "$doc_file"
  
  # Update documentation with API details
  sed -i '' "s|\[API_NAME\]|${relative_path%/route.ts}|g" "$doc_file"
  sed -i '' "s|\[API_PATH\]|${relative_path%/route.ts}|g" "$doc_file"
  
  # Add original code snippet
  local code_section=$(cat "$api_path" | sed 's/^/    /')
  sed -i '' "s|// Original code snippet or link to the full code|$code_section|g" "$doc_file"
  
  echo "Created documentation: $doc_file"
}

# Function to disable an API route
disable_api() {
  local api_path="$1"
  
  # Create documentation
  document_api "$api_path"
  
  # Rename the file to .disabled.ts
  local disabled_path="${api_path%.ts}.disabled.ts"
  mv "$api_path" "$disabled_path"
  echo "Disabled API: $api_path -> $disabled_path"
}

# Find all API routes
find "$API_DIR" -name "route.ts" | while read api_path; do
  if ! is_essential "$api_path"; then
    # Skip the chat quote API since we've already simplified it
    if [[ "$api_path" != *"/v1/chat/quote/route.ts"* ]]; then
      echo "Processing: $api_path"
      disable_api "$api_path"
    else
      echo "Skipping already simplified API: $api_path"
    fi
  else
    echo "Keeping essential API: $api_path"
  fi
done

echo "API cleanup complete. Placeholder APIs have been disabled and documented."
