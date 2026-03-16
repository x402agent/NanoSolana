// ── NanoSolana × PumpFun — Shared Types ──────────────────────────────────────
//
// Types for the Pump.Fun integration layer, bridging the pump-fun-sdk
// into the NanoSolana agent runtime. Used by the swarm spawner,
// Telegram gateway, and all bot integrations.
// ─────────────────────────────────────────────────────────────────────────────

// ── Agent Identity ──────────────────────────────────────────────────────────

export type AgentRole =
  | 'launcher'       // Creates new tokens on Pump.Fun
  | 'sniper'         // Buys tokens immediately at launch
  | 'momentum'       // Trades tokens based on price momentum
  | 'graduation'     // Targets tokens nearing bonding curve graduation
  | 'market-maker'   // Provides liquidity via buy/sell oscillation
  | 'fee-claimer'    // Claims accumulated creator fees
  | 'monitor'        // Watches on-chain events, broadcasts alerts
  | 'channel-feed'   // Posts events to a read-only Telegram channel
  | 'outsider'       // Tracks calls with leaderboards & PNL
  | 'analyst';       // Runs analytics (price impact, graduation progress)

export type AgentStatus =
  | 'idle'
  | 'spawning'
  | 'running'
  | 'paused'
  | 'stopping'
  | 'stopped'
  | 'error';

export interface AgentIdentity {
  /** Unique swarm-level ID (e.g. "sniper-001") */
  id: string;
  /** Human-readable label */
  name: string;
  /** Functional role */
  role: AgentRole;
  /** Creation timestamp */
  createdAt: number;
  /** Wallet public key (base58) — never log the private key */
  walletAddress: string;
  /** Persona identifier (e.g. "whale-watcher") — defines personality at birth */
  personaId?: string;
  /** Persona avatar emoji */
  personaAvatar?: string;
  /** Persona title */
  personaTitle?: string;
}

// ── Swarm Configuration ─────────────────────────────────────────────────────

export interface SwarmConfig {
  /** Maximum number of agents in the swarm */
  maxAgents: number;
  /** Default slippage tolerance in basis points (100 = 1%) */
  defaultSlippageBps: number;
  /** Maximum SOL exposure per individual agent */
  maxPositionSolPerAgent: number;
  /** Maximum total SOL across entire swarm */
  maxTotalPositionSol: number;
  /** Solana RPC endpoint */
  rpcUrl: string;
  /** Fallback RPC endpoints */
  rpcFallbacks: string[];
  /** Helius WebSocket URL for real-time events */
  wssUrl: string;
  /** Polling interval for price feeds (ms) */
  pollIntervalMs: number;
  /** Health check interval (ms) */
  healthCheckIntervalMs: number;
  /** SQLite database path for swarm state */
  dbPath: string;
  /** Payment-gated spawning: require on-chain payment before agent spawn */
  paymentGating?: {
    /** Whether payment is required to spawn agents */
    enabled: boolean;
    /** Cost per agent spawn in smallest currency unit */
    spawnCost: number;
    /** Payment currency */
    currency: 'USDC' | 'SOL';
  };
}

// ── Agent Spawn Request ─────────────────────────────────────────────────────

export interface SpawnAgentRequest {
  /** Agent role to spawn */
  role: AgentRole;
  /** Human-readable name (auto-generated if omitted) */
  name?: string;
  /** Persona identifier — choose from 42+ DeFi agent personalities */
  personaId?: string;
  /** Role-specific configuration */
  config: AgentRoleConfig;
}


/** Per-role configuration */
export type AgentRoleConfig =
  | LauncherConfig
  | SniperConfig
  | MomentumConfig
  | GraduationConfig
  | MarketMakerConfig
  | FeeClaimerConfig
  | MonitorConfig
  | ChannelFeedConfig
  | OutsiderConfig
  | AnalystConfig;

export interface LauncherConfig {
  role: 'launcher';
  /** Token metadata for creation */
  tokenName: string;
  tokenSymbol: string;
  tokenDescription: string;
  tokenImageUri: string;
  /** Initial buy amount in lamports (creator's first purchase) */
  initialBuyLamports: bigint;
  /** Twitter URL (optional) */
  twitter?: string;
  /** Telegram URL (optional) */
  telegram?: string;
  /** Website (optional) */
  website?: string;
}

export interface SniperConfig {
  role: 'sniper';
  /** Target mints to snipe (empty = snipe all new launches) */
  targetMints: string[];
  /** Max SOL per snipe (lamports) */
  maxBuyLamports: bigint;
  /** Auto-sell after N% gain */
  takeProfitBps: number;
  /** Auto-sell after N% loss */
  stopLossBps: number;
  /** Min market cap to snipe (SOL) */
  minMarketCapSol?: number;
}

export interface MomentumConfig {
  role: 'momentum';
  /** Mints to track */
  watchMints: string[];
  /** Buy when price increases by N bps in timeWindowMs */
  buyThresholdBps: number;
  /** Sell when price drops by N bps */
  sellThresholdBps: number;
  /** Time window for momentum calculation (ms) */
  timeWindowMs: number;
  /** Max position size (lamports) */
  maxPositionLamports: bigint;
}

export interface GraduationConfig {
  role: 'graduation';
  /** Buy tokens when bonding curve progress >= this % */
  minProgressPercent: number;
  /** Max number of tokens to hold simultaneously */
  maxConcurrentPositions: number;
  /** SOL per position (lamports) */
  positionSizeLamports: bigint;
}

export interface MarketMakerConfig {
  role: 'market-maker';
  /** Token mint to market-make */
  mint: string;
  /** Spread in bps between bid/ask */
  spreadBps: number;
  /** Order size (lamports) */
  orderSizeLamports: bigint;
  /** Rebalance interval (ms) */
  rebalanceIntervalMs: number;
}

export interface FeeClaimerConfig {
  role: 'fee-claimer';
  /** Token mints to claim fees from */
  mints: string[];
  /** Claim interval (ms) */
  claimIntervalMs: number;
  /** Minimum claimable amount before executing (lamports) */
  minClaimLamports: bigint;
}

export interface MonitorConfig {
  role: 'monitor';
  /** Which event types to monitor */
  events: Array<'launch' | 'graduation' | 'whale' | 'cto' | 'fee-claim' | 'fee-dist'>;
  /** Whale threshold (SOL) */
  whaleThresholdSol: number;
  /** Telegram bot token for broadcasting */
  telegramBotToken?: string;
  /** Telegram channel/group ID for alerts */
  telegramChatId?: string;
}

export interface ChannelFeedConfig {
  role: 'channel-feed';
  /** Telegram bot token */
  telegramBotToken: string;
  /** Channel ID to post to */
  channelId: string;
  /** Which feeds to enable */
  feeds: {
    launches: boolean;
    graduations: boolean;
    whales: boolean;
    claims: boolean;
  };
}

export interface OutsiderConfig {
  role: 'outsider';
  /** Telegram bot token */
  telegramBotToken: string;
  /** Call channel ID */
  callChannelId: string;
  /** ATH poll interval (ms) */
  athPollIntervalMs: number;
}

export interface AnalystConfig {
  role: 'analyst';
  /** Mints to analyze */
  mints: string[];
  /** Analysis interval (ms) */
  analysisIntervalMs: number;
  /** Report to Telegram? */
  telegramBotToken?: string;
  telegramChatId?: string;
}

// ── Agent Runtime State ─────────────────────────────────────────────────────

export interface AgentState {
  identity: AgentIdentity;
  status: AgentStatus;
  config: AgentRoleConfig;
  metrics: AgentMetrics;
  /** Last error message (null if healthy) */
  lastError: string | null;
  /** Last error timestamp */
  lastErrorAt: string | null;
}

export interface AgentMetrics {
  /** Total events processed */
  eventsProcessed: number;
  /** Total trades executed */
  tradesExecuted: number;
  /** Total SOL volume (lamports) */
  totalVolumeLamports: bigint;
  /** Current SOL exposure (lamports) */
  currentExposureLamports: bigint;
  /** Realized PNL (lamports, can be negative) */
  realizedPnlLamports: bigint;
  /** Fees claimed (lamports) */
  feesClaimed: bigint;
  /** Uptime in seconds */
  uptimeSeconds: number;
  /** Custom per-role metrics */
  custom: Record<string, number | string>;
}

// ── Gateway Events ──────────────────────────────────────────────────────────

export type GatewayEventType =
  | 'agent:spawned'
  | 'agent:stopped'
  | 'agent:error'
  | 'agent:trade'
  | 'agent:metric'
  | 'token:launch'
  | 'token:graduation'
  | 'trade:buy'
  | 'trade:sell'
  | 'trade:whale'
  | 'fee:claim'
  | 'fee:distribution'
  | 'alert:cto'
  | 'swarm:health'
  | 'gateway:connected'
  | 'gateway:command';

export interface GatewayEvent<T = unknown> {
  id: string;
  type: GatewayEventType;
  source: string;
  timestamp: string;
  data: T;
}

// ── Telegram Gateway ────────────────────────────────────────────────────────

export interface TelegramGatewayConfig {
  /** Telegram bot token for the gateway */
  botToken: string;
  /** Allowed user IDs (empty = allow all) */
  allowedUserIds: number[];
  /** Admin user IDs */
  adminUserIds: number[];
  /** Webhook URL (null = long-polling) */
  webhookUrl?: string;
}

export interface GatewayCommand {
  /** Raw command string from user */
  raw: string;
  /** Parsed command name */
  command: string;
  /** Parsed arguments */
  args: string[];
  /** Telegram user ID */
  userId: number;
  /** Telegram chat ID */
  chatId: number;
  /** Is the user an admin? */
  isAdmin: boolean;
}

// ── DeFi Agent Definitions (from packages/defi-agents) ──────────────────────

export interface DefiAgentDefinition {
  /** Agent identifier (e.g. "pump-fun-sdk-expert") */
  identifier: string;
  /** Agent metadata */
  meta: {
    title: string;
    description: string;
    avatar: string;
    tags: string[];
  };
  /** Agent configuration */
  config: {
    systemRole: string;
  };
  /** Schema version */
  schemaVersion: number;
}

// ── PumpKit Integration Types ───────────────────────────────────────────────

export interface PumpKitBotConfig {
  /** Which PumpKit package to use */
  package: 'monitor' | 'tracker' | 'channel' | 'claim';
  /** Bot-specific config overrides */
  overrides: Record<string, unknown>;
}

export interface BondingCurveInfo {
  /** Token mint address */
  mint: string;
  /** Virtual SOL reserves (lamports) */
  virtualSolReserves: bigint;
  /** Virtual token reserves */
  virtualTokenReserves: bigint;
  /** Real token reserves */
  realTokenReserves: bigint;
  /** Bonding curve progress (0-100%) */
  progress: number;
  /** Is the curve complete (graduated)? */
  complete: boolean;
  /** Current price per token (SOL) */
  pricePerToken: number;
  /** Market cap (SOL) */
  marketCapSol: number;
}
