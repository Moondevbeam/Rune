/**
 * Indexer service
 *
 * Fetches transaction history for a given address on a supported chain.
 * Uses the WDK Indexer API (https://wdk-api.tether.io) when the env vars
 * EXPO_PUBLIC_WDK_INDEXER_BASE_URL + EXPO_PUBLIC_WDK_INDEXER_API_KEY are set;
 * otherwise falls back to the public Etherscan-family / Tronscan / TON center
 * endpoints so the app remains demo-able without API keys.
 */
import { useQuery } from '@tanstack/react-query';

import type { SupportedNetwork } from '@/config/wdk';

const WDK_INDEXER_BASE = process.env.EXPO_PUBLIC_WDK_INDEXER_BASE_URL;
const WDK_INDEXER_API_KEY = process.env.EXPO_PUBLIC_WDK_INDEXER_API_KEY;

export type TxDirection = 'in' | 'out' | 'swap' | 'self';
export type TxStatus = 'pending' | 'confirmed' | 'failed';

export interface IndexedTx {
  hash: string;
  network: SupportedNetwork;
  direction: TxDirection;
  status: TxStatus;
  /** Decimal-formatted amount, signed (negative for outgoing). */
  amount: string;
  symbol: string;
  from: string;
  to: string;
  /** Unix ms */
  timestamp: number;
  fee?: string;
  feeSymbol?: string;
}

const safeJson = async (res: Response): Promise<unknown> => {
  try {
    return await res.json();
  } catch {
    return null;
  }
};

const fromWdkIndexer = async (
  network: SupportedNetwork,
  address: string,
): Promise<IndexedTx[]> => {
  if (!WDK_INDEXER_BASE) throw new Error('no-wdk-indexer');
  const url = `${WDK_INDEXER_BASE}/v1/transactions?network=${network}&address=${address}`;
  const res = await fetch(url, {
    headers: WDK_INDEXER_API_KEY ? { 'x-api-key': WDK_INDEXER_API_KEY } : {},
  });
  if (!res.ok) throw new Error(`WDK indexer ${res.status}`);
  const data = (await safeJson(res)) as { transactions?: IndexedTx[] } | null;
  return data?.transactions ?? [];
};

const fromEtherscan = async (
  network: SupportedNetwork,
  address: string,
): Promise<IndexedTx[]> => {
  const apiBase: Record<string, string> = {
    ethereum: 'https://api.etherscan.io/api',
    polygon: 'https://api.polygonscan.com/api',
    bsc: 'https://api.bscscan.com/api',
  };
  const url = `${apiBase[network]}?module=account&action=txlist&address=${address}&sort=desc&page=1&offset=25`;
  const res = await fetch(url);
  const data = (await safeJson(res)) as {
    status: string;
    result?: Array<{
      hash: string;
      from: string;
      to: string;
      value: string;
      timeStamp: string;
      isError: string;
      gasUsed?: string;
      gasPrice?: string;
    }>;
  } | null;
  if (!data || data.status !== '1' || !data.result) return [];
  const lower = address.toLowerCase();
  return data.result.map<IndexedTx>((tx) => {
    const isOutgoing = tx.from.toLowerCase() === lower;
    const amount = (BigInt(tx.value || '0') / 10n ** 14n).toString();
    return {
      hash: tx.hash,
      network,
      direction: isOutgoing ? 'out' : 'in',
      status: tx.isError === '0' ? 'confirmed' : 'failed',
      amount: `${isOutgoing ? '-' : ''}${(Number(amount) / 10_000).toString()}`,
      symbol: network === 'ethereum' ? 'ETH' : network === 'polygon' ? 'MATIC' : 'BNB',
      from: tx.from,
      to: tx.to,
      timestamp: Number(tx.timeStamp) * 1000,
    };
  });
};

const fromTronscan = async (address: string): Promise<IndexedTx[]> => {
  const url = `https://apilist.tronscan.org/api/transaction?address=${address}&limit=25&sort=-timestamp`;
  const res = await fetch(url);
  const data = (await safeJson(res)) as {
    data?: Array<{
      hash: string;
      ownerAddress: string;
      toAddress: string;
      amount: number;
      timestamp: number;
      contractRet?: string;
    }>;
  } | null;
  if (!data?.data) return [];
  return data.data.map<IndexedTx>((tx) => {
    const isOutgoing = tx.ownerAddress === address;
    return {
      hash: tx.hash,
      network: 'tron',
      direction: isOutgoing ? 'out' : 'in',
      status: tx.contractRet === 'SUCCESS' ? 'confirmed' : 'failed',
      amount: `${isOutgoing ? '-' : ''}${tx.amount / 1_000_000}`,
      symbol: 'TRX',
      from: tx.ownerAddress,
      to: tx.toAddress,
      timestamp: tx.timestamp,
    };
  });
};

const fromTonscan = async (address: string): Promise<IndexedTx[]> => {
  const url = `https://toncenter.com/api/v2/getTransactions?address=${address}&limit=25`;
  const res = await fetch(url);
  const data = (await safeJson(res)) as {
    ok?: boolean;
    result?: Array<{
      transaction_id: { hash: string; lt: string };
      utime: number;
      in_msg?: { value: string; source: string; destination: string };
      out_msgs?: Array<{ value: string; source: string; destination: string }>;
    }>;
  } | null;
  if (!data?.ok || !data.result) return [];
  return data.result.map<IndexedTx>((tx) => {
    const out = tx.out_msgs?.[0];
    const isOutgoing = Boolean(out && out.source === address);
    const value = BigInt((isOutgoing ? out!.value : tx.in_msg?.value) || '0');
    return {
      hash: tx.transaction_id.hash,
      network: 'ton',
      direction: isOutgoing ? 'out' : 'in',
      status: 'confirmed',
      amount: `${isOutgoing ? '-' : ''}${Number(value) / 1e9}`,
      symbol: 'TON',
      from: isOutgoing ? address : tx.in_msg?.source || '',
      to: isOutgoing ? out!.destination : address,
      timestamp: tx.utime * 1000,
    };
  });
};

export const fetchTransactions = async (
  network: SupportedNetwork,
  address: string,
): Promise<IndexedTx[]> => {
  if (!address) return [];
  try {
    if (WDK_INDEXER_BASE) return await fromWdkIndexer(network, address);
  } catch {
    /* fall through to public providers */
  }
  if (network === 'tron') return fromTronscan(address);
  if (network === 'ton') return fromTonscan(address);
  return fromEtherscan(network, address);
};

export const useTransactions = (network: SupportedNetwork, address: string | null) =>
  useQuery({
    queryKey: ['transactions', network, address],
    queryFn: () => fetchTransactions(network, address ?? ''),
    enabled: Boolean(address),
    staleTime: 30_000,
    refetchInterval: 60_000,
  });
