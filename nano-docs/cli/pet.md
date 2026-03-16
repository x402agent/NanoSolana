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
🐾 TamaGOchi Status
━━━━━━━━━━━━━━━━━━
  Name:     NanoLobster
  Stage:    Juvenile ⟶ Adult (83%)
  Mood:     Happy 😊
  Hunger:   35% ████░░░░░░
  Health:   92% █████████░
  Age:      12 days
  Trades:   47 (68% win rate)
```

The richer `pet status/feed/evolve/history` tree described in some older docs is not part of the current published CLI.

## Evolution stages

| Stage | Requirement | Risk modifier |
|-------|-------------|---------------|
| 🥚 Egg | Birth | Trading disabled |
| 🐛 Larva | 1 day alive | -20% position |
| 🐣 Juvenile | 5 trades | -10% position |
| 🦞 Adult | 20 trades, >50% win | No modifier |
| 👑 Alpha | 100 trades, >60% win | +10% position |
| 👻 Ghost | Health = 0 | Trading disabled |

## Mood effects

| Mood | Trigger | Risk effect |
|------|---------|-------------|
| Happy | Recent profitable trades | +10% position |
| Content | Normal operation | No change |
| Hungry | Not fed in 24h | -10% position |
| Sad | Recent losses | -15% position |
| Sick | Extended losses or hunger | -30% position |
| Ghost | Health hit 0 | Trading disabled |

## Related commands

- `nanosolana birth`
- `nanosolana go`
- `nanosolana status`
