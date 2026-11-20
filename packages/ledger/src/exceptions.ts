import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { createDb } from "./db.js";
import { exceptions } from "./schema/index.js";

export const ExceptionInputSchema = z.object({
  ruleId: z.string().min(1).optional(),
  subject: z.string().min(1).optional(),
  personId: z.string().min(1).optional(),
  context: z.string().min(1).optional(),
  reason: z.string().min(1).optional(),
});

export type ExceptionInput = z.infer<typeof ExceptionInputSchema>;

export type ExceptionRecord = {
  id: string;
  ruleId?: string;
  subject?: string;
  personId?: string;
  context?: string;
  reason?: string;
  createdAt: string;
};

/**
 * Exceptions store (Phase 1.4).
 * Phase 7 will call `createException` automatically on overrides.
 */
export async function createException(
  input: ExceptionInput,
): Promise<ExceptionRecord> {
  const parsed = ExceptionInputSchema.parse(input);
  if (!parsed.ruleId && !parsed.subject) {
    throw new Error("Exception requires ruleId or subject");
  }
  const id = `ex_${randomUUID()}`;
  const { db, client } = createDb();
  try {
    await db.insert(exceptions).values({
      id,
      ruleId: parsed.ruleId,
      subject: parsed.subject,
      personId: parsed.personId,
      context: parsed.context,
      reason: parsed.reason,
    });
    const [row] = await db
      .select()
      .from(exceptions)
      .where(eq(exceptions.id, id));
    if (!row) throw new Error("Failed to read back exception");
    return {
      id: row.id,
      ruleId: row.ruleId ?? undefined,
      subject: row.subject ?? undefined,
      personId: row.personId ?? undefined,
      context: row.context ?? undefined,
      reason: row.reason ?? undefined,
      createdAt: new Date(row.createdAt).toISOString(),
    };
  } finally {
    await client.end({ timeout: 5 });
  }
}

export async function listExceptions(): Promise<ExceptionRecord[]> {
  const { db, client } = createDb();
  try {
    const rows = await db.select().from(exceptions);
    return rows.map((row) => ({
      id: row.id,
      ruleId: row.ruleId ?? undefined,
      subject: row.subject ?? undefined,
      personId: row.personId ?? undefined,
      context: row.context ?? undefined,
      reason: row.reason ?? undefined,
      createdAt: new Date(row.createdAt).toISOString(),
    }));
  } finally {
    await client.end({ timeout: 5 });
  }
}

export async function deleteException(id: string): Promise<void> {
  const { db, client } = createDb();
  try {
    await db.delete(exceptions).where(eq(exceptions.id, id));
  } finally {
    await client.end({ timeout: 5 });
  }
}

/** Documented hook for Phase 7 learning loop. */
export function onOverrideCreateExceptionHook(): string {
  return "Phase 7 should call createException({ ruleId, personId, context, reason }) on every user override.";
}
