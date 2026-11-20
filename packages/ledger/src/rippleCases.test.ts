import { describe, expect, it } from "vitest";
import type { EntryKind, LedgerEntry } from "@sabha/core";
import {
  buildRippleScreenFromCandidates,
  classifyRippleDeterministic,
  type RippleClass,
} from "./ripple.js";

const AT = "2026-06-01T10:00:00+05:30";
const NOW = "2026-11-15T10:00:00+05:30";

function entry(
  partial: Partial<LedgerEntry> &
    Pick<LedgerEntry, "id" | "kind" | "claim">,
): LedgerEntry {
  return {
    source: { origin: "user_stated", at: AT, heat: 1 },
    confidence: 1,
    purposes: ["gating"],
    ...partial,
  };
}

type Case = {
  name: string;
  trigger: LedgerEntry;
  candidate: LedgerEntry;
  expected: RippleClass;
};

const subjects = [
  "routine.wake",
  "spend.gifts",
  "career.job",
  "health.sleep",
  "travel.flights",
  "relationships.riya",
  "signals.hr",
  "home.groceries",
  "finance.cap",
  "work.calendar",
];

const kinds: EntryKind[] = [
  "fact",
  "habit",
  "intention",
  "emotional_event",
  "exception",
  "context",
];

const cases: Case[] = [];

// Intention vs habit same subject → conflicts (10)
for (let i = 0; i < 10; i++) {
  const subject = subjects[i % subjects.length]!;
  cases.push({
    name: `intention-vs-habit-${i}`,
    trigger: entry({
      id: `t_int_${i}`,
      kind: "intention",
      claim: `New intention ${i}`,
      subject,
    }),
    candidate: entry({
      id: `c_hab_${i}`,
      kind: "habit",
      claim: `Old habit ${i}`,
      subject,
      source: { origin: "observed", at: "2025-01-01T10:00:00+05:30" },
      confidence: 0.7,
    }),
    expected: "conflicts",
  });
}

// Same subject + same kind → modified (10)
// Use a fresh timestamp so emotional_event candidates are not time-stale.
for (let i = 0; i < 10; i++) {
  const kind = kinds[i % kinds.length]!;
  const subject = subjects[i % subjects.length]!;
  cases.push({
    name: `same-kind-subject-${i}`,
    trigger: entry({
      id: `t_same_${i}`,
      kind,
      claim: `Updated ${kind} ${i}`,
      subject,
      source: { origin: "user_stated", at: "2026-11-10T10:00:00+05:30", heat: 1 },
    }),
    candidate: entry({
      id: `c_same_${i}`,
      kind,
      claim: `Prior ${kind} ${i}`,
      subject,
      source: { origin: "user_stated", at: "2026-11-12T10:00:00+05:30", heat: 1 },
    }),
    expected: "modified",
  });
}

// Shared person → modified (10)
for (let i = 0; i < 10; i++) {
  const person = `person_${i}`;
  cases.push({
    name: `shared-person-${i}`,
    trigger: entry({
      id: `t_per_${i}`,
      kind: "context",
      claim: `About ${person}`,
      persons: [person],
      subject: `rel.${i}`,
    }),
    candidate: entry({
      id: `c_per_${i}`,
      kind: "fact",
      claim: `Prior note on ${person}`,
      persons: [person, "person_other"],
      subject: `rel.other.${i}`,
    }),
    expected: "modified",
  });
}

// Unrelated → unaffected (10)
for (let i = 0; i < 10; i++) {
  cases.push({
    name: `unrelated-${i}`,
    trigger: entry({
      id: `t_un_${i}`,
      kind: "intention",
      claim: `Unrelated trigger ${i}`,
      subject: `alpha.${i}`,
    }),
    candidate: entry({
      id: `c_un_${i}`,
      kind: "fact",
      claim: `Unrelated candidate ${i}`,
      subject: `beta.${i}`,
    }),
    expected: "unaffected",
  });
}

// Superseded candidates → invalidated (10)
for (let i = 0; i < 10; i++) {
  cases.push({
    name: `superseded-${i}`,
    trigger: entry({
      id: `t_sup_${i}`,
      kind: "intention",
      claim: `Trigger ${i}`,
      subject: subjects[i % subjects.length],
    }),
    candidate: entry({
      id: `c_sup_${i}`,
      kind: "habit",
      claim: `Old ${i}`,
      subject: subjects[i % subjects.length],
      supersededBy: `le_newer_${i}`,
    }),
    expected: "invalidated",
  });
}

// Stale emotional_event (old, no confirmation) → invalidated (10)
for (let i = 0; i < 10; i++) {
  cases.push({
    name: `stale-emotional-${i}`,
    trigger: entry({
      id: `t_emo_${i}`,
      kind: "context",
      claim: `Context ${i}`,
      subject: `mood.${i}`,
    }),
    candidate: entry({
      id: `c_emo_${i}`,
      kind: "emotional_event",
      claim: `Felt stressed ${i}`,
      subject: `mood.${i}`,
      source: {
        origin: "observed",
        at: "2024-01-01T10:00:00+05:30",
        heat: 3,
      },
      confidence: 0.6,
    }),
    expected: "invalidated",
  });
}

describe("ripple case suite (≥60)", () => {
  it("has at least 60 labelled cases", () => {
    expect(cases.length).toBeGreaterThanOrEqual(60);
  });

  it("classifies each case as labelled", () => {
    let hits = 0;
    let falseFlags = 0;
    for (const c of cases) {
      const item = classifyRippleDeterministic(c.trigger, c.candidate, NOW);
      if (item.classification === c.expected) hits += 1;
      // False flag: predicted affected when expected unaffected
      if (
        c.expected === "unaffected" &&
        item.classification !== "unaffected"
      ) {
        falseFlags += 1;
      }
      expect(item.classification, c.name).toBe(c.expected);
    }
    const recall = hits / cases.length;
    expect(recall).toBeGreaterThanOrEqual(0.8);
    expect(falseFlags).toBeLessThanOrEqual(2);
  });

  it("builds ripple screens with update|keep|later contract shape", () => {
    const trigger = cases[0]!.trigger;
    const candidates = cases.slice(0, 5).map((c) => c.candidate);
    const screen = buildRippleScreenFromCandidates(trigger, candidates, NOW);
    expect(screen.triggerEntryId).toBe(trigger.id);
    expect(screen.items.length).toBe(candidates.length);
    for (const item of screen.items) {
      expect(["unaffected", "modified", "invalidated", "conflicts"]).toContain(
        item.classification,
      );
    }
  });
});
