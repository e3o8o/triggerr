# Environment Setup Guide

This document provides instructions for setting up environment variables for the triggerr project.

## Required Environment Variables

### 1. Database Configuration

```bash
# PostgreSQL Database URL
DATABASE_URL="postgresql://username:password@localhost:5432/triggerr_dev"

# For production, use connection pooling
# DATABASE_URL="postgresql://username:password@host:5432/triggerr_prod?pgbouncer=true"
```

### 2. Authentication (Better-Auth)

```bash
# Better-Auth Secret Key (generate with: openssl rand -hex 32)
BETTER_AUTH_SECRET="your-32-byte-secret-key-here"

# Base URL for your application
BETTER_AUTH_URL="http://localhost:3000"
NEXT_PUBLIC_BETTER_AUTH_URL="http://localhost:3000"

# Google OAuth Credentials (from Google Cloud Console)
GOOGLE_CLIENT_ID="your-google-oauth-client-id"
GOOGLE_CLIENT_SECRET="your-google-oauth-client-secret"
```

### 3. Wallet Encryption

```bash
# AES-256 Encryption Key for Wallet Private Keys (generate with: openssl rand -hex 32)
ENCRYPTION_KEY="your-64-character-hex-encryption-key-here"
```

### 4. Payment Processing

```bash
# Stripe Configuration
STRIPE_SECRET_KEY="sk_test_your_stripe_secret_key"
STRIPE_PUBLISHABLE_KEY="pk_test_your_stripe_publishable_key"
STRIPE_WEBHOOK_SECRET="whsec_your_stripe_webhook_secret"

# For production
# STRIPE_SECRET_KEY="sk_live_your_stripe_secret_key"
# STRIPE_PUBLISHABLE_KEY="pk_live_your_stripe_publishable_key"
```

### 5. API Configuration

```bash
# Internal API Communication
API_BASE_URL="http://localhost:4000"
NEXT_PUBLIC_API_BASE_URL="http://localhost:4000"

# API Rate Limiting
API_RATE_LIMIT_REQUESTS_PER_MINUTE="100"
API_RATE_LIMIT_BURST="10"
```

### 6. External API Services (Optional)

```bash
# Flight Data APIs
AVIATIONSTACK_API_KEY="your-aviationstack-api-key"
FLIGHTAWARE_API_KEY="your-flightaware-api-key"
OPENSKY_USERNAME="your-opensky-username"
OPENSKY_PASSWORD="your-opensky-password"

# Weather APIs
WEATHERAPI_KEY="your-weather-api-key"
```

### 7. Development & Debugging

```bash
# Environment Mode
NODE_ENV="development"

# Logging Level
LOG_LEVEL="debug"

# Enable Debug Mode
DEBUG="triggerr:*"
```

## Database Setup & Migration Guide

### PostgreSQL Version Requirements

**Important**: This project requires PostgreSQL 15+ for the following features:
- `UNIQUE NULLS NOT DISTINCT` syntax (introduced in PostgreSQL 15)
- Advanced JSONB operations
- Modern indexing features

### Local Development Setup

#### 1. Install/Upgrade PostgreSQL

**macOS (Homebrew)**:
```bash
# Stop existing PostgreSQL service
brew services stop postgresql

# Uninstall old version (if needed)
brew uninstall postgresql@14

# Install PostgreSQL 16
brew install postgresql@16

# Start the service
brew services start postgresql@16

# Add to PATH (add to ~/.zshrc)
export PATH="/opt/homebrew/opt/postgresql@16/bin:$PATH"
```

**Linux (Ubuntu/Debian)**:
```bash
# Add PostgreSQL 16 repository
sudo sh -c 'echo "deb http://apt.postgresql.org/pub/repos/apt $(lsb_release -cs)-pgdg main" > /etc/apt/sources.list.d/pgdg.list'
wget --quiet -O - https://www.postgresql.org/media/keys/ACCC4CF8.asc | sudo apt-key add -
sudo apt-get update

# Install PostgreSQL 16
sudo apt-get install postgresql-16

# Start service
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

#### 2. Create Database and User

```bash
# Create database
createdb triggerr_local

# Create user (if needed)
createuser -s postgres

# Set password (optional)
psql -d triggerr_local -c "ALTER USER postgres PASSWORD 'your_password';"
```

#### 3. Verify PostgreSQL Version

```bash
psql -h localhost -p 5432 -U postgres -d triggerr_local -c "SELECT version();"
```

**Expected output**: `PostgreSQL 16.x` or higher

### Migration Process

#### 1. Enhanced Migration Script

The project includes an enhanced migration script (`packages/core/src/database/migrate.ts`) that automatically:

- ✅ Checks PostgreSQL version compatibility (requires 15+)
- ✅ Creates `pgcrypto` extension
- ✅ Creates `generate_ulid()` function
- ✅ Runs Drizzle migrations with proper error handling

#### 2. Running Migrations

```bash
# Set environment variable
export DATABASE_URL="postgresql://postgres@localhost:5432/triggerr_local"

# Run migration from project root
bun run --cwd=packages/core src/database/migrate.ts
```

**Expected output**:
```
[timestamp] Starting database migration for triggerr...
[timestamp] 🔍 Checking PostgreSQL version...
[timestamp] 📊 Connected DB Version: PostgreSQL 16.9...
[timestamp] ✅ PostgreSQL version 16.9 is compatible
[timestamp] 🔧 Setting up required extensions and functions...
[timestamp] ✅ pgcrypto extension ready
[timestamp] ✅ generate_ulid function ready
[timestamp] ✅ Migration completed successfully in X.XXs
[timestamp] 🎯 Database schema is now ready for triggerr marketplace
```

#### 3. Alternative: Using Drizzle Kit

```bash
# Generate migrations
bunx drizzle-kit generate

# Apply migrations
bunx drizzle-kit migrate
```

### Troubleshooting Common Issues

#### Issue 1: "function generate_ulid() does not exist"

**Cause**: The function wasn't created before running migrations.

**Solution**: The enhanced migration script automatically creates this function. If using Drizzle Kit directly, manually create the function:

```sql
-- Create pgcrypto extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create generate_ulid function
CREATE OR REPLACE FUNCTION generate_ulid()
RETURNS text AS $$
DECLARE
  millis bigint;
  encoded_time text;
  random_bytes bytea;
  encoded_random text;
  time_bytes bytea;
BEGIN
  -- Get current time in milliseconds since Unix epoch
  millis := FLOOR(EXTRACT(EPOCH FROM clock_timestamp()) * 1000);
  -- Create time bytes manually
  time_bytes := set_byte(set_byte(set_byte(set_byte(set_byte(set_byte(
    decode('000000000000', 'hex'),
    0, (millis >> 40) & 255), 1, (millis >> 32) & 255), 2, (millis >> 24) & 255), 
    3, (millis >> 16) & 255), 4, (millis >> 8) & 255), 5, millis & 255);
  -- Encode time part (48 bits = 6 bytes)
  encoded_time := encode(time_bytes, 'base32');
  -- Generate 10 random bytes (80 bits)
  random_bytes := gen_random_bytes(10);
  encoded_random := encode(random_bytes, 'base32');
  -- Concatenate and return
  RETURN lower(encoded_time || encoded_random);
END;
$$ LANGUAGE plpgsql;
```

#### Issue 2: "syntax error at or near 'NULLS'"

**Cause**: Using PostgreSQL version < 15.

**Solution**: Upgrade to PostgreSQL 15+ as described above.

#### Issue 3: "Can't find meta/_journal.json file"

**Cause**: Migration files were deleted or corrupted.

**Solution**: Regenerate migration files:
```bash
# Delete existing migrations
rm -rf drizzle/migrations/*

# Generate new migrations
bunx drizzle-kit generate

# Run migration
bunx drizzle-kit migrate
```

#### Issue 4: Connection to wrong PostgreSQL instance

**Cause**: Multiple PostgreSQL instances running (local + Docker).

**Solution**: 
1. Check what's running on port 5432: `lsof -i :5432`
2. Stop conflicting services: `brew services stop postgresql`
3. Ensure only one PostgreSQL instance is running

### Database Schema Overview

After successful migration, you should have:

- **44 application tables** in `public` schema
- **1 migration tracking table** (`drizzle.__drizzle_migrations`)
- **4 PostgreSQL system tables** (TOAST tables, etc.)

**Total**: 49 tables

### Verification Commands

```bash
# Check all tables
psql -h localhost -p 5432 -U postgres -d triggerr_local -c "\dt"

# Count application tables
psql -h localhost -p 5432 -U postgres -d triggerr_local -c "SELECT COUNT(*) FROM pg_tables WHERE schemaname = 'public';"

# Check migration status
psql -h localhost -p 5432 -U postgres -d triggerr_local -c "SELECT * FROM drizzle.__drizzle_migrations;"

# Test generate_ulid function
psql -h localhost -p 5432 -U postgres -d triggerr_local -c "SELECT generate_ulid();"
```

### Production Considerations

1. **Connection Pooling**: Use `?pgbouncer=true` in DATABASE_URL
2. **SSL**: Enable SSL connections in production
3. **Backup Strategy**: Implement regular database backups
4. **Monitoring**: Set up PostgreSQL monitoring and alerting
5. **Version Management**: Ensure production PostgreSQL is 15+

## Setup Instructions

### 1. Create Environment Files

Create the following files in your project root:

```bash
# Development environment
touch .env.local

# Production environment (when needed)
touch .env.production.local
```

### 2. Generate Secure Keys

Use these commands to generate secure keys:

```bash
# Generate Better-Auth Secret (32 bytes = 64 hex characters)
openssl rand -hex 32

# Generate Encryption Key (32 bytes = 64 hex characters)
openssl rand -hex 32

# Generate UUID (alternative method)
uuidgen
```

### 3. Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URIs:
   - `http://localhost:3000/api/auth/callback/google` (development)
   - `https://yourdomain.com/api/auth/callback/google` (production)

### 4. Stripe Setup

1. Create account at [Stripe Dashboard](https://dashboard.stripe.com/)
2. Get API keys from Developers > API keys
3. Set up webhook endpoint:
   - URL: `https://yourdomain.com/api/v1/webhooks/stripe`
   - Events: `checkout.session.completed`, `payment_intent.succeeded`

### 5. Database Setup

For local development with PostgreSQL:

```bash
# Install PostgreSQL (macOS)
brew install postgresql
brew services start postgresql

# Create database
createdb triggerr_local

# Set up user (optional)
psql triggerr_local
CREATE USER triggerr_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE triggerr_local TO triggerr_user;
```

## Environment File Templates

### Development (.env.local)

```bash
# Database
DATABASE_URL="postgresql://postgres:password@localhost:5432/triggerr_local"

# Authentication
BETTER_AUTH_SECRET="generated-secret-key-here"
BETTER_AUTH_URL="http://localhost:3000"
NEXT_PUBLIC_BETTER_AUTH_URL="http://localhost:3000"
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# Encryption
ENCRYPTION_KEY="generated-encryption-key-here"

# Stripe (Test Mode)
STRIPE_SECRET_KEY="sk_test_your_test_key"
STRIPE_PUBLISHABLE_KEY="pk_test_your_test_key"
STRIPE_WEBHOOK_SECRET="whsec_your_webhook_secret"

# API
API_BASE_URL="http://localhost:4000"
NEXT_PUBLIC_API_BASE_URL="http://localhost:4000"

# Development
NODE_ENV="development"
LOG_LEVEL="debug"
```

### Production (.env.production.local)

```bash
# Database (with connection pooling)
DATABASE_URL="postgresql://user:pass@host:5432/triggerr_prod?pgbouncer=true"

# Authentication
BETTER_AUTH_SECRET="secure-production-secret"
BETTER_AUTH_URL="https://triggerr.com"
NEXT_PUBLIC_BETTER_AUTH_URL="https://triggerr.com"
GOOGLE_CLIENT_ID="production-google-client-id"
GOOGLE_CLIENT_SECRET="production-google-client-secret"

# Encryption
ENCRYPTION_KEY="secure-production-encryption-key"

# Stripe (Live Mode)
STRIPE_SECRET_KEY="sk_live_your_live_key"
STRIPE_PUBLISHABLE_KEY="pk_live_your_live_key"
STRIPE_WEBHOOK_SECRET="whsec_your_production_webhook_secret"

# API
API_BASE_URL="https://api.triggerr.com"
NEXT_PUBLIC_API_BASE_URL="https://api.triggerr.com"

# Production
NODE_ENV="production"
LOG_LEVEL="info"
```

## Security Best Practices

1. **Never commit environment files** to version control
2. **Use different keys** for development and production
3. **Rotate secrets regularly** (at least every 90 days)
4. **Limit access** to production environment variables
5. **Use a secrets manager** for production (AWS Secrets Manager, etc.)
6. **Validate environment variables** on application startup

## Validation

The application includes environment variable validation. Missing or invalid variables will cause startup failures with helpful error messages.

## Troubleshooting

### Common Issues

1. **"ENCRYPTION_KEY environment variable is required"**
   - Ensure ENCRYPTION_KEY is set and is a 64-character hex string

2. **"Failed to connect to database"**
   - Verify DATABASE_URL format and database accessibility
   - Check if PostgreSQL is running

3. **"Google OAuth not working"**
   - Verify GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET
   - Check redirect URIs in Google Cloud Console

4. **"Stripe webhooks failing"**
   - Verify STRIPE_WEBHOOK_SECRET matches Stripe dashboard
   - Check webhook endpoint URL is accessible

### Validation Commands

```bash
# Test database connection
bun run packages/core/database/test-connection.ts

# Validate environment variables
bun run scripts/validate-env.ts

# Test encryption service
bun run packages/services/wallet-service/test-encryption.ts
```

## Next Steps

After setting up environment variables:

1. Run database migrations: `bun run db:migrate`
2. Seed reference data: `bun run db:seed`
3. Start development servers: `bun dev`
4. Test authentication flow: visit `/test-auth`
5. Test wallet creation: complete user signup flow

For production deployment, ensure all environment variables are properly configured in your hosting platform (Vercel, AWS, etc.).