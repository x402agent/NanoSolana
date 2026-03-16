import { afterEach, describe, expect, it, vi } from "vitest";
import { runDoctor } from "./doctor.js";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("cli/doctor", () => {
  it("runs without throwing", async () => {
    // Mock fetch to avoid real network calls
    vi.stubGlobal("fetch", vi.fn(async () => new Response('{"result":"ok"}', { status: 200 })));

    const logs: string[] = [];
    const origLog = console.log;
    console.log = (...args: unknown[]) => logs.push(args.join(" "));
    try {
      await runDoctor();
    } finally {
      console.log = origLog;
    }

    const combined = logs.join("\n");
    expect(combined).toContain("NanoSolana Doctor");
    expect(combined).toContain("Summary:");
    expect(combined).toContain("Node.js");
  });

  it("detects Node.js version >= 22", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response('{"result":"ok"}', { status: 200 })));

    const logs: string[] = [];
    const origLog = console.log;
    console.log = (...args: unknown[]) => logs.push(args.join(" "));
    try {
      await runDoctor();
    } finally {
      console.log = origLog;
    }

    const combined = logs.join("\n");
    expect(combined).toMatch(/Node\.js.*22/);
  });
});
