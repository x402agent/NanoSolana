#!/usr/bin/env node

/**
 * ╔══════════════════════════════════════════════════════════════════════╗
 * ║              NANOSOLANA TAMAGOBOT — CLI Entry                     ║
 * ║  A GoBot on Solana · Physical Companion: TamaGOchi               ║
 * ║  By NanoSolana Labs                                               ║
 * ╚══════════════════════════════════════════════════════════════════════╝
 *
 * The `nanosolana` command — one-shot interface for:
 *   - Birthing agents with Solana wallets + TamaGOchi pets
 *   - Starting the OODA trading engine (RSI + EMA + ATR)
 *   - Communicating with nano bots across Tailscale mesh
 *   - ClawVault 3-tier memory (known → learned → inferred)
 *   - TamaGOchi pet whose mood/evolution is driven by trades
 */

import { Command } from "commander";
import chalk from "chalk";
import { loadConfig, saveSecrets, loadSecrets, redactConfig, ensureNanoHome } from "../config/vault.js";
import { NanoWallet } from "../wallet/manager.js";
import { TradingEngine } from "../trading/engine.js";
import { ClawVault } from "../memory/clawvault.js";
import { NanoGateway } from "../gateway/server.js";
import { TamaGOchi, STAGE_EMOJI, MOOD_EMOJI } from "../pet/tamagochi.js";
import { TailscaleDiscovery, TmuxManager, NanoNetworkClient } from "../network/mesh.js";
import { getNanoKnowledgeSnapshot, getNanoKnowledgeSummary, searchNanoKnowledge } from "../docs/integration.js";
import {
  playStartupAnimation, animateLobster, printLobster, startDvdScreensaver,
  printSplashBanner, phaseTransition, matrixRain,
  playDvdIntro,
  printCompleteBanner, printCommandHeader, printSuccess, printError,
  printWarning, printInfo, paymentAnimation, demoIntro, printInitHeader, printSectionHeader,
  systemBootReadout,
} from "./animations.js";
import { HeliusClient, printWalletSnapshot } from "../onchain/helius-client.js";
import { AgentRegistry, registerOnHeartbeat } from "../registry/agent-registry.js";
import { NanoBotServer } from "../nanobot/server.js";
import {
  getTask,
  getTaskSummary,
  getTasksForPersona,
  loadAllTasks,
  searchTasks,
} from "../claw/task-loader.js";
import { getPersona, getPersonaTasks } from "../claw/persona-loader.js";
import {
  clampNanoHubLimit,
  getNanoHubDiscoveryUrl,
  getNanoHubSiteUrl,
  getNanoHubSkill,
  getNanoHubSkillFile,
  getNanoHubSkillUrl,
  listNanoHubSkills,
  searchNanoHubSkills,
} from "../hub/public-client.js";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { homedir } from "node:os";
import { createInterface } from "node:readline";
import { execSync } from "node:child_process";
import { runDoctor } from "./doctor.js";
import { showSoul, validateSoul, showSoulStats } from "./soul.js";

// ── Banner ────────────────────────────────────────────────────

function printBanner(): void {
  // Legacy sync banner — used by commands that don't await
  console.log(chalk.cyan(`
  ███╗   ██╗ █████╗ ███╗   ██╗ ██████╗ ███████╗ ██████╗ ██╗      █████╗ ███╗   ██╗ █████╗
  ████╗  ██║██╔══██╗████╗  ██║██╔═══██╗██╔════╝██╔═══██╗██║     ██╔══██╗████╗  ██║██╔══██╗
  ██╔██╗ ██║███████║██╔██╗ ██║██║   ██║███████╗██║   ██║██║     ███████║██╔██╗ ██║███████║
  ██║╚██╗██║██╔══██║██║╚██╗██║██║   ██║╚════██║██║   ██║██║     ██╔══██║██║╚██╗██║██╔══██║
  ██║ ╚████║██║  ██║██║ ╚████║╚██████╔╝███████║╚██████╔╝███████╗██║  ██║██║ ╚████║██║  ██║
  ╚═╝  ╚═══╝╚═╝  ╚═╝╚═╝  ╚═══╝ ╚═════╝ ╚══════╝ ╚═════╝ ╚══════╝╚═╝  ╚═╝╚═╝  ╚═══╝╚═╝  ╚═╝
  `));
  console.log(chalk.white("  🦞 NanoSolana TamaGObot"));
  console.log(chalk.gray("  Autonomous Financial Intelligence on Solana · By NanoSolana Labs\n"));
}

// ── Helpers ────────────────────────────────────────────────────

async function promptSecret(question: string): Promise<string> {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(chalk.yellow(`  ${question}: `), (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

function parsePositiveInteger(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }

  return Math.floor(parsed);
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  const units = ["KB", "MB", "GB"];
  let value = bytes / 1024;
  let unitIndex = 0;

  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }

  return `${value.toFixed(1)} ${units[unitIndex]}`;
}

function formatHubRelativeTime(timestamp?: number | null): string {
  if (!timestamp || !Number.isFinite(timestamp)) {
    return "unknown";
  }

  const diff = Date.now() - timestamp;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days >= 30) {
    return `${Math.floor(days / 30)}mo ago`;
  }
  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return "just now";
}

function isTruthy(value: string | undefined): boolean {
  if (!value) return false;
  const normalized = value.trim().toLowerCase();
  return normalized === "1" || normalized === "true" || normalized === "yes" || normalized === "on";
}

// ── CLI Program ────────────────────────────────────────────────

const program = new Command();

program
  .name("nanosolana")
  .description("🦞 NanoSolana — Autonomous Solana trading intelligence with a virtual pet soul")
  .version("1.0.2");

// ── nano init ────────────────────────────────────────────────

program
  .command("init")
  .description("Initialize Nano Solana and configure API keys")
  .action(async () => {
    printBanner();
    console.log(chalk.white.bold("  🔧 Initializing Nano Solana...\n"));

    ensureNanoHome();
    const secrets = loadSecrets();

    // Prompt for API keys
    console.log(chalk.cyan("  ── Helius (Solana RPC) ──────────────────────\n"));
    secrets.HELIUS_RPC_URL = await promptSecret("Helius RPC URL");
    secrets.HELIUS_API_KEY = await promptSecret("Helius API Key");
    secrets.HELIUS_WSS_URL = await promptSecret("Helius WSS URL");

    console.log(chalk.cyan("\n  ── Birdeye (Token Analytics) ────────────────\n"));
    secrets.BIRDEYE_API_KEY = await promptSecret("Birdeye API Key");
    secrets.BIRDEYE_WSS_URL = await promptSecret("Birdeye WSS URL (or press Enter for default)");
    if (!secrets.BIRDEYE_WSS_URL) {
      secrets.BIRDEYE_WSS_URL = "wss://public-api.birdeye.so/socket";
    }

    console.log(chalk.cyan("\n  ── Jupiter (DEX Aggregator) ─────────────────\n"));
    secrets.JUPITER_API_KEY = await promptSecret("Jupiter API Key");

    console.log(chalk.cyan("\n  ── AI Provider ──────────────────────────────\n"));
    secrets.AI_API_KEY = await promptSecret("AI API Key (Gemini/OpenAI)");

    // Save encrypted
    saveSecrets(secrets);

    console.log(chalk.green("\n  ✅ Secrets encrypted and saved to ~/.nanosolana/vault.enc"));
    console.log(chalk.gray("  Keys are AES-256-GCM encrypted at rest.\n"));

    // Create .env template
    const envPath = join(process.cwd(), ".env");
    if (!existsSync(envPath)) {
      const envContent = `# Nano Solana Configuration
NANO_AGENT_NAME=nano-alpha
NANO_GATEWAY_PORT=18790
AI_PROVIDER=gemini
AI_MODEL=gemini-2.5-pro
NANO_LOG_LEVEL=info
`;
      writeFileSync(envPath, envContent);
      console.log(chalk.gray("  Created .env with non-sensitive defaults.\n"));
    }

    console.log(chalk.white("  Run ") + chalk.cyan("nanosolana birth") + chalk.white(" to create your agent."));
    console.log(chalk.white("  Or run ") + chalk.cyan("nanosolana go") + chalk.white(" to do everything at once.\n"));
  });

// ── nano birth ────────────────────────────────────────────────

program
  .command("birth")
  .description("Birth a new nano agent with a Solana wallet")
  .option("-n, --name <name>", "Agent name", "NanoSolana")
  .option("--pet-name <petName>", "TamaGOchi pet name")
  .action(async (opts) => {
    printBanner();
    console.log(chalk.white.bold(`  🌱 Birthing agent "${opts.name}"...\n`));

    try {
      const config = loadConfig();
      const wallet = new NanoWallet(opts.name);
      const info = await wallet.birth();

      // Birth the TamaGOchi pet
      const petName = opts.petName ?? opts.name;
      const pet = new TamaGOchi(petName);
      pet.recordWalletCreated(info.balance);

      console.log(chalk.green("  ✅ Agent birthed successfully!\n"));
      console.log(chalk.white("  Agent Name:    ") + chalk.cyan(opts.name));
      console.log(chalk.white("  Agent ID:      ") + chalk.cyan(wallet.getAgentId()));
      console.log(chalk.white("  Public Key:    ") + chalk.cyan(info.publicKey));
      console.log(chalk.white("  SOL Balance:   ") + chalk.yellow(`${info.balance} SOL`));
      console.log(chalk.white("  Birth Time:    ") + chalk.gray(new Date(info.birthTimestamp).toISOString()));
      console.log(chalk.white("  TamaGOchi:     ") + chalk.cyan(`${STAGE_EMOJI[pet.getState().stage]} ${petName} ${MOOD_EMOJI[pet.getState().mood]}`));

      // Blockchain scan at birth (if Helius configured)
      const birthConfig = loadConfig();
      if (birthConfig.helius?.rpcUrl && birthConfig.helius?.apiKey) {
        try {
          console.log(chalk.cyan("\n  ⛓️  Scanning blockchain..."));
          const helius = new HeliusClient({ rpcUrl: birthConfig.helius.rpcUrl, apiKey: birthConfig.helius.apiKey, wssUrl: birthConfig.helius.wssUrl });
          const snap = await helius.snapshotWallet(info.publicKey);
          printWalletSnapshot(snap, chalk);
        } catch (err) {
          console.log(chalk.gray(`  ⚠️  Blockchain scan skipped: ${(err as Error).message}`));
        }
      }

      console.log(chalk.gray("  Wallet saved to ~/.nanosolana/vault.enc (encrypted)"));
      console.log(chalk.gray("  Pet state saved to ~/.nanosolana/tamagochi.json\n"));
      console.log(chalk.white("  Run ") + chalk.cyan("nanosolana run") + chalk.white(" to start the agent.\n"));
    } catch (err) {
      console.error(chalk.red(`  ❌ Birth failed: ${(err as Error).message}\n`));
      process.exit(1);
    }
  });

// ── nano run ────────────────────────────────────────────────────

program
  .command("run")
  .description("Run the nano agent (gateway + trading + memory)")
  .option("-n, --name <name>", "Agent name", "NanoSolana")
  .option("--pet-name <petName>", "TamaGOchi pet name")
  .option("--no-trade", "Disable trading engine (--no-ooda)")
  .option("--no-gateway", "Disable gateway server")
  .action(async (opts) => {
    printBanner();
    console.log(chalk.white.bold(`  🚀 Starting NanoSolana TamaGObot "${opts.name}"...\n`));

    try {
      const config = loadConfig();

      // 1. Birth wallet
      const wallet = new NanoWallet(opts.name);
      const walletInfo = await wallet.birth();
      wallet.startHeartbeat(config.agent.heartbeatMs);
      console.log(chalk.green(`  ✅ Wallet: ${walletInfo.publicKey.slice(0, 8)}...${walletInfo.publicKey.slice(-8)}`));

      // 2. Birth TamaGOchi pet
      const petName = opts.petName ?? opts.name;
      const pet = new TamaGOchi(petName);
      pet.recordWalletCreated(walletInfo.balance);
      pet.startLifecycle();
      const petState = pet.getState();
      console.log(chalk.green(`  ✅ TamaGOchi: ${STAGE_EMOJI[petState.stage]} ${petName} ${MOOD_EMOJI[petState.mood]} (level ${petState.level})`));

      // 3. Start ClawVault memory
      const vault = new ClawVault();
      vault.startAutonomous();
      const vaultStats = vault.getStats();
      console.log(chalk.green(`  ✅ ClawVault: ${vaultStats.known}K/${vaultStats.learned}L/${vaultStats.inferred}I entries, ${vaultStats.lessons} lessons`));

      // 4. Start trading engine
      const trading = new TradingEngine(config, wallet);
      if (opts.trade !== false) {
        await trading.start();
        console.log(chalk.green("  ✅ Trading engine: ACTIVE (OODA loop)"));
      }

      // Wire trading → ClawVault + TamaGOchi
      trading.on("signal", (signal) => {
        // Store as KNOWN (fresh market data)
        vault.storeKnown({
          content: `Signal: ${signal.type} ${signal.symbol} (${(signal.confidence * 100).toFixed(0)}% confidence)`,
          source: "birdeye",
          tags: [signal.type, signal.symbol],
        });

        // Experience replay before acting
        const replay = vault.experienceReplay({
          tokenSymbol: signal.symbol,
          tradeType: signal.type,
        });

        if (replay.warnings.length > 0) {
          for (const w of replay.warnings) console.log(chalk.red(`  ${w}`));
        }
        if (replay.greenLights.length > 0) {
          for (const g of replay.greenLights) console.log(chalk.green(`  ${g}`));
        }
      });

      trading.on("priceUpdate", (price) => {
        vault.storeKnown({
          content: `${price.symbol}: $${price.price.toFixed(6)} (${price.priceChange24h > 0 ? "+" : ""}${price.priceChange24h.toFixed(1)}%)`,
          source: "birdeye",
          tags: [price.symbol, "price"],
          metadata: { mint: price.mint, volume: price.volume24h },
        });
      });

      // 5. Start gateway
      if (opts.gateway !== false) {
        // Gateway still uses the legacy MemoryEngine interface for now
        const { MemoryEngine } = await import("../memory/engine.js");
        const legacyMemory = new MemoryEngine(config.memory.temporalDecayHours);
        const gateway = new NanoGateway(config, wallet, trading, legacyMemory);
        await gateway.start();
        console.log(chalk.green(`  ✅ Gateway: ws://${config.gateway.host}:${config.gateway.port}`));
      }

      console.log(chalk.cyan("\n  ══════════════════════════════════════════════"));
      console.log(chalk.cyan(`  🐹 ${petName} is alive. Press Ctrl+C to stop.`));
      console.log(chalk.cyan("  ══════════════════════════════════════════════\n"));

      // Heartbeat logs — with pet mood
      wallet.on("heartbeat", (info) => {
        const time = new Date().toLocaleTimeString();
        const mood = MOOD_EMOJI[pet.getState().mood];
        process.stdout.write(chalk.gray(`  [${time}] 💓 ${info.balance.toFixed(4)} SOL ${mood}\r`));
      });

      wallet.on("balanceChange", ({ oldBalance, newBalance }) => {
        const delta = newBalance - oldBalance;
        const color = delta > 0 ? chalk.green : chalk.red;
        console.log(color(`\n  💰 Balance change: ${delta > 0 ? "+" : ""}${delta.toFixed(6)} SOL`));
        if (delta > 0) pet.feed(delta);
      });

      trading.on("signal", (signal) => {
        const icon = signal.type === "buy" ? "🟢" : signal.type === "sell" ? "🔴" : "⚪";
        console.log(`  ${icon} Signal: ${signal.type.toUpperCase()} ${signal.symbol} (${(signal.confidence * 100).toFixed(0)}% confidence)`);
      });

      vault.on("lessonLearned", (lesson) => {
        console.log(chalk.magenta(`  📖 Lesson: ${lesson.pattern} → ${lesson.outcome}`));
      });

      pet.on("evolved", (from, to) => {
        console.log(chalk.yellow(`\n  🐹 EVOLUTION! ${STAGE_EMOJI[from]} ${from} → ${STAGE_EMOJI[to]} ${to}`));
      });

      pet.on("moodChanged", (from, to) => {
        console.log(chalk.gray(`  ${MOOD_EMOJI[to]} Mood: ${from} → ${to}`));
      });

      pet.on("levelUp", (level) => {
        console.log(chalk.yellow(`  ⬆️  Level up! Now level ${level}`));
      });

      // Graceful shutdown
      const shutdown = async () => {
        console.log(chalk.yellow("\n\n  ⏹  Shutting down..."));
        wallet.stopHeartbeat();
        trading.stop();
        vault.stopAutonomous();
        pet.stopLifecycle();
        console.log(chalk.green("  ✅ Agent stopped cleanly.\n"));
        process.exit(0);
      };

      process.on("SIGINT", shutdown);
      process.on("SIGTERM", shutdown);

      // Keep alive
      await new Promise(() => {});
    } catch (err) {
      console.error(chalk.red(`  ❌ Failed to start: ${(err as Error).message}\n`));
      process.exit(1);
    }
  });

// ── nano status ────────────────────────────────────────────────

program
  .command("status")
  .description("Show agent status, wallet, TamaGOchi, and ClawVault stats")
  .action(async () => {
    try {
      const config = loadConfig();
      const wallet = new NanoWallet(config.agent.name);
      await wallet.birth();

      const vault = new ClawVault();
      const vaultStats = vault.getStats();
      const pet = new TamaGOchi(config.agent.name);

      console.log(chalk.cyan("\n  ── NanoSolana TamaGObot Status ───────────────\n"));
      console.log(chalk.white("  Agent:      ") + chalk.cyan(config.agent.name));
      console.log(chalk.white("  Wallet:     ") + chalk.cyan(wallet.getPublicKey()));
      console.log(chalk.white("  Balance:    ") + chalk.yellow(`${wallet.getInfo().balance} SOL`));
      console.log(chalk.white("  TamaGOchi:  ") + chalk.cyan(`${STAGE_EMOJI[pet.getState().stage]} ${pet.getState().name} ${MOOD_EMOJI[pet.getState().mood]}`));
      console.log(chalk.white("  ClawVault:  ") + chalk.gray(`${vaultStats.known}K ${vaultStats.learned}L ${vaultStats.inferred}I | ${vaultStats.lessons} lessons`));
      console.log(chalk.white("  Win Rate:   ") + chalk.green(`${(vaultStats.tradeWinRate * 100).toFixed(1)}%`));
      console.log(chalk.white("  Gateway:    ") + chalk.gray(`${config.gateway.host}:${config.gateway.port}`));

      // Tailscale status
      if (TailscaleDiscovery.isAvailable()) {
        const nodes = TailscaleDiscovery.discoverNodes();
        const online = nodes.filter((n) => n.online);
        console.log(chalk.white("  Tailscale:  ") + chalk.green(`${online.length}/${nodes.length} nodes online`));
      } else {
        console.log(chalk.white("  Tailscale:  ") + chalk.gray("not available"));
      }

      // tmux sessions
      const sessions = TmuxManager.listNanoSessions();
      console.log(chalk.white("  tmux bots:  ") + chalk.gray(`${sessions.length} sessions`));

      console.log();
    } catch (err) {
      console.error(chalk.red(`  ❌ ${(err as Error).message}\n`));
    }
  });

// ── nano pet ────────────────────────────────────────────────

program
  .command("pet")
  .description("Show TamaGOchi pet status")
  .action(() => {
    try {
      const config = loadConfig();
      const pet = new TamaGOchi(config.agent.name);
      console.log();
      console.log(pet.getStatusDisplay().split("\n").map((l) => `  ${l}`).join("\n"));
      console.log();
    } catch (err) {
      console.error(chalk.red(`  ❌ ${(err as Error).message}\n`));
    }
  });

// ── nano send ────────────────────────────────────────────────

program
  .command("send")
  .description("One-shot: send a message to nano bots across the mesh")
  .argument("<message>", "Message to send")
  .option("-t, --target <hostname>", "Target specific node (default: broadcast)")
  .action(async (message, opts) => {
    try {
      const config = loadConfig();
      const gatewaySecret = config.gateway.secret ?? "";

      if (!TailscaleDiscovery.isAvailable()) {
        console.log(chalk.yellow("  ⚠️  Tailscale not available. Sending to local gateway only.\n"));

        // Connect to local gateway
        const client = new NanoNetworkClient(gatewaySecret);
        const localNode = { hostname: "localhost", ip: "127.0.0.1", online: true, os: process.platform, tailscaleId: "local", lastSeen: Date.now(), gatewayPort: config.gateway.port };
        await client.connectToNode(localNode, config.agent.name);
        client.sendToNode("localhost", message, config.agent.name);
        console.log(chalk.green(`  ✅ Sent to local gateway\n`));
        client.disconnectAll();
        return;
      }

      const nodes = TailscaleDiscovery.discoverNodes().filter((n) => n.online);
      const client = new NanoNetworkClient(gatewaySecret);

      if (opts.target) {
        const target = nodes.find((n) => n.hostname === opts.target);
        if (!target) {
          console.log(chalk.red(`  ❌ Node "${opts.target}" not found.\n`));
          process.exit(1);
        }

        const connected = await client.connectToNode(target, config.agent.name);
        if (connected) {
          client.sendToNode(target.hostname, message, config.agent.name);
          console.log(chalk.green(`  ✅ Sent to ${target.hostname}\n`));
        } else {
          console.log(chalk.red(`  ❌ Could not connect to ${target.hostname}\n`));
        }
      } else {
        // Broadcast to all online nodes
        let connected = 0;
        for (const node of nodes) {
          const ok = await client.connectToNode(node, config.agent.name);
          if (ok) connected++;
        }

        const sent = client.broadcastToAll(message, config.agent.name);
        console.log(chalk.green(`  ✅ Broadcasted to ${sent}/${connected} nodes\n`));
      }

      client.disconnectAll();
    } catch (err) {
      console.error(chalk.red(`  ❌ ${(err as Error).message}\n`));
    }
  });

// ── nano bots ────────────────────────────────────────────────

program
  .command("bots")
  .description("Manage nano bots (tmux sessions)")
  .addCommand(
    new Command("list")
      .description("List running nano bot sessions")
      .action(() => {
        const sessions = TmuxManager.listNanoSessions();
        if (sessions.length === 0) {
          console.log(chalk.gray("\n  No nano bot sessions running.\n"));
          return;
        }

        console.log(chalk.cyan("\n  ── Nano Bots ────────────────────────────────\n"));
        for (const s of sessions) {
          const status = s.attached ? chalk.green("attached") : chalk.gray("detached");
          console.log(`  ${chalk.white(s.name)}  ${status}  (${s.windows} windows)`);
        }
        console.log();
      }),
  )
  .addCommand(
    new Command("spawn")
      .description("Spawn a new nano bot in a tmux session")
      .argument("<name>", "Bot name")
      .action((name) => {
        const ok = TmuxManager.createSession(name, `nanosolana run --name ${name}`);
        if (ok) {
          console.log(chalk.green(`\n  ✅ Spawned nano bot "${name}" in tmux session "nano-${name}"\n`));
        } else {
          console.log(chalk.red(`\n  ❌ Failed to spawn bot "${name}"\n`));
        }
      }),
  )
  .addCommand(
    new Command("attach")
      .description("Attach to a nano bot session")
      .argument("<name>", "Bot name")
      .action((name) => {
        const sessionName = name.startsWith("nano-") ? name : `nano-${name}`;
        TmuxManager.attachSession(sessionName);
      }),
  )
  .addCommand(
    new Command("kill")
      .description("Kill a nano bot session")
      .argument("<name>", "Bot name")
      .action((name) => {
        const sessionName = name.startsWith("nano-") ? name : `nano-${name}`;
        const ok = TmuxManager.killSession(sessionName);
        if (ok) {
          console.log(chalk.green(`\n  ✅ Killed bot "${sessionName}"\n`));
        } else {
          console.log(chalk.red(`\n  ❌ Failed to kill bot "${sessionName}"\n`));
        }
      }),
  );

// ── nano nodes ────────────────────────────────────────────────

program
  .command("nodes")
  .description("List Tailscale nodes in the nano network")
  .action(() => {
    if (!TailscaleDiscovery.isAvailable()) {
      console.log(chalk.yellow("\n  ⚠️  Tailscale is not installed or not connected.\n"));
      return;
    }

    const nodes = TailscaleDiscovery.discoverNodes();
    console.log(chalk.cyan("\n  ── Nano Network Nodes ───────────────────────\n"));

    for (const node of nodes) {
      const status = node.online ? chalk.green("● online") : chalk.red("○ offline");
      console.log(`  ${status}  ${chalk.white(node.hostname)}  ${chalk.gray(node.ip)}  ${chalk.gray(node.os)}`);
    }
    console.log();
  });

// ── nano config ────────────────────────────────────────────────

program
  .command("config")
  .description("Show current configuration (redacted)")
  .action(() => {
    try {
      const config = loadConfig();
      const redacted = redactConfig(config);
      console.log(chalk.cyan("\n  ── Nano Solana Config ────────────────────────\n"));
      console.log(JSON.stringify(redacted, null, 2).split("\n").map((l) => `  ${l}`).join("\n"));
      console.log();
    } catch (err) {
      console.error(chalk.red(`  ❌ ${(err as Error).message}\n`));
    }
  });

// ── nano vault (ClawVault memory) ────────────────────────────

program
  .command("vault")
  .description("Query the ClawVault memory (known → learned → inferred)")
  .argument("[query]", "Search query")
  .action(async (query) => {
    const vault = new ClawVault();
    const stats = vault.getStats();

    console.log(chalk.cyan("\n  ── ClawVault (3-tier epistemological memory) ──\n"));
    console.log(chalk.white("  KNOWN:     ") + chalk.green(`${stats.known}`) + chalk.gray(" (fresh API data, expires in ~60s)"));
    console.log(chalk.white("  LEARNED:   ") + chalk.blue(`${stats.learned}`) + chalk.gray(" (trade-derived patterns)"));
    console.log(chalk.white("  INFERRED:  ") + chalk.magenta(`${stats.inferred}`) + chalk.gray(" (correlations, held loosely)"));
    console.log(chalk.white("  Inbox:     ") + chalk.gray(`${stats.inbox} (pending reflection)`));
    console.log(chalk.white("  Trades:    ") + chalk.gray(`${stats.trades}`));
    console.log(chalk.white("  Lessons:   ") + chalk.gray(`${stats.lessons}`));
    console.log(chalk.white("  Win Rate:  ") + chalk.green(`${(stats.tradeWinRate * 100).toFixed(1)}%`));
    console.log(chalk.white("  Research:  ") + chalk.gray(`${stats.researchGaps} open gaps`));

    if (query) {
      const results = vault.search(query, 5);
      console.log(chalk.cyan(`\n  ── Search: "${query}" ────────────────────────\n`));

      if (results.length === 0) {
        console.log(chalk.gray("  No matching entries.\n"));
      } else {
        for (const entry of results) {
          const tierColor = entry.tier === "known" ? chalk.green : entry.tier === "learned" ? chalk.blue : chalk.magenta;
          console.log(`  ${tierColor(`[${entry.tier.toUpperCase()}]`)} ${chalk.gray(entry.content.slice(0, 80))}`);
        }
      }
    }

    const lessons = vault.getLessons();
    if (lessons.length > 0) {
      console.log(chalk.cyan("\n  ── Lessons Learned ──────────────────────────\n"));
      for (const lesson of lessons.slice(-5)) {
        const icon = lesson.confidenceImpact > 0 ? "✅" : "⚠️";
        const tierTag = lesson.tier === "learned" ? chalk.blue("[L]") : chalk.magenta("[I]");
        console.log(`  ${icon} ${tierTag} ${chalk.white(lesson.pattern)} → ${chalk.gray(lesson.adjustment)}`);
      }
    }

    const gaps = vault.getResearchAgenda();
    if (gaps.length > 0) {
      console.log(chalk.cyan("\n  ── Research Agenda ──────────────────────────\n"));
      for (const gap of gaps.slice(-3)) {
        console.log(`  🔬 ${chalk.gray(gap.question)}`);
      }
    }

    console.log();
  });

// ── nano docs ───────────────────────────────────────────────

program
  .command("docs")
  .description("Inspect integrated docs + extension knowledge corpus")
  .argument("[query]", "Optional query to search docs/extensions")
  .option("-l, --limit <n>", "Maximum search results", "10")
  .option("--refresh", "Refresh the snapshot cache before reading")
  .option("--json", "Emit machine-readable JSON")
  .action((query, opts) => {
    try {
      const refresh = Boolean(opts.refresh);
      const limit = parsePositiveInteger(opts.limit as string | undefined, 10);

      const snapshot = getNanoKnowledgeSnapshot({ refresh });
      const summary = getNanoKnowledgeSummary(snapshot);
      const matches = query
        ? searchNanoKnowledge(snapshot, String(query), limit)
        : [];

      if (opts.json) {
        const payload = {
          summary,
          docs: snapshot.docs.areas.map((area) => ({
            area: area.area,
            path: area.path,
            files: area.files,
            markdownFiles: area.markdownFiles,
            bytes: area.bytes,
            indexedEntries: area.entries.length,
            updatedAt: area.updatedAt,
          })),
          extensions: {
            directories: snapshot.extensions.directories,
            files: snapshot.extensions.files,
            manifests: snapshot.extensions.manifests,
            packageMetadata: snapshot.extensions.packageMetadata,
            indexedEntries: snapshot.extensions.entries.length,
          },
          search: query
            ? {
                query,
                limit,
                matches,
              }
            : undefined,
        };

        console.log(JSON.stringify(payload, null, 2));
        return;
      }

      console.log(chalk.cyan("\n  ── NanoSolana Knowledge Integration ──────────\n"));
      console.log(chalk.white("  Generated:  ") + chalk.gray(new Date(summary.generatedAt).toISOString()));
      console.log(chalk.white("  Docs:       ") + chalk.green(`${summary.docs.files} files`) + chalk.gray(` (${summary.docs.markdownFiles} markdown, ${formatBytes(summary.docs.bytes)})`));
      console.log(
        chalk.white("  Extensions: ")
        + chalk.green(`${summary.extensions.directories} directories`)
        + chalk.gray(` (${summary.extensions.files} files, ${summary.extensions.manifests} manifests, ${summary.extensions.packageMetadata} package metadata)`),
      );

      console.log(chalk.cyan("\n  ── Docs Areas ───────────────────────────────\n"));
      for (const area of snapshot.docs.areas) {
        const updated = area.updatedAt
          ? new Date(area.updatedAt).toISOString()
          : "n/a";
        console.log(
          `  ${chalk.white(area.path.padEnd(18))} ${chalk.green(String(area.files).padStart(4))} files  ${chalk.gray(`(${area.markdownFiles} md, ${formatBytes(area.bytes)}, updated ${updated})`)}`,
        );
      }

      if (query) {
        console.log(chalk.cyan(`\n  ── Search: "${query}" ───────────────────────\n`));

        if (matches.length === 0) {
          console.log(chalk.gray("  No matches found."));
        } else {
          for (const match of matches) {
            const typeTag = match.type === "doc"
              ? chalk.blue("[DOC]")
              : chalk.magenta("[EXT]");

            console.log(`  ${typeTag} ${chalk.white(match.title)}`);
            console.log(`       ${chalk.gray(match.path)}${match.subtitle ? chalk.gray(` — ${match.subtitle}`) : ""}`);
          }
        }
      }

      console.log();
    } catch (err) {
      console.error(chalk.red(`  ❌ ${(err as Error).message}\n`));
      process.exit(1);
    }
  });

// ── nano tasks ──────────────────────────────────────────────

program
  .command("tasks")
  .description("Inspect automated agent tasks from the repo task registry")
  .argument("[query]", "Optional query to search the task registry")
  .option("-p, --persona <id>", "Show tasks assigned to a persona")
  .option("-l, --limit <n>", "Maximum search results", "10")
  .option("--json", "Emit machine-readable JSON")
  .action((query, opts) => {
    try {
      const limit = parsePositiveInteger(opts.limit as string | undefined, 10);
      const allTasks = loadAllTasks();
      const summary = getTaskSummary(allTasks);

      if (opts.persona) {
        const persona = getPersona(String(opts.persona));
        if (!persona) {
          throw new Error(`Unknown persona: ${opts.persona}`);
        }

        const assignments = getPersonaTasks(persona);
        if (opts.json) {
          console.log(JSON.stringify({
            summary,
            persona: {
              id: persona.identifier,
              title: persona.meta.title,
              avatar: persona.meta.avatar,
            },
            assignments,
          }, null, 2));
          return;
        }

        console.log();
        console.log(`${persona.meta.avatar} ${persona.meta.title} — Assigned Tasks\n`);
        if (assignments.length === 0) {
          console.log(chalk.gray("  No matching tasks found.\n"));
          return;
        }

        for (const assignment of assignments) {
          const priority = assignment.task.priorityLabel === "HIGH"
            ? chalk.red("HIGH")
            : assignment.task.priorityLabel === "MED"
              ? chalk.yellow("MED")
              : chalk.green("LOW");
          console.log(`  [${assignment.task.id}] ${assignment.task.title} ${chalk.gray(`(${priority})`)}`);
        }
        console.log();
        return;
      }

      const tasks = query ? searchTasks(String(query), limit) : allTasks.slice(0, limit);

      if (opts.json) {
        console.log(JSON.stringify({
          summary,
          query: query ? String(query) : undefined,
          tasks,
        }, null, 2));
        return;
      }

      console.log(chalk.cyan("\n  ── Agent Task Registry ──────────────────────\n"));
      console.log(chalk.white("  Total:      ") + chalk.green(String(summary.total)));
      console.log(
        chalk.white("  Priority:   ")
        + chalk.red(`HIGH ${summary.byPriority.HIGH} `)
        + chalk.yellow(`MED ${summary.byPriority.MED} `)
        + chalk.green(`LOW ${summary.byPriority.LOW}`),
      );

      const topDomains = Object.entries(summary.byDomain).slice(0, 6);
      if (topDomains.length > 0) {
        console.log(
          chalk.white("  Domains:    ")
          + chalk.gray(topDomains.map(([domain, count]) => `${domain}:${count}`).join(", ")),
        );
      }

      console.log();
      if (tasks.length === 0) {
        console.log(chalk.gray("  No matching tasks found."));
      } else {
        for (const task of tasks) {
          const priority = task.priorityLabel === "HIGH"
            ? chalk.red("HIGH")
            : task.priorityLabel === "MED"
              ? chalk.yellow("MED")
              : chalk.green("LOW");
          console.log(`  [${task.id}] ${task.title} ${chalk.gray(`(${priority})`)}`);
          if (task.summary) {
            console.log(`      ${chalk.gray(task.summary)}`);
          }
        }
      }

      if (query) {
        const exact = getTask(String(query));
        if (exact && !tasks.some((task) => task.id === exact.id)) {
          console.log(`\n  Exact match available: ${exact.id} — ${exact.title}`);
        }
      }

      console.log();
    } catch (err) {
      console.error(chalk.red(`  ❌ ${(err as Error).message}\n`));
      process.exit(1);
    }
  });

// ── nanosolana go (one-shot everything) ──────────────────────

program
  .command("go")
  .description("One-shot: init + birth + wallet + run — everything in one command")
  .option("-n, --name <name>", "Agent name", "NanoSolana")
  .option("--pet-name <petName>", "TamaGOchi pet name")
  .option("--skip-init", "Skip API key prompts if already configured")
  .option("--dvd-intro", "Play DVD intro animation before startup")
  .action(async (opts) => {
    const dvdIntroRequested = Boolean(opts.dvdIntro) || isTruthy(process.env.NANO_DVD_INTRO);

    if (dvdIntroRequested) {
      await playDvdIntro();
    }

    // Epic startup sequence
    await matrixRain(1200);
    await printSplashBanner();
    await animateLobster(2000);
    console.log();

    try {
      // Phase 1: Init (ensure home + check config)
      await phaseTransition("init", "Phase 1 — Initialization");
      ensureNanoHome();
      const secrets = loadSecrets();
      const needsInit = !opts.skipInit && (!secrets.HELIUS_RPC_URL || !secrets.AI_API_KEY);

      if (needsInit) {
        printInitHeader();
        printSectionHeader("Required Keys");

        if (!secrets.AI_API_KEY) {
          secrets.AI_API_KEY = await promptSecret("OpenRouter API Key (sk-or-v1-...)");
        }
        if (!secrets.HELIUS_RPC_URL) {
          secrets.HELIUS_RPC_URL = await promptSecret("Helius RPC URL");
        }
        if (!secrets.HELIUS_API_KEY) {
          secrets.HELIUS_API_KEY = await promptSecret("Helius API Key");
        }

        printSectionHeader("Optional Keys (press Enter to skip)");
        if (!secrets.HELIUS_WSS_URL) {
          const wss = await promptSecret("Helius WSS URL");
          if (wss) secrets.HELIUS_WSS_URL = wss;
        }
        if (!secrets.BIRDEYE_API_KEY) {
          const bk = await promptSecret("Birdeye API Key");
          if (bk) secrets.BIRDEYE_API_KEY = bk;
        }
        if (!secrets.JUPITER_API_KEY) {
          const jk = await promptSecret("Jupiter API Key");
          if (jk) secrets.JUPITER_API_KEY = jk;
        }

        saveSecrets(secrets);
        printSuccess("Secrets encrypted → ~/.nanosolana/vault.enc\n");
      } else {
        printSuccess("Configuration found — skipping init\n");
      }

      // Phase 2: Birth agent + wallet
      await phaseTransition("birth", "Phase 2 — Birthing Agent");
      await playStartupAnimation();

      const config = loadConfig();
      const wallet = new NanoWallet(opts.name);
      const walletInfo = await wallet.birth();
      wallet.startHeartbeat(config.agent.heartbeatMs);

      console.log();
      printSuccess("Wallet created");
      await systemBootReadout([
        { label: "Public Key", value: walletInfo.publicKey, color: "#00E5FF" },
        { label: "Balance", value: `${walletInfo.balance} SOL`, color: "#FFD700" },
      ]);

      // Phase 3: TamaGOchi pet
      await phaseTransition("pet", "Phase 3 — Hatching TamaGOchi");
      const petName = opts.petName ?? opts.name;
      const pet = new TamaGOchi(petName);
      pet.recordWalletCreated(walletInfo.balance);
      pet.startLifecycle();
      const petState = pet.getState();
      printSuccess(`TamaGOchi hatched: ${STAGE_EMOJI[petState.stage]} ${petName} ${MOOD_EMOJI[petState.mood]}`);

      // Phase 4: Memory
      await phaseTransition("memory", "Phase 4 — ClawVault Memory");
      const vault = new ClawVault();
      vault.startAutonomous();
      const stats = vault.getStats();
      printSuccess(`ClawVault online: ${stats.known}K / ${stats.learned}L / ${stats.inferred}I`);

      // Phase 5: Trading
      await phaseTransition("trade", "Phase 5 — OODA Trading Engine");
      const trading = new TradingEngine(config, wallet);
      await trading.start();
      printSuccess("OODA trading loop active");

      // Wire events
      trading.on("signal", (signal) => {
        vault.storeKnown({
          content: `Signal: ${signal.type} ${signal.symbol} (${(signal.confidence * 100).toFixed(0)}%)`,
          source: "birdeye",
          tags: [signal.type, signal.symbol],
        });
      });

      // Phase 5.5: Blockchain Scan (if Helius configured)
      if (config.helius?.rpcUrl && config.helius?.apiKey) {
        try {
          await phaseTransition("scan", "Phase 5.5 — Blockchain Scan");
          const helius = new HeliusClient({ rpcUrl: config.helius.rpcUrl, apiKey: config.helius.apiKey, wssUrl: config.helius.wssUrl });
          const snap = await helius.snapshotWallet(walletInfo.publicKey);
          printWalletSnapshot(snap, chalk);
        } catch (err) {
          printWarning(`Blockchain scan skipped: ${(err as Error).message}`);
        }
      }

      // Phase 5.6: Auto-register on-chain (devnet NFT)
      try {
        const skills = ["ooda-trading", "solana-rpc", "jupiter-swaps", "helius-das"];
        const regResult = await registerOnHeartbeat(wallet.getKeypair(), "0.1.0", skills, (msg) => console.log(msg));
        if (regResult) {
          printSuccess(`On-chain identity: ${regResult.mintAddress.slice(0, 8)}...`);
        }
      } catch (err) {
        printWarning(`Auto-registration skipped: ${(err as Error).message}`);
      }

      // Phase 6: Gateway
      await phaseTransition("gateway", "Phase 6 — Gateway");
      const { MemoryEngine } = await import("../memory/engine.js");
      const legacyMemory = new MemoryEngine(config.memory.temporalDecayHours);
      const gateway = new NanoGateway(config, wallet, trading, legacyMemory);
      await gateway.start();
      printSuccess(`Gateway: ws://${config.gateway.host}:${config.gateway.port}`);

      // Success banner
      await printCompleteBanner({
        publicKey: walletInfo.publicKey,
        petName,
        stage: STAGE_EMOJI[petState.stage],
        mood: MOOD_EMOJI[petState.mood],
        balance: walletInfo.balance,
        memory: `${stats.known}K / ${stats.learned}L / ${stats.inferred}I`,
      });

      // Live events
      wallet.on("heartbeat", (info) => {
        const time = new Date().toLocaleTimeString();
        const mood = MOOD_EMOJI[pet.getState().mood];
        process.stdout.write(chalk.gray(`  [${time}] 💓 ${info.balance.toFixed(4)} SOL ${mood}\r`));
      });

      wallet.on("balanceChange", ({ oldBalance, newBalance }) => {
        const delta = newBalance - oldBalance;
        const color = delta > 0 ? chalk.green : chalk.red;
        console.log(color(`\n  💰 ${delta > 0 ? "+" : ""}${delta.toFixed(6)} SOL`));
        if (delta > 0) pet.feed(delta);
      });

      trading.on("signal", (signal) => {
        const icon = signal.type === "buy" ? "🟢" : signal.type === "sell" ? "🔴" : "⚪";
        console.log(`  ${icon} ${signal.type.toUpperCase()} ${signal.symbol} (${(signal.confidence * 100).toFixed(0)}%)`);
      });

      vault.on("lessonLearned", (lesson) => {
        console.log(chalk.magenta(`  📖 ${lesson.pattern} → ${lesson.outcome}`));
      });

      pet.on("evolved", (from, to) => {
        console.log(chalk.yellow(`\n  🦞 EVOLUTION! ${STAGE_EMOJI[from]} → ${STAGE_EMOJI[to]} ${to}`));
      });

      // Graceful shutdown
      const shutdown = async () => {
        console.log(chalk.yellow("\n\n  ⏹  Shutting down..."));
        wallet.stopHeartbeat();
        trading.stop();
        vault.stopAutonomous();
        pet.stopLifecycle();
        console.log(chalk.green("  ✓ Agent stopped cleanly.\n"));
        process.exit(0);
      };

      process.on("SIGINT", shutdown);
      process.on("SIGTERM", shutdown);

      await new Promise(() => {});
    } catch (err) {
      console.error(chalk.red(`\n  ✗ Failed: ${(err as Error).message}\n`));
      process.exit(1);
    }
  });

// ── nanosolana demo (simulation mode) ───────────────────────

program
  .command("demo")
  .description("🎮 Run a full simulation — no API keys needed. See the OODA loop in action.")
  .option("-d, --duration <seconds>", "Duration in seconds", "60")
  .action(async (opts) => {
    await demoIntro();

    const duration = parseInt(opts.duration, 10) || 60;

    // Simulated tokens
    const tokens = [
      { symbol: "SOL", price: 142.50, mint: "So11111111111111111111111111111111111111112" },
      { symbol: "BONK", price: 0.00001823, mint: "DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263" },
      { symbol: "JTO", price: 3.42, mint: "jtojtomepa8beP8AuQc6eXt5FriJwfFMkLR8wCHQfRH" },
      { symbol: "WIF", price: 1.87, mint: "EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm" },
      { symbol: "PYTH", price: 0.38, mint: "HZ1JovNiVvGrGNiiYvEozEVgZ58xaU3RKwX8eACQBCt3" },
      { symbol: "RAY", price: 5.12, mint: "4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R" },
    ];

    // Create pet
    const pet = new TamaGOchi("DemoBot");
    const petState = pet.getState();
    printSuccess(`TamaGOchi: ${STAGE_EMOJI[petState.stage]} DemoBot ${MOOD_EMOJI[petState.mood]}`);

    // Create memory
    const vault = new ClawVault();
    vault.startAutonomous();
    printSuccess("ClawVault: 3-tier memory online");

    // Simulated wallet
    console.log(chalk.green("  ✓ Wallet:") + chalk.cyan(" 7xKpR3...demo3nYd") + chalk.yellow(" (1.500 SOL)"));

    console.log(chalk.green("  ✓ OODA loop:") + chalk.gray(" simulated (5s interval)"));
    console.log();
    console.log(chalk.hex("#14F195").bold("  ══════════════════════════════════════════════════"));
    console.log(chalk.hex("#14F195").bold("  🦞 DemoBot is LIVE (simulation mode)"));
    console.log(chalk.hex("#14F195").bold("  ══════════════════════════════════════════════════"));
    console.log();

    let cycles = 0;
    const maxCycles = Math.ceil(duration / 5);

    const loop = setInterval(() => {
      cycles++;

      // Simulate price movement
      const token = tokens[Math.floor(Math.random() * tokens.length)];
      if (!token) {
        return;
      }
      const change = (Math.random() - 0.45) * 15; // Slight upward bias
      token.price *= (1 + change / 100);

      const time = new Date().toLocaleTimeString();
      const changeStr = change > 0 ? chalk.green(`+${change.toFixed(1)}%`) : chalk.red(`${change.toFixed(1)}%`);
      console.log(chalk.gray(`  [${time}]`) + ` 📊 ${chalk.white(token.symbol)}: $${token.price < 0.01 ? token.price.toFixed(8) : token.price.toFixed(2)} ${changeStr}`);

      // Store in memory
      vault.storeKnown({
        content: `${token.symbol}: $${token.price.toFixed(6)} (${change > 0 ? "+" : ""}${change.toFixed(1)}%)`,
        source: "birdeye",
        tags: [token.symbol, "price"],
      });

      // Simulate signals on strong moves
      if (Math.abs(change) > 5) {
        const type = change > 0 ? "buy" : "sell";
        const confidence = Math.min(0.95, Math.abs(change) / 20 + 0.4);
        const icon = type === "buy" ? "🟢" : "🔴";

        console.log(`  ${icon} ${chalk.bold(type.toUpperCase())} ${token.symbol} — confidence: ${chalk.cyan(`${(confidence * 100).toFixed(0)}%`)}`);
        console.log(chalk.gray(`     ${type === "buy" ? "Momentum breakout" : "Reversal signal"}: ${change > 0 ? "+" : ""}${change.toFixed(1)}% with simulated volume spike`));

        vault.storeKnown({
          content: `Signal: ${type} ${token.symbol} (${(confidence * 100).toFixed(0)}%)`,
          source: "birdeye",
          tags: [type, token.symbol],
        });

        // Feed pet on buy signals
        if (type === "buy") pet.feed(0.01);
      }

      // Periodic memory stats
      if (cycles % 4 === 0) {
        const stats = vault.getStats();
        const mood = MOOD_EMOJI[pet.getState().mood];
        console.log(chalk.magenta(`  🧠 Memory: ${stats.known}K/${stats.learned}L/${stats.inferred}I | ${mood} ${pet.getState().name}`));
      }

      // End demo
      if (cycles >= maxCycles) {
        clearInterval(loop);
        vault.stopAutonomous();

        const finalStats = vault.getStats();
        console.log();
        console.log(chalk.hex("#14F195").bold("  ══════════════════════════════════════════════════"));
        console.log(chalk.hex("#14F195").bold("  ✅ Demo complete!"));
        console.log(chalk.hex("#14F195").bold("  ══════════════════════════════════════════════════"));
        console.log();
        console.log(chalk.white("  Stats:"));
        console.log(chalk.gray(`    OODA cycles:  ${cycles}`));
        console.log(chalk.gray(`    Memory entries: ${finalStats.known + finalStats.learned + finalStats.inferred}`));
        console.log(chalk.gray(`    Pet mood: ${MOOD_EMOJI[pet.getState().mood]} ${pet.getState().mood}`));
        console.log();
        console.log(chalk.white("  Ready to go live?"));
        console.log(chalk.cyan("    npx nanosolana go"));
        console.log();
        console.log(chalk.gray("  Full docs: https://docs.nanosolana.com"));
        console.log(chalk.gray("  GitHub: https://github.com/x402agent/NanoSolana"));
        console.log();
        process.exit(0);
      }
    }, 5000);

    // Initial cycle immediately
    const firstToken = tokens[0];
    if (firstToken) {
      console.log(chalk.gray(`  [${new Date().toLocaleTimeString()}]`) + ` 📊 ${chalk.white(firstToken.symbol)}: $${firstToken.price.toFixed(2)} ${chalk.green("+0.0%")}`);
    }
    console.log(chalk.gray("  Watching 6 tokens across Solana...\n"));

    // Graceful shutdown
    process.on("SIGINT", () => {
      clearInterval(loop);
      vault.stopAutonomous();
      console.log(chalk.yellow("\n\n  ⏹  Demo stopped."));
      console.log(chalk.cyan("  Try the real thing: npx nanosolana go\n"));
      process.exit(0);
    });

    await new Promise(() => {});
  });

// ── nanosolana dvd (screensaver) ────────────────────────────

program
  .command("dvd")
  .description("Floating DVD-style NanoSolana screensaver in the terminal")
  .action(() => {
    const dvd = startDvdScreensaver();

    process.on("SIGINT", () => {
      dvd.stop();
      process.exit(0);
    });
    process.on("SIGTERM", () => {
      dvd.stop();
      process.exit(0);
    });
  });

// ── nanosolana lobster (show mascot) ────────────────────────

program
  .command("lobster")
  .description("Show the animated NanoSolana lobster mascot")
  .option("--static", "Show static version")
  .action(async (opts) => {
    if (opts.static) {
      printLobster();
    } else {
      await animateLobster(5000);
    }
  });

// ── nanosolana scan (blockchain data reader) ────────────────────

program
  .command("scan")
  .description("Scan the Solana blockchain — show wallet, tokens, NFTs, and recent transactions")
  .argument("[address]", "Wallet address to scan (default: agent wallet)")
  .action(async (address?: string) => {
    try {
      const config = loadConfig();
      if (!config.helius?.rpcUrl || !config.helius?.apiKey) {
        console.log(chalk.red("\n  ❌ Helius RPC URL and API key required."));
        console.log(chalk.gray("  Run: nanosolana init\n"));
        process.exit(1);
      }

      const pubkey = address ?? (() => {
        try {
          const wallet = new NanoWallet("NanoSolana");
          // Try loading existing wallet pubkey from file
          const pubPath = join(homedir(), ".nanosolana", "wallet.pub");
          if (existsSync(pubPath)) return readFileSync(pubPath, "utf-8").trim();
          return "";
        } catch { return ""; }
      })();

      if (!pubkey) {
        console.log(chalk.red("\n  ❌ No wallet found. Run: nanosolana birth\n"));
        process.exit(1);
      }

      console.log(chalk.cyan(`\n  🔍 Scanning ${pubkey.slice(0, 8)}...${pubkey.slice(-8)}\n`));

      const helius = new HeliusClient({
        rpcUrl: config.helius.rpcUrl,
        apiKey: config.helius.apiKey,
        wssUrl: config.helius.wssUrl,
      });

      const snap = await helius.snapshotWallet(pubkey);
      printWalletSnapshot(snap, chalk);
    } catch (err) {
      console.error(chalk.red(`  ❌ Scan failed: ${(err as Error).message}\n`));
    }
  });

// ── nanosolana register (on-chain NFT identity) ─────────────────

program
  .command("register")
  .description("Register this agent on-chain with a devnet Metaplex NFT")
  .action(async () => {
    try {
      const config = loadConfig();
      const wallet = new NanoWallet("NanoSolana");
      await wallet.birth();

      const registry = new AgentRegistry();

      // Check if already registered
      if (registry.isRegistered()) {
        const reg = registry.loadRegistration();
        if (reg) {
          console.log(chalk.green("\n  ✅ Already registered on-chain!\n"));
          console.log(chalk.white("  Agent:   ") + chalk.cyan(reg.result.agentPubkey));
          console.log(chalk.white("  Mint:    ") + chalk.cyan(reg.result.mintAddress));
          console.log(chalk.white("  Tx:      ") + chalk.gray(reg.result.txSignature.slice(0, 20) + "..."));
          console.log(chalk.white("  Network: ") + chalk.gray(reg.result.network));
          console.log(chalk.white("  Saved:   ") + chalk.gray(reg.savedAt));
          console.log();
          console.log(chalk.gray(`  Explorer: https://explorer.solana.com/address/${reg.result.mintAddress}?cluster=devnet\n`));
          return;
        }
      }

      console.log(chalk.cyan("\n  ⛓️  Registering agent on-chain (devnet)...\n"));
      const skills = ["ooda-trading", "solana-rpc", "jupiter-swaps", "helius-das", "clawvault-memory"];
      const result = await registry.registerAgent(
        wallet.getKeypair(),
        "0.1.0",
        skills,
        (msg) => console.log(msg),
      );

      console.log(chalk.green("\n  ✅ Agent registered on-chain!\n"));
      console.log(chalk.white("  Mint:         ") + chalk.cyan(result.mintAddress));
      console.log(chalk.white("  Tx:           ") + chalk.gray(result.txSignature.slice(0, 20) + "..."));
      console.log(chalk.white("  Token Acct:   ") + chalk.gray(result.tokenAccount));
      console.log(chalk.white("  Network:      ") + chalk.gray(result.network));
      console.log(chalk.white("  Saved:        ") + chalk.gray("~/.nanosolana/registry/registration.json"));
      console.log();
      console.log(chalk.hex("#FFAA00")(`  Explorer: https://explorer.solana.com/tx/${result.txSignature}?cluster=devnet\n`));
    } catch (err) {
      console.error(chalk.red(`  ❌ Registration failed: ${(err as Error).message}\n`));
    }
  });

// ── nanosolana registry (show registration status) ──────────────

program
  .command("registry")
  .description("Show on-chain agent registration status")
  .action(() => {
    const registry = new AgentRegistry();
    const reg = registry.loadRegistration();

    if (!reg) {
      console.log(chalk.hex("#FFAA00")("\n  ⚠️  No registration found. Run: nanosolana register\n"));
      return;
    }

    console.log(chalk.hex("#14F195")("\n  ⛓️  Agent On-Chain Identity\n"));
    console.log(chalk.white("  Agent:      ") + chalk.cyan(reg.result.agentPubkey));
    console.log(chalk.white("  Mint:       ") + chalk.cyan(reg.result.mintAddress));
    console.log(chalk.white("  Tx:         ") + chalk.gray(reg.result.txSignature.slice(0, 20) + "..."));
    console.log(chalk.white("  Network:    ") + chalk.gray(reg.result.network));
    console.log(chalk.white("  Token Acct: ") + chalk.gray(reg.result.tokenAccount));
    console.log(chalk.white("  Registered: ") + chalk.gray(reg.savedAt));
    console.log(chalk.white("  Name:       ") + chalk.gray(reg.metadata.name));
    console.log(chalk.white("  Skills:     ") + chalk.gray(reg.metadata.skills.join(", ")));
    console.log(chalk.white("  Fingerprint:") + chalk.gray(reg.metadata.fingerprint.slice(0, 16) + "..."));
    console.log();
    console.log(chalk.gray(`  Explorer: https://explorer.solana.com/address/${reg.result.mintAddress}?cluster=devnet\n`));
  });

// ── nanosolana nanobot (interactive UI) ──────────────────────────

program
  .command("nanobot")
  .description("Launch the interactive NanoBot web UI (localhost companion)")
  .option("-p, --port <port>", "Port number", "7777")
  .action(async (opts) => {
    const port = parseInt(opts.port, 10) || 7777;
    console.log(chalk.hex("#14F195")(`\n  🤖 Starting NanoBot on http://127.0.0.1:${port}\n`));

    const server = new NanoBotServer({ port });
    await server.start();

    // Keep alive
    await new Promise(() => {});
  });

// ── nanosolana pay (tokenized agent payments) ─────────────────

const payCmd = program
  .command("pay")
  .description("Tokenized agent payment system — create invoices and verify payments");

payCmd
  .command("invoice")
  .description("Create a payment invoice for a user")
  .requiredOption("--user <pubkey>", "Payer wallet public key (base58)")
  .requiredOption("--amount <amount>", "Amount in smallest currency unit")
  .option("--currency <currency>", "Payment currency (USDC or SOL)", "USDC")
  .option("--duration <seconds>", "Invoice validity in seconds", "3600")
  .action(async (opts) => {
    printCommandHeader("pay invoice", "Create on-chain payment invoice");
    const { PublicKey } = await import("@solana/web3.js");
    const { createPaymentAgent } = await import("../payments/index.js");

    try {
      await paymentAnimation("invoice");
      const agent = createPaymentAgent();
      const now = Math.floor(Date.now() / 1000);
      const result = await agent.createPayment({
        user: new PublicKey(opts.user),
        currency: opts.currency as "USDC" | "SOL",
        amount: parseInt(opts.amount, 10),
        startTime: now,
        endTime: now + parseInt(opts.duration, 10),
      });

      printSuccess("Invoice Created\n");
      await systemBootReadout([
        { label: "Memo", value: String(result.invoice.memo), color: "#00E5FF" },
        { label: "Amount", value: agent.formatAmount(result.invoice.amount, result.invoice.currency), color: "#FFD700" },
        { label: "Currency", value: result.invoice.currency },
        { label: "Valid", value: `${new Date(result.invoice.startTime * 1000).toISOString()} → ${new Date(result.invoice.endTime * 1000).toISOString()}` },
        { label: "Invoice PDA", value: result.invoiceIdPda.toBase58(), color: "#9945FF" },
        { label: "Instructions", value: String(result.instructions.length) },
      ]);
      printInfo("\n  Send these instructions to the payer's wallet for signing.\n");
    } catch (err) {
      printError(err instanceof Error ? err.message : String(err));
      process.exit(1);
    }
  });

payCmd
  .command("verify")
  .description("Verify an invoice payment on-chain")
  .requiredOption("--user <pubkey>", "Payer wallet public key")
  .requiredOption("--memo <memo>", "Invoice memo identifier")
  .requiredOption("--amount <amount>", "Amount in smallest currency unit")
  .requiredOption("--start <timestamp>", "Invoice start time (Unix)")
  .requiredOption("--end <timestamp>", "Invoice end time (Unix)")
  .option("--currency <currency>", "Payment currency (USDC or SOL)", "USDC")
  .option("--retries <n>", "Max verification retries", "3")
  .action(async (opts) => {
    const { PublicKey } = await import("@solana/web3.js");
    const { createPaymentAgent, CURRENCY_MINTS } = await import("../payments/index.js");

    printCommandHeader("pay verify", "Verify on-chain invoice payment");
    try {
      await paymentAnimation("verify");
      const agent = createPaymentAgent();
      const currency = opts.currency as "USDC" | "SOL";
      const invoice = {
        memo: parseInt(opts.memo, 10),
        amount: parseInt(opts.amount, 10),
        currencyMint: CURRENCY_MINTS[currency],
        currency,
        startTime: parseInt(opts.start, 10),
        endTime: parseInt(opts.end, 10),
        agentMint: agent.getConfig().agentTokenMint,
        createdAt: new Date().toISOString(),
      };

      const result = await agent.verifyPayment(
        invoice,
        new PublicKey(opts.user),
        { maxRetries: parseInt(opts.retries, 10) },
      );

      if (result.paid) {
        printSuccess("Payment confirmed!");
      } else {
        printError("Payment not found on-chain.");
      }
      console.log(chalk.gray(`  Attempts: ${result.attempts}`));
      console.log(chalk.gray(`  Verified at: ${result.verifiedAt}\n`));
    } catch (err) {
      printError(err instanceof Error ? err.message : String(err));
      process.exit(1);
    }
  });

payCmd
  .command("status")
  .description("Show payment system configuration")
  .action(async () => {
    printCommandHeader("pay status", "Payment system configuration");
    await paymentAnimation("status");

    const mint = process.env.AGENT_TOKEN_MINT_ADDRESS;
    const rpc = process.env.SOLANA_RPC_URL ?? process.env.HELIUS_RPC_URL ?? "(default)";
    const currency = process.env.CURRENCY_MINT;

    await systemBootReadout([
      { label: "Agent Mint", value: mint ?? "NOT SET — set AGENT_TOKEN_MINT_ADDRESS", color: mint ? "#00E5FF" : "#FF3864" },
      { label: "RPC", value: `${rpc.slice(0, 60)}${rpc.length > 60 ? "..." : ""}` },
      { label: "Currency", value: currency === "So11111111111111111111111111111111111111112" ? "SOL" : "USDC", color: "#FFD700" },
    ]);
    printInfo("\nSet AGENT_TOKEN_MINT_ADDRESS in .env to enable payments.\n");
  });

// ── nanosolana hub ────────────────────────────────────────────────

const hubCmd = program
  .command("hub")
  .description("🌐 NanoHub — public skill discovery plus agent self-registration, listing, and heartbeat");

hubCmd
  .command("skills")
  .description("Browse or search public NanoHub skills from the NanoSolana CLI")
  .argument("[query]", "Optional query to search NanoHub skills")
  .option("-l, --limit <n>", "Max results", "10")
  .option("-s, --sort <sort>", "Sort: newest|downloads|rating|installs|installsAllTime|trending", "newest")
  .option("--highlighted", "Only show highlighted skills")
  .option("--site <url>", "NanoHub site URL", process.env.NANO_HUB_URL ?? "https://hub.nanosolana.com")
  .option("--json", "Emit machine-readable JSON")
  .action(async (query, opts) => {
    try {
      const siteUrl = getNanoHubSiteUrl(opts.site);
      const limit = clampNanoHubLimit(parsePositiveInteger(opts.limit as string | undefined, 10));

      if (query) {
        const result = await searchNanoHubSkills({
          query: String(query),
          siteUrl,
          limit,
          highlightedOnly: Boolean(opts.highlighted),
        });

        if (opts.json) {
          console.log(JSON.stringify({
            siteUrl,
            discoveryUrl: getNanoHubDiscoveryUrl(siteUrl),
            query: String(query),
            results: result.results,
          }, null, 2));
          return;
        }

        console.log(chalk.cyan(`\n  ── NanoHub Search ── "${query}" ───────────────────\n`));
        console.log(chalk.gray(`  Site: ${siteUrl}`));
        console.log(chalk.gray(`  Discovery: ${getNanoHubDiscoveryUrl(siteUrl)}\n`));

        if (result.results.length === 0) {
          console.log(chalk.gray("  No skills matched your query.\n"));
          return;
        }

        for (const entry of result.results) {
          const slug = entry.slug ?? "unknown";
          const title = entry.displayName ?? slug;
          const version = entry.version ? chalk.cyan(`v${entry.version}`) : chalk.gray("v?");
          const age = entry.updatedAt ? chalk.gray(formatHubRelativeTime(entry.updatedAt)) : chalk.gray("updated ?");
          console.log(`  ⚡ ${chalk.white(title)} ${chalk.gray(`(${slug})`)} ${version} · ${age}`);
          if (entry.summary) {
            console.log(`     ${chalk.gray(entry.summary)}`);
          }
          console.log(`     ${chalk.gray(getNanoHubSkillUrl(slug, { siteUrl }))}`);
        }
        console.log();
        return;
      }

      const result = await listNanoHubSkills({
        siteUrl,
        limit,
        sort: String(opts.sort),
        highlightedOnly: Boolean(opts.highlighted),
      });

      if (opts.json) {
        console.log(JSON.stringify({
          siteUrl,
          discoveryUrl: getNanoHubDiscoveryUrl(siteUrl),
          sort: opts.sort,
          highlightedOnly: Boolean(opts.highlighted),
          ...result,
        }, null, 2));
        return;
      }

      console.log(chalk.cyan("\n  ── NanoHub Skills ────────────────────────────\n"));
      console.log(chalk.gray(`  Site: ${siteUrl}`));
      console.log(chalk.gray(`  Discovery: ${getNanoHubDiscoveryUrl(siteUrl)}`));
      console.log(chalk.gray(`  Sort: ${opts.sort}${opts.highlighted ? " · highlighted only" : ""}\n`));

      if (result.items.length === 0) {
        console.log(chalk.gray("  No public skills found.\n"));
        return;
      }

      for (const item of result.items) {
        const title = item.displayName ?? item.slug;
        const version = item.latestVersion?.version ? chalk.cyan(`v${item.latestVersion.version}`) : chalk.gray("v?");
        const age = item.updatedAt ? chalk.gray(formatHubRelativeTime(item.updatedAt)) : chalk.gray("updated ?");
        console.log(`  ⚡ ${chalk.white(title)} ${chalk.gray(`(${item.slug})`)} ${version} · ${age}`);
        if (item.summary) {
          console.log(`     ${chalk.gray(item.summary)}`);
        }
        console.log(`     ${chalk.gray(getNanoHubSkillUrl(item.slug, { siteUrl }))}`);
      }
      console.log();
    } catch (err) {
      printError(err instanceof Error ? err.message : String(err));
      process.exit(1);
    }
  });

hubCmd
  .command("inspect")
  .description("Inspect a NanoHub skill and optionally fetch its SKILL.md")
  .argument("<slug>", "Skill slug")
  .option("--site <url>", "NanoHub site URL", process.env.NANO_HUB_URL ?? "https://hub.nanosolana.com")
  .option("--file <path>", "Fetch a specific file from the latest skill version", "SKILL.md")
  .option("--no-file", "Skip fetching the skill file preview")
  .option("--json", "Emit machine-readable JSON")
  .action(async (slug, opts) => {
    try {
      const siteUrl = getNanoHubSiteUrl(opts.site);
      const detail = await getNanoHubSkill(String(slug), { siteUrl });

      if (!detail.skill) {
        throw new Error(`Skill not found: ${slug}`);
      }

      const ownerHandle = detail.owner?.handle ?? undefined;
      const skillUrl = getNanoHubSkillUrl(detail.skill.slug, {
        siteUrl,
        ownerHandle,
      });

      let filePreview: string | undefined;
      if (opts.file !== false) {
        try {
          const file = await getNanoHubSkillFile(detail.skill.slug, {
            siteUrl,
            path: String(opts.file || "SKILL.md"),
          });
          filePreview = file.content;
        } catch (error) {
          filePreview = `Unable to fetch ${opts.file}: ${error instanceof Error ? error.message : String(error)}`;
        }
      }

      if (opts.json) {
        console.log(JSON.stringify({
          siteUrl,
          discoveryUrl: getNanoHubDiscoveryUrl(siteUrl),
          skillUrl,
          ...detail,
          filePreview,
        }, null, 2));
        return;
      }

      console.log(chalk.cyan(`\n  ── NanoHub Skill ── ${detail.skill.slug} ─────────────────\n`));
      console.log(chalk.white("  Name:        ") + chalk.green(detail.skill.displayName ?? detail.skill.slug));
      console.log(chalk.white("  Slug:        ") + chalk.gray(detail.skill.slug));
      console.log(chalk.white("  URL:         ") + chalk.cyan(skillUrl));
      console.log(chalk.white("  Site:        ") + chalk.gray(siteUrl));
      console.log(chalk.white("  Owner:       ") + chalk.gray(detail.owner?.handle ?? detail.owner?.displayName ?? "unknown"));
      console.log(chalk.white("  Version:     ") + chalk.cyan(detail.latestVersion?.version ?? "unknown"));
      console.log(chalk.white("  Updated:     ") + chalk.gray(formatHubRelativeTime(detail.skill.updatedAt)));
      if (detail.skill.summary) {
        console.log(chalk.white("  Summary:     ") + chalk.gray(detail.skill.summary));
      }

      const stats = detail.skill.stats ?? {};
      const downloads = typeof stats.downloads === "number" ? stats.downloads : 0;
      const stars = typeof stats.stars === "number" ? stats.stars : 0;
      const versions = typeof stats.versions === "number" ? stats.versions : 0;
      console.log(chalk.white("  Stats:       ") + chalk.gray(`downloads ${downloads} · stars ${stars} · versions ${versions}`));

      const tags = detail.skill.tags ? Object.keys(detail.skill.tags) : [];
      if (tags.length > 0) {
        console.log(chalk.white("  Tags:        ") + chalk.gray(tags.join(", ")));
      }

      if (filePreview) {
        const lines = filePreview.split("\n").slice(0, 20).join("\n");
        console.log(chalk.cyan(`\n  ── ${opts.file} preview ─────────────────────\n`));
        console.log(lines);
        if (filePreview.split("\n").length > 20) {
          console.log(chalk.gray("\n  … preview truncated …"));
        }
      }

      console.log();
      console.log(chalk.gray("  Install / publish / sync flows live in the dedicated NanoHub CLI:"));
      console.log(chalk.cyan(`  npx nanohub@latest inspect ${detail.skill.slug}`));
      console.log(chalk.cyan(`  npx nanohub@latest install ${detail.skill.slug}`));
      console.log();
    } catch (err) {
      printError(err instanceof Error ? err.message : String(err));
      process.exit(1);
    }
  });

hubCmd
  .command("register")
  .description("Register this agent in the NanoHub registry (Supabase-backed)")
  .option("-n, --name <name>", "Agent display name")
  .option("--slug <slug>", "URL-safe identifier (auto-generated if omitted)")
  .option("--description <desc>", "Agent description")
  .option("-c, --category <category>", "Category: skill | soul | bot | service | agent", "agent")
  .option("--tags <tags>", "Comma-separated tags")
  .option("--capabilities <caps>", "Comma-separated capabilities")
  .option("--api <url>", "NanoHub API server URL", "https://nanohub-api.up.railway.app")
  .action(async (opts) => {
    printBanner();
    console.log(chalk.white.bold("  🌐 NanoHub — Agent Self-Registration\n"));

    try {
      // Load wallet for public key
      const config = loadConfig();
      const agentName = opts.name ?? config.agent.name ?? "NanoSolana";
      const wallet = new NanoWallet(agentName);
      const walletInfo = await wallet.birth();

      console.log(chalk.cyan(`  Agent:      ${agentName}`));
      console.log(chalk.cyan(`  Public Key: ${walletInfo.publicKey}`));

      // Prompt for description if not provided
      let description = opts.description;
      if (!description) {
        description = await promptSecret("Agent description (what does it do?)");
      }

      const tags = opts.tags ? opts.tags.split(",").map((t: string) => t.trim()) : [];
      const capabilities = opts.capabilities
        ? opts.capabilities.split(",").map((c: string) => c.trim())
        : ["trading", "memory", "pet"];

      console.log(chalk.cyan("\n  ⏳ Registering with NanoHub...\n"));

      // Call registration API
      const apiUrl = opts.api;
      const body = {
        name: agentName,
        slug: opts.slug,
        description,
        category: opts.category,
        publicKey: walletInfo.publicKey,
        owner: walletInfo.publicKey.slice(0, 8),
        version: "1.0.2",
        capabilities,
        tags,
        metadata: {
          birthTimestamp: walletInfo.birthTimestamp,
          balance: walletInfo.balance,
          agentId: wallet.getAgentId(),
        },
      };

      const res = await fetch(`${apiUrl}/api/v1/agents/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json() as Record<string, unknown>;

      if (!res.ok) {
        printError(String(data.error ?? "Registration failed"));
        process.exit(1);
      }

      // Save registration token locally
      const hubTokenPath = join(homedir(), ".nanosolana", "hub-token.json");
      const hubData = {
        slug: (data.agent as Record<string, unknown>)?.slug ?? opts.slug ?? agentName.toLowerCase().replace(/\s+/g, "-"),
        registrationToken: data.registrationToken,
        apiUrl,
        registeredAt: new Date().toISOString(),
      };
      writeFileSync(hubTokenPath, JSON.stringify(hubData, null, 2), { mode: 0o600 });

      printSuccess("Agent registered in NanoHub! 🎉\n");
      console.log(chalk.white("  Slug:     ") + chalk.green(hubData.slug));
      console.log(chalk.white("  Token:    ") + chalk.gray(`Saved to ${hubTokenPath}`));
      console.log(chalk.white("  API:      ") + chalk.cyan(apiUrl));
      console.log(chalk.white("  Message:  ") + chalk.gray(String(data.message ?? "")));
      console.log();
      console.log(chalk.gray("  Your agent is now discoverable in the NanoHub registry."));
      console.log(chalk.gray("  Run ") + chalk.cyan("nanosolana hub list") + chalk.gray(" to see all registered agents.\n"));
    } catch (err) {
      printError(err instanceof Error ? err.message : String(err));
      process.exit(1);
    }
  });

hubCmd
  .command("list")
  .description("List all registered agents in the NanoHub agent registry")
  .option("-c, --category <category>", "Filter by category")
  .option("-l, --limit <n>", "Max results", "20")
  .option("--api <url>", "NanoHub API server URL", "https://nanohub-api.up.railway.app")
  .action(async (opts) => {
    try {
      const url = new URL(`${opts.api}/api/v1/agents`);
      if (opts.category) url.searchParams.set("category", opts.category);
      url.searchParams.set("limit", opts.limit);

      const res = await fetch(url.toString());
      const data = await res.json() as { agents: Array<Record<string, unknown>>; count: number };

      console.log(chalk.cyan(`\n  ── NanoHub Registry ─── ${data.count} agents ────────────\n`));

      if (data.agents.length === 0) {
        console.log(chalk.gray("  No agents registered yet.\n"));
        return;
      }

      for (const agent of data.agents) {
        const categoryIcon = {
          skill: "⚡", soul: "🧬", bot: "🤖", service: "🔌", agent: "🦞",
        }[String(agent.category)] ?? "📦";

        const statusColor = agent.status === "active" ? chalk.green("●") : chalk.red("○");
        console.log(`  ${statusColor} ${categoryIcon} ${chalk.white(String(agent.name))} ${chalk.gray(`(${agent.slug})`)}`);
        console.log(`    ${chalk.gray(String(agent.description ?? "").slice(0, 80))}`);
        console.log(`    ${chalk.cyan(`v${agent.version}`)} · ${chalk.gray(String(agent.public_key ?? "").slice(0, 8))}... · ${chalk.gray(String(agent.category))}\n`);
      }
    } catch (err) {
      printError(err instanceof Error ? err.message : String(err));
    }
  });

hubCmd
  .command("search")
  .description("Search the NanoHub agent registry")
  .argument("<query>", "Search query")
  .option("--api <url>", "NanoHub API server URL", "https://nanohub-api.up.railway.app")
  .action(async (query, opts) => {
    try {
      const res = await fetch(`${opts.api}/api/v1/agents/search?q=${encodeURIComponent(query)}`);
      const data = await res.json() as { agents: Array<Record<string, unknown>>; count: number };

      console.log(chalk.cyan(`\n  ── Search: "${query}" ── ${data.count} results ──────\n`));

      for (const agent of data.agents) {
        console.log(`  🦞 ${chalk.white(String(agent.name))} ${chalk.gray(`(${agent.slug})`)}`);
        console.log(`    ${chalk.gray(String(agent.description ?? "").slice(0, 80))}\n`);
      }

      if (data.agents.length === 0) {
        console.log(chalk.gray("  No agents match your query.\n"));
      }
    } catch (err) {
      printError(err instanceof Error ? err.message : String(err));
    }
  });

hubCmd
  .command("heartbeat")
  .description("Send a heartbeat for this agent to NanoHub")
  .option("--api <url>", "NanoHub API server URL", "https://nanohub-api.up.railway.app")
  .action(async (opts) => {
    try {
      const hubTokenPath = join(homedir(), ".nanosolana", "hub-token.json");
      if (!existsSync(hubTokenPath)) {
        printError("Not registered. Run 'nanosolana hub register' first.");
        process.exit(1);
      }

      const hubData = JSON.parse(readFileSync(hubTokenPath, "utf-8")) as {
        slug: string; registrationToken: string;
      };

      const res = await fetch(`${opts.api}/api/v1/agents/${hubData.slug}/heartbeat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ registrationToken: hubData.registrationToken }),
      });

      if (res.ok) {
        printSuccess(`Heartbeat sent for ${hubData.slug}`);
      } else {
        printError("Heartbeat failed");
      }
    } catch (err) {
      printError(err instanceof Error ? err.message : String(err));
    }
  });

hubCmd
  .command("status")
  .description("Show NanoHub registry statistics")
  .option("--api <url>", "NanoHub API server URL", "https://nanohub-api.up.railway.app")
  .action(async (opts) => {
    try {
      const res = await fetch(`${opts.api}/api/v1/stats`);
      const data = await res.json() as {
        totalAgents: number; activeAgents: number;
        byCategory: Record<string, number>;
      };

      console.log(chalk.cyan("\n  ── NanoHub Registry Stats ────────────────────\n"));
      console.log(chalk.white("  Public Site:   ") + chalk.cyan(getNanoHubSiteUrl()));
      console.log(chalk.white("  Discovery:     ") + chalk.gray(getNanoHubDiscoveryUrl()));
      console.log(chalk.white("  Total Agents:  ") + chalk.green(String(data.totalAgents)));
      console.log(chalk.white("  Active:        ") + chalk.green(String(data.activeAgents)));
      console.log(chalk.white("  Categories:"));
      for (const [cat, count] of Object.entries(data.byCategory)) {
        const icon = { skill: "⚡", soul: "🧬", bot: "🤖", service: "🔌", agent: "🦞" }[cat] ?? "📦";
        console.log(`    ${icon} ${chalk.cyan(cat)}: ${chalk.white(String(count))}`);
      }

      // Check local registration
      const hubTokenPath = join(homedir(), ".nanosolana", "hub-token.json");
      if (existsSync(hubTokenPath)) {
        const hubData = JSON.parse(readFileSync(hubTokenPath, "utf-8")) as {
          slug: string; registeredAt: string; apiUrl: string;
        };
        console.log(chalk.cyan("\n  ── Local Registration ───────────────────────\n"));
        console.log(chalk.white("  Slug:         ") + chalk.green(hubData.slug));
        console.log(chalk.white("  Registered:   ") + chalk.gray(hubData.registeredAt));
        console.log(chalk.white("  API:          ") + chalk.cyan(hubData.apiUrl));
      } else {
        console.log(chalk.yellow("\n  ⚠️  Not registered. Run 'nanosolana hub register' to register."));
      }
      console.log(chalk.gray("\n  Public skills: nanosolana hub skills"));
      console.log();
    } catch (err) {
      printError(err instanceof Error ? err.message : String(err));
    }
  });

hubCmd
  .command("deregister")
  .description("Remove this agent from NanoHub")
  .option("--api <url>", "NanoHub API server URL", "https://nanohub-api.up.railway.app")
  .action(async (opts) => {
    try {
      const hubTokenPath = join(homedir(), ".nanosolana", "hub-token.json");
      if (!existsSync(hubTokenPath)) {
        printError("Not registered.");
        process.exit(1);
      }

      const hubData = JSON.parse(readFileSync(hubTokenPath, "utf-8")) as {
        slug: string; registrationToken: string;
      };

      const res = await fetch(`${opts.api}/api/v1/agents/${hubData.slug}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          registrationToken: hubData.registrationToken,
        }),
      });

      if (res.ok) {
        printSuccess(`Agent "${hubData.slug}" deregistered from NanoHub`);
        // Remove local token
        const { unlinkSync } = await import("node:fs");
        unlinkSync(hubTokenPath);
      } else {
        printError("Deregistration failed");
      }
    } catch (err) {
      printError(err instanceof Error ? err.message : String(err));
    }
  });

// ── Doctor ──────────────────────────────────────────────────────

program
  .command("doctor")
  .description("🩺 Diagnose environment, dependencies, config, and connectivity")
  .action(async () => {
    printBanner();
    await runDoctor();
  });

// ── Soul ────────────────────────────────────────────────────────

const soulCmd = program
  .command("soul")
  .description("🧠 View and manage the agent's SOUL.md — identity, philosophy, and values");

soulCmd
  .command("show")
  .description("Display SOUL.md contents with highlighted sections")
  .option("-p, --path <path>", "Path to SOUL.md")
  .action((opts) => {
    try {
      showSoul(opts.path);
    } catch (err) {
      printError(err instanceof Error ? err.message : String(err));
    }
  });

soulCmd
  .command("validate")
  .description("Check SOUL.md for best practices (size, secrets, required sections)")
  .option("-p, --path <path>", "Path to SOUL.md")
  .action((opts) => {
    try {
      const result = validateSoul(opts.path);
      if (!result.valid) process.exit(1);
    } catch (err) {
      printError(err instanceof Error ? err.message : String(err));
    }
  });

soulCmd
  .command("stats")
  .description("Show SOUL.md statistics (lines, words, tokens, sections)")
  .option("-p, --path <path>", "Path to SOUL.md")
  .action((opts) => {
    try {
      showSoulStats(opts.path);
    } catch (err) {
      printError(err instanceof Error ? err.message : String(err));
    }
  });

// Default `nanosolana soul` (no subcommand) shows the soul
soulCmd.action(() => {
  try {
    showSoul();
  } catch (err) {
    printError(err instanceof Error ? err.message : String(err));
  }
});

// ── Update ──────────────────────────────────────────────────────

program
  .command("update")
  .description("🔄 Update NanoSolana to the latest version")
  .option("--check", "Only check for updates without installing")
  .action(async (opts) => {
    printBanner();
    console.log(chalk.white.bold("  🔄 NanoSolana Update\n"));

    try {
      const currentVersion = "1.0.2";
      console.log(chalk.cyan(`  Current version: v${currentVersion}`));

      // Check npm registry for latest version
      let latestVersion = currentVersion;
      try {
        const res = await fetch("https://registry.npmjs.org/nanosolana/latest", { signal: AbortSignal.timeout(5000) });
        if (res.ok) {
          const data = await res.json() as { version: string };
          latestVersion = data.version;
        }
      } catch {
        console.log(chalk.yellow("  ⚠️  Could not reach npm registry. Checking locally...\n"));
      }

      if (latestVersion === currentVersion) {
        printSuccess("Already on the latest version!");
        return;
      }

      console.log(chalk.green(`  Latest version:  v${latestVersion}`));

      if (opts.check) {
        console.log(chalk.cyan(`\n  Update available! Run: npx nanosolana update\n`));
        return;
      }

      console.log(chalk.cyan("\n  ⏳ Updating...\n"));
      execSync("npm install -g nanosolana@latest", { stdio: "inherit" });
      printSuccess(`Updated to v${latestVersion}!`);
    } catch (err) {
      printError(err instanceof Error ? err.message : String(err));
      console.log(chalk.gray("  Manual update: npm install -g nanosolana@latest\n"));
    }
  });

// ── Schedule ────────────────────────────────────────────────────

const scheduleCmd = program
  .command("schedule")
  .description("⏰ Manage scheduled automations (Hermes-style cron tasks)");

scheduleCmd
  .command("list")
  .description("List all scheduled tasks")
  .action(async () => {
    try {
      const { getAllTasks: fetchAllTasks } = await import("../claw/db.js") as {
        getAllTasks: () => Array<{
          id: number; prompt: string; schedule_type: string;
          schedule_value: string; status: string; next_run: string | null;
        }>;
      };
      const tasks = fetchAllTasks();

      if (tasks.length === 0) {
        console.log(chalk.gray("\n  No scheduled tasks. Create one with: nanosolana schedule add\n"));
        return;
      }

      console.log(chalk.cyan(`\n  ── Scheduled Tasks ── ${tasks.length} total ────────────\n`));
      for (const task of tasks) {
        const statusIcon = task.status === "active" ? chalk.green("●") : chalk.red("○");
        const typeLabel = task.schedule_type === "cron" ? "⏰" : task.schedule_type === "interval" ? "🔁" : "1️⃣";
        console.log(`  ${statusIcon} ${typeLabel} [${task.id}] ${chalk.white(task.prompt.slice(0, 60))}`);
        console.log(`    ${chalk.gray(`${task.schedule_type}: ${task.schedule_value}`)} ${task.next_run ? chalk.dim(`→ ${task.next_run}`) : ""}\n`);
      }
    } catch {
      console.log(chalk.gray("\n  No task database found. Tasks are created when the Claw orchestrator runs.\n"));
    }
  });

scheduleCmd
  .command("add")
  .description("Add a new scheduled task")
  .requiredOption("-p, --prompt <prompt>", "Task prompt (what the agent should do)")
  .option("-t, --type <type>", "Schedule type: cron | interval | once", "cron")
  .option("-v, --value <value>", "Schedule value (cron expression or interval in ms)", "0 9 * * *")
  .action(async (opts) => {
    try {
      const { createTask: insertTask, initDatabase: initDb } = await import("../claw/db.js") as {
        createTask: (task: {
          group_folder: string; chat_jid: string; prompt: string;
          schedule_type: string; schedule_value: string; context_mode: string;
        }) => { id: number };
        initDatabase: (dbPath: string) => void;
      };

      const dbPath = join(homedir(), ".nanosolana", "claw.db");
      initDb(dbPath);

      const task = insertTask({
        group_folder: "main",
        chat_jid: "cli",
        prompt: opts.prompt,
        schedule_type: opts.type,
        schedule_value: opts.value,
        context_mode: "isolated",
      });

      printSuccess(`Task #${task.id} scheduled!`);
      console.log(chalk.gray(`  Type: ${opts.type}`));
      console.log(chalk.gray(`  Value: ${opts.value}`));
      console.log(chalk.gray(`  Prompt: ${opts.prompt}\n`));
    } catch (err) {
      printError(err instanceof Error ? err.message : String(err));
    }
  });

// ── Memory ──────────────────────────────────────────────────────

program
  .command("memory")
  .description("🧠 Search persistent ClawVault memory (FTS5 full-text search)")
  .argument("[query]", "Search query")
  .option("-t, --tier <tier>", "Filter by tier: known | learned | inferred")
  .option("-l, --limit <n>", "Max results", "20")
  .option("--stats", "Show memory database statistics")
  .action(async (query, opts) => {
    try {
      const { PersistentVault } = await import("../memory/persistence.js");
      const vault = new PersistentVault();

      if (opts.stats) {
        const stats = vault.getStats();
        console.log(chalk.cyan("\n  ── ClawVault Persistent Memory ──────────────\n"));
        console.log(chalk.white(`  Entries:  ${stats.entries}`));
        console.log(chalk.white(`  Trades:   ${stats.trades}`));
        console.log(chalk.white(`  Lessons:  ${stats.lessons}`));
        console.log(chalk.white(`  DB Size:  ${stats.dbSizeKB} KB\n`));
        vault.close();
        return;
      }

      if (opts.tier) {
        const entries = vault.getByTier(opts.tier);
        console.log(chalk.cyan(`\n  ── ${opts.tier.toUpperCase()} entries ── ${entries.length} ──────\n`));
        for (const e of entries.slice(0, Number(opts.limit))) {
          console.log(`  ${chalk.dim(e.id)} ${chalk.white(e.content.slice(0, 80))}`);
          console.log(`    ${chalk.gray(`source: ${e.source} · confidence: ${e.confidence}`)}\n`);
        }
        vault.close();
        return;
      }

      if (!query) {
        const stats = vault.getStats();
        console.log(chalk.cyan("\n  ── ClawVault Persistent Memory ──────────────\n"));
        console.log(chalk.gray(`  ${stats.entries} entries, ${stats.trades} trades, ${stats.lessons} lessons (${stats.dbSizeKB} KB)`));
        console.log(chalk.gray("  Search: nanosolana memory <query>"));
        console.log(chalk.gray("  Stats:  nanosolana memory --stats\n"));
        vault.close();
        return;
      }

      const results = vault.searchFTS(query, Number(opts.limit));
      console.log(chalk.cyan(`\n  ── Search: "${query}" ── ${results.length} results ──────\n`));
      for (const e of results) {
        const tierIcon = { known: "📡", learned: "📊", inferred: "🔮" }[e.tier] ?? "📦";
        console.log(`  ${tierIcon} ${chalk.white(e.content.slice(0, 80))}`);
        console.log(`    ${chalk.dim(`${e.tier} · ${e.source} · conf: ${e.confidence}`)}\n`);
      }
      if (results.length === 0) console.log(chalk.gray("  No results found.\n"));
      vault.close();
    } catch (err) {
      printError(err instanceof Error ? err.message : String(err));
    }
  });

// ── Parse & Run ────────────────────────────────────────────────

program.parse();
