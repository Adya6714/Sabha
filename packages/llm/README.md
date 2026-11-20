# `@sabha/llm`

One function for every model call in Sabha:

```ts
import { complete } from "@sabha/llm";
import { z } from "zod";

const result = await complete({
  model: "openai/gpt-4o-mini", // or anthropic/claude-3-5-haiku-latest
  system: "Extract structured facts.",
  input: { text: "Wake at 5am" },
  schema: z.object({ claim: z.string() }),
});
```

## Guarantees

1. **Zod validation** — invalid JSON shapes never return to callers
2. **One retry** on schema failure (with the error fed back to the model)
3. **Logging** — prompt/output/latency/cost → `llm_calls` when `DATABASE_URL` is set
4. **Two providers** from day one: OpenAI + Anthropic

## Env

```bash
OPENAI_API_KEY=
ANTHROPIC_API_KEY=
DATABASE_URL=postgresql://sabha:sabha@localhost:5432/sabha
```

Pass `keys` into `complete()` for a person using the app. When `keys` is present, environment keys are ignored.

Combined OpenAI and Anthropic spend is hard-stopped before ₹100 (`EARLY_ACCESS_CAP_INR`). The meter uses ₹90 per USD.

## Tests

```bash
pnpm --filter @sabha/llm test     # mocked unit tests (no keys)
pnpm --filter @sabha/llm smoke    # live calls if API keys are set
```
