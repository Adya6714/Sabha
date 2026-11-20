import type { Finding, Lane, ProposedAction } from "@sabha/core";
import { defaultGateConfig, type GateConfig } from "./config.js";

export type RouteResult = {
  lane: Lane;
  reason: string;
};

function severityToP(severity: 1 | 2 | 3): number {
  return severity === 1 ? 0.2 : severity === 2 ? 0.5 : 0.8;
}

function wrongActionCost(action: ProposedAction): number {
  const stakes =
    action.amount && action.amount.value > 20000
      ? 3
      : action.amount && action.amount.value > 2000
        ? 2
        : action.verb === "send" || action.verb === "pay"
          ? 2
          : 1;
  const rev =
    action.reversibility === "hard" ? 3 : action.reversibility === "partial" ? 2 : 1;
  return stakes * rev;
}

/**
 * Ask only when expected cost of acting wrong beats interrupt cost + budget pressure.
 * P × C(wrong) > C(interrupt) + λ · asksUsed/budget
 */
export function shouldAsk(
  findings: Finding[],
  action: ProposedAction,
  config: GateConfig,
): boolean {
  const material = findings.filter((f) => f.severity >= 2);
  if (!material.length) return false;
  // Severity-3 findings always warrant an ask (never digest-only / silent auto).
  if (material.some((f) => f.severity >= 3)) return true;
  const p = Math.max(...material.map((f) => severityToP(f.severity)));
  const cWrong = wrongActionCost(action);
  const cInterrupt = 2;
  const pressure = config.lambda * (config.asksUsedToday / Math.max(1, config.askBudget));
  return p * cWrong > cInterrupt + pressure;
}

export function route(
  action: ProposedAction,
  findings: Finding[],
  config: GateConfig = defaultGateConfig(),
  meta?: { category?: string; purchase?: boolean },
): RouteResult {
  const scope = findings.find((f) => f.detector === "scope" && f.severity >= 3);
  if (scope) {
    return {
      lane: "block_scope",
      reason: scope.message,
    };
  }

  if (meta?.category && config.onlyYouCategories.includes(meta.category)) {
    return {
      lane: "only_you",
      reason:
        "This category is Only You — Sabha can inform, but will not act or recommend.",
    };
  }

  const heat3 = findings.some((f) => f.detector === "heat" && f.severity === 3);
  if (heat3 && (meta?.purchase || action.verb === "pay")) {
    return {
      lane: "delay",
      reason: `Heat is high on a purchase — held for a ${config.coolingOffMinutes}-minute cooling period.`,
    };
  }

  const highStakes =
    (action.amount?.value ?? 0) > config.amountBands.medium ||
    (action.reversibility === "hard" &&
      findings.filter((f) => f.severity >= 2).length >= 2);
  const valueConflict =
    findings.filter((f) => f.severity >= 2).length >= 2 && highStakes;
  if (valueConflict) {
    return {
      lane: "council",
      reason:
        "High stakes with competing findings — Council should examine before anything runs.",
    };
  }

  // Laptop-style: high amount alone → council when influence or flexibility tags present
  if ((action.amount?.value ?? 0) >= 50000) {
    return {
      lane: "council",
      reason: "High-stakes purchase — Council before execution.",
    };
  }

  if (shouldAsk(findings, action, config)) {
    const top = findings.sort((a, b) => b.severity - a.severity)[0];
    return {
      lane: "ask",
      reason: top?.message ?? "Needs your decision before acting.",
    };
  }

  if (
    action.amount &&
    action.amount.value > config.spendCap &&
    action.verb === "pay"
  ) {
    return {
      lane: "ask",
      reason: `₹${action.amount.value} is above the ₹${config.spendCap} spend cap.`,
    };
  }

  // Floor: hard irreversible outbound verbs always at least ask unless the user allowed them.
  const hardFloorVerbs = new Set(["send", "pay", "delete", "accept"]);
  const allowedHard = new Set(config.allowHardAutoVerbs ?? []);
  if (
    action.reversibility === "hard" &&
    hardFloorVerbs.has(action.verb) &&
    !allowedHard.has(action.verb as "send" | "pay" | "delete" | "accept")
  ) {
    return {
      lane: "ask",
      reason: `${action.verb} is hard to reverse — confirm before it runs.`,
    };
  }

  if ((action.amount?.value ?? 0) > config.amountBands.low && !findings.length) {
    return {
      lane: "notify",
      reason: "Medium stakes with no findings — done with undo.",
    };
  }

  return {
    lane: "auto",
    reason: "Routine, within permissions — receipt only.",
  };
}
