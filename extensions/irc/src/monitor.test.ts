import { describe, expect, it } from "vitest";
import { resolveIrcInboundTarget } from "./monitor.js";

describe("irc monitor inbound target", () => {
  it("keeps channel target for group messages", () => {
    expect(
      resolveIrcInboundTarget({
        target: "#nanoclawd",
        senderNick: "alice",
      }),
    ).toEqual({
      isGroup: true,
      target: "#nanoclawd",
      rawTarget: "#nanoclawd",
    });
  });

  it("maps DM target to sender nick and preserves raw target", () => {
    expect(
      resolveIrcInboundTarget({
        target: "nanoclawd-bot",
        senderNick: "alice",
      }),
    ).toEqual({
      isGroup: false,
      target: "alice",
      rawTarget: "nanoclawd-bot",
    });
  });

  it("falls back to raw target when sender nick is empty", () => {
    expect(
      resolveIrcInboundTarget({
        target: "nanoclawd-bot",
        senderNick: " ",
      }),
    ).toEqual({
      isGroup: false,
      target: "nanoclawd-bot",
      rawTarget: "nanoclawd-bot",
    });
  });
});
