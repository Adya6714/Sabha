import { describe, expect, it } from "vitest";
import type { Finding, ProposedAction } from "@sabha/core";
import { defaultGateConfig, route } from "./index.js";
import { queueForDigest, shouldQueueForDigest } from "./digest.js";

function action(
  i: number,
  overrides?: Partial<ProposedAction>,
): ProposedAction {
  return {
    id: `act_sim_${i}`,
    agentId: "agent_sim",
    tool: i % 5 === 0 ? "checkout.pay" : "gmail.send",
    verb: i % 5 === 0 ? "pay" : "send",
    args: { i },
    reversibility: i % 7 === 0 ? "hard" : "easy",
    amount:
      i % 5 === 0
        ? { value: 500 + (i % 10) * 100, currency: "INR" }
        : undefined,
    ...overrides,
  };
}

function findingsFor(i: number): Finding[] {
  if (i % 11 === 0) {
    return [
      {
        detector: "staleness",
        severity: 3,
        evidence: [`le_${i}`],
        message: "Stale dependency",
      },
    ];
  }
  if (i % 9 === 0) {
    return [
      {
        detector: "heat",
        severity: 3,
        evidence: ["signals"],
        message: "High heat",
      },
    ];
  }
  if (i % 6 === 0) {
    return [
      {
        detector: "person_rule",
        severity: 2,
        evidence: ["person_x"],
        message: "Close circle",
      },
    ];
  }
  if (i % 4 === 0) {
    return [
      {
        detector: "influence",
        severity: 1,
        evidence: ["src"],
        status: "suspected",
        message: "Possible influence",
      },
    ];
  }
  return [];
}

function isHardFloor(
  act: ProposedAction,
  findings: Finding[],
  lane: string,
): boolean {
  if (lane !== "ask") return false;
  if (act.reversibility !== "hard") return false;
  if (!["send", "pay", "delete", "accept"].includes(act.verb)) return false;
  // Floor fires when nothing else already forced a human lane from findings/amount.
  return !findings.some((f) => f.severity >= 2);
}

describe("200 synthetic actions / week sim", () => {
  it("keeps discretionary asks within weekly envelope; severity-3 never digest-only", () => {
    const config = defaultGateConfig();
    config.askBudget = 5;
    let humanAsks = 0;
    let floorAsks = 0;
    let digest = queueForDigest(
      [],
      {
        detector: "influence",
        severity: 1,
        evidence: [],
        message: "seed",
      },
      "noop",
    );
    digest = [];

    for (let i = 0; i < 200; i++) {
      const act = action(i);
      const findings = findingsFor(i);
      const cfg = {
        ...config,
        asksUsedToday: Math.min(humanAsks, config.askBudget),
      };
      const result = route(act, findings, cfg, {
        purchase: act.verb === "pay",
      });

      if (
        result.lane === "ask" ||
        result.lane === "council" ||
        result.lane === "delay" ||
        result.lane === "only_you" ||
        result.lane === "block_scope"
      ) {
        if (isHardFloor(act, findings, result.lane)) {
          floorAsks += 1;
        }
        if (result.lane === "ask" || result.lane === "council") {
          humanAsks += 1;
        }
      }

      for (const f of findings) {
        if (f.severity >= 3) {
          expect(shouldQueueForDigest(f)).toBe(false);
          expect(result.lane).not.toBe("auto");
        } else if (shouldQueueForDigest(f) && result.lane === "auto") {
          digest = queueForDigest(digest, f, act.id);
        }
      }
    }

    // Hard floor asks are safety interrupts and can exceed the soft weekly
    // ask envelope; the envelope still bounds the overall human-ask pressure
    // once those floor asks are counted toward asksUsedToday.
    const hardOutbound = Array.from({ length: 200 }, (_, i) => action(i)).filter(
      (a) =>
        a.reversibility === "hard" &&
        ["send", "pay", "delete", "accept"].includes(a.verb),
    ).length;
    expect(floorAsks).toBeGreaterThan(0);
    expect(humanAsks).toBeLessThanOrEqual(config.askBudget * 7 + hardOutbound);
    expect(digest.every((d) => d.finding.severity === 1)).toBe(true);
  });
});
