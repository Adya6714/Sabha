import Link from "next/link";
import type { Metadata } from "next";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";

export const metadata: Metadata = {
  title: "How it works",
  description:
    "Living Memory, Council and Gate — how Sabha makes AI agent reasoning visible and keeps you in control.",
};

const seats = [
  ["Present Self", "What do you want now?"],
  ["Future Self", "What happens later?"],
  ["Values & Commitments", "What must not be compromised?"],
  ["The Skeptic", "What might be missing?"],
  ["The Optimizer", "What alternatives exist?"],
  ["Influence Auditor", "Who benefits?"],
];

export default function HowItWorksPage() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-5 py-16">
        <p className="text-sm font-medium uppercase tracking-[0.08em] text-mute">
          Product
        </p>
        <h1 className="mt-3 font-serif text-4xl leading-tight text-ink md:text-5xl">
          How Sabha works
        </h1>
        <p className="mt-5 text-lg leading-relaxed text-ink2">
          The agent proposes and executes. Sabha examines the proposal, checks
          context, exposes influences and presents competing perspectives. You
          understand the reasoning and keep the authority your permissions
          define.
        </p>

        <section className="mt-14 border-t border-line pt-10">
          <h2 className="font-serif text-3xl text-ink">Living Memory</h2>
          <p className="mt-3 text-ink2">
            Corrects the information your agent uses. Intentions (experiment or
            lasting, hard limit or flexible), context you add, past behaviour and
            inferences, signal permissions, and your data — each with source,
            last confirmation, and whether it’s temporary or lasting.
          </p>
        </section>

        <section className="mt-12 border-t border-line pt-10">
          <h2 className="font-serif text-3xl text-ink">Council</h2>
          <p className="mt-3 text-ink2">
            Challenges the reasoning from six defined roles. Convened on demand.
            Ends in a decision brief: strongest for and against, assumptions and
            gaps, alternatives, influence with evidence, and a suggested next
            step with stated uncertainty. It never votes.
          </p>
          <ul className="mt-6 space-y-3">
            {seats.map(([name, q]) => (
              <li key={name} className="flex flex-col border-l-2 border-line pl-4 sm:flex-row sm:gap-3">
                <span className="font-medium text-ink">{name}</span>
                <span className="text-ink2">{q}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-12 border-t border-line pt-10">
          <h2 className="font-serif text-3xl text-ink">Gate</h2>
          <p className="mt-3 text-ink2">
            Scores stakes, reversibility, uncertainty, conflict with your
            intentions and emotional heat — then routes to Auto, Notify, Ask,
            Council or Only You. Hard limits are never relaxed without explicit
            confirmation. Heated purchases wait out a cooling period.
          </p>
        </section>

        <section className="mt-12 border-t border-line pt-10">
          <h2 className="font-serif text-3xl text-ink">Where we start</h2>
          <p className="mt-3 text-ink2">
            Purchase decisions first: budgets, alternatives, sponsorship and
            execution fit in one journey. Then routines and relationships. V1
            does not claim to read an agent’s hidden reasoning, catch every ad,
            or override hard limits.
          </p>
        </section>

        <div className="mt-14 flex flex-wrap gap-3">
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
      </main>
      <SiteFooter />
    </>
  );
}
