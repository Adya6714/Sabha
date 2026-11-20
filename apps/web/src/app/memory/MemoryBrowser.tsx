"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  ageLabel,
  tabFor,
  type MemoryTab,
} from "@/lib/demoMemory";
import type { LedgerEntry } from "@sabha/core";

const TABS: { id: MemoryTab; label: string }[] = [
  { id: "intentions", label: "Intentions" },
  { id: "context", label: "Context you added" },
  { id: "past", label: "Past and inferred" },
  { id: "exceptions", label: "Exceptions" },
  { id: "signals", label: "Signal permissions" },
];

export function MemoryBrowser({ entries }: { entries: LedgerEntry[] }) {
  const sp = useSearchParams();
  const raw = sp.get("tab");
  const tab = (TABS.some((t) => t.id === raw) ? raw : "intentions") as MemoryTab;
  const shown = entries.filter((e) => tabFor(e) === tab);

  return (
    <>
      <div className="mt-8 flex flex-wrap gap-2 border-b border-line pb-3">
        {TABS.map((t) => (
          <Link
            key={t.id}
            href={`/memory?tab=${t.id}`}
            className={`px-3 py-1.5 text-sm ${
              tab === t.id
                ? "border-b-2 border-maroon font-semibold text-ink"
                : "text-ink2 hover:text-ink"
            }`}
          >
            {t.label}
          </Link>
        ))}
      </div>

      <ul className="mt-8 space-y-5">
        {shown.length === 0 ? (
          <li className="text-ink2">No entries in this tab yet.</li>
        ) : (
          shown.map((entry) => (
            <li key={entry.id} className="border-t border-line pt-4">
              <p className="font-medium text-ink">{entry.claim}</p>
              <p className="mt-1 text-sm text-ink2">
                <span className="text-maroon">{entry.kind}</span>
                {" · "}
                {entry.source.origin}
                {" · "}
                {ageLabel(entry.source.at)}
                {entry.source.heat ? ` · heat ${entry.source.heat}` : ""}
                {entry.hardness ? ` · ${entry.hardness}` : ""}
              </p>
              <form action="/api/memory/still-true" method="post" className="mt-3">
                <input type="hidden" name="id" value={entry.id} />
                <button type="submit" className="btn-secondary h-9 text-sm">
                  Still true?
                </button>
              </form>
            </li>
          ))
        )}
      </ul>
    </>
  );
}
