import type { LedgerEntry } from "@sabha/core";
import demoLedger from "@/data/demoLedger.json";

export type MemoryTab =
  | "intentions"
  | "context"
  | "past"
  | "exceptions"
  | "signals";

/** Fixture-backed ledger vendored for Vercel (`apps/web` root). */
export function loadFixtureLedger(): LedgerEntry[] {
  return demoLedger as LedgerEntry[];
}

export function tabFor(entry: LedgerEntry): MemoryTab {
  if (entry.kind === "intention") return "intentions";
  if (entry.kind === "context") return "context";
  if (entry.kind === "exception") return "exceptions";
  if (entry.subject?.startsWith("signals.")) return "signals";
  return "past";
}

export function ageLabel(iso: string): string {
  const days = Math.max(
    0,
    Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000),
  );
  if (days === 0) return "today";
  if (days === 1) return "1 day ago";
  if (days < 30) return `${days} days ago`;
  return `${Math.floor(days / 30)} mo ago`;
}
