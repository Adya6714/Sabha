import type { LedgerEntry } from "@sabha/core";
import { partition, type CouncilSeat } from "@sabha/ledger";

export const SEATS: CouncilSeat[] = [
  "smriti",
  "vartamaan",
  "sankalp",
  "viveka",
  "ajnabi",
  "sabhapati",
];

/**
 * Early access keeps these names fixed. Seat identity is the partition,
 * so people cannot rename a seat.
 */
export const COUNCIL_SEAT_POLICY = "fixed" as const;

export const SEAT_LABELS: Record<CouncilSeat, string> = {
  smriti: "Smriti",
  vartamaan: "Vartamaan",
  sankalp: "Sankalp",
  viveka: "Viveka",
  ajnabi: "Ajnabi",
  sabhapati: "Sabhapati",
};

export type SeatLine = {
  seat: CouncilSeat;
  text: string;
  evidenceIds: string[];
  abstained: boolean;
};

/**
 * Enforce partition in code — Ajnabi gets empty ledger slice.
 * Full protocol (blind/rebuttal/Chair) needs LLM keys (USER).
 */
export function seatSlice(
  seat: CouncilSeat,
  ledger: LedgerEntry[],
): LedgerEntry[] {
  return partition(seat, ledger);
}

export function draftSeatLine(
  seat: CouncilSeat,
  ledger: LedgerEntry[],
  draft: string,
  evidenceIds: string[],
): SeatLine {
  const slice = seatSlice(seat, ledger);
  const allowed = new Set(slice.map((e) => e.id));
  const inSlice = evidenceIds.filter((id) => allowed.has(id));
  if (slice.length === 0 || inSlice.length === 0) {
    return { seat, text: "", evidenceIds: [], abstained: true };
  }
  return { seat, text: draft, evidenceIds: inSlice, abstained: false };
}
