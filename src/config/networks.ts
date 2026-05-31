/**
 * Pure network metadata (no WDK / React Native imports).
 * Safe to use in unit tests and shared utilities.
 */

export type SupportedNetwork = 'ethereum' | 'polygon' | 'bsc' | 'tron' | 'ton';

export const SUPPORTED_NETWORKS: SupportedNetwork[] = [
  'ethereum',
  'polygon',
  'bsc',
  'tron',
  'ton',
];

export const NETWORK_LABELS: Record<SupportedNetwork, string> = {
  ethereum: 'Ethereum',
  polygon: 'Polygon',
  bsc: 'BNB Chain',
  tron: 'TRON',
  ton: 'TON',
};

export const NETWORK_COLORS: Record<SupportedNetwork, string> = {
  ethereum: '#627EEA',
  polygon: '#8247E5',
  bsc: '#F0B90B',
  tron: '#EF0027',
  ton: '#0098EA',
};

export const NETWORK_SYMBOLS: Record<SupportedNetwork, string> = {
  ethereum: 'ETH',
  polygon: 'MATIC',
  bsc: 'BNB',
  tron: 'TRX',
  ton: 'TON',
};

export const NETWORK_EXPLORERS: Record<SupportedNetwork, (hash: string) => string> = {
  ethereum: (h) => `https://etherscan.io/tx/${h}`,
  polygon: (h) => `https://polygonscan.com/tx/${h}`,
  bsc: (h) => `https://bscscan.com/tx/${h}`,
  tron: (h) => `https://tronscan.org/#/transaction/${h}`,
  ton: (h) => `https://tonscan.org/tx/${h}`,
};

export const ADDRESS_EXPLORERS: Record<SupportedNetwork, (addr: string) => string> = {
  ethereum: (a) => `https://etherscan.io/address/${a}`,
  polygon: (a) => `https://polygonscan.com/address/${a}`,
  bsc: (a) => `https://bscscan.com/address/${a}`,
  tron: (a) => `https://tronscan.org/#/address/${a}`,
  ton: (a) => `https://tonscan.org/address/${a}`,
};

/** Lower rank = cheaper typical USDT transfer (heuristic). */
export const USDT_FEE_RANK: Record<SupportedNetwork, number> = {
  tron: 1,
  polygon: 2,
  bsc: 3,
  ton: 4,
  ethereum: 5,
};
