import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

const REPO_ROOT = resolve(import.meta.dirname, "../../../../");
const VENDORED_SDK_ROOT = resolve(REPO_ROOT, "pump-fun-sdk-main/src");
const INTEGRATED_SDK_ROOT = resolve(REPO_ROOT, "nano-core/src/claw/pump/sdk");

const PARITY_FILES = [
  "analytics.ts",
  "bondingCurve.ts",
  "errors.ts",
  "fallback.ts",
  "fees.ts",
  "index.ts",
  "onlineSdk.ts",
  "pda.ts",
  "sdk.ts",
  "state.ts",
  "tokenIncentives.ts",
  "idl/pump.json",
  "idl/pump.ts",
  "idl/pump_amm.json",
  "idl/pump_amm.ts",
  "idl/pump_fees.json",
  "idl/pump_fees.ts",
];

describe("claw/pump/sdk parity", () => {
  for (const relativePath of PARITY_FILES) {
    it(`matches upstream vendored source for ${relativePath}`, () => {
      const vendored = readFileSync(resolve(VENDORED_SDK_ROOT, relativePath), "utf8");
      const integrated = readFileSync(resolve(INTEGRATED_SDK_ROOT, relativePath), "utf8");

      expect(integrated).toBe(vendored);
    });
  }
});
