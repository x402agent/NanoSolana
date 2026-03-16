// ── NanoSolana — Agent Task Loader ────────────────────────────────────────────
//
// Loads agent tasks from the agent-tasks/ directory and provides
// persona-aware task matching. When an agent is spawned with a persona,
// the task loader finds tasks that match the persona's expertise and
// injects them as mission objectives into the agent's prompt and memory.
//
// Task-to-Persona Matching:
//   Each task is tagged with skill domains. These domains map to persona
//   tags. A "whale-watcher" persona auto-receives whale-tracking tasks.
//   A "pump-fun-sdk-expert" persona auto-receives SDK-related tasks.
//
// The matching uses a keyword-based scoring system:
//   1. Extract keywords from the task title, content, and explicit tags
//   2. Match against persona tags, title, and description
//   3. Rank by relevance score — threshold ≥ 2 matches
// ─────────────────────────────────────────────────────────────────────────────

import { readdirSync, readFileSync } from 'node:fs';
import { join, basename, resolve } from 'node:path';
import { resolveNanoRepositoryRoot } from '../extensions/catalog.js';
import type { PersonaDefinition } from './persona-loader.js';

// ── Task Schema ─────────────────────────────────────────────────────────────

export interface AgentTask {
  /** Task ID (from filename, e.g. "01-pumpkit-web-tests") */
  id: string;
  /** Numeric priority (from filename prefix) */
  priority: number;
  /** Task title (from first H1 heading) */
  title: string;
  /** Full markdown content */
  content: string;
  /** Extracted keywords for matching */
  keywords: string[];
  /** Skill domains this task requires */
  domains: string[];
  /** Priority label */
  priorityLabel: 'HIGH' | 'MED' | 'LOW';
  /** Brief summary (first paragraph or objective) */
  summary: string;
}

export interface TaskAssignment {
  task: AgentTask;
  relevanceScore: number;
  matchedKeywords: string[];
}

export interface AgentTaskSummary {
  total: number;
  byPriority: Record<'HIGH' | 'MED' | 'LOW', number>;
  byDomain: Record<string, number>;
}

// ── Domain keyword maps ─────────────────────────────────────────────────────

const DOMAIN_KEYWORDS: Record<string, string[]> = {
  testing: ['test', 'tests', 'coverage', 'vitest', 'jest', 'e2e', 'unit', 'spec', 'testing'],
  frontend: ['react', 'web', 'ui', 'dashboard', 'page', 'component', 'tailwind', 'vite', 'css'],
  defi: ['bonding', 'curve', 'graduation', 'amm', 'pool', 'swap', 'liquidity', 'defi', 'yield'],
  trading: ['trade', 'trading', 'buy', 'sell', 'sniper', 'momentum', 'whale', 'slippage'],
  sdk: ['sdk', 'pumpkit', 'pump-sdk', 'instruction', 'idl', 'anchor', 'program'],
  security: ['security', 'audit', 'docker', 'hardening', 'vulnerability', 'checklist'],
  devops: ['deployment', 'deploy', 'ci', 'cd', 'docker', 'railway', 'vercel', 'pipeline'],
  documentation: ['readme', 'docs', 'documentation', 'changelog', 'guide', 'tutorial'],
  fees: ['fee', 'fees', 'claim', 'claims', 'sharing', 'cto', 'distribution', 'incentive'],
  monitoring: ['whale', 'monitor', 'live', 'stream', 'feed', 'alert', 'track', 'watch'],
  infrastructure: ['lint', 'eslint', 'format', 'prettier', 'build', 'release', 'npm', 'publish'],
  analytics: ['analytics', 'stats', 'metrics', 'leaderboard', 'chart', 'data'],
  solana: ['solana', 'wallet', 'rpc', 'helius', 'jupiter', 'birdeye', 'token', 'mint'],
  bot: ['bot', 'telegram', 'swarm', 'agent', 'spawn', 'orchestrator'],
};

// ── Persona-to-domain affinity ──────────────────────────────────────────────

const PERSONA_DOMAIN_MAP: Record<string, string[]> = {
  // Crypto personas
  'whale-watcher': ['monitoring', 'trading', 'analytics'],
  'crypto-news-analyst': ['documentation', 'analytics', 'monitoring'],
  'alpha-leak-detector': ['monitoring', 'trading', 'analytics'],
  'memecoin-analyst': ['defi', 'trading', 'analytics'],

  // DeFi personas
  'yield-farmer': ['defi', 'analytics', 'trading'],
  'liquidity-pool-analyzer': ['defi', 'analytics', 'sdk'],
  'flash-loan-analyst': ['defi', 'security', 'sdk'],
  'dex-aggregator-specialist': ['defi', 'sdk', 'trading'],
  'defi-insurance-advisor': ['defi', 'security'],
  'defi-onboarding-mentor': ['documentation', 'defi'],

  // Trading personas
  'pump-fun-sdk-expert': ['sdk', 'defi', 'trading', 'fees', 'testing'],
  'staking-rewards-calculator': ['defi', 'analytics', 'fees'],
  'mev-researcher': ['trading', 'security', 'solana'],

  // Security personas
  'smart-contract-auditor': ['security', 'sdk', 'solana'],
  'bridge-security-analyst': ['security', 'infrastructure'],
  'rug-pull-detective': ['security', 'monitoring', 'defi'],

  // Tools personas
  'yield-dashboard-builder': ['frontend', 'analytics', 'defi'],
  'token-unlock-tracker': ['monitoring', 'analytics', 'defi'],
  'vespa-optimizer': ['infrastructure', 'analytics'],
};

// ── Task Loading ────────────────────────────────────────────────────────────

let cachedTasks: AgentTask[] | null = null;

function getTasksDir(): string {
  return join(resolveNanoRepositoryRoot(), 'agent-tasks');
}

/**
 * Extract the title from the first H1 heading in markdown content.
 */
function extractTitle(content: string): string {
  const match = content.match(/^#\s+(.+)$/m);
  return match?.[1]?.trim() ?? 'Untitled Task';
}

/**
 * Extract the objective/summary from the content.
 */
function extractSummary(content: string): string {
  // Look for ## Objective section
  const objMatch = content.match(/##\s*Objective\s*\n+([\s\S]*?)(?=\n##|\n$)/i);
  if (objMatch?.[1]) {
    return objMatch[1].trim().split('\n')[0]?.trim() ?? '';
  }
  // Fallback: first non-heading paragraph
  const lines = content.split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#') && !trimmed.startsWith('-') && !trimmed.startsWith('|')) {
      return trimmed;
    }
  }
  return '';
}

/**
 * Extract priority label from content or filename.
 */
function extractPriority(content: string): 'HIGH' | 'MED' | 'LOW' {
  if (/priority.*high/i.test(content) || /\| HIGH \|/i.test(content)) return 'HIGH';
  if (/priority.*low/i.test(content) || /\| LOW \|/i.test(content)) return 'LOW';
  return 'MED';
}

/**
 * Extract keywords from task content for persona matching.
 */
function extractKeywords(title: string, content: string): string[] {
  const text = `${title} ${content}`.toLowerCase();
  const keywords = new Set<string>();

  for (const [domain, domainWords] of Object.entries(DOMAIN_KEYWORDS)) {
    for (const word of domainWords) {
      if (text.includes(word)) {
        keywords.add(word);
        keywords.add(domain);
      }
    }
  }

  return [...keywords];
}

/**
 * Determine which skill domains a task belongs to.
 */
function extractDomains(keywords: string[]): string[] {
  const domains = new Set<string>();
  for (const [domain, domainWords] of Object.entries(DOMAIN_KEYWORDS)) {
    const overlap = domainWords.filter((w) => keywords.includes(w));
    if (overlap.length >= 1) {
      domains.add(domain);
    }
  }
  return [...domains];
}

/**
 * Load all agent tasks from the agent-tasks/ directory.
 * Results are cached after first load.
 */
export function loadAllTasks(): AgentTask[] {
  if (cachedTasks) return cachedTasks;

  const dir = getTasksDir();
  let files: string[];
  try {
    files = readdirSync(dir).filter((f) => f.endsWith('.md') && f !== 'README.md');
  } catch {
    // Directory doesn't exist — return empty
    cachedTasks = [];
    return [];
  }

  const tasks: AgentTask[] = [];

  for (const file of files) {
    try {
      const content = readFileSync(join(dir, file), 'utf-8');
      const id = basename(file, '.md');
      const numMatch = id.match(/^(\d+)/);
      const priority = numMatch?.[1] ? parseInt(numMatch[1], 10) : 99;
      const title = extractTitle(content);
      const keywords = extractKeywords(title, content);
      const domains = extractDomains(keywords);

      tasks.push({
        id,
        priority,
        title,
        content,
        keywords,
        domains,
        priorityLabel: extractPriority(content),
        summary: extractSummary(content),
      });
    } catch {
      // Skip malformed files
    }
  }

  tasks.sort((a, b) => a.priority - b.priority);
  cachedTasks = tasks;
  return tasks;
}

/**
 * Get a specific task by ID.
 */
export function getTask(id: string): AgentTask | null {
  return loadAllTasks().find((t) => t.id === id) ?? null;
}

/**
 * Search tasks by id, title, summary, keywords, and domains.
 */
export function searchTasks(
  query: string,
  limit = 10,
): AgentTask[] {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) return [];

  const boundedLimit = Math.max(1, Math.min(100, Math.floor(limit)));
  const terms = normalizedQuery.split(/\s+/).filter((term) => term.length > 0);

  return loadAllTasks()
    .map((task) => ({
      task,
      score: scoreTask(task, normalizedQuery, terms),
    }))
    .filter((entry) => entry.score > 0)
    .sort((left, right) => right.score - left.score || left.task.priority - right.task.priority)
    .slice(0, boundedLimit)
    .map((entry) => entry.task);
}

/**
 * Build an aggregated summary of the current task registry.
 */
export function getTaskSummary(tasks: AgentTask[] = loadAllTasks()): AgentTaskSummary {
  const byPriority: Record<'HIGH' | 'MED' | 'LOW', number> = {
    HIGH: 0,
    MED: 0,
    LOW: 0,
  };

  const byDomain: Record<string, number> = {};

  for (const task of tasks) {
    byPriority[task.priorityLabel] += 1;
    for (const domain of task.domains) {
      byDomain[domain] = (byDomain[domain] ?? 0) + 1;
    }
  }

  return {
    total: tasks.length,
    byPriority,
    byDomain: Object.fromEntries(
      Object.entries(byDomain).sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0])),
    ),
  };
}

// ── Persona-Task Matching ───────────────────────────────────────────────────

/**
 * Calculate relevance score between a persona and a task.
 * Higher score = better match.
 */
function calculateRelevance(persona: PersonaDefinition, task: AgentTask): { score: number; matched: string[] } {
  const personaKeywords = new Set<string>();

  // Add persona tags
  for (const tag of persona.meta.tags) {
    personaKeywords.add(tag.toLowerCase());
  }

  // Add persona title words
  for (const word of persona.meta.title.toLowerCase().split(/\s+/)) {
    if (word.length > 2) personaKeywords.add(word);
  }

  // Add persona description keywords
  for (const word of persona.meta.description.toLowerCase().split(/\s+/)) {
    if (word.length > 3) personaKeywords.add(word);
  }

  // Add domain affinities from the persona-domain map
  const affinityDomains = PERSONA_DOMAIN_MAP[persona.identifier] ?? [];
  for (const domain of affinityDomains) {
    personaKeywords.add(domain);
    const domainWords = DOMAIN_KEYWORDS[domain] ?? [];
    for (const w of domainWords) {
      personaKeywords.add(w);
    }
  }

  // Score: count keyword overlaps
  const matched: string[] = [];
  for (const keyword of task.keywords) {
    if (personaKeywords.has(keyword)) {
      matched.push(keyword);
    }
  }

  // Domain overlap bonus
  for (const domain of task.domains) {
    if (affinityDomains.includes(domain)) {
      matched.push(`domain:${domain}`);
    }
  }

  return { score: matched.length, matched };
}

/**
 * Find tasks that match a persona's expertise.
 * Returns tasks sorted by relevance score (highest first).
 *
 * @param persona - The persona to match tasks for
 * @param minScore - Minimum relevance score (default: 2)
 * @param maxTasks - Maximum number of tasks to return (default: 5)
 */
export function getTasksForPersona(
  persona: PersonaDefinition,
  minScore = 2,
  maxTasks = 5,
): TaskAssignment[] {
  const tasks = loadAllTasks();
  const assignments: TaskAssignment[] = [];

  for (const task of tasks) {
    const { score, matched } = calculateRelevance(persona, task);
    if (score >= minScore) {
      assignments.push({
        task,
        relevanceScore: score,
        matchedKeywords: matched,
      });
    }
  }

  // Sort by relevance (desc), then by priority (asc)
  assignments.sort((a, b) => {
    if (b.relevanceScore !== a.relevanceScore) return b.relevanceScore - a.relevanceScore;
    return a.task.priority - b.task.priority;
  });

  return assignments.slice(0, maxTasks);
}

/**
 * Build a task briefing string for an agent's system prompt.
 * This goes into the agent's prompt so it knows what tasks to work on.
 */
export function buildTaskBriefing(assignments: TaskAssignment[]): string {
  if (assignments.length === 0) return '';

  const lines: string[] = [
    '',
    '── MISSION OBJECTIVES ──',
    'These are your assigned development tasks, matched to your expertise:',
    '',
  ];

  for (const a of assignments) {
    const priority = a.task.priorityLabel === 'HIGH' ? '🔴' : a.task.priorityLabel === 'MED' ? '🟡' : '🟢';
    lines.push(`${priority} [${a.task.id}] ${a.task.title}`);
    if (a.task.summary) {
      lines.push(`   ${a.task.summary}`);
    }
    lines.push(`   Relevance: ${a.relevanceScore} — matched: ${a.matchedKeywords.slice(0, 5).join(', ')}`);
    lines.push('');
  }

  lines.push('When asked about your tasks, reference these objectives.');
  lines.push('Report progress and blockers when relevant.');

  return lines.join('\n');
}

/**
 * Format task list for Telegram/CLI display.
 */
export function formatTaskList(tasks?: AgentTask[]): string {
  const allTasks = tasks ?? loadAllTasks();
  if (allTasks.length === 0) return '📋 No agent tasks found.';

  const lines: string[] = ['📋 <b>Agent Tasks</b>\n'];

  for (const task of allTasks) {
    const priority = task.priorityLabel === 'HIGH' ? '🔴' : task.priorityLabel === 'MED' ? '🟡' : '🟢';
    lines.push(`${priority} <code>${task.id}</code> — ${task.title}`);
  }

  lines.push(`\n📊 <b>Total: ${allTasks.length} tasks</b>`);
  return lines.join('\n');
}

/**
 * Format task assignments for a specific persona for Telegram/CLI display.
 */
export function formatPersonaTaskAssignments(
  persona: PersonaDefinition,
  assignments: TaskAssignment[],
): string {
  if (assignments.length === 0) {
    return `${persona.meta.avatar} <b>${persona.meta.title}</b> — No matching tasks found.`;
  }

  const lines: string[] = [
    `${persona.meta.avatar} <b>${persona.meta.title}</b> — Assigned Tasks\n`,
  ];

  for (const a of assignments) {
    const priority = a.task.priorityLabel === 'HIGH' ? '🔴' : a.task.priorityLabel === 'MED' ? '🟡' : '🟢';
    lines.push(`${priority} <code>${a.task.id}</code> (score: ${a.relevanceScore})`);
    lines.push(`   ${a.task.title}`);
  }

  return lines.join('\n');
}

/**
 * Clear the task cache (useful after adding new task files).
 */
export function clearTaskCache(): void {
  cachedTasks = null;
}

function scoreTask(task: AgentTask, normalizedQuery: string, terms: string[]): number {
  const haystack = [
    task.id,
    task.title,
    task.summary,
    ...task.keywords,
    ...task.domains,
  ]
    .join(' ')
    .toLowerCase();

  let score = 0;
  if (task.id.toLowerCase() === normalizedQuery) score += 200;
  if (task.id.toLowerCase().includes(normalizedQuery)) score += 80;
  if (task.title.toLowerCase().includes(normalizedQuery)) score += 60;
  if (task.summary.toLowerCase().includes(normalizedQuery)) score += 30;

  for (const term of terms) {
    if (haystack.includes(term)) score += 10;
  }

  return score;
}
