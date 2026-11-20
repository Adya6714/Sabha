import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { z } from "zod";
import { complete } from "./complete.js";
import { createMemoryLogger } from "./log.js";

function loadLocalEnv() {
  const root = process.cwd();
  for (const rel of [".env", ".env.local", "apps/web/.env.local"]) {
    const file = path.join(root, rel);
    if (!existsSync(file)) continue;
    for (const line of readFileSync(file, "utf8").split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq <= 0) continue;
      const key = trimmed.slice(0, eq).trim();
      let value = trimmed.slice(eq + 1).trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      if (process.env[key] === undefined) process.env[key] = value;
    }
  }
}

if (process.env.SABHA_LLM_SMOKE === "1") loadLocalEnv();

const SmokeSchema = z.object({
  summary: z.string().min(1),
  ok: z.boolean(),
});

const hasOpenAI = Boolean(process.env.OPENAI_API_KEY);
const hasAnthropic = Boolean(process.env.ANTHROPIC_API_KEY);

describe("LLM provider smoke tests", () => {
  it.skipIf(!hasOpenAI)(
    "OpenAI returns validated JSON",
    async () => {
      const logger = createMemoryLogger();
      const result = await complete({
        model: process.env.OPENAI_SMOKE_MODEL ?? "openai/gpt-4o-mini",
        system: "Reply with compact JSON only.",
        input: { task: "Acknowledge Sabha smoke test" },
        schema: SmokeSchema,
        schemaName: "Smoke",
        logger,
      });

      expect(result.data.ok).toBeTypeOf("boolean");
      expect(result.data.summary.length).toBeGreaterThan(0);
      expect(result.provider).toBe("openai");
      expect(logger.entries[0]?.status).toBe("ok");
    },
    60_000,
  );

  it.skipIf(!hasAnthropic)(
    "Anthropic returns validated JSON",
    async () => {
      const logger = createMemoryLogger();
      const result = await complete({
        model:
          process.env.ANTHROPIC_SMOKE_MODEL ??
          "anthropic/claude-3-5-haiku-latest",
        system: "Reply with compact JSON only.",
        input: { task: "Acknowledge Sabha smoke test" },
        schema: SmokeSchema,
        schemaName: "Smoke",
        logger,
      });

      expect(result.data.ok).toBeTypeOf("boolean");
      expect(result.data.summary.length).toBeGreaterThan(0);
      expect(result.provider).toBe("anthropic");
      expect(logger.entries[0]?.status).toBe("ok");
    },
    60_000,
  );

  it("documents when smoke tests are skipped", () => {
    if (!hasOpenAI && !hasAnthropic) {
      expect(true).toBe(true);
    }
  });
});
