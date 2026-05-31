/**
 * WDK service helpers
 *
 * Higher-level hooks that compose the raw WDK hooks (useAccount, useBalance,
 * useWalletManager) into shapes the screens consume.
 */
import {
  useAccount,
  useBalancesForWallet,
  useRefreshBalance,
} from '@tetherto/wdk-react-native-core';
import { useMemo } from 'react';

import {
  ASSETS,
  ALL_ASSET_KEYS,
  type AssetKey,
  type SupportedNetwork,
} from '@/config/wdk';
import { BALANCE_QUERY_OPTIONS, BALANCE_REFRESH_COOLDOWN_MS } from '@/config/balanceQuery';
import { formatTokenAmount } from '@/services/formatters';
import { fiatValue, usePrices } from '@/services/prices';
import { usePreferences } from '@/store/preferences';

const ACCOUNT_INDEX = 0;

let lastWalletRefreshAt = 0;

export const throttledBalanceRefetch = async (refetch: () => Promise<unknown>) => {
  const now = Date.now();
  if (now - lastWalletRefreshAt < BALANCE_REFRESH_COOLDOWN_MS) {
    return;
  }
  lastWalletRefreshAt = now;
  await refetch();
};

export type EnrichedAsset = {
  key: AssetKey;
  symbol: string;
  name: string;
  network: SupportedNetwork;
  decimals: number;
  isNative: boolean;
  cryptoAmount: string;
  cryptoAmountNumber: number;
  fiatAmountNumber: number;
};

const ASSET_KEYS = ALL_ASSET_KEYS;

/** Build the asset list with current balances + fiat values for the active wallet. */
export const useWalletPortfolio = () => {
  const enabledChains = usePreferences((s) => s.enabledChains);
  const fiat = usePreferences((s) => s.fiat);

  const visibleAssets = useMemo(
    () =>
      ASSET_KEYS.filter((k) =>
        enabledChains.includes(ASSETS[k].getNetwork() as SupportedNetwork),
      ),
    [enabledChains],
  );

  const assetEntities = useMemo(() => visibleAssets.map((k) => ASSETS[k]), [visibleAssets]);

  const balances = useBalancesForWallet(ACCOUNT_INDEX, assetEntities, BALANCE_QUERY_OPTIONS);
  const prices = usePrices(fiat);

  const enriched = useMemo<EnrichedAsset[]>(() => {
    const balanceMap = new Map<string, string | null>();
    for (const item of balances.data ?? []) {
      balanceMap.set(item.assetId, item.balance);
    }
    return visibleAssets.map((key) => {
      const asset = ASSETS[key];
      const cryptoRaw = balanceMap.get(asset.getId()) ?? '0';
      const decimals = asset.getDecimals();
      const cryptoAmount = formatTokenAmount(cryptoRaw, decimals);
      const cryptoAmountNumber = Number(cryptoAmount);
      const symbol = asset.getSymbol();
      const fiatAmountNumber = fiatValue(prices.data, symbol, cryptoAmountNumber);
      return {
        key,
        symbol,
        name: asset.getName(),
        network: asset.getNetwork() as SupportedNetwork,
        decimals,
        isNative: asset.isNative(),
        cryptoAmount,
        cryptoAmountNumber,
        fiatAmountNumber,
      };
    });
  }, [visibleAssets, balances.data, prices.data]);

  const totalFiat = useMemo(
    () => enriched.reduce((sum, a) => sum + a.fiatAmountNumber, 0),
    [enriched],
  );

  return {
    assets: enriched,
    totalFiat,
    isLoading: balances.isLoading || prices.isLoading,
    refetch: balances.refetch,
  };
};

/** Returns the EVM/TRON/TON address for a given network, derived for account 0. */
export const useNetworkAddress = (network: SupportedNetwork) => {
  return useAccount({ network, accountIndex: ACCOUNT_INDEX });
};

/**
 * Returns addresses for all SUPPORTED networks (calls hooks unconditionally so
 * the order is stable across renders). The caller can filter by enabled chains.
 */
export const useAllAddresses = () => {
  const ethereum = useAccount({ network: 'ethereum', accountIndex: ACCOUNT_INDEX });
  const polygon = useAccount({ network: 'polygon', accountIndex: ACCOUNT_INDEX });
  const bsc = useAccount({ network: 'bsc', accountIndex: ACCOUNT_INDEX });
  const tron = useAccount({ network: 'tron', accountIndex: ACCOUNT_INDEX });
  const ton = useAccount({ network: 'ton', accountIndex: ACCOUNT_INDEX });

  return useMemo<Record<SupportedNetwork, { address: string | null; isLoading: boolean }>>(
    () => ({
      ethereum: { address: ethereum.address, isLoading: ethereum.isLoading },
      polygon: { address: polygon.address, isLoading: polygon.isLoading },
      bsc: { address: bsc.address, isLoading: bsc.isLoading },
      tron: { address: tron.address, isLoading: tron.isLoading },
      ton: { address: ton.address, isLoading: ton.isLoading },
    }),
    [
      ethereum.address,
      ethereum.isLoading,
      polygon.address,
      polygon.isLoading,
      bsc.address,
      bsc.isLoading,
      tron.address,
      tron.isLoading,
      ton.address,
      ton.isLoading,
    ],
  );
};

export const useRefreshWallet = () => {
  const refresh = useRefreshBalance();
  return () => {
    const now = Date.now();
    if (now - lastWalletRefreshAt < BALANCE_REFRESH_COOLDOWN_MS) {
      return;
    }
    lastWalletRefreshAt = now;
    refresh.mutate({ accountIndex: ACCOUNT_INDEX, type: 'wallet' });
  };
};
