---
summary: "Wallet flows exposed by the current NanoSolana CLI"
title: "wallet"
---

# Wallet flows

The current published CLI does not expose a nested `nanosolana wallet ...` tree.
Wallet actions are spread across the main runtime commands instead.

## Current wallet-related commands

```bash
nanosolana birth
nanosolana go
nanosolana status
nanosolana scan [address]
nanosolana register
nanosolana registry
nanosolana pay status
```

## What they cover

- `birth` creates the wallet and prints the public key
- `go` creates the wallet if needed and brings up the runtime
- `status` prints wallet address and current SOL balance
- `scan` snapshots a wallet with Helius
- `register` and `registry` manage the devnet identity NFT view
- `pay status` shows tokenized-agent payment configuration tied to the wallet/runtime

## Payment flows

The wallet is also used for on-chain payment operations:

- `nanosolana pay invoice` creates payment invoices tied to the agent wallet
- `nanosolana pay verify` verifies on-chain invoice payments
- `nanosolana pay status` shows payment configuration
- Supported currencies: USDC and Wrapped SOL

## Security

- Private key stored in AES-256-GCM encrypted vault.
- There is no first-class wallet export command in the current published CLI.
- By default the key stays in `~/.nanosolana/vault.enc`.

## Gateway-adjacent wallet surface

The gateway also exposes:

- `/api/extension/wallet`

That route supports authenticated wallet status for UI and extension flows.

Payment operations also use `AGENT_TOKEN_MINT_ADDRESS` and `CURRENCY_MINT`.
