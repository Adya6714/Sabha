import { z } from "zod";

export const DetectorNameSchema = z.enum([
  "staleness",
  "heat",
  "person_rule",
  "influence",
  "scope",
]);

export const FindingSeveritySchema = z.union([
  z.literal(1),
  z.literal(2),
  z.literal(3),
]);

export const InfluenceStatusSchema = z.enum([
  "verified",
  "suspected",
  "unknown",
]);

export const FindingSchema = z.object({
  detector: DetectorNameSchema,
  severity: FindingSeveritySchema,
  evidence: z.array(z.string().min(1)),
  status: InfluenceStatusSchema.optional(),
  message: z.string().min(1),
});

export type DetectorName = z.infer<typeof DetectorNameSchema>;
export type FindingSeverity = z.infer<typeof FindingSeveritySchema>;
export type InfluenceStatus = z.infer<typeof InfluenceStatusSchema>;
export type Finding = z.infer<typeof FindingSchema>;
