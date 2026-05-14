/**
 * ClawdBot — Interactive Local UI Server
 *
 * Serves a local web UI on localhost that provides:
 *   - Animated ClawdBot lobster character
 *   - Real-time system status (wallet, OODA, pet)
 *   - Chat interface for interacting with the agent
 *   - One-click commands for wallet, health, registry
 *
 * TypeScript port of pkg/nanobot/server.go
 */

import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { homedir, platform, arch } from "node:os";
import { exec } from "node:child_process";
import { createBitaxeClientFromEnv, type BitaxeClient } from "../bitaxe/client.js";

// ── Types ────────────────────────────────────────────────────────────

interface ClawdBotConfig {
  port: number;
  binaryPath?: string;
}

interface StatusResponse {
  agent: string;
  version: string;
  platform: string;
  time: string;
  uptime: string;
  daemon: string;
  wallet: string;
  registry: string;
  miner: string;
}

// ── ClawdBot Server ───────────────────────────────────────────────────

export class ClawdBotServer {
  private port: number;
  private binaryPath: string;
  private bitaxe: BitaxeClient | null = createBitaxeClientFromEnv();

  constructor(config: ClawdBotConfig) {
    this.port = config.port || 7777;
    this.binaryPath = config.binaryPath || "clawd";
  }

  async start(): Promise<void> {
    if (this.bitaxe) {
      await this.bitaxe.start();
    }

    const server = createServer((req, res) => {
      this.handleRequest(req, res);
    });

    return new Promise((resolve, reject) => {
      server.listen(this.port, "127.0.0.1", () => {
        const url = `http://127.0.0.1:${this.port}`;
        console.log(`  🤖 ClawdBot UI: ${url}`);

        // Open in browser
        setTimeout(() => openBrowser(url), 300);
        resolve();
      });

      server.on("error", reject);
    });
  }

  private handleRequest(req: IncomingMessage, res: ServerResponse): void {
    const url = req.url || "/";
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");

    if (req.method === "OPTIONS") {
      res.writeHead(204);
      res.end();
      return;
    }

    if (url === "/api/status") {
      this.handleStatus(res);
    } else if (url === "/api/miner" && req.method === "GET") {
      void this.handleMinerStatus(res);
    } else if (url === "/api/miner" && req.method === "POST") {
      void this.handleMinerCommand(req, res);
    } else if (url === "/api/chat" && req.method === "POST") {
      this.handleChat(req, res);
    } else if (url === "/api/run" && req.method === "POST") {
      this.handleRun(req, res);
    } else {
      this.serveUI(res);
    }
  }

  // ── /api/status ────────────────────────────────────────────

  private handleStatus(res: ServerResponse): void {
    const home = homedir();
    const nanoHome = join(home, ".nanosolana");

    const status: StatusResponse = {
      agent: "Solana clawd",
      version: "0.1.0",
      platform: `${platform()}/${arch()}`,
      time: new Date().toISOString(),
      uptime: "running",
      daemon: existsSync(join(nanoHome, "workspace", "HEARTBEAT.md")) ? "alive" : "stopped",
      wallet: existsSync(join(nanoHome, "wallet.pub")) ? "configured" : "not configured",
      registry: existsSync(join(nanoHome, "registry", "registration.json"))
        ? "registered"
        : "not registered",
      miner: this.bitaxe ? "configured" : "not configured",
    };

    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify(status));
  }

  // ── /api/chat ──────────────────────────────────────────────

  private handleChat(req: IncomingMessage, res: ServerResponse): void {
    let body = "";
    req.on("data", (chunk) => (body += chunk));
    req.on("end", () => {
      try {
        const { message } = JSON.parse(body);
        const reply = nanobotReply(String(message || "").trim().toLowerCase());
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ reply, mood: "happy" }));
      } catch {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "bad request" }));
      }
    });
  }

  // ── /api/miner ─────────────────────────────────────────────

  private async handleMinerStatus(res: ServerResponse): Promise<void> {
    if (!this.bitaxe) {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({
        ok: true,
        miner: {
          enabled: false,
          configured: false,
          host: process.env.BITAXE_HOST?.trim() ?? "",
        },
      }));
      return;
    }

    await this.bitaxe.refresh();
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({
      ok: true,
      miner: this.bitaxe.getSnapshot(),
    }));
  }

  private handleMinerCommand(req: IncomingMessage, res: ServerResponse): void {
    let body = "";
    req.on("data", (chunk) => (body += chunk));
    req.on("end", () => {
      void (async () => {
        if (!this.bitaxe) {
          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(JSON.stringify({
            ok: false,
            error: "Bitaxe is not configured",
          }));
          return;
        }

        try {
          const payload = JSON.parse(body || "{}") as Record<string, unknown>;
          const action = String(payload.action || "refresh").trim().toLowerCase();

          switch (action) {
            case "refresh":
              await this.bitaxe.refresh();
              break;
            case "restart":
              await this.bitaxe.restart();
              break;
            case "set_frequency":
            case "frequency":
              await this.bitaxe.setFrequency(Number(payload.frequency ?? payload.value ?? 500));
              break;
            case "set_voltage":
            case "voltage":
              await this.bitaxe.setCoreVoltage(Number(payload.voltage ?? payload.value ?? 1200));
              break;
            case "set_fan":
            case "fan":
              await this.bitaxe.setFanSpeed(Number(payload.fanPercent ?? payload.value ?? 0));
              break;
            case "set_pool":
            case "pool":
              await this.bitaxe.setStratumURL(
                String(payload.stratumURL ?? payload.url ?? ""),
                Number(payload.stratumPort ?? payload.port ?? 3333),
              );
              break;
            case "set_wallet":
            case "wallet":
              await this.bitaxe.setStratumUser(String(payload.stratumUser ?? payload.wallet ?? ""));
              break;
            default:
              res.writeHead(400, { "Content-Type": "application/json" });
              res.end(JSON.stringify({ ok: false, error: `Unsupported miner action: ${action}` }));
              return;
          }

          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(JSON.stringify({
            ok: true,
            action,
            miner: this.bitaxe.getSnapshot(),
          }));
        } catch (error) {
          res.writeHead(400, { "Content-Type": "application/json" });
          res.end(JSON.stringify({
            ok: false,
            error: error instanceof Error ? error.message : "bad request",
          }));
        }
      })();
    });
  }

  // ── /api/run ───────────────────────────────────────────────

  private handleRun(req: IncomingMessage, res: ServerResponse): void {
    let body = "";
    req.on("data", (chunk) => (body += chunk));
    req.on("end", () => {
      try {
        const { command } = JSON.parse(body);
        const allowed = new Set([
          "status",
          "pet",
          "version",
        ]);

        const cmd = String(command || "").trim();
        if (!allowed.has(cmd)) {
          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(
            JSON.stringify({
              output: `⚠️ Command '${cmd}' not available in UI mode. Use terminal.`,
              ok: false,
            }),
          );
          return;
        }

        exec(`${this.binaryPath} ${cmd}`, { timeout: 10000 }, (err, stdout, stderr) => {
          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(
            JSON.stringify({
              output: stdout || stderr || "",
              ok: !err,
            }),
          );
        });
      } catch {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "bad request" }));
      }
    });
  }

  // ── Serve UI HTML ──────────────────────────────────────────

  private serveUI(res: ServerResponse): void {
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    res.end(NANOBOT_HTML);
  }
}

// ── ClawdBot Reply Engine ─────────────────────────────────────────────

function nanobotReply(msg: string): string {
  if (/hello|hi|hey/.test(msg)) {
    return "Hey there! 🦞 I'm ClawdBot, your Solana trading companion. What can I help you with?";
  }
  if (/trade|swap/.test(msg)) {
    return "Ready to trade! 📈 Use `nanosolana go` for one-shot launch or `nanosolana daemon` for an explicit long-running runtime. I use Jupiter DEX for swaps with real-time Helius data.";
  }
  if (/wallet|balance/.test(msg)) {
    return "💰 Your agent wallet was generated at birth. Run `nanosolana status` to check balance. Private key is encrypted in AES-256-GCM vault.";
  }
  if (/health|status/.test(msg)) {
    return "🟢 Run `nanosolana status` to check everything — wallet, pet, OODA loop, gateway, and registry.";
  }
  if (/miner|bitaxe|hashrate|mining/.test(msg)) {
    return "⛏ Bitaxe mining support is available when BITAXE_ENABLED=true and BITAXE_HOST points at your AxeOS device. Use the miner panel in ClawdBot or the Chrome extension miner controls to monitor hashrate, temperature, pool settings, and restart/frequency actions.";
  }
  if (/pet|tamagochi|mood/.test(msg)) {
    return "🦞 I'm your TamaGOchi! My mood and evolution are driven by trading performance. Good trades = happy ClawdBot. Check with `nanosolana pet`.";
  }
  if (/register|nft|identity/.test(msg)) {
    return "🆔 Your Birth Certificate NFT was minted on devnet at birth. Run `nanosolana status` to see your on-chain identity.";
  }
  if (/help|what can/.test(msg)) {
    return "I can help with:\n• 📊 Wallet balance & health\n• 📈 Trading with OODA loop\n• 🦞 TamaGOchi pet status\n• 🆔 On-chain identity\n• 📀 DVD screensaver (`nanosolana dvd`)\n\nJust ask!";
  }
  if (/ooda|loop/.test(msg)) {
    return "🔄 The OODA loop: Observe (Helius+Birdeye) → Orient (AI reasoning) → Decide (RSI+EMA+ATR) → Act (Jupiter swaps). Run with `nanosolana go` or keep it online with `nanosolana daemon`.";
  }
  if (/install|setup/.test(msg)) {
    return "🚀 Fastest install:\n```\nnpx nanosolana go\n```\nLong-running daemon:\n```\nnpx nanosolana daemon\n```\nOr shell install:\n```\ncurl -fsSL https://nanosolana.com/install.sh | bash\nnanosolana go\n```";
  }
  return "🦞 I'm focused on Solana trading and on-chain ops. Try asking about trading, wallet, health, or my TamaGOchi status!";
}

// ── Open Browser ─────────────────────────────────────────────────────

function openBrowser(url: string): void {
  const cmd =
    platform() === "darwin"
      ? `open "${url}"`
      : platform() === "win32"
        ? `start "${url}"`
        : `xdg-open "${url}"`;

  exec(cmd, () => { });
}

// ── Embedded ClawdBot UI HTML ─────────────────────────────────────────

const NANOBOT_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>ClawdBot — Solana Trading Companion</title>
  <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600;700&family=Space+Grotesk:wght@400;500;600;700&display=swap" rel="stylesheet" />
  <style>
    :root {
      --bg: #060810; --surface: #0a0e1a; --card: rgba(15, 20, 40, 0.85);
      --green: #14F195; --purple: #9945FF; --orange: #FF6B35;
      --text: #e8ecf4; --muted: #8892b0; --border: rgba(20, 241, 149, 0.15);
      --mono: 'JetBrains Mono', monospace; --body: 'Space Grotesk', sans-serif;
    }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: var(--body); background: var(--bg); color: var(--text); min-height: 100vh; }
    .container { max-width: 800px; margin: 0 auto; padding: 2rem 1.5rem; }
    h1 { font-size: 2rem; background: linear-gradient(135deg, var(--green), var(--purple));
      -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
      margin-bottom: 0.5rem; text-align: center; }
    .subtitle { text-align: center; color: var(--muted); margin-bottom: 2rem; font-size: 0.9rem; }

    .lobster { text-align: center; font-size: 4rem; margin-bottom: 1rem; animation: bounce 2s ease-in-out infinite; }
    @keyframes bounce { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }

    .actions { display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 0.75rem; margin-bottom: 2rem; }
    .btn {
      background: var(--card); border: 1px solid var(--border); border-radius: 10px;
      padding: 0.75rem; text-align: center; cursor: pointer; transition: all 0.2s;
      color: var(--text); font-size: 0.85rem; font-family: var(--mono);
    }
    .btn:hover { border-color: var(--green); transform: translateY(-2px); }

    .output {
      background: #0d1117; border: 1px solid rgba(20, 241, 149, 0.2); border-radius: 12px;
      padding: 1rem; font-family: var(--mono); font-size: 0.8rem; color: var(--green);
      min-height: 120px; max-height: 300px; overflow-y: auto; white-space: pre-wrap;
      margin-bottom: 2rem;
    }

    .chat-box { display: flex; gap: 0.75rem; margin-bottom: 1rem; }
    .chat-input {
      flex: 1; padding: 0.75rem 1rem; border-radius: 10px; border: 1px solid var(--border);
      background: var(--card); color: var(--text); font-family: var(--body); font-size: 0.9rem;
      outline: none;
    }
    .chat-input:focus { border-color: var(--green); }
    .chat-send {
      background: linear-gradient(135deg, var(--green), var(--purple));
      color: var(--bg); border: none; padding: 0.75rem 1.5rem; border-radius: 10px;
      font-weight: 600; cursor: pointer; transition: transform 0.15s;
    }
    .chat-send:hover { transform: translateY(-1px); }

    .status-bar {
      text-align: center; padding: 1rem; font-family: var(--mono);
      font-size: 0.75rem; color: var(--muted); border-top: 1px solid var(--border);
    }
    .miner-panel {
      background: linear-gradient(180deg, rgba(255, 107, 53, 0.10), rgba(15, 20, 40, 0.92));
      border: 1px solid rgba(255, 107, 53, 0.25);
      border-radius: 16px;
      padding: 1rem;
      margin-bottom: 1.25rem;
    }
    .miner-head { display: flex; justify-content: space-between; align-items: center; gap: 1rem; margin-bottom: 1rem; }
    .miner-title { font-size: 1rem; font-weight: 700; letter-spacing: 0.04em; }
    .health-pill {
      font-family: var(--mono); font-size: 0.75rem; padding: 0.35rem 0.6rem; border-radius: 999px;
      border: 1px solid rgba(255,255,255,0.1); text-transform: uppercase; letter-spacing: 0.08em;
    }
    .miner-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 0.75rem; margin-bottom: 1rem; }
    .miner-stat { background: rgba(6, 8, 16, 0.65); border: 1px solid rgba(255,255,255,0.06); border-radius: 12px; padding: 0.75rem; }
    .miner-label { font-size: 0.65rem; color: var(--muted); font-family: var(--mono); letter-spacing: 0.08em; text-transform: uppercase; }
    .miner-value { font-size: 1rem; font-weight: 700; margin-top: 0.35rem; }
    .miner-subtle { font-size: 0.75rem; color: var(--muted); font-family: var(--mono); }
    .miner-chart {
      width: 100%; height: 88px; display: block; background: rgba(6, 8, 16, 0.55);
      border: 1px solid rgba(255,255,255,0.06); border-radius: 12px; margin-bottom: 1rem;
    }
    .miner-controls { display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 0.65rem; margin-bottom: 1rem; }
    .miner-inputs { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 0.75rem; margin-bottom: 0.75rem; }
    .miner-input {
      width: 100%; padding: 0.75rem 0.9rem; border-radius: 10px; border: 1px solid var(--border);
      background: rgba(6, 8, 16, 0.75); color: var(--text); font-family: var(--mono); font-size: 0.8rem;
    }
    .alerts {
      background: rgba(6, 8, 16, 0.55); border: 1px solid rgba(255,255,255,0.06); border-radius: 12px;
      padding: 0.85rem; font-family: var(--mono); font-size: 0.75rem; color: var(--muted);
    }
    .alert-item { padding: 0.3rem 0; border-bottom: 1px solid rgba(255,255,255,0.04); }
    .alert-item:last-child { border-bottom: none; }
  </style>
</head>
<body>
  <div class="container">
    <div class="lobster" id="lobster">🦞</div>
    <h1>ClawdBot</h1>
    <p class="subtitle">Your Solana Trading Companion</p>

    <div class="actions">
      <div class="btn" onclick="runCmd('status')">📊 Status</div>
      <div class="btn" onclick="runCmd('pet')">🦞 Pet</div>
      <div class="btn" onclick="runCmd('version')">📋 Version</div>
      <div class="btn" onclick="fetchStatus()">🟢 Health</div>
      <div class="btn" onclick="fetchMiner()">⛏ Miner</div>
    </div>

    <div class="output" id="output">🦞 Welcome to ClawdBot! Click a button or chat below.</div>

    <div class="miner-panel">
      <div class="miner-head">
        <div>
          <div class="miner-title">⛏ MawdAxe Miner</div>
          <div class="miner-subtle" id="miner-host">Waiting for Bitaxe configuration...</div>
        </div>
        <div class="health-pill" id="miner-health">offline</div>
      </div>

      <div class="miner-grid">
        <div class="miner-stat"><div class="miner-label">Hashrate</div><div class="miner-value" id="miner-hashrate">--</div></div>
        <div class="miner-stat"><div class="miner-label">Temp</div><div class="miner-value" id="miner-temp">--</div></div>
        <div class="miner-stat"><div class="miner-label">Power</div><div class="miner-value" id="miner-power">--</div></div>
        <div class="miner-stat"><div class="miner-label">Efficiency</div><div class="miner-value" id="miner-efficiency">--</div></div>
        <div class="miner-stat"><div class="miner-label">Shares</div><div class="miner-value" id="miner-shares">--</div></div>
        <div class="miner-stat"><div class="miner-label">Pet State</div><div class="miner-value" id="miner-pet">--</div></div>
      </div>

      <svg class="miner-chart" id="miner-chart" viewBox="0 0 320 88" preserveAspectRatio="none">
        <polyline id="miner-chart-line" points="" fill="none" stroke="#14F195" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"></polyline>
      </svg>

      <div class="miner-controls">
        <button class="btn" onclick="fetchMiner()">Refresh</button>
        <button class="btn" onclick="sendMinerAction('restart')">Restart</button>
        <button class="btn" onclick="sendMinerAction('set_frequency', { frequency: 500 })">500 MHz</button>
        <button class="btn" onclick="sendMinerAction('set_frequency', { frequency: 575 })">575 MHz</button>
        <button class="btn" onclick="sendMinerAction('set_fan', { fanPercent: 0 })">Fan Auto</button>
        <button class="btn" onclick="sendMinerAction('set_fan', { fanPercent: 100 })">Fan 100%</button>
      </div>

      <div class="miner-inputs">
        <input class="miner-input" id="miner-pool-url" placeholder="solo.ckpool.org" />
        <input class="miner-input" id="miner-pool-port" placeholder="3333" />
        <input class="miner-input" id="miner-wallet" placeholder="BTC payout address" />
      </div>

      <div class="miner-controls">
        <button class="btn" onclick="applyPool()">Set Pool</button>
        <button class="btn" onclick="applyWallet()">Set Wallet</button>
      </div>

      <div class="alerts" id="miner-alerts">No miner alerts yet.</div>
    </div>

    <div class="chat-box">
      <input class="chat-input" id="chat-input" placeholder="Ask ClawdBot anything..." />
      <button class="chat-send" onclick="sendChat()">Send</button>
    </div>

    <div class="status-bar">
      Solana clawd · 🦞 ClawdBot · <span id="clock"></span>
    </div>
  </div>

  <script>
    const output = document.getElementById('output');
    const chatInput = document.getElementById('chat-input');
    const minerHealth = document.getElementById('miner-health');
    const minerHost = document.getElementById('miner-host');
    const minerHashrate = document.getElementById('miner-hashrate');
    const minerTemp = document.getElementById('miner-temp');
    const minerPower = document.getElementById('miner-power');
    const minerEfficiency = document.getElementById('miner-efficiency');
    const minerShares = document.getElementById('miner-shares');
    const minerPet = document.getElementById('miner-pet');
    const minerAlerts = document.getElementById('miner-alerts');
    const minerChartLine = document.getElementById('miner-chart-line');
    const minerPoolUrl = document.getElementById('miner-pool-url');
    const minerPoolPort = document.getElementById('miner-pool-port');
    const minerWallet = document.getElementById('miner-wallet');

    chatInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') sendChat(); });

    // Clock
    setInterval(() => {
      document.getElementById('clock').textContent = new Date().toLocaleTimeString();
    }, 1000);

    async function runCmd(cmd) {
      output.textContent = '⏳ Running ' + cmd + '...';
      try {
        const res = await fetch('/api/run', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ command: cmd })
        });
        const data = await res.json();
        output.textContent = data.output || (data.ok ? '✓ Done' : '✗ Failed');
      } catch (e) { output.textContent = '✗ ' + e.message; }
    }

    async function fetchStatus() {
      output.textContent = '⏳ Checking...';
      try {
        const res = await fetch('/api/status');
        const data = await res.json();
        output.textContent = JSON.stringify(data, null, 2);
      } catch (e) { output.textContent = '✗ ' + e.message; }
    }

    function setMinerHealth(health) {
      minerHealth.textContent = String(health || 'offline');
      const palette = {
        healthy: { bg: 'rgba(20,241,149,0.14)', border: 'rgba(20,241,149,0.35)', text: '#14F195' },
        warning: { bg: 'rgba(245,158,11,0.14)', border: 'rgba(245,158,11,0.35)', text: '#F59E0B' },
        critical: { bg: 'rgba(239,68,68,0.14)', border: 'rgba(239,68,68,0.35)', text: '#EF4444' },
        offline: { bg: 'rgba(148,163,184,0.14)', border: 'rgba(148,163,184,0.35)', text: '#94A3B8' },
      };
      const style = palette[health] || palette.offline;
      minerHealth.style.background = style.bg;
      minerHealth.style.borderColor = style.border;
      minerHealth.style.color = style.text;
    }

    function renderMinerChart(history) {
      if (!history || history.length < 2) {
        minerChartLine.setAttribute('points', '');
        return;
      }

      const values = history.map((entry) => Number(entry.hashRate || 0));
      const min = Math.min.apply(null, values);
      const max = Math.max.apply(null, values);
      const spread = Math.max(1, max - min);
      const points = values.map((value, index) => {
        const x = (index / (values.length - 1)) * 320;
        const y = 82 - (((value - min) / spread) * 72);
        return x.toFixed(2) + ',' + y.toFixed(2);
      }).join(' ');

      minerChartLine.setAttribute('points', points);
    }

    function renderAlerts(alerts) {
      if (!alerts || !alerts.length) {
        minerAlerts.innerHTML = 'No miner alerts yet.';
        return;
      }

      minerAlerts.innerHTML = alerts.slice(0, 5).map((alert) => {
        return '<div class="alert-item">['
          + String(alert.level || 'info').toUpperCase()
          + '] '
          + String(alert.message || '')
          + '</div>';
      }).join('');
    }

    function renderMiner(payload) {
      const miner = payload && payload.miner ? payload.miner : payload;
      if (!miner || !miner.configured) {
        setMinerHealth('offline');
        minerHost.textContent = 'Bitaxe not configured. Set BITAXE_ENABLED=true and BITAXE_HOST in your environment.';
        minerHashrate.textContent = '--';
        minerTemp.textContent = '--';
        minerPower.textContent = '--';
        minerEfficiency.textContent = '--';
        minerShares.textContent = '--';
        minerPet.textContent = '--';
        renderMinerChart([]);
        renderAlerts([]);
        return;
      }

      const latest = miner.latest || {};
      const pet = miner.pet || {};
      setMinerHealth(miner.health);
      minerHost.textContent = String(miner.host || '') + ' · ' + String(latest.hostname || latest.ASICModel || 'Bitaxe');
      minerHashrate.textContent = Number(latest.hashRate || 0).toFixed(1) + ' GH/s';
      minerTemp.textContent = Number(latest.temp || 0).toFixed(1) + ' °C';
      minerPower.textContent = Number(latest.power || 0).toFixed(1) + ' W';
      minerEfficiency.textContent = Number(latest.efficiency || 0).toFixed(1) + ' GH/J';
      minerShares.textContent = String(latest.sharesAccepted || 0) + ' / ' + String(latest.sharesRejected || 0);
      minerPet.textContent = String(pet.stage || '--') + ' · ' + String(pet.mood || '--');

      if (!document.activeElement || document.activeElement !== minerPoolUrl) {
        minerPoolUrl.value = String(latest.stratumURL || '');
      }
      if (!document.activeElement || document.activeElement !== minerPoolPort) {
        minerPoolPort.value = String(latest.stratumPort || 3333);
      }
      if (!document.activeElement || document.activeElement !== minerWallet) {
        minerWallet.value = String(latest.stratumUser || '');
      }

      renderMinerChart(miner.history || []);
      renderAlerts(miner.alerts || []);
    }

    async function fetchMiner() {
      minerHost.textContent = 'Loading Bitaxe status...';
      try {
        const res = await fetch('/api/miner');
        const data = await res.json();
        renderMiner(data);
      } catch (e) {
        setMinerHealth('offline');
        minerHost.textContent = '✗ ' + e.message;
      }
    }

    async function sendMinerAction(action, payload) {
      try {
        const res = await fetch('/api/miner', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(Object.assign({ action: action }, payload || {}))
        });
        const data = await res.json();
        if (!data.ok) {
          throw new Error(data.error || 'Miner action failed');
        }
        renderMiner(data);
        output.textContent = '⛏ Miner action completed: ' + action;
      } catch (e) {
        output.textContent = '✗ ' + e.message;
      }
    }

    function applyPool() {
      sendMinerAction('set_pool', {
        stratumURL: minerPoolUrl.value.trim(),
        stratumPort: Number(minerPoolPort.value || 3333),
      });
    }

    function applyWallet() {
      sendMinerAction('set_wallet', {
        stratumUser: minerWallet.value.trim(),
      });
    }

    async function sendChat() {
      const msg = chatInput.value.trim();
      if (!msg) return;
      chatInput.value = '';
      output.textContent = '🦞 Thinking...';
      try {
        const res = await fetch('/api/chat', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: msg })
        });
        const data = await res.json();
        output.textContent = '🦞 ' + data.reply;
      } catch (e) { output.textContent = '✗ ' + e.message; }
    }

    fetchStatus();
    fetchMiner();
    setInterval(fetchMiner, 10000);
  </script>
</body>
</html>`;
