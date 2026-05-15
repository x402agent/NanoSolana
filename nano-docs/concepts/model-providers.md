---
summary: "Solana Clawd Go model providers and AI integration"
title: "Model Providers"
---

# Model providers

Solana Clawd Go uses **OpenRouter** as its primary AI gateway, with the `healer-alpha`
model as the default. The architecture supports multiple providers.

## Default: OpenRouter + healer-alpha

```json5
{
  ai: {
    provider: "openrouter",
    baseUrl: "https://openrouter.ai/api/v1",
    model: "openrouter/healer-alpha",
    apiKey: "env:OPENROUTER_API_KEY",
  }
}
```

### Multimodal capabilities

The `healer-alpha` model supports:
- **Text**: Trading analysis, reasoning, chat.
- **Image**: Chart analysis, screenshot review.
- **Audio**: Voice command processing.
- **Video**: Market broadcast analysis.

### OODA methods

The AI provider exposes structured methods for the OODA loop:

```typescript
const ai = new AIProvider(config);

// Orient — market analysis
const analysis = await ai.orient(marketData);

// Decide — structured trade decision
const decision = await ai.decide(analysis, walletState);

// Research — deep-dive investigation
const findings = await ai.research("Is SOL correlated with BTC?");

// Chat — conversational interaction
const reply = await ai.agentChat("What's my portfolio looking like?");
```

## Supported providers

| Provider | Status | Notes |
|----------|--------|-------|
| **OpenRouter** | ✅ Default | healer-alpha, Clawd, GPT-5, Gemini |
| **OpenAI** | ✅ Supported | GPT-5.2, Codex |
| **Anthropic** | ✅ Supported | Clawd Opus 4, Sonnet |
| **Google** | ✅ Supported | Gemini 2.5 Pro |
| **Local (Ollama)** | ⚡ Experimental | For offline operation |

## Configuration

Current configuration is driven by environment variables and the encrypted vault loader:

```env
OPENROUTER_API_KEY=...
OPENROUTER_MODEL=openrouter/healer-alpha
AI_PROVIDER=openrouter
AI_MODEL=openrouter/healer-alpha
```

## Model failover

If the primary model fails, Solana Clawd Go can fall back:

```json5
{
  ai: {
    provider: "openrouter",
    model: "openrouter/healer-alpha",
    fallbacks: [
      "anthropic/clawd-sonnet-4-20250514",
      "openai/gpt-4o"
    ]
  }
}
```

## Cost management

- shorter runtime loops and frequent external calls increase model spend
- `scg demo` is the cheapest way to exercise the flow without live keys
- keep provider guidance aligned with the current env- and vault-based runtime configuration
