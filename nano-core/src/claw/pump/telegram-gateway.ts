// ── Solana Clawd Go × PumpFun — Telegram Gateway ─────────────────────────────────
//
// The Telegram Gateway connects the swarm to Telegram, allowing users
// to spawn, manage, and monitor financial agents via chat commands.
// It also broadcasts real-time events (trades, launches, graduations)
// to configured channels.
//
// Commands:
//   /swarm            — Show swarm dashboard
//   /spawn <role>     — Spawn a new agent
//   /stop <id>        — Stop an agent
//   /agents           — List all agents
//   /health           — Swarm health summary
//   /price <mint>     — Token price lookup
//   /quote <mint> <sol> — Buy quote
//   /curve <mint>     — Bonding curve state
//   /fees <mint>      — Fee tier info
//   /events           — Recent swarm events
//   /help             — Command reference
//
// ─────────────────────────────────────────────────────────────────────────────

import type { SwarmSpawner } from './swarm-spawner.js';
import type {
  TelegramGatewayConfig,
  GatewayCommand,
  AgentRole,
  GatewayEvent,
  SpawnAgentRequest,
  SniperConfig,
  MonitorConfig,
  FeeClaimerConfig,
  AnalystConfig,
} from './types.js';
import * as sdk from './sdk-bridge.js';
import { formatPersonaList, getPersona, searchPersonas } from '../persona-loader.js';

// ── Telegram Gateway ────────────────────────────────────────────────────────

export class TelegramGateway {
  private config: TelegramGatewayConfig;
  private swarm: SwarmSpawner;
  private pollInterval: ReturnType<typeof setInterval> | null = null;
  private lastUpdateId = 0;
  private running = false;

  constructor(config: TelegramGatewayConfig, swarm: SwarmSpawner) {
    this.config = config;
    this.swarm = swarm;
  }

  /** Start the gateway (long-polling mode) */
  async start(): Promise<void> {
    if (this.running) return;
    this.running = true;

    console.log('🌐 Telegram Gateway starting...');

    // Set bot commands
    await this.setBotCommands();

    // Subscribe to swarm events for broadcasting
    this.swarm.on('*', (event) => this.broadcastEvent(event));

    // Start polling
    this.pollInterval = setInterval(() => this.pollUpdates(), 1500);
    console.log('🌐 Telegram Gateway active — listening for commands');
  }

  /** Stop the gateway */
  async stop(): Promise<void> {
    this.running = false;
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }
    console.log('🌐 Telegram Gateway stopped');
  }

  // ── Telegram API Wrappers ─────────────────────────────────────────────

  private async tgApi(method: string, body?: Record<string, unknown>): Promise<unknown> {
    const url = `https://api.telegram.org/bot${this.config.botToken}/${method}`;
    try {
      const resp = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: body ? JSON.stringify(body) : undefined,
        signal: AbortSignal.timeout(10_000),
      });
      const json = (await resp.json()) as { ok: boolean; result?: unknown };
      return json.result;
    } catch {
      return null;
    }
  }

  private async sendMessage(chatId: number, text: string, parseMode = 'HTML'): Promise<void> {
    await this.tgApi('sendMessage', {
      chat_id: chatId,
      text,
      parse_mode: parseMode,
      disable_web_page_preview: true,
    });
  }

  private async setBotCommands(): Promise<void> {
    await this.tgApi('setMyCommands', {
      commands: [
        { command: 'swarm', description: '📊 Swarm dashboard' },
        { command: 'spawn', description: '🐝 Spawn a new agent' },
        { command: 'personas', description: '🧬 Browse agent personas' },
        { command: 'stop', description: '🛑 Stop an agent' },
        { command: 'agents', description: '🤖 List all agents' },
        { command: 'health', description: '💚 Swarm health' },
        { command: 'memory', description: '🧠 Agent memory stats' },
        { command: 'price', description: '💰 Token price lookup' },
        { command: 'quote', description: '📈 Buy/sell quote' },
        { command: 'curve', description: '📉 Bonding curve state' },
        { command: 'fees', description: '💸 Fee tier info' },
        { command: 'events', description: '📡 Recent events' },
        { command: 'invoice', description: '💳 Create payment invoice' },
        { command: 'invoices', description: '📋 List tracked invoices' },
        { command: 'help', description: '❓ Command reference' },
      ],
    });
  }

  // ── Long-Polling ──────────────────────────────────────────────────────

  private async pollUpdates(): Promise<void> {
    if (!this.running) return;

    try {
      const result = (await this.tgApi('getUpdates', {
        offset: this.lastUpdateId + 1,
        timeout: 1,
        allowed_updates: ['message'],
      })) as Array<{ update_id: number; message?: { text?: string; from?: { id: number }; chat?: { id: number } } }> | null;

      if (!result || !Array.isArray(result)) return;

      for (const update of result) {
        this.lastUpdateId = update.update_id;
        const msg = update.message;
        if (!msg?.text || !msg.from || !msg.chat) continue;

        const command = this.parseCommand(msg.text, msg.from.id, msg.chat.id);
        if (command) await this.handleCommand(command);
      }
    } catch {
      // Polling will retry next interval
    }
  }

  // ── Command Parsing ───────────────────────────────────────────────────

  private parseCommand(text: string, userId: number, chatId: number): GatewayCommand | null {
    if (!text.startsWith('/')) return null;

    // Strip @botname suffix if present
    const parts = text.split(/\s+/);
    const cmdPart = parts[0]!.split('@')[0]!.slice(1).toLowerCase();
    const args = parts.slice(1);

    return {
      raw: text,
      command: cmdPart,
      args,
      userId,
      chatId,
      isAdmin: this.config.adminUserIds.includes(userId),
    };
  }

  // ── Access Control ────────────────────────────────────────────────────

  private isAllowed(cmd: GatewayCommand): boolean {
    if (this.config.allowedUserIds.length === 0) return true;
    return this.config.allowedUserIds.includes(cmd.userId);
  }

  // ── Command Handler ───────────────────────────────────────────────────

  private async handleCommand(cmd: GatewayCommand): Promise<void> {
    if (!this.isAllowed(cmd)) {
      await this.sendMessage(cmd.chatId, '🚫 <b>Access denied.</b> You are not authorized.');
      return;
    }

    switch (cmd.command) {
      case 'swarm':
        return this.cmdSwarm(cmd);
      case 'spawn':
        return this.cmdSpawn(cmd);
      case 'personas':
        return this.cmdPersonas(cmd);
      case 'stop':
        return this.cmdStop(cmd);
      case 'agents':
        return this.cmdAgents(cmd);
      case 'health':
        return this.cmdHealth(cmd);
      case 'memory':
        return this.cmdMemory(cmd);
      case 'price':
        return this.cmdPrice(cmd);
      case 'quote':
        return this.cmdQuote(cmd);
      case 'curve':
        return this.cmdCurve(cmd);
      case 'fees':
        return this.cmdFees(cmd);
      case 'events':
        return this.cmdEvents(cmd);
      case 'invoice':
        return this.cmdInvoice(cmd);
      case 'invoices':
        return this.cmdInvoices(cmd);
      case 'help':
      case 'start':
        return this.cmdHelp(cmd);
      default:
        await this.sendMessage(cmd.chatId, `❓ Unknown command: <code>/${cmd.command}</code>\nType /help for available commands.`);
    }
  }

  // ── Command Implementations ───────────────────────────────────────────

  private async cmdSwarm(cmd: GatewayCommand): Promise<void> {
    const health = this.swarm.getSwarmHealth();
    const agents = this.swarm.getAllAgents();

    let msg = '🐝 <b>Solana Clawd Go Swarm Dashboard</b>\n\n';
    msg += `🤖 Agents: <b>${health.activeAgents}</b>/${health.totalAgents}\n`;
    msg += `❌ Errors: <b>${health.errorAgents}</b>\n`;
    msg += `⏱ Uptime: <b>${formatUptime(health.uptimeSeconds)}</b>\n`;
    msg += `📊 Events: <b>${health.eventsProcessed}</b>\n`;
    msg += `💰 Exposure: <b>${sdk.formatSol(health.totalExposureLamports)} SOL</b>\n`;

    if (agents.length > 0) {
      msg += '\n<b>Active Agents:</b>\n';
      for (const agent of agents.slice(0, 10)) {
        const icon = statusIcon(agent.status);
        msg += `${icon} <code>${agent.identity.id}</code> ${agent.identity.name} (${agent.identity.role})\n`;
      }
      if (agents.length > 10) {
        msg += `<i>… and ${agents.length - 10} more</i>\n`;
      }
    } else {
      msg += '\n<i>No agents spawned yet. Use /spawn to create one!</i>';
    }

    await this.sendMessage(cmd.chatId, msg);
  }

  private async cmdSpawn(cmd: GatewayCommand): Promise<void> {
    if (!cmd.isAdmin) {
      await this.sendMessage(cmd.chatId, '🔒 <b>Admin only.</b> You need admin privileges to spawn agents.');
      return;
    }

    const role = cmd.args[0] as AgentRole | undefined;
    if (!role) {
      const roles: AgentRole[] = [
        'sniper', 'monitor', 'fee-claimer', 'analyst', 'momentum',
        'graduation', 'market-maker', 'launcher', 'channel-feed', 'outsider',
      ];
      let msg = '🐝 <b>Spawn an Agent</b>\n\n';
      msg += 'Usage: <code>/spawn &lt;role&gt; [--persona &lt;id&gt;] [args...]</code>\n\n';
      msg += '<b>Available roles:</b>\n';
      for (const r of roles) {
        msg += `• <code>${r}</code> — ${roleDescription(r)}\n`;
      }
      msg += '\n💡 Add a persona: <code>/spawn analyst --persona whale-watcher</code>';
      msg += '\n🧬 Browse personas: <code>/personas</code>';
      await this.sendMessage(cmd.chatId, msg);
      return;
    }

    const validRoles: AgentRole[] = [
      'sniper', 'monitor', 'fee-claimer', 'analyst', 'momentum',
      'graduation', 'market-maker', 'launcher', 'channel-feed', 'outsider',
    ];
    if (!validRoles.includes(role)) {
      await this.sendMessage(cmd.chatId, `❌ Unknown role: <code>${role}</code>. Use /spawn to see available roles.`);
      return;
    }

    // Parse --persona flag from args
    let personaId: string | undefined;
    const remainingArgs: string[] = [];
    for (let i = 1; i < cmd.args.length; i++) {
      if (cmd.args[i] === '--persona' && cmd.args[i + 1]) {
        personaId = cmd.args[i + 1];
        i++; // Skip persona value
      } else {
        const arg = cmd.args[i];
        if (arg) remainingArgs.push(arg);
      }
    }

    // Validate persona if provided
    if (personaId) {
      const persona = getPersona(personaId);
      if (!persona) {
        const matches = searchPersonas(personaId);
        if (matches.length > 0) {
          let msg = `❌ Persona <code>${personaId}</code> not found. Did you mean:\n`;
          for (const m of matches.slice(0, 5)) {
            msg += `  ${m.meta.avatar} <code>${m.identifier}</code> — ${m.meta.title}\n`;
          }
          await this.sendMessage(cmd.chatId, msg);
        } else {
          await this.sendMessage(cmd.chatId, `❌ Persona <code>${personaId}</code> not found. Use /personas to browse.`);
        }
        return;
      }
    }

    try {
      const request = buildSpawnRequest(role, remainingArgs);
      request.personaId = personaId;
      const agent = await this.swarm.spawn(request);

      const personaLine = agent.identity.personaId
        ? `🧬 Persona: ${agent.identity.personaAvatar ?? '🤖'} <b>${agent.identity.personaTitle}</b>\n`
        : '';

      let msg = '✅ <b>Agent Spawned!</b>\n\n';
      msg += `🆔 ID: <code>${agent.identity.id}</code>\n`;
      msg += `📛 Name: <b>${agent.identity.name}</b>\n`;
      msg += `🎭 Role: <code>${agent.identity.role}</code>\n`;
      msg += personaLine;
      msg += `🔑 Wallet: <code>${sdk.shortenAddress(agent.identity.walletAddress)}</code>\n`;
      msg += `🧠 Memory: ScgVault active (3-tier epistemological)\n`;
      msg += `📊 Status: ${statusIcon(agent.status)} ${agent.status}\n`;
      await this.sendMessage(cmd.chatId, msg);
    } catch (err) {
      await this.sendMessage(cmd.chatId, `❌ <b>Spawn failed:</b> ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  private async cmdPersonas(cmd: GatewayCommand): Promise<void> {
    const query = cmd.args[0];

    if (query) {
      const matches = searchPersonas(query);
      if (matches.length === 0) {
        await this.sendMessage(cmd.chatId, `❌ No personas matching <code>${query}</code>`);
        return;
      }

      if (matches.length === 1) {
        const p = matches[0]!;
        let msg = `${p.meta.avatar} <b>${p.meta.title}</b>\n\n`;
        msg += `🏷 ID: <code>${p.identifier}</code>\n`;
        msg += `📝 ${p.meta.description}\n\n`;
        msg += `🏷 Tags: ${p.meta.tags.map((t) => `#${t}`).join(' ')}\n\n`;
        msg += `💬 <i>${p.config.openingMessage.slice(0, 300)}</i>\n\n`;
        msg += `🚀 Spawn: <code>/spawn analyst --persona ${p.identifier}</code>`;
        await this.sendMessage(cmd.chatId, msg);
      } else {
        let msg = `🔍 <b>Persona Search: "${query}"</b> (${matches.length} results)\n\n`;
        for (const p of matches.slice(0, 15)) {
          msg += `${p.meta.avatar} <code>${p.identifier}</code> — ${p.meta.title}\n`;
        }
        if (matches.length > 15) msg += `<i>… and ${matches.length - 15} more</i>\n`;
        msg += `\n/personas <code>&lt;id&gt;</code> for details`;
        await this.sendMessage(cmd.chatId, msg);
      }
    } else {
      const list = formatPersonaList();
      if (list.length > 4000) {
        const mid = list.lastIndexOf('\n', 2000);
        await this.sendMessage(cmd.chatId, list.slice(0, mid));
        await this.sendMessage(cmd.chatId, list.slice(mid));
      } else {
        await this.sendMessage(cmd.chatId, list);
      }
    }
  }

  private async cmdMemory(cmd: GatewayCommand): Promise<void> {
    const agentId = cmd.args[0];
    if (!agentId) {
      await this.sendMessage(cmd.chatId, 'Usage: <code>/memory &lt;agent-id&gt;</code>');
      return;
    }

    const memory = this.swarm.getAgentMemory(agentId);
    const agent = this.swarm.getAgent(agentId);
    if (!memory || !agent) {
      await this.sendMessage(cmd.chatId, `❌ Agent <code>${agentId}</code> not found or has no memory.`);
      return;
    }

    const stats = memory.getStats();
    const lessons = memory.getLessons();
    const agenda = memory.getResearchAgenda();

    let msg = `🧠 <b>Memory: ${agent.identity.name}</b>\n\n`;
    msg += `📦 <b>Vault Stats</b>\n`;
    msg += `   Known (fresh):  ${stats.known}\n`;
    msg += `   Learned (patterns): ${stats.learned}\n`;
    msg += `   Inferred (correlations): ${stats.inferred}\n`;
    msg += `   Inbox (pending): ${stats.inbox}\n`;
    msg += `   Trades: ${stats.trades} · Win Rate: ${(stats.tradeWinRate * 100).toFixed(0)}%\n\n`;

    if (lessons.length > 0) {
      msg += `📖 <b>Top Lessons</b>\n`;
      for (const l of lessons.slice(0, 5)) {
        const icon = l.confidenceImpact >= 0 ? '✅' : '⚠️';
        msg += `   ${icon} ${l.pattern}: ${l.adjustment}\n`;
      }
      msg += '\n';
    }

    if (agenda.length > 0) {
      msg += `🔬 <b>Research Agenda</b>\n`;
      for (const a of agenda.slice(0, 3)) {
        msg += `   ❓ ${a.question.slice(0, 80)}\n`;
      }
    }

    await this.sendMessage(cmd.chatId, msg);
  }


  private async cmdStop(cmd: GatewayCommand): Promise<void> {
    if (!cmd.isAdmin) {
      await this.sendMessage(cmd.chatId, '🔒 <b>Admin only.</b>');
      return;
    }

    const agentId = cmd.args[0];
    if (!agentId) {
      await this.sendMessage(cmd.chatId, 'Usage: <code>/stop &lt;agent-id&gt;</code>');
      return;
    }

    try {
      await this.swarm.stop(agentId);
      await this.sendMessage(cmd.chatId, `🛑 Agent <code>${agentId}</code> stopped.`);
    } catch (err) {
      await this.sendMessage(cmd.chatId, `❌ ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  private async cmdAgents(cmd: GatewayCommand): Promise<void> {
    const agents = this.swarm.getAllAgents();
    if (agents.length === 0) {
      await this.sendMessage(cmd.chatId, '🤖 <b>No agents.</b>\nUse <code>/spawn &lt;role&gt;</code> to create one.');
      return;
    }

    let msg = `🤖 <b>Agents (${agents.length})</b>\n\n`;
    for (const agent of agents) {
      const icon = statusIcon(agent.status);
      const uptime = formatUptime(agent.metrics.uptimeSeconds);
      const personaTag = agent.identity.personaAvatar ? ` ${agent.identity.personaAvatar}` : '';
      msg += `${icon}${personaTag} <b>${agent.identity.name}</b>\n`;
      msg += `   ID: <code>${agent.identity.id}</code>\n`;
      msg += `   Role: ${agent.identity.role}`;
      if (agent.identity.personaTitle) {
        msg += ` · 🧬 ${agent.identity.personaTitle}`;
      }
      msg += ` | ⏱ ${uptime}\n`;
      msg += `   Events: ${agent.metrics.eventsProcessed} | Trades: ${agent.metrics.tradesExecuted}\n`;

      const memory = this.swarm.getAgentMemory(agent.identity.id);
      if (memory) {
        const stats = memory.getStats();
        msg += `   🧠 Memory: ${stats.known}K/${stats.learned}L/${stats.inferred}I · ${stats.lessons} lessons\n`;
      }
      msg += '\n';
    }
    await this.sendMessage(cmd.chatId, msg);
  }

  private async cmdHealth(cmd: GatewayCommand): Promise<void> {
    const health = this.swarm.getSwarmHealth();
    let msg = '💚 <b>Swarm Health</b>\n\n';
    msg += `🤖 Active: ${health.activeAgents}/${health.totalAgents}\n`;
    msg += `❌ Errors: ${health.errorAgents}\n`;
    msg += `📊 Events: ${health.eventsProcessed}\n`;
    msg += `⏱ Uptime: ${formatUptime(health.uptimeSeconds)}\n`;
    msg += `💰 Total Exposure: ${sdk.formatSol(health.totalExposureLamports)} SOL\n`;
    await this.sendMessage(cmd.chatId, msg);
  }

  private async cmdPrice(cmd: GatewayCommand): Promise<void> {
    const mint = cmd.args[0];
    if (!mint) {
      await this.sendMessage(cmd.chatId, 'Usage: <code>/price &lt;token-mint&gt;</code>');
      return;
    }

    const price = await sdk.getTokenPrice(mint);
    if (!price) {
      await this.sendMessage(cmd.chatId, `❌ Token not found: <code>${sdk.shortenAddress(mint)}</code>`);
      return;
    }

    const progress = await sdk.getGraduationProgress(mint);

    let msg = `💰 <b>Token Price</b>\n\n`;
    msg += `🪙 Mint: <code>${sdk.shortenAddress(mint)}</code>\n`;
    msg += `💲 Price: <b>${price.priceSol.toFixed(12)} SOL</b>\n`;
    msg += `📊 MCap: <b>${price.marketCapSol.toFixed(2)} SOL</b> ($${price.marketCapUsd.toFixed(0)})\n`;
    if (progress) {
      msg += `🎓 Progress: <b>${progress.percent}%</b> (${progress.stage})\n`;
    }
    await this.sendMessage(cmd.chatId, msg);
  }

  private async cmdQuote(cmd: GatewayCommand): Promise<void> {
    const mint = cmd.args[0];
    const solStr = cmd.args[1];
    if (!mint || !solStr) {
      await this.sendMessage(cmd.chatId, 'Usage: <code>/quote &lt;mint&gt; &lt;sol-amount&gt;</code>');
      return;
    }

    const lamports = sdk.parseSolToLamports(solStr);
    if (!lamports) {
      await this.sendMessage(cmd.chatId, '❌ Invalid SOL amount');
      return;
    }

    const quote = await sdk.getBuyQuote(mint, lamports);
    if (!quote) {
      await this.sendMessage(cmd.chatId, '❌ Could not get quote (token may be graduated)');
      return;
    }

    let msg = `📈 <b>Buy Quote</b>\n\n`;
    msg += `🪙 Token: <code>${sdk.shortenAddress(mint)}</code>\n`;
    msg += `💰 Input: <b>${sdk.formatSol(lamports)} SOL</b>\n`;
    msg += `📦 Output: <b>${sdk.formatTokenAmount(quote.tokensOut)} tokens</b>\n`;
    msg += `💸 Fee: <b>${sdk.formatSol(quote.feeLamports)} SOL</b>\n`;
    msg += `📊 Impact: <b>${quote.priceImpactBps} bps</b>\n`;
    msg += `📉 Price: ${quote.priceBefore.toFixed(12)} → ${quote.priceAfter.toFixed(12)} SOL\n`;
    await this.sendMessage(cmd.chatId, msg);
  }

  private async cmdCurve(cmd: GatewayCommand): Promise<void> {
    const mint = cmd.args[0];
    if (!mint) {
      await this.sendMessage(cmd.chatId, 'Usage: <code>/curve &lt;mint&gt;</code>');
      return;
    }

    const curve = await sdk.getBondingCurveState(mint);
    if (!curve) {
      await this.sendMessage(cmd.chatId, '❌ Token not found');
      return;
    }

    const progressBar = buildProgressBar(curve.progress);
    let msg = `📉 <b>Bonding Curve</b>\n\n`;
    msg += `🪙 Mint: <code>${sdk.shortenAddress(mint)}</code>\n`;
    msg += `${progressBar} <b>${curve.progress.toFixed(1)}%</b>\n`;
    msg += `💲 Price: <b>${curve.pricePerToken.toFixed(12)} SOL</b>\n`;
    msg += `📊 MCap: <b>${curve.marketCapSol.toFixed(2)} SOL</b>\n`;
    msg += `🎓 Graduated: ${curve.complete ? '✅ Yes' : '❌ No'}\n`;
    msg += `💧 Virtual SOL: ${sdk.formatSol(curve.virtualSolReserves)} SOL\n`;
    await this.sendMessage(cmd.chatId, msg);
  }

  private async cmdFees(cmd: GatewayCommand): Promise<void> {
    const mint = cmd.args[0];
    if (!mint) {
      await this.sendMessage(cmd.chatId, 'Usage: <code>/fees &lt;mint&gt;</code>');
      return;
    }

    const curve = await sdk.getBondingCurveState(mint);
    if (!curve) {
      await this.sendMessage(cmd.chatId, '❌ Token not found');
      return;
    }

    const tier = sdk.getFeeTier(curve.marketCapSol);
    let msg = `💸 <b>Fee Tier</b>\n\n`;
    msg += `🪙 Mint: <code>${sdk.shortenAddress(mint)}</code>\n`;
    msg += `📊 MCap: <b>${curve.marketCapSol.toFixed(2)} SOL</b>\n`;
    msg += `🏷 Tier: <b>${tier.name}</b>\n`;
    msg += `🏛 Protocol: <b>${tier.protocolFeeBps} bps</b>\n`;
    msg += `👤 Creator: <b>${tier.creatorFeeBps} bps</b>\n`;
    msg += `📊 Total: <b>${tier.totalFeeBps} bps</b> (${(tier.totalFeeBps / 100).toFixed(1)}%)\n`;
    await this.sendMessage(cmd.chatId, msg);
  }

  private async cmdEvents(cmd: GatewayCommand): Promise<void> {
    const events = this.swarm.getRecentEvents(10);
    if (events.length === 0) {
      await this.sendMessage(cmd.chatId, '📡 <b>No recent events.</b>');
      return;
    }

    let msg = `📡 <b>Recent Events (${events.length})</b>\n\n`;
    for (const event of events.reverse()) {
      const time = new Date(event.timestamp).toLocaleTimeString();
      msg += `<code>${time}</code> [${event.type}] ${event.source}\n`;
    }
    await this.sendMessage(cmd.chatId, msg);
  }

  private async cmdInvoice(cmd: GatewayCommand): Promise<void> {
    if (!cmd.isAdmin) {
      await this.sendMessage(cmd.chatId, '🔒 <b>Admin only.</b>');
      return;
    }

    // /invoice <user-pubkey> <amount> [currency]
    const userPubkey = cmd.args[0];
    const amountStr = cmd.args[1];
    const currency = (cmd.args[2]?.toUpperCase() ?? 'USDC') as 'USDC' | 'SOL';

    if (!userPubkey || !amountStr) {
      await this.sendMessage(cmd.chatId,
        '💳 <b>Create Payment Invoice</b>\n\n' +
        'Usage: <code>/invoice &lt;user-pubkey&gt; &lt;amount&gt; [USDC|SOL]</code>\n\n' +
        'Amount is in smallest unit (1000000 = 1 USDC, 1000000000 = 1 SOL)');
      return;
    }

    try {
      const { PublicKey } = await import('@solana/web3.js');
      const { createPaymentAgent } = await import('../../payments/index.js');
      const agent = createPaymentAgent();
      const amount = parseInt(amountStr, 10);

      const result = await agent.createPayment({
        user: new PublicKey(userPubkey),
        currency,
        amount,
      });

      let msg = '💳 <b>Invoice Created</b>\n\n';
      msg += `📝 Memo: <code>${result.invoice.memo}</code>\n`;
      msg += `💰 Amount: <b>${agent.formatAmount(amount, currency)}</b>\n`;
      msg += `🪙 Currency: ${currency}\n`;
      msg += `⏰ Valid: ${new Date(result.invoice.startTime * 1000).toISOString().slice(0, 19)} → ${new Date(result.invoice.endTime * 1000).toISOString().slice(0, 19)}\n`;
      msg += `🔑 PDA: <code>${result.invoiceIdPda.toBase58().slice(0, 16)}…</code>\n`;
      msg += `📦 Instructions: ${result.instructions.length}\n`;
      msg += '\n<i>Send instructions to payer wallet for signing.</i>';
      await this.sendMessage(cmd.chatId, msg);
    } catch (err) {
      await this.sendMessage(cmd.chatId, `❌ <b>Invoice failed:</b> ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  private async cmdInvoices(cmd: GatewayCommand): Promise<void> {
    if (!cmd.isAdmin) {
      await this.sendMessage(cmd.chatId, '🔒 <b>Admin only.</b>');
      return;
    }

    try {
      const { createPaymentAgent } = await import('../../payments/index.js');
      const agent = createPaymentAgent();
      const all = agent.getAllInvoices();
      const paid = all.filter((i) => i.paid);
      const unpaid = all.filter((i) => !i.paid);

      let msg = '📋 <b>Invoice Tracker</b>\n\n';
      msg += `Total: <b>${all.length}</b> | Paid: <b>${paid.length}</b> | Pending: <b>${unpaid.length}</b>\n`;

      if (unpaid.length > 0) {
        msg += '\n<b>Pending:</b>\n';
        for (const inv of unpaid.slice(0, 5)) {
          msg += `  📝 <code>${inv.memo}</code> — ${agent.formatAmount(inv.amount, inv.currency)} (${inv.currency})\n`;
        }
      }

      if (paid.length > 0) {
        msg += '\n<b>Recent Paid:</b>\n';
        for (const inv of paid.slice(-5)) {
          msg += `  ✅ <code>${inv.memo}</code> — ${agent.formatAmount(inv.amount, inv.currency)} (${inv.currency})\n`;
        }
      }

      if (all.length === 0) {
        msg += '\n<i>No invoices yet. Use /invoice to create one.</i>';
      }

      await this.sendMessage(cmd.chatId, msg);
    } catch (err) {
      await this.sendMessage(cmd.chatId, `❌ ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  private async cmdHelp(cmd: GatewayCommand): Promise<void> {
    let msg = '🐝 <b>Solana Clawd Go Pump.Fun Swarm</b>\n\n';
    msg += '<b>Swarm Management:</b>\n';
    msg += '  /swarm — Dashboard overview\n';
    msg += '  /spawn &lt;role&gt; — Spawn agent\n';
    msg += '  /stop &lt;id&gt; — Stop agent\n';
    msg += '  /agents — List agents\n';
    msg += '  /health — Health check\n';
    msg += '  /events — Recent events\n\n';
    msg += '<b>Market Data:</b>\n';
    msg += '  /price &lt;mint&gt; — Token price\n';
    msg += '  /quote &lt;mint&gt; &lt;sol&gt; — Buy quote\n';
    msg += '  /curve &lt;mint&gt; — Bonding curve\n';
    msg += '  /fees &lt;mint&gt; — Fee tier\n\n';
    msg += '<b>Payments:</b>\n';
    msg += '  /invoice &lt;pubkey&gt; &lt;amount&gt; [USDC|SOL] — Create invoice\n';
    msg += '  /invoices — List tracked invoices\n\n';
    msg += '<b>Agent Roles:</b>\n';
    msg += '  🎯 sniper — Snipe new launches\n';
    msg += '  📡 monitor — Watch on-chain events\n';
    msg += '  💸 fee-claimer — Claim creator fees\n';
    msg += '  📊 analyst — Price & curve analysis\n';
    msg += '  📈 momentum — Momentum trading\n';
    msg += '  🎓 graduation — Trade near graduation\n';
    msg += '  🏦 market-maker — Provide liquidity\n';
    msg += '  🚀 launcher — Create new tokens\n';
    msg += '  📺 channel-feed — Telegram channel feed\n';
    msg += '  👥 outsider — Call tracking & PNL\n';
    await this.sendMessage(cmd.chatId, msg);
  }

  // ── Event Broadcasting ────────────────────────────────────────────────

  private async broadcastEvent(event: GatewayEvent): Promise<void> {
    // Only broadcast important events to avoid spam
    const broadcastTypes = [
      'agent:spawned',
      'agent:stopped',
      'agent:error',
      'token:launch',
      'token:graduation',
      'trade:whale',
    ];

    if (!broadcastTypes.includes(event.type)) return;

    // Broadcast to admin users
    for (const adminId of this.config.adminUserIds) {
      const icon = eventIcon(event.type);
      const msg = `${icon} <b>${event.type}</b>\n<code>${JSON.stringify(event.data, null, 2).slice(0, 500)}</code>`;
      await this.sendMessage(adminId, msg);
    }
  }
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function statusIcon(status: string): string {
  switch (status) {
    case 'running':
      return '🟢';
    case 'spawning':
      return '🟡';
    case 'paused':
      return '⏸';
    case 'stopping':
      return '🟠';
    case 'stopped':
      return '⚫';
    case 'error':
      return '🔴';
    default:
      return '⚪';
  }
}

function eventIcon(type: string): string {
  if (type.startsWith('agent:')) return '🤖';
  if (type.startsWith('token:')) return '🪙';
  if (type.startsWith('trade:')) return '📊';
  if (type.startsWith('fee:')) return '💸';
  if (type.startsWith('alert:')) return '🚨';
  return '📡';
}

function roleDescription(role: AgentRole): string {
  const map: Record<AgentRole, string> = {
    sniper: 'Snipe new token launches instantly',
    monitor: 'Watch on-chain events and broadcast alerts',
    'fee-claimer': 'Claim accumulated creator fees',
    analyst: 'Analyze prices, curves, and graduation progress',
    momentum: 'Trade based on price momentum signals',
    graduation: 'Target tokens nearing bonding curve graduation',
    'market-maker': 'Provide liquidity via buy/sell oscillation',
    launcher: 'Create and launch new tokens on Pump.Fun',
    'channel-feed': 'Post events to a Telegram channel',
    outsider: 'Track calls with leaderboards & PNL cards',
  };
  return map[role] ?? 'Unknown role';
}

function formatUptime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

function buildProgressBar(percent: number, length = 10): string {
  const filled = Math.round((percent / 100) * length);
  const empty = length - filled;
  return '▓'.repeat(filled) + '░'.repeat(empty);
}

/**
 * Build a spawn request with default config for a given role.
 */
function buildSpawnRequest(role: AgentRole, args: string[]): SpawnAgentRequest {
  switch (role) {
    case 'sniper':
      return {
        role,
        config: {
          role: 'sniper',
          targetMints: args.length > 0 ? args : [],
          maxBuyLamports: 100_000_000n, // 0.1 SOL default
          takeProfitBps: 5000,          // 50%
          stopLossBps: 2000,            // 20%
        } as SniperConfig,
      };

    case 'monitor':
      return {
        role,
        config: {
          role: 'monitor',
          events: ['launch', 'graduation', 'whale', 'cto', 'fee-claim'],
          whaleThresholdSol: 10,
        } as MonitorConfig,
      };

    case 'fee-claimer':
      return {
        role,
        config: {
          role: 'fee-claimer',
          mints: args,
          claimIntervalMs: 60_000,
          minClaimLamports: 10_000_000n, // 0.01 SOL
        } as FeeClaimerConfig,
      };

    case 'analyst':
      return {
        role,
        config: {
          role: 'analyst',
          mints: args,
          analysisIntervalMs: 30_000,
        } as AnalystConfig,
      };

    default:
      return {
        role,
        config: {
          role: 'analyst',
          mints: [],
          analysisIntervalMs: 30_000,
        } as AnalystConfig,
      };
  }
}
