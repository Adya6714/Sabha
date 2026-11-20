export type ProviderName = "openai" | "anthropic";

export type ProviderRequest = {
  model: string;
  system?: string;
  /** User message content (usually JSON-stringified input + schema instructions). */
  user: string;
  /** Optional JSON Schema object for providers that support structured output. */
  jsonSchema?: Record<string, unknown>;
  schemaName?: string;
};

export type ProviderResponse = {
  text: string;
  inputTokens?: number;
  outputTokens?: number;
  raw?: unknown;
};

export interface LlmProvider {
  readonly name: ProviderName;
  complete(request: ProviderRequest): Promise<ProviderResponse>;
}
