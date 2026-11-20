import { describe, expect, it } from "vitest";
import type { LedgerEntry } from "@sabha/core";
import { COUNCIL_SEAT_POLICY, SEAT_LABELS, SEATS, draftSeatLine, seatSlice } from "./index.js";

const ledger: LedgerEntry[] = [
  {
    id: "le_1",
    kind: "intention",
    claim: "Wake early",
    subject: "routine.wake",
    source: { origin: "user_stated", at: "2026-10-01T10:00:00+05:30" },
    confidence: 1,
    purposes: ["council"],
  },
];

describe("council partition scaffold", () => {
  it("ajnabi gets empty slice", () => {
    expect(seatSlice("ajnabi", ledger)).toEqual([]);
  });

  it("keeps the six canonical seat names", () => {
    expect(COUNCIL_SEAT_POLICY).toBe("fixed");
    expect(Object.keys(SEAT_LABELS).sort()).toEqual([...SEATS].sort());
    expect(SEAT_LABELS.sabhapati).toBe("Sabhapati");
  });

  it("abstains when evidence out of slice", () => {
    const line = draftSeatLine("ajnabi", ledger, "should abstain", ["le_1"]);
    expect(line.abstained).toBe(true);
  });
});
