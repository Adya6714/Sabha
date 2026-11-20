import { describe, expect, it } from "vitest";
import { loadAllDemoFixtures } from "@sabha/ledger";
import { assertInfluenceLabel } from "./influence.js";
import { heatLeavesSabha } from "./heat.js";
import { runDetectors } from "./run.js";

describe("runDetectors on demo fixtures", () => {
  it("produces findings for each fixture without throwing", async () => {
    const fixtures = loadAllDemoFixtures();
    for (const fixture of fixtures) {
      const { findings, latencyMs } = await runDetectors(fixture.action, {
        ledger: fixture.ledger,
        authorityLevel:
          fixture.id === "riya" ? "recommend" : "execute",
        closeCircle: ["person_riya"],
        usedSignals:
          fixture.id === "earbuds" ? ["hr", "stress", "buy"] : undefined,
      });
      expect(latencyMs).toBeLessThan(2000);
      expect(Array.isArray(findings)).toBe(true);

      for (const expected of fixture.expected.findings) {
        const hit = findings.find((f) => f.detector === expected.detector);
        expect(
          hit,
          `${fixture.id} missing detector ${expected.detector}`,
        ).toBeTruthy();
      }
    }
  });

  it("never labels suspected as verified without proof", () => {
    expect(assertInfluenceLabel("verified", false)).toBe("suspected");
    expect(assertInfluenceLabel("verified", true)).toBe("verified");
  });

  it("flags heat payloads that would leave Sabha", () => {
    expect(
      heatLeavesSabha({ agent: "gmail", heat: 3 }),
    ).toBe(true);
    expect(heatLeavesSabha({ lane: "ask" })).toBe(false);
  });
});
