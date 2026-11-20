import { createHash, randomBytes, timingSafeEqual } from "node:crypto";

/** Early access: agents authenticate with a per-person API key, not OAuth. */
export const GATEWAY_AUTH_MODE = "api_key" as const;
export const GATEWAY_KEY_PREFIX = "sabha_";

export function generateGatewayKey(): string {
  return `${GATEWAY_KEY_PREFIX}${randomBytes(32).toString("base64url")}`;
}

export function hashGatewayKey(key: string): string {
  return createHash("sha256").update(key).digest("hex");
}

export function gatewayKeyHint(key: string): string {
  return `sabha_••••${key.slice(-4)}`;
}

export function readBearer(header: string | null | undefined): string | null {
  if (!header) return null;
  const match = /^Bearer\s+(\S+)$/i.exec(header.trim());
  return match?.[1] ?? null;
}

export function gatewayKeysMatch(presented: string, expectedHash: string): boolean {
  const actual = Buffer.from(hashGatewayKey(presented), "hex");
  const expected = Buffer.from(expectedHash, "hex");
  if (actual.length !== expected.length || actual.length === 0) return false;
  return timingSafeEqual(actual, expected);
}
