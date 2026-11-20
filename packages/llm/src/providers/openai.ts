import type { LlmProvider, ProviderRequest, ProviderResponse } from "./types.js";

export type OpenAIProviderOptions = {
  apiKey?: string;
  /** When false, never read OPENAI_API_KEY from the environment. */
  allowEnv?: boolean;
  baseUrl?: string;
  fetchFn?: typeof fetch;
};

export function createOpenAIProvider(
  options: OpenAIProviderOptions = {},
): LlmProvider {
  const apiKey =
    options.apiKey ??
    (options.allowEnv === false ? undefined : process.env.OPENAI_API_KEY);
  const baseUrl = options.baseUrl ?? "https://api.openai.com/v1";
  const fetchFn = options.fetchFn ?? fetch;

  return {
    name: "openai",
    async complete(request: ProviderRequest): Promise<ProviderResponse> {
      if (!apiKey) {
        throw new Error("OPENAI_API_KEY is not set");
      }

      const body: Record<string, unknown> = {
        model: request.model,
        messages: [
          ...(request.system
            ? [{ role: "system", content: request.system }]
            : []),
          { role: "user", content: request.user },
        ],
        temperature: 0,
        max_tokens: 1024,
      };

      if (request.jsonSchema) {
        body.response_format = {
          type: "json_schema",
          json_schema: {
            name: request.schemaName ?? "response",
            // false: Zod→JSON Schema isn't always OpenAI-strict-compatible yet
            strict: false,
            schema: request.jsonSchema,
          },
        };
      } else {
        body.response_format = { type: "json_object" };
      }

      const res = await fetchFn(`${baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`OpenAI error ${res.status}: ${errText}`);
      }

      const data = (await res.json()) as {
        choices?: Array<{ message?: { content?: string } }>;
        usage?: { prompt_tokens?: number; completion_tokens?: number };
      };

      const text = data.choices?.[0]?.message?.content;
      if (!text) {
        throw new Error("OpenAI returned empty content");
      }

      return {
        text,
        inputTokens: data.usage?.prompt_tokens,
        outputTokens: data.usage?.completion_tokens,
        raw: data,
      };
    },
  };
}
