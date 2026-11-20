# Sabha — Implementation Checklist

**Source plan:** `Sabha Implementation Plan.md`
**Audience:** engineer / architect executing the build
**Horizon:** ~20 weeks · 9 phases · 4 milestones
**Current repo state:** pnpm monorepo with `apps/web`, `apps/gateway` (scaffold), `@sabha/core`, `@sabha/ledger`, `@sabha/llm`, `@sabha/detectors`, `@sabha/gate`, plus scaffolds for `@sabha/rules`, `@sabha/council`, `@sabha/receipts`. See `USER_ACTIONS.md` for items only you can clear.

This document is the working build order. Check items off as they ship. Do not start a phase’s implementation work until that phase’s **Prerequisites** are green.

---

## How to use this doc

1. Work **phase by phase**. Within a phase, follow the numbered build order.
2. Every package ships with: types → implementation → unit tests → fixture regression → thin UI hook (if any).
3. Prefer **interfaces first, LLM later**: deterministic detectors and Gate before model calls.
4. Exit a phase only when **Exit criteria** and **Definition of Done** are both met.
5. Open decisions at the bottom stay unresolved until they block a milestone — then decide in writing and update this doc.

---

## Target architecture (one sentence)

An agent’s tool call hits the **Gateway** → **Detectors** read **Ledger** + **Rules** → **Gate** chooses a lane → optional **Council** → execute or hold → **Receipt** + learning loop.

```
Agent / MCP client
        │
        ▼
┌───────────────────┐
│  apps/gateway     │  MCP server + MCP proxy
└─────────┬─────────┘
          │ ProposedAction
          ▼
┌───────────────────┐     ┌──────────────────┐
│ packages/detectors│────▶│ packages/gate    │
└─────────▲─────────┘     └────────┬─────────┘
          │                        │ lane
┌─────────┴─────────┐              ▼
│ packages/ledger   │     auto │ notify │ delay │ ask │ council │ only_you │ block_scope
│ packages/rules    │              │
└───────────────────┘              ▼
                          packages/council (if needed)
                                   │
                                   ▼
                          packages/receipts + apps/web (approvals / ledger / insights)
```

**Non-negotiable principles (every PR):** delay never veto · cite or abstain · ask budget · user owns ledger · fail closed on irreversible · name unknowns (verified / suspected / unknown).

---

## Milestone map

| ID | When | Proof |
| --- | --- | --- |
| **M1** | End of Phase 3 | Six demo fixtures run on **computed** detectors + Gate (not scripted scores) |
| **M2** | End of Phase 4 | Off-the-shelf MCP agent cannot send/pay without Gate decision |
| **M3** | End of Phase 7 | Ledger → detectors → Gate → rules → Council → receipts on real tools |
| **M4** | End of Phase 8 | Job-search experiment results table (sim + piloted real protocol) |

---

## Phase 0 — Foundations (weeks 1–2)

**Goal:** Monorepo, shared schemas, Postgres, LLM wrapper, demo fixtures, CI.
**Prerequisites:** Clean working tree; decide Neon vs local Docker for Postgres.

### Build order

#### 0.1 Repo restructure
- [x] Add `pnpm-workspace.yaml` + root `package.json` + Turborepo (`turbo.json`)
- [x] Move current Next.js app → `apps/web` (preserve routes, `public/try` demo)
- [x] Add root `tsconfig.base.json`, ESLint, Prettier, Vitest
- [x] Verify `pnpm install && pnpm build` for `apps/web` alone
- [x] Update README paths / scripts for monorepo

#### 0.2 `packages/core` — single source of types
- [x] Create package with Zod schemas for:
  - [x] `EntryKind`, `LedgerEntry`
  - [x] `ProposedAction` (+ verb enum)
  - [x] `Finding`, `Lane`
  - [x] Stub shapes: `Rule`, `Commitment`, `AuthorityGrant`, `Hold`, `Receipt` (full later)
- [x] Export inferred TS types; ban duplicate type definitions in other packages
- [x] Unit tests: parse valid fixtures, reject invalid shapes

#### 0.3 Database
- [x] Docker Compose Postgres + `pgvector` (and/or Neon connection string)
- [x] Add Drizzle in a shared db module (under `packages/ledger` or `packages/db` — prefer `packages/ledger` owns migrations for now)
- [x] Migrations for tables:
  `ledger_entries`, `exceptions`, `rules`, `commitments`, `agents`, `authority_grants`, `actions`, `findings`, `holds`, `council_sessions`, `receipts`, `llm_calls`
- [x] Seed script that loads empty schema cleanly

#### 0.4 `packages/llm`
- [x] `complete({ model, system, input, schema }) → T` with Zod validation
- [x] Retry once on schema failure
- [x] Log prompt/output/latency/cost → `llm_calls`
- [x] Wire **two** providers (e.g. OpenAI + Anthropic or Gateway)
- [x] Integration smoke test: one validated call per provider

#### 0.5 Demo fixtures → regression suite
- [x] Port six cases to JSON: groceries, wake, flight, laptop, earbuds, Riya
- [x] Each fixture: ledger snapshot + `ProposedAction` + expected lane/findings (from current demo behaviour)
- [x] Loader that inserts ledger into Postgres and round-trips through Zod

#### 0.6 CI
- [x] GitHub Action: `pnpm typecheck`, `pnpm lint`, `pnpm test` on push
- [x] Fixture regression job on merge to `main` (also runs on PRs via `fixtures` job)

### Exit criteria
- [x] Fresh clone: `pnpm install && pnpm build && pnpm test` pass
- [x] Six fixtures load and round-trip schemas
- [ ] One LLM call per provider logged with cost
  - **BLOCKER:** Needs `OPENAI_API_KEY` + `ANTHROPIC_API_KEY` in env/CI secrets. Smoke tests are wired (`pnpm llm:smoke`) but skip without keys. Local/CI cannot prove live provider logging until secrets are provided.

### Definition of Done
- [x] Foundation packages on disk with tests (`core`, `ledger`, `llm`, fixtures, CI)
- [ ] Full Phase 0 exit (live dual-provider LLM log) blocked on API keys — see above

---

## Phase 1 — Ledger / Living Memory v2 (weeks 3–5)

**Goal:** Typed user truth with decay, provenance, ripple, exceptions API + UI.
**Prerequisites:** Phase 0 exit green.

### Build order

#### 1.1 Decay engine
- [x] Implement `isStale(entry, now)` per kind table (fact / habit / intention / emotional_event / exception / context)
- [x] Fake-clock unit tests for every kind
- [x] User-overridable decay metadata fields on entries (`entry.decay` + `DecayOverrides`)

#### 1.2 Write path
- [x] `addEntry` API: capture → extract (LLM) → provenance stamp → confirm rules for inferred vs stated
- [x] Hard rule: inferred confidence &lt; 0.7 never alone justifies a write action
- [x] Clarifying-question path when extract confidence is low
  - **NOTE:** Live extract needs `complete` from `@sabha/llm` + API keys. Unit tests cover mocked extract / clarification.

#### 1.3 Ripple
- [x] Candidate retrieval: same subject/persons + top-20 embeddings + rules referencing subject
  - **NOTE:** Subject/person retrieval + rules lookup shipped. **Embedding top-20 similarity is BLOCKED/DEFERRED** until entries are embedded (pgvector column exists; write-path embedding not yet wired). **USER:** wire embedding model + API key when ready.
- [x] Batched classify LLM: `unaffected | modified | invalidated | conflicts` (LLM optional; deterministic classifier default)
- [x] `confirmRipple(entryId, choices)` applies supersede / edit / retire
- [x] Ripple UI contract: one screen, per-item update | keep | later (`/memory/ripple`)
  - **NOTE:** Persist choices need `DATABASE_URL` in deploy env (**USER**).

#### 1.4 Exceptions store
- [x] CRUD for exceptions (rule/subject + person + context + reason)
- [x] Hook point documented for Phase 7 overrides (`onOverrideCreateExceptionHook`)

#### 1.5 `packages/ledger` public API
- [x] `addEntry` · `confirmRipple` · `getRelevant` · `isStale` · `supersede` · `retire` · `review` · `partition(seat)` (stub seats until Phase 6)

#### 1.6 Web UI (`apps/web`)
- [x] Real Living Memory pages: Intentions, Context, Past/inferred, Exceptions, Signal permissions (`/memory`)
- [x] Every entry shows source, age, heat tag, “still true?”
- [x] Keep `/try` demo as legacy; do not break marketing site

#### 1.7 Tests
- [x] Ripple set: ≥60 cases; track recall ≥80%, ≤2 false flags per change
- [x] Six demo fixtures produce expected ripples (deterministic screen; live `addEntry` needs DB + optional LLM keys)

### Exit criteria
- [x] User can confirm ripple in one screen (fixture-backed UI; plain-text extract needs LLM keys — **USER**)
- [x] Demo fixtures ripple as expected (classifier)

---

## Phase 2 — Detectors (weeks 5–7)

**Goal:** Five parallel detectors with evidence; replace scripted demo scores.
**Prerequisites:** Ledger `getRelevant` + `isStale` stable.

### Build order

#### 2.0 Shared harness
- [x] `Detector` interface in `packages/detectors`
- [x] Runner: all five in parallel; deterministic first, LLM only if needed
- [x] Latency budget instrumentation (p95 &lt; 2s for full set — asserted in tests)

#### 2.1 Staleness
- [x] Resolve `dependsOn` or infer via `getRelevant` + LLM
  - **NOTE:** Deterministic path shipped; LLM infer path needs keys (**USER**).
- [x] Emit one finding per stale dependency with cite-or-abstain evidence ids

#### 2.2 Heat
- [x] Rule-based score from allowed signals only
- [ ] Borderline → LLM on instruction wording — **BLOCKED** on API keys (**USER**)
- [x] **Security test:** heat never leaves Sabha / never sent to agents

#### 2.3 Person-rule
- [x] Extract persons from action args; fire when rule-triggered + person touched
- [x] Severity boost for close circle / exception / repair

#### 2.4 Influence
- [x] Labels: verified | suspected | unknown only
- [x] Guard: never present suspected as verified (unit + eval)
- [ ] Fetch one alternative source for Ajnabi (Phase 6) — scaffold; live fetch later

#### 2.5 Scope
- [x] Compare verb vs authority level (stub registry until Phase 5, then wire real)
- [x] Mandate freshness check hook
- [x] Out of scope → finding that forces `block_scope`

#### 2.6 Eval sets
- [x] Labelled set scaffolds at plan counts (staleness 80, heat 60, person-rule 40, influence 50, scope 40)
  - **USER:** replace placeholder labels with gold labels before accuracy CI gates.
- [x] Six demo fixtures: findings match former scripted demo (computed)

### Exit criteria
- [ ] All detector targets met on labelled sets — **WAITING** on gold labels (**USER**/labelling pass)
- [x] Demo fixtures findings computed, not hardcoded

---

## Phase 3 — Gate + ask budget (weeks 7–8) → **M1**

**Goal:** Deterministic routing + ask economics + evening digest.
**Prerequisites:** Detectors emit stable `Finding[]`.

### Build order

#### 3.1 Config model
- [x] User config: only-you categories, spend caps, ask budget, cooling-off length, amount bands
  - Confirmed for early access: 120 min cool-off, 5 asks/day.

#### 3.2 `gate.route(action, findings, config)`
- [x] Implement table top-to-bottom: block_scope → only_you → delay → council → ask → notify → auto
- [x] Return `{ lane, reason }` one-sentence explanation
- [x] Pure function; fully unit-tested (no LLM inside Gate)

#### 3.3 Ask rule
- [x] Implement inequality with P × C(wrong) vs C(interrupt) + λ · asks_used/budget
- [x] Map severity → P (0.2 / 0.5 / 0.8); document calibration hook for Phase 7

#### 3.4 Evening digest
- [x] Queue low-stakes findings not asked (`digest.ts`)
- [ ] Digest job (pg-boss): one daily summary + “still true?” → ledger updates
  - **BLOCKED:** needs always-on worker + `DATABASE_URL` (**USER** ops). In-memory queue shipped.

#### 3.5 Tests / simulation
- [x] ≥3 fixtures per routing row
- [x] Replay six demo cases → demo lanes
- [x] 200 synthetic actions / week: asks ≤ budget; no high-stakes finding only in digest

### Exit criteria → **M1**
- [x] `gate.route` deterministic + explained
- [x] 200-action sim within budget
- [x] **M1 signed off (code):** computed detectors + Gate on six fixtures — product sign-off still **USER**

---

## Phase 4 — Gateway (weeks 8–11) → **M2**

**Goal:** Binding interception via MCP server + proxy; approvals UX.
**Prerequisites:** M1; choose first MCP agent client for tests.

### Build order

#### 4.1 Tool catalogue
- [x] YAML catalogue per downstream server (verb, reversibility, persons/amount extractors) — `apps/gateway/catalogue/`
- [x] Unknown tools default `write` + `hard`

#### 4.2 Mode A — Sabha MCP server
- [x] Core `check_action` path (detectors + Gate) in `apps/gateway`
- [ ] Full MCP tool surface: `await_decision`, `get_context`, `state_change`, `record_outcome` — **NEXT** after auth choice
- [x] Authn between agent and Sabha — **API key** (`Authorization: Bearer sabha_…`). OAuth is not early access.

#### 4.3 Mode B — MCP proxy
- [ ] Mirror downstream tools — scaffold only
- [x] Classify → build `ProposedAction` → detectors → Gate (`checkAction`)
- [ ] auto/notify: forward + receipt — needs live MCP + receipts store
- [x] hold: in-memory holds + timer; never execute on expiry (tests)
- [ ] On approve/modify/decline: execute or no-op; receipt always first — **USER:** OAuth + worker

#### 4.4 Approvals UX
- [x] Inbox shell in `apps/web` (`/approvals`)
- [ ] Case sheet (reuse demo patterns): evidence, question, Council brief, actions
- [ ] Web push for ask/council/only_you; delay notify on cool-off end — **USER:** VAPID keys
- [ ] One-tap answers for single questions

#### 4.5 Integrations (order)
- [ ] Gmail send + create_draft via proxy — **USER:** Google OAuth client
- [ ] Google Calendar accept + create — **USER:** Google OAuth client
- [x] Mock checkout catalogue + mandate freshness hook (detector)
- [x] Scaffold hooks for four job-search agents (Phase 8 README)

#### 4.6 Security checklist
- [x] No passwords/cards stored in Sabha (asserted by design — no such fields)
- [ ] Exact replay on approve; modified call shown before run — needs live proxy
- [x] Hold TTL default 48h; expire ≠ execute
- [ ] Receipt written before forward — wire when proxy executes

#### 4.7 Perf
- [ ] Pass-through p95 latency &lt; 300 ms — measure once proxy is live

### Exit criteria → **M2**
- [ ] MCP agent through proxy cannot send/pay without Gate decision — **BLOCKED** on auth + OAuth (**USER**)
- [ ] Latency budget met

---

## Phase 5 — Rules & Commitments (weeks 11–12)

**Goal:** Standing calm decisions, cooling-off, authority registry, mandate freshness.
**Prerequisites:** M2; Gate delay/ask lanes working.

### Build order

#### 5.1 Rule DSL storage
- [x] JSON schema stubs in `@sabha/core` for rules / commitments / authority grants
- [ ] CRUD + review dates (default 90 days) — DB tables exist; API CRUD next

#### 5.2 Precommitments
- [ ] Create only at heat 1; else draft for later confirm
- [ ] Fire on heat 3 → delay with user’s reason shown
- [ ] Override: wait OR type deliberate reason (never permanent veto)
- [ ] Log override → exception (Phase 7)

#### 5.3 Scoped rules + close circle
- [ ] Close-circle list UI
- [x] Close-circle severity path in person-rule detector (tests via fixtures)
- [ ] `exceptPersons` / `exceptContexts` fill from learned exceptions (hook)

#### 5.4 Authority registry
- [x] Per agent × tool category scaffold in `@sabha/rules`
- [x] UI-only mutation; **no agent write path** (assert in tests)
- [ ] Wire Scope detector to live registry (still uses stub level on detector ctx)

#### 5.5 Mandate freshness
- [x] Hook in scope/staleness detectors for depended entries
- [ ] Stale/superseded → ask with plain-language prompt — polish copy in Approvals

### Exit criteria
- [ ] Commitment create → fire → delay → both override paths work
- [ ] Close-circle rule always asks in tests
- [x] No agent self-elevation path (unit test)

---

## Phase 6 — Council (weeks 12–15)

**Goal:** Structurally independent seats + Chair brief; partitions enforced in code.
**Prerequisites:** `ledger.partition`; Gate `council` lane; influence alternative from 2.4.

### Build order

#### 6.1 Seat runtime
- [x] Implement seats: Smriti, Vartamaan, Sankalp, Viveka, Ajnabi, Sabhapati (`@sabha/council` scaffold)
- [x] `partition(seat)` enforced in code (not prompt-only)
- [x] Ajnabi: no ledger slice (provider split needs second API key — **USER**)

#### 6.2 Convening matrix
- [ ] Map detector conflicts → seat sets (per plan table)
- [ ] Abstain if slice empty

#### 6.3 Protocol
- [ ] Blind round (parallel) → validate evidence ids in slice → regenerate once → else abstain
- [ ] Rebuttal round (one sentence / concede)
- [ ] Chair brief schema (no vote; uncertainty required)
- [ ] Stream seat lines to case sheet; p95 brief ≤ 15s

#### 6.4 Guardrails
- [ ] Banned guilt/shame patterns filter
- [ ] Viveka never speaks as the other person
- [ ] Sankalp may delay, never refuse

#### 6.5 Cost / frequency
- [ ] Per-session cost log + ceiling alert
- [ ] Insights counter: Council / 100 actions (warn if &gt; 5)

### Exit criteria
- [ ] Laptop, earbuds, Riya fixtures: all lines cite in-slice evidence
- [ ] Partitioning test: zero out-of-slice leaks

---

## Phase 7 — Receipts, learning, Insights (weeks 15–16) → **M3**

**Goal:** Tamper-evident accountability + learning loop + real IAR.
**Prerequisites:** Gateway decisions flowing; Council optional path live.

### Build order

#### 7.1 Receipts
- [x] Append-only `Receipt` hash chain in `@sabha/receipts` (`prevHash` / `hash`)
- [ ] Write receipt for every non-auto (and policy for auto: receipt-only) — wire at gateway execute
- [ ] Correction = new receipt pointing at old

#### 7.2 Learning loop
- [ ] Override → exception
- [ ] 3 same-context overrides / 90d → propose rule scope fix (never silent apply)
- [ ] Regret signal: undo/cancel/return within 48h
- [ ] Monthly job: recalibrate ask-rule P map from receipts

#### 7.3 Informed Agency Rate
- [ ] Implement five criteria booleans on consequential actions
- [ ] IAR = informed ÷ consequential over period

#### 7.4 Insights UI
- [ ] Weekly: IAR, asks/day vs budget, held/prevented, Council/100, regret by lane, proposed rule fixes
- [ ] Replace demo simulated numbers

#### 7.5 Export / delete
- [ ] JSON export of ledger + receipts
- [ ] Delete path (account / data)

### Exit criteria → **M3**
- [ ] Integration tests: every non-auto action has verifying hash chain
- [ ] Learning loop proposes gift-cap fix after 3 synthetic overrides
- [ ] **M3 signed off:** full stack on real tools

---

## Phase 8 — Job-search experiment + evals (weeks 16–20) → **M4**

**Goal:** Measure whether Sabha raises catch rate / IAR without excess friction.
**Prerequisites:** M3; pick agent framework (open decision).

### Build order

#### 8.1 Experiment harness (`experiments/job-search`)
- [x] README scaffold committed
- [ ] Four agents: Research, Ranking, Resume, Outreach — **USER:** pick framework first
- [ ] Mock job board (sponsored listings), mock email, mock apply
- [ ] All tools exclusively through Sabha proxy

#### 8.2 Planted failures
- [ ] Implement all seven planted failures from the plan
- [ ] Assert expected Sabha behaviour per failure in sim tests

#### 8.3 Conditions
- [ ] Baseline (free agents)
- [ ] Guardrails (approve-every-send, no ledger/detectors)
- [ ] Sabha (full pipeline)
- [ ] Identical tools across conditions

#### 8.4 Stages
- [ ] Simulated personas + scripted ledgers; label results as simulation
- [ ] Real-user protocol doc + pilot with 3 people
- [ ] Full run 20–30 within-subjects (after pilot)

#### 8.5 Metrics pipeline (`evals/`)
- [ ] Catch rate, authority violations, intent preservation, influence disclosure, IAR, friction, comprehension rubric, regret
- [ ] Results table generator for three conditions

#### 8.6 Council study hooks
- [ ] Pairwise disagreement rates; decision-change vs single question; ablations; 48h regret

### Exit criteria → **M4**
- [ ] Sim stage end-to-end + results table
- [ ] Real-user protocol written and 3-person pilot done
- [ ] **M4 signed off**

---

## Cross-cutting engineering checklist (every phase)

- [ ] Types only from `packages/core`
- [ ] Structured LLM output always Zod-validated
- [ ] Evidence ids on every user-facing flag / Council line
- [ ] Influence status never upgrades suspected → verified without new evidence
- [ ] Secrets only in env / secret manager; never in repo
- [ ] Observability: latency, cost, lane distribution, ask count
- [ ] Feature flags for Council / proxy integrations
- [ ] Docs: update this checklist + README “what works today” after each milestone

---

## Suggested weekly cadence (solo builder)

| Weeks | Focus | Milestone |
| --- | --- | --- |
| 1–2 | Monorepo, DB, LLM, fixtures, CI | — |
| 3–5 | Ledger + ripple + Living Memory UI | — |
| 5–7 | Five detectors + eval sets | — |
| 7–8 | Gate + ask budget + digest | **M1** |
| 8–11 | MCP gateway + Gmail/Calendar + approvals | **M2** |
| 11–12 | Rules, commitments, authority | — |
| 12–15 | Council protocol | — |
| 15–16 | Receipts, learning, Insights | **M3** |
| 16–20 | Job-search experiment + evals | **M4** |

**Cut order if time slips** (from plan): real-user study → sim only; Council 5 → 3 seats; mandate freshness → later.

---

## Open decisions (resolve before they block)

| Decision | Blocks | Options | Chosen |
| --- | --- | --- | --- |
| Council seats fixed vs user-renameable | Phase 6 UX | Fixed names / custom labels | **Fixed names** |
| Ledger hosted vs local-first vs both | Phase 1 deploy | Neon · local SQLite/PGlite · dual | **Docker local + Neon production** |
| First users: individuals vs teams | Phase 4 auth model | Consumer · team permissions | **Individuals** |
| Agent framework for job-search | Phase 8 | e.g. Mastra / LangGraph / custom MCP | **Custom MCP** |
| Default cooling-off + ask budget | Phase 3 config | e.g. 2h · 3 asks/day | **120 min · 5 asks/day** |

---

## Immediate next actions (start here)

1. [x] Freeze tooling: pnpm + local Docker Postgres (Neon still optional later).
2. [x] Phase 0.1–0.6 foundations (monorepo, core, DB, llm, fixtures, CI).
3. [x] Phase 1 ledger API + Living Memory + ripple UI + ≥60 ripple cases.
4. [x] Phase 2 detectors + Phase 3 Gate + M1 code path (six fixtures computed).
5. [x] Phase 4–8 scaffolds (`apps/gateway`, rules, council, receipts, experiment README).
6. [x] Early-access decisions locked in `USER_ACTIONS.md` (BYOK, ₹100 ceiling, individuals, API-key gateway, Neon, fixed seats).
7. [ ] **You:** paste your own provider keys into `.env.local`, set Neon `DATABASE_URL` + `SABHA_SECRETS_KEY` on Vercel, confirm Root Directory `apps/web`.

When Phase 0 live-LLM exit is green (or explicitly waived), keep this checklist as the sprint backlog: one phase ≈ one epic; checkboxes ≈ tickets.

## Active blockers (USER)

| Item | Status | Notes |
| --- | --- | --- |
| Phase 0 exit: live dual-provider LLM log | **WAITING ON YOUR KEYS** | BYOK. Put keys in `.env.local`, run `pnpm llm:smoke`. Spend counts toward the ₹100 combined ceiling. Do not add keys to GitHub Actions. |
| Phase 1.2+ extract/ripple LLM paths | **WAITING ON YOUR KEYS** | Deterministic paths work. Each user supplies keys in Settings. |
| Model spend ceiling | **DONE** | Combined OpenAI + Anthropic hard-stops before ₹100. |
| Gateway auth | **DONE** | Per-person API key. OAuth is not early access. |
| Embeddings for ripple top-20 | **DEFERRED** | Do not spend the ₹100 ceiling on a backfill. |
| Detector gold labels | **DEFERRED** | Accuracy gates stay off for early access. |
| Evening digest worker (pg-boss) | **LATER** | Needs the Neon `DATABASE_URL` and a worker. Inbox is enough for early access. |
| Gmail / Calendar OAuth | **DEFERRED** | Not required to roll out. |
| Web push (Approvals) | **DEFERRED** | Approvals inbox is the channel. |
| Open decisions | **RESOLVED** | See table + `USER_ACTIONS.md` |
| Phase 8 agent framework | **DECIDED** | Custom MCP. Harness implementation is still later. |
| Vercel Root Directory | **CONFIRM** | Must be `apps/web` |
| Neon `DATABASE_URL` + `SABHA_SECRETS_KEY` | **YOURS** | Required before hosted key storage works |
