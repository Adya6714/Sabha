import { and, eq, ne, sql } from "drizzle-orm";
import { z } from "zod";
import type { LedgerEntry } from "@sabha/core";
import { LedgerEntrySchema } from "@sabha/core";
import { createDb } from "./db.js";
import { isStale } from "./decay.js";
import { ledgerEntries, rules } from "./schema/index.js";

export const RippleClassSchema = z.enum([
  "unaffected",
  "modified",
  "invalidated",
  "conflicts",
]);

export const RippleItemSchema = z.object({
  entryId: z.string(),
  classification: RippleClassSchema,
  reason: z.string(),
});

export const RippleChoiceSchema = z.object({
  entryId: z.string(),
  action: z.enum(["update", "keep", "later"]),
  newClaim: z.string().optional(),
});

export type RippleClass = z.infer<typeof RippleClassSchema>;
export type RippleItem = z.infer<typeof RippleItemSchema>;
export type RippleChoice = z.infer<typeof RippleChoiceSchema>;

export type RippleScreen = {
  triggerEntryId: string;
  summary: string;
  items: RippleItem[];
};

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

/**
 * Candidate retrieval for ripple (Phase 1.3):
 * same subject OR overlapping persons, excluding the trigger.
 * Embedding top-20 lands when embeddings are populated (pgvector column ready).
 */
export async function findRippleCandidates(
  trigger: LedgerEntry,
  opts?: { limit?: number },
): Promise<LedgerEntry[]> {
  const limit = opts?.limit ?? 20;
  const { db, client } = createDb();

  try {
    const subject = trigger.subject;
    const personSet = new Set(trigger.persons ?? []);

    let rows: (typeof ledgerEntries.$inferSelect)[] = [];

    if (subject) {
      rows = await db
        .select()
        .from(ledgerEntries)
        .where(
          and(ne(ledgerEntries.id, trigger.id), eq(ledgerEntries.subject, subject)),
        )
        .limit(limit);
    } else {
      rows = await db
        .select()
        .from(ledgerEntries)
        .where(ne(ledgerEntries.id, trigger.id))
        .limit(200);
    }

    const byPerson =
      personSet.size === 0
        ? []
        : (
            await db
              .select()
              .from(ledgerEntries)
              .where(ne(ledgerEntries.id, trigger.id))
              .limit(200)
          ).filter((row) => {
            const persons = (row.persons as string[] | null) ?? [];
            return persons.some((p) => personSet.has(p));
          });

    const merged = new Map<string, (typeof ledgerEntries.$inferSelect)>();
    for (const row of [...rows, ...byPerson]) merged.set(row.id, row);

    if (subject) {
      await db
        .select({ id: rules.id })
        .from(rules)
        .where(sql`${rules.when}::text ilike ${"%" + subject + "%"}`)
        .limit(10);
    }

    return [...merged.values()].slice(0, limit).map(rowToEntry);
  } finally {
    await client.end({ timeout: 5 });
  }
}

/**
 * Deterministic classifier used when no LLM is injected.
 * Conservative: same subject intention vs habit → conflicts; superseded/stale → invalidated.
 */
export function classifyRippleDeterministic(
  trigger: LedgerEntry,
  candidate: LedgerEntry,
  now: Date | string = new Date(),
): RippleItem {
  if (candidate.supersededBy || isStale(candidate, now).stale) {
    return {
      entryId: candidate.id,
      classification: "invalidated",
      reason: isStale(candidate, now).reason ?? "Already superseded or stale",
    };
  }

  if (
    trigger.kind === "intention" &&
    candidate.kind === "habit" &&
    trigger.subject &&
    trigger.subject === candidate.subject
  ) {
    return {
      entryId: candidate.id,
      classification: "conflicts",
      reason: `Habit still assumes prior behaviour while intention says: ${trigger.claim}`,
    };
  }

  if (
    trigger.subject &&
    trigger.subject === candidate.subject &&
    trigger.kind === candidate.kind
  ) {
    return {
      entryId: candidate.id,
      classification: "modified",
      reason: "Same subject — may need an updated claim",
    };
  }

  if (
    trigger.persons?.length &&
    candidate.persons?.some((p) => trigger.persons!.includes(p))
  ) {
    return {
      entryId: candidate.id,
      classification: "modified",
      reason: "Shares a person with the new entry",
    };
  }

  return {
    entryId: candidate.id,
    classification: "unaffected",
    reason: "No direct subject/person conflict detected",
  };
}

export function buildRippleScreenFromCandidates(
  trigger: LedgerEntry,
  candidates: LedgerEntry[],
  now: Date | string = new Date(),
): RippleScreen {
  const items = candidates.map((c) =>
    classifyRippleDeterministic(trigger, c, now),
  );
  const affected = items.filter((i) => i.classification !== "unaffected");
  return {
    triggerEntryId: trigger.id,
    summary:
      affected.length === 0
        ? "No related ledger items need changes."
        : `${affected.length} related item(s) may need an update.`,
    items,
  };
}

export async function buildRippleScreen(
  trigger: LedgerEntry,
  opts?: {
    complete?: <T extends z.ZodTypeAny>(args: {
      model: string;
      system?: string;
      input: unknown;
      schema: T;
      schemaName?: string;
    }) => Promise<{ data: z.infer<T> }>;
    model?: string;
    now?: Date | string;
    candidates?: LedgerEntry[];
  },
): Promise<RippleScreen> {
  const candidates = opts?.candidates ?? (await findRippleCandidates(trigger));

  if (opts?.complete && candidates.length > 0) {
    const BatchSchema = z.object({ items: z.array(RippleItemSchema) });
    const batched = await opts.complete({
      model: opts.model ?? "openai/gpt-4o-mini",
      system:
        "Classify how each candidate ledger entry is affected by the trigger. Cite only provided ids.",
      input: {
        trigger,
        candidates: candidates.map((c) => ({
          id: c.id,
          kind: c.kind,
          claim: c.claim,
          subject: c.subject,
        })),
      },
      schema: BatchSchema,
      schemaName: "RippleBatch",
    });
    const items = batched.data.items.filter((item) =>
      candidates.some((c) => c.id === item.entryId),
    );
    const affected = items.filter((i) => i.classification !== "unaffected");
    return {
      triggerEntryId: trigger.id,
      summary:
        affected.length === 0
          ? "No related ledger items need changes."
          : `${affected.length} related item(s) may need an update.`,
      items,
    };
  }

  return buildRippleScreenFromCandidates(trigger, candidates, opts?.now);
}

/**
 * Apply user ripple choices: update claim, keep, or defer.
 * `update` without newClaim marks supersededBy → trigger.
 */
export async function confirmRipple(
  triggerEntryId: string,
  choices: RippleChoice[],
): Promise<{ applied: number }> {
  const { db, client } = createDb();
  let applied = 0;
  try {
    for (const choice of choices) {
      if (choice.action === "later" || choice.action === "keep") continue;
      if (choice.action === "update") {
        if (choice.newClaim) {
          await db
            .update(ledgerEntries)
            .set({
              claim: choice.newClaim,
              updatedAt: new Date().toISOString(),
            })
            .where(eq(ledgerEntries.id, choice.entryId));
        } else {
          await db
            .update(ledgerEntries)
            .set({
              supersededBy: triggerEntryId,
              updatedAt: new Date().toISOString(),
            })
            .where(eq(ledgerEntries.id, choice.entryId));
        }
        applied += 1;
      }
    }
    return { applied };
  } finally {
    await client.end({ timeout: 5 });
  }
}
