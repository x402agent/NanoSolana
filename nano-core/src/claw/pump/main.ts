#!/usr/bin/env node
// ── Solana Clawd Go × PumpFun — Swarm Entrypoint ─────────────────────────────────
//
// Standalone entrypoint to launch the Solana Clawd Go Pump.Fun swarm.
// Initializes the SwarmSpawner and Telegram Gateway, then enters
// the main loop. Can be run directly or imported as a module.
//
// Usage:
//   npx tsx src/pump/main.ts              # Direct execution
//   TELEGRAM_BOT_TOKEN=... npm run swarm  # Via package.json script
//
// Environment Variables:
//   TELEGRAM_BOT_TOKEN      — Telegram bot token (required for gateway)
//   TELEGRAM_ADMIN_IDS      — Comma-separated admin user IDs
//   TELEGRAM_ALLOWED_IDS    — Comma-separated allowed user IDs (empty = all)
//   SOLANA_RPC_URL          — Solana RPC endpoint
//   HELIUS_RPC_URL          — Helius RPC endpoint (fallback)
//   HELIUS_WSS_URL          — Helius WebSocket URL
//   SWARM_MAX_AGENTS        — Maximum agents (default: 25)
//   SWARM_MAX_POSITION_SOL  — Max SOL per agent (default: 1)
//   SWARM_MAX_TOTAL_SOL     — Max total SOL (default: 10)
//   SWARM_POLL_INTERVAL     — Polling interval in ms (default: 5000)
//   SWARM_DB_PATH           — SQLite path (default: ./data/swarm.db)
// ─────────────────────────────────────────────────────────────────────────────

import { SwarmSpawner } from './swarm-spawner.js';
import { TelegramGateway } from './telegram-gateway.js';
import { BOT_REGISTRY, PUMPKIT_PACKAGES, DEFI_AGENT_CATEGORIES } from './bot-registry.js';
import type { SwarmConfig, TelegramGatewayConfig } from './types.js';

// ── Configuration ───────────────────────────────────────────────────────────

function loadSwarmConfig(): SwarmConfig {
  return {
    maxAgents: parseInt(process.env.SWARM_MAX_AGENTS ?? '25', 10),
    defaultSlippageBps: parseInt(process.env.SWARM_DEFAULT_SLIPPAGE_BPS ?? '100', 10),
    maxPositionSolPerAgent: parseFloat(process.env.SWARM_MAX_POSITION_SOL ?? '1'),
    maxTotalPositionSol: parseFloat(process.env.SWARM_MAX_TOTAL_SOL ?? '10'),
    rpcUrl: process.env.SOLANA_RPC_URL ?? process.env.HELIUS_RPC_URL ?? 'https://api.mainnet-beta.solana.com',
    rpcFallbacks: [
      process.env.HELIUS_RPC_URL,
      'https://api.mainnet-beta.solana.com',
    ].filter(Boolean) as string[],
    wssUrl: process.env.HELIUS_WSS_URL ?? '',
    pollIntervalMs: parseInt(process.env.SWARM_POLL_INTERVAL ?? '5000', 10),
    healthCheckIntervalMs: parseInt(process.env.SWARM_HEALTH_INTERVAL ?? '30000', 10),
    dbPath: process.env.SWARM_DB_PATH ?? './data/swarm.db',
  };
}

function loadGatewayConfig(): TelegramGatewayConfig | null {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  if (!botToken) return null;

  const parseIds = (envVar: string): number[] =>
    (process.env[envVar] ?? '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
      .map(Number)
      .filter((n) => !Number.isNaN(n));

  return {
    botToken,
    adminUserIds: parseIds('TELEGRAM_ADMIN_IDS'),
    allowedUserIds: parseIds('TELEGRAM_ALLOWED_IDS'),
    webhookUrl: process.env.TELEGRAM_WEBHOOK_URL,
  };
}

// ── Banner ──────────────────────────────────────────────────────────────────

function printBanner(): void {
  console.log(`
╔══════════════════════════════════════════════════════════════╗
║                                                              ║
║   ███╗   ██╗ █████╗ ███╗   ██╗ ██████╗                      ║
║   ████╗  ██║██╔══██╗████╗  ██║██╔═══██╗                     ║
║   ██╔██╗ ██║███████║██╔██╗ ██║██║   ██║                     ║
║   ██║╚██╗██║██╔══██║██║╚██╗██║██║   ██║                     ║
║   ██║ ╚████║██║  ██║██║ ╚████║╚██████╔╝                     ║
║   ╚═╝  ╚═══╝╚═╝  ╚═╝╚═╝  ╚═══╝ ╚═════╝                     ║
║                                                              ║
║   × Pump.Fun Swarm — Autonomous Financial Agents             ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
`);
}

function printStats(): void {
  const totalBots = BOT_REGISTRY.length;
  const totalPackages = PUMPKIT_PACKAGES.length;
  const totalAgents = DEFI_AGENT_CATEGORIES.reduce((s, c) => s + c.count, 0);

  console.log(`📦 Bot Registry: ${totalBots} bots`);
  console.log(`📚 PumpKit Packages: ${totalPackages}`);
  console.log(`🤖 DeFi Agent Defs: ${totalAgents}`);
  console.log(`────────────────────────────────────────`);
}

// ── Main ────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  printBanner();
  printStats();

  const swarmConfig = loadSwarmConfig();
  console.log(`⚙️  Max agents: ${swarmConfig.maxAgents}`);
  console.log(`⚙️  Max SOL/agent: ${swarmConfig.maxPositionSolPerAgent}`);
  console.log(`⚙️  Max total SOL: ${swarmConfig.maxTotalPositionSol}`);
  console.log(`⚙️  RPC: ${swarmConfig.rpcUrl.slice(0, 50)}...`);
  console.log(`⚙️  Poll interval: ${swarmConfig.pollIntervalMs}ms`);

  // Initialize swarm
  const swarm = new SwarmSpawner(swarmConfig);
  console.log('\n🐝 Swarm initialized');

  // Initialize Telegram gateway
  const gatewayConfig = loadGatewayConfig();
  let gateway: TelegramGateway | null = null;

  if (gatewayConfig) {
    gateway = new TelegramGateway(gatewayConfig, swarm);
    await gateway.start();
    console.log('🌐 Telegram Gateway active');
    if (gatewayConfig.adminUserIds.length > 0) {
      console.log(`👑 Admin IDs: ${gatewayConfig.adminUserIds.join(', ')}`);
    }
  } else {
    console.log('⚠️  No TELEGRAM_BOT_TOKEN set — gateway disabled');
    console.log('   Set TELEGRAM_BOT_TOKEN to enable Telegram commands');
  }

  // Graceful shutdown
  const shutdown = async (signal: string): Promise<void> => {
    console.log(`\n\n🛑 ${signal} received — shutting down swarm...`);
    if (gateway) await gateway.stop();
    await swarm.stopAll();
    console.log('✅ Swarm shut down cleanly');
    process.exit(0);
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));

  console.log('\n✅ Solana Clawd Go × Pump.Fun Swarm is LIVE');
  console.log('   Use /help in Telegram to get started\n');

  // Keep alive
  await new Promise(() => {});
}

main().catch((err) => {
  console.error('💀 Fatal error:', err);
  process.exit(1);
});
