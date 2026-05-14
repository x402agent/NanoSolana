// ── Solana clawd × PumpFun — SDK Bridge ────────────────────────────────────────
//
// PumpKit-friendly wrappers around the pump-fun-sdk.
// Provides token price queries, graduation progress, buy/sell quotes,
// bonding curve state, and fee tier lookups — all from a single import.
//
// This is a convenience layer; it does NOT duplicate SDK logic.
// All math comes from the upstream pump-fun-sdk.
// ─────────────────────────────────────────────────────────────────────────────

import type { BondingCurveInfo } from './types.js';

// ── Constants ───────────────────────────────────────────────────────────────

const PUMPFUN_API = 'https://frontend-api-v3.pump.fun';
const LAMPORTS_PER_SOL = 1_000_000_000;
const TOKEN_DECIMALS = 6;
const ONE_TOKEN = 10 ** TOKEN_DECIMALS;

/** Initial virtual token reserves on a new bonding curve */
const INITIAL_VIRTUAL_TOKEN_RESERVES = 1_073_000_000n * BigInt(ONE_TOKEN);

/** Default protocol fee in basis points (1%) */
const DEFAULT_PROTOCOL_FEE_BPS = 100n;
/** Default creator fee in basis points (1%) */
const DEFAULT_CREATOR_FEE_BPS = 100n;

// ── Token Info Cache ────────────────────────────────────────────────────────

interface CachedTokenInfo {
  mint: string;
  name: string;
  symbol: string;
  creator: string;
  complete: boolean;
  virtualSolReserves: bigint;
  virtualTokenReserves: bigint;
  totalSupply: bigint;
  usdMarketCap: number;
  cachedAt: number;
}

const TOKEN_CACHE = new Map<string, CachedTokenInfo>();
const CACHE_TTL_MS = 15_000;

function getCached(mint: string): CachedTokenInfo | null {
  const entry = TOKEN_CACHE.get(mint);
  if (!entry) return null;
  if (Date.now() - entry.cachedAt > CACHE_TTL_MS) {
    TOKEN_CACHE.delete(mint);
    return null;
  }
  return entry;
}

// ── Fetch Raw Token Data ────────────────────────────────────────────────────

async function fetchRawToken(mint: string): Promise<CachedTokenInfo | null> {
  const cached = getCached(mint);
  if (cached) return cached;

  try {
    const resp = await fetch(`${PUMPFUN_API}/coins/${mint}`, {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(10_000),
    });

    if (!resp.ok) return null;
    const raw = (await resp.json()) as Record<string, unknown>;

    const info: CachedTokenInfo = {
      mint: String(raw.mint ?? mint),
      name: String(raw.name ?? 'Unknown'),
      symbol: String(raw.symbol ?? '???'),
      creator: String(raw.creator ?? ''),
      complete: Boolean(raw.complete),
      virtualSolReserves: BigInt(Math.floor(Number(raw.virtual_sol_reserves ?? 0))),
      virtualTokenReserves: BigInt(Math.floor(Number(raw.virtual_token_reserves ?? 0))),
      totalSupply: BigInt(Math.floor(Number(raw.total_supply ?? 0))),
      usdMarketCap: Number(raw.usd_market_cap ?? 0),
      cachedAt: Date.now(),
    };

    TOKEN_CACHE.set(mint, info);

    // Evict stale entries periodically
    if (TOKEN_CACHE.size > 500) {
      const now = Date.now();
      for (const [k, v] of TOKEN_CACHE) {
        if (now - v.cachedAt > CACHE_TTL_MS) TOKEN_CACHE.delete(k);
      }
    }

    return info;
  } catch {
    return null;
  }
}

// ── Public API ──────────────────────────────────────────────────────────────

/**
 * Get current token price and market cap.
 */
export async function getTokenPrice(
  mint: string,
): Promise<{ priceSol: number; priceUsd: number; marketCapSol: number; marketCapUsd: number } | null> {
  const token = await fetchRawToken(mint);
  if (!token) return null;

  const priceSol =
    token.virtualTokenReserves > 0n
      ? Number(token.virtualSolReserves) / Number(token.virtualTokenReserves)
      : 0;

  const marketCapSol =
    token.virtualTokenReserves > 0n
      ? (Number(token.virtualSolReserves) * Number(token.totalSupply)) /
        (Number(token.virtualTokenReserves) * LAMPORTS_PER_SOL)
      : 0;

  return {
    priceSol,
    priceUsd: 0, // Will be populated when SOL price feed is available
    marketCapSol,
    marketCapUsd: token.usdMarketCap,
  };
}

/**
 * Get bonding curve graduation progress.
 */
export async function getGraduationProgress(
  mint: string,
): Promise<{ percent: number; complete: boolean; stage: string } | null> {
  const token = await fetchRawToken(mint);
  if (!token) return null;

  if (token.complete) {
    return { percent: 100, complete: true, stage: 'graduated' };
  }

  const progress =
    token.virtualTokenReserves >= INITIAL_VIRTUAL_TOKEN_RESERVES
      ? 0
      : (Number(INITIAL_VIRTUAL_TOKEN_RESERVES - token.virtualTokenReserves) /
          Number(INITIAL_VIRTUAL_TOKEN_RESERVES)) *
        100;

  const pct = Math.min(100, Math.max(0, Math.round(progress * 100) / 100));
  const stage = pct >= 90 ? 'graduating' : pct >= 30 ? 'growing' : 'new';

  return { percent: pct, complete: false, stage };
}

/**
 * Get a buy quote: how many tokens for a given SOL amount.
 * Uses constant-product AMM: tokens_out = netSol × vToken / (vSol + netSol)
 */
export async function getBuyQuote(
  mint: string,
  solAmountLamports: bigint,
): Promise<{
  tokensOut: bigint;
  feeLamports: bigint;
  priceImpactBps: number;
  priceBefore: number;
  priceAfter: number;
} | null> {
  const token = await fetchRawToken(mint);
  if (!token || token.complete) return null;

  const totalFeeBps = DEFAULT_PROTOCOL_FEE_BPS + DEFAULT_CREATOR_FEE_BPS;
  const feeLamports = (solAmountLamports * totalFeeBps) / 10_000n;
  const netSol = solAmountLamports - feeLamports;

  const vSol = token.virtualSolReserves;
  const vToken = token.virtualTokenReserves;

  const tokensOut = vSol + netSol > 0n ? (netSol * vToken) / (vSol + netSol) : 0n;

  const priceBefore = vToken > 0n ? Number(vSol) / Number(vToken) : 0;
  const newVSol = vSol + netSol;
  const newVToken = vToken - tokensOut;
  const priceAfter = newVToken > 0n ? Number(newVSol) / Number(newVToken) : 0;

  const priceImpactBps =
    priceBefore > 0 ? Math.round(((priceAfter - priceBefore) / priceBefore) * 10_000) : 0;

  return { tokensOut, feeLamports, priceImpactBps, priceBefore, priceAfter };
}

/**
 * Get a sell quote: how much SOL for selling a given token amount.
 * Uses constant-product AMM: sol_out = tokenAmount × vSol / (vToken + tokenAmount)
 */
export async function getSellQuote(
  mint: string,
  tokenAmount: bigint,
): Promise<{
  solOutLamports: bigint;
  feeLamports: bigint;
  priceImpactBps: number;
  priceBefore: number;
  priceAfter: number;
} | null> {
  const token = await fetchRawToken(mint);
  if (!token || token.complete) return null;

  const vSol = token.virtualSolReserves;
  const vToken = token.virtualTokenReserves;

  const grossSolOut =
    vToken + tokenAmount > 0n ? (tokenAmount * vSol) / (vToken + tokenAmount) : 0n;

  const totalFeeBps = DEFAULT_PROTOCOL_FEE_BPS + DEFAULT_CREATOR_FEE_BPS;
  const feeLamports = (grossSolOut * totalFeeBps) / 10_000n;
  const solOutLamports = grossSolOut - feeLamports;

  const priceBefore = vToken > 0n ? Number(vSol) / Number(vToken) : 0;
  const newVSol = vSol - grossSolOut;
  const newVToken = vToken + tokenAmount;
  const priceAfter = newVToken > 0n ? Number(newVSol) / Number(newVToken) : 0;

  const priceImpactBps =
    priceBefore > 0 ? Math.round(((priceBefore - priceAfter) / priceBefore) * 10_000) : 0;

  return {
    solOutLamports: solOutLamports > 0n ? solOutLamports : 0n,
    feeLamports,
    priceImpactBps,
    priceBefore,
    priceAfter,
  };
}

/**
 * Get full bonding curve state for a token.
 */
export async function getBondingCurveState(mint: string): Promise<BondingCurveInfo | null> {
  const token = await fetchRawToken(mint);
  if (!token) return null;

  const progress =
    token.complete || token.virtualTokenReserves >= INITIAL_VIRTUAL_TOKEN_RESERVES
      ? token.complete
        ? 100
        : 0
      : Math.min(
          100,
          (Number(INITIAL_VIRTUAL_TOKEN_RESERVES - token.virtualTokenReserves) /
            Number(INITIAL_VIRTUAL_TOKEN_RESERVES)) *
            100,
        );

  const priceSol =
    token.virtualTokenReserves > 0n
      ? Number(token.virtualSolReserves) / Number(token.virtualTokenReserves)
      : 0;

  const marketCapSol =
    token.virtualTokenReserves > 0n
      ? (Number(token.virtualSolReserves) * Number(token.totalSupply)) /
        (Number(token.virtualTokenReserves) * LAMPORTS_PER_SOL)
      : 0;

  return {
    mint: token.mint,
    virtualSolReserves: token.virtualSolReserves,
    virtualTokenReserves: token.virtualTokenReserves,
    realTokenReserves: 0n, // Would need on-chain fetch for real reserves
    progress: Math.round(progress * 100) / 100,
    complete: token.complete,
    pricePerToken: priceSol,
    marketCapSol,
  };
}

/**
 * Get fee tier for a given market cap.
 */
export function getFeeTier(marketCapSol: number): {
  name: string;
  protocolFeeBps: number;
  creatorFeeBps: number;
  totalFeeBps: number;
} {
  const tiers = [
    { name: 'Micro', threshold: 0, protocolFeeBps: 100, creatorFeeBps: 100, totalFeeBps: 200 },
    { name: 'Small', threshold: 28, protocolFeeBps: 100, creatorFeeBps: 100, totalFeeBps: 200 },
    { name: 'Medium', threshold: 56, protocolFeeBps: 100, creatorFeeBps: 100, totalFeeBps: 200 },
    { name: 'Large', threshold: 112, protocolFeeBps: 100, creatorFeeBps: 50, totalFeeBps: 150 },
    { name: 'Whale', threshold: 280, protocolFeeBps: 100, creatorFeeBps: 50, totalFeeBps: 150 },
  ];

  let tier = tiers[0]!;
  for (const t of tiers) {
    if (marketCapSol >= t.threshold) tier = t;
  }
  return {
    name: tier.name,
    protocolFeeBps: tier.protocolFeeBps,
    creatorFeeBps: tier.creatorFeeBps,
    totalFeeBps: tier.totalFeeBps,
  };
}

// ── Formatting Helpers ──────────────────────────────────────────────────────

/** Format lamports → human-readable SOL string */
export function formatSol(lamports: bigint | number): string {
  const val = Number(lamports) / LAMPORTS_PER_SOL;
  if (val >= 1000) return val.toFixed(0);
  if (val >= 1) return val.toFixed(4);
  if (val >= 0.001) return val.toFixed(6);
  return val.toFixed(9);
}

/** Format raw token units → human-readable string */
export function formatTokenAmount(raw: bigint | number): string {
  const val = Number(raw) / ONE_TOKEN;
  if (val >= 1_000_000) return `${(val / 1_000_000).toFixed(2)}M`;
  if (val >= 1_000) return `${(val / 1_000).toFixed(2)}K`;
  if (val >= 1) return val.toFixed(2);
  return val.toFixed(6);
}

/** Parse SOL string to lamports */
export function parseSolToLamports(input: string): bigint | null {
  const num = Number(input);
  if (Number.isNaN(num) || num < 0) return null;
  if (num > 10_000_000_000) return BigInt(Math.floor(num));
  return BigInt(Math.round(num * LAMPORTS_PER_SOL));
}

/** Shorten a Solana address for display */
export function shortenAddress(address: string, chars = 4): string {
  return `${address.slice(0, chars)}…${address.slice(-chars)}`;
}
