import { z } from "zod";
import { LaneSchema } from "./lane.js";
import { ProposedActionSchema } from "./action.js";

/** Stub — gateway holds expand in Phase 4. */
export const HoldStatusSchema = z.enum([
  "pending",
  "approved",
  "declined",
  "modified",
  "expired",
]);

export const HoldSchema = z.object({
  id: z.string().min(1),
  actionId: z.string().min(1),
  action: ProposedActionSchema.optional(),
  lane: LaneSchema,
  status: HoldStatusSchema,
  message: z.string().min(1).optional(),
  createdAt: z.string().datetime({ offset: true }),
  expiresAt: z.string().datetime({ offset: true }),
  decidedAt: z.string().datetime({ offset: true }).optional(),
  modifiedAction: ProposedActionSchema.optional(),
});

export type HoldStatus = z.infer<typeof HoldStatusSchema>;
export type Hold = z.infer<typeof HoldSchema>;
