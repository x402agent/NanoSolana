import { describe, expect, it } from "vitest";

import { scanNanoExtensions } from "./catalog.js";

describe("scanNanoExtensions", () => {
  it("merges manifest, openclaw, and package metadata", () => {
    const snapshot = scanNanoExtensions();

    expect(snapshot.directories).toBeGreaterThanOrEqual(41);
    expect(snapshot.manifests).toBeGreaterThanOrEqual(40);
    expect(snapshot.packageMetadata).toBeGreaterThan(20);

    const discord = snapshot.entries.find((entry) => entry.id === "discord");
    expect(discord).toBeDefined();
    expect(discord?.channels).toContain("discord");
    expect(discord?.metadataSources).toEqual(
      expect.arrayContaining(["nanosolana-plugin", "openclaw-plugin", "package-json"]),
    );

    const pumpfun = snapshot.entries.find((entry) => entry.id === "pumpfun");
    expect(pumpfun).toBeDefined();
    expect(pumpfun?.metadataSources).toContain("openclaw-plugin");
    expect(pumpfun?.description).toContain("Pump.fun");

    const shared = snapshot.entries.find((entry) => entry.id === "shared");
    expect(shared).toBeDefined();
    expect(shared?.kind).toBe("support");
  });
});
