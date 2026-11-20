import { describe, expect, it } from "vitest";
import { z } from "zod";
import { complete } from "./complete.js";
import { createMemoryLogger } from "./log.js";
import type { LlmProvider } from "./providers/types.js";

const AnswerSchema = z.object({
  label: z.string(),
  score: z.number().min(0).max(1),
});

function mockProvider(
  name: "openai" | "anthropic",
  responses: string[],
): LlmProvider {
  let i = 0;
  return {
    name,
    async complete() {
      const text = responses[Math.min(i, responses.length - 1)] ?? "{}";
      i += 1;
      return {
        text,
        inputTokens: 10,
        outputTokens: 5,
      };
    },
  };
}

describe("complete()", () => {
  it("returns Zod-validated JSON from OpenAI-shaped mock", async () => {
    const logger = createMemoryLogger();
    const result = await complete({
      model: "openai/gpt-4o-mini",
      input: { q: "hello" },
      schema: AnswerSchema,
      schemaName: "Answer",
      providers: {
        openai: mockProvider("openai", [
          JSON.stringify({ label: "ok", score: 0.9 }),
        ]),
      },
      logger,
    });

    expect(result.data).toEqual({ label: "ok", score: 0.9 });
    expect(result.provider).toBe("openai");
    expect(result.attempts).toBe(1);
    expect(logger.entries).toHaveLength(1);
    expect(logger.entries[0]?.status).toBe("ok");
  });

  it("retries once when the first payload fails the schema", async () => {
    const logger = createMemoryLogger();
    const result = await complete({
      model: "anthropic/claude-3-5-haiku-latest",
      input: { q: "retry" },
      schema: AnswerSchema,
      providers: {
        anthropic: mockProvider("anthropic", [
          JSON.stringify({ label: "bad", score: 9 }),
          JSON.stringify({ label: "fixed", score: 0.4 }),
        ]),
      },
      logger,
    });

    expect(result.data.label).toBe("fixed");
    expect(result.attempts).toBe(2);
    expect(logger.entries[0]?.status).toBe("ok");
  });

  it("throws after a second schema failure", async () => {
    const logger = createMemoryLogger();
    await expect(
      complete({
        model: "openai/gpt-4o-mini",
        input: {},
        schema: AnswerSchema,
        providers: {
          openai: mockProvider("openai", [
            JSON.stringify({ label: "x", score: 2 }),
            JSON.stringify({ label: "y", score: 3 }),
          ]),
        },
        logger,
      }),
    ).rejects.toThrow(/failed Zod validation after retry/);

    expect(logger.entries[0]?.status).toBe("schema_error");
  });
});
