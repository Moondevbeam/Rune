/**
 * Display formatters: crypto amounts, fiat amounts, and address truncation.
 * Kept pure / dependency-free so they can be reused across screens and tested.
 */
import { FIAT_SYMBOLS, type FiatCurrency } from '@/constants/fiat';

const TRIM_TRAILING_ZEROS = /\.?0+$/;

/** Convert a raw token amount (string of base units) to a human float string. */
export const formatTokenAmount = (
  raw: string | bigint | number | null | undefined,
  decimals: number,
  maxFractionDigits = 6,
): string => {
  if (raw == null || raw === '') return '0';
  let big: bigint;
  try {
    big = typeof raw === 'bigint' ? raw : BigInt(String(raw).split('.')[0]);
  } catch {
    return '0';
  }
  const negative = big < 0n;
  const abs = negative ? -big : big;
  const divisor = 10n ** BigInt(decimals);
  const whole = abs / divisor;
  const fraction = abs % divisor;
  const fractionStr = fraction
    .toString()
    .padStart(decimals, '0')
    .slice(0, maxFractionDigits);
  const trimmed = `${whole}.${fractionStr}`.replace(TRIM_TRAILING_ZEROS, '');
  return `${negative ? '-' : ''}${trimmed}`;
};

/** Parse a human float string back into raw base units (BigInt). */
export const parseTokenAmount = (input: string, decimals: number): bigint => {
  const clean = input.trim().replace(',', '.');
  if (!clean) return 0n;
  const [whole, fraction = ''] = clean.split('.');
  const padded = (fraction + '0'.repeat(decimals)).slice(0, decimals);
  const wholeBig = BigInt(whole || '0');
  const fracBig = BigInt(padded || '0');
  return wholeBig * 10n ** BigInt(decimals) + fracBig;
};

export const formatFiat = (value: number, currency: FiatCurrency): string => {
  const symbol = FIAT_SYMBOLS[currency];
  const abs = Math.abs(value);
  const fractionDigits = abs >= 1000 ? 0 : abs >= 1 ? 2 : 4;
  const formatted = abs.toLocaleString('en-US', {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  });
  return `${value < 0 ? '-' : ''}${symbol}${formatted}`;
};

export const truncateAddress = (address: string | null | undefined, take = 4): string => {
  if (!address) return '';
  if (address.length <= take * 2 + 3) return address;
  return `${address.slice(0, take + 2)}…${address.slice(-take)}`;
};

export const formatPercent = (value: number): string => {
  const sign = value > 0 ? '+' : '';
  return `${sign}${value.toFixed(2)}%`;
};

export const formatRelativeTime = (ts: number): string => {
  const diff = (Date.now() - ts) / 1000;
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 86400 * 7) return `${Math.floor(diff / 86400)}d ago`;
  return new Date(ts).toLocaleDateString();
};

export const formatDueTime = (ts: number): string => {
  const diff = (ts - Date.now()) / 1000;
  if (diff <= 0) return 'Due now';
  if (diff < 3600) return `Due in ${Math.ceil(diff / 60)}m`;
  if (diff < 86400) return `Due in ${Math.ceil(diff / 3600)}h`;
  if (diff < 86400 * 7) return `Due in ${Math.ceil(diff / 86400)}d`;
  return `Due ${new Date(ts).toLocaleDateString()}`;
};
