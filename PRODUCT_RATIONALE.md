# Sabha: product rationale

## Problem
AI agents can act on an incomplete picture of who we are, what we value and why a decision is being recommended. People delegating consequential decisions lack a reliable way to examine and challenge the assumptions, competing perspectives and commercial influences behind a recommendation before the agent acts.

## One line
Sabha makes the reasoning behind your AI agent's decisions visible, challenges it from multiple perspectives, and gives you control over what gets acted on.

- **The agent (the AI agent)** proposes and executes.
- **Sabha** examines the proposal, checks context, exposes influences and presents competing perspectives.
- **You** understand the reasoning and keep the authority your permissions define.

## Four failure modes (the tags in the prototype)
| Failure mode | What goes wrong | Prototype scenario |
|---|---|---|
| Human context | The agent sees the argument, misses the reconciliation | the AI agent suggests declining Riya's dinner |
| Human growth | The agent predicts tomorrow from yesterday | Gym at 12:30 pm despite a new 5 am goal |
| Decision flexibility | A budget is treated as an instruction to stop thinking | "Under ₹60,000" becomes "spend close to ₹60,000" |
| Commercial influence | Sponsorship or emotional state shapes a recommendation unseen | Sponsored laptop pick; ₹4,200 earbuds after a heated call |

## Principles
1. People are more than their histories.
2. Instructions need interpretation, not blind execution.
3. Influence must be visible, with verified, suspected and unknown kept distinct.
4. Important decisions deserve structured deliberation.

## Three features
- **Living Memory corrects the information.** Current intentions and constraints, context you add, past behaviour and inferences kept separate, signal permissions, export and delete. Each item shows its source, when it was last confirmed, and whether it's temporary or lasting.
- **Council challenges the reasoning.** Six defined roles: Present Self (what do you want now?), Future Self (what happens later?), Values & Commitments (what must not be compromised?), The Skeptic (what might be missing?), The Optimizer (what alternatives exist?), Influence Auditor (who benefits?). It ends in a decision brief: strongest for and against, assumptions and gaps, alternatives, influence with evidence, and a suggested next step with stated uncertainty. It never votes.
- **Gate enforces your decision.** It scores stakes, reversibility, uncertainty, conflict with your intentions and emotional heat, then routes to Auto, Notify, Ask, Council or Only You. Hard limits are never relaxed without explicit confirmation. Heated purchases wait out a cooling period.

## Scenarios as acceptance tests
1. **Relationships:** Sabha asks what the AI agent can't see. Recording the reconciliation makes the AI agent withdraw its suggestion. Only You.
2. **Personal growth:** the 5 am intention outranks the 11 am history. The council proposes a gradual plan without assuming failure.
3. **Purchase:** Sabha asks whether ₹60,000 is a hard limit or a flexible target. If hard, the ₹79,900 option is comparison only; if flexible, it's an explicit exception. Influence status is shown per option.
4. **Emotional advertising:** stress and heart rate are blocked for shopping; sponsorship is verified with evidence; whether the stress signal reached the advertiser is shown as unknown.

## North star: Informed Agency Rate
The share of consequential decisions where all five are true:
1. Relevant intentions and assumptions were surfaced.
2. Alternatives and trade-offs were presented.
3. Known influence was disclosed and unknowns were named.
4. The user chose before execution.
5. The action stayed within permissions.

The prototype checks these live on every decision. More information alone doesn't count.

**Supporting metrics:** stale-context incident rate, material influence disclosure rate, alternative consideration rate, unnecessary-interruption rate, policy-violation rate, decision completion time, and seven-day endorsement (an outcome check, not the north star).

## Out of scope for V1
- Reading an agent's hidden reasoning without a supported interface.
- Guaranteeing detection of every ad.
- Inferring a repaired relationship without user confirmation.
- Overriding hard limits.
- Presenting council roles as independent experts.
- Blocking every action on every device.

## Key assumptions to test
- A1. Intentions change faster than behavioural history.
- A2. Literal instructions omit trade-offs.
- A3. Users need help weighing perspectives.
- A4. Some influence is detectable from available evidence.
- A5. Some agents allow external action controls.
- A6. Users will trust an independent layer with personal context.
- A7. Users value transparency enough to adopt it.

## Go-to-market
Start with purchase decisions, where budgets, alternatives, sponsorship and execution fit in one journey. Run an opt-in pilot with one supported action workflow, then expand to routines and relationships.

## Research basis
- Grossmann & Kross (2014), Solomon's paradox: self-distancing improves reasoning. → Council.
- Sharma et al. (ICLR 2024): sycophancy in preference-trained assistants. → The Skeptic.
- Quoidbach, Gilbert & Wilson (2013), the end of history illusion. → Human growth.
- Park et al. (2023), Generative Agents: memory importance is fixed at write time. → Context you add.
- Kulveit et al. (2025), Gradual Disempowerment: AI can erode consumer choice as a control. → Why a user-side layer.

## Prototype limits
Concept prototype. Simulated agent and data. The rules, permissions, receipts, budget logic, memory updates, timers and Informed Agency Rate are real logic; council lines and products are scripted.
