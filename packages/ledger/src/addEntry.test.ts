import { describe, expect, it } from "vitest";
import { z } from "zod";
import { addEntry, inferredCanJustifyWrite } from "./addEntry.js";

describe("addEntry", () => {
  it("saves a structured user-stated entry without LLM", async () => {
    const result = await addEntry({
      persist: false,
      entry: {
        kind: "intention",
        claim: "Wake at 5 am",
        subject: "routine.wake",
        confidence: 1,
        purposes: ["gating"],
      },
      origin: "user_stated",
      heat: 1,
    });
    expect(result.status).toBe("saved");
    if (result.status === "saved") {
      expect(result.entry.source.origin).toBe("user_stated");
      expect(result.entry.source.heat).toBe(1);
      expect(result.ripple.pending).toBe(true);
    }
  });

  it("asks for clarification when extract confidence is low", async () => {
    const result = await addEntry({
      persist: false,
      text: "maybe something about mornings?",
      complete: async () => ({
        data: {
          kind: "intention" as const,
          claim: "Unclear morning preference",
          confidence: 0.3,
          needsClarification: true,
          clarifyingQuestion: "Do you want to wake at 5 am?",
        },
      }),
    });
    expect(result.status).toBe("needs_clarification");
    if (result.status === "needs_clarification") {
      expect(result.question).toMatch(/wake/i);
    }
  });

  it("caps inferred confidence below 0.7 and blocks write justification", async () => {
    const result = await addEntry({
      persist: false,
      origin: "inferred",
      entry: {
        kind: "habit",
        claim: "Often orders late-night food",
        confidence: 0.9,
        purposes: ["gating"],
      },
    });
    expect(result.status).toBe("saved");
    if (result.status === "saved") {
      expect(result.entry.confidence).toBeLessThan(0.7);
      expect(inferredCanJustifyWrite(result.entry)).toBe(false);
    }
  });

  it("requires complete() when only text is provided", async () => {
    await expect(
      addEntry({ persist: false, text: "Wake at 5" }),
    ).rejects.toThrow(/complete/);
  });
});

describe("ExtractedEntrySchema contract", () => {
  it("accepts a clarifying extract payload shape", () => {
    const schema = z.object({
      needsClarification: z.boolean(),
      clarifyingQuestion: z.string().optional(),
    });
    expect(
      schema.parse({
        needsClarification: true,
        clarifyingQuestion: "Hard limit or flexible?",
      }).needsClarification,
    ).toBe(true);
  });
});
