import { describe, expect, it } from "vitest";
import { validateSoul, showSoul, showSoulStats } from "./soul.js";

describe("cli/soul", () => {
  it("validates the project SOUL.md successfully", () => {
    const logs: string[] = [];
    const origLog = console.log;
    console.log = (...args: unknown[]) => logs.push(args.join(" "));

    let result;
    try {
      result = validateSoul();
    } finally {
      console.log = origLog;
    }

    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it("showSoul does not throw", () => {
    const origLog = console.log;
    console.log = () => {};
    try {
      expect(() => showSoul()).not.toThrow();
    } finally {
      console.log = origLog;
    }
  });

  it("showSoulStats does not throw", () => {
    const origLog = console.log;
    console.log = () => {};
    try {
      expect(() => showSoulStats()).not.toThrow();
    } finally {
      console.log = origLog;
    }
  });
});
