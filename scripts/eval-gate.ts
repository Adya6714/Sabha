/**
 * Gate vs baselines on labelled actions.
 * Usage: pnpm eval:gate [actions.jsonl]
 * Defaults to data/eval/injecagent_pilot.jsonl when no path is given.
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  ProposedActionSchema,
  type ProposedAction,
} from "@sabha/core";
import {
  loadLabeledActions,
  needsHuman,
  type LabeledAction,
} from "@sabha/detectors";
import { runDetectors } from "@sabha/detectors";
import { defaultGateConfig, route, type GateConfig } from "@sabha/gate";

type Decision = "auto" | "ask" | "block";

type EvalRow = {
  id: string;
  action: ProposedAction;
  needs_human: boolean;
  group: string;
  source: string;
};

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function fromLane(lane: string): Decision {
  if (lane === "auto" || lane === "notify") return "auto";
  if (lane === "block_scope") return "block";
  return "ask";
}

function loadRows(filePath: string): EvalRow[] {
  const abs = path.isAbsolute(filePath)
    ? filePath
    : path.resolve(process.cwd(), filePath);
  const first = readFileSync(abs, "utf8").trim().split("\n")[0];
  if (!first) return [];
  const sample = JSON.parse(first) as Record<string, unknown>;

  if (sample.action && sample.label) {
    const labeled = loadLabeledActions(abs);
    return labeled.map((row: LabeledAction) => ({
      id: row.id,
      action: row.action,
      needs_human: row.needs_human ?? needsHuman(row.label),
      group: String(row.meta?.group ?? row.source),
      source: row.source,
    }));
  }

  // Pilot / adapter shape: flat ProposedAction + meta + label.needs_human
  return readFileSync(abs, "utf8")
    .trim()
    .split("\n")
    .filter(Boolean)
    .map((line) => {
      const raw = JSON.parse(line) as {
        id: string;
        agentId: string;
        tool: string;
        verb: ProposedAction["verb"];
        args?: Record<string, unknown>;
        reversibility: ProposedAction["reversibility"];
        amount?: ProposedAction["amount"];
        persons?: string[];
        dependsOn?: string[];
        rationale?: string;
        meta?: { origin?: string; group?: string };
        label: { needs_human: boolean };
      };
      const originRaw = raw.meta?.origin ?? "user";
      const origin =
        originRaw === "user" || originRaw === "user_request"
          ? "user_request"
          : originRaw === "tool_output"
            ? "tool_output"
            : originRaw === "memory"
              ? "memory"
              : originRaw === "agent_inference"
                ? "agent_inference"
                : "user_request";
      const action = ProposedActionSchema.parse({
        id: raw.id,
        agentId: raw.agentId,
        tool: raw.tool,
        verb: raw.verb,
        args: raw.args ?? {},
        reversibility: raw.reversibility,
        amount: raw.amount,
        persons: raw.persons,
        dependsOn: raw.dependsOn,
        rationale: raw.rationale,
        origin,
      });
      return {
        id: raw.id,
        action,
        needs_human: Boolean(raw.label.needs_human),
        group: raw.meta?.group ?? "unknown",
        source: "pilot",
      };
    });
}

type StrategyFn = (row: EvalRow, config: GateConfig) => Promise<Decision>;

const strategies: Record<string, StrategyFn> = {
  always_auto: async () => "auto",
  always_ask: async () => "ask",
  ask_if_irreversible: async (row) =>
    row.action.reversibility === "hard" ||
    ["send", "pay", "delete", "accept"].includes(row.action.verb)
      ? "ask"
      : "auto",
  sabha_gate: async (row, config) => {
    // Honest defaults: unset authority → recommend (scope detector).
    const { findings } = await runDetectors(row.action, {
      ledger: [],
      recentActions: [],
    });
    return fromLane(route(row.action, findings, config).lane);
  },
};

type Counts = { tp: number; fp: number; fn: number; tn: number };

function metrics(c: Counts) {
  const precision = c.tp / Math.max(1, c.tp + c.fp);
  const recall = c.tp / Math.max(1, c.tp + c.fn);
  const f1 = (2 * precision * recall) / Math.max(1e-9, precision + recall);
  const askRate = (c.tp + c.fp) / Math.max(1, c.tp + c.fp + c.fn + c.tn);
  return { precision, recall, f1, askRate };
}

function bootstrapCI(
  flags: boolean[],
  labels: boolean[],
  key: "precision" | "recall" | "f1" | "askRate",
  rounds = 1000,
  seed = 7,
): { lo: number; hi: number } {
  let s = seed;
  const rand = () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0x100000000;
  };
  const n = flags.length;
  const scores: number[] = [];
  for (let r = 0; r < rounds; r++) {
    const c: Counts = { tp: 0, fp: 0, fn: 0, tn: 0 };
    for (let i = 0; i < n; i++) {
      const j = Math.floor(rand() * n);
      const flagged = flags[j]!;
      const pos = labels[j]!;
      if (flagged && pos) c.tp++;
      else if (flagged && !pos) c.fp++;
      else if (!flagged && pos) c.fn++;
      else c.tn++;
    }
    scores.push(metrics(c)[key]);
  }
  scores.sort((a, b) => a - b);
  const lo = scores[Math.floor(0.025 * rounds)] ?? 0;
  const hi = scores[Math.min(rounds - 1, Math.floor(0.975 * rounds))] ?? 1;
  return { lo, hi };
}

function pct(x: number): string {
  return `${(100 * x).toFixed(1)}%`;
}

function fmtCI(ci: { lo: number; hi: number }): string {
  return `[${pct(ci.lo)}, ${pct(ci.hi)}]`;
}

async function evaluate(
  name: string,
  fn: StrategyFn,
  rows: EvalRow[],
  config: GateConfig,
): Promise<{
  name: string;
  precision: number;
  recall: number;
  f1: number;
  askRate: number;
  precisionCI: { lo: number; hi: number };
  recallCI: { lo: number; hi: number };
  f1CI: { lo: number; hi: number };
  askRateCI: { lo: number; hi: number };
  counts: Counts;
}> {
  const flags: boolean[] = [];
  const labels: boolean[] = [];
  const c: Counts = { tp: 0, fp: 0, fn: 0, tn: 0 };
  for (const row of rows) {
    const decision = await fn(row, config);
    const flagged = decision !== "auto";
    const pos = row.needs_human;
    flags.push(flagged);
    labels.push(pos);
    if (flagged && pos) c.tp++;
    else if (flagged && !pos) c.fp++;
    else if (!flagged && pos) c.fn++;
    else c.tn++;
  }
  const m = metrics(c);
  return {
    name,
    ...m,
    precisionCI: bootstrapCI(flags, labels, "precision"),
    recallCI: bootstrapCI(flags, labels, "recall"),
    f1CI: bootstrapCI(flags, labels, "f1"),
    askRateCI: bootstrapCI(flags, labels, "askRate"),
    counts: c,
  };
}

async function sweep(
  rows: EvalRow[],
): Promise<Array<{ lambda: number; askBudget: number; recall: number; askRate: number }>> {
  const points: Array<{
    lambda: number;
    askBudget: number;
    recall: number;
    askRate: number;
  }> = [];
  for (const lambda of [0.5, 1, 2, 4]) {
    for (const askBudget of [3, 5, 8, 12]) {
      const config = { ...defaultGateConfig(), lambda, askBudget };
      const result = await evaluate("sabha_gate", strategies.sabha_gate!, rows, config);
      points.push({
        lambda,
        askBudget,
        recall: result.recall,
        askRate: result.askRate,
      });
    }
  }
  return points;
}

async function main() {
  const arg = process.argv[2];
  const filePath =
    arg ?? path.join(ROOT, "data/eval/injecagent_pilot.jsonl");
  const rows = loadRows(filePath);
  if (!rows.length) {
    console.error(`No rows loaded from ${filePath}`);
    process.exit(1);
  }

  console.log(`# Gate eval`);
  console.log(`File: \`${path.relative(ROOT, path.resolve(filePath))}\``);
  console.log(`n = ${rows.length}`);
  console.log("");
  console.log(
    "| Strategy | Precision | Recall | F1 | Ask-rate | Precision 95% CI | Recall 95% CI |",
  );
  console.log(
    "| --- | ---: | ---: | ---: | ---: | --- | --- |",
  );

  const config = defaultGateConfig();
  for (const [name, fn] of Object.entries(strategies)) {
    const result = await evaluate(name, fn, rows, config);
    console.log(
      `| ${result.name} | ${pct(result.precision)} | ${pct(result.recall)} | ${pct(result.f1)} | ${pct(result.askRate)} | ${fmtCI(result.precisionCI)} | ${fmtCI(result.recallCI)} |`,
    );
  }

  console.log("");
  console.log("## Sweep: sabha_gate recall vs ask-rate (lambda × askBudget)");
  console.log("");
  console.log("| lambda | askBudget | Recall | Ask-rate |");
  console.log("| ---: | ---: | ---: | ---: |");
  const points = await sweep(rows);
  for (const p of points) {
    console.log(
      `| ${p.lambda} | ${p.askBudget} | ${pct(p.recall)} | ${pct(p.askRate)} |`,
    );
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
