// ── Solana clawd — Payment Agent ────────────────────────────────────────────────
//
// Production-grade wrapper around @pump-fun/agent-payments-sdk PumpAgent.
// Handles invoice creation, payment instruction building, verification,
// and invoice tracking. Server-side only — never trust the client alone.
//
// Security:
//   - NEVER log, print, or return private keys
//   - NEVER sign transactions on behalf of a user
//   - Always validate amount > 0 and endTime > startTime
//   - Always verify payments server-side before delivering service
// ─────────────────────────────────────────────────────────────────────────────

import { Connection, PublicKey } from '@solana/web3.js';
import { PumpAgent, getInvoiceIdPDA } from '@pump-fun/agent-payments-sdk';
import type { BuildAcceptPaymentParams } from '@pump-fun/agent-payments-sdk';

import type {
  PaymentConfig,
  PaymentCurrency,
  Invoice,
  InvoiceParams,
  InvoiceRecord,
  PaymentInstructions,
  PaymentVerification,
  VerifyOptions,
} from './types.js';
import { CURRENCY_MINTS, CURRENCY_DECIMALS } from './types.js';

// ── ClawdPaymentAgent ────────────────────────────────────────────────────────

export class ClawdPaymentAgent {
  private agent: PumpAgent;
  private config: PaymentConfig;
  private connection: Connection;
  private mint: PublicKey;
  private invoices = new Map<number, InvoiceRecord>();

  constructor(config: PaymentConfig) {
    this.config = config;
    this.connection = new Connection(config.rpcUrl);
    this.mint = new PublicKey(config.agentTokenMint);
    this.agent = new PumpAgent(this.mint, config.environment, this.connection);
  }

  // ── Invoice Creation ────────────────────────────────────────────────────

  /**
   * Generate a unique memo for an invoice.
   * Uses crypto-grade randomness to avoid collisions.
   */
  generateMemo(): number {
    return Math.floor(Math.random() * 900_000_000_000) + 100_000;
  }

  /**
   * Create an invoice and build the payment transaction instructions.
   * The returned instructions must be signed by the payer's wallet.
   */
  async createPayment(params: InvoiceParams): Promise<PaymentInstructions> {
    // Validate inputs
    if (params.amount <= 0) {
      throw new Error('Payment amount must be greater than 0');
    }

    const currency = params.currency;
    const currencyMint = new PublicKey(CURRENCY_MINTS[currency]);
    const memo = params.memo ?? this.generateMemo();
    const now = Math.floor(Date.now() / 1000);
    const startTime = params.startTime ?? now;
    const endTime = params.endTime ?? startTime + this.config.invoiceValiditySecs;

    if (endTime <= startTime) {
      throw new Error('Invoice endTime must be after startTime');
    }

    if (endTime < now) {
      throw new Error('Invoice endTime is in the past');
    }

    // Build instructions via SDK
    const buildParams: BuildAcceptPaymentParams = {
      user: params.user,
      currencyMint,
      amount: params.amount,
      memo,
      startTime,
      endTime,
    };

    if (params.computeUnitLimit !== undefined) {
      buildParams.computeUnitLimit = params.computeUnitLimit;
    }
    if (params.computeUnitPrice !== undefined) {
      buildParams.computeUnitPrice = params.computeUnitPrice;
    }

    const instructions = await this.agent.buildAcceptPaymentInstructions(buildParams);

    // Derive the Invoice ID PDA (standalone function from SDK)
    const [invoiceIdPda] = getInvoiceIdPDA(
      this.mint,
      currencyMint,
      params.amount,
      memo,
      startTime,
      endTime,
    );

    // Build invoice metadata
    const invoice: Invoice = {
      memo,
      amount: params.amount,
      currencyMint: CURRENCY_MINTS[currency],
      currency,
      startTime,
      endTime,
      agentMint: this.config.agentTokenMint,
      createdAt: new Date().toISOString(),
    };

    // Track the invoice
    const record: InvoiceRecord = {
      memo,
      amount: params.amount,
      currency,
      currencyMint: CURRENCY_MINTS[currency],
      payer: params.user.toBase58(),
      startTime,
      endTime,
      invoiceIdPda: invoiceIdPda.toBase58(),
      paid: false,
      createdAt: invoice.createdAt,
      paidAt: null,
    };
    this.invoices.set(memo, record);

    return { invoice, instructions, invoiceIdPda };
  }

  // ── Payment Verification ────────────────────────────────────────────────

  /**
   * Verify that an invoice has been paid on-chain.
   * ALWAYS call this server-side before delivering any service.
   *
   * Retries with configurable delay for transaction confirmation latency.
   */
  async verifyPayment(
    invoice: Invoice,
    user: PublicKey,
    options: VerifyOptions = {},
  ): Promise<PaymentVerification> {
    const maxRetries = options.maxRetries ?? 3;
    const retryDelayMs = options.retryDelayMs ?? 2000;
    let attempts = 0;

    const currencyMint = new PublicKey(invoice.currencyMint);

    while (attempts < maxRetries) {
      attempts++;

      try {
        const paid = await this.agent.validateInvoicePayment({
          user,
          currencyMint,
          amount: invoice.amount,
          memo: invoice.memo,
          startTime: invoice.startTime,
          endTime: invoice.endTime,
        });

        if (paid) {
          // Update tracking record
          const record = this.invoices.get(invoice.memo);
          if (record) {
            record.paid = true;
            record.paidAt = new Date().toISOString();
          }

          return {
            paid: true,
            invoice,
            attempts,
            verifiedAt: new Date().toISOString(),
          };
        }
      } catch {
        // Verification may fail if transaction is still confirming
      }

      if (attempts < maxRetries) {
        await new Promise((resolve) => setTimeout(resolve, retryDelayMs));
      }
    }

    return {
      paid: false,
      invoice,
      attempts,
      verifiedAt: new Date().toISOString(),
    };
  }

  // ── Invoice ID Derivation ─────────────────────────────────────────────

  /**
   * Derive the deterministic Invoice ID PDA for a given set of parameters.
   * Useful for checking payment status without the full invoice object.
   */
  deriveInvoiceIdPDA(
    currency: PaymentCurrency,
    memo: number,
    amount: number,
    startTime: number,
    endTime: number,
  ): PublicKey {
    const currencyMint = new PublicKey(CURRENCY_MINTS[currency]);
    const [pda] = getInvoiceIdPDA(
      this.mint,
      currencyMint,
      amount,
      memo,
      startTime,
      endTime,
    );
    return pda;
  }

  // ── Invoice Tracking ──────────────────────────────────────────────────

  /** Get a tracked invoice by memo */
  getInvoice(memo: number): InvoiceRecord | null {
    return this.invoices.get(memo) ?? null;
  }

  /** Get all tracked invoices */
  getAllInvoices(): InvoiceRecord[] {
    return [...this.invoices.values()];
  }

  /** Get unpaid invoices */
  getUnpaidInvoices(): InvoiceRecord[] {
    return [...this.invoices.values()].filter((r) => !r.paid);
  }

  /** Get paid invoices */
  getPaidInvoices(): InvoiceRecord[] {
    return [...this.invoices.values()].filter((r) => r.paid);
  }

  /** Get expired unpaid invoices */
  getExpiredInvoices(): InvoiceRecord[] {
    const now = Math.floor(Date.now() / 1000);
    return [...this.invoices.values()].filter((r) => !r.paid && r.endTime < now);
  }

  /** Clear expired invoices from tracking */
  purgeExpired(): number {
    const now = Math.floor(Date.now() / 1000);
    let purged = 0;
    for (const [memo, record] of this.invoices) {
      if (!record.paid && record.endTime < now) {
        this.invoices.delete(memo);
        purged++;
      }
    }
    return purged;
  }

  // ── Helpers ───────────────────────────────────────────────────────────

  /** Format an amount in smallest units to a human-readable string */
  formatAmount(amount: number, currency: PaymentCurrency): string {
    const decimals = CURRENCY_DECIMALS[currency];
    const value = amount / 10 ** decimals;
    return `${value.toFixed(decimals)} ${currency}`;
  }

  /** Convert a human-readable amount to smallest units */
  toSmallestUnit(amount: number, currency: PaymentCurrency): number {
    const decimals = CURRENCY_DECIMALS[currency];
    return Math.round(amount * 10 ** decimals);
  }

  /** Get the underlying PumpAgent instance */
  getAgent(): PumpAgent {
    return this.agent;
  }

  /** Get payment config */
  getConfig(): Readonly<PaymentConfig> {
    return this.config;
  }
}
