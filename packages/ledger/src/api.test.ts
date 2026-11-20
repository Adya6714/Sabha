import { describe, expect, it } from "vitest";
import type { LedgerEntry } from "@sabha/core";
import { partition } from "./api.js";

const entries: LedgerEntry[] = [
  {
    id: "1",
    kind: "habit",
    claim: "Wakes at 10",
    source: { origin: "observed", at: "2025-01-01T00:00:00.000Z" },
    confidence: 0.7,
    purposes: ["gating"],
  },
  {
    id: "2",
    kind: "intention",
    claim: "Wake at 5",
    source: { origin: "user_stated", at: "2026-10-20T00:00:00.000Z", heat: 1 },
    confidence: 1,
    purposes: ["gating"],
  },
  {
    id: "3",
    kind: "emotional_event",
    claim: "Argument with Riya",
    persons: ["person_riya"],
    subject: "relationship.riya",
    source: { origin: "observed", at: "2026-10-21T00:00:00.000Z", heat: 3 },
    confidence: 0.9,
    purposes: ["gating"],
  },
];

describe("partition", () => {
  it("gives Smriti only observed/inferred", () => {
    expect(partition("smriti", entries).map((e) => e.id)).toEqual(["1", "3"]);
  });
  it("gives Ajnabi an empty slice", () => {
    expect(partition("ajnabi", entries)).toEqual([]);
  });
  it("gives Viveka relationship/person entries", () => {
    expect(partition("viveka", entries).map((e) => e.id)).toEqual(["3"]);
  });
  it("gives Sabhapati everything", () => {
    expect(partition("sabhapati", entries)).toHaveLength(3);
  });
});
