import { z } from "zod";
import { ActionVerbSchema } from "./action.js";
import { HardnessSchema, HeatLevelSchema } from "./ledger.js";

/** Stub — full rule DSL lands in Phase 5. */
export const RuleTypeSchema = z.enum(["rule", "commitment", "authority_grant"]);

export const AuthorityLevelSchema = z.enum([
  "observe",
  "recommend",
  "prepare",
  "execute",
  "escalate",
]);

export const RuleScopeSchema = z.object({
  exceptPersons: z.array(z.string().min(1)).default([]),
  exceptContexts: z.array(z.string().min(1)).default([]),
});

export const RuleWhenSchema = z
  .object({
    verb: ActionVerbSchema.optional(),
    category: z.string().min(1).optional(),
    tool: z.string().min(1).optional(),
    heatAtLeast: HeatLevelSchema.optional(),
  })
  .passthrough();

export const RuleThenSchema = z
  .object({
    limit: z
      .object({
        amount: z.number().nonnegative(),
        currency: z.string().min(1),
      })
      .optional(),
    lane: z.string().min(1).optional(),
    coolingOffMinutes: z.number().int().positive().optional(),
    message: z.string().min(1).optional(),
  })
  .passthrough();

export const RuleSchema = z.object({
  id: z.string().min(1),
  type: z.literal("rule"),
  when: RuleWhenSchema,
  then: RuleThenSchema,
  hardness: HardnessSchema,
  scope: RuleScopeSchema.default({ exceptPersons: [], exceptContexts: [] }),
  checkBeforeFiringOn: z.enum(["close_circle", "always", "never"]).optional(),
  createdAt: z.string().datetime({ offset: true }),
  createdHeat: HeatLevelSchema,
  reviewAt: z.string().datetime({ offset: true }).optional(),
});

/** Stub — cooling-off commitments expand in Phase 5. */
export const CommitmentSchema = z.object({
  id: z.string().min(1),
  type: z.literal("commitment"),
  description: z.string().min(1),
  when: RuleWhenSchema,
  then: RuleThenSchema,
  coolingOffMinutes: z.number().int().positive().default(120),
  reason: z.string().min(1),
  hardness: HardnessSchema.default("hard"),
  createdAt: z.string().datetime({ offset: true }),
  createdHeat: z.literal(1),
  reviewAt: z.string().datetime({ offset: true }).optional(),
  status: z.enum(["active", "draft", "retired"]).default("active"),
});

/** Stub — per-agent authority registry expands in Phase 5. */
export const AuthorityGrantSchema = z.object({
  id: z.string().min(1),
  type: z.literal("authority_grant"),
  agentId: z.string().min(1),
  toolCategory: z.string().min(1),
  level: AuthorityLevelSchema,
  createdAt: z.string().datetime({ offset: true }),
  createdBy: z.literal("user"),
  reviewAt: z.string().datetime({ offset: true }).optional(),
});

export type RuleType = z.infer<typeof RuleTypeSchema>;
export type AuthorityLevel = z.infer<typeof AuthorityLevelSchema>;
export type RuleScope = z.infer<typeof RuleScopeSchema>;
export type Rule = z.infer<typeof RuleSchema>;
export type Commitment = z.infer<typeof CommitmentSchema>;
export type AuthorityGrant = z.infer<typeof AuthorityGrantSchema>;
