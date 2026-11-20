import { pgTable, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";

/**
 * One row per individual. Early access has no teams.
 * Model keys are ciphertext. The gateway key is stored only as a hash.
 */
export const profiles = pgTable(
  "profiles",
  {
    id: text("id").primaryKey(),
    gatewayKeyHash: text("gateway_key_hash"),
    gatewayKeyHint: text("gateway_key_hint"),
    openaiKeyCiphertext: text("openai_key_ciphertext"),
    anthropicKeyCiphertext: text("anthropic_key_ciphertext"),
    openaiHint: text("openai_hint"),
    anthropicHint: text("anthropic_hint"),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("profiles_gateway_key_hash_idx").on(table.gatewayKeyHash),
  ],
);
