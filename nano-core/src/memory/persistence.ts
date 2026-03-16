/**
 * Nano Solana — PersistentVault: SQLite-backed FTS5 persistence for ClawVault
 *
 * Inspired by Hermes agent's FTS5 session search with LLM summarization.
 * Provides durable storage with full-text search across vault entries,
 * trade records, and lessons learned.
 */

import { homedir } from "os";
import { mkdirSync, statSync } from "fs";
import { dirname, join } from "path";
import type { VaultEntry, TradeRecord, Lesson, KnowledgeTier } from "./clawvault.js";
import { ClawVault } from "./clawvault.js";

// Lazy-load better-sqlite3 so the module degrades gracefully
let Database: typeof import("better-sqlite3") | undefined;
try {
  const mod = await import("better-sqlite3");
  Database = (mod.default ?? mod) as typeof import("better-sqlite3");
} catch { /* checked at construction time */ }

type DB = import("better-sqlite3").Database;

// ── SQL Schema ──────────────────────────────────────────────────

const SCHEMA = `
CREATE TABLE IF NOT EXISTS vault_entries (
  id TEXT PRIMARY KEY, tier TEXT NOT NULL, content TEXT NOT NULL,
  source TEXT NOT NULL, tags TEXT NOT NULL DEFAULT '',
  confidence REAL NOT NULL DEFAULT 1.0, metadata TEXT DEFAULT '{}',
  created_at INTEGER NOT NULL, expires_at INTEGER NOT NULL
);

CREATE VIRTUAL TABLE IF NOT EXISTS vault_fts USING fts5(
  content, source, tags, content='vault_entries', content_rowid='rowid'
);

CREATE TRIGGER IF NOT EXISTS vault_ai AFTER INSERT ON vault_entries BEGIN
  INSERT INTO vault_fts(rowid, content, source, tags)
    VALUES (new.rowid, new.content, new.source, new.tags);
END;
CREATE TRIGGER IF NOT EXISTS vault_ad AFTER DELETE ON vault_entries BEGIN
  INSERT INTO vault_fts(vault_fts, rowid, content, source, tags)
    VALUES ('delete', old.rowid, old.content, old.source, old.tags);
END;
CREATE TRIGGER IF NOT EXISTS vault_au AFTER UPDATE ON vault_entries BEGIN
  INSERT INTO vault_fts(vault_fts, rowid, content, source, tags)
    VALUES ('delete', old.rowid, old.content, old.source, old.tags);
  INSERT INTO vault_fts(rowid, content, source, tags)
    VALUES (new.rowid, new.content, new.source, new.tags);
END;

CREATE TABLE IF NOT EXISTS trade_records (
  id TEXT PRIMARY KEY, token_symbol TEXT NOT NULL, trade_type TEXT NOT NULL,
  entry_price REAL NOT NULL, exit_price REAL, pnl REAL,
  confidence REAL NOT NULL, reasoning TEXT NOT NULL DEFAULT '',
  timestamp INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS lessons (
  id TEXT PRIMARY KEY, pattern TEXT NOT NULL, outcome TEXT NOT NULL,
  adjustment TEXT NOT NULL DEFAULT '', confidence_impact REAL NOT NULL DEFAULT 0,
  tier TEXT NOT NULL DEFAULT 'learned', trade_ids TEXT NOT NULL DEFAULT '[]',
  created_at INTEGER NOT NULL
);
`;

const DEFAULT_DB_PATH = join(homedir(), ".nanosolana", "memory.db");

// ── Row types ───────────────────────────────────────────────────

interface VaultEntryRow {
  id: string; tier: string; content: string; source: string; tags: string;
  confidence: number; metadata: string; created_at: number; expires_at: number;
}
interface TradeRecordRow {
  id: string; token_symbol: string; trade_type: string; entry_price: number;
  exit_price: number | null; pnl: number | null; confidence: number;
  reasoning: string; timestamp: number;
}
interface LessonRow {
  id: string; pattern: string; outcome: string; adjustment: string;
  confidence_impact: number; tier: string; trade_ids: string; created_at: number;
}

// ── Row → Domain mappers ────────────────────────────────────────

function rowToEntry(r: VaultEntryRow): VaultEntry {
  return {
    id: r.id, tier: r.tier as KnowledgeTier, content: r.content,
    source: r.source, tags: r.tags ? r.tags.split(",") : [],
    confidence: r.confidence, metadata: JSON.parse(r.metadata || "{}"),
    createdAt: r.created_at, expiresAt: r.expires_at,
  };
}

function rowToTrade(r: TradeRecordRow): TradeRecord {
  return {
    id: r.id, tokenSymbol: r.token_symbol,
    tradeType: r.trade_type as TradeRecord["tradeType"],
    entryPrice: r.entry_price, exitPrice: r.exit_price ?? undefined,
    pnl: r.pnl ?? undefined, confidence: r.confidence,
    reasoning: r.reasoning, timestamp: r.timestamp,
  };
}

function rowToLesson(r: LessonRow): Lesson {
  return {
    id: r.id, pattern: r.pattern, outcome: r.outcome,
    adjustment: r.adjustment, confidenceImpact: r.confidence_impact,
    tier: r.tier as KnowledgeTier, tradeIds: JSON.parse(r.trade_ids || "[]"),
    createdAt: r.created_at,
  };
}

// ── PersistentVault ─────────────────────────────────────────────

export class PersistentVault {
  private db: DB;

  constructor(dbPath: string = DEFAULT_DB_PATH) {
    if (!Database) {
      throw new Error("better-sqlite3 is not installed. Run: npm install better-sqlite3");
    }
    mkdirSync(dirname(dbPath), { recursive: true });
    this.db = Database(dbPath) as DB;
    this.db.pragma("journal_mode = WAL");
    this.db.exec(SCHEMA);
  }

  // ── Vault Entries ─────────────────────────────────────────────

  saveEntry(entry: VaultEntry): void {
    this.db.prepare(`
      INSERT OR REPLACE INTO vault_entries
        (id, tier, content, source, tags, confidence, metadata, created_at, expires_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      entry.id, entry.tier, entry.content, entry.source,
      entry.tags.join(","), entry.confidence,
      JSON.stringify(entry.metadata ?? {}), entry.createdAt, entry.expiresAt,
    );
  }

  deleteEntry(id: string): void {
    this.db.prepare("DELETE FROM vault_entries WHERE id = ?").run(id);
  }

  searchFTS(query: string, limit = 20): VaultEntry[] {
    const rows = this.db.prepare(`
      SELECT ve.* FROM vault_entries ve
      JOIN vault_fts ON vault_fts.rowid = ve.rowid
      WHERE vault_fts MATCH ? ORDER BY rank LIMIT ?
    `).all(query, limit) as VaultEntryRow[];
    return rows.map(rowToEntry);
  }

  getByTier(tier: string): VaultEntry[] {
    return (this.db.prepare(
      "SELECT * FROM vault_entries WHERE tier = ? ORDER BY created_at DESC",
    ).all(tier) as VaultEntryRow[]).map(rowToEntry);
  }

  getExpired(): VaultEntry[] {
    return (this.db.prepare(
      "SELECT * FROM vault_entries WHERE expires_at <= ?",
    ).all(Date.now()) as VaultEntryRow[]).map(rowToEntry);
  }

  // ── Trade Records ─────────────────────────────────────────────

  saveTrade(trade: TradeRecord): void {
    this.db.prepare(`
      INSERT OR REPLACE INTO trade_records
        (id, token_symbol, trade_type, entry_price, exit_price, pnl, confidence, reasoning, timestamp)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      trade.id, trade.tokenSymbol, trade.tradeType, trade.entryPrice,
      trade.exitPrice ?? null, trade.pnl ?? null,
      trade.confidence, trade.reasoning, trade.timestamp,
    );
  }

  getAllTrades(limit = 100): TradeRecord[] {
    return (this.db.prepare(
      "SELECT * FROM trade_records ORDER BY timestamp DESC LIMIT ?",
    ).all(limit) as TradeRecordRow[]).map(rowToTrade);
  }

  // ── Lessons ───────────────────────────────────────────────────

  saveLesson(lesson: Lesson): void {
    this.db.prepare(`
      INSERT OR REPLACE INTO lessons
        (id, pattern, outcome, adjustment, confidence_impact, tier, trade_ids, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      lesson.id, lesson.pattern, lesson.outcome, lesson.adjustment,
      lesson.confidenceImpact, lesson.tier, JSON.stringify(lesson.tradeIds),
      lesson.createdAt,
    );
  }

  getAllLessons(): Lesson[] {
    return (this.db.prepare(
      "SELECT * FROM lessons ORDER BY created_at DESC",
    ).all() as LessonRow[]).map(rowToLesson);
  }

  // ── Stats & Lifecycle ─────────────────────────────────────────

  getStats(): { entries: number; trades: number; lessons: number; dbSizeKB: number } {
    const count = (tbl: string) =>
      (this.db.prepare(`SELECT COUNT(*) as c FROM ${tbl}`).get() as { c: number }).c;
    let dbSizeKB = 0;
    try { dbSizeKB = Math.round(statSync(this.db.name).size / 1024); } catch { /* ok */ }
    return { entries: count("vault_entries"), trades: count("trade_records"), lessons: count("lessons"), dbSizeKB };
  }

  close(): void {
    this.db.close();
  }
}

// ── ClawVault ↔ PersistentVault bridge ──────────────────────────

export function connectVaultToClawVault(vault: PersistentVault, clawVault: ClawVault): void {
  // Hydrate ClawVault from SQLite (non-expired entries only)
  const now = Date.now();
  for (const tier of ["known", "learned", "inferred"] as const) {
    for (const entry of vault.getByTier(tier)) {
      if (entry.expiresAt <= now) continue;
      if (tier === "known") {
        clawVault.storeKnown({ content: entry.content, source: entry.source, tags: entry.tags, metadata: entry.metadata });
      } else if (tier === "learned") {
        clawVault.storeLearned({ content: entry.content, source: entry.source, tags: entry.tags, confidence: entry.confidence });
      } else {
        clawVault.storeInferred({ content: entry.content, source: entry.source, tags: entry.tags });
      }
    }
  }

  // Auto-persist on ClawVault events
  clawVault.on("entryStored", (entry: VaultEntry) => vault.saveEntry(entry));
  clawVault.on("entryExpired", (entry: VaultEntry) => vault.deleteEntry(entry.id));
  clawVault.on("lessonLearned", (lesson: Lesson) => vault.saveLesson(lesson));
}
