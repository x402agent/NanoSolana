import { existsSync } from "node:fs";

import { describe, expect, it } from "vitest";

import {
  getPumpServiceDirectoryCandidates,
  getPumpServiceRootCandidates,
  NANO_REPO_ROOT,
  resolvePumpServiceDirectory,
} from "./path-resolver.js";

describe("resolvePumpServiceDirectory", () => {
  it("falls back to the vendored pump-fun-sdk snapshot for current services", () => {
    const directory = resolvePumpServiceDirectory("telegram-bot");

    expect(directory).toContain("/pump-fun-sdk-main/telegram-bot");
    expect(existsSync(directory)).toBe(true);
  });

  it("returns the vendored snapshot path even when a service is missing", () => {
    const directory = resolvePumpServiceDirectory("definitely-not-a-real-pump-service");

    expect(directory).toContain("/pump-fun-sdk-main/definitely-not-a-real-pump-service");
  });

  it("publishes candidate roots in migration order", () => {
    const candidates = getPumpServiceRootCandidates();

    expect(NANO_REPO_ROOT.endsWith("/nanosolana")).toBe(true);
    expect(candidates.map((candidate) => candidate.label)).toEqual([
      "integrated-pump",
      "repo-root",
      "vendored-pump-fun-sdk",
    ]);
    expect(getPumpServiceDirectoryCandidates("swarm-bot")).toEqual(
      expect.arrayContaining([
        expect.stringContaining("/pump/swarm-bot"),
        expect.stringContaining("/nanosolana/swarm-bot"),
        expect.stringContaining("/pump-fun-sdk-main/swarm-bot"),
      ]),
    );
  });
});
