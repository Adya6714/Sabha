import type { Finding, ProposedAction } from "@sabha/core";
import type { Detector } from "./types.js";

const OUTBOUND_VERBS = new Set(["send"]);

function isOutboundShare(action: ProposedAction): boolean {
  if (OUTBOUND_VERBS.has(action.verb)) return true;
  const tool = action.tool.toLowerCase();
  return /share|post|retweet|forward/.test(tool);
}

function isUnrequestedRead(prior: ProposedAction): boolean {
  return prior.verb === "read" && (prior.origin ?? "user_request") !== "user_request";
}

/**
 * Catches data-stealing chains: a send/share/post that depends on a read
 * the user did not request (origin tool_output / memory / agent_inference).
 */
export const exfilChainDetector: Detector = {
  name: "exfil_chain",
  async run(action, ctx) {
    if (!isOutboundShare(action)) return [];
    const chain = action.dependsOn ?? [];
    if (!chain.length) return [];

    const recent = ctx.recentActions ?? [];
    const byId = new Map(recent.map((a) => [a.id, a]));
    const taintedReads: ProposedAction[] = [];

    for (const depId of chain) {
      const prior = byId.get(depId);
      if (prior && isUnrequestedRead(prior)) {
        taintedReads.push(prior);
      }
    }

    if (!taintedReads.length) return [];

    const findings: Finding[] = [
      {
        detector: "exfil_chain",
        severity: 3,
        evidence: [
          action.id,
          ...taintedReads.map((r) => r.id),
          ...taintedReads.map((r) => `origin:${r.origin ?? "unknown"}`),
        ],
        message:
          "This outbound share depends on a read you did not request. Confirm before anything leaves.",
      },
    ];
    return findings;
  },
};
