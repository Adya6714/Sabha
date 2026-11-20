# Sabha

**[sabha-beta.vercel.app](https://sabha-beta.vercel.app)**

A governance layer between human intention and autonomous AI action.

Sabha ensures that when AI systems act on behalf of people, their authority, incentives, assumptions and decision-making remain visible, contestable and accountable.

> Intelligence can be delegated. Authority should not be surrendered silently.

---

## The problem

AI agents can already research, recommend, buy, message and apply on your behalf. What they usually cannot do is show you:

- what they assumed about you
- who else benefited from the recommendation
- which downstream agents or tools were involved
- whether they had permission to act
- how the final action relates to what you originally asked for

Without that, people surrender authority quietly — even when the agent is “helpful.”

## What Sabha is

Sabha sits between you and autonomous action. It is not another agent that decides for you. It is a governance layer that makes the decision process inspectable before irreversible things happen.

**Today’s foundations**

| Layer | Job |
| --- | --- |
| **Living Memory** | Corrects the information the agent uses |
| **Council** | Challenges the reasoning from multiple perspectives |
| **Gate** | Enforces your decision based on stakes and risk |

**Where the product is heading**

| Capability | Job |
| --- | --- |
| **Delegation Map** | Shows who is doing what downstream |
| **Authority Registry** | Makes permissions explicit: Observe → Recommend → Prepare → Execute → Escalate |
| **Influence & Incentive Auditor** | Surfaces conflicts as verified, suspected or unknown |
| **Governance Receipts** | Records intention, chain, approvals and outcome |

## Who this is for

- People experimenting with personal AI agents who want consequential actions kept accountable
- Builders exploring multi-agent workflows who need a user-side governance model
- Researchers studying informed agency, delegation and influence disclosure

## What you can use today

Sabha is **usable as a product concept and interactive demo**, not yet as a production enforcement layer plugged into every agent framework.

| You can | You cannot yet |
| --- | --- |
| Explore the product site, Living Memory, and waitlist | Install Sabha as a drop-in SDK for any agent |
| Run the interactive demo + computed detectors/Gate on six fixtures | Assume real MCP proxy enforcement against live agents |
| Study the governance model; run `pnpm test` locally | Treat Council lines as live independent expert models |

The live experience:

- **Site:** [sabha-beta.vercel.app](https://sabha-beta.vercel.app)
- **Memory:** `/memory` · **Approvals:** `/approvals` · **Demo:** `/demo`
- **How it works:** [sabha-beta.vercel.app/how-it-works](https://sabha-beta.vercel.app/how-it-works)

Build checklist: `IMPLEMENTATION_CHECKLIST.md`. Items only you can clear: `USER_ACTIONS.md`.

## How it helps

Sabha is designed to improve **informed agency** — the chance that before something consequential happens:

1. Relevant intentions and assumptions were surfaced
2. Alternatives and trade-offs were visible
3. Known influence was disclosed, and unknowns were named
4. You chose before execution when stakes required it
5. The action stayed within your permissions

In practice, that means fewer silent sponsorships, fewer stale assumptions treated as truth, fewer unapproved outbound actions, and a clearer answer to “why did my AI do that?”

## Monorepo

| Path | Purpose |
| --- | --- |
| `apps/web` | Next.js product site, Living Memory, Approvals, demo |
| `apps/gateway` | MCP catalogue + `check_action` / holds scaffold |
| `packages/core` | Shared Zod schemas + types |
| `packages/ledger` | Postgres + Drizzle, decay, ripple, fixtures |
| `packages/llm` | `complete()` + Zod validation + logging |
| `packages/detectors` | Five parallel detectors |
| `packages/gate` | Deterministic routing + ask budget + digest |
| `packages/rules` · `council` · `receipts` | Phase 5–7 scaffolds |
| `IMPLEMENTATION_CHECKLIST.md` · `USER_ACTIONS.md` | Build order + your blockers |

**Tooling:** pnpm workspaces · Turborepo · TypeScript (`tsconfig.base.json`) · ESLint · Prettier · Vitest

### Scripts

| Command | What it does |
| --- | --- |
| `pnpm install` | Install all workspace deps |
| `pnpm dev` | Run `@sabha/web` locally |
| `pnpm build` | Build all packages/apps via Turbo |
| `pnpm build:web` | Build only `@sabha/web` |
| `pnpm lint` | Lint apps + root |
| `pnpm typecheck` | Type-check via Turbo |
| `pnpm test` | Run Vitest |
| `pnpm format` | Format with Prettier |
| `pnpm db:up` | Start local Postgres + pgvector |
| `pnpm db:migrate` | Apply Drizzle migrations |
| `pnpm db:seed` | Verify empty schema loads |

## How to try it

### 1. Use the hosted product

1. Open [sabha-beta.vercel.app](https://sabha-beta.vercel.app)
2. Read the governance model on **How it works**
3. Open the **Demo** and walk through a day of agent decisions
4. Join early access if you want updates as the enforcement layer matures

### 2. Run it locally

Requires [Node 20+](https://nodejs.org/) and [pnpm](https://pnpm.io/) (`corepack enable`).

```bash
git clone https://github.com/Adya6714/Sabha.git
cd Sabha
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

Optional environment (copy `apps/web/.env.example` → `apps/web/.env.local`):

```bash
NEXT_PUBLIC_SITE_URL=http://localhost:3000
WAITLIST_WEBHOOK_URL=   # optional: Zapier / Make / Loops / etc.
```

Without a webhook, waitlist signups are accepted in-memory for local testing.

Build only the web app:

```bash
pnpm build:web
```

### 3. Deploy your own copy

```bash
npx vercel
```

Set the Vercel project **Root Directory** to `apps/web`. Set `NEXT_PUBLIC_SITE_URL` to your production URL, and `WAITLIST_WEBHOOK_URL` if you want signups to persist.

## App routes (`apps/web`)

| Route | Purpose |
| --- | --- |
| `/` | Product site + early access |
| `/memory` | Living Memory (fixture-backed) |
| `/memory/ripple` | Ripple confirm UI |
| `/approvals` | Holds inbox shell |
| `/settings` | Your model keys, ₹100 ceiling, agent key |
| `/demo` | Interactive demo |
| `/how-it-works` | Full governance model |
| `/privacy` | Privacy policy |
| `/api/waitlist` | Waitlist signup API |

## Status

Sabha is early.

- **M1 code path:** computed detectors + Gate on six demo fixtures (`pnpm test`)
- **Early access:** individuals only. Each person adds their own OpenAI and Anthropic keys at `/settings`. Combined spend stops before ₹100. Agents authenticate with a Sabha API key, not OAuth.
- Hosted ledger is Neon; local ledger is Docker Postgres. Decisions are in `USER_ACTIONS.md`.

If you are evaluating Sabha: start with the demo, then the how-it-works page. That is the current onboarding path.

## License

Proprietary for now. Questions and feedback welcome via [GitHub Issues](https://github.com/Adya6714/Sabha/issues).
