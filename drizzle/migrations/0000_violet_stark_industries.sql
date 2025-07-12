CREATE TYPE "public"."api_key_type" AS ENUM('PUBLIC', 'SECRET', 'WEBHOOK');--> statement-breakpoint
CREATE TYPE "public"."beneficiary_type_enum" AS ENUM('PRIMARY', 'CONTINGENT');--> statement-breakpoint
CREATE TYPE "public"."continent_enum" AS ENUM('AF', 'AN', 'AS', 'EU', 'NA', 'OC', 'SA');--> statement-breakpoint
CREATE TYPE "public"."conversation_message_role" AS ENUM('user', 'assistant', 'system');--> statement-breakpoint
CREATE TYPE "public"."coverage_type" AS ENUM('DELAY_60', 'DELAY_120', 'CANCELLATION', 'BAGGAGE', 'COMPREHENSIVE', 'CUSTOM');--> statement-breakpoint
CREATE TYPE "public"."endorsement_type_enum" AS ENUM('COVERAGE_ADJUSTMENT', 'INFO_CORRECTION', 'OTHER');--> statement-breakpoint
CREATE TYPE "public"."escrow_model_type" AS ENUM('SINGLE_SIDED', 'DUAL_SIDED', 'COMBINED', 'HYBRID_PARTIAL_COLLATERAL', 'COLLATERALIZED_PROVIDER_POOL', 'BONDED_LIABILITY_POOL', 'PEER_TO_PEER_POOL', 'SUBSCRIPTION_BASED_POOL', 'DYNAMIC_RISK_POOL', 'PREDICTION_MARKET', 'SYNTHETIC_DEFI_COVERAGE', 'NFT_POLICY', 'DAO_GOVERNED_POOL', 'MULTI_ORACLE_VERIFIED');--> statement-breakpoint
CREATE TYPE "public"."escrow_purpose_enum" AS ENUM('DEPOSIT', 'WITHDRAW', 'STAKE', 'BOND', 'COLLATERAL', 'INVESTMENT', 'RESERVE', 'POOL', 'CUSTOM');--> statement-breakpoint
CREATE TYPE "public"."escrow_status" AS ENUM('PENDING', 'FULFILLED', 'RELEASED', 'EXPIRED', 'CANCELLED');--> statement-breakpoint
CREATE TYPE "public"."escrow_type_enum" AS ENUM('POLICY', 'USER_WALLET');--> statement-breakpoint
CREATE TYPE "public"."flight_status" AS ENUM('SCHEDULED', 'ACTIVE', 'LANDED', 'CANCELLED', 'DIVERTED', 'DELAYED');--> statement-breakpoint
CREATE TYPE "public"."payment_provider" AS ENUM('STRIPE', 'PAYGO_CUSTODIAL');--> statement-breakpoint
CREATE TYPE "public"."payout_status" AS ENUM('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED');--> statement-breakpoint
CREATE TYPE "public"."policy_event_type_enum" AS ENUM('POLICY_CREATED', 'PREMIUM_CALCULATED', 'PAYMENT_PENDING', 'PAYMENT_RECEIVED', 'POLICY_ACTIVATED', 'FLIGHT_MONITORING_ACTIVE', 'FLIGHT_EVENT_DETECTED', 'CLAIM_CONDITION_MET', 'CLAIM_INITIATED', 'PAYOUT_PROCESSING', 'PAYOUT_COMPLETED', 'PAYOUT_FAILED', 'POLICY_EXPIRED', 'POLICY_CANCELLED_USER', 'POLICY_CANCELLED_SYSTEM', 'POLICY_UPDATED', 'REFUND_PROCESSED');--> statement-breakpoint
CREATE TYPE "public"."policy_status" AS ENUM('PENDING', 'ACTIVE', 'EXPIRED', 'CLAIMED', 'CANCELLED', 'FAILED');--> statement-breakpoint
CREATE TYPE "public"."premium_return_policy" AS ENUM('PROVIDER_KEEPS_PREMIUM', 'RETURN_TO_CUSTOMER');--> statement-breakpoint
CREATE TYPE "public"."product_category_enum" AS ENUM('FLIGHT_PARAMETRIC', 'TRAVEL_COMPREHENSIVE', 'GADGET_INSURANCE', 'WEATHER_PARAMETRIC', 'EVENT_CANCELLATION', 'SHIPPING_CARGO', 'CUSTOM_PARAMETRIC', 'GENERAL_INSURANCE');--> statement-breakpoint
CREATE TYPE "public"."product_status_enum" AS ENUM('DRAFT', 'PENDING_APPROVAL', 'PUBLISHED', 'SUSPENDED', 'ARCHIVED');--> statement-breakpoint
CREATE TYPE "public"."provider_category" AS ENUM('FIRST_PARTY_INSURER', 'THIRD_PARTY_INSURER', 'B2B_FINANCIAL_SERVICES', 'OTA_PROVIDER');--> statement-breakpoint
CREATE TYPE "public"."provider_status" AS ENUM('ACTIVE', 'INACTIVE', 'PENDING', 'SUSPENDED');--> statement-breakpoint
CREATE TYPE "public"."provider_tier_enum" AS ENUM('STARTUP', 'STANDARD', 'PREMIUM', 'ENTERPRISE');--> statement-breakpoint
CREATE TYPE "public"."quote_cart_item_status" AS ENUM('PENDING', 'PURCHASED', 'EXPIRED', 'REMOVED');--> statement-breakpoint
CREATE TYPE "public"."quote_status" AS ENUM('PENDING', 'ACCEPTED', 'EXPIRED', 'REJECTED');--> statement-breakpoint
CREATE TYPE "public"."revenue_type_enum" AS ENUM('PLATFORM_FEE', 'PROVIDER_SHARE', 'TRANSACTION_FEE', 'ADJUSTMENT', 'PENALTY', 'BONUS');--> statement-breakpoint
CREATE TYPE "public"."scheduled_task_status_enum" AS ENUM('PENDING', 'ACTIVE', 'RUNNING', 'COMPLETED', 'FAILED', 'DISABLED');--> statement-breakpoint
CREATE TYPE "public"."task_execution_status_enum" AS ENUM('QUEUED', 'RUNNING', 'COMPLETED', 'FAILED', 'CANCELLED', 'TIMED_OUT');--> statement-breakpoint
CREATE TYPE "public"."webhook_delivery_status_enum" AS ENUM('PENDING', 'DELIVERED', 'FAILED', 'RETRYING', 'ABANDONED');--> statement-breakpoint
CREATE TYPE "public"."webhook_event_type_enum" AS ENUM('POLICY_CREATED', 'POLICY_ACTIVATED', 'POLICY_CANCELLED', 'POLICY_EXPIRED', 'PAYMENT_RECEIVED', 'PAYOUT_INITIATED', 'PAYOUT_COMPLETED', 'PAYOUT_FAILED', 'FLIGHT_DELAY_CONFIRMED', 'FLIGHT_CANCELLED_CONFIRMED');--> statement-breakpoint
CREATE TABLE "account" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp,
	"refresh_token_expires_at" timestamp,
	"scope" text,
	"password" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "aircraft_types" (
	"icao_code" varchar(4) PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"iata_code" varchar(3)
);
--> statement-breakpoint
CREATE TABLE "airline" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"alias" text,
	"iata_code" char(2),
	"icao_code" char(3),
	"callsign" text,
	"fleet_size" integer,
	"headquarters" text,
	"country_iso_code" char(2),
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "airline_iata_code_unique" UNIQUE("iata_code"),
	CONSTRAINT "airline_icao_code_unique" UNIQUE("icao_code")
);
--> statement-breakpoint
CREATE TABLE "airport" (
	"iata_code" char(3) PRIMARY KEY NOT NULL,
	"icao_code" char(4),
	"name" text NOT NULL,
	"city" text,
	"state_or_province" text,
	"region_iso_code" text,
	"country_iso_code" char(2) NOT NULL,
	"latitude" numeric(10, 7) NOT NULL,
	"longitude" numeric(10, 7) NOT NULL,
	"altitude_ft" integer,
	"timezone_olson" text,
	"airport_type" text,
	"scheduled_service" boolean DEFAULT false,
	"wikipedia_link" text,
	"home_link" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "airport_icao_code_unique" UNIQUE("icao_code")
);
--> statement-breakpoint
CREATE TABLE "api_key" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text,
	"provider_id" text,
	"key" text NOT NULL,
	"name" text NOT NULL,
	"type" "api_key_type" NOT NULL,
	"permissions" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"last_used_at" timestamp,
	"expires_at" timestamp,
	"rate_limit" integer DEFAULT 1000 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "api_key_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE "api_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"request_id" text DEFAULT generate_ulid() NOT NULL,
	"timestamp" timestamp DEFAULT now() NOT NULL,
	"user_id" text,
	"api_key_id" text,
	"anonymous_session_id" text,
	"endpoint" text NOT NULL,
	"method" text NOT NULL,
	"status_code" integer NOT NULL,
	"latency_ms" integer NOT NULL,
	"ip_address" "inet",
	"user_agent" text,
	"request_payload_hash" text,
	"response_payload_hash" text,
	"error_message" text,
	"rate_limit_hit" boolean DEFAULT false
);
--> statement-breakpoint
CREATE TABLE "audit_log" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text,
	"provider_id" text,
	"action" text NOT NULL,
	"resource" text NOT NULL,
	"resource_id" text,
	"old_values" jsonb,
	"new_values" jsonb,
	"ip_address" text,
	"user_agent" text,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "beneficiaries" (
	"id" text PRIMARY KEY NOT NULL,
	"policy_id" text NOT NULL,
	"name" text NOT NULL,
	"email" text,
	"relationship" text,
	"percentage" integer NOT NULL,
	"type" "beneficiary_type_enum" NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cache_entry" (
	"id" text PRIMARY KEY DEFAULT generate_ulid() NOT NULL,
	"cache_key" text NOT NULL,
	"value" jsonb NOT NULL,
	"tags" jsonb,
	"expires_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "cache_entry_key_unique" UNIQUE("cache_key")
);
--> statement-breakpoint
CREATE TABLE "conversation_messages" (
	"id" text PRIMARY KEY DEFAULT generate_ulid() NOT NULL,
	"conversation_id" text NOT NULL,
	"user_id" text,
	"anonymous_session_id" text,
	"role" "conversation_message_role" NOT NULL,
	"content" text NOT NULL,
	"ui_elements" jsonb,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "conversations" (
	"id" text PRIMARY KEY DEFAULT generate_ulid() NOT NULL,
	"user_id" text,
	"anonymous_session_id" text,
	"title" text,
	"initial_search_query" text,
	"current_flight_context" jsonb,
	"current_insurance_preferences" jsonb,
	"current_ota_context" jsonb,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "conversations_anonymous_session_id_unique" UNIQUE("anonymous_session_id")
);
--> statement-breakpoint
CREATE TABLE "countries" (
	"iso_code" char(2) PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"iso_alpha3_code" char(3),
	"continent" "continent_enum"
);
--> statement-breakpoint
CREATE TABLE "endorsements" (
	"id" text PRIMARY KEY NOT NULL,
	"policy_id" text NOT NULL,
	"type" "endorsement_type_enum" NOT NULL,
	"description" text NOT NULL,
	"effective_date" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "escrow" (
	"id" text PRIMARY KEY NOT NULL,
	"internal_id" text NOT NULL,
	"blockchain_id" text,
	"escrow_type" "escrow_type_enum" NOT NULL,
	"user_id" text,
	"policy_id" text,
	"provider_id" text,
	"purpose" "escrow_purpose_enum",
	"amount" numeric(15, 6) NOT NULL,
	"status" "escrow_status" DEFAULT 'PENDING' NOT NULL,
	"chain" text NOT NULL,
	"escrow_model" "escrow_model_type" DEFAULT 'SINGLE_SIDED' NOT NULL,
	"premium_return_policy" "premium_return_policy" DEFAULT 'PROVIDER_KEEPS_PREMIUM' NOT NULL,
	"collateral_amount" numeric(15, 6) DEFAULT '0.00',
	"pool_id" text,
	"escrow_configuration" jsonb,
	"tx_hash" text,
	"block_number" integer,
	"gas_used" integer,
	"fulfiller_address" text,
	"v_key" text,
	"expires_at" timestamp NOT NULL,
	"fulfilled_at" timestamp,
	"released_at" timestamp,
	"error_message" text,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "escrow_internal_id_unique" UNIQUE("internal_id"),
	CONSTRAINT "escrow_blockchain_id_unique" UNIQUE NULLS NOT DISTINCT("blockchain_id")
);
--> statement-breakpoint
CREATE TABLE "escrow_pool" (
	"id" text PRIMARY KEY NOT NULL,
	"provider_id" text NOT NULL,
	"name" text NOT NULL,
	"escrow_model" "escrow_model_type" NOT NULL,
	"total_capacity" numeric(15, 2) NOT NULL,
	"available_balance" numeric(15, 2) DEFAULT '0.00' NOT NULL,
	"reserved_balance" numeric(15, 2) DEFAULT '0.00' NOT NULL,
	"minimum_balance" numeric(15, 2) DEFAULT '0.00' NOT NULL,
	"pool_address" text,
	"collateral_ratio" numeric(5, 4) DEFAULT '1.0000' NOT NULL,
	"max_policy_count" integer,
	"max_policy_amount" numeric(15, 2),
	"is_active" boolean DEFAULT true NOT NULL,
	"health_score" numeric(5, 4) DEFAULT '1.0000',
	"last_rebalance_at" timestamp,
	"next_rebalance_due" timestamp,
	"configuration" jsonb,
	"metadata" jsonb,
	"audited_at" timestamp,
	"audit_report" text,
	"bond_amount" numeric(15, 2),
	"bond_provider" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "escrow_pool_address_unique" UNIQUE("pool_address")
);
--> statement-breakpoint
CREATE TABLE "escrow_pool_participant" (
	"id" text PRIMARY KEY NOT NULL,
	"pool_id" text NOT NULL,
	"user_id" text,
	"participant_address" text,
	"contribution_amount" numeric(15, 2) NOT NULL,
	"share_percentage" numeric(8, 6) NOT NULL,
	"locked_until" timestamp,
	"risk_tolerance" text,
	"preferred_categories" jsonb,
	"total_returns" numeric(15, 2) DEFAULT '0.00',
	"realized_returns" numeric(15, 2) DEFAULT '0.00',
	"unrealized_returns" numeric(15, 2) DEFAULT '0.00',
	"is_active" boolean DEFAULT true NOT NULL,
	"joined_at" timestamp DEFAULT now() NOT NULL,
	"exited_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "flight" (
	"id" text PRIMARY KEY NOT NULL,
	"flight_number" text NOT NULL,
	"airline_icao_code" char(3),
	"departure_airport_iata_code" char(3) NOT NULL,
	"arrival_airport_iata_code" char(3) NOT NULL,
	"departure_scheduled_at" timestamp with time zone NOT NULL,
	"arrival_scheduled_at" timestamp with time zone NOT NULL,
	"departure_actual_at" timestamp with time zone,
	"arrival_actual_at" timestamp with time zone,
	"status" "flight_status" DEFAULT 'SCHEDULED' NOT NULL,
	"aircraft_icao_code" varchar(4),
	"gate" text,
	"terminal" text,
	"delay_minutes" integer DEFAULT 0,
	"source_data" jsonb,
	"last_updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "unique_flight_schedule" UNIQUE("flight_number","departure_scheduled_at","departure_airport_iata_code","airline_icao_code")
);
--> statement-breakpoint
CREATE TABLE "flight_data_source" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"type" text NOT NULL,
	"endpoint" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"priority" integer DEFAULT 1 NOT NULL,
	"rate_limit" integer DEFAULT 1000,
	"health_status" text DEFAULT 'unknown' NOT NULL,
	"last_health_check" timestamp,
	"success_rate" numeric(5, 4) DEFAULT '0.0000',
	"average_response_time" integer,
	"cost_per_request" numeric(10, 8),
	"configuration" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "flight_data_source_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "historical_flight_segments" (
	"id" text PRIMARY KEY DEFAULT generate_ulid() NOT NULL,
	"iata_flight_number" text,
	"icao_flight_number" text,
	"flightaware_flight_id" text,
	"aircraft_registration" text,
	"airline_icao_code" char(3),
	"origin_airport_iata_code" char(3) NOT NULL,
	"destination_airport_iata_code" char(3) NOT NULL,
	"scheduled_departure_timestamp_utc" timestamp with time zone NOT NULL,
	"estimated_departure_timestamp_utc" timestamp with time zone,
	"actual_departure_timestamp_utc" timestamp with time zone,
	"gate_departure_scheduled_utc" timestamp with time zone,
	"gate_departure_actual_utc" timestamp with time zone,
	"runway_departure_scheduled_utc" timestamp with time zone,
	"runway_departure_actual_utc" timestamp with time zone,
	"departure_terminal" text,
	"departure_runway" text,
	"departure_gate" text,
	"scheduled_arrival_timestamp_utc" timestamp with time zone NOT NULL,
	"estimated_arrival_timestamp_utc" timestamp with time zone,
	"actual_arrival_timestamp_utc" timestamp with time zone,
	"gate_arrival_scheduled_utc" timestamp with time zone,
	"gate_arrival_actual_utc" timestamp with time zone,
	"runway_arrival_scheduled_utc" timestamp with time zone,
	"runway_arrival_actual_utc" timestamp with time zone,
	"arrival_terminal" text,
	"arrival_runway" text,
	"arrival_gate" text,
	"status" text NOT NULL,
	"departure_delay_minutes" integer,
	"arrival_delay_minutes" integer,
	"aircraft_icao_code" varchar(4),
	"live_latitude" numeric(10, 7),
	"live_longitude" numeric(10, 7),
	"live_altitude_ft" integer,
	"live_speed_kph" integer,
	"live_heading" integer,
	"source_contributions" jsonb,
	"fetched_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "historical_weather_observations" (
	"id" text PRIMARY KEY DEFAULT generate_ulid() NOT NULL,
	"airport_iata_code" char(3) NOT NULL,
	"observation_timestamp_utc" timestamp with time zone NOT NULL,
	"forecast_period" text,
	"temperature_celsius" numeric(5, 2),
	"min_temperature_celsius" numeric(5, 2),
	"max_temperature_celsius" numeric(5, 2),
	"feels_like_celsius" numeric(5, 2),
	"condition_code" text,
	"condition_text" text,
	"condition_type" text,
	"wind_speed_kph" numeric(5, 2),
	"wind_direction_degrees" integer,
	"wind_direction_cardinal" text,
	"precipitation_mm_last_hour" numeric(5, 2),
	"precipitation_probability_percent" integer,
	"visibility_km" numeric(5, 2),
	"humidity_percent" numeric(5, 2),
	"pressure_hpa" numeric(6, 2),
	"sunrise_timestamp_utc" timestamp with time zone,
	"sunset_timestamp_utc" timestamp with time zone,
	"moon_phase" text,
	"data_source_api" text NOT NULL,
	"fetched_at_utc" timestamp with time zone DEFAULT now() NOT NULL,
	"raw_api_snapshot" jsonb
);
--> statement-breakpoint
CREATE TABLE "payout" (
	"id" text PRIMARY KEY NOT NULL,
	"policy_id" text NOT NULL,
	"escrow_id" text,
	"amount" numeric(15, 2) NOT NULL,
	"status" "payout_status" DEFAULT 'PENDING' NOT NULL,
	"chain" text NOT NULL,
	"reason" text NOT NULL,
	"flight_delay_minutes" integer,
	"conditions_met" jsonb,
	"tx_hash" text,
	"block_number" integer,
	"gas_used" integer,
	"processed_at" timestamp,
	"error_message" text,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "policy" (
	"id" text PRIMARY KEY NOT NULL,
	"policy_number" text NOT NULL,
	"user_id" text,
	"anonymous_session_id" text,
	"provider_id" text NOT NULL,
	"flight_id" text NOT NULL,
	"quote_id" text,
	"coverage_type" "coverage_type" NOT NULL,
	"coverage_amount" numeric(15, 2) NOT NULL,
	"premium" numeric(15, 6) NOT NULL,
	"payout_amount" numeric(15, 2) NOT NULL,
	"status" "policy_status" DEFAULT 'PENDING' NOT NULL,
	"chain" text NOT NULL,
	"delay_threshold" integer DEFAULT 60 NOT NULL,
	"terms" jsonb,
	"metadata" jsonb,
	"activated_at" timestamp,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "policy_policy_number_unique" UNIQUE("policy_number"),
	CONSTRAINT "policy_user_check" CHECK ((user_id IS NOT NULL) != (anonymous_session_id IS NOT NULL))
);
--> statement-breakpoint
CREATE TABLE "policy_event" (
	"id" text PRIMARY KEY DEFAULT generate_ulid() NOT NULL,
	"policy_id" text NOT NULL,
	"type" "policy_event_type_enum" NOT NULL,
	"data" jsonb,
	"triggered_by_actor" text,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "policy_verification_code" (
	"id" text PRIMARY KEY NOT NULL,
	"policy_id" text NOT NULL,
	"code" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"used_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "policy_verification_code_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "provider" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"category" "provider_category" NOT NULL,
	"status" "provider_status" DEFAULT 'PENDING' NOT NULL,
	"description" text,
	"logo_url" text,
	"website_url" text,
	"support_email" text,
	"wallet_address" text NOT NULL,
	"wallet_private_key" text,
	"api_endpoint" text,
	"webhook_secret" text,
	"commission_rate" numeric(5, 4) DEFAULT '0.0500' NOT NULL,
	"tier" "provider_tier_enum" DEFAULT 'STANDARD' NOT NULL,
	"business_address" text,
	"business_registration_number" text,
	"payout_preference" jsonb,
	"preferred_chain" text DEFAULT 'PAYGO' NOT NULL,
	"linked_airline_icao_code" char(3),
	"escrow_model" "escrow_model_type" DEFAULT 'SINGLE_SIDED' NOT NULL,
	"premium_return_policy" "premium_return_policy" DEFAULT 'PROVIDER_KEEPS_PREMIUM' NOT NULL,
	"collateral_requirement" numeric(15, 2) DEFAULT '0.00',
	"pool_address" text,
	"pool_minimum_balance" numeric(15, 2) DEFAULT '0.00',
	"escrow_configuration" jsonb,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "provider_slug_unique" UNIQUE("slug"),
	CONSTRAINT "provider_wallet_address_unique" UNIQUE("wallet_address")
);
--> statement-breakpoint
CREATE TABLE "provider_product" (
	"id" text PRIMARY KEY NOT NULL,
	"provider_id" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"coverage_type" "coverage_type" NOT NULL,
	"base_rate" numeric(10, 6) NOT NULL,
	"max_coverage" numeric(15, 2) NOT NULL,
	"min_coverage" numeric(15, 2) NOT NULL,
	"terms_url" text,
	"status" "product_status_enum" DEFAULT 'DRAFT' NOT NULL,
	"product_category" "product_category_enum",
	"configuration" jsonb,
	"published_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "quote" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text,
	"provider_id" text NOT NULL,
	"flight_id" text NOT NULL,
	"coverage_type" "coverage_type" NOT NULL,
	"coverage_amount" numeric(15, 2) NOT NULL,
	"premium" numeric(15, 6) NOT NULL,
	"risk_factors" jsonb,
	"confidence" numeric(5, 4) DEFAULT '0.8500' NOT NULL,
	"status" "quote_status" DEFAULT 'PENDING' NOT NULL,
	"valid_until" timestamp NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "quote_cart_items" (
	"id" text PRIMARY KEY DEFAULT generate_ulid() NOT NULL,
	"user_id" text,
	"anonymous_session_id" text,
	"insurance_product_id" text NOT NULL,
	"flight_context_snapshot" jsonb NOT NULL,
	"quoted_premium_cents" integer NOT NULL,
	"quoted_coverage_cents" integer NOT NULL,
	"quote_details" jsonb NOT NULL,
	"added_at" timestamp DEFAULT now() NOT NULL,
	"status" "quote_cart_item_status" DEFAULT 'PENDING' NOT NULL,
	"expires_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "raw_api_call_logs" (
	"id" text PRIMARY KEY DEFAULT generate_ulid() NOT NULL,
	"api_source" text NOT NULL,
	"request_timestamp_utc" timestamp with time zone DEFAULT now() NOT NULL,
	"request_url" text NOT NULL,
	"request_method" text NOT NULL,
	"request_headers" jsonb,
	"request_body" jsonb,
	"response_timestamp_utc" timestamp with time zone,
	"response_status_code" integer,
	"response_headers" jsonb,
	"response_body" jsonb,
	"is_success" boolean NOT NULL,
	"duration_ms" integer,
	"associated_flight_id" text,
	"associated_policy_id" text
);
--> statement-breakpoint
CREATE TABLE "regions" (
	"code" text PRIMARY KEY NOT NULL,
	"local_code" text,
	"name" text NOT NULL,
	"continent" "continent_enum",
	"country_iso_code" char(2) NOT NULL,
	"wikipedia_link" text,
	"keywords" text
);
--> statement-breakpoint
CREATE TABLE "revenue" (
	"id" text PRIMARY KEY DEFAULT generate_ulid() NOT NULL,
	"policy_id" text,
	"provider_id" text,
	"user_id" text,
	"escrow_id" text,
	"amount" numeric(15, 6) NOT NULL,
	"currency" char(3) DEFAULT 'USD' NOT NULL,
	"type" "revenue_type_enum" NOT NULL,
	"description" text,
	"transaction_date" timestamp with time zone DEFAULT now() NOT NULL,
	"processed_at" timestamp with time zone,
	"reference_id" text,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "revenue_reference_id_unique" UNIQUE NULLS NOT DISTINCT("reference_id")
);
--> statement-breakpoint
CREATE TABLE "revenue_sharing_rule" (
	"id" text PRIMARY KEY DEFAULT generate_ulid() NOT NULL,
	"rule_name" text NOT NULL,
	"description" text,
	"provider_id" text,
	"provider_product_id" text,
	"platform_fee_percentage" numeric(7, 6) DEFAULT '0.000000' NOT NULL,
	"provider_share_percentage" numeric(7, 6) DEFAULT '0.000000' NOT NULL,
	"applicable_from" timestamp with time zone DEFAULT now() NOT NULL,
	"applicable_to" timestamp with time zone,
	"is_active" boolean DEFAULT true NOT NULL,
	"priority" integer DEFAULT 0 NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "rev_share_provider_prod_from_unique" UNIQUE("provider_id","provider_product_id","applicable_from")
);
--> statement-breakpoint
CREATE TABLE "routes" (
	"id" text PRIMARY KEY DEFAULT generate_ulid() NOT NULL,
	"airline_icao_code" char(3),
	"source_airport_iata_code" char(3) NOT NULL,
	"destination_airport_iata_code" char(3) NOT NULL,
	"codeshare" boolean DEFAULT false,
	"stops" integer DEFAULT 0,
	"equipment" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "unique_operational_route" UNIQUE("airline_icao_code","source_airport_iata_code","destination_airport_iata_code")
);
--> statement-breakpoint
CREATE TABLE "runways" (
	"id" integer PRIMARY KEY NOT NULL,
	"airport_iata_code" char(3) NOT NULL,
	"length_ft" integer,
	"width_ft" integer,
	"surface" text,
	"lighted" boolean DEFAULT false,
	"closed" boolean DEFAULT false,
	"le_ident" text,
	"he_ident" text
);
--> statement-breakpoint
CREATE TABLE "scheduled_task" (
	"id" text PRIMARY KEY DEFAULT generate_ulid() NOT NULL,
	"task_name" text NOT NULL,
	"description" text,
	"task_type" text NOT NULL,
	"cron_expression" text,
	"run_at" timestamp with time zone,
	"payload" jsonb,
	"status" "scheduled_task_status_enum" DEFAULT 'ACTIVE' NOT NULL,
	"timezone" text DEFAULT 'UTC',
	"last_run_at" timestamp with time zone,
	"next_run_at" timestamp with time zone,
	"last_run_status" text,
	"last_run_duration_ms" integer,
	"max_retries" integer DEFAULT 3 NOT NULL,
	"retry_delay_seconds" integer DEFAULT 60 NOT NULL,
	"timeout_seconds" integer DEFAULT 3600,
	"is_singleton" boolean DEFAULT true NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "scheduled_task_name_unique" UNIQUE("task_name")
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" text PRIMARY KEY NOT NULL,
	"expires_at" timestamp NOT NULL,
	"token" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" text NOT NULL,
	CONSTRAINT "session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "system_configuration" (
	"id" text PRIMARY KEY DEFAULT generate_ulid() NOT NULL,
	"key" text NOT NULL,
	"value" text NOT NULL,
	"description" text,
	"category" text DEFAULT 'GENERAL' NOT NULL,
	"is_editable_runtime" boolean DEFAULT false NOT NULL,
	"is_secret" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "system_configuration_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE "task_execution" (
	"id" text PRIMARY KEY DEFAULT generate_ulid() NOT NULL,
	"scheduled_task_id" text NOT NULL,
	"status" "task_execution_status_enum" NOT NULL,
	"started_at" timestamp with time zone DEFAULT now(),
	"completed_at" timestamp with time zone,
	"duration_ms" integer,
	"output" jsonb,
	"error_message" text,
	"error_details" jsonb,
	"worker_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"name" text,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "user_payment_methods" (
	"id" text PRIMARY KEY DEFAULT generate_ulid() NOT NULL,
	"user_id" text,
	"anonymous_session_id" text,
	"payment_provider" "payment_provider" NOT NULL,
	"provider_customer_id" text,
	"provider_method_id" text NOT NULL,
	"method_type" text,
	"details" jsonb,
	"is_default" boolean DEFAULT false NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_payment_methods_provider_method_id_unique" UNIQUE("provider_method_id"),
	CONSTRAINT "user_payment_methods_user_check" CHECK ((user_id IS NOT NULL) != (anonymous_session_id IS NOT NULL))
);
--> statement-breakpoint
CREATE TABLE "user_wallets" (
	"id" text PRIMARY KEY DEFAULT generate_ulid() NOT NULL,
	"user_id" text,
	"anonymous_session_id" text,
	"chain" text NOT NULL,
	"wallet_type" text NOT NULL,
	"address" text NOT NULL,
	"public_key" text,
	"encrypted_secret" text,
	"kms_key_id" text,
	"wallet_name" text DEFAULT 'triggerr Wallet' NOT NULL,
	"is_primary" boolean DEFAULT true NOT NULL,
	"key_exported_at" timestamp,
	"last_balance_check" timestamp,
	"cached_balance_amount" text DEFAULT '0' NOT NULL,
	"balance_currency" text DEFAULT 'PAYGO_TOKEN' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_wallets_user_chain_unique" UNIQUE("user_id","chain"),
	CONSTRAINT "user_wallets_user_check" CHECK ((user_id IS NOT NULL) != (anonymous_session_id IS NOT NULL))
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "webhook" (
	"id" text PRIMARY KEY DEFAULT generate_ulid() NOT NULL,
	"user_id" text,
	"provider_id" text,
	"target_url" text NOT NULL,
	"description" text,
	"subscribed_events" jsonb NOT NULL,
	"secret" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"last_triggered_at" timestamp with time zone,
	"failure_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "webhook_delivery" (
	"id" text PRIMARY KEY DEFAULT generate_ulid() NOT NULL,
	"webhook_id" text NOT NULL,
	"event_id" text NOT NULL,
	"event_type" "webhook_event_type_enum" NOT NULL,
	"payload" jsonb NOT NULL,
	"attempt_count" integer DEFAULT 0 NOT NULL,
	"status" "webhook_delivery_status_enum" DEFAULT 'PENDING' NOT NULL,
	"last_attempt_at" timestamp with time zone,
	"next_attempt_at" timestamp with time zone,
	"response_status_code" integer,
	"response_body" text,
	"duration_ms" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "airline" ADD CONSTRAINT "airline_country_iso_code_countries_iso_code_fk" FOREIGN KEY ("country_iso_code") REFERENCES "public"."countries"("iso_code") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "airport" ADD CONSTRAINT "airport_region_iso_code_regions_code_fk" FOREIGN KEY ("region_iso_code") REFERENCES "public"."regions"("code") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "airport" ADD CONSTRAINT "airport_country_iso_code_countries_iso_code_fk" FOREIGN KEY ("country_iso_code") REFERENCES "public"."countries"("iso_code") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "api_key" ADD CONSTRAINT "api_key_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "api_key" ADD CONSTRAINT "api_key_provider_id_provider_id_fk" FOREIGN KEY ("provider_id") REFERENCES "public"."provider"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "api_logs" ADD CONSTRAINT "api_logs_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "api_logs" ADD CONSTRAINT "api_logs_api_key_id_api_key_id_fk" FOREIGN KEY ("api_key_id") REFERENCES "public"."api_key"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_provider_id_provider_id_fk" FOREIGN KEY ("provider_id") REFERENCES "public"."provider"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "beneficiaries" ADD CONSTRAINT "beneficiaries_policy_id_policy_id_fk" FOREIGN KEY ("policy_id") REFERENCES "public"."policy"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversation_messages" ADD CONSTRAINT "conversation_messages_conversation_id_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversation_messages" ADD CONSTRAINT "conversation_messages_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversation_messages" ADD CONSTRAINT "conversation_messages_anonymous_session_id_session_id_fk" FOREIGN KEY ("anonymous_session_id") REFERENCES "public"."session"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "endorsements" ADD CONSTRAINT "endorsements_policy_id_policy_id_fk" FOREIGN KEY ("policy_id") REFERENCES "public"."policy"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "escrow" ADD CONSTRAINT "escrow_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "escrow" ADD CONSTRAINT "escrow_policy_id_policy_id_fk" FOREIGN KEY ("policy_id") REFERENCES "public"."policy"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "escrow" ADD CONSTRAINT "escrow_provider_id_provider_id_fk" FOREIGN KEY ("provider_id") REFERENCES "public"."provider"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "escrow" ADD CONSTRAINT "escrow_pool_id_escrow_pool_id_fk" FOREIGN KEY ("pool_id") REFERENCES "public"."escrow_pool"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "escrow_pool" ADD CONSTRAINT "escrow_pool_provider_id_provider_id_fk" FOREIGN KEY ("provider_id") REFERENCES "public"."provider"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "escrow_pool_participant" ADD CONSTRAINT "escrow_pool_participant_pool_id_escrow_pool_id_fk" FOREIGN KEY ("pool_id") REFERENCES "public"."escrow_pool"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "escrow_pool_participant" ADD CONSTRAINT "escrow_pool_participant_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "flight" ADD CONSTRAINT "flight_airline_icao_code_airline_icao_code_fk" FOREIGN KEY ("airline_icao_code") REFERENCES "public"."airline"("icao_code") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "flight" ADD CONSTRAINT "flight_departure_airport_iata_code_airport_iata_code_fk" FOREIGN KEY ("departure_airport_iata_code") REFERENCES "public"."airport"("iata_code") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "flight" ADD CONSTRAINT "flight_arrival_airport_iata_code_airport_iata_code_fk" FOREIGN KEY ("arrival_airport_iata_code") REFERENCES "public"."airport"("iata_code") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "flight" ADD CONSTRAINT "flight_aircraft_icao_code_aircraft_types_icao_code_fk" FOREIGN KEY ("aircraft_icao_code") REFERENCES "public"."aircraft_types"("icao_code") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "historical_flight_segments" ADD CONSTRAINT "historical_flight_segments_airline_icao_code_airline_icao_code_fk" FOREIGN KEY ("airline_icao_code") REFERENCES "public"."airline"("icao_code") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "historical_flight_segments" ADD CONSTRAINT "historical_flight_segments_origin_airport_iata_code_airport_iata_code_fk" FOREIGN KEY ("origin_airport_iata_code") REFERENCES "public"."airport"("iata_code") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "historical_flight_segments" ADD CONSTRAINT "historical_flight_segments_destination_airport_iata_code_airport_iata_code_fk" FOREIGN KEY ("destination_airport_iata_code") REFERENCES "public"."airport"("iata_code") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "historical_flight_segments" ADD CONSTRAINT "historical_flight_segments_aircraft_icao_code_aircraft_types_icao_code_fk" FOREIGN KEY ("aircraft_icao_code") REFERENCES "public"."aircraft_types"("icao_code") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "historical_weather_observations" ADD CONSTRAINT "historical_weather_observations_airport_iata_code_airport_iata_code_fk" FOREIGN KEY ("airport_iata_code") REFERENCES "public"."airport"("iata_code") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payout" ADD CONSTRAINT "payout_policy_id_policy_id_fk" FOREIGN KEY ("policy_id") REFERENCES "public"."policy"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payout" ADD CONSTRAINT "payout_escrow_id_escrow_id_fk" FOREIGN KEY ("escrow_id") REFERENCES "public"."escrow"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "policy" ADD CONSTRAINT "policy_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "policy" ADD CONSTRAINT "policy_provider_id_provider_id_fk" FOREIGN KEY ("provider_id") REFERENCES "public"."provider"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "policy" ADD CONSTRAINT "policy_flight_id_flight_id_fk" FOREIGN KEY ("flight_id") REFERENCES "public"."flight"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "policy" ADD CONSTRAINT "policy_quote_id_quote_id_fk" FOREIGN KEY ("quote_id") REFERENCES "public"."quote"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "policy_event" ADD CONSTRAINT "policy_event_policy_id_policy_id_fk" FOREIGN KEY ("policy_id") REFERENCES "public"."policy"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "policy_verification_code" ADD CONSTRAINT "policy_verification_code_policy_id_policy_id_fk" FOREIGN KEY ("policy_id") REFERENCES "public"."policy"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "provider" ADD CONSTRAINT "provider_linked_airline_icao_code_airline_icao_code_fk" FOREIGN KEY ("linked_airline_icao_code") REFERENCES "public"."airline"("icao_code") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "provider_product" ADD CONSTRAINT "provider_product_provider_id_provider_id_fk" FOREIGN KEY ("provider_id") REFERENCES "public"."provider"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quote" ADD CONSTRAINT "quote_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quote" ADD CONSTRAINT "quote_provider_id_provider_id_fk" FOREIGN KEY ("provider_id") REFERENCES "public"."provider"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quote" ADD CONSTRAINT "quote_flight_id_flight_id_fk" FOREIGN KEY ("flight_id") REFERENCES "public"."flight"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quote_cart_items" ADD CONSTRAINT "quote_cart_items_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "raw_api_call_logs" ADD CONSTRAINT "raw_api_call_logs_associated_flight_id_flight_id_fk" FOREIGN KEY ("associated_flight_id") REFERENCES "public"."flight"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "raw_api_call_logs" ADD CONSTRAINT "raw_api_call_logs_associated_policy_id_policy_id_fk" FOREIGN KEY ("associated_policy_id") REFERENCES "public"."policy"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "regions" ADD CONSTRAINT "regions_country_iso_code_countries_iso_code_fk" FOREIGN KEY ("country_iso_code") REFERENCES "public"."countries"("iso_code") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "revenue" ADD CONSTRAINT "revenue_policy_id_policy_id_fk" FOREIGN KEY ("policy_id") REFERENCES "public"."policy"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "revenue" ADD CONSTRAINT "revenue_provider_id_provider_id_fk" FOREIGN KEY ("provider_id") REFERENCES "public"."provider"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "revenue" ADD CONSTRAINT "revenue_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "revenue" ADD CONSTRAINT "revenue_escrow_id_escrow_id_fk" FOREIGN KEY ("escrow_id") REFERENCES "public"."escrow"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "revenue_sharing_rule" ADD CONSTRAINT "revenue_sharing_rule_provider_id_provider_id_fk" FOREIGN KEY ("provider_id") REFERENCES "public"."provider"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "revenue_sharing_rule" ADD CONSTRAINT "revenue_sharing_rule_provider_product_id_provider_product_id_fk" FOREIGN KEY ("provider_product_id") REFERENCES "public"."provider_product"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "routes" ADD CONSTRAINT "routes_airline_icao_code_airline_icao_code_fk" FOREIGN KEY ("airline_icao_code") REFERENCES "public"."airline"("icao_code") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "routes" ADD CONSTRAINT "routes_source_airport_iata_code_airport_iata_code_fk" FOREIGN KEY ("source_airport_iata_code") REFERENCES "public"."airport"("iata_code") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "routes" ADD CONSTRAINT "routes_destination_airport_iata_code_airport_iata_code_fk" FOREIGN KEY ("destination_airport_iata_code") REFERENCES "public"."airport"("iata_code") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "runways" ADD CONSTRAINT "runways_airport_iata_code_airport_iata_code_fk" FOREIGN KEY ("airport_iata_code") REFERENCES "public"."airport"("iata_code") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_execution" ADD CONSTRAINT "task_execution_scheduled_task_id_scheduled_task_id_fk" FOREIGN KEY ("scheduled_task_id") REFERENCES "public"."scheduled_task"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_payment_methods" ADD CONSTRAINT "user_payment_methods_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_wallets" ADD CONSTRAINT "user_wallets_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "webhook" ADD CONSTRAINT "webhook_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "webhook" ADD CONSTRAINT "webhook_provider_id_provider_id_fk" FOREIGN KEY ("provider_id") REFERENCES "public"."provider"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "webhook_delivery" ADD CONSTRAINT "webhook_delivery_webhook_id_webhook_id_fk" FOREIGN KEY ("webhook_id") REFERENCES "public"."webhook"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "airline_iata_idx" ON "airline" USING btree ("iata_code");--> statement-breakpoint
CREATE INDEX "airline_icao_idx" ON "airline" USING btree ("icao_code");--> statement-breakpoint
CREATE INDEX "airline_country_idx" ON "airline" USING btree ("country_iso_code");--> statement-breakpoint
CREATE INDEX "airport_icao_idx" ON "airport" USING btree ("icao_code");--> statement-breakpoint
CREATE INDEX "airport_country_idx" ON "airport" USING btree ("country_iso_code");--> statement-breakpoint
CREATE INDEX "airport_city_idx" ON "airport" USING btree ("city");--> statement-breakpoint
CREATE INDEX "api_logs_timestamp_idx" ON "api_logs" USING btree ("timestamp");--> statement-breakpoint
CREATE INDEX "api_logs_user_idx" ON "api_logs" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "api_logs_endpoint_idx" ON "api_logs" USING btree ("endpoint");--> statement-breakpoint
CREATE INDEX "api_logs_status_idx" ON "api_logs" USING btree ("status_code");--> statement-breakpoint
CREATE INDEX "api_logs_request_id_idx" ON "api_logs" USING btree ("request_id");--> statement-breakpoint
CREATE INDEX "audit_log_user_idx" ON "audit_log" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "audit_log_provider_idx" ON "audit_log" USING btree ("provider_id");--> statement-breakpoint
CREATE INDEX "audit_log_action_idx" ON "audit_log" USING btree ("action");--> statement-breakpoint
CREATE INDEX "audit_log_resource_idx" ON "audit_log" USING btree ("resource","resource_id");--> statement-breakpoint
CREATE INDEX "beneficiaries_policy_idx" ON "beneficiaries" USING btree ("policy_id");--> statement-breakpoint
CREATE INDEX "beneficiaries_type_idx" ON "beneficiaries" USING btree ("type");--> statement-breakpoint
CREATE INDEX "cache_entry_expires_at_idx" ON "cache_entry" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "conversation_messages_conversation_idx" ON "conversation_messages" USING btree ("conversation_id");--> statement-breakpoint
CREATE INDEX "conversation_messages_created_idx" ON "conversation_messages" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "conversation_messages_role_idx" ON "conversation_messages" USING btree ("role");--> statement-breakpoint
CREATE INDEX "conversations_user_idx" ON "conversations" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "conversations_anon_session_idx" ON "conversations" USING btree ("anonymous_session_id");--> statement-breakpoint
CREATE INDEX "conversations_created_idx" ON "conversations" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "endorsements_policy_idx" ON "endorsements" USING btree ("policy_id");--> statement-breakpoint
CREATE INDEX "endorsements_type_idx" ON "endorsements" USING btree ("type");--> statement-breakpoint
CREATE INDEX "endorsements_effective_date_idx" ON "endorsements" USING btree ("effective_date");--> statement-breakpoint
CREATE INDEX "escrow_type_idx" ON "escrow" USING btree ("escrow_type");--> statement-breakpoint
CREATE INDEX "escrow_purpose_idx" ON "escrow" USING btree ("purpose");--> statement-breakpoint
CREATE INDEX "escrow_user_idx" ON "escrow" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "escrow_policy_idx" ON "escrow" USING btree ("policy_id");--> statement-breakpoint
CREATE INDEX "escrow_provider_idx" ON "escrow" USING btree ("provider_id");--> statement-breakpoint
CREATE INDEX "escrow_status_idx" ON "escrow" USING btree ("status");--> statement-breakpoint
CREATE INDEX "escrow_blockchain_idx" ON "escrow" USING btree ("blockchain_id");--> statement-breakpoint
CREATE INDEX "escrow_expires_idx" ON "escrow" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "escrow_internal_id_idx" ON "escrow" USING btree ("internal_id");--> statement-breakpoint
CREATE INDEX "pool_provider_idx" ON "escrow_pool" USING btree ("provider_id");--> statement-breakpoint
CREATE INDEX "pool_model_idx" ON "escrow_pool" USING btree ("escrow_model");--> statement-breakpoint
CREATE INDEX "pool_address_idx" ON "escrow_pool" USING btree ("pool_address");--> statement-breakpoint
CREATE INDEX "pool_status_idx" ON "escrow_pool" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "pool_health_idx" ON "escrow_pool" USING btree ("health_score");--> statement-breakpoint
CREATE INDEX "pool_participant_pool_idx" ON "escrow_pool_participant" USING btree ("pool_id");--> statement-breakpoint
CREATE INDEX "pool_participant_user_idx" ON "escrow_pool_participant" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "pool_participant_share_idx" ON "escrow_pool_participant" USING btree ("share_percentage");--> statement-breakpoint
CREATE INDEX "pool_participant_status_idx" ON "escrow_pool_participant" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "flight_flight_number_idx" ON "flight" USING btree ("flight_number");--> statement-breakpoint
CREATE INDEX "flight_departure_idx" ON "flight" USING btree ("departure_scheduled_at");--> statement-breakpoint
CREATE INDEX "flight_status_idx" ON "flight" USING btree ("status");--> statement-breakpoint
CREATE INDEX "flight_airline_icao_idx" ON "flight" USING btree ("airline_icao_code");--> statement-breakpoint
CREATE INDEX "flight_dep_airport_iata_idx" ON "flight" USING btree ("departure_airport_iata_code");--> statement-breakpoint
CREATE INDEX "flight_arr_airport_iata_idx" ON "flight" USING btree ("arrival_airport_iata_code");--> statement-breakpoint
CREATE INDEX "data_source_name_idx" ON "flight_data_source" USING btree ("name");--> statement-breakpoint
CREATE INDEX "data_source_priority_idx" ON "flight_data_source" USING btree ("priority");--> statement-breakpoint
CREATE INDEX "data_source_health_idx" ON "flight_data_source" USING btree ("health_status");--> statement-breakpoint
CREATE INDEX "hfs_flight_num_date_idx" ON "historical_flight_segments" USING btree ("iata_flight_number","scheduled_departure_timestamp_utc");--> statement-breakpoint
CREATE INDEX "hfs_orig_dest_date_idx" ON "historical_flight_segments" USING btree ("origin_airport_iata_code","destination_airport_iata_code","scheduled_departure_timestamp_utc");--> statement-breakpoint
CREATE INDEX "hfs_airline_idx" ON "historical_flight_segments" USING btree ("airline_icao_code");--> statement-breakpoint
CREATE INDEX "hfs_fetched_at_idx" ON "historical_flight_segments" USING btree ("fetched_at");--> statement-breakpoint
CREATE INDEX "hwo_airport_time_idx" ON "historical_weather_observations" USING btree ("airport_iata_code","observation_timestamp_utc","forecast_period");--> statement-breakpoint
CREATE INDEX "hwo_data_source_idx" ON "historical_weather_observations" USING btree ("data_source_api");--> statement-breakpoint
CREATE INDEX "payout_policy_idx" ON "payout" USING btree ("policy_id");--> statement-breakpoint
CREATE INDEX "payout_status_idx" ON "payout" USING btree ("status");--> statement-breakpoint
CREATE INDEX "payout_processed_idx" ON "payout" USING btree ("processed_at");--> statement-breakpoint
CREATE INDEX "policy_user_idx" ON "policy" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "policy_provider_idx" ON "policy" USING btree ("provider_id");--> statement-breakpoint
CREATE INDEX "policy_flight_idx" ON "policy" USING btree ("flight_id");--> statement-breakpoint
CREATE INDEX "policy_status_idx" ON "policy" USING btree ("status");--> statement-breakpoint
CREATE INDEX "policy_expires_idx" ON "policy" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "policy_number_idx" ON "policy" USING btree ("policy_number");--> statement-breakpoint
CREATE INDEX "policy_anon_session_idx" ON "policy" USING btree ("anonymous_session_id");--> statement-breakpoint
CREATE INDEX "policy_event_policy_idx" ON "policy_event" USING btree ("policy_id");--> statement-breakpoint
CREATE INDEX "policy_event_type_idx" ON "policy_event" USING btree ("type");--> statement-breakpoint
CREATE INDEX "policy_event_created_at_idx" ON "policy_event" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "verification_code_idx" ON "policy_verification_code" USING btree ("code");--> statement-breakpoint
CREATE INDEX "verification_policy_idx" ON "policy_verification_code" USING btree ("policy_id");--> statement-breakpoint
CREATE INDEX "quote_user_idx" ON "quote" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "quote_provider_idx" ON "quote" USING btree ("provider_id");--> statement-breakpoint
CREATE INDEX "quote_flight_idx" ON "quote" USING btree ("flight_id");--> statement-breakpoint
CREATE INDEX "quote_valid_until_idx" ON "quote" USING btree ("valid_until");--> statement-breakpoint
CREATE INDEX "quote_cart_user_idx" ON "quote_cart_items" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "quote_cart_anon_session_idx" ON "quote_cart_items" USING btree ("anonymous_session_id");--> statement-breakpoint
CREATE INDEX "quote_cart_status_idx" ON "quote_cart_items" USING btree ("status");--> statement-breakpoint
CREATE INDEX "quote_cart_expires_idx" ON "quote_cart_items" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "log_api_source_idx" ON "raw_api_call_logs" USING btree ("api_source");--> statement-breakpoint
CREATE INDEX "log_request_ts_idx" ON "raw_api_call_logs" USING btree ("request_timestamp_utc");--> statement-breakpoint
CREATE INDEX "log_status_idx" ON "raw_api_call_logs" USING btree ("is_success");--> statement-breakpoint
CREATE INDEX "revenue_policy_idx" ON "revenue" USING btree ("policy_id");--> statement-breakpoint
CREATE INDEX "revenue_provider_idx" ON "revenue" USING btree ("provider_id");--> statement-breakpoint
CREATE INDEX "revenue_user_idx" ON "revenue" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "revenue_escrow_idx" ON "revenue" USING btree ("escrow_id");--> statement-breakpoint
CREATE INDEX "revenue_type_idx" ON "revenue" USING btree ("type");--> statement-breakpoint
CREATE INDEX "revenue_transaction_date_idx" ON "revenue" USING btree ("transaction_date");--> statement-breakpoint
CREATE INDEX "rev_share_active_idx" ON "revenue_sharing_rule" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "rev_share_priority_idx" ON "revenue_sharing_rule" USING btree ("priority");--> statement-breakpoint
CREATE INDEX "route_airline_idx" ON "routes" USING btree ("airline_icao_code");--> statement-breakpoint
CREATE INDEX "route_source_airport_idx" ON "routes" USING btree ("source_airport_iata_code");--> statement-breakpoint
CREATE INDEX "route_destination_airport_idx" ON "routes" USING btree ("destination_airport_iata_code");--> statement-breakpoint
CREATE INDEX "scheduled_task_status_idx" ON "scheduled_task" USING btree ("status");--> statement-breakpoint
CREATE INDEX "scheduled_task_next_run_at_idx" ON "scheduled_task" USING btree ("next_run_at");--> statement-breakpoint
CREATE INDEX "scheduled_task_type_idx" ON "scheduled_task" USING btree ("task_type");--> statement-breakpoint
CREATE INDEX "system_configuration_category_idx" ON "system_configuration" USING btree ("category");--> statement-breakpoint
CREATE INDEX "task_execution_scheduled_task_idx" ON "task_execution" USING btree ("scheduled_task_id");--> statement-breakpoint
CREATE INDEX "task_execution_status_idx" ON "task_execution" USING btree ("status");--> statement-breakpoint
CREATE INDEX "task_execution_started_at_idx" ON "task_execution" USING btree ("started_at");--> statement-breakpoint
CREATE INDEX "user_payment_methods_user_idx" ON "user_payment_methods" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "user_payment_methods_provider_idx" ON "user_payment_methods" USING btree ("payment_provider");--> statement-breakpoint
CREATE INDEX "user_payment_methods_anon_session_idx" ON "user_payment_methods" USING btree ("anonymous_session_id");--> statement-breakpoint
CREATE INDEX "user_wallets_user_idx" ON "user_wallets" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "user_wallets_address_idx" ON "user_wallets" USING btree ("address");--> statement-breakpoint
CREATE INDEX "user_wallets_chain_idx" ON "user_wallets" USING btree ("chain");--> statement-breakpoint
CREATE INDEX "user_wallets_anon_session_idx" ON "user_wallets" USING btree ("anonymous_session_id");--> statement-breakpoint
CREATE INDEX "webhook_target_url_idx" ON "webhook" USING btree ("target_url");--> statement-breakpoint
CREATE INDEX "webhook_user_idx" ON "webhook" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "webhook_provider_idx" ON "webhook" USING btree ("provider_id");--> statement-breakpoint
CREATE INDEX "webhook_active_idx" ON "webhook" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "webhook_delivery_webhook_idx" ON "webhook_delivery" USING btree ("webhook_id");--> statement-breakpoint
CREATE INDEX "webhook_delivery_status_idx" ON "webhook_delivery" USING btree ("status");--> statement-breakpoint
CREATE INDEX "webhook_delivery_event_id_idx" ON "webhook_delivery" USING btree ("event_id");--> statement-breakpoint
CREATE INDEX "webhook_delivery_next_attempt_idx" ON "webhook_delivery" USING btree ("next_attempt_at");