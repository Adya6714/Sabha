import { describe, expect, it } from "vitest";
import {
  GATEWAY_AUTH_MODE,
  GATEWAY_KEY_PREFIX,
  gatewayKeyHint,
  gatewayKeysMatch,
  generateGatewayKey,
  hashGatewayKey,
  readBearer,
} from "./auth.js";

describe("gateway API key auth", () => {
  it("is API key auth for early access, not OAuth", () => {
    expect(GATEWAY_AUTH_MODE).toBe("api_key");
  });

  it("issues an unguessable sabha_ key and matches only its hash", () => {
    const key = generateGatewayKey();
    expect(key.startsWith(GATEWAY_KEY_PREFIX)).toBe(true);
    expect(key.length).toBeGreaterThan(40);
    const hash = hashGatewayKey(key);
    expect(hash).not.toContain(key);
    expect(gatewayKeysMatch(key, hash)).toBe(true);
    expect(gatewayKeysMatch(`${key}x`, hash)).toBe(false);
    expect(gatewayKeyHint(key)).toBe(`sabha_••••${key.slice(-4)}`);
  });

  it("reads a bearer token", () => {
    expect(readBearer("Bearer sabha_abc")).toBe("sabha_abc");
    expect(readBearer("Basic sabha_abc")).toBeNull();
    expect(readBearer(null)).toBeNull();
  });
});
