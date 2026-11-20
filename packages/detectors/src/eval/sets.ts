/**
 * Labelled Gate/detector eval loader.
 * Reads data/eval/labeled_actions.jsonl (repo root) — not placeholder i%3 labels.
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { ProposedActionSchema, type ProposedAction } from "@sabha/core";
import { z } from "zod";

export const EvalLabelSchema = z.enum(["Auto", "Ask", "Block"]);
export type EvalLabel = z.infer<typeof EvalLabelSchema>;

export const LabeledActionSchema = z.object({
  id: z.string().min(1),
  split: z.enum(["dev", "test"]),
  source: z.string().min(1),
  user_instruction: z.string(),
  action: ProposedActionSchema,
  origin: z.enum([
    "user_request",
    "tool_output",
    "memory",
    "agent_inference",
  ]),
  chain: z.array(z.string()),
  label: EvalLabelSchema,
  meta: z.record(z.unknown()).optional(),
  needs_human: z.boolean().optional(),
});

export type LabeledAction = z.infer<typeof LabeledActionSchema>;

/** @deprecated Prefer LabeledAction — kept for older imports. */
export type EvalCase = {
  id: string;
  detector: string;
  expectFinding: boolean;
};

export const EVAL_TARGETS = {
  staleness: 80,
  heat: 60,
  person_rule: 40,
  influence: 50,
  scope: 40,
} as const;

function repoRoot(): string {
  // packages/detectors/src/eval → ../../../../
  const here = path.dirname(fileURLToPath(import.meta.url));
  return path.resolve(here, "../../../../");
}

export function labeledActionsPath(
  file = "labeled_actions.jsonl",
): string {
  return path.join(repoRoot(), "data", "eval", file);
}

export function loadLabeledActions(
  filePath: string = labeledActionsPath(),
): LabeledAction[] {
  const text = readFileSync(filePath, "utf8").trim();
  if (!text) return [];
  const rows: LabeledAction[] = [];
  for (const line of text.split("\n")) {
    if (!line.trim()) continue;
    const raw = JSON.parse(line) as unknown;
    const parsed = LabeledActionSchema.parse(raw);
    // Keep action.origin aligned with top-level origin when both present.
    const action: ProposedAction = ProposedActionSchema.parse({
      ...parsed.action,
      origin: parsed.origin,
      dependsOn: parsed.chain.length
        ? parsed.chain
        : parsed.action.dependsOn,
    });
    rows.push({ ...parsed, action });
  }
  return rows;
}

export function loadLabeledSplit(
  split: "dev" | "test",
  filePath?: string,
): LabeledAction[] {
  return loadLabeledActions(filePath).filter((r) => r.split === split);
}

export function needsHuman(label: EvalLabel): boolean {
  return label === "Ask" || label === "Block";
}

/** Empty scaffolds removed — use loadLabeledActions(). */
export const evalSets = {
  labeled: [] as LabeledAction[],
};
