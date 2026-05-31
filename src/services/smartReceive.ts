import { NETWORK_LABELS, type SupportedNetwork } from '@/config/networks';
import { rankChainsForUsdt, type ChainHealthEntry } from '@/services/chainFees';

export type SmartReceiveRecommendation = {
  chain: SupportedNetwork;
  reason: string;
  alternatives: SupportedNetwork[];
};

export const recommendReceiveChain = (
  enabled: SupportedNetwork[],
  health?: ChainHealthEntry[],
): SmartReceiveRecommendation => {
  const ranked = rankChainsForUsdt(enabled);
  const online = health
    ? ranked.filter((c) => health.find((h) => h.network === c)?.health !== 'offline')
    : ranked;
  const pool = online.length ? online : ranked;
  const chain = pool[0] ?? 'ethereum';
  const fastest = health?.find((h) => h.network === chain);

  let reason = `Lowest typical USDT fees on ${NETWORK_LABELS[chain]}.`;
  if (fastest?.health === 'fast' && fastest.latencyMs != null) {
    reason = `${NETWORK_LABELS[chain]} is online (${fastest.latencyMs}ms) with low USDT transfer fees.`;
  } else if (fastest?.health === 'slow') {
    reason = `${NETWORK_LABELS[chain]} has higher latency but still offers cheaper USDT fees than Ethereum.`;
  }

  return {
    chain,
    reason,
    alternatives: pool.slice(1, 3),
  };
};
