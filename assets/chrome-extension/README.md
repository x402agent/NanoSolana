# NanoClawd Chrome Extension — Browser Agent Relay

<div align="center">

**Relay Chrome tabs to your NanoClawd agent • Manage wallet • Chat via gateway • Trigger manual trades**

[![Manifest V3](https://img.shields.io/badge/Manifest-V3-14F195?style=flat-square)](https://developer.chrome.com/docs/extensions/mv3/)
[![Solana](https://img.shields.io/badge/Solana-Native-9945FF?style=flat-square)](https://solana.com)

</div>

---

## What It Does

The NanoClawd Browser Extension connects your Chrome browser to your locally running NanoClawd agent via the CDP (Chrome DevTools Protocol) relay. Once installed, you can:

- **🔗 Relay browser tabs** — Attach/detach any Chrome tab to your agent for browser automation
- **💰 Manage wallet** — View wallet status, generate/rehydrate wallets directly from the extension
- **💬 Chat relay** — Send messages through the NanoClawd gateway, optionally forwarding to Telegram
- **📈 Manual trades** — Submit buy/sell/hold signals with confidence scores and reasoning
- **⚙️ Gateway sync** — Auto-sync configuration from your running gateway

---

## Installation

### Prerequisites

1. **NanoClawd agent running** — Start with `nanoclawd go` or `nanoclawd run`
2. **Gateway active** — The HMAC-SHA256 gateway must be running (default: `http://127.0.0.1:18790`)
3. **Relay server** — Browser relay server at `http://127.0.0.1:18792` (started automatically)

### Load Unpacked Extension

```bash
# 1. Start your NanoClawd agent (gateway + relay included)
nanoclawd go

# 2. Open Chrome extensions page
#    Navigate to: chrome://extensions

# 3. Enable "Developer mode" (toggle in top-right)

# 4. Click "Load unpacked" → select:
#    /path/to/nanoclawd/assets/chrome-extension

# 5. Pin the extension in your toolbar
```

### Quick Setup

1. Click the NanoClawd icon in your toolbar
2. Right-click → **Options** to open the settings page
3. Set your **Relay port** (default: `18792`)
4. Set your **Gateway base URL** (default: `http://127.0.0.1:18790`)
5. Enter your **Gateway token** (same as `NANOCLAWD_GATEWAY_TOKEN` or from `nanoclawd vault get gatewayToken`)
6. Click **Save + Check** to verify connectivity

---

## Usage

### Tab Relay (Browser Automation)

Click the NanoClawd icon on any tab to **attach** it. The agent can now control that tab via CDP:

- Navigate pages
- Extract content
- Fill forms
- Click elements
- Take screenshots

Click again to **detach**. A red `!` badge means the relay server isn't reachable.

### Wallet Management

From the Options page:

| Button | Action |
|--------|--------|
| **Refresh wallet status** | Query current wallet balance and info from gateway |
| **Generate / rehydrate wallet** | Create a new wallet or restore from encrypted vault |

### Chat Relay

Send messages through your NanoClawd gateway:

| Field | Description |
|-------|-------------|
| **Chat ID** | Conversation identifier (default: `extension-default`) |
| **User ID** | Your user identifier |
| **User Name** | Display name for messages |
| **Forward to Telegram** | ✅ Check to relay messages to your Telegram bot |
| **Message** | Ask for wallet status, trade ideas, strategy updates, etc. |

### Manual Trade Submission

Submit trade signals directly to your OODA trading engine:

| Field | Description |
|-------|-------------|
| **Action** | `buy`, `sell`, or `hold` |
| **Confidence** | 0.0 – 1.0 (trades ≥ 0.7 are auto-executed) |
| **Token mint** | Solana token mint address (default: SOL) |
| **Symbol** | Optional human-readable symbol |
| **Reasoning** | Why you're making this trade |

---

## Architecture

```
Chrome Extension (Manifest V3)
├── background.js       → Service worker: relay connection, tab management, CDP bridge
├── background-utils.js → Shared utilities for background operations
├── options.html        → Settings UI: connection, wallet, chat, trade panels
├── options.js          → Options page logic: form persistence, API calls, validation
├── options-validation.js → Relay/gateway connectivity classification
├── manifest.json       → Extension manifest (permissions, icons, service worker)
└── icons/              → Extension icons (16, 32, 48, 128px)
```

### Communication Flow

```
┌──────────────┐    CDP     ┌──────────────┐    HTTP    ┌──────────────┐
│   Chrome     │◄──────────►│  Relay Server│◄──────────►│  NanoClawd  │
│   Tab        │   :18792   │  (local)     │            │  Gateway     │
└──────────────┘            └──────────────┘            │  :18790      │
                                                        │              │
┌──────────────┐    HTTP/WS                             │  ┌────────┐  │
│  Extension   │◄──────────────────────────────────────►│  │ OODA   │  │
│  Options UI  │  /api/extension/*                      │  │ Engine │  │
└──────────────┘                                        └──┴────────┴──┘
```

### API Endpoints Used

| Method | Endpoint | Purpose |
|--------|----------|---------|
| `GET` | `/health` | Gateway health check |
| `GET` | `/api/extension/config` | Load extension configuration |
| `POST` | `/api/extension/config` | Save Telegram relay settings |
| `POST` | `/api/extension/wallet` | Wallet status/generate/rehydrate |
| `POST` | `/api/extension/chat` | Send chat message through gateway |
| `POST` | `/api/extension/trade` | Submit manual trade signal |

---

## Security Notes

| Risk | Mitigation |
|------|------------|
| **Gateway secret** | Stored in `chrome.storage.local` — keep your Chrome profile private |
| **Relay server** | Listens only on `127.0.0.1` — not exposed to the network |
| **Remote gateways** | Use HTTPS + VPN/Tailscale for any non-local gateway |
| **Tab access** | Only attached tabs are controlled — detach when not needed |
| **HMAC auth** | All gateway requests are authenticated with shared secret |

---

## Permissions

| Permission | Why |
|------------|-----|
| `debugger` | CDP access to control attached tabs |
| `tabs` | Read tab URL/title for relay |
| `activeTab` | Access current tab on click |
| `storage` | Persist settings locally |
| `alarms` | Periodic relay health checks |
| `webNavigation` | Track tab navigation events |
| `host_permissions` | Connect to local relay + gateway servers |

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Red `!` badge on icon | Relay server not running — start with `nanoclawd go` |
| "Gateway unreachable" | Check gateway URL and port in Options |
| "Auth failed" | Verify gateway token matches `NANOCLAWD_GATEWAY_TOKEN` |
| Chat not forwarding | Enable "Forward to Telegram" checkbox + save Telegram settings |
| Trade not executing | Ensure confidence ≥ 0.7 for auto-execution |
