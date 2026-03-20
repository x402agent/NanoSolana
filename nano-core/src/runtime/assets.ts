import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const RUNTIME_MODULE_DIR = dirname(fileURLToPath(import.meta.url));

export interface RuntimeAssetOptions {
  explicitPath?: string | null;
  env?: NodeJS.ProcessEnv;
  envVarName?: string | null;
  cwd?: string;
  startDir?: string;
}

function uniquePaths(paths: Array<string | null | undefined>): string[] {
  const seen = new Set<string>();
  const results: string[] = [];

  for (const value of paths) {
    if (!value) continue;
    const normalized = resolve(value);
    if (seen.has(normalized)) continue;
    seen.add(normalized);
    results.push(normalized);
  }

  return results;
}

function findPackageRoot(startDir: string): string | null {
  let current = resolve(startDir);

  while (true) {
    if (existsSync(join(current, "package.json"))) {
      return current;
    }

    const parent = dirname(current);
    if (parent === current) {
      return null;
    }

    current = parent;
  }
}

export function resolveNanoRuntimeAsset(filename: string, options: RuntimeAssetOptions = {}): string | null {
  const env = options.env ?? process.env;
  const cwd = options.cwd ?? process.cwd();
  const packageRoot = findPackageRoot(options.startDir ?? RUNTIME_MODULE_DIR);
  const envPath = options.envVarName ? env[options.envVarName] : undefined;

  const candidates = uniquePaths([
    options.explicitPath,
    envPath,
    join(cwd, filename),
    join(cwd, "nano-core", filename),
    packageRoot ? join(packageRoot, filename) : null,
  ]);

  for (const candidate of candidates) {
    if (existsSync(candidate)) {
      return candidate;
    }
  }

  return null;
}

export function readNanoRuntimeAsset(
  filename: string,
  fallback: string,
  options: RuntimeAssetOptions = {},
): string {
  const resolved = resolveNanoRuntimeAsset(filename, options);
  if (!resolved) {
    return fallback;
  }

  return readFileSync(resolved, "utf8");
}
