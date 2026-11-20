ALTER TABLE "llm_calls" ADD COLUMN "cost_inr" real;--> statement-breakpoint
ALTER TABLE "llm_calls" ADD COLUMN "owner_id" text;--> statement-breakpoint
CREATE TABLE "llm_budgets" (
	"owner_id" text PRIMARY KEY NOT NULL,
	"spent_inr" real DEFAULT 0 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "profiles" (
	"id" text PRIMARY KEY NOT NULL,
	"gateway_key_hash" text,
	"gateway_key_hint" text,
	"openai_key_ciphertext" text,
	"anthropic_key_ciphertext" text,
	"openai_hint" text,
	"anthropic_hint" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "profiles_gateway_key_hash_idx" ON "profiles" USING btree ("gateway_key_hash");