import { describe, expect, it } from "vitest";

import {
  clampNanoHubLimit,
  getNanoHubApiBaseUrl,
  getNanoHubApiSort,
  getNanoHubDiscoveryUrl,
  getNanoHubSiteUrl,
  getNanoHubSkillUrl,
  normalizeNanoHubSiteUrl,
} from "./public-client.js";

describe("hub/public-client", () => {
  it("normalizes the canonical NanoHub site URL", () => {
    expect(normalizeNanoHubSiteUrl()).toBe("https://nanosolana.netlify.app");
    expect(normalizeNanoHubSiteUrl("nanosolana.netlify.app/")).toBe("https://nanosolana.netlify.app");
    expect(normalizeNanoHubSiteUrl("http://localhost:3000/")).toBe("http://localhost:3000");
  });

  it("builds site, api, discovery, and skill URLs", () => {
    expect(getNanoHubSiteUrl("https://nanosolana.netlify.app/")).toBe("https://nanosolana.netlify.app");
    expect(getNanoHubApiBaseUrl("https://nanosolana.netlify.app")).toBe("https://nanosolana.netlify.app/api/v1");
    expect(getNanoHubDiscoveryUrl("https://nanosolana.netlify.app")).toBe(
      "https://nanosolana.netlify.app/.well-known/nanohub.json",
    );
    expect(getNanoHubSkillUrl("sonoscli", { siteUrl: "https://nanosolana.netlify.app" })).toBe(
      "https://nanosolana.netlify.app/skills/sonoscli",
    );
    expect(
      getNanoHubSkillUrl("sonoscli", {
        siteUrl: "https://nanosolana.netlify.app",
        ownerHandle: "8bit",
      }),
    ).toBe("https://nanosolana.netlify.app/8bit/sonoscli");
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
});
