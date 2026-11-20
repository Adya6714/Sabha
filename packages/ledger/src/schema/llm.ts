import { integer, jsonb, pgTable, real, text, timestamp } from "drizzle-orm/pg-core";

export const llmCalls = pgTable("llm_calls", {
  id: text("id").primaryKey(),
  provider: text("provider").notNull(),
  model: text("model").notNull(),
  system: text("system"),
  input: jsonb("input").$type<unknown>().notNull(),
  output: jsonb("output").$type<unknown>(),
  schemaName: text("schema_name"),
  latencyMs: integer("latency_ms"),
  inputTokens: integer("input_tokens"),
  outputTokens: integer("output_tokens"),
  costUsd: real("cost_usd"),
  costInr: real("cost_inr"),
  ownerId: text("owner_id"),
  status: text("status").notNull().default("ok"),
  error: text("error"),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
    .notNull()
    .defaultNow(),
});

/** Combined model spend, keyed by a hash of the caller's own API key. */
export const llmBudgets = pgTable("llm_budgets", {
  ownerId: text("owner_id").primaryKey(),
  spentInr: real("spent_inr").notNull().default(0),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" })
    .notNull()
    .defaultNow(),
});
