import { createDb } from "@sabha/ledger";
import { llmCalls } from "@sabha/ledger";
import type { ProviderName } from "./providers/types.js";

export type LlmCallLog = {
  id: string;
  provider: ProviderName;
  model: string;
  system?: string;
  input: unknown;
  output?: unknown;
  schemaName?: string;
  latencyMs?: number;
  inputTokens?: number;
  outputTokens?: number;
  costUsd?: number;
  costInr?: number;
  /** Spend bucket id (hash), never a raw API key. */
  ownerId?: string;
  status: "ok" | "schema_error" | "provider_error";
  error?: string;
};

export type LlmLogger = {
  write(entry: LlmCallLog): Promise<void>;
};

/** Writes to Postgres `llm_calls` when DATABASE_URL is available. */
export function createDbLogger(): LlmLogger {
  return {
    async write(entry) {
      const { db, client } = createDb();
      try {
        await db.insert(llmCalls).values({
          id: entry.id,
          provider: entry.provider,
          model: entry.model,
          system: entry.system,
          input: entry.input,
          output: entry.output,
          schemaName: entry.schemaName,
          latencyMs: entry.latencyMs,
          inputTokens: entry.inputTokens,
          outputTokens: entry.outputTokens,
          costUsd: entry.costUsd,
          costInr: entry.costInr,
          ownerId: entry.ownerId,
          status: entry.status,
          error: entry.error,
        });
      } finally {
        await client.end({ timeout: 5 });
      }
    },
  };
}

export function createMemoryLogger(store: LlmCallLog[] = []): LlmLogger & {
  entries: LlmCallLog[];
} {
  return {
    entries: store,
    async write(entry) {
      store.push(entry);
    },
  };
}
