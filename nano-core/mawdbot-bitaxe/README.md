# 🦞 MawdAxe — The Autonomous Solana Mining TamaGOchi

> **MawdBot × Bitaxe × OpenClaw**
> One binary. One command. Autonomous Bitcoin mining with a soul.

```
 ███╗   ███╗ █████╗ ██╗    ██╗██████╗  █████╗ ██╗  ██╗███████╗
 ████╗ ████║██╔══██╗██║    ██║██╔══██╗██╔══██╗╚██╗██╔╝██╔════╝
 ██╔████╔██║███████║██║ █╗ ██║██║  ██║███████║ ╚███╔╝ █████╗
 ██║╚██╔╝██║██╔══██║██║███╗██║██║  ██║██╔══██║ ██╔██╗ ██╔══╝
 ██║ ╚═╝ ██║██║  ██║╚███╔███╔╝██████╔╝██║  ██║██╔╝ ██╗███████╗
 ╚═╝     ╚═╝╚═╝  ╚═╝ ╚══╝╚══╝ ╚═════╝ ╚═╝  ╚═╝╚═╝  ╚═╝╚══════╝
```

MawdAxe is a pure Go autonomous agent that manages Bitaxe Bitcoin miners using an OODA (Observe-Orient-Decide-Act) execution loop, a TamaGOchi virtual pet that evolves based on mining performance, and swarm intelligence via the OpenClaw mesh network over Tailscale.

**Built for the NanoClawd ecosystem. Open source forever.**

---

## What It Does

MawdAxe turns your Bitaxe Gamma into an autonomous mining node with:

- **OODA Execution Loop** — Continuously monitors hashrate, temperature, power, and share rates. Makes real-time decisions to optimize performance.
- **Auto-Tuning** — Dynamically adjusts ASIC frequency and fan speed based on thermal conditions and the Gamma's upgraded PCB capacity for aggressive overclocking.
- **TamaGOchi Virtual Pet** — Your miner is alive. It evolves from Egg → Larva → Juvenile → Adult → Alpha based on share count and accept rate. Mood is driven by PnL and streaks.
- **Fleet Management** — Scale from 1 device at home to 1,000 in a mining farm. REST API + Server-Sent Events for real-time dashboards.
- **Hardware Feedback** — Arduino Modulino I2C integration for RGB LED status, buzzer alerts, physical buttons, and tilt-sensor TamaGOchi interactions.
- **Swarm Intelligence** — Connect to the OpenClaw mesh via Tailscale. Agents share learned patterns and trade signals while keeping wallet keys cryptographically isolated.
- **x402 API Monetization** — Expose fleet stats as paywalled API endpoints using HTTP 402 + USDC micropayments on Solana.

---

## Specs

| Metric | Value |
|--------|-------|
| Binary Size | ~9.6 MB |
| RAM Footprint | < 10 MB |
| Boot Time | 1 second |
| Language | Pure Go (CGO_ENABLED=0) |
| Target Hardware | NVIDIA Orin Nano, Raspberry Pi, x86_64, RISC-V |
| OODA Cycle | 10s default (configurable) |
| Fleet Capacity | 1,000+ devices |

---

## One-Shot Setup

### Quick Start (Single Device)

```bash
# 1. Set your Bitaxe IP and BTC address
export BITAXE_IP=192.168.1.42
export POOL_USER=bc1qYOUR_BTC_ADDRESS

# 2. Run
go run ./cmd/mawdaxe/
```

### Auto-Discovery Setup

```bash
chmod +x scripts/setup.sh
./setup.sh
```

This will:
1. Detect your platform (Linux/macOS/ARM64/RISC-V)
2. Scan your network for Bitaxe devices
3. Generate config
4. Build the binary
5. Install as a system service
6. Start mining autonomously

### Docker (Any Platform)

```bash
cp .env.example .env
# Edit .env with your Bitaxe IP and BTC address
docker compose up -d
```

### Docker for Orin Nano (ARM64)

```bash
docker build --build-arg GOARCH=arm64 -t mawdaxe:arm64 .
docker run -e BITAXE_IP=192.168.1.42 --network host mawdaxe:arm64
```

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    MawdAxe Binary                        │
│                                                          │
│  ┌──────────┐   ┌──────────┐   ┌──────────────────┐    │
│  │  AxeOS   │   │  OODA    │   │   TamaGOchi      │    │
│  │  Client   │──▶│  Agent   │──▶│   Pet Engine     │    │
│  │  (HTTP)   │   │  Loop    │   │   (Evolution)    │    │
│  └──────────┘   └────┬─────┘   └──────────────────┘    │
│                      │                                   │
│  ┌──────────┐   ┌────▼─────┐   ┌──────────────────┐    │
│  │ Hardware  │   │  Fleet   │   │   x402 Payment   │    │
│  │ Modulino  │   │  Manager │   │   Facilitator    │    │
│  │  (I2C)    │   │  (API)   │   │   (USDC)         │    │
│  └──────────┘   └──────────┘   └──────────────────┘    │
│                                                          │
│  ┌──────────────────────────────────────────────────┐   │
│  │          Tailscale Mesh / OpenClaw Network        │   │
│  │   [Swarm Signals] [Learned Patterns] [Keys Isolated]│
│  └──────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
          │                    │
          ▼                    ▼
  ┌──────────────┐   ┌────────────────┐
  │  Bitaxe Gamma│   │  Supabase      │
  │  (AxeOS API) │   │  (Fleet DB)    │
  │  BM1370 ASIC │   │  (Realtime)    │
  └──────────────┘   └────────────────┘
```

### OODA Loop Detail

```
OBSERVE ──▶ ORIENT ──▶ DECIDE ──▶ ACT
   │            │           │         │
   │ Poll       │ Compare   │ Rules:  │ Execute:
   │ AxeOS      │ against   │ temp    │ PATCH freq
   │ /api/      │ history   │ shares  │ Set fan
   │ system/    │ & moving  │ hash    │ Restart
   │ info       │ averages  │ reject  │ Alert
   │            │           │         │
   └────────────┴───────────┴─────────┘
         Cycle: every 10 seconds
```

### TamaGOchi Evolution

```
🥚 Egg ─────▶ 🦐 Larva ─────▶ 🦞 Juvenile ─────▶ 🦞 Adult ─────▶ 👑 Alpha
(boot)      (first share)   (10+ shares)      (50+ shares   (200+ shares
                                                >90% accept)  >95% accept)
                                    │
                                    ▼
                              💀 Ghost
                           (offline >24h)
```

Mood indicator driven by: temperature, hashrate, reject rate, uptime streaks.

---

## Hardware Build

### Minimum (Software Only)
- Bitaxe Gamma (any model with AxeOS)
- Any computer on same LAN (RPi, laptop, Orin Nano)

### Full MawdBot Build
- **Bitaxe Gamma** — BM1370 ASIC miner with El Mirage heatsink
- **NVIDIA Orin Nano** — Edge compute for the MawdAxe agent
- **Arduino Modulino** sensors via I2C:
  - Pixels (RGB LED strip) — mining status, mood colors
  - Buzzer — share alerts, evolution fanfare
  - Buttons — manual override (pause/resume mining)
  - Knob — fan speed / frequency adjustment
  - Movement (IMU) — tilt interactions for TamaGOchi
  - Thermo — ambient temp for thermal management
- **3D-printed MawdBot enclosure** (orange/black cyberpunk shell)
- **TFT display** — pixel art TamaGOchi + stats overlay

### Wiring (I2C)

```
Orin Nano Pin 3 (SDA) ──── Modulino SDA (daisy-chain all modules)
Orin Nano Pin 5 (SCL) ──── Modulino SCL (daisy-chain all modules)
Orin Nano Pin 1 (3.3V) ─── Modulino VCC
Orin Nano Pin 6 (GND) ──── Modulino GND
```

---

## Configuration

### Environment Variables

```bash
# Required
BITAXE_IP=192.168.1.42          # Single device
POOL_USER=bc1qYOUR_ADDRESS       # BTC payout address

# Optional: Multi-device
MAWDAXE_DEVICES=192.168.1.42,192.168.1.43,192.168.1.44

# Optional: API
MAWDAXE_API_PORT=8420
MAWDAXE_API_KEY=your-secret-key

# Optional: Fleet DB
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-anon-key

# Optional: Alerts
MAWDAXE_WEBHOOK_URL=https://discord.com/api/webhooks/...

# Optional: Mesh Network
TAILSCALE_ENABLED=true
TAILSCALE_AUTH_KEY=tskey-auth-xxx
```

### JSON Config

```json
{
  "apiPort": 8420,
  "devices": [
    {
      "deviceId": "mawdaxe-001",
      "bitaxeIp": "192.168.1.42",
      "pollIntervalSec": 10,
      "maxTempC": 72,
      "warnTempC": 65,
      "coolTempC": 50,
      "maxFreqMHz": 600,
      "autoTune": true,
      "poolUrl": "public-pool.io",
      "poolPort": 21496,
      "poolUser": "bc1qYOUR_ADDRESS"
    }
  ]
}
```

---

## API Reference

### Fleet Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check (no auth) |
| GET | `/api/fleet` | Full fleet snapshot |
| GET | `/api/fleet/devices` | All device states |
| GET | `/api/fleet/device/{id}` | Single device detail + pet |
| POST | `/api/fleet/device/add` | Add device at runtime |
| DELETE | `/api/fleet/device/remove/{id}` | Remove device |
| GET | `/ws` | Server-Sent Events (live updates) |

### Response: Fleet Snapshot

```json
{
  "totalDevices": 3,
  "onlineDevices": 3,
  "totalHashRate": 1847.5,
  "avgTemp": 52.3,
  "totalPower": 48.6,
  "totalShares": 4821,
  "devices": [
    {
      "id": "mawdaxe-001",
      "ip": "192.168.1.42",
      "state": "running",
      "health": "healthy",
      "hashRate": 623.4,
      "temp": 51.2,
      "pet": {
        "stage": "adult",
        "mood": "happy",
        "moodScore": 0.72,
        "totalShares": 1847
      }
    }
  ]
}
```

---

## Scaling

### 1-10 Devices (Home Miner)
- Single `mawdaxe` binary
- SQLite or in-memory state
- `MAWDAXE_DEVICES=ip1,ip2,...`

### 10-100 Devices (Small Farm)
- Docker Compose
- Supabase for persistence + realtime
- Discord/Telegram alerts

### 100-1000 Devices (Fleet Operator)
- `docker compose --profile mesh --profile monitoring up`
- Supabase with partitioned time-series tables
- Prometheus + Grafana monitoring
- Tailscale mesh for multi-site coordination
- x402 API monetization for external access

---

## Cross-Compilation

```bash
# All platforms at once
make build-all

# Individual targets
make build-linux-amd64    # Standard Linux
make build-linux-arm64    # Orin Nano, RPi 4/5
make build-linux-riscv64  # RISC-V boards
make build-darwin-arm64   # macOS Apple Silicon
```

---

## Project Structure

```
mawdbot-bitaxe/
├── cmd/mawdaxe/           # Main binary entry point
│   └── main.go
├── internal/
│   ├── axeos/             # AxeOS REST API client
│   │   └── client.go      # GET /info, /statistics, PATCH /system
│   ├── agent/             # OODA loop agent
│   │   └── agent.go       # Observe → Orient → Decide → Act
│   ├── tamagochi/         # Virtual pet system
│   │   └── pet.go         # Evolution stages, mood engine
│   ├── fleet/             # Multi-device orchestration
│   │   └── manager.go     # Agent lifecycle, snapshots
│   ├── config/            # Configuration management
│   │   └── config.go      # Env + JSON + defaults
│   ├── hardware/          # Arduino Modulino I2C
│   │   └── modulino.go    # Pixels, buzzer, buttons, sensors
│   └── x402/              # Payment protocol
│       └── facilitator.go # HTTP 402 USDC micropayments
├── api/                   # HTTP server
│   └── server.go          # REST + SSE + CORS + auth
├── migrations/            # Supabase schema
│   └── 001_fleet_schema.sql
├── scripts/
│   └── setup.sh           # One-shot auto-setup
├── web/                   # Dashboard static files
├── Dockerfile             # Multi-stage scratch build
├── docker-compose.yml     # Fleet infrastructure
├── Makefile               # Build targets
├── .env.example           # Configuration template
└── README.md              # This file
```

---

## OpenClaw Network

MawdAxe nodes can join the OpenClaw mesh network via Tailscale:

```
┌──────────┐      Tailscale VPN       ┌──────────┐
│ Node A   │◄────────────────────────▶│ Node B   │
│ 3 Bitaxe │   Trade Signals          │ 2 Bitaxe │
│ Alpha Pet│   Learned Patterns       │ Adult Pet │
│ Keys 🔒  │   Keys Isolated          │ Keys 🔒  │
└──────────┘                          └──────────┘
      ▲                                     ▲
      │            Tailscale VPN            │
      └─────────────┐     ┌────────────────┘
                    ▼     ▼
               ┌──────────┐
               │ Node C   │
               │ 1 Bitaxe │
               │ Larva Pet│
               │ Keys 🔒  │
               └──────────┘
```

**Shared**: Trading signals, learned mining patterns, performance benchmarks
**Isolated**: Wallet keys, API credentials, private configuration

---

## License

Open source forever. Built with Go on Solana by NanoClawd Labs / 8BIT Labs.

**@mawdbot on X** | **Created by @Ordlibrary**
