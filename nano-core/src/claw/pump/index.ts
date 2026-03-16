// ── NanoSolana × PumpFun — Barrel Export ─────────────────────────────────────
//
// Main entry point for the Pump.Fun integration module.
// Exports the SDK bridge, swarm spawner, Telegram gateway, bot registry,
// and all types required by consumers.
// ─────────────────────────────────────────────────────────────────────────────

// ── Types ───────────────────────────────────────────────────────────────────

export type {
  AgentRole,
  AgentStatus,
  AgentIdentity,
  AgentState,
  AgentMetrics,
  SwarmConfig,
  SpawnAgentRequest,
  AgentRoleConfig,
  LauncherConfig,
  SniperConfig,
  MomentumConfig,
  GraduationConfig,
  MarketMakerConfig,
  FeeClaimerConfig,
  MonitorConfig,
  ChannelFeedConfig,
  OutsiderConfig,
  AnalystConfig,
  GatewayEventType,
  GatewayEvent,
  GatewayCommand,
  TelegramGatewayConfig,
  BondingCurveInfo,
  DefiAgentDefinition,
  PumpKitBotConfig,
} from './types.js';

// ── SDK Bridge ──────────────────────────────────────────────────────────────

export {
  getTokenPrice,
  getGraduationProgress,
  getBuyQuote,
  getSellQuote,
  getBondingCurveState,
  getFeeTier,
  formatSol,
  formatTokenAmount,
  parseSolToLamports,
  shortenAddress,
} from './sdk-bridge.js';

// ── Swarm Spawner ───────────────────────────────────────────────────────────

export { SwarmSpawner } from './swarm-spawner.js';

// ── Telegram Gateway ────────────────────────────────────────────────────────

export { TelegramGateway } from './telegram-gateway.js';

// ── Bot Registry ────────────────────────────────────────────────────────────

export {
  BOT_REGISTRY,
  PUMPKIT_PACKAGES,
  DEFI_AGENT_CATEGORIES,
  getBot,
  getBotsByCategory,
  getBotsByEvent,
  getAllDefiAgentIds,
  getDefiAgentCount,
} from './bot-registry.js';

export type {
  BotRegistryEntry,
  PumpKitPackage,
  DefiAgentCategory,
} from './bot-registry.js';

// ── Persona System ──────────────────────────────────────────────────────────

export {
  loadAllPersonas,
  getPersona,
  searchPersonas,
  getPersonasByCategory,
  formatPersonaList,
  buildPersonaSystemPrompt,
  clearPersonaCache,
} from '../persona-loader.js';

export type {
  PersonaDefinition,
  PersonaCategory,
} from '../persona-loader.js';
