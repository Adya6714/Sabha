import { describe, expect, it, beforeEach } from "vitest";
import {
  clearAuthorityForTests,
  getAuthority,
  setAuthority,
} from "./index.js";

describe("authority registry scaffold", () => {
  beforeEach(() => clearAuthorityForTests());

  it("defaults to observe", () => {
    expect(getAuthority("agent_x", "gmail")).toBe("observe");
  });

  it("allows UI mutation", () => {
    setAuthority("agent_x", "gmail", "execute", "user_ui");
    expect(getAuthority("agent_x", "gmail")).toBe("execute");
  });

  it("rejects agent self-elevation", () => {
    expect(() =>
      setAuthority("agent_x", "gmail", "escalate", "agent"),
    ).toThrow(/No agent write path/);
  });
});
