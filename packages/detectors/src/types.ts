import type { Finding, LedgerEntry, ProposedAction } from "@sabha/core";

export type DetectorContext = {
  ledger: LedgerEntry[];
  rules?: Array<{ id: string; when: unknown; then: unknown }>;
  now?: string;
  /** Close-circle person ids */
  closeCircle?: string[];
  /** Authority level for this agent+tool category */
  authorityLevel?: "observe" | "recommend" | "prepare" | "execute" | "escalate";
  /** Signals the user allowed for this purpose */
  allowedSignals?: string[];
  /** Signals present on the action */
  usedSignals?: string[];
};

export interface Detector {
  name: Finding["detector"];
  run(action: ProposedAction, ctx: DetectorContext): Promise<Finding[]>;
}
