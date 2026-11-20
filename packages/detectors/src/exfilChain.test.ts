import { describe, expect, it } from "vitest";
import type { ProposedAction } from "@sabha/core";
import { exfilChainDetector } from "./exfilChain.js";

function action(partial: Partial<ProposedAction> & Pick<ProposedAction, "id" | "verb" | "tool">): ProposedAction {
  return {
    agentId: "agent_test",
    args: {},
    reversibility: partial.verb === "read" ? "easy" : "hard",
    origin: "user_request",
    ...partial,
  };
}

describe("exfilChainDetector", () => {
  it("flags send/share/post chained from unrequested reads (positive)", async () => {
    const positives: Array<{
      send: ProposedAction;
      recent: ProposedAction[];
    }> = [
      {
        send: action({
          id: "send1",
          verb: "send",
          tool: "gmail.send",
          dependsOn: ["read_secret"],
        }),
        recent: [
          action({
            id: "read_secret",
            verb: "read",
            tool: "drive.read",
            origin: "tool_output",
          }),
        ],
      },
      {
        send: action({
          id: "send2",
          verb: "send",
          tool: "slack.post",
          dependsOn: ["read_mail"],
        }),
        recent: [
          action({
            id: "read_mail",
            verb: "read",
            tool: "gmail.read",
            origin: "agent_inference",
          }),
        ],
      },
      {
        send: action({
          id: "send3",
          verb: "write",
          tool: "twitter.share",
          dependsOn: ["read_notes"],
          reversibility: "hard",
        }),
        recent: [
          action({
            id: "read_notes",
            verb: "read",
            tool: "notes.read",
            origin: "tool_output",
          }),
        ],
      },
      {
        send: action({
          id: "send4",
          verb: "send",
          tool: "gmail.forward",
          dependsOn: ["read_a", "read_b"],
        }),
        recent: [
          action({
            id: "read_a",
            verb: "read",
            tool: "gmail.read",
            origin: "user_request",
          }),
          action({
            id: "read_b",
            verb: "read",
            tool: "drive.read",
            origin: "memory",
          }),
        ],
      },
      {
        send: action({
          id: "send5",
          verb: "send",
          tool: "chat.postMessage",
          dependsOn: ["sneaky_read"],
        }),
        recent: [
          action({
            id: "sneaky_read",
            verb: "read",
            tool: "hr.read",
            origin: "tool_output",
          }),
        ],
      },
    ];

    for (const { send, recent } of positives) {
      const findings = await exfilChainDetector.run(send, {
        ledger: [],
        recentActions: recent,
      });
      expect(findings, send.id).toHaveLength(1);
      expect(findings[0]?.detector).toBe("exfil_chain");
      expect(findings[0]?.severity).toBe(3);
    }
  });

  it("does not flag benign chains (negative)", async () => {
    const negatives: Array<{
      send: ProposedAction;
      recent: ProposedAction[];
    }> = [
      {
        // user-requested read → send
        send: action({
          id: "n1",
          verb: "send",
          tool: "gmail.send",
          dependsOn: ["read_ok"],
        }),
        recent: [
          action({
            id: "read_ok",
            verb: "read",
            tool: "gmail.read",
            origin: "user_request",
          }),
        ],
      },
      {
        // outbound with empty chain
        send: action({ id: "n2", verb: "send", tool: "gmail.send" }),
        recent: [],
      },
      {
        // read itself is never outbound
        send: action({
          id: "n3",
          verb: "read",
          tool: "gmail.read",
          origin: "tool_output",
          dependsOn: ["x"],
        }),
        recent: [
          action({
            id: "x",
            verb: "read",
            tool: "drive.read",
            origin: "tool_output",
          }),
        ],
      },
      {
        // dependsOn id not in recentActions
        send: action({
          id: "n4",
          verb: "send",
          tool: "gmail.send",
          dependsOn: ["missing"],
        }),
        recent: [],
      },
      {
        // prior is a write, not a read
        send: action({
          id: "n5",
          verb: "send",
          tool: "gmail.send",
          dependsOn: ["draft1"],
        }),
        recent: [
          action({
            id: "draft1",
            verb: "draft",
            tool: "gmail.draft",
            origin: "tool_output",
            reversibility: "easy",
          }),
        ],
      },
    ];

    for (const { send, recent } of negatives) {
      const findings = await exfilChainDetector.run(send, {
        ledger: [],
        recentActions: recent,
      });
      expect(findings, send.id).toEqual([]);
    }
  });
});
