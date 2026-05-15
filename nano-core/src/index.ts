/**
 * Solana Claude Go — Main Entry
 *
 * TypeScript runtime for Solana agents, daemons, and operator tooling.
 *
 * Exports all core modules for programmatic usage.
 */

export { readScgRuntimeAsset, resolveScgRuntimeAsset } from "./runtime/assets.js";

// Config & Security
export { loadConfig, saveSecrets, loadSecrets, redactConfig, ensureScgHome, encrypt, decrypt } from "./config/vault.js";
export type { ScgConfig } from "./config/vault.js";

// Solana Wallet
export { ScgWallet } from "./wallet/manager.js";
export type { WalletInfo, WalletEvents } from "./wallet/manager.js";

// Trading Engine (OODA)
export { TradingEngine, BirdeyeClient, HeliusClient, JupiterClient } from "./trading/engine.js";
export type { TokenPrice, TradeSignal, TradeExecution, TradeOutcome, TradingEngineEvents } from "./trading/engine.js";

// Strategy (RSI + EMA + ATR)
export { StrategyEngine, calculateRSI, calculateEMA, calculateATR, DEFAULT_PARAMS } from "./strategy/engine.js";
export type { StrategyParams, OHLCV, Signal, StrategyEvents } from "./strategy/engine.js";

// ScgVault Memory (3-tier epistemological)
export { ScgVault } from "./memory/clawvault.js";
export type { VaultEntry, TradeRecord, Lesson, ResearchAgenda, KnowledgeTier, ScgVaultEvents } from "./memory/clawvault.js";

// Legacy generic memory (kept for compatibility)
export { MemoryEngine } from "./memory/engine.js";

// AI Provider (OpenRouter)
export { AIProvider } from "./ai/provider.js";
export type { AIMessage, AIResponse, OODAContext, TradeDecision, AIProviderEvents } from "./ai/provider.js";

// TamaGOchi Pet Engine
export { TamaGOchi, STAGE_EMOJI, MOOD_EMOJI } from "./pet/tamagochi.js";
export type { TamaGOchiState, EvolutionStage, Mood, TamaGOchiEvents } from "./pet/tamagochi.js";

// Gateway Server
export { ScgGateway } from "./gateway/server.js";
export type { GatewayMessage, ConnectedAgent, GatewayEvents } from "./gateway/server.js";

// Bitaxe mining
export {
  BitaxeClient,
  createBitaxeClientFromEnv,
  deriveBitaxeHealth,
  deriveBitaxeMood,
  deriveBitaxeStage,
  loadBitaxeConfigFromEnv,
} from "./bitaxe/client.js";
export type {
  BitaxeAlert,
  BitaxeAlertLevel,
  BitaxeConfig,
  BitaxeHealth,
  BitaxeMood,
  BitaxePetState,
  BitaxeSnapshot,
  BitaxeStage,
  BitaxeStats,
  BitaxeClientEvents,
} from "./bitaxe/client.js";

// Hub Bridge
export { ScgHubBridge } from "./hub/bridge.js";
export type { HubUpdate, HubBridgeEvents } from "./hub/bridge.js";
export {
  normalizeScgHubSiteUrl,
  getScgHubSiteUrl,
  getScgHubApiBaseUrl,
  getScgHubDiscoveryUrl,
  getScgHubSkillUrl,
  getScgHubApiSort,
  listScgHubSkills,
  searchScgHubSkills,
  getScgHubSkill,
  getScgHubSkillFile,
  getScgHubSkillManifest,
  clampScgHubLimit,
} from "./hub/public-client.js";
export type {
  ScgHubExploreSort,
  ScgHubSkillListItem,
  ScgHubSkillDetail,
  ScgHubSearchResult,
  ScgHubSkillsResponse,
  ScgHubSkillResponse,
  ScgHubSearchResponse,
  ScgHubSkillFileResponse,
} from "./hub/public-client.js";
export { buildScgOneShotPlan } from "./hub/oneshot.js";
export type {
  ScgHubManifestFile,
  ScgHubManifestOwner,
  ScgHubManifestEnvVar,
  ScgHubManifestDependency,
  ScgHubManifestInstallSpec,
  ScgHubSkillManifest,
  ScgHubSkillManifestResponse,
  ScgOneShotStep,
  ScgOneShotPlan,
} from "./hub/oneshot.js";

// Network (Tailscale + tmux)
export { TailscaleDiscovery, TmuxManager, ScgNetworkClient } from "./network/mesh.js";
export type { ScgNode, TmuxSession, ScgNetworkEvents } from "./network/mesh.js";

// Docs + Extensions Knowledge Integration
export {
  getScgKnowledgeSnapshot,
  clearScgKnowledgeCache,
  getScgKnowledgeSummary,
  searchScgKnowledge,
} from "./docs/integration.js";
export type {
  ScgDocArea,
  ScgDocIndexEntry,
  ScgDocAreaSnapshot,
  ScgExtensionIndexEntry,
  ScgKnowledgeSnapshot,
  ScgKnowledgeSnapshotOptions,
  ScgKnowledgeSummary,
  ScgKnowledgeSearchMatch,
} from "./docs/integration.js";

// Extension Catalog
export {
  resolveScgRepositoryRoot,
  scanScgExtensions,
  getExtensionCatalogSummary,
} from "./extensions/catalog.js";
export type {
  ScgExtensionKind,
  ScgExtensionMetadataSource,
  ScgExtensionInstallMetadata,
  ScgExtensionCatalogEntry,
  ScgExtensionCatalogSnapshot,
} from "./extensions/catalog.js";

// Telegram Persistence
export { TelegramConversationStore } from "./telegram/persistence.js";
export type { ConversationMessage, ConversationContext, ConversationSearchResult } from "./telegram/persistence.js";

// Agent Task Registry
export {
  loadAllTasks,
  getTask,
  getTasksForPersona,
  buildTaskBriefing,
  formatTaskList,
  formatPersonaTaskAssignments,
  clearTaskCache,
  searchTasks,
  getTaskSummary,
} from "./claw/task-loader.js";
export type {
  AgentTask,
  TaskAssignment,
  AgentTaskSummary,
} from "./claw/task-loader.js";

// ── NanoClaw — Containerized Agent Orchestrator ─────────────────────────────
export { escapeXml, formatMessages, stripInternalTags, formatOutbound, routeOutbound, findChannel } from "./claw/router.js";
export type {
  AdditionalMount,
  MountAllowlist,
  AllowedRoot,
  ContainerConfig,
  RegisteredGroup,
  NewMessage,
  ScheduledTask,
  TaskRunLog,
  Channel,
  OnInboundMessage,
  OnChatMetadata,
} from "./claw/types.js";

// Claw — Container Runner
export type { ContainerInput, ContainerOutput, AvailableGroup } from "./claw/container-runner.js";
export { runContainerAgent, writeTasksSnapshot, writeGroupsSnapshot } from "./claw/container-runner.js";

// Claw — Database
export {
  initDatabase as initClawDatabase,
  storeMessage as storeClawMessage,
  storeChatMetadata as storeClawChatMetadata,
  getNewMessages as getClawNewMessages,
  getMessagesSince as getClawMessagesSince,
  createTask,
  getAllTasks,
  getTaskById,
  getTasksForGroup,
  updateTask,
  deleteTask,
  getDueTasks,
  updateTaskAfterRun,
  logTaskRun,
} from "./claw/db.js";

// Claw — Group Queue
export { GroupQueue } from "./claw/group-queue.js";

// Claw — Env Utilities
export { readEnvFile } from "./claw/env.js";

// ── PumpFun Swarm — Autonomous Financial Agents ─────────────────────────────

// PumpFun — SDK Bridge
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
} from "./claw/pump/sdk-bridge.js";

// PumpFun — Swarm Spawner
export { SwarmSpawner } from "./claw/pump/swarm-spawner.js";

// PumpFun — Telegram Gateway
export { TelegramGateway } from "./claw/pump/telegram-gateway.js";

// PumpFun — Embedded SDK
export * as PumpFunSdk from "./claw/pump/sdk/index.js";
export {
  PumpSdk,
  OnlinePumpSdk,
  PUMP_SDK,
  pumpIdl,
  PUMP_PROGRAM_ID,
  PUMP_AMM_PROGRAM_ID,
  PUMP_FEE_PROGRAM_ID,
  PUMP_TOKEN_MINT,
  MAX_SHAREHOLDERS,
  getBuyTokenAmountFromSolAmount,
  getBuySolAmountFromTokenAmount,
  getSellSolAmountFromTokenAmount,
  newBondingCurve,
  bondingCurveMarketCap,
  getStaticRandomFeeRecipient,
  getFee,
  computeFeesBps,
  calculateFeeTier,
  ONE_BILLION_SUPPLY,
  totalUnclaimedTokens,
  currentDayTokens,
  calculateBuyPriceImpact,
  calculateSellPriceImpact,
  getBondingCurveSummary,
  createFallbackConnection,
  fetchWithFallback,
  parseEndpoints,
  getTokenPrice as getPumpSdkTokenPrice,
  getGraduationProgress as getPumpSdkGraduationProgress,
} from "./claw/pump/sdk/index.js";
export type {
  BondingCurveSummary,
  GraduationProgress,
  TokenPriceInfo,
  PriceImpactResult,
  FallbackConfig,
  Fees,
  FeeTier,
} from "./claw/pump/sdk/index.js";

// PumpFun — Bot Registry
export {
  BOT_REGISTRY,
  PUMPKIT_PACKAGES,
  DEFI_AGENT_CATEGORIES,
  getBot,
  getBotsByCategory,
  getBotsByEvent,
  getAllDefiAgentIds,
  getDefiAgentCount,
} from "./claw/pump/bot-registry.js";

export type {
  BotRegistryEntry,
  PumpKitPackage,
  DefiAgentCategory,
} from "./claw/pump/bot-registry.js";

// PumpFun — Types
export type {
  AgentRole,
  AgentStatus,
  AgentIdentity,
  AgentState,
  AgentMetrics,
  SwarmConfig,
  SpawnAgentRequest,
  GatewayEventType,
  GatewayEvent,
  GatewayCommand,
  TelegramGatewayConfig,
  BondingCurveInfo,
  DefiAgentDefinition,
  PumpKitBotConfig,
} from "./claw/pump/types.js";

// ── Tokenized Agent Payments — On-Chain Invoice System ──────────────────────
export { ScgPaymentAgent, createPaymentAgent, CURRENCY_MINTS, CURRENCY_DECIMALS } from "./payments/index.js";
export type {
  PaymentCurrency,
  Invoice,
  InvoiceParams,
  InvoiceRecord,
  PaymentInstructions,
  PaymentVerification,
  VerifyOptions,
  PaymentConfig,
} from "./payments/index.js";

// ── Persona System — 42+ DeFi Agent Personalities ──────────────────────────
export {
  loadAllPersonas,
  getPersona,
  searchPersonas,
  getPersonasByCategory,
  formatPersonaList,
  buildPersonaSystemPrompt,
  clearPersonaCache,
} from "./claw/persona-loader.js";

export type {
  PersonaDefinition,
  PersonaCategory,
} from "./claw/persona-loader.js";

// ── Go Binary Bridge — solana-claude-go communication layer ────────────────────
export { GoBridgeClient, createGoBridgeFromEnv } from "./go-bridge/client.js";
export type {
  GoBridgeMessageType,
  GoBridgeMessage,
  GoAgentStatus,
  GoWalletInfo,
  GoSignRequest,
  GoSignResult,
  GoTxSendRequest,
  GoTxSendResult,
  GoSwapRequest,
  GoSwapResult,
  GoMemoryEntry,
  GoBridgeConfig,
  GoBridgeEvents,
} from "./go-bridge/client.js";
