import type { ProviderName } from "./providers/types.js";

/** Rough USD estimates for logging — not billing-grade. */
const RATES: Record<
  string,
  { inputPerMTok: number; outputPerMTok: number }
> = {
  "gpt-4o-mini": { inputPerMTok: 0.15, outputPerMTok: 0.6 },
  "gpt-4o": { inputPerMTok: 2.5, outputPerMTok: 10 },
  "claude-3-5-haiku": { inputPerMTok: 0.8, outputPerMTok: 4 },
  "claude-haiku-4": { inputPerMTok: 1, outputPerMTok: 5 },
  "claude-3-5-sonnet": { inputPerMTok: 3, outputPerMTok: 15 },
  "claude-sonnet-4": { inputPerMTok: 3, outputPerMTok: 15 },
};

/** Unknown models use a high rate so the rupee ceiling stops early. */
const UNKNOWN_RATE = { inputPerMTok: 15, outputPerMTok: 75 };

export function rateForModel(model: string): {
  inputPerMTok: number;
  outputPerMTok: number;
  matched: boolean;
} {
  const key = Object.keys(RATES)
    .sort((a, b) => b.length - a.length)
    .find((candidate) => model.toLowerCase().includes(candidate));
  if (!key) return { ...UNKNOWN_RATE, matched: false };
  const rate = RATES[key] ?? UNKNOWN_RATE;
  return { ...rate, matched: true };
}

function matchRate(model: string) {
  const rate = rateForModel(model);
  return { inputPerMTok: rate.inputPerMTok, outputPerMTok: rate.outputPerMTok };
}

export function estimateCostUsd(args: {
  provider: ProviderName;
  model: string;
  inputTokens?: number;
  outputTokens?: number;
}): number | undefined {
  void args.provider;
  if (args.inputTokens == null || args.outputTokens == null) return undefined;
  const rate = matchRate(args.model);
  if (!rate) return undefined;
  return (
    (args.inputTokens / 1_000_000) * rate.inputPerMTok +
    (args.outputTokens / 1_000_000) * rate.outputPerMTok
  );
}
