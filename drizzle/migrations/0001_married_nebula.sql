CREATE TYPE "public"."beneficiary_type_enum" AS ENUM('PRIMARY', 'CONTINGENT');--> statement-breakpoint
CREATE TYPE "public"."endorsement_type_enum" AS ENUM('COVERAGE_ADJUSTMENT', 'INFO_CORRECTION', 'OTHER');--> statement-breakpoint
CREATE TYPE "public"."quote_status" AS ENUM('PENDING', 'ACCEPTED', 'EXPIRED', 'REJECTED');--> statement-breakpoint
ALTER TYPE "public"."policy_status" ADD VALUE 'FAILED';--> statement-breakpoint
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
CREATE TABLE "endorsements" (
	"id" text PRIMARY KEY NOT NULL,
	"policy_id" text NOT NULL,
	"type" "endorsement_type_enum" NOT NULL,
	"description" text NOT NULL,
	"effective_date" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "quote_cart_items" ALTER COLUMN "status" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "quote_cart_items" ALTER COLUMN "status" SET DEFAULT 'PENDING'::text;--> statement-breakpoint
DROP TYPE "public"."quote_cart_item_status";--> statement-breakpoint
CREATE TYPE "public"."quote_cart_item_status" AS ENUM('PENDING', 'PURCHASED', 'EXPIRED', 'REMOVED');--> statement-breakpoint
ALTER TABLE "quote_cart_items" ALTER COLUMN "status" SET DEFAULT 'PENDING'::"public"."quote_cart_item_status";--> statement-breakpoint
ALTER TABLE "quote_cart_items" ALTER COLUMN "status" SET DATA TYPE "public"."quote_cart_item_status" USING "status"::"public"."quote_cart_item_status";--> statement-breakpoint
ALTER TABLE "quote" ADD COLUMN "status" "quote_status" DEFAULT 'PENDING' NOT NULL;--> statement-breakpoint
ALTER TABLE "beneficiaries" ADD CONSTRAINT "beneficiaries_policy_id_policy_id_fk" FOREIGN KEY ("policy_id") REFERENCES "public"."policy"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "endorsements" ADD CONSTRAINT "endorsements_policy_id_policy_id_fk" FOREIGN KEY ("policy_id") REFERENCES "public"."policy"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "beneficiaries_policy_idx" ON "beneficiaries" USING btree ("policy_id");--> statement-breakpoint
CREATE INDEX "beneficiaries_type_idx" ON "beneficiaries" USING btree ("type");--> statement-breakpoint
CREATE INDEX "endorsements_policy_idx" ON "endorsements" USING btree ("policy_id");--> statement-breakpoint
CREATE INDEX "endorsements_type_idx" ON "endorsements" USING btree ("type");--> statement-breakpoint
CREATE INDEX "endorsements_effective_date_idx" ON "endorsements" USING btree ("effective_date");