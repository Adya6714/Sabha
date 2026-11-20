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
  dependsOn: z.array(z.string().min(1)).optional(),
  rationale: z.string().min(1).optional(),
});

export type ActionVerb = z.infer<typeof ActionVerbSchema>;
export type Reversibility = z.infer<typeof ReversibilitySchema>;
export type MoneyAmount = z.infer<typeof MoneyAmountSchema>;
export type ProposedAction = z.infer<typeof ProposedActionSchema>;
