import { randomUUID } from "node:crypto";
import { cookies } from "next/headers";
import {
  gatewayKeyHint,
  gatewayKeysMatch,
  generateGatewayKey,
  hashGatewayKey,
  readBearer,
} from "@sabha/gateway/auth";
import {
  ensureProfileRow,
  findProfileByGatewayKeyHash,
  updateProfileSecrets,
  type ProfileSecretPatch,
  type StoredProfile,
} from "@sabha/ledger";
import {
  EARLY_ACCESS_CAP_INR,
  isSpendBlocked,
  readCombinedSpendInr,
} from "@sabha/llm";
import {
  assertProviderKey,
  decryptSecret,
  encryptSecret,
  keyHint,
} from "./secrets";

export const PROFILE_COOKIE = "sabha_profile";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export type AccountStatus = {
  openai: { set: boolean; hint: string | null };
  anthropic: { set: boolean; hint: string | null };
  gateway: { set: boolean; hint: string | null };
  spentInr: number;
  capInr: number;
  blocked: boolean;
  ready: boolean;
};

export function accountErrorResponse(error: unknown): {
  status: number;
  body: { error: string; code: string };
} {
  const message = error instanceof Error ? error.message : "";
  const pgCode =
    typeof error === "object" && error && "code" in error
      ? String((error as { code?: unknown }).code ?? "")
      : "";

  if (
    message.includes("DATABASE_URL") ||
    message.includes("ceiling survives")
  ) {
    return {
      status: 503,
      body: {
        code: "database_required",
        error:
          "Set DATABASE_URL before saving keys. Locally that is Docker Postgres (`pnpm db:up && pnpm db:migrate`). For hosted early access, use Neon. The ₹100 ceiling has to live in the database so a restart cannot reset it.",
      },
    };
  }
  if (message.includes("SABHA_SECRETS_KEY")) {
    return {
      status: 503,
      body: { code: "secrets_key_required", error: message },
    };
  }
  if (
    pgCode === "42P01" ||
    message.includes("db:migrate") ||
    message.includes("does not exist")
  ) {
    return {
      status: 503,
      body: {
        code: "migration_required",
        error:
          "Run pnpm db:migrate so key storage and the spend ceiling exist.",
      },
    };
  }
  if (message.includes("key should be")) {
    return { status: 400, body: { code: "invalid_key", error: message } };
  }
  return {
    status: 500,
    body: { code: "account_error", error: "Could not update keys." },
  };
}

async function profileIdFromCookie(): Promise<string> {
  const jar = await cookies();
  const existing = jar.get(PROFILE_COOKIE)?.value;
  if (existing && UUID_RE.test(existing)) return existing;
  const id = randomUUID();
  jar.set(PROFILE_COOKIE, id, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 400,
  });
  return id;
}

function savedSecrets(profile: StoredProfile): string[] {
  const secrets: string[] = [];
  if (profile.openaiKeyCiphertext) {
    secrets.push(decryptSecret(profile.openaiKeyCiphertext));
  }
  if (profile.anthropicKeyCiphertext) {
    secrets.push(decryptSecret(profile.anthropicKeyCiphertext));
  }
  return secrets;
}

export async function accountStatus(
  profile: StoredProfile,
): Promise<AccountStatus> {
  const secrets = savedSecrets(profile);
  const spentInr =
    secrets.length === 0 ? 0 : await readCombinedSpendInr(secrets);
  const blocked = secrets.length > 0 && isSpendBlocked(spentInr);
  return {
    openai: {
      set: Boolean(profile.openaiKeyCiphertext),
      hint: profile.openaiHint,
    },
    anthropic: {
      set: Boolean(profile.anthropicKeyCiphertext),
      hint: profile.anthropicHint,
    },
    gateway: {
      set: Boolean(profile.gatewayKeyHash),
      hint: profile.gatewayKeyHint,
    },
    spentInr,
    capInr: EARLY_ACCESS_CAP_INR,
    blocked,
    ready: Boolean(
      profile.openaiKeyCiphertext &&
        profile.anthropicKeyCiphertext &&
        !blocked,
    ),
  };
}

export async function loadAccount(): Promise<AccountStatus> {
  const profile = await ensureProfileRow(await profileIdFromCookie());
  return accountStatus(profile);
}

export async function saveAccountKeys(body: {
  openaiKey?: string | null;
  anthropicKey?: string | null;
}): Promise<AccountStatus> {
  const id = await profileIdFromCookie();
  await ensureProfileRow(id);
  const patch: ProfileSecretPatch = {};

  if (body.openaiKey !== undefined) {
    if (body.openaiKey === null || body.openaiKey.trim() === "") {
      patch.openaiKeyCiphertext = null;
      patch.openaiHint = null;
    } else {
      const key = assertProviderKey(body.openaiKey, "OpenAI");
      patch.openaiKeyCiphertext = encryptSecret(key);
      patch.openaiHint = keyHint(key);
    }
  }

  if (body.anthropicKey !== undefined) {
    if (body.anthropicKey === null || body.anthropicKey.trim() === "") {
      patch.anthropicKeyCiphertext = null;
      patch.anthropicHint = null;
    } else {
      const key = assertProviderKey(body.anthropicKey, "Anthropic");
      patch.anthropicKeyCiphertext = encryptSecret(key);
      patch.anthropicHint = keyHint(key);
    }
  }

  if (Object.keys(patch).length === 0) {
    throw new Error("OpenAI key should be the raw provider secret, 20–400 characters, with no spaces.");
  }

  const profile = await updateProfileSecrets(id, patch);
  return accountStatus(profile);
}

export async function issueAccountGatewayKey(): Promise<
  AccountStatus & { gatewayKey: string }
> {
  const id = await profileIdFromCookie();
  await ensureProfileRow(id);
  const gatewayKey = generateGatewayKey();
  const profile = await updateProfileSecrets(id, {
    gatewayKeyHash: hashGatewayKey(gatewayKey),
    gatewayKeyHint: gatewayKeyHint(gatewayKey),
  });
  return { gatewayKey, ...(await accountStatus(profile)) };
}

export async function authenticateGatewayRequest(
  authorization: string | null,
): Promise<{ ok: true } | { ok: false }> {
  const token = readBearer(authorization);
  if (!token?.startsWith("sabha_")) return { ok: false };
  const profile = await findProfileByGatewayKeyHash(hashGatewayKey(token));
  if (!profile?.gatewayKeyHash) return { ok: false };
  if (!gatewayKeysMatch(token, profile.gatewayKeyHash)) return { ok: false };
  return { ok: true };
}
