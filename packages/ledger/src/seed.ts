import { createDb } from "./db.js";
import {
  actions,
  agents,
  authorityGrants,
  commitments,
  councilSessions,
  exceptions,
  findings,
  holds,
  ledgerEntries,
  llmCalls,
  receipts,
  rules,
} from "./schema/index.js";

const REQUIRED_TABLES = [
  "ledger_entries",
  "exceptions",
  "rules",
  "commitments",
  "agents",
  "authority_grants",
  "actions",
  "findings",
  "holds",
  "council_sessions",
  "receipts",
  "llm_calls",
] as const;

async function main() {
  const { db, client } = createDb();

  const tableRows = await client<{ tablename: string }[]>`
    SELECT tablename
    FROM pg_tables
    WHERE schemaname = 'public'
  `;
  const present = new Set(tableRows.map((row) => row.tablename));
  const missing = REQUIRED_TABLES.filter((name) => !present.has(name));

  if (missing.length > 0) {
    throw new Error(
      `Schema incomplete. Missing tables: ${missing.join(", ")}. Run \`pnpm db:migrate\` first.`,
    );
  }

  // Verify each table is queryable on an empty database.
  await Promise.all([
    db.select({ id: ledgerEntries.id }).from(ledgerEntries).limit(0),
    db.select({ id: exceptions.id }).from(exceptions).limit(0),
    db.select({ id: rules.id }).from(rules).limit(0),
    db.select({ id: commitments.id }).from(commitments).limit(0),
    db.select({ id: agents.id }).from(agents).limit(0),
    db.select({ id: authorityGrants.id }).from(authorityGrants).limit(0),
    db.select({ id: actions.id }).from(actions).limit(0),
    db.select({ id: findings.id }).from(findings).limit(0),
    db.select({ id: holds.id }).from(holds).limit(0),
    db.select({ id: councilSessions.id }).from(councilSessions).limit(0),
    db.select({ id: receipts.id }).from(receipts).limit(0),
    db.select({ id: llmCalls.id }).from(llmCalls).limit(0),
  ]);

  console.log(
    `Seed OK — empty schema ready (${REQUIRED_TABLES.length} tables present).`,
  );

  await client.end();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
