import Link from "next/link";
import { Mark } from "./Mark";

const links = [
  { href: "/memory", label: "Memory" },
  { href: "/approvals", label: "Approvals" },
  { href: "/settings", label: "Keys" },
  { href: "/how-it-works", label: "How it works" },
  { href: "/demo", label: "Demo" },
  { href: "/#waitlist", label: "Early access" },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-line/70 bg-bg/90 backdrop-blur-md sm:top-[var(--frame)]">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-5">
        <Link href="/" aria-label="Sabha home">
          <Mark />
        </Link>
        <nav className="flex items-center gap-1 text-sm text-ink2">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`px-3 py-1.5 transition-colors hover:text-ink ${
                link.href === "/settings" ? "inline-flex" : "hidden sm:inline-flex"
              }`}
            >
              {link.label}
            </Link>
          ))}
          <Link href="/demo" className="btn-primary ml-2 h-9 px-3.5 text-sm">
            Try demo
          </Link>
        </nav>
      </div>
    </header>
  );
}
