import { describe, expect, it } from "vitest";
import {
  loadLabeledActions,
  labeledActionsPath,
  needsHuman,
} from "./sets.js";

describe("labeled actions loader", () => {
  it("loads labeled_actions.jsonl with required fields", () => {
    const rows = loadLabeledActions(labeledActionsPath());
    expect(rows.length).toBeGreaterThan(0);
    for (const row of rows.slice(0, 20)) {
      expect(row.id.length).toBeGreaterThan(0);
      expect(["dev", "test"]).toContain(row.split);
      expect(row.source.length).toBeGreaterThan(0);
      expect(typeof row.user_instruction).toBe("string");
      expect(row.action.id).toBeTruthy();
      expect([
        "user_request",
        "tool_output",
        "memory",
        "agent_inference",
      ]).toContain(row.origin);
      expect(Array.isArray(row.chain)).toBe(true);
      expect(["Auto", "Ask", "Block"]).toContain(row.label);
    }
  });

  it("maps Ask/Block to needs_human", () => {
    expect(needsHuman("Auto")).toBe(false);
    expect(needsHuman("Ask")).toBe(true);
    expect(needsHuman("Block")).toBe(true);
  });

  it("includes both splits from the injecagent pilot seed", () => {
    const rows = loadLabeledActions();
    expect(rows.some((r) => r.split === "dev")).toBe(true);
    expect(rows.some((r) => r.split === "test")).toBe(true);
    expect(rows.every((r) => r.source === "injecagent_pilot")).toBe(true);
  });
});
