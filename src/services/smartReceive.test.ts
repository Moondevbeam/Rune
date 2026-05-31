import { describe, expect, it } from 'vitest';

import { recommendReceiveChain } from '@/services/smartReceive';

describe('recommendReceiveChain', () => {
  it('prefers tron over ethereum when both enabled', () => {
    const rec = recommendReceiveChain(['ethereum', 'tron', 'polygon']);
    expect(rec.chain).toBe('tron');
    expect(rec.alternatives).toContain('polygon');
  });

  it('falls back when preferred chains are offline', () => {
    const rec = recommendReceiveChain(
      ['ethereum', 'tron'],
      [
        { network: 'tron', health: 'offline', latencyMs: null, usdtFeeRank: 1 },
        { network: 'ethereum', health: 'fast', latencyMs: 100, usdtFeeRank: 5 },
      ],
    );
    expect(rec.chain).toBe('ethereum');
  });
});
