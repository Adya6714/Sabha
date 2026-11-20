import type { LedgerEntry } from "@sabha/core";

export type RippleClass =
  | "unaffected"
  | "modified"
  | "invalidated"
  | "conflicts";

export type RippleItem = {
  entryId: string;
  classification: RippleClass;
  reason: string;
};

/** Pure UI helper — mirrors `@sabha/ledger` classifier without DB deps. */
export function classifyRipple(
  trigger: LedgerEntry,
  candidate: LedgerEntry,
): RippleItem {
  if (candidate.supersededBy) {
    return {
      entryId: candidate.id,
      classification: "invalidated",
      reason: "Already superseded",
    };
  }
  if (
    trigger.kind === "intention" &&
    candidate.kind === "habit" &&
    trigger.subject &&
    trigger.subject === candidate.subject
  ) {
    return {
      entryId: candidate.id,
      classification: "conflicts",
      reason: `Habit still assumes prior behaviour while intention says: ${trigger.claim}`,
    };
  }
  if (
    trigger.subject &&
    trigger.subject === candidate.subject &&
    trigger.kind === candidate.kind
  ) {
    return {
      entryId: candidate.id,
      classification: "modified",
      reason: "Same subject — may need an updated claim",
    };
  }
  if (
    trigger.persons?.length &&
    candidate.persons?.some((p) => trigger.persons!.includes(p))
  ) {
    return {
      entryId: candidate.id,
      classification: "modified",
      reason: "Shares a person with the new entry",
    };
  }
  return {
    entryId: candidate.id,
    classification: "unaffected",
    reason: "No direct subject/person conflict detected",
  };
}

export function buildRipplePreview(
  trigger: LedgerEntry,
  candidates: LedgerEntry[],
) {
  const items = candidates.map((c) => classifyRipple(trigger, c));
  const affected = items.filter((i) => i.classification !== "unaffected");
  return {
    triggerEntryId: trigger.id,
    summary:
      affected.length === 0
        ? "No related ledger items need changes."
        : `${affected.length} related item(s) may need an update.`,
    items,
  };
}
