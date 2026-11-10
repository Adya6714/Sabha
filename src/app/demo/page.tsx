import Link from "next/link";
import type { Metadata } from "next";
import { Mark } from "@/components/Mark";

export const metadata: Metadata = {
  title: "Interactive demo",
  description:
    "Walk through Sabha on a day of AI agent decisions — Living Memory, Council, Gate, and the Informed Agency Rate.",
};

export default function DemoPage() {
  return (
    <div className="flex h-dvh flex-col bg-bg">
      <header className="flex shrink-0 items-center justify-between gap-3 border-b border-line px-4 py-2.5">
        <div className="flex items-center gap-3">
          <Link href="/" aria-label="Back to Sabha home">
            <Mark className="scale-90 origin-left" />
          </Link>
          <span className="hidden text-sm text-mute sm:inline">
            Interactive demo · simulated agent and data
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/how-it-works"
            className="rounded-full px-3 py-1.5 text-sm text-ink2 hover:bg-soft"
          >
            How it works
          </Link>
          <Link
            href="/#waitlist"
            className="rounded-full bg-maroon px-3.5 py-1.5 text-sm font-medium text-bg hover:bg-ink"
          >
            Early access
          </Link>
        </div>
      </header>
      <iframe
        title="Sabha interactive demo"
        src="/try/index.html"
        className="h-full w-full flex-1 border-0 bg-bg"
      />
    </div>
  );
}
