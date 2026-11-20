import { z } from "zod";
import { FindingSchema } from "./finding.js";
import { LaneSchema } from "./lane.js";

/** Stub — full receipt + hash chain expands in Phase 7. */
export const ReceiptDecisionSchema = z.enum([
  "executed",
  "modified",
  "declined",
  "expired",
]);

export const ReceiptSchema = z.object({
  id: z.string().min(1),
  actionId: z.string().min(1),
  intention: z.string().min(1),
  agentChain: z.array(z.string().min(1)),
  ledgerUsed: z.array(z.string().min(1)),
  findings: z.array(FindingSchema),
  lane: LaneSchema,
  councilSessionId: z.string().min(1).optional(),
  decidedBy: z.enum(["auto", "user"]),
  decision: ReceiptDecisionSchema,
  executed: z
    .object({
      tool: z.string().min(1),
      args: z.record(z.unknown()),
    })
    .optional(),
  iarCriteria: z.array(z.boolean()).length(5),
  createdAt: z.string().datetime({ offset: true }),
  prevHash: z.string().min(1),
  hash: z.string().min(1),
});

export type ReceiptDecision = z.infer<typeof ReceiptDecisionSchema>;
export type Receipt = z.infer<typeof ReceiptSchema>;
