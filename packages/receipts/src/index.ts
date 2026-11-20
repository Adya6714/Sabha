import { createHash } from "node:crypto";
import type { Lane } from "@sabha/core";

export type ReceiptRecord = {
  id: string;
  actionId: string;
  lane: Lane;
  prevHash: string | null;
  hash: string;
  at: string;
  payload: Record<string, unknown>;
};

function canonicalize(input: unknown): string {
  return JSON.stringify(input);
}

export function hashReceipt(parts: {
  id: string;
  actionId: string;
  lane: Lane;
  prevHash: string | null;
  at: string;
  payload: Record<string, unknown>;
}): string {
  return createHash("sha256")
    .update(canonicalize(parts))
    .digest("hex");
}

export function appendReceipt(
  chain: ReceiptRecord[],
  input: {
    id: string;
    actionId: string;
    lane: Lane;
    payload?: Record<string, unknown>;
    at?: string;
  },
): ReceiptRecord[] {
  const prevHash = chain.length ? chain[chain.length - 1]!.hash : null;
  const at = input.at ?? new Date().toISOString();
  const payload = input.payload ?? {};
  const hash = hashReceipt({
    id: input.id,
    actionId: input.actionId,
    lane: input.lane,
    prevHash,
    at,
    payload,
  });
  return [
    ...chain,
    {
      id: input.id,
      actionId: input.actionId,
      lane: input.lane,
      prevHash,
      hash,
      at,
      payload,
    },
  ];
}

export function verifyChain(chain: ReceiptRecord[]): boolean {
  let prev: string | null = null;
  for (const r of chain) {
    if (r.prevHash !== prev) return false;
    const expected = hashReceipt({
      id: r.id,
      actionId: r.actionId,
      lane: r.lane,
      prevHash: r.prevHash,
      at: r.at,
      payload: r.payload,
    });
    if (expected !== r.hash) return false;
    prev = r.hash;
  }
  return true;
}
