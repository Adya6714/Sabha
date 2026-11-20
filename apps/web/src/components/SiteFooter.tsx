import Link from "next/link";
import { Mark } from "./Mark";
import { MotifRule } from "./CarpetFrame";

export function SiteFooter() {
  return (
    <footer className="border-t border-line bg-bg-deep/40">
      <div className="mx-auto max-w-6xl px-5 pt-8">
        <MotifRule className="mb-8 opacity-70" />
      </div>
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-5 pb-10 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Mark />
          <p className="mt-3 max-w-sm text-sm leading-relaxed text-ink2">
            A governance layer between human intention and autonomous AI action.
            Intelligence can be delegated. Authority should not be surrendered
            silently.
          </p>
        </div>
        <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-ink2">
          <Link href="/settings" className="hover:text-ink">
            Your keys
          </Link>
          <Link href="/how-it-works" className="hover:text-ink">
            How it works
          </Link>
          <Link href="/demo" className="hover:text-ink">
            Demo
          </Link>
          <Link href="/privacy" className="hover:text-ink">
            Privacy
          </Link>
          <a
            href="https://github.com/Adya6714/Sabha"
            className="hover:text-ink"
            target="_blank"
            rel="noreferrer"
          >
            GitHub
          </a>
        </div>
      </div>
      <div className="border-t border-line/70 px-5 py-4 text-center text-xs tracking-wide text-mute">
        © 2026 Sabha. Built for people who want informed agency over their AI.
      </div>
    </footer>
  );
}
