---
summary: "NanoSolana security model — current implementation notes"
title: "Security"
---

# Security

This page describes the security model that exists in the current checkout.

## Threat boundaries

NanoSolana assumes:

- the local host is trusted
- the network is hostile
- wallet material and API keys are high-value secrets
- gateway access must be authenticated

## Secret storage

Secrets are stored in `~/.nanosolana/vault.enc`.

Current implementation details from
[`nano-core/src/config/vault.ts`](../../nano-core/src/config/vault.ts):

- cipher: `AES-256-GCM`
- vault directory permissions: `0700`
- vault file permissions: `0600`
- key derivation: current code derives a 32-byte key by hashing the vault
  password together with a random salt using SHA-256

Important: older docs referenced PBKDF2. That is not what the current code does.

## Wallet handling

- wallet keys are generated and then stored in the encrypted vault
- wallet material is not meant to be logged or shared
- there is no first-class `nanosolana wallet export` command in the current CLI

## Gateway auth

The gateway supports:

- `X-NanoSolana-Secret: ...`
- `Authorization: Bearer ...`
- HMAC-SHA256 authentication for WebSocket clients

Examples:

```bash
curl http://127.0.0.1:18790/health

curl -H "X-NanoSolana-Secret: $NANO_GATEWAY_SECRET" \
  http://127.0.0.1:18790/api/status
```

## Runtime checks you can do today

There is no shipped `nanosolana security audit` command yet. The practical checks
in the current runtime are:

```bash
npx nanosolana config
npx nanosolana status
npx nanosolana docs security
ls -ld ~/.nanosolana
ls -l ~/.nanosolana/vault.enc
```

You should verify:

- `~/.nanosolana` is `0700`
- `~/.nanosolana/vault.enc` is `0600`
- `NANO_GATEWAY_SECRET` is set when exposing authenticated endpoints
- gateway endpoints respond on `18790`, not `18789`

## Payment verification security

The `@pump-fun/agent-payments-sdk` integration adds on-chain payment verification:

- Invoice ID PDAs are derived deterministically from currency, memo, amount, and time window — preventing duplicate payments.
- `validateInvoicePayment` verifies payments on-chain with configurable retry logic.
- Payment amounts are validated in smallest units (lamports for SOL, micro-units for USDC) to prevent rounding exploits.
- The `AGENT_TOKEN_MINT_ADDRESS` and `CURRENCY_MINT` env vars should be treated as configuration secrets and not committed to version control.
- Payment-gated swarm spawning ensures agents cannot be created without verified on-chain payment.

## Operator guidance

1. Keep the gateway behind localhost or Tailscale.
2. Do not commit `.env` files.
3. Do not place secrets in `SOUL.md`, `SKILL.md`, or prompt files.
4. Use integer smallest units for on-chain values.
5. Treat the Pump bridge and NanoHub integrations as additional trust boundaries and review their env vars separately.
