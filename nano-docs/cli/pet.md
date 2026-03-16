---
summary: "Current TamaGOchi CLI surface"
title: "pet"
---

# `nanosolana pet`

The current CLI exposes a single `nanosolana pet` command that prints the current pet state.

```bash
nanosolana pet
```

Example output:

```text
🐹 NanoSolana  😊

📊 Stage: juvenile · Level 1 · XP 0
😊 Mood: happy
⚡ Energy: ⚡⚡⚡⚡⚡⚡⚡⚡⚡⚡
🍽️  Hunger: 🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢

📈 Trades: 0 · Win Rate: 0%
💰 Balance: 0.0000 SOL
📊 Total PnL: +0.0000 SOL
🔥 Streak: +0
⏱️  Age: 0m · Uptime: 0h
```

The richer `pet status/feed/evolve/history` tree described in some older docs is not part of the current published CLI.

## Evolution stages

Current stage model in `nano-core/src/pet/tamagochi.ts`:

| Stage | Meaning |
|-------|---------|
| 🥚 Egg | First boot, no wallet yet |
| 🦐 Larva | Wallet created, no meaningful trade history yet |
| 🐹 Juvenile | 10+ trades completed |
| 🐹 Adult | 50+ trades and stable win rate |
| 👑 Alpha | 200+ trades, profitable, stronger win rate |
| 💀 Ghost | Wallet drained or offline for too long |

## Mood effects

Current mood set in `nano-core/src/pet/tamagochi.ts`:

| Mood | Meaning |
|------|---------|
| `ecstatic` | strongest positive state |
| `happy` | profitable or improving |
| `neutral` | baseline state |
| `anxious` | stress from losses or low resources |
| `sad` | prolonged weak performance |
| `sleeping` | inactive / low-activity state |
| `hungry` | hunger-driven degraded state |

## Related commands

- `nanosolana birth`
- `nanosolana go`
- `nanosolana status`
- `nanosolana run`

## Heartbeat tie-in

The runtime heartbeat line includes the current TamaGOchi mood emoji. See
[Heartbeat](/gateway/heartbeat) for the gateway-facing heartbeat model.
