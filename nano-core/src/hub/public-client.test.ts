import { describe, expect, it } from "vitest";

import {
  clampClawdHubLimit,
  getClawdHubApiBaseUrl,
  getClawdHubApiSort,
  getClawdHubDiscoveryUrl,
  getClawdHubSkillManifest,
  getClawdHubSiteUrl,
  getClawdHubSkillUrl,
  normalizeClawdHubSiteUrl,
} from "./public-client.js";

describe("hub/public-client", () => {
  it("normalizes the canonical ClawdHub site URL", () => {
    expect(normalizeClawdHubSiteUrl()).toBe("https://hub.solana-clawd.com");
    expect(normalizeClawdHubSiteUrl("hub.solana-clawd.com/")).toBe("https://hub.solana-clawd.com");
    expect(normalizeClawdHubSiteUrl("http://localhost:3000/")).toBe("http://localhost:3000");
  });

  it("builds site, api, discovery, and skill URLs", () => {
    expect(getClawdHubSiteUrl("https://hub.solana-clawd.com/")).toBe("https://hub.solana-clawd.com");
    expect(getClawdHubApiBaseUrl("https://hub.solana-clawd.com")).toBe("https://hub.solana-clawd.com/api/v1");
    expect(getClawdHubDiscoveryUrl("https://hub.solana-clawd.com")).toBe(
      "https://hub.solana-clawd.com/.well-known/nanohub.json",
    );
    expect(getClawdHubSkillUrl("sonoscli", { siteUrl: "https://hub.solana-clawd.com" })).toBe(
      "https://hub.solana-clawd.com/skills/sonoscli",
    );
    expect(
      getClawdHubSkillUrl("sonoscli", {
        siteUrl: "https://hub.solana-clawd.com",
        ownerHandle: "8bit",
      }),
    ).toBe("https://hub.solana-clawd.com/8bit/sonoscli");
  });

  it("maps sort aliases to the ClawdHub API surface", () => {
    expect(getClawdHubApiSort()).toBe("updated");
    expect(getClawdHubApiSort("newest")).toBe("updated");
    expect(getClawdHubApiSort("downloads")).toBe("downloads");
    expect(getClawdHubApiSort("rating")).toBe("stars");
    expect(getClawdHubApiSort("installs")).toBe("installsCurrent");
    expect(getClawdHubApiSort("installs-all-time")).toBe("installsAllTime");
    expect(getClawdHubApiSort("trending")).toBe("trending");
    expect(() => getClawdHubApiSort("garbage")).toThrow(/Invalid sort/);
  });

  it("clamps hub list limits", () => {
    expect(clampClawdHubLimit(0)).toBe(1);
    expect(clampClawdHubLimit(5)).toBe(5);
    expect(clampClawdHubLimit(999)).toBe(200);
    expect(clampClawdHubLimit(Number.NaN, 25)).toBe(25);
  });

  it("fetches NanoHub skill manifests from the public API", async () => {
    const originalFetch = globalThis.fetch;
    const calls: string[] = [];

    globalThis.fetch = async (input) => {
      calls.push(String(input));
      return new Response(JSON.stringify({
        manifest: {
          schemaVersion: 1,
          kind: "skill",
          slug: "token-tracker",
          displayName: "Token Tracker",
          version: "1.0.0",
        },
      }), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      });
    };

    try {
      const result = await getClawdHubSkillManifest("token-tracker", {
        siteUrl: "https://hub.solana-clawd.com",
      });
      expect(result.manifest.slug).toBe("token-tracker");
      expect(calls).toEqual([
        "https://hub.solana-clawd.com/api/v1/skills/token-tracker/manifest",
      ]);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});
