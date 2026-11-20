import { randomBytes } from "node:crypto";
import { describe, expect, it } from "vitest";
import { decryptSecret, encryptSecret, keyHint } from "./secrets.js";

describe("key encryption", () => {
  it("round-trips a provider key without storing it in plaintext", () => {
    const key = randomBytes(32);
    const secret = "sk-test-openai-key-value";
    const stored = encryptSecret(secret, key);
    expect(stored).not.toContain(secret);
    expect(decryptSecret(stored, key)).toBe(secret);
    expect(keyHint(secret)).toBe("••••alue");
  });

  it("rejects a different encryption key", () => {
    const stored = encryptSecret("sk-test-openai-key-value", randomBytes(32));
    expect(() => decryptSecret(stored, randomBytes(32))).toThrow();
  });
});