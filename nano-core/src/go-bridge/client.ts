/**
 * Solana clawd — Go Binary Bridge
 *
 * Bidirectional communication layer between this TypeScript runtime
 * and the complementary solana-clawd Go binary.
 *
 * The Go binary (github.com/x402agent/solana-clawd) acts as the
 * systems-layer daemon: low-level Solana RPC, keypair management,
 * transaction signing, and hardware integration.
 *
 * This bridge lets both runtimes share:
 *   - Wallet state and balances
 *   - Trading signals and executions
 *   - Memory entries (ClawVault ↔ Go state store)
 *   - Agent heartbeats and health
 *   - Commands (e.g. sign tx, send SOL, swap via Jupiter)
 *
 * Transport: HTTP REST + WebSocket (Go binary listens on CLAWD_GO_PORT,
 * default 18800; TypeScript gateway on CLAWD_GATEWAY_PORT, default 18790).
 *
 * Auth: shared HMAC-SHA256 secret (CLAWD_GO_SECRET env var).
 */

import { createHmac } from "node:crypto";
import { EventEmitter } from "eventemitter3";
import { WebSocket } from "ws";

// ── Protocol types ──────────────────────────────────────────────

/** Message types supported by the Go binary protocol. */
export type GoBridgeMessageType =
  | "handshake"
  | "handshake:ack"
  | "ping"
  | "pong"
  | "agent:heartbeat"
  | "agent:status"
  | "wallet:info"
  | "wallet:balance"
  | "wallet:sign"
  | "wallet:sign:result"
  | "tx:send"
  | "tx:send:result"
  | "tx:swap"
  | "tx:swap:result"
  | "memory:push"
  | "memory:pull"
  | "memory:results"
  | "signal:push"
  | "signal:pull"
  | "signal:ack"
  | "command"
  | "command:result"
  | "error";

export interface GoBridgeMessage {
  type: GoBridgeMessageType;
  payload: unknown;
  from: "go" | "ts";
  requestId?: string;
  timestamp: number;
  signature?: string;
}

export interface GoAgentStatus {
  version: string;
  network: string;
  publicKey: string;
  balance: number;
  uptime: number;
  features: string[];
}

export interface GoWalletInfo {
  publicKey: string;
  balance: number;
  network: "mainnet-beta" | "devnet" | "testnet" | "localnet";
  slot: number;
}

export interface GoSignRequest {
  message: string;    // base64-encoded bytes to sign
  requestId: string;
}

export interface GoSignResult {
  signature: string;  // base64-encoded Ed25519 signature
  publicKey: string;
  requestId: string;
}

export interface GoTxSendRequest {
  serializedTx: string;  // base64-encoded transaction
  skipPreflight?: boolean;
  requestId: string;
}

export interface GoTxSendResult {
  signature: string;
  slot: number;
  confirmed: boolean;
  requestId: string;
}

export interface GoSwapRequest {
  inputMint: string;
  outputMint: string;
  amount: number;
  slippageBps?: number;
  requestId: string;
}

export interface GoSwapResult {
  txSignature: string;
  inputAmount: number;
  outputAmount: number;
  priceImpact: number;
  requestId: string;
}

export interface GoMemoryEntry {
  content: string;
  tier: "known" | "learned" | "inferred";
  source: string;
  tags?: string[];
  confidence?: number;
  timestamp: number;
}

export interface GoBridgeConfig {
  host: string;
  port: number;
  secret?: string;
  reconnectMs?: number;
  pingIntervalMs?: number;
}

export interface GoBridgeEvents {
  connected: () => void;
  disconnected: () => void;
  error: (err: Error) => void;
  message: (msg: GoBridgeMessage) => void;
  agentStatus: (status: GoAgentStatus) => void;
  walletInfo: (info: GoWalletInfo) => void;
  memoryPush: (entries: GoMemoryEntry[]) => void;
  signalPush: (signals: unknown[]) => void;
}

// ── Go Bridge Client ────────────────────────────────────────────

export class GoBridgeClient extends EventEmitter<GoBridgeEvents> {
  private ws: WebSocket | null = null;
  private reconnectTimer: ReturnType<typeof setInterval> | null = null;
  private pingTimer: ReturnType<typeof setInterval> | null = null;
  private connected = false;
  private pendingRequests = new Map<string, (result: unknown) => void>();

  constructor(private config: GoBridgeConfig) {
    super();
    this.config.reconnectMs ??= 5000;
    this.config.pingIntervalMs ??= 15000;
  }

  // ── Connection ──────────────────────────────────────────────

  async connect(): Promise<void> {
    const url = `ws://${this.config.host}:${this.config.port}/ws/ts`;

    return new Promise((resolve, reject) => {
      const ws = new WebSocket(url, {
        headers: this.config.secret
          ? { Authorization: `Bearer ${this.config.secret}` }
          : undefined,
      });

      const timeout = setTimeout(() => {
        ws.close();
        reject(new Error(`Go bridge connection timed out (${url})`));
      }, 10000);

      ws.on("open", () => {
        clearTimeout(timeout);
        this.ws = ws;
        this.connected = true;
        this.sendHandshake();
        this.startPing();
        resolve();
      });

      ws.on("message", (data) => {
        try {
          const msg = JSON.parse(data.toString()) as GoBridgeMessage;
          this.handleMessage(msg);
        } catch (err) {
          this.emit("error", new Error(`Bad message from Go bridge: ${err}`));
        }
      });

      ws.on("close", () => {
        clearTimeout(timeout);
        this.connected = false;
        this.ws = null;
        this.stopPing();
        this.emit("disconnected");
        this.scheduleReconnect();
      });

      ws.on("error", (err) => {
        clearTimeout(timeout);
        if (!this.connected) {
          reject(err);
        } else {
          this.emit("error", err);
        }
      });
    });
  }

  disconnect(): void {
    this.stopReconnect();
    this.stopPing();
    if (this.ws) {
      this.ws.close(1000, "Client disconnect");
      this.ws = null;
    }
    this.connected = false;
  }

  isConnected(): boolean {
    return this.connected && this.ws?.readyState === WebSocket.OPEN;
  }

  // ── Handshake ───────────────────────────────────────────────

  private sendHandshake(): void {
    this.send({
      type: "handshake",
      payload: {
        runtime: "typescript",
        version: "1.0.3",
        capabilities: ["memory", "signals", "heartbeat", "commands"],
      },
      from: "ts",
      timestamp: Date.now(),
    });
  }

  // ── Message routing ─────────────────────────────────────────

  private handleMessage(msg: GoBridgeMessage): void {
    this.emit("message", msg);

    // Resolve pending RPC-style requests
    if (msg.requestId && this.pendingRequests.has(msg.requestId)) {
      const resolve = this.pendingRequests.get(msg.requestId)!;
      this.pendingRequests.delete(msg.requestId);
      resolve(msg.payload);
    }

    switch (msg.type) {
      case "handshake:ack":
        this.emit("connected");
        break;

      case "pong":
        break;

      case "agent:status": {
        const status = msg.payload as GoAgentStatus;
        this.emit("agentStatus", status);
        break;
      }

      case "wallet:info": {
        const info = msg.payload as GoWalletInfo;
        this.emit("walletInfo", info);
        break;
      }

      case "memory:pull": {
        const entries = msg.payload as GoMemoryEntry[];
        this.emit("memoryPush", entries);
        break;
      }

      case "signal:pull": {
        const signals = msg.payload as unknown[];
        this.emit("signalPush", signals);
        break;
      }

      case "error": {
        const payload = msg.payload as { message?: string };
        this.emit("error", new Error(payload?.message ?? "Unknown Go bridge error"));
        break;
      }
    }
  }

  // ── RPC calls ───────────────────────────────────────────────

  async requestWalletInfo(): Promise<GoWalletInfo> {
    return this.rpc<GoWalletInfo>("wallet:info", {});
  }

  async signMessage(messageBase64: string): Promise<GoSignResult> {
    const requestId = crypto.randomUUID();
    return this.rpc<GoSignResult>("wallet:sign", { message: messageBase64, requestId });
  }

  async sendTransaction(serializedTxBase64: string, skipPreflight = false): Promise<GoTxSendResult> {
    const requestId = crypto.randomUUID();
    return this.rpc<GoTxSendResult>("tx:send", {
      serializedTx: serializedTxBase64,
      skipPreflight,
      requestId,
    });
  }

  async swapTokens(req: Omit<GoSwapRequest, "requestId">): Promise<GoSwapResult> {
    const requestId = crypto.randomUUID();
    return this.rpc<GoSwapResult>("tx:swap", { ...req, requestId });
  }

  async pushMemoryEntries(entries: GoMemoryEntry[]): Promise<void> {
    this.send({
      type: "memory:push",
      payload: entries,
      from: "ts",
      timestamp: Date.now(),
    });
  }

  async pushSignal(signal: unknown): Promise<void> {
    this.send({
      type: "signal:push",
      payload: signal,
      from: "ts",
      timestamp: Date.now(),
    });
  }

  async getAgentStatus(): Promise<GoAgentStatus> {
    return this.rpc<GoAgentStatus>("agent:status", {});
  }

  // ── HTTP REST fallback ──────────────────────────────────────

  async httpGet<T>(path: string): Promise<T> {
    const url = `http://${this.config.host}:${this.config.port}${path}`;
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (this.config.secret) {
      headers["X-Clawd-Secret"] = this.config.secret;
    }

    const res = await fetch(url, { headers });
    if (!res.ok) throw new Error(`Go bridge HTTP ${res.status} on ${path}`);
    return res.json() as Promise<T>;
  }

  async httpPost<T>(path: string, body: unknown): Promise<T> {
    const url = `http://${this.config.host}:${this.config.port}${path}`;
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (this.config.secret) {
      headers["X-Clawd-Secret"] = this.config.secret;
    }

    const res = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`Go bridge HTTP ${res.status} on ${path}`);
    return res.json() as Promise<T>;
  }

  async httpHealth(): Promise<{ status: string; version: string; publicKey: string }> {
    return this.httpGet("/health");
  }

  // ── Internal helpers ────────────────────────────────────────

  private rpc<T>(type: GoBridgeMessageType, payload: unknown, timeoutMs = 15000): Promise<T> {
    if (!this.isConnected()) {
      return Promise.reject(new Error("Go bridge not connected"));
    }

    const requestId = crypto.randomUUID();

    return new Promise<T>((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pendingRequests.delete(requestId);
        reject(new Error(`Go bridge RPC timeout: ${type} (${timeoutMs}ms)`));
      }, timeoutMs);

      this.pendingRequests.set(requestId, (result) => {
        clearTimeout(timer);
        resolve(result as T);
      });

      this.send({
        type,
        payload,
        from: "ts",
        requestId,
        timestamp: Date.now(),
      });
    });
  }

  private send(msg: Omit<GoBridgeMessage, "signature">): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;

    const signed: GoBridgeMessage = {
      ...msg,
      signature: this.config.secret
        ? createHmac("sha256", this.config.secret)
            .update(JSON.stringify({ type: msg.type, from: msg.from, timestamp: msg.timestamp }))
            .digest("hex")
        : undefined,
    };

    this.ws.send(JSON.stringify(signed));
  }

  private startPing(): void {
    this.stopPing();
    this.pingTimer = setInterval(() => {
      this.send({ type: "ping", payload: {}, from: "ts", timestamp: Date.now() });
    }, this.config.pingIntervalMs!);
  }

  private stopPing(): void {
    if (this.pingTimer) {
      clearInterval(this.pingTimer);
      this.pingTimer = null;
    }
  }

  private scheduleReconnect(): void {
    this.stopReconnect();
    this.reconnectTimer = setInterval(async () => {
      try {
        await this.connect();
        this.stopReconnect();
      } catch {
        // Keep retrying silently
      }
    }, this.config.reconnectMs!);
  }

  private stopReconnect(): void {
    if (this.reconnectTimer) {
      clearInterval(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }
}

// ── Factory ─────────────────────────────────────────────────────

export function createGoBridgeFromEnv(): GoBridgeClient | null {
  const enabled = (process.env.CLAWD_GO_ENABLED ?? "false").toLowerCase() === "true";
  if (!enabled) return null;

  return new GoBridgeClient({
    host: process.env.CLAWD_GO_HOST ?? "127.0.0.1",
    port: Number(process.env.CLAWD_GO_PORT ?? 18800),
    secret: process.env.CLAWD_GO_SECRET,
    reconnectMs: Number(process.env.CLAWD_GO_RECONNECT_MS ?? 5000),
    pingIntervalMs: Number(process.env.CLAWD_GO_PING_MS ?? 15000),
  });
}
