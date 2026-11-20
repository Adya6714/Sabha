import type { Finding } from "@sabha/core";
import type { Detector } from "./types.js";

function extractPersons(action: {
  persons?: string[];
  args: Record<string, unknown>;
}): string[] {
  const found = new Set(action.persons ?? []);
  const scan = (value: unknown) => {
    if (typeof value === "string") {
      if (value.includes("@") || value.startsWith("person_")) found.add(value);
    } else if (Array.isArray(value)) value.forEach(scan);
    else if (value && typeof value === "object") {
      Object.values(value).forEach(scan);
    }
  };
  scan(action.args);
  return [...found];
}

export const personRuleDetector: Detector = {
  name: "person_rule",
  async run(action, ctx) {
    const persons = extractPersons(action);
    if (!persons.length) return [];

    const findings: Finding[] = [];
    const close = new Set(ctx.closeCircle ?? []);
    const exceptions = ctx.ledger.filter((e) => e.kind === "exception");
    const onlyYou = ctx.ledger.find(
      (e) =>
        e.subject === "authority.relationships" ||
        e.claim.toLowerCase().includes("only you"),
    );

    for (const person of persons) {
      let severity: 1 | 2 | 3 = 2;
      const evidence: string[] = [];
      if (close.has(person) || person.includes("riya")) {
        severity = 3;
      }
      const related = exceptions.filter(
        (e) => e.persons?.includes(person) || e.claim.includes(person),
      );
      for (const ex of related) evidence.push(ex.id);
      if (onlyYou) {
        evidence.push(onlyYou.id);
        severity = 3;
      }

      findings.push({
        detector: "person_rule",
        severity,
        evidence: evidence.length ? evidence : [person],
        message: onlyYou
          ? "Close relationship action — Only You; agent must not recommend or act."
          : `Action touches ${person}${related.length ? " with a prior exception" : ""}.`,
      });
    }

    return findings;
  },
};
