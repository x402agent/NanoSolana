import { describe, expect, it } from "vitest";

import {
  deriveBitaxeHealth,
  deriveBitaxeMood,
  deriveBitaxeStage,
  loadBitaxeConfigFromEnv,
  type BitaxeStats,
} from "./client.js";

function makeStats(overrides: Partial<BitaxeStats> = {}): BitaxeStats {
  return {
    hashRate: 620,
    temp: 49,
    vrTemp: 44,
    power: 16,
    voltage: 0,
    current: 0,
    coreVoltage: 1200,
    coreVoltageActual: 1198,
    frequency: 575,
    sharesAccepted: 220,
    sharesRejected: 4,
    bestDiff: "",
    bestSessionDiff: "",
    uptimeSeconds: 3600,
    ASICModel: "BM1370",
    asicCount: 1,
    smallCoreCount: 0,
    hostname: "mawdaxe-001",
    macAddr: "",
    ssid: "",
    wifiStatus: "connected",
    stratumURL: "solo.ckpool.org",
    stratumPort: 3333,
    stratumUser: "btc-address",
    stratumDiff: 0,
    isRunning: true,
    overheat_mode: 0,
    fanPercent: 75,
    fanrpm: 3500,
    freeHeap: 0,
    version: "1.0.0",
    boardVersion: "gamma-602",
    flipScreen: 0,
    invertFanPolarity: 0,
    autofanspeed: 1,
    online: true,
    updatedAt: Date.now(),
    error: undefined,
    efficiency: 38.75,
    shareAcceptRate: 98.2,
    ...overrides,
  };
}

describe("bitaxe/client", () => {
  it("loads env-backed config with expected defaults", () => {
    const config = loadBitaxeConfigFromEnv({
      BITAXE_ENABLED: "true",
      BITAXE_HOST: "192.168.1.42",
      BITAXE_POLL_INTERVAL: "15",
      BITAXE_TEMP_WARNING: "61",
    });

    expect(config.enabled).toBe(true);
    expect(config.host).toBe("192.168.1.42");
    expect(config.pollIntervalMs).toBe(15_000);
    expect(config.tempWarning).toBe(61);
    expect(config.tempCritical).toBe(70);
  });

  it("derives alpha and ecstatic state for a strong miner", () => {
    const stats = makeStats();

    expect(deriveBitaxeStage(stats)).toBe("alpha");
    expect(deriveBitaxeHealth(stats, {
      tempWarning: 60,
      tempCritical: 70,
      offlineAfterMs: 120_000,
    })).toBe("healthy");
    expect(deriveBitaxeMood(stats, {
      tempWarning: 60,
      tempCritical: 70,
    }).mood).toBe("ecstatic");
  });

  it("derives hot or offline states for distressed miners", () => {
    const hot = makeStats({ temp: 74 });
    const offline = makeStats({ online: false, isRunning: false, hashRate: 0 });

    expect(deriveBitaxeHealth(hot, {
      tempWarning: 60,
      tempCritical: 70,
      offlineAfterMs: 120_000,
    })).toBe("critical");
    expect(deriveBitaxeMood(hot, {
      tempWarning: 60,
      tempCritical: 70,
    }).mood).toBe("hot");
    expect(deriveBitaxeStage(offline)).toBe("ghost");
  });
});
