/**
 * Local stub CLI — full MCP server lands when auth mode is chosen (USER).
 * Usage: pnpm --filter @sabha/gateway dev
 */
import { loadCatalogues } from "./catalogue.js";

const cats = loadCatalogues();
console.log(
  `@sabha/gateway scaffold — ${cats.length} catalogue(s), ${cats.reduce((n, c) => n + c.tools.length, 0)} tools`,
);
console.log(
  "Gateway auth is a per-person API key (Authorization: Bearer sabha_…). Create it in Settings. OAuth is not part of early access.",
);
