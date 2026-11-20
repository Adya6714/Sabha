import { randomUUID } from "node:crypto";
import {
  EntryKindSchema,
  HardnessSchema,
  LedgerEntrySchema,
  type HeatLevel,
  type LedgerEntry,
} from "@sabha/core";
import { z } from "zod";
import { createDb } from "./db.js";
import { ledgerEntries } from "./schema/index.js";

const ExtractedEntrySchema = z.object({
  kind: EntryKindSchema,
  claim: z.string().min(1),
  subject: z.string().min(1).optional(),
  persons: z.array(z.string().min(1)).optional(),
  hardness: HardnessSchema.optional(),
  confidence: z.number().min(0).max(1),
  needsClarification: z.boolean().default(false),
  clarifyingQuestion: z.string().optional(),
});

export type AddEntryInput = {
  /** Free-text statement from the user (extract path). */
  text?: string;
  /** Already-structured entry fields (skip extract). */
  entry?: Partial<LedgerEntry> &
    Pick<LedgerEntry, "kind" | "claim"> & {
      source?: LedgerEntry["source"];
    };
  origin?: LedgerEntry["source"]["origin"];
  heat?: HeatLevel;
  ref?: string;
  /** Injected LLM complete() for tests / apps. */
  complete?: <T extends z.ZodTypeAny>(args: {
    model: string;
    system?: string;
    input: unknown;
    schema: T;
    schemaName?: string;
  }) => Promise<{ data: z.infer<T> }>;
  model?: string;
  /** When false, skip DB write (unit tests). Default true. */
  persist?: boolean;
};

export type AddEntryResult =
  | {
      status: "saved";
      entry: LedgerEntry;
      ripple: { pending: true; note: string };
    }
  | {
      status: "needs_clarification";
      question: string;
      candidate: z.infer<typeof ExtractedEntrySchema>;
    };

/**
 * Write path: capture → extract (optional) → provenance → confirm rules.
 * Ripple execution lands in Phase 1.3; here we only mark it pending.
 */
export async function addEntry(input: AddEntryInput): Promise<AddEntryResult> {
  const origin = input.origin ?? "user_stated";
  const heat = input.heat ?? 1;
  const at = new Date().toISOString();

  let draft: {
    kind: LedgerEntry["kind"];
    claim: string;
    subject?: string;
    persons?: string[];
    hardness?: LedgerEntry["hardness"];
    confidence: number;
  };

  if (input.entry) {
    draft = {
      kind: input.entry.kind,
      claim: input.entry.claim,
      subject: input.entry.subject,
      persons: input.entry.persons,
      hardness: input.entry.hardness,
      confidence: input.entry.confidence ?? (origin === "inferred" ? 0.5 : 1),
    };
  } else if (input.text) {
    if (!input.complete) {
      throw new Error(
        "addEntry(text) requires a `complete` function from @sabha/llm (or a test mock).",
      );
    }
    const extracted = await input.complete({
      model: input.model ?? "openai/gpt-4o-mini",
      system:
        "Extract a single Sabha ledger entry. If unsure, set needsClarification true and ask one short question. Never invent persons.",
      input: { text: input.text },
      schema: ExtractedEntrySchema,
      schemaName: "ExtractedLedgerEntry",
    });
    if (
      extracted.data.needsClarification ||
      extracted.data.confidence < 0.5
    ) {
      return {
        status: "needs_clarification",
        question:
          extracted.data.clarifyingQuestion ??
          "Can you restate that as a clear intention, fact, or exception?",
        candidate: extracted.data,
      };
    }
    draft = extracted.data;
  } else {
    throw new Error("addEntry requires `text` or `entry`");
  }

  // Hard rule: inferred confidence < 0.7 never alone justifies a write action.
  // (Callers enforcing write-actions must check this; we stamp it on the entry.)
  const confidence =
    origin === "inferred" ? Math.min(draft.confidence, 0.69) : draft.confidence;

  const entry = LedgerEntrySchema.parse({
    id: input.entry?.id ?? `le_${randomUUID()}`,
    kind: draft.kind,
    claim: draft.claim,
    subject: draft.subject,
    persons: draft.persons,
    source: input.entry?.source ?? {
      origin,
      at,
      heat,
      ref: input.ref,
    },
    confidence,
    hardness: draft.hardness,
    purposes: input.entry?.purposes ?? ["gating"],
    decay: input.entry?.decay,
    lastConfirmedAt: origin === "user_stated" ? at : undefined,
  });

  if (input.persist !== false) {
    const { db, client } = createDb();
    try {
      await db.insert(ledgerEntries).values({
        id: entry.id,
        kind: entry.kind,
        claim: entry.claim,
        subject: entry.subject,
        persons: entry.persons ?? [],
        source: entry.source,
        confidence: entry.confidence,
        lastConfirmedAt: entry.lastConfirmedAt,
        reviewAt: entry.reviewAt,
        hardness: entry.hardness,
        supersededBy: entry.supersededBy,
        purposes: entry.purposes,
      });
    } finally {
      await client.end({ timeout: 5 });
    }
  }

  return {
    status: "saved",
    entry,
    ripple: {
      pending: true,
      note: "Ripple classification lands in Phase 1.3",
    },
  };
}

export function inferredCanJustifyWrite(entry: LedgerEntry): boolean {
  if (entry.source.origin !== "inferred") return true;
  return entry.confidence >= 0.7;
}
