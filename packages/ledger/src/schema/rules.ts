import { integer, jsonb, pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const rules = pgTable("rules", {
  id: text("id").primaryKey(),
  when: jsonb("when").notNull(),
  then: jsonb("then").notNull(),
  hardness: text("hardness").notNull(),
  scope: jsonb("scope")
    .$type<{ exceptPersons: string[]; exceptContexts: string[] }>()
    .notNull()
    .default({ exceptPersons: [], exceptContexts: [] }),
  checkBeforeFiringOn: text("check_before_firing_on"),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
    .notNull()
    .defaultNow(),
  createdHeat: integer("created_heat").notNull().default(1),
  reviewAt: timestamp("review_at", { withTimezone: true, mode: "string" }),
});

export const commitments = pgTable("commitments", {
  id: text("id").primaryKey(),
  description: text("description").notNull(),
  when: jsonb("when").notNull(),
  then: jsonb("then").notNull(),
  coolingOffMinutes: integer("cooling_off_minutes").notNull().default(120),
  reason: text("reason").notNull(),
  hardness: text("hardness").notNull().default("hard"),
  status: text("status").notNull().default("active"),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
    .notNull()
    .defaultNow(),
  createdHeat: integer("created_heat").notNull().default(1),
  reviewAt: timestamp("review_at", { withTimezone: true, mode: "string" }),
});

export const agents = pgTable("agents", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  metadata: jsonb("metadata").$type<Record<string, unknown>>().default({}),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
    .notNull()
    .defaultNow(),
});

export const authorityGrants = pgTable("authority_grants", {
  id: text("id").primaryKey(),
  agentId: text("agent_id")
    .notNull()
    .references(() => agents.id),
  toolCategory: text("tool_category").notNull(),
  level: text("level").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
    .notNull()
    .defaultNow(),
  createdBy: text("created_by").notNull().default("user"),
  reviewAt: timestamp("review_at", { withTimezone: true, mode: "string" }),
});
