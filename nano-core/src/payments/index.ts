// ── Solana Clawd Go — Payments Module ──────────────────────────────────────────────
//
// Tokenized agent payment system built on @pump-fun/agent-payments-sdk.
// Enables agents to charge users for actions via on-chain invoice payments.
//
// Architecture:
//   ScgPaymentAgent wraps PumpAgent with:
//     - Invoice creation with auto-generated memos
//     - Payment instruction building for USDC and SOL
//     - Server-side verification with retry logic
//     - Invoice tracking and lifecycle management
//     - Currency formatting and conversion helpers
//
// Security:
//   - All verification happens server-side
//   - Private keys never leave the vault
//   - Invoice ID PDAs prevent duplicate payments
//   - Amount validation before any instruction building
// ─────────────────────────────────────────────────────────────────────────────

export { ScgPaymentAgent } from './agent.js';

export type {
  PaymentCurrency,
  Invoice,
  InvoiceParams,
  InvoiceRecord,
  PaymentInstructions,
  PaymentVerification,
  VerifyOptions,
  PaymentConfig,
} from './types.js';

export { CURRENCY_MINTS, CURRENCY_DECIMALS } from './types.js';

// ── Factory ─────────────────────────────────────────────────────────────────

import type { PaymentConfig } from './types.js';
import { ScgPaymentAgent } from './agent.js';

/**
 * Create a ScgPaymentAgent from environment variables.
 * Reads AGENT_TOKEN_MINT_ADDRESS, CURRENCY_MINT, SOLANA_RPC_URL.
 */
export function createPaymentAgent(overrides?: Partial<PaymentConfig>): ScgPaymentAgent {
  const agentTokenMint = overrides?.agentTokenMint ?? process.env.AGENT_TOKEN_MINT_ADDRESS;
  if (!agentTokenMint) {
    throw new Error(
      'AGENT_TOKEN_MINT_ADDRESS is required. Set it in .env or pass agentTokenMint in config.',
    );
  }

  const rpcUrl =
    overrides?.rpcUrl ??
    process.env.SOLANA_RPC_URL ??
    process.env.HELIUS_RPC_URL ??
    'https://api.mainnet-beta.solana.com';

  // Detect currency from CURRENCY_MINT env var
  let defaultCurrency: 'USDC' | 'SOL' = overrides?.defaultCurrency ?? 'USDC';
  const envMint = process.env.CURRENCY_MINT;
  if (envMint === 'So11111111111111111111111111111111111111112') {
    defaultCurrency = 'SOL';
  }

  const config: PaymentConfig = {
    agentTokenMint,
    defaultCurrency,
    rpcUrl,
    invoiceValiditySecs: overrides?.invoiceValiditySecs ?? 3600,
    environment: overrides?.environment ?? 'mainnet',
  };

  return new ScgPaymentAgent(config);
}
