import type { Metadata } from "next";
import Link from "next/link";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { MotifRule } from "@/components/CarpetFrame";
import { loadFixtureLedger } from "@/lib/demoMemory";
import { buildRipplePreview } from "@/lib/rippleClient";

export const metadata: Metadata = {
  title: "Confirm ripple",
  description: "One screen to update, keep, or defer related ledger items.",
};

export default function RipplePage() {
  const ledger = loadFixtureLedger();
  const trigger =
    ledger.find(
      (e) => e.kind === "intention" && e.source.origin === "user_stated",
    ) ?? ledger[0];

  const candidates = trigger
    ? ledger.filter((e) => e.id !== trigger.id).slice(0, 12)
    : [];
  const screen = trigger ? buildRipplePreview(trigger, candidates) : null;

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-5 py-14">
        <p className="eyebrow">Ripple</p>
        <h1 className="mt-3 font-serif text-4xl font-medium text-ink">
          What else might need updating?
        </h1>
        <p className="mt-4 text-ink2">
          {screen?.summary ??
            "State a change to see related ledger items here."}
        </p>
        <MotifRule className="mt-8 opacity-55" />

        {trigger ? (
          <p className="mt-8 text-sm text-ink2">
            Trigger: <span className="text-ink">{trigger.claim}</span>
          </p>
        ) : null}

        <ul className="mt-8 space-y-6">
          {(screen?.items ?? [])
            .filter((i) => i.classification !== "unaffected")
            .map((item) => {
              const entry = candidates.find((c) => c.id === item.entryId);
              return (
                <li key={item.entryId} className="border-t border-line pt-4">
                  <p className="font-medium text-ink">
                    {entry?.claim ?? item.entryId}
                  </p>
                  <p className="mt-1 text-sm text-maroon">{item.classification}</p>
                  <p className="mt-1 text-sm text-ink2">{item.reason}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button type="button" className="btn-primary h-9 text-sm">
                      Update
                    </button>
                    <button type="button" className="btn-secondary h-9 text-sm">
                      Keep
                    </button>
                    <button type="button" className="btn-secondary h-9 text-sm">
                      Later
                    </button>
                  </div>
                </li>
              );
            })}
        </ul>

        <p className="mt-10 text-sm text-mute">
          Buttons are wired for UI contract; persisting choices needs{" "}
          <code>DATABASE_URL</code> + <code>confirmRipple</code>.
        </p>
        <div className="mt-6 flex gap-3">
          <Link href="/memory" className="btn-secondary">
            Back to Living Memory
          </Link>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
