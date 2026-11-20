import type { EntryKind, LedgerEntry } from "@sabha/core";

export type StaleResult = {
  stale: boolean;
  reason?: string;
};

export type DecayOverrides = {
  /** Emotional-event half-life in days (default 7). */
  emotionalHalfLifeDays?: number;
};

const DEFAULT_EMOTIONAL_HALF_LIFE_DAYS = 7;

function daysBetween(from: Date, to: Date): number {
  return (to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24);
}

/**
 * Decay rules by entry kind (Phase 1.1).
 * Starting defaults — users can override per entry later.
 */
export function isStale(
  entry: LedgerEntry,
  now: Date | string = new Date(),
  overrides: DecayOverrides = {},
): StaleResult {
  const nowDate = typeof now === "string" ? new Date(now) : now;

  if (entry.supersededBy) {
    return {
      stale: true,
      reason: `Superseded by ${entry.supersededBy}`,
    };
  }

  switch (entry.kind as EntryKind) {
    case "fact":
      // Barely decays — only stale when contradicted (supersededBy / caller).
      return { stale: false };

    case "habit":
      // Habit is stale when any conflicting intention exists for same subject —
      // that conflict is supplied by callers via supersededBy or separate check.
      // Alone, habits are not time-stale.
      return { stale: false };

    case "intention":
      if (entry.reviewAt) {
        const reviewAt = new Date(entry.reviewAt);
        if (nowDate.getTime() > reviewAt.getTime()) {
          return {
            stale: true,
            reason: `Intention past review date (${entry.reviewAt}) without confirmation`,
          };
        }
      }
      return { stale: false };

    case "emotional_event": {
      const halfLife =
        entry.decay?.emotionalHalfLifeDays ??
        overrides.emotionalHalfLifeDays ??
        DEFAULT_EMOTIONAL_HALF_LIFE_DAYS;
      const born = new Date(entry.source.at);
      if (daysBetween(born, nowDate) > halfLife) {
        return {
          stale: true,
          reason: `Emotional event older than ${halfLife}-day half-life`,
        };
      }
      return { stale: false };
    }

    case "exception":
      // Never decays — only the user retires it.
      return { stale: false };

    case "context": {
      // Expires after the event date when reviewAt/lastConfirmed stands in as end date.
      const end = entry.reviewAt ?? entry.lastConfirmedAt;
      if (end && nowDate.getTime() > new Date(end).getTime()) {
        return {
          stale: true,
          reason: `Context past its date (${end})`,
        };
      }
      return { stale: false };
    }

    default:
      return { stale: false };
  }
}

/** True when a habit should yield to a newer intention on the same subject. */
export function habitYieldsToIntention(
  habit: LedgerEntry,
  intention: LedgerEntry,
): boolean {
  if (habit.kind !== "habit" || intention.kind !== "intention") return false;
  if (!habit.subject || habit.subject !== intention.subject) return false;
  return new Date(intention.source.at) > new Date(habit.source.at);
}
