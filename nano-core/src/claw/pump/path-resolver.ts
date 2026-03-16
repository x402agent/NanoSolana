import { existsSync } from "node:fs";
import { resolve } from "node:path";

function isNanoRepoRoot(directory: string): boolean {
  return (
    existsSync(resolve(directory, "pump-fun-sdk-main")) ||
    (existsSync(resolve(directory, "nano-core")) && existsSync(resolve(directory, "pump")))
  );
}

function findAncestor(startDirectory: string): string | null {
  let currentDirectory = resolve(startDirectory);

  while (true) {
    if (isNanoRepoRoot(currentDirectory)) {
      return currentDirectory;
    }

    const parentDirectory = resolve(currentDirectory, "..");
    if (parentDirectory === currentDirectory) {
      return null;
    }
    currentDirectory = parentDirectory;
  }
}

function resolveNanoRepoRoot(): string {
  return (
    findAncestor(import.meta.dirname ?? ".") ??
    findAncestor(process.cwd()) ??
    resolve(import.meta.dirname ?? ".", "..")
  );
}

export const NANO_REPO_ROOT = resolveNanoRepoRoot();

export interface PumpServiceRootCandidate {
  label: "integrated-pump" | "repo-root" | "vendored-pump-fun-sdk";
  root: string;
}

const PUMP_SERVICE_ROOTS: PumpServiceRootCandidate[] = [
  {
    label: "integrated-pump",
    root: resolve(NANO_REPO_ROOT, "pump"),
  },
  {
    label: "repo-root",
    root: NANO_REPO_ROOT,
  },
  {
    label: "vendored-pump-fun-sdk",
    root: resolve(NANO_REPO_ROOT, "pump-fun-sdk-main"),
  },
];

export function getPumpServiceDirectoryCandidates(serviceName: string): string[] {
  return PUMP_SERVICE_ROOTS.map((candidate) => resolve(candidate.root, serviceName));
}

export function resolvePumpServiceDirectory(serviceName: string): string {
  const existingDirectory = getPumpServiceDirectoryCandidates(serviceName).find((directory) =>
    existsSync(directory),
  );

  if (existingDirectory) {
    return existingDirectory;
  }

  return resolve(PUMP_SERVICE_ROOTS[PUMP_SERVICE_ROOTS.length - 1]!.root, serviceName);
}

export function getPumpServiceRootCandidates(): PumpServiceRootCandidate[] {
  return [...PUMP_SERVICE_ROOTS];
}
