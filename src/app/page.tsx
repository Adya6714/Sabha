import Link from "next/link";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { WaitlistForm } from "@/components/WaitlistForm";

const failureModes = [
  {
    tag: "Human context",
    text: "The agent sees the argument, misses the reconciliation.",
  },
  {
    tag: "Human growth",
    text: "It predicts tomorrow from yesterday’s habits.",
  },
  {
    tag: "Decision flexibility",
    text: "A budget becomes an instruction to stop thinking.",
  },
  {
    tag: "Commercial influence",
    text: "Sponsorship or emotional state shapes a pick you never see.",
  },
];

const pillars = [
  {
    name: "Living Memory",
    line: "Corrects the information.",
    detail:
      "Intentions, context you add, past behaviour and inferences stay separate — with source, freshness, and signal permissions.",
  },
  {
    name: "Council",
    line: "Challenges the reasoning.",
    detail:
      "Six roles examine the proposal and end in a decision brief. It never votes. You decide.",
  },
  {
    name: "Gate",
    line: "Enforces your decision.",
    detail:
      "Stakes, reversibility, uncertainty, intention conflict and emotional heat route to Auto, Ask, Council or Only You.",
  },
];

export default function HomePage() {
  return (
    <>
      <SiteHeader />
      <main>
        <section className="relative overflow-hidden border-b border-line">
          <div
            aria-hidden
            className="atmosphere pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_20%_20%,rgba(155,59,42,0.12),transparent_45%),radial-gradient(ellipse_at_80%_10%,rgba(36,82,74,0.14),transparent_40%),linear-gradient(180deg,var(--bg)_0%,var(--bg-deep)_100%)]"
          />
          <div
            aria-hidden
            className="atmosphere-dot pointer-events-none absolute -right-16 top-24 h-72 w-72 rounded-full bg-maroon/10 blur-3xl"
          />
          <div className="relative mx-auto flex min-h-[calc(100vh-3.5rem)] max-w-6xl flex-col justify-center px-5 py-16 md:py-20">
            <p className="animate-rise font-serif text-5xl tracking-tight text-maroon sm:text-6xl md:text-7xl">
              Sabha
            </p>
            <h1 className="animate-rise-delay mt-5 max-w-3xl font-serif text-3xl leading-[1.15] text-ink sm:text-4xl md:text-5xl">
              See the reasoning before your AI agent acts.
            </h1>
            <p className="animate-rise-late mt-5 max-w-xl text-lg leading-relaxed text-ink2">
              Sabha makes assumptions, trade-offs and commercial influence
              visible — then lets you challenge them and decide what gets acted
              on.
            </p>
            <div className="animate-rise-late mt-9 flex flex-wrap items-center gap-3">
              <Link
                href="/demo"
                className="inline-flex h-12 items-center rounded-full bg-green px-6 text-[15px] font-medium text-bg transition-transform hover:-translate-y-0.5 hover:bg-ink"
              >
                Try the interactive demo
              </Link>
              <a
                href="#waitlist"
                className="inline-flex h-12 items-center rounded-full border border-line bg-card/70 px-6 text-[15px] font-medium text-ink transition-colors hover:border-ink2"
              >
                Join early access
              </a>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-5 py-20">
          <p className="text-sm font-medium uppercase tracking-[0.08em] text-mute">
            The problem
          </p>
          <h2 className="mt-3 max-w-2xl font-serif text-3xl leading-snug text-ink md:text-4xl">
            Agents act on an incomplete picture of who you are.
          </h2>
          <p className="mt-4 max-w-2xl text-ink2">
            People delegating consequential decisions lack a reliable way to
            examine assumptions, competing perspectives and commercial influence
            before the agent acts.
          </p>
          <ul className="mt-12 grid gap-8 sm:grid-cols-2">
            {failureModes.map((mode) => (
              <li key={mode.tag} className="border-t border-line pt-4">
                <p className="text-xs font-semibold uppercase tracking-[0.06em] text-maroon">
                  {mode.tag}
                </p>
                <p className="mt-2 text-[17px] leading-snug text-ink">{mode.text}</p>
              </li>
            ))}
          </ul>
        </section>

        <section className="border-y border-line bg-bg-deep/40">
          <div className="mx-auto max-w-6xl px-5 py-20">
            <p className="text-sm font-medium uppercase tracking-[0.08em] text-mute">
              How Sabha works
            </p>
            <h2 className="mt-3 max-w-2xl font-serif text-3xl leading-snug text-ink md:text-4xl">
              Three layers between your agent and irreversible action.
            </h2>
            <div className="mt-12 grid gap-10 md:grid-cols-3">
              {pillars.map((pillar) => (
                <div key={pillar.name} className="border-t-2 border-line pt-5">
                  <h3 className="font-serif text-2xl text-ink">{pillar.name}</h3>
                  <p className="mt-1 text-sm font-medium text-green">{pillar.line}</p>
                  <p className="mt-3 text-[15px] leading-relaxed text-ink2">
                    {pillar.detail}
                  </p>
                </div>
              ))}
            </div>
            <Link
              href="/how-it-works"
              className="mt-10 inline-flex text-sm font-medium text-maroon underline-offset-4 hover:underline"
            >
              Read the full product story →
            </Link>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-5 py-20">
          <p className="text-sm font-medium uppercase tracking-[0.08em] text-mute">
            North star
          </p>
          <h2 className="mt-3 max-w-2xl font-serif text-3xl leading-snug text-ink md:text-4xl">
            Informed Agency Rate
          </h2>
          <p className="mt-4 max-w-2xl text-ink2">
            The share of consequential decisions where intentions were surfaced,
            alternatives shown, influence disclosed, you chose before execution,
            and the action stayed within your permissions. More information alone
            doesn’t count.
          </p>
          <div className="mt-10 overflow-hidden rounded-2xl border border-line bg-card shadow-[0_20px_60px_-40px_rgba(43,39,34,0.45)]">
            <div className="border-b border-line px-5 py-3 text-sm text-mute">
              Interactive demo · Aarav’s day with an AI agent
            </div>
            <iframe
              title="Sabha demo preview"
              src="/try/index.html"
              className="h-[520px] w-full bg-bg"
            />
          </div>
          <div className="mt-6">
            <Link
              href="/demo"
              className="inline-flex h-11 items-center rounded-full bg-ink px-5 text-sm font-medium text-bg hover:bg-green"
            >
              Open full demo
            </Link>
          </div>
        </section>

        <section
          id="waitlist"
          className="border-t border-line bg-[linear-gradient(160deg,var(--bg)_0%,color-mix(in_srgb,var(--maroon)_8%,var(--bg))_100%)]"
        >
          <div className="mx-auto max-w-6xl px-5 py-20">
            <h2 className="max-w-xl font-serif text-3xl leading-snug text-ink md:text-4xl">
              Early access for people who want their AI accountable.
            </h2>
            <p className="mt-4 max-w-xl text-ink2">
              We’re starting with purchase decisions — budgets, alternatives,
              sponsorship and execution in one journey — then expanding to
              routines and relationships.
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
