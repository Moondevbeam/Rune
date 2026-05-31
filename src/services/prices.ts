/**
 * Price service
 *
 * Thin client around the public CoinGecko `simple/price` endpoint. The WDK
 * Price Rates API (https://wdk-api.tether.io) can be swapped in by setting
 * EXPO_PUBLIC_WDK_PRICES_BASE and providing the API key — the contract is the
 * same: { [coinId]: { [fiat]: number } }.
 */
import { useQuery } from '@tanstack/react-query';

import type { SupportedNetwork } from '@/config/wdk';
import type { FiatCurrency } from '@/store/preferences';

const PRICES_BASE = process.env.EXPO_PUBLIC_WDK_PRICES_BASE ?? 'https://api.coingecko.com/api/v3';

const COIN_IDS: Record<string, string> = {
  ETH: 'ethereum',
  MATIC: 'matic-network',
  BNB: 'binancecoin',
  TRX: 'tron',
  TON: 'the-open-network',
  USDT: 'tether',
};

export type PriceMap = Record<string, number>;

const fetchPrices = async (fiat: FiatCurrency): Promise<PriceMap> => {
  const ids = Object.values(COIN_IDS).join(',');
  const url = `${PRICES_BASE}/simple/price?ids=${ids}&vs_currencies=${fiat.toLowerCase()}`;
  const apiKey = process.env.EXPO_PUBLIC_WDK_INDEXER_API_KEY;
  const res = await fetch(url, {
    headers: apiKey ? { 'x-api-key': apiKey } : undefined,
  });
  if (!res.ok) {
    throw new Error(`Price fetch failed: ${res.status}`);
  }
  const data = (await res.json()) as Record<string, Record<string, number>>;
  const out: PriceMap = {};
  for (const [symbol, id] of Object.entries(COIN_IDS)) {
    out[symbol] = data[id]?.[fiat.toLowerCase()] ?? 0;
  }
  return out;
};

export const usePrices = (fiat: FiatCurrency) =>
  useQuery({
    queryKey: ['prices', fiat],
    queryFn: () => fetchPrices(fiat),
    staleTime: 60_000,
    refetchInterval: 60_000,
  });

/** Returns the fiat value of `amount` units of `symbol`, or 0 if unknown. */
export const fiatValue = (
  prices: PriceMap | undefined,
  symbol: string,
  amount: number,
): number => {
  if (!prices) return 0;
  const price = prices[symbol] ?? 0;
  return price * amount;
};

/**
 * Compute 24h % change. Not provided by the simple endpoint above; placeholder
 * returning 0 so the UI renders neutrally until WDK Price Rates API is wired.
 */
export const getChange24h = (_symbol: string, _network?: SupportedNetwork): number => 0;
