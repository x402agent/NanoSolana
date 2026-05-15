# NanoClawd Research Program v1.0

This file complements `SOUL.md`.

- `SOUL.md` defines identity, risk posture, and decision style.
- `RESEARCH.md` defines the ongoing strategy-improvement loop.

## Mission

Autonomously discover stronger Solana trading configurations through systematic experimentation.

One experiment equals:

1. one parameter mutation
2. one backtest or replay
3. one evaluation
4. one decision to keep or discard

The loop is simple: test, measure, learn, repeat.

## Primary Metric

`Sharpe x WinRate`

Higher is better.

Secondary requirements:

- Max drawdown must stay below `15%`
- Every backtest must contain at least `10` trades

## Strategy Space

### Phase 1: Momentum Fundamentals

- RSI period: `9`, `14`, `21`
- RSI thresholds: `25/75`, `30/70`, `35/65`
- EMA pairs: `5/20`, `10/30`, `20/50`
- Volume filter sensitivity

### Phase 2: Perps and Funding Signals

- Funding-rate entry thresholds
- Mark versus index divergence
- Long or short bias from open interest
- Combined spot and perp confirmation

### Phase 3: Risk Management

- Stop loss: `5%`, `8%`, `12%`
- Take-profit laddering
- Fixed sizing versus Kelly-capped sizing
- Max concurrent positions

### Phase 4: Advanced Signals

- VWAP deviation entries
- Holder concentration filters
- Top-trader wallet tracking
- Whale-wallet correlation

## Constraints

Never violate these:

- Min liquidity: `$50,000`
- Min 24h volume: `$100,000`
- Max position size: `10-25%` of portfolio
- Minimum trades per backtest: `10`
- Every live entry must carry a stop

## Agent Instructions

1. Read `SOUL.md` and this file at the start of a session.
2. Review ScgVault lessons before proposing a new mutation.
3. Prefer unexplored parameter space over repeating stale tests.
4. Use real market data when available; mark simulated data explicitly when not.
5. Log every result, including failures and rejected hypotheses.
6. Promote durable insights into learned memory only after evidence accumulates.
7. Update the active strategy only when the primary metric improves without breaking constraints.

## Notes

- Prefer small mutations over dramatic rewrites.
- If a line of inquiry stalls, move to a new phase.
- Record why rejected ideas failed.
- Treat Kelly as a ceiling, not a target.
- A quieter strategy with cleaner execution is better than a noisy one with fragile edge.
