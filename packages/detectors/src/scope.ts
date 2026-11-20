import type { Finding } from "@sabha/core";
import type { Detector } from "./types.js";

const VERB_MIN_LEVEL: Record<
  string,
  "observe" | "recommend" | "prepare" | "execute" | "escalate"
> = {
  read: "observe",
  draft: "prepare",
  write: "prepare",
  send: "execute",
  pay: "execute",
  delete: "execute",
  accept: "execute",
};

const ORDER = ["observe", "recommend", "prepare", "execute", "escalate"] as const;

function levelOk(
  have: (typeof ORDER)[number],
  need: (typeof ORDER)[number],
): boolean {
  return ORDER.indexOf(have) >= ORDER.indexOf(need);
}

export const scopeDetector: Detector = {
  name: "scope",
  async run(action, ctx) {
    const findings: Finding[] = [];
    const need = VERB_MIN_LEVEL[action.verb] ?? "execute";
    // Safe default: unknown authority means recommend, not execute.
    const have = ctx.authorityLevel ?? "recommend";

    if (!levelOk(have, need)) {
      findings.push({
        detector: "scope",
        severity: 3,
        evidence: [`authority:${have}`, `need:${need}`],
        message: `Agent authority is ${have}, but ${action.verb} requires ${need}.`,
      });
    }

    const cap = ctx.ledger.find((e) => e.subject === "money.agent_cap");
    if (
      action.amount &&
      cap &&
      /₹?\s?(\d[\d,]*)/.test(cap.claim)
    ) {
      const match = cap.claim.replace(/,/g, "").match(/(\d+)/);
      const limit = match ? Number(match[1]) : undefined;
      if (limit && action.amount.value > limit) {
        findings.push({
          detector: "scope",
          severity: 2,
          evidence: [cap.id],
          message: `₹${action.amount.value} is above the ₹${limit} your agent may spend alone.`,
        });
      }
    }

    const signalBlock = ctx.ledger.find((e) =>
      e.subject?.startsWith("signals."),
    );
    if (
      signalBlock &&
      ctx.usedSignals?.some((s) => ["hr", "stress"].includes(s))
    ) {
      findings.push({
        detector: "scope",
        severity: 2,
        evidence: [signalBlock.id],
        message: "Blocked shopping use of stress/heart-rate signals.",
      });
    }

    return findings;
  },
};
