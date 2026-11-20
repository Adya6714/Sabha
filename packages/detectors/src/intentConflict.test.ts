import { describe, expect, it } from "vitest";
import type { ProposedAction } from "@sabha/core";
import { intentConflictDetector } from "./intentConflict.js";

const base: ProposedAction = {
  id: "act_1",
  agentId: "agent_test",
  tool: "gmail.send",
  verb: "send",
  args: {},
  reversibility: "hard",
  origin: "user_request",
};

describe("intentConflictDetector", () => {
  it("flags tool_output non-reads (positive cases)", async () => {
    const cases: ProposedAction[] = [
      { ...base, id: "p1", verb: "send", origin: "tool_output" },
      { ...base, id: "p2", verb: "pay", tool: "checkout.pay", origin: "tool_output" },
      { ...base, id: "p3", verb: "delete", tool: "drive.delete", origin: "tool_output" },
      { ...base, id: "p4", verb: "write", tool: "notes.write", reversibility: "partial", origin: "tool_output" },
      { ...base, id: "p5", verb: "accept", tool: "calendar.accept", reversibility: "partial", origin: "tool_output" },
    ];

    for (const action of cases) {
      const findings = await intentConflictDetector.run(action, { ledger: [] });
      expect(findings, action.id).toHaveLength(1);
      expect(findings[0]?.detector).toBe("intent_conflict");
      expect(findings[0]?.severity).toBe(3);
      expect(findings[0]?.evidence).toContain(`origin:tool_output`);
    }
  });

  it("does not flag benign or read cases (negative cases)", async () => {
    const cases: ProposedAction[] = [
      { ...base, id: "n1", verb: "send", origin: "user_request" },
      { ...base, id: "n2", verb: "read", tool: "gmail.read", reversibility: "easy", origin: "tool_output" },
      { ...base, id: "n3", verb: "read", tool: "drive.read", reversibility: "easy", origin: "user_request" },
      { ...base, id: "n4", verb: "draft", tool: "gmail.draft", reversibility: "easy", origin: "user_request" },
      {
        ...base,
        id: "n5",
        verb: "write",
        tool: "notes.write",
        reversibility: "partial",
        origin: "memory",
      },
    ];

    for (const action of cases) {
      const findings = await intentConflictDetector.run(action, { ledger: [] });
      expect(findings, action.id).toEqual([]);
    }
  });

  it("optional LLM path fires severity 2 only when enabled and not entailed", async () => {
    const action: ProposedAction = {
      ...base,
      id: "llm1",
      verb: "send",
      origin: "agent_inference",
    };
    const findings = await intentConflictDetector.run(action, {
      ledger: [],
      userIntent: "Summarise my inbox",
      enableLlmIntentCheck: true,
      complete: async () => ({
        data: { entailed: false, reason: "Sending email is not entailed by summarising." },
      }),
    });
    expect(findings).toHaveLength(1);
    expect(findings[0]?.severity).toBe(2);
  });

  it("skips LLM path when the flag is off", async () => {
    let called = false;
    const findings = await intentConflictDetector.run(
      { ...base, origin: "agent_inference" },
      {
        ledger: [],
        userIntent: "Summarise my inbox",
        enableLlmIntentCheck: false,
        complete: async () => {
          called = true;
          return { data: { entailed: false, reason: "no" } };
        },
      },
    );
    expect(called).toBe(false);
    expect(findings).toEqual([]);
  });
});
