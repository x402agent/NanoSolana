// Stub: session-usage-timeseries-types
export interface TimeSeriesPoint {
  timestamp: number;
  value: number;
}
export interface SessionUsageTimeSeries {
  points: TimeSeriesPoint[];
  resolution: number;
  startMs: number;
  endMs: number;
}
