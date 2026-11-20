import { z } from "zod";

export const ActionVerbSchema = z.enum([
  "read",
  "draft",
  "write",
  "send",
  "pay",
  "delete",
  "accept",
]);

export const ReversibilitySchema = z.enum(["easy", "partial", "hard"]);

/** Where the proposed action came from — used for intent / exfil detectors. */
export const ActionOriginSchema = z.enum([
  "user_request",
  "tool_output",
  "memory",
  "agent_inference",
]);

export const MoneyAmountSchema = z.object({
  value: z.number().nonnegative(),
  currency: z.string().min(1),
});

export const ProposedActionSchema = z.object({
  id: z.string().min(1),
  agentId: z.string().min(1),
  tool: z.string().min(1),
  verb: ActionVerbSchema,
  args: z.record(z.unknown()),
  amount: MoneyAmountSchema.optional(),
  persons: z.array(z.string().min(1)).optional(),
  reversibility: ReversibilitySchema,
  /** Provenance of this proposed call. Defaults to a direct user request. */
  origin: ActionOriginSchema.default("user_request"),
  /** Dependency / session chain (action or entry ids). This is the chain field. */
  dependsOn: z.array(z.string().min(1)).optional(),
  rationale: z.string().min(1).optional(),
});

export type ActionVerb = z.infer<typeof ActionVerbSchema>;
export type Reversibility = z.infer<typeof ReversibilitySchema>;
export type ActionOrigin = z.infer<typeof ActionOriginSchema>;
export type MoneyAmount = z.infer<typeof MoneyAmountSchema>;
export type ProposedAction = z.infer<typeof ProposedActionSchema>;
