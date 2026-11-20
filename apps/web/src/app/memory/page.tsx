import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { MotifRule } from "@/components/CarpetFrame";
import { loadFixtureLedger } from "@/lib/demoMemory";
import { MemoryBrowser } from "./MemoryBrowser";

export const metadata: Metadata = {
  title: "Living Memory",
  description:
    "Intentions, context, past behaviour, exceptions and signal permissions — Sabha’s user-owned ledger.",
};

export default function MemoryPage() {
  const entries = loadFixtureLedger();

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-5 py-14">
        <p className="eyebrow">Living Memory</p>
        <h1 className="mt-3 font-serif text-4xl font-medium text-ink">
          What Sabha believes is true about you
        </h1>
        <p className="mt-4 text-ink2">
          Typed entries with source, age and heat. You own this ledger — agents
          may read what you allow; only you write lasting truth.
        </p>
        <MotifRule className="mt-8 opacity-55" />

        <Suspense fallback={<p className="mt-8 text-ink2">Loading memory…</p>}>
          <MemoryBrowser entries={entries} />
        </Suspense>

        <p className="mt-12 text-sm text-mute">
          Showing fixture-backed ledger for now. Production writes go through{" "}
          <code>addEntry</code> + ripple confirmation.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/memory/ripple" className="btn-primary">
            Review ripple
          </Link>
          <Link href="/demo" className="btn-secondary">
            Open interactive demo
          </Link>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
