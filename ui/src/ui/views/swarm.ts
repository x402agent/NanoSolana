// ── PumpFun Swarm Dashboard View ────────────────────────────────────
//
// Renders the swarm management panel with bot health, event stream,
// and agent overview.
// ────────────────────────────────────────────────────────────────────

import { html, nothing, type TemplateResult } from "lit";
import { t } from "../../i18n/index.ts";

// ── Types (mirror from nano-core, client-side only) ─────────────────

interface SwarmBotStatus {
  id: string;
  name: string;
  description: string;
  status: "stopped" | "starting" | "running" | "error" | "stopping";
  uptime: number;
  pid: number | null;
  restarts: number;
  lastError: string | null;
  eventsProcessed: number;
  eventsEmitted: number;
  errorsTotal: number;
}

interface SwarmAgent {
  id: string;
  role: string;
  status: string;
  personaAvatar?: string;
  personaTitle?: string;
  memoryStats?: {
    known: number;
    learned: number;
    inferred: number;
  };
  wallet?: string;
  uptime: number;
}

interface SwarmEvent {
  id: string;
  type: string;
  source: string;
  timestamp: string;
  data: unknown;
}

export interface SwarmViewState {
  swarmLoading: boolean;
  swarmError: string | null;
  swarmBots: SwarmBotStatus[];
  swarmAgents: SwarmAgent[];
  swarmEvents: SwarmEvent[];
  swarmMetrics: {
    totalEvents: number;
    eventsPerMinute: number;
    activeBots: number;
    activeAgents: number;
  } | null;
}

// ── Status badge ────────────────────────────────────────────────────

function statusBadge(status: string): TemplateResult {
  const colors: Record<string, string> = {
    running: "var(--accent-green, #22c55e)",
    starting: "var(--accent-yellow, #eab308)",
    stopped: "var(--text-muted, #6b7280)",
    error: "var(--accent-red, #ef4444)",
    stopping: "var(--accent-orange, #f97316)",
    active: "var(--accent-green, #22c55e)",
    idle: "var(--text-muted, #6b7280)",
  };
  const color = colors[status] ?? "var(--text-muted)";
  return html`<span class="swarm-badge" style="--badge-color:${color}">
    <span class="swarm-badge__dot"></span>
    ${status}
  </span>`;
}

// ── Format uptime ───────────────────────────────────────────────────

function formatUptime(seconds: number): string {
  if (seconds < 60) return `${Math.floor(seconds)}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
  return `${Math.floor(seconds / 86400)}d ${Math.floor((seconds % 86400) / 3600)}h`;
}

// ── Event type emoji ────────────────────────────────────────────────

function eventEmoji(type: string): string {
  const map: Record<string, string> = {
    "token:launch": "🚀",
    "token:graduation": "🎓",
    "trade:buy": "📈",
    "trade:sell": "📉",
    "trade:whale": "🐋",
    "fee:claim": "💸",
    "alert:cto": "⚡",
    "alert:whale": "🐋",
    "call:new": "📞",
    "bot:started": "✅",
    "bot:stopped": "⏹️",
    "bot:error": "❌",
    "system:metric": "📊",
  };
  return map[type] ?? "📡";
}

// ── Render ───────────────────────────────────────────────────────────

export function renderSwarmView(state: SwarmViewState): TemplateResult {
  if (state.swarmLoading) {
    return html`
      <div class="swarm-view">
        <div class="swarm-header">
          <h2 class="view-title">🐝 PumpFun Swarm</h2>
          <p class="view-subtitle">Multi-bot trading swarm orchestration</p>
        </div>
        <div class="swarm-loading">
          <div class="spinner"></div>
          <span>Connecting to swarm…</span>
        </div>
      </div>
    `;
  }

  if (state.swarmError) {
    return html`
      <div class="swarm-view">
        <div class="swarm-header">
          <h2 class="view-title">🐝 PumpFun Swarm</h2>
        </div>
        <div class="swarm-error">
          <span class="swarm-error__icon">⚠️</span>
          <span>${state.swarmError}</span>
        </div>
      </div>
    `;
  }

  const metrics = state.swarmMetrics;
  const bots = state.swarmBots;
  const agents = state.swarmAgents;
  const events = state.swarmEvents.slice(-20).reverse();

  return html`
    <div class="swarm-view">
      <div class="swarm-header">
        <h2 class="view-title">🐝 PumpFun Swarm</h2>
        <p class="view-subtitle">Multi-bot trading swarm orchestration</p>
      </div>

      <!-- Metrics strip -->
      ${metrics
        ? html`
        <section class="swarm-metrics">
          <div class="swarm-metric">
            <span class="swarm-metric__value">${metrics.activeBots}</span>
            <span class="swarm-metric__label">Active Bots</span>
          </div>
          <div class="swarm-metric">
            <span class="swarm-metric__value">${metrics.activeAgents}</span>
            <span class="swarm-metric__label">Agents</span>
          </div>
          <div class="swarm-metric">
            <span class="swarm-metric__value">${metrics.totalEvents.toLocaleString()}</span>
            <span class="swarm-metric__label">Events</span>
          </div>
          <div class="swarm-metric">
            <span class="swarm-metric__value">${metrics.eventsPerMinute}</span>
            <span class="swarm-metric__label">Events/min</span>
          </div>
        </section>
      `
        : nothing}

      <!-- Bot grid -->
      <section class="swarm-section">
        <h3 class="swarm-section__title">Trading Bots</h3>
        <div class="swarm-bot-grid">
          ${bots.length === 0
            ? html`<div class="swarm-empty">No bots registered. Start the swarm to see bots.</div>`
            : bots.map(
                (bot) => html`
              <div class="swarm-bot-card" data-status=${bot.status}>
                <div class="swarm-bot-card__header">
                  <span class="swarm-bot-card__name">${bot.name}</span>
                  ${statusBadge(bot.status)}
                </div>
                <p class="swarm-bot-card__desc">${bot.description}</p>
                <div class="swarm-bot-card__stats">
                  <span title="Uptime">⏱ ${formatUptime(bot.uptime)}</span>
                  <span title="Events processed">📡 ${bot.eventsProcessed}</span>
                  <span title="Errors">❌ ${bot.errorsTotal}</span>
                  ${bot.pid ? html`<span title="PID">🔧 ${bot.pid}</span>` : nothing}
                </div>
                ${bot.lastError
                  ? html`<div class="swarm-bot-card__error">${bot.lastError}</div>`
                  : nothing}
              </div>
            `,
              )}
        </div>
      </section>

      <!-- Active agents -->
      <section class="swarm-section">
        <h3 class="swarm-section__title">Active Agents</h3>
        <div class="swarm-agents-table">
          ${agents.length === 0
            ? html`<div class="swarm-empty">No agents spawned. Use /spawn in Telegram or the CLI.</div>`
            : html`
            <table class="swarm-table">
              <thead>
                <tr>
                  <th>Agent</th>
                  <th>Role</th>
                  <th>Persona</th>
                  <th>Status</th>
                  <th>Memory</th>
                  <th>Uptime</th>
                </tr>
              </thead>
              <tbody>
                ${agents.map(
                  (a) => html`
                  <tr>
                    <td><code>${a.id.slice(0, 8)}</code></td>
                    <td>${a.role}</td>
                    <td>${a.personaAvatar ?? ""} ${a.personaTitle ?? "—"}</td>
                    <td>${statusBadge(a.status)}</td>
                    <td>
                      ${a.memoryStats
                        ? html`<span class="memory-stats">
                          K:${a.memoryStats.known} L:${a.memoryStats.learned} I:${a.memoryStats.inferred}
                        </span>`
                        : "—"}
                    </td>
                    <td>${formatUptime(a.uptime)}</td>
                  </tr>
                `,
                )}
              </tbody>
            </table>
          `}
        </div>
      </section>

      <!-- Event stream -->
      <section class="swarm-section">
        <h3 class="swarm-section__title">Event Stream</h3>
        <div class="swarm-events">
          ${events.length === 0
            ? html`<div class="swarm-empty">No events yet. Events appear when bots are running.</div>`
            : events.map(
                (e) => html`
              <div class="swarm-event">
                <span class="swarm-event__emoji">${eventEmoji(e.type)}</span>
                <span class="swarm-event__type">${e.type}</span>
                <span class="swarm-event__source">${e.source}</span>
                <span class="swarm-event__time">${new Date(e.timestamp).toLocaleTimeString()}</span>
              </div>
            `,
              )}
        </div>
      </section>
    </div>
  `;
}
