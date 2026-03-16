// Stub: health
export interface HealthSummary {
  status: "healthy" | "degraded" | "unhealthy";
  version: string;
  uptime: number;
  checks: Record<string, { status: string; message?: string }>;
}
