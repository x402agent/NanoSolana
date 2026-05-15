// ── Solana Claude Go × MawdBot — Persona Loader ────────────────────────────────────
//
// Loads and indexes the 42+ DeFi agent personality definitions from the
// personas/ directory. Each JSON file defines a complete agent persona:
//   - systemRole (LLM system prompt defining behavior & expertise)
//   - openingMessage (first message when the agent comes online)
//   - meta (title, avatar emoji, description, tags)
//   - examples (few-shot conversation examples)
//
// Used during agent "birth" to give each swarm agent a distinct personality
// and domain expertise. Users choose a persona via Telegram /spawn or CLI.
//
// Memory Integration:
//   Each persona's systemRole and expertise are stored as LEARNED entries
//   in the ScgVault epistemological memory, so the agent retains its
//   identity across sessions and can reason about its own capabilities.
// ─────────────────────────────────────────────────────────────────────────────

import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, basename } from 'node:path';
import { resolveScgRepositoryRoot } from '../extensions/catalog.js';
import { getTasksForPersona, buildTaskBriefing, type TaskAssignment } from './task-loader.js';

// ── Persona Schema ──────────────────────────────────────────────────────────

export interface PersonaDefinition {
  /** Unique identifier (derived from filename, e.g. "whale-watcher") */
  identifier: string;
  /** Schema version */
  schemaVersion: number;
  /** Who created this persona */
  author: string;
  /** Agent metadata */
  meta: {
    title: string;
    description: string;
    avatar: string;
    tags: string[];
    category?: string;
  };
  /** Agent config */
  config: {
    systemRole: string;
    openingMessage: string;
    openingQuestions: string[];
  };
  /** Few-shot examples */
  examples: Array<{
    role: 'user' | 'assistant';
    content: string;
  }>;
  /** Summary line */
  summary: string;
  /** Token usage estimate */
  tokenUsage: number;
}

export interface PersonaCategory {
  name: string;
  emoji: string;
  personas: PersonaDefinition[];
}

// ── Persona Registry ────────────────────────────────────────────────────────

let cachedPersonas: PersonaDefinition[] | null = null;
let cachedCategories: PersonaCategory[] | null = null;

function getPersonasDir(): string {
  const repoPersonasDir = join(resolveScgRepositoryRoot(), 'nano-core', 'src', 'claw', 'personas');
  if (existsSync(repoPersonasDir)) {
    return repoPersonasDir;
  }

  // Fallback for local source execution and packaged builds that include personas nearby.
  return join(import.meta.dirname ?? __dirname, 'personas');
}

/**
 * Load all persona definitions from the personas/ directory.
 * Results are cached after first load.
 */
export function loadAllPersonas(): PersonaDefinition[] {
  if (cachedPersonas) return cachedPersonas;

  const dir = getPersonasDir();
  const files = readdirSync(dir).filter((f) => f.endsWith('.json'));
  const personas: PersonaDefinition[] = [];

  for (const file of files) {
    try {
      const raw = readFileSync(join(dir, file), 'utf-8');
      const parsed = JSON.parse(raw) as Record<string, unknown>;

      const meta = parsed.meta as Record<string, unknown> | undefined;
      const config = parsed.config as Record<string, unknown> | undefined;

      if (!meta || !config) continue;

      const persona: PersonaDefinition = {
        identifier: (parsed.identifier as string) ?? basename(file, '.json'),
        schemaVersion: (parsed.schemaVersion as number) ?? 1,
        author: (parsed.author as string) ?? 'unknown',
        meta: {
          title: (meta.title as string) ?? basename(file, '.json'),
          description: (meta.description as string) ?? '',
          avatar: (meta.avatar as string) ?? '🤖',
          tags: (meta.tags as string[]) ?? [],
          category: meta.category as string | undefined,
        },
        config: {
          systemRole: (config.systemRole as string) ?? '',
          openingMessage: (config.openingMessage as string) ?? '',
          openingQuestions: (config.openingQuestions as string[]) ?? [],
        },
        examples: (parsed.examples as PersonaDefinition['examples']) ?? [],
        summary: (parsed.summary as string) ?? '',
        tokenUsage: (parsed.tokenUsage as number) ?? 0,
      };

      personas.push(persona);
    } catch {
      // Skip malformed files
    }
  }

  // Sort alphabetically by title
  personas.sort((a, b) => a.meta.title.localeCompare(b.meta.title));
  cachedPersonas = personas;
  return personas;
}

/**
 * Get a specific persona by identifier.
 */
export function getPersona(identifier: string): PersonaDefinition | null {
  const personas = loadAllPersonas();
  return personas.find((p) => p.identifier === identifier) ?? null;
}

/**
 * Search personas by keyword (matches title, description, tags).
 */
export function searchPersonas(query: string): PersonaDefinition[] {
  const personas = loadAllPersonas();
  const q = query.toLowerCase();
  return personas.filter((p) => {
    const titleMatch = p.meta.title.toLowerCase().includes(q);
    const descMatch = p.meta.description.toLowerCase().includes(q);
    const tagMatch = p.meta.tags.some((t) => t.toLowerCase().includes(q));
    const idMatch = p.identifier.toLowerCase().includes(q);
    return titleMatch || descMatch || tagMatch || idMatch;
  });
}

/**
 * Get all personas grouped by category.
 */
export function getPersonasByCategory(): PersonaCategory[] {
  if (cachedCategories) return cachedCategories;

  const personas = loadAllPersonas();

  const categoryMap = new Map<string, PersonaDefinition[]>();
  for (const p of personas) {
    const cat = p.meta.category ?? 'general';
    const existing = categoryMap.get(cat) ?? [];
    existing.push(p);
    categoryMap.set(cat, existing);
  }

  const CATEGORY_EMOJIS: Record<string, string> = {
    defi: '🏦',
    crypto: '🪙',
    trading: '📈',
    security: '🔒',
    education: '📚',
    governance: '📁',
    tools: '🔧',
    programming: '🧑‍💻',
    general: '🤖',
  };

  const categories: PersonaCategory[] = [];
  for (const [name, items] of categoryMap) {
    categories.push({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      emoji: CATEGORY_EMOJIS[name] ?? '📁',
      personas: items,
    });
  }

  categories.sort((a, b) => a.name.localeCompare(b.name));
  cachedCategories = categories;
  return categories;
}

/**
 * Get a formatted persona list for display in Telegram/CLI.
 * Groups by category with emoji headers.
 */
export function formatPersonaList(): string {
  const categories = getPersonasByCategory();
  const lines: string[] = ['🧬 <b>Agent Personas</b> — Choose your identity\n'];

  for (const cat of categories) {
    lines.push(`${cat.emoji} <b>${cat.name}</b> (${cat.personas.length})`);
    for (const p of cat.personas) {
      lines.push(`  ${p.meta.avatar} <code>${p.identifier}</code> — ${p.meta.title}`);
    }
    lines.push('');
  }

  lines.push(`📊 <b>Total: ${loadAllPersonas().length} personas available</b>`);
  lines.push('\nUsage: <code>/spawn &lt;role&gt; --persona &lt;id&gt;</code>');

  return lines.join('\n');
}

/**
 * Build the system prompt for an agent with a selected persona.
 * Combines the persona's systemRole with Solana Claude Go-specific context
 * and auto-assigned development tasks matched to the persona's expertise.
 */
export function buildPersonaSystemPrompt(persona: PersonaDefinition): string {
  // Auto-match tasks to this persona's expertise
  let taskBriefing = '';
  try {
    const assignments = getTasksForPersona(persona, 2, 5);
    taskBriefing = buildTaskBriefing(assignments);
  } catch {
    // Task loader may fail if agent-tasks dir doesn't exist — fine
  }

  return [
    `You are ${persona.meta.title} (${persona.meta.avatar}), a specialized autonomous agent in the Solana Claude Go MawdBot swarm on Solana.`,
    '',
    '── PERSONA ──',
    persona.config.systemRole,
    '',
    '── SOLANA CONTEXT ──',
    'You operate on Solana mainnet with access to:',
    '• Birdeye API for real-time token data, prices, and analytics',
    '• Jupiter for DEX swap execution',
    '• Helius for RPC and transaction parsing',
    '• PumpFun SDK for bonding curves, AMM pools, fee sharing, token creation',
    '• 20+ PumpFun skills (bonding curve, fees, security, wallet, analytics)',
    '',
    '── MEMORY ──',
    'You have 3-tier epistemological memory (ScgVault):',
    '  KNOWN   — Fresh API data (expires ~60s). Ground truth while fresh.',
    '  LEARNED — Patterns from trade outcomes. Built from loss and gain.',
    '  INFERRED — Correlations you\'ve reasoned. Useful but held loosely.',
    'Never conflate these tiers. A stale price is not a known fact.',
    '',
    '── COMMUNICATION ──',
    'Respond naturally and conversationally in Telegram:',
    '• Be concise — no walls of text',
    '• Use emoji sparingly and purposefully',
    '• Drop the formality — talk like a sharp analyst, not a chatbot',
    '• If you don\'t know, say so. Never fabricate data.',
    '• Remember past conversations — reference earlier context when relevant',
    '• Use your persona\'s expertise to add unique value to every response',
    taskBriefing,
  ].join('\n');
}

/**
 * Get tasks auto-assigned to a persona.
 * Convenience wrapper for external callers.
 */
export function getPersonaTasks(persona: PersonaDefinition): TaskAssignment[] {
  try {
    return getTasksForPersona(persona, 2, 5);
  } catch {
    return [];
  }
}

/**
 * Clear the persona cache (useful after hot-reloading persona files).
 */
export function clearPersonaCache(): void {
  cachedPersonas = null;
  cachedCategories = null;
}
