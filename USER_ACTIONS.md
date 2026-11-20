# Early-access decisions

Resolved for the first individual rollout. The choices below are what the code does.

## Locked

| # | Decision | Choice |
| --- | --- | --- |
| 1 | Model keys | **Bring your own.** Sabha has no shared OpenAI or Anthropic key. Each person saves theirs on `/settings`. Operator smoke keys in `.env.local` are that person’s own keys too. |
| 1b | Spend ceiling | Combined OpenAI + Anthropic spend is hard-stopped **before ₹100**. The meter uses ₹90 per USD so it reaches the ceiling before the provider invoice. A call that would reach ₹100 is refused and the provider is not contacted. The meter is keyed by a hash of the key, so clearing the browser does not reset it. |
| 1c | CI secrets | **Do not** put provider keys in GitHub Actions. CI stays on mocked tests. `pnpm llm:smoke` is local and counts toward the ₹100 ceiling. |
| 2 | Ledger hosting | **Both, one schema.** Docker Postgres locally. **Neon** (with `pgvector`) for hosted early access. `DATABASE_URL` is the switch. Not local-first SQLite. |
| 3 | Vercel root | **`apps/web`.** `apps/web/vercel.json` already installs from the repo root. Confirm that Root Directory in the Vercel project is `apps/web`. |
| 4 | Council seats | **Fixed names:** Smriti, Vartamaan, Sankalp, Viveka, Ajnabi, Sabhapati. Not renameable. |
| 5 | First users | **Individuals.** One person, one ledger, one key set. No teams. |
| 6 | Cooling-off and asks | **120 minutes**, **5 asks/day**. Confirmed. |
| 7 | Job-search agents | **Custom MCP** through `@sabha/gateway`. Mastra and LangGraph are out of early access. |
| 8 | Gateway auth | **API key.** `Authorization: Bearer sabha_…`, created on `/settings`. Not OAuth. |
| 9 | Gmail and Calendar | **Deferred.** Early access does not need a Google OAuth client. Mode B stays catalogue-only. |
| 10 | Web push | **Deferred.** The Approvals inbox is the notification channel. VAPID comes after the first individuals are using it. |
| 11 | Real-user study | **Not part of early access.** The 3-person pilot stays in Phase 8, after a protocol. |
| 12 | Embeddings | **Deferred.** Do not spend the ₹100 ceiling on a backfill. Ripple stays on the deterministic path. |
| 13 | Detector gold labels | **Deferred.** Accuracy gates stay off. The six computed fixtures are the early-access check. |

## Still yours

These cannot be invented in the repo.

1. Put **your** `OPENAI_API_KEY` and `ANTHROPIC_API_KEY` in `apps/web/.env.local` (Next.js) and, for `pnpm llm:smoke` / `pnpm db:*`, in the repo-root `.env`. Do not paste them into chat. Then run `pnpm llm:smoke` if you want the live provider check — those calls count toward ₹100.
2. Hosted early access needs a Neon `DATABASE_URL` (pgvector enabled) on Vercel, then `pnpm db:migrate`.
3. Set `SABHA_SECRETS_KEY` on Vercel (32-byte base64). Local dev creates `data/sabha-secrets.key` for you. Generate with:
   `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"`
4. In the Vercel project, set **Root Directory** to `apps/web` if it is not already.

After that, each early-access person opens `/settings`, adds their own keys, and creates an agent key.
