import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

describe("monorepo workspace", () => {
  it("declares apps and packages workspaces", () => {
    const workspace = readFileSync(
      resolve(process.cwd(), "pnpm-workspace.yaml"),
      "utf8",
    );
    expect(workspace).toContain("apps/*");
    expect(workspace).toContain("packages/*");
  });

  it("exposes the web app package", () => {
    const pkg = JSON.parse(
      readFileSync(resolve(process.cwd(), "apps/web/package.json"), "utf8"),
    ) as { name: string };
    expect(pkg.name).toBe("@sabha/web");
  });
});
