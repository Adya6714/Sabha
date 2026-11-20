import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { z } from "zod";
import {
  EARLY_ACCESS_CAP_INR,
  LlmBudgetExceededError,
  createFileSpendLedger,
  createMemorySpendLedger,
  estimateCallCeilingInr,
  isSpendBlocked,
  spendBucketId,
  usdToInr,
} from "./budget.js";
import { complete } from "./complete.js";
import { rateForModel } from "./cost.js";

const AnswerSchema = z.object({
  label: z.string(),
  score: z.number(),
});

describe("early-access model budget", () => {
  it("prices one US dollar as ₹90 so the meter stops before the invoice", () => {
    expect(usdToInr(1)).toBe(90);
    expect(EARLY_ACCESS_CAP_INR).toBe(100);
  });

  it("prices gpt-4o-mini below gpt-4o", () => {
    const mini = rateForModel("gpt-4o-mini");
    const full = rateForModel("gpt-4o");
    expect(mini.matched).toBe(true);
    expect(mini.outputPerMTok).toBeLessThan(full.outputPerMTok);
  });

  it("keeps a short mini call well under one rupee", () => {
    const ceiling = estimateCallCeilingInr({
      model: "gpt-4o-mini",
      inputChars: 400,
    });
    expect(ceiling).toBeGreaterThan(0);
    expect(ceiling).toBeLessThan(1);
  });

  it("hashes keys into spend buckets without keeping the secret", () => {
    const secret = "sk-live-example-key";
    expect(spendBucketId(secret)).toBe(spendBucketId(secret));
    expect(spendBucketId(secret)).not.toContain(secret);
    expect(spendBucketId(secret)).not.toBe(spendBucketId("sk-other-key"));
  });

  it("stops before combined spend reaches ₹100 and refunds unused reservation", async () => {
    const ledger = createMemorySpendLedger();
    const openai = spendBucketId("openai-key");
    const anthropic = spendBucketId("anthropic-key");
    const first = await ledger.reserve({
      chargeId: openai,
      bucketIds: [openai, anthropic],
      ceilingInr: 40,
    });
    expect(await first.settle(10)).toBeCloseTo(10);

    const second = await ledger.reserve({
      chargeId: anthropic,
      bucketIds: [openai, anthropic],
      ceilingInr: 89,
    });
    expect(await second.settle(89)).toBeCloseTo(99);

    await expect(
      ledger.reserve({
        chargeId: openai,
        bucketIds: [openai, anthropic],
        ceilingInr: 1,
      }),
    ).rejects.toBeInstanceOf(LlmBudgetExceededError);
    expect(await ledger.getSpentInr([openai, anthropic])).toBeCloseTo(99);
    expect(isSpendBlocked(99.96)).toBe(true);
    expect(isSpendBlocked(99)).toBe(false);
  });

  it("persists the ceiling in a file so a new ledger sees it", async () => {
    const file = path.join(mkdtempSync(path.join(tmpdir(), "sabha-spend-")), "spend.json");
    const first = createFileSpendLedger(file);
    const reserved = await first.reserve({
      chargeId: "key:abc",
      bucketIds: ["key:abc"],
      ceilingInr: 12,
    });
    await reserved.settle(4);
    const second = createFileSpendLedger(file);
    expect(await second.getSpentInr(["key:abc"])).toBeCloseTo(4);
  });

  it("does not call the provider once the combined ceiling is reached", async () => {
    let called = false;
    const spend = createMemorySpendLedger({ person: 99.99 });
    await expect(
      complete({
        model: "openai/gpt-4o-mini",
        input: { q: "hi" },
        schema: AnswerSchema,
        providers: {
          openai: {
            name: "openai",
            async complete() {
              called = true;
              return {
                text: JSON.stringify({ label: "ok", score: 1 }),
                inputTokens: 10,
                outputTokens: 5,
              };
            },
          },
        },
        spend,
        ownerId: "person",
        logger: null,
      }),
    ).rejects.toBeInstanceOf(LlmBudgetExceededError);
    expect(called).toBe(false);
  });

  it("does not fall back to an environment key when the person brought none", async () => {
    const previous = process.env.OPENAI_API_KEY;
    process.env.OPENAI_API_KEY = "sk-from-the-server";
    try {
      await expect(
        complete({
          model: "openai/gpt-4o-mini",
          input: {},
          schema: AnswerSchema,
          keys: {},
          logger: null,
        }),
      ).rejects.toThrow(/Add your own OpenAI API key in Settings/);
    } finally {
      if (previous === undefined) delete process.env.OPENAI_API_KEY;
      else process.env.OPENAI_API_KEY = previous;
    }
  });
});
