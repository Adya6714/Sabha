import { describe, expect, it, beforeEach } from "vitest";
import {
  clearHoldsForTests,
  createHold,
  listPendingHolds,
  resolveHold,
} from "./holds.js";
import type { CheckActionResult } from "./checkAction.js";

const action = {
  id: "act_1",
  agentId: "a",
  tool: "gmail.send",
  verb: "send" as const,
  args: {},
  reversibility: "hard" as const,
};

const decision: CheckActionResult = {
  lane: "ask",
  reason: "needs you",
  findings: [],
  latencyMs: 1,
};

describe("holds", () => {
  beforeEach(() => clearHoldsForTests());

  it("expire ≠ execute — expired holds stay non-approved", () => {
    const hold = createHold(action, decision, 1, Date.now() - 10);
    const pending = listPendingHolds(Date.now());
    expect(pending).toHaveLength(0);
    expect(hold.status).toBe("expired");
  });

  it("approve path only when still pending", () => {
    const hold = createHold(action, decision, 60_000);
    const resolved = resolveHold(hold.id, "approved");
    expect(resolved?.status).toBe("approved");
  });
});
