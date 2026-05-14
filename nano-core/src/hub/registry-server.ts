#!/usr/bin/env node

/**
 * ClawdHub — Registration API Server
 *
 * Express server that provides the ClawdHub agent registration API.
 * Agents register themselves via `npx clawd hub register`,
 * which calls this server. Backend is Supabase PostgreSQL.
 *
 * Deploy to Railway with:
 *   SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE
 *
 * Endpoints:
 *   POST /api/v1/agents/register   — Register agent
 *   GET  /api/v1/agents            — List agents
 *   GET  /api/v1/agents/:slug      — Get agent by slug
 *   POST /api/v1/agents/:slug/heartbeat — Agent heartbeat
 *   PATCH /api/v1/agents/:slug     — Update agent
 *   GET  /api/v1/agents/search     — Search agents
 *   GET  /api/v1/stats             — Registry stats
 *   POST /api/v1/db/init           — Initialize DB tables
 *   GET  /health                   — Health check
 */

import { createServer } from "node:http";
import { createHash, randomUUID } from "node:crypto";
import { pathToFileURL } from "node:url";

// ── Config ───────────────────────────────────────────────────────

const PORT = Number(process.env.PORT ?? 3456);
const SUPABASE_URL = process.env.SUPABASE_URL ?? "https://bvpysuatpnoytmcaetxl.supabase.co";
const SUPABASE_SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE ?? "";
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY ?? "";
const API_SECRET = process.env.NANOHUB_API_SECRET ?? "";

// Use service role for server-side operations, anon key for reads
const WRITE_KEY = SUPABASE_SERVICE_ROLE || SUPABASE_ANON_KEY;
const READ_KEY = SUPABASE_ANON_KEY || SUPABASE_SERVICE_ROLE;

// ── Supabase REST Helper ─────────────────────────────────────────

interface SupabaseResponse {
  data: unknown;
  error: string | null;
  status: number;
}

async function supabase(
  method: string,
  path: string,
  opts: {
    body?: unknown;
    query?: Record<string, string>;
    key?: string;
    preferRepresentation?: boolean;
  } = {},
): Promise<SupabaseResponse> {
  const url = new URL(`/rest/v1/${path}`, SUPABASE_URL);

  if (opts.query) {
    for (const [k, v] of Object.entries(opts.query)) {
      url.searchParams.set(k, v);
    }
  }

  const key = opts.key ?? (method === "GET" ? READ_KEY : WRITE_KEY);
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    apikey: key,
    Authorization: `Bearer ${key}`,
  };

  if ((method === "POST" || method === "PATCH") && opts.preferRepresentation !== false) {
    headers.Prefer = "return=representation";
  }

  try {
    const res = await fetch(url.toString(), {
      method,
      headers,
      body: opts.body ? JSON.stringify(opts.body) : undefined,
    });

    const text = await res.text();
    let data: unknown = null;

    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }

    if (!res.ok) {
      return { data: null, error: typeof data === "string" ? data : text, status: res.status };
    }

    return { data, error: null, status: res.status };
  } catch (err) {
    return { data: null, error: (err as Error).message, status: 0 };
  }
}

// ── SQL Execution via Supabase RPC ───────────────────────────────

async function execSQL(sql: string): Promise<SupabaseResponse> {
  const url = new URL("/rest/v1/rpc/exec_sql", SUPABASE_URL);

  // Try using RPC first, fall back to direct REST
  const key = WRITE_KEY;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    apikey: key,
    Authorization: `Bearer ${key}`,
    Prefer: "return=minimal",
  };

  try {
    const res = await fetch(url.toString(), {
      method: "POST",
      headers,
      body: JSON.stringify({ query: sql }),
    });

    if (!res.ok) {
      const errText = await res.text();
      return { data: null, error: errText, status: res.status };
    }

    return { data: "OK", error: null, status: res.status };
  } catch (err) {
    return { data: null, error: (err as Error).message, status: 0 };
  }
}

// ── Helpers ──────────────────────────────────────────────────────

function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 64);
}

function isValidCategory(value: string): value is "skill" | "soul" | "bot" | "service" | "agent" {
  return ["skill", "soul", "bot", "service", "agent"].includes(value);
}

function fp(pubkey: string, name: string, version: string): string {
  return createHash("sha256").update(pubkey).update(name).update(version).digest("hex").slice(0, 16);
}

function cors(res: { setHeader(k: string, v: string): void }): void {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Agent-Key");
}

function json(res: { writeHead(s: number, h?: Record<string, string>): void; end(b: string): void }, status: number, data: unknown): void {
  cors(res as { setHeader(k: string, v: string): void });
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(JSON.stringify(data));
}

async function readBody(req: { on(e: string, cb: (d: Buffer) => void): void }): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on("data", (chunk: Buffer) => chunks.push(chunk));
    req.on("end", () => {
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString()));
      } catch {
        reject(new Error("Invalid JSON"));
      }
    });
    req.on("error", reject);
  });
}

// ── DB Initialization ────────────────────────────────────────────

async function initDatabase(): Promise<string[]> {
  const logs: string[] = [];

  // Create the hub_agents table via a test insert + check
  // Since Supabase doesn't allow DDL via REST, we'll try to use the table
  // and handle the case where it doesn't exist
  const testRead = await supabase("GET", "hub_agents", {
    query: { limit: "1" },
  });

  if (testRead.status === 404 || (testRead.error && testRead.error.includes("does not exist"))) {
    logs.push("⚠️  Table 'hub_agents' does not exist. Create it in Supabase Dashboard:");
    logs.push("");
    logs.push("  Go to: SQL Editor in Supabase Dashboard");
    logs.push("  Run the following SQL:");
    logs.push("");
    logs.push(getCreateTableSQL());
    return logs;
  }

  logs.push("✅ Table 'hub_agents' exists and is accessible");

  // Try hub_agent_versions
  const testVersions = await supabase("GET", "hub_agent_versions", {
    query: { limit: "1" },
  });

  if (testVersions.status === 404 || (testVersions.error && testVersions.error.includes("does not exist"))) {
    logs.push("⚠️  Table 'hub_agent_versions' does not exist (optional)");
  } else {
    logs.push("✅ Table 'hub_agent_versions' exists");
  }

  return logs;
}

function getCreateTableSQL(): string {
  return `
-- ClawdHub Agent Registry Tables
-- Run this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS hub_agents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL DEFAULT 'agent' CHECK (category IN ('skill', 'soul', 'bot', 'service', 'agent')),
  public_key TEXT NOT NULL,
  owner TEXT NOT NULL DEFAULT '',
  version TEXT NOT NULL DEFAULT '1.0.0',
  capabilities JSONB NOT NULL DEFAULT '[]',
  tags TEXT[] NOT NULL DEFAULT '{}',
  metadata JSONB NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending')),
  registration_token TEXT,
  fingerprint TEXT,
  heartbeat_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_hub_agents_slug ON hub_agents(slug);
CREATE INDEX IF NOT EXISTS idx_hub_agents_category ON hub_agents(category);
CREATE INDEX IF NOT EXISTS idx_hub_agents_status ON hub_agents(status);
CREATE INDEX IF NOT EXISTS idx_hub_agents_public_key ON hub_agents(public_key);
CREATE INDEX IF NOT EXISTS idx_hub_agents_created_at ON hub_agents(created_at DESC);

-- Enable Row Level Security
ALTER TABLE hub_agents ENABLE ROW LEVEL SECURITY;

-- Public read access
CREATE POLICY "Public read access" ON hub_agents
  FOR SELECT USING (true);

-- Authenticated insert/update via service role
CREATE POLICY "Service role full access" ON hub_agents
  FOR ALL USING (auth.role() = 'service_role');

-- Allow anon inserts (for CLI registration)
CREATE POLICY "Anon insert" ON hub_agents
  FOR INSERT WITH CHECK (true);

-- Allow updates with registration token
CREATE POLICY "Token update" ON hub_agents
  FOR UPDATE USING (true);

-- Versions table (optional)
CREATE TABLE IF NOT EXISTS hub_agent_versions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_id UUID NOT NULL REFERENCES hub_agents(id) ON DELETE CASCADE,
  version TEXT NOT NULL,
  changelog TEXT NOT NULL DEFAULT '',
  files JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_hub_agent_versions_agent ON hub_agent_versions(agent_id);

ALTER TABLE hub_agent_versions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read versions" ON hub_agent_versions FOR SELECT USING (true);
CREATE POLICY "Service insert versions" ON hub_agent_versions FOR INSERT WITH CHECK (true);

-- Grant access
GRANT SELECT ON hub_agents TO anon;
GRANT INSERT ON hub_agents TO anon;
GRANT UPDATE ON hub_agents TO anon;
GRANT SELECT ON hub_agent_versions TO anon;
GRANT INSERT ON hub_agent_versions TO anon;
`;
}

// ── Route Handlers ───────────────────────────────────────────────

type Req = import("node:http").IncomingMessage;
type Res = import("node:http").ServerResponse;

export async function handleRegister(req: Req, res: Res): Promise<void> {
  const body = await readBody(req) as Record<string, unknown>;

  const name = String(body.name ?? "").trim();
  const description = String(body.description ?? "").trim();
  const categoryCandidate = String(body.category ?? "agent").trim();
  const publicKey = String(body.publicKey ?? body.public_key ?? "").trim();
  const owner = String(body.owner ?? publicKey.slice(0, 8));
  const version = String(body.version ?? "1.0.0");
  const capabilities = Array.isArray(body.capabilities) ? body.capabilities : [];
  const tags = Array.isArray(body.tags) ? body.tags : [];
  const metadata = body.metadata && typeof body.metadata === "object" && !Array.isArray(body.metadata)
    ? body.metadata
    : {};

  if (!name) { json(res, 400, { error: "name is required" }); return; }
  if (!publicKey) { json(res, 400, { error: "publicKey is required" }); return; }
  if (!isValidCategory(categoryCandidate)) {
    json(res, 400, { error: "category must be skill, soul, bot, service, or agent" });
    return;
  }

  const category = categoryCandidate;
  const slugSource = body.slug ? String(body.slug).trim() : name;
  const slug = slugify(slugSource);
  if (!slug) {
    json(res, 400, { error: "slug is required after normalization" });
    return;
  }
  const registrationToken = randomUUID();
  const fingerprint = fp(publicKey, name, version);
  const now = new Date().toISOString();

  const agent = {
    name, slug, description, category, public_key: publicKey, owner, version,
    capabilities, tags, metadata: { ...metadata as object, fingerprint },
    status: "active", registration_token: registrationToken, fingerprint,
    heartbeat_at: now, created_at: now, updated_at: now,
  };

  const { data, error, status } = await supabase("POST", "hub_agents", { body: agent });

  if (error) {
    if (status === 409 || (typeof error === "string" && error.includes("duplicate"))) {
      json(res, 409, { error: `Slug "${slug}" already registered` });
      return;
    }
    json(res, 500, { error: `Registration failed: ${error}` });
    return;
  }

  const created = Array.isArray(data) ? data[0] : data;
  json(res, 201, {
    ok: true,
    agent: created,
    registrationToken,
    message: `Agent "${name}" registered successfully as ${slug}`,
  });
}

async function handleListAgents(_req: Req, res: Res, urlObj: URL): Promise<void> {
  const query: Record<string, string> = {
    select: "id,name,slug,description,category,public_key,owner,version,capabilities,tags,status,heartbeat_at,created_at,updated_at",
    order: "created_at.desc",
  };

  const category = urlObj.searchParams.get("category");
  const status = urlObj.searchParams.get("status");
  const limit = urlObj.searchParams.get("limit");

  if (category) query.category = `eq.${category}`;
  if (status) query.status = `eq.${status}`;
  if (limit) query.limit = limit;

  const { data, error } = await supabase("GET", "hub_agents", { query });

  if (error) { json(res, 500, { error }); return; }
  json(res, 200, { agents: data ?? [], count: Array.isArray(data) ? data.length : 0 });
}

async function handleGetAgent(_req: Req, res: Res, slug: string): Promise<void> {
  const { data, error } = await supabase("GET", "hub_agents", {
    query: { slug: `eq.${slug}`, limit: "1" },
  });

  if (error) { json(res, 500, { error }); return; }
  const agents = (data ?? []) as unknown[];
  if (agents.length === 0) { json(res, 404, { error: "Agent not found" }); return; }
  json(res, 200, { agent: agents[0] });
}

export async function handleHeartbeat(req: Req, res: Res, slug: string): Promise<void> {
  const body = await readBody(req) as Record<string, unknown>;
  const token = String(body.registrationToken ?? req.headers["x-agent-key"] ?? "");

  if (!token) { json(res, 401, { error: "registrationToken required" }); return; }

  const { data, error } = await supabase("PATCH", "hub_agents", {
    query: { slug: `eq.${slug}`, registration_token: `eq.${token}` },
    body: { heartbeat_at: new Date().toISOString(), status: "active" },
    preferRepresentation: true,
  });

  if (error) { json(res, 500, { error }); return; }
  const updated = Array.isArray(data) ? data : [];
  if (updated.length === 0) {
    json(res, 404, { error: "Agent not found or registration token invalid" });
    return;
  }
  json(res, 200, { ok: true, agent: updated[0] });
}

async function handleUpdateAgent(req: Req, res: Res, slug: string): Promise<void> {
  const body = await readBody(req) as Record<string, unknown>;
  const token = String(body.registrationToken ?? req.headers["x-agent-key"] ?? "");

  if (!token) { json(res, 401, { error: "registrationToken required" }); return; }

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (body.description !== undefined) updates.description = body.description;
  if (body.version !== undefined) updates.version = body.version;
  if (body.capabilities !== undefined) updates.capabilities = body.capabilities;
  if (body.tags !== undefined) updates.tags = body.tags;
  if (body.metadata !== undefined) updates.metadata = body.metadata;
  if (body.status !== undefined) updates.status = body.status;

  const { data, error } = await supabase("PATCH", "hub_agents", {
    query: { slug: `eq.${slug}`, registration_token: `eq.${token}` },
    body: updates,
    preferRepresentation: true,
  });

  if (error) { json(res, 500, { error }); return; }
  const updated = Array.isArray(data) ? data : [];
  if (updated.length === 0) {
    json(res, 404, { error: "Agent not found or registration token invalid" });
    return;
  }
  json(res, 200, { ok: true, agent: updated[0] });
}

async function handleDeregister(req: Req, res: Res, slug: string): Promise<void> {
  const body = await readBody(req) as Record<string, unknown>;
  const token = String(body.registrationToken ?? req.headers["x-agent-key"] ?? "");

  if (!token) { json(res, 401, { error: "registrationToken required" }); return; }

  const { data, error } = await supabase("PATCH", "hub_agents", {
    query: { slug: `eq.${slug}`, registration_token: `eq.${token}` },
    body: { status: "inactive", updated_at: new Date().toISOString() },
    preferRepresentation: true,
  });

  if (error) { json(res, 500, { error }); return; }
  const updated = Array.isArray(data) ? data : [];
  if (updated.length === 0) {
    json(res, 404, { error: "Agent not found or registration token invalid" });
    return;
  }
  json(res, 200, { ok: true, message: `Agent "${slug}" deregistered`, agent: updated[0] });
}

async function handleSearch(_req: Req, res: Res, urlObj: URL): Promise<void> {
  const q = urlObj.searchParams.get("q")?.trim() ?? "";
  if (!q) { json(res, 200, { agents: [] }); return; }

  const { data, error } = await supabase("GET", "hub_agents", {
    query: {
      or: `(name.ilike.%${q}%,description.ilike.%${q}%,slug.ilike.%${q}%)`,
      status: "eq.active",
      limit: "20",
      order: "created_at.desc",
    },
  });

  if (error) { json(res, 500, { error }); return; }
  json(res, 200, { agents: data ?? [], count: Array.isArray(data) ? data.length : 0 });
}

async function handleStats(_req: Req, res: Res): Promise<void> {
  const { data, error } = await supabase("GET", "hub_agents", {
    query: { select: "category,status" },
  });

  if (error) { json(res, 500, { error }); return; }

  const agents = (data ?? []) as { category: string; status: string }[];
  const byCategory: Record<string, number> = {};
  let active = 0;

  for (const a of agents) {
    byCategory[a.category] = (byCategory[a.category] ?? 0) + 1;
    if (a.status === "active") active++;
  }

  json(res, 200, {
    totalAgents: agents.length,
    activeAgents: active,
    byCategory,
    timestamp: Date.now(),
  });
}

async function handleDbInit(_req: Req, res: Res): Promise<void> {
  const logs = await initDatabase();
  const sql = getCreateTableSQL();
  json(res, 200, { logs, sql, message: "Copy the SQL above and run it in Supabase Dashboard → SQL Editor" });
}

// ── HTTP Server ──────────────────────────────────────────────────

function hasApiSecretAccess(req: Req): boolean {
  if (!API_SECRET) return true;
  return req.headers["x-api-secret"] === API_SECRET;
}

export function createRegistryServer() {
  return createServer(async (req, res) => {
    const url = new URL(req.url ?? "/", `http://localhost:${PORT}`);
    const path = url.pathname;
    const method = req.method ?? "GET";

    // CORS preflight
    if (method === "OPTIONS") {
      cors(res);
      res.writeHead(204);
      res.end();
      return;
    }

    try {
      // Health check
      if (path === "/health" || path === "/") {
        json(res, 200, {
          status: "ok",
          service: "nanohub-registry",
          version: "1.0.0",
          timestamp: Date.now(),
          supabase: SUPABASE_URL ? "configured" : "missing",
        });
        return;
      }

      // DB Init
      if (path === "/api/v1/db/init" && method === "POST") {
        if (!hasApiSecretAccess(req)) {
          json(res, 401, { error: "API secret required" });
          return;
        }
        await handleDbInit(req, res);
        return;
      }

      // GET /api/v1/db/sql — Return SQL for manual creation
      if (path === "/api/v1/db/sql" && method === "GET") {
        if (!hasApiSecretAccess(req)) {
          json(res, 401, { error: "API secret required" });
          return;
        }
        json(res, 200, { sql: getCreateTableSQL() });
        return;
      }

      // Register
      if (path === "/api/v1/agents/register" && method === "POST") {
        await handleRegister(req, res);
        return;
      }

      // Search
      if (path === "/api/v1/agents/search" && method === "GET") {
        await handleSearch(req, res, url);
        return;
      }

      // Stats
      if (path === "/api/v1/stats" && method === "GET") {
        await handleStats(req, res);
        return;
      }

      // List agents
      if (path === "/api/v1/agents" && method === "GET") {
        await handleListAgents(req, res, url);
        return;
      }

      // Agent-specific routes: /api/v1/agents/:slug
      const agentMatch = path.match(/^\/api\/v1\/agents\/([a-z0-9-]+)$/);
      if (agentMatch) {
        const slug = agentMatch[1];

        if (method === "GET") {
          await handleGetAgent(req, res, slug);
          return;
        }

        if (method === "PATCH") {
          await handleUpdateAgent(req, res, slug);
          return;
        }

        if (method === "DELETE") {
          await handleDeregister(req, res, slug);
          return;
        }
      }

      // Heartbeat: /api/v1/agents/:slug/heartbeat
      const heartbeatMatch = path.match(/^\/api\/v1\/agents\/([a-z0-9-]+)\/heartbeat$/);
      if (heartbeatMatch && method === "POST") {
        await handleHeartbeat(req, res, heartbeatMatch[1]);
        return;
      }

      // 404
      json(res, 404, { error: "Not found", path });
    } catch (err) {
      json(res, 500, { error: (err as Error).message });
    }
  });
}

const server = createRegistryServer();

function isMainModule(): boolean {
  return Boolean(process.argv[1]) && import.meta.url === pathToFileURL(process.argv[1]).href;
}

if (isMainModule()) {
  server.listen(PORT, () => {
    console.log(`
  ╔══════════════════════════════════════════════════════════════╗
  ║          ClawdHub — Agent Registration Server                ║
  ║          🦞 Solanapolis Registry API                        ║
  ╚══════════════════════════════════════════════════════════════╝

  🌐 Server:    http://localhost:${PORT}
  📦 Supabase:  ${SUPABASE_URL}
  🔑 Auth:      ${WRITE_KEY ? "service_role configured" : "⚠️  No service role key"}

  Endpoints:
    POST /api/v1/agents/register  — Register agent
    GET  /api/v1/agents           — List agents
    GET  /api/v1/agents/:slug     — Get agent
    POST /api/v1/agents/:slug/heartbeat — Heartbeat
    DELETE /api/v1/agents/:slug    — Deregister
    GET  /api/v1/agents/search?q= — Search
    GET  /api/v1/stats            — Stats
    POST /api/v1/db/init          — Check/init database
    GET  /api/v1/db/sql           — Get SQL schema

  Ready. 🚀
  `);
  });
}

export { server, handleDeregister };
