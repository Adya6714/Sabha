import Link from "next/link";
import { ArchitectureDiagram } from "@/components/ArchitectureDiagram";
import { MotifRule } from "@/components/CarpetFrame";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { WaitlistForm } from "@/components/WaitlistForm";

const capabilities = [
  {
    name: "Delegation Map",
    line: "Who is doing what?",
    detail:
      "Records which agent received the task, which model or provider it uses, what information passed downstream, permissions at each layer, and who is accountable for the final action.",
  },
  {
    name: "Authority Registry",
    line: "Who has permission to decide?",
    detail:
      "An explicit model: Observe, Recommend, Prepare, Execute, Escalate. Capability to act is never mistaken for authority to act.",
  },
  {
    name: "Influence & Incentive Auditor",
    line: "Who benefits if this is accepted?",
    detail:
      "Surfaces conflicts, sponsored placements and platform goals — distinguishing verified, suspected and unknown influence. Never presents suspicion as proof.",
  },
  {
    name: "Governance Receipts",
    line: "What actually happened?",
    detail:
      "Every consequential action leaves an auditable record: intention, delegation chain, information used, policy, recommendations, approvals, final action and outcome.",
  },
];

const foundations = [
  {
    name: "Living Memory",
    line: "Corrects the information.",
    detail:
      "Intentions, context you add, past behaviour and inferences stay separate — with source, freshness and signal permissions.",
  },
  {
    name: "Council",
    line: "Challenges the reasoning.",
    detail:
      "Independent challenges and evidence, not renamed opinions. Ends in a decision brief. It never votes. You decide.",
  },
  {
    name: "Gate",
    line: "Enforces your decision.",
    detail:
      "Stakes, reversibility, uncertainty, intention conflict and emotional heat route to Auto, Ask, Council or Only You.",
  },
];

const metrics = [
  ["Delegation visibility", "Can users identify all downstream agents?"],
  ["Authority violations", "Did an agent act beyond its permissions?"],
  ["Intent preservation", "Did the final action match the original goal?"],
  ["Influence disclosure", "Were relevant conflicts surfaced?"],
  ["Approval accuracy", "Were consequential actions escalated?"],
  ["User comprehension", "Could the user explain why the action happened?"],
];

export default function HomePage() {
  return (
    <>
      <SiteHeader />
      <main>
        <section className="relative overflow-hidden border-b border-line">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_12%_0%,rgba(196,163,90,0.12),transparent_42%),radial-gradient(ellipse_at_90%_10%,rgba(31,74,69,0.08),transparent_40%)]"
          />
          <div
            aria-hidden
            className="atmosphere-dot pointer-events-none absolute -right-16 top-24 h-64 w-64 rounded-full bg-gold/10 blur-3xl"
          />
          <div className="relative mx-auto flex min-h-[calc(100vh-3.5rem-var(--frame))] max-w-6xl flex-col justify-center px-5 py-16 md:py-20">
            <p className="animate-rise font-serif text-6xl font-semibold tracking-[0.02em] text-maroon sm:text-7xl md:text-8xl">
              Sabha
            </p>
            <h1 className="animate-rise-delay mt-6 max-w-3xl font-serif text-3xl font-medium leading-[1.12] text-ink sm:text-4xl md:text-[2.75rem]">
              A governance layer between human intention and autonomous AI
              action.
            </h1>
            <p className="animate-rise-late mt-5 max-w-xl text-lg leading-relaxed text-ink2">
              When AI systems act on behalf of people, their authority,
              incentives, assumptions and decision-making remain visible,
              contestable and accountable.
            </p>
            <div className="animate-rise-late mt-9 flex flex-wrap items-center gap-3">
              <Link href="/demo" className="btn-primary">
                Try the interactive demo
              </Link>
              <a href="#waitlist" className="btn-secondary">
                Join early access
              </a>
            </div>
            <MotifRule className="mt-14 opacity-60" />
          </div>
        </section>

        <section className="border-b border-line">
          <div className="mx-auto max-w-6xl px-5 py-20">
            <p className="eyebrow">The core principle</p>
            <blockquote className="mt-4 max-w-3xl font-serif text-3xl font-medium leading-snug text-ink md:text-4xl">
              Intelligence can be delegated. Authority should not be surrendered
              silently.
            </blockquote>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-5 py-20">
          <p className="eyebrow">Foundations</p>
          <h2 className="mt-3 max-w-2xl font-serif text-3xl font-medium leading-snug text-ink md:text-4xl">
            Three layers that already examine, challenge and enforce.
          </h2>
          <div className="mt-12 grid gap-10 md:grid-cols-3">
            {foundations.map((item) => (
              <div key={item.name} className="border-t border-gold/50 pt-5">
                <h3 className="font-serif text-2xl font-medium text-ink">
                  {item.name}
                </h3>
                <p className="mt-1 text-sm font-semibold text-green">
                  {item.line}
                </p>
                <p className="mt-3 text-[15px] leading-relaxed text-ink2">
                  {item.detail}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="border-y border-line bg-bg-deep/35">
          <div className="mx-auto max-w-6xl px-5 py-20">
            <p className="eyebrow">Four capabilities</p>
            <h2 className="mt-3 max-w-2xl font-serif text-3xl font-medium leading-snug text-ink md:text-4xl">
              Making multi-agent authority inspectable end to end.
            </h2>
            <div className="mt-12 grid gap-10 sm:grid-cols-2">
              {capabilities.map((item) => (
                <div key={item.name} className="border-t border-line pt-5">
                  <h3 className="font-serif text-2xl font-medium text-ink">
                    {item.name}
                  </h3>
                  <p className="mt-1 text-sm font-semibold text-maroon">
                    {item.line}
                  </p>
                  <p className="mt-3 text-[15px] leading-relaxed text-ink2">
                    {item.detail}
                  </p>
                </div>
              ))}
            </div>
            <Link
              href="/how-it-works"
              className="mt-10 inline-flex text-sm font-semibold text-maroon underline-offset-4 hover:underline"
            >
              Read the full governance model →
            </Link>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-5 py-20">
          <p className="eyebrow">Proposed architecture</p>
          <h2 className="mt-3 max-w-2xl font-serif text-3xl font-medium leading-snug text-ink md:text-4xl">
            From intention to receipt — with permission checked in between.
          </h2>
          <p className="mt-4 max-w-2xl text-ink2">
            A real enforcement layer needs integrations with agent frameworks,
            tool gateways and execution APIs. The diagram is the target, not a
            claim about what the repository already implements.
          </p>
          <div className="mt-10">
            <ArchitectureDiagram />
          </div>
        </section>

        <section className="border-y border-line bg-bg-deep/30">
          <div className="mx-auto max-w-6xl px-5 py-20">
            <p className="eyebrow">First experiment</p>
            <h2 className="mt-3 max-w-2xl font-serif text-3xl font-medium leading-snug text-ink md:text-4xl">
              The Multi-Agent Job Search Experiment
            </h2>
            <p className="mt-4 max-w-2xl text-ink2">
              A user asks: “Find me the best AI research engineering
              opportunities and apply to the top five.” Research, Ranking,
              Resume and Outreach agents collaborate — then conflicts appear.
            </p>
            <ul className="mt-8 max-w-2xl space-y-3 text-[15px] text-ink2">
              {[
                "Ranking receives sponsored job listings.",
                "Resume exaggerates a qualification.",
                "Outreach sends a message without approval.",
                "Research shares personal information with an external service.",
              ].map((item) => (
                <li
                  key={item}
                  className="border-l-2 border-gold/70 pl-4 leading-relaxed"
                >
                  {item}
                </li>
              ))}
            </ul>
            <p className="mt-6 max-w-2xl text-ink2">
              Sabha should identify where intention is transformed, what
              authority was delegated, and whether the action is permissible.
            </p>
            <div className="mt-12 overflow-x-auto">
              <table className="w-full min-w-[32rem] border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-gold/40">
                    <th className="py-3 pr-4 font-semibold tracking-wide text-mute">
                      Metric
                    </th>
                    <th className="py-3 font-semibold tracking-wide text-mute">
                      What it tells you
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {metrics.map(([metric, meaning]) => (
                    <tr key={metric} className="border-b border-line/70">
                      <td className="py-3 pr-4 font-semibold text-ink">
                        {metric}
                      </td>
                      <td className="py-3 text-ink2">{meaning}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-8 max-w-2xl text-sm leading-relaxed text-ink2">
              Compare baseline autonomy, ordinary safety guardrails and Sabha —
              and ask whether a user-side governance layer improves agency
              without making every interaction unnecessarily slow. Research
              framing:{" "}
              <em className="font-serif text-ink">
                Governance of Multi-Agent Delegation: Measuring Informed Agency
                in Autonomous Workflows.
              </em>
            </p>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-5 py-20">
          <p className="eyebrow">Prototype today</p>
          <h2 className="mt-3 max-w-2xl font-serif text-3xl font-medium leading-snug text-ink md:text-4xl">
            See Living Memory, Council and Gate on a day of decisions.
          </h2>
          <div className="mt-10 overflow-hidden border border-line bg-card">
            <div className="flex items-center gap-3 border-b border-line px-5 py-3 text-sm text-mute">
              <span
                aria-hidden
                className="inline-block h-2 w-8 bg-[url('/motifs/carpet-band.svg')] bg-cover"
              />
              Interactive demo · simulated agent and data
            </div>
            <iframe
              title="Sabha demo preview"
              src="/try/index.html"
              className="h-[520px] w-full bg-bg"
            />
          </div>
          <div className="mt-6">
            <Link href="/demo" className="btn-primary">
              Open full demo
            </Link>
          </div>
        </section>

        <section id="waitlist" className="border-t border-line">
          <div className="mx-auto max-w-6xl px-5 py-20">
            <MotifRule className="mb-10 opacity-55" />
            <h2 className="max-w-xl font-serif text-3xl font-medium leading-snug text-ink md:text-4xl">
              Early access for people who want AI authority kept visible.
            </h2>
            <p className="mt-4 max-w-xl text-ink2">
              We’re starting with purchase decisions — budgets, alternatives,
              sponsorship and execution in one journey — then expanding toward
              multi-agent delegation, authority and receipts. If you already
              have access, add your own model keys. Calls stop before ₹100
              combined.
            </p>
            <p className="mt-4">
              <Link href="/settings" className="text-maroon underline">
                Add your keys
              </Link>
            </p>
            <div className="mt-8">
              <WaitlistForm />
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
