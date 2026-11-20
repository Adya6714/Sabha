import { describe, expect, it } from "vitest";
import { loadCatalogues, lookupTool } from "./catalogue.js";

describe("tool catalogue", () => {
  it("loads YAML catalogues", () => {
    const cats = loadCatalogues();
    expect(cats.length).toBeGreaterThanOrEqual(3);
  });

  it("defaults unknown tools to write + hard", () => {
    const t = lookupTool("unknown.scary_tool");
    expect(t.verb).toBe("write");
    expect(t.reversibility).toBe("hard");
  });

  it("resolves gmail.send", () => {
    const t = lookupTool("gmail.send");
    expect(t.verb).toBe("send");
    expect(t.reversibility).toBe("hard");
  });
});
