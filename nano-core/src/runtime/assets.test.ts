import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

import { afterEach, describe, expect, it } from "vitest";

import { readClawdRuntimeAsset, resolveClawdRuntimeAsset } from "./assets.js";

const tempRoots: string[] = [];

function makeTempDir(name: string): string {
  const dir = mkdtempSync(join(tmpdir(), `${name}-`));
  tempRoots.push(dir);
  return dir;
}

afterEach(() => {
  while (tempRoots.length > 0) {
    const dir = tempRoots.pop();
    if (dir) {
      rmSync(dir, { recursive: true, force: true });
    }
  }
});

describe("runtime/assets", () => {
  it("prefers an explicit asset path", () => {
    const root = makeTempDir("nanosolana-explicit");
    const explicitPath = join(root, "SOUL.md");
    writeFileSync(explicitPath, "explicit soul\n");

    const resolved = resolveClawdRuntimeAsset("SOUL.md", {
      explicitPath,
      cwd: join(root, "workspace"),
      startDir: join(root, "dist"),
    });

    expect(resolved).toBe(explicitPath);
  });

  it("falls back to the package root asset when cwd has no override", () => {
    const root = makeTempDir("nanosolana-package");
    const packageRoot = join(root, "pkg");
    const startDir = join(packageRoot, "dist", "runtime");
    mkdirSync(startDir, { recursive: true });
    writeFileSync(join(packageRoot, "package.json"), "{}\n");
    writeFileSync(join(packageRoot, "RESEARCH.md"), "package research\n");

    const resolved = resolveClawdRuntimeAsset("RESEARCH.md", {
      cwd: join(root, "workspace"),
      startDir,
    });

    expect(resolved).toBe(join(packageRoot, "RESEARCH.md"));
  });

  it("allows cwd assets to override packaged defaults", () => {
    const root = makeTempDir("nanosolana-cwd");
    const packageRoot = join(root, "pkg");
    const cwd = join(root, "workspace");
    mkdirSync(join(packageRoot, "dist"), { recursive: true });
    mkdirSync(cwd, { recursive: true });
    writeFileSync(join(packageRoot, "package.json"), "{}\n");
    writeFileSync(join(packageRoot, "SOUL.md"), "package soul\n");
    writeFileSync(join(cwd, "SOUL.md"), "workspace soul\n");

    const content = readClawdRuntimeAsset("SOUL.md", "fallback soul\n", {
      cwd,
      startDir: join(packageRoot, "dist"),
    });

    expect(content).toBe("workspace soul\n");
  });
});
