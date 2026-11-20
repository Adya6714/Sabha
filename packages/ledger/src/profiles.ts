import { eq } from "drizzle-orm";
import { createDb } from "./db.js";
import { profiles } from "./schema/profiles.js";

export type StoredProfile = {
  id: string;
  gatewayKeyHash: string | null;
  gatewayKeyHint: string | null;
  openaiKeyCiphertext: string | null;
  anthropicKeyCiphertext: string | null;
  openaiHint: string | null;
  anthropicHint: string | null;
};

type ProfileRow = typeof profiles.$inferSelect;

function mapProfile(row: ProfileRow): StoredProfile {
  return {
    id: row.id,
    gatewayKeyHash: row.gatewayKeyHash,
    gatewayKeyHint: row.gatewayKeyHint,
    openaiKeyCiphertext: row.openaiKeyCiphertext,
    anthropicKeyCiphertext: row.anthropicKeyCiphertext,
    openaiHint: row.openaiHint,
    anthropicHint: row.anthropicHint,
  };
}

export type ProfileSecretPatch = {
  gatewayKeyHash?: string | null;
  gatewayKeyHint?: string | null;
  openaiKeyCiphertext?: string | null;
  anthropicKeyCiphertext?: string | null;
  openaiHint?: string | null;
  anthropicHint?: string | null;
};

export async function ensureProfileRow(id: string): Promise<StoredProfile> {
  const { db, client } = createDb();
  try {
    const existing = await db
      .select()
      .from(profiles)
      .where(eq(profiles.id, id))
      .limit(1);
    if (existing[0]) return mapProfile(existing[0]);
    await db.insert(profiles).values({ id });
    return {
      id,
      gatewayKeyHash: null,
      gatewayKeyHint: null,
      openaiKeyCiphertext: null,
      anthropicKeyCiphertext: null,
      openaiHint: null,
      anthropicHint: null,
    };
  } finally {
    await client.end({ timeout: 5 });
  }
}

export async function updateProfileSecrets(
  id: string,
  patch: ProfileSecretPatch,
): Promise<StoredProfile> {
  const { db, client } = createDb();
  try {
    await db
      .update(profiles)
      .set({ ...patch, updatedAt: new Date().toISOString() })
      .where(eq(profiles.id, id));
    const rows = await db
      .select()
      .from(profiles)
      .where(eq(profiles.id, id))
      .limit(1);
    if (!rows[0]) {
      throw new Error(`Profile ${id} was not found.`);
    }
    return mapProfile(rows[0]);
  } finally {
    await client.end({ timeout: 5 });
  }
}

export async function findProfileByGatewayKeyHash(
  hash: string,
): Promise<StoredProfile | null> {
  const { db, client } = createDb();
  try {
    const rows = await db
      .select()
      .from(profiles)
      .where(eq(profiles.gatewayKeyHash, hash))
      .limit(1);
    return rows[0] ? mapProfile(rows[0]) : null;
  } finally {
    await client.end({ timeout: 5 });
  }
}
