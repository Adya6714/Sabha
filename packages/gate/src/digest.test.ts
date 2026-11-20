import { describe, expect, it } from "vitest";
import {
  buildEveningDigest,
  queueForDigest,
  shouldQueueForDigest,
} from "./digest.js";

describe("evening digest", () => {
  it("queues only severity-1 findings", () => {
    expect(
      shouldQueueForDigest({
        detector: "influence",
        severity: 1,
        evidence: ["le_1"],
        message: "low",
      }),
    ).toBe(true);
    expect(
      shouldQueueForDigest({
        detector: "staleness",
        severity: 3,
        evidence: ["le_1"],
        message: "high",
      }),
    ).toBe(false);
  });

  it("builds a still-true digest summary", () => {
    let items = queueForDigest(
      [],
      {
        detector: "influence",
        severity: 1,
        evidence: ["le_a"],
        message: "nudge",
      },
      "act_1",
    );
    items = queueForDigest(
      items,
      {
        detector: "heat",
        severity: 1,
        evidence: ["le_b"],
        message: "soft",
      },
      "act_2",
    );
    const digest = buildEveningDigest(items);
    expect(digest.count).toBe(2);
    expect(digest.stillTruePrompts).toContain("le_a");
    expect(digest.summary).toMatch(/2 low-stakes/);
  });
});
