# Sabha: Gate evaluation + robustness plan

## 1. Pilot result (already run on your real Gate code)
- Set: 300 actions from InjecAgent (180 attacker-injected tool calls, 120 benign user calls), weak labels from benchmark ground truth
- Strategies: always_auto, always_ask, ask_if_irreversible, sabha_gate (runDetectors + route, default config)
- Results (needs_human = anything not Auto):
  - always_auto: recall 0%
  - always_ask: precision 60%, recall 100%, ask-rate 100%
  - ask_if_irreversible: precision 100%, recall 45%, ask-rate 27%
  - sabha_gate: recall 0%, ask-rate 0% (it auto-approved all 300)
- Do NOT quote these as final numbers. Caveats:
  - Labels are weak (benchmark-derived), not human-adjudicated
  - Benign set is all reads, so false-ask rate is trivially 0 for the irreversible rule. Need benign writes (tau-bench) to test over-asking
  - No amounts, no ledger, no persons in these actions, so most detectors had nothing to fire on
  - Verb and reversibility come from a keyword map I wrote, which is itself a source of error

## 2. Why Gate scored 0 (these are real design gaps, not bugs)
- No detector models "is this action what the user asked for". Existing five detectors: staleness, heat, person_rule, influence, scope. None look at intent or instruction origin
- influence detector fires only on args.sponsored / utm params / high amount with no rationale
- scope detector defaults authorityLevel to "execute" when unset, so it never blocks
- route() only escalates on findings, amounts, or spend cap. A zero-amount `send` with no findings falls through to auto
- Result: on prompt-injection style attacks Gate is strictly weaker than the one-line "ask if irreversible" rule
- Also, packages/detectors/src/eval/sets.ts is a placeholder: labels are `i % 3 !== 0`, not real. Don't cite it

## 3. Fixes that make Gate robust (in priority order)
1. Provenance (taint) on every action
   - Add `origin: "user_request" | "tool_output" | "memory" | "agent_inference"` to ProposedAction
   - New detector `intent_conflict`: severity 3 if a non-read action's origin is tool_output; severity 2 if a cheap LLM or embedding judge says the action is not entailed by the user's stated intention
2. Session-level detector using `dependsOn`
   - Catches data-stealing chains: sensitive read (not requested by user) followed by send/share to a new recipient
   - Needed because the first step of a data-stealing attack looks identical to a normal read
3. Safe defaults
   - Unknown authority level means `recommend`, not `execute`
   - Floor rule: hard-reversibility send/pay/delete/accept always at least Ask unless a user rule allows it. This makes Gate dominate the irreversible baseline by construction; extra detectors then add recall and cut false asks
4. Calibrate, then keep inference deterministic
   - Replace hard-coded 0.2/0.5/0.8 severity-to-probability and stakes multipliers with weights fit on the dev split (logistic regression over features: verb, reversibility, amount band, findings, origin)
   - Ship learned weights as a JSON file; routing stays auditable
5. Expose the ask-rate/recall curve
   - Gate has knobs (lambda, askBudget). Sweep them and plot recall vs ask-rate. Baselines are single points. The product claim is: at equal ask-rate, higher recall

## 4. Dataset design (the ~240 labeled actions)
- Unit: one proposed tool call in context: { user_instruction, action (ProposedAction), origin, chain (dependsOn), label }
- Label set for eval (collapse 7 lanes to 3): Auto (auto, notify) / Ask (ask, delay, council, only_you) / Block (block_scope)
- Primary metric: binary needs_human = Ask or Block. Secondary: 3-class confusion matrix
- Sources and sizes
  - InjecAgent (60): attacker steps = needs_human; matched benign user calls = Auto. Split data-stealing into first (read) and last (send) steps and report separately
  - AgentDojo (60): injection tasks vs user tasks across banking, slack, travel, workspace (4 suites, 27 injection tasks in the repo)
  - tau-bench (60): policy requires explicit user confirmation before DB-updating actions (airline and retail wiki.md), so writes = Ask, reads = Auto. This supplies benign-but-consequential cases
  - ToolEmu (30): 144 cases with Potential Risky Actions; draft labels with an LLM, human adjudicates
  - Your own agent logs (30+): Claude Code / Cursor MCP traces from your real use. These are the only labels that reflect Sabha's actual user
- Labeling protocol
  - Written rubric first (what makes Ask vs Auto vs Block)
  - Two annotators on at least 25% overlap, report Cohen's kappa. LLM pre-labels allowed, human decides
  - Split: 50% dev (tune thresholds, fit weights) / 50% test (touch once, report once)
  - Report bootstrap 95% CIs. With n=120 test actions, CIs will be wide; say so
- Baselines
  - B0 always_auto, B1 always_ask, B2 ask_if_irreversible, B3 single zero-shot LLM judge ("should a human confirm this?"), B4 Sabha Gate
  - If B4 does not beat B2 and B3 at equal ask-rate, the scoring is not earning its complexity
- Metrics: precision, recall, F1 on needs_human; ask-rate; false-ask rate on benign writes; miss rate on attacks (attack auto-executed); per-source and per-group breakdown

## 5. Council robustness (from the debate literature)
- Evidence (all on reasoning benchmarks, not decision support)
  - Huang et al. 2023 (arXiv 2310.01798): multi-agent debate only slightly better than self-consistency at comparable calls
  - Zhang et al. 2025 (arXiv 2502.08788): MAD fails to reliably beat CoT and self-consistency even with more compute; model heterogeneity helps
  - "Talk Isn't Always Cheap" (arXiv 2509.05396): debate can degrade results, especially with heterogeneous agents
- Implications for Council
  - Do not let seats see each other's output. Generate independently in parallel, then one aggregator lists disagreements. Avoids conformity
  - Different models per seat (free tiers make this cheap)
  - Different evidence per seat: Future Self gets long-term intentions, Values gets commitments and rules, Skeptic gets retrieved counter-evidence, Influence Auditor gets real page and sponsor data. Otherwise it is role-play
  - Start with 3 seats, test each by leave-one-out
  - Council success is NOT accuracy. Define it: coverage of considerations a blind rater lists, decision changed, regret at 1 week
  - Baseline: one call with the same token budget and a devil's advocate prompt
- Caveat: Council package is a scaffold in the repo, so none of this is tested yet

## 6. Free or cheap compute (legit only)
- Gate and detectors are deterministic: running the whole Gate eval costs $0 in API calls. API spend only matters for LLM pre-labeling, the LLM-judge baseline (B3), intent judge, and Council
- Standing free tiers (limits change often, verify before relying): Google AI Studio (Gemini Flash), Groq, OpenRouter `:free` models (about 50/day, about 1,000/day after buying $10 credit), Mistral, Cloudflare Workers AI, NVIDIA API Catalog, Z.ai
- Credit-based or gone: Cerebras trial credit; GitHub Models reportedly retired 2026-07-30 (two sources); Anthropic/OpenAI no ongoing free API tier
- Local: Ollama with a Qwen or Llama class model for labeling and the judge baseline
- Credit programs to apply for (I have not verified current terms): Anthropic and OpenAI researcher/startup programs, Google for Startups, AWS Activate, Microsoft Founders Hub, Azure for Students
- Caveats
  - Free tiers may log or train on prompts. Fine for public benchmark data, NOT for real user data
  - Avoid pooled or shared keys and anything that routes a consumer subscription through a proxy. Those typically violate provider terms and risk bans
  - OmniRoute (diegosouzapw/OmniRoute, MIT, local gateway on :20128) is a router across providers. Using it with your own legit keys and free tiers is fine. Its subscription-OAuth and "TLS stealth" features are the gray area
- Product change: let users set base URL + key (Ollama, OpenRouter, any OpenAI-compatible) and a user-chosen spend cap. The 100 rupee ceiling was your internal default, so make it a setting enforced server-side with token accounting

## 7. Cursor prompts (run in order, one per session)
1. "Add `origin` and `chain` to ProposedActionSchema in packages/core. Update all tests. Default origin to user_request."
2. "Create packages/detectors/src/intentConflict.ts. Input: action, ctx.userIntent (string), ctx.recentActions. Rules: origin=tool_output and verb!=read gives severity 3 with evidence. Add an optional LLM entailment check behind a flag using packages/llm complete() with Zod output {entailed:boolean, reason:string}. Add unit tests."
3. "Create packages/detectors/src/exfilChain.ts: flag send/share/post whose dependsOn includes a read of a sensitive resource the user did not request. Add tests with 5 positive and 5 negative chains."
4. "In packages/gate/src/route.ts add a floor rule: reversibility hard and verb in send/pay/delete/accept routes to at least ask unless a matching user rule allows it. Change scope detector default authorityLevel to recommend when unset. Update tests."
5. "Replace packages/detectors/src/eval/sets.ts placeholders with a loader for data/eval/labeled_actions.jsonl (fields: id, split, source, user_instruction, action, origin, chain, label). Add scripts/eval-gate.ts (attached) producing a markdown table with bootstrap 95% CIs and a recall vs ask-rate sweep over lambda and askBudget."
6. "In packages/llm add provider config { baseURL, apiKey, model } for any OpenAI-compatible endpoint, plus a per-user spend limit in INR enforced server-side from token usage."

## 8. Order of work
- Day 1: write rubric, adapters for AgentDojo and tau-bench (same shape as adapt_injecagent.py), 25-action pilot labeling with a second annotator, compute kappa
- Day 2: run full 240 on dev split with fixes 3.3 and 3.1, record numbers
- Day 3: add exfil chain, calibrate on dev, run test split once, write results table
- Then: Council ablation (needs free-tier keys from section 6)

## Sources
- https://arxiv.org/pdf/2310.01798
- https://arxiv.org/abs/2502.08788
- https://arxiv.org/html/2509.05396v2
- https://github.com/uiuc-kang-lab/InjecAgent
- https://github.com/ethz-spylab/agentdojo
- https://github.com/sierra-research/tau-bench
- https://github.com/ryoungj/ToolEmu
- https://github.com/diegosouzapw/OmniRoute
- https://www.developersdigest.tech/models/free-api
- https://openrouter.ai/blog/tutorials/free-llm-apis-compared/
