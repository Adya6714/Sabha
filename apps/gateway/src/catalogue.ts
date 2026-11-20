import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import YAML from "yaml";
import type { ActionVerb, Reversibility } from "@sabha/core";

export type ToolCatalogueEntry = {
  name: string;
  verb: ActionVerb;
  reversibility: Reversibility;
  personsFrom: string | null;
  amountFrom: string | null;
};

export type ServerCatalogue = {
  server: string;
  tools: ToolCatalogueEntry[];
};

const catalogueDir = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "../catalogue",
);

export function loadCatalogues(dir = catalogueDir): ServerCatalogue[] {
  return readdirSync(dir)
    .filter((f) => f.endsWith(".yaml") || f.endsWith(".yml"))
    .map((f) => {
      const raw = YAML.parse(readFileSync(path.join(dir, f), "utf8")) as ServerCatalogue;
      return raw;
    });
}

/**
 * Unknown tools default to write + hard (fail closed).
 */
export function lookupTool(
  toolName: string,
  catalogues: ServerCatalogue[] = loadCatalogues(),
): ToolCatalogueEntry {
  for (const cat of catalogues) {
    const hit = cat.tools.find((t) => t.name === toolName);
    if (hit) return hit;
  }
  return {
    name: toolName,
    verb: "write",
    reversibility: "hard",
    personsFrom: null,
    amountFrom: null,
  };
}
