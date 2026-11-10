import Link from "next/link";
import { Mark } from "./Mark";

export function SiteFooter() {
  return (
    <footer className="border-t border-line bg-bg-deep/50">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-5 py-10 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Mark />
          <p className="mt-3 max-w-sm text-sm text-ink2">
            See the reasoning before your AI agent acts. Challenge it. Keep the
            authority your permissions define.
          </p>
        </div>
        <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-ink2">
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
      <div className="border-t border-line/70 px-5 py-4 text-center text-xs text-mute">
        © 2026 Sabha. Built for people who want informed agency over their AI.
      </div>
    </footer>
  );
}
