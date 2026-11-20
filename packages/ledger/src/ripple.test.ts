import { describe, expect, it } from "vitest";
import type { LedgerEntry } from "@sabha/core";
import {
  buildRippleScreenFromCandidates,
  classifyRippleDeterministic,
} from "./ripple.js";

const habit: LedgerEntry = {
  id: "le_wake_habit",
  kind: "habit",
  claim: "Wakes around 10 am",
  subject: "routine.wake",
  source: { origin: "observed", at: "2025-01-01T10:00:00+05:30" },
  confidence: 0.7,
  purposes: ["gating"],
};

const intention: LedgerEntry = {
  id: "le_wake_5am",
  kind: "intention",
  claim: "Wake at 5 am",
  subject: "routine.wake",
  source: { origin: "user_stated", at: "2026-10-20T07:00:00+05:30", heat: 1 },
  confidence: 1,
  purposes: ["gating"],
};

describe("ripple classifier", () => {
  it("flags habit vs new intention as conflicts", () => {
    const item = classifyRippleDeterministic(intention, habit);
    expect(item.classification).toBe("conflicts");
  });

  it("builds a one-screen summary for wake fixture style data", () => {
    const screen = buildRippleScreenFromCandidates(intention, [habit]);
    expect(screen.triggerEntryId).toBe("le_wake_5am");
    expect(screen.summary).toMatch(/1 related/);
    expect(screen.items[0]?.classification).toBe("conflicts");
  });
});
