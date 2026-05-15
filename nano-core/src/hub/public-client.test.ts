import { describe, expect, it } from "vitest";

import {
  clampScgHubLimit,
  getScgHubApiBaseUrl,
  getScgHubApiSort,
  getScgHubDiscoveryUrl,
  getScgHubSkillManifest,
  getScgHubSiteUrl,
  getScgHubSkillUrl,
  normalizeScgHubSiteUrl,
} from "./public-client.js";

describe("hub/public-client", () => {
  it("normalizes the canonical ScgHub site URL", () => {
    expect(normalizeScgHubSiteUrl()).toBe("https://hub.solana-clawd-go.com");
    expect(normalizeScgHubSiteUrl("hub.solana-clawd-go.com/")).toBe("https://hub.solana-clawd-go.com");
    expect(normalizeScgHubSiteUrl("http://localhost:3000/")).toBe("http://localhost:3000");
  });

  it("builds site, api, discovery, and skill URLs", () => {
    expect(getScgHubSiteUrl("https://hub.solana-clawd-go.com/")).toBe("https://hub.solana-clawd-go.com");
    expect(getScgHubApiBaseUrl("https://hub.solana-clawd-go.com")).toBe("https://hub.solana-clawd-go.com/api/v1");
    expect(getScgHubDiscoveryUrl("https://hub.solana-clawd-go.com")).toBe(
      "https://hub.solana-clawd-go.com/.well-known/nanohub.json",
    );
    expect(getScgHubSkillUrl("sonoscli", { siteUrl: "https://hub.solana-clawd-go.com" })).toBe(
      "https://hub.solana-clawd-go.com/skills/sonoscli",
    );
    expect(
      getScgHubSkillUrl("sonoscli", {
        siteUrl: "https://hub.solana-clawd-go.com",
        ownerHandle: "8bit",
      }),
    ).toBe("https://hub.solana-clawd-go.com/8bit/sonoscli");
  });

  it("maps sort aliases to the ScgHub API surface", () => {
    expect(getScgHubApiSort()).toBe("updated");
    expect(getScgHubApiSort("newest")).toBe("updated");
    expect(getScgHubApiSort("downloads")).toBe("downloads");
    expect(getScgHubApiSort("rating")).toBe("stars");
    expect(getScgHubApiSort("installs")).toBe("installsCurrent");
    expect(getScgHubApiSort("installs-all-time")).toBe("installsAllTime");
    expect(getScgHubApiSort("trending")).toBe("trending");
    expect(() => getScgHubApiSort("garbage")).toThrow(/Invalid sort/);
  });

  it("clamps hub list limits", () => {
    expect(clampScgHubLimit(0)).toBe(1);
    expect(clampScgHubLimit(5)).toBe(5);
    expect(clampScgHubLimit(999)).toBe(200);
    expect(clampScgHubLimit(Number.NaN, 25)).toBe(25);
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
      const result = await getScgHubSkillManifest("token-tracker", {
        siteUrl: "https://hub.solana-clawd-go.com",
      });
      expect(result.manifest.slug).toBe("token-tracker");
      expect(calls).toEqual([
        "https://hub.solana-clawd-go.com/api/v1/skills/token-tracker/manifest",
      ]);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});
