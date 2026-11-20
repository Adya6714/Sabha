import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
} from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const VERSION = "v1";

export function decodeSecretsKey(raw: string): Buffer {
  const key = Buffer.from(raw.trim(), "base64");
  if (key.length !== 32) {
    throw new Error(
      "SABHA_SECRETS_KEY must be 32 bytes encoded as base64.",
    );
  }
  return key;
}

export function secretsFilePath(): string {
  return (
    process.env.SABHA_SECRETS_FILE ??
    path.join(process.cwd(), "data", "sabha-secrets.key")
  );
}

/**
 * Production must set SABHA_SECRETS_KEY. Local dev creates a gitignored key file.
 */
export function getSecretsKey(): Buffer {
  const fromEnv = process.env.SABHA_SECRETS_KEY?.trim();
  if (fromEnv) return decodeSecretsKey(fromEnv);
  if (process.env.VERCEL === "1" || process.env.NODE_ENV === "production") {
    throw new Error(
      "SABHA_SECRETS_KEY is required in production so personal API keys can be encrypted at rest.",
    );
  }
  const file = secretsFilePath();
  if (existsSync(file)) return decodeSecretsKey(readFileSync(file, "utf8"));
  const created = randomBytes(32);
  mkdirSync(path.dirname(file), { recursive: true });
  writeFileSync(file, created.toString("base64"), { mode: 0o600 });
  return created;
}

export function encryptSecret(plain: string, key: Buffer = getSecretsKey()): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([
    cipher.update(plain, "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  return [
    VERSION,
    iv.toString("base64url"),
    tag.toString("base64url"),
    encrypted.toString("base64url"),
  ].join(".");
}

export function decryptSecret(payload: string, key: Buffer = getSecretsKey()): string {
  const [version, ivRaw, tagRaw, bodyRaw] = payload.split(".");
  if (version !== VERSION || !ivRaw || !tagRaw || !bodyRaw) {
    throw new Error("Stored key could not be read.");
  }
  const decipher = createDecipheriv(
    "aes-256-gcm",
    key,
    Buffer.from(ivRaw, "base64url"),
  );
  decipher.setAuthTag(Buffer.from(tagRaw, "base64url"));
  const plain = Buffer.concat([
    decipher.update(Buffer.from(bodyRaw, "base64url")),
    decipher.final(),
  ]);
  return plain.toString("utf8");
}

export function keyHint(secret: string): string {
  return `••••${secret.slice(-4)}`;
}

const KEY_PATTERN = /^[A-Za-z0-9_\-./+=]{20,400}$/;

export function assertProviderKey(value: string, label: string): string {
  const trimmed = value.trim();
  if (!KEY_PATTERN.test(trimmed)) {
    throw new Error(
      `${label} key should be the raw provider secret, 20–400 characters, with no spaces.`,
    );
  }
  return trimmed;
}
