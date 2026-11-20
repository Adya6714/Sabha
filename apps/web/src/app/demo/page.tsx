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
    <div className="flex h-[calc(100dvh-2*var(--frame))] flex-col bg-bg max-sm:h-dvh">
      <header className="flex shrink-0 items-center justify-between gap-3 border-b border-line px-4 py-2.5">
        <div className="flex items-center gap-3">
          <Link href="/" aria-label="Back to Sabha home">
            <Mark className="origin-left scale-90" />
          </Link>
          <span className="hidden text-sm text-mute sm:inline">
            Interactive demo · simulated agent and data
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/how-it-works"
            className="px-3 py-1.5 text-sm text-ink2 hover:text-ink"
          >
            How it works
          </Link>
          <Link href="/#waitlist" className="btn-primary h-9 px-3.5 text-sm">
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
