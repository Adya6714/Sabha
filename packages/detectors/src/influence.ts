import type { Finding } from "@sabha/core";
import type { Detector } from "./types.js";

export const influenceDetector: Detector = {
  name: "influence",
  async run(action) {
    const findings: Finding[] = [];
    const args = action.args;

    const sponsored =
      args.sponsored === true ||
      args.ad === true ||
      (typeof args.campaign === "string" && args.campaign.length > 0) ||
      (typeof args.url === "string" &&
        /[?&](utm_campaign|aff|sponsored)=/i.test(args.url));

    if (sponsored) {
      findings.push({
        detector: "influence",
        severity: 2,
        evidence: [`${action.id}.args.sponsored`],
        status: "verified",
        message: "This recommendation carries an explicit sponsored/ad signal.",
      });
      return findings;
    }

    // Suspected: expensive pick with no rationale — never labelled verified
    if (
      action.amount &&
      action.amount.value >= 10000 &&
      !action.rationale
    ) {
      findings.push({
        detector: "influence",
        severity: 1,
        evidence: [action.id],
        status: "suspected",
        message:
          "High-value pick without a stated reason — influence suspected, not proven.",
      });
      return findings;
    }

    findings.push({
      detector: "influence",
      severity: 1,
      evidence: [action.id],
      status: "unknown",
      message: "No ranking or sponsorship data available for this pick.",
    });
    return findings;
  },
};

/** Guard: never upgrade suspected → verified without new evidence. */
export function assertInfluenceLabel(
  status: "verified" | "suspected" | "unknown",
  hasExplicitProof: boolean,
): "verified" | "suspected" | "unknown" {
  if (status === "verified" && !hasExplicitProof) return "suspected";
  return status;
}
