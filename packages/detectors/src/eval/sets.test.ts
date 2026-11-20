import { describe, expect, it } from "vitest";
import { EVAL_TARGETS, evalSets } from "./sets.js";

describe("detector eval set scaffolds", () => {
  it("meets plan target counts", () => {
    expect(evalSets.staleness.length).toBe(EVAL_TARGETS.staleness);
    expect(evalSets.heat.length).toBe(EVAL_TARGETS.heat);
    expect(evalSets.person_rule.length).toBe(EVAL_TARGETS.person_rule);
    expect(evalSets.influence.length).toBe(EVAL_TARGETS.influence);
    expect(evalSets.scope.length).toBe(EVAL_TARGETS.scope);
  });
});
