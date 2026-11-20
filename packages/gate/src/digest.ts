import type { Finding } from "@sabha/core";

export type DigestItem = {
  finding: Finding;
  actionId: string;
  queuedAt: string;
};

/**
 * Low-stakes findings (severity 1) that were not asked go into the evening digest.
 * Higher severities must not be digest-only (sim asserts this).
 */
export function shouldQueueForDigest(finding: Finding): boolean {
  return finding.severity === 1;
}

export function queueForDigest(
  items: DigestItem[],
  finding: Finding,
  actionId: string,
  now: Date | string = new Date(),
): DigestItem[] {
  if (!shouldQueueForDigest(finding)) return items;
  const queuedAt =
    typeof now === "string" ? now : now.toISOString();
  return [...items, { finding, actionId, queuedAt }];
}

export function buildEveningDigest(items: DigestItem[]): {
  summary: string;
  stillTruePrompts: string[];
  count: number;
} {
  const stillTruePrompts = items
    .flatMap((i) => i.finding.evidence)
    .filter((id) => id.startsWith("le_"))
    .slice(0, 20);
  return {
    count: items.length,
    summary:
      items.length === 0
        ? "Nothing quiet to review tonight."
        : `${items.length} low-stakes note(s) from today — still true?`,
    stillTruePrompts,
  };
}
