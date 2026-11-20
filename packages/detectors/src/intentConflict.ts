import type { Finding } from "@sabha/core";
import type { Detector } from "./types.js";

/** Shape expected from packages/llm complete() when enableLlmIntentCheck is on. */
export type IntentEntailment = {
  entailed: boolean;
  reason: string;
};

/**
 * Flags non-read actions that did not come from a direct user request.
 * Optional LLM entailment (severity 2) only when ctx.enableLlmIntentCheck is set.
 * Callers must Zod-validate through packages/llm complete(); this detector stays deterministic by default.
 */
export const intentConflictDetector: Detector = {
  name: "intent_conflict",
  async run(action, ctx) {
    const findings: Finding[] = [];
    const origin = action.origin ?? "user_request";

    if (origin === "tool_output" && action.verb !== "read") {
      findings.push({
        detector: "intent_conflict",
        severity: 3,
        evidence: [`origin:${origin}`, `verb:${action.verb}`, action.id],
        message:
          "This write did not come from your request — it came from tool output. Confirm before it runs.",
      });
      return findings;
    }

    if (
      ctx.enableLlmIntentCheck &&
      ctx.complete &&
      ctx.userIntent &&
      action.verb !== "read" &&
      origin !== "user_request"
    ) {
      const result = await ctx.complete({
        model: "openai/gpt-4o-mini",
        system:
          "Decide whether the proposed action is entailed by the user's stated intention. Reply with JSON only.",
        input: {
          userIntent: ctx.userIntent,
          action: {
            tool: action.tool,
            verb: action.verb,
            args: action.args,
            rationale: action.rationale,
          },
        },
        schema: {
          type: "object",
          properties: {
            entailed: { type: "boolean" },
            reason: { type: "string" },
          },
          required: ["entailed", "reason"],
        },
        schemaName: "IntentEntailment",
      });
      const parsed = result.data;
      if (
        typeof parsed.entailed === "boolean" &&
        typeof parsed.reason === "string" &&
        !parsed.entailed
      ) {
        findings.push({
          detector: "intent_conflict",
          severity: 2,
          evidence: [`origin:${origin}`, `intent:${ctx.userIntent}`],
          message: parsed.reason,
        });
      }
    }

    return findings;
  },
};