import { describe, expect, it } from "vitest";
import * as schema from "./schema/index.js";

describe("@sabha/ledger schema", () => {
  it("exports every required Phase 0 table", () => {
    expect(schema.ledgerEntries).toBeDefined();
    expect(schema.exceptions).toBeDefined();
    expect(schema.rules).toBeDefined();
    expect(schema.commitments).toBeDefined();
    expect(schema.agents).toBeDefined();
    expect(schema.authorityGrants).toBeDefined();
    expect(schema.actions).toBeDefined();
    expect(schema.findings).toBeDefined();
    expect(schema.holds).toBeDefined();
    expect(schema.councilSessions).toBeDefined();
    expect(schema.receipts).toBeDefined();
    expect(schema.llmCalls).toBeDefined();
    expect(schema.llmBudgets).toBeDefined();
    expect(schema.profiles).toBeDefined();
  });
});
