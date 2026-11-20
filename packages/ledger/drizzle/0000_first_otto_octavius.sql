CREATE TABLE "actions" (
	"id" text PRIMARY KEY NOT NULL,
	"agent_id" text NOT NULL,
	"tool" text NOT NULL,
	"verb" text NOT NULL,
	"args" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"amount" jsonb,
	"persons" jsonb DEFAULT '[]'::jsonb,
	"reversibility" text NOT NULL,
	"depends_on" jsonb DEFAULT '[]'::jsonb,
	"rationale" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "agents" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "authority_grants" (
	"id" text PRIMARY KEY NOT NULL,
	"agent_id" text NOT NULL,
	"tool_category" text NOT NULL,
	"level" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" text DEFAULT 'user' NOT NULL,
	"review_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "commitments" (
	"id" text PRIMARY KEY NOT NULL,
	"description" text NOT NULL,
	"when" jsonb NOT NULL,
	"then" jsonb NOT NULL,
	"cooling_off_minutes" integer DEFAULT 120 NOT NULL,
	"reason" text NOT NULL,
	"hardness" text DEFAULT 'hard' NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_heat" integer DEFAULT 1 NOT NULL,
	"review_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "council_sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"action_id" text NOT NULL,
	"seats" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"brief" jsonb,
	"cost_usd" real,
	"latency_ms" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "exceptions" (
	"id" text PRIMARY KEY NOT NULL,
	"rule_id" text,
	"subject" text,
	"person_id" text,
	"context" text,
	"reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "findings" (
	"id" text PRIMARY KEY NOT NULL,
	"action_id" text NOT NULL,
	"detector" text NOT NULL,
	"severity" integer NOT NULL,
	"evidence" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"status" text,
	"message" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "holds" (
	"id" text PRIMARY KEY NOT NULL,
	"action_id" text NOT NULL,
	"lane" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"message" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"decided_at" timestamp with time zone,
	"modified_action" jsonb
);
--> statement-breakpoint
CREATE TABLE "ledger_entries" (
	"id" text PRIMARY KEY NOT NULL,
	"kind" text NOT NULL,
	"claim" text NOT NULL,
	"subject" text,
	"persons" jsonb DEFAULT '[]'::jsonb,
	"source" jsonb NOT NULL,
	"confidence" real NOT NULL,
	"last_confirmed_at" timestamp with time zone,
	"review_at" timestamp with time zone,
	"hardness" text,
	"superseded_by" text,
	"purposes" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"embedding" vector(1536),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "llm_calls" (
	"id" text PRIMARY KEY NOT NULL,
	"provider" text NOT NULL,
	"model" text NOT NULL,
	"system" text,
	"input" jsonb NOT NULL,
	"output" jsonb,
	"schema_name" text,
	"latency_ms" integer,
	"input_tokens" integer,
	"output_tokens" integer,
	"cost_usd" real,
	"status" text DEFAULT 'ok' NOT NULL,
	"error" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "receipts" (
	"id" text PRIMARY KEY NOT NULL,
	"action_id" text NOT NULL,
	"intention" text NOT NULL,
	"agent_chain" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"ledger_used" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"findings" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"lane" text NOT NULL,
	"council_session_id" text,
	"decided_by" text NOT NULL,
	"decision" text NOT NULL,
	"executed" jsonb,
	"iar_criteria" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"prev_hash" text NOT NULL,
	"hash" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rules" (
	"id" text PRIMARY KEY NOT NULL,
	"when" jsonb NOT NULL,
	"then" jsonb NOT NULL,
	"hardness" text NOT NULL,
	"scope" jsonb DEFAULT '{"exceptPersons":[],"exceptContexts":[]}'::jsonb NOT NULL,
	"check_before_firing_on" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_heat" integer DEFAULT 1 NOT NULL,
	"review_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "actions" ADD CONSTRAINT "actions_agent_id_agents_id_fk" FOREIGN KEY ("agent_id") REFERENCES "public"."agents"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "authority_grants" ADD CONSTRAINT "authority_grants_agent_id_agents_id_fk" FOREIGN KEY ("agent_id") REFERENCES "public"."agents"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "council_sessions" ADD CONSTRAINT "council_sessions_action_id_actions_id_fk" FOREIGN KEY ("action_id") REFERENCES "public"."actions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "findings" ADD CONSTRAINT "findings_action_id_actions_id_fk" FOREIGN KEY ("action_id") REFERENCES "public"."actions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "holds" ADD CONSTRAINT "holds_action_id_actions_id_fk" FOREIGN KEY ("action_id") REFERENCES "public"."actions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "receipts" ADD CONSTRAINT "receipts_action_id_actions_id_fk" FOREIGN KEY ("action_id") REFERENCES "public"."actions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "ledger_entries_subject_idx" ON "ledger_entries" USING btree ("subject");--> statement-breakpoint
CREATE INDEX "ledger_entries_kind_idx" ON "ledger_entries" USING btree ("kind");