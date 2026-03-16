import { afterEach, describe, expect, it, vi } from "vitest";

const originalFetch = global.fetch.bind(global);

async function withRegistryServer(
  handler: (url: string, init?: RequestInit) => Promise<Response>,
  run: (baseUrl: string) => Promise<void>,
) {
  const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === "string"
      ? input
      : input instanceof URL
        ? input.toString()
        : input.url;

    if (url.startsWith("http://127.0.0.1") || url.startsWith("http://localhost")) {
      return originalFetch(input, init);
    }

    return handler(url, init);
  });

  vi.stubGlobal("fetch", fetchMock);

  const { createRegistryServer } = await import("./registry-server.js");
  const server = createRegistryServer();

  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", () => resolve()));

  try {
    const address = server.address();
    if (!address || typeof address === "string") {
      throw new Error("Unable to determine registry server address");
    }
    await run(`http://127.0.0.1:${address.port}`);
  } finally {
    await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  }
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("hub/registry-server", () => {
  it("sanitizes custom slugs during registration", async () => {
    let capturedBody: Record<string, unknown> | null = null;

    await withRegistryServer(async (_url, init) => {
      capturedBody = JSON.parse(String(init?.body ?? "{}")) as Record<string, unknown>;
      return new Response(
        JSON.stringify([{ ...(capturedBody ?? {}), id: "agent-1" }]),
        {
          status: 201,
          headers: { "content-type": "application/json" },
        },
      );
    }, async (baseUrl) => {
      const response = await fetch(`${baseUrl}/api/v1/agents/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "My Pump Agent",
          slug: "My Pump Agent!!!",
          description: "Launches and trades",
          category: "agent",
          publicKey: "PubKey111111111111111111111111111111111111111",
        }),
      });

      expect(response.status).toBe(201);
      expect(capturedBody?.slug).toBe("my-pump-agent");
    });
  });

  it("returns 404 when heartbeat token does not match a registered agent", async () => {
    await withRegistryServer(async () => {
      return new Response(JSON.stringify([]), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    }, async (baseUrl) => {
      const response = await fetch(`${baseUrl}/api/v1/agents/test-agent/heartbeat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ registrationToken: "bad-token" }),
      });

      expect(response.status).toBe(404);
      await expect(response.json()).resolves.toMatchObject({
        error: "Agent not found or registration token invalid",
      });
    });
  });
});
