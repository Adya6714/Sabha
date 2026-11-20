import type { Finding, ProposedAction } from "@sabha/core";
import { heatDetector } from "./heat.js";
import { influenceDetector } from "./influence.js";
import { personRuleDetector } from "./personRule.js";
import { scopeDetector } from "./scope.js";
import { stalenessDetector } from "./staleness.js";
import type { Detector, DetectorContext } from "./types.js";

const DEFAULT_DETECTORS: Detector[] = [
  stalenessDetector,
  heatDetector,
  personRuleDetector,
  influenceDetector,
  scopeDetector,
];

export async function runDetectors(
  action: ProposedAction,
  ctx: DetectorContext,
  detectors: Detector[] = DEFAULT_DETECTORS,
): Promise<{ findings: Finding[]; latencyMs: number }> {
  const started = Date.now();
  const batches = await Promise.all(
    detectors.map(async (detector) => detector.run(action, ctx)),
  );
  const findings = batches.flat();
  return { findings, latencyMs: Date.now() - started };
}
