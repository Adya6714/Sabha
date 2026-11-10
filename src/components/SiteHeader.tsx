import Link from "next/link";
import { Mark } from "./Mark";

const links = [
  { href: "/how-it-works", label: "How it works" },
  { href: "/demo", label: "Demo" },
  { href: "/#waitlist", label: "Early access" },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-line/80 bg-bg/85 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-5">
        <Link href="/" aria-label="Sabha home">
          <Mark />
        </Link>
        <nav className="flex items-center gap-1 text-sm text-ink2">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="hidden rounded-full px-3 py-1.5 transition-colors hover:bg-soft hover:text-ink sm:inline-flex"
            >
              {link.label}
            </Link>
          ))}
          <Link
            href="/demo"
            className="ml-1 rounded-full bg-green px-3.5 py-1.5 font-medium text-bg transition-colors hover:bg-ink"
          >
            Try demo
          </Link>
        </nav>
      </div>
    </header>
  );
}
