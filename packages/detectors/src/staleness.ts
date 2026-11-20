import type { Finding } from "@sabha/core";
import { habitYieldsToIntention, isStale } from "@sabha/ledger";
import type { Detector } from "./types.js";

export const stalenessDetector: Detector = {
  name: "staleness",
  async run(action, ctx) {
    const now = ctx.now ?? new Date().toISOString();
    const findings: Finding[] = [];
    const deps = action.dependsOn?.length
      ? ctx.ledger.filter((e) => action.dependsOn!.includes(e.id))
      : ctx.ledger;

    for (const entry of deps) {
      const stale = isStale(entry, now);
      if (stale.stale) {
        findings.push({
          detector: "staleness",
          severity: 2,
          evidence: [entry.id],
          message: stale.reason ?? `Stale ledger dependency: ${entry.claim}`,
        });
      }

      if (entry.kind === "habit" && entry.subject) {
        const intention = ctx.ledger.find(
          (e) =>
            e.kind === "intention" &&
            e.subject === entry.subject &&
            habitYieldsToIntention(entry, e),
        );
        if (intention) {
          findings.push({
            detector: "staleness",
            severity: 3,
            evidence: [entry.id, intention.id],
            message: `Assumes “${entry.claim}”. You set “${intention.claim}”.`,
          });
        }
      }
    }

    return findings;
  },
};
