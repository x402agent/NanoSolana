/**
 * nanosolana doctor — comprehensive diagnostics system
 * Checks environment, dependencies, config, and connectivity.
 */
import { execSync } from "node:child_process";
import { existsSync, readdirSync } from "node:fs";
import { resolve, join } from "node:path";
import { homedir } from "node:os";
import chalk from "chalk";

type Status = "pass" | "warn" | "fail";
interface Check { label: string; status: Status; detail: string; children?: Check[] }

function cmd(command: string): string | null {
  try {
    return execSync(command, { timeout: 10_000, stdio: ["pipe", "pipe", "pipe"] }).toString().trim();
  } catch { return null; }
}

function semverGte(version: string, min: string): boolean {
  const p = (v: string) => v.replace(/^v/, "").split(".").map(Number);
  const [a1, a2 = 0, a3 = 0] = p(version);
  const [b1, b2 = 0, b3 = 0] = p(min);
  return a1 !== b1 ? a1 > b1 : a2 !== b2 ? a2 > b2 : a3 >= b3;
}

function icon(s: Status): string {
  return s === "pass" ? chalk.green("✅") : s === "warn" ? chalk.yellow("⚠️ ") : chalk.red("❌");
}

function countSubdirs(dir: string): number {
  if (!existsSync(dir)) return 0;
  try { return readdirSync(dir, { withFileTypes: true }).filter((d) => d.isDirectory()).length; }
  catch { return 0; }
}

function projectRoot(): string {
  return resolve(import.meta.dirname ?? process.cwd(), "../../..");
}

function existsAnywhere(...paths: string[]): boolean {
  return paths.some(existsSync);
}

function checkNode(): Check {
  const v = process.version;
  const ok = semverGte(v, "22.0.0");
  return { label: "Node.js", status: ok ? "pass" : "fail", detail: ok ? `${v} (required: >= 22)` : `${v} — upgrade to >= 22.0.0` };
}

function checkCmd(label: string, command: string, optional = false): Check {
  const v = cmd(command);
  return { label, status: v ? "pass" : optional ? "warn" : "fail", detail: v ?? `not found${optional ? " (optional)" : ""}` };
}

function checkWallet(): Check {
  const dir = join(homedir(), ".nanosolana");
  if (!existsSync(dir)) return { label: "Wallet", status: "fail", detail: "~/.nanosolana/ does not exist" };
  try {
    const wf = readdirSync(dir).filter((f) => f.endsWith(".json") || f.endsWith(".key"));
    if (wf.length > 0) return { label: "Wallet", status: "pass", detail: `~/.nanosolana/ exists (${wf.length} wallet file(s))` };
    return { label: "Wallet", status: "warn", detail: "~/.nanosolana/ exists but no wallet files found" };
  } catch { return { label: "Wallet", status: "warn", detail: "~/.nanosolana/ exists but unreadable" }; }
}

function checkApiKeys(): Check {
  const keys = ["HELIUS_API_KEY", "OPENROUTER_API_KEY", "BIRDEYE_API_KEY"] as const;
  const children: Check[] = keys.map((key) => {
    const set = !!process.env[key];
    return { label: key, status: (set ? "pass" : "fail") as Status, detail: set ? "set" : "missing" };
  });
  const missing = children.filter((c) => c.status === "fail").length;
  return {
    label: "API Keys",
    status: missing === 0 ? "pass" : missing === keys.length ? "fail" : "warn",
    detail: missing === 0 ? "all configured" : `${missing} missing`,
    children,
  };
}

function checkSupabase(): Check {
  const url = process.env["SUPABASE_URL"];
  return { label: "Supabase", status: url ? "pass" : "warn", detail: url ? "SUPABASE_URL configured" : "SUPABASE_URL not set (optional)" };
}

async function checkNetwork(): Promise<Check> {
  try {
    const ac = new AbortController();
    const t = setTimeout(() => ac.abort(), 5000);
    const res = await fetch("https://api.mainnet-beta.solana.com", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "getHealth" }),
      signal: ac.signal,
    });
    clearTimeout(t);
    return { label: "Network", status: res.ok ? "pass" : "warn", detail: res.ok ? "api.mainnet-beta.solana.com reachable" : `status ${res.status}` };
  } catch {
    return { label: "Network", status: "fail", detail: "api.mainnet-beta.solana.com unreachable (timeout 5s)" };
  }
}

function checkSoulMd(): Check {
  const root = projectRoot();
  const found = existsAnywhere(join(root, "nano-core", "SOUL.md"), resolve(process.cwd(), "nano-core", "SOUL.md"));
  return { label: "SOUL.md", status: found ? "pass" : "warn", detail: found ? "nano-core/SOUL.md exists" : "nano-core/SOUL.md not found" };
}

function checkDirCount(label: string, dirName: string): Check {
  const root = projectRoot();
  const count = Math.max(countSubdirs(join(root, dirName)), countSubdirs(resolve(process.cwd(), dirName)));
  return { label, status: count > 0 ? "pass" : "warn", detail: count > 0 ? `${count} ${label.toLowerCase()} found in /${dirName}/` : `no ${label.toLowerCase()} found` };
}

function checkNodeModules(): Check {
  const root = projectRoot();
  const found = existsAnywhere(join(root, "nano-core", "node_modules"), resolve(process.cwd(), "nano-core", "node_modules"));
  return { label: "Package", status: found ? "pass" : "fail", detail: found ? "nano-core/node_modules exists" : "nano-core/node_modules missing — run npm install" };
}

export async function runDoctor(): Promise<void> {
  // Load .env early so API key checks see the vars
  try {
    const dotenv = await import("dotenv");
    const root = projectRoot();
    dotenv.config({ path: join(root, ".env") });
    dotenv.config({ path: resolve(process.cwd(), ".env") });
  } catch { /* dotenv unavailable */ }

  console.log();
  console.log(chalk.bold("  ── NanoSolana Doctor ────────────────────────"));
  console.log();

  const checks: Check[] = [
    checkNode(),
    checkCmd("npm", "npm --version"),
    checkCmd("Git", "git --version"),
    checkCmd("Solana CLI", "solana --version", true),
    checkCmd("Docker", "docker --version", true),
    checkWallet(),
    checkApiKeys(),
    checkSupabase(),
    await checkNetwork(),
    checkSoulMd(),
    checkDirCount("Skills", "skills"),
    checkDirCount("Extensions", "extensions"),
    checkNodeModules(),
  ];

  for (const c of checks) {
    console.log(`  ${icon(c.status)} ${chalk.bold(c.label)}: ${c.detail}`);
    if (c.children) {
      for (const child of c.children) {
        console.log(`     ${icon(child.status)} ${child.label}: ${child.detail}`);
      }
    }
  }

  const all = checks.flatMap((c) => (c.children ? [c, ...c.children] : [c]));
  const passed = all.filter((c) => c.status === "pass").length;
  const warnings = all.filter((c) => c.status === "warn").length;
  const failed = all.filter((c) => c.status === "fail").length;

  console.log();
  console.log(`  Summary: ${chalk.green(`${passed} passed`)}, ${chalk.yellow(`${warnings} warnings`)}, ${chalk.red(`${failed} failed`)}`);
  console.log();
}
