import type { Finding } from "@sabha/core";
import type { Detector } from "./types.js";

const HEAT_WORDS =
  /\b(angry|furious|upset|stressed|treat myself|revenge|now!!!|asap!!!)\b/i;

export const heatDetector: Detector = {
  name: "heat",
  async run(action, ctx) {
    const findings: Finding[] = [];
    const rationale = `${action.rationale ?? ""} ${JSON.stringify(action.args)}`;

    const recentHeat = ctx.ledger.filter(
      (e) =>
        e.kind === "emotional_event" &&
        (e.source.heat === 3 ||
          (e.source.at &&
            Date.now() - new Date(e.source.at).getTime() < 6 * 3600_000)),
    );

    let score = 1;
    if (recentHeat.length) score = 3;
    else if (HEAT_WORDS.test(rationale)) score = 2;

    // Borderline wording without recent event → severity 2 suspected heat
    if (score >= 2) {
      findings.push({
        detector: "heat",
        severity: score as 1 | 2 | 3,
        evidence: recentHeat.map((e) => e.id),
        message:
          score === 3
            ? "Purchase or action while emotional heat appears high."
            : "Instruction wording suggests elevated urgency or heat.",
      });
    }

    // Security: heat findings must never be forwarded to agents — enforced by gateway later.
    void ctx.allowedSignals;
    return findings;
  },
};

/** Heat signals must stay inside Sabha. */
export function heatLeavesSabha(payload: unknown): boolean {
  const text = JSON.stringify(payload);
  return /"heat"\s*:/.test(text) && /agent|third.?party|vendor/i.test(text);
}
