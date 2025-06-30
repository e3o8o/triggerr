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
createdb triggerr_dev

# Set up user (optional)
psql triggerr_dev
CREATE USER triggerr_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE triggerr_dev TO triggerr_user;
```

## Environment File Templates

### Development (.env.local)

```bash
# Database
DATABASE_URL="postgresql://postgres:password@localhost:5432/triggerr_dev"

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