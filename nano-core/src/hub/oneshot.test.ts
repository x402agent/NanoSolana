import { describe, expect, it } from "vitest";

import { buildScgOneShotPlan } from "./oneshot.js";

describe("hub/oneshot", () => {
  it("builds a ready plan when env and launch metadata are present", () => {
    const plan = buildScgOneShotPlan({
      schemaVersion: 1,
      kind: "skill",
      slug: "token-tracker",
      displayName: "Token Tracker",
      version: "1.2.3",
      requirements: {
        env: [
          { name: "BIRDEYE_API_KEY", required: true },
        ],
      },
      bootstrap: {
        runtime: "node",
        entryCommand: "npx token-tracker",
        extensions: ["telegram"],
        skills: ["pumpfun-analytics"],
        oauth: [],
        notes: [],
        healthEndpoint: "/health",
      },
      install: [{ kind: "node", package: "token-tracker" }],
    }, {
      env: { BIRDEYE_API_KEY: "test" },
      siteUrl: "https://hub.solana-clawd-go.com",
    });

    expect(plan.readyToLaunch).toBe(true);
    expect(plan.entryCommand).toBe("npx token-tracker");
    expect(plan.missingEnv).toEqual([]);
    expect(plan.extensions).toEqual(["telegram"]);
    expect(plan.linkedSkills).toEqual(["pumpfun-analytics"]);
  });

  it("marks env and oauth blockers when setup is incomplete", () => {
    const plan = buildScgOneShotPlan({
      schemaVersion: 1,
      kind: "skill",
      slug: "discord-agent",
      displayName: "Discord Agent",
      version: "0.1.0",
      requirements: {
        env: [
          { name: "DISCORD_BOT_TOKEN", required: true },
        ],
        oauth: ["github"],
      },
      bootstrap: {
        runtime: "node",
        entryCommand: null,
        oauth: ["discord"],
        notes: ["Connect the bot before first launch."],
      },
    }, {
      env: {},
    });

    expect(plan.readyToLaunch).toBe(false);
    expect(plan.missingEnv).toEqual(["DISCORD_BOT_TOKEN"]);
    expect(plan.requiredOAuth).toEqual(["github", "discord"]);
    expect(plan.warnings).toContain("No entry command declared in the ScgHub manifest.");
    expect(plan.warnings).toContain("No extension graph declared for this skill.");
  });
});
