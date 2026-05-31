import { describe, expect, it } from 'vitest';

import {
  rankChainsForUsdt,
  suggestCheaperChain,
  USDT_FEE_RANK,
} from '@/services/chainFees';

describe('rankChainsForUsdt', () => {
  it('orders by USDT_FEE_RANK ascending', () => {
    const ranked = rankChainsForUsdt(['ethereum', 'tron', 'polygon']);
    expect(ranked[0]).toBe('tron');
    expect(ranked[ranked.length - 1]).toBe('ethereum');
  });
});

describe('suggestCheaperChain', () => {
  it('suggests tron when sending from ethereum', () => {
    expect(suggestCheaperChain('ethereum', ['ethereum', 'tron'])).toBe('tron');
  });

  it('returns null when already on cheapest chain', () => {
    expect(suggestCheaperChain('tron', ['ethereum', 'tron'])).toBeNull();
  });
});

describe('USDT_FEE_RANK', () => {
  it('ranks tron cheaper than ethereum', () => {
    expect(USDT_FEE_RANK.tron).toBeLessThan(USDT_FEE_RANK.ethereum);
  });
});
