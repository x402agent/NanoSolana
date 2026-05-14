/**
 * ClawdHub — Supabase Registry Client
 *
 * Provides programmatic access to the ClawdHub agent registry
 * backed by Supabase PostgreSQL + Storage.
 *
 * Used by:
 *   - CLI `clawd hub register`
 *   - Registration API server
 *   - ClawdHub web UI (read-only)
 */

import { createHash, randomUUID } from "node:crypto";

// ── Types ────────────────────────────────────────────────────────

export interface HubAgent {
  id: string;
  name: string;
  slug: string;
  description: string;
  category: "skill" | "soul" | "bot" | "service" | "agent";
  public_key: string;
  owner: string;
  version: string;
  capabilities: string[];
  tags: string[];
  metadata: Record<string, unknown>;
  status: "active" | "inactive" | "pending";
  heartbeat_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface HubAgentVersion {
  id: string;
  agent_id: string;
  version: string;
  changelog: string;
  files: { path: string; size: number; sha256: string }[];
  created_at: string;
}

export interface RegisterAgentInput {
  name: string;
  slug?: string;
  description: string;
  category: HubAgent["category"];
  publicKey: string;
  owner?: string;
  version?: string;
  capabilities?: string[];
  tags?: string[];
  metadata?: Record<string, unknown>;
}

export interface HubRegistryConfig {
  supabaseUrl: string;
  supabaseKey: string;
}

// ── Default Config ───────────────────────────────────────────────

const NANOHUB_API_URL =
  process.env.NANOHUB_API_URL ?? "https://nanohub-api.up.railway.app";
const SUPABASE_URL =
  process.env.SUPABASE_URL ?? "https://bvpysuatpnoytmcaetxl.supabase.co";
const SUPABASE_ANON_KEY =
  process.env.SUPABASE_ANON_KEY ?? "";

// ── Helpers ──────────────────────────────────────────────────────

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 64);
}

function fingerprint(publicKey: string, name: string, version: string): string {
  return createHash("sha256")
    .update(publicKey)
    .update(name)
    .update(version)
    .digest("hex")
    .slice(0, 16);
}

// ── Supabase REST Client ─────────────────────────────────────────
// Minimal Supabase client — no SDK dependency required.

async function supabaseRest(
  method: string,
  table: string,
  config: HubRegistryConfig,
  opts: {
    body?: unknown;
    query?: Record<string, string>;
    headers?: Record<string, string>;
  } = {},
): Promise<{ data: unknown; error: string | null; status: number }> {
  const url = new URL(`/rest/v1/${table}`, config.supabaseUrl);

  if (opts.query) {
    for (const [k, v] of Object.entries(opts.query)) {
      url.searchParams.set(k, v);
    }
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    apikey: config.supabaseKey,
    Authorization: `Bearer ${config.supabaseKey}`,
    Prefer: method === "POST" ? "return=representation" : "return=minimal",
    ...opts.headers,
  };

  try {
    const res = await fetch(url.toString(), {
      method,
      headers,
      body: opts.body ? JSON.stringify(opts.body) : undefined,
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => "Unknown error");
      return { data: null, error: errText, status: res.status };
    }

    const data = res.headers.get("content-type")?.includes("json")
      ? await res.json()
      : null;

    return { data, error: null, status: res.status };
  } catch (err) {
    return {
      data: null,
      error: (err as Error).message,
      status: 0,
    };
  }
}

// ── Hub Registry Client ──────────────────────────────────────────

export class HubRegistryClient {
  private config: HubRegistryConfig;

  constructor(config?: Partial<HubRegistryConfig>) {
    this.config = {
      supabaseUrl: config?.supabaseUrl ?? SUPABASE_URL,
      supabaseKey: config?.supabaseKey ?? SUPABASE_ANON_KEY,
    };
  }

  /**
   * Register a new agent in the ClawdHub registry.
   */
  async registerAgent(input: RegisterAgentInput): Promise<{
    agent: HubAgent;
    registrationToken: string;
  }> {
    const slug = input.slug ?? slugify(input.name);
    const version = input.version ?? "1.0.0";
    const registrationToken = randomUUID();
    const fp = fingerprint(input.publicKey, input.name, version);
    const now = new Date().toISOString();

    const agent: Omit<HubAgent, "id"> & { registration_token: string; fingerprint: string } = {
      name: input.name,
      slug,
      description: input.description,
      category: input.category,
      public_key: input.publicKey,
      owner: input.owner ?? input.publicKey.slice(0, 8),
      version,
      capabilities: input.capabilities ?? [],
      tags: input.tags ?? [],
      metadata: {
        ...input.metadata,
        fingerprint: fp,
      },
      status: "active",
      heartbeat_at: now,
      created_at: now,
      updated_at: now,
      registration_token: registrationToken,
      fingerprint: fp,
    };

    const { data, error, status } = await supabaseRest(
      "POST",
      "hub_agents",
      this.config,
      { body: agent },
    );

    if (error) {
      // Check if slug conflict
      if (status === 409 || (typeof error === "string" && error.includes("duplicate"))) {
        throw new Error(`Agent slug "${slug}" is already registered. Choose a different name.`);
      }
      throw new Error(`Registration failed: ${error}`);
    }

    const created = Array.isArray(data) ? data[0] : data;
    return {
      agent: created as HubAgent,
      registrationToken,
    };
  }

  /**
   * List all registered agents.
   */
  async listAgents(opts?: {
    category?: HubAgent["category"];
    status?: HubAgent["status"];
    limit?: number;
    offset?: number;
  }): Promise<HubAgent[]> {
    const query: Record<string, string> = {
      select: "*",
      order: "created_at.desc",
    };

    if (opts?.category) query.category = `eq.${opts.category}`;
    if (opts?.status) query.status = `eq.${opts.status}`;
    if (opts?.limit) query.limit = String(opts.limit);
    if (opts?.offset) query.offset = String(opts.offset);

    const { data, error } = await supabaseRest("GET", "hub_agents", this.config, { query });

    if (error) throw new Error(`Failed to list agents: ${error}`);
    return (data ?? []) as HubAgent[];
  }

  /**
   * Get a specific agent by slug.
   */
  async getAgent(slug: string): Promise<HubAgent | null> {
    const { data, error } = await supabaseRest("GET", "hub_agents", this.config, {
      query: { slug: `eq.${slug}`, limit: "1" },
    });

    if (error) throw new Error(`Failed to get agent: ${error}`);
    const agents = (data ?? []) as HubAgent[];
    return agents[0] ?? null;
  }

  /**
   * Send a heartbeat for an agent.
   */
  async heartbeat(slug: string, registrationToken: string): Promise<void> {
    const { error } = await supabaseRest("PATCH", "hub_agents", this.config, {
      query: {
        slug: `eq.${slug}`,
        registration_token: `eq.${registrationToken}`,
      },
      body: {
        heartbeat_at: new Date().toISOString(),
        status: "active",
      },
    });

    if (error) throw new Error(`Heartbeat failed: ${error}`);
  }

  /**
   * Update an agent's metadata.
   */
  async updateAgent(
    slug: string,
    registrationToken: string,
    updates: Partial<Pick<HubAgent, "description" | "version" | "capabilities" | "tags" | "metadata">>,
  ): Promise<void> {
    const { error } = await supabaseRest("PATCH", "hub_agents", this.config, {
      query: {
        slug: `eq.${slug}`,
        registration_token: `eq.${registrationToken}`,
      },
      body: {
        ...updates,
        updated_at: new Date().toISOString(),
      },
    });

    if (error) throw new Error(`Update failed: ${error}`);
  }

  /**
   * Deregister an agent.
   */
  async deregisterAgent(slug: string, registrationToken: string): Promise<void> {
    const { error } = await supabaseRest("PATCH", "hub_agents", this.config, {
      query: {
        slug: `eq.${slug}`,
        registration_token: `eq.${registrationToken}`,
      },
      body: {
        status: "inactive",
        updated_at: new Date().toISOString(),
      },
    });

    if (error) throw new Error(`Deregistration failed: ${error}`);
  }

  /**
   * Search agents by query.
   */
  async searchAgents(query: string, limit = 20): Promise<HubAgent[]> {
    const { data, error } = await supabaseRest("GET", "hub_agents", this.config, {
      query: {
        or: `(name.ilike.%${query}%,description.ilike.%${query}%,slug.ilike.%${query}%)`,
        status: "eq.active",
        limit: String(limit),
        order: "created_at.desc",
      },
    });

    if (error) throw new Error(`Search failed: ${error}`);
    return (data ?? []) as HubAgent[];
  }

  /**
   * Get registry statistics.
   */
  async getStats(): Promise<{
    totalAgents: number;
    activeAgents: number;
    byCategory: Record<string, number>;
  }> {
    const agents = await this.listAgents({ limit: 1000 });
    const active = agents.filter((a) => a.status === "active");
    const byCategory: Record<string, number> = {};

    for (const agent of agents) {
      byCategory[agent.category] = (byCategory[agent.category] ?? 0) + 1;
    }

    return {
      totalAgents: agents.length,
      activeAgents: active.length,
      byCategory,
    };
  }
}

// ── Singleton ────────────────────────────────────────────────────

let _client: HubRegistryClient | null = null;

export function getHubRegistryClient(config?: Partial<HubRegistryConfig>): HubRegistryClient {
  if (!_client || config) {
    _client = new HubRegistryClient(config);
  }
  return _client;
}
