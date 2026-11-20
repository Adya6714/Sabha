/**
 * Labelled eval set scaffolds (Phase 2.6).
 * Counts match plan targets; fill labels over time. CI currently asserts shape.
 */
export type EvalCase = {
  id: string;
  detector:
    | "staleness"
    | "heat"
    | "person_rule"
    | "influence"
    | "scope";
  expectFinding: boolean;
};

function make(detector: EvalCase["detector"], n: number): EvalCase[] {
  return Array.from({ length: n }, (_, i) => ({
    id: `${detector}_${i + 1}`,
    detector,
    expectFinding: i % 3 !== 0, // placeholder labelling ratio
  }));
}

export const EVAL_TARGETS = {
  staleness: 80,
  heat: 60,
  person_rule: 40,
  influence: 50,
  scope: 40,
} as const;

export const evalSets = {
  staleness: make("staleness", EVAL_TARGETS.staleness),
  heat: make("heat", EVAL_TARGETS.heat),
  person_rule: make("person_rule", EVAL_TARGETS.person_rule),
  influence: make("influence", EVAL_TARGETS.influence),
  scope: make("scope", EVAL_TARGETS.scope),
};
