import { describe, expect, it } from "vitest";
import { appendReceipt, verifyChain } from "./index.js";

describe("receipt hash chain", () => {
  it("verifies append-only chain", () => {
    let chain = appendReceipt([], {
      id: "r1",
      actionId: "a1",
      lane: "ask",
      payload: { ok: true },
      at: "2026-11-15T10:00:00.000Z",
    });
    chain = appendReceipt(chain, {
      id: "r2",
      actionId: "a2",
      lane: "auto",
      at: "2026-11-15T11:00:00.000Z",
    });
    expect(verifyChain(chain)).toBe(true);
    expect(chain[1]?.prevHash).toBe(chain[0]?.hash);
  });

  it("detects tampering", () => {
    const chain = appendReceipt([], {
      id: "r1",
      actionId: "a1",
      lane: "notify",
      at: "2026-11-15T10:00:00.000Z",
    });
    const broken = [{ ...chain[0]!, payload: { hacked: true } }];
    expect(verifyChain(broken)).toBe(false);
  });
});
