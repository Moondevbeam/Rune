import { USDT_FEE_RANK, type SupportedNetwork } from '@/config/networks';

export { USDT_FEE_RANK };

export type RpcHealth = 'fast' | 'slow' | 'offline';

export type ChainHealthEntry = {
  network: SupportedNetwork;
  health: RpcHealth;
  latencyMs: number | null;
  usdtFeeRank: number;
};

export const rankChainsForUsdt = (enabled: SupportedNetwork[]): SupportedNetwork[] =>
  [...enabled].sort((a, b) => USDT_FEE_RANK[a] - USDT_FEE_RANK[b]);

export const suggestCheaperChain = (
  current: SupportedNetwork,
  enabled: SupportedNetwork[],
): SupportedNetwork | null => {
  const sorted = rankChainsForUsdt(enabled);
  const best = sorted[0];
  if (!best || best === current) return null;
  if (USDT_FEE_RANK[current] <= USDT_FEE_RANK[best]) return null;
  return best;
};

export const healthLabel = (health: RpcHealth): string => {
  if (health === 'fast') return 'Healthy';
  if (health === 'slow') return 'Congested';
  return 'Unreachable';
};
