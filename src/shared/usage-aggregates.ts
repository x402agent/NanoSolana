// Stub: usage-aggregates
export interface UsageAggregates {
  messages?: { total: number; byRole?: Record<string, number> };
  tokens?: { total: number; input?: number; output?: number };
  tools?: { total: number; byTool?: Record<string, number> };
  errors?: { total: number };
  cost?: { total: number };
}

export function aggregateUsage(sessions: unknown[]): UsageAggregates {
  return {
    messages: { total: 0 },
    tokens: { total: 0 },
    tools: { total: 0 },
    errors: { total: 0 },
    cost: { total: 0 },
  };
}
