import { randomUUID } from "node:crypto";
import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";
import {
  estimateCallCeilingInr,
  getDefaultSpendLedger,
  spendBucketId,
  usdToInr,
  type SpendLedger,
} from "./budget.js";
import { estimateCostUsd } from "./cost.js";
import {
  createDbLogger,
  createMemoryLogger,
  type LlmLogger,
} from "./log.js";
import { createAnthropicProvider } from "./providers/anthropic.js";
import { createOpenAIProvider } from "./providers/openai.js";
import {
  parseModelRef,
  type LlmProvider,
  type ProviderName,
} from "./providers/index.js";

export type CompleteArgs<TSchema extends z.ZodTypeAny> = {
  /** e.g. "openai/gpt-4o-mini" or "anthropic/claude-3-5-haiku-latest" */
  model: string;
  system?: string;
  input: unknown;
  schema: TSchema;
  schemaName?: string;
  /** Inject providers (tests). Defaults to OpenAI + Anthropic. */
  providers?: Partial<Record<ProviderName, LlmProvider>>;
  /**
   * The caller's own provider keys. When this object is present, environment
   * keys are ignored — Sabha does not fall back to a shared key.
   */
  keys?: Partial<Record<ProviderName, string | undefined>>;
  /** Inject the rupee ceiling (tests). */
  spend?: SpendLedger;
  /** Used when a test provider stands in for a real key. */
  ownerId?: string;
  /** Inject logger (tests). Defaults to DB logger when DATABASE_URL is set. */
  logger?: LlmLogger | null;
};

export type CompleteResult<T> = {
  data: T;
  provider: ProviderName;
  model: string;
  attempts: number;
  latencyMs: number;
  inputTokens?: number;
  outputTokens?: number;
  costUsd?: number;
  callId: string;
};

function defaultLogger(): LlmLogger | null {
  if (process.env.DATABASE_URL) {
    try {
      return createDbLogger();
    } catch {
      return createMemoryLogger();
    }
  }
  return createMemoryLogger();
}

function extractJson(text: string): unknown {
  const trimmed = text.trim();
  try {
    return JSON.parse(trimmed);
  } catch {
    const start = trimmed.indexOf("{");
    const end = trimmed.lastIndexOf("}");
    if (start >= 0 && end > start) {
      return JSON.parse(trimmed.slice(start, end + 1));
    }
    throw new Error("Model response was not valid JSON");
  }
}

function buildUserMessage(
  input: unknown,
  schemaName: string,
  previousError?: string,
): string {
  const parts = [
    `Produce a JSON object for schema "${schemaName}".`,
    `Input:\n${JSON.stringify(input, null, 2)}`,
  ];
  if (previousError) {
    parts.push(
      `Your previous JSON failed validation:\n${previousError}\nReturn corrected JSON only.`,
    );
  }
  return parts.join("\n\n");
}

function toSchemaBody(
  schema: z.ZodTypeAny,
  schemaName: string,
): Record<string, unknown> {
  const jsonSchema = zodToJsonSchema(schema, {
    name: schemaName,
    $refStrategy: "none",
  }) as Record<string, unknown>;

  const definitions = jsonSchema.definitions as
    | Record<string, unknown>
    | undefined;
  if (definitions?.[schemaName] && typeof definitions[schemaName] === "object") {
    return definitions[schemaName] as Record<string, unknown>;
  }
  return jsonSchema;
}

function providerLabel(provider: ProviderName): string {
  return provider === "openai" ? "OpenAI" : "Anthropic";
}

function trimmedKey(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

function keysForCall(
  provider: ProviderName,
  keys: CompleteArgs<z.ZodTypeAny>["keys"],
): { apiKey?: string; bucketIds: string[]; bringYourOwn: boolean } {
  const bringYourOwn = keys != null;
  const source = bringYourOwn
    ? {
        openai: trimmedKey(keys?.openai),
        anthropic: trimmedKey(keys?.anthropic),
      }
    : {
        openai: trimmedKey(process.env.OPENAI_API_KEY),
        anthropic: trimmedKey(process.env.ANTHROPIC_API_KEY),
      };
  const present = [source.openai, source.anthropic].filter(
    (value): value is string => Boolean(value),
  );
  return {
    apiKey: source[provider],
    bucketIds: present.map((secret) => spendBucketId(secret)),
    bringYourOwn,
  };
}

function missingKeyError(provider: ProviderName, bringYourOwn: boolean): Error {
  const label = providerLabel(provider);
  if (bringYourOwn) {
    return new Error(
      `Add your own ${label} API key in Settings. Sabha does not share a key between people.`,
    );
  }
  const envName = provider === "openai" ? "OPENAI_API_KEY" : "ANTHROPIC_API_KEY";
  return new Error(`${envName} is not set. Add your own key.`);
}

/**
 * Provider-agnostic structured completion.
 * Validates with Zod, retries once on schema failure, logs to llm_calls when possible.
 * Refuses the call when combined provider spend would reach ₹100.
 */
export async function complete<TSchema extends z.ZodTypeAny>(
  args: CompleteArgs<TSchema>,
): Promise<CompleteResult<z.infer<TSchema>>> {
  const { provider: providerName, model } = parseModelRef(args.model);
  const mocked = Boolean(args.providers?.[providerName]);
  const resolved =
    mocked && args.keys == null
      ? { apiKey: undefined, bucketIds: [] as string[], bringYourOwn: false }
      : keysForCall(providerName, args.keys);
  const apiKey = resolved.apiKey;

  if (!mocked && !apiKey) {
    throw missingKeyError(providerName, resolved.bringYourOwn);
  }

  const provider =
    args.providers?.[providerName] ??
    (providerName === "openai"
      ? createOpenAIProvider({ apiKey, allowEnv: false })
      : createAnthropicProvider({ apiKey, allowEnv: false }));

  const schemaName = args.schemaName ?? "SabhaResponse";
  const schemaBody = toSchemaBody(args.schema, schemaName);
  const logger = args.logger === undefined ? defaultLogger() : args.logger;
  const callId = randomUUID();
  const started = Date.now();
  const chargeId = apiKey ? spendBucketId(apiKey) : (args.ownerId ?? "test");
  const bucketIds =
    resolved.bucketIds.length > 0 ? resolved.bucketIds : [chargeId];
  if (!bucketIds.includes(chargeId)) bucketIds.push(chargeId);

  const system =
    args.system ??
    "You are a careful structured-output assistant for Sabha governance.";
  const spend =
    args.spend ??
    (mocked ? undefined : getDefaultSpendLedger());
  const ceilingInr = estimateCallCeilingInr({
    model,
    inputChars: JSON.stringify(args.input).length + system.length + 800,
  });
  const reservation = spend
    ? await spend.reserve({ chargeId, bucketIds, ceilingInr })
    : null;
  let chargedInr = 0;

  const noteUsage = (tokens: { input?: number; output?: number }) => {
    const usd = estimateCostUsd({
      provider: providerName,
      model,
      inputTokens: tokens.input,
      outputTokens: tokens.output,
    });
    chargedInr += usd == null ? 0.05 : usdToInr(usd);
  };

  let previousError: string | undefined;
  let lastTokens: { input?: number; output?: number } = {};

  try {
  for (let attempt = 1; attempt <= 2; attempt += 1) {
    try {
      const response = await provider.complete({
        model,
        system,
        user: buildUserMessage(args.input, schemaName, previousError),
        jsonSchema: schemaBody,
        schemaName,
      });

      lastTokens = {
        input: response.inputTokens,
        output: response.outputTokens,
      };
      noteUsage(lastTokens);

      const parsedJson = extractJson(response.text);
      const validated = args.schema.safeParse(parsedJson);

      if (!validated.success) {
        previousError = validated.error.message;
        if (attempt === 1) continue;

        const latencyMs = Date.now() - started;
        const costUsd = estimateCostUsd({
          provider: providerName,
          model,
          inputTokens: lastTokens.input,
          outputTokens: lastTokens.output,
        });
        await logger?.write({
          id: callId,
          provider: providerName,
          model,
          system: args.system,
          input: args.input,
          output: parsedJson,
          schemaName,
          latencyMs,
          inputTokens: lastTokens.input,
          outputTokens: lastTokens.output,
          costUsd,
          costInr: costUsd == null ? undefined : usdToInr(costUsd),
          ownerId: chargeId,
          status: "schema_error",
          error: previousError,
        });
        throw new Error(
          `LLM output failed Zod validation after retry: ${previousError}`,
        );
      }

      const latencyMs = Date.now() - started;
      const costUsd = estimateCostUsd({
        provider: providerName,
        model,
        inputTokens: response.inputTokens,
        outputTokens: response.outputTokens,
      });

      await logger?.write({
        id: callId,
        provider: providerName,
        model,
        system: args.system,
        input: args.input,
        output: validated.data,
        schemaName,
        latencyMs,
        inputTokens: response.inputTokens,
        outputTokens: response.outputTokens,
        costUsd,
        costInr: costUsd == null ? undefined : usdToInr(costUsd),
        ownerId: chargeId,
        status: "ok",
      });

      return {
        data: validated.data,
        provider: providerName,
        model,
        attempts: attempt,
        latencyMs,
        inputTokens: response.inputTokens,
        outputTokens: response.outputTokens,
        costUsd,
        callId,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (message.startsWith("LLM output failed Zod validation after retry")) {
        throw error;
      }
      if (attempt === 1 && previousError) {
        // Schema failure path already decided to retry.
        continue;
      }

      const latencyMs = Date.now() - started;
      await logger?.write({
        id: callId,
        provider: providerName,
        model,
        system: args.system,
        input: args.input,
        schemaName,
        latencyMs,
        inputTokens: lastTokens.input,
        outputTokens: lastTokens.output,
        costUsd: estimateCostUsd({
          provider: providerName,
          model,
          inputTokens: lastTokens.input,
          outputTokens: lastTokens.output,
        }),
        costInr:
          lastTokens.input == null || lastTokens.output == null
            ? undefined
            : usdToInr(
                estimateCostUsd({
                  provider: providerName,
                  model,
                  inputTokens: lastTokens.input,
                  outputTokens: lastTokens.output,
                }) ?? 0,
              ),
        ownerId: chargeId,
        status: "provider_error",
        error: message,
      });
      throw error;
    }
  }

  throw new Error("unreachable");
  } finally {
    if (reservation) {
      try {
        await reservation.settle(chargedInr);
      } catch {
        // The reserved ceiling stays in place, so the next call still cannot cross ₹100.
      }
    }
  }
}
