---
summary: "Solana Clawd Go strategy mutation loop and research constraints"
title: "Research Program"
---

# Research Program

Solana Clawd Go ships with a separate research loop document in
[`nano-core/RESEARCH.md`](../../nano-core/RESEARCH.md).

Use it for the evolving strategy agenda, not for the runtime's core identity.

## Purpose

The research program tells the agent how to improve:

- mutate one parameter at a time
- backtest or replay it
- evaluate it against clear metrics
- keep the change only if it improves the system

## Primary metric

`Sharpe x WinRate`

Guardrails:

- max drawdown under `15%`
- at least `10` trades per backtest

## Exploration phases

1. momentum fundamentals
2. perps and funding signals
3. risk management
4. advanced wallet and flow signals

## Hard constraints

- minimum liquidity
- minimum 24h volume
- bounded position sizing
- mandatory stops
- explicit logging of failed hypotheses

## Why it is separate from SOUL.md

`SOUL.md` should stay stable enough to define the operator personality and risk
posture.

`RESEARCH.md` should be easier to mutate as the strategy evolves.
