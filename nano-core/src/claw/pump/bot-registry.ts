// ── Solana Claude Go × PumpFun — Bot Registry ──────────────────────────────────────
//
// Registry for all PumpFun bots, PumpKit packages, and DeFi agent definitions.
// Provides a unified interface for discovering, configuring, and launching
// bots from the pump-fun-sdk ecosystem.
//
// Bots included:
//   - telegram-bot     PumpFun Fee Monitor (Grammy)
//   - channel-bot      Read-only Telegram channel feed
//   - claim-bot        Fee claim tracker
//   - outsiders-bot    Call tracking with leaderboards
//   - swarm-bot        Multi-strategy trading bots
//   - lair-tg          PumpFun Lair Telegram bot
//   - mcp-server       Model Context Protocol server
//   - dashboard        Swarm analytics dashboard
//
// PumpKit packages:
//   - @pumpkit/core     Shared framework
//   - @pumpkit/monitor  All-in-one PumpFun monitor
//   - @pumpkit/tracker  Call tracking
//   - @pumpkit/channel  Channel feed
//   - @pumpkit/claim    Fee claim tracker
//
// DeFi agent definitions:
//   - 42 production-ready agent definitions from packages/defi-agents
//   - Plugin delivery system from packages/plugin.delivery
// ─────────────────────────────────────────────────────────────────────────────

import { resolvePumpServiceDirectory } from "./path-resolver.js";

// ── Bot Models ──────────────────────────────────────────────────────────────

export interface BotRegistryEntry {
  /** Unique bot identifier */
  id: string;
  /** Human-readable name */
  name: string;
  /** Description */
  description: string;
  /** Category */
  category: 'bot' | 'pumpkit' | 'agent' | 'service';
  /** Resolved service directory */
  directory: string;
  /** Start command */
  startCommand: string;
  /** Required environment variables */
  requiredEnvVars: string[];
  /** Optional environment variables */
  optionalEnvVars: string[];
  /** Port (null if no HTTP server) */
  port: number | null;
  /** Health check endpoint (null if none) */
  healthEndpoint: string | null;
  /** Whether this bot has a Dockerfile */
  hasDockerfile: boolean;
  /** Whether this bot has Railway config */
  hasRailwayConfig: boolean;
  /** Related PumpKit event types */
  eventTypes: string[];
}

// ── Registry ────────────────────────────────────────────────────────────────

export const BOT_REGISTRY: BotRegistryEntry[] = [
  // ── Telegram Bots ─────────────────────────────────────────────────────
  {
    id: 'telegram-bot',
    name: 'PumpFun Fee Monitor',
    description: 'Monitors creator fees, CTO alerts, whale trades. Supports DMs, groups, and a REST API. Uses Grammy for Telegram + @solana/web3.js for on-chain events.',
    category: 'bot',
    directory: resolvePumpServiceDirectory("telegram-bot"),
    startCommand: 'node dist/index.js',
    requiredEnvVars: ['TELEGRAM_BOT_TOKEN', 'SOLANA_RPC_URL'],
    optionalEnvVars: ['API_ONLY', 'API_KEYS', 'ALLOWED_USER_IDS', 'ENABLE_LAUNCH_MONITOR'],
    port: 3000,
    healthEndpoint: null,
    hasDockerfile: true,
    hasRailwayConfig: true,
    eventTypes: ['fee:claim', 'token:launch', 'trade:whale', 'alert:cto', 'token:graduation'],
  },
  {
    id: 'channel-bot',
    name: 'Channel Feed Bot',
    description: 'Read-only Telegram channel feed: new launches, graduations, whale trades, fee claims. Filters configurable per-event-type.',
    category: 'bot',
    directory: resolvePumpServiceDirectory("channel-bot"),
    startCommand: 'node dist/index.js',
    requiredEnvVars: ['TELEGRAM_BOT_TOKEN', 'CHANNEL_ID', 'SOLANA_RPC_URL'],
    optionalEnvVars: ['FEED_CLAIMS', 'FEED_LAUNCHES', 'FEED_GRADUATIONS', 'FEED_WHALES'],
    port: null,
    healthEndpoint: null,
    hasDockerfile: true,
    hasRailwayConfig: true,
    eventTypes: ['token:launch', 'token:graduation', 'trade:whale', 'fee:claim'],
  },
  {
    id: 'claim-bot',
    name: 'Fee Claim Tracker',
    description: 'Tracks fee claims by token contract address or creator X handle. Monitors on-chain claim events and sends Telegram notifications.',
    category: 'bot',
    directory: resolvePumpServiceDirectory("claim-bot"),
    startCommand: 'node dist/index.js',
    requiredEnvVars: ['TELEGRAM_BOT_TOKEN', 'SOLANA_RPC_URL'],
    optionalEnvVars: ['TRACKED_TOKENS', 'TRACKED_CREATORS', 'CLAIM_THRESHOLD_SOL'],
    port: null,
    healthEndpoint: null,
    hasDockerfile: true,
    hasRailwayConfig: true,
    eventTypes: ['fee:claim'],
  },
  {
    id: 'outsiders-bot',
    name: 'Outsiders Call Tracker',
    description: 'Call tracking with leaderboards, PNL cards, win rates, and hardcore mode. Tracks alpha and gamble calls across Telegram groups.',
    category: 'bot',
    directory: resolvePumpServiceDirectory("outsiders-bot"),
    startCommand: 'node dist/index.js',
    requiredEnvVars: ['TELEGRAM_BOT_TOKEN'],
    optionalEnvVars: ['CALL_CHANNEL_ID', 'DEXSCREENER_API', 'ATH_POLL_INTERVAL', 'DB_PATH'],
    port: null,
    healthEndpoint: null,
    hasDockerfile: false,
    hasRailwayConfig: false,
    eventTypes: ['call:new', 'call:result', 'leaderboard:update'],
  },
  {
    id: 'lair-tg',
    name: 'PumpFun Lair TG',
    description: 'PumpFun Lair Telegram bot — community-focused bot for PumpFun ecosystem interactions.',
    category: 'bot',
    directory: resolvePumpServiceDirectory("lair-tg"),
    startCommand: 'node dist/index.js',
    requiredEnvVars: ['TELEGRAM_BOT_TOKEN'],
    optionalEnvVars: ['SOLANA_RPC_URL'],
    port: null,
    healthEndpoint: null,
    hasDockerfile: true,
    hasRailwayConfig: true,
    eventTypes: [],
  },

  // ── Trading & Infrastructure ──────────────────────────────────────────
  {
    id: 'swarm-bot',
    name: 'Trading Bot Swarm',
    description: 'Multi-strategy trading bots: sniper, momentum, graduation, market-maker. Real-time position tracking with SQLite persistence and REST API.',
    category: 'bot',
    directory: resolvePumpServiceDirectory("swarm-bot"),
    startCommand: 'node dist/index.js',
    requiredEnvVars: ['SOLANA_RPC_URL'],
    optionalEnvVars: ['MAX_POSITION_SOL_PER_BOT', 'MAX_TOTAL_POSITION_SOL', 'DEFAULT_SLIPPAGE_BPS', 'DB_PATH', 'PORT'],
    port: 3100,
    healthEndpoint: '/health',
    hasDockerfile: true,
    hasRailwayConfig: false,
    eventTypes: ['trade:buy', 'trade:sell', 'token:launch', 'token:graduation'],
  },
  {
    id: 'mcp-server',
    name: 'MCP Server',
    description: 'Model Context Protocol server — exposes PumpFun data and actions as MCP tools for AI agents.',
    category: 'service',
    directory: resolvePumpServiceDirectory("mcp-server"),
    startCommand: 'node dist/index.js',
    requiredEnvVars: ['SOLANA_RPC_URL'],
    optionalEnvVars: ['MCP_PORT', 'MCP_AUTH_TOKEN'],
    port: null,
    healthEndpoint: null,
    hasDockerfile: false,
    hasRailwayConfig: false,
    eventTypes: [],
  },
  {
    id: 'dashboard',
    name: 'Swarm Dashboard',
    description: 'Web-based analytics dashboard for monitoring the swarm. Real-time charts, bot metrics, event feeds, and configuration.',
    category: 'service',
    directory: resolvePumpServiceDirectory("dashboard"),
    startCommand: 'node dist/index.js',
    requiredEnvVars: [],
    optionalEnvVars: ['PORT', 'SWARM_API_URL'],
    port: 4000,
    healthEndpoint: '/health',
    hasDockerfile: false,
    hasRailwayConfig: false,
    eventTypes: [],
  },

  // ── Swarm Orchestrator ────────────────────────────────────────────────
  {
    id: 'swarm-orchestrator',
    name: 'PumpFun Swarm Orchestrator',
    description: 'Orchestrates all bots: unified admin dashboard with real-time event streaming, cross-bot event bus, and health monitoring.',
    category: 'service',
    directory: resolvePumpServiceDirectory("swarm"),
    startCommand: 'node dist/index.js',
    requiredEnvVars: [],
    optionalEnvVars: ['PORT', 'LOG_LEVEL', 'HEALTH_CHECK_INTERVAL', 'SWARM_AUTO_START'],
    port: 4000,
    healthEndpoint: '/health',
    hasDockerfile: false,
    hasRailwayConfig: false,
    eventTypes: ['bot:started', 'bot:stopped', 'bot:error', 'bot:health', 'system:metric'],
  },
];

// ── PumpKit Packages Registry ───────────────────────────────────────────────

export interface PumpKitPackage {
  name: string;
  npmName: string;
  description: string;
  modules: string[];
}

export const PUMPKIT_PACKAGES: PumpKitPackage[] = [
  {
    name: 'core',
    npmName: '@pumpkit/core',
    description: 'Shared framework: bot scaffolding (Grammy), Solana event monitors, HTML formatters, SQLite storage, REST APIs, webhooks, health checks.',
    modules: [
      'bot — Grammy bot scaffolding (createBot, setupShutdown)',
      'monitor — BaseMonitor, ClaimMonitor, LaunchMonitor, GraduationMonitor, WhaleMonitor, CTOMonitor, FeeDistMonitor',
      'solana — PUMP_PROGRAM_ID, createRpcConnection, decodePumpLogs',
      'formatter — formatClaim, formatLaunch, formatGraduation, formatWhaleTrade, formatCTO',
      'storage — FileStore, SqliteStore',
      'config — loadConfig',
      'health — createHealthServer',
      'logger — log',
      'api — createApiServer, SSEManager, WebhookManager, RateLimiter',
      'social — TwitterClient, GitHubClient',
    ],
  },
  {
    name: 'monitor',
    npmName: '@pumpkit/monitor',
    description: 'All-in-one PumpFun monitor bot. Monitors fee claims, token launches, graduations, whale trades, CTOs, and fee distributions.',
    modules: ['Monitor bot combining all 6 event monitors into a single Grammy bot'],
  },
  {
    name: 'tracker',
    npmName: '@pumpkit/tracker',
    description: 'Group call-tracking bot with leaderboards, PNL cards, and rankings.',
    modules: ['Call tracking', 'PNL calculation', 'Canvas-based leaderboard cards', 'SQLite persistence'],
  },
  {
    name: 'channel',
    npmName: '@pumpkit/channel',
    description: 'Read-only Telegram channel feed for token events.',
    modules: ['Channel feed bot', 'Configurable event filters'],
  },
  {
    name: 'claim',
    npmName: '@pumpkit/claim',
    description: 'Fee claim tracker by token CA or X handle.',
    modules: ['Claim monitoring', 'Creator lookup', 'Notification dispatch'],
  },
];

// ── DeFi Agent Definitions Registry ─────────────────────────────────────────

export interface DefiAgentCategory {
  name: string;
  count: number;
  agents: string[];
}

export const DEFI_AGENT_CATEGORIES: DefiAgentCategory[] = [
  {
    name: 'Yield & Farming',
    count: 4,
    agents: ['defi-yield-farmer', 'staking-rewards-calculator', 'yield-sustainability-analyst', 'yield-dashboard-builder'],
  },
  {
    name: 'Risk & Security',
    count: 4,
    agents: ['liquidation-risk-manager', 'defi-risk-scoring-engine', 'defi-insurance-advisor', 'impermanent-loss-calculator'],
  },
  {
    name: 'Trading & DEX',
    count: 4,
    agents: ['dex-aggregator-optimizer', 'gas-optimization-expert', 'mev-protection-advisor', 'airdrop-hunter'],
  },
  {
    name: 'Security Audit',
    count: 3,
    agents: ['smart-contract-auditor', 'bridge-security-analyst', 'wallet-security-advisor'],
  },
  {
    name: 'Protocol Analysis',
    count: 4,
    agents: ['protocol-revenue-analyst', 'protocol-treasury-analyst', 'governance-proposal-analyst', 'narrative-trend-analyst'],
  },
  {
    name: 'Education',
    count: 5,
    agents: ['defi-onboarding-mentor', 'apy-vs-apr-educator', 'defi-protocol-comparator', 'stablecoin-comparator', 'layer2-comparison-guide'],
  },
  {
    name: 'Pump.Fun Specialists',
    count: 1,
    agents: ['pump-fun-sdk-expert'],
  },
  {
    name: 'Market Intelligence',
    count: 5,
    agents: ['alpha-leak-detector', 'crypto-news-analyst', 'whale-watcher', 'token-unlock-tracker', 'liquidity-pool-analyzer'],
  },
  {
    name: 'Portfolio Management',
    count: 3,
    agents: ['portfolio-rebalancing-advisor', 'crypto-tax-strategist', 'nft-liquidity-advisor'],
  },
];

// ── Lookup Functions ────────────────────────────────────────────────────────

/** Find a bot by ID */
export function getBot(id: string): BotRegistryEntry | undefined {
  return BOT_REGISTRY.find((b) => b.id === id);
}

/** Get all bots in a category */
export function getBotsByCategory(category: BotRegistryEntry['category']): BotRegistryEntry[] {
  return BOT_REGISTRY.filter((b) => b.category === category);
}

/** Get all bots that handle a specific event type */
export function getBotsByEvent(eventType: string): BotRegistryEntry[] {
  return BOT_REGISTRY.filter((b) => b.eventTypes.includes(eventType));
}

/** Get all DeFi agent IDs */
export function getAllDefiAgentIds(): string[] {
  return DEFI_AGENT_CATEGORIES.flatMap((c) => c.agents);
}

/** Count total DeFi agents */
export function getDefiAgentCount(): number {
  return DEFI_AGENT_CATEGORIES.reduce((sum, c) => sum + c.count, 0);
}
