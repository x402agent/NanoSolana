-- ═══════════════════════════════════════════════════════════════
--  MawdAxe Fleet Schema
--  Supabase migration for 100-1000 device fleet management
-- ═══════════════════════════════════════════════════════════════

-- Fleet owners (multi-tenant)
CREATE TABLE IF NOT EXISTS fleet_owners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_address TEXT UNIQUE,
  api_key_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  max_devices INT DEFAULT 10
);

-- Registered devices
CREATE TABLE IF NOT EXISTS devices (
  id TEXT PRIMARY KEY,                    -- mawdaxe-001
  owner_id UUID REFERENCES fleet_owners(id),
  bitaxe_ip TEXT NOT NULL,
  mac_address TEXT,
  asic_model TEXT,
  firmware_version TEXT,
  pool_url TEXT,
  pool_user TEXT,
  config JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_seen TIMESTAMPTZ
);

-- Time-series metrics (partitioned by month for 1000-device scale)
CREATE TABLE IF NOT EXISTS device_metrics (
  id BIGSERIAL,
  device_id TEXT REFERENCES devices(id),
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  hash_rate FLOAT,
  temp FLOAT,
  power FLOAT,
  shares_accepted INT,
  shares_rejected INT,
  frequency INT,
  core_voltage INT,
  fan_speed INT,
  fan_rpm INT,
  efficiency FLOAT,
  uptime_seconds INT,
  agent_state TEXT,
  decision_action TEXT,
  decision_reason TEXT,
  PRIMARY KEY (id, timestamp)
) PARTITION BY RANGE (timestamp);

-- Create monthly partitions (auto-create in production via cron)
CREATE TABLE device_metrics_2026_01 PARTITION OF device_metrics
  FOR VALUES FROM ('2026-01-01') TO ('2026-02-01');
CREATE TABLE device_metrics_2026_02 PARTITION OF device_metrics
  FOR VALUES FROM ('2026-02-01') TO ('2026-03-01');
CREATE TABLE device_metrics_2026_03 PARTITION OF device_metrics
  FOR VALUES FROM ('2026-03-01') TO ('2026-04-01');
CREATE TABLE device_metrics_2026_04 PARTITION OF device_metrics
  FOR VALUES FROM ('2026-04-01') TO ('2026-05-01');

-- TamaGOchi pet state
CREATE TABLE IF NOT EXISTS pet_state (
  device_id TEXT PRIMARY KEY REFERENCES devices(id),
  name TEXT,
  stage TEXT DEFAULT 'egg',
  mood TEXT DEFAULT 'neutral',
  mood_score FLOAT DEFAULT 0,
  total_shares INT DEFAULT 0,
  total_rejected INT DEFAULT 0,
  accept_rate FLOAT DEFAULT 0,
  avg_hash_rate FLOAT DEFAULT 0,
  avg_temp FLOAT DEFAULT 0,
  total_uptime_sec INT DEFAULT 0,
  born_at TIMESTAMPTZ DEFAULT NOW(),
  evolved_at TIMESTAMPTZ,
  feed_count BIGINT DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Alerts log
CREATE TABLE IF NOT EXISTS alerts (
  id BIGSERIAL PRIMARY KEY,
  device_id TEXT REFERENCES devices(id),
  severity TEXT NOT NULL,           -- info, warning, critical
  action TEXT NOT NULL,
  reason TEXT NOT NULL,
  acknowledged BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Swarm intelligence: shared trading signals
CREATE TABLE IF NOT EXISTS swarm_signals (
  id BIGSERIAL PRIMARY KEY,
  device_id TEXT REFERENCES devices(id),
  signal_type TEXT,                  -- trade_signal, learned_pattern
  payload JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Indexes for query performance at scale ───

CREATE INDEX idx_metrics_device_time ON device_metrics (device_id, timestamp DESC);
CREATE INDEX idx_metrics_time ON device_metrics (timestamp DESC);
CREATE INDEX idx_alerts_device ON alerts (device_id, created_at DESC);
CREATE INDEX idx_devices_owner ON devices (owner_id);
CREATE INDEX idx_swarm_recent ON swarm_signals (created_at DESC);

-- ─── Row Level Security ───

ALTER TABLE devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE device_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE pet_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;

-- Owner can see their own devices
CREATE POLICY owner_devices ON devices
  FOR ALL USING (owner_id = auth.uid());

CREATE POLICY owner_metrics ON device_metrics
  FOR ALL USING (device_id IN (
    SELECT id FROM devices WHERE owner_id = auth.uid()
  ));

CREATE POLICY owner_pets ON pet_state
  FOR ALL USING (device_id IN (
    SELECT id FROM devices WHERE owner_id = auth.uid()
  ));

CREATE POLICY owner_alerts ON alerts
  FOR ALL USING (device_id IN (
    SELECT id FROM devices WHERE owner_id = auth.uid()
  ));

-- ─── Realtime subscriptions ───

ALTER PUBLICATION supabase_realtime ADD TABLE device_metrics;
ALTER PUBLICATION supabase_realtime ADD TABLE pet_state;
ALTER PUBLICATION supabase_realtime ADD TABLE alerts;
