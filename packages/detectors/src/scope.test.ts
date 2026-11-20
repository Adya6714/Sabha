import { describe, expect, it } from "vitest";
import type { ProposedAction } from "@sabha/core";
import { scopeDetector } from "./scope.js";

const send: ProposedAction = {
  id: "act_send",
  agentId: "agent",
  tool: "gmail.send",
  verb: "send",
  args: {},
  reversibility: "hard",
  origin: "user_request",
};

describe("scopeDetector authority defaults", () => {
  it("defaults unset authorityLevel to recommend and blocks execute verbs", async () => {
    const findings = await scopeDetector.run(send, { ledger: [] });
    expect(findings.some((f) => f.detector === "scope" && f.severity >= 3)).toBe(
      true,
    );
    expect(findings[0]?.evidence).toContain("authority:recommend");
  });

  it("allows send when authorityLevel is execute", async () => {
    const findings = await scopeDetector.run(send, {
      ledger: [],
      authorityLevel: "execute",
    });
    expect(findings.filter((f) => f.severity >= 3)).toEqual([]);
  });

  it("allows read under recommend", async () => {
    const findings = await scopeDetector.run(
      {
        ...send,
        id: "act_read",
        verb: "read",
        tool: "gmail.read",
        reversibility: "easy",
      },
      { ledger: [] },
    );
    expect(findings).toEqual([]);
  });
});
