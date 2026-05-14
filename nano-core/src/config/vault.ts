/**
 * Solana clawd — Secure Configuration Vault
 *
 * AES-256-GCM encrypted config store.
 * All API keys and secrets are encrypted at rest.
 * Keys are only decrypted in-memory when needed.
 */

import { randomBytes, createCipheriv, createDecipheriv, createHash } from "node:crypto";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { homedir } from "node:os";
import { z } from "zod";

// ── Config Schema ────────────────────────────────────────────
export const ClawdConfigSchema = z.object({
  agent: z.object({
    name: z.string().default("clawd-agent"),
    id: z.string().optional(),
    heartbeatMs: z.number().default(5000),
  }),
  wallet: z.object({
    privateKey: z.string().optional(),
    publicKey: z.string().optional(),
    mnemonic: z.string().optional(),
  }),
  helius: z.object({
    rpcUrl: z.string(),
    apiKey: z.string(),
    wssUrl: z.string(),
  }),
  birdeye: z.object({
    apiKey: z.string(),
    wssUrl: z.string().default("wss://public-api.birdeye.so/socket"),
  }),
  jupiter: z.object({
    apiKey: z.string(),
  }),
  gateway: z.object({
    port: z.number().default(18790),
    host: z.string().default("0.0.0.0"),
    secret: z.string().optional(),
  }),
  hub: z.object({
    url: z.string().default("https://hub.solana-clawd.com"),
    apiKey: z.string().optional(),
  }),
  tailscale: z.object({
    authKey: z.string().optional(),
    domain: z.string().optional(),
  }),
  ai: z.object({
    provider: z.string().default("openrouter"),
    apiKey: z.string(),
    model: z.string().default("openrouter/healer-alpha"),
    baseUrl: z.string().default("https://openrouter.ai/api/v1"),
  }),
  memory: z.object({
    dbPath: z.string().default("~/.clawd/memory.db"),
    embeddingProvider: z.string().default("openrouter"),
    temporalDecayHours: z.number().default(168),
  }),
  go: z.object({
    enabled: z.boolean().default(false),
    host: z.string().default("127.0.0.1"),
    port: z.number().default(18800),
    secret: z.string().optional(),
  }),
});

export type ClawdConfig = z.infer<typeof ClawdConfigSchema>;

/** @deprecated Use ClawdConfig */
export type NanoConfig = ClawdConfig;

// ── Encryption Primitives ────────────────────────────────────

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;
const SALT_LENGTH = 32;

function deriveKey(password: string, salt: Buffer): Buffer {
  return createHash("sha256").update(Buffer.concat([Buffer.from(password), salt])).digest();
}

export function encrypt(plaintext: string, password: string): string {
  const salt = randomBytes(SALT_LENGTH);
  const key = deriveKey(password, salt);
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(plaintext, "utf8", "hex");
  encrypted += cipher.final("hex");
  const authTag = cipher.getAuthTag();

  // Format: salt:iv:authTag:ciphertext (all hex)
  return [
    salt.toString("hex"),
    iv.toString("hex"),
    authTag.toString("hex"),
    encrypted,
  ].join(":");
}

export function decrypt(encryptedStr: string, password: string): string {
  const parts = encryptedStr.split(":");
  if (parts.length !== 4) throw new Error("Invalid encrypted format");

  const salt = Buffer.from(parts[0]!, "hex");
  const iv = Buffer.from(parts[1]!, "hex");
  const authTag = Buffer.from(parts[2]!, "hex");
  const ciphertext = parts[3]!;

  const key = deriveKey(password, salt);
  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(ciphertext, "hex", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
}

// ── Vault ────────────────────────────────────────────────────

const CLAWD_HOME = join(homedir(), ".clawd");
const VAULT_FILE = join(CLAWD_HOME, "vault.enc");
const CONFIG_FILE = join(CLAWD_HOME, "config.json");

export function ensureClawdHome(): string {
  if (!existsSync(CLAWD_HOME)) {
    mkdirSync(CLAWD_HOME, { recursive: true, mode: 0o700 });
  }
  return CLAWD_HOME;
}

/** @deprecated Use ensureClawdHome */
export const ensureNanoHome = ensureClawdHome;

export function getVaultPassword(): string {
  const machineId = process.env.CLAWD_VAULT_PASSWORD
    ?? process.env.NANO_VAULT_PASSWORD
    ?? process.env.USER
    ?? "clawd-default";
  return createHash("sha256").update(machineId).digest("hex");
}

export function saveSecrets(secrets: Record<string, string>): void {
  ensureClawdHome();
  const password = getVaultPassword();
  const plaintext = JSON.stringify(secrets, null, 2);
  const encrypted = encrypt(plaintext, password);
  writeFileSync(VAULT_FILE, encrypted, { mode: 0o600 });
}

export function loadSecrets(): Record<string, string> {
  if (!existsSync(VAULT_FILE)) return {};
  const password = getVaultPassword();
  const encrypted = readFileSync(VAULT_FILE, "utf8");
  try {
    return JSON.parse(decrypt(encrypted, password));
  } catch {
    console.error("⚠️  Failed to decrypt vault — did the vault password change?");
    return {};
  }
}

export function loadConfig(): ClawdConfig {
  const env = process.env;
  const secrets = loadSecrets();

  const raw = {
    agent: {
      name: env.CLAWD_AGENT_NAME ?? env.NANO_AGENT_NAME ?? secrets.CLAWD_AGENT_NAME ?? secrets.NANO_AGENT_NAME ?? "clawd-agent",
      id: env.CLAWD_AGENT_ID ?? env.NANO_AGENT_ID ?? secrets.CLAWD_AGENT_ID ?? secrets.NANO_AGENT_ID,
      heartbeatMs: Number(env.CLAWD_AGENT_HEARTBEAT_INTERVAL_MS ?? env.NANO_AGENT_HEARTBEAT_INTERVAL_MS ?? 5000),
    },
    wallet: {
      privateKey: env.CLAWD_WALLET_PRIVATE_KEY ?? env.NANO_WALLET_PRIVATE_KEY ?? secrets.CLAWD_WALLET_PRIVATE_KEY ?? secrets.NANO_WALLET_PRIVATE_KEY,
      publicKey: env.CLAWD_WALLET_PUBLIC_KEY ?? env.NANO_WALLET_PUBLIC_KEY ?? secrets.CLAWD_WALLET_PUBLIC_KEY ?? secrets.NANO_WALLET_PUBLIC_KEY,
      mnemonic: env.CLAWD_WALLET_MNEMONIC ?? env.NANO_WALLET_MNEMONIC ?? secrets.CLAWD_WALLET_MNEMONIC ?? secrets.NANO_WALLET_MNEMONIC,
    },
    helius: {
      rpcUrl: env.HELIUS_RPC_URL ?? secrets.HELIUS_RPC_URL ?? "",
      apiKey: env.HELIUS_API_KEY ?? secrets.HELIUS_API_KEY ?? "",
      wssUrl: env.HELIUS_WSS_URL ?? secrets.HELIUS_WSS_URL ?? "",
    },
    birdeye: {
      apiKey: env.BIRDEYE_API_KEY ?? secrets.BIRDEYE_API_KEY ?? "",
      wssUrl: env.BIRDEYE_WSS_URL ?? secrets.BIRDEYE_WSS_URL ?? "wss://public-api.birdeye.so/socket",
    },
    jupiter: {
      apiKey: env.JUPITER_API_KEY ?? secrets.JUPITER_API_KEY ?? "",
    },
    gateway: {
      port: Number(env.CLAWD_GATEWAY_PORT ?? env.NANO_GATEWAY_PORT ?? 18790),
      host: env.CLAWD_GATEWAY_HOST ?? env.NANO_GATEWAY_HOST ?? "0.0.0.0",
      secret: env.CLAWD_GATEWAY_SECRET ?? env.NANO_GATEWAY_SECRET ?? secrets.CLAWD_GATEWAY_SECRET ?? secrets.NANO_GATEWAY_SECRET,
    },
    hub: {
      url: env.CLAWD_HUB_URL ?? env.NANO_HUB_URL ?? "https://hub.solana-clawd.com",
      apiKey: env.CLAWD_HUB_API_KEY ?? env.NANO_HUB_API_KEY ?? secrets.CLAWD_HUB_API_KEY ?? secrets.NANO_HUB_API_KEY,
    },
    tailscale: {
      authKey: env.TAILSCALE_AUTH_KEY ?? secrets.TAILSCALE_AUTH_KEY,
      domain: env.TAILSCALE_DOMAIN ?? secrets.TAILSCALE_DOMAIN,
    },
    ai: {
      provider: env.AI_PROVIDER ?? env.OPENROUTER_MODEL ? "openrouter" : "openrouter",
      apiKey: env.OPENROUTER_API_KEY ?? env.AI_API_KEY ?? secrets.OPENROUTER_API_KEY ?? secrets.AI_API_KEY ?? "",
      model: env.OPENROUTER_MODEL ?? env.AI_MODEL ?? "openrouter/healer-alpha",
      baseUrl: env.OPENROUTER_BASE_URL ?? "https://openrouter.ai/api/v1",
    },
    memory: {
      dbPath: env.CLAWD_MEMORY_DB_PATH ?? env.NANO_MEMORY_DB_PATH ?? "~/.clawd/memory.db",
      embeddingProvider: env.CLAWD_MEMORY_EMBEDDING_PROVIDER ?? env.NANO_MEMORY_EMBEDDING_PROVIDER ?? "openrouter",
      temporalDecayHours: Number(env.CLAWD_MEMORY_TEMPORAL_DECAY_HOURS ?? env.NANO_MEMORY_TEMPORAL_DECAY_HOURS ?? 168),
    },
    go: {
      enabled: (env.CLAWD_GO_ENABLED ?? "false").toLowerCase() === "true",
      host: env.CLAWD_GO_HOST ?? "127.0.0.1",
      port: Number(env.CLAWD_GO_PORT ?? 18800),
      secret: env.CLAWD_GO_SECRET ?? secrets.CLAWD_GO_SECRET,
    },
  };

  return ClawdConfigSchema.parse(raw);
}

/**
 * Redact a config object for safe display/logging.
 */
export function redactConfig(config: ClawdConfig): Record<string, unknown> {
  const mask = (val: string | undefined) =>
    val ? `${val.slice(0, 4)}...${val.slice(-4)}` : "(not set)";

  return {
    agent: config.agent,
    wallet: {
      publicKey: mask(config.wallet.publicKey),
      privateKey: config.wallet.privateKey ? "***REDACTED***" : "(not set)",
    },
    helius: {
      rpcUrl: mask(config.helius.rpcUrl),
      apiKey: mask(config.helius.apiKey),
      wssUrl: mask(config.helius.wssUrl),
    },
    birdeye: {
      apiKey: mask(config.birdeye.apiKey),
      wssUrl: config.birdeye.wssUrl,
    },
    jupiter: { apiKey: mask(config.jupiter.apiKey) },
    gateway: {
      port: config.gateway.port,
      host: config.gateway.host,
      secret: config.gateway.secret ? "***REDACTED***" : "(not set)",
    },
    hub: { url: config.hub.url },
    ai: { provider: config.ai.provider, model: config.ai.model, baseUrl: config.ai.baseUrl, apiKey: mask(config.ai.apiKey) },
    memory: config.memory,
    go: {
      enabled: config.go.enabled,
      host: config.go.host,
      port: config.go.port,
      secret: config.go.secret ? "***REDACTED***" : "(not set)",
    },
  };
}
