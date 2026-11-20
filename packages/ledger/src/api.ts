import { eq, inArray, isNull } from "drizzle-orm";
import type { LedgerEntry, ProposedAction } from "@sabha/core";
import { LedgerEntrySchema } from "@sabha/core";
import { createDb } from "./db.js";
import { isStale } from "./decay.js";
import { ledgerEntries } from "./schema/index.js";

export type CouncilSeat =
  | "smriti"
  | "vartamaan"
  | "sankalp"
  | "viveka"
  | "ajnabi"
  | "sabhapati";

function rowToEntry(row: typeof ledgerEntries.$inferSelect): LedgerEntry {
  return LedgerEntrySchema.parse({
    id: row.id,
    kind: row.kind,
    claim: row.claim,
    subject: row.subject ?? undefined,
    persons: (row.persons as string[] | null) ?? undefined,
    source: row.source,
    confidence: row.confidence,
    lastConfirmedAt: row.lastConfirmedAt
      ? new Date(row.lastConfirmedAt).toISOString()
      : undefined,
    reviewAt: row.reviewAt ? new Date(row.reviewAt).toISOString() : undefined,
    hardness: row.hardness ?? undefined,
    supersededBy: row.supersededBy ?? undefined,
    purposes: row.purposes,
  });
}

export async function listEntries(opts?: {
  includeSuperseded?: boolean;
}): Promise<LedgerEntry[]> {
  const { db, client } = createDb();
  try {
    const rows = opts?.includeSuperseded
      ? await db.select().from(ledgerEntries)
      : await db
          .select()
          .from(ledgerEntries)
          .where(isNull(ledgerEntries.supersededBy));
    return rows.map(rowToEntry);
  } finally {
    await client.end({ timeout: 5 });
  }
}

export async function getEntry(id: string): Promise<LedgerEntry | null> {
  const { db, client } = createDb();
  try {
    const [row] = await db
      .select()
      .from(ledgerEntries)
      .where(eq(ledgerEntries.id, id));
    return row ? rowToEntry(row) : null;
  } finally {
    await client.end({ timeout: 5 });
  }
}

/**
 * Entries relevant to an action: dependsOn ids, then same persons / subject hints.
 */
export async function getRelevant(
  action: ProposedAction,
): Promise<LedgerEntry[]> {
  const { db, client } = createDb();
  try {
    const byId: LedgerEntry[] = [];
    if (action.dependsOn?.length) {
      const rows = await db
        .select()
        .from(ledgerEntries)
        .where(inArray(ledgerEntries.id, action.dependsOn));
      byId.push(...rows.map(rowToEntry));
    }

    const personSet = new Set(action.persons ?? []);
    const all = await db
      .select()
      .from(ledgerEntries)
      .where(isNull(ledgerEntries.supersededBy))
      .limit(200);

    const related = all
      .map(rowToEntry)
      .filter((entry) => {
        if (byId.some((e) => e.id === entry.id)) return false;
        if (entry.persons?.some((p) => personSet.has(p))) return true;
        const blob =
          `${action.tool} ${JSON.stringify(action.args)} ${action.rationale ?? ""}`.toLowerCase();
        const subjectTail = entry.subject?.split(".").pop()?.toLowerCase();
        if (subjectTail && blob.includes(subjectTail)) return true;
        return false;
      });

    const merged = new Map<string, LedgerEntry>();
    for (const e of [...byId, ...related]) merged.set(e.id, e);
    return [...merged.values()];
  } finally {
    await client.end({ timeout: 5 });
  }
}

export async function supersede(oldId: string, newId: string): Promise<void> {
  const { db, client } = createDb();
  try {
    await db
      .update(ledgerEntries)
      .set({ supersededBy: newId, updatedAt: new Date().toISOString() })
      .where(eq(ledgerEntries.id, oldId));
  } finally {
    await client.end({ timeout: 5 });
  }
}

/** Retire = soft-delete via supersededBy sentinel. */
export async function retire(id: string): Promise<void> {
  await supersede(id, `retired:${id}`);
}

export async function review(id: string): Promise<LedgerEntry | null> {
  const { db, client } = createDb();
  try {
    const now = new Date().toISOString();
    await db
      .update(ledgerEntries)
      .set({ lastConfirmedAt: now, updatedAt: now })
      .where(eq(ledgerEntries.id, id));
    const [row] = await db
      .select()
      .from(ledgerEntries)
      .where(eq(ledgerEntries.id, id));
    return row ? rowToEntry(row) : null;
  } finally {
    await client.end({ timeout: 5 });
  }
}

/**
 * Council evidence partitions (Phase 6 seats). Enforced in code, not prompts.
 * Ajnabi gets nothing from the ledger.
 */
export function partition(
  seat: CouncilSeat,
  entries: LedgerEntry[],
): LedgerEntry[] {
  switch (seat) {
    case "smriti":
      return entries.filter(
        (e) => e.source.origin === "observed" || e.source.origin === "inferred",
      );
    case "vartamaan":
      return entries.filter(
        (e) =>
          e.source.origin === "user_stated" || e.source.origin === "imported",
      );
    case "sankalp":
      return entries.filter(
        (e) => e.kind === "intention" || e.kind === "exception",
      );
    case "viveka":
      return entries.filter(
        (e) =>
          (e.persons?.length ?? 0) > 0 ||
          e.kind === "exception" ||
          e.subject?.startsWith("relationship."),
      );
    case "ajnabi":
      return [];
    case "sabhapati":
      return entries;
    default:
      return [];
  }
}

export function stillTrue(id: string): Promise<LedgerEntry | null> {
  return review(id);
}

export function staleAmong(
  entries: LedgerEntry[],
  now: Date | string = new Date(),
): Array<{ entry: LedgerEntry; reason: string }> {
  return entries
    .map((entry) => {
      const result = isStale(entry, now);
      return result.stale ? { entry, reason: result.reason ?? "stale" } : null;
    })
    .filter((x): x is { entry: LedgerEntry; reason: string } => x !== null);
}
