// ── Solana Claude Go — Payment Types ────────────────────────────────────────────────
//
// Type definitions for the tokenized agent payment system.
// Built on @pump-fun/agent-payments-sdk for on-chain invoice payments.
// ─────────────────────────────────────────────────────────────────────────────

import type { PublicKey, TransactionInstruction } from '@solana/web3.js';

// ── Currency ────────────────────────────────────────────────────────────────

/** Supported payment currencies */
export type PaymentCurrency = 'USDC' | 'SOL';

/** Well-known mint addresses for payment currencies */
export const CURRENCY_MINTS: Record<PaymentCurrency, string> = {
  USDC: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
  SOL: 'So11111111111111111111111111111111111111112',
} as const;

/** Decimal precision per currency */
export const CURRENCY_DECIMALS: Record<PaymentCurrency, number> = {
  USDC: 6,
  SOL: 9,
} as const;

// ── Invoice ─────────────────────────────────────────────────────────────────

/** Invoice parameters for creating a payment request */
export interface InvoiceParams {
  /** Payer's wallet public key */
  user: PublicKey;
  /** Payment currency */
  currency: PaymentCurrency;
  /** Amount in the currency's smallest unit (e.g. 1_000_000 = 1 USDC) */
  amount: number;
  /** Unique invoice identifier (auto-generated if omitted) */
  memo?: number;
  /** Invoice validity start (Unix timestamp, defaults to now) */
  startTime?: number;
  /** Invoice validity end (Unix timestamp, defaults to startTime + 1 hour) */
  endTime?: number;
  /** Compute unit limit override (default 100_000) */
  computeUnitLimit?: number;
  /** Priority fee in microlamports per CU (optional) */
  computeUnitPrice?: number;
}

/** A fully resolved invoice ready for payment */
export interface Invoice {
  /** Unique memo identifier */
  memo: number;
  /** Payment amount in smallest unit */
  amount: number;
  /** Currency mint address */
  currencyMint: string;
  /** Currency name */
  currency: PaymentCurrency;
  /** Validity window start (Unix timestamp) */
  startTime: number;
  /** Validity window end (Unix timestamp) */
  endTime: number;
  /** Agent token mint address */
  agentMint: string;
  /** Created at ISO timestamp */
  createdAt: string;
}

/** Result of building payment instructions */
export interface PaymentInstructions {
  /** The invoice metadata */
  invoice: Invoice;
  /** Transaction instructions to be signed by the payer */
  instructions: TransactionInstruction[];
  /** The deterministic Invoice ID PDA */
  invoiceIdPda: PublicKey;
}

// ── Verification ────────────────────────────────────────────────────────────

/** Payment verification result */
export interface PaymentVerification {
  /** Whether the payment was confirmed on-chain */
  paid: boolean;
  /** The invoice that was verified */
  invoice: Invoice;
  /** Number of retry attempts made */
  attempts: number;
  /** Verification timestamp */
  verifiedAt: string;
}

/** Options for payment verification */
export interface VerifyOptions {
  /** Maximum retry attempts (default 3) */
  maxRetries?: number;
  /** Delay between retries in ms (default 2000) */
  retryDelayMs?: number;
}

// ── Payment Config ──────────────────────────────────────────────────────────

/** Configuration for the payment system */
export interface PaymentConfig {
  /** Agent token mint address (from pump.fun) */
  agentTokenMint: string;
  /** Default payment currency */
  defaultCurrency: PaymentCurrency;
  /** Solana RPC URL */
  rpcUrl: string;
  /** Default invoice validity duration in seconds (default 3600 = 1 hour) */
  invoiceValiditySecs: number;
  /** Environment */
  environment: 'mainnet' | 'devnet';
}

/** Invoice tracking record for persistence */
export interface InvoiceRecord {
  /** Unique memo */
  memo: number;
  /** Amount in smallest unit */
  amount: number;
  /** Currency */
  currency: PaymentCurrency;
  /** Currency mint */
  currencyMint: string;
  /** Payer wallet address */
  payer: string;
  /** Start time */
  startTime: number;
  /** End time */
  endTime: number;
  /** Invoice ID PDA */
  invoiceIdPda: string;
  /** Whether payment has been verified */
  paid: boolean;
  /** Created at ISO timestamp */
  createdAt: string;
  /** Paid at ISO timestamp (null if unpaid) */
  paidAt: string | null;
}
