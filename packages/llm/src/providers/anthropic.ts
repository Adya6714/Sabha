import type { LlmProvider, ProviderRequest, ProviderResponse } from "./types.js";

export type AnthropicProviderOptions = {
  apiKey?: string;
  /** When false, never read ANTHROPIC_API_KEY from the environment. */
  allowEnv?: boolean;
  baseUrl?: string;
  fetchFn?: typeof fetch;
};

export function createAnthropicProvider(
  options: AnthropicProviderOptions = {},
): LlmProvider {
  const apiKey =
    options.apiKey ??
    (options.allowEnv === false ? undefined : process.env.ANTHROPIC_API_KEY);
  const baseUrl = options.baseUrl ?? "https://api.anthropic.com/v1";
  const fetchFn = options.fetchFn ?? fetch;

  return {
    name: "anthropic",
    async complete(request: ProviderRequest): Promise<ProviderResponse> {
      if (!apiKey) {
        throw new Error("ANTHROPIC_API_KEY is not set");
      }

      const system = [
        request.system,
        "Respond with a single JSON object only. No markdown fences.",
        request.jsonSchema
          ? `The JSON must match this schema:\n${JSON.stringify(request.jsonSchema)}`
          : null,
      ]
        .filter(Boolean)
        .join("\n\n");

      const res = await fetchFn(`${baseUrl}/messages`, {
        method: "POST",
        headers: {
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: request.model,
          max_tokens: 1024,
          temperature: 0,
          system,
          messages: [{ role: "user", content: request.user }],
        }),
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Anthropic error ${res.status}: ${errText}`);
      }

      const data = (await res.json()) as {
        content?: Array<{ type: string; text?: string }>;
        usage?: { input_tokens?: number; output_tokens?: number };
      };

      const text = data.content?.find((part) => part.type === "text")?.text;
      if (!text) {
        throw new Error("Anthropic returned empty content");
      }

      return {
        text,
        inputTokens: data.usage?.input_tokens,
        outputTokens: data.usage?.output_tokens,
        raw: data,
      };
    },
  };
}
