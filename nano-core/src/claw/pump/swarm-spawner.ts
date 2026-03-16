// ── NanoSolana × PumpFun — Swarm Spawner ─────────────────────────────────────
//
// The SwarmSpawner manages the lifecycle of autonomous financial agents.
// Each agent runs as an isolated async task with its own wallet, strategy,
// and metrics. The spawner enforces risk limits (max agents, max SOL exposure)
// and provides a unified API for the Telegram gateway.
//
// Architecture:
//   Telegram Gateway → SwarmSpawner → Agent Instances → Pump SDK Bridge
//                                  ↓
//                             Event Bus → Telegram Alerts
// ─────────────────────────────────────────────────────────────────────────────

import { randomUUID } from 'node:crypto';
import type {
  AgentIdentity,
  AgentState,
  AgentStatus,
  AgentMetrics,
  AgentRole,
  SpawnAgentRequest,
  SwarmConfig,
  GatewayEvent,
  GatewayEventType,
} from './types.js';
import * as sdk from './sdk-bridge.js';
import { getPersona, buildPersonaSystemPrompt, getPersonaTasks } from '../persona-loader.js';
import { formatPersonaTaskAssignments } from '../task-loader.js';
import { ClawVault } from '../../memory/clawvault.js';

// ── Agent Name Generator ────────────────────────────────────────────────────

const ADJECTIVES = [
  'Swift', 'Shadow', 'Quantum', 'Hyper', 'Crypto', 'Neural', 'Alpha',
  'Omega', 'Turbo', 'Stealth', 'Nano', 'Pulse', 'Flux', 'Vortex', 'Blitz',
];
const NOUNS = [
  'Shark', 'Eagle', 'Phoenix', 'Tiger', 'Wolf', 'Falcon', 'Dragon',
  'Panther', 'Cobra', 'Hawk', 'Mantis', 'Lynx', 'Raven', 'Viper', 'Orca',
];

function generateAgentName(role: AgentRole): string {
  const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)]!;
  const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)]!;
  const suffix = Math.floor(Math.random() * 1000)
    .toString()
    .padStart(3, '0');
  return `${adj}${noun}-${role}-${suffix}`;
}

// ── Event Bus ───────────────────────────────────────────────────────────────

type EventHandler = (event: GatewayEvent) => void;

class SwarmEventBus {
  private handlers = new Map<GatewayEventType | '*', EventHandler[]>();
  private buffer: GatewayEvent[] = [];
  private maxBuffer: number;

  constructor(maxBuffer = 1000) {
    this.maxBuffer = maxBuffer;
  }

  on(type: GatewayEventType | '*', handler: EventHandler): void {
    const handlers = this.handlers.get(type) ?? [];
    handlers.push(handler);
    this.handlers.set(type, handlers);
  }

  off(type: GatewayEventType | '*', handler: EventHandler): void {
    const handlers = this.handlers.get(type);
    if (!handlers) return;
    this.handlers.set(
      type,
      handlers.filter((h) => h !== handler),
    );
  }

  emit(type: GatewayEventType, source: string, data: unknown): void {
    const event: GatewayEvent = {
      id: randomUUID(),
      type,
      source,
      timestamp: new Date().toISOString(),
      data,
    };

    this.buffer.push(event);
    if (this.buffer.length > this.maxBuffer) {
      this.buffer = this.buffer.slice(-this.maxBuffer);
    }

    // Notify specific handlers
    const specific = this.handlers.get(type) ?? [];
    for (const handler of specific) {
      try {
        handler(event);
      } catch {
        // Swallow handler errors
      }
    }

    // Notify wildcard handlers
    const wildcard = this.handlers.get('*') ?? [];
    for (const handler of wildcard) {
      try {
        handler(event);
      } catch {
        // Swallow handler errors
      }
    }
  }

  getRecentEvents(limit = 50): GatewayEvent[] {
    return this.buffer.slice(-limit);
  }

  destroy(): void {
    this.handlers.clear();
    this.buffer = [];
  }
}

// ── Swarm Spawner ───────────────────────────────────────────────────────────

export class SwarmSpawner {
  private agents = new Map<string, AgentState>();
  private intervals = new Map<string, ReturnType<typeof setInterval>>();
  private agentMemory = new Map<string, ClawVault>();
  private config: SwarmConfig;
  private eventBus: SwarmEventBus;
  private startedAt = Date.now();

  constructor(config: SwarmConfig) {
    this.config = config;
    this.eventBus = new SwarmEventBus();
  }

  // ── Spawn ───────────────────────────────────────────────────────────────

  /**
   * Spawn a new agent in the swarm.
   * Validates risk limits, creates the agent state, and starts its run loop.
   */
  async spawn(request: SpawnAgentRequest): Promise<AgentState> {
    // Enforce max agents
    const activeCount = [...this.agents.values()].filter(
      (a) => a.status === 'running' || a.status === 'spawning',
    ).length;
    if (activeCount >= this.config.maxAgents) {
      throw new Error(
        `Swarm limit reached (${activeCount}/${this.config.maxAgents}). Stop an agent first.`,
      );
    }

    const id = randomUUID().split('-')[0]!;
    const name = request.name ?? generateAgentName(request.role);

    // ── Persona Resolution ────────────────────────────────────
    const persona = request.personaId ? getPersona(request.personaId) : null;

    const identity: AgentIdentity = {
      id,
      name,
      role: request.role,
      createdAt: Date.now(),
      walletAddress: `SIMULATED_${id.toUpperCase()}`, // Replace with real keypair in production
      personaId: persona?.identifier,
      personaAvatar: persona?.meta.avatar,
      personaTitle: persona?.meta.title,
    };

    const metrics: AgentMetrics = {
      eventsProcessed: 0,
      tradesExecuted: 0,
      totalVolumeLamports: 0n,
      currentExposureLamports: 0n,
      realizedPnlLamports: 0n,
      feesClaimed: 0n,
      uptimeSeconds: 0,
      custom: {},
    };

    const state: AgentState = {
      identity,
      status: 'spawning',
      config: request.config,
      metrics,
      lastError: null,
      lastErrorAt: null,
    };

    // ── Epistemological Memory (ClawVault) ────────────────────
    // Each agent gets its own persistent memory vault
    const memory = new ClawVault(
      `${this.config.dbPath.replace(/\.db$/, '')}-${id}`,
    );
    this.agentMemory.set(id, memory);

    // If persona is set, imprint its identity into LEARNED memory
    if (persona) {
      const systemPrompt = buildPersonaSystemPrompt(persona);

      memory.storeLearned({
        content: `I am ${persona.meta.title} (${persona.meta.avatar}). ${persona.meta.description}`,
        source: 'persona-birth',
        tags: ['identity', 'persona', ...persona.meta.tags],
        confidence: 1.0,
        sampleCount: 1,
      });

      memory.storeLearned({
        content: systemPrompt,
        source: 'persona-system-prompt',
        tags: ['system-prompt', 'persona', 'expertise'],
        confidence: 1.0,
        sampleCount: 1,
      });

      // Store each opening question as an INFERRED research direction
      for (const q of persona.config.openingQuestions) {
        memory.addResearchGap(q, []);
      }

      // ── Task Assignments ──────────────────────────────────────
      // Auto-assign dev tasks matched to this persona's expertise
      try {
        const taskAssignments = getPersonaTasks(persona);
        if (taskAssignments.length > 0) {
          memory.storeLearned({
            content: `I have ${taskAssignments.length} assigned development tasks: ${taskAssignments.map((a) => `[${a.task.id}] ${a.task.title}`).join('; ')}`,
            source: 'task-assignment',
            tags: ['tasks', 'mission', 'objectives', ...taskAssignments.flatMap((a) => a.task.domains)],
            confidence: 1.0,
          });

          for (const assignment of taskAssignments) {
            memory.storeLearned({
              content: `Task [${assignment.task.id}]: ${assignment.task.title}. Priority: ${assignment.task.priorityLabel}. Summary: ${assignment.task.summary}`,
              source: 'task-detail',
              tags: ['task', assignment.task.id, ...assignment.task.domains],
              confidence: 0.9,
            });
          }
        }
      } catch {
        // Task loading is non-critical — agent works fine without tasks
      }

      // Start autonomous memory management (decay + persistence)
      memory.startAutonomous();
    }

    this.agents.set(id, state);
    this.eventBus.emit('agent:spawned', id, {
      identity,
      role: request.role,
      persona: persona ? {
        id: persona.identifier,
        title: persona.meta.title,
        avatar: persona.meta.avatar,
      } : null,
    });

    // Start the agent's run loop
    try {
      await this.startAgentLoop(id);
      state.status = 'running';
    } catch (err) {
      state.status = 'error';
      state.lastError = err instanceof Error ? err.message : String(err);
      state.lastErrorAt = new Date().toISOString();
      this.eventBus.emit('agent:error', id, { error: state.lastError });
    }

    return state;
  }

  // ── Agent Loop ──────────────────────────────────────────────────────────

  private async startAgentLoop(agentId: string): Promise<void> {
    const state = this.agents.get(agentId);
    if (!state) return;

    const { role } = state.config as { role: AgentRole };
    const intervalMs = this.config.pollIntervalMs;

    // Each role has a different polling/execution loop
    const interval = setInterval(async () => {
      if (state.status !== 'running') return;

      try {
        state.metrics.uptimeSeconds = Math.floor(
          (Date.now() - state.identity.createdAt) / 1000,
        );

        switch (role) {
          case 'sniper':
            await this.runSniperTick(state);
            break;
          case 'monitor':
            await this.runMonitorTick(state);
            break;
          case 'fee-claimer':
            await this.runFeeClaimerTick(state);
            break;
          case 'analyst':
            await this.runAnalystTick(state);
            break;
          case 'momentum':
            await this.runMomentumTick(state);
            break;
          case 'graduation':
            await this.runGraduationTick(state);
            break;
          case 'market-maker':
            await this.runMarketMakerTick(state);
            break;
          case 'launcher':
            // Launcher is a one-shot action, not a loop
            break;
          case 'channel-feed':
          case 'outsider':
            // These run as PumpKit bots (external processes)
            break;
        }

        state.metrics.eventsProcessed++;
      } catch (err) {
        state.lastError = err instanceof Error ? err.message : String(err);
        state.lastErrorAt = new Date().toISOString();
        this.eventBus.emit('agent:error', agentId, { error: state.lastError });
      }
    }, intervalMs);

    this.intervals.set(agentId, interval);
  }

  // ── Role-Specific Tick Functions ────────────────────────────────────────

  private async runSniperTick(state: AgentState): Promise<void> {
    const config = state.config as { role: 'sniper'; targetMints: string[]; maxBuyLamports: bigint };
    for (const mint of config.targetMints) {
      const curve = await sdk.getBondingCurveState(mint);
      if (!curve || curve.complete) continue;

      // Check if price is still attractive
      if (curve.progress < 10) {
        const quote = await sdk.getBuyQuote(mint, config.maxBuyLamports);
        if (quote && quote.priceImpactBps < 500) {
          state.metrics.custom['last_opportunity'] = mint;
          this.eventBus.emit('agent:trade', state.identity.id, {
            type: 'snipe_opportunity',
            mint,
            tokensOut: quote.tokensOut.toString(),
            impact: quote.priceImpactBps,
          });
        }
      }
    }
  }

  private async runMonitorTick(state: AgentState): Promise<void> {
    const config = state.config as { role: 'monitor'; events: string[]; whaleThresholdSol: number };
    state.metrics.custom['monitoring'] = config.events.join(',');
    // Monitor runs passively — events come from the event bus
    // In production, this would connect to Helius WebSocket
  }

  private async runFeeClaimerTick(state: AgentState): Promise<void> {
    const config = state.config as { role: 'fee-claimer'; mints: string[] };
    for (const mint of config.mints) {
      const curve = await sdk.getBondingCurveState(mint);
      if (!curve) continue;

      const tier = sdk.getFeeTier(curve.marketCapSol);
      state.metrics.custom[`${mint.slice(0, 8)}_tier`] = tier.name;
      state.metrics.custom[`${mint.slice(0, 8)}_mcap`] = curve.marketCapSol.toFixed(2);
    }
  }

  private async runAnalystTick(state: AgentState): Promise<void> {
    const config = state.config as { role: 'analyst'; mints: string[] };
    for (const mint of config.mints) {
      const price = await sdk.getTokenPrice(mint);
      const progress = await sdk.getGraduationProgress(mint);
      if (price && progress) {
        state.metrics.custom[`${mint.slice(0, 8)}_price`] = price.priceSol.toFixed(12);
        state.metrics.custom[`${mint.slice(0, 8)}_progress`] = `${progress.percent}%`;
        state.metrics.custom[`${mint.slice(0, 8)}_stage`] = progress.stage;
        this.eventBus.emit('agent:metric', state.identity.id, {
          mint,
          ...price,
          ...progress,
        });
      }
    }
  }

  private async runMomentumTick(state: AgentState): Promise<void> {
    const config = state.config as { role: 'momentum'; watchMints: string[] };
    for (const mint of config.watchMints) {
      const price = await sdk.getTokenPrice(mint);
      if (price) {
        state.metrics.custom[`${mint.slice(0, 8)}_mcap`] = price.marketCapSol.toFixed(2);
      }
    }
  }

  private async runGraduationTick(state: AgentState): Promise<void> {
    const config = state.config as { role: 'graduation'; minProgressPercent: number };
    // In production, this would scan for tokens near graduation
    state.metrics.custom['threshold'] = `${config.minProgressPercent}%`;
  }

  private async runMarketMakerTick(state: AgentState): Promise<void> {
    const config = state.config as { role: 'market-maker'; mint: string; spreadBps: number };
    const price = await sdk.getTokenPrice(config.mint);
    if (price) {
      state.metrics.custom['current_price'] = price.priceSol.toFixed(12);
      state.metrics.custom['spread_bps'] = config.spreadBps;
    }
  }

  // ── Agent Control ─────────────────────────────────────────────────────

  /** Stop an agent — persists memory before shutdown */
  async stop(agentId: string): Promise<void> {
    const state = this.agents.get(agentId);
    if (!state) throw new Error(`Agent ${agentId} not found`);

    state.status = 'stopping';

    const interval = this.intervals.get(agentId);
    if (interval) {
      clearInterval(interval);
      this.intervals.delete(agentId);
    }

    // Persist epistemological memory before stopping
    const memory = this.agentMemory.get(agentId);
    if (memory) {
      memory.stopAutonomous();
    }

    state.status = 'stopped';
    this.eventBus.emit('agent:stopped', agentId, {
      id: agentId,
      name: state.identity.name,
    });
  }

  /** Pause an agent */
  pause(agentId: string): void {
    const state = this.agents.get(agentId);
    if (!state) throw new Error(`Agent ${agentId} not found`);
    state.status = 'paused';
  }

  /** Resume a paused agent */
  resume(agentId: string): void {
    const state = this.agents.get(agentId);
    if (!state || state.status !== 'paused') throw new Error(`Agent ${agentId} is not paused`);
    state.status = 'running';
  }

  /** Stop all agents — persist all memory */
  async stopAll(): Promise<void> {
    const ids = [...this.agents.keys()];
    await Promise.all(ids.map((id) => this.stop(id)));
    this.agentMemory.clear();
    this.eventBus.destroy();
  }

  /** Get an agent's epistemological memory vault */
  getAgentMemory(agentId: string): ClawVault | null {
    return this.agentMemory.get(agentId) ?? null;
  }

  // ── Queries ───────────────────────────────────────────────────────────

  /** Get a single agent's state */
  getAgent(agentId: string): AgentState | null {
    return this.agents.get(agentId) ?? null;
  }

  /** Get all agents */
  getAllAgents(): AgentState[] {
    return [...this.agents.values()];
  }

  /** Get agents by role */
  getAgentsByRole(role: AgentRole): AgentState[] {
    return [...this.agents.values()].filter((a) => a.identity.role === role);
  }

  /** Get running agents count */
  getActiveCount(): number {
    return [...this.agents.values()].filter((a) => a.status === 'running').length;
  }

  /** Get swarm health summary */
  getSwarmHealth(): {
    totalAgents: number;
    activeAgents: number;
    errorAgents: number;
    totalExposureLamports: bigint;
    uptimeSeconds: number;
    eventsProcessed: number;
  } {
    const agents = [...this.agents.values()];
    return {
      totalAgents: agents.length,
      activeAgents: agents.filter((a) => a.status === 'running').length,
      errorAgents: agents.filter((a) => a.status === 'error').length,
      totalExposureLamports: agents.reduce(
        (sum, a) => sum + a.metrics.currentExposureLamports,
        0n,
      ),
      uptimeSeconds: Math.floor((Date.now() - this.startedAt) / 1000),
      eventsProcessed: agents.reduce((sum, a) => sum + a.metrics.eventsProcessed, 0),
    };
  }

  /** Get recent events from the event bus */
  getRecentEvents(limit = 50): GatewayEvent[] {
    return this.eventBus.getRecentEvents(limit);
  }

  /** Subscribe to swarm events */
  on(type: GatewayEventType | '*', handler: EventHandler): void {
    this.eventBus.on(type, handler);
  }

  /** Unsubscribe from swarm events */
  off(type: GatewayEventType | '*', handler: EventHandler): void {
    this.eventBus.off(type, handler);
  }
}
