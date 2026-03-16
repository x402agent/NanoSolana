// Stub: usage-types (shared)
export interface UsageSummary {
  totalTokens: number;
  totalCost: number;
  inputTokens: number;
  outputTokens: number;
}
export interface CostUsageSummary {
  total: number;
  byProvider: Record<string, number>;
  byModel: Record<string, number>;
}
