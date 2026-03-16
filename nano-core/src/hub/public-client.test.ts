import { describe, expect, it } from "vitest";

import {
  clampNanoHubLimit,
  getNanoHubApiBaseUrl,
  getNanoHubApiSort,
  getNanoHubDiscoveryUrl,
  getNanoHubSkillManifest,
  getNanoHubSiteUrl,
  getNanoHubSkillUrl,
  normalizeNanoHubSiteUrl,
} from "./public-client.js";

describe("hub/public-client", () => {
  it("normalizes the canonical NanoHub site URL", () => {
    expect(normalizeNanoHubSiteUrl()).toBe("https://hub.nanosolana.com");
    expect(normalizeNanoHubSiteUrl("hub.nanosolana.com/")).toBe("https://hub.nanosolana.com");
    expect(normalizeNanoHubSiteUrl("http://localhost:3000/")).toBe("http://localhost:3000");
  });

  it("builds site, api, discovery, and skill URLs", () => {
    expect(getNanoHubSiteUrl("https://hub.nanosolana.com/")).toBe("https://hub.nanosolana.com");
    expect(getNanoHubApiBaseUrl("https://hub.nanosolana.com")).toBe("https://hub.nanosolana.com/api/v1");
    expect(getNanoHubDiscoveryUrl("https://hub.nanosolana.com")).toBe(
      "https://hub.nanosolana.com/.well-known/nanohub.json",
    );
    expect(getNanoHubSkillUrl("sonoscli", { siteUrl: "https://hub.nanosolana.com" })).toBe(
      "https://hub.nanosolana.com/skills/sonoscli",
    );
    expect(
      getNanoHubSkillUrl("sonoscli", {
        siteUrl: "https://hub.nanosolana.com",
        ownerHandle: "8bit",
      }),
    ).toBe("https://hub.nanosolana.com/8bit/sonoscli");
  });

  it("maps sort aliases to the NanoHub API surface", () => {
    expect(getNanoHubApiSort()).toBe("updated");
    expect(getNanoHubApiSort("newest")).toBe("updated");
    expect(getNanoHubApiSort("downloads")).toBe("downloads");
    expect(getNanoHubApiSort("rating")).toBe("stars");
    expect(getNanoHubApiSort("installs")).toBe("installsCurrent");
    expect(getNanoHubApiSort("installs-all-time")).toBe("installsAllTime");
    expect(getNanoHubApiSort("trending")).toBe("trending");
    expect(() => getNanoHubApiSort("garbage")).toThrow(/Invalid sort/);
  });

  it("clamps hub list limits", () => {
    expect(clampNanoHubLimit(0)).toBe(1);
    expect(clampNanoHubLimit(5)).toBe(5);
    expect(clampNanoHubLimit(999)).toBe(200);
    expect(clampNanoHubLimit(Number.NaN, 25)).toBe(25);
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
      const result = await getNanoHubSkillManifest("token-tracker", {
        siteUrl: "https://hub.nanosolana.com",
      });
      expect(result.manifest.slug).toBe("token-tracker");
      expect(calls).toEqual([
        "https://hub.nanosolana.com/api/v1/skills/token-tracker/manifest",
      ]);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});
