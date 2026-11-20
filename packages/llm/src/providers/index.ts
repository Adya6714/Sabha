import { createAnthropicProvider } from "./anthropic.js";
import { createOpenAIProvider } from "./openai.js";
import type { LlmProvider, ProviderName } from "./types.js";

export { createOpenAIProvider } from "./openai.js";
export type { OpenAIProviderOptions } from "./openai.js";
export { createAnthropicProvider } from "./anthropic.js";
export type { AnthropicProviderOptions } from "./anthropic.js";
export type {
  LlmProvider,
  ProviderName,
  ProviderRequest,
  ProviderResponse,
} from "./types.js";

export function parseModelRef(modelRef: string): {
  provider: ProviderName;
  model: string;
} {
  const slash = modelRef.indexOf("/");
  if (slash <= 0) {
    throw new Error(
      `Model must look like "openai/gpt-4o-mini" or "anthropic/claude-…". Got: ${modelRef}`,
    );
  }
  const provider = modelRef.slice(0, slash) as ProviderName;
  const model = modelRef.slice(slash + 1);
  if (provider !== "openai" && provider !== "anthropic") {
    throw new Error(
      `Unsupported provider "${provider}" in model "${modelRef}"`,
    );
  }
  if (!model) {
    throw new Error(`Missing model name in "${modelRef}"`);
  }
  return { provider, model };
}

export function getDefaultProviders(): Record<ProviderName, LlmProvider> {
  return {
    openai: createOpenAIProvider(),
    anthropic: createAnthropicProvider(),
  };
}
