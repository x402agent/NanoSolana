import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { join } from "path";
import { mkdtempSync, rmSync } from "fs";
import { tmpdir } from "os";
import { PersistentVault, connectVaultToClawVault } from "./persistence.js";
import { ClawVault } from "./clawvault.js";
import type { VaultEntry, Lesson } from "./clawvault.js";

let vault: PersistentVault;
let tempDir: string;

beforeAll(() => {
  tempDir = mkdtempSync(join(tmpdir(), "nanosolana-test-"));
  vault = new PersistentVault(join(tempDir, "test-memory.db"));
});

afterAll(() => {
  vault.close();
  rmSync(tempDir, { recursive: true, force: true });
});

describe("PersistentVault", () => {
  it("saves and retrieves entries by tier", () => {
    const entry: VaultEntry = {
      id: "test-known-1",
      tier: "known",
      content: "SOL price is $145",
      source: "birdeye",
      tags: ["SOL", "price"],
      confidence: 1.0,
      metadata: {},
      createdAt: Date.now(),
      expiresAt: Date.now() + 60_000,
    };

    vault.saveEntry(entry);
    const results = vault.getByTier("known");
    expect(results.length).toBeGreaterThanOrEqual(1);
    expect(results[0]!.content).toBe("SOL price is $145");
  });

  it("performs FTS5 full-text search", () => {
    vault.saveEntry({
      id: "test-learned-1",
      tier: "learned",
      content: "RSI divergence signals reversal on BONK",
      source: "strategy-engine",
      tags: ["BONK", "RSI", "divergence"],
      confidence: 0.8,
      createdAt: Date.now(),
      expiresAt: Date.now() + 7 * 86400_000,
    });

    const results = vault.searchFTS("divergence");
    expect(results.length).toBeGreaterThanOrEqual(1);
    expect(results[0]!.content).toContain("divergence");
  });

  it("saves and retrieves trades", () => {
    vault.saveTrade({
      id: "trade-1",
      tokenSymbol: "SOL",
      tradeType: "buy",
      entryPrice: 142.5,
      exitPrice: 148.0,
      pnl: 5.5,
      confidence: 0.78,
      reasoning: "momentum breakout",
      timestamp: Date.now(),
    });

    const trades = vault.getAllTrades();
    expect(trades.length).toBeGreaterThanOrEqual(1);
    expect(trades[0]!.tokenSymbol).toBe("SOL");
  });

  it("saves and retrieves lessons", () => {
    vault.saveLesson({
      id: "lesson-1",
      pattern: "RSI > 70 on low volume",
      outcome: "false breakout 60% of the time",
      adjustment: "reduce position size when volume < avg",
      confidenceImpact: -0.15,
      tier: "learned",
      tradeIds: ["trade-1"],
      createdAt: Date.now(),
    });

    const lessons = vault.getAllLessons();
    expect(lessons.length).toBeGreaterThanOrEqual(1);
    expect(lessons[0]!.pattern).toContain("RSI");
  });

  it("returns stats", () => {
    const stats = vault.getStats();
    expect(stats.entries).toBeGreaterThanOrEqual(2);
    expect(stats.trades).toBeGreaterThanOrEqual(1);
    expect(stats.lessons).toBeGreaterThanOrEqual(1);
    expect(stats.dbSizeKB).toBeGreaterThanOrEqual(0);
  });

  it("deletes entries", () => {
    vault.deleteEntry("test-known-1");
    const results = vault.getByTier("known");
    expect(results.find((e) => e.id === "test-known-1")).toBeUndefined();
  });
});

describe("connectVaultToClawVault", () => {
  it("persists ClawVault events to PersistentVault", () => {
    const clawVault = new ClawVault();
    const tempDir2 = mkdtempSync(join(tmpdir(), "nanosolana-bridge-"));
    const bridgeVault = new PersistentVault(join(tempDir2, "bridge.db"));

    connectVaultToClawVault(bridgeVault, clawVault);

    // Store something in ClawVault — it should auto-persist
    clawVault.storeKnown({
      content: "BONK pumping +15%",
      source: "birdeye",
      tags: ["BONK"],
    });

    const stats = bridgeVault.getStats();
    expect(stats.entries).toBeGreaterThanOrEqual(1);

    bridgeVault.close();
    rmSync(tempDir2, { recursive: true, force: true });
  });
});
