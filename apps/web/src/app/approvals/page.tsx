import type { Metadata } from "next";
import Link from "next/link";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { MotifRule } from "@/components/CarpetFrame";

export const metadata: Metadata = {
  title: "Approvals",
  description: "Holds awaiting your decision — ask, delay, council, only-you.",
};

export default function ApprovalsPage() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-5 py-14">
        <p className="eyebrow">Approvals</p>
        <h1 className="mt-3 font-serif text-4xl font-medium text-ink">
          Inbox of holds
        </h1>
        <p className="mt-4 text-ink2">
          When Gate chooses ask, delay, council or only-you, actions wait here.
          Expiry never means execute.
        </p>
        <MotifRule className="mt-8 opacity-55" />

        <div className="mt-10 border-t border-line pt-6 text-ink2">
          <p>No pending holds in this environment.</p>
          <p className="mt-3 text-sm text-mute">
            Holds show up here when an agent checks an action with your Sabha
            key. Create that key, and add your own model keys, on{" "}
            <Link href="/settings" className="text-maroon underline">
              Your keys
            </Link>
            . Gmail and Calendar are not part of this early access. Until an
            agent is connected, try the{" "}
            <Link href="/demo" className="text-maroon underline">
              interactive demo
            </Link>
            .
          </p>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
