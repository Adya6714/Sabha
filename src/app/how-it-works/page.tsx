import Link from "next/link";
import type { Metadata } from "next";
import { ArchitectureDiagram } from "@/components/ArchitectureDiagram";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";

export const metadata: Metadata = {
  title: "How it works",
  description:
    "Sabha’s governance model — Living Memory, Council, Gate, Delegation Map, Authority Registry, Influence Auditor and Governance Receipts.",
};

const seats = [
  ["Present Self", "What do you want now?"],
  ["Future Self", "What happens later?"],
  ["Values & Commitments", "What must not be compromised?"],
  ["The Skeptic", "What might be missing?"],
  ["The Optimizer", "What alternatives exist?"],
  ["Influence Auditor", "Who benefits?"],
];

const authorityLevels = [
  ["Observe", "Can access relevant information"],
  ["Recommend", "Can suggest an action"],
  ["Prepare", "Can prepare an action but not execute"],
  ["Execute", "Can act within defined permissions"],
  ["Escalate", "Must seek human approval"],
];

const delegationFields = [
  "Which agent received the task?",
  "Which model or provider is it using?",
  "Which other agents or services are involved?",
  "What information was passed downstream?",
  "What permissions does each layer have?",
  "Who is accountable for the final action?",
];

const influenceChecks = [
  "Who benefits if the recommendation is accepted?",
  "Is the agent optimising for the user’s goal or a platform’s goal?",
  "Are there sponsored placements or commercial incentives?",
  "Does the agent have a conflict of interest?",
  "What evidence supports these conclusions?",
];

const receiptFields = [
  "Original user intention",
  "Delegation chain",
  "Information used",
  "Relevant policy and permissions",
  "Recommendation and alternatives",
  "Approvals and overrides",
  "Final action and outcome",
];

const metrics = [
  ["Delegation visibility", "Can users identify all downstream agents?"],
  ["Authority violations", "Did an agent act beyond its permissions?"],
  ["Intent preservation", "Did the final action match the original goal?"],
  ["Influence disclosure", "Were relevant conflicts surfaced?"],
  ["Approval accuracy", "Were genuinely consequential actions escalated?"],
  ["User comprehension", "Could the user explain why the action happened?"],
];

const agents = [
  ["Research Agent", "Finds opportunities — and may share personal data externally."],
  ["Ranking Agent", "Ranks roles — and may receive sponsored listings."],
  ["Resume Agent", "Modifies applications — and may exaggerate qualifications."],
  ["Outreach Agent", "Contacts recruiters — and may send without approval."],
];

export default function HowItWorksPage() {
  return (
    <>
      <SiteHeader />
      <main>
        <section className="border-b border-line">
          <div className="mx-auto max-w-3xl px-5 py-16">
            <p className="text-sm font-medium uppercase tracking-[0.08em] text-mute">
              Governance model
            </p>
            <h1 className="mt-3 font-serif text-4xl leading-tight text-ink md:text-5xl">
              How Sabha works
            </h1>
            <p className="mt-5 text-lg leading-relaxed text-ink2">
              Sabha sits between human intention and autonomous AI action. The
              agent proposes and executes. Sabha examines context, maps
              delegation, checks authority, exposes influence and presents
              competing perspectives. You keep the authority your permissions
              define.
            </p>
            <p className="mt-4 font-serif text-xl italic leading-snug text-maroon">
              Intelligence can be delegated. Authority should not be surrendered
              silently.
            </p>
          </div>
        </section>

        <section className="mx-auto max-w-3xl px-5 py-14">
          <h2 className="font-serif text-3xl text-ink">Living Memory</h2>
          <p className="mt-3 text-ink2">
            Corrects the information your agent uses. Intentions (experiment or
            lasting, hard limit or flexible), context you add, past behaviour and
            inferences, signal permissions, and your data — each with source,
            last confirmation, and whether it’s temporary or lasting.
          </p>
        </section>

        <section className="border-y border-line bg-bg-deep/30">
          <div className="mx-auto max-w-3xl px-5 py-14">
            <h2 className="font-serif text-3xl text-ink">Council</h2>
            <p className="mt-3 text-ink2">
              Challenges the reasoning from six defined roles. Convened on
              demand. Ends in a decision brief: strongest for and against,
              assumptions and gaps, alternatives, influence with evidence, and a
              suggested next step with stated uncertainty. It never votes.
            </p>
            <p className="mt-4 text-sm leading-relaxed text-ink2">
              Different named perspectives are not genuinely independent expert
              opinions by default. Meaningful diversity needs independent
              evidence, separate evaluations and, where possible, different
              models.
            </p>
            <ul className="mt-6 space-y-3">
              {seats.map(([name, q]) => (
                <li
                  key={name}
                  className="flex flex-col border-l-2 border-line pl-4 sm:flex-row sm:gap-3"
                >
                  <span className="font-medium text-ink">{name}</span>
                  <span className="text-ink2">{q}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="mx-auto max-w-3xl px-5 py-14">
          <h2 className="font-serif text-3xl text-ink">Gate</h2>
          <p className="mt-3 text-ink2">
            Scores stakes, reversibility, uncertainty, conflict with your
            intentions and emotional heat — then routes to Auto, Notify, Ask,
            Council or Only You. Hard limits are never relaxed without explicit
            confirmation. Heated purchases wait out a cooling period.
          </p>
        </section>

        <section className="border-y border-line bg-[linear-gradient(180deg,color-mix(in_srgb,var(--maroon)_5%,var(--bg))_0%,var(--bg)_100%)]">
          <div className="mx-auto max-w-3xl px-5 py-14">
            <p className="text-sm font-medium uppercase tracking-[0.08em] text-mute">
              Added capabilities
            </p>
            <h2 className="mt-3 font-serif text-3xl text-ink">
              Delegation Map
            </h2>
            <p className="mt-1 text-sm font-medium text-maroon">
              Who is doing what?
            </p>
            <p className="mt-3 text-ink2">
              Whenever a task is delegated, Sabha records the chain so you can
              inspect it — for example when a personal AI hands financial
              research to three downstream agents.
            </p>
            <ul className="mt-6 space-y-2">
              {delegationFields.map((field) => (
                <li key={field} className="border-t border-line pt-2 text-ink2">
                  {field}
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="mx-auto max-w-3xl px-5 py-14">
          <h2 className="font-serif text-3xl text-ink">Authority Registry</h2>
          <p className="mt-1 text-sm font-medium text-maroon">
            Who has permission to decide?
          </p>
          <p className="mt-3 text-ink2">
            Being capable of executing an action should not automatically mean
            being authorised to execute it.
          </p>
          <div className="mt-6 overflow-x-auto">
            <table className="w-full min-w-[22rem] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-line">
                  <th className="py-3 pr-4 font-medium text-mute">Authority</th>
                  <th className="py-3 font-medium text-mute">Meaning</th>
                </tr>
              </thead>
              <tbody>
                {authorityLevels.map(([level, meaning]) => (
                  <tr key={level} className="border-b border-line/70">
                    <td className="py-3 pr-4 font-medium text-ink">{level}</td>
                    <td className="py-3 text-ink2">{meaning}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="border-y border-line bg-bg-deep/30">
          <div className="mx-auto max-w-3xl px-5 py-14">
            <h2 className="font-serif text-3xl text-ink">
              Influence and Incentive Auditor
            </h2>
            <p className="mt-1 text-sm font-medium text-maroon">
              Who benefits if this is accepted?
            </p>
            <p className="mt-3 text-ink2">
              Council’s Influence Auditor expands into a fuller component. For
              every recommendation, Sabha asks:
            </p>
            <ul className="mt-6 space-y-2">
              {influenceChecks.map((item) => (
                <li key={item} className="border-t border-line pt-2 text-ink2">
                  {item}
                </li>
              ))}
            </ul>
            <p className="mt-6 text-ink2">
              Crucially, distinguish{" "}
              <span className="font-medium text-ink">verified</span>,{" "}
              <span className="font-medium text-ink">suspected</span> and{" "}
              <span className="font-medium text-ink">unknown</span> influence.
              Never present a suspicion as a proven conflict.
            </p>
          </div>
        </section>

        <section className="mx-auto max-w-3xl px-5 py-14">
          <h2 className="font-serif text-3xl text-ink">Governance Receipts</h2>
          <p className="mt-1 text-sm font-medium text-maroon">
            What actually happened?
          </p>
          <p className="mt-3 text-ink2">
            Every consequential action generates an auditable record —
            especially valuable when multiple agents are involved.
          </p>
          <ul className="mt-6 space-y-2">
            {receiptFields.map((field) => (
              <li key={field} className="border-t border-line pt-2 text-ink2">
                {field}
              </li>
            ))}
          </ul>
        </section>

        <section className="border-y border-line bg-bg-deep/40">
          <div className="mx-auto max-w-3xl px-5 py-14">
            <p className="text-sm font-medium uppercase tracking-[0.08em] text-mute">
              Proposed architecture
            </p>
            <h2 className="mt-3 font-serif text-3xl text-ink">
              Intention → governance → action → receipt
            </h2>
            <p className="mt-3 text-ink2">
              The current prototype simulates agent behaviour. A real enforcement
              layer would need integrations with agent frameworks, tool gateways
              and supported execution APIs.
            </p>
            <div className="mt-8">
              <ArchitectureDiagram />
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-3xl px-5 py-14">
          <p className="text-sm font-medium uppercase tracking-[0.08em] text-mute">
            First experiment
          </p>
          <h2 className="mt-3 font-serif text-3xl text-ink">
            Multi-Agent Job Search
          </h2>
          <p className="mt-3 text-ink2">
            Build one demonstrable scenario before the full architecture. The
            user asks: “Find me the best AI research engineering opportunities
            and apply to the top five.”
          </p>
          <ul className="mt-8 space-y-4">
            {agents.map(([name, detail]) => (
              <li key={name} className="border-t border-line pt-4">
                <p className="font-medium text-ink">{name}</p>
                <p className="mt-1 text-ink2">{detail}</p>
              </li>
            ))}
          </ul>
          <p className="mt-6 text-ink2">
            Sabha should identify where the user’s intention is being
            transformed, what authority was delegated, and whether the action is
            permissible.
          </p>
        </section>

        <section className="border-y border-line bg-[linear-gradient(180deg,color-mix(in_srgb,var(--green)_5%,var(--bg))_0%,var(--bg)_100%)]">
          <div className="mx-auto max-w-3xl px-5 py-14">
            <h2 className="font-serif text-3xl text-ink">What to measure</h2>
            <div className="mt-6 overflow-x-auto">
              <table className="w-full min-w-[28rem] border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-line">
                    <th className="py-3 pr-4 font-medium text-mute">Metric</th>
                    <th className="py-3 font-medium text-mute">
                      What it tells you
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {metrics.map(([metric, meaning]) => (
                    <tr key={metric} className="border-b border-line/70">
                      <td className="py-3 pr-4 font-medium text-ink">
                        {metric}
                      </td>
                      <td className="py-3 text-ink2">{meaning}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-8 text-ink2">
              Compare three conditions: baseline autonomous multi-agent
              workflow, ordinary safety guardrails, and Sabha. Evaluate how often
              users detect conflicts, understand decisions and prevent
              unauthorised actions.
            </p>
            <p className="mt-4 font-serif text-xl leading-snug text-ink">
              Governance of Multi-Agent Delegation: Measuring Informed Agency in
              Autonomous Workflows.
            </p>
            <p className="mt-4 text-ink2">
              The central research question: does a user-side governance layer
              measurably improve agency without making every interaction
              unnecessarily slow?
            </p>
          </div>
        </section>

        <section className="mx-auto max-w-3xl px-5 py-14">
          <h2 className="font-serif text-3xl text-ink">Where we start</h2>
          <p className="mt-3 text-ink2">
            Purchase decisions first: budgets, alternatives, sponsorship and
            execution fit in one journey. Then routines, relationships and
            multi-agent delegation. V1 does not claim to read an agent’s hidden
            reasoning, catch every ad, or override hard limits.
          </p>
          <div className="mt-10 flex flex-wrap gap-3">
            <Link
              href="/demo"
              className="inline-flex h-11 items-center rounded-full bg-green px-5 text-sm font-medium text-bg hover:bg-ink"
            >
              Try the demo
            </Link>
            <Link
              href="/#waitlist"
              className="inline-flex h-11 items-center rounded-full border border-line bg-card px-5 text-sm font-medium text-ink hover:border-ink2"
            >
              Join early access
            </Link>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
