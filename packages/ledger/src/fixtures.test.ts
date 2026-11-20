import { describe, expect, it } from "vitest";
import {
  loadAllDemoFixtures,
  loadDemoFixture,
  loadFixtureIntoDb,
} from "./fixtures.js";

describe("demo fixtures", () => {
  it("loads all six cases through Zod", () => {
    const fixtures = loadAllDemoFixtures();
    expect(fixtures.map((f) => f.id)).toEqual([
      "groceries",
      "wake",
      "flight",
      "laptop",
      "earbuds",
      "riya",
    ]);
    expect(fixtures.every((f) => f.ledger.length >= 1)).toBe(true);
    expect(fixtures.every((f) => f.action.id.startsWith("act_"))).toBe(true);
  });

  it("maps demo lanes to core Lane values", () => {
    expect(loadDemoFixture("groceries").expected.lane).toBe("auto");
    expect(loadDemoFixture("wake").expected.lane).toBe("ask");
    expect(loadDemoFixture("flight").expected.lane).toBe("ask");
    expect(loadDemoFixture("laptop").expected.lane).toBe("council");
    expect(loadDemoFixture("earbuds").expected.lane).toBe("ask");
    expect(loadDemoFixture("riya").expected.lane).toBe("only_you");
  });

  it("round-trips grocery fixture through Postgres when DATABASE_URL is set", async () => {
    if (!process.env.DATABASE_URL) {
      expect(true).toBe(true);
      return;
    }
    const fixture = loadDemoFixture("groceries");
    const loaded = await loadFixtureIntoDb(fixture);
    expect(loaded.written).toHaveLength(fixture.ledger.length);
    expect(loaded.action.id).toBe("act_groceries");
    expect(loaded.expectedLane).toBe("auto");
  });
});
