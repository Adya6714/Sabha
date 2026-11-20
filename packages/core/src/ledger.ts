import { z } from "zod";

export const EntryKindSchema = z.enum([
  "fact",
  "habit",
  "intention",
  "emotional_event",
  "exception",
  "context",
]);

export const EntryOriginSchema = z.enum([
  "user_stated",
  "observed",
  "inferred",
  "imported",
]);

export const HeatLevelSchema = z.union([
  z.literal(1),
  z.literal(2),
  z.literal(3),
]);

export const HardnessSchema = z.enum(["hard", "flexible"]);

export const EntrySourceSchema = z.object({
  origin: EntryOriginSchema,
  at: z.string().datetime({ offset: true }),
  heat: HeatLevelSchema.optional(),
  ref: z.string().min(1).optional(),
});

export const LedgerEntrySchema = z.object({
  id: z.string().min(1),
  kind: EntryKindSchema,
  claim: z.string().min(1),
  subject: z.string().min(1).optional(),
  persons: z.array(z.string().min(1)).optional(),
  source: EntrySourceSchema,
  confidence: z.number().min(0).max(1),
  lastConfirmedAt: z.string().datetime({ offset: true }).optional(),
  reviewAt: z.string().datetime({ offset: true }).optional(),
  hardness: HardnessSchema.optional(),
  supersededBy: z.string().min(1).optional(),
  purposes: z.array(z.string().min(1)),
  /** Optional per-entry decay overrides (Phase 1.1). */
  decay: z
    .object({
      emotionalHalfLifeDays: z.number().positive().optional(),
    })
    .optional(),
});

export type EntryKind = z.infer<typeof EntryKindSchema>;
export type EntryOrigin = z.infer<typeof EntryOriginSchema>;
export type HeatLevel = z.infer<typeof HeatLevelSchema>;
export type Hardness = z.infer<typeof HardnessSchema>;
export type EntrySource = z.infer<typeof EntrySourceSchema>;
export type LedgerEntry = z.infer<typeof LedgerEntrySchema>;
