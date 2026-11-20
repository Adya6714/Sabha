import { randomUUID } from "node:crypto";
import type { ProposedAction } from "@sabha/core";
import type { CheckActionResult } from "./checkAction.js";

export type Hold = {
  id: string;
  action: ProposedAction;
  decision: CheckActionResult;
  createdAt: string;
  expiresAt: string;
  status: "pending" | "approved" | "modified" | "declined" | "expired";
};

const DEFAULT_TTL_MS = 48 * 60 * 60 * 1000;

/** In-memory hold store — replace with Postgres `holds` in Phase 4.3. */
const holds = new Map<string, Hold>();

export function createHold(
  action: ProposedAction,
  decision: CheckActionResult,
  ttlMs = DEFAULT_TTL_MS,
  now = Date.now(),
): Hold {
  const hold: Hold = {
    id: `hold_${randomUUID()}`,
    action,
    decision,
    createdAt: new Date(now).toISOString(),
    expiresAt: new Date(now + ttlMs).toISOString(),
    status: "pending",
  };
  holds.set(hold.id, hold);
  return hold;
}

export function getHold(id: string): Hold | undefined {
  return holds.get(id);
}

export function listPendingHolds(now = Date.now()): Hold[] {
  const out: Hold[] = [];
  for (const hold of holds.values()) {
    if (hold.status !== "pending") continue;
    if (new Date(hold.expiresAt).getTime() <= now) {
      hold.status = "expired";
      // expire ≠ execute
      continue;
    }
    out.push(hold);
  }
  return out;
}

export function resolveHold(
  id: string,
  resolution: "approved" | "modified" | "declined",
): Hold | undefined {
  const hold = holds.get(id);
  if (!hold || hold.status !== "pending") return undefined;
  if (new Date(hold.expiresAt).getTime() <= Date.now()) {
    hold.status = "expired";
    return hold;
  }
  hold.status = resolution;
  return hold;
}

export function clearHoldsForTests(): void {
  holds.clear();
}
