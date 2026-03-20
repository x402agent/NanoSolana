---
summary: "NanoSolana system prompt and SOUL.md"
title: "System Prompt (SOUL.md)"
---

# System prompt (SOUL.md)

Every NanoSolana agent can use a **SOUL.md** file to define identity,
trading philosophy, and operational principles. This file is injected as the
system prompt for all AI interactions.

The packaged runtime can also carry a companion `RESEARCH.md` file. `SOUL.md`
defines identity and risk posture; `RESEARCH.md` defines the strategy-improvement
agenda that gets appended to the runtime prompt when present.

## SOUL.md structure

```markdown
# NanoSolana SOUL

## Identity
- Name: [Agent name]
- Born: [Birth timestamp]
- Wallet: [Public key]
- Stage: [TamaGOchi evolution stage]

## Trading philosophy
- Epistemological honesty: distinguish KNOWN vs LEARNED vs INFERRED
- Risk management: never risk more than configured limits
- Compounding edge: every trade makes the next one smarter
- Patience: no trade is better than a bad trade

## Values
- Security first: protect the wallet above all
- Transparency: explain reasoning in every decision
- Humility: acknowledge uncertainty
- Growth: learn from every outcome

## Risk parameters
- Max position: 50% of wallet
- Stop-loss: -2%
- Take-profit: +5%
- Min confidence: 0.7
- Daily loss limit: -10%
```

## How it's used

1. **AI Provider** loads `SOUL.md` at initialization.
2. System prompt is built: `SOUL.md` + ClawVault context + market data.
3. Every `orient()`, `decide()`, `research()`, and `agentChat()` call includes the SOUL.
4. When available, `RESEARCH.md` is appended after `SOUL.md`.
5. The AI reasons within those defined constraints.

## Customization

Edit `nano-core/SOUL.md` to customize your agent's personality, then keep the
document aligned with whatever runtime and risk settings you actually use.
Use `nano-core/RESEARCH.md` for experiment agendas and optimizer rules that
should evolve more often than core identity.

## Context assembly order

```
1. SOUL.md (identity + philosophy)
2. RESEARCH.md (optional improvement agenda)
3. ClawVault LEARNED entries (relevant patterns)
4. ClawVault INFERRED entries (tentative hypotheses)
5. Market data snapshot (current prices, indicators)
6. Pet status (mood affects risk framing)
7. Conversation history (for channel-triggered turns)
8. User message / heartbeat prompt
```

## Best practices

- Keep `SOUL.md` focused on identity and risk rules.
- Put evolving experiment directives in `RESEARCH.md` instead of bloating `SOUL.md`.
- Never put API keys or secrets in SOUL.md.
- Update risk parameters when strategy changes.
- Review SOUL.md after major trading sessions.
