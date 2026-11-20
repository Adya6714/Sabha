# `@sabha/core`

Single source of shared **Zod schemas** and **TypeScript types** for Sabha.

## Rule

Import types and schemas from `@sabha/core` only.  
Do **not** redefine `LedgerEntry`, `ProposedAction`, `Finding`, `Lane`, or related shapes in other packages.

```ts
import { LedgerEntrySchema, type ProposedAction } from "@sabha/core";
```

## What’s included

| Area | Status |
| --- | --- |
| Ledger entry + kinds | Full (Phase 0) |
| Proposed action + verbs | Full (Phase 0) |
| Finding + lane | Full (Phase 0) |
| Rule / commitment / authority grant | Stub (expand Phase 5) |
| Hold | Stub (expand Phase 4) |
| Receipt | Stub (expand Phase 7) |
