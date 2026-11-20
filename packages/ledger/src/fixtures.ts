import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  FindingSchema,
  LaneSchema,
  LedgerEntrySchema,
  ProposedActionSchema,
  type Finding,
  type Lane,
  type LedgerEntry,
  type ProposedAction,
} from "@sabha/core";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { createDb } from "./db.js";
import { agents, ledgerEntries } from "./schema/index.js";

export const DemoFixtureSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  time: z.string().min(1),
  tags: z.array(z.string()),
  ledger: z.array(LedgerEntrySchema),
  action: ProposedActionSchema,
  expected: z.object({
    lane: LaneSchema,
    findings: z.array(FindingSchema),
  }),
});

export type DemoFixture = z.infer<typeof DemoFixtureSchema>;

const FIXTURE_IDS = [
  "groceries",
  "wake",
  "flight",
  "laptop",
  "earbuds",
  "riya",
] as const;

export type DemoFixtureId = (typeof FIXTURE_IDS)[number];

export function fixturesDir(): string {
  return path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    "../../../fixtures/demo",
  );
}

export function loadDemoFixture(id: DemoFixtureId | string): DemoFixture {
  const file = path.join(fixturesDir(), `${id}.json`);
  const raw = JSON.parse(readFileSync(file, "utf8")) as unknown;
  return DemoFixtureSchema.parse(raw);
}

export function loadAllDemoFixtures(): DemoFixture[] {
  const dir = fixturesDir();
  const files = readdirSync(dir).filter((f) => f.endsWith(".json"));
  const fixtures = files.map((file) => {
    const raw = JSON.parse(
      readFileSync(path.join(dir, file), "utf8"),
    ) as unknown;
    return DemoFixtureSchema.parse(raw);
  });
  const missing = FIXTURE_IDS.filter(
    (id) => !fixtures.some((fixture) => fixture.id === id),
  );
  if (missing.length) {
    throw new Error(`Missing demo fixtures: ${missing.join(", ")}`);
  }
  return FIXTURE_IDS.map(
    (id) => fixtures.find((fixture) => fixture.id === id)!,
  );
}

/** Normalize DB timestamps to Zod-friendly ISO-8601 with offset. */
function toIso(value?: string | null): string | undefined {
  if (!value) return undefined;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    const withT = value.includes("T") ? value : value.replace(" ", "T");
    return withT;
  }
  return date.toISOString();
}

/** Insert fixture ledger rows into Postgres and read them back through Zod. */
export async function loadFixtureIntoDb(fixture: DemoFixture): Promise<{
  written: LedgerEntry[];
  action: ProposedAction;
  expectedLane: Lane;
  expectedFindings: Finding[];
}> {
  const { db, client } = createDb();
  try {
    await db
      .insert(agents)
      .values({
        id: fixture.action.agentId,
        name: fixture.action.agentId,
        metadata: {},
      })
      .onConflictDoNothing();

    for (const entry of fixture.ledger) {
      await db
        .insert(ledgerEntries)
        .values({
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
        })
        .onConflictDoNothing();
    }

    const written: LedgerEntry[] = [];
    for (const entry of fixture.ledger) {
      const [row] = await db
        .select()
        .from(ledgerEntries)
        .where(eq(ledgerEntries.id, entry.id));
      if (!row) {
        throw new Error(`Ledger row missing after insert: ${entry.id}`);
      }
      written.push(
        LedgerEntrySchema.parse({
          id: row.id,
          kind: row.kind,
          claim: row.claim,
          subject: row.subject ?? undefined,
          persons: row.persons ?? undefined,
          source: row.source,
          confidence: row.confidence,
          lastConfirmedAt: toIso(row.lastConfirmedAt),
          reviewAt: toIso(row.reviewAt),
          hardness: row.hardness ?? undefined,
          supersededBy: row.supersededBy ?? undefined,
          purposes: row.purposes,
        }),
      );
    }

    return {
      written,
      action: ProposedActionSchema.parse(fixture.action),
      expectedLane: fixture.expected.lane,
      expectedFindings: fixture.expected.findings,
    };
  } finally {
    await client.end({ timeout: 5 });
  }
}
