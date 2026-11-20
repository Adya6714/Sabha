import { describe, expect, it } from "vitest";
import {
  AuthorityGrantSchema,
  CommitmentSchema,
  FindingSchema,
  HoldSchema,
  LaneSchema,
  LedgerEntrySchema,
  ProposedActionSchema,
  ReceiptSchema,
  RuleSchema,
} from "./index.js";

const iso = "2026-11-15T10:00:00+05:30";

const validEntry = {
  id: "le_wake_5am",
  kind: "intention" as const,
  claim: "Wake at 5 am",
  subject: "routine.wake",
  source: {
    origin: "user_stated" as const,
    at: iso,
    heat: 1 as const,
  },
  confidence: 1,
  purposes: ["gating", "council"],
  hardness: "flexible" as const,
  reviewAt: "2027-02-15T10:00:00+05:30",
};

const validAction = {
  id: "act_1",
  agentId: "agent_personal",
  tool: "gmail.send",
  verb: "send" as const,
  args: { to: "riya@example.com", subject: "Ping" },
  persons: ["person_riya"],
  reversibility: "hard" as const,
  dependsOn: ["le_wake_5am"],
  rationale: "Follow-up reminder",
};

describe("LedgerEntrySchema", () => {
  it("parses a valid intention", () => {
    const entry = LedgerEntrySchema.parse(validEntry);
    expect(entry.kind).toBe("intention");
    expect(entry.confidence).toBe(1);
  });

  it("rejects confidence outside 0–1", () => {
    expect(() =>
      LedgerEntrySchema.parse({ ...validEntry, confidence: 1.5 }),
    ).toThrow();
  });

  it("rejects unknown entry kinds", () => {
    expect(() =>
      LedgerEntrySchema.parse({ ...validEntry, kind: "vibe" }),
    ).toThrow();
  });

  it("rejects empty claim", () => {
    expect(() =>
      LedgerEntrySchema.parse({ ...validEntry, claim: "" }),
    ).toThrow();
  });
});

describe("ProposedActionSchema", () => {
  it("parses a valid send action", () => {
    const action = ProposedActionSchema.parse(validAction);
    expect(action.verb).toBe("send");
    expect(action.tool).toBe("gmail.send");
  });

  it("rejects unknown verbs", () => {
    expect(() =>
      ProposedActionSchema.parse({ ...validAction, verb: "whisper" }),
    ).toThrow();
  });

  it("accepts optional amount", () => {
    const action = ProposedActionSchema.parse({
      ...validAction,
      tool: "checkout.pay",
      verb: "pay",
      amount: { value: 1999, currency: "INR" },
    });
    expect(action.amount?.currency).toBe("INR");
  });
});

describe("FindingSchema and LaneSchema", () => {
  it("parses a verified influence finding", () => {
    const finding = FindingSchema.parse({
      detector: "influence",
      severity: 2,
      evidence: ["https://jobs.example/sponsored"],
      status: "verified",
      message: "This listing is marked sponsored.",
    });
    expect(finding.status).toBe("verified");
  });

  it("rejects suspected presented without status enum abuse", () => {
    expect(() =>
      FindingSchema.parse({
        detector: "influence",
        severity: 2,
        evidence: ["x"],
        status: "proven",
        message: "Nope",
      }),
    ).toThrow();
  });

  it("accepts every gate lane", () => {
    for (const lane of [
      "auto",
      "notify",
      "delay",
      "ask",
      "council",
      "only_you",
      "block_scope",
    ] as const) {
      expect(LaneSchema.parse(lane)).toBe(lane);
    }
  });
});

describe("stub schemas", () => {
  it("parses a gift-cap rule", () => {
    const rule = RuleSchema.parse({
      id: "r_gift_cap",
      type: "rule",
      when: { verb: "pay", category: "gifts" },
      then: { limit: { amount: 2000, currency: "INR" } },
      hardness: "flexible",
      scope: { exceptPersons: [], exceptContexts: [] },
      checkBeforeFiringOn: "close_circle",
      createdAt: iso,
      createdHeat: 1,
      reviewAt: "2027-02-15T10:00:00+05:30",
    });
    expect(rule.id).toBe("r_gift_cap");
  });

  it("parses a calm-only commitment", () => {
    const commitment = CommitmentSchema.parse({
      id: "c_heat_spend",
      type: "commitment",
      description: "No purchases above ₹1000 at heat 3",
      when: { verb: "pay", heatAtLeast: 3 },
      then: { coolingOffMinutes: 120 },
      coolingOffMinutes: 120,
      reason: "I overspend when stressed",
      createdAt: iso,
      createdHeat: 1,
    });
    expect(commitment.status).toBe("active");
  });

  it("rejects commitment created at heat 3", () => {
    expect(() =>
      CommitmentSchema.parse({
        id: "c_bad",
        type: "commitment",
        description: "Nope",
        when: { verb: "pay" },
        then: {},
        reason: "Angry",
        createdAt: iso,
        createdHeat: 3,
      }),
    ).toThrow();
  });

  it("parses an authority grant", () => {
    const grant = AuthorityGrantSchema.parse({
      id: "ag_outreach_prepare",
      type: "authority_grant",
      agentId: "agent_outreach",
      toolCategory: "email",
      level: "prepare",
      createdAt: iso,
      createdBy: "user",
    });
    expect(grant.level).toBe("prepare");
  });

  it("parses a pending hold", () => {
    const hold = HoldSchema.parse({
      id: "h_123",
      actionId: validAction.id,
      action: validAction,
      lane: "ask",
      status: "pending",
      message: "Pending user approval",
      createdAt: iso,
      expiresAt: "2026-11-17T10:00:00+05:30",
    });
    expect(hold.status).toBe("pending");
  });

  it("parses a receipt with five IAR criteria", () => {
    const receipt = ReceiptSchema.parse({
      id: "rcpt_1",
      actionId: validAction.id,
      intention: "Remind Riya gently",
      agentChain: ["agent_personal"],
      ledgerUsed: ["le_wake_5am"],
      findings: [
        {
          detector: "person_rule",
          severity: 2,
          evidence: ["le_exception_riya"],
          message: "Close-circle person with a prior exception.",
        },
      ],
      lane: "ask",
      decidedBy: "user",
      decision: "executed",
      executed: { tool: "gmail.send", args: validAction.args },
      iarCriteria: [true, true, true, true, true],
      createdAt: iso,
      prevHash: "genesis",
      hash: "abc123",
    });
    expect(receipt.iarCriteria).toHaveLength(5);
  });

  it("rejects receipts with wrong IAR length", () => {
    expect(() =>
      ReceiptSchema.parse({
        id: "rcpt_bad",
        actionId: validAction.id,
        intention: "x",
        agentChain: ["a"],
        ledgerUsed: [],
        findings: [],
        lane: "auto",
        decidedBy: "auto",
        decision: "executed",
        iarCriteria: [true, true],
        createdAt: iso,
        prevHash: "genesis",
        hash: "abc",
      }),
    ).toThrow();
  });
});
