/**
 * Solana Clawd Go — Wallet Manager
 *
 * Creates an Ed25519 keypair at "agent birth" — the wallet is the
 * agent's on-chain identity, tied to its heartbeat.
 */

import { Keypair, Connection, PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js";
import bs58 from "bs58";
import { randomBytes, createHash } from "node:crypto";
import { EventEmitter } from "eventemitter3";
import { loadConfig, saveSecrets, loadSecrets, ensureScgHome } from "../config/vault.js";
import { writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { homedir } from "node:os";

export interface WalletInfo {
  publicKey: string;
  balance: number;
  birthTimestamp: number;
  agentName: string;
}

export interface WalletEvents {
  birth: (info: WalletInfo) => void;
  heartbeat: (info: WalletInfo) => void;
  balanceChange: (info: { publicKey: string; oldBalance: number; newBalance: number }) => void;
  error: (err: Error) => void;
}

export class ScgWallet extends EventEmitter<WalletEvents> {
  private keypair: Keypair | null = null;
  private connection: Connection | null = null;
  private balance = 0;
  private birthTimestamp = 0;
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null;
  private balanceWatchTimer: ReturnType<typeof setInterval> | null = null;

  constructor(private agentName: string) {
    super();
  }

  async birth(): Promise<WalletInfo> {
    const config = loadConfig();

    if (config.wallet.privateKey) {
      try {
        const secretKey = bs58.decode(config.wallet.privateKey);
        this.keypair = Keypair.fromSecretKey(secretKey);
      } catch {
        console.error("⚠️  Invalid wallet key in config, generating new one");
        this.keypair = null;
      }
    }

    if (!this.keypair) {
      this.keypair = Keypair.generate();
      const secrets = loadSecrets();
      secrets.SCG_WALLET_PRIVATE_KEY = bs58.encode(this.keypair.secretKey);
      secrets.SCG_WALLET_PUBLIC_KEY = this.keypair.publicKey.toBase58();
      saveSecrets(secrets);

      const scgHome = ensureScgHome();
      writeFileSync(
        join(scgHome, "wallet.pub"),
        this.keypair.publicKey.toBase58(),
        { mode: 0o644 }
      );
    }

    this.birthTimestamp = Date.now();

    if (config.helius.rpcUrl) {
      this.connection = new Connection(config.helius.rpcUrl, {
        commitment: "confirmed",
        wsEndpoint: config.helius.wssUrl || undefined,
      });
      try {
        const lamports = await this.connection.getBalance(this.keypair.publicKey);
        this.balance = lamports / LAMPORTS_PER_SOL;
      } catch {
        this.balance = 0;
      }
    }

    const info = this.getInfo();
    this.emit("birth", info);
    return info;
  }

  startHeartbeat(intervalMs = 5000): void {
    if (this.heartbeatTimer) clearInterval(this.heartbeatTimer);
    this.heartbeatTimer = setInterval(async () => {
      if (!this.keypair) return;
      const info = await this.refreshBalance();
      this.emit("heartbeat", info);
    }, intervalMs);

    if (this.balanceWatchTimer) clearInterval(this.balanceWatchTimer);
    this.balanceWatchTimer = setInterval(() => {
      this.refreshBalance().catch((err) => this.emit("error", err as Error));
    }, 15000);
  }

  stopHeartbeat(): void {
    if (this.heartbeatTimer) { clearInterval(this.heartbeatTimer); this.heartbeatTimer = null; }
    if (this.balanceWatchTimer) { clearInterval(this.balanceWatchTimer); this.balanceWatchTimer = null; }
  }

  async refreshBalance(): Promise<WalletInfo> {
    if (!this.keypair || !this.connection) return this.getInfo();
    try {
      const lamports = await this.connection.getBalance(this.keypair.publicKey);
      const newBalance = lamports / LAMPORTS_PER_SOL;
      if (newBalance !== this.balance) {
        this.emit("balanceChange", { publicKey: this.keypair.publicKey.toBase58(), oldBalance: this.balance, newBalance });
        this.balance = newBalance;
      }
    } catch (err) {
      this.emit("error", err as Error);
    }
    return this.getInfo();
  }

  sign(message: Uint8Array): Uint8Array {
    if (!this.keypair) throw new Error("Wallet not birthed yet");
    const { sign } = require("tweetnacl") as typeof import("tweetnacl");
    return sign.detached(message, this.keypair.secretKey);
  }

  getPublicKey(): string {
    if (!this.keypair) throw new Error("Wallet not birthed yet");
    return this.keypair.publicKey.toBase58();
  }

  getConnection(): Connection | null { return this.connection; }

  getKeypair(): Keypair {
    if (!this.keypair) throw new Error("Wallet not birthed yet");
    return this.keypair;
  }

  getInfo(): WalletInfo {
    return {
      publicKey: this.keypair?.publicKey.toBase58() ?? "",
      balance: this.balance,
      birthTimestamp: this.birthTimestamp,
      agentName: this.agentName,
    };
  }

  getAgentId(): string {
    if (!this.keypair) throw new Error("Wallet not birthed yet");
    const raw = `${this.keypair.publicKey.toBase58()}:${this.birthTimestamp}`;
    return createHash("sha256").update(raw).digest("hex").slice(0, 16);
  }
}

/** @deprecated Use ScgWallet */
export const NanoWallet = ScgWallet;
/** @deprecated Use ScgWallet */
export const ClawdWallet = ScgWallet;
