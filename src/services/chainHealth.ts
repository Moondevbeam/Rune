import type { SupportedNetwork } from '@/config/networks';
import {
  healthLabel,
  rankChainsForUsdt,
  suggestCheaperChain,
  USDT_FEE_RANK,
  type ChainHealthEntry,
  type RpcHealth,
} from '@/services/chainFees';

export {
  healthLabel,
  rankChainsForUsdt,
  suggestCheaperChain,
  USDT_FEE_RANK,
  type ChainHealthEntry,
  type RpcHealth,
};

const RPC_PROBE_TIMEOUT_MS = 4_000;
const RPC_PROBE_CACHE_MS = 90_000;

let probeCache: { key: string; at: number; data: ChainHealthEntry[] } | null = null;

const rpcUrlFor = async (network: SupportedNetwork): Promise<string | null> => {
  const { wdkConfigs } = await import('@/config/wdk');
  const cfg = wdkConfigs.networks[network]?.config;
  if (!cfg) return null;
  if ('provider' in cfg && typeof cfg.provider === 'string') return cfg.provider;
  if ('tonClient' in cfg) {
    const tonClient = cfg.tonClient as { url?: string } | Array<{ url?: string }>;
    if (Array.isArray(tonClient)) {
      return tonClient[0]?.url ?? null;
    }
    if (typeof tonClient?.url === 'string') return tonClient.url;
  }
  return null;
};

const probeEvm = async (url: string): Promise<{ health: RpcHealth; latencyMs: number }> => {
  const start = Date.now();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), RPC_PROBE_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jsonrpc: '2.0', method: 'eth_blockNumber', params: [], id: 1 }),
      signal: controller.signal,
    });
    const ms = Date.now() - start;
    if (!res.ok) return { health: 'offline', latencyMs: ms };
    return { health: ms < 800 ? 'fast' : 'slow', latencyMs: ms };
  } catch {
    return { health: 'offline', latencyMs: Date.now() - start };
  } finally {
    clearTimeout(timer);
  }
};

const probeTron = async (url: string): Promise<{ health: RpcHealth; latencyMs: number }> => {
  const start = Date.now();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), RPC_PROBE_TIMEOUT_MS);
  try {
    const res = await fetch(`${url}/wallet/getnowblock`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{}',
      signal: controller.signal,
    });
    const ms = Date.now() - start;
    if (!res.ok) return { health: 'offline', latencyMs: ms };
    return { health: ms < 900 ? 'fast' : 'slow', latencyMs: ms };
  } catch {
    return { health: 'offline', latencyMs: Date.now() - start };
  } finally {
    clearTimeout(timer);
  }
};

const probeTon = async (url: string): Promise<{ health: RpcHealth; latencyMs: number }> => {
  const start = Date.now();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), RPC_PROBE_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: 1, jsonrpc: '2.0', method: 'getMasterchainInfo', params: {} }),
      signal: controller.signal,
    });
    const ms = Date.now() - start;
    if (!res.ok) return { health: 'offline', latencyMs: ms };
    return { health: ms < 900 ? 'fast' : 'slow', latencyMs: ms };
  } catch {
    return { health: 'offline', latencyMs: Date.now() - start };
  } finally {
    clearTimeout(timer);
  }
};

export const probeChainHealth = async (
  network: SupportedNetwork,
): Promise<{ health: RpcHealth; latencyMs: number | null }> => {
  const url = await rpcUrlFor(network);
  if (!url) return { health: 'offline', latencyMs: null };

  if (network === 'tron') {
    const r = await probeTron(url);
    return { health: r.health, latencyMs: r.latencyMs };
  }
  if (network === 'ton') {
    const r = await probeTon(url);
    return { health: r.health, latencyMs: r.latencyMs };
  }
  const r = await probeEvm(url);
  return { health: r.health, latencyMs: r.latencyMs };
};

export const probeAllChains = async (
  networks: SupportedNetwork[],
): Promise<ChainHealthEntry[]> => {
  const key = networks.slice().sort().join(',');
  const now = Date.now();
  if (probeCache && probeCache.key === key && now - probeCache.at < RPC_PROBE_CACHE_MS) {
    return probeCache.data;
  }

  const results = await Promise.all(
    networks.map(async (network) => {
      const probe = await probeChainHealth(network);
      return {
        network,
        health: probe.health,
        latencyMs: probe.latencyMs,
        usdtFeeRank: USDT_FEE_RANK[network],
      } satisfies ChainHealthEntry;
    }),
  );
  const data = results.sort((a, b) => a.usdtFeeRank - b.usdtFeeRank);
  probeCache = { key, at: now, data };
  return data;
};
