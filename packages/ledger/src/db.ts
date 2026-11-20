import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema/index.js";

export type SabhaDatabase = ReturnType<typeof createDb>;

export function getDatabaseUrl(): string {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "DATABASE_URL is not set. Copy .env.example to .env and start Postgres with `pnpm db:up`.",
    );
  }
  return url;
}

export function createDb(connectionString = getDatabaseUrl()) {
  const client = postgres(connectionString, { max: 10 });
  return {
    db: drizzle(client, { schema }),
    client,
  };
}
