-- ═══════════════════════════════════════════════════════════════════════
-- NanoHub Agent Registry — Supabase Schema
-- Run this in Supabase Dashboard → SQL Editor
-- Project: Solanapolis (bvpysuatpnoytmcaetxl)
-- ═══════════════════════════════════════════════════════════════════════

-- ── hub_agents ────────────────────────────────────────────────────────
-- Main registry table for agents, skills, souls, bots, and services.

CREATE TABLE IF NOT EXISTS hub_agents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL DEFAULT 'agent'
    CHECK (category IN ('skill', 'soul', 'bot', 'service', 'agent')),
  public_key TEXT NOT NULL,
  owner TEXT NOT NULL DEFAULT '',
  version TEXT NOT NULL DEFAULT '1.0.0',
  capabilities JSONB NOT NULL DEFAULT '[]',
  tags TEXT[] NOT NULL DEFAULT '{}',
  metadata JSONB NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'inactive', 'pending')),
  registration_token TEXT,
  fingerprint TEXT,
  heartbeat_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_hub_agents_slug ON hub_agents(slug);
CREATE INDEX IF NOT EXISTS idx_hub_agents_category ON hub_agents(category);
CREATE INDEX IF NOT EXISTS idx_hub_agents_status ON hub_agents(status);
CREATE INDEX IF NOT EXISTS idx_hub_agents_public_key ON hub_agents(public_key);
CREATE INDEX IF NOT EXISTS idx_hub_agents_created_at ON hub_agents(created_at DESC);

-- ── hub_agent_versions ────────────────────────────────────────────────
-- Version history for each agent.

CREATE TABLE IF NOT EXISTS hub_agent_versions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_id UUID NOT NULL REFERENCES hub_agents(id) ON DELETE CASCADE,
  version TEXT NOT NULL,
  changelog TEXT NOT NULL DEFAULT '',
  files JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_hub_agent_versions_agent ON hub_agent_versions(agent_id);

-- ── hub_heartbeats ────────────────────────────────────────────────────
-- Time-series heartbeat log (optional — for analytics).

CREATE TABLE IF NOT EXISTS hub_heartbeats (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_id UUID NOT NULL REFERENCES hub_agents(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'active',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_hub_heartbeats_agent ON hub_heartbeats(agent_id);
CREATE INDEX IF NOT EXISTS idx_hub_heartbeats_created ON hub_heartbeats(created_at DESC);

-- ═══════════════════════════════════════════════════════════════════════
-- Row Level Security (RLS)
-- ═══════════════════════════════════════════════════════════════════════

ALTER TABLE hub_agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE hub_agent_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE hub_heartbeats ENABLE ROW LEVEL SECURITY;

-- Public read access to all tables
CREATE POLICY "Public read agents" ON hub_agents
  FOR SELECT USING (true);

CREATE POLICY "Public read versions" ON hub_agent_versions
  FOR SELECT USING (true);

CREATE POLICY "Public read heartbeats" ON hub_heartbeats
  FOR SELECT USING (true);

-- Allow anonymous inserts (CLI registration)
CREATE POLICY "Anon insert agents" ON hub_agents
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Anon insert versions" ON hub_agent_versions
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Anon insert heartbeats" ON hub_heartbeats
  FOR INSERT WITH CHECK (true);

-- Allow updates (token-gated at API level)
CREATE POLICY "Token update agents" ON hub_agents
  FOR UPDATE USING (true);

-- Service role full access
CREATE POLICY "Service role agents" ON hub_agents
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role versions" ON hub_agent_versions
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role heartbeats" ON hub_heartbeats
  FOR ALL USING (auth.role() = 'service_role');

-- ═══════════════════════════════════════════════════════════════════════
-- Grants
-- ═══════════════════════════════════════════════════════════════════════

GRANT SELECT, INSERT, UPDATE ON hub_agents TO anon;
GRANT SELECT, INSERT ON hub_agent_versions TO anon;
GRANT SELECT, INSERT ON hub_heartbeats TO anon;

GRANT ALL ON hub_agents TO authenticated;
GRANT ALL ON hub_agent_versions TO authenticated;
GRANT ALL ON hub_heartbeats TO authenticated;

-- ═══════════════════════════════════════════════════════════════════════
-- Verify
-- ═══════════════════════════════════════════════════════════════════════

SELECT 'hub_agents' AS table_name, count(*) FROM hub_agents
UNION ALL
SELECT 'hub_agent_versions', count(*) FROM hub_agent_versions
UNION ALL
SELECT 'hub_heartbeats', count(*) FROM hub_heartbeats;
