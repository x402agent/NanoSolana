/**
 * nanosolana soul — View and validate SOUL.md
 * Inspired by Hermes agent context files.
 */
import chalk from "chalk";
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const DEFAULT_SOUL_PATH = resolve(dirname(fileURLToPath(import.meta.url)), "../../SOUL.md");
const DIVIDER_WIDTH = 50;
const TOKEN_MULTIPLIER = 1.3;
const MAX_TOKENS = 500;
const REQUIRED_SECTIONS = ["Who I Am", "How I Think"];

const SECRET_PATTERNS = [
  /(?:api[_-]?key|apikey)\s*[:=]\s*\S+/i,
  /(?:private[_-]?key|secret[_-]?key)\s*[:=]\s*\S+/i,
  /(?:password|passwd|pwd)\s*[:=]\s*\S+/i,
  /(?:secret|token)\s*[:=]\s*["'][^"']+["']/i,
  /[1-9A-HJ-NP-Za-km-z]{87,88}/, // base58 solana private key length
];

interface ValidationResult {
  valid: boolean;
  warnings: string[];
  errors: string[];
}

function readSoul(soulPath: string): string {
  return readFileSync(soulPath, "utf-8");
}

function parseSections(content: string): string[] {
  const sections: string[] = [];
  let match: RegExpExecArray | null;
  const re = /^#{1,3}\s+(.+)$/gm;
  while ((match = re.exec(content)) !== null) sections.push(match[1]!.trim());
  return sections;
}

function countWords(text: string): number {
  return text.split(/\s+/).filter(Boolean).length;
}

function estimateTokens(wordCount: number): number {
  return Math.round(wordCount * TOKEN_MULTIPLIER);
}

function divider(label: string): string {
  const pad = DIVIDER_WIDTH - label.length - 4;
  return chalk.dim("  ── ") + chalk.bold.cyan(label) + chalk.dim(" " + "─".repeat(Math.max(pad, 2)));
}

// ── Public API ──────────────────────────────────

export function showSoul(soulPath: string = DEFAULT_SOUL_PATH): void {
  const content = readSoul(soulPath);
  const lines = content.split("\n");
  const words = countWords(content);
  const tokens = estimateTokens(words);
  const sections = parseSections(content);

  console.log("\n" + divider("SOUL.md") + "\n");
  for (const line of lines) {
    if (/^#{1,3}\s/.test(line)) console.log(chalk.bold.magenta("  " + line));
    else if (/^\*\*[^*]+\*\*/.test(line.trim())) console.log(chalk.yellow("  " + line));
    else console.log(chalk.white("  " + line));
  }
  console.log("\n" + divider("Stats"));
  console.log(
    chalk.dim("  Lines: ") + chalk.white(lines.length) +
    chalk.dim(" · Words: ") + chalk.white(words) +
    chalk.dim(" · Est. tokens: ") + chalk.white(`~${tokens}`)
  );
  console.log(chalk.dim("  Sections: ") + chalk.white(sections.join(", ")) + "\n");
}

export function validateSoul(soulPath: string = DEFAULT_SOUL_PATH): ValidationResult {
  const content = readSoul(soulPath);
  const warnings: string[] = [];
  const errors: string[] = [];

  // Token budget check
  const words = countWords(content);
  const tokens = estimateTokens(words);
  if (tokens > MAX_TOKENS) {
    warnings.push(`SOUL.md is ~${tokens} estimated tokens (>${MAX_TOKENS}). Consider trimming for faster context loading.`);
  }

  // Secret patterns
  const lines = content.split("\n");
  for (let i = 0; i < lines.length; i++) {
    for (const pat of SECRET_PATTERNS) {
      if (pat.test(lines[i]!)) {
        warnings.push(`Possible secret on line ${i + 1}: matches ${pat.source.slice(0, 30)}…`);
      }
    }
  }

  // Required sections
  const sections = parseSections(content);
  const lower = sections.map((s) => s.toLowerCase());
  for (const req of REQUIRED_SECTIONS) {
    if (!lower.some((s) => s.includes(req.toLowerCase()))) {
      errors.push(`Missing required section: "${req}"`);
    }
  }

  const valid = errors.length === 0;

  console.log();
  if (valid && warnings.length === 0) {
    console.log(chalk.green("  ✓ SOUL.md is valid — no issues found."));
  } else {
    for (const e of errors) console.log(chalk.red(`  ✗ ${e}`));
    for (const w of warnings) console.log(chalk.yellow(`  ⚠ ${w}`));
    if (valid) console.log(chalk.green("  ✓ SOUL.md structure is valid (with warnings)."));
  }
  console.log();
  return { valid, warnings, errors };
}

export function showSoulStats(soulPath: string = DEFAULT_SOUL_PATH): void {
  const content = readSoul(soulPath);
  const lines = content.split("\n");
  const words = countWords(content);
  const tokens = estimateTokens(words);
  const sections = parseSections(content);

  const label = (l: string, v: string | number) => chalk.dim(`  ${l}: `) + chalk.white(v);

  console.log("\n" + chalk.bold.cyan("  SOUL.md Stats"));
  console.log(chalk.dim("  " + "─".repeat(DIVIDER_WIDTH - 2)));
  console.log(label("Lines", lines.length));
  console.log(label("Words", words));
  console.log(label("Est. tokens", `~${tokens}`));
  console.log(label("Sections", sections.length.toString()));
  for (const s of sections) console.log(chalk.dim("    • ") + chalk.white(s));
  console.log();
}
