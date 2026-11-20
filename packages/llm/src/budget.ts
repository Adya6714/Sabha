import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import path from "node:path";
import { createDb } from "@sabha/ledger";
import { estimateCostUsd } from "./cost.js";

/**
 * Early-access hard stop. Combined OpenAI + Anthropic spend must stay
 * strictly under this many rupees. ₹90 per USD overstates the bill so the
 * meter reaches the ceiling before the provider invoice does.
 */
export const EARLY_ACCESS_CAP_INR = 100;
export const CONSERVATIVE_INR_PER_USD = 90;
export const OUTPUT_TOKEN_CAP = 1024;
export const CALL_SAFETY_MULTIPLIER = 1.5;

export class LlmBudgetExceededError extends Error {
  readonly code = "LLM_BUDGET_EXCEEDED" as const;
  readonly spentInr: number;
  readonly capInr: number;

  constructor(spentInr: number, capInr = EARLY_ACCESS_CAP_INR) {
    super(
      `Model calls are blocked. Combined OpenAI and Anthropic spend must stay under ₹${capInr}. Recorded spend is ₹${spentInr.toFixed(2)}.`,
    );
    this.name = "LlmBudgetExceededError";
    this.spentInr = spentInr;
    this.capInr = capInr;
  }
}

export type SpendReservation = {
  ceilingInr: number;
  settle(actualInr: number): Promise<number>;
  release(): Promise<number>;
};

export type ReserveArgs = {
  /** Bucket that this call is charged to (one provider key). */
  chargeId: string;
  /** Every key on this person. The cap is the sum, not per provider. */
  bucketIds: string[];
  ceilingInr: number;
};

export type SpendLedger = {
  getSpentInr(bucketIds: string[]): Promise<number>;
  reserve(args: ReserveArgs): Promise<SpendReservation>;
};

export function usdToInr(usd: number): number {
  return usd * CONSERVATIVE_INR_PER_USD;
}

/** Stable id for a secret. The raw key is never stored in the spend ledger. */
export function spendBucketId(secret: string): string {
  const digest = createHash("sha256").update(secret).digest("hex");
  return `key:${digest}`;
}

export function isSpendBlocked(
  spentInr: number,
  capInr = EARLY_ACCESS_CAP_INR,
): boolean {
  return spentInr + 0.05 >= capInr;
}

/**
 * Upper bound for a call, including one schema retry.
 * The reservation is refunded down to the measured cost after the call.
 */
export function estimateCallCeilingInr(args: {
  model: string;
  inputChars: number;
  attempts?: number;
}): number {
  const inputTokens = Math.max(32, Math.ceil(args.inputChars / 4));
  const usd =
    estimateCostUsd({
      provider: "openai",
      model: args.model,
      inputTokens,
      outputTokens: OUTPUT_TOKEN_CAP,
    }) ?? 0;
  const perAttempt = Math.max(usdToInr(usd) * CALL_SAFETY_MULTIPLIER, 0.05);
  return perAttempt * (args.attempts ?? 2);
}

function sumBuckets(ids: string[], buckets: Record<string, number>): number {
  const seen = new Set<string>();
  let total = 0;
  for (const id of ids) {
    if (seen.has(id)) continue;
    seen.add(id);
    total += buckets[id] ?? 0;
  }
  return total;
}

function assertReserveArgs(args: ReserveArgs) {
  if (!args.chargeId || args.bucketIds.length === 0) {
    throw new Error("Spend reservation needs a charge bucket.");
  }
  if (!args.bucketIds.includes(args.chargeId)) {
    throw new Error("The charged key must be included in the combined buckets.");
  }
  if (!(args.ceilingInr > 0)) {
    throw new Error("Spend reservation ceiling must be positive.");
  }
}

export function createMemorySpendLedger(
  initial: Record<string, number> = {},
  capInr = EARLY_ACCESS_CAP_INR,
): SpendLedger {
  const buckets: Record<string, number> = { ...initial };
  let chain: Promise<unknown> = Promise.resolve();

  function locked<T>(fn: () => T): Promise<T> {
    const run = chain.then(fn, fn);
    chain = run.then(
      () => undefined,
      () => undefined,
    );
    return run;
  }

  return {
    getSpentInr(bucketIds) {
      return locked(() => sumBuckets(bucketIds, buckets));
    },
    reserve(args) {
      assertReserveArgs(args);
      return locked(() => {
        const spent = sumBuckets(args.bucketIds, buckets);
        if (spent + args.ceilingInr >= capInr) {
          throw new LlmBudgetExceededError(spent, capInr);
        }
        buckets[args.chargeId] = (buckets[args.chargeId] ?? 0) + args.ceilingInr;
        let settled = false;
        const finish = (actualInr: number): Promise<number> => {
          if (settled) return Promise.resolve(sumBuckets(args.bucketIds, buckets));
          settled = true;
          return locked(() => {
            const current = buckets[args.chargeId] ?? 0;
            buckets[args.chargeId] = Math.max(
              0,
              current - args.ceilingInr + Math.max(0, actualInr),
            );
            return sumBuckets(args.bucketIds, buckets);
          });
        };
        const reservation: SpendReservation = {
          ceilingInr: args.ceilingInr,
          settle: (actualInr) => finish(actualInr),
          release: () => finish(0),
        };
        return reservation;
      });
    },
  };
}

type FileShape = { buckets: Record<string, number> };

export function createFileSpendLedger(
  filePath: string,
  capInr = EARLY_ACCESS_CAP_INR,
): SpendLedger {
  let chain: Promise<unknown> = Promise.resolve();

  function locked<T>(fn: () => Promise<T>): Promise<T> {
    const run = chain.then(fn, fn);
    chain = run.then(
      () => undefined,
      () => undefined,
    );
    return run;
  }

  function read(): FileShape {
    try {
      const parsed = JSON.parse(readFileSync(filePath, "utf8")) as FileShape;
      return { buckets: parsed.buckets ?? {} };
    } catch {
      return { buckets: {} };
    }
  }

  function write(data: FileShape) {
    mkdirSync(path.dirname(filePath), { recursive: true });
    const tmp = `${filePath}.${process.pid}.tmp`;
    writeFileSync(tmp, JSON.stringify(data), { mode: 0o600 });
    renameSync(tmp, filePath);
  }

  return {
    getSpentInr(bucketIds) {
      return locked(async () => sumBuckets(bucketIds, read().buckets));
    },
    reserve(args) {
      assertReserveArgs(args);
      return locked(async () => {
        const data = read();
        const spent = sumBuckets(args.bucketIds, data.buckets);
        if (spent + args.ceilingInr >= capInr) {
          throw new LlmBudgetExceededError(spent, capInr);
        }
        data.buckets[args.chargeId] =
          (data.buckets[args.chargeId] ?? 0) + args.ceilingInr;
        write(data);
        let settled = false;
        const finish = (actualInr: number): Promise<number> => {
          if (settled) {
            return Promise.resolve(sumBuckets(args.bucketIds, read().buckets));
          }
          settled = true;
          return locked(async () => {
            const fresh = read();
            const current = fresh.buckets[args.chargeId] ?? 0;
            fresh.buckets[args.chargeId] = Math.max(
              0,
              current - args.ceilingInr + Math.max(0, actualInr),
            );
            write(fresh);
            return sumBuckets(args.bucketIds, fresh.buckets);
          });
        };
        return {
          ceilingInr: args.ceilingInr,
          settle: (actualInr: number) => finish(actualInr),
          release: () => finish(0),
        };
      });
    },
  };
}

function missingTable(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: string }).code === "42P01"
  );
}

export function createDbSpendLedger(
  capInr = EARLY_ACCESS_CAP_INR,
): SpendLedger {
  return {
    async getSpentInr(bucketIds) {
      if (bucketIds.length === 0) return 0;
      const { client } = createDb();
      try {
        const rows = await client<{ spent_inr: number }[]>`
          select coalesce(sum(spent_inr), 0) as spent_inr
          from llm_budgets
          where owner_id = any(${bucketIds})
        `;
        return Number(rows[0]?.spent_inr ?? 0);
      } catch (error) {
        if (missingTable(error)) {
          throw new Error(
            "llm_budgets is missing. Run pnpm db:migrate before model calls.",
          );
        }
        throw error;
      } finally {
        await client.end({ timeout: 5 });
      }
    },
    async reserve(args) {
      assertReserveArgs(args);
      const { client } = createDb();
      try {
        await client.begin(async (tx) => {
          for (const id of args.bucketIds) {
            await tx`
              insert into llm_budgets (owner_id, spent_inr)
              values (${id}, 0)
              on conflict (owner_id) do nothing
            `;
          }
          const rows = await tx<{ spent_inr: number }[]>`
            select spent_inr from llm_budgets
            where owner_id = any(${args.bucketIds})
            for update
          `;
          const spent = rows.reduce((sum, row) => sum + Number(row.spent_inr), 0);
          if (spent + args.ceilingInr >= capInr) {
            throw new LlmBudgetExceededError(spent, capInr);
          }
          await tx`
            update llm_budgets
            set spent_inr = spent_inr + ${args.ceilingInr}, updated_at = now()
            where owner_id = ${args.chargeId}
          `;
        });
      } catch (error) {
        if (missingTable(error)) {
          throw new Error(
            "llm_budgets is missing. Run pnpm db:migrate before model calls.",
          );
        }
        throw error;
      } finally {
        await client.end({ timeout: 5 });
      }

      let settled = false;
      const finish = async (actualInr: number) => {
        if (settled) return actualInr;
        settled = true;
        const { client: settleClient } = createDb();
        try {
          const delta = Math.max(0, actualInr) - args.ceilingInr;
          await settleClient`
            update llm_budgets
            set spent_inr = greatest(0, spent_inr + ${delta}), updated_at = now()
            where owner_id = ${args.chargeId}
          `;
          const rows = await settleClient<{ spent_inr: number }[]>`
            select coalesce(sum(spent_inr), 0) as spent_inr
            from llm_budgets
            where owner_id = any(${args.bucketIds})
          `;
          return Number(rows[0]?.spent_inr ?? 0);
        } finally {
          await settleClient.end({ timeout: 5 });
        }
      };

      return {
        ceilingInr: args.ceilingInr,
        settle: finish,
        release: () => finish(0),
      };
    },
  };
}

let defaultLedger: SpendLedger | null = null;

export function defaultSpendFilePath(): string {
  return (
    process.env.SABHA_SPEND_FILE ??
    path.join(process.cwd(), "data", "llm-spend.json")
  );
}

/**
 * Production and any deploy with DATABASE_URL use Postgres so the ceiling
 * survives a restart. Local smoke without a database uses a gitignored file.
 * Serverless without a database refuses the call.
 */
export function getDefaultSpendLedger(): SpendLedger {
  if (defaultLedger) return defaultLedger;
  if (process.env.DATABASE_URL) {
    defaultLedger = createDbSpendLedger();
    return defaultLedger;
  }
  if (process.env.VERCEL === "1") {
    defaultLedger = {
      async getSpentInr() {
        throw new Error(
          "DATABASE_URL is required so the ₹100 ceiling survives restarts.",
        );
      },
      async reserve() {
        throw new Error(
          "DATABASE_URL is required so the ₹100 ceiling survives restarts.",
        );
      },
    };
    return defaultLedger;
  }
  defaultLedger = createFileSpendLedger(defaultSpendFilePath());
  return defaultLedger;
}

export function resetDefaultSpendLedgerForTests() {
  defaultLedger = null;
}

export async function readCombinedSpendInr(
  secrets: string[],
  ledger: SpendLedger = getDefaultSpendLedger(),
): Promise<number> {
  const ids = secrets.filter(Boolean).map((secret) => spendBucketId(secret));
  if (ids.length === 0) return 0;
  return ledger.getSpentInr(ids);
}
