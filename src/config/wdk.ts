/**
 * WDK Runtime Configuration
 *
 * Networks, providers and asset definitions that the WDK engine uses at
 * runtime. The shape of this object is what `<WdkAppProvider wdkConfigs={...} />`
 * expects. Keep it in sync with the bundled chain modules declared in
 * `wdk.config.js`.
 *
 * NOTE: RPC URLs below are public endpoints suitable for development. For
 * production usage replace them with private endpoints (Infura, Alchemy,
 * QuickNode, Tatum, etc.) configured via Expo public env vars.
 */
import { BaseAsset, type WdkConfigs } from '@tetherto/wdk-react-native-core';

export type { SupportedNetwork } from '@/config/networks';
export {
  ADDRESS_EXPLORERS,
  NETWORK_COLORS,
  NETWORK_EXPLORERS,
  NETWORK_LABELS,
  NETWORK_SYMBOLS,
  SUPPORTED_NETWORKS,
  USDT_FEE_RANK,
} from '@/config/networks';

import type { SupportedNetwork } from '@/config/networks';

const env = (key: string, fallback: string): string =>
  (process.env[key] && String(process.env[key])) || fallback;

const optionalEnv = (key: string): string | undefined => {
  const v = process.env[key];
  return v ? String(v) : undefined;
};

const tonRpcClients = () => {
  const primaryUrl = env('EXPO_PUBLIC_TON_RPC', 'https://ton.drpc.org');
  const primaryKey = optionalEnv('EXPO_PUBLIC_TON_API_KEY');
  const fallbackKey = optionalEnv('EXPO_PUBLIC_TONCENTER_API_KEY');

  const clients: { url: string; secretKey?: string }[] = [
    { url: primaryUrl, ...(primaryKey ? { secretKey: primaryKey } : {}) },
  ];

  const toncenterUrl = 'https://toncenter.com/api/v2/jsonRPC';
  if (primaryUrl !== toncenterUrl) {
    clients.push({
      url: toncenterUrl,
      ...(fallbackKey ? { secretKey: fallbackKey } : {}),
    });
  }

  return clients;
};

export const wdkConfigs: WdkConfigs = {
  networks: {
    ethereum: {
      blockchain: 'ethereum',
      config: {
        chainId: 1,
        provider: env('EXPO_PUBLIC_ETH_RPC', 'https://eth.drpc.org'),
      },
    },
    polygon: {
      blockchain: 'polygon',
      config: {
        chainId: 137,
        provider: env('EXPO_PUBLIC_POLYGON_RPC', 'https://polygon.drpc.org'),
      },
    },
    bsc: {
      blockchain: 'bsc',
      config: {
        chainId: 56,
        provider: env('EXPO_PUBLIC_BSC_RPC', 'https://bsc.drpc.org'),
      },
    },
    tron: {
      blockchain: 'tron',
      config: {
        provider: env('EXPO_PUBLIC_TRON_RPC', 'https://api.trongrid.io'),
      },
    },
    ton: {
      blockchain: 'ton',
      config: {
        tonClient: tonRpcClients(),
        retries: 1,
      },
    },
  },
};

const usdt = (network: SupportedNetwork, address: string, decimals = 6) =>
  new BaseAsset({
    id: `usdt-${network}`,
    network,
    symbol: 'USDT',
    name: 'Tether USD',
    decimals,
    isNative: false,
    address,
  });

const nativeAsset = (network: SupportedNetwork, symbol: string, name: string, decimals: number) =>
  new BaseAsset({
    id: `${symbol.toLowerCase()}-${network}`,
    network,
    symbol,
    name,
    decimals,
    isNative: true,
  });

/** Curated asset list shown across the app (native + USDT per chain). */
export const ASSETS = {
  eth: nativeAsset('ethereum', 'ETH', 'Ethereum', 18),
  matic: nativeAsset('polygon', 'MATIC', 'Polygon', 18),
  bnb: nativeAsset('bsc', 'BNB', 'BNB', 18),
  trx: nativeAsset('tron', 'TRX', 'Tron', 6),
  ton: nativeAsset('ton', 'TON', 'Toncoin', 9),
  usdtEth: usdt('ethereum', '0xdAC17F958D2ee523a2206206994597C13D831ec7', 6),
  usdtPolygon: usdt('polygon', '0xc2132D05D31c914a87C6611C10748AEb04B58e8F', 6),
  usdtBsc: usdt('bsc', '0x55d398326f99059fF775485246999027B3197955', 18),
  usdtTron: usdt('tron', 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t', 6),
  usdtTon: usdt('ton', 'EQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixRv7Nw2Id_sDs', 6),
} as const;

export type AssetKey = keyof typeof ASSETS;

export const ASSETS_BY_NETWORK: Record<SupportedNetwork, AssetKey[]> = {
  ethereum: ['eth', 'usdtEth'],
  polygon: ['matic', 'usdtPolygon'],
  bsc: ['bnb', 'usdtBsc'],
  tron: ['trx', 'usdtTron'],
  ton: ['ton', 'usdtTon'],
};

export const ALL_ASSET_KEYS = Object.keys(ASSETS) as AssetKey[];
