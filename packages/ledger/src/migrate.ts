import path from "node:path";
import { fileURLToPath } from "node:url";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";
import { getDatabaseUrl } from "./db.js";

async function main() {
  const url = getDatabaseUrl();
  const client = postgres(url, { max: 1 });
  const db = drizzle(client);

  await client`CREATE EXTENSION IF NOT EXISTS vector`;

  const migrationsFolder = path.join(
    path.dirname(fileURLToPath(import.meta.url)),
    "../drizzle",
  );

  await migrate(db, { migrationsFolder });

  console.log("Migrations applied.");
  await client.end();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
