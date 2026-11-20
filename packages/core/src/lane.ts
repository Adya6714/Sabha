import { z } from "zod";

export const LaneSchema = z.enum([
  "auto",
  "notify",
  "delay",
  "ask",
  "council",
  "only_you",
  "block_scope",
]);

export type Lane = z.infer<typeof LaneSchema>;
