import {
  index,
  jsonb,
  pgTable,
  real,
  text,
  timestamp,
  vector,
} from "drizzle-orm/pg-core";

/**
 * Living Memory rows. `embedding` powers Phase 1 ripple similarity search.
 * Shape aligns with LedgerEntry in @sabha/core (source stored as JSON).
 */
export const ledgerEntries = pgTable(
  "ledger_entries",
  {
    id: text("id").primaryKey(),
    kind: text("kind").notNull(),
    claim: text("claim").notNull(),
    subject: text("subject"),
    persons: jsonb("persons").$type<string[]>().default([]),
    source: jsonb("source")
      .$type<{
        origin: "user_stated" | "observed" | "inferred" | "imported";
        at: string;
        heat?: 1 | 2 | 3;
        ref?: string;
      }>()
      .notNull(),
    confidence: real("confidence").notNull(),
    lastConfirmedAt: timestamp("last_confirmed_at", {
      withTimezone: true,
      mode: "string",
    }),
    reviewAt: timestamp("review_at", { withTimezone: true, mode: "string" }),
    hardness: text("hardness"),
    supersededBy: text("superseded_by"),
    purposes: jsonb("purposes").$type<string[]>().notNull().default([]),
    embedding: vector("embedding", { dimensions: 1536 }),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("ledger_entries_subject_idx").on(table.subject),
    index("ledger_entries_kind_idx").on(table.kind),
  ],
);

/**
 * Learned / manual exceptions (rule or subject + person + context).
 */
export const exceptions = pgTable("exceptions", {
  id: text("id").primaryKey(),
  ruleId: text("rule_id"),
  subject: text("subject"),
  personId: text("person_id"),
  context: text("context"),
  reason: text("reason"),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
    .notNull()
    .defaultNow(),
});
