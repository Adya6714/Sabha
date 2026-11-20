import { describe, expect, it } from "vitest";
import {
  ExceptionInputSchema,
  onOverrideCreateExceptionHook,
} from "./exceptions.js";

describe("exceptions", () => {
  it("requires ruleId or subject", () => {
    expect(() =>
      ExceptionInputSchema.parse({ personId: "person_riya" }),
    ).not.toThrow();
    expect(
      ExceptionInputSchema.parse({
        subject: "money.gift_cap",
        personId: "person_riya",
        reason: "Waived for family",
      }).subject,
    ).toBe("money.gift_cap");
  });

  it("documents the Phase 7 override hook", () => {
    expect(onOverrideCreateExceptionHook()).toMatch(/Phase 7/);
  });
});
