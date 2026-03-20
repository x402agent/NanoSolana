import { EventEmitter } from "eventemitter3";

export type BitaxeAlertLevel = "info" | "warning" | "critical";
export type BitaxeStage = "egg" | "larva" | "juvenile" | "adult" | "alpha" | "ghost";
export type BitaxeMood = "ecstatic" | "happy" | "neutral" | "anxious" | "sad" | "hot";
export type BitaxeHealth = "disabled" | "healthy" | "warning" | "critical" | "offline";

export interface BitaxeStats {
  hashRate: number;
  temp: number;
  vrTemp: number;
  power: number;
  voltage: number;
  current: number;
  coreVoltage: number;
  coreVoltageActual: number;
  frequency: number;
  sharesAccepted: number;
  sharesRejected: number;
  bestDiff: string;
  bestSessionDiff: string;
  uptimeSeconds: number;
  ASICModel: string;
  asicCount: number;
  smallCoreCount: number;
  hostname: string;
  macAddr: string;
  ssid: string;
  wifiStatus: string;
  stratumURL: string;
  stratumPort: number;
  stratumUser: string;
  stratumDiff: number;
  isRunning: boolean;
  overheat_mode: number;
  fanPercent: number;
  fanrpm: number;
  freeHeap: number;
  version: string;
  boardVersion: string;
  flipScreen: number;
  invertFanPolarity: number;
  autofanspeed: number;
  online: boolean;
  updatedAt: number;
  error?: string;
  efficiency: number;
  shareAcceptRate: number;
}

export interface BitaxeAlert {
  id: string;
  key: string;
  level: BitaxeAlertLevel;
  message: string;
  createdAt: number;
}

export interface BitaxePetState {
  name: string;
  stage: BitaxeStage;
  mood: BitaxeMood;
  moodScore: number;
  totalShares: number;
  feedCount: number;
}

export interface BitaxeConfig {
  enabled: boolean;
  host: string;
  pollIntervalMs: number;
  alertsEnabled: boolean;
  tempWarning: number;
  tempCritical: number;
  hashRateMinGH: number;
  offlineAfterMs: number;
  alertCooldownMs: number;
  shareRejectMaxPct: number;
  petName: string;
  historyMax: number;
}

export interface BitaxeSnapshot {
  enabled: boolean;
  configured: boolean;
  host: string;
  health: BitaxeHealth;
  latest: BitaxeStats;
  history: BitaxeStats[];
  alerts: BitaxeAlert[];
  pet: BitaxePetState;
  updatedAt: number;
}

export interface BitaxeClientEvents {
  update: (snapshot: BitaxeSnapshot) => void;
  alert: (alert: BitaxeAlert, snapshot: BitaxeSnapshot) => void;
}

const DEFAULT_HISTORY_MAX = 360;
const DEFAULT_POLL_MS = 10_000;
const DEFAULT_OFFLINE_AFTER_MS = 120_000;
const DEFAULT_ALERT_COOLDOWN_MS = 300_000;
const DEFAULT_PET_NAME = "MawdAxe";
const SOLID_OFFLINE_STATS: BitaxeStats = {
  hashRate: 0,
  temp: 0,
  vrTemp: 0,
  power: 0,
  voltage: 0,
  current: 0,
  coreVoltage: 0,
  coreVoltageActual: 0,
  frequency: 0,
  sharesAccepted: 0,
  sharesRejected: 0,
  bestDiff: "",
  bestSessionDiff: "",
  uptimeSeconds: 0,
  ASICModel: "",
  asicCount: 0,
  smallCoreCount: 0,
  hostname: "",
  macAddr: "",
  ssid: "",
  wifiStatus: "",
  stratumURL: "",
  stratumPort: 0,
  stratumUser: "",
  stratumDiff: 0,
  isRunning: false,
  overheat_mode: 0,
  fanPercent: 0,
  fanrpm: 0,
  freeHeap: 0,
  version: "",
  boardVersion: "",
  flipScreen: 0,
  invertFanPolarity: 0,
  autofanspeed: 0,
  online: false,
  updatedAt: 0,
  error: "Bitaxe not configured",
  efficiency: 0,
  shareAcceptRate: 100,
};

function clamp(value: number, lower: number, upper: number): number {
  return Math.max(lower, Math.min(upper, value));
}

function parseBooleanEnv(value: string | undefined, fallback: boolean): boolean {
  if (value == null || value.trim() === "") {
    return fallback;
  }
  const normalized = value.trim().toLowerCase();
  if (["1", "true", "yes", "on"].includes(normalized)) return true;
  if (["0", "false", "no", "off"].includes(normalized)) return false;
  return fallback;
}

function parseNumberEnv(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function normalizeBitaxeHost(host: string): string {
  return host.trim().replace(/^https?:\/\//i, "").replace(/\/+$/, "");
}

function buildBitaxeBaseUrl(host: string): string {
  return `http://${normalizeBitaxeHost(host)}`;
}

function decorateStats(raw: Partial<BitaxeStats>, updatedAt: number, error?: string): BitaxeStats {
  const stats: BitaxeStats = {
    ...SOLID_OFFLINE_STATS,
    ...raw,
    updatedAt,
  };

  stats.online = Boolean(stats.isRunning || stats.hashRate > 0);
  stats.error = error;
  stats.efficiency = stats.power > 0 ? stats.hashRate / stats.power : 0;
  const totalShares = stats.sharesAccepted + stats.sharesRejected;
  stats.shareAcceptRate = totalShares > 0
    ? (stats.sharesAccepted / totalShares) * 100
    : 100;

  return stats;
}

export function loadBitaxeConfigFromEnv(env: NodeJS.ProcessEnv = process.env): BitaxeConfig {
  const enabled = parseBooleanEnv(env.BITAXE_ENABLED, false);
  return {
    enabled,
    host: normalizeBitaxeHost(env.BITAXE_HOST ?? ""),
    pollIntervalMs: Math.max(1_000, parseNumberEnv(env.BITAXE_POLL_INTERVAL, DEFAULT_POLL_MS / 1000) * 1000),
    alertsEnabled: parseBooleanEnv(env.BITAXE_ALERTS_ENABLED, true),
    tempWarning: parseNumberEnv(env.BITAXE_TEMP_WARNING, 60),
    tempCritical: parseNumberEnv(env.BITAXE_TEMP_CRITICAL, 70),
    hashRateMinGH: parseNumberEnv(env.BITAXE_HASHRATE_MIN, 0),
    offlineAfterMs: Math.max(10_000, parseNumberEnv(env.BITAXE_OFFLINE_AFTER, DEFAULT_OFFLINE_AFTER_MS / 1000) * 1000),
    alertCooldownMs: Math.max(5_000, parseNumberEnv(env.BITAXE_ALERT_COOLDOWN, DEFAULT_ALERT_COOLDOWN_MS / 1000) * 1000),
    shareRejectMaxPct: parseNumberEnv(env.BITAXE_SHARE_REJECT_MAX_PCT, 5),
    petName: (env.BITAXE_PET_NAME ?? DEFAULT_PET_NAME).trim() || DEFAULT_PET_NAME,
    historyMax: Math.max(30, parseNumberEnv(env.BITAXE_HISTORY_MAX, DEFAULT_HISTORY_MAX)),
  };
}

export function createBitaxeClientFromEnv(env: NodeJS.ProcessEnv = process.env): BitaxeClient | null {
  const config = loadBitaxeConfigFromEnv(env);
  if (!config.enabled || !config.host) {
    return null;
  }
  return new BitaxeClient(config);
}

export function deriveBitaxeStage(stats: BitaxeStats): BitaxeStage {
  if (!stats.online && stats.updatedAt > 0) return "ghost";
  if (stats.sharesAccepted >= 200 && stats.shareAcceptRate >= 95) return "alpha";
  if (stats.sharesAccepted >= 50 && stats.shareAcceptRate >= 90) return "adult";
  if (stats.sharesAccepted >= 10) return "juvenile";
  if (stats.sharesAccepted >= 1) return "larva";
  return "egg";
}

export function deriveBitaxeMood(stats: BitaxeStats, config: Pick<BitaxeConfig, "tempWarning" | "tempCritical">): {
  mood: BitaxeMood;
  moodScore: number;
} {
  if (!stats.online) {
    return { mood: "sad", moodScore: -0.85 };
  }

  if (stats.temp >= config.tempCritical) {
    return { mood: "hot", moodScore: -1 };
  }

  const hashrateScore = stats.hashRate >= 600 ? 0.35 : stats.hashRate >= 540 ? 0.15 : -0.2;
  const tempScore = stats.temp <= 52 ? 0.3 : stats.temp < config.tempWarning ? 0.1 : -0.4;
  const shareScore = stats.sharesAccepted >= 100 ? 0.25 : stats.sharesAccepted >= 10 ? 0.1 : 0;
  const rejectScore = stats.shareAcceptRate >= 98 ? 0.15 : stats.shareAcceptRate >= 95 ? 0.05 : -0.25;
  const moodScore = clamp(hashrateScore + tempScore + shareScore + rejectScore, -1, 1);

  if (moodScore >= 0.6) return { mood: "ecstatic", moodScore };
  if (moodScore >= 0.25) return { mood: "happy", moodScore };
  if (moodScore >= -0.15) return { mood: "neutral", moodScore };
  if (moodScore >= -0.5) return { mood: "anxious", moodScore };
  return { mood: "sad", moodScore };
}

export function deriveBitaxeHealth(
  stats: BitaxeStats,
  config: Pick<BitaxeConfig, "tempWarning" | "tempCritical" | "offlineAfterMs">,
): BitaxeHealth {
  if (!stats.online && stats.updatedAt <= 0) return "offline";
  if (!stats.online) return "offline";
  if (stats.temp >= config.tempCritical) return "critical";
  if (stats.temp >= config.tempWarning) return "warning";
  return "healthy";
}

export class BitaxeClient extends EventEmitter<BitaxeClientEvents> {
  private latest: BitaxeStats = { ...SOLID_OFFLINE_STATS };
  private history: BitaxeStats[] = [];
  private alerts: BitaxeAlert[] = [];
  private intervalHandle: ReturnType<typeof setInterval> | null = null;
  private inFlight = false;
  private lastAlertByKey = new Map<string, number>();

  constructor(private readonly config: BitaxeConfig) {
    super();
  }

  async start(): Promise<void> {
    if (this.intervalHandle) return;
    await this.refresh();
    this.intervalHandle = setInterval(() => {
      void this.refresh();
    }, this.config.pollIntervalMs);
  }

  stop(): void {
    if (this.intervalHandle) {
      clearInterval(this.intervalHandle);
      this.intervalHandle = null;
    }
  }

  getConfig(): BitaxeConfig {
    return { ...this.config };
  }

  getLatest(): BitaxeStats {
    return { ...this.latest };
  }

  getHistory(limit = 60): BitaxeStats[] {
    const max = Math.max(1, limit);
    return this.history.slice(-max).map((entry) => ({ ...entry }));
  }

  getAlerts(limit = 20): BitaxeAlert[] {
    return this.alerts.slice(-Math.max(1, limit)).reverse().map((entry) => ({ ...entry }));
  }

  getPetState(): BitaxePetState {
    const latest = this.getLatest();
    const { mood, moodScore } = deriveBitaxeMood(latest, this.config);
    return {
      name: this.config.petName,
      stage: deriveBitaxeStage(latest),
      mood,
      moodScore,
      totalShares: latest.sharesAccepted,
      feedCount: latest.sharesAccepted * 11,
    };
  }

  getSnapshot(historyLimit = 60, alertLimit = 20): BitaxeSnapshot {
    const latest = this.getLatest();
    return {
      enabled: this.config.enabled,
      configured: Boolean(this.config.host),
      host: this.config.host,
      health: deriveBitaxeHealth(latest, this.config),
      latest,
      history: this.getHistory(historyLimit),
      alerts: this.getAlerts(alertLimit),
      pet: this.getPetState(),
      updatedAt: latest.updatedAt,
    };
  }

  async refresh(): Promise<BitaxeStats> {
    if (this.inFlight) {
      return this.getLatest();
    }

    this.inFlight = true;
    try {
      const response = await fetch(`${buildBitaxeBaseUrl(this.config.host)}/api/system/info`, {
        headers: {
          Accept: "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`Bitaxe API returned HTTP ${response.status}`);
      }

      const json = (await response.json()) as Partial<BitaxeStats>;
      const next = decorateStats(json, Date.now());
      this.latest = next;
      this.pushHistory(next);
      this.evaluateAlerts(next);
      this.emit("update", this.getSnapshot());
      return next;
    } catch (error) {
      const offline = decorateStats({
        ...this.latest,
        hashRate: 0,
        isRunning: false,
      }, Date.now(), error instanceof Error ? error.message : String(error));
      offline.online = false;
      this.latest = offline;
      this.pushHistory(offline);
      this.evaluateAlerts(offline);
      this.emit("update", this.getSnapshot());
      return offline;
    } finally {
      this.inFlight = false;
    }
  }

  async restart(): Promise<void> {
    await this.request("/api/system/restart", {
      method: "POST",
    });
  }

  async setFrequency(mhz: number): Promise<void> {
    await this.patchSystem({ frequency: Math.round(mhz) });
  }

  async setCoreVoltage(mv: number): Promise<void> {
    await this.patchSystem({ coreVoltage: Math.round(mv) });
  }

  async setFanSpeed(percent: number): Promise<void> {
    await this.patchSystem({ fanPercent: clamp(Math.round(percent), 0, 100) });
  }

  async setStratumURL(stratumURL: string, stratumPort: number): Promise<void> {
    await this.patchSystem({
      stratumURL: stratumURL.trim(),
      stratumPort: Math.round(stratumPort),
    });
  }

  async setStratumUser(stratumUser: string): Promise<void> {
    await this.patchSystem({ stratumUser: stratumUser.trim() });
  }

  private async patchSystem(payload: Record<string, unknown>): Promise<void> {
    await this.request("/api/system", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
  }

  private async request(path: string, init: RequestInit): Promise<void> {
    const response = await fetch(`${buildBitaxeBaseUrl(this.config.host)}${path}`, init);
    if (!response.ok) {
      throw new Error(`Bitaxe request failed with HTTP ${response.status}`);
    }
    await this.refresh();
  }

  private pushHistory(stats: BitaxeStats): void {
    this.history.push({ ...stats });
    if (this.history.length > this.config.historyMax) {
      this.history.splice(0, this.history.length - this.config.historyMax);
    }
  }

  private evaluateAlerts(stats: BitaxeStats): void {
    if (!this.config.alertsEnabled) return;

    if (!stats.online) {
      this.fireAlert("offline", "critical", `Bitaxe offline at ${this.config.host}: ${stats.error || "no response"}`);
      return;
    }

    if (stats.temp >= this.config.tempCritical) {
      this.fireAlert("temp-critical", "critical", `Critical Bitaxe temp ${stats.temp.toFixed(1)}°C at ${this.config.host}`);
    } else if (stats.temp >= this.config.tempWarning) {
      this.fireAlert("temp-warning", "warning", `High Bitaxe temp ${stats.temp.toFixed(1)}°C at ${this.config.host}`);
    }

    if (this.config.hashRateMinGH > 0 && stats.hashRate < this.config.hashRateMinGH) {
      this.fireAlert("hashrate-low", "warning", `Hashrate dropped to ${stats.hashRate.toFixed(1)} GH/s at ${this.config.host}`);
    }

    if (stats.sharesAccepted + stats.sharesRejected >= 10
      && stats.shareAcceptRate < (100 - this.config.shareRejectMaxPct)) {
      const rejectRate = 100 - stats.shareAcceptRate;
      this.fireAlert(
        "reject-rate",
        "warning",
        `Share reject rate is ${rejectRate.toFixed(1)}% at ${this.config.host}`,
      );
    }
  }

  private fireAlert(key: string, level: BitaxeAlertLevel, message: string): void {
    const now = Date.now();
    const lastAlertAt = this.lastAlertByKey.get(key) ?? 0;
    if (now - lastAlertAt < this.config.alertCooldownMs) {
      return;
    }

    this.lastAlertByKey.set(key, now);
    const alert: BitaxeAlert = {
      id: `${key}:${now}`,
      key,
      level,
      message,
      createdAt: now,
    };

    this.alerts.push(alert);
    if (this.alerts.length > 100) {
      this.alerts.splice(0, this.alerts.length - 100);
    }

    this.emit("alert", alert, this.getSnapshot());
  }
}
