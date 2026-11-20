import { describe, expect, it } from "vitest";
import type { LedgerEntry } from "@sabha/core";
import { habitYieldsToIntention, isStale } from "./decay.js";

const base = {
  confidence: 1,
  purposes: ["gating"],
  source: {
    origin: "user_stated" as const,
    at: "2026-10-01T10:00:00+05:30",
    heat: 1 as const,
  },
};

function entry(partial: Partial<LedgerEntry> & Pick<LedgerEntry, "id" | "kind" | "claim">): LedgerEntry {
  return { ...base, ...partial };
}

describe("isStale", () => {
  it("facts are not time-stale", () => {
    const fact = entry({
      id: "f1",
      kind: "fact",
      claim: "Lives in Delhi",
    });
    expect(isStale(fact, "2027-01-01T00:00:00+05:30").stale).toBe(false);
  });

  it("facts superseded are stale", () => {
    const fact = entry({
      id: "f1",
      kind: "fact",
      claim: "Lives in Delhi",
      supersededBy: "f2",
    });
    expect(isStale(fact).stale).toBe(true);
  });

  it("intentions past reviewAt are stale", () => {
    const intention = entry({
      id: "i1",
      kind: "intention",
      claim: "Wake at 5 am",
      reviewAt: "2026-11-01T00:00:00+05:30",
    });
    expect(isStale(intention, "2026-12-01T00:00:00+05:30").stale).toBe(true);
    expect(isStale(intention, "2026-10-15T00:00:00+05:30").stale).toBe(false);
  });

  it("emotional events stale after half-life", () => {
    const emo = entry({
      id: "e1",
      kind: "emotional_event",
      claim: "Argument with Riya",
      source: {
        origin: "observed",
        at: "2026-10-01T20:00:00+05:30",
        heat: 3,
      },
    });
    expect(isStale(emo, "2026-10-05T20:00:00+05:30").stale).toBe(false);
    expect(isStale(emo, "2026-10-20T20:00:00+05:30").stale).toBe(true);
  });

  it("exceptions never time-stale", () => {
    const ex = entry({
      id: "x1",
      kind: "exception",
      claim: "Waived ticket for Riya",
    });
    expect(isStale(ex, "2030-01-01T00:00:00+05:30").stale).toBe(false);
  });

  it("context past end date is stale", () => {
    const ctx = entry({
      id: "c1",
      kind: "context",
      claim: "Moving to Bengaluru on 3 Nov",
      reviewAt: "2026-11-03T00:00:00+05:30",
    });
    expect(isStale(ctx, "2026-11-04T00:00:00+05:30").stale).toBe(true);
  });

  it("habit yields to newer intention on same subject", () => {
    const habit = entry({
      id: "h1",
      kind: "habit",
      claim: "Wakes around 10 am",
      subject: "routine.wake",
      source: { origin: "observed", at: "2025-01-01T10:00:00+05:30" },
    });
    const intention = entry({
      id: "i1",
      kind: "intention",
      claim: "Wake at 5 am",
      subject: "routine.wake",
      source: { origin: "user_stated", at: "2026-10-20T07:00:00+05:30" },
    });
    expect(habitYieldsToIntention(habit, intention)).toBe(true);
    expect(isStale(habit).stale).toBe(false);
  });
});
