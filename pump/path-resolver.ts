import { existsSync } from "node:fs";
import { resolve } from "node:path";

export const NANO_REPO_ROOT = resolve(import.meta.dirname ?? ".", "../");

const PUMP_SERVICE_ROOTS = [
  resolve(NANO_REPO_ROOT, "pump"),
  NANO_REPO_ROOT,
  resolve(NANO_REPO_ROOT, "pump-fun-sdk-main"),
];

export function resolvePumpServiceDirectory(serviceName: string): string {
  for (const root of PUMP_SERVICE_ROOTS) {
    const directory = resolve(root, serviceName);
    if (existsSync(directory)) {
      return directory;
    }
  }

  return resolve(PUMP_SERVICE_ROOTS[PUMP_SERVICE_ROOTS.length - 1]!, serviceName);
}
