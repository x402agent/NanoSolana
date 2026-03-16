import { PassThrough } from "node:stream";
import { afterEach, describe, expect, it, vi } from "vitest";

import { handleHeartbeat, handleRegister } from "./registry-server.js";

function createJsonRequest(body: unknown, headers: Record<string, string> = {}) {
  const req = new PassThrough() as PassThrough & {
    headers: Record<string, string>;
    method: string;
    url: string;
  };
  req.headers = headers;
  req.method = "POST";
  req.url = "/";
  req.end(JSON.stringify(body));
  return req;
}

function createResponseCapture() {
  let statusCode = 200;
  const headers: Record<string, string> = {};
  let body = "";
  let resolveDone: ((value: { statusCode: number; headers: Record<string, string>; body: string }) => void) | null = null;

  const done = new Promise<{ statusCode: number; headers: Record<string, string>; body: string }>((resolve) => {
    resolveDone = resolve;
  });

  const res = {
    setHeader(name: string, value: string) {
      headers[name] = value;
    },
    writeHead(status: number, moreHeaders: Record<string, string> = {}) {
      statusCode = status;
      Object.assign(headers, moreHeaders);
    },
    end(chunk = "") {
      body += String(chunk);
      resolveDone?.({ statusCode, headers, body });
    },
  };

  return { res, done };
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("hub/registry-server", () => {
  it("sanitizes custom slugs during registration", async () => {
    let capturedBody: Record<string, unknown> | null = null;

    vi.stubGlobal("fetch", vi.fn(async (_url: RequestInfo | URL, init?: RequestInit) => {
      capturedBody = JSON.parse(String(init?.body ?? "{}")) as Record<string, unknown>;
      return new Response(
        JSON.stringify([{ ...(capturedBody ?? {}), id: "agent-1" }]),
        {
          status: 201,
          headers: { "content-type": "application/json" },
        },
      );
    }));

    const req = createJsonRequest({
      name: "My Pump Agent",
      slug: "My Pump Agent!!!",
      description: "Launches and trades",
      category: "agent",
      publicKey: "PubKey111111111111111111111111111111111111111",
    });
    const { res, done } = createResponseCapture();

    await handleRegister(req as never, res as never);

    const response = await done;
    expect(response.statusCode).toBe(201);
    expect(capturedBody?.slug).toBe("my-pump-agent");
  });

  it("returns 404 when heartbeat token does not match a registered agent", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => {
      return new Response(JSON.stringify([]), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    }));

    const req = createJsonRequest({ registrationToken: "bad-token" });
    const { res, done } = createResponseCapture();

    await handleHeartbeat(req as never, res as never, "test-agent");

    const response = await done;
    expect(response.statusCode).toBe(404);
    expect(JSON.parse(response.body)).toMatchObject({
      error: "Agent not found or registration token invalid",
    });
  });
});
