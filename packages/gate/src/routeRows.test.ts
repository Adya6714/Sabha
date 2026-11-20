import { describe, expect, it } from "vitest";
import type { Finding, ProposedAction } from "@sabha/core";
import { defaultGateConfig, route } from "./index.js";

const base: ProposedAction = {
  id: "act",
  agentId: "a",
  tool: "gmail.send",
  verb: "send",
  args: {},
  reversibility: "easy",
};

function f(
  detector: Finding["detector"],
  severity: Finding["severity"],
  message = "m",
): Finding {
  return { detector, severity, evidence: ["e"], message };
}

describe("≥3 fixtures per routing row", () => {
  const cfg = defaultGateConfig();

  it("block_scope", () => {
    for (let i = 0; i < 3; i++) {
      const r = route({ ...base, id: `b${i}` }, [f("scope", 3, "out of scope")], cfg);
      expect(r.lane).toBe("block_scope");
    }
  });

  it("only_you", () => {
    for (let i = 0; i < 3; i++) {
      const r = route({ ...base, id: `o${i}` }, [], cfg, {
        category: "relationships",
      });
      expect(r.lane).toBe("only_you");
    }
  });

  it("delay", () => {
    for (let i = 0; i < 3; i++) {
      const r = route(
        { ...base, id: `d${i}`, verb: "pay", tool: "checkout.pay" },
        [f("heat", 3)],
        cfg,
        { purchase: true },
      );
      expect(r.lane).toBe("delay");
    }
  });

  it("council", () => {
    for (let i = 0; i < 3; i++) {
      const r = route(
        {
          ...base,
          id: `c${i}`,
          verb: "pay",
          tool: "checkout.pay",
          amount: { value: 60000, currency: "INR" },
          reversibility: "hard",
        },
        [f("influence", 2), f("staleness", 2)],
        cfg,
      );
      expect(r.lane).toBe("council");
    }
  });

  it("ask", () => {
    for (let i = 0; i < 3; i++) {
      const r = route(
        { ...base, id: `a${i}`, reversibility: "hard", verb: "send" },
        [f("staleness", 3, "stale")],
        cfg,
      );
      expect(r.lane).toBe("ask");
    }
  });

  it("auto", () => {
    for (let i = 0; i < 3; i++) {
      const r = route({ ...base, id: `z${i}` }, [], cfg);
      expect(r.lane).toBe("auto");
    }
  });
});
