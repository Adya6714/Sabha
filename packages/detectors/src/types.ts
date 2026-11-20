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
  /** User's stated instruction for this turn (intent_conflict optional LLM path). */
  userIntent?: string;
  /**
   * Recent actions in this session, oldest → newest.
   * Used by exfil_chain to resolve dependsOn ids to prior reads.
   */
  recentActions?: ProposedAction[];
  /**
   * When true, intent_conflict may call packages/llm complete() for entailment.
   * Default inference stays deterministic.
   */
  enableLlmIntentCheck?: boolean;
  /** Injected complete() for tests / apps when enableLlmIntentCheck is on. */
  complete?: (args: {
    model: string;
    system?: string;
    input: unknown;
    schema: unknown;
    schemaName?: string;
  }) => Promise<{ data: { entailed: boolean; reason: string } }>;
};
export interface Detector {
  name: Finding["detector"];
  run(action: ProposedAction, ctx: DetectorContext): Promise<Finding[]>;
}
