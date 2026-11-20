import type { Finding, Lane, ProposedAction } from "@sabha/core";
import { runDetectors } from "@sabha/detectors";
import { defaultGateConfig, route, type GateConfig } from "@sabha/gate";
import type { LedgerEntry } from "@sabha/core";

export type CheckActionResult = {
  lane: Lane;
  reason: string;
  findings: Finding[];
  latencyMs: number;
};

/**
 * Mode A tool: check_action — detectors + Gate, no execution.
 */
export async function checkAction(
  action: ProposedAction,
  opts: {
    ledger: LedgerEntry[];
    config?: GateConfig;
    category?: string;
    authorityLevel?: "observe" | "recommend" | "prepare" | "execute" | "escalate";
  },
): Promise<CheckActionResult> {
  const started = Date.now();
  const { findings } = await runDetectors(action, {
    ledger: opts.ledger,
    authorityLevel: opts.authorityLevel ?? "execute",
  });
  const decided = route(
    action,
    findings,
    opts.config ?? defaultGateConfig(),
    {
      category: opts.category,
      purchase: action.verb === "pay",
    },
  );
  return {
    ...decided,
    findings,
    latencyMs: Date.now() - started,
  };
}
