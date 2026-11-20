import { describe, expect, it } from "vitest";
import { loadAllDemoFixtures } from "./fixtures.js";
import { buildRippleScreenFromCandidates } from "./ripple.js";

/**
 * For each demo fixture, treat the newest user_stated intention/context as a
 * trigger and ensure related ledger rows produce a ripple screen.
 */
describe("demo fixtures → expected ripples", () => {
  it("produces ripple screens for each fixture ledger", () => {
    const fixtures = loadAllDemoFixtures();
    expect(fixtures.length).toBe(6);

    for (const fixture of fixtures) {
      const trigger =
        fixture.ledger.find(
          (e) =>
            e.source.origin === "user_stated" &&
            (e.kind === "intention" || e.kind === "context"),
        ) ?? fixture.ledger[0];

      if (!trigger || fixture.ledger.length < 2) {
        // Single-entry ledgers have nothing to ripple against
        const screen = buildRippleScreenFromCandidates(trigger!, []);
        expect(screen.items).toEqual([]);
        continue;
      }

      const candidates = fixture.ledger.filter((e) => e.id !== trigger.id);
      const screen = buildRippleScreenFromCandidates(trigger, candidates);

      expect(screen.triggerEntryId).toBe(trigger.id);
      expect(screen.items.length).toBe(candidates.length);

      // Wake: intention vs midday habit should conflict
      if (fixture.id === "wake") {
        const habit = screen.items.find((i) => i.entryId === "le_wake_habit");
        expect(habit?.classification).toBe("conflicts");
      }
    }
  });
});
