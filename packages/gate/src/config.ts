export type GateConfig = {
  onlyYouCategories: string[];
  spendCap: number;
  askBudget: number;
  asksUsedToday: number;
  coolingOffMinutes: number;
  amountBands: { low: number; medium: number; high: number };
  lambda: number;
};

/**
 * Confirmed early-access defaults: 120 minutes of cooling-off and 5 asks per day.
 * `spendCap` is the person's purchase cap, separate from the ₹100 model-key ceiling.
 */
export const defaultGateConfig = (): GateConfig => ({
  onlyYouCategories: ["relationships", "health"],
  spendCap: 2000,
  askBudget: 5,
  asksUsedToday: 0,
  coolingOffMinutes: 120,
  amountBands: { low: 2000, medium: 20000, high: Infinity },
  lambda: 1,
});
