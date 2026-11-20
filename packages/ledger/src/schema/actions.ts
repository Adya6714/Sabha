import {
  integer,
  jsonb,
  pgTable,
  real,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { agents } from "./rules.js";

export const actions = pgTable("actions", {
  id: text("id").primaryKey(),
  agentId: text("agent_id")
    .notNull()
    .references(() => agents.id),
  tool: text("tool").notNull(),
  verb: text("verb").notNull(),
  args: jsonb("args").$type<Record<string, unknown>>().notNull().default({}),
  amount: jsonb("amount").$type<{ value: number; currency: string }>(),
  persons: jsonb("persons").$type<string[]>().default([]),
  reversibility: text("reversibility").notNull(),
  dependsOn: jsonb("depends_on").$type<string[]>().default([]),
  rationale: text("rationale"),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
    .notNull()
    .defaultNow(),
});

export const findings = pgTable("findings", {
  id: text("id").primaryKey(),
  actionId: text("action_id")
    .notNull()
    .references(() => actions.id),
  detector: text("detector").notNull(),
  severity: integer("severity").notNull(),
  evidence: jsonb("evidence").$type<string[]>().notNull().default([]),
  status: text("status"),
  message: text("message").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
    .notNull()
    .defaultNow(),
});

export const holds = pgTable("holds", {
  id: text("id").primaryKey(),
  actionId: text("action_id")
    .notNull()
    .references(() => actions.id),
  lane: text("lane").notNull(),
  status: text("status").notNull().default("pending"),
  message: text("message"),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
    .notNull()
    .defaultNow(),
  expiresAt: timestamp("expires_at", {
    withTimezone: true,
    mode: "string",
  }).notNull(),
  decidedAt: timestamp("decided_at", { withTimezone: true, mode: "string" }),
  modifiedAction: jsonb("modified_action").$type<Record<string, unknown>>(),
});

export const councilSessions = pgTable("council_sessions", {
  id: text("id").primaryKey(),
  actionId: text("action_id")
    .notNull()
    .references(() => actions.id),
  seats: jsonb("seats").$type<Record<string, unknown>>().notNull().default({}),
  brief: jsonb("brief").$type<Record<string, unknown>>(),
  costUsd: real("cost_usd"),
  latencyMs: integer("latency_ms"),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
    .notNull()
    .defaultNow(),
});

export const receipts = pgTable("receipts", {
  id: text("id").primaryKey(),
  actionId: text("action_id")
    .notNull()
    .references(() => actions.id),
  intention: text("intention").notNull(),
  agentChain: jsonb("agent_chain").$type<string[]>().notNull().default([]),
  ledgerUsed: jsonb("ledger_used").$type<string[]>().notNull().default([]),
  findings: jsonb("findings").$type<unknown[]>().notNull().default([]),
  lane: text("lane").notNull(),
  councilSessionId: text("council_session_id"),
  decidedBy: text("decided_by").notNull(),
  decision: text("decision").notNull(),
  executed: jsonb("executed").$type<{
    tool: string;
    args: Record<string, unknown>;
  }>(),
  iarCriteria: jsonb("iar_criteria").$type<boolean[]>().notNull(),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
    .notNull()
    .defaultNow(),
  prevHash: text("prev_hash").notNull(),
  hash: text("hash").notNull(),
});
