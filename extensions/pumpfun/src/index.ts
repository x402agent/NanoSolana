// ── PumpFun Extension for NanoClawd ────────────────────────────────
//
// Channel extension that bridges PumpFun on-chain events into the
// NanoClawd agent runtime. Provides:
//
//   - Real-time token launch monitoring via Solana WebSocket
//   - Bonding curve graduation alerts
//   - Whale trade detection
//   - Fee claim event tracking
//   - Direct trading command handling
//
// This extension plugs into the agent's message bus and enriches
// the OODA trading loop with live PumpFun protocol data.
// ────────────────────────────────────────────────────────────────────

export interface PumpFunExtensionConfig {
  /** Solana RPC WebSocket URL for real-time subscriptions */
  rpcWs: string;
  /** Minimum SOL value to trigger whale alerts */
  whaleThreshold: number;
  /** Whether to monitor new token launches */
  monitorLaunches: boolean;
  /** Whether to monitor graduations */
  monitorGraduations: boolean;
  /** Whether to monitor fee claims */
  monitorFeeClaims: boolean;
  /** Polling interval in ms for non-WebSocket fallback */
  pollIntervalMs: number;
}

export const DEFAULT_CONFIG: PumpFunExtensionConfig = {
  rpcWs: "wss://mainnet.helius-rpc.com",
  whaleThreshold: 10, // 10 SOL
  monitorLaunches: true,
  monitorGraduations: true,
  monitorFeeClaims: true,
  pollIntervalMs: 5000,
};

export interface PumpFunEvent {
  type:
    | "token:launch"
    | "token:graduation"
    | "trade:buy"
    | "trade:sell"
    | "trade:whale"
    | "fee:claim";
  mint: string;
  timestamp: string;
  data: Record<string, unknown>;
}

export type PumpFunEventHandler = (event: PumpFunEvent) => void;

/**
 * PumpFun Extension
 *
 * Monitors the Pump.fun protocol for real-time events and feeds them
 * into the agent's event system.
 */
export class PumpFunExtension {
  private config: PumpFunExtensionConfig;
  private handlers = new Set<PumpFunEventHandler>();
  private running = false;

  constructor(config: Partial<PumpFunExtensionConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /** Register an event handler */
  on(handler: PumpFunEventHandler): () => void {
    this.handlers.add(handler);
    return () => this.handlers.delete(handler);
  }

  /** Start monitoring */
  async start(): Promise<void> {
    if (this.running) return;
    this.running = true;
    // WebSocket subscription logic would go here
    // For now, this is the extension scaffold
  }

  /** Stop monitoring */
  async stop(): Promise<void> {
    this.running = false;
  }

  /** Check if the extension is active */
  isRunning(): boolean {
    return this.running;
  }

  /** Emit an event to all handlers */
  private emit(event: PumpFunEvent): void {
    for (const handler of this.handlers) {
      try {
        handler(event);
      } catch {
        // Swallow handler errors
      }
    }
  }
}

export default PumpFunExtension;
